/**
 * Fill an XLSX template with form data using ExcelJS.
 *
 * Two complementary strategies:
 *
 *  A) SIMPLE FIELDS — scan every cell, match Japanese label → write value
 *     into the next (right) cell. Handles name, address, phone, email, etc.
 *
 *  B) TABLE SECTIONS — detect the year/month/content column structure that
 *     Japanese 履歴書 templates use for 学歴, 職歴, 免許・資格.
 *     Walk down the sheet, find section-separator rows (rows whose content
 *     column holds a known section keyword while year+month are empty).
 *     Fill the blank rows below each separator with the corresponding typed
 *     entry arrays (educationEntries, experienceEntries, licensesEntries).
 *
 * Returns: { xlsxBuffer, html }
 */
import ExcelJS from 'exceljs';
import { xlsxToStyledHtml } from './xlsxToStyledHtml.js';

// ── Label → field-id map (simple fields only) ────────────────────────────────
const SIMPLE_FIELD_MAP = [
  { label: '氏名', id: 'name' },
  { label: 'ふりがな', id: 'furigana' },
  { label: 'フリガナ', id: 'furigana' },
  { label: 'アルファベット表記', id: 'name_english' },
  { label: 'アルファベット氏名', id: 'name_english' },
  { label: '生年月日', id: 'birthdate' },
  { label: '年齢', id: 'age' },
  { label: '（年齢）', id: 'age' },
  { label: '性別', id: 'gender' },
  { label: '国籍', id: 'nationality' },
  { label: '本籍地', id: 'nationality' },
  { label: '郵便番号', id: 'postal_code' },
  { label: '〒', id: 'postal_code' },
  { label: '現住所', id: 'current_address' },
  { label: '電話', id: 'phone' },
  { label: 'TEL', id: 'phone' },
  { label: '携帯', id: 'phone' },
  { label: 'メールアドレス', id: 'email' },
  { label: 'E-mail', id: 'email' },
  { label: 'Email', id: 'email' },
  { label: '連絡先', id: 'contact_address' },
  { label: '本国住所', id: 'home_address' },
  { label: '得意な科目・分野', id: 'strong_subjects' },
  { label: '趣味・特技', id: 'hobbies_skills' },
  { label: '趣味、特技', id: 'hobbies_skills' },
  { label: '特技、自己PRなど', id: 'self_pr' },
  { label: '特技・自己PR', id: 'self_pr' },
  { label: '自己PRなど', id: 'self_pr' },
  { label: '自己PR', id: 'self_pr' },
  { label: '自己紹介書', id: 'self_intro' },
  { label: '志望動機', id: 'motivation' },
  { label: '志望の動機、特技、好きな学科、アピールポイントなど', id: 'motivation' },
  { label: '志望の動機・特技・アピール', id: 'motivation' },
  { label: '本人希望', id: 'preferences' },
  { label: '本人希望記入欄', id: 'preferences' },
  // Photo cells — replaced in xlsxToStyledHtml
  { label: '写真', id: '__photo__', replaceSelf: true },
  { label: '写真貼付欄', id: '__photo__', replaceSelf: true },
  { label: '証明写真', id: '__photo__', replaceSelf: true },
  { label: '写真をはる位置', id: '__photo__', replaceSelf: true },
  { label: '写真を貼る位置', id: '__photo__', replaceSelf: true },
  { label: '写真をはる必要', id: '__photo__', replaceSelf: true },
  { label: '写真貼付', id: '__photo__', replaceSelf: true },
];

function normalizeText(s) {
  return String(s ?? '').replace(/[\s\u3000\u00a0]/g, '');
}

function parseAvatarDataUrl(avatarBase64) {
  if (!avatarBase64 || typeof avatarBase64 !== 'string') return null;
  const match = avatarBase64.match(/^data:image\/(png|jpe?g|gif|webp);base64,(.+)$/i);
  if (!match) return null;
  const extRaw = match[1].toLowerCase();
  const extension = extRaw === 'jpg' ? 'jpeg' : extRaw;
  return {
    extension,
    buffer: Buffer.from(match[2], 'base64'),
  };
}

function parseMerges(ws) {
  const masterOf = new Map();
  const merges = ws.model?.merges ?? [];
  for (const rangeStr of merges) {
    const [tlStr, brStr] = rangeStr.split(':');
    if (!tlStr || !brStr) continue;
    const tlM = tlStr.match(/^([A-Z]+)(\d+)$/);
    const brM = brStr.match(/^([A-Z]+)(\d+)$/);
    if (!tlM || !brM) continue;
    const colToNum = (col) =>
      String(col)
        .split('')
        .reduce((acc, ch) => acc * 26 + ch.charCodeAt(0) - 64, 0);
    const tlR = parseInt(tlM[2], 10);
    const tlC = colToNum(tlM[1]);
    const brR = parseInt(brM[2], 10);
    const brC = colToNum(brM[1]);
    masterOf.set(`${tlR},${tlC}`, {
      rowspan: brR - tlR + 1,
      colspan: brC - tlC + 1,
    });
  }
  return { masterOf };
}

// Section keywords that identify separator rows in education/experience tables
const SECTION_KEYWORDS = {
  '学歴': 'education',
  '学歴・職歴': 'education',
  '学歴・職歴（各別にまとめて書く）': 'education',
  '職歴': 'experience',
  '免許・資格': 'licenses',
  '資格・免許': 'licenses',
  '資格': 'licenses',
};

// Labels that are known header/separator text — never treated as value cells
const ALL_LABELS = new Set([
  ...SIMPLE_FIELD_MAP.map((f) => normalizeText(f.label)),
  ...Object.keys(SECTION_KEYWORDS).map(normalizeText),
  '年', '月', '以上', '学歴', '職歴', '免許・資格', '資格・免許', '学歴・職歴',
].map(normalizeText));

function getCellText(cell) {
  const val = cell.value;
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (val instanceof Date) return val.toLocaleDateString('ja-JP');
  if (typeof val === 'object') {
    if (val.richText) return val.richText.map((rt) => rt.text).join('');
    if (val.text) return String(val.text);
    if (val.result !== undefined) return String(val.result);
  }
  return String(val);
}

// ─────────────────────────────────────────────────────────────────────────────
// Strategy A: fill simple label → adjacent-cell fields
// ─────────────────────────────────────────────────────────────────────────────
function fillSimpleFields(ws, formData) {
  const maxRow = ws.rowCount;
  const maxCol = ws.columnCount;

  for (let r = 1; r <= maxRow; r++) {
    for (let c = 1; c <= maxCol; c++) {
      const cell = ws.getCell(r, c);
      const rawText = getCellText(cell);
      const cellNorm = normalizeText(rawText);
      if (!cellNorm) continue;

      let bestField = null;
      let bestLen = 0;
      for (const field of SIMPLE_FIELD_MAP) {
        const labelNorm = normalizeText(field.label);
        if (
          (cellNorm === labelNorm || cellNorm.startsWith(labelNorm)) &&
          labelNorm.length > bestLen
        ) {
          bestField = field;
          bestLen = labelNorm.length;
        }
      }
      if (!bestField) continue;

      if (bestField.id === '__photo__') {
        // Mark cell for photo — replaced by xlsxToStyledHtml
        cell.value = '__PHOTO__';
      } else {
        // Write into a nearby writable cell to the right.
        let target = null;
        for (let targetCol = c + 1; targetCol <= Math.min(maxCol, c + 4); targetCol++) {
          const probe = ws.getCell(r, targetCol);
          const existingNorm = normalizeText(getCellText(probe));
          if (!ALL_LABELS.has(existingNorm)) {
            target = probe;
            break;
          }
        }
        if (!target) continue;
        const value = formData[bestField.id] != null ? String(formData[bestField.id]) : '';
        target.value = value;
      }
    }
  }
}

function fillShokumuSectionRows(ws, formData) {
  const sectionMap = [
    { keys: ['キャリアサマリー', '自己紹介'], valueKey: 'self_intro' },
    { keys: ['職務経歴'], valueKey: 'experience' },
    { keys: ['学歴'], valueKey: 'education' },
    { keys: ['保有資格', 'スキル'], valueKey: 'licenses' },
    { keys: ['趣味', '特技'], valueKey: 'hobbies_skills' },
  ];
  const maxRow = ws.rowCount;
  const maxCol = ws.columnCount;

  for (let r = 1; r <= maxRow; r++) {
    const rowTexts = [];
    for (let c = 1; c <= maxCol; c++) {
      rowTexts.push(normalizeText(getCellText(ws.getCell(r, c))));
    }
    const rowJoined = rowTexts.join('|');
    if (!rowJoined) continue;

    const section = sectionMap.find((s) => s.keys.every((k) => rowJoined.includes(normalizeText(k))));
    if (!section) continue;

    const rawValue = formData?.[section.valueKey];
    const value = rawValue == null ? '' : String(rawValue);
    if (!value.trim()) continue;

    const targetRow = Math.min(maxRow, r + 1);
    let targetCell = null;
    for (let c = 2; c <= maxCol; c++) {
      const probe = ws.getCell(targetRow, c);
      const probeNorm = normalizeText(getCellText(probe));
      if (!ALL_LABELS.has(probeNorm)) {
        targetCell = probe;
        break;
      }
    }
    if (!targetCell) targetCell = ws.getCell(targetRow, Math.min(2, maxCol));
    targetCell.value = value;
    if (!targetCell.alignment) {
      targetCell.alignment = { vertical: 'top', wrapText: true };
    } else {
      targetCell.alignment = { ...targetCell.alignment, vertical: 'top', wrapText: true };
    }
  }
}

function findPhotoAnchor(ws) {
  const maxRow = ws.rowCount;
  const maxCol = ws.columnCount;
  for (let r = 1; r <= maxRow; r++) {
    for (let c = 1; c <= maxCol; c++) {
      const cell = ws.getCell(r, c);
      const norm = normalizeText(getCellText(cell)).toLowerCase();
      if (
        norm === '__photo__' ||
        norm === '写真' ||
        norm.includes('写真をはる位置') ||
        norm.includes('写真を貼る位置') ||
        norm.includes('写真貼付')
      ) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

function embedPhotoInWorksheet(workbook, ws, avatarBase64) {
  const parsed = parseAvatarDataUrl(avatarBase64);
  if (!parsed) return;

  const anchor = findPhotoAnchor(ws);
  if (!anchor) return;

  const { masterOf } = parseMerges(ws);
  const span = masterOf.get(`${anchor.row},${anchor.col}`) || { rowspan: 4, colspan: 1 };
  const imageId = workbook.addImage({
    buffer: parsed.buffer,
    extension: parsed.extension,
  });
  ws.addImage(imageId, {
    tl: { col: anchor.col - 1 + 0.03, row: anchor.row - 1 + 0.03 },
    br: {
      col: anchor.col - 1 + span.colspan - 0.03,
      row: anchor.row - 1 + span.rowspan - 0.03,
    },
    editAs: 'oneCell',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Strategy B: fill multi-row sections (education / experience / licenses)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find the header row that contains "年" and "月" column labels,
 * then return the column indices for year, month, and content.
 *
 * Returns null if no such header is found.
 */
function detectYearMonthCols(ws) {
  const maxRow = Math.min(ws.rowCount, 40);
  const maxCol = ws.columnCount;

  for (let r = 1; r <= maxRow; r++) {
    let yearCol = null;
    let monthCol = null;
    for (let c = 1; c <= maxCol; c++) {
      const norm = normalizeText(getCellText(ws.getCell(r, c)));
      if (norm === '年' && yearCol === null) yearCol = c;
      else if (norm === '月' && monthCol === null) monthCol = c;
    }
    if (yearCol !== null && monthCol !== null) {
      const contentCol = Math.max(yearCol, monthCol) + 1;
      return { headerRow: r, yearCol, monthCol, contentCol };
    }
  }
  return null;
}

/**
 * Scan the worksheet for section-separator rows and data rows.
 * Returns an ordered array: [{ sectionType, row, isData }]
 */
function buildSectionMap(ws, yearCol, monthCol, contentCol) {
  const maxRow = ws.rowCount;
  const map = []; // {row, type:'separator'|'data', sectionType?}

  for (let r = 1; r <= maxRow; r++) {
    const yearNorm = normalizeText(getCellText(ws.getCell(r, yearCol)));
    const monthNorm = normalizeText(getCellText(ws.getCell(r, monthCol)));
    const contentNorm = normalizeText(getCellText(ws.getCell(r, contentCol)));

    if (!yearNorm && !monthNorm) {
      // Could be a section separator or an empty data row
      const sectionType = SECTION_KEYWORDS[contentNorm];
      if (sectionType) {
        map.push({ row: r, type: 'separator', sectionType });
      } else if (!contentNorm) {
        map.push({ row: r, type: 'data' });
      }
      // Non-empty content that's not a section keyword = other text (header, 以上, etc.)
    }
    // Rows that have year/month digits are already filled (template examples or user data)
  }
  return map;
}

/**
 * For each section in the map, fill blank data rows with entries from formData.
 */
function fillSectionRows(ws, yearCol, monthCol, contentCol, formData) {
  const mapItems = buildSectionMap(ws, yearCol, monthCol, contentCol);

  let currentSection = null;
  let entryIdx = 0;

  for (const item of mapItems) {
    if (item.type === 'separator') {
      currentSection = item.sectionType;
      entryIdx = 0;
      continue;
    }
    if (item.type !== 'data' || currentSection === null) continue;

    const entries = formData[`${currentSection}Entries`];
    if (!Array.isArray(entries) || entryIdx >= entries.length) continue;

    const entry = entries[entryIdx++];
    if (!entry) continue;

    const yearCell = ws.getCell(item.row, yearCol);
    const monthCell = ws.getCell(item.row, monthCol);
    const contentCell = ws.getCell(item.row, contentCol);

    if (entry.year) yearCell.value = String(entry.year);
    if (entry.month) monthCell.value = String(entry.month);
    if (entry.description) contentCell.value = String(entry.description);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {Buffer|string} xlsxInput    - original XLSX as Buffer or base64 string
 * @param {object}        formData     - flat form data (from flattenFormData)
 * @param {string|null}   avatarBase64 - photo data URL or null
 * @returns {Promise<{ xlsxBuffer: Buffer, html: string }>}
 */
export async function fillXlsxTemplate(xlsxInput, formData, avatarBase64 = null) {
  const inputBuffer =
    typeof xlsxInput === 'string' ? Buffer.from(xlsxInput, 'base64') : xlsxInput;

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(inputBuffer);

  const hasPhoto =
    !!avatarBase64 &&
    typeof avatarBase64 === 'string' &&
    avatarBase64.startsWith('data:image');

  for (const ws of workbook.worksheets) {
    // A) Simple label → adjacent cell fields (name, phone, address, etc.)
    fillSimpleFields(ws, formData);

    // B) Year/month table rows (education, experience, licenses)
    const struct = detectYearMonthCols(ws);
    if (struct) {
      fillSectionRows(ws, struct.yearCol, struct.monthCol, struct.contentCol, formData);
    }
    fillShokumuSectionRows(ws, formData);
    if (hasPhoto) {
      embedPhotoInWorksheet(workbook, ws, avatarBase64);
    }
  }

  // ── XLSX buffer for direct download (all styles preserved by ExcelJS) ─────
  const xlsxBuffer = Buffer.from(await workbook.xlsx.writeBuffer());

  // ── Styled HTML for PDF via Puppeteer ────────────────────────────────────
  const html = await xlsxToStyledHtml(xlsxBuffer, hasPhoto ? avatarBase64 : null);

  return { xlsxBuffer, html };
}
