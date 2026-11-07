import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import pino from 'pino';
import errorHandler from '../src/middleware/errorHandler.js';
import requestTracing from '../src/middleware/requestTracing.js';
import { redactPaths, logger } from '../src/utils/logger.js';

describe('Error Handling and Logging Suite', () => {
  it('production 500 does not leak the error message', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      const app = express();
      app.use(requestTracing);
      app.get('/crash', (req, res, next) => {
        next(new Error('Fatal database connection string: mongodb://admin:secret123@mongo.internal:27017'));
      });
      app.use(errorHandler);

      const res = await request(app).get('/crash');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Something went wrong. Please try again.');
      expect(res.body.code).toBe('INTERNAL_ERROR');
      expect(res.body).toHaveProperty('requestId');
      expect(res.body.stack).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain('secret123');
      expect(JSON.stringify(res.body)).not.toContain('mongodb://');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('Mongoose ValidationError maps to 400 with field names and generic reasons only', async () => {
    const app = express();
    app.use(requestTracing);
    app.post('/validate-test', (req, res, next) => {
      const err = new Error('User validation failed');
      err.name = 'ValidationError';
      err.errors = {
        email: { kind: 'required', value: undefined },
        password: { kind: 'minlength', value: '123' },
        role: { kind: 'enum', value: 'hacker' },
      };
      next(err);
    });
    app.use(errorHandler);

    const res = await request(app).post('/validate-test');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors).toEqual({
      email: 'Field is required',
      password: 'Value is too short',
      role: 'Invalid option selected',
    });
    // Ensure no sensitive or echoed values in response
    expect(JSON.stringify(res.body)).not.toContain('hacker');
    expect(JSON.stringify(res.body)).not.toContain('123');
  });

  it('body-parse failures map entity.parse.failed to 400 and entity.too.large to 413', async () => {
    const app = express();
    app.use(requestTracing);
    app.get('/parse-error', (req, res, next) => {
      const err = new Error('Unexpected token in JSON');
      err.type = 'entity.parse.failed';
      next(err);
    });
    app.get('/too-large', (req, res, next) => {
      const err = new Error('request entity too large');
      err.type = 'entity.too.large';
      next(err);
    });
    app.use(errorHandler);

    const parseRes = await request(app).get('/parse-error');
    expect(parseRes.status).toBe(400);
    expect(parseRes.body.code).toBe('INVALID_JSON');

    const largeRes = await request(app).get('/too-large');
    expect(largeRes.status).toBe(413);
    expect(largeRes.body.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('logger redacts password, authorization, and code fields', () => {
    let capturedLog = '';
    const destination = {
      write: (data) => {
        capturedLog += data;
      },
    };

    const testLogger = pino(
      {
        redact: {
          paths: redactPaths,
          censor: '[REDACTED]',
        },
      },
      destination
    );

    testLogger.info({
      authorization: 'Bearer my-secret-jwt-token',
      password: 'plaintext_password',
      code: 'oauth_auth_code_secret',
      email: 'student@campus.edu',
      safeField: 'visible_public_name',
    });

    const parsed = JSON.parse(capturedLog.trim());
    expect(parsed.authorization).toBe('[REDACTED]');
    expect(parsed.password).toBe('[REDACTED]');
    expect(parsed.code).toBe('[REDACTED]');
    expect(parsed.email).toBe('[REDACTED]');
    expect(parsed.safeField).toBe('visible_public_name');
  });
});
