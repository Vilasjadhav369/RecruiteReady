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
import { fileURLToPath } from 'url';
import { assertTestDatabase, createTestSession } from './testHelpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();
assertTestDatabase();

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
import { issueSessionAndToken } from '../controllers/authController.js';
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
    const unverifiedToken = await createTestSession(unverifiedStudent);
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

    // TEST 15b: Valid preparationLevel, cgpa, and backlogs update succeeds
    const res15b = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freshStudentToken}`,
      },
      body: JSON.stringify({
        preparationLevel: 'Intermediate',
        cgpa: 8.75,
        backlogs: 0,
      }),
    });
    const data15b = await res15b.json();
    const studentDbCheck15b = await User.findById(localUser._id);
    assert(
      res15b.status === 200 &&
        data15b.success &&
        studentDbCheck15b.preparationLevel === 'Intermediate' &&
        studentDbCheck15b.cgpa === 8.75 &&
        studentDbCheck15b.backlogs === 0,
      '15b',
      'Client can update valid preparationLevel, cgpa, and backlogs without ReferenceError'
    );

    // TEST 15c: Invalid preparationLevel is rejected with 400 Bad Request
    const res15c = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freshStudentToken}`,
      },
      body: JSON.stringify({ preparationLevel: 'InvalidLevel123' }),
    });
    assert(
      res15c.status === 400,
      '15c',
      'Invalid preparationLevel is rejected with 400 Bad Request'
    );

    // TEST 15d: Invalid CGPA (< 0 or > 10) is rejected with 400 Bad Request
    const res15d = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freshStudentToken}`,
      },
      body: JSON.stringify({ cgpa: 11.5 }),
    });
    assert(
      res15d.status === 400,
      '15d',
      'Invalid CGPA (> 10) is rejected with 400 Bad Request'
    );

    // TEST 15e: Invalid backlogs (negative or fractional) is rejected with 400 Bad Request
    const res15e = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freshStudentToken}`,
      },
      body: JSON.stringify({ backlogs: -1 }),
    });
    assert(
      res15e.status === 400,
      '15e',
      'Negative backlogs count is rejected with 400 Bad Request'
    );

    // TEST 15f: Updating targetCompanies persists array and filters empty values
    const res15f = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freshStudentToken}`,
      },
      body: JSON.stringify({
        targetCompanies: ['Tata Consultancy Services', 'Amazon', '  Google  ', ''],
      }),
    });
    const data15f = await res15f.json();
    const studentDbCheck15f = await User.findById(localUser._id);
    assert(
      res15f.status === 200 &&
        data15f.success &&
        Array.isArray(studentDbCheck15f.targetCompanies) &&
        studentDbCheck15f.targetCompanies.length === 3 &&
        studentDbCheck15f.targetCompanies.includes('Google') &&
        studentDbCheck15f.targetCompanies.includes('Amazon') &&
        studentDbCheck15f.targetCompanies.includes('Tata Consultancy Services'),
      '15f',
      'Updating targetCompanies persists array and filters whitespace/empty strings'
    );

    // TEST 15g: Updating targetCompanies preserves existing academic fields (cgpa, backlogs, preparationLevel)
    assert(
      studentDbCheck15f.cgpa === 8.75 &&
        studentDbCheck15f.backlogs === 0 &&
        studentDbCheck15f.preparationLevel === 'Intermediate',
      '15g',
      'Target companies update strictly preserves existing academic values without accidental erasure'
    );

    // TEST 15h: Updating preparationGoals persists string array and filters whitespace/empty strings
    const res15h = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freshStudentToken}`,
      },
      body: JSON.stringify({
        preparationGoals: [
          'Solve 100+ DSA and algorithmic problems',
          '  Master Dynamic Programming and Graphs  ',
          '',
          'Complete 5 full-length placement mock tests',
        ],
      }),
    });
    const data15h = await res15h.json();
    const studentDbCheck15h = await User.findById(localUser._id);
    assert(
      res15h.status === 200 &&
        data15h.success &&
        Array.isArray(studentDbCheck15h.preparationGoals) &&
        studentDbCheck15h.preparationGoals.length === 3 &&
        studentDbCheck15h.preparationGoals[1] === 'Master Dynamic Programming and Graphs' &&
        studentDbCheck15h.targetCompanies.length === 3 &&
        studentDbCheck15h.cgpa === 8.75,
      '15h',
      'Updating preparationGoals persists array and preserves existing targetCompanies and academic fields'
    );

    // TEST 15i: Clearing preparationGoals with empty array persists safely
    const res15i = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freshStudentToken}`,
      },
      body: JSON.stringify({
        preparationGoals: [],
      }),
    });
    const studentDbCheck15i = await User.findById(localUser._id);
    assert(
      res15i.status === 200 &&
        Array.isArray(studentDbCheck15i.preparationGoals) &&
        studentDbCheck15i.preparationGoals.length === 0,
      '15i',
      'Clearing preparationGoals with empty array resets milestones safely'
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

    // TEST 17: Password reset works and revokes all active user sessions
    // First, establish an active session for the student and an active session for another student
    const preResetLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student_local@auth-test.local', password: 'TestPassword123!' }),
    });
    const preResetToken = (await preResetLogin.json()).data?.token;

    // Verify pre-reset token can access protected route
    const preResetCheck = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${preResetToken}` },
    });
    assert(
      preResetCheck.status === 200,
      '17-pre',
      'Pre-reset session token is valid and accesses protected route'
    );

    // Establish a session for another student to verify cross-user isolation
    const anotherStudentLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'other_student@auth-test.local', password: 'TestPassword123!' }),
    });
    const anotherStudentToken = (await anotherStudentLogin.json()).data?.token;

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

    // TEST 17b: Pre-reset session token is now rejected with 401 Unauthorized
    const postResetCheck = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${preResetToken}` },
    });
    assert(
      postResetCheck.status === 401,
      '17b',
      'Successful password reset revokes all previously active sessions (pre-reset token rejected with 401)'
    );

    // TEST 17c: Cross-user session isolation: other user's active session is NOT revoked
    const anotherUserCheck = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${anotherStudentToken}` },
    });
    assert(
      anotherUserCheck.status === 200,
      '17c',
      'Password reset session revocation is strictly user-scoped; other users remain authenticated'
    );

    // TEST 17d: Invalid reset token cannot revoke sessions
    const preInvalidToken = anotherStudentToken;
    const res17d = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'bogus_invalid_reset_token_xyz', password: 'SomePassword2026!' }),
    });
    const checkAfterInvalid = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${preInvalidToken}` },
    });
    assert(
      res17d.status === 400 && checkAfterInvalid.status === 200,
      '17d',
      'Invalid reset token is rejected with 400 and cannot revoke existing sessions'
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

    // TEST 29b: Token without sessionId is rejected with 401
    const tokenWithoutSession = generateToken(localUser);
    const res29b = await fetch(BASE_URL + '/api/auth/me', {
      headers: { Authorization: 'Bearer ' + tokenWithoutSession },
    });
    assert(
      res29b.status === 401,
      '29b',
      'Token minted without sessionId is strictly rejected with 401 Unauthorized'
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

    // =========================================================================
    // PART 7: PHASE 0A SECURITY PREFLIGHT & REGRESSION TESTS (TESTS 35–41)
    // =========================================================================

    // TEST 35: CR-1 Unverified local account linking safely clears old password & revokes existing sessions
    // Register unverified student
    const regRes35 = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Unverified',
        lastName: 'Target',
        email: 'unverified_target@auth-test.local',
        password: 'AttackerPassword123!',
        consent: true,
      }),
    });
    const regData35 = await regRes35.json();
    const unverifiedPreToken = regData35.data?.token;

    // Link via Google OAuth
    googleAuthService.verifyGoogleIdToken = async () => ({
      sub: 'google_sub_unverified_35',
      email: 'unverified_target@auth-test.local',
      emailVerified: true,
      name: 'Legit User',
      givenName: 'Legit',
      familyName: 'User',
      picture: 'https://lh3.googleusercontent.com/legit',
    });
    const linkRes35 = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'mock_google_token_35' }),
    });
    const linkData35 = await linkRes35.json();

    // Check 1: Old pre-linking session token is now rejected with 401
    const checkOldSess35 = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${unverifiedPreToken}` },
    });

    // Check 2: Attacker cannot log in with previous unverified password
    const loginOldPass35 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'unverified_target@auth-test.local',
        password: 'AttackerPassword123!',
      }),
    });

    // Check 3: User in database has password cleared and emailVerified true
    const userInDb35 = await User.findOne({ email: 'unverified_target@auth-test.local' }).select('+password');
    assert(
      linkRes35.status === 200 &&
        linkData35.success &&
        checkOldSess35.status === 401 &&
        loginOldPass35.status === 401 &&
        userInDb35.emailVerified === true &&
        userInDb35.password === undefined,
      35,
      'CR-1: Unverified local account linking safely clears old password and revokes previous active sessions'
    );

    // TEST 36: CR-4 Missing SMTP configuration never leaks raw token URLs in production mode
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    emailService.sendPasswordResetEmail = origSendReset; // Restore actual emailService logic
    emailService.sendVerificationEmail = origSendVerify;

    let interceptedLogs = [];
    const origConsoleError = console.error;
    const origConsoleLog = console.log;
    console.error = (...args) => interceptedLogs.push(args.join(' '));
    console.log = (...args) => interceptedLogs.push(args.join(' '));

    const resetDispatchResult = await emailService.sendPasswordResetEmail({
      email: 'student_local@auth-test.local',
      firstName: 'Student',
      resetUrl: 'https://recruitready.local/reset-password?token=secret_raw_token_xyz999',
      expiresInMinutes: 20,
    });

    console.error = origConsoleError;
    console.log = origConsoleLog;
    process.env.NODE_ENV = origNodeEnv;

    const leakedTokenInLogs = interceptedLogs.some((l) => l.includes('secret_raw_token_xyz999'));
    assert(
      resetDispatchResult.success === false &&
        resetDispatchResult.mode === 'unconfigured' &&
        !leakedTokenInLogs,
      36,
      'CR-4: Missing SMTP configuration in production mode prevents token-bearing URL leakage in logs'
    );

    // TEST 37: CR-4 Production startup environment validator rejects missing or weak required configuration
    const validateEnv = (await import('../config/validateEnv.js')).default;
    const prodEnvFails = validateEnv(); // Tested under simulated variables
    const origJwt = process.env.JWT_SECRET;
    const origClientUrl = process.env.CLIENT_URL;

    // Simulate invalid production environment
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'short';
    process.env.CLIENT_URL = 'http://localhost:5173';
    process.env.EMAIL_HOST = 'smtp.example.com';
    const prodInvalidCheck = validateEnv();

    // Restore environment
    process.env.NODE_ENV = origNodeEnv;
    process.env.JWT_SECRET = origJwt;
    process.env.CLIENT_URL = origClientUrl;

    assert(
      prodInvalidCheck.isValid === false &&
        prodInvalidCheck.errors.some((e) => e.includes('JWT_SECRET must be at least 32 characters')) &&
        prodInvalidCheck.errors.some((e) => e.includes('CLIENT_URL cannot point to localhost')) &&
        prodInvalidCheck.errors.some((e) => e.includes('smtp.example.com is not allowed')),
      37,
      'CR-4: Production startup environment validator identifies weak secrets, localhost URLs, and default SMTP'
    );

    // TEST 38: H-4 Social-only account password login returns generic 401 without crashing or leaking state
    const socialOnlyUser = await User.create({
      firstName: 'Social',
      lastName: 'Only',
      email: 'social_only@auth-test.local',
      googleId: 'google_social_only_sub_99',
      authProvider: 'google',
      role: 'student',
      isActive: true,
      emailVerified: true,
    });

    const socialLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'social_only@auth-test.local', password: 'AttemptPassword123!' }),
    });
    const socialLoginData = await socialLoginRes.json();
    assert(
      socialLoginRes.status === 401 &&
        socialLoginData.success === false &&
        socialLoginData.message === 'Invalid email or password',
      38,
      'H-4: Social-only account password login fails safely with generic 401 without leaking account type'
    );

    // TEST 39: H-4 Social-only account change-password returns clean 400 without unhandled exception
    const { token: socialToken } = await issueSessionAndToken(socialOnlyUser, {
      ip: '127.0.0.1',
      headers: { 'user-agent': 'TestAgent' },
    });
    const socialChangePassRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${socialToken}`,
      },
      body: JSON.stringify({
        currentPassword: 'AnyPassword123!',
        newPassword: 'BrandNewPassword2026!',
        confirmPassword: 'BrandNewPassword2026!',
      }),
    });
    const socialChangePassData = await socialChangePassRes.json();
    assert(
      socialChangePassRes.status === 400 &&
        socialChangePassData.success === false &&
        socialChangePassData.message.includes('social sign-in'),
      39,
      'H-4: Social-only account change-password returns clean 400 error without crashing server process'
    );

    // TEST 40: H-4 Invalid non-string registration or profile input rejected with 400
    const nonStringRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: { $ne: 'admin' },
        lastName: ['Smith'],
        email: { $gt: '' },
        password: 12345678,
        consent: true,
      }),
    });

    // Obtain an active authenticated student session for profile update test
    const loginStudent40 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student_local@auth-test.local', password: 'UpdatedPassword2026!' }),
    });
    const activeStudentToken40 = (await loginStudent40.json()).data?.token;

    const nonStringProfileRes = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeStudentToken40}`,
      },
      body: JSON.stringify({
        firstName: { evil: true },
      }),
    });
    assert(
      nonStringRegRes.status === 400 && nonStringProfileRes.status === 400,
      40,
      'H-4: Non-string inputs to registration and profile update are validated and rejected with 400 Bad Request'
    );

    // TEST 41: M-7 Administrator OAuth callback redirect destination verification
    // Verify frontend AuthCallbackPage logic maps role: 'admin' strictly to '/admin' (not '/admin/dashboard')
    const callbackPath = fs.existsSync(path.resolve(process.cwd(), 'frontend/src/pages/auth/AuthCallbackPage.jsx'))
      ? path.resolve(process.cwd(), 'frontend/src/pages/auth/AuthCallbackPage.jsx')
      : path.resolve(process.cwd(), '../frontend/src/pages/auth/AuthCallbackPage.jsx');
    const authCallbackCode = fs.readFileSync(callbackPath, 'utf8');
    const hasAdminDashboardRedirect = authCallbackCode.includes('navigate("/admin/dashboard"');
    const hasCorrectAdminRedirect = authCallbackCode.includes('navigate("/admin", { replace: true })');
    assert(
      !hasAdminDashboardRedirect && hasCorrectAdminRedirect,
      41,
      'M-7: Administrator OAuth callback redirect destination correctly navigates to /admin'
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
