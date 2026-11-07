import crypto from 'crypto';
import logger from '../utils/logger.js';

/**
 * requestTracing — Attaches a unique X-Request-ID to incoming requests,
 * tracks response latency, and logs structured request summary on response completion.
 */
export const requestTracing = (req, res, next) => {
  // Validate incoming request ID or generate a cryptographically safe ID
  const incomingId = req.headers['x-request-id'];
  const requestId =
    typeof incomingId === 'string' && incomingId.trim().length > 0 && incomingId.length < 128
      ? incomingId.trim()
      : crypto.randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Capture start time
  req._startTime = Date.now();

  // Log on response completion
  res.on('finish', () => {
    const duration = Date.now() - req._startTime;
    const rawPath = (req.originalUrl || req.url || '').split('?')[0] || req.path || '/';

    const logPayload = {
      requestId: req.id,
      method: req.method,
      path: rawPath,
      status: res.statusCode,
      duration,
    };

    if (req.user) {
      logPayload.userId = String(req.user._id || req.user.id);
    }

    logger.info(logPayload, 'request completed');
  });

  next();
};

export default requestTracing;
