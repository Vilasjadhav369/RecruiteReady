/**
 * errorHandler — Centralized Express error-handling middleware.
 * Ensures consistent, sanitized JSON error responses without leaking sensitive details or stack traces.
 */
export const errorHandler = (err, req, res, next) => {
  // 1. Handle CORS policy errors
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation: Access from this origin is not allowed.',
    });
  }

  // 2. Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid identifier format.',
    });
  }

  // 3. Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `An account or record with this ${field} already exists.`,
    });
  }

  // 4. Default error handling
  const statusCode =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : err.statusCode || 500;

  const response = {
    success: false,
    message: err.message || 'Internal server error',
    code: err.code || (statusCode === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
  };

  if (req.id) {
    response.requestId = req.id;
  }

  // Only include stack traces in non-production environments when explicitly configured
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
