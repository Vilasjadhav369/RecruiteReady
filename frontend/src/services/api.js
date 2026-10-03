import axios from "axios";

/**
 * api — Pre-configured Axios instance.
 *
 * Base URL points to the backend API via Vite proxy.
 * All API calls should use this instance.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// ─── Request Interceptor ─────────────────────────────────────────────────────
// Automatically attach JWT token from localStorage if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("recruiteready_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ────────────────────────────────────────────────────
// Global response handling and error propagation
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 Unauthorized handling: clean stale token if unauthenticated
    if (error.response?.status === 401) {
      const isAuthCheck = error.config?.url?.includes("/auth/me");
      if (isAuthCheck) {
        localStorage.removeItem("recruiteready_token");
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Helper to build clean URL query strings, stripping undefined, null, empty strings, and 'all'.
 */
export const buildQueryString = (params = {}) => {
  if (!params || typeof params !== 'object') return '';
  const cleanParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (
      value !== undefined &&
      value !== null &&
      value !== '' &&
      value !== 'all' &&
      value !== 'undefined' &&
      value !== 'null'
    ) {
      cleanParams[key] = value;
    }
  }
  const query = new URLSearchParams(cleanParams).toString();
  return query ? `?${query}` : '';
};

export default api;

