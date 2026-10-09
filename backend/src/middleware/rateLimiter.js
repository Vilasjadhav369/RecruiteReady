/**
 * createRateLimiter — In-memory sliding window rate limiter middleware.
 *
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 15 min)
 * @param {number} options.max - Max requests per window per IP (default: 30)
 * @param {string} options.message - Error message when rate limit exceeded
 */
export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 30,
  message = 'Too many requests from this IP. Please try again later.',
} = {}) => {
  const hits = new Map();

  // Periodic cleanup every 5 minutes to avoid memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of hits.entries()) {
      const valid = timestamps.filter((t) => now - t < windowMs);
      if (valid.length === 0) {
        hits.delete(key);
      } else {
        hits.set(key, valid);
      }
    }
  }, 5 * 60 * 1000);

  // Prevent cleanup from holding the Node process open in test environments
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    if (process.env.NODE_ENV === 'test') {
      return next();
    }
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = `${ip}:${req.baseUrl || ''}${req.path}`;
    const now = Date.now();

    const requestTimes = hits.get(key) || [];
    const recentRequests = requestTimes.filter((timestamp) => now - timestamp < windowMs);

    if (recentRequests.length >= max) {
      const oldest = recentRequests[0];
      const retryAfterSeconds = Math.ceil((windowMs - (now - oldest)) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        message,
        retryAfter: retryAfterSeconds,
      });
    }

    recentRequests.push(now);
    hits.set(key, recentRequests);
    next();
  };
};

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
});

export default {
  createRateLimiter,
  authRateLimiter,
};
