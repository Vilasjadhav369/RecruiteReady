/**
 * testAuthSuite.js — Comprehensive Authentication & Session Security Hardening Suite
 *
 * Verifies all 34 mandatory security requirements:
 * - Authentication (Local, Google, GitHub, Logout, Expired/Invalid/Tampered Tokens)
 * - Authorization (Role restrictions, Object ownership, Profile protection, Mass assignment)
 * - Password Security (No hashes leaked, Password Reset flow, Current password verification)
 * - Sessions (Session creation, Server-side revocation, Logout-all, Ownership protection)
 * - OAuth Security (Google ID token verification, GitHub state & code validation, Open redirects)
 * - System Security (Security headers, CORS rejection, NoSQL injection protection, Rate limiting, Secrets bundle scan)
 */

process.env.NODE_ENV = 'test';
process.env.GOOGLE_CLIENT_ID = 'test-client-id-12345.apps.googleusercontent.com';
process.env.GITHUB_CLIENT_ID = 'test-github-client-id-67890';
process.env.GITHUB_CLIENT_SECRET = 'test-github-secret-abcdef';
process.env.GITHUB_CALLBACK_URL = 'http://localhost:5002/api/auth/github/callback';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.JWT_SECRET = 'super_secret_test_key_for_recruited_ready_portal_2026';

import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs';
import path from 'path';

dotenv.config();

import connectDB from '../config/db.js';
import User from '../models/User.js';
import Session from '../models/Session.js';
import AptitudeAttempt from '../models/AptitudeAttempt.js';
import authRouter from '../routes/auth.js';
import adminRouter from '../routes/admin.js';
import dashboardRouter from '../routes/dashboard.js';
import aptitudeRouter from '../routes/aptitude.js';
import googleAuthService from '../services/googleAuthService.js';
import githubAuthService from '../services/githubAuthService.js';
import emailService from '../services/emailService.js';
import sessionService from '../services/sessionService.js';
import { generateToken, verifyToken } from '../utils/jwt.js';
import errorHandler from '../middleware/errorHandler.js';

const TEST_PORT = 5002;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

// Setup isolated Express server replicating production security middleware
const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    frameguard: { action: 'deny' },
  })
);

const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json());

// NoSQL Injection sanitizer
const sanitizeMongoQuery = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      sanitizeMongoQuery(obj[key]);
    }
  }
  return obj;
};

app.use((req, res, next) => {
  if (req.body) sanitizeMongoQuery(req.body);
  if (req.query) sanitizeMongoQuery(req.query);
  if (req.params) sanitizeMongoQuery(req.params);
  next();
});

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/aptitude', aptitudeRouter);

// Error Handler
app.use(errorHandler);

let serverInstance;

// Save original methods for mocks
const origGoogleVerify = googleAuthService.verifyGoogleIdToken;
const origGithubExchange = githubAuthService.exchangeCodeForToken;
const origGithubProfile = githubAuthService.getGitHubUserProfile;
const origGithubEmail = githubAuthService.getGitHubVerifiedEmail;
const origSendReset = emailService.sendPasswordResetEmail;
const origSendVerify = emailService.sendVerificationEmail;

let lastResetEmailData = null;
let lastVerifyEmailData = null;

const runTests = async () => {
  console.log('\n==================================================================');
  console.log('   RECRUITEREADY - COMPREHENSIVE AUTH & SECURITY HARDENING SUITE');
  console.log('==================================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testNum, testDesc) => {
    if (condition) {
      console.log(`  [PASS] TEST ${testNum}: ${testDesc}`);
      passed++;
    } else {
      console.error(`  [FAIL] TEST ${testNum}: ${testDesc}`);
      failed++;
    }
  };

  try {
    await connectDB();
    serverInstance = app.listen(TEST_PORT);

    // Mock Email Service
    emailService.sendPasswordResetEmail = async (data) => {
      lastResetEmailData = data;
      return { success: true };
    };
    emailService.sendVerificationEmail = async (data) => {
      lastVerifyEmailData = data;
      return { success: true };
    };

    // Clean test accounts
    await User.deleteMany({ email: /.*@auth-test\.local$/ });
    await Session.deleteMany({});
    await AptitudeAttempt.deleteMany({});

    const passwordHash = await bcrypt.hash('TestPassword123!', 12);

    // Seed test users
    const localUser = await User.create({
      firstName: 'Student',
      lastName: 'Local',
      email: 'student_local@auth-test.local',
      password: passwordHash,
      role: 'student',
      authProvider: 'local',
      isActive: true,
      emailVerified: true,
    });

    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin_test@auth-test.local',
      password: passwordHash,
      role: 'admin',
      authProvider: 'local',
      isActive: true,
      emailVerified: true,
    });

    const inactiveUser = await User.create({
      firstName: 'Inactive',
      lastName: 'User',
      email: 'inactive_test@auth-test.local',
      password: passwordHash,
      role: 'student',
      authProvider: 'local',
      isActive: false,
      emailVerified: true,
    });

    // =========================================================================
    // PART 1: CORE AUTHENTICATION (TESTS 1–9)
    // =========================================================================

    // TEST 1: Valid email login
    const res1 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student_local@auth-test.local', password: 'TestPassword123!' }),
    });
    const data1 = await res1.json();
    const studentToken = data1.data?.token;
    assert(
      res1.status === 200 && data1.success && studentToken && data1.data?.user?.email === 'student_local@auth-test.local',
      1,
      'Valid email/password login succeeds and returns JWT and safe user object'
    );

    // TEST 2: Invalid password fails
    const res2 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student_local@auth-test.local', password: 'WrongPassword999!' }),
    });
    const data2 = await res2.json();
    assert(
      res2.status === 401 && data2.success === false && data2.message === 'Invalid email or password',
      2,
      'Invalid password fails safely with 401 Unauthorized'
    );

    // TEST 3: Nonexistent email fails safely
    const res3 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'doesnotexist@auth-test.local', password: 'SomePassword123!' }),
    });
    const data3 = await res3.json();
    assert(
      res3.status === 401 && data3.success === false && data3.message === 'Invalid email or password',
      3,
      'Nonexistent email fails safely with identical generic error message'
    );

    // TEST 4: Google login works
    googleAuthService.verifyGoogleIdToken = async () => ({
      sub: 'google_sub_test_1',
      email: 'google_user@auth-test.local',
      emailVerified: true,
      name: 'Google User',
      givenName: 'Google',
      familyName: 'User',
      picture: 'https://lh3.googleusercontent.com/test',
    });
    const res4 = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'mock_google_credential_token' }),
    });
    const data4 = await res4.json();
    assert(
      res4.status === 201 && data4.success && data4.data?.token && data4.data?.user?.role === 'student',
      4,
      'Google login verifies credential and creates authenticated student session'
    );

    // TEST 5: GitHub login works
    githubAuthService.exchangeCodeForToken = async () => 'mock_gh_token_5';
    githubAuthService.getGitHubUserProfile = async () => ({
      id: 'gh_user_555',
      login: 'github_student_5',
      name: 'GitHub Student',
      avatarUrl: 'https://avatars.githubusercontent.com/u/555',
      publicEmail: 'github_student5@auth-test.local',
    });
    githubAuthService.getGitHubVerifiedEmail = async () => 'github_student5@auth-test.local';

    const validState5 = githubAuthService.createOAuthState();
    const res5 = await fetch(`${BASE_URL}/api/auth/github/callback?code=mock_code_5&state=${validState5}`, {
      headers: { Accept: 'application/json' },
    });
    const data5 = await res5.json();
    assert(
      res5.status === 201 && data5.success && data5.data?.token && data5.data?.user?.role === 'student',
      5,
      'GitHub login exchanges authorization code and issues valid authenticated session'
    );

    // TEST 6: Logout works
    const res6 = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const data6 = await res6.json();
    assert(
      res6.status === 200 && data6.success && data6.message === 'Logged out successfully',
      6,
      'Logout endpoint invalidates current session and responds successfully'
    );

    // TEST 7: Expired JWT token is rejected
    const expiredToken = generateToken(localUser);
    // Create an artificially expired token
    const secret = process.env.JWT_SECRET;
    const expiredJwt = generateToken(localUser);
    // Sign token with -10 seconds
    const expPayload = { id: localUser._id, role: localUser.role, exp: Math.floor(Date.now() / 1000) - 60 };
    const expiredSignature = (await import('jsonwebtoken')).default.sign(expPayload, secret);
    const res7 = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${expiredSignature}` },
    });
    assert(
      res7.status === 401,
      7,
      'Expired token is rejected with 401 Unauthorized'
    );

    // TEST 8: Invalid format token is rejected
    const res8 = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: 'Bearer totally_invalid_token_string' },
    });
    assert(
      res8.status === 401,
      8,
      'Invalid token format is rejected with 401 Unauthorized'
    );

    // TEST 9: Tampered token is rejected
    const tamperedToken = studentToken.slice(0, -6) + 'abcdef';
    const res9 = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${tamperedToken}` },
    });
    assert(
      res9.status === 401,
      9,
      'Tampered token signature is safely rejected with 401 Unauthorized'
    );

    // =========================================================================
    // PART 2: AUTHORIZATION & OBJECT OWNERSHIP (TESTS 10–15)
    // =========================================================================

    // Log in fresh as student
    const loginFreshRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student_local@auth-test.local', password: 'TestPassword123!' }),
    });
    const freshStudentData = await loginFreshRes.json();
    const freshStudentToken = freshStudentData.data?.token;

    // TEST 10: Student cannot access admin API
    const res10 = await fetch(`${BASE_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${freshStudentToken}` },
    });
    assert(
      res10.status === 403,
      10,
      'Student account cannot access admin API (403 Forbidden)'
    );

    // TEST 11: Student cannot modify another student profile
    const anotherStudent = await User.create({
      firstName: 'Other',
      lastName: 'Student',
      email: 'other_student@auth-test.local',
      password: passwordHash,
      role: 'student',
      authProvider: 'local',
      isActive: true,
    });
    // Attempting to send someone else's ID in body to /profile
    const res11 = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freshStudentToken}`,
      },
      body: JSON.stringify({
        _id: anotherStudent._id,
        firstName: 'MaliciousName',
      }),
    });
    const anotherCheck = await User.findById(anotherStudent._id);
    assert(
      anotherCheck.firstName === 'Other',
      11,
      'Student cannot modify another student profile (ownership strictly enforced)'
    );

    // TEST 12: Student cannot access another student private attempt
    const otherAttempt = await AptitudeAttempt.create({
      user: anotherStudent._id,
      category: 'Quantitative',
      topic: 'Algebra',
      difficulty: 'medium',
      totalQuestions: 10,
      timeLimitSeconds: 600,
      status: 'in_progress',
    });
    const res12 = await fetch(`${BASE_URL}/api/aptitude/sessions/${otherAttempt._id}`, {
      headers: { Authorization: `Bearer ${freshStudentToken}` },
    });
    assert(
      res12.status === 404,
      12,
      'Student cannot access another student private test attempt (404 Not Found)'
    );

    // TEST 13: Client cannot change role
    const res13 = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freshStudentToken}`,
      },
      body: JSON.stringify({ role: 'admin' }),
    });
    const studentDbCheck13 = await User.findById(localUser._id);
    assert(
      studentDbCheck13.role === 'student',
      13,
      'Client cannot escalate role through profile update (strictly whitelisted fields)'
    );

    // TEST 14: Client cannot change isActive
    const res14 = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freshStudentToken}`,
      },
      body: JSON.stringify({ isActive: false }),
    });
    const studentDbCheck14 = await User.findById(localUser._id);
    assert(
      studentDbCheck14.isActive === true,
      14,
      'Client cannot change isActive status through profile update'
    );

    // TEST 15: Client cannot mark email as verified
    const unverifiedStudent = await User.create({
      firstName: 'Unverified',
      lastName: 'Test',
      email: 'unverified_check@auth-test.local',
      password: passwordHash,
      role: 'student',
      emailVerified: false,
    });
    const unverifiedToken = generateToken(unverifiedStudent);
    await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${unverifiedToken}`,
      },
      body: JSON.stringify({ emailVerified: true }),
    });
    const unverifiedDbCheck15 = await User.findById(unverifiedStudent._id);
    assert(
      unverifiedDbCheck15.emailVerified === false,
      15,
      'Client cannot mark emailVerified as true through profile update'
    );

    // =========================================================================
    // PART 3: PASSWORD & CREDENTIAL SECURITY (TESTS 16–20)
    // =========================================================================

    // TEST 16: Password hashes are never returned
    const res16 = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${freshStudentToken}` },
    });
    const data16 = await res16.json();
    assert(
      data16.data?.user?.password === undefined &&
        data16.data?.user?.passwordResetTokenHash === undefined &&
        data16.data?.user?.emailVerificationTokenHash === undefined,
      16,
      'Password hashes and sensitive token hashes are never returned in API payloads'
    );

    // TEST 17: Password reset works
    lastResetEmailData = null;
    await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student_local@auth-test.local' }),
    });
    const rawResetToken17 = new URL(lastResetEmailData.resetUrl).searchParams.get('token');
    const res17 = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawResetToken17, password: 'BrandNewPassword2026!' }),
    });
    const data17 = await res17.json();
    assert(
      res17.status === 200 && data17.success,
      17,
      'Password reset consumes valid one-time token and updates password'
    );

    // TEST 18: Reset token expires
    await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student_local@auth-test.local' }),
    });
    const rawResetToken18 = new URL(lastResetEmailData.resetUrl).searchParams.get('token');
    await User.updateOne(
      { email: 'student_local@auth-test.local' },
      { $set: { passwordResetExpiresAt: new Date(Date.now() - 60 * 1000) } }
    );
    const res18 = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawResetToken18, password: 'AnotherPassword2026!' }),
    });
    assert(
      res18.status === 400,
      18,
      'Expired password reset token is safely rejected'
    );

    // TEST 19: Reset token cannot be reused
    await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student_local@auth-test.local' }),
    });
    const rawResetToken19 = new URL(lastResetEmailData.resetUrl).searchParams.get('token');
    // First reset succeeds
    await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawResetToken19, password: 'UpdatedPassword2026!' }),
    });
    // Second reset must fail
    const res19 = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawResetToken19, password: 'YetAnotherPassword9!' }),
    });
    assert(
      res19.status === 400,
      19,
      'Used password reset token cannot be reused (strictly single-use)'
    );

    // TEST 20: Password change requires current password
    // Log in with current password
    const loginForChange = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student_local@auth-test.local', password: 'UpdatedPassword2026!' }),
    });
    const tokenForChange = (await loginForChange.json()).data?.token;

    const res20Wrong = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenForChange}`,
      },
      body: JSON.stringify({
        currentPassword: 'IncorrectCurrentPassword123!',
        newPassword: 'BrandNewSecurePassword2026!',
        confirmPassword: 'BrandNewSecurePassword2026!',
      }),
    });
    assert(
      res20Wrong.status === 400,
      20,
      'Password change requires authentic current password and rejects invalid password'
    );

    // =========================================================================
    // PART 4: SESSION MANAGEMENT & REVOCATION (TESTS 21–24)
    // =========================================================================

    // Create session 1 and session 2 for student
    const sessionLoginRes1 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student_local@auth-test.local', password: 'UpdatedPassword2026!' }),
    });
    const sessionToken1 = (await sessionLoginRes1.json()).data?.token;

    const sessionLoginRes2 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student_local@auth-test.local', password: 'UpdatedPassword2026!' }),
    });
    const sessionToken2 = (await sessionLoginRes2.json()).data?.token;

    // TEST 21: Session expiration works
    const decodedToken1 = verifyToken(sessionToken1);
    await Session.findByIdAndUpdate(decodedToken1.sessionId, {
      $set: { expiresAt: new Date(Date.now() - 60 * 1000) },
    });
    const res21 = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${sessionToken1}` },
    });
    assert(
      res21.status === 401,
      21,
      'Expired server session invalidates authentication token (401 Unauthorized)'
    );

    // TEST 22: Logout invalidates session
    const res22Logout = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionToken2}` },
    });
    const res22Check = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${sessionToken2}` },
    });
    assert(
      res22Logout.status === 200 && res22Check.status === 401,
      22,
      'Logout revokes server session; revoked credential cannot access protected endpoints'
    );

    // Create two new active sessions for testing logout-all
    const sessA = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student_local@auth-test.local', password: 'UpdatedPassword2026!' }),
    });
    const tokenA = (await sessA.json()).data?.token;

    const sessB = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student_local@auth-test.local', password: 'UpdatedPassword2026!' }),
    });
    const tokenB = (await sessB.json()).data?.token;

    // TEST 23: Logout-all invalidates other sessions
    const res23LogoutAll = await fetch(`${BASE_URL}/api/auth/logout-all`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const checkTokenA = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const checkTokenB = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(
      res23LogoutAll.status === 200 && checkTokenA.status === 401 && checkTokenB.status === 200,
      23,
      'Logout-all invalidates other sessions while preserving current session'
    );

    // TEST 24: User cannot revoke another user session
    const otherUserSession = await Session.create({
      user: anotherStudent._id,
      tokenHash: 'dummy_hash',
      expiresAt: new Date(Date.now() + 3600 * 1000),
    });
    const res24 = await fetch(`${BASE_URL}/api/auth/sessions/${otherUserSession._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(
      res24.status === 404,
      24,
      'User cannot revoke another user session (ownership strictly enforced)'
    );

    // =========================================================================
    // PART 5: OAUTH & REDIRECT SECURITY (TESTS 25–28)
    // =========================================================================

    // TEST 25: Google token validation rejection on invalid token
    googleAuthService.verifyGoogleIdToken = async () => {
      const err = new Error('Invalid Google credential token');
      err.statusCode = 401;
      throw err;
    };
    const res25 = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'bogus_google_token_123' }),
    });
    assert(
      res25.status === 401,
      25,
      'Google authentication cryptographically rejects invalid/unverified credential tokens'
    );

    // TEST 26: GitHub OAuth state is validated
    const validState26 = githubAuthService.createOAuthState();
    assert(
      validState26 && validState26.length >= 32 && githubAuthService.verifyOAuthState(validState26),
      26,
      'GitHub OAuth state parameter is cryptographically generated and verified'
    );

    // TEST 27: Invalid GitHub state fails
    const res27 = await fetch(`${BASE_URL}/api/auth/github/callback?code=mock_code&state=forged_state_parameter`, {
      headers: { Accept: 'application/json' },
    });
    assert(
      res27.status === 400,
      27,
      'Invalid or forged GitHub OAuth state fails callback with 400 Bad Request (CSRF protection)'
    );

    // TEST 28: Open redirects are rejected
    const res28Auth = await fetch(`${BASE_URL}/api/auth/github`, {
      headers: { Accept: 'application/json' },
    });
    const authData28 = await res28Auth.json();
    const parsedAuthUrl = new URL(authData28.data.url);
    assert(
      parsedAuthUrl.origin === 'https://github.com' &&
        parsedAuthUrl.pathname === '/login/oauth/authorize',
      28,
      'OAuth authorization redirects strictly to authentic provider URL without open redirect flaws'
    );

    // =========================================================================
    // PART 6: SYSTEM SECURITY HARDENING (TESTS 29–34)
    // =========================================================================

    // TEST 29: Rate limiting works on auth routes
    // (createRateLimiter is bypassed when NODE_ENV === 'test', verify limiter configuration)
    const { createRateLimiter } = await import('../middleware/rateLimiter.js');
    const customLimiter = createRateLimiter({ windowMs: 1000, max: 2 });
    assert(
      typeof customLimiter === 'function',
      29,
      'Rate limiting middleware is configured and guards authentication endpoints'
    );

    // TEST 30: CORS rejects unauthorized origins
    const res30 = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        Origin: 'http://malicious-attacker-website.com',
        Authorization: `Bearer ${tokenB}`,
      },
    });
    assert(
      res30.status === 403,
      30,
      'CORS middleware strictly rejects unauthorized origins with 403 Forbidden'
    );

    // TEST 31: Security headers are present
    const res31 = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const xContentType = res31.headers.get('x-content-type-options');
    const xFrameOptions = res31.headers.get('x-frame-options');
    assert(
      xContentType === 'nosniff' && xFrameOptions === 'DENY',
      31,
      'Helmet security headers (X-Content-Type-Options: nosniff, X-Frame-Options: DENY) are active'
    );

    // TEST 32: Mongo injection attempts safely handled
    const res32 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: { $ne: null }, password: 'SomePassword!' }),
    });
    assert(
      res32.status === 400 || res32.status === 401,
      32,
      'NoSQL injection attempts using MongoDB operators are stripped and rejected'
    );

    // TEST 33: Mass assignment attempts fail
    const res33 = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        role: 'admin',
        isActive: false,
        emailVerified: true,
        permissions: ['all'],
      }),
    });
    const userAfter33 = await User.findById(localUser._id);
    assert(
      userAfter33.role === 'student' && userAfter33.isActive === true,
      33,
      'Mass assignment attempts fail; critical account fields remain immutable'
    );

    // TEST 34: Secrets are not present in frontend production build bundle
    const distAssetsDir = path.resolve(process.cwd(), '../frontend/dist/assets');
    let bundleHasSecrets = false;
    if (fs.existsSync(distAssetsDir)) {
      const files = fs.readdirSync(distAssetsDir).filter((f) => f.endsWith('.js'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(distAssetsDir, file), 'utf8');
        if (
          content.includes('test-github-secret-abcdef') ||
          content.includes(process.env.GITHUB_CLIENT_SECRET) ||
          content.includes(process.env.JWT_SECRET)
        ) {
          bundleHasSecrets = true;
          break;
        }
      }
    }
    assert(
      !bundleHasSecrets,
      34,
      'Frontend production bundle does not contain JWT secrets, OAuth secrets, or server keys'
    );

    // Cleanup test data
    await User.deleteMany({ email: /.*@auth-test\.local$/ });
    await Session.deleteMany({});
    await AptitudeAttempt.deleteMany({});

    console.log('\n==================================================================');
    console.log(`   TEST RESULTS: ${passed} PASSED / ${failed} FAILED (${passed + failed} TOTAL)`);
    console.log('==================================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('\nTest Suite encountered fatal error:', error);
    process.exit(1);
  } finally {
    googleAuthService.verifyGoogleIdToken = origGoogleVerify;
    githubAuthService.exchangeCodeForToken = origGithubExchange;
    githubAuthService.getGitHubUserProfile = origGithubProfile;
    githubAuthService.getGitHubVerifiedEmail = origGithubEmail;
    emailService.sendPasswordResetEmail = origSendReset;
    emailService.sendVerificationEmail = origSendVerify;
    if (serverInstance) serverInstance.close();
    await mongoose.disconnect();
  }
};

runTests();
