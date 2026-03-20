/**
 * Built-in Japanese 履歴書 (rirekisho) HTML template.
 * Used as a final fallback when no DOCX/XLSX template is available.
 */

function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nl2br(v) {
  return esc(v).replace(/\n/g, '<br>');
}

function disp(v) {
  const s = String(v ?? '').trim();
  return s ? esc(s) : '<span class="muted">—</span>';
}

function dispBlock(v) {
  const s = String(v ?? '').trim();
  return s ? nl2br(s) : '<span class="muted">—</span>';
}

function row(label, value, colspan = 2) {
  if (!value) return '';
  return `<tr>
    <td class="lbl">${esc(label)}</td>
    <td class="val" ${colspan > 2 ? `colspan="${colspan - 1}"` : ''}>${nl2br(value)}</td>
  </tr>`;
}

export function generateJapaneseResumeHtml(data = {}, avatar = null) {
  const d = data;

  const photoHtml = avatar
    ? `<img src="${esc(avatar)}" alt="" style="width:30mm;height:40mm;object-fit:cover;display:block;margin:0 auto;" />`
    : `<div style="width:30mm;height:40mm;border:1px solid #2c2c2c;background:#fafafa;display:flex;align-items:center;justify-content:center;color:#888;font-size:9pt;">写真</div>`;

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
  .muted { color: #9aa3af; }
</style>
</head>
<body>
<h1 class="title">履　歴　書</h1>
<table>
  <tr>
    <td class="lbl">ふりがな</td>
    <td class="val">${disp(d.furigana)}</td>
    <td rowspan="4" style="width:37mm;text-align:center;vertical-align:middle;border:1px solid #2c2c2c;padding:4px;">${photoHtml}</td>
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

<table><tr><td class="sec-hd" colspan="2">学　歴</td></tr>
<tr><td class="val" colspan="2" style="min-height:60px;">${dispBlock(d.education)}</td></tr></table>

<table><tr><td class="sec-hd" colspan="2">職　歴</td></tr>
<tr><td class="val" colspan="2" style="min-height:60px;">${dispBlock(d.experience)}</td></tr></table>

<table><tr><td class="sec-hd" colspan="2">免許・資格</td></tr>
<tr><td class="val" colspan="2" style="min-height:40px;">${dispBlock(d.licenses)}</td></tr></table>

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
