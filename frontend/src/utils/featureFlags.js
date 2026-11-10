/**
 * Feature flag helper for coding module.
 *
 * Default: false in production builds, true in development.
 * Can be explicitly overridden with VITE_ENABLE_CODING="true" | "false".
 */
export const isCodingEnabled = () => {
  const envVal = import.meta.env.VITE_ENABLE_CODING;
  if (envVal !== undefined && envVal !== '') {
    return envVal === 'true' || envVal === '1';
  }
  return !import.meta.env.PROD;
};

export default {
  isCodingEnabled,
};
