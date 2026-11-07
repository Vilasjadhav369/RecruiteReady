import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

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

const pinoInstance = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

const wrapLogMethod = (method) => {
  return (arg1, arg2, ...args) => {
    if (typeof arg1 === 'string' && typeof arg2 === 'object' && arg2 !== null) {
      return pinoInstance[method](arg2, arg1, ...args);
    }
    return pinoInstance[method](arg1, arg2, ...args);
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
