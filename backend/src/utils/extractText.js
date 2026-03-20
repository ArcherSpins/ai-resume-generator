import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs';
import * as XLSX from 'xlsx';

export async function extractTextFromPdf(buffer) {
  const data = await pdfParse(buffer);
  return data.text || '';
}

export async function extractTextFromDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || '';
}

/** Extract readable text from an XLSX file (all sheets). */
export function extractTextFromXlsx(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const lines = [];
  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    for (const row of rows) {
      const rowText = row.filter((v) => v !== '').join('\t');
      if (rowText.trim()) lines.push(rowText);
    }
  }
  return lines.join('\n');
}

/** Convert DOCX to HTML (preserves layout/structure) for use as fillable template. Returns null for non-DOCX. */
export async function convertDocxToHtml(buffer) {
  const result = await mammoth.convertToHtml({ buffer });
  return result.value || null;
}

export async function extractTextFromBuffer(buffer, mimeType) {
  if (mimeType === 'application/pdf') {
    return extractTextFromPdf(buffer);
  }
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return extractTextFromDocx(buffer);
  }
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel'
  ) {
    return extractTextFromXlsx(buffer);
  }
  throw new Error('Unsupported file type. Use PDF, DOCX or XLSX.');
}

export async function extractTextFromFile(filePath, mimeType) {
  const buffer = fs.readFileSync(filePath);
  return extractTextFromBuffer(buffer, mimeType);
}
