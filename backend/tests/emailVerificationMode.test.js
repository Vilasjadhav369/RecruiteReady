import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import User from '../src/models/User.js';
import sessionService from '../src/services/sessionService.js';
import emailService from '../src/services/emailService.js';
import securityLogger from '../src/services/securityLogger.js';
import logger from '../src/utils/logger.js';
import {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
} from '../src/controllers/authController.js';
import { validateEnv } from '../src/config/validateEnv.js';
import bcrypt from 'bcryptjs';

describe('EMAIL_VERIFICATION_REQUIRED Suite', () => {
  const originalEnv = { ...process.env };
  const TEST_JWT_KEY = 'test-key-for-unit-tests-only-not-production';

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    process.env.JWT_SECRET = TEST_JWT_KEY;
    vi.spyOn(securityLogger, 'logSecurityEvent').mockResolvedValue(true);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  const createTestApp = () => {
    const app = express();
    app.use(express.json());
    app.post('/api/auth/register', register);
    app.post('/api/auth/login', login);
    app.post('/api/auth/verify-email', verifyEmail);
    app.post('/api/auth/resend-verification', resendVerification);
    app.post('/api/auth/forgot-password', forgotPassword);
    return app;
  };

  describe('validateEnv SMTP requirements', () => {
    it('requires SMTP variables in production when EMAIL_VERIFICATION_REQUIRED is true or unset', () => {
      process.env.NODE_ENV = 'production';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.CLIENT_URL = 'https://app.recruitready.com';
      delete process.env.EMAIL_HOST;
      delete process.env.EMAIL_USER;
      delete process.env.EMAIL_PASSWORD;
      delete process.env.EMAIL_VERIFICATION_REQUIRED;

      const result = validateEnv();
      expect(result.isValid).toBe(false);
      expect(result.errors.some((err) => err.includes('Production email delivery requires'))).toBe(true);
    });

    it('does NOT require SMTP variables in production when EMAIL_VERIFICATION_REQUIRED is false', () => {
      process.env.NODE_ENV = 'production';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.CLIENT_URL = 'https://app.recruitready.com';
      process.env.EMAIL_VERIFICATION_REQUIRED = 'false';
      delete process.env.EMAIL_HOST;
      delete process.env.EMAIL_USER;
      delete process.env.EMAIL_PASSWORD;

      const result = validateEnv();
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Registration under EMAIL_VERIFICATION_REQUIRED=false', () => {
    it('sets emailVerified=true immediately and sends no email', async () => {
      process.env.EMAIL_VERIFICATION_REQUIRED = 'false';
      const app = createTestApp();

      vi.spyOn(User, 'findOne').mockResolvedValue(null);
      const sendEmailSpy = vi.spyOn(emailService, 'sendVerificationEmail').mockResolvedValue(true);

      let createdUserArgs = null;
      const mockCreatedUser = {
        _id: '507f1f77bcf86cd799439011',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        role: 'student',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        toObject: function () {
          return { ...this };
        },
      };

      vi.spyOn(User, 'create').mockImplementation(async (args) => {
        createdUserArgs = args;
        return mockCreatedUser;
      });

      vi.spyOn(sessionService, 'createSession').mockResolvedValue({
        _id: '507f1f77bcf86cd799439099',
      });
      vi.spyOn(sessionService, 'attachTokenHashToSession').mockResolvedValue(true);

      const res = await request(app).post('/api/auth/register').send({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'Password123!',
        consent: true,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(createdUserArgs.emailVerified).toBe(true);
      expect(createdUserArgs.emailVerifiedAt).toBeInstanceOf(Date);
      expect(createdUserArgs.emailVerificationTokenHash).toBeUndefined();
      expect(sendEmailSpy).not.toHaveBeenCalled();
    });

    it('sets emailVerified=false and sends verification email when EMAIL_VERIFICATION_REQUIRED=true', async () => {
      process.env.EMAIL_VERIFICATION_REQUIRED = 'true';
      const app = createTestApp();

      vi.spyOn(User, 'findOne').mockResolvedValue(null);
      const sendEmailSpy = vi.spyOn(emailService, 'sendVerificationEmail').mockResolvedValue(true);

      let createdUserArgs = null;
      const mockCreatedUser = {
        _id: '507f1f77bcf86cd799439011',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        role: 'student',
        emailVerified: false,
        toObject: function () {
          return { ...this };
        },
      };

      vi.spyOn(User, 'create').mockImplementation(async (args) => {
        createdUserArgs = args;
        return mockCreatedUser;
      });

      vi.spyOn(sessionService, 'createSession').mockResolvedValue({
        _id: '507f1f77bcf86cd799439099',
      });
      vi.spyOn(sessionService, 'attachTokenHashToSession').mockResolvedValue(true);

      const res = await request(app).post('/api/auth/register').send({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'Password123!',
        consent: true,
      });

      expect(res.status).toBe(201);
      expect(createdUserArgs.emailVerified).toBe(false);
      expect(createdUserArgs.emailVerificationTokenHash).toBeDefined();
      expect(sendEmailSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Login under EMAIL_VERIFICATION_REQUIRED=false', () => {
    it('allows login without requiring verification', async () => {
      process.env.EMAIL_VERIFICATION_REQUIRED = 'false';
      const app = createTestApp();

      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'jane@example.com',
        password: hashedPassword,
        isActive: true,
        emailVerified: false, // Even if an old account had false
        toObject: function () {
          return { ...this };
        },
      };

      vi.spyOn(User, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      });
      vi.spyOn(sessionService, 'createSession').mockResolvedValue({
        _id: '507f1f77bcf86cd799439099',
      });
      vi.spyOn(sessionService, 'attachTokenHashToSession').mockResolvedValue(true);

      const res = await request(app).post('/api/auth/login').send({
        email: 'jane@example.com',
        password: 'Password123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });
  });

  describe('Verification endpoints under EMAIL_VERIFICATION_REQUIRED=false', () => {
    it('/auth/verify-email returns 400 "Email verification is off in this test version"', async () => {
      process.env.EMAIL_VERIFICATION_REQUIRED = 'false';
      const app = createTestApp();

      const res = await request(app).post('/api/auth/verify-email').send({ token: 'abc123token' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Email verification is off in this test version');
    });

    it('/auth/resend-verification returns 400 "Email verification is off in this test version"', async () => {
      process.env.EMAIL_VERIFICATION_REQUIRED = 'false';
      const app = createTestApp();

      const res = await request(app).post('/api/auth/resend-verification').send({ email: 'user@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Email verification is off in this test version');
    });
  });

  describe('Forgot password under EMAIL_VERIFICATION_REQUIRED=false', () => {
    it('returns generic success response, sends no email, and logs warning without email address', async () => {
      process.env.EMAIL_VERIFICATION_REQUIRED = 'false';
      const app = createTestApp();

      const sendResetSpy = vi.spyOn(emailService, 'sendPasswordResetEmail').mockResolvedValue(true);
      const loggerWarnSpy = vi.spyOn(logger, 'warn');

      const res = await request(app).post('/api/auth/forgot-password').send({
        email: 'existing-or-unknown@example.com',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('If an account exists for this email, a password reset link has been sent.');
      expect(sendResetSpy).not.toHaveBeenCalled();

      expect(loggerWarnSpy).toHaveBeenCalled();
      const loggedWarningCalls = loggerWarnSpy.mock.calls;
      for (const callArgs of loggedWarningCalls) {
        const fullLogStr = JSON.stringify(callArgs);
        expect(fullLogStr).not.toContain('existing-or-unknown@example.com');
      }
    });
  });
});
