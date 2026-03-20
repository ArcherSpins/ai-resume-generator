import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  TEMPLATE_LIST,
  getSchema,
  getDefaultData,
  getTemplateBuffer,
} from '../data/defaultTemplates.js';
import { xlsxToStyledHtml } from '../utils/xlsxToStyledHtml.js';
import mammoth from 'mammoth';

const router = Router();

router.get('/', requireAuth, (_req, res) => {
  res.json({ templates: TEMPLATE_LIST });
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const schema = getSchema(id);
    if (!schema) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const buffer = await getTemplateBuffer(id);
    if (!buffer) {
      return res.status(404).json({ error: 'Template file not found' });
    }

    const templateBase64 = buffer.toString('base64');
    let templateHtml = null;

    if (id.endsWith('-docx')) {
      const { value } = await mammoth.convertToHtml({ buffer });
      templateHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "MS Gothic", "Yu Gothic", "Noto Sans CJK JP", sans-serif;
    font-size: 10pt; padding: 14mm 12mm; color: #000; background: #fff;
    width: 210mm; min-height: 297mm;
  }
  table { border-collapse: collapse; width: 100%; margin-bottom: 4px; }
  td, th { padding: 3px 6px; vertical-align: top; }
  p { margin-bottom: 2px; line-height: 1.4; }
</style>
</head>
<body>${value}</body>
</html>`;
    } else {
      try {
        templateHtml = await xlsxToStyledHtml(buffer, null);
      } catch (_) {}
    }

    const payload = {
      ...schema,
      defaultData: getDefaultData(id),
      templateHtml,
      originalDocxBase64: id.endsWith('-docx') ? templateBase64 : undefined,
      annotatedDocxBase64: id.endsWith('-docx') ? templateBase64 : undefined,
      templateXlsxBase64: id.endsWith('-xlsx') ? templateBase64 : undefined,
    };

    res.json(payload);
  } catch (err) {
    next(err);
  }
});

export default router;
