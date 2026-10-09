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
      const url = error.config?.url || "";
      const isCredentialAttempt = /\/auth\/(login|register)/.test(url);
      // A 401 on a normal request means the session is gone. Wrong-password
      // responses from login/register must not clear anything.
      if (!isCredentialAttempt && localStorage.getItem("recruiteready_token")) {
        localStorage.removeItem("recruiteready_token");
        window.dispatchEvent(new Event("auth:expired"));
      }
    } else if (error.response?.status === 403) {
      // 403 Forbidden handling
      window.dispatchEvent(new CustomEvent("auth:forbidden", { detail: error.response?.data }));
    } else if (error.response?.status === 429) {
      // Rate limiting notification
      console.warn("[API] Rate limit reached. Please throttle requests.");
    } else if (!error.response && error.code === "ECONNABORTED") {
      // Request timeout
      console.warn("[API Timeout] Request timed out after 10000ms.");
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

