/**
 * Simple module-level TTL cache for history pages.
 *
 * Lives as long as the browser tab is open.
 * Automatically expires entries after TTL_MS.
 * Provides explicit invalidation when a new resume is created.
 */

const TTL_MS = 3 * 60 * 1000; // 3 minutes

const store = {
  /** Map<pageKey, { data, ts }> */
  pages: {},
};

function pageKey(page, limit) {
  return `${page}_${limit}`;
}

/** Return cached page data or null if missing/expired. */
export function getCachedPage(page, limit = 10) {
  const entry = store.pages[pageKey(page, limit)];
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL_MS) {
    delete store.pages[pageKey(page, limit)];
    return null;
  }
  return entry.data; // { items, pagination }
}

/** Store page data in cache. */
export function setCachedPage(page, limit = 10, data) {
  store.pages[pageKey(page, limit)] = { data, ts: Date.now() };
}

/** Wipe all cached pages (call after creating/editing a resume). */
export function invalidateHistoryCache() {
  store.pages = {};
}
