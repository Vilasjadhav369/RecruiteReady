/**
 * Feature Flags Configuration
 */

export const isCodingEnabled = () => {
  if (process.env.CODING_ENABLED !== undefined && process.env.CODING_ENABLED !== '') {
    const val = String(process.env.CODING_ENABLED).trim().toLowerCase();
    return val === 'true' || val === '1';
  }
  return process.env.NODE_ENV !== 'production';
};

export default {
  isCodingEnabled,
};
