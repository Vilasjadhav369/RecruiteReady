import rateLimit from 'express-rate-limit';

/**
 * Standard 429 error handler returning consistent JSON payload and Retry-After header.
 */
export const defaultRateLimitHandler = (req, res, next, options) => {
  const resetTime = req.rateLimit?.resetTime;
  const retryAfterSeconds = resetTime
    ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
    : Math.ceil(options.windowMs / 1000);

  res.setHeader('Retry-After', retryAfterSeconds);
  return res.status(429).json({
    success: false,
    message:
      typeof options.message === 'string'
        ? options.message
        : options.message?.message || 'Too many requests. Please try again later.',
    retryAfter: retryAfterSeconds,
  });
};

/**
 * createRateLimiter — Wrapper around express-rate-limit with standard formatting and error response.
 */
export const createRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000;
  const max = options.max !== undefined ? options.max : 30;
  const message = options.message || 'Too many requests. Please try again later.';
  const keyGenerator =
    options.keyGenerator || ((req) => req.ip || req.socket?.remoteAddress || 'unknown');

  return rateLimit({
    windowMs,
    max,
    standardHeaders: false,
    legacyHeaders: true,
    keyGenerator,
    handler: defaultRateLimitHandler,
    validate: false,
    ...options,
  });
};

const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');

/**
 * Login Rate Limiters:
 * 1. IP + normalized email: 10 failed attempts per 15 min (successful logins do not count)
 * 2. IP-wide ceiling: 200 failed attempts per 15 min
 */
const loginAccountKeyGenerator = (req) => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const email = normalizeEmail(req.body?.email || req.query?.email);
  return `login-account:${ip}:${email}`;
};

const loginIpKeyGenerator = (req) => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  return `login-ip:${ip}`;
};

export const loginAccountLimiter = createRateLimiter({
  windowMs: Number(process.env.RATE_LIMIT_LOGIN_ACCOUNT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_LOGIN_ACCOUNT_MAX) || 10,
  keyGenerator: loginAccountKeyGenerator,
  skipSuccessfulRequests: true,
  message: 'Too many failed login attempts for this account. Please try again in 15 minutes.',
});

export const loginIpLimiter = createRateLimiter({
  windowMs: Number(process.env.RATE_LIMIT_LOGIN_IP_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_LOGIN_IP_MAX) || 200,
  keyGenerator: loginIpKeyGenerator,
  skipSuccessfulRequests: true,
  message: 'Too many failed login attempts from this network. Please try again in 15 minutes.',
});

export const loginRateLimiter = (req, res, next) => {
  loginIpLimiter(req, res, (err) => {
    if (err) return next(err);
    loginAccountLimiter(req, res, next);
  });
};

/**
 * Register Rate Limiter:
 * 100 registrations per hour per IP.
 */
export const registerRateLimiter = createRateLimiter({
  windowMs: Number(process.env.RATE_LIMIT_REGISTER_WINDOW_MS) || 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_REGISTER_MAX) || 100,
  keyGenerator: (req) => `register:${req.ip || req.socket?.remoteAddress || 'unknown'}`,
  message: 'Too many registration requests from this network. Please try again in an hour.',
});

/**
 * Password Recovery & Verification Rate Limiters:
 * 5 per hour per email AND 60 per hour per IP.
 */
const recoveryEmailKeyGenerator = (req) => {
  const email = normalizeEmail(req.body?.email || req.query?.email);
  return `recovery-email:${email || (req.ip || req.socket?.remoteAddress || 'unknown')}`;
};

const recoveryIpKeyGenerator = (req) => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  return `recovery-ip:${ip}`;
};

export const recoveryEmailLimiter = createRateLimiter({
  windowMs: Number(process.env.RATE_LIMIT_RECOVERY_EMAIL_WINDOW_MS) || 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_RECOVERY_EMAIL_MAX) || 5,
  keyGenerator: recoveryEmailKeyGenerator,
  message: 'Too many recovery requests for this email address. Please try again in an hour.',
});

export const recoveryIpLimiter = createRateLimiter({
  windowMs: Number(process.env.RATE_LIMIT_RECOVERY_IP_WINDOW_MS) || 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_RECOVERY_IP_MAX) || 60,
  keyGenerator: recoveryIpKeyGenerator,
  message: 'Too many recovery requests from this network. Please try again in an hour.',
});

export const passwordRecoveryRateLimiter = (req, res, next) => {
  recoveryIpLimiter(req, res, (err) => {
    if (err) return next(err);
    recoveryEmailLimiter(req, res, next);
  });
};

/**
 * General API Rate Limiter:
 * Authenticated: 1500 per 15 min keyed by user id.
 * Unauthenticated: 600 per 15 min keyed by IP.
 */
export const generalApiKeyGenerator = (req) => {
  if (req.user) {
    const userId = req.user._id || req.user.id;
    return `user:${userId}`;
  }
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  return `ip:${ip}`;
};

export const generalApiLimiter = createRateLimiter({
  windowMs: Number(process.env.RATE_LIMIT_API_WINDOW_MS) || 15 * 60 * 1000,
  max: (req) => {
    if (req.user) {
      return Number(process.env.RATE_LIMIT_API_AUTH_MAX) || 1500;
    }
    return Number(process.env.RATE_LIMIT_API_UNAUTH_MAX) || 600;
  },
  keyGenerator: generalApiKeyGenerator,
  message: 'API request limit exceeded. Please slow down your requests.',
});

/**
 * Backward compatibility export: authRateLimiter
 */
export const authRateLimiter = loginRateLimiter;

export default {
  createRateLimiter,
  loginRateLimiter,
  loginAccountLimiter,
  loginIpLimiter,
  registerRateLimiter,
  passwordRecoveryRateLimiter,
  recoveryEmailLimiter,
  recoveryIpLimiter,
  generalApiLimiter,
  authRateLimiter,
};
