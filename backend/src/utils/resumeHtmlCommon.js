/** Shared helpers for Japanese 履歴書 HTML variants (voice + fallback). */

export function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function nl2br(v) {
  return esc(v).replace(/\n/g, '<br>');
}

export function disp(v) {
  const s = String(v ?? '').trim();
  return s ? esc(s) : '<span class="muted">—</span>';
}

export function dispBlock(v) {
  const s = String(v ?? '').trim();
  return s ? nl2br(s) : '<span class="muted">—</span>';
}

export function formatJpYearCell(year) {
  const y = String(year ?? '').trim();
  if (!y) return '';
  if (/^\d{4}$/.test(y)) return `${y}年`;
  if (/年$/.test(y)) return esc(y);
  return esc(y);
}

export function formatJpMonthCell(month) {
  const m = String(month ?? '').trim();
  if (!m) return '';
  const n = parseInt(m, 10);
  if (!Number.isNaN(n) && n >= 1 && n <= 12 && (String(n) === m || m === String(n).padStart(2, '0'))) {
    return `${n}月`;
  }
  if (/月$/.test(m)) return esc(m);
  const digits = m.replace(/\D/g, '');
  const n2 = parseInt(digits, 10);
  if (!Number.isNaN(n2) && n2 >= 1 && n2 <= 12) return `${n2}月`;
  return esc(m);
}

export function entryRowHasContent(e) {
  if (!e || typeof e !== 'object') return false;
  const desc = String(e.description ?? '').trim();
  const y = String(e.year ?? '').trim();
  const mo = String(e.month ?? '').trim();
  return Boolean(desc || y || mo);
}

export function renderDatedHistorySection(title, entries, fallbackText, thirdColLabel) {
  const list = Array.isArray(entries) ? entries.filter(entryRowHasContent) : [];
  const fallback = String(fallbackText ?? '').trim();

  if (list.length === 0) {
    return `<table>
  <tr><td class="sec-hd" colspan="3">${title}</td></tr>
  <tr>
    <td class="sub-hd ym">年</td>
    <td class="sub-hd ym">月</td>
    <td class="sub-hd">${esc(thirdColLabel)}</td>
  </tr>
  <tr><td class="val" colspan="3" style="min-height:48px;">${fallback ? dispBlock(fallback) : '<span class="muted">—</span>'}</td></tr>
</table>`;
  }

  const rows = list
    .map((e) => {
      const yCell = formatJpYearCell(e.year);
      const mCell = formatJpMonthCell(e.month);
      const desc = String(e.description ?? '').trim();
      return `<tr>
    <td class="val ym">${yCell || ''}</td>
    <td class="val ym">${mCell || ''}</td>
    <td class="val">${desc ? nl2br(desc) : '<span class="muted">—</span>'}</td>
  </tr>`;
    })
    .join('');

  return `<table>
  <tr><td class="sec-hd" colspan="3">${title}</td></tr>
  <tr>
    <td class="sub-hd ym">年</td>
    <td class="sub-hd ym">月</td>
    <td class="sub-hd">${esc(thirdColLabel)}</td>
  </tr>
${rows}
</table>`;
}

/** 写真セル */
export function photoCellHtml(avatar) {
  return avatar
    ? `<img src="${esc(avatar)}" alt="" style="width:30mm;height:40mm;object-fit:cover;display:block;margin:0 auto;" />`
    : `<div style="width:30mm;height:40mm;border:1px solid #2c2c2c;background:#fafafa;display:flex;align-items:center;justify-content:center;color:#888;font-size:9pt;">写真</div>`;
}
