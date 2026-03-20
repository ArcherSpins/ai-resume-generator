/**
 * Replace {{id}} placeholders in annotated template HTML with form data values.
 * No AI — 100% deterministic, preserves the original HTML layout.
 */

const ALL_FIELD_IDS = [
  'name', 'furigana', 'name_english', 'birthdate', 'gender', 'nationality',
  'current_address', 'phone', 'email', 'contact_address', 'home_address',
  'education', 'experience', 'licenses',
  'strong_subjects', 'hobbies_skills', 'self_pr', 'self_intro',
  'motivation', 'preferences',
];

function escapeHtml(s) {
  if (s == null || s === '') return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function fillAnnotatedTemplate(html, data, avatarBase64 = null) {
  if (!html || typeof html !== 'string') return html;
  let out = html;

  // Photo placeholder
  out = out.replace(/\{\{\s*photo\s*\}\}/gi, () => {
    if (avatarBase64 && typeof avatarBase64 === 'string' && avatarBase64.startsWith('data:image')) {
      return `<img src="${avatarBase64.replace(/"/g, '&quot;')}" alt="" style="max-width:40mm;max-height:50mm;object-fit:contain;" />`;
    }
    return '';
  });

  // Text field placeholders
  for (const id of ALL_FIELD_IDS) {
    const value =
      data && data[id] !== undefined && data[id] !== null ? escapeHtml(String(data[id])) : '';
    const re = new RegExp(`\\{\\{\\s*${id}\\s*\\}\\}`, 'gi');
    out = out.replace(re, value);
  }
  return out;
}
