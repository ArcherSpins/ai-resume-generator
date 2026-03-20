import OpenAI from 'openai';
import { config } from '../../config/index.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

const SYSTEM_PROMPT = `You are an expert at Japanese resume (履歴書・職務経歴書) templates.

You receive TEXT (and optionally HTML) extracted from a template.
Detect which standard fields are present and return a JSON schema for a form.

━━━ STANDARD FIELDS ━━━

Personal / Contact:
  name          氏名
  furigana      ふりがな / フリガナ
  name_english  アルファベット表記 / アルファベット氏名
  birthdate     生年月日
  gender        性別
  nationality   国籍 / 本籍地
  current_address 現住所
  phone         電話 / TEL / 携帯
  email         メールアドレス / E-mail
  contact_address 連絡先
  home_address  本国住所

Other free-text:
  strong_subjects 得意な科目・分野
  hobbies_skills  趣味・特技
  self_pr         特技・自己PR / 自己PR
  self_intro      自己紹介書
  motivation      志望動機
  preferences     本人希望

━━━ SECTION RULES ━━━

1. Return ONLY valid JSON — no markdown fences, no comments.
2. Schema shape:
{
  "avatarRequired": boolean,
  "sections": [
    {
      "type": string,
      "label": string,
      "fields": [ { "name": string, "type": "text"|"date"|"textarea" } ]
    }
  ]
}

3. Section types:

  "personal"   → fields: name, furigana, name_english, birthdate, gender,
                          nationality, current_address, phone, email,
                          contact_address, home_address
                 (include only the ones present in the template)
                 Field types: birthdate → "date"; everything else → "text"

  "education"  → For 履歴書 (table with 年/月 columns): use year, month, description (repeatable).
                 For 職務経歴書 (キャリアサマリー, 導入部, 経験, 学歴): use single textarea {name:"education",type:"textarea"}.

  "experience" → Same: 履歴書 → year/month/description repeatable; 職務経歴書 → single textarea {name:"experience",type:"textarea"}.

  "licenses"   → Same: 履歴書 → year/month/description repeatable; 職務経歴書 → single textarea {name:"licenses",type:"textarea"}.

  "other"      → fields: strong_subjects, hobbies_skills, self_pr, self_intro,
                          motivation, preferences
                 For 職務経歴書 also include: self_intro (導入部), licenses (技術的スキル), experience (経験), education (学歴), hobbies_skills (趣味).
                 (include only the ones present; all "textarea" type)

4. 職務経歴書 detection: if you see キャリアサマリー, 導入部, 技術的スキル, 経験, 学歴, 趣味 — use textarea for experience, education, licenses (not year/month/description).
5. Include a section ONLY if its label/content appears in the template.
6. Photo: if a photo area appears (写真, 証明写真, 写真をはる位置, etc.) set "avatarRequired": true.
7. Order sections as: personal → education → experience → licenses → other.`;

export async function generateSchemaFromResumeText(resumeText, templateHtmlSnippet = '') {
  if (!resumeText || resumeText.trim().length < 5) {
    throw new Error('Template text is too short to analyze');
  }
  const userContent = templateHtmlSnippet
    ? `Template text:\n${resumeText.slice(0, 8000)}\n\nTemplate HTML/data (first 3000 chars):\n${templateHtmlSnippet.slice(0, 3000)}`
    : `Template text:\n${resumeText.slice(0, 12000)}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });
  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('No response from AI');
  try {
    const schema = JSON.parse(raw);
    if (!schema.sections || !Array.isArray(schema.sections)) schema.sections = [];
    if (typeof schema.avatarRequired !== 'boolean') schema.avatarRequired = true;
    return schema;
  } catch {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error('Invalid JSON from AI');
  }
}
