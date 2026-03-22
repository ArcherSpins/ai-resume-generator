import { useState, useRef, useEffect, useCallback } from 'react';
import Modal from './Modal';
import DynamicForm from './DynamicForm';
import { useTranslation } from '../i18n/LanguageContext';
import { api, getAuthToken } from '../services/api';

const VOICE_LAYOUT_OPTIONS = [
  { id: 'classic', nameKey: 'voiceLayoutClassic' },
  { id: 'modern', nameKey: 'voiceLayoutModern' },
  { id: 'official', nameKey: 'voiceLayoutOfficial' },
];

const VOICE_QUESTIONS = [
  { id: 'name', key: 'field_name' },
  { id: 'birthdate', key: 'field_birthdate' },
  { id: 'current_address', key: 'field_current_address' },
  { id: 'phone', key: 'field_phone' },
  { id: 'email', key: 'field_email' },
  { id: 'education', key: 'field_education' },
  { id: 'experience', key: 'field_experience' },
  { id: 'licenses', key: 'field_licenses' },
  { id: 'self_pr', key: 'field_self_pr' },
  { id: 'strength_points', key: 'field_strength_points' },
  { id: 'weakness_points', key: 'field_weakness_points' },
  { id: 'research_learning', key: 'field_research_learning' },
];

/** Outer box height for large template demo preview on record step */
const RECORD_LARGE_PREVIEW_WRAP_H = 440;
/** Inner iframe content height before CSS scale (A4-ish) */
const RECORD_LARGE_PREVIEW_IFRAME_H = 800;

function AnimeGirlIllustrationSvg({ className }) {
  return (
    <div className={`w-full flex items-center justify-center bg-gradient-to-b from-violet-50/80 to-fuchsia-50/80 ${className || ''}`} style={{ minHeight: 260 }}>
      <svg viewBox="0 0 200 260" className="w-full max-h-[260px] object-contain animate-float" style={{ minHeight: 220 }} aria-hidden>
        <defs>
          <linearGradient id="vg-hair" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#5c4033" /><stop offset="100%" stopColor="#3d2914" /></linearGradient>
          <linearGradient id="vg-skin" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ffecd2" /><stop offset="100%" stopColor="#fcb69f" /></linearGradient>
          <linearGradient id="vg-dress" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#7c3aed" /></linearGradient>
          <filter id="vg-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" /></filter>
        </defs>
        <ellipse cx="100" cy="88" rx="58" ry="62" fill="url(#vg-hair)" filter="url(#vg-shadow)" />
        <path d="M 45 95 Q 40 140 55 200 L 145 200 Q 160 140 155 95 Z" fill="url(#vg-hair)" />
        <ellipse cx="100" cy="92" rx="42" ry="45" fill="url(#vg-skin)" />
        <g fill="none" stroke="#2d1b0e" strokeWidth="2" strokeLinecap="round">
          <ellipse cx="78" cy="88" rx="8" ry="10" fill="#fff" /><ellipse cx="78" cy="90" rx="5" ry="6" fill="#2d1b0e" />
          <ellipse cx="122" cy="88" rx="8" ry="10" fill="#fff" /><ellipse cx="122" cy="90" rx="5" ry="6" fill="#2d1b0e" />
        </g>
        <ellipse cx="62" cy="102" rx="12" ry="6" fill="#ffb7c5" opacity="0.7" /><ellipse cx="138" cy="102" rx="12" ry="6" fill="#ffb7c5" opacity="0.7" />
        <path d="M 82 108 Q 100 120 118 108" stroke="#c4956a" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M 58 135 Q 55 200 55 218 L 145 218 Q 145 200 142 135 Q 100 155 58 135 Z" fill="url(#vg-dress)" filter="url(#vg-shadow)" />
        <path d="M 70 132 L 100 145 L 130 132" fill="none" stroke="#c4b5fd" strokeWidth="3" strokeLinecap="round" />
        <g style={{ transformOrigin: '120px 140px', animation: 'voiceWave 1.2s ease-in-out infinite' }}>
          <ellipse cx="155" cy="148" rx="14" ry="18" fill="url(#vg-skin)" /><ellipse cx="158" cy="145" rx="6" ry="7" fill="url(#vg-skin)" />
        </g>
      </svg>
      <style>{`@keyframes voiceWave { 0%, 100% { transform: rotate(-10deg); } 50% { transform: rotate(14deg); } } @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } } .animate-float { animation: float 2.5s ease-in-out infinite; }`}</style>
    </div>
  );
}

export default function VoiceResumeModal({ open, onClose, onSave }) {
  const { t } = useTranslation();
  const [step, setStep] = useState('record');
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [voiceResult, setVoiceResult] = useState(null);
  const [showTextEdit, setShowTextEdit] = useState(false);
  const [editingFormData, setEditingFormData] = useState({});
  const [updatingPreview, setUpdatingPreview] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [micError, setMicError] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null);
  const [avatarBase64, setAvatarBase64] = useState(null);
  const [micLevel, setMicLevel] = useState(0);
  const [micLabel, setMicLabel] = useState('');
  const [microphones, setMicrophones] = useState([]);
  const [selectedMicId, setSelectedMicId] = useState('default');
  const [audioDebug, setAudioDebug] = useState(null);
  const [voiceLayout, setVoiceLayout] = useState('classic');
  const [layoutDemos, setLayoutDemos] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const recordedMimeRef = useRef('audio/webm');
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);

  const stopMeter = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    analyserRef.current = null;
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close?.();
      } catch (_) {}
    }
    audioCtxRef.current = null;
    setMicLevel(0);
  }, []);

  const startMeter = useCallback(
    (stream) => {
      try {
        stopMeter();
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.8;
        src.connect(analyser);
        analyserRef.current = analyser;
        const data = new Uint8Array(analyser.fftSize);
        const tick = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);
          const level = Math.min(1, Math.max(0, rms * 3)); // normalize a bit
          setMicLevel(level);
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (_) {
        // ignore meter failures
      }
    },
    [stopMeter]
  );

  const clearState = useCallback(() => {
    setStep('record');
    setRecording(false);
    setPlaying(false);
    setMicError(null);
    setAvatarFile(null);
    setAvatarPreviewUrl(null);
    setAvatarBase64(null);
    setMicLabel('');
    setAudioDebug(null);
    setSaving(false);
    stopMeter();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setPreviewHtml(null);
    setVoiceResult(null);
    setShowTextEdit(false);
    setEditingFormData({});
    setUpdatingPreview(false);
    setTranscript('');
    setVoiceLayout('classic');
  }, [audioUrl, stopMeter]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    api
      .getVoiceLayoutDemos()
      .then((r) => {
        if (!cancelled && r?.demos) setLayoutDemos(r.demos);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleLayoutPick = async (id) => {
    if (id === voiceLayout) return;
    setVoiceLayout(id);
    if (step !== 'preview' || !voiceResult?.formData) return;
    setUpdatingPreview(true);
    try {
      const merged = {
        ...voiceResult.formData,
        avatarBase64: voiceResult.formData.avatarBase64 || avatarBase64 || undefined,
      };
      const res = await api.generateVoicePreview(merged, merged.avatarBase64, id);
      setPreviewHtml(res.previewHtml || previewHtml);
      setVoiceResult({
        schema: {
          ...voiceResult.schema,
          voiceHtmlLayout: id,
          annotatedTemplateHtml: res.previewHtml,
        },
        formData: merged,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingPreview(false);
    }
  };

  const buildCompleteFormData = useCallback((schema, current) => {
    const base = { ...(current || {}) };
    const sections = schema?.sections || [];
    for (const section of sections) {
      if (['education', 'experience', 'licenses'].includes(section.type)) {
        const hasAny = Object.keys(base).some((k) => k === section.type || k.startsWith(`${section.type}_`));
        if (!hasAny) base[section.type] = {};
      } else if (!base[section.type] || typeof base[section.type] !== 'object') {
        const row = {};
        for (const f of section.fields || []) row[f.name] = '';
        base[section.type] = row;
      } else {
        for (const f of section.fields || []) {
          if (base[section.type][f.name] == null) base[section.type][f.name] = '';
        }
      }
    }
    return base;
  }, []);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl(null);
      setAvatarBase64(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(url);
    const r = new FileReader();
    r.onload = () => setAvatarBase64(typeof r.result === 'string' ? r.result : null);
    r.readAsDataURL(avatarFile);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  useEffect(() => {
    if (!open) clearState();
  }, [open, clearState]);

  const loadMicrophones = useCallback(async () => {
    if (!navigator?.mediaDevices?.enumerateDevices) return;
    const devices = await navigator.mediaDevices.enumerateDevices();
    const mics = devices.filter((d) => d.kind === 'audioinput');
    setMicrophones(mics);
    if (!mics.some((m) => m.deviceId === selectedMicId)) {
      setSelectedMicId('default');
    }
  }, [selectedMicId]);

  useEffect(() => {
    if (!open) return;
    loadMicrophones().catch(() => {});
    const onDeviceChange = () => loadMicrophones().catch(() => {});
    navigator.mediaDevices?.addEventListener?.('devicechange', onDeviceChange);
    return () => navigator.mediaDevices?.removeEventListener?.('devicechange', onDeviceChange);
  }, [open, loadMicrophones]);

  const startRecording = async () => {
    try {
      const audioConstraint = selectedMicId && selectedMicId !== 'default'
        ? { deviceId: { exact: selectedMicId } }
        : true;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraint });
      loadMicrophones().catch(() => {});
      streamRef.current = stream;
      chunksRef.current = [];
      setAudioDebug(null);
      const track = stream.getAudioTracks?.()?.[0];
      setMicLabel(track?.label || '');
      startMeter(stream);
      // Prefer formats that play back reliably: Safari often needs audio/mp4, Chrome/Firefox webm
      const isSafari = /^((?!chrome|android|crios|fxios).)*safari|iphone|ipad/i.test(navigator.userAgent) || (navigator.userAgent.includes('Mac') && !navigator.userAgent.includes('Chrome'));
      const mimeTypes = isSafari
        ? ['audio/mp4', 'audio/mp4;codecs=mp4a', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
        : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
      const mime = mimeTypes.find((type) => MediaRecorder.isTypeSupported?.(type)) || '';
      const options = mime ? { mimeType: mime } : {};
      const recorder = new MediaRecorder(stream, options);
      recordedMimeRef.current = recorder.mimeType || 'audio/webm';
      mediaRecorderRef.current = recorder;
      recorder.onerror = (e) => console.error('MediaRecorder error:', e);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        streamRef.current?.getTracks().forEach((tr) => tr.stop());
        stopMeter();
        if (chunksRef.current.length === 0) return;
        const mimeType = recordedMimeRef.current || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size < 500) return; // too short, likely empty
        setAudioDebug({ mime: mimeType, chunks: chunksRef.current.length, bytes: blob.size });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };
      // Use timeslice so dataavailable fires during recording (fixes silent blob in many browsers)
      recorder.start(200);
      setRecording(true);
      setMicError(null);
    } catch (err) {
      console.error('Microphone access failed:', err);
      setMicError(err?.name === 'NotAllowedError' ? 'denied' : 'unavailable');
      stopMeter();
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recording) {
      if (recorder.state === 'recording') recorder.requestData(); // flush last chunk before stop
      recorder.stop();
      setRecording(false);
    }
  };

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnd = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    el.addEventListener('ended', onEnd);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    return () => {
      el.removeEventListener('ended', onEnd);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
    };
  }, [audioUrl]);

  const handleGenerate = async () => {
    if (!audioBlob) return;
    setGenerating(true);
    try {
      const form = new FormData();
      const mime = recordedMimeRef.current || 'audio/webm';
      const ext = mime.includes('mp4') || mime.includes('m4a') ? 'm4a' : 'webm';
      form.append('audio', audioBlob, `recording.${ext}`);
      form.append('voiceLayout', voiceLayout);
      if (avatarFile) form.append('avatar', avatarFile, avatarFile.name || 'avatar.png');
      const base = import.meta.env.VITE_API_URL || '';
      const token = getAuthToken();
      const res = await fetch(`${base}/voice-to-resume`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || res.statusText);
      }
      const data = await res.json();
      if (data.voiceHtmlLayout) setVoiceLayout(data.voiceHtmlLayout);
      setPreviewHtml(data.previewHtml || '');
      const mergedFormData = { ...(data.formData || {}) };
      if (avatarBase64 && !mergedFormData.avatarBase64) mergedFormData.avatarBase64 = avatarBase64;
      setVoiceResult({ schema: data.schema, formData: mergedFormData });
      setEditingFormData(buildCompleteFormData(data.schema, mergedFormData));
      setShowTextEdit(false);
      setTranscript(typeof data.transcript === 'string' ? data.transcript : '');
      setStep('preview');
    } catch (err) {
      console.error(err);
      setPreviewHtml(`<p style="padding:1rem;color:#b91c1c;">${err.message || 'Generation failed'}</p>`);
      setVoiceResult(null);
      setStep('preview');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!voiceResult?.schema || !voiceResult?.formData) return;
    setSaving(true);
    const ok = await onSave(voiceResult.schema, voiceResult.formData, previewHtml);
    setSaving(false);
    if (ok) onClose();
  };

  const handleApplyTextEdits = async () => {
    if (!voiceResult?.schema) return;
    setUpdatingPreview(true);
    try {
      const merged = {
        ...(editingFormData || {}),
        avatarBase64: editingFormData?.avatarBase64 || avatarBase64 || voiceResult?.formData?.avatarBase64,
      };
      const res = await api.generateVoicePreview(merged, merged.avatarBase64, voiceLayout);
      setPreviewHtml(res?.previewHtml || previewHtml);
      setVoiceResult({ schema: voiceResult.schema, formData: merged });
      setShowTextEdit(false);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingPreview(false);
    }
  };

  const handleRegenerate = () => {
    setStep('record');
    setPreviewHtml(null);
    setVoiceResult(null);
    setTranscript('');
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('voiceModalTitle')}
      size="xl"
      bodyScroll={step !== 'preview' || showTextEdit}
      bodyClassName={step === 'preview' ? '!p-3 sm:!p-4 h-full flex flex-col min-h-0' : ''}
    >
      <div className="flex flex-col gap-3 sm:gap-5 w-full min-w-0 px-0 sm:px-0 h-full min-h-0">
        {step === 'record' && (
          <>
            <div className="rounded-xl border border-violet-100 overflow-hidden w-full min-w-0">
              <AnimeGirlIllustrationSvg className="rounded-t-xl" />
            </div>
            <p className="text-center text-slate-700 text-xs sm:text-base px-1 sm:px-2 leading-relaxed">
              {t('voiceGreeting')}
            </p>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 sm:p-4">
              <p className="font-medium text-slate-800 text-xs sm:text-sm mb-1.5 sm:mb-2">{t('voiceQuestionsIntro')}</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-1.5 text-slate-600 text-xs sm:text-sm list-disc list-inside">
                {VOICE_QUESTIONS.map((q) => (
                  <li key={q.id}>{t(q.key)}</li>
                ))}
              </ul>
            </div>
            <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm">
              {t('voiceRecordMinSeconds')}
            </p>
            <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 space-y-2">
              <p className="text-sm font-medium text-slate-800">{t('voiceChooseLayout')}</p>
              <p className="text-xs text-slate-500">{t('voiceLayoutPreviewHint')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {VOICE_LAYOUT_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex flex-col gap-2 rounded-lg border-2 p-2 cursor-pointer transition ${
                      voiceLayout === opt.id ? 'border-violet-500 bg-violet-50/60' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="voiceLayout"
                        checked={voiceLayout === opt.id}
                        onChange={() => handleLayoutPick(opt.id)}
                        className="accent-violet-600"
                      />
                      <span className="text-xs font-semibold text-slate-800">{t(opt.nameKey)}</span>
                    </div>
                    <div
                      className="w-full rounded-md border border-slate-200 bg-slate-50 overflow-hidden"
                      style={{ height: 150 }}
                    >
                      {layoutDemos?.[opt.id] ? (
                        <iframe
                          title=""
                          srcDoc={layoutDemos[opt.id]}
                          className="w-full border-0 bg-white"
                          style={{ height: 400, transform: 'scale(0.35)', transformOrigin: 'top left', width: '285%' }}
                          sandbox="allow-same-origin"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400">…</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm font-medium text-slate-800 mb-2">{t('voiceLayoutLargePreviewTitle')}</p>
                <p className="text-xs text-slate-500 mb-2">{t('voiceLayoutLargePreviewHint')}</p>
                <div
                  className="w-full rounded-lg border border-slate-300 bg-slate-100 overflow-hidden shadow-inner"
                  style={{ height: RECORD_LARGE_PREVIEW_WRAP_H }}
                >
                  {layoutDemos?.[voiceLayout] ? (
                    <iframe
                      title={t('voiceLayoutLargePreviewTitle')}
                      srcDoc={layoutDemos[voiceLayout]}
                      className="w-full border-0 bg-white block"
                      style={{
                        height: RECORD_LARGE_PREVIEW_IFRAME_H,
                        transform: 'scale(0.52)',
                        transformOrigin: 'top left',
                        width: '192.3%',
                      }}
                      sandbox="allow-same-origin"
                    />
                  ) : (
                    <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-slate-400">…</div>
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('voiceMicSelect')}
              </label>
              <select
                value={selectedMicId}
                onChange={(e) => setSelectedMicId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                <option value="default">{t('voiceMicDefault')}</option>
                {microphones.map((mic, idx) => (
                  <option key={mic.deviceId || `${idx}`} value={mic.deviceId}>
                    {mic.label || `${t('voiceMicDevice')} ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-800">{t('profilePhoto')}</p>
                <span className="text-xs text-slate-400">(40 × 50 mm 推奨)</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {avatarPreviewUrl ? (
                  <div className="relative flex-shrink-0">
                    <img
                      src={avatarPreviewUrl}
                      alt=""
                      className="h-20 w-16 rounded-lg border border-slate-200 object-cover shadow-sm"
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
                  <div className="flex-shrink-0 h-20 w-16 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-300 text-[11px]">
                    写真
                  </div>
                )}
                <div>
                  <input
                    id="voice-avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label
                    htmlFor="voice-avatar-upload"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition"
                  >
                    {t('chooseFile')}
                  </label>
                  <p className="mt-1 text-xs text-slate-400">
                    {avatarFile ? avatarFile.name : t('noFileChosen')}
                  </p>
                </div>
              </div>
            </div>
            {micError && (
              <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                {micError === 'denied' ? t('voiceMicDenied') : t('voiceMicUnavailable')}
              </p>
            )}
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              {!audioBlob ? (
                <>
                  {!recording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium shadow-lg shadow-violet-500/30 transition touch-manipulation w-full sm:w-auto max-w-xs"
                    >
                      <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
                      {t('voiceRecord')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex items-center justify-center gap-2 rounded-xl bg-red-500 hover:bg-red-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium shadow-lg transition touch-manipulation w-full sm:w-auto max-w-xs"
                    >
                      <span className="w-3 h-3 rounded-full bg-white" />
                      {t('voiceStop')}
                    </button>
                  )}
                  <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-slate-500 truncate">
                        {micLabel ? `Mic: ${micLabel}` : 'Mic: —'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {recordedMimeRef.current ? recordedMimeRef.current : ''}
                      </p>
                    </div>
                    <div className="mt-2 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-violet-500 to-fuchsia-500 transition-[width] duration-75"
                        style={{ width: `${Math.round(micLevel * 100)}%` }}
                        aria-hidden
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Level: {Math.round(micLevel * 100)}%
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-full rounded-xl bg-slate-100 border border-slate-200 p-2 sm:p-3">
                    <audio
                      ref={audioRef}
                      src={audioUrl || ''}
                      controls
                      className="w-full h-9 sm:h-10 accent-violet-600"
                      style={{ maxHeight: 48 }}
                    />
                  </div>
                  {audioDebug ? (
                    <div className="w-full max-w-md text-xs text-slate-500">
                      Recorded: {Math.round(audioDebug.bytes / 1024)} KB · chunks: {audioDebug.chunks} · {audioDebug.mime}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.pause();
                          audioRef.current.currentTime = 0;
                        }
                        if (audioUrl) URL.revokeObjectURL(audioUrl);
                        setAudioBlob(null);
                        setAudioUrl(null);
                        setPlaying(false);
                      }}
                      className="rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition touch-manipulation"
                    >
                      {t('voiceRecordAgain')}
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={generating}
                      className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium shadow-md disabled:opacity-70 transition touch-manipulation"
                    >
                      {generating ? t('voiceGenerating') : t('voiceGenerate')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {step === 'preview' && (
          <div className="flex flex-col gap-3 min-h-0 flex-1">
            <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 space-y-2 shrink-0">
              <p className="text-sm font-medium text-slate-800">{t('voiceChooseLayout')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {VOICE_LAYOUT_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 cursor-pointer text-xs font-medium ${
                      voiceLayout === opt.id ? 'border-violet-500 bg-violet-50' : 'border-slate-200'
                    } ${updatingPreview ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    <input
                      type="radio"
                      name="voiceLayoutPreview"
                      checked={voiceLayout === opt.id}
                      onChange={() => handleLayoutPick(opt.id)}
                      className="accent-violet-600"
                    />
                    {t(opt.nameKey)}
                  </label>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-violet-200 bg-violet-50/80 p-3 sm:p-4 max-h-[140px] overflow-auto">
              <p className="text-xs sm:text-sm font-medium text-violet-800 mb-1.5 sm:mb-2">{t('voiceWhatYouSaid')}</p>
              {transcript ? (
                <p className="text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">{transcript}</p>
              ) : (
                <p className="text-slate-500 text-sm italic">{t('voiceTranscriptUnavailable')}</p>
              )}
            </div>
            <div
              className="rounded-lg border border-slate-200 bg-white overflow-auto shrink-0"
              style={{ height: '48vh', minHeight: 320 }}
            >
              {previewHtml ? (
                <iframe
                  srcDoc={previewHtml}
                  title="Resume preview"
                  className="w-full h-full border-0 block"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="flex items-center justify-center min-h-[320px] text-slate-500 p-4">
                  {t('preview')}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 sm:p-3 shrink-0 space-y-2">
              <p className="text-sm font-medium text-slate-800">{t('voicePreviewLargeBottom')}</p>
              <p className="text-xs text-slate-500">{t('voicePreviewLargeBottomHint')}</p>
              <div
                className="rounded-lg border border-slate-300 bg-white overflow-auto"
                style={{ height: 'min(58vh, 720px)', minHeight: 400 }}
              >
                {previewHtml ? (
                  <iframe
                    srcDoc={previewHtml}
                    title={t('voicePreviewLargeBottom')}
                    className="w-full h-full min-h-[400px] border-0 block"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div className="flex items-center justify-center min-h-[320px] text-slate-500 p-4">
                    {t('preview')}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={() => setShowTextEdit((v) => !v)}
                className="rounded-xl bg-white border border-violet-200 hover:bg-violet-50 text-violet-700 px-5 py-2.5 font-medium transition touch-manipulation"
              >
                {t('voiceEditByText')}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!voiceResult || saving}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 font-medium disabled:opacity-50 transition touch-manipulation"
              >
                {saving ? t('voiceSaving') : t('voiceSave')}
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 font-medium transition touch-manipulation"
              >
                {t('voiceRegenerate')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 px-5 py-2.5 font-medium transition touch-manipulation"
              >
                {t('voiceClose')}
              </button>
            </div>
            {showTextEdit && voiceResult?.schema ? (
              <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 space-y-3">
                <DynamicForm
                  schema={voiceResult.schema}
                  formData={editingFormData}
                  setFormData={setEditingFormData}
                  showErrors={false}
                />
                <button
                  type="button"
                  onClick={handleApplyTextEdits}
                  disabled={updatingPreview}
                  className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 font-medium disabled:opacity-60 transition"
                >
                  {updatingPreview ? t('voiceUpdatingPreview') : t('voiceApplyTextEdits')}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Modal>
  );
}
