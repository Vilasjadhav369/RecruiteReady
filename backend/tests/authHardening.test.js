import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import protect, { optionalAuth } from '../src/middleware/auth.js';
import sessionService from '../src/services/sessionService.js';
import User from '../src/models/User.js';
import { generateToken, verifyToken } from '../src/utils/jwt.js';

describe('Auth Hardening Suite (Hermetic Mocks)', () => {
 const TEST_JWT_KEY = 'test-key-for-unit-tests-only-not-production';
 process.env.JWT_SECRET = TEST_JWT_KEY;
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects token with no sessionId -> 401', async () => {
    // Generate token WITHOUT sessionId
    const tokenWithoutSession = jwt.sign(
      { id: '507f1f77bcf86cd799439011', role: 'student' },
     TEST_JWT_KEY,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    const app = express();
    app.get('/protected', protect, (req, res) => res.json({ success: true }));

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${tokenWithoutSession}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('missing required session identifier');
  });

  it('rejects revoked or expired session -> 401', async () => {
    const validToken = generateToken(
      { _id: '507f1f77bcf86cd799439011', role: 'student' },
      '507f1f77bcf86cd799439099'
    );

    // Mock sessionService.verifySession to return null (revoked/expired)
    vi.spyOn(sessionService, 'verifySession').mockResolvedValue(null);

    const app = express();
    app.get('/protected', protect, (req, res) => res.json({ success: true }));

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Session has been revoked or expired');
  });

  it('rejects deactivated user -> 401', async () => {
    const validToken = generateToken(
      { _id: '507f1f77bcf86cd799439011', role: 'student' },
      '507f1f77bcf86cd799439099'
    );

    vi.spyOn(sessionService, 'verifySession').mockResolvedValue({
      _id: '507f1f77bcf86cd799439099',
      user: '507f1f77bcf86cd799439011',
    });

    // Mock User.findById returning deactivated user
    vi.spyOn(User, 'findById').mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      isActive: false,
    });

    const app = express();
    app.get('/protected', protect, (req, res) => res.json({ success: true }));

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Account has been deactivated');
  });

  it('rejects a token signed with alg none or a different algorithm -> 401', async () => {
    // 1. Token forged with alg: "none"
    const headerNone = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({ id: '507f1f77bcf86cd799439011', role: 'student', sessionId: '507f1f77bcf86cd799439099' })
    ).toString('base64url');
    const noneToken = `${headerNone}.${payload}.`;

    const app = express();
    app.get('/protected', protect, (req, res) => res.json({ success: true }));

    const resNone = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${noneToken}`);

    expect(resNone.status).toBe(401);
    expect(resNone.body.success).toBe(false);
    expect(resNone.body.message).toContain('Invalid or expired token');

    // Verify verifyToken directly throws on alg: none
    expect(() => verifyToken(noneToken)).toThrow();
  });

  it('optionalAuth rejects tokens without sessionId with 401, but allows unauthenticated visitors', async () => {
    const tokenWithoutSession = jwt.sign(
      { id: '507f1f77bcf86cd799439011', role: 'student' },
       TEST_JWT_KEY,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    const app = express();
    app.get('/optional', optionalAuth, (req, res) => {
      res.json({ success: true, user: req.user || null });
    });

    // Visitor without token: should pass anonymously
    const resNoToken = await request(app).get('/optional');
    expect(resNoToken.status).toBe(200);
    expect(resNoToken.body.user).toBeNull();

    // Visitor with token lacking sessionId: should be rejected 401
    const resWithBadToken = await request(app)
      .get('/optional')
      .set('Authorization', `Bearer ${tokenWithoutSession}`);
    expect(resWithBadToken.status).toBe(401);
    expect(resWithBadToken.body.success).toBe(false);
  });
});
