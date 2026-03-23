/**
 * Two-page official-style 履歴書 (voice) — 学歴・職歴 combined, 2nd page for PR / 希望.
 */
import {
  disp,
  dispBlock,
  formatJpYearCell,
  formatJpMonthCell,
  entryRowHasContent,
  photoCellHtml,
  nl2br,
  renderDatedHistorySection,
} from './resumeHtmlCommon.js';

/** 学歴・職歴: comfortable row height (main table) */
const HIST_ROW_MAIN = '7.5mm';
/** 免許・資格: slightly tighter so it doesn’t dominate page 2 */
const HIST_ROW_LIC = '6.25mm';
/** Empty rows after 学歴「以上」before 職歴 — balances the two blocks */
const EARLY_PAD_AFTER_EDU = 4;
/**
 * Target row count (データ + 以上 + 職歴見出し + early pad + trailing pad) under 年/月 header.
 * Lower tail = less “huge” empty 職歴 block; early pad shifts fill toward 学歴側.
 */
const TARGET_COMBINED_BODY_ROWS = 27;
/** Max extra empty rows in 免許・資格 (compact rows) */
const PAD_LICENSES_ROWS = 8;
/** When no entries at all: one big cell + this many blank rows */
const PAD_FALLBACK_TAIL_ROWS = 20;

function rowsFromEntries(list) {
  const h = HIST_ROW_MAIN;
  return list
    .map((e) => {
      const yCell = formatJpYearCell(e.year);
      const mCell = formatJpMonthCell(e.month);
      const desc = String(e.description ?? '').trim();
      return `<tr class="hist-row">
    <td class="ym" style="min-height:${h};">${yCell || ''}</td>
    <td class="ym" style="min-height:${h};">${mCell || ''}</td>
    <td class="desc" style="min-height:${h};">${desc ? nl2br(desc) : ''}</td>
  </tr>`;
    })
    .join('');
}

function historyPadTrs(rowCount, thirdTdClass, ymCellClass, rowMin) {
  if (!rowCount || rowCount <= 0) return '';
  const cls = thirdTdClass || 'desc';
  const ym = ymCellClass || 'ym';
  const h = rowMin || HIST_ROW_MAIN;
  return Array.from({ length: rowCount }, () => {
    return `<tr class="hist-pad"><td class="${ym}" style="min-height:${h};">&#160;</td><td class="${ym}" style="min-height:${h};">&#160;</td><td class="${cls}" style="min-height:${h};">&#160;</td></tr>`;
  }).join('\n');
}

/** Append blank rows before closing </table>. */
function padThreeColTableEnd(tableHtml, rowCount, thirdTdClass, ymCellClass = 'ym', rowMin) {
  if (!tableHtml || rowCount <= 0) return tableHtml;
  const rows = historyPadTrs(rowCount, thirdTdClass, ymCellClass, rowMin || HIST_ROW_MAIN);
  const idx = tableHtml.lastIndexOf('</table>');
  if (idx === -1) return tableHtml;
  return tableHtml.slice(0, idx) + rows + tableHtml.slice(idx);
}

function combinedEducationWorkTable(d) {
  const edu = Array.isArray(d.educationEntries) ? d.educationEntries.filter(entryRowHasContent) : [];
  const exp = Array.isArray(d.experienceEntries) ? d.experienceEntries.filter(entryRowHasContent) : [];
  const fallbackE = String(d.education ?? '').trim();
  const fallbackX = String(d.experience ?? '').trim();

  if (edu.length === 0 && exp.length === 0) {
    const fb = [fallbackE, fallbackX].filter(Boolean).join('\n\n');
    let tbl = `<table class="box hist-grid">
  <tr><td class="sec-hd" colspan="3">学歴・職歴（各別にまとめて書く）</td></tr>
  <tr><td class="sub-hd ym">年</td><td class="sub-hd ym">月</td><td class="sub-hd">学歴・職歴</td></tr>
  <tr><td colspan="3" class="cell hist-fallback-cell">${fb ? dispBlock(fb) : '<span class="muted">—</span>'}</td></tr>
</table>`;
    tbl = padThreeColTableEnd(tbl, PAD_FALLBACK_TAIL_ROWS, 'desc', 'ym', HIST_ROW_MAIN);
    return tbl;
  }

  const h = HIST_ROW_MAIN;
  const earlyPad = edu.length > 0 ? EARLY_PAD_AFTER_EDU : 0;

  let body = rowsFromEntries(edu);
  if (edu.length) {
    body += `<tr class="hist-row"><td class="ym" style="min-height:${h};"></td><td class="ym" style="min-height:${h};"></td><td class="cell ctr" style="min-height:${h};">以上</td></tr>`;
  }
  if (earlyPad > 0) {
    body += historyPadTrs(earlyPad, 'desc', 'ym', HIST_ROW_MAIN);
  }
  body += `<tr><td class="sub-hd" colspan="3">職　歴</td></tr>`;
  body += rowsFromEntries(exp);
  if (exp.length) {
    body += `<tr class="hist-row"><td class="ym" style="min-height:${h};"></td><td class="ym" style="min-height:${h};"></td><td class="cell ctr" style="min-height:${h};">以上</td></tr>`;
  }

  let tbl = `<table class="box hist-grid">
  <tr><td class="sec-hd" colspan="3">学歴・職歴（各別にまとめて書く）</td></tr>
  <tr><td class="sub-hd ym">年</td><td class="sub-hd ym">月</td><td class="sub-hd">学歴・職歴</td></tr>
${body}
</table>`;
  const contentRows =
    edu.length + (edu.length ? 1 : 0) + earlyPad + 1 + exp.length + (exp.length ? 1 : 0);
  const endPad = Math.max(0, TARGET_COMBINED_BODY_ROWS - contentRows);
  if (endPad > 0) tbl = padThreeColTableEnd(tbl, endPad, 'desc', 'ym', HIST_ROW_MAIN);
  return tbl;
}

export function generateJapaneseResumeHtmlOfficial(data = {}, avatar = null) {
  const d = data;
  const photoHtml = photoCellHtml(avatar);
  let licensesBlock = renderDatedHistorySection('免許・資格', d.licensesEntries, d.licenses, '免許・資格')
    .replace(/<table>/g, '<table class="box hist-grid hist-lic">')
    .replace(/class="sec-hd"/g, 'class="sec-hd"');
  const licList = Array.isArray(d.licensesEntries) ? d.licensesEntries.filter(entryRowHasContent) : [];
  const licFallback = String(d.licenses ?? '').trim();
  const licPad =
    licList.length === 0 && !licFallback ? PAD_LICENSES_ROWS : Math.max(0, PAD_LICENSES_ROWS - licList.length);
  if (licPad > 0) {
    licensesBlock = padThreeColTableEnd(licensesBlock, licPad, 'val', 'val ym', HIST_ROW_LIC);
  }

  const motivation = String(d.motivation ?? '').trim();
  const selfPr = String(d.self_pr ?? '').trim();
  const preferences = String(d.preferences ?? '').trim();
  const strengthPoints = String(d.strength_points ?? d.strengths ?? '').trim();
  const weaknessPoints = String(d.weakness_points ?? d.weaknesses ?? '').trim();
  const researchLearning = String(d.research_learning ?? d.kenkyuu ?? d.study_topics ?? '').trim();

  const linesPref = Array(10)
    .fill(0)
    .map(() => '<div class="ruled-line"></div>')
    .join('');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "MS Mincho", "Yu Mincho", "Hiragino Mincho ProN", "Meiryo", serif; font-size: 10pt; color: #000; background: #e8e8e8; }
  .page {
    width: 210mm; min-height: 297mm; margin: 0 auto 8mm; padding: 10mm 12mm 12mm;
    background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    page-break-after: always;
  }
  .page:last-of-type { page-break-after: auto; margin-bottom: 0; }
  table.box { width: 100%; border-collapse: collapse; margin-bottom: 2.5mm; border: 1px solid #000; }
  table.box td { border: 1px solid #000; padding: 3px 5px; vertical-align: top; }
  /* 学歴・職歴: main grid */
  table.hist-grid td { padding: 5px 6px; }
  table.hist-grid td.ym { vertical-align: middle; }
  table.hist-grid td.desc, table.hist-grid td.val { vertical-align: top; }
  table.hist-grid td.hist-fallback-cell { min-height: 248px; vertical-align: top; }
  /* 免許・資格: компактные строки */
  table.hist-lic { margin-bottom: 2mm; }
  table.hist-lic td { padding: 3px 5px; }
  table.hist-lic td.val, table.hist-lic td.val.ym { min-height: ${HIST_ROW_LIC}; }
  .head-row td { border: none; padding: 0 0 4mm 0; vertical-align: bottom; }
  .title-main { font-size: 15pt; font-weight: bold; letter-spacing: 0.5em; }
  .title-date { font-size: 9pt; text-align: right; white-space: nowrap; }
  .lbl { background: #f5f5f5; font-size: 8.5pt; width: 22mm; }
  .cell { font-size: 9.5pt; min-height: 18px; }
  .sec-hd { background: #e0e0e0; font-weight: bold; text-align: center; font-size: 10pt; }
  .sub-hd { background: #ececec; font-size: 8.5pt; text-align: center; font-weight: bold; }
  td.ym { width: 10%; text-align: center; white-space: nowrap; }
  td.desc { font-size: 9.5pt; }
  .ctr { text-align: center; }
  .muted { color: #999; }
  /* Free-text blocks (strengths, PR, etc.) */
  .mid-area { min-height: 38mm; padding: 6px 8px; font-size: 9.5pt; line-height: 1.53; }
  .big-area { min-height: 52mm; padding: 6px 8px; font-size: 9.5pt; line-height: 1.56; }
  .block-title { font-size: 9pt; font-weight: bold; margin-bottom: 2mm; }
  table.pr-block { margin-bottom: 2mm; }
  .ruled { border: 1px solid #000; padding: 5px 8px; min-height: 50mm; }
  .ruled-line { border-bottom: 1px solid #ccc; height: 7mm; margin: 0 -8px; padding: 0 8px; }
  .photo-td { width: 34mm; text-align: center; vertical-align: middle; padding: 4px !important; }
</style>
</head>
<body>
<div class="page">
  <table class="head-row" style="width:100%;"><tr>
    <td class="title-main">履　歴　書</td>
    <td class="title-date">年　　　月　　　日　現在</td>
  </tr></table>

  <table class="box">
    <tr>
      <td class="lbl">ふりがな</td>
      <td class="cell" colspan="2">${disp(d.furigana)}</td>
      <td rowspan="4" class="photo-td">${photoHtml}</td>
    </tr>
    <tr>
      <td class="lbl">氏名</td>
      <td class="cell" colspan="2" style="font-size:12pt;font-weight:bold;">${disp(d.name)}</td>
    </tr>
    <tr>
      <td class="lbl">生年月日</td>
      <td class="cell" colspan="2">${disp(d.birthdate)}</td>
    </tr>
    <tr>
      <td class="lbl">（満　）歳</td>
      <td class="cell">${disp(d.age)}</td>
      <td class="cell">性別　${disp(d.gender)}</td>
    </tr>
    <tr>
      <td class="lbl" colspan="4" style="text-align:center;">現住所（ふりがな）</td>
    </tr>
    <tr>
      <td class="cell" colspan="4" style="min-height:22px;"><span class="muted">　</span></td>
    </tr>
    <tr>
      <td class="lbl">〒</td>
      <td class="cell" colspan="3">${disp(d.postal_code)}　${disp(d.current_address)}</td>
    </tr>
    <tr>
      <td class="lbl">電話</td>
      <td class="cell">${disp(d.phone)}</td>
      <td class="lbl">E-mail</td>
      <td class="cell">${disp(d.email)}</td>
    </tr>
    <tr>
      <td class="lbl" colspan="4" style="text-align:center;">連絡先（現住所以外に連絡を希望される場合）</td>
    </tr>
    <tr>
      <td class="cell" colspan="4" style="min-height:20px;">${disp(d.contact_address)}</td>
    </tr>
  </table>

  ${combinedEducationWorkTable(d)}
</div>

<div class="page">
  ${licensesBlock}

  <table class="box pr-block" style="margin-top:2.5mm;">
    <tr><td class="sec-hd">強み（長所・アピールポイント）</td></tr>
    <tr><td class="mid-area">${strengthPoints ? nl2br(strengthPoints) : '<span class="muted">—</span>'}</td></tr>
  </table>

  <table class="box pr-block">
    <tr><td class="sec-hd">弱み・改善したい点</td></tr>
    <tr><td class="mid-area">${weaknessPoints ? nl2br(weaknessPoints) : '<span class="muted">—</span>'}</td></tr>
  </table>

  <table class="box pr-block">
    <tr><td class="sec-hd">研究・学習内容（自主研究・独学・研修など）</td></tr>
    <tr><td class="mid-area">${researchLearning ? nl2br(researchLearning) : '<span class="muted">—</span>'}</td></tr>
  </table>

  <table class="box pr-block" style="margin-top:1mm;">
    <tr><td class="sec-hd">志望の動機</td></tr>
    <tr><td class="big-area">${motivation ? nl2br(motivation) : '<span class="muted">—</span>'}</td></tr>
  </table>

  <table class="box pr-block">
    <tr><td class="sec-hd">自己PR、特技など</td></tr>
    <tr><td class="big-area">${selfPr ? nl2br(selfPr) : '<span class="muted">—</span>'}</td></tr>
  </table>

  <table class="box">
    <tr><td class="sec-hd" style="font-size:8.5pt;line-height:1.35;">本人希望記入欄<br/><span style="font-weight:normal;">（特に給料・職種・勤務時間・勤務地・その他についての希望などがあれば記入）</span></td></tr>
    <tr><td class="ruled">${preferences ? nl2br(preferences) + linesPref : linesPref}</td></tr>
  </table>
</div>
</body>
</html>`;
}
