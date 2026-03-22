import { Router } from 'express';
import multer from 'multer';
import OpenAI, { toFile } from 'openai';
import { config } from '../config/index.js';
import { requireAuth } from '../middleware/auth.js';
import { getSchema } from '../data/templateSchemas.js';
import { TEMPLATE_IDS } from '../data/templateList.js';
import { generateJapaneseResumeHtml } from '../utils/generateJapaneseResumeHtml.js';
import {
  WHISPER_PROMPT_HINT,
  normalizeTranscriptForExtraction,
  normalizeEmailField,
  formatJapanPhoneDisplay,
} from '../utils/voiceNormalization.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } }); // 25 MB

function safeJsonParse(text) {
  if (!text || typeof text !== 'string') return null;
  try {
    return JSON.parse(text);
  } catch (_) {
    // Try to extract the first JSON object
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch (_) {}
    }
    return null;
  }
}

function toIsoDateMaybe(val) {
  const s = String(val ?? '').trim();
  if (!s) return '';
  // already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // common JP formats: YYYY年M月D日 / YYYY/MM/DD / YYYY.M.D
  const m = s.match(/(\d{4})\D(\d{1,2})\D(\d{1,2})/);
  if (!m) return '';
  const y = m[1];
  const mm = String(m[2]).padStart(2, '0');
  const dd = String(m[3]).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

function normalizeEntries(arr, max = 12) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((e) => ({
      year: String(e?.year ?? '').trim(),
      month: String(e?.month ?? '').trim(),
      description: String(e?.description ?? '').trim(),
    }))
    .filter((e) => e.year || e.month || e.description)
    .slice(0, max);
}

function buildFormDataFromExtract(extract) {
  const personal = extract?.personal && typeof extract.personal === 'object' ? extract.personal : {};
  const other = extract?.other && typeof extract.other === 'object' ? extract.other : {};
  const otherAny = extract?.other || {};
  const selfPrRaw =
    other.self_pr ??
    other.selfPR ??
    other.jikoPR ??
    other['自己PR'] ??
    otherAny.self_pr ??
    otherAny.selfPR ??
    otherAny.jikoPR ??
    '';
  const familyName = String(personal.family_name ?? '').trim();
  const givenName = String(personal.given_name ?? '').trim();
  const fullName = String(personal.full_name ?? '').trim();
  const name = String(personal.name ?? '').trim() || fullName || [familyName, givenName].filter(Boolean).join(' ');
  return {
    avatarBase64: typeof extract?.avatarBase64 === 'string' ? extract.avatarBase64 : undefined,
    personal: {
      name,
      furigana: String(personal.furigana ?? '').trim(),
      name_english: String(personal.name_english ?? '').trim(),
      birthdate: toIsoDateMaybe(personal.birthdate),
      age: String(personal.age ?? '').trim(),
      gender: String(personal.gender ?? '').trim(),
      nationality: String(personal.nationality ?? '').trim(),
      postal_code: String(personal.postal_code ?? '').trim(),
      current_address: String(personal.current_address ?? '').trim(),
      phone: String(personal.phone ?? '').trim(),
      email: String(personal.email ?? '').trim(),
      contact_address: String(personal.contact_address ?? '').trim(),
    },
    education: normalizeEntries(extract?.educationEntries || extract?.education),
    experience: normalizeEntries(extract?.experienceEntries || extract?.experience),
    licenses: normalizeEntries(extract?.licensesEntries || extract?.licenses),
    other: {
      motivation: String(other.motivation ?? '').trim(),
      self_pr: String(selfPrRaw ?? '').trim(),
      preferences: String(other.preferences ?? '').trim(),
    },
  };
}

function blankVoiceFormData() {
  return {
    personal: {
      name: '',
      furigana: '',
      name_english: '',
      birthdate: '',
      age: '',
      gender: '',
      nationality: '',
      postal_code: '',
      current_address: '',
      phone: '',
      email: '',
      contact_address: '',
    },
    education: [],
    experience: [],
    licenses: [],
    other: {
      motivation: '',
      self_pr: '',
      preferences: '',
    },
  };
}

function collectEntries(data, prefix) {
  const keys = Object.keys(data || {})
    .filter((k) => k === prefix || k.startsWith(`${prefix}_`))
    .sort((a, b) => {
      if (a === prefix) return -1;
      if (b === prefix) return 1;
      return String(a).localeCompare(String(b), undefined, { numeric: true });
    });
  return keys.map((k) => data[k]).filter((v) => v && typeof v === 'object');
}

function formatEntries(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return '';
  return entries
    .map((e) => {
      const year = String(e?.year ?? '').trim();
      const month = String(e?.month ?? '').trim();
      const desc = String(e?.description ?? '').trim();
      if (!year && !month && !desc) return null;
      const datePrefix = year || month ? `${year}年${month}月　` : '';
      return `${datePrefix}${desc}`;
    })
    .filter(Boolean)
    .join('\n');
}

function flattenForHtml(data) {
  if (!data || typeof data !== 'object') return {};
  const flat = {};
  const entrySections = ['education', 'experience', 'licenses'];
  for (const [key, val] of Object.entries(data)) {
    if (!val || typeof val !== 'object' || Array.isArray(val)) continue;
    if (entrySections.some((t) => key === t || key.startsWith(`${t}_`))) continue;
    Object.assign(flat, val);
  }
  const toEntries = (arr, fallback) =>
    Array.isArray(arr) && arr.length > 0 && arr.every((e) => e && typeof e === 'object') ? arr : fallback;
  flat.educationEntries = toEntries(data.education, collectEntries(data, 'education'));
  flat.experienceEntries = toEntries(data.experience, collectEntries(data, 'experience'));
  flat.licensesEntries = toEntries(data.licenses, collectEntries(data, 'licenses'));
  return {
    ...flat,
    education: formatEntries(flat.educationEntries),
    experience: formatEntries(flat.experienceEntries),
    licenses: formatEntries(flat.licensesEntries),
  };
}

async function transcribeAudio(fileBuffer, mimeType = 'audio/webm', originalName = 'audio.webm') {
  if (!config.openai?.apiKey || !fileBuffer?.length) return '';
  try {
    const openai = new OpenAI({ apiKey: config.openai.apiKey });
    const ext = originalName.split('.').pop() || (mimeType?.includes('mp4') ? 'm4a' : 'webm');
    const filename = `audio.${ext}`;
    const file = await toFile(fileBuffer, filename, { type: mimeType });
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      prompt: WHISPER_PROMPT_HINT,
    });
    return transcription?.text?.trim() || '';
  } catch (err) {
    console.warn('[voiceToResume] Whisper transcription failed:', err?.message);
    return '';
  }
}

async function polishSelfPrJapanese(selfPrDraft, fullTranscript) {
  const raw = String(selfPrDraft ?? '').trim();
  if (!raw || !config.openai?.apiKey) return raw;
  try {
    const openai = new OpenAI({ apiKey: config.openai.apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `あなたは日本の履歴書向けのキャリアアドバイザーです。
ユーザーが話した内容「だけ」を素材に、履歴書の「自己PR」欄にそのまま使える文章に整えます。

必須:
- です・ます調で統一。ビジネス向けの落ち着いた日本語。
- 話にない実績・資格・数値は追加しない。言及されたスキル・経験を、自然な日本語で具体化・言い換えしてよい（例: 「React が分かる」→「React を用いた開発経験があり、実務でも活用した」程度）。
- 技術名・サービス名は正しい表記（React, TypeScript, AWS など）。
- 2～5 文程度、読みやすい段落。長すぎない（目安 300～600 文字、話が短ければ短くてよい）。
- 出力は本文のみ。見出し、「自己PR:」、JSON、箇条書き記号は付けない。`,
        },
        {
          role: 'user',
          content: `【抽出された自己PRドラフト】\n${raw}\n\n【会話全文の参考（文脈補足）】\n${String(fullTranscript).slice(0, 4500)}`,
        },
      ],
      temperature: 0.35,
    });
    const out = completion?.choices?.[0]?.message?.content?.trim();
    return out || raw;
  } catch (e) {
    console.warn('[voiceToResume] polishSelfPrJapanese failed:', e?.message);
    return raw;
  }
}

async function extractFieldsFromTranscript(transcript) {
  if (!config.openai?.apiKey) return null;
  const t = String(transcript ?? '').trim();
  if (!t) return null;
  const openai = new OpenAI({ apiKey: config.openai.apiKey });
  const prompt = `You extract resume fields for Japanese 履歴書 from free speech in ANY language.
Return ONLY valid JSON.

Critical rules:
- Input speech can be Russian/English/Japanese/other. Understand all languages.
- Normalize extracted final values to Japanese when possible.
- If person's name is spoken in Russian/Latin, convert full name to Katakana in personal.name.
- Put reading in personal.furigana in Katakana too when possible.
- DO NOT invent personal details. If not explicitly stated, output empty string.
- Keep full name in personal.name (family + given). Do not return only given name.
- If transcript includes family and given separately, combine into personal.name.
- self_pr (自己PR): when the user describes skills, strengths, experience, or "about me", put a concise raw summary in other.self_pr (1～3 short sentences in Japanese or mixed); a second step will rewrite it for style.

Email & phone (critical):
- email MUST use the ASCII @ character only. Never write Russian "собака/собачка" or the word "at" as text — always use @ (e.g. user@gmail.com).
- phone: Japanese mobile numbers — store digits in personal.phone; use Arabic digits. We will format later.

Format rules:
- birthdate should be ISO YYYY-MM-DD when possible.
- gender must be one of: 男, 女, その他.
- postal code format: 333-0854 if present.
- education/experience/licenses arrays: {year, month, description}, month as "1".."12".

Output JSON shape:
{
  "personal": {
    "name": "",
    "family_name": "",
    "given_name": "",
    "full_name": "",
    "furigana": "",
    "name_english": "",
    "birthdate": "",
    "age": "",
    "gender": "",
    "nationality": "",
    "postal_code": "",
    "current_address": "",
    "phone": "",
    "email": "",
    "contact_address": ""
  },
  "educationEntries": [ {"year":"","month":"","description":""} ],
  "experienceEntries": [ {"year":"","month":"","description":""} ],
  "licensesEntries": [ {"year":"","month":"","description":""} ],
  "other": {
    "motivation": "",
    "self_pr": "",
    "jikoPR": "",
    "preferences": ""
  }
}`;
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: `Transcript:\n${t}` },
    ],
    temperature: 0.2,
  });
  const text = completion?.choices?.[0]?.message?.content || '';
  return safeJsonParse(text);
}

function scrubInventedPersonalFields(transcript, formData) {
  const t = String(transcript ?? '').toLowerCase();
  const out = JSON.parse(JSON.stringify(formData || {}));
  const p = out.personal || {};

  const emailHint = /@|собач|собак|\bmail\b|почт|gmail|имейл|yahoo|icloud|outlook|hotmail|\bdot\b|точка/i.test(
    transcript,
  );
  if (p.email?.trim() && !emailHint) {
    p.email = '';
  }

  const phoneHint = /\d{3,}/.test(transcript) || /телефон|phone|номер|携帯|でんわ|電話/i.test(transcript);
  if (p.phone?.trim() && !phoneHint) {
    p.phone = '';
  }

  const postalHint =
    /〒|postal|zip|郵便|ゆうびん|почтов/i.test(transcript) || /\d{3}\s*[-ー－]?\s*\d{4}/.test(transcript);
  if (p.postal_code?.trim() && !postalHint) {
    p.postal_code = '';
  }

  out.personal = p;
  return out;
}

function buildPreviewHtml(formData, avatarBase64) {
  const flatForHtml = flattenForHtml(formData);
  return generateJapaneseResumeHtml(flatForHtml, avatarBase64 || formData?.avatarBase64 || null);
}

router.post(
  '/',
  requireAuth,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'avatar', maxCount: 1 },
  ]),
  async (req, res, next) => {
  try {
    let transcript = '';
    const audioFile = req.files?.audio?.[0];
    const avatarFile = req.files?.avatar?.[0];

    let avatarBase64 = null;
    if (avatarFile?.buffer) {
      const type = avatarFile.mimetype || 'image/png';
      const b64 = avatarFile.buffer.toString('base64');
      avatarBase64 = `data:${type};base64,${b64}`;
    }

    if (audioFile?.buffer) {
      const size = audioFile.buffer.length;
      const mimetype = audioFile.mimetype || 'audio/webm';
      const originalname = audioFile.originalname || 'audio.webm';
      if (size < 500) {
        console.warn('[voiceToResume] Audio file too small:', size, 'bytes — recording may be empty');
      } else {
        transcript = await transcribeAudio(audioFile.buffer, mimetype, originalname);
        transcript = normalizeTranscriptForExtraction(transcript);
        if (!transcript) console.warn('[voiceToResume] Whisper returned empty transcript (check OPENAI_API_KEY or audio format)');
      }
    } else {
      console.warn('[voiceToResume] No audio file in request (field name must be "audio")');
    }

    const templateId = TEMPLATE_IDS.VOICE_RIREKISHO_DOCX;
    const schema = getSchema(templateId);
    const formDataDefault = blankVoiceFormData();
    const { getTemplateBuffer } = await import('../data/defaultTemplates.js');
    const buffer = await getTemplateBuffer(templateId);
    if (!schema || !buffer) {
      return res.status(500).json({ error: 'Template not found' });
    }
    const extracted = transcript ? await extractFieldsFromTranscript(transcript) : null;
    const extractedForm = extracted ? buildFormDataFromExtract(extracted) : null;
    const formData = extractedForm
      ? {
          ...formDataDefault,
          ...extractedForm,
          personal: { ...formDataDefault.personal, ...(extractedForm.personal || {}) },
          other: { ...formDataDefault.other, ...(extractedForm.other || {}) },
        }
      : formDataDefault;
    const scrubbed = scrubInventedPersonalFields(transcript, formData);
    Object.assign(formData, scrubbed);

    if (formData.personal) {
      formData.personal.email = normalizeEmailField(formData.personal.email || '');
      const phoneMode = process.env.JAPAN_PHONE_DISPLAY === 'intl' ? 'intl' : 'domestic';
      formData.personal.phone = formatJapanPhoneDisplay(formData.personal.phone || '', phoneMode);
    }

    if (formData.other?.self_pr?.trim()) {
      formData.other.self_pr = await polishSelfPrJapanese(formData.other.self_pr, transcript);
    }

    if (avatarBase64) formData.avatarBase64 = avatarBase64;
    const previewHtml = buildPreviewHtml(formData, avatarBase64);

    const payload = {
      schema: {
        sections: schema.sections,
        avatarRequired: schema.avatarRequired !== false,
        annotatedTemplateHtml: previewHtml,
        generationMode: 'voice',
      },
      formData,
      previewHtml,
      transcript,
    };
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

router.post('/preview', requireAuth, async (req, res, next) => {
  try {
    const formData = req.body?.formData;
    if (!formData || typeof formData !== 'object') {
      return res.status(400).json({ error: 'formData required' });
    }
    const previewHtml = buildPreviewHtml(formData, req.body?.avatarBase64 || formData?.avatarBase64 || null);
    res.json({ previewHtml });
  } catch (err) {
    next(err);
  }
});

export default router;
