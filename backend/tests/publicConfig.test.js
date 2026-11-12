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

  it('returns default config with exactly { emailVerificationRequired, inviteCodeRequired } and nothing else', async () => {
    delete process.env.EMAIL_VERIFICATION_REQUIRED;
    delete process.env.SIGNUP_INVITE_CODE;

    const app = createTestApp();
    const res = await request(app).get('/api/public-config');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      emailVerificationRequired: true,
      inviteCodeRequired: false,
    });
    expect(Object.keys(res.body).sort()).toEqual(['emailVerificationRequired', 'inviteCodeRequired']);
  });

  it('reflects EMAIL_VERIFICATION_REQUIRED=false and SIGNUP_INVITE_CODE being set without leaking the code', async () => {
    process.env.EMAIL_VERIFICATION_REQUIRED = 'false';
    process.env.SIGNUP_INVITE_CODE = 'SuperSecretInviteCode123!';

    const app = createTestApp();
    const res = await request(app).get('/api/public-config');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      emailVerificationRequired: false,
      inviteCodeRequired: true,
    });
    // Strict leak check: the secret invite code string should never appear in JSON output
    expect(JSON.stringify(res.body)).not.toContain('SuperSecretInviteCode123!');
    expect(Object.keys(res.body).sort()).toEqual(['emailVerificationRequired', 'inviteCodeRequired']);
  });
});
