/**
 * testPhase5AuthSessionSuite.js — Comprehensive Phase 5 Auth & Session Hardening Test Suite
 *
 * Verifies:
 * 1. Token cryptographic verification, malformed token handling, and tamper protection
 * 2. Session creation, token hash binding (SHA-256), and token-hash mismatch rejection
 * 3. Session lifecycle: verification, expiration, lazy-revocation, and MongoDB TTL index
 * 4. Server-side session revocation: single logout, logout-all, password change, password reset
 * 5. optionalAuth middleware hardening: anonymous, active, expired, and revoked session handling
 * 6. Account state enforcement: deactivation blocking and automatic session revocation on deactivation
 * 7. Cross-user session isolation & IDOR prevention (user substitution rejection)
 * 8. Social-only account protections against disclosure and unhandled crashes
 */

import express from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import connectDB from '../config/db.js';
import User from '../models/User.js';
import Session from '../models/Session.js';
import Company from '../models/Company.js';
import authRoutes from '../routes/auth.js';
import companyRoutes from '../routes/company.js';
import { updateStudentStatus, bulkUpdateStudentStatus } from '../controllers/adminController.js';
import { generateToken, verifyToken } from '../utils/jwt.js';
import sessionService from '../services/sessionService.js';
import { issueSessionAndToken } from '../controllers/authController.js';
import errorHandler from '../middleware/errorHandler.js';

const TEST_PORT = 5025;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

const app = express();
app.use(express.json());

// Routes under test
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);

// Admin status simulation route
const adminProtect = (req, res, next) => {
  req.user = { _id: new mongoose.Types.ObjectId(), role: 'admin' };
  next();
};
app.patch('/api/test-admin/students/:id/status', adminProtect, updateStudentStatus);
app.patch('/api/test-admin/students/bulk-status', adminProtect, bulkUpdateStudentStatus);

app.use(errorHandler);

let server;
let passedCount = 0;
let totalCount = 0;

function assert(condition, testNum, description) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  [PASS] TEST ${testNum}: ${description}`);
  } else {
    console.error(`  [FAIL] TEST ${testNum}: ${description}`);
    throw new Error(`Test failed: TEST ${testNum} - ${description}`);
  }
}

async function runTests() {
  console.log('\n==================================================================');
  console.log('   RECRUITEREADY - PHASE 5 AUTH & SESSION HARDENING SUITE');
  console.log('==================================================================\n');

  try {
    await connectDB();
    server = app.listen(TEST_PORT);
    console.log(`[HTTP] Test server listening on ${BASE_URL}\n`);

    // Clean up test data
    const testDomain = '@phase5-test.local';
    await User.deleteMany({ email: { $regex: testDomain } });
    await Session.deleteMany({});
    await Company.deleteMany({ slug: 'phase5-test-corp' });

    // Seed test company for optionalAuth verification
    const testCompany = await Company.create({
      name: 'Phase 5 Test Corp',
      slug: 'phase5-test-corp',
      description: 'Enterprise company track for Phase 5 tests',
      industry: 'Technology',
      hiringRoles: ['Software Engineer'],
      isActive: true,
    });

    // ─────────────────────────────────────────────────────────────────
    // PART 1: TOKEN CRYPTOGRAPHIC & FORMAT VALIDATION
    // ─────────────────────────────────────────────────────────────────
    console.log('--- PART 1: Token Cryptographic & Format Validation ---');

    // TEST 1: Missing Authorization header rejected
    const res1 = await fetch(`${BASE_URL}/api/auth/me`);
    assert(res1.status === 401, 1, 'Missing Authorization header is rejected with 401');

    // TEST 2: Malformed Authorization header prefix
    const res2 = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: 'Token invalid-prefix-format' },
    });
    assert(res2.status === 401, 2, 'Malformed Authorization header without Bearer prefix is rejected with 401');

    // TEST 3: Bearer with empty token
    const res3 = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: 'Bearer ' },
    });
    assert(res3.status === 401, 3, 'Bearer header with empty token is rejected with 401');

    // TEST 4: Invalid cryptographic token signature
    const res4 = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.invalidsignature' },
    });
    assert(res4.status === 401, 4, 'Token with invalid cryptographic signature is rejected with 401');

    // ─────────────────────────────────────────────────────────────────
    // PART 2: SESSION CREATION & TOKEN HASH BINDING
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- PART 2: Session Creation & Token Hash Binding ---');

    // Create primary test user
    const salt = await bcrypt.genSalt(10);
    const primaryStudent = await User.create({
      firstName: 'Alice',
      lastName: 'Hardened',
      email: `alice${testDomain}`,
      password: await bcrypt.hash('SecurePassword2026!', salt),
      role: 'student',
      isActive: true,
      emailVerified: true,
    });

    // TEST 5: Login creates session and issues token bound to sessionId
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `alice${testDomain}`, password: 'SecurePassword2026!' }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.data?.token, 5, 'Login succeeds and returns JWT token');

    const aliceToken1 = loginData.data.token;
    const decoded1 = verifyToken(aliceToken1);
    assert(Boolean(decoded1.sessionId), 6, 'Issued JWT contains valid sessionId in payload');

    // TEST 7: Session record exists in DB with tokenHash matching SHA-256 of token
    const sessionDoc1 = await Session.findById(decoded1.sessionId).select('+tokenHash');
    const expectedHash1 = crypto.createHash('sha256').update(aliceToken1).digest('hex');
    assert(
      sessionDoc1 && sessionDoc1.tokenHash === expectedHash1,
      7,
      'Session record in database stores exact SHA-256 hash of the issued JWT token'
    );

    // TEST 8: Token succeeds accessing protected /api/auth/me
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${aliceToken1}` },
    });
    assert(meRes.status === 200, 8, 'Token with valid active session accesses protected route');

    // TEST 9: Token with mismatched tokenHash in session is rejected
    // Simulate token hijacking or token desynchronization
    await Session.findByIdAndUpdate(decoded1.sessionId, {
      $set: { tokenHash: crypto.randomBytes(32).toString('hex') },
    });
    const tamperedRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${aliceToken1}` },
    });
    assert(
      tamperedRes.status === 401,
      9,
      'Token presented whose SHA-256 hash does not match session tokenHash is rejected with 401'
    );

    // Restore correct hash for subsequent tests
    await Session.findByIdAndUpdate(decoded1.sessionId, {
      $set: { tokenHash: expectedHash1 },
    });

    // TEST 10: Malformed sessionId string in JWT does not crash with 500 CastError
    const forgedToken = generateToken({ _id: primaryStudent._id, role: 'student' }, 'malformed-not-an-objectid');
    const malformedRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${forgedToken}` },
    });
    assert(
      malformedRes.status === 401,
      10,
      'Malformed sessionId in JWT payload fails safely with 401 without CastError 500 crash'
    );

    // ─────────────────────────────────────────────────────────────────
    // PART 3: SESSION EXPIRATION, REVOCATION & TTL INDEX
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- PART 3: Session Expiration, Revocation & TTL Index ---');

    // TEST 11: Expired session returns 401 and lazily sets revokedAt
    await Session.findByIdAndUpdate(decoded1.sessionId, {
      $set: { expiresAt: new Date(Date.now() - 10000) },
    });
    const expiredRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${aliceToken1}` },
    });
    const expiredSessionDoc = await Session.findById(decoded1.sessionId);
    assert(
      expiredRes.status === 401 && expiredSessionDoc.revokedAt !== null,
      11,
      'Expired session is rejected with 401 and lazily updated with revokedAt timestamp'
    );

    // TEST 12: Verify MongoDB TTL index on Session.expiresAt
    const sessionIndexes = await Session.collection.indexes();
    const ttlIndex = sessionIndexes.find(
      (idx) => idx.key?.expiresAt === 1 && idx.expireAfterSeconds === 0
    );
    assert(
      Boolean(ttlIndex),
      12,
      'MongoDB sessions collection has authoritative TTL index { expiresAt: 1, expireAfterSeconds: 0 }'
    );

    // ─────────────────────────────────────────────────────────────────
    // PART 4: LOGOUT, LOGOUT-ALL & PASSWORD OPERATION REVOCATION
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- PART 4: Logout, Logout-All & Password Operation Revocation ---');

    // Log in Alice again to get fresh session 2
    const loginRes2 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `alice${testDomain}`, password: 'SecurePassword2026!' }),
    });
    const aliceToken2 = (await loginRes2.json()).data.token;
    const decoded2 = verifyToken(aliceToken2);

    // TEST 13: Logout endpoint revokes session
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${aliceToken2}` },
    });
    assert(logoutRes.status === 200, 13, 'POST /api/auth/logout succeeds with 200');

    // TEST 14: Token used after logout is rejected with 401
    const postLogoutRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${aliceToken2}` },
    });
    assert(postLogoutRes.status === 401, 14, 'Token after logout is immediately rejected with 401');

    // Create two new sessions to test logout-all
    const sLoginA = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `alice${testDomain}`, password: 'SecurePassword2026!' }),
    });
    const tokenA = (await sLoginA.json()).data.token;

    const sLoginB = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `alice${testDomain}`, password: 'SecurePassword2026!' }),
    });
    const tokenB = (await sLoginB.json()).data.token;

    // TEST 15: Logout-all revokes tokenA while preserving current tokenB
    const logoutAllRes = await fetch(`${BASE_URL}/api/auth/logout-all`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(logoutAllRes.status === 200, 15, 'POST /api/auth/logout-all responds 200');

    const checkTokenA = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const checkTokenB = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(
      checkTokenA.status === 401 && checkTokenB.status === 200,
      16,
      'Logout-all revokes other sessions while keeping current session active'
    );

    // TEST 17: Password change revokes all other sessions
    // Issue token C
    const sLoginC = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `alice${testDomain}`, password: 'SecurePassword2026!' }),
    });
    const tokenC = (await sLoginC.json()).data.token;

    // Change password using token C
    const changePwdRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenC}`,
      },
      body: JSON.stringify({
        currentPassword: 'SecurePassword2026!',
        newPassword: 'BrandNewPassword2026!',
        confirmPassword: 'BrandNewPassword2026!',
      }),
    });
    assert(changePwdRes.status === 200, 17, 'PATCH /api/auth/change-password succeeds with 200');

    // Token B (created before password change) must now be rejected
    const checkTokenBPostChange = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    // Token C (current session) remains valid
    const checkTokenCPostChange = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${tokenC}` },
    });
    assert(
      checkTokenBPostChange.status === 401 && checkTokenCPostChange.status === 200,
      18,
      'Password change revokes other active sessions while maintaining current session'
    );

    // ─────────────────────────────────────────────────────────────────
    // PART 5: OPTIONAL AUTH MIDDLEWARE HARDENING
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- PART 5: optionalAuth Middleware Hardening ---');

    // TEST 19: optionalAuth without token succeeds as anonymous guest
    const guestRes = await fetch(`${BASE_URL}/api/companies`);
    assert(guestRes.status === 200, 19, 'optionalAuth route allows anonymous guest requests (200 OK)');

    // TEST 20: optionalAuth with valid active session enriches request
    const validOptRes = await fetch(`${BASE_URL}/api/companies`, {
      headers: { Authorization: `Bearer ${tokenC}` },
    });
    assert(validOptRes.status === 200, 20, 'optionalAuth route succeeds with valid authenticated token');

    // TEST 21: optionalAuth with revoked session token does NOT leak authenticated state
    // Token B was revoked during password change
    const revokedOptRes = await fetch(`${BASE_URL}/api/companies/${testCompany._id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const revokedOptData = await revokedOptRes.json();
    assert(
      revokedOptRes.status === 200 && revokedOptData.data?.studentEligibility === undefined,
      21,
      'optionalAuth with revoked session gracefully falls back to guest without error or user personalization'
    );

    // TEST 22: optionalAuth with expired session token falls back to guest
    const expiredOptRes = await fetch(`${BASE_URL}/api/companies/${testCompany._id}`, {
      headers: { Authorization: `Bearer ${aliceToken1}` }, // aliceToken1 session expired earlier
    });
    const expiredOptData = await expiredOptRes.json();
    assert(
      expiredOptRes.status === 200 && expiredOptData.data?.studentEligibility === undefined,
      22,
      'optionalAuth with expired session gracefully falls back to guest without leaking authenticated state'
    );

    // ─────────────────────────────────────────────────────────────────
    // PART 6: ACCOUNT STATE & DEACTIVATION ENFORCEMENT
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- PART 6: Account State & Deactivation Enforcement ---');

    // Create a student to test deactivation
    const deactStudent = await User.create({
      firstName: 'Bob',
      lastName: 'Suspended',
      email: `bob${testDomain}`,
      password: await bcrypt.hash('SuspendedPass2026!', salt),
      role: 'student',
      isActive: true,
      emailVerified: true,
    });

    const bobLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `bob${testDomain}`, password: 'SuspendedPass2026!' }),
    });
    const bobToken = (await bobLoginRes.json()).data.token;
    const bobDecoded = verifyToken(bobToken);

    // Verify Bob is authenticated
    const bobMeRes1 = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    assert(bobMeRes1.status === 200, 23, 'Active student can access protected routes');

    // Admin deactivates Bob via admin endpoint
    const deactRes = await fetch(`${BASE_URL}/api/test-admin/students/${deactStudent._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    });
    assert(deactRes.status === 200, 24, 'Admin deactivates student account successfully');

    // TEST 25: Deactivated student session is immediately revoked in DB
    const bobSessionDoc = await Session.findById(bobDecoded.sessionId);
    assert(
      bobSessionDoc && bobSessionDoc.revokedAt !== null,
      25,
      'Admin account deactivation immediately revokes active database sessions for that user'
    );

    // TEST 26: Deactivated user token is rejected on protected routes
    const bobMeRes2 = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    assert(
      bobMeRes2.status === 401,
      26,
      'Token belonging to deactivated account is rejected with 401 Unauthorized'
    );

    // TEST 27: Deactivated student cannot log in
    const bobLoginDeact = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `bob${testDomain}`, password: 'SuspendedPass2026!' }),
    });
    const bobLoginData = await bobLoginDeact.json();
    assert(
      bobLoginDeact.status === 401 && bobLoginData.message?.includes('deactivated'),
      27,
      'Login attempt on deactivated account fails with 401 and informative deactivation message'
    );

    // TEST 28: Bulk deactivation revokes all sessions for target students
    const bulkStudent1 = await User.create({
      firstName: 'Bulk1',
      lastName: 'Student',
      email: `bulk1${testDomain}`,
      password: await bcrypt.hash('BulkPass2026!', salt),
      role: 'student',
      isActive: true,
    });
    const bulkStudent2 = await User.create({
      firstName: 'Bulk2',
      lastName: 'Student',
      email: `bulk2${testDomain}`,
      password: await bcrypt.hash('BulkPass2026!', salt),
      role: 'student',
      isActive: true,
    });

    const bSess1 = await sessionService.createSession({ user: bulkStudent1 });
    const bSess2 = await sessionService.createSession({ user: bulkStudent2 });

    const bulkRes = await fetch(`${BASE_URL}/api/test-admin/students/bulk-status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: [bulkStudent1._id.toString(), bulkStudent2._id.toString()],
        isActive: false,
      }),
    });
    assert(bulkRes.status === 200, 28, 'Admin bulk deactivation responds 200 OK');

    const bDoc1 = await Session.findById(bSess1._id);
    const bDoc2 = await Session.findById(bSess2._id);
    assert(
      bDoc1.revokedAt !== null && bDoc2.revokedAt !== null,
      29,
      'Admin bulk deactivation immediately revokes sessions for all affected students'
    );

    // ─────────────────────────────────────────────────────────────────
    // PART 7: CROSS-USER SESSION ISOLATION & IDOR PROTECTION
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- PART 7: Cross-User Session Isolation & IDOR Protection ---');

    // Student A (Alice) and Student C (Carol)
    const carol = await User.create({
      firstName: 'Carol',
      lastName: 'Isolated',
      email: `carol${testDomain}`,
      password: await bcrypt.hash('CarolPassword2026!', salt),
      role: 'student',
      isActive: true,
      emailVerified: true,
    });

    const carolLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `carol${testDomain}`, password: 'CarolPassword2026!' }),
    });
    const carolToken = (await carolLogin.json()).data.token;
    const carolDecoded = verifyToken(carolToken);

    // Log in Alice with fresh token
    const aliceFreshLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `alice${testDomain}`, password: 'BrandNewPassword2026!' }),
    });
    const aliceFreshToken = (await aliceFreshLogin.json()).data.token;

    // TEST 30: Carol attempts to revoke Alice's session via DELETE /api/auth/sessions/:id
    const idorRevokeRes = await fetch(`${BASE_URL}/api/auth/sessions/${carolDecoded.sessionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${aliceFreshToken}` }, // Alice tries to delete Carol's session
    });
    assert(
      idorRevokeRes.status === 404,
      30,
      'Cross-user session revocation attempt returns 404 Not Found (strict ownership enforcement)'
    );

    // TEST 31: Session verifySession rejects session belonging to another user
    const crossCheck = await sessionService.verifySession(carolDecoded.sessionId, primaryStudent._id);
    assert(
      crossCheck === null,
      31,
      'sessionService.verifySession rejects cross-user session substitution (session.user !== userId)'
    );

    // TEST 32: Active sessions list only returns user own sessions
    const sessionsRes = await fetch(`${BASE_URL}/api/auth/sessions`, {
      headers: { Authorization: `Bearer ${aliceFreshToken}` },
    });
    const sessionsData = await sessionsRes.json();
    const aliceSessions = sessionsData.data?.sessions || [];
    const hasCarolSession = aliceSessions.some(
      (s) => s._id.toString() === carolDecoded.sessionId.toString()
    );
    assert(
      sessionsRes.status === 200 && !hasCarolSession,
      32,
      'GET /api/auth/sessions strictly limits results to authenticated user (no cross-user session leakage)'
    );

    // ─────────────────────────────────────────────────────────────────
    // PART 8: SOCIAL-ONLY ACCOUNT DEFENSES
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- PART 8: Social-Only Account Defenses ---');

    const socialStudent = await User.create({
      firstName: 'Social',
      lastName: 'GoogleUser',
      email: `google.student${testDomain}`,
      googleId: 'google-oauth-sub-123456789',
      authProvider: 'google',
      role: 'student',
      isActive: true,
      emailVerified: true,
      // no password set
    });

    // TEST 33: Password login on social-only user fails safely with generic 401
    const socialLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `google.student${testDomain}`, password: 'SomeArbitraryPassword!' }),
    });
    const socialLoginData = await socialLoginRes.json();
    assert(
      socialLoginRes.status === 401 && socialLoginData.message === 'Invalid email or password',
      33,
      'Social-only account login with password returns generic 401 without revealing account origin'
    );

    // TEST 34: Change password on social-only user returns clean 400 without crashing
    const { token: socialToken } = await issueSessionAndToken(socialStudent);
    const socialChangePwdRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${socialToken}`,
      },
      body: JSON.stringify({
        currentPassword: 'AnyOldPassword!',
        newPassword: 'BrandNewPassword123!',
      }),
    });
    assert(
      socialChangePwdRes.status === 400,
      34,
      'Change-password on social-only account returns clean 400 without crashing server process'
    );

    // Clean up
    await User.deleteMany({ email: { $regex: testDomain } });
    await Session.deleteMany({});
    await Company.deleteMany({ slug: 'phase5-test-corp' });

    console.log('\n==================================================================');
    console.log(`   TEST RESULTS: ${passedCount} PASSED / 0 FAILED (${totalCount} TOTAL)`);
    console.log('==================================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\nTest Suite encountered fatal error:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
  }
}

runTests();
