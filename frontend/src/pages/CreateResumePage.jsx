import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { renderAsync } from 'docx-preview';
import FileDropzone from '../components/FileDropzone';
import Modal from '../components/Modal';
import VoiceResumeModal from '../components/VoiceResumeModal';
import DynamicForm from '../components/DynamicForm';
import { api } from '../services/api';
import { invalidateHistoryCache } from '../services/historyCache';
import { useTranslation } from '../i18n/LanguageContext';

function DocxPreview({ docxBase64 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!docxBase64 || !containerRef.current) return;
    const el = containerRef.current;
    el.innerHTML = '';
    try {
      const binary = atob(docxBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      renderAsync(bytes.buffer, el, undefined).catch((err) => {
        el.innerHTML = `<p class="p-4 text-red-600 text-sm">Preview error: ${err.message}</p>`;
      });
    } catch (err) {
      el.innerHTML = `<p class="p-4 text-red-600 text-sm">${err.message}</p>`;
    }
  }, [docxBase64]);

  return (
    <div
      className="w-full bg-slate-100 rounded-lg sm:rounded-xl shadow-inner overflow-auto overscroll-contain -mx-1 sm:mx-0"
      style={{ maxHeight: 'min(85vh, 900px)' }}
      role="region"
      aria-label="Document preview"
    >
      <div ref={containerRef} className="bg-white p-3 sm:p-6 docx-wrapper min-w-0" style={{ minHeight: '100%' }} />
    </div>
  );
}

// ── HTML preview (XLSX): show backend HTML as-is in a scrollable frame ─────────

function TemplatePreview({ html }) {
  const isFullDoc = html.trimStart().toLowerCase().startsWith('<!doctype');
  const A4_W = 794;
  const docHtml = isFullDoc
    ? html
    : `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "MS Gothic","Yu Gothic","Noto Sans CJK JP","Hiragino Kaku Gothic Pro",sans-serif;
    font-size: 10pt; padding: 14mm 12mm; color: #000; background: #fff;
    width: ${A4_W}px; min-height: 100%; margin: 0 auto;
  }
  table { border-collapse: collapse; width: 100%; margin-bottom: 3px; }
  td, th { border: 1px solid #333; padding: 3px 6px; vertical-align: top; }
  p { margin-bottom: 2px; line-height: 1.5; }
  img { max-width: 40mm; max-height: 50mm; object-fit: contain; display: block; }
</style>
</head>
<body>${html}</body>
</html>`;

  return (
    <div
      className="w-full bg-slate-100 rounded-lg sm:rounded-xl overflow-auto overscroll-contain -mx-1 sm:mx-0"
      style={{ maxHeight: 'min(85vh, 900px)' }}
      role="region"
      aria-label="Template preview"
    >
      <iframe
        srcDoc={docHtml}
        title="Template preview"
        className="w-full min-w-0 border-0 block bg-transparent"
        style={{
          minHeight: '1200px',
          height: '4000px',
          display: 'block',
        }}
        sandbox="allow-same-origin"
      />
    </div>
  );
}

function getEmptyFormData(schema) {
  if (!schema?.sections?.length) return {};
  const form = {};
  for (const section of schema.sections) {
    if (['education', 'experience', 'licenses'].includes(section.type)) {
      form[section.type] = [{}];
    } else {
      form[section.type] = (section.fields || []).reduce((acc, f) => ({ ...acc, [f.name]: '' }), {});
    }
  }
  return form;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CreateResumePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [schema, setSchema] = useState(location.state?.schema ?? null);
  const [formData, setFormData] = useState(location.state?.data ?? {});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateTab, setTemplateTab] = useState('docx');
  const [templates, setTemplates] = useState([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showFormErrors, setShowFormErrors] = useState(false);
  const [limitModal, setLimitModal] = useState({ open: false, mode: 'template', limit: 0 });

  // Template preview panel open/closed
  const [previewOpen, setPreviewOpen] = useState(false);

  // Sync state from router location when navigating from History
  useEffect(() => {
    if (location.state?.schema) setSchema(location.state.schema);
    if (location.state?.data) setFormData(location.state.data);
  }, [location.state]);

  // Load built-in templates when modal opens
  useEffect(() => {
    if (!templateModalOpen) return;
    let cancelled = false;
    (async () => {
      setTemplateLoading(true);
      try {
        const res = await api.getTemplates();
        if (!cancelled && res?.templates) setTemplates(res.templates);
      } catch {
        if (!cancelled) setTemplates([]);
      } finally {
        if (!cancelled) setTemplateLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [templateModalOpen]);

  // Build avatar preview data URL
  useEffect(() => {
    if (!avatarFile) { setAvatarPreviewUrl(null); return; }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreviewUrl(reader.result);
    reader.readAsDataURL(avatarFile);
    return () => setAvatarPreviewUrl(null);
  }, [avatarFile]);

  const handleSelectTemplate = useCallback(
    async (templateId) => {
      setUploadError(null);
      setTemplateLoading(true);
      try {
        const res = await api.getTemplate(templateId);
        const {
          sections,
          avatarRequired,
          templateHtml,
          originalDocxBase64,
          annotatedDocxBase64,
          templateXlsxBase64,
        } = res;
        setSchema({
          sections: sections || [],
          avatarRequired: avatarRequired !== false,
          templateHtml: templateHtml || null,
          originalDocxBase64: originalDocxBase64 || null,
          annotatedDocxBase64: annotatedDocxBase64 || null,
          templateXlsxBase64: templateXlsxBase64 || null,
        });
        setFormData(getEmptyFormData({ sections: sections || [] }));
        setPreviewOpen(true);
        setTemplateModalOpen(false);
      } catch (err) {
        setUploadError(err.message || t('uploadFailed'));
      } finally {
        setTemplateLoading(false);
      }
    },
    [t],
  );

  const handleFile = useCallback(
    async (file) => {
      setUploadError(null);
      setPreviewOpen(false);
      setUploadLoading(true);
      try {
        const result = await api.uploadSample(file);
        setSchema(result);
        setFormData({});
        if (result.templateHtml) setPreviewOpen(true);
      } catch (err) {
        setUploadError(err.message || t('uploadFailed'));
      } finally {
        setUploadLoading(false);
      }
    },
    [t],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowFormErrors(true);
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      const payload = { ...formData };
      if (avatarFile) {
        payload.avatar = avatarFile.name;
        const base64 = await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result);
          r.onerror = reject;
          r.readAsDataURL(avatarFile);
        });
        payload.avatarBase64 = base64;
      }
      await api.generateResume(schema, payload, 'template');
      invalidateHistoryCache();
      navigate('/dashboard/history');
    } catch (err) {
      if (err?.code === 'TEMPLATE_LIMIT_REACHED') {
        setLimitModal({ open: true, mode: 'template', limit: err.limit || 10 });
      }
      setSubmitError(err.message || t('generationFailed'));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleVoiceSave = async (voiceSchema, voiceFormData, previewHtml) => {
    try {
      await api.generateResume(voiceSchema, voiceFormData, 'voice', { previewHtml });
      invalidateHistoryCache();
      setVoiceModalOpen(false);
      navigate('/dashboard/history');
      return true;
    } catch (err) {
      if (err?.code === 'VOICE_LIMIT_REACHED') {
        setLimitModal({ open: true, mode: 'voice', limit: err.limit || 5 });
      }
      return false;
    }
  };

  const hasPreview = !!schema?.templateHtml || !!schema?.originalDocxBase64 || !!schema?.annotatedDocxBase64;
  const previewIsDocx = !!schema?.originalDocxBase64 || !!schema?.annotatedDocxBase64;
  // Превью = файл как есть (оригинал без плейсхолдеров). Генерация использует annotatedDocxBase64.
  const docxForPreview = schema?.originalDocxBase64 ?? schema?.annotatedDocxBase64;

  return (
    <div className="space-y-6 sm:space-y-8 pb-24 sm:pb-28">
      {/* Page heading */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{t('createResume')}</h1>
        <p className="mt-1 text-slate-500 text-sm sm:text-base">{t('createResumeSubtitle')}</p>
      </div>

      {/* ── Generate by voice (purple CTA) ───────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setVoiceModalOpen(true)}
        className="fixed z-40 bottom-20 sm:bottom-24 right-4 sm:right-6 group animate-[floatBtn_2.4s_ease-in-out_infinite]"
        aria-label={t('generateByVoice')}
      >
        <span className="absolute inset-0 rounded-full bg-violet-500/25 animate-ping" />
        <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-fuchsia-400/40 via-violet-500/40 to-indigo-500/40 blur-md animate-pulse" />
        <span className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[radial-gradient(circle_at_30%_30%,#a78bfa_0%,#8b5cf6_35%,#7c3aed_65%,#6d28d9_100%)] text-white shadow-2xl shadow-violet-500/40 group-hover:scale-105 group-active:scale-95 transition-transform duration-200">
          <svg
            viewBox="0 0 64 64"
            className="w-9 h-9 sm:w-10 sm:h-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.25)]"
            aria-hidden
          >
            <defs>
              <linearGradient id="voiceMicBody" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="55%" stopColor="#fde68a" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <linearGradient id="voiceMicHead" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#fff7ed" />
                <stop offset="100%" stopColor="#fdba74" />
              </linearGradient>
            </defs>
            <rect x="22" y="9" width="20" height="30" rx="10" fill="url(#voiceMicHead)" stroke="#7c2d12" strokeWidth="2.2" />
            <rect x="28" y="40" width="8" height="10" rx="4" fill="url(#voiceMicBody)" stroke="#7c2d12" strokeWidth="2.2" />
            <path d="M16 31c0 8.9 7.1 16 16 16s16-7.1 16-16" fill="none" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M32 50v5" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M25 55h14" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M9 26c-2 2.2-3 4.8-3 7.6" stroke="#f5f3ff" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M55 26c2 2.2 3 4.8 3 7.6" stroke="#f5f3ff" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </span>
        <span className="mt-2 hidden sm:block text-xs font-semibold text-violet-700 bg-white/95 rounded-full px-3 py-1 border border-violet-100 shadow text-center group-hover:translate-y-[-1px] transition-transform">
          {t('generateByVoice')}
        </span>
        <style>{`@keyframes floatBtn { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }`}</style>
      </button>

      {/* ── A. Upload (blocked: use templates below) ─────────────────────────── */}
      <section className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm relative">
        <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">
          {t('uploadExample')}
        </h2>
        {uploadLoading ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-8 sm:py-12 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent" />
            <p className="mt-3 text-slate-500">{t('analyzingResume')}</p>
          </div>
        ) : (
          <>
            <div className="relative">
              <FileDropzone onFile={handleFile} disabled={true} />
              <div
                className="absolute inset-0 rounded-xl bg-slate-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white z-10"
                aria-hidden
              >
                <p className="text-center font-medium px-4">{t('featureUnavailable')}</p>
                <button
                  type="button"
                  onClick={() => setTemplateModalOpen(true)}
                  className="mt-3 rounded-lg bg-white text-slate-800 px-4 py-2 text-sm font-medium hover:bg-slate-100 transition"
                >
                  {t('chooseTemplate')}
                </button>
              </div>
            </div>
          </>
        )}
        {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
      </section>

      {/* ── B. Template preview ────────────────────────────────────────────── */}
      {hasPreview && (
        <section className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Header bar: compact on mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex flex-shrink-0 items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                B
              </span>
              <h2 className="text-sm sm:text-lg font-semibold text-slate-800 truncate">
                {t('templatePreview')}
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {/* Open full-screen in new tab */}
              <button
                type="button"
                onClick={() => {
                  if (previewIsDocx && docxForPreview) {
                    const b64 = docxForPreview;
                    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<script src="https://unpkg.com/jszip@3/dist/jszip.min.js"><\/script>
<script src="https://unpkg.com/docx-preview@0.3.0/dist/docx-preview.min.js"><\/script>
<style>body{margin:0;padding:16px;background:#f1f5f9;}#root{background:#fff;}</style></head>
<body><div id="root"></div><script>
var b64="${docxForPreview}";
var bin=atob(b64);
var buf=new Uint8Array(bin.length);
for(var i=0;i<bin.length;i++) buf[i]=bin.charCodeAt(i);
if(typeof docx!=='undefined') docx.renderAsync(buf.buffer,document.getElementById("root"));
<\/script></body></html>`;
                    const blob = new Blob([html], { type: 'text/html' });
                    window.open(URL.createObjectURL(blob), '_blank');
                    return;
                  }
                  if (!schema?.templateHtml) return;
                  const isFullDoc = schema.templateHtml.trimStart().toLowerCase().startsWith('<!doctype');
                  const blob = new Blob(
                    [
                      isFullDoc
                        ? schema.templateHtml
                        : `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'MS Gothic','Noto Sans CJK JP',sans-serif;padding:14mm 12mm;font-size:10pt;}
  table{border-collapse:collapse;width:100%;}
  td,th{border:1px solid #333;padding:3px 6px;vertical-align:top;}
  p{margin-bottom:2px;line-height:1.5;}
</style></head><body>${schema.templateHtml}</body></html>`,
                    ],
                    { type: 'text/html' },
                  );
                  const url = URL.createObjectURL(blob);
                  window.open(url, '_blank');
                  setTimeout(() => URL.revokeObjectURL(url), 60000);
                }}
                className="text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 transition font-medium flex items-center gap-1 py-1.5 touch-manipulation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span className="whitespace-nowrap">{t('openFullscreen')}</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewOpen((v) => !v)}
                className="text-xs sm:text-sm text-slate-500 hover:text-slate-700 transition font-medium py-1.5 touch-manipulation"
              >
                {previewOpen ? t('hidePreview') : t('showPreview')}
              </button>
            </div>
          </div>

          {/* Preview: DOCX = real document render, else HTML iframe — full width on mobile with scroll */}
          {previewOpen && previewIsDocx && docxForPreview && (
            <div className="px-2 sm:px-6 py-3 sm:py-4 min-w-0">
              <DocxPreview docxBase64={docxForPreview} />
            </div>
          )}
          {previewOpen && !previewIsDocx && schema?.templateHtml && (
            <div className="px-2 sm:px-6 py-3 sm:py-4 min-w-0">
              <TemplatePreview html={schema.templateHtml} />
            </div>
          )}
        </section>
      )}

      {/* ── B. Template selection ───────────────────────────────────────────── */}
      <section className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">
          {t('templateSelection')}
        </h2>
        <p className="text-slate-500 text-sm mb-4">{t('selectTemplateHint')}</p>
        <button
          type="button"
          onClick={() => setTemplateModalOpen(true)}
          className="w-full sm:w-auto rounded-xl bg-emerald-50 text-emerald-700 px-4 py-2.5 sm:py-2 font-medium hover:bg-emerald-100 transition border border-emerald-200"
        >
          {t('selectTemplate')}
        </button>
        <Modal
          open={templateModalOpen}
          onClose={() => setTemplateModalOpen(false)}
          title={t('selectTemplate')}
          size="lg"
        >
          {templateLoading && !templates.length ? (
            <div className="flex items-center justify-center py-8">
              <span className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : (
            <>
              <div className="flex rounded-lg bg-slate-100 p-0.5 mb-3 sm:mb-4">
                <button
                  type="button"
                  onClick={() => setTemplateTab('docx')}
                  className={`flex-1 rounded-md px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition touch-manipulation ${templateTab === 'docx' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  {t('tabWord')}
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateTab('xlsx')}
                  className={`flex-1 rounded-md px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition touch-manipulation ${templateTab === 'xlsx' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  {t('tabExcel')}
                </button>
              </div>
              <div key={templateTab} className="grid grid-cols-1 gap-2 sm:gap-3 max-w-full overflow-x-hidden">
                {templates
                  .filter((tmpl) => String(tmpl.type).toLowerCase() === templateTab)
                  .map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl.id)}
                  disabled={templateLoading}
                  className="rounded-lg sm:rounded-xl border border-slate-200 bg-white overflow-hidden text-left hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10 transition disabled:opacity-50 focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:outline-none w-full touch-manipulation"
                >
                  <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                    <span className="font-semibold text-slate-800 text-xs sm:text-sm truncate">
                      {t(tmpl.nameKey).replace(/\s*[—\-]\s*(DOCX|Excel|XLSX)$/i, '')}
                    </span>
                    <span className={`flex-shrink-0 text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-md ${tmpl.type === 'docx' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {tmpl.type === 'docx' ? 'DOCX' : 'XLSX'}
                    </span>
                  </div>
                  <div className="p-2 sm:p-4 min-h-[88px] sm:min-h-[110px] flex items-center justify-center relative">
                    {tmpl.type === 'docx' ? (
                      /* Word-style: document page with shadow */
                      tmpl.id.startsWith('rirekisho') ? (
                        <div className="w-full max-w-[200px] sm:max-w-[240px] mx-auto bg-white rounded-sm overflow-hidden shadow-lg border border-slate-200" style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)' }}>
                          <div className="px-2 py-1 bg-blue-50/80 border-b border-slate-200 flex items-center gap-1" style={{ fontSize: '9px' }}>
                            <span className="text-blue-600 font-medium">Word</span>
                            <span className="text-slate-400">—</span>
                            <span className="text-slate-500 truncate">履歴書</span>
                          </div>
                          <table className="w-full border-collapse" style={{ tableLayout: 'fixed', fontSize: '10px' }}>
                            <tbody>
                              <tr><td className="border border-slate-300 bg-slate-100 font-bold py-1 px-1.5 text-center" colSpan={3}>履歴書</td></tr>
                              <tr><td className="border border-slate-300 bg-slate-50 w-14 py-0.5 px-1">日付</td><td className="border border-slate-300 py-0.5 px-1 text-slate-400">年月日</td><td className="border border-slate-300 w-12 py-0.5 text-center text-slate-500">写真</td></tr>
                              <tr><td className="border border-slate-300 bg-slate-50 py-0.5 px-1">氏名</td><td className="border border-slate-300 py-0.5 px-1"></td><td rowSpan={4} className="border border-slate-300 bg-slate-50/50"></td></tr>
                              <tr><td className="border border-slate-300 bg-slate-50 py-0.5 px-1">ふりがな</td><td className="border border-slate-300 py-0.5 px-1"></td></tr>
                              <tr><td className="border border-slate-300 bg-slate-50 py-0.5 px-1">生年月日</td><td className="border border-slate-300 py-0.5 px-1"></td></tr>
                              <tr><td className="border border-slate-300 bg-slate-50 py-0.5 px-1">現住所</td><td className="border border-slate-300 py-0.5 px-1"></td></tr>
                              <tr><td className="border border-slate-300 bg-slate-50 py-0.5 px-1" colSpan={3}>学歴・職歴</td></tr>
                              <tr><td className="border border-slate-300 w-8 text-center py-0.5">年</td><td className="border border-slate-300 w-8 text-center py-0.5">月</td><td className="border border-slate-300 py-0.5 px-1">学歴・職歴</td></tr>
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="w-full max-w-[200px] sm:max-w-[240px] mx-auto bg-white rounded-sm overflow-hidden shadow-lg border border-slate-200" style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)' }}>
                          <div className="px-2 py-1 bg-blue-50/80 border-b border-slate-200 flex items-center gap-1" style={{ fontSize: '9px' }}>
                            <span className="text-blue-600 font-medium">Word</span>
                            <span className="text-slate-400">—</span>
                            <span className="text-slate-500 truncate">職務経歴書</span>
                          </div>
                          <table className="w-full border-collapse" style={{ tableLayout: 'fixed', fontSize: '10px' }}>
                            <tbody>
                              <tr><td className="border border-slate-300 bg-slate-100 font-bold py-1.5 px-2 text-center" colSpan={2}>職務経歴書</td></tr>
                              <tr><td className="border border-slate-300 bg-slate-50 w-16 py-0.5 px-1">氏名</td><td className="border border-slate-300 py-0.5 px-1"></td></tr>
                              <tr><td className="border border-slate-300 bg-slate-50 py-0.5 px-1">メール</td><td className="border border-slate-300 py-0.5 px-1"></td></tr>
                              <tr><td className="border border-slate-300 bg-blue-50/80 font-semibold py-0.5 px-1">1. キャリアサマリー</td><td className="border border-slate-300 py-0.5 px-1"></td></tr>
                              <tr><td className="border border-slate-300 bg-blue-50/80 font-semibold py-0.5 px-1">2. 職務経歴</td><td className="border border-slate-300 py-0.5 px-1"></td></tr>
                              <tr><td className="border border-slate-300 bg-blue-50/80 font-semibold py-0.5 px-1">3. 学歴</td><td className="border border-slate-300 py-0.5 px-1"></td></tr>
                            </tbody>
                          </table>
                        </div>
                      )
                    ) : (
                      /* Excel-style: grid with column letters and row numbers */
                      tmpl.id.startsWith('rirekisho') ? (
                        <div className="w-full max-w-[220px] sm:max-w-[260px] mx-auto overflow-hidden rounded-md border-2 border-green-200 bg-white" style={{ fontSize: '10px' }}>
                          <div className="px-2 py-1 bg-green-50 border-b border-green-200 flex items-center gap-1">
                            <span className="text-green-700 font-semibold">Excel</span>
                            <span className="text-slate-400">—</span>
                            <span className="text-slate-600 truncate">履歴書</span>
                          </div>
                          <div className="border-b border-r border-green-200/80 flex bg-slate-50">
                            <div className="w-6 flex-shrink-0 border-r border-green-200/80 bg-slate-100/80" />
                            <div className="flex flex-1">
                              <div className="w-12 border-r border-green-200/80 py-0.5 text-center text-slate-500 font-medium">A</div>
                              <div className="w-14 border-r border-green-200/80 py-0.5 text-center text-slate-500 font-medium">B</div>
                              <div className="flex-1 py-0.5 text-center text-slate-500 font-medium">C</div>
                            </div>
                          </div>
                          {[1, 2, 3, 4, 5, 6, 7].map((row) => (
                            <div key={row} className="flex border-b border-green-200/60">
                              <div className="w-6 flex-shrink-0 border-r border-green-200/80 bg-slate-100/60 py-0.5 text-center text-slate-400 text-[9px]">{row}</div>
                              <div className="flex-1 flex">
                                <div className="w-12 border-r border-slate-200 py-0.5 px-0.5">{row === 1 ? '日付' : row === 2 ? '氏名' : row === 3 ? 'ふりがな' : row === 4 ? '生年月日' : row === 5 ? '現住所' : row === 6 ? '学歴' : ''}</div>
                                <div className="w-14 border-r border-slate-200 py-0.5 px-0.5 text-slate-400"></div>
                                <div className="flex-1 py-0.5 px-0.5">{row === 6 ? '年' : row === 7 ? '月' : ''}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-full max-w-[220px] sm:max-w-[260px] mx-auto overflow-hidden rounded-md border-2 border-green-200 bg-white" style={{ fontSize: '10px' }}>
                          <div className="px-2 py-1 bg-green-50 border-b border-green-200 flex items-center gap-1">
                            <span className="text-green-700 font-semibold">Excel</span>
                            <span className="text-slate-400">—</span>
                            <span className="text-slate-600 truncate">職務経歴書</span>
                          </div>
                          <div className="border-b border-r border-green-200/80 flex bg-slate-50">
                            <div className="w-6 flex-shrink-0 border-r border-green-200/80 bg-slate-100/80" />
                            <div className="flex flex-1">
                              <div className="w-20 border-r border-green-200/80 py-0.5 text-center text-slate-500 font-medium">A</div>
                              <div className="flex-1 py-0.5 text-center text-slate-500 font-medium">B</div>
                            </div>
                          </div>
                          {[1, 2, 3, 4, 5, 6].map((row) => (
                            <div key={row} className="flex border-b border-green-200/60">
                              <div className="w-6 flex-shrink-0 border-r border-green-200/80 bg-slate-100/60 py-0.5 text-center text-slate-400 text-[9px]">{row}</div>
                              <div className="flex-1 flex">
                                <div className="w-20 border-r border-slate-200 py-0.5 px-0.5">{row === 1 ? '氏名' : row === 2 ? 'メール' : row === 3 ? '1.キャリア' : row === 4 ? '2.職務経歴' : row === 5 ? '3.学歴' : '4.資格'}</div>
                                <div className="flex-1 py-0.5 px-0.5 text-slate-400"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                </button>
              ))}
              </div>
            </>
          )}
        </Modal>
      </section>

      <VoiceResumeModal
        open={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onSave={handleVoiceSave}
      />
      <Modal
        open={limitModal.open}
        onClose={() => setLimitModal({ open: false, mode: 'template', limit: 0 })}
        title={t('limitModalTitle')}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800 text-sm sm:text-base">
            {limitModal.mode === 'voice'
              ? t('voiceLimitExceededMessage').replace('{limit}', String(limitModal.limit || 5))
              : t('templateLimitExceededMessage').replace('{limit}', String(limitModal.limit || 10))}
          </div>
          <p className="text-slate-500 text-sm">{t('limitModalHint')}</p>
          <button
            type="button"
            onClick={() => setLimitModal({ open: false, mode: 'template', limit: 0 })}
            className="w-full rounded-xl bg-slate-900 text-white py-2.5 font-medium hover:bg-slate-800 transition"
          >
            {t('voiceClose')}
          </button>
        </div>
      </Modal>

      {/* ── D. Form + generate ─────────────────────────────────────────────── */}
      {schema && (
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8" noValidate>
          <section className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-4">
              {t('yourInformation')}
            </h2>

            {/* Photo upload */}
            {schema.avatarRequired !== false && (
              <div className="mb-6 pb-6 border-b border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('profilePhoto')}
                  <span className="ml-1 text-xs text-slate-400 font-normal">
                    (40 × 50 mm 推奨)
                  </span>
                </label>
                <div className="flex flex-wrap items-center gap-4">
                  {avatarPreviewUrl ? (
                    <div className="relative flex-shrink-0">
                      <img
                        src={avatarPreviewUrl}
                        alt=""
                        className="h-24 w-20 rounded-lg border border-slate-200 object-cover shadow-sm"
                        style={{ aspectRatio: '4/5' }}
                      />
                      <button
                        type="button"
                        onClick={() => setAvatarFile(null)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600"
                        title="Remove photo"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="flex-shrink-0 h-24 w-20 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-300 text-xs">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      写真
                    </div>
                  )}
                  <div>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {t('chooseFile')}
                    </label>
                    <p className="mt-1 text-xs text-slate-400">
                      {avatarFile ? avatarFile.name : t('noFileChosen')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DynamicForm
              schema={schema}
              formData={formData}
              setFormData={setFormData}
              showErrors={showFormErrors}
            />
          </section>

          <section className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">
              {t('generateSection')}
            </h2>
            {submitError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}
            <button
              type="submit"
              disabled={submitLoading}
              className="w-full sm:w-auto rounded-xl bg-emerald-600 text-white font-semibold px-8 py-3 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
            >
              {submitLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  {t('generating')}
                </span>
              ) : (
                t('generateResume')
              )}
            </button>
          </section>
        </form>
      )}

      {!schema && !uploadLoading && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-400 text-sm">
          {t('uploadHint')}
        </div>
      )}
    </div>
  );
}
