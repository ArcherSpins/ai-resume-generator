/** Fallback: generate simple HTML from schema + data when no template is used. */
export async function generateResumeHtml(schema, data) {
  const sections = schema?.sections || [];
  const parts = [];
  for (const section of sections) {
    parts.push(`<div class="section"><div class="section-title">${escapeHtml(section.label || section.type)}</div>`);
    for (const field of section.fields || []) {
      const val = getNested(data, section.type, field.name) ?? getNested(data, `${section.type}_0`, field.name) ?? '';
      if (String(val).trim()) parts.push(`<div class="item"><strong>${escapeHtml(field.name)}:</strong> ${escapeHtml(String(val))}</div>`);
    }
    parts.push('</div>');
  }
  return parts.join('');
}

function getNested(data, sectionKey, fieldName) {
  if (!data) return undefined;
  const section = data[sectionKey];
  if (section && typeof section === 'object' && fieldName in section) return section[fieldName];
  return data[fieldName];
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
