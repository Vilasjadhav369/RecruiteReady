import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import publicConfigRouter from '../src/routes/publicConfig.js';

describe('GET /api/public-config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  const createTestApp = () => {
    const app = express();
    app.use('/api', publicConfigRouter);
    return app;
  };

  it('returns default config with exactly { emailVerificationRequired } and nothing else', async () => {
    delete process.env.EMAIL_VERIFICATION_REQUIRED;

    const app = createTestApp();
    const res = await request(app).get('/api/public-config');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      emailVerificationRequired: true,
    });
    expect(Object.keys(res.body)).toEqual(['emailVerificationRequired']);
  });

  it('reflects EMAIL_VERIFICATION_REQUIRED=false', async () => {
    process.env.EMAIL_VERIFICATION_REQUIRED = 'false';

    const app = createTestApp();
    const res = await request(app).get('/api/public-config');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      emailVerificationRequired: false,
    });
    expect(Object.keys(res.body)).toEqual(['emailVerificationRequired']);
  });
});
