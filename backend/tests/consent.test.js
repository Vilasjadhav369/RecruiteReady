import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import User from '../src/models/User.js';
import sessionService from '../src/services/sessionService.js';
import emailService from '../src/services/emailService.js';
import securityLogger from '../src/services/securityLogger.js';
import { register, recordConsent } from '../src/controllers/authController.js';
import protect from '../src/middleware/auth.js';
import { generateToken } from '../src/utils/jwt.js';

describe('Test-Version Consent Suite (Hermetic Unit Tests)', () => {
  const TEST_SECRET = 'test-secret-key-that-is-at-least-32-chars-long';
  process.env.JWT_SECRET = TEST_SECRET;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(securityLogger, 'logSecurityEvent').mockResolvedValue(true);
  });

  const createTestApp = () => {
    const app = express();
    app.use(express.json());
    app.post('/api/auth/register', register);
    app.post('/api/auth/consent', protect, recordConsent);
    return app;
  };

  it('rejects registration without consent=true (missing consent field)', async () => {
    const app = createTestApp();

    const res = await request(app).post('/api/auth/register').send({
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/accept the terms/i);
  });

  it('rejects registration with consent=false', async () => {
    const app = createTestApp();

    const res = await request(app).post('/api/auth/register').send({
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      password: 'password123',
      consent: false,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/accept the terms/i);
  });

  it('accepts registration when consent=true and sets consentAcceptedAt and consentVersion on User', async () => {
    const app = createTestApp();

    vi.spyOn(User, 'findOne').mockResolvedValue(null);
    vi.spyOn(emailService, 'sendVerificationEmail').mockResolvedValue(true);

    let createdUserArgs = null;
    const mockCreatedUser = {
      _id: '507f1f77bcf86cd799439011',
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      role: 'student',
      consentAcceptedAt: new Date(),
      consentVersion: '1.0-test',
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
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      password: 'password123',
      consent: true,
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(createdUserArgs).toBeDefined();
    expect(createdUserArgs.consentAcceptedAt).toBeInstanceOf(Date);
    expect(createdUserArgs.consentVersion).toBe('1.0-test');
  });

  it('rejects POST /api/auth/consent for unauthenticated requests -> 401', async () => {
    const app = createTestApp();

    const res = await request(app).post('/api/auth/consent').send({ consent: true });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects POST /api/auth/consent when consent is not true -> 400', async () => {
    const app = createTestApp();
    const token = generateToken(
      { _id: '507f1f77bcf86cd799439011', role: 'student' },
      '507f1f77bcf86cd799439099'
    );

    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      role: 'student',
      isActive: true,
    };

    vi.spyOn(sessionService, 'verifySession').mockResolvedValue({
      _id: '507f1f77bcf86cd799439099',
      user: mockUser,
    });
    vi.spyOn(User, 'findById').mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/api/auth/consent')
      .set('Authorization', `Bearer ${token}`)
      .send({ consent: false });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/consent is required/i);
  });

  it('records consentAcceptedAt and consentVersion via POST /api/auth/consent for authenticated OAuth candidates', async () => {
    const app = createTestApp();
    const token = generateToken(
      { _id: '507f1f77bcf86cd799439011', role: 'student' },
      '507f1f77bcf86cd799439099'
    );

    let saved = false;
    const mockUserDoc = {
      _id: '507f1f77bcf86cd799439011',
      email: 'oauthstudent@example.com',
      role: 'student',
      isActive: true,
      consentAcceptedAt: null,
      consentVersion: null,
      save: async function () {
        saved = true;
        return this;
      },
      toObject: function () {
        return { ...this };
      },
    };

    vi.spyOn(sessionService, 'verifySession').mockResolvedValue({
      _id: '507f1f77bcf86cd799439099',
      user: mockUserDoc,
    });
    vi.spyOn(User, 'findById').mockResolvedValue(mockUserDoc);

    const res = await request(app)
      .post('/api/auth/consent')
      .set('Authorization', `Bearer ${token}`)
      .send({ consent: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(saved).toBe(true);
    expect(mockUserDoc.consentAcceptedAt).toBeInstanceOf(Date);
    expect(mockUserDoc.consentVersion).toBe('1.0-test');
  });
});
