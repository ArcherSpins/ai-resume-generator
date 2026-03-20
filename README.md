# AI Resume Builder — MVP

Production-ready MVP: Google auth, upload sample resume (PDF/DOCX), AI-generated form schema, dynamic form, PDF generation, email delivery, history.

## Stack

- **Frontend:** React (Vite) + TailwindCSS  
- **Backend:** Node.js (Express)  
- **Database:** PostgreSQL (Prisma)  
- **Auth:** Google OAuth  
- **AI:** OpenAI API  
- **PDF:** Puppeteer  
- **Email:** Nodemailer (SMTP)

## Quick start

### 1. Database

Create a PostgreSQL database and set its URL in backend env:

```bash
# Example: createdb ai_resume
# DATABASE_URL=postgresql://user:password@localhost:5432/ai_resume
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: DATABASE_URL, GOOGLE_*, OPENAI_API_KEY, SESSION_SECRET, optional SMTP_*
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Runs at **http://localhost:4000**.

### 3. Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.  
2. Create OAuth 2.0 Client ID (Web application).  
3. Authorized redirect URI: `http://localhost:4000/auth/google/callback`  
4. Put Client ID and Client Secret in backend `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

### 4. Frontend

```bash
cd frontend
cp .env.example .env
# Optional: set VITE_API_URL=http://localhost:4000 (default for dev proxy is same origin; for cookie auth use backend URL)
npm install
npm run dev
```

Runs at **http://localhost:5173**.

### 5. Use the app

1. Open **http://localhost:5173** (or **http://localhost:4000** if you use backend URL for API).  
2. Click **Continue with Google** (redirects to backend, then back to dashboard).  
3. **Create Resume** → upload a PDF/DOCX sample → AI returns schema → fill form → **Generate Resume**.  
4. PDF is saved and (if SMTP is set) emailed.  
5. **History** lists resumes with Preview and Edit.

### Storage: S3 (optional)

If you set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `S3_BUCKET` in backend `.env`, uploads and generated PDFs are stored in S3 instead of local disk. Preview links in History become time-limited signed URLs. Create a bucket in [AWS S3](https://console.aws.amazon.com/s3/), create an IAM user with `s3:PutObject`, `s3:GetObject` on that bucket, and put its keys in `.env`.

## Env reference

**Backend (`.env`):**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Server port (default 4000) |
| `BACKEND_URL` | Full backend URL for OAuth callback (e.g. `http://localhost:4000`) |
| `FRONTEND_URL` | Frontend origin for CORS and post-login redirect (e.g. `http://localhost:5173`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `SESSION_SECRET` | Long random string for session signing |
| `OPENAI_API_KEY` | OpenAI API key |
| `SMTP_*` | Nodemailer (optional; omit to skip email) |
| `UPLOAD_DIR` | Dir for uploaded samples when not using S3 (default `./uploads`) |
| `RESUMES_DIR` | Dir for generated PDFs when not using S3 (default `./resumes`) |
| `AWS_REGION` | AWS region for S3 (e.g. `us-east-1`) |
| `AWS_ACCESS_KEY_ID` | AWS access key (for S3) |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key (for S3) |
| `S3_BUCKET` | S3 bucket name. If set with AWS credentials, uploads and PDFs go to S3 instead of local disk |
| `S3_RESUMES_PREFIX` | S3 key prefix for generated PDFs (default `resumes`) |
| `S3_UPLOADS_PREFIX` | S3 key prefix for uploaded samples (default `uploads`) |

**Frontend (`.env`):**

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL (e.g. `http://localhost:4000`) so auth cookie is sent with API requests |

## Project structure

```
frontend/
  src/
    components/   # Modal, FileDropzone, DynamicForm
    pages/        # Auth, CreateResume, History
    services/     # api, auth
backend/
  prisma/
    schema.prisma
  src/
    config/
    controllers/
    middleware/
    routes/
    services/
      ai/         # schemaFromResume, generateResumeHtml
    utils/
```

## API (backend)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/auth/google` | Redirect to Google sign-in |
| GET | `/auth/google/callback` | OAuth callback; redirects to frontend dashboard |
| POST | `/auth/logout` | Log out |
| GET | `/user` | Current user (requires auth) |
| POST | `/upload-sample` | Upload PDF/DOCX; returns AI schema (requires auth) |
| POST | `/generate-resume` | Body: `{ schema, data }`; creates PDF, saves, emails (requires auth) |
| GET | `/history` | List user's resumes |
| GET | `/history/:id` | One resume (schema + data) |
| PUT | `/history/:id` | Update schema/data |
| GET | `/resumes/:filename` | Static PDF file |

## Run locally (summary)

1. PostgreSQL + `DATABASE_URL` in backend `.env`.  
2. Google OAuth credentials + `BACKEND_URL` + redirect URI.  
3. `OPENAI_API_KEY` in backend `.env`.  
4. Backend: `npm install && npx prisma generate && npx prisma db push && npm run dev`.  
5. Frontend: `npm install && npm run dev`.  
6. Open frontend URL, sign in with Google, create resume.
