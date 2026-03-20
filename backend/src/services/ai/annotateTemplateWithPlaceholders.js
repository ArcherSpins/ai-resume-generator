import OpenAI from 'openai';
import { config } from '../../config/index.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

const SYSTEM_PROMPT = `You annotate a Japanese resume (履歴書) template HTML by inserting placeholders where data should go.

RULES:
1. Keep the ENTIRE HTML structure exactly: every tag, table, class, style must stay the same. Only INSERT placeholder markers.
2. Use placeholders: {{name}}, {{furigana}}, {{name_english}}, {{birthdate}}, {{current_address}}, {{phone}}, {{home_address}}, {{nationality}}, {{education}}, {{experience}}, {{strong_subjects}}, {{hobbies_skills}}, {{self_intro}}, {{photo}}.
3. Find each label in the HTML (氏名, ふりがな, アルファベット表記, 生年月日, 現住所, 電話, 本国住所, 国籍, 学歴, 職歴, 得意な科目・分野, 趣味・特技, 自己紹介書, 写真/写真貼付欄). In the cell or element that holds the VALUE (next to the label), put the corresponding placeholder. For example: next to 氏名 put {{name}}, next to 写真 put {{photo}}.
4. If a cell is empty or has placeholder text, replace its content with the single placeholder like {{name}}. Keep the surrounding <td> or <p> tags.
5. Return the COMPLETE HTML with placeholders inserted. No markdown, no \`\`\`. Output must be valid HTML.`;

export async function annotateTemplateWithPlaceholders(templateHtml) {
  if (!templateHtml || typeof templateHtml !== 'string' || templateHtml.trim().length < 10) {
    return templateHtml;
  }
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Annotate this template HTML. Insert {{name}}, {{furigana}}, {{name_english}}, {{birthdate}}, {{current_address}}, {{phone}}, {{home_address}}, {{nationality}}, {{education}}, {{experience}}, {{strong_subjects}}, {{hobbies_skills}}, {{self_intro}}, {{photo}} in the correct cells. Keep structure identical.\n\n${templateHtml.slice(0, 60000)}` },
    ],
    temperature: 0.1,
    max_tokens: 16000,
  });
  const html = completion.choices[0]?.message?.content;
  if (!html || html.length < 50) return templateHtml;
  return html.trim().replace(/^```html?\s*|\s*```$/g, '');
}
