/**
 * Built-in Japanese 履歴書 (rirekisho) HTML — classic single-page layout.
 */
import {
  disp,
  dispBlock,
  renderDatedHistorySection,
  photoCellHtml,
} from './resumeHtmlCommon.js';

export function generateJapaneseResumeHtml(data = {}, avatar = null) {
  const d = data;
  const photoHtml = photoCellHtml(avatar);

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "MS Mincho", "Yu Mincho", "Hiragino Mincho ProN", "Yu Gothic", "Meiryo", sans-serif;
    font-size: 10.5pt; line-height: 1.45; color: #1a1a1a; background: #fff; padding: 14mm 12mm;
  }
  h1.title { text-align: center; font-size: 18pt; letter-spacing: 0.35em; margin-bottom: 8mm; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 4mm; border: 1px solid #2c2c2c; }
  td { border: 1px solid #2c2c2c; padding: 5px 7px; vertical-align: top; }
  .lbl { background: #f8f8f8; font-size: 9.5pt; white-space: nowrap; width: 24mm; }
  .val { min-height: 20px; white-space: pre-wrap; }
  .sec-hd { background: #e8e8e8; font-weight: bold; text-align: center; font-size: 11pt; padding: 5px 7px; }
  .sub-hd { background: #f0f0f0; font-size: 9.5pt; text-align: center; font-weight: bold; white-space: nowrap; }
  td.ym { width: 11%; text-align: center; white-space: nowrap; vertical-align: top; }
  .muted { color: #9aa3af; }
</style>
</head>
<body>
<h1 class="title">履　歴　書</h1>
<table>
  <tr>
    <td class="lbl">ふりがな</td>
    <td class="val">${disp(d.furigana)}</td>
    <td rowspan="5" style="width:37mm;text-align:center;vertical-align:middle;border:1px solid #2c2c2c;padding:4px;">${photoHtml}</td>
  </tr>
  <tr>
    <td class="lbl">氏名</td>
    <td class="val" style="font-size:14pt;font-weight:bold;">${disp(d.name)}</td>
  </tr>
  <tr>
    <td class="lbl">アルファベット表記</td>
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
  <tr>
    <td class="lbl">電話</td>
    <td class="val" colspan="2">${disp(d.phone)}</td>
  </tr>
  <tr><td class="lbl">メールアドレス</td><td class="val" colspan="2">${disp(d.email)}</td></tr>
  <tr>
    <td class="lbl">現住所</td>
    <td class="val" colspan="2">${disp(d.current_address)}</td>
  </tr>
  <tr><td class="lbl">連絡先</td><td class="val" colspan="2">${disp(d.contact_address)}</td></tr>
  <tr><td class="lbl">本国住所</td><td class="val" colspan="2">${disp(d.home_address)}</td></tr>
</table>

${renderDatedHistorySection('学　歴', d.educationEntries, d.education, '学歴')}
${renderDatedHistorySection('職　歴', d.experienceEntries, d.experience, '職歴')}
${renderDatedHistorySection('免許・資格', d.licensesEntries, d.licenses, '免許・資格')}

<table>
  <tr><td class="lbl">得意な科目・分野</td><td class="val">${dispBlock(d.strong_subjects)}</td></tr>
  <tr><td class="lbl">趣味・特技</td><td class="val">${dispBlock(d.hobbies_skills)}</td></tr>
  <tr><td class="lbl">特技・自己PR</td><td class="val">${dispBlock(d.self_pr)}</td></tr>
  <tr><td class="lbl">自己紹介書</td><td class="val">${dispBlock(d.self_intro)}</td></tr>
  <tr><td class="lbl">志望動機</td><td class="val">${dispBlock(d.motivation)}</td></tr>
  <tr><td class="lbl">本人希望</td><td class="val">${dispBlock(d.preferences)}</td></tr>
</table>

</body>
</html>`;
}
