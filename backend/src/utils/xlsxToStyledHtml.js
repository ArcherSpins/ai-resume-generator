/**
 * Convert a filled XLSX Buffer to a styled HTML document for Puppeteer PDF rendering.
 *
 * Uses ExcelJS to read every cell's value AND all styling properties
 * (font, fill/background, borders, alignment, column widths, row heights,
 * merged cells) and emits a <table> with per-cell inline CSS.
 *
 * Result looks as close to the original Excel sheet as possible.
 */
import ExcelJS from 'exceljs';

// ── Helpers ──────────────────────────────────────────────────────────────────

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function colLetterToNum(col) {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

/**
 * Build a lookup of merged-cell info from an ExcelJS worksheet.
 * masterOf : Map<'r,c', {rowspan, colspan}>  — for the top-left cell of each merge
 * slaves   : Set<'r,c'>                       — all non-master merged cells (skip in HTML)
 */
function parseMerges(ws) {
  const masterOf = new Map();
  const slaves = new Set();

  // ws.model.merges is an array of range strings like 'A1:C3'
  const merges = ws.model?.merges ?? [];
  for (const rangeStr of merges) {
    const [tlStr, brStr] = rangeStr.split(':');
    if (!tlStr || !brStr) continue;

    const tlM = tlStr.match(/^([A-Z]+)(\d+)$/);
    const brM = brStr.match(/^([A-Z]+)(\d+)$/);
    if (!tlM || !brM) continue;

    const tlR = parseInt(tlM[2]);
    const tlC = colLetterToNum(tlM[1]);
    const brR = parseInt(brM[2]);
    const brC = colLetterToNum(brM[1]);

    masterOf.set(`${tlR},${tlC}`, {
      rowspan: brR - tlR + 1,
      colspan: brC - tlC + 1,
    });

    for (let r = tlR; r <= brR; r++) {
      for (let c = tlC; c <= brC; c++) {
        if (r !== tlR || c !== tlC) slaves.add(`${r},${c}`);
      }
    }
  }
  return { masterOf, slaves };
}

/** Convert Excel ARGB string (e.g. 'FF003366') to a CSS colour. */
function argbToCss(argb) {
  if (!argb || typeof argb !== 'string' || argb.length < 6) return null;
  const s = argb.length === 8 ? argb : `FF${argb}`;
  const alpha = parseInt(s.slice(0, 2), 16) / 255;
  if (alpha < 0.05) return 'transparent';
  const r = parseInt(s.slice(2, 4), 16);
  const g = parseInt(s.slice(4, 6), 16);
  const b = parseInt(s.slice(6, 8), 16);
  if (alpha >= 0.99) return `rgb(${r},${g},${b})`;
  return `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
}

/** Convert an ExcelJS border descriptor to a CSS border string. Always visible grid like XLSX. */
function borderToCss(b) {
  if (!b?.style) return '1px solid #333';
  const widths = { hair: '0.5px', thin: '1px', medium: '2px', thick: '3px', double: '3px' };
  const types = { double: 'double', dashed: 'dashed', dotted: 'dotted', dashDot: 'dashed' };
  const w = widths[b.style] || '1px';
  const t = types[b.style] || 'solid';
  const color = (b.color?.argb ? argbToCss(b.color.argb) : null) || '#333';
  return `${w} ${t} ${color}`;
}

/** Build the inline CSS string for a single cell. */
function cellToCss(cell) {
  const parts = [];

  // ── Font ────────────────────────────────────────────────────────────────────
  const f = cell.font;
  if (f) {
    if (f.bold) parts.push('font-weight:bold');
    if (f.italic) parts.push('font-style:italic');
    if (f.underline) parts.push('text-decoration:underline');
    if (f.size) parts.push(`font-size:${f.size}pt`);
    if (f.name) parts.push(`font-family:"${f.name}",sans-serif`);
    const fc = f.color?.argb ? argbToCss(f.color.argb) : null;
    if (fc && fc !== 'transparent') parts.push(`color:${fc}`);
  }

  // ── Fill ────────────────────────────────────────────────────────────────────
  const fill = cell.fill;
  if (fill?.type === 'pattern' && fill.pattern !== 'none') {
    const fg = fill.fgColor?.argb ? argbToCss(fill.fgColor.argb) : null;
    if (fg && fg !== 'transparent') parts.push(`background-color:${fg}`);
  }

  // ── Borders ─────────────────────────────────────────────────────────────────
  const brd = cell.border;
  parts.push(`border-top:${borderToCss(brd?.top)}`);
  parts.push(`border-bottom:${borderToCss(brd?.bottom)}`);
  parts.push(`border-left:${borderToCss(brd?.left)}`);
  parts.push(`border-right:${borderToCss(brd?.right)}`);

  // ── Alignment ───────────────────────────────────────────────────────────────
  const al = cell.alignment;
  if (al) {
    if (al.horizontal) {
      const hMap = { centerContinuous: 'center', distributed: 'center', justify: 'justify' };
      parts.push(`text-align:${hMap[al.horizontal] || al.horizontal}`);
    }
    if (al.vertical) {
      const vMap = { center: 'middle', top: 'top', bottom: 'bottom', distributed: 'middle' };
      parts.push(`vertical-align:${vMap[al.vertical] || al.vertical}`);
    }
    if (al.wrapText) parts.push('white-space:pre-wrap;overflow-wrap:break-word');
  }

  parts.push('padding:2px 4px;overflow:hidden');
  return parts.join(';');
}

/** Extract a cell's display text value (handles rich-text, formulas, dates). */
function getCellText(cell) {
  const val = cell.value;
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (val instanceof Date) return val.toLocaleDateString('ja-JP');
  if (typeof val === 'object') {
    if (val.richText) return val.richText.map((rt) => rt.text).join('');
    if (val.text) return String(val.text);
    if (val.result !== undefined) return String(val.result); // formula with cached result
    if (val.formula) return ''; // formula, no cached result yet
  }
  return String(val);
}

// ── Main export ──────────────────────────────────────────────────────────────

/**
 * @param {Buffer}      buffer       - filled XLSX buffer
 * @param {string|null} avatarBase64 - photo data URL (replaces __PHOTO__ marker)
 * @returns {Promise<string>}        - complete HTML document
 */
export async function xlsxToStyledHtml(buffer, avatarBase64 = null) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const sheetHtmls = [];

  for (const ws of wb.worksheets) {
    const { masterOf, slaves } = parseMerges(ws);
    const maxRow = ws.rowCount;
    const maxCol = ws.columnCount;
    if (maxRow === 0 || maxCol === 0) continue;

    // ── Table with column widths and explicit grid (XLSX-style borders) ────────
    let tbl = '<table style="border-collapse:collapse;table-layout:fixed;border:1px solid #333;">';
    tbl += '<colgroup>';
    for (let c = 1; c <= maxCol; c++) {
      const colObj = ws.getColumn(c);
      // Excel column width is in "character units"; ~7px per unit is a good approximation
      const px = Math.round((colObj.width || 8.43) * 7 + 5);
      tbl += `<col style="width:${px}px;">`;
    }
    tbl += '</colgroup>';

    // ── Rows ─────────────────────────────────────────────────────────────────
    for (let r = 1; r <= maxRow; r++) {
      const rowObj = ws.getRow(r);
      // Row height in points → px (1pt ≈ 1.333px)
      const rhPx = Math.round((rowObj.height || 15) * 1.333);
      tbl += `<tr style="height:${rhPx}px;">`;

      for (let c = 1; c <= maxCol; c++) {
        const key = `${r},${c}`;
        if (slaves.has(key)) continue;

        const cell = ws.getCell(r, c);
        const css = cellToCss(cell);
        const span = masterOf.get(key);
        let attrs = `style="${css}"`;
        if (span?.rowspan > 1) attrs += ` rowspan="${span.rowspan}"`;
        if (span?.colspan > 1) attrs += ` colspan="${span.colspan}"`;

        let content = getCellText(cell);

        if (content === '__PHOTO__') {
          if (avatarBase64 && avatarBase64.startsWith('data:image')) {
            content = `<img src="${avatarBase64.replace(/"/g, '&quot;')}" alt=""
              style="width:30mm;height:40mm;object-fit:cover;display:block;margin:0 auto;">`;
          } else {
            content = '<span style="display:block;min-height:40mm;border:1px solid #2c2c2c;background:#fafafa;font-size:9pt;color:#888;text-align:center;line-height:40mm;">写真</span>';
          }
        } else {
          content = esc(content).replace(/\n/g, '<br>');
        }

        tbl += `<td ${attrs}>${content}</td>`;
      }

      tbl += '</tr>';
    }

    tbl += '</table>';
    sheetHtmls.push(tbl);
  }

  const body = sheetHtmls.join('<div style="height:12px"></div>');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { background: #e5e7eb; }
  body {
    font-family: "MS Mincho", "Yu Mincho", "Hiragino Mincho ProN", "Yu Gothic", "Meiryo", sans-serif;
    font-size: 10.5pt;
    line-height: 1.5;
    color: #1a1a1a;
    background: #fff;
    padding: 10mm 10mm;
    margin: 12px auto;
    width: 210mm;
    min-height: 297mm;
    overflow-x: auto;
    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
    border: 1px solid #d1d5db;
  }
  table { width: 100%; border-collapse: collapse; border: 1px solid #2c2c2c; margin-bottom: 0; }
  td, th { border: 1px solid #2c2c2c; padding: 6px 8px; vertical-align: top; font-size: 10pt; }
  img { display: block; }
</style>
</head>
<body>${body}</body>
</html>`;
}
