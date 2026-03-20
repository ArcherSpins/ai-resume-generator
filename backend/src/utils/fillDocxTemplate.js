/**
 * Fill an annotated DOCX template (produced by injectDocxPlaceholders) with
 * actual form data using docxtemplater.
 *
 * Education / experience / licenses come in as typed entry arrays
 * (educationEntries, experienceEntries, licensesEntries) and are formatted
 * into neat multi-line strings that fit in a single DOCX cell.
 *
 * Returns:
 *   - docxBuffer  — the filled DOCX file as a Buffer (for direct download)
 *   - html        — the filled DOCX converted to HTML via mammoth (for PDF generation)
 */
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import mammoth from 'mammoth';

/** All simple text fields recognised in DOCX templates */
const SIMPLE_FIELD_IDS = [
  'name',
  'furigana',
  'name_english',
  'birthdate',
  'age',
  'gender',
  'nationality',
  'postal_code',
  'current_address',
  'phone',
  'email',
  'contact_address',
  'home_address',
  'strong_subjects',
  'hobbies_skills',
  'self_pr',
  'self_intro',
  'motivation',
  'preferences',
];

/**
 * Format an array of {year, month, description} entries into a multi-line
 * string suitable for a single DOCX table cell.
 *
 * @param {Array<{year?,month?,description?}>} entries
 * @returns {string}
 */
function formatEntries(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return '';
  return entries
    .map((e) => {
      const year = String(e?.year ?? '').trim();
      const month = String(e?.month ?? '').trim();
      const desc = String(e?.description ?? '').trim();
      if (!year && !month && !desc) return null;
      const datePrefix = year || month ? `${year}年${month}月　` : '';
      return `${datePrefix}${desc}`;
    })
    .filter(Boolean)
    .join('\n');
}

/**
 * @param {Buffer|string} annotatedDocx  - Buffer or base64 string of annotated DOCX
 * @param {object} formData              - flat object (already through flattenFormData)
 * @param {string|null} avatarBase64     - data URL of photo image or null
 * @returns {Promise<{ docxBuffer: Buffer, html: string }>}
 */
export async function fillDocxTemplate(annotatedDocx, formData, avatarBase64 = null) {
  const buffer =
    typeof annotatedDocx === 'string'
      ? Buffer.from(annotatedDocx, 'base64')
      : annotatedDocx;

  // ── 1. Build the tag → value map ─────────────────────────────────────────
  const safeData = {};

  // Simple text fields
  for (const id of SIMPLE_FIELD_IDS) {
    safeData[id] = formData && formData[id] != null ? String(formData[id]) : '';
  }

  // Structured entry arrays → formatted multiline strings
  // Fallback: 職務経歴書 uses simple textarea for education/experience/licenses
  safeData.education =
    formatEntries(formData?.educationEntries) || (formData?.education != null ? String(formData.education) : '');
  safeData.experience =
    formatEntries(formData?.experienceEntries) || (formData?.experience != null ? String(formData.experience) : '');
  safeData.licenses =
    formatEntries(formData?.licensesEntries) || (formData?.licenses != null ? String(formData.licenses) : '');

  // 職務経歴書: composite contact block (name, email, phone, address)
  safeData.contact_block = [formData?.name, formData?.email, formData?.phone, formData?.current_address]
    .filter(Boolean)
    .join('\n');

  // ── 2. Fill DOCX placeholders with docxtemplater ──────────────────────────
  let docxBuffer;
  try {
    const zip = new PizZip(buffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => '',
    });
    doc.render(safeData);
    docxBuffer = doc.getZip().generate({ type: 'nodebuffer' });
  } catch (err) {
    console.warn('[fillDocxTemplate] docxtemplater error, retrying without paragraphLoop:', err.message);
    const zip2 = new PizZip(buffer);
    const doc2 = new Docxtemplater(zip2, { linebreaks: true, nullGetter: () => '' });
    doc2.render(safeData);
    docxBuffer = doc2.getZip().generate({ type: 'nodebuffer' });
  }

  // ── 3. Convert filled DOCX → HTML via mammoth ────────────────────────────
  const { value: bodyHtml } = await mammoth.convertToHtml({ buffer: docxBuffer });

  // ── 4. Replace __PHOTO__ marker with actual <img> tag ─────────────────────
  // Mammoth may output underscores as &#95; or split text; normalize then replace.
  const normalizedHtml = bodyHtml.replace(/&#95;/g, '_');
  const hasPhoto =
    avatarBase64 &&
    typeof avatarBase64 === 'string' &&
    avatarBase64.startsWith('data:image');

  const photoImg = hasPhoto
    ? `<img src="${avatarBase64.replace(/"/g, '&quot;')}" alt="" style="width:30mm;height:40mm;object-fit:cover;display:block;margin:0 auto;" />`
    : '<span style="display:block;width:30mm;height:40mm;border:1px solid #333;background:#fafafa;font-size:9pt;color:#888;text-align:center;line-height:40mm;">写真</span>';

  let filledBody = normalizedHtml
    .replace(/__PHOTO__/g, photoImg)
    .replace(/__\s*PHOTO\s*__/gi, photoImg);
  if (hasPhoto && !/__\s*PHOTO\s*__/i.test(normalizedHtml)) {
    filledBody = filledBody.replace(
      /(<p[^>]*>\s*写真\s*<\/p>)/i,
      `<p style="text-align:center;">${photoImg}</p>`
    );
  }

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "MS Mincho", "Yu Mincho", "Hiragino Mincho ProN", "Yu Gothic", "Meiryo", sans-serif;
    font-size: 10.5pt;
    line-height: 1.45;
    color: #1a1a1a;
    background: #fff;
    padding: 12mm 14mm;
    width: 210mm;
    min-height: 297mm;
  }
  table { border-collapse: collapse; width: 100%; margin-bottom: 0; border: 1px solid #2c2c2c; }
  td, th {
    border: 1px solid #2c2c2c;
    padding: 5px 8px;
    vertical-align: top;
    white-space: pre-wrap;
    word-break: break-all;
  }
  p { margin-bottom: 2px; line-height: 1.5; }
  img { display: block; }
</style>
</head>
<body>${filledBody}</body>
</html>`;

  return { docxBuffer, html };
}
