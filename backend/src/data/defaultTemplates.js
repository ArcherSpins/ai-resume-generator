/**
 * Default resume templates (2 DOCX + 2 XLSX).
 * Schema and defaultData are fixed so backend-filled output matches structure.
 */
import ExcelJS from 'exceljs';
import PizZip from 'pizzip';

export const TEMPLATE_IDS = {
  RIREKISHO_JIS_DOCX: 'rirekisho-jis-docx',
  RIREKISHO_JIS_XLSX: 'rirekisho-jis-xlsx',
  RIREKISHO_PHOTO_DOCX: 'rirekisho-photo-docx',
  RIREKISHO_PHOTO_XLSX: 'rirekisho-photo-xlsx',
  RIREKISHO_FULL_DOCX: 'rirekisho-full-docx',
  RIREKISHO_FULL_XLSX: 'rirekisho-full-xlsx',
  VOICE_RIREKISHO_DOCX: 'voice-rirekisho-docx',
  SHOKUMU_DOCX: 'shokumu-docx',
  SHOKUMU_XLSX: 'shokumu-xlsx',
  SHOKUMU_PHOTO_DOCX: 'shokumu-photo-docx',
  SHOKUMU_PHOTO_XLSX: 'shokumu-photo-xlsx',
};

/** List for API: id, nameKey (i18n), type */
export const TEMPLATE_LIST = [
  { id: TEMPLATE_IDS.RIREKISHO_JIS_DOCX, nameKey: 'templateRirekishoJisDocx', type: 'docx' },
  { id: TEMPLATE_IDS.RIREKISHO_JIS_XLSX, nameKey: 'templateRirekishoJisXlsx', type: 'xlsx' },
  { id: TEMPLATE_IDS.RIREKISHO_PHOTO_DOCX, nameKey: 'templateRirekishoPhotoDocx', type: 'docx' },
  { id: TEMPLATE_IDS.RIREKISHO_PHOTO_XLSX, nameKey: 'templateRirekishoPhotoXlsx', type: 'xlsx' },
  { id: TEMPLATE_IDS.RIREKISHO_FULL_DOCX, nameKey: 'templateRirekishoFullDocx', type: 'docx' },
  { id: TEMPLATE_IDS.RIREKISHO_FULL_XLSX, nameKey: 'templateRirekishoFullXlsx', type: 'xlsx' },
  { id: TEMPLATE_IDS.SHOKUMU_DOCX, nameKey: 'templateShokumuDocx', type: 'docx' },
  { id: TEMPLATE_IDS.SHOKUMU_XLSX, nameKey: 'templateShokumuXlsx', type: 'xlsx' },
  { id: TEMPLATE_IDS.SHOKUMU_PHOTO_DOCX, nameKey: 'templateShokumuPhotoDocx', type: 'docx' },
  { id: TEMPLATE_IDS.SHOKUMU_PHOTO_XLSX, nameKey: 'templateShokumuPhotoXlsx', type: 'xlsx' },
];

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
    { type: 'other', label: 'その他', fields: [{ name: 'motivation', type: 'textarea' }, { name: 'self_pr', type: 'textarea' }, { name: 'preferences', type: 'textarea' }] },
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

// ── Table cell border (single line) ──
const tcBorder = '<w:tcBorders><w:top w:val="single" w:sz="4" w:space="0"/><w:left w:val="single" w:sz="4" w:space="0"/><w:bottom w:val="single" w:sz="4" w:space="0"/><w:right w:val="single" w:sz="4" w:space="0"/></w:tcBorders>';
const tc = (content, widthDxa, merge) => {
  const pr = `<w:tcPr><w:tcW w:w="${widthDxa}" w:type="dxa"/>${tcBorder}${merge || ''}</w:tcPr>`;
  return `<w:tc>${pr}<w:p><w:r><w:t xml:space="preserve">${(content || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</w:t></w:r></w:p></w:tc>`;
};

// ── Build DOCX (JIS 履歴書 style): table with 日付, 氏名, 写真 box, 学歴・職歴 table ──
function buildRirekishoDocx() {
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr><w:t>履歴書</w:t></w:r></w:p>
    <w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders><w:tblLook w:val="00A0"/></w:tblPr>
      <w:tr><w:trPr><w:tblHeader/></w:trPr>${tc('日付', 1200)}${tc('　　　年　　　月　　　日', 2400)}${tc('写真', 1200, '<w:vMerge w:val="restart"/>')}</w:tr>
      <w:tr>${tc('氏名', 1200)}${tc('{name}', 2400)}${tc('__PHOTO__', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('ふりがな', 1200)}${tc('{furigana}', 2400)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('生年月日', 1200)}${tc('{birthdate}', 2400)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('性別', 1200)}${tc('{gender}', 2400)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('現住所', 1200)}${tc('{current_address}', 2400)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('電話', 1200)}${tc('{phone}', 2400)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('メールアドレス', 1200)}${tc('{email}', 2400)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="4800" w:type="dxa"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>学歴・職歴</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="800" w:type="dxa"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>年</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="800" w:type="dxa"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>月</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3200" w:type="dxa"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>学歴・職歴</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="4800"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>{education}</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="4800"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>以上</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>年</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>月</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3200"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>職歴</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="4800"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>{experience}</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="4800"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>以上</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>年</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>月</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3200"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>免許・資格</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="4800"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>{licenses}</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr>${tc('志望動機', 1200)}${tc('{motivation}', 3600)}</w:tr>
      <w:tr>${tc('特技・自己PR', 1200)}${tc('{self_pr}', 3600)}</w:tr>
      <w:tr>${tc('本人希望', 1200)}${tc('{preferences}', 3600)}</w:tr>
    </w:tbl>
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`;

  return buildMinimalDocx(docXml);
}

// ── 履歴書 Photo style: 写真をはる位置 with instructions (like reference image) ──
function buildRirekishoPhotoDocx() {
  const photoCell = `<w:tc><w:tcPr><w:tcW w:w="1400" w:type="dxa"/>${tcBorder}<w:vMerge w:val="restart"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>写真をはる位置</w:t></w:r></w:p><w:p><w:r><w:rPr><w:sz w:val="14"/></w:rPr><w:t>写真は貼る必要が</w:t></w:r></w:p><w:p><w:r><w:rPr><w:sz w:val="14"/></w:rPr><w:t>ある場合のみ</w:t></w:r></w:p><w:p><w:r><w:rPr><w:sz w:val="12"/></w:rPr><w:t>1.縦40mm×横30mm</w:t></w:r></w:p><w:p><w:r><w:rPr><w:sz w:val="12"/></w:rPr><w:t>2.上半身・無帽</w:t></w:r></w:p><w:p><w:r><w:rPr><w:sz w:val="12"/></w:rPr><w:t>3.裏面に氏名</w:t></w:r></w:p><w:p><w:r><w:t>__PHOTO__</w:t></w:r></w:p></w:tc>`;
  const photoMerge = `<w:tc><w:tcPr><w:tcW w:w="1400"/>${tcBorder}<w:vMerge/></w:tcPr><w:p/></w:tc>`;
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/>${tcBorder}</w:tcPr><w:p><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>履歴書</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2400"/>${tcBorder}</w:tcPr><w:p/><w:p><w:r><w:t>　　　年　　　月　　　日現在</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr>${tc('ふりがな', 800)}${tc('{furigana}', 2200)}${photoCell}</w:tr>
      <w:tr>${tc('氏名', 800)}${tc('{name}', 2200)}${photoMerge}</w:tr>
      <w:tr>${tc('生年月日', 800)}${tc('{birthdate}', 1200)}${tc('（{age}）', 800)}${photoMerge}</w:tr>
      <w:tr>${tc('性別', 800)}${tc('{gender}', 2000)}${photoMerge}</w:tr>
      <w:tr>${tc('国籍', 800)}${tc('{nationality}', 2000)}${photoMerge}</w:tr>
      <w:tr>${tc('現住所', 800)}${tc('{current_address}', 2000)}${photoMerge}</w:tr>
      <w:tr>${tc('電話', 800)}${tc('{phone}', 2000)}${photoMerge}</w:tr>
      <w:tr>${tc('E-mail', 800)}${tc('{email}', 2000)}${photoMerge}</w:tr>
      <w:tr>${tc('連絡先', 800)}${tc('{contact_address}', 2000)}${photoMerge}</w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000" w:type="dxa"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>学歴・職歴（各別にまとめて書く）</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>年</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>月</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3400"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>学歴・職歴</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>{education}</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>以上</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>年</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>月</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3400"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>職歴</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>{experience}</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>以上</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>年</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>月</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3400"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>免許・資格</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>{licenses}</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="1200"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>志望の動機、特技、好きな学科、アピールポイントなど</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>{motivation}</w:t></w:r></w:p><w:p><w:r><w:t>{self_pr}</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="1200"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>本人希望記入欄</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>{preferences}</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`;
  return buildMinimalDocx(docXml);
}

// ── 履歴書 Full: same structure as Photo but simpler photo cell (no long instructions) ──
function buildRirekishoFullDocx() {
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/></w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/>${tcBorder}</w:tcPr><w:p><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>履歴書</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2400"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>　　　年　　　月　　　日現在</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr>${tc('ふりがな', 1000)}${tc('{furigana}', 2200)}${tc('写真', 1200, '<w:vMerge w:val="restart"/>')}</w:tr>
      <w:tr>${tc('氏名', 1000)}${tc('{name}', 2200)}${tc('__PHOTO__', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('生年月日', 1000)}${tc('{birthdate}', 1400)}${tc('（{age}）', 800)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('性別', 1000)}${tc('{gender}', 2600)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('国籍', 1000)}${tc('{nationality}', 2600)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('現住所', 1000)}${tc('{current_address}', 2600)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('電話', 1000)}${tc('{phone}', 2600)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('E-mail', 1000)}${tc('{email}', 2600)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('連絡先', 1000)}${tc('{contact_address}', 2600)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="4800"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>学歴・職歴</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>年</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>月</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3200"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>学歴・職歴</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="4800"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>{education}</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="4800"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>以上</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>年</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>月</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3200"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>職歴</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="4800"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>{experience}</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="4800"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>以上</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>年</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="800"/>${tcBorder}</w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>月</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="3200"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>免許・資格</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="4800"/>${tcBorder}<w:gridSpan w:val="3"/></w:tcPr><w:p><w:r><w:t>{licenses}</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr>${tc('志望の動機・特技・アピール', 1200)}${tc('{motivation}', 3600)}</w:tr>
      <w:tr>${tc('本人希望記入欄', 1200)}${tc('{preferences}', 3600)}</w:tr>
    </w:tbl>
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`;
  return buildMinimalDocx(docXml);
}

// ── 職務経歴書 DOCX: table header + section tables ──
function buildShokumuDocx() {
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="36"/></w:rPr><w:t>職務経歴書</w:t></w:r></w:p>
    <w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr>${tc('氏名', 1400)}${tc('{name}', 3600)}</w:tr>
      <w:tr>${tc('メールアドレス', 1400)}${tc('{email}', 3600)}</w:tr>
      <w:tr>${tc('電話', 1400)}${tc('{phone}', 3600)}</w:tr>
      <w:tr>${tc('現住所', 1400)}${tc('{current_address}', 3600)}</w:tr>
    </w:tbl>
    <w:p/><w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000" w:type="dxa"/>${tcBorder}<w:shd w:val="clear" w:fill="E8E8E8"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>1. キャリアサマリー（自己紹介）</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>{self_intro}</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:p/><w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:shd w:val="clear" w:fill="E8E8E8"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>2. 職務経歴</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>{experience}</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:p/><w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:shd w:val="clear" w:fill="E8E8E8"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>3. 学歴</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>{education}</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:p/><w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:shd w:val="clear" w:fill="E8E8E8"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>4. 保有資格・スキル</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>{licenses}</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:p/><w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:shd w:val="clear" w:fill="E8E8E8"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>5. 趣味・特技</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>{hobbies_skills}</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`;

  return buildMinimalDocx(docXml);
}

// ── 職務経歴書 with photo: first table 氏名 | 写真 (merged) ──
function buildShokumuPhotoDocx() {
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="36"/></w:rPr><w:t>職務経歴書</w:t></w:r></w:p>
    <w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="1200" w:type="dxa"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>氏名</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="2600" w:type="dxa"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>{name}</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="1200" w:type="dxa"/>${tcBorder}<w:vMerge w:val="restart"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:t>写真</w:t></w:r></w:p><w:p><w:r><w:t>__PHOTO__</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr>${tc('メールアドレス', 1200)}${tc('{email}', 2600)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('電話', 1200)}${tc('{phone}', 2600)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
      <w:tr>${tc('現住所', 1200)}${tc('{current_address}', 2600)}${tc('', 1200, '<w:vMerge/>')}</w:tr>
    </w:tbl>
    <w:p/><w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000" w:type="dxa"/>${tcBorder}<w:shd w:val="clear" w:fill="E8E8E8"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>1. キャリアサマリー（自己紹介）</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>{self_intro}</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:p/><w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:shd w:val="clear" w:fill="E8E8E8"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>2. 職務経歴</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>{experience}</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:p/><w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:shd w:val="clear" w:fill="E8E8E8"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>3. 学歴</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>{education}</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:p/><w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:shd w:val="clear" w:fill="E8E8E8"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>4. 保有資格・スキル</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>{licenses}</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:p/><w:tbl>
      <w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}<w:shd w:val="clear" w:fill="E8E8E8"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>5. 趣味・特技</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:tcW w:w="5000"/>${tcBorder}</w:tcPr><w:p><w:r><w:t>{hobbies_skills}</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`;
  return buildMinimalDocx(docXml);
}

function buildMinimalDocx(documentXml) {
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

  const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`;

  const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"><dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">Resume</dc:title></cp:coreProperties>`;

  const app = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>AI Resume</Application></Properties>`;

  const zip = new PizZip();
  zip.file('[Content_Types].xml', contentTypes);
  zip.file('_rels/.rels', rels);
  zip.file('word/document.xml', documentXml);
  zip.file('word/_rels/document.xml.rels', wordRels);
  zip.file('docProps/core.xml', core);
  zip.file('docProps/app.xml', app);
  zip.file('word/settings.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>');

  return zip.generate({ type: 'nodebuffer' });
}

// ── Thin border style for XLSX ──
const thinBorder = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};
const labelFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F7FA' } };
const sectionFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAEFF5' } };

// ── Build XLSX: JIS 履歴書 (table layout, borders, merged 写真) ──
async function buildRirekishoXlsx() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('履歴書', { views: [{ showGridLines: true }] });

  // 学歴4行・職歴12行・免許4行で充実した職歴を記載可能に
  const eduRows = [['', '', ''], ['', '', ''], ['', '', ''], ['', '', '']];
  const expRows = Array(12).fill(['', '', '']);
  const licRows = [['', '', ''], ['', '', ''], ['', '', ''], ['', '', '']];
  const rows = [
    ['日付', '　　　年　　　月　　　日', '写真'],
    ['氏名', '', ''],
    ['ふりがな', '', ''],
    ['生年月日', '', ''],
    ['性別', '', ''],
    ['現住所', '', ''],
    ['電話', '', ''],
    ['メールアドレス', '', ''],
    ['', '', ''],
    ['年', '月', '学歴・職歴'],
    ...eduRows,
    ['以上', '', ''],
    ['年', '月', '職歴'],
    ...expRows,
    ['以上', '', ''],
    ['年', '月', '免許・資格'],
    ...licRows,
    ['志望動機', '', ''],
    ['特技・自己PR', '', ''],
    ['本人希望', '', ''],
  ];

  const rEducation = 10;
  const rExperience = rEducation + 1 + eduRows.length + 1;
  const rLicenses = rExperience + 1 + expRows.length + 1;
  const sepRows = new Set([rEducation, rExperience, rLicenses]); // 学歴・職歴・免許のヘッダー行
  rows.forEach((row, i) => {
    const r = i + 1;
    row.forEach((cellVal, c) => {
      const cell = ws.getCell(r, c + 1);
      cell.value = cellVal;
      cell.border = thinBorder;
      cell.alignment = { vertical: 'top', wrapText: true };
      const isDataRow = r > 10 && !sepRows.has(r) && row[0] === '' && row[1] === '' && row[2] === '';
      if (isDataRow && c === 0) cell.alignment.horizontal = 'center';
      if (sepRows.has(r)) cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      if (sepRows.has(r)) {
        cell.fill = sectionFill;
        cell.font = { bold: true };
      }
      if (c === 0 && cellVal && !sepRows.has(r) && !['年', '以上'].includes(cellVal)) {
        cell.fill = labelFill;
        cell.font = { bold: true };
      }
    });
  });

  ws.mergeCells('C1:C8');
  ws.getCell('C1').value = '写真';
  ws.getCell('C1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getCell('C1').border = thinBorder;

  ws.getColumn(1).width = 14;
  ws.getColumn(2).width = 22;
  ws.getColumn(3).width = 48;
  ws.getRow(1).height = 20;
  for (let r = 2; r <= 8; r++) ws.getRow(r).height = 22;
  const totalRows = rows.length;
  for (let r = 10; r <= totalRows; r++) {
    ws.getRow(r).height = sepRows.has(r) ? 20 : 22;
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

// ── 職務経歴書 XLSX: table with borders, section headers ──
async function buildShokumuXlsx() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('職務経歴書', { views: [{ showGridLines: true }] });
  const rows = [
    ['氏名', ''],
    ['メールアドレス', ''],
    ['電話', ''],
    ['現住所', ''],
    ['', ''],
    ['1. キャリアサマリー（自己紹介）', ''],
    ['', ''],
    ['2. 職務経歴', ''],
    ['', ''],
    ['3. 学歴', ''],
    ['', ''],
    ['4. 保有資格・スキル', ''],
    ['', ''],
    ['5. 趣味・特技', ''],
  ];

  rows.forEach((row, i) => {
    const r = i + 1;
    row.forEach((cellVal, c) => {
      const cell = ws.getCell(r, c + 1);
      cell.value = cellVal;
      cell.border = thinBorder;
      cell.alignment = { vertical: 'top', wrapText: true };
      if (c === 0 && cellVal && !String(cellVal).startsWith('1.') && !String(cellVal).startsWith('2.') && !String(cellVal).startsWith('3.') && !String(cellVal).startsWith('4.') && !String(cellVal).startsWith('5.')) {
        cell.fill = labelFill;
        cell.font = { bold: true };
      }
      if (r === 6 || r === 8 || r === 10 || r === 12 || r === 14) {
        cell.fill = sectionFill;
        cell.font = { bold: true };
      }
    });
  });

  ws.getColumn(1).width = 28;
  ws.getColumn(2).width = 58;
  for (let r = 7; r <= 15; r += 2) ws.getRow(r).height = 60;

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

// ── 履歴書 Photo XLSX: 写真をはる位置、学歴・職歴・免許は多行対応 ──
async function buildRirekishoPhotoXlsx() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('履歴書', { views: [{ showGridLines: true }] });
  const eduRows = Array(4).fill(['', '', '']);
  const expRows = Array(12).fill(['', '', '']);
  const licRows = Array(4).fill(['', '', '']);
  const rows = [
    ['ふりがな', '', '写真をはる位置'],
    ['氏名', '', '1.縦40mm×横30mm'],
    ['生年月日', '', '2.上半身・無帽'],
    ['（年齢）', '', '3.裏面に氏名'],
    ['性別', '', ''],
    ['国籍', '', ''],
    ['現住所', '', ''],
    ['電話', '', ''],
    ['E-mail', '', ''],
    ['連絡先', '', ''],
    ['', '', ''],
    ['年', '月', '学歴・職歴（各別にまとめて書く）'],
    ...eduRows,
    ['以上', '', ''],
    ['年', '月', '職歴'],
    ...expRows,
    ['以上', '', ''],
    ['年', '月', '免許・資格'],
    ...licRows,
    ['志望の動機・特技・アピール', '', ''],
    ['本人希望記入欄', '', ''],
  ];
  const sepRows = new Set([12, 12 + 1 + eduRows.length + 1, 12 + 1 + eduRows.length + 1 + 1 + expRows.length + 1]);
  rows.forEach((row, i) => {
    const r = i + 1;
    row.forEach((cellVal, c) => {
      const cell = ws.getCell(r, c + 1);
      cell.value = cellVal;
      cell.border = thinBorder;
      cell.alignment = { vertical: 'top', wrapText: true };
      if (sepRows.has(r)) cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      else if (row[0] === '' && row[1] === '' && row[2] === '' && c === 0) cell.alignment.horizontal = 'center';
      if (sepRows.has(r)) {
        cell.fill = sectionFill;
        cell.font = { bold: true };
      }
      if (c === 0 && cellVal && !sepRows.has(r) && !['年', '以上'].includes(cellVal)) {
        cell.fill = labelFill;
        cell.font = { bold: true };
      }
    });
  });
  ws.mergeCells('C1:C10');
  ws.getCell('C1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getColumn(1).width = 18;
  ws.getColumn(2).width = 24;
  ws.getColumn(3).width = 20;
  for (let r = 1; r <= 10; r++) ws.getRow(r).height = 22;
  for (let r = 11; r <= rows.length; r++) ws.getRow(r).height = 22;
  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ── 履歴書 Full XLSX: 連絡先・年齢・学歴・職歴・免許を多行で充実記載 ──
async function buildRirekishoFullXlsx() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('履歴書', { views: [{ showGridLines: true }] });
  const eduRows = Array(4).fill(['', '', '']);
  const expRows = Array(12).fill(['', '', '']);
  const licRows = Array(4).fill(['', '', '']);
  const rows = [
    ['日付', '　　　年　　　月　　　日現在', '写真'],
    ['氏名', '', ''],
    ['ふりがな', '', ''],
    ['生年月日', '', ''],
    ['年齢', '', ''],
    ['性別', '', ''],
    ['国籍', '', ''],
    ['現住所', '', ''],
    ['電話', '', ''],
    ['E-mail', '', ''],
    ['連絡先', '', ''],
    ['', '', ''],
    ['年', '月', '学歴・職歴（各別にまとめて書く）'],
    ...eduRows,
    ['以上', '', ''],
    ['年', '月', '職歴'],
    ...expRows,
    ['以上', '', ''],
    ['年', '月', '免許・資格'],
    ...licRows,
    ['志望の動機・特技・アピール', '', ''],
    ['本人希望記入欄', '', ''],
  ];
  const sepRows = new Set([13, 13 + 1 + eduRows.length + 1, 13 + 1 + eduRows.length + 1 + 1 + expRows.length + 1]);
  rows.forEach((row, i) => {
    const r = i + 1;
    row.forEach((cellVal, c) => {
      const cell = ws.getCell(r, c + 1);
      cell.value = cellVal;
      cell.border = thinBorder;
      cell.alignment = { vertical: 'top', wrapText: true };
      if (sepRows.has(r)) cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      else if (row[0] === '' && row[1] === '' && row[2] === '' && c === 0) cell.alignment.horizontal = 'center';
      if (sepRows.has(r)) {
        cell.fill = sectionFill;
        cell.font = { bold: true };
      }
      if (c === 0 && cellVal && !sepRows.has(r) && !['年', '以上'].includes(cellVal)) {
        cell.fill = labelFill;
        cell.font = { bold: true };
      }
    });
  });
  ws.mergeCells('C1:C11');
  ws.getCell('C1').value = '写真';
  ws.getCell('C1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getColumn(1).width = 20;
  ws.getColumn(2).width = 24;
  ws.getColumn(3).width = 44;
  for (let r = 1; r <= rows.length; r++) ws.getRow(r).height = r <= 11 ? 22 : (sepRows.has(r) ? 20 : 22);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ── 職務経歴書 with photo XLSX ──
async function buildShokumuPhotoXlsx() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('職務経歴書', { views: [{ showGridLines: true }] });
  const headerBg = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } };
  const rows = [
    ['氏名', '', '写真'],
    ['メールアドレス', '', ''],
    ['電話', '', ''],
    ['現住所', '', ''],
    ['', '', ''],
    ['1. キャリアサマリー（自己紹介）', '', ''],
    ['', '', ''],
    ['2. 職務経歴', '', ''],
    ['', '', ''],
    ['3. 学歴', '', ''],
    ['', '', ''],
    ['4. 保有資格・スキル', '', ''],
    ['', '', ''],
    ['5. 趣味・特技', '', ''],
  ];
  rows.forEach((row, i) => {
    const r = i + 1;
    row.forEach((cellVal, c) => {
      const cell = ws.getCell(r, c + 1);
      cell.value = cellVal;
      cell.border = thinBorder;
      cell.alignment = { vertical: 'top', wrapText: true };
      if (c === 0 && cellVal && !String(cellVal).startsWith('1.') && !String(cellVal).startsWith('2.') && !String(cellVal).startsWith('3.') && !String(cellVal).startsWith('4.') && !String(cellVal).startsWith('5.')) {
        cell.fill = labelFill;
        cell.font = { bold: true };
      }
      if (r === 6 || r === 8 || r === 10 || r === 12 || r === 14) { cell.fill = headerBg; cell.font = { bold: true }; }
    });
  });
  ws.mergeCells('C1:C4');
  ws.getCell('C1').value = '写真';
  ws.getCell('C1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getColumn(1).width = 26;
  ws.getColumn(2).width = 42;
  ws.getColumn(3).width = 14;
  return Buffer.from(await wb.xlsx.writeBuffer());
}

export async function getTemplateBuffer(templateId) {
  switch (templateId) {
    case TEMPLATE_IDS.RIREKISHO_JIS_DOCX:
      return buildRirekishoDocx();
    case TEMPLATE_IDS.RIREKISHO_JIS_XLSX:
      return buildRirekishoXlsx();
    case TEMPLATE_IDS.RIREKISHO_PHOTO_DOCX:
      return buildRirekishoPhotoDocx();
    case TEMPLATE_IDS.RIREKISHO_PHOTO_XLSX:
      return buildRirekishoPhotoXlsx();
    case TEMPLATE_IDS.RIREKISHO_FULL_DOCX:
      return buildRirekishoFullDocx();
    case TEMPLATE_IDS.RIREKISHO_FULL_XLSX:
      return buildRirekishoFullXlsx();
    case TEMPLATE_IDS.VOICE_RIREKISHO_DOCX:
      // Dedicated voice-filled template (DOCX with photo box)
      return buildRirekishoPhotoDocx();
    case TEMPLATE_IDS.SHOKUMU_DOCX:
      return buildShokumuDocx();
    case TEMPLATE_IDS.SHOKUMU_XLSX:
      return buildShokumuXlsx();
    case TEMPLATE_IDS.SHOKUMU_PHOTO_DOCX:
      return buildShokumuPhotoDocx();
    case TEMPLATE_IDS.SHOKUMU_PHOTO_XLSX:
      return buildShokumuPhotoXlsx();
    default:
      return null;
  }
}
