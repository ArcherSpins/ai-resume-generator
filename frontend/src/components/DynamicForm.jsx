import { useCallback, useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../services/api';

// ── Validation helpers ────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(name, value) {
  const v = String(value ?? '').trim();
  if (!v) return null; // empty is handled by required check separately
  if (name === 'email' && !EMAIL_RE.test(v)) return 'Invalid email address';
  if (name === 'year') {
    if (!/^\d{0,4}$/.test(v)) return 'Year must be 4 digits';
    const n = parseInt(v, 10);
    if (v.length === 4 && (n < 1900 || n > 2100)) return 'Enter a valid year (1900–2100)';
  }
  if (name === 'month') {
    if (!/^\d{1,2}$/.test(v)) return 'Month must be a number';
    const n = parseInt(v, 10);
    if (n < 1 || n > 12) return 'Month must be 1–12';
  }
  return null;
}

// ── Phone masking ─────────────────────────────────────────────────────────────

/**
 * Format digits as a Japanese phone number:
 *   070/080/090 → XXX-XXXX-XXXX
 *   03/06/etc.  → XX-XXXX-XXXX or XXX-XXX-XXXX
 */
function maskPhone(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.startsWith('0') && (digits[1] === '7' || digits[1] === '8' || digits[1] === '9')) {
    // mobile: 090-1234-5678
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  // landline: 03-1234-5678 or 0XX-XXX-XXXX
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
}

// ── Single field renderer ─────────────────────────────────────────────────────

function Field({ field, value, onChange, showErrors, onAddressLookupSuccess }) {
  const [touched, setTouched] = useState(false);
  const [zipLookupLoading, setZipLookupLoading] = useState(false);
  const [zipLookupError, setZipLookupError] = useState(null);

  const inputClass =
    'mt-1 block w-full rounded-lg border bg-surface px-3 py-2 text-ink shadow-sm ' +
    'focus:outline-none focus:ring-1 transition ';

  const error = (touched || showErrors) ? validateField(field.name, value) : null;
  const borderClass = error
    ? 'border-red-400 focus:border-red-500 focus:ring-red-400'
    : 'border-edge focus:border-primary focus:ring-primary';

  const id = `field-${field.name}`;

  const handleBlur = () => setTouched(true);

  // ── Textarea ──────────────────────────────────────────────────────────────
  if (field.type === 'textarea') {
    return (
      <div>
        <textarea
          id={id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          rows={3}
          className={`${inputClass}${borderClass}`}
          placeholder={field.placeholder}
        />
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  }

  // ── Date picker (生年月日) ──────────────────────────────────────────────────
  if (field.type === 'date') {
    return (
      <div>
        <input
          id={id}
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          className={`${inputClass}${borderClass}`}
        />
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  }

  // ── Select / dropdown (性別 etc.) ──────────────────────────────────────────
  if (field.type === 'select' && Array.isArray(field.options)) {
    return (
      <div>
        <select
          id={id}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          className={`${inputClass}${borderClass}`}
        >
          <option value="">—</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  }

  // ── Email ─────────────────────────────────────────────────────────────────
  if (field.name === 'email') {
    return (
      <div>
        <input
          id={id}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          className={`${inputClass}${borderClass}`}
          placeholder="name@example.com"
        />
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  }

  // ── Phone with mask ───────────────────────────────────────────────────────
  if (field.name === 'phone') {
    return (
      <div>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={value || ''}
          onChange={(e) => {
            const masked = maskPhone(e.target.value);
            onChange(masked);
          }}
          onBlur={handleBlur}
          className={`${inputClass}${borderClass}`}
          placeholder="090-0000-0000"
          maxLength={13}
        />
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  }

  // ── Year ──────────────────────────────────────────────────────────────────
  if (field.name === 'year') {
    return (
      <div>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={value || ''}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 4);
            onChange(v);
          }}
          onBlur={handleBlur}
          className={`${inputClass}${borderClass}`}
          placeholder="2020"
          maxLength={4}
        />
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  }

  // ── Postal code (郵便番号) + address lookup (Japan) ─────────────────────────
  if (field.type === 'postal_code') {
    const normalizedZip = (v) => String(v ?? '').replace(/\D/g, '').slice(0, 7);
    const formatZip = (v) => {
      const s = normalizedZip(v);
      if (s.length <= 3) return s;
      return `${s.slice(0, 3)}-${s.slice(3)}`;
    };
    const handleLookup = async () => {
      const zip = normalizedZip(value);
      if (zip.length !== 7) {
        setZipLookupError('7 digits required');
        return;
      }
      setZipLookupError(null);
      setZipLookupLoading(true);
      try {
        const res = await api.lookupPostalCode(zip);
        const formattedZip = formatZip(zip);
        if (onAddressLookupSuccess) {
          onAddressLookupSuccess(res.address, formattedZip);
        } else {
          onChange(formattedZip);
        }
      } catch (err) {
        setZipLookupError(err.message || 'Not found');
      } finally {
        setZipLookupLoading(false);
      }
    };
    return (
      <div className="space-y-1">
        <div className="flex gap-2 flex-wrap">
          <input
            id={id}
            type="text"
            inputMode="numeric"
            value={value || ''}
            onChange={(e) => {
              const v = e.target.value;
              const s = normalizedZip(v);
              const formatted = s.length <= 3 ? s : `${s.slice(0, 3)}-${s.slice(3)}`;
              onChange(formatted);
            }}
            onBlur={handleBlur}
            placeholder="333-0854"
            maxLength={8}
            className={`${inputClass}${borderClass} flex-1 min-w-[120px]`}
          />
          <button
            type="button"
            onClick={handleLookup}
            disabled={zipLookupLoading}
            className="rounded-lg bg-primary text-on-primary px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition shrink-0"
          >
            {zipLookupLoading ? '…' : '検索'}
          </button>
        </div>
        {(zipLookupError || error) && (
          <p className="text-xs text-danger">{zipLookupError || error}</p>
        )}
      </div>
    );
  }

  // ── Month ─────────────────────────────────────────────────────────────────
  if (field.name === 'month') {
    return (
      <div>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={value || ''}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 2);
            onChange(v);
          }}
          onBlur={handleBlur}
          className={`${inputClass}${borderClass}`}
          placeholder="4"
          maxLength={2}
        />
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  }

  // ── Default text ──────────────────────────────────────────────────────────
  return (
    <div>
      <input
        id={id}
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        className={`${inputClass}${borderClass}`}
        placeholder={field.placeholder}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

// ── Section block ─────────────────────────────────────────────────────────────

function SectionBlock({ section, data, onChange, onAdd, onRemove, canRemove, t, showErrors }) {
  const setItem = useCallback(
    (fieldName, value) => onChange({ ...data, [fieldName]: value }),
    [data, onChange],
  );

  const sectionLabel = (() => {
    const key = `section_${section.type}`;
    const out = t(key);
    return out !== key ? out : section.label;
  })();

  const getFieldLabel = (fieldName) => {
    const normalized = String(fieldName).replace(/\s+/g, '_').toLowerCase();
    for (const k of [`field_${normalized}`, `field_${fieldName}`]) {
      const out = t(k);
      if (out !== k) return out;
    }
    return fieldName.replace(/([A-Z_])/g, ' $1').replace(/_/g, ' ').trim() || fieldName;
  };

  // For year/month/description rows, use a compact 3-column layout
  const isEntrySection = ['education', 'experience', 'licenses'].includes(section.type);
  const hasYMD =
    isEntrySection &&
    section.fields?.some((f) => f.name === 'year') &&
    section.fields?.some((f) => f.name === 'month') &&
    section.fields?.some((f) => f.name === 'description');

  return (
    <div className="rounded-xl border border-edge bg-surface p-3 sm:p-4 space-y-3 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-semibold text-ink-muted text-sm sm:text-base">{sectionLabel}</h4>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-ink-faint hover:text-red-500 transition border border-edge rounded-lg px-2 py-1"
          >
            {t('remove')}
          </button>
        )}
      </div>

      {hasYMD ? (
        /* Compact year / month / description row */
        <div className="grid grid-cols-[80px_60px_1fr] gap-2 items-start">
          {['year', 'month', 'description'].map((fname) => {
            const f = section.fields.find((x) => x.name === fname);
            if (!f) return null;
            return (
              <div key={fname}>
                <label
                  htmlFor={`field-${fname}`}
                  className="block text-xs font-medium text-ink-muted mb-1"
                >
                  {getFieldLabel(fname)}
                </label>
                <Field
                  field={f}
                  value={data[fname]}
                  onChange={(v) => setItem(fname, v)}
                  showErrors={showErrors}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {section.fields?.map((f) => (
            <div
              key={f.name}
              className={
                f.type === 'textarea'
                  ? 'sm:col-span-2'
                  : f.type === 'postal_code'
                    ? 'sm:col-span-2'
                    : ''
              }
            >
              <label
                htmlFor={`field-${f.name}`}
                className="block text-sm font-medium text-ink-muted mb-1"
              >
                {getFieldLabel(f.name)}
              </label>
              <Field
                field={f}
                value={data[f.name]}
                onChange={(v) => setItem(f.name, v)}
                showErrors={showErrors}
                onAddressLookupSuccess={
                  f.type === 'postal_code'
                    ? (address, zip) => onChange({ ...data, current_address: address, postal_code: zip })
                    : undefined
                }
              />
            </div>
          ))}
        </div>
      )}

      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="text-sm text-primary hover:text-primary font-medium hover:underline transition"
        >
          {t('addAnother')}
        </button>
      )}
    </div>
  );
}

// ── Repeatable section types ──────────────────────────────────────────────────

const REPEATABLE = ['experience', 'education', 'licenses'];

// ── Main export ───────────────────────────────────────────────────────────────

export default function DynamicForm({ schema, formData, setFormData, showErrors }) {
  const { t } = useTranslation();

  const updateSection = useCallback(
    (sectionType, index, value) => {
      setFormData((prev) => {
        const next = { ...prev };
        const key = index === 0 ? sectionType : `${sectionType}_${index}`;
        next[key] = value;
        return next;
      });
    },
    [setFormData],
  );

  const addRepeatable = useCallback(
    (sectionType) => {
      setFormData((prev) => {
        const keys = Object.keys(prev || {}).filter(
          (k) => k === sectionType || k.startsWith(`${sectionType}_`),
        );
        const nextIndex = keys.length;
        const next = { ...(prev || {}) };
        next[nextIndex === 0 ? sectionType : `${sectionType}_${nextIndex}`] = {};
        return next;
      });
    },
    [setFormData],
  );

  const removeRepeatable = useCallback(
    (sectionType, index) => {
      setFormData((prev) => {
        const prevData = prev || {};
        const keys = Object.keys(prevData)
          .filter((k) => k === sectionType || k.startsWith(`${sectionType}_`))
          .sort((a, b) => {
            if (a === sectionType) return -1;
            if (b === sectionType) return 1;
            return String(a).localeCompare(b, undefined, { numeric: true });
          });
        const kept = keys.filter((_, i) => i !== index);
        const next = { ...prevData };
        keys.forEach((k) => delete next[k]);
        kept.forEach((k, i) => {
          next[i === 0 ? sectionType : `${sectionType}_${i}`] = prevData[k];
        });
        return next;
      });
    },
    [setFormData],
  );

  if (!schema?.sections?.length) return null;

  return (
    <div className="space-y-6">
      {schema.sections.map((section) => {
        const isRepeatable = REPEATABLE.includes(section.type);
        const keys = Object.keys(formData || {})
          .filter((k) => k === section.type || k.startsWith(`${section.type}_`))
          .sort((a, b) => {
            if (a === section.type) return -1;
            if (b === section.type) return 1;
            return String(a).localeCompare(b, undefined, { numeric: true });
          });
        const count = Math.max(keys.length, 1);

        if (isRepeatable) {
          const blocks = [];
          for (let i = 0; i < count; i++) {
            const key = i === 0 ? section.type : `${section.type}_${i}`;
            blocks.push(
              <SectionBlock
                key={key}
                section={section}
                data={formData?.[key] || {}}
                onChange={(v) => updateSection(section.type, i, v)}
                onAdd={i === count - 1 ? () => addRepeatable(section.type) : null}
                onRemove={() => removeRepeatable(section.type, i)}
                canRemove={count > 1}
                t={t}
                showErrors={showErrors}
              />,
            );
          }
          return (
            <div key={section.type} className="space-y-3">
              <p className="text-xs text-ink-faint font-medium uppercase tracking-wide px-1">
                {t(`section_${section.type}`) !== `section_${section.type}`
                  ? t(`section_${section.type}`)
                  : section.label}
              </p>
              {blocks}
            </div>
          );
        }

        return (
          <SectionBlock
            key={section.type}
            section={section}
            data={formData?.[section.type] || {}}
            onChange={(v) => updateSection(section.type, 0, v)}
            t={t}
            showErrors={showErrors}
          />
        );
      })}
    </div>
  );
}
