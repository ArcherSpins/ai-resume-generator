/**
 * Inject docxtemplater placeholders into DOCX XML without changing template style.
 *
 * We only replace the text content of cells/paragraphs; we preserve tcPr (cell),
 * pPr (paragraph), and the first run's rPr (font, size) so the filled document
 * looks identical to the template.
 *
 * 1) TABLE-BASED (履歴書): label cell → inject {fieldId} into the next cell (style kept).
 * 2) PARAGRAPH-BASED (職務経歴書): replace placeholder text with {fieldId} (style kept).
 */
import PizZip from 'pizzip';

// ── Paragraph-based placeholder patterns (職務経歴書) ─────────────────────────
// Text may be split across multiple <w:t> runs; we match on joined paragraph text.
// Order matters: longer/more specific patterns first.
const PARAGRAPH_PLACEHOLDERS = [
  { pattern: /<ここに氏名を挿入>/, id: 'name' },
  { pattern: /<ここは希望する職についての簡単な説明と、あなたのスキル概要を記載してください。>/, id: 'self_intro' },
  { pattern: /<ここの記載は、特に開発者などの技術者にとって重要です。>/, id: 'licenses' },
  { pattern: /<一番最近の職歴から書き始めます。キャリアサマリーの中で最もスペースを割く部分です。>/, id: 'experience' },
  { pattern: /<各職務における業務内容、取り組んだプロジェクト、最大の功績についての簡単な説明>/, id: 'experience' },
  { pattern: /<大学名と年>/, id: 'education' },
  { pattern: /名前、メールアドレス、携帯番号、住所\/場所等の個人情報/, id: 'contact_block' },
  { pattern: /例：プロのロッククライマー/, id: 'hobbies_skills' },
];

// ── Field map ─────────────────────────────────────────────────────────────────
// `replaceSelf: true` → the label cell itself IS the value cell (e.g. photo area)
const FIELD_MAP = [
  // Personal
  { label: '氏名', id: 'name' },
  { label: 'ふりがな', id: 'furigana' },
  { label: 'フリガナ', id: 'furigana' },
  { label: 'アルファベット表記', id: 'name_english' },
  { label: 'アルファベット氏名', id: 'name_english' },
  { label: '生年月日', id: 'birthdate' },
  { label: '性別', id: 'gender' },
  { label: '国籍', id: 'nationality' },
  { label: '本籍地', id: 'nationality' },
  // Contact
  { label: '現住所', id: 'current_address' },
  { label: '電話', id: 'phone' },
  { label: 'TEL', id: 'phone' },
  { label: '携帯', id: 'phone' },
  { label: 'メールアドレス', id: 'email' },
  { label: 'E-mail', id: 'email' },
  { label: 'Email', id: 'email' },
  { label: '連絡先', id: 'contact_address' },
  { label: '本国住所', id: 'home_address' },
  // Career (single-cell placeholders — filled as formatted multiline strings)
  { label: '学歴', id: 'education' },
  { label: '学歴・職歴', id: 'education' },
  { label: '職歴', id: 'experience' },
  { label: '免許・資格', id: 'licenses' },
  { label: '資格・免許', id: 'licenses' },
  { label: '資格', id: 'licenses' },
  // Other free-text
  { label: '得意な科目・分野', id: 'strong_subjects' },
  { label: '趣味・特技', id: 'hobbies_skills' },
  { label: '趣味、特技', id: 'hobbies_skills' },
  { label: '特技、自己PRなど', id: 'self_pr' },
  { label: '特技・自己PR', id: 'self_pr' },
  { label: '自己PRなど', id: 'self_pr' },
  { label: '自己PR', id: 'self_pr' },
  { label: '自己紹介書', id: 'self_intro' },
  { label: '志望動機', id: 'motivation' },
  { label: '志望の動機', id: 'motivation' },
  { label: '本人希望', id: 'preferences' },
  { label: '本人希望記入欄', id: 'preferences' },
  // Photo
  { label: '写真', id: '__photo__', replaceSelf: true },
  { label: '写真貼付欄', id: '__photo__', replaceSelf: true },
  { label: '証明写真', id: '__photo__', replaceSelf: true },
  { label: '写真をはる位置', id: '__photo__', replaceSelf: true },
  { label: '写真を貼る位置', id: '__photo__', replaceSelf: true },
  { label: '写真をはる必要', id: '__photo__', replaceSelf: true },
  { label: '写真貼付', id: '__photo__', replaceSelf: true },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeText(str) {
  return String(str || '').replace(/[\s\u3000\u00a0]/g, '').toLowerCase();
}

/**
 * Extract the full visible text of a cell by joining all <w:t> fragments.
 * This handles text split across multiple runs / paragraphs.
 */
function getCellText(cellXml) {
  const matches = [...cellXml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)];
  return matches.map((m) => m[1]).join('');
}

/** Get the first run's rPr (font, size, etc.) from cell or paragraph XML so we keep styling. */
function getFirstRunRPr(xml) {
  const m = xml.match(/<w:rPr[\s\S]*?<\/w:rPr>/);
  return m ? m[0] : '';
}

/**
 * Rebuild a table-cell with new text but preserve tcPr, pPr, and first run's rPr
 * so the template style (font, size, alignment) is unchanged.
 */
function setCellText(cellXml, text) {
  const tcPrMatch = cellXml.match(/(<w:tcPr[\s\S]*?<\/w:tcPr>)/);
  const tcPr = tcPrMatch ? tcPrMatch[1] : '';
  const pPrMatch = cellXml.match(/(<w:pPr[\s\S]*?<\/w:pPr>)/);
  const pPr = pPrMatch ? pPrMatch[1] : '';
  const rPr = getFirstRunRPr(cellXml);
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return (
    `<w:tc>${tcPr}` +
    `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>` +
    `</w:tc>`
  );
}

/** Extract all <w:tc> elements from a row's XML. */
function parseCells(rowXml) {
  const cells = [];
  const re = /(<w:tc\b[\s\S]*?<\/w:tc>)/g;
  let m;
  while ((m = re.exec(rowXml)) !== null) {
    cells.push({ xml: m[1], text: getCellText(m[1]) });
  }
  return cells;
}

/**
 * Find the best-matching field for a normalised cell text.
 * "Best" = longest label that is a prefix / full match of the cell text.
 */
function findBestField(cellNorm) {
  let best = null;
  let bestLen = 0;
  for (const field of FIELD_MAP) {
    const lnorm = normalizeText(field.label);
    if ((cellNorm === lnorm || cellNorm.startsWith(lnorm)) && lnorm.length > bestLen) {
      best = field;
      bestLen = lnorm.length;
    }
  }
  return best;
}

/** Return true if `norm` matches any known label (prevents clobbering labels). */
function isKnownLabel(norm) {
  return FIELD_MAP.some((f) => norm === normalizeText(f.label));
}

// ── Row processing ────────────────────────────────────────────────────────────

function processRow(rowXml) {
  const cells = parseCells(rowXml);
  if (cells.length < 1) return rowXml;

  let result = rowXml;

  for (let i = 0; i < cells.length; i++) {
    const norm = normalizeText(cells[i].text);
    if (!norm) continue;

    const field = findBestField(norm);
    if (!field) continue;

    if (field.replaceSelf || field.id === '__photo__') {
      // Replace the label cell itself with the photo placeholder
      const replaced = setCellText(cells[i].xml, '__PHOTO__');
      result = result.replace(cells[i].xml, replaced);
    } else {
      // Inject docxtemplater placeholder into the adjacent right cell
      const next = cells[i + 1];
      if (!next) continue;
      if (isKnownLabel(normalizeText(next.text))) continue;
      const replaced = setCellText(next.xml, `{${field.id}}`);
      result = result.replace(next.xml, replaced);
    }
  }

  return result;
}

// ── Paragraph processing (職務経歴書: no tables, inline placeholders) ─────────

/** Extract full text from a paragraph's XML (join all <w:t> nodes, decode entities). */
function getParagraphText(innerXml) {
  const parts = [...innerXml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]);
  return parts
    .join('')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** Replace paragraph content with placeholder but keep pPr and first run's rPr (style). */
function replaceParagraphWithPlaceholder(fullParagraphXml, fieldId) {
  const pOpenMatch = fullParagraphXml.match(/^<w:p\b[^>]*>/);
  const pOpen = pOpenMatch ? pOpenMatch[0] : '<w:p>';
  const pPrMatch = fullParagraphXml.match(/<w:pPr[\s\S]*?<\/w:pPr>/);
  const pPr = pPrMatch ? pPrMatch[0] : '';
  const rPr = getFirstRunRPr(fullParagraphXml);
  const escaped = `{${fieldId}}`
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `${pOpen}${pPr}<w:r>${rPr}<w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`;
}

function processParagraph(paraXml) {
  const inner = paraXml.replace(/^<w:p\b[^>]*>/, '').replace(/<\/w:p>$/, '');
  const text = getParagraphText(inner);
  for (const { pattern, id } of PARAGRAPH_PLACEHOLDERS) {
    if (pattern.test(text)) {
      return replaceParagraphWithPlaceholder(paraXml, id);
    }
  }
  return paraXml;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function injectDocxPlaceholders(docxBuffer) {
  const zip = new PizZip(docxBuffer);
  const xmlFile = zip.files['word/document.xml'];
  if (!xmlFile) return docxBuffer;

  let xml = xmlFile.asText();

  // 1) Table-based (履歴書): process table rows
  xml = xml.replace(/<w:tr\b[\s\S]*?<\/w:tr>/g, (rowXml) => processRow(rowXml));

  // 2) Paragraph-based (職務経歴書): process paragraphs with inline placeholders
  xml = xml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (paraXml) => processParagraph(paraXml));

  zip.file('word/document.xml', xml);
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}
