import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { config } from '../config/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resumesPath = path.join(__dirname, '..', '..', config.resumesDir);

/** Try to convert DOCX to PDF via LibreOffice (soffice). PDF matches template 1:1. */
export async function docxToPdfBuffer(docxBuffer) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docx2pdf-'));
  const docxPath = path.join(tmpDir, 'document.docx');
  const outDir = path.join(tmpDir, 'out');
  fs.mkdirSync(outDir, { recursive: true });
  try {
    fs.writeFileSync(docxPath, docxBuffer);
    let soffice = 'libreoffice';
    if (process.platform === 'win32') {
      const pf = process.env['PROGRAMFILES'] || 'C:\\Program Files';
      const pf86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
      for (const base of [pf, pf86]) {
        const exe = path.join(base, 'LibreOffice', 'program', 'soffice.exe');
        if (fs.existsSync(exe)) { soffice = exe; break; }
      }
    }
    await new Promise((resolve, reject) => {
      const child = spawn(soffice, [
        '--headless',
        '--convert-to', 'pdf',
        '--outdir', outDir,
        docxPath,
      ], { stdio: ['ignore', 'pipe', 'pipe'] });
      let stderr = '';
      child.stderr?.on('data', (d) => { stderr += d.toString(); });
      child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(stderr || `exit ${code}`))));
      child.on('error', reject);
    });
    const pdfPath = path.join(outDir, 'document.pdf');
    if (!fs.existsSync(pdfPath)) return null;
    return fs.readFileSync(pdfPath);
  } catch (err) {
    console.warn('[pdfService] LibreOffice DOCX→PDF failed (PDF will use HTML fallback). Install LibreOffice for PDF that matches the template:', err.message);
    return null;
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true }); } catch (_) {}
  }
}

/** Fallback CSS used only when the caller passes a plain HTML snippet (not a full document). */
const RESUME_CSS = `
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', 'Yu Gothic', sans-serif; margin: 0; padding: 2rem; color: #1a1a1a; font-size: 11pt; line-height: 1.5; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #000; padding: 3px 6px; vertical-align: top; }
`;

function wrapIfNeeded(htmlContent) {
  const t = (htmlContent || '').trimStart();
  if (t.startsWith('<!DOCTYPE') || t.startsWith('<html')) return htmlContent;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${RESUME_CSS}</style></head><body>${htmlContent}</body></html>`;
}

/**
 * Render HTML to a PDF Buffer via Puppeteer.
 * Accepts both full HTML documents and plain body snippets.
 */
export async function htmlToPdfBuffer(htmlContent) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(wrapIfNeeded(htmlContent), { waitUntil: 'networkidle0' });
    const buffer = await page.pdf({
      format: 'A4',
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      printBackground: true,
    });
    return Buffer.from(buffer);
  } finally {
    await browser.close();
  }
}

/**
 * Save an arbitrary buffer to the resumes directory and return the full path.
 */
export function saveBuffer(buffer, filename) {
  fs.mkdirSync(resumesPath, { recursive: true });
  const fullPath = path.join(resumesPath, filename);
  fs.writeFileSync(fullPath, buffer);
  return fullPath;
}

/**
 * Generate PDF and save to local disk. Returns full path.
 */
export async function htmlToPdf(htmlContent, outputFilename) {
  const buffer = await htmlToPdfBuffer(htmlContent);
  return saveBuffer(buffer, outputFilename);
}

export function getRelativePath(fullPath) {
  return path.relative(path.join(resumesPath, '..'), fullPath).replace(/\\/g, '/');
}
