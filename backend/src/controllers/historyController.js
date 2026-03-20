import { prisma } from '../utils/prisma.js';
import path from 'path';
import { isS3Configured, isS3Key, getSignedUrlForKey } from '../services/s3Service.js';

async function filePathToUrl(filePath) {
  if (!filePath) return null;
  if (isS3Configured() && isS3Key(filePath)) {
    return getSignedUrlForKey(filePath, 3600);
  }
  return `/resumes/${path.basename(filePath)}`;
}

async function resolveGeneratedFiles(generatedFiles) {
  if (!generatedFiles || typeof generatedFiles !== 'object') return null;
  const resolved = {};
  for (const [fmt, p] of Object.entries(generatedFiles)) {
    resolved[fmt] = await filePathToUrl(p);
  }
  return resolved;
}

/**
 * Strip large binary fields (base64 template blobs) from a schema object.
 * These are only needed when editing a specific resume — not for the list view.
 */
function schemaForList(schema) {
  if (!schema || typeof schema !== 'object') return schema;
  const { annotatedDocxBase64, templateXlsxBase64, generatedFiles, ...rest } = schema;
  return rest;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /history?page=1&limit=10
// ─────────────────────────────────────────────────────────────────────────────
export async function getHistory(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    const [total, list] = await Promise.all([
      prisma.resume.count({ where: { userId: req.user.id } }),
      prisma.resume.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: { id: true, createdAt: true, filePath: true, schema: true, data: true },
      }),
    ]);

    const items = await Promise.all(
      list.map(async (r) => {
        const schema = r.schema ?? {};
        const generatedFiles = await resolveGeneratedFiles(schema.generatedFiles);
        return {
          id: r.id,
          createdAt: r.createdAt,
          filePath: await filePathToUrl(r.filePath),
          generatedFiles,
          // Strip large blobs from list response — fetched lazily on edit
          schema: schemaForList(schema),
          data: r.data,
        };
      }),
    );

    res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /history/:id  (full item — includes template blobs needed for editing)
// ─────────────────────────────────────────────────────────────────────────────
export async function getHistoryById(req, res, next) {
  try {
    const resume = await prisma.resume.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!resume) return res.status(404).json({ error: 'Not found' });

    const schema = resume.schema ?? {};
    const generatedFiles = await resolveGeneratedFiles(schema.generatedFiles);

    res.json({
      id: resume.id,
      createdAt: resume.createdAt,
      filePath: await filePathToUrl(resume.filePath),
      generatedFiles,
      schema: { ...schema, generatedFiles: undefined }, // full schema with template blobs
      data: resume.data,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /history/:id
// ─────────────────────────────────────────────────────────────────────────────
export async function updateHistoryById(req, res, next) {
  try {
    const { schema, data } = req.body;
    const resume = await prisma.resume.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!resume) return res.status(404).json({ error: 'Not found' });
    const updated = await prisma.resume.update({
      where: { id: req.params.id },
      data: {
        ...(schema != null && { schema }),
        ...(data != null && { data }),
      },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}
