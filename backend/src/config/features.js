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

export default {
  isCodingEnabled,
  isEmailVerificationRequired,
  isInviteCodeRequired,
};
