import api from "./api.js";

/**
 * Default fallback public configuration for safe degradation.
 */
export const DEFAULT_PUBLIC_CONFIG = Object.freeze({
  emailVerificationRequired: true,
});

/**
 * Fetches public configuration from backend API.
 * Degrades safely to DEFAULT_PUBLIC_CONFIG on error.
 */
export async function getPublicConfig() {
  try {
    const response = await api.get("/public-config");
    if (!response?.data) return DEFAULT_PUBLIC_CONFIG;
    return {
      emailVerificationRequired:
        response.data.emailVerificationRequired !== undefined
          ? Boolean(response.data.emailVerificationRequired)
          : DEFAULT_PUBLIC_CONFIG.emailVerificationRequired,
    };
  } catch {
    return DEFAULT_PUBLIC_CONFIG;
  }
}
