const BASE = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'auth_token';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  if (!token) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);
}

class ApiError extends Error {
  constructor(message, payload = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = payload.code;
    this.limit = payload.limit;
    this.status = payload.status;
  }
}

async function request(url, options = {}) {
  const token = getAuthToken();
  const res = await fetch(`${BASE}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(err.error || res.statusText, {
      ...err,
      status: res.status,
    });
  }
  return res.json();
}

export const api = {
  getUser: () => request('/user'),
  logout: () => request('/auth/logout', { method: 'POST' }),

  uploadSample: async (file) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${BASE}/upload-sample`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
      },
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || res.statusText);
    }
    return res.json();
  },

  getTemplates: () => request('/templates'),
  getTemplate: (id) => request(`/templates/${id}`),

  lookupPostalCode: (zipcode) => {
    const q = String(zipcode ?? '').replace(/\D/g, '').slice(0, 7);
    return request(`/postal-code?zipcode=${q}`);
  },

  generateResume: (schema, data, generationMode = 'template', options = {}) =>
    request('/generate-resume', {
      method: 'POST',
      body: JSON.stringify({
        schema,
        data,
        annotatedDocxBase64: schema?.annotatedDocxBase64 || undefined,
        templateXlsxBase64: schema?.templateXlsxBase64 || undefined,
        annotatedTemplateHtml: schema?.annotatedTemplateHtml || undefined,
        templateHtml: schema?.templateHtml || undefined,
        avatarBase64: data?.avatarBase64 || undefined,
        generationMode,
        previewHtml: options?.previewHtml || undefined,
      }),
    }),
  generateVoicePreview: (formData, avatarBase64) =>
    request('/voice-to-resume/preview', {
      method: 'POST',
      body: JSON.stringify({
        formData,
        avatarBase64: avatarBase64 || formData?.avatarBase64 || undefined,
      }),
    }),

  getHistory: (page = 1, limit = 10) =>
    request(`/history?page=${page}&limit=${limit}`),
  getHistoryById: (id) => request(`/history/${id}`),
  updateHistory: (id, payload) =>
    request(`/history/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
};

export function resumePdfUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
}
