import dotenv from 'dotenv';

dotenv.config();

const rawFrontendUrls = process.env.FRONTEND_URL || 'http://localhost:5173';
const frontendUrls = rawFrontendUrls
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean)
  .map((u) => u.replace(/\/$/, ''));

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: frontendUrls[0] || 'http://localhost:5173',
  frontendUrls,
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  sessionSecret: process.env.SESSION_SECRET || 'change-me-in-production',
  jwtSecret: process.env.JWT_SECRET || process.env.SESSION_SECRET || 'change-me-in-production',
  backendUrl: (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`).replace(/\/$/, ''),
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'AI Resume <noreply@example.com>',
  },
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  resumesDir: process.env.RESUMES_DIR || './resumes',

  s3: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: process.env.S3_BUCKET,
    resumesPrefix: process.env.S3_RESUMES_PREFIX || 'resumes',
    uploadsPrefix: process.env.S3_UPLOADS_PREFIX || 'uploads',
  },
};
