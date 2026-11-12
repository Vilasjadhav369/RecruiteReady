/**
 * Feature Flags Configuration
 */

import crypto from 'crypto';

export const isCodingEnabled = () => {
  if (process.env.CODING_ENABLED !== undefined && process.env.CODING_ENABLED !== '') {
    const val = String(process.env.CODING_ENABLED).trim().toLowerCase();
    return val === 'true' || val === '1';
  }
  return process.env.NODE_ENV !== 'production';
};

export const isEmailVerificationRequired = () => {
  if (process.env.EMAIL_VERIFICATION_REQUIRED !== undefined && process.env.EMAIL_VERIFICATION_REQUIRED !== '') {
    const val = String(process.env.EMAIL_VERIFICATION_REQUIRED).trim().toLowerCase();
    return val === 'true' || val === '1';
  }
  return true;
};

export const isInviteCodeRequired = () => {
  return Boolean(process.env.SIGNUP_INVITE_CODE && process.env.SIGNUP_INVITE_CODE.trim());
};

/**
 * Constant-time comparison for SIGNUP_INVITE_CODE using SHA-256 digests.
 * Prevents timing attacks and length leaks. Never logs the invite code.
 */
export const verifyInviteCode = (providedCode) => {
  const configuredCode = process.env.SIGNUP_INVITE_CODE?.trim();
  if (!configuredCode) {
    return true; // Not required
  }
  if (!providedCode || typeof providedCode !== 'string') {
    return false;
  }
  const normalizedProvided = providedCode.trim();
  const hashConfigured = crypto.createHash('sha256').update(configuredCode).digest();
  const hashProvided = crypto.createHash('sha256').update(normalizedProvided).digest();
  return crypto.timingSafeEqual(hashConfigured, hashProvided);
};

export default {
  isCodingEnabled,
  isEmailVerificationRequired,
  isInviteCodeRequired,
  verifyInviteCode,
};
