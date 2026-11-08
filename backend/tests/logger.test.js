import { describe, it, expect, vi } from 'vitest';
import pino from 'pino';
import { redactConnectionStrings, CONNECTION_STRING_REGEX, logger } from '../src/utils/logger.js';

describe('Logger Credential Redaction & Vitest Quiet Suite', () => {
  it('redacts credentials in connection-string-like text (scheme://user:pass@host)', () => {
    const input = 'mongodb://admin:secret123@mongo.internal:27017';
    const output = redactConnectionStrings(input);
    expect(output).toBe('mongodb://[REDACTED]@mongo.internal:27017');
    expect(output).not.toContain('admin');
    expect(output).not.toContain('secret123');
  });

  it('redacts credentials embedded in longer error messages', () => {
    const input = 'Failed to connect to database: mongodb://admin:secret123@mongo.internal:27017/recruitready_prod?replicaSet=rs0';
    const output = redactConnectionStrings(input);
    expect(output).toBe('Failed to connect to database: mongodb://[REDACTED]@mongo.internal:27017/recruitready_prod?replicaSet=rs0');
    expect(output).not.toContain('secret123');
  });

  it('redacts credentials in Error messages and error stack traces', () => {
    const err = new Error('Database timeout on mongodb://admin:secret123@mongo.internal:27017');
    err.stack = `Error: Database timeout on mongodb://admin:secret123@mongo.internal:27017
    at MongoClient.connect (node_modules/mongodb/lib/client.js:123:45)
    at connectDB (src/config/db.js:15:20)`;

    const sanitized = redactConnectionStrings(err);
    expect(sanitized.message).toBe('Database timeout on mongodb://[REDACTED]@mongo.internal:27017');
    expect(sanitized.stack).not.toContain('secret123');
    expect(sanitized.stack).toContain('mongodb://[REDACTED]@mongo.internal:27017');
  });

  it('redacts credentials in nested object fields', () => {
    const logPayload = {
      action: 'db.connect',
      config: {
        uri: 'mongodb://admin:secret123@mongo.internal:27017',
        fallbackUri: 'postgresql://dbuser:complex_pwd@db.internal:5432/main',
      },
      tags: ['db', 'mongodb://admin:secret123@mongo.internal:27017'],
    };

    const sanitized = redactConnectionStrings(logPayload);
    expect(sanitized.config.uri).toBe('mongodb://[REDACTED]@mongo.internal:27017');
    expect(sanitized.config.fallbackUri).toBe('postgresql://[REDACTED]@db.internal:5432/main');
    expect(sanitized.tags[1]).toBe('mongodb://[REDACTED]@mongo.internal:27017');
  });

  it('leaves strings without credentials completely intact', () => {
    const normalUri = 'mongodb://127.0.0.1:27017/recruitready_test';
    expect(redactConnectionStrings(normalUri)).toBe(normalUri);
  });

  it('redacts credentials through pino instance hooks and log method wrapper', () => {
    let captured = '';
    const destination = {
      write: (data) => {
        captured += data;
      },
    };

    const testPino = pino(
      {
        level: 'info',
        hooks: {
          logMethod(inputArgs, method) {
            return method.apply(this, inputArgs.map(redactConnectionStrings));
          },
        },
      },
      destination
    );

    const testWrapLogMethod = (method) => (arg1, arg2, ...args) => {
      const s1 = redactConnectionStrings(arg1);
      const s2 = redactConnectionStrings(arg2);
      const rest = args.map(redactConnectionStrings);
      if (typeof s1 === 'string' && typeof s2 === 'object' && s2 !== null) {
        return testPino[method](s2, s1, ...rest);
      }
      return testPino[method](s1, s2, ...rest);
    };

    const testLogger = {
      error: testWrapLogMethod('error'),
      info: testWrapLogMethod('info'),
    };

    const testErr = new Error('Connection failed: mongodb://admin:secret123@mongo.internal:27017');
    testLogger.error({ err: testErr }, 'Server crash with mongodb://admin:secret123@mongo.internal:27017');

    const parsed = JSON.parse(captured.trim());
    expect(parsed.msg).toBe('Server crash with mongodb://[REDACTED]@mongo.internal:27017');
    expect(parsed.err.message).toBe('Connection failed: mongodb://[REDACTED]@mongo.internal:27017');
    expect(parsed.err.stack).not.toContain('secret123');
    expect(parsed.err.stack).toContain('mongodb://[REDACTED]@mongo.internal:27017');
  });

  it('logger is silent when running under vitest', () => {
    expect(process.env.VITEST).toBeDefined();
    expect(logger.pino.level).toBe('silent');
  });
});
