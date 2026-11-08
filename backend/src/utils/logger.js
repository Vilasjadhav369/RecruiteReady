import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const isVitest = Boolean(process.env.VITEST);

export const redactPaths = [
  'req.headers.authorization',
  'headers.authorization',
  'authorization',
  '*.authorization',
  '*.*.authorization',
  'req.headers.cookie',
  'headers.cookie',
  'cookie',
  '*.cookie',
  '*.*.cookie',
  'password',
  '*.password',
  '*.*.password',
  'currentPassword',
  '*.currentPassword',
  'newPassword',
  '*.newPassword',
  'confirmPassword',
  '*.confirmPassword',
  'token',
  '*.token',
  '*.*.token',
  'refreshToken',
  '*.refreshToken',
  'accessToken',
  '*.accessToken',
  'rawToken',
  '*.rawToken',
  'code',
  '*.code',
  '*.*.code',
  'req.body',
  'body',
  '*.body',
  '*.*.body',
  'sourceCode',
  '*.sourceCode',
  '*.*.sourceCode',
  'email',
  '*.email',
  '*.*.email',
];

/**
 * Regex matching connection strings with credentials:
 * scheme://username:password@host -> scheme://[REDACTED]@host
 */
export const CONNECTION_STRING_REGEX = /([a-zA-Z][a-zA-Z0-9+.-]*:\/\/)[^/\s:@]+:[^/\s@]+@/g;

/**
 * Redacts connection-string credentials in strings, Error messages/stacks, and objects.
 */
export const redactConnectionStrings = (val) => {
  if (typeof val === 'string') {
    return val.replace(CONNECTION_STRING_REGEX, '$1[REDACTED]@');
  }
  if (!val || typeof val !== 'object') {
    return val;
  }
  if (val instanceof Error) {
    if (val.message) val.message = redactConnectionStrings(val.message);
    if (val.stack) val.stack = redactConnectionStrings(val.stack);
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(redactConnectionStrings);
  }
  const result = { ...val };
  for (const key of Object.keys(result)) {
    result[key] = redactConnectionStrings(result[key]);
  }
  return result;
};

// When running under Vitest, silence the logger unless explicitly overridden
const defaultLevel = isVitest ? 'silent' : (process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'));

const pinoInstance = pino({
  level: defaultLevel,
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]',
  },
  hooks: {
    logMethod(inputArgs, method) {
      return method.apply(this, inputArgs.map(redactConnectionStrings));
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

const wrapLogMethod = (method) => {
  return (arg1, arg2, ...args) => {
    const s1 = redactConnectionStrings(arg1);
    const s2 = redactConnectionStrings(arg2);
    const sRest = args.map(redactConnectionStrings);
    if (typeof s1 === 'string' && typeof s2 === 'object' && s2 !== null) {
      return pinoInstance[method](s2, s1, ...sRest);
    }
    return pinoInstance[method](s1, s2, ...sRest);
  };
};

export const logger = {
  fatal: wrapLogMethod('fatal'),
  error: wrapLogMethod('error'),
  warn: wrapLogMethod('warn'),
  info: wrapLogMethod('info'),
  debug: wrapLogMethod('debug'),
  trace: wrapLogMethod('trace'),
  pino: pinoInstance,
};

export default logger;
