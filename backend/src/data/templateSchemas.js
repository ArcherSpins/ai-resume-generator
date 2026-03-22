/** Schemas + default demo data (no ExcelJS). */
import { TEMPLATE_IDS } from './templateList.js';

// ── Schema: 履歴書 (JIS) — table-based, repeatable education/experience/licenses ──
const RIREKISHO_SCHEMA = {
  avatarRequired: true,
  sections: [
    {
      type: 'personal',
      label: '個人情報',
      fields: [
        { name: 'name', type: 'text' },
        { name: 'furigana', type: 'text' },
        { name: 'name_english', type: 'text' },
        { name: 'birthdate', type: 'date' },
        { name: 'gender', type: 'select', options: ['男', '女', 'その他'] },
        { name: 'postal_code', type: 'postal_code' },
        { name: 'current_address', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'text' },
      ],
    },
    {
      type: 'education',
      label: '学歴',
      fields: [
        { name: 'year', type: 'text' },
        { name: 'month', type: 'text' },
        { name: 'description', type: 'text' },
      ],
    },
    {
      type: 'experience',
      label: '職歴',
      fields: [
        { name: 'year', type: 'text' },
        { name: 'month', type: 'text' },
        { name: 'description', type: 'text' },
      ],
    },
    {
      type: 'licenses',
      label: '免許・資格',
      fields: [
        { name: 'year', type: 'text' },
        { name: 'month', type: 'text' },
        { name: 'description', type: 'text' },
      ],
    },
    {
      type: 'other',
      label: 'その他',
      fields: [
        { name: 'motivation', type: 'textarea' },
        { name: 'self_pr', type: 'textarea' },
        { name: 'preferences', type: 'text' },
      ],
    },
  ],
};

// ── Schema: 履歴書 Full (with 連絡先, 年齢, 志望の動機・特技・アピール, 本人希望記入欄) ──
const RIREKISHO_FULL_SCHEMA = {
  avatarRequired: true,
  sections: [
    {
      type: 'personal',
      label: '個人情報',
      fields: [
        { name: 'name', type: 'text' },
        { name: 'furigana', type: 'text' },
        { name: 'name_english', type: 'text' },
        { name: 'birthdate', type: 'date' },
        { name: 'age', type: 'text' },
        { name: 'gender', type: 'select', options: ['男', '女', 'その他'] },
        { name: 'nationality', type: 'text' },
        { name: 'postal_code', type: 'postal_code' },
        { name: 'current_address', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'text' },
        { name: 'contact_address', type: 'text' },
      ],
    },
    { type: 'education', label: '学歴', fields: [{ name: 'year', type: 'text' }, { name: 'month', type: 'text' }, { name: 'description', type: 'text' }] },
    { type: 'experience', label: '職歴', fields: [{ name: 'year', type: 'text' }, { name: 'month', type: 'text' }, { name: 'description', type: 'text' }] },
    { type: 'licenses', label: '免許・資格', fields: [{ name: 'year', type: 'text' }, { name: 'month', type: 'text' }, { name: 'description', type: 'text' }] },
    {
      type: 'other',
      label: 'その他',
      fields: [
        { name: 'motivation', type: 'textarea' },
        { name: 'self_pr', type: 'textarea' },
        { name: 'strength_points', type: 'textarea' },
        { name: 'weakness_points', type: 'textarea' },
        { name: 'research_learning', type: 'textarea' },
        { name: 'preferences', type: 'textarea' },
      ],
    },
  ],
};

// ── Schema: 職務経歴書 — paragraph-style, textarea for education/experience/licenses ──
const SHOKUMU_SCHEMA = {
  avatarRequired: true,
  sections: [
    {
      type: 'personal',
      label: '連絡先',
      fields: [
        { name: 'name', type: 'text' },
        { name: 'email', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'postal_code', type: 'postal_code' },
        { name: 'current_address', type: 'text' },
      ],
    },
    {
      type: 'other',
      label: '職務経歴書',
      fields: [
        { name: 'self_intro', type: 'textarea' },
        { name: 'experience', type: 'textarea' },
        { name: 'education', type: 'textarea' },
        { name: 'licenses', type: 'textarea' },
        { name: 'hobbies_skills', type: 'textarea' },
      ],
    },
  ],
};

// ── Schema: 職務経歴書 with photo ──
const SHOKUMU_PHOTO_SCHEMA = {
  avatarRequired: true,
  sections: [
    { type: 'personal', label: '連絡先', fields: [{ name: 'name', type: 'text' }, { name: 'email', type: 'text' }, { name: 'phone', type: 'text' }, { name: 'postal_code', type: 'postal_code' }, { name: 'current_address', type: 'text' }] },
    { type: 'other', label: '職務経歴書', fields: [{ name: 'self_intro', type: 'textarea' }, { name: 'experience', type: 'textarea' }, { name: 'education', type: 'textarea' }, { name: 'licenses', type: 'textarea' }, { name: 'hobbies_skills', type: 'textarea' }] },
  ],
};

/** Default form data for 履歴書 (JIS) — 充実したサンプル（学歴・職歴・資格・志望動機） */
const RIREKISHO_DEFAULT_DATA = {
  personal: {
    name: 'Eric Turner',
    furigana: 'えりっく たーなー',
    name_english: 'Eric Turner',
    birthdate: '1989年12月4日生',
    gender: '男',
    current_address: '〒105-0011 東京都港区芝公園一丁目5番XX号',
    phone: '080-0000-0000',
    email: 'name@example.com',
  },
  education: [
    { year: '2008', month: '8', description: 'ピッツバーグ大学 コンピューター工学専攻 入学' },
    { year: '2009', month: '5', description: '2010年6月まで日本の○○大学で1年間日本語を習得するため語学留学' },
    { year: '2012', month: '12', description: 'ピッツバーグ大学 コンピューター工学専攻 卒業' },
  ],
  experience: [
    { year: '2012', month: '3', description: '株式会社インタラック 入社（契約社員）' },
    { year: '2014', month: '3', description: '株式会社インタラック 契約期間満了により退職' },
    { year: '2014', month: '7', description: 'Japan Dev株式会社にソフトウェアエンジニアとして入社（正社員）' },
    { year: '2017', month: '3', description: '転職のため、Japan Dev株式会社を退社' },
    { year: '2017', month: '4', description: '○○株式会社にソフトウェアエンジニアとして入社（正社員）' },
    { year: '2020', month: '7', description: '一身上の都合により退社' },
    { year: '2020', month: '12', description: 'フリーランスとして複数のアプリ開発プロジェクトに携わる' },
    { year: '2021', month: '11', description: '○○2株式会社にソフトウェアエンジニアとして入社（正社員）' },
    { year: '2022', month: '12', description: '業績を高く評価され、エンジニアマネージャーに昇進。現在に至る' },
  ],
  licenses: [
    { year: '2015', month: '12', description: '日本語能力試験1級取得' },
    { year: '2020', month: '12', description: '在留資格 永住者を取得（就労制限がありません。）' },
  ],
  other: {
    motivation:
      'フルスタックエンジニアとして7年以上の経験があり、Ruby・JavaScript・Goなどを使用した開発を担当してきました。現在はエンジニアマネージャーとして多様なチームを率いており、Scrum Master資格の取得も目指して学習中です。2015年に日本語能力試験N1を取得し、4年以上にわたり日本語で業務経験があるため、日英両言語でのコミュニケーションが可能です。',
    self_pr:
      'チームでの協調性を大切にし、技術選定からリリースまで一貫して携わってきました。エンジニアマネージャーとして採用・育成・プロジェクト推進の経験を活かし、貴社の開発体制強化に貢献したいと考えております。',
    preferences: '貴社の規定に従います。',
  },
};

/** Default form data for 履歴書 Full / Photo (with 連絡先, 年齢) — 充実サンプル */
const RIREKISHO_FULL_DEFAULT_DATA = {
  personal: {
    name: 'Eric Turner',
    furigana: 'えりっく たーなー',
    name_english: 'Eric Turner',
    birthdate: '1989年12月4日生',
    age: '33歳',
    gender: '男',
    nationality: 'アメリカ合衆国',
    current_address: '〒105-0011 東京都港区芝公園一丁目5番XX号',
    phone: '080-0000-0000',
    email: 'name@example.com',
    contact_address: '同上',
  },
  education: [
    { year: '2008', month: '8', description: 'ピッツバーグ大学 コンピューター工学専攻 入学' },
    { year: '2009', month: '5', description: '2010年6月まで日本の○○大学で1年間日本語を習得するため語学留学' },
    { year: '2012', month: '12', description: 'ピッツバーグ大学 コンピューター工学専攻 卒業' },
  ],
  experience: [
    { year: '2012', month: '3', description: '株式会社インタラック 入社（契約社員）' },
    { year: '2014', month: '3', description: '株式会社インタラック 契約期間満了により退職' },
    { year: '2014', month: '7', description: 'Japan Dev株式会社にソフトウェアエンジニアとして入社（正社員）' },
    { year: '2017', month: '3', description: '転職のため、Japan Dev株式会社を退社' },
    { year: '2017', month: '4', description: '○○株式会社にソフトウェアエンジニアとして入社（正社員）' },
    { year: '2020', month: '7', description: '一身上の都合により退社' },
    { year: '2020', month: '12', description: 'フリーランスとして複数のアプリ開発プロジェクトに携わる' },
    { year: '2021', month: '11', description: '○○2株式会社にソフトウェアエンジニアとして入社（正社員）' },
    { year: '2022', month: '12', description: '業績を高く評価され、エンジニアマネージャーに昇進。現在に至る' },
  ],
  licenses: [
    { year: '2015', month: '12', description: '日本語能力試験1級取得' },
    { year: '2020', month: '12', description: '在留資格 永住者を取得（就労制限がありません。）' },
  ],
  other: {
    motivation:
      'フルスタックエンジニアとして7年以上の経験があり、Ruby・JavaScript・Goなどを使用した開発を担当してきました。現在はエンジニアマネージャーとして多様なチームを率いており、Scrum Master資格の取得も目指して学習中です。2015年に日本語能力試験N1を取得し、4年以上にわたり日本語で業務経験があるため、日英両言語でのコミュニケーションが可能です。',
    self_pr:
      'チームでの協調性を大切にし、技術選定からリリースまで一貫して携わってきました。エンジニアマネージャーとして採用・育成・プロジェクト推進の経験を活かし、貴社の開発体制強化に貢献したいと考えております。',
    strength_points: '',
    weakness_points: '',
    research_learning: '',
    preferences: '貴社の規定に従います。',
  },
};

/** Default form data for Voice 履歴書 — EMPTY (no demo values) */
const VOICE_RIREKISHO_DEFAULT_DATA = {
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
    strength_points: '',
    weakness_points: '',
    research_learning: '',
    preferences: '',
  },
};

/** Default form data for 職務経歴書 — 充実サンプル（写真・経験・自己PR・学歴・資格） */
const SHOKUMU_DEFAULT_DATA = {
  personal: {
    name: 'Eric Turner',
    email: 'name@example.com',
    phone: '080-0000-0000',
    current_address: '〒105-0011 東京都港区芝公園一丁目5番XX号',
  },
  other: {
    self_intro:
      '米国ピッツバーグ大学コンピューター工学専攻卒業。フルスタックエンジニアとして7年以上の経験があり、Ruby・JavaScript・Goを用いたWebアプリケーション・API開発を担当。現在はエンジニアマネージャーとしてチームの採用・育成・プロジェクト推進を率いています。日本語能力試験N1取得（2015年）、4年以上の日本語での業務経験があり、日英両言語でのコミュニケーションが可能です。Scrum Master資格取得を目指し学習中。',
    experience:
      '2012年3月 株式会社インタラック 入社（契約社員）\n英語指導および社内システムのサポート業務に従事。\n\n2014年3月 株式会社インタラック 退職（契約期間満了）\n\n2014年7月 Japan Dev株式会社 入社（正社員）\nソフトウェアエンジニアとして、Ruby on Rails・JavaScriptを用いたWebアプリケーションの設計・開発・保守を担当。\n\n2017年3月 Japan Dev株式会社 退社（転職のため）\n\n2017年4月 ○○株式会社 入社（正社員）\nフルスタックエンジニアとして、新規サービス開発・既存システムのリファクタリングを担当。Goを用いたマイクロサービス開発にも参画。\n\n2020年7月 ○○株式会社 退社（一身上の都合）\n\n2020年12月 フリーランス\n複数のスタートアップでアプリ開発・技術相談に携わる。\n\n2021年11月 ○○2株式会社 入社（正社員）\nソフトウェアエンジニアとして参画。2022年12月、業績評価によりエンジニアマネージャーに昇進。現在に至る。',
    education:
      '2008年8月 ピッツバーグ大学 コンピューター工学専攻 入学\n2009年5月～2010年6月 日本の○○大学に語学留学（日本語習得）\n2012年12月 ピッツバーグ大学 コンピューター工学専攻 卒業',
    licenses:
      '2015年12月 日本語能力試験1級取得\n2020年12月 在留資格 永住者取得（就労制限なし）',
    hobbies_skills:
      '技術書・ビジネス書の読書、ランニング。オープンソースプロジェクトへのコントリビューション。',
  },
};

export function getSchema(templateId) {
  switch (templateId) {
    case TEMPLATE_IDS.RIREKISHO_JIS_DOCX:
    case TEMPLATE_IDS.RIREKISHO_JIS_XLSX:
      return JSON.parse(JSON.stringify(RIREKISHO_SCHEMA));
    case TEMPLATE_IDS.RIREKISHO_PHOTO_DOCX:
    case TEMPLATE_IDS.RIREKISHO_PHOTO_XLSX:
    case TEMPLATE_IDS.RIREKISHO_FULL_DOCX:
    case TEMPLATE_IDS.RIREKISHO_FULL_XLSX:
    case TEMPLATE_IDS.VOICE_RIREKISHO_DOCX:
      return JSON.parse(JSON.stringify(RIREKISHO_FULL_SCHEMA));
    case TEMPLATE_IDS.SHOKUMU_DOCX:
    case TEMPLATE_IDS.SHOKUMU_XLSX:
      return JSON.parse(JSON.stringify(SHOKUMU_SCHEMA));
    case TEMPLATE_IDS.SHOKUMU_PHOTO_DOCX:
    case TEMPLATE_IDS.SHOKUMU_PHOTO_XLSX:
      return JSON.parse(JSON.stringify(SHOKUMU_PHOTO_SCHEMA));
    default:
      return null;
  }
}

export function getDefaultData(templateId) {
  switch (templateId) {
    case TEMPLATE_IDS.RIREKISHO_JIS_DOCX:
    case TEMPLATE_IDS.RIREKISHO_JIS_XLSX:
      return JSON.parse(JSON.stringify(RIREKISHO_DEFAULT_DATA));
    case TEMPLATE_IDS.RIREKISHO_PHOTO_DOCX:
    case TEMPLATE_IDS.RIREKISHO_PHOTO_XLSX:
    case TEMPLATE_IDS.RIREKISHO_FULL_DOCX:
    case TEMPLATE_IDS.RIREKISHO_FULL_XLSX:
      return JSON.parse(JSON.stringify(RIREKISHO_FULL_DEFAULT_DATA));
    case TEMPLATE_IDS.VOICE_RIREKISHO_DOCX:
      return JSON.parse(JSON.stringify(VOICE_RIREKISHO_DEFAULT_DATA));
    case TEMPLATE_IDS.SHOKUMU_DOCX:
    case TEMPLATE_IDS.SHOKUMU_XLSX:
    case TEMPLATE_IDS.SHOKUMU_PHOTO_DOCX:
    case TEMPLATE_IDS.SHOKUMU_PHOTO_XLSX:
      return JSON.parse(JSON.stringify(SHOKUMU_DEFAULT_DATA));
    default:
      return {};
  }
}
