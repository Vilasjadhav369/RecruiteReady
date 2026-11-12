import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import User from '../src/models/User.js';
import sessionService from '../src/services/sessionService.js';
import emailService from '../src/services/emailService.js';
import securityLogger from '../src/services/securityLogger.js';
import { register, recordConsent } from '../src/controllers/authController.js';
import protect from '../src/middleware/auth.js';
import { generateToken } from '../src/utils/jwt.js';
import { verifyInviteCode } from '../src/config/features.js';

describe('SIGNUP_INVITE_CODE Suite', () => {
  const originalEnv = { ...process.env };
  const TEST_SECRET = 'test-secret-key-that-is-at-least-32-chars-long';
  const REQUIRED_CODE = 'BETA-2026-TEST';

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    process.env.JWT_SECRET = TEST_SECRET;
    vi.spyOn(securityLogger, 'logSecurityEvent').mockResolvedValue(true);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('verifyInviteCode unit tests', () => {
    it('returns true when SIGNUP_INVITE_CODE is unset or blank', () => {
      delete process.env.SIGNUP_INVITE_CODE;
      expect(verifyInviteCode('anything')).toBe(true);
      expect(verifyInviteCode('')).toBe(true);
      expect(verifyInviteCode(null)).toBe(true);

      process.env.SIGNUP_INVITE_CODE = '   ';
      expect(verifyInviteCode('anything')).toBe(true);
    });

    it('returns true only for matching invite code (trimmed)', () => {
      process.env.SIGNUP_INVITE_CODE = REQUIRED_CODE;
      expect(verifyInviteCode(REQUIRED_CODE)).toBe(true);
      expect(verifyInviteCode(`  ${REQUIRED_CODE}  `)).toBe(true);
      expect(verifyInviteCode('WRONG-CODE')).toBe(false);
      expect(verifyInviteCode('')).toBe(false);
      expect(verifyInviteCode(null)).toBe(false);
      expect(verifyInviteCode(12345)).toBe(false);
    });
  });

  const createTestApp = () => {
    const app = express();
    app.use(express.json());
    app.post('/api/auth/register', register);
    app.post('/api/auth/consent', protect, recordConsent);
    return app;
  };

  describe('Registration enforcement', () => {
    it('rejects registration with 403 "Invalid invite code" when code is missing', async () => {
      process.env.SIGNUP_INVITE_CODE = REQUIRED_CODE;
      const app = createTestApp();

      const res = await request(app).post('/api/auth/register').send({
        firstName: 'Bob',
        lastName: 'Tester',
        email: 'bob@example.com',
        password: 'Password123!',
        consent: true,
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid invite code');
      expect(JSON.stringify(res.body)).not.toContain(REQUIRED_CODE);
    });

    it('rejects registration with 403 "Invalid invite code" when code is incorrect', async () => {
      process.env.SIGNUP_INVITE_CODE = REQUIRED_CODE;
      const app = createTestApp();

      const res = await request(app).post('/api/auth/register').send({
        firstName: 'Bob',
        lastName: 'Tester',
        email: 'bob@example.com',
        password: 'Password123!',
        consent: true,
        inviteCode: 'WRONG_INVITE_CODE',
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid invite code');
      expect(JSON.stringify(res.body)).not.toContain(REQUIRED_CODE);
    });

    it('accepts registration when matching inviteCode is provided', async () => {
      process.env.SIGNUP_INVITE_CODE = REQUIRED_CODE;
      const app = createTestApp();

      vi.spyOn(User, 'findOne').mockResolvedValue(null);
      vi.spyOn(emailService, 'sendVerificationEmail').mockResolvedValue(true);
      const mockCreatedUser = {
        _id: '507f1f77bcf86cd799439011',
        firstName: 'Bob',
        lastName: 'Tester',
        email: 'bob@example.com',
        role: 'student',
        toObject: function () {
          return { ...this };
        },
      };
      vi.spyOn(User, 'create').mockResolvedValue(mockCreatedUser);
      vi.spyOn(sessionService, 'createSession').mockResolvedValue({
        _id: '507f1f77bcf86cd799439099',
      });
      vi.spyOn(sessionService, 'attachTokenHashToSession').mockResolvedValue(true);

      const res = await request(app).post('/api/auth/register').send({
        firstName: 'Bob',
        lastName: 'Tester',
        email: 'bob@example.com',
        password: 'Password123!',
        consent: true,
        inviteCode: REQUIRED_CODE,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('First-time social sign-up consent enforcement', () => {
    it('requires invite code for first-time social sign-ups (no consentAcceptedAt)', async () => {
      process.env.SIGNUP_INVITE_CODE = REQUIRED_CODE;
      const app = createTestApp();

      const mockFirstTimeUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'social@example.com',
        role: 'student',
        isActive: true,
        consentAcceptedAt: null, // First-time social user
        save: vi.fn().mockResolvedValue(true),
        toObject: function () {
          return { ...this };
        },
      };

      const token = generateToken(
        { _id: mockFirstTimeUser._id, role: 'student' },
        '507f1f77bcf86cd799439099'
      );

      vi.spyOn(sessionService, 'verifySession').mockResolvedValue({
        _id: '507f1f77bcf86cd799439099',
        userId: mockFirstTimeUser._id,
      });
      vi.spyOn(User, 'findById').mockResolvedValue(mockFirstTimeUser);

      // 1. Calling without invite code fails with 403
      const resMissing = await request(app)
        .post('/api/auth/consent')
        .set('Authorization', `Bearer ${token}`)
        .send({ consent: true });

      expect(resMissing.status).toBe(403);
      expect(resMissing.body.message).toBe('Invalid invite code');

      // 2. Calling with wrong invite code fails with 403
      const resWrong = await request(app)
        .post('/api/auth/consent')
        .set('Authorization', `Bearer ${token}`)
        .send({ consent: true, inviteCode: 'WRONG_CODE' });

      expect(resWrong.status).toBe(403);
      expect(resWrong.body.message).toBe('Invalid invite code');

      // 3. Calling with matching invite code succeeds (200)
      const resSuccess = await request(app)
        .post('/api/auth/consent')
        .set('Authorization', `Bearer ${token}`)
        .send({ consent: true, inviteCode: REQUIRED_CODE });

      expect(resSuccess.status).toBe(200);
      expect(resSuccess.body.success).toBe(true);
      expect(mockFirstTimeUser.consentAcceptedAt).toBeInstanceOf(Date);
    });

    it('does NOT require invite code for existing users (already accepted consent)', async () => {
      process.env.SIGNUP_INVITE_CODE = REQUIRED_CODE;
      const app = createTestApp();

      const mockExistingUser = {
        _id: '507f1f77bcf86cd799439022',
        email: 'existing@example.com',
        role: 'student',
        isActive: true,
        consentAcceptedAt: new Date('2026-01-01'), // Existing user
        save: vi.fn().mockResolvedValue(true),
        toObject: function () {
          return { ...this };
        },
      };

      const token = generateToken(
        { _id: mockExistingUser._id, role: 'student' },
        '507f1f77bcf86cd799439099'
      );

      vi.spyOn(sessionService, 'verifySession').mockResolvedValue({
        _id: '507f1f77bcf86cd799439099',
        userId: mockExistingUser._id,
      });
      vi.spyOn(User, 'findById').mockResolvedValue(mockExistingUser);

      const res = await request(app)
        .post('/api/auth/consent')
        .set('Authorization', `Bearer ${token}`)
        .send({ consent: true }); // No invite code sent

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
