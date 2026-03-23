/**
 * Parse various birthdate strings and compute age in 履歴書 style (e.g. 33歳).
 */

function parseYmdParts(s) {
  const str = String(s ?? '').trim();
  if (!str) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map((x) => parseInt(x, 10));
    if (y && m >= 1 && m <= 12 && d >= 1 && d <= 31) return { y, m, d };
    return null;
  }

  const m = str.match(/(\d{4})\D(\d{1,2})\D(\d{1,2})/);
  if (!m) return null;
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const d = parseInt(m[3], 10);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

/**
 * @param {string} birthdateStr — ISO YYYY-MM-DD or e.g. 1989年12月4日 / 1989年12月4日生
 * @returns {string} e.g. "33歳", or "" if unparseable
 */
export function computeJapaneseAgeFromBirthdate(birthdateStr) {
  const parts = parseYmdParts(birthdateStr);
  if (!parts) return '';

  const birth = new Date(Date.UTC(parts.y, parts.m - 1, parts.d));
  if (Number.isNaN(birth.getTime())) return '';

  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }

  if (age < 0 || age > 130) return '';
  return `${age}歳`;
}
