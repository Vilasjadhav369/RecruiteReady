const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Recursively sanitizes target object or array:
 * - Strips keys starting with '$' (NoSQL operator injection)
 * - Strips keys containing '.' (NoSQL path injection)
 * - Strips prototype pollution vectors ('__proto__', 'constructor', 'prototype')
 * - Deeply traverses nested objects and arrays
 */
export const sanitize = (target) => {
  if (!target || typeof target !== 'object') {
    return target;
  }

  // Handle arrays: sanitize each element in place
  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      if (target[i] && typeof target[i] === 'object') {
        sanitize(target[i]);
      }
    }
    return target;
  }

  // Handle objects: check own properties
  for (const key of Object.getOwnPropertyNames(target)) {
    if (
      key.startsWith('$') ||
      key.includes('.') ||
      FORBIDDEN_KEYS.has(key)
    ) {
      delete target[key];
    } else if (target[key] && typeof target[key] === 'object') {
      sanitize(target[key]);
    }
  }

  return target;
};

/**
 * Express middleware to sanitize req.body, req.query, and req.params
 */
export const sanitizeMiddleware = (req, res, next) => {
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  next();
};

export default sanitizeMiddleware;
