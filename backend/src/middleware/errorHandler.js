import logger from '../utils/logger.js';

/**
 * errorHandler — Centralized Express error-handling middleware.
 * Ensures consistent, sanitized JSON error responses without leaking sensitive details or stack traces.
 */
export const errorHandler = (err, req, res, next) => {
  // 1. Handle body-parser failures
  if (err.type === 'entity.parse.failed') {
    const statusCode = 400;
    const response = {
      success: false,
      message: 'Malformed JSON payload in request body.',
      code: 'INVALID_JSON',
    };
    if (req.id) response.requestId = req.id;
    if (process.env.NODE_ENV === 'development') response.stack = err.stack;

    logger.warn(
      { requestId: req.id, statusCode, err: { message: err.message, name: err.name } },
      'Malformed JSON request body'
    );
    return res.status(statusCode).json(response);
  }

  if (err.type === 'entity.too.large') {
    const statusCode = 413;
    const response = {
      success: false,
      message: 'Request payload exceeds maximum allowed size.',
      code: 'PAYLOAD_TOO_LARGE',
    };
    if (req.id) response.requestId = req.id;
    if (process.env.NODE_ENV === 'development') response.stack = err.stack;

    logger.warn(
      { requestId: req.id, statusCode, err: { message: err.message, name: err.name } },
      'Payload too large'
    );
    return res.status(statusCode).json(response);
  }

  // 2. Handle CORS policy errors
  if (err.message && err.message.includes('CORS')) {
    const statusCode = 403;
    const response = {
      success: false,
      message: 'CORS policy violation: Access from this origin is not allowed.',
      code: 'CORS_ERROR',
    };
    if (req.id) response.requestId = req.id;
    if (process.env.NODE_ENV === 'development') response.stack = err.stack;

    logger.warn(
      { requestId: req.id, statusCode, err: { message: err.message, name: err.name } },
      'CORS policy error'
    );
    return res.status(statusCode).json(response);
  }

  // 3. Handle Mongoose ValidationError: map to 400 with field names and generic reasons only
  if (err.name === 'ValidationError') {
    const statusCode = 400;
    const fieldErrors = {};

    if (err.errors) {
      for (const [field, fieldErr] of Object.entries(err.errors)) {
        let genericReason = 'Invalid value';
        if (fieldErr.kind === 'required') {
          genericReason = 'Field is required';
        } else if (fieldErr.kind === 'minlength') {
          genericReason = 'Value is too short';
        } else if (fieldErr.kind === 'maxlength') {
          genericReason = 'Value is too long';
        } else if (fieldErr.kind === 'enum') {
          genericReason = 'Invalid option selected';
        } else if (fieldErr.kind === 'user defined' || fieldErr.kind === 'regexp') {
          genericReason = 'Invalid format';
        }
        fieldErrors[field] = genericReason;
      }
    }

    const response = {
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: fieldErrors,
    };
    if (req.id) response.requestId = req.id;
    if (process.env.NODE_ENV === 'development') response.stack = err.stack;

    logger.warn(
      { requestId: req.id, statusCode, errors: fieldErrors },
      'Mongoose validation error'
    );
    return res.status(statusCode).json(response);
  }

  // 4. Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    const statusCode = 400;
    const response = {
      success: false,
      message: 'Invalid identifier format.',
      code: 'INVALID_ID',
    };
    if (req.id) response.requestId = req.id;
    if (process.env.NODE_ENV === 'development') response.stack = err.stack;

    logger.warn(
      { requestId: req.id, statusCode, err: { message: err.message, name: err.name } },
      'Invalid ID CastError'
    );
    return res.status(statusCode).json(response);
  }

  // 5. Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    const response = {
      success: false,
      message: `An account or record with this ${field} already exists.`,
      code: 'DUPLICATE_KEY',
    };
    if (req.id) response.requestId = req.id;
    if (process.env.NODE_ENV === 'development') response.stack = err.stack;

    logger.warn(
      { requestId: req.id, statusCode, err: { message: err.message, name: err.name } },
      'Duplicate key error'
    );
    return res.status(statusCode).json(response);
  }

  // 6. General HTTP error resolution
  const statusCode =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : err.statusCode || err.status || 500;

  const is5xx = statusCode >= 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // In production, 5xx responses must return a fixed message and MUST NEVER include err.message
  let message;
  let code;

  if (is5xx) {
    if (isProduction) {
      message = 'Something went wrong. Please try again.';
      code = 'INTERNAL_ERROR';
    } else {
      message = err.message || 'Internal server error';
      code = err.code || 'INTERNAL_ERROR';
    }
  } else {
    // 4xx errors may keep their message
    message = err.message || 'Request error';
    code = err.code || 'REQUEST_ERROR';
  }

  const response = {
    success: false,
    message,
    code,
  };

  if (req.id) {
    response.requestId = req.id;
  }

  // Stack traces development-only
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  // Log 4xx at warn without stack; 5xx at error with stack
  if (is5xx) {
    logger.error(
      {
        requestId: req.id,
        statusCode,
        err: {
          message: err.message,
          stack: err.stack,
          name: err.name,
          code: err.code,
        },
      },
      err.message || 'Internal server error'
    );
  } else {
    logger.warn(
      {
        requestId: req.id,
        statusCode,
        err: {
          message: err.message,
          name: err.name,
          code: err.code,
        },
      },
      err.message || 'Client request error'
    );
  }

  return res.status(statusCode).json(response);
};

export default errorHandler;
