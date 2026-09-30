/**
 * errorHandler — Centralized Express error-handling middleware.
 * Ensures consistent JSON error responses without leaking sensitive details.
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : (err.statusCode || 500);

  const response = {
    success: false,
    message: err.message || 'Internal server error',
  };

  // Only include stack traces in development mode for debugging
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
