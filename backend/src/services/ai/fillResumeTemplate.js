import OpenAI from 'openai';
import { config } from '../../config/index.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

const SYSTEM_PROMPT = `You fill a Japanese resume (履歴書) template. The output MUST look exactly like the template with only the data inserted.

CRITICAL RULES:
1. Preserve the template HTML exactly: same tags, same structure, same table layout, same classes and styles. Do NOT add or remove sections, tables, or rewrite the document.
2. Only change the CONTENT (text or inner HTML) of cells or elements that correspond to form fields. Find the label in the template (e.g. 氏名, ふりがな, アルファベット表記, 生年月日, 現住所, 電話, 本国住所, 国籍, 学歴, 職歴, 得意な科目・分野, 趣味・特技, 自己紹介書) and put the form value in the adjacent or corresponding data cell. Replace only that cell's content, keep the surrounding <td>, <p>, etc. tags unchanged.
3. Mapping: 氏名→name, ふりがな→furigana, アルファベット表記→name_english, 生年月日→birthdate, 現住所→current_address, 電話→phone, 本国住所→home_address, 国籍→nationality, 学歴→education, 職歴→experience, 得意な科目・分野→strong_subjects, 趣味・特技→hobbies_skills, 自己紹介書→self_intro.
4. For the photo area (写真, 写真貼付欄): if a photo data URL is provided, replace the content of that cell with a single <img> tag: <img src="DATA_URL" style="max-width:40mm;max-height:30mm;object-fit:contain;" alt="">. Keep the cell wrapper (<td> etc.) as in the template.
5. Escape user text for HTML (e.g. < → &lt;, & → &amp;) when inserting into the template.
6. Return ONLY the complete filled HTML. No markdown, no \`\`\` wrapper, no explanation. The result must be valid HTML that could replace the original template body.`;

export async function fillResumeTemplate(templateHtml, formData, avatarBase64) {
  const userContent = [
    `Template HTML (preserve this structure exactly; only fill in the data cells):\n${templateHtml.slice(0, 80000)}`,
    `Form data (use these values):\n${JSON.stringify(formData)}`,
  ];
  if (avatarBase64 && typeof avatarBase64 === 'string' && avatarBase64.startsWith('data:image')) {
    userContent.push(`Photo (insert this data URL in the 写真/写真貼付欄 cell as <img src="...">):\n${avatarBase64.slice(0, 50000)}`);
  }
  userContent.push('Return the complete filled HTML only, with the same structure as the template.');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent.join('\n\n---\n\n') },
    ],
    temperature: 0.1,
    max_tokens: 16000,
  });
  const html = completion.choices[0]?.message?.content;
  if (!html) throw new Error('No HTML from AI');
  return html.trim().replace(/^```html?\s*|\s*```$/g, '');
}
