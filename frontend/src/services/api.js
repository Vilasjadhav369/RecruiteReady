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

// ─── Toast Deduplication Cache (3-second window) ─────────────────────────────
const recentToasts = new Map();
const DEDUP_WINDOW_MS = 3000;

export function emitGlobalToast({ message, variant = "error", title, requestId }) {
  if (!message || typeof window === "undefined") return;
  const now = Date.now();
  const key = `${variant}:${message}:${requestId || ""}`;
  const lastTime = recentToasts.get(key);
  if (lastTime && now - lastTime < DEDUP_WINDOW_MS) {
    return;
  }
  recentToasts.set(key, now);

  // Evict expired entries
  for (const [k, time] of recentToasts.entries()) {
    if (now - time > DEDUP_WINDOW_MS) {
      recentToasts.delete(k);
    }
  }

  window.dispatchEvent(
    new CustomEvent("app:toast", {
      detail: { message, variant, title, requestId },
    })
  );
}

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
// Central response error handling and propagation
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const config = error.config || {};
    const url = config.url || "";
    const isAuthEndpoint = /\/auth\/(login|register|forgot-password|reset-password)/.test(url);
    const skipToast = Boolean(config.skipGlobalToast || config.skipToast || isAuthEndpoint);

    let userMessage = "";
    let toastVariant = "error";
    let requestId;

    const status = error.response?.status;

    // 1. Network failure or timeout
    if (!error.response || error.code === "ECONNABORTED") {
      userMessage = "Cannot reach the server. Check your connection.";
    } else if (status === 401) {
      // 2. 401 Unauthorized handling on non-auth endpoints
      if (!isAuthEndpoint) {
        if (localStorage.getItem("recruiteready_token")) {
          localStorage.removeItem("recruiteready_token");
        }
        window.dispatchEvent(new Event("auth:expired"));

        userMessage = "Your session expired. Please log in again.";
        toastVariant = "warning";

        try {
          sessionStorage.setItem("rr_session_expired", "1");
        } catch {
          /* ignore storage error */
        }

        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          const currentPath = window.location.pathname + window.location.search;
          const returnTo = encodeURIComponent(currentPath);
          window.location.href = `/login?returnTo=${returnTo}`;
        }
      } else {
        userMessage = error.response.data?.message || "Invalid credentials.";
      }
    } else if (status === 403) {
      // 3. 403 Forbidden handling
      userMessage = error.response.data?.message || "You do not have permission to perform this action.";
      window.dispatchEvent(new CustomEvent("auth:forbidden", { detail: error.response?.data }));
    } else if (status === 429) {
      // 4. 429 Rate limiting
      let seconds;
      const retryHeader = error.response.headers?.["retry-after"];
      if (retryHeader) {
        const parsed = parseInt(retryHeader, 10);
        if (!isNaN(parsed)) seconds = parsed;
      }
      if (!seconds && error.response.data?.retryAfter) {
        const parsed = parseInt(error.response.data.retryAfter, 10);
        if (!isNaN(parsed)) seconds = parsed;
      }
      userMessage = seconds
        ? `Too many attempts. Try again in ${seconds} seconds.`
        : "Too many attempts. Please try again later.";
      toastVariant = "warning";
    } else if (status === 503) {
      // 5. 503 Service Unavailable
      userMessage = "The service is busy. Please try again in a moment.";
      toastVariant = "warning";
    } else if (status >= 500 && status < 600) {
      // 6. 5xx Server Error: Never show raw server text
      requestId =
        error.response.data?.requestId ||
        error.response.headers?.["x-request-id"] ||
        error.response.headers?.["x-correlation-id"];
      userMessage = "Something went wrong. Please try again.";
      toastVariant = "error";
    } else {
      // Other client errors (400, 404, 422, etc.)
      userMessage =
        error.response.data?.message ||
        error.message ||
        "An unexpected error occurred.";
    }

    // Attach userMessage and requestId to the rejected error
    error.userMessage = userMessage;
    if (requestId) {
      error.requestId = requestId;
    }

    // Determine whether to dispatch a central toast notification
    const shouldToast =
      !skipToast &&
      (status === 401 ||
        status === 429 ||
        status === 503 ||
        (status >= 500 && status < 600) ||
        !error.response ||
        error.code === "ECONNABORTED");

    if (shouldToast && userMessage) {
      emitGlobalToast({
        message: userMessage,
        variant: toastVariant,
        requestId,
      });
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
