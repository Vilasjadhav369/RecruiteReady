import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import User from '../src/models/User.js';
import sessionService from '../src/services/sessionService.js';
import emailService from '../src/services/emailService.js';
import securityLogger from '../src/services/securityLogger.js';
import { register } from '../src/controllers/authController.js';

describe('Registration Resilience Suite (Mailer Failure Recovery)', () => {
  const originalEnv = { ...process.env };
  const TEST_SECRET = 'test-secret-key-that-is-at-least-32-chars-long';

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    process.env.JWT_SECRET = TEST_SECRET;
    process.env.EMAIL_VERIFICATION_REQUIRED = 'true';
    vi.spyOn(securityLogger, 'logSecurityEvent').mockResolvedValue(true);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  const createTestApp = () => {
    const app = express();
    app.use(express.json());
    app.post('/api/auth/register', register);
    return app;
  };

  it('creates user and returns 201 with emailSent:false when mailer fails', async () => {
    const app = createTestApp();

    vi.spyOn(User, 'findOne').mockResolvedValue(null);

    // Mock mailer failure (Render free-tier SMTP port block: ETIMEDOUT / ECONNREFUSED)
    const mockMailerError = new Error('connect ECONNREFUSED 127.0.0.1:587');
    mockMailerError.code = 'ECONNREFUSED';
    const sendEmailSpy = vi.spyOn(emailService, 'sendVerificationEmail').mockRejectedValue(mockMailerError);

    let createdUserArgs = null;
    const mockCreatedUser = {
      _id: '507f1f77bcf86cd799439055',
      firstName: 'Resilient',
      lastName: 'Student',
      email: 'resilient@example.com',
      role: 'student',
      emailVerified: false,
      toObject: function () {
        return { ...this };
      },
    };

    const userCreateSpy = vi.spyOn(User, 'create').mockImplementation(async (args) => {
      createdUserArgs = args;
      return mockCreatedUser;
    });

    vi.spyOn(sessionService, 'createSession').mockResolvedValue({
      _id: '507f1f77bcf86cd799439099',
    });
    vi.spyOn(sessionService, 'attachTokenHashToSession').mockResolvedValue(true);

    const res = await request(app).post('/api/auth/register').send({
      firstName: 'Resilient',
      lastName: 'Student',
      email: 'resilient@example.com',
      password: 'StrongPassword123!',
      consent: true,
    });

    // Verify mailer was attempted
    expect(sendEmailSpy).toHaveBeenCalledTimes(1);

    // Verify user was NOT orphaned and registration did NOT fail with a generic 500 error
    expect(userCreateSpy).toHaveBeenCalledTimes(1);
    expect(createdUserArgs.email).toBe('resilient@example.com');
    expect(createdUserArgs.emailVerified).toBe(false);

    // Verify contract: status 201, emailSent: false, and required message
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.emailSent).toBe(false);
    expect(res.body.data.emailSent).toBe(false);
    expect(res.body.message).toBe('Account created, but we could not send the email. Use Resend.');
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('resilient@example.com');
  });

  it('returns 201 with emailSent:true when mailer succeeds', async () => {
    const app = createTestApp();

    vi.spyOn(User, 'findOne').mockResolvedValue(null);
    vi.spyOn(emailService, 'sendVerificationEmail').mockResolvedValue(true);

    const mockCreatedUser = {
      _id: '507f1f77bcf86cd799439066',
      firstName: 'Successful',
      lastName: 'Student',
      email: 'successful@example.com',
      role: 'student',
      emailVerified: false,
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
      firstName: 'Successful',
      lastName: 'Student',
      email: 'successful@example.com',
      password: 'StrongPassword123!',
      consent: true,
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.emailSent).toBe(true);
    expect(res.body.data.emailSent).toBe(true);
    expect(res.body.message).toBe('Registration successful. Please verify your email address.');
  });
});
