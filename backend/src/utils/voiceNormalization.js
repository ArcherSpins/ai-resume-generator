/**
 * Post-processing for voice → 履歴書: fix STT quirks (@, phone), Japanese display formats.
 */

/** Whisper vocabulary hint — reduces "собачка" instead of @ etc. */
export const WHISPER_PROMPT_HINT =
  'Emails use the ASCII @ symbol. Example: name@gmail.com. Japanese phones: mobile 070, 080, 090.';

/**
 * Normalize transcript before LLM extraction (fixes common mis-hearings for @ and dots).
 */
export function normalizeTranscriptForExtraction(text) {
  if (!text || typeof text !== 'string') return '';
  let t = text;

  t = t.replace(/\bсобачк[аи]\b/giu, '@');
  t = t.replace(/\bсобак[аи]\b/giu, '@');
  t = t.replace(/\s+собачк[аи]\s+/giu, ' @ ');
  t = t.replace(/\s+собак[аи]\s+/giu, ' @ ');

  t = t.replace(/\s+at\s+(?=[a-z0-9._+-])/gi, ' @');
  t = t.replace(/\s+эт\s+знак\s+/giu, ' @ ');
  t = t.replace(/\s+эт\s+знак/giu, ' @');

  t = t.replace(/\s+dot\s+/gi, '.');
  t = t.replace(/\s+точка\s+/giu, '.');

  t = t.replace(/([a-z0-9._+-]+)\s*@\s*([a-z0-9.-]+)\s*\.\s*([a-z]{2,})/gi, '$1@$2.$3');

  return t.replace(/\s{2,}/g, ' ').trim();
}

/**
 * Fix email string if STT wrote words instead of @.
 */
export function normalizeEmailField(email) {
  let e = String(email ?? '').trim();
  if (!e) return '';

  e = e.replace(/\bсобачк[аи]\b/giu, '@');
  e = e.replace(/\bсобак[аи]\b/giu, '@');
  e = e.replace(/\s*@\s*/g, '@');
  e = e.replace(/＠/g, '@');
  e = e.replace(/\s+at\s+/gi, '@');

  if (!e.includes('@')) {
    const compact = e.replace(/\s+/g, '');
    const guess = compact.match(/^([a-zA-Z0-9._+-]+)(gmail|yahoo|icloud|outlook)(com)?$/i);
    if (guess) {
      const domain =
        guess[2].toLowerCase() === 'gmail' ? 'gmail.com' : `${guess[2].toLowerCase()}.com`;
      e = `${guess[1]}@${domain}`;
    } else {
      return e;
    }
  }

  const at = e.indexOf('@');
  if (at < 1) return e;
  const local = e.slice(0, at).replace(/\s/g, '');
  const domain = e.slice(at + 1).replace(/\s/g, '').toLowerCase();
  return `${local.toLowerCase()}@${domain}`;
}

/**
 * Format Japanese phone: domestic `070 6570 2520` or international `+81 70 6570 2520`.
 * @param {'domestic'|'intl'} mode
 */
export function formatJapanPhoneDisplay(input, mode = 'domestic') {
  const raw = String(input ?? '').trim();
  if (!raw) return '';

  let d = raw.replace(/\D/g, '');
  if (!d) return raw;

  // +81… already (12 digits: 81 + 10 national without leading 0)
  if (d.startsWith('81') && d.length >= 11) {
    const after = d.slice(2);
    if (after.length === 10 && /^[789]0\d{8}$/.test(after)) {
      if (mode === 'intl') {
        return `+81 ${after.slice(0, 2)} ${after.slice(2, 6)} ${after.slice(6, 10)}`;
      }
      const national = `0${after}`;
      return formatJapanPhoneDisplay(national, 'domestic');
    }
  }

  if (!d.startsWith('0') && d.length === 10 && /^[789]0/.test(d)) {
    d = `0${d}`;
  }

  // Mobile 070 / 080 / 090
  if (/^0[789]0\d{8}$/.test(d)) {
    if (mode === 'intl') {
      const n = d.slice(1);
      return `+81 ${n.slice(0, 2)} ${n.slice(2, 6)} ${n.slice(6, 10)}`;
    }
    return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7, 11)}`;
  }

  // Tokyo 03-xxxx-xxxx
  if (/^03\d{9}$/.test(d)) {
    return `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6, 10)}`;
  }

  // Generic 10-digit national
  if (d.length === 10 && d.startsWith('0')) {
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)}`;
  }

  if (d.length === 11 && d.startsWith('0')) {
    return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7, 11)}`;
  }

  return raw;
}
