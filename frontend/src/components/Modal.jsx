import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, size = 'md', bodyScroll = true, bodyClassName = '' }) {
  useEffect(() => {
    if (!open) return;
    const handle = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', handle);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handle);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass =
    size === 'xl'
      ? 'sm:max-w-5xl'
      : size === 'lg'
        ? 'sm:max-w-lg'
        : 'sm:max-w-md';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 safe-area-inset !mt-0" style={{ minWidth: '100vw', minHeight: '100dvh' }}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm min-w-full min-h-full w-screen h-[100dvh]" style={{ minWidth: '100vw', minHeight: '100dvh' }} onClick={onClose} aria-hidden />
      <div
        className={`relative w-full min-h-[80vh] sm:min-h-0 max-h-[98dvh] sm:max-h-[96vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden ${sizeClass}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-100 px-3 sm:px-6 py-3 sm:py-4 bg-white">
          <h2 id="modal-title" className="text-sm sm:text-lg font-semibold text-slate-900 pr-2 truncate">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-2 -mr-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition touch-manipulation"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div
          className={`flex-1 min-h-0 overflow-x-hidden ${bodyScroll ? 'overflow-y-auto' : 'overflow-y-hidden'} p-3 sm:p-5 pb-[env(safe-area-inset-bottom)] ${bodyClassName}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
