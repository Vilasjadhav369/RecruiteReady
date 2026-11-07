/**
 * Production Environment Configuration Validator
 * Validates required environment variables and policies before accepting traffic.
 */

export const validateEnv = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors = [];

  // MONGODB_URI check
  if (!process.env.MONGODB_URI) {
    errors.push('MONGODB_URI environment variable is required.');
  }

  // JWT_SECRET check
  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET environment variable is required.');
  } else if (isProduction) {
    if (process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters in production.');
    }
    if (
      process.env.JWT_SECRET === 'your_development_jwt_secret' ||
      process.env.JWT_SECRET === 'default_secret' ||
      process.env.JWT_SECRET.toLowerCase().includes('development')
    ) {
      errors.push('JWT_SECRET cannot use default or development placeholder values in production.');
    }
  }

  // CLIENT_URL check
  if (!process.env.CLIENT_URL) {
    if (isProduction) {
      errors.push('CLIENT_URL environment variable is required in production.');
    }
  } else if (isProduction) {
    const origins = process.env.CLIENT_URL.split(',').map((o) => o.trim()).filter(Boolean);
    for (const origin of origins) {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        errors.push(`CLIENT_URL cannot point to localhost/127.0.0.1 in production: ${origin}`);
      }
    }
  }

  // TRUST_PROXY check
  if (process.env.TRUST_PROXY !== undefined && process.env.TRUST_PROXY !== '') {
    const val = Number(process.env.TRUST_PROXY);
    if (!Number.isInteger(val) || val < 0) {
      errors.push('TRUST_PROXY must be a non-negative integer representing proxy hops (e.g. 0, 1, 2).');
    }
  }

  // SMTP Configuration check in production
  if (isProduction) {
    const host = process.env.EMAIL_HOST;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD;
    if (!host || !user || !pass || host === 'smtp.example.com') {
      errors.push('Production email delivery requires valid EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD (smtp.example.com is not allowed in production).');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export default validateEnv;
