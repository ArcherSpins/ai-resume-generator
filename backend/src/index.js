import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { setupPassport } from './utils/passport.js';
import { ensureDirs } from './utils/ensureDirs.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import uploadRoutes from './routes/upload.js';
import resumeRoutes from './routes/resume.js';
import historyRoutes from './routes/history.js';
import templatesRoutes from './routes/templates.js';
import postalCodeRoutes from './routes/postalCode.js';
import voiceToResumeRoutes from './routes/voiceToResume.js';
import apiDocsRoutes from './routes/apiDocs.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

ensureDirs();
app.set('trust proxy', 1);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const normalized = String(origin).replace(/\/$/, '');
      const allowed = config.frontendUrls || [config.frontendUrl];
      const isAllowed =
        allowed.includes(normalized) ||
        /^https:\/\/.*\.vercel\.app$/i.test(normalized);
      if (isAllowed) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '25mb' }));
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.nodeEnv === 'production',
      sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

setupPassport(app);

app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/upload-sample', uploadRoutes);
app.use('/generate-resume', resumeRoutes);
app.use('/history', historyRoutes);
app.use('/templates', templatesRoutes);
app.use('/postal-code', postalCodeRoutes);
app.use('/voice-to-resume', voiceToResumeRoutes);
app.use('/api-docs', apiDocsRoutes);

app.use('/resumes', express.static(path.join(__dirname, '..', config.resumesDir)));

app.get('/health', (_, res) => res.json({ ok: true }));

app.get('/auth/callback-url', (_, res) => {
  const url = `${config.backendUrl}/auth/google/callback`;
  res.json({ callbackUrl: url, hint: 'Add this EXACT URL to Google Cloud Console → Credentials → Your OAuth client → Authorized redirect URIs' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

const googleCallbackUrl = `${config.backendUrl}/auth/google/callback`;
app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
  console.log(`API docs: http://localhost:${config.port}/api-docs`);
  console.log(`Google OAuth callback URL (copy to Google Console → Authorized redirect URIs):`);
  console.log(`  ${googleCallbackUrl}`);
});
