import { useCallback, useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';

const DEFAULT_ACCEPT = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xlsx',
].join(',');

export default function FileDropzone({ onFile, accept = DEFAULT_ACCEPT, disabled, className = '' }) {
  const { t } = useTranslation();
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState(null);
  const docxOnly = accept.toLowerCase().includes('docx') && !accept.toLowerCase().includes('pdf');

  const validate = useCallback(
    (file) => {
      const allowed = accept.split(',').map((a) => a.trim());
      const ok = allowed.some((a) => {
        if (a.startsWith('.')) return file.name.toLowerCase().endsWith(a);
        return file.type === a;
      });
      if (!ok) {
        setError(docxOnly ? t('onlyDocx') : t('onlyPdfDocx'));
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(t('fileTooBig'));
        return false;
      }
      setError(null);
      return true;
    },
    [accept, t, docxOnly]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDrag(false);
      if (disabled) return;
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      if (validate(file)) onFile(file);
    },
    [disabled, onFile, validate]
  );

  const handleChange = useCallback(
    (e) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      if (validate(file)) onFile(file);
      e.target.value = '';
    },
    [onFile, validate]
  );

  return (
    <div
      className={`
        rounded-xl border-2 border-dashed transition
        ${drag && !disabled ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-slate-50/50'}
        ${disabled ? 'opacity-60 pointer-events-none' : 'cursor-pointer hover:border-slate-300'}
        ${className}
      `}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
    >
      <label className="flex flex-col items-center justify-center py-8 sm:py-10 px-4 sm:px-6 cursor-pointer text-center">
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
          disabled={disabled}
        />
        <span className="text-3xl sm:text-4xl mb-2">📄</span>
        <span className="text-slate-600 font-medium text-sm sm:text-base">{t('dropOrClick')}</span>
        <span className="text-slate-400 text-xs sm:text-sm mt-1">{t('pdfDocxMax')}</span>
        {error && <p className="mt-2 text-sm text-amber-600">{error}</p>}
      </label>
    </div>
  );
}
