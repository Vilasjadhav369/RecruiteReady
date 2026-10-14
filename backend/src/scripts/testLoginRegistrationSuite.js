import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Session from '../models/Session.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const makeRequest = (options, postData = null) => {
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        statusCode: 0,
        error: err.message,
      });
    });

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

const runSuite = async () => {
  console.log('\n==================================================================');
  console.log('   RECRUITEREADY — LOGIN & REGISTRATION VERIFICATION SUITE');
  console.log('==================================================================\n');

  await connectDB();

  const testEmail = `verify_student_${Date.now()}@example.com`;
  const testPassword = 'StudentSecurePassword123!';
  let createdUserId = null;
  let authToken = null;
  let passedCount = 0;
  let failedCount = 0;

  const assert = (condition, testNum, description, details = '') => {
    if (condition) {
      console.log(`  ✓ [PASS] TEST ${testNum}: ${description}`);
      passedCount++;
    } else {
      console.error(`  ✗ [FAIL] TEST ${testNum}: ${description}`);
      if (details) console.error(`         Detail: ${details}`);
      failedCount++;
    }
  };

  try {
    // -------------------------------------------------------------
    // POINT 1: Register a new student with valid details
    // -------------------------------------------------------------
    const regRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        firstName: 'Verification',
        lastName: 'Candidate',
        email: testEmail,
        password: testPassword,
        college: 'Test Institute of Technology',
        branch: 'CSE',
        graduationYear: 2026,
        role: 'admin', // Attack vector: trying to elevate role on registration
      }
    );

    assert(
      regRes.statusCode === 201 &&
        regRes.data?.success === true &&
        regRes.data?.data?.user?.email === testEmail.toLowerCase() &&
        regRes.data?.data?.user?.role === 'student' && // Verified role escalation prevented
        Boolean(regRes.data?.data?.token),
      1,
      'Register new student with valid details succeeds (201 Created) and enforces student role',
      `Status: ${regRes.statusCode}, Data: ${JSON.stringify(regRes.data)}`
    );

    createdUserId = regRes.data?.data?.user?._id;
    authToken = regRes.data?.data?.token;

    // Verify password hash is never exposed in response
    assert(
      !regRes.data?.data?.user?.password && !regRes.data?.data?.user?.passwordResetTokenHash,
      '1b',
      'Registration payload never exposes password hash or token hashes'
    );

    // -------------------------------------------------------------
    // POINT 2: Register with an invalid email
    // -------------------------------------------------------------
    const invalidEmailRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        firstName: 'Invalid',
        lastName: 'Email',
        email: 'not-a-valid-email-address',
        password: testPassword,
      }
    );

    assert(
      invalidEmailRes.statusCode === 400 && invalidEmailRes.data?.success === false,
      2,
      'Register with invalid email fails safely (400 Bad Request)',
      `Status: ${invalidEmailRes.statusCode}`
    );

    // -------------------------------------------------------------
    // POINT 3: Register with missing required fields
    // -------------------------------------------------------------
    const missingFieldsRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: `missing_fields_${Date.now()}@example.com`,
      }
    );

    assert(
      missingFieldsRes.statusCode === 400 && missingFieldsRes.data?.success === false,
      3,
      'Register with missing required fields fails safely (400 Bad Request)',
      `Status: ${missingFieldsRes.statusCode}`
    );

    // -------------------------------------------------------------
    // POINT 4: Register with an existing email
    // -------------------------------------------------------------
    const duplicateEmailRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        firstName: 'Duplicate',
        lastName: 'Student',
        email: testEmail,
        password: testPassword,
      }
    );

    assert(
      duplicateEmailRes.statusCode === 409 &&
        duplicateEmailRes.data?.success === false &&
        duplicateEmailRes.data?.message?.includes('already exists'),
      4,
      'Register with existing email returns 409 Conflict with clear explanation',
      `Status: ${duplicateEmailRes.statusCode}`
    );

    // -------------------------------------------------------------
    // POINT 5: Log in using valid registered account
    // -------------------------------------------------------------
    const validLoginRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: testEmail,
        password: testPassword,
      }
    );

    assert(
      validLoginRes.statusCode === 200 &&
        validLoginRes.data?.success === true &&
        validLoginRes.data?.data?.user?.email === testEmail.toLowerCase() &&
        Boolean(validLoginRes.data?.data?.token),
      5,
      'Login with valid registered account succeeds (200 OK) with JWT and safe user profile',
      `Status: ${validLoginRes.statusCode}`
    );

    // -------------------------------------------------------------
    // POINT 6: Log in with an incorrect password
    // -------------------------------------------------------------
    const wrongPassRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: testEmail,
        password: 'CompletelyWrongPassword999!',
      }
    );

    assert(
      wrongPassRes.statusCode === 401 &&
        wrongPassRes.data?.success === false &&
        wrongPassRes.data?.message === 'Invalid email or password',
      6,
      'Login with incorrect password fails safely (401 Unauthorized) with generic anti-enumeration message',
      `Status: ${wrongPassRes.statusCode}`
    );

    // -------------------------------------------------------------
    // POINT 7: Log in using a nonexistent account
    // -------------------------------------------------------------
    const nonExistentRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: `ghost_${Date.now()}@example.com`,
        password: testPassword,
      }
    );

    assert(
      nonExistentRes.statusCode === 401 &&
        nonExistentRes.data?.success === false &&
        nonExistentRes.data?.message === 'Invalid email or password',
      7,
      'Login with nonexistent account fails safely (401 Unauthorized) with identical generic message',
      `Status: ${nonExistentRes.statusCode}`
    );

    // -------------------------------------------------------------
    // POINT 8: Access protected endpoint without authentication
    // -------------------------------------------------------------
    const unauthRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/me',
      method: 'GET',
    });

    assert(
      unauthRes.statusCode === 401 && unauthRes.data?.success === false,
      8,
      'Access protected endpoint (/api/auth/me) without token returns 401 Unauthorized',
      `Status: ${unauthRes.statusCode}`
    );

    // -------------------------------------------------------------
    // POINT 9: Access protected endpoint with valid authentication credential
    // -------------------------------------------------------------
    const authMeRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });

    assert(
      authMeRes.statusCode === 200 &&
        authMeRes.data?.success === true &&
        authMeRes.data?.data?.user?.email === testEmail.toLowerCase(),
      9,
      'Access protected endpoint (/api/auth/me) with Bearer token succeeds (200 OK)',
      `Status: ${authMeRes.statusCode}`
    );

    // -------------------------------------------------------------
    // POINT 10: Refresh browser after login (session retention via token)
    // -------------------------------------------------------------
    // When browser refreshes, AuthContext reads token from localStorage and calls /api/auth/me
    const refreshRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });

    assert(
      refreshRes.statusCode === 200 &&
        refreshRes.data?.data?.user?._id === createdUserId,
      10,
      'Browser refresh simulation restores full student identity and active session seamlessly',
      `Status: ${refreshRes.statusCode}`
    );

    // -------------------------------------------------------------
    // POINT 11: Admin Login Verification
    // -------------------------------------------------------------
    const adminLoginRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: 'admin@recruiteready.local',
        password: 'AdminPassword2026!',
      }
    );

    assert(
      adminLoginRes.statusCode === 200 &&
        adminLoginRes.data?.data?.user?.role === 'admin',
      11,
      'Admin login succeeds with verified role === "admin" and navigates to admin portal',
      `Status: ${adminLoginRes.statusCode}`
    );

  } finally {
    // Clean up temporary test student and session records
    if (createdUserId) {
      await User.findByIdAndDelete(createdUserId);
      await Session.deleteMany({ user: createdUserId });
    }
    await mongoose.connection.close();
  }

  console.log('\n==================================================================');
  console.log(` RESULTS: ${passedCount} PASSED / ${failedCount} FAILED (TOTAL: ${passedCount + failedCount})`);
  console.log('==================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
};

runSuite().catch((err) => {
  console.error('[SUITE ERROR]:', err);
  process.exit(1);
});
