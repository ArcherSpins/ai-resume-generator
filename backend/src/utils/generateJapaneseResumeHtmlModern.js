/**
 * Modern / “designer” 履歴書 HTML for voice preview — same data, bolder visuals.
 */
import { disp, dispBlock, renderDatedHistorySection, photoCellHtml } from './resumeHtmlCommon.js';

function modernHistorySection(title, entries, fallback, col3) {
  const inner = renderDatedHistorySection(title, entries, fallback, col3);
  return inner
    .replace(/class="sec-hd"/g, 'class="sec-hd"')
    .replace(/<table>/g, '<table class="card">');
}

export function generateJapaneseResumeHtmlModern(data = {}, avatar = null) {
  const d = data;
  const photoHtml = photoCellHtml(avatar);

  const edu = modernHistorySection('学　歴', d.educationEntries, d.education, '学歴');
  const exp = modernHistorySection('職　歴', d.experienceEntries, d.experience, '職歴');
  const lic = modernHistorySection('免許・資格', d.licensesEntries, d.licenses, '免許・資格');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Segoe UI", "Yu Gothic", "Hiragino Sans", "Meiryo", sans-serif;
    font-size: 10.5pt; line-height: 1.5; color: #1e1b4b; background: linear-gradient(165deg, #eef2ff 0%, #faf5ff 40%, #fff 100%);
    padding: 12mm 10mm;
    min-height: 297mm;
  }
  .sheet {
    max-width: 190mm; margin: 0 auto; background: #fff; border-radius: 14px;
    box-shadow: 0 12px 40px rgba(99, 102, 241, 0.12), 0 2px 8px rgba(0,0,0,0.06);
    padding: 10mm 11mm 12mm;
    border: 1px solid rgba(99, 102, 241, 0.15);
  }
  h1.title {
    text-align: center; font-size: 17pt; letter-spacing: 0.4em; margin-bottom: 6mm;
    font-weight: 800; background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 3.5mm; border-radius: 10px; overflow: hidden; }
  table.card { border: 1px solid #e0e7ff; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.06); }
  td { border: 1px solid #e5e7eb; padding: 6px 8px; vertical-align: top; }
  .lbl {
    background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); font-size: 9pt; white-space: nowrap; width: 26mm;
    font-weight: 600; color: #4c1d95;
  }
  .val { min-height: 20px; white-space: pre-wrap; background: #fff; }
  .sec-hd {
    background: linear-gradient(90deg, #6366f1, #8b5cf6); color: #fff; font-weight: 700;
    text-align: center; font-size: 10.5pt; padding: 7px 8px; border: none;
  }
  .sub-hd { background: #f5f3ff; font-size: 9pt; text-align: center; font-weight: 700; color: #5b21b6; }
  td.ym { width: 11%; text-align: center; white-space: nowrap; vertical-align: middle; background: #fafafa; }
  .muted { color: #c4b5fd; }
  .accent-row td.val { font-size: 14pt; font-weight: 800; color: #312e81; }
  .photo-wrap { border-radius: 10px; overflow: hidden; border: 2px solid #c7d2fe !important; background: #faf5ff !important; }
</style>
</head>
<body>
<div class="sheet">
<h1 class="title">履　歴　書</h1>
<table>
  <tr>
    <td class="lbl">ふりがな</td>
    <td class="val">${disp(d.furigana)}</td>
    <td rowspan="5" class="photo-wrap" style="width:36mm;text-align:center;vertical-align:middle;padding:6px;">${photoHtml}</td>
  </tr>
  <tr class="accent-row">
    <td class="lbl">氏名</td>
    <td class="val">${disp(d.name)}</td>
  </tr>
  <tr>
    <td class="lbl">アルファベット</td>
    <td class="val">${disp(d.name_english)}</td>
  </tr>
  <tr>
    <td class="lbl">生年月日</td>
    <td class="val">${disp(d.birthdate)}</td>
  </tr>
  <tr>
    <td class="lbl">年齢</td>
    <td class="val">${disp(d.age)}</td>
  </tr>
  <tr><td class="lbl">性別</td><td class="val" colspan="2">${disp(d.gender)}</td></tr>
  <tr><td class="lbl">国籍</td><td class="val" colspan="2">${disp(d.nationality)}</td></tr>
  <tr><td class="lbl">電話</td><td class="val" colspan="2">${disp(d.phone)}</td></tr>
  <tr><td class="lbl">メール</td><td class="val" colspan="2">${disp(d.email)}</td></tr>
  <tr><td class="lbl">現住所</td><td class="val" colspan="2">${disp(d.current_address)}</td></tr>
  <tr><td class="lbl">連絡先</td><td class="val" colspan="2">${disp(d.contact_address)}</td></tr>
  <tr><td class="lbl">本国住所</td><td class="val" colspan="2">${disp(d.home_address)}</td></tr>
</table>

${edu}
${exp}
${lic}

<table class="card">
  <tr><td class="lbl">特技・自己PR</td><td class="val">${dispBlock(d.self_pr)}</td></tr>
  <tr><td class="lbl">志望動機</td><td class="val">${dispBlock(d.motivation)}</td></tr>
  <tr><td class="lbl">本人希望</td><td class="val">${dispBlock(d.preferences)}</td></tr>
  <tr><td class="lbl">趣味・特技</td><td class="val">${dispBlock(d.hobbies_skills)}</td></tr>
  <tr><td class="lbl">自己紹介</td><td class="val">${dispBlock(d.self_intro)}</td></tr>
</table>
</div>
</body>
</html>`;
}
