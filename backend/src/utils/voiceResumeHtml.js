/**
 * Voice-only HTML layouts (classic / modern / official two-page).
 */
import { generateJapaneseResumeHtml } from './generateJapaneseResumeHtml.js';
import { generateJapaneseResumeHtmlModern } from './generateJapaneseResumeHtmlModern.js';
import { generateJapaneseResumeHtmlOfficial } from './generateJapaneseResumeHtmlOfficial.js';

export const VOICE_HTML_LAYOUT_IDS = ['classic', 'modern', 'official'];

export function normalizeVoiceHtmlLayout(id) {
  const s = String(id ?? '').trim();
  return VOICE_HTML_LAYOUT_IDS.includes(s) ? s : 'classic';
}

export function generateVoiceResumeHtml(layoutId, flatData, avatar) {
  const id = normalizeVoiceHtmlLayout(layoutId);
  if (id === 'modern') return generateJapaneseResumeHtmlModern(flatData, avatar);
  if (id === 'official') return generateJapaneseResumeHtmlOfficial(flatData, avatar);
  return generateJapaneseResumeHtml(flatData, avatar);
}

/** Demo flat data for layout picker previews (no user data). */
export const VOICE_LAYOUT_DEMO_FLAT = {
  furigana: 'やまだ たろう',
  name: '山田 太郎',
  name_english: 'Taro Yamada',
  birthdate: '1994年5月12日生',
  age: '31歳',
  gender: '男',
  nationality: '日本',
  postal_code: '100-0001',
  current_address: '東京都千代田区千代田1-1-1',
  phone: '090 1234 5678',
  email: 'taro@example.com',
  contact_address: '',
  home_address: '',
  educationEntries: [
    { year: '2013', month: '4', description: '〇〇大学 経済学部 入学' },
    { year: '2017', month: '3', description: '同大学 卒業' },
  ],
  experienceEntries: [
    { year: '2017', month: '4', description: '株式会社サンプル 入社（営業職）' },
    { year: '2024', month: '12', description: '現在に至る' },
  ],
  licensesEntries: [{ year: '2022', month: '6', description: 'TOEIC 850点' }],
  education: '',
  experience: '',
  licenses: '',
  self_pr: 'チームワークを大切にし、顧客志向の提案力を活かして貴社の成長に貢献したいと考えております。',
  motivation: '学生時代よりマーケティングに関心を持ち、実務を通じてデジタル施策の企画・運用経験を積んでまいりました。',
  preferences: '貴社の規定に従います。',
  strength_points: '課題設定と仮説検証を素早く回せる点、関係者との調整力があります。',
  weakness_points: '細部へのこだわりが強く、スケジュール調整で時間を要することがあります。優先順位付けを意識して改善中です。',
  research_learning: '業務外でマーケティングオートメーションとPythonによるデータ分析を独学。社内勉強会で共有した経験があります。',
  hobbies_skills: '',
  strong_subjects: '',
  self_intro: '',
};

export function buildVoiceLayoutDemoHtml(layoutId) {
  return generateVoiceResumeHtml(layoutId, VOICE_LAYOUT_DEMO_FLAT, null);
}

export function buildAllVoiceLayoutDemos() {
  return {
    classic: buildVoiceLayoutDemoHtml('classic'),
    modern: buildVoiceLayoutDemoHtml('modern'),
    official: buildVoiceLayoutDemoHtml('official'),
  };
}
