import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import {
  createRateLimiter,
  loginRateLimiter,
  generalApiLimiter,
} from '../src/middleware/rateLimiter.js';

describe('Rate Limiting Suite (Isolated Supertest Apps)', () => {
  it('100 different accounts logging in from the same IP within the window are not blocked', async () => {
    const app = express();
    app.set('trust proxy', 0);
    app.use(express.json());
    app.post('/login', loginRateLimiter, (req, res) => {
      // Successful login
      res.status(200).json({ success: true, message: 'Login successful' });
    });

    for (let i = 0; i < 100; i++) {
      const res = await request(app)
        .post('/login')
        .send({ email: `student${i}@college.edu`, password: 'CorrectPassword123!' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }
  });

  it('one account with 11 wrong passwords gets 429 while a different account from the same IP still succeeds', async () => {
    const app = express();
    app.set('trust proxy', 0);
    app.use(express.json());

    app.post('/login', loginRateLimiter, (req, res) => {
      const { email, password } = req.body;
      if (password === 'ValidPass123!') {
        return res.status(200).json({ success: true, message: 'Logged in' });
      }
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    });

    const targetEmail = 'victim_student@college.edu';
    const otherEmail = 'innocent_student@college.edu';

    // 10 failed attempts for targetEmail
    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .post('/login')
        .send({ email: targetEmail, password: 'WrongPassword' });
      expect(res.status).toBe(401);
    }

    // 11th failed attempt for targetEmail should be blocked with 429
    const blockedRes = await request(app)
      .post('/login')
      .send({ email: targetEmail, password: 'WrongPassword' });
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body.success).toBe(false);
    expect(blockedRes.body).toHaveProperty('retryAfter');
    expect(blockedRes.headers['retry-after']).toBeDefined();

    // Different account from the SAME IP should still succeed
    const differentAccountRes = await request(app)
      .post('/login')
      .send({ email: otherEmail, password: 'ValidPass123!' });
    expect(differentAccountRes.status).toBe(200);
    expect(differentAccountRes.body.success).toBe(true);
  });

  it('a spoofed X-Forwarded-For header does not bypass limits when TRUST_PROXY=0', async () => {
    const app = express();
    app.set('trust proxy', 0);

    const testLimiter = createRateLimiter({
      windowMs: 60 * 1000,
      max: 2,
      message: 'Limit reached',
    });

    app.get('/test-endpoint', testLimiter, (req, res) => {
      res.status(200).json({ success: true, ip: req.ip });
    });

    // Request 1 from spoofed header 10.0.0.1
    const res1 = await request(app)
      .get('/test-endpoint')
      .set('X-Forwarded-For', '10.0.0.1');
    expect(res1.status).toBe(200);

    // Request 2 from spoofed header 10.0.0.1
    const res2 = await request(app)
      .get('/test-endpoint')
      .set('X-Forwarded-For', '10.0.0.1');
    expect(res2.status).toBe(200);

    // Request 3 attempts bypass by spoofing a new IP: 10.0.0.2
    // With TRUST_PROXY=0, Express must ignore X-Forwarded-For and block by socket remote address (127.0.0.1)
    const res3 = await request(app)
      .get('/test-endpoint')
      .set('X-Forwarded-For', '10.0.0.2');
    expect(res3.status).toBe(429);
    expect(res3.body.success).toBe(false);
    expect(res3.headers['retry-after']).toBeDefined();
  });

  it('generalApiLimiter does not crash when req.user is absent', async () => {
    const app = express();
    app.use(generalApiLimiter);
    app.get('/public', (req, res) => {
      res.status(200).json({ success: true, hasUser: !!req.user });
    });

    const res = await request(app).get('/public');
    expect(res.status).toBe(200);
    expect(res.body.hasUser).toBe(false);
  });
});
