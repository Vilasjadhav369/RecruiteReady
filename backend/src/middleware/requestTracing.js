import crypto from 'crypto';

/**
 * requestTracing — Attaches a unique X-Request-ID to incoming requests
 * and tracks response latency.
 */
export const requestTracing = (req, res, next) => {
  // Validate existing request ID or generate a cryptographically safe ID
  const incomingId = req.headers['x-request-id'];
  const requestId =
    typeof incomingId === 'string' && incomingId.trim().length > 0 && incomingId.length < 128
      ? incomingId.trim()
      : crypto.randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Capture start time
  req._startTime = Date.now();

  next();
};

export default requestTracing;
