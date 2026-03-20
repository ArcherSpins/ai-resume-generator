import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { config } from '../config/index.js';
import { extractTextFromBuffer, convertDocxToHtml } from '../utils/extractText.js';
import { generateSchemaFromResumeText } from '../services/ai/schemaFromResume.js';
import { injectDocxPlaceholders } from '../utils/injectDocxPlaceholders.js';
import { xlsxToStyledHtml } from '../utils/xlsxToStyledHtml.js';
import { isS3Configured, uploadBuffer } from '../services/s3Service.js';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const name = (file.originalname || '').toLowerCase();
    const allowed = [DOCX_MIME, XLSX_MIME];
    const byExt = name.endsWith('.docx') || name.endsWith('.xlsx');
    if (allowed.includes(file.mimetype) || byExt) return cb(null, true);
    cb(new Error('Only DOCX and XLSX templates are supported'));
  },
});

const router = Router();

router.post('/', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { buffer, mimetype, originalname } = req.file;

    const ext = (originalname || '').toLowerCase().split('.').pop();
    const effectiveMime =
      mimetype === 'application/octet-stream'
        ? ext === 'docx'
          ? DOCX_MIME
          : ext === 'xlsx'
            ? XLSX_MIME
            : mimetype
        : mimetype;

    const text = await extractTextFromBuffer(buffer, effectiveMime);

    let templateHtml = null;
    if (effectiveMime === DOCX_MIME) {
      const bodyHtml = await convertDocxToHtml(buffer);
      if (bodyHtml) {
        templateHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "MS Gothic", "Yu Gothic", "Noto Sans CJK JP", "Hiragino Kaku Gothic Pro", sans-serif;
    font-size: 10pt; padding: 14mm 12mm; color: #000; background: #fff;
    width: 210mm; min-height: 297mm;
  }
  table { border-collapse: collapse; width: 100%; margin-bottom: 4px; }
  td, th { border: 1px solid #333; padding: 3px 6px; vertical-align: top; }
  p { margin-bottom: 2px; line-height: 1.4; }
  h1,h2,h3,h4 { font-size: 10pt; font-weight: bold; }
  img { max-width: 40mm; max-height: 50mm; object-fit: contain; display: block; }
</style>
</head>
<body>${bodyHtml}</body>
</html>`;
      }
    }

    const schema = await generateSchemaFromResumeText(
      text,
      templateHtml ? templateHtml.slice(0, 3000) : '',
    );
    if (!schema.sections || !Array.isArray(schema.sections)) schema.sections = [];
    if (typeof schema.avatarRequired !== 'boolean') schema.avatarRequired = true;

    let originalDocxBase64 = null;
    let annotatedDocxBase64 = null;
    if (effectiveMime === DOCX_MIME) {
      originalDocxBase64 = buffer.toString('base64');
      try {
        const annotated = injectDocxPlaceholders(buffer);
        annotatedDocxBase64 = annotated.toString('base64');
      } catch (err) {
        console.warn('[upload] injectDocxPlaceholders failed:', err.message);
      }
    }

    let templateXlsxBase64 = null;
    if (effectiveMime === XLSX_MIME) {
      templateXlsxBase64 = buffer.toString('base64');
      try {
        templateHtml = await xlsxToStyledHtml(buffer, null);
      } catch (err) {
        console.warn('[upload] xlsxToStyledHtml preview failed:', err.message);
      }
    }

    if (isS3Configured()) {
      const key = `${config.s3.uploadsPrefix}/${req.user.id}/${Date.now()}-${originalname}`;
      await uploadBuffer(buffer, key, effectiveMime);
    }

    res.json({
      ...schema,
      templateHtml,
      originalDocxBase64,
      annotatedDocxBase64,
      templateXlsxBase64,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
