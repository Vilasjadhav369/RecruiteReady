import axios from "axios";

/**
 * api — Pre-configured Axios instance.
 *
 * Base URL points to the backend API via Vite proxy.
 * All API calls should use this instance.
 */
const api = axios.create({
  baseURL: "/api",
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

export default api;
