import { Router } from 'express';
import path from 'path';
import { randomBytes } from 'crypto';
import { requireAuth } from '../middleware/auth.js';
import { fillDocxTemplate } from '../utils/fillDocxTemplate.js';
import { fillXlsxTemplate } from '../utils/fillXlsxTemplate.js';
import { fillAnnotatedTemplate } from '../utils/fillAnnotatedTemplate.js';
import { generateJapaneseResumeHtml } from '../utils/generateJapaneseResumeHtml.js';
import { htmlToPdfBuffer, saveBuffer, getRelativePath } from '../services/pdfService.js';
import { sendResumeEmail } from '../services/emailService.js';
import { prisma } from '../utils/prisma.js';
import {
  isS3Configured,
  uploadBuffer,
  getSignedUrlForKey,
} from '../services/s3Service.js';
import { config } from '../config/index.js';

const router = Router();
const DEFAULT_TEMPLATE_CREDITS = 10;
const DEFAULT_VOICE_CREDITS = 5;

/**
 * Collect all keys of the form `prefix` or `prefix_N` from data,
 * sorted numerically, and return their values as an ordered array.
 */
function collectEntries(data, prefix) {
  const keys = Object.keys(data)
    .filter((k) => k === prefix || k.startsWith(`${prefix}_`))
    .sort((a, b) => {
      if (a === prefix) return -1;
      if (b === prefix) return 1;
      return String(a).localeCompare(String(b), undefined, { numeric: true });
    });
  return keys.map((k) => data[k]).filter((v) => v && typeof v === 'object');
}

/**
 * Flatten nested form data into a flat object.
 *
 * Sections whose type is "education", "experience", or "licenses" become
 * typed entry arrays (educationEntries, experienceEntries, licensesEntries)
 * instead of being merged into the flat map — this preserves per-row year/month/description.
 *
 * All other sections are merged flat: { personal: { name: 'X' } } → { name: 'X' }
 */
const ENTRY_SECTIONS = ['education', 'experience', 'licenses'];

function flattenFormData(data) {
  if (!data || typeof data !== 'object') return {};
  const flat = {};

  for (const [key, val] of Object.entries(data)) {
    if (!val || typeof val !== 'object' || Array.isArray(val)) continue;
    const isEntrySection = ENTRY_SECTIONS.some(
      (t) => key === t || key.startsWith(`${t}_`),
    );
    if (isEntrySection) continue;
    Object.assign(flat, val);
  }

  const toEntries = (arr, fallback) =>
    Array.isArray(arr) && arr.length > 0 && arr.every((e) => e && typeof e === 'object')
      ? arr
      : fallback;
  flat.educationEntries = toEntries(data.education, collectEntries(data, 'education'));
  flat.experienceEntries = toEntries(data.experience, collectEntries(data, 'experience'));
  flat.licensesEntries = toEntries(data.licenses, collectEntries(data, 'licenses'));

  delete flat.avatarBase64;
  delete flat.avatar;
  return flat;
}

async function storeFile(buffer, filename, mimeType, userId) {
  if (isS3Configured()) {
    const key = `${config.s3.resumesPrefix}/${userId}/${filename}`;
    await uploadBuffer(buffer, key, mimeType);
    const publicUrl = await getSignedUrlForKey(key, 3600);
    return { storagePath: key, publicUrl };
  }
  const fullPath = saveBuffer(buffer, filename);
  const rel = getRelativePath(fullPath);
  return { storagePath: rel, publicUrl: `/resumes/${path.basename(fullPath)}` };
}

async function getUserCredits(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { templateCredits: true, voiceCredits: true },
  });
  if (!user) return null;
  return {
    templateCredits:
      typeof user.templateCredits === 'number' ? user.templateCredits : DEFAULT_TEMPLATE_CREDITS,
    voiceCredits:
      typeof user.voiceCredits === 'number' ? user.voiceCredits : DEFAULT_VOICE_CREDITS,
  };
}

async function consumeCredit(db, userId, generationMode) {
  if (generationMode === 'voice') {
    const result = await db.user.updateMany({
      where: { id: userId, voiceCredits: { gt: 0 } },
      data: { voiceCredits: { decrement: 1 } },
    });
    return result.count > 0;
  }
  const result = await db.user.updateMany({
    where: { id: userId, templateCredits: { gt: 0 } },
    data: { templateCredits: { decrement: 1 } },
  });
  return result.count > 0;
}

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { schema, data } = req.body;
    const avatarBase64 = req.body.avatarBase64 || data?.avatarBase64;
    const generationMode = req.body.generationMode === 'voice' ? 'voice' : 'template';

    if (!schema || !data) {
      return res.status(400).json({ error: 'schema and data required' });
    }

    const credits = await getUserCredits(req.user.id);
    if (!credits) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (generationMode === 'voice' && credits.voiceCredits <= 0) {
      return res.status(403).json({
        error: 'Voice resume limit reached (0 remaining).',
        code: 'VOICE_LIMIT_REACHED',
        limit: 0,
      });
    }
    if (generationMode === 'template' && credits.templateCredits <= 0) {
      return res.status(403).json({
        error: 'Template resume limit reached (0 remaining).',
        code: 'TEMPLATE_LIMIT_REACHED',
        limit: 0,
      });
    }

    const flatData = flattenFormData(data);
    if (flatData.birthdate && /^\d{4}-\d{2}-\d{2}$/.test(flatData.birthdate)) {
      const [y, m, d] = flatData.birthdate.split('-');
      flatData.birthdate = `${y}年${parseInt(m, 10)}月${parseInt(d, 10)}日`;
    }

    const annotatedDocxBase64 =
      req.body.annotatedDocxBase64 || schema.annotatedDocxBase64 || null;
    const templateXlsxBase64 =
      req.body.templateXlsxBase64 || schema.templateXlsxBase64 || null;
    const annotatedTemplateHtml =
      req.body.annotatedTemplateHtml || schema.annotatedTemplateHtml || null;
    const voicePreviewHtml =
      req.body.previewHtml || schema.previewHtml || schema.annotatedTemplateHtml || null;

    let html;
    let nativeBuffer = null;
    let nativeExt = null;

    if (generationMode === 'voice' && voicePreviewHtml) {
      html = voicePreviewHtml;
    } else if (annotatedDocxBase64) {
      const result = await fillDocxTemplate(annotatedDocxBase64, flatData, avatarBase64 || null);
      html = result.html;
      // For DOCX templates we now keep PDF as the canonical output,
      // because avatar rendering is guaranteed in HTML/PDF pipeline.
      nativeBuffer = null;
      nativeExt = null;
    } else if (templateXlsxBase64) {
      const result = await fillXlsxTemplate(templateXlsxBase64, flatData, avatarBase64 || null);
      html = result.html;
      nativeBuffer = result.xlsxBuffer;
      nativeExt = 'xlsx';
    } else if (annotatedTemplateHtml) {
      html = fillAnnotatedTemplate(annotatedTemplateHtml, flatData, avatarBase64 || null);
    } else {
      html = generateJapaneseResumeHtml(flatData, avatarBase64 || null);
    }

    const pdfBuffer = await htmlToPdfBuffer(html);

    const base = `resume-${req.user.id}-${Date.now()}-${randomBytes(4).toString('hex')}`;
    const generatedFiles = {};
    const generatedUrls = {};

    const pdf = await storeFile(pdfBuffer, `${base}.pdf`, 'application/pdf', req.user.id);
    generatedFiles.pdf = pdf.storagePath;
    generatedUrls.pdf = pdf.publicUrl;

    if (nativeBuffer && nativeExt) {
      const mime =
        nativeExt === 'docx'
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const native = await storeFile(nativeBuffer, `${base}.${nativeExt}`, mime, req.user.id);
      generatedFiles[nativeExt] = native.storagePath;
      generatedUrls[nativeExt] = native.publicUrl;
    }

    const schemaToStore = { ...schema };
    if (generationMode !== 'voice') {
      if (annotatedDocxBase64 && !schemaToStore.annotatedDocxBase64)
        schemaToStore.annotatedDocxBase64 = annotatedDocxBase64;
      if (templateXlsxBase64 && !schemaToStore.templateXlsxBase64)
        schemaToStore.templateXlsxBase64 = templateXlsxBase64;
    } else {
      delete schemaToStore.annotatedDocxBase64;
      delete schemaToStore.templateXlsxBase64;
      schemaToStore.previewHtml = voicePreviewHtml;
    }
    schemaToStore.generationMode = generationMode;
    schemaToStore.generatedFiles = generatedFiles;

    const resume = await prisma.$transaction(async (tx) => {
      const consumed = await consumeCredit(tx, req.user.id, generationMode);
      if (!consumed) {
        const err = new Error(
          generationMode === 'voice'
            ? 'Voice resume limit reached (0 remaining).'
            : 'Template resume limit reached (0 remaining).'
        );
        err.status = 403;
        err.code = generationMode === 'voice' ? 'VOICE_LIMIT_REACHED' : 'TEMPLATE_LIMIT_REACHED';
        throw err;
      }
      return tx.resume.create({
        data: {
          userId: req.user.id,
          schema: schemaToStore,
          data,
          filePath: generatedFiles.pdf,
        },
      });
    });

    try {
      const attachPath = generationMode !== 'voice' && nativeBuffer && nativeExt
        ? generatedFiles[nativeExt]
        : generatedFiles.pdf;
      const attachName = generationMode !== 'voice' && nativeBuffer && nativeExt
        ? `resume.${nativeExt}`
        : 'resume.pdf';
      await sendResumeEmail(req.user.email, attachPath, attachName, req.user.name);
    } catch (emailErr) {
      console.error('Email send failed:', emailErr);
    }

    res.json({
      id: resume.id,
      filePath: generatedUrls.pdf,
      generatedFiles: generatedUrls,
      createdAt: resume.createdAt,
    });
  } catch (err) {
    if (err?.code === 'VOICE_LIMIT_REACHED' || err?.code === 'TEMPLATE_LIMIT_REACHED') {
      return res.status(err.status || 403).json({
        error: err.message,
        code: err.code,
        limit: 0,
      });
    }
    next(err);
  }
});

export default router;
