import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, resumePdfUrl } from '../services/api';
import { getCachedPage, setCachedPage } from '../services/historyCache';
import { useTranslation } from '../i18n/LanguageContext';

const PAGE_LIMIT = 10;

// ── Skeletons ────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="rounded-xl border border-edge bg-surface p-4 animate-pulse flex gap-4">
      <div className="w-[90px] h-[127px] bg-surface-3 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-3 pt-1">
        <div className="h-4 bg-surface-3 rounded w-1/3" />
        <div className="h-4 bg-surface-2 rounded w-1/4" />
        <div className="h-8 bg-surface-2 rounded w-1/2 mt-2" />
      </div>
    </div>
  );
}

// ── PDF thumbnail ─────────────────────────────────────────────────────────────
function PdfThumbnail({ url }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!url) return null;

  const SCALE = 90 / 794;
  const W = 794;
  const H = 1123;
  const containerH = Math.round(H * SCALE);

  if (failed) {
    return (
      <div
        className="flex-shrink-0 rounded-lg border border-edge bg-surface-2 flex items-center justify-center text-3xl"
        style={{ width: 90, height: containerH }}
      >
        📄
      </div>
    );
  }

  return (
    <div
      className="flex-shrink-0 rounded-lg border border-edge bg-surface overflow-hidden relative"
      style={{ width: 90, height: containerH }}
    >
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-2 text-ink-faint text-xs animate-pulse">
          ...
        </div>
      )}
      <iframe
        src={`${url}#toolbar=0&navpanes=0&scrollbar=0&page=1&view=FitH`}
        title="Resume thumbnail"
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        style={{
          width: `${W}px`,
          height: `${H}px`,
          transform: `scale(${SCALE})`,
          transformOrigin: 'top left',
          border: 'none',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

// ── Download chip ─────────────────────────────────────────────────────────────
function DownloadChip({ url, label, colorClass }) {
  if (!url) return null;
  return (
    <a
      href={url}
      download
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${colorClass}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
        />
      </svg>
      {label}
    </a>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // Track which pages have been loaded to avoid duplicate fetches
  const loadedPages = useRef(new Set());

  const fetchPage = useCallback(async (page, { fromCache = true } = {}) => {
    // Check cache first
    if (fromCache) {
      const cached = getCachedPage(page, PAGE_LIMIT);
      if (cached) {
        if (page === 1) {
          setItems(cached.items);
          loadedPages.current = new Set([1]);
        } else {
          setItems((prev) => {
            // Deduplicate by id in case of concurrent fetches
            const existingIds = new Set(prev.map((i) => i.id));
            const newItems = cached.items.filter((i) => !existingIds.has(i.id));
            return [...prev, ...newItems];
          });
          loadedPages.current.add(page);
        }
        setPagination(cached.pagination);
        return;
      }
    }

    try {
      const result = await api.getHistory(page, PAGE_LIMIT);
      setCachedPage(page, PAGE_LIMIT, result);

      if (page === 1) {
        setItems(result.items);
        loadedPages.current = new Set([1]);
      } else {
        setItems((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const newItems = result.items.filter((i) => !existingIds.has(i.id));
          return [...prev, ...newItems];
        });
        loadedPages.current.add(page);
      }
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Initial load
  useEffect(() => {
    setInitialLoading(true);
    fetchPage(1).finally(() => setInitialLoading(false));
  }, [fetchPage]);

  const handleLoadMore = async () => {
    if (!pagination?.hasMore || loadingMore) return;
    const nextPage = pagination.page + 1;
    setLoadingMore(true);
    await fetchPage(nextPage);
    setLoadingMore(false);
  };

  const handleEdit = async (item) => {
    setEditingId(item.id);
    try {
      // Fetch full item (includes annotatedDocxBase64 / templateXlsxBase64)
      const full = await api.getHistoryById(item.id);
      navigate('/dashboard/create', {
        state: { schema: full.schema, data: full.data, editId: item.id },
      });
    } catch (err) {
      console.error('Failed to load resume for editing:', err);
      setEditingId(null);
    }
  };

  const formatDateTime = (d) =>
    new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  // ── Render ────────────────────────────────────────────────────────────────
  if (initialLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl sm:text-2xl font-bold text-ink">{t('history')}</h1>
        <div className="space-y-3">
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl sm:text-2xl font-bold text-ink">{t('history')}</h1>
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink">{t('history')}</h1>
          <p className="mt-1 text-ink-muted text-sm sm:text-base">{t('historySubtitle')}</p>
        </div>
        {pagination && (
          <span className="text-xs text-ink-faint tabular-nums">
            {items.length} / {pagination.total}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl sm:rounded-2xl border border-edge bg-surface p-8 sm:p-12 text-center text-ink-muted text-sm sm:text-base shadow-card">
          {t('noResumesYet')}
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((item) => {
              const files = item.generatedFiles || {};
              const pdfUrl = files.pdf ? resumePdfUrl(files.pdf) : resumePdfUrl(item.filePath);
              const docxUrl = files.docx ? resumePdfUrl(files.docx) : null;
              const xlsxUrl = files.xlsx ? resumePdfUrl(files.xlsx) : null;
              const isEditing = editingId === item.id;

              return (
                <li
                  key={item.id}
                  className="rounded-xl border border-edge bg-surface p-4 flex gap-4 items-start shadow-card"
                >
                  <PdfThumbnail url={pdfUrl} />

                  <div className="flex-1 flex flex-col justify-between gap-3 min-w-0">
                    <span className="text-ink-muted font-medium text-sm sm:text-base">
                      {formatDateTime(item.createdAt)}
                    </span>

                    {/* Download chips */}
                    <div className="flex flex-wrap gap-2">
                      <DownloadChip
                        url={pdfUrl}
                        label={t('downloadPdf')}
                        colorClass="bg-danger-soft text-danger hover:opacity-90"
                      />
                      <DownloadChip
                        url={docxUrl}
                        label={t('downloadDocx')}
                        colorClass="bg-info-soft text-info hover:opacity-90"
                      />
                      <DownloadChip
                        url={xlsxUrl}
                        label={t('downloadXlsx')}
                        colorClass="bg-primary-soft text-primary hover:opacity-90"
                      />
                    </div>

                    {/* Edit button */}
                    <div>
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        disabled={isEditing}
                        className="inline-flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-1.5 text-sm font-medium text-ink-muted hover:bg-surface-3 disabled:opacity-60 transition"
                      >
                        {isEditing && (
                          <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-ink-faint border-t-transparent" />
                        )}
                        {t('edit')}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Load more */}
          {pagination?.hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded-xl border border-edge bg-surface px-6 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-2 disabled:opacity-60 transition shadow-card"
              >
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-ink-faint border-t-transparent" />
                    {t('loading')}
                  </span>
                ) : (
                  t('loadMore')
                )}
              </button>
            </div>
          )}

          {!pagination?.hasMore && items.length > 0 && (
            <p className="text-center text-xs text-ink-faint pt-2">{t('allLoaded')}</p>
          )}
        </>
      )}
    </div>
  );
}
