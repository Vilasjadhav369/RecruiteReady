const SENSITIVE_KEYS = new Set([
  'password',
  'currentpassword',
  'newpassword',
  'confirmpassword',
  'token',
  'refreshtoken',
  'rawtoken',
  'credential',
  'secret',
  'clientsecret',
  'authorization',
  'cookie',
  'sessionid',
]);

/**
 * Strips sensitive keys recursively from objects before logging
 */
export const sanitizeForLog = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForLog);

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      clean[key] = sanitizeForLog(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
};

/**
 * Structured logger formatting info, warn, and error entries with ISO timestamp and request context
 */
export const logger = {
  info: (message, meta = {}) => {
    const entry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...sanitizeForLog(meta),
    };
    console.log(JSON.stringify(entry));
  },
  warn: (message, meta = {}) => {
    const entry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...sanitizeForLog(meta),
    };
    console.warn(JSON.stringify(entry));
  },
  error: (message, meta = {}) => {
    const entry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      ...sanitizeForLog(meta),
    };
    console.error(JSON.stringify(entry));
  },
};

export default logger;
