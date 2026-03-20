import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config/index.js';

let client = null;

function getClient() {
  if (!client) {
    if (!config.s3.accessKeyId || !config.s3.bucket) {
      throw new Error('S3 not configured: set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET');
    }
    client = new S3Client({
      region: config.s3.region,
      credentials: {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
      },
    });
  }
  return client;
}

export function isS3Configured() {
  return !!(config.s3.accessKeyId && config.s3.secretAccessKey && config.s3.bucket);
}

/** @param {string} key - S3 key (e.g. "resumes/userId/file.pdf") */
export function isS3Key(filePath) {
  if (!filePath || typeof filePath !== 'string') return false;
  const s = filePath.replace(/\\/g, '/');
  return !s.startsWith('/') && (s.startsWith('resumes/') || s.startsWith('uploads/'));
}

/**
 * Upload buffer to S3.
 * @param {Buffer} buffer
 * @param {string} key - full S3 key (e.g. "resumes/userId/filename.pdf")
 * @param {string} [contentType] - e.g. "application/pdf"
 * @returns {Promise<string>} key
 */
export async function uploadBuffer(buffer, key, contentType = 'application/pdf') {
  const s3 = getClient();
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: config.s3.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    },
  });
  await upload.done();
  return key;
}

/**
 * Get a signed URL for reading the object (e.g. for frontend preview).
 * @param {string} key - S3 key
 * @param {number} [expiresIn=3600] - seconds
 */
export async function getSignedUrlForKey(key, expiresIn = 3600) {
  const s3 = getClient();
  const command = new GetObjectCommand({ Bucket: config.s3.bucket, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Get readable stream of object (for email attachment).
 * @param {string} key - S3 key
 */
export async function getObjectStream(key) {
  const s3 = getClient();
  const response = await s3.send(
    new GetObjectCommand({ Bucket: config.s3.bucket, Key: key })
  );
  return response.Body;
}
