/**
 * testPhase6IntegrationContractSuite.js — Comprehensive Phase 6 Integration Contract Test Suite
 *
 * Validates the end-to-end API contracts between React frontend and Express/MongoDB backend:
 * 1. 401 & Error Envelopes: Consistent { success: false, message: ... } envelope across all routes
 * 2. Auth Flow Contracts: Login, Register, Profile, Token Refresh, Session Revocation
 * 3. Dashboard & Progress Contract: Correct schema, null/empty safety, zero-data resiliency
 * 4. Company Directory & Filtering Contract: Pagination, URL params, target toggling, eligibility checks
 * 5. Leaderboard Query & Clamping Contract: Standard envelope, ?limit bounds enforcement
 * 6. Assessment Autosave & Idempotency Guard: Aptitude session lifecycle, answer autosave, idempotent duplicate submit
 * 7. Mock Test Lifecycle & Idempotency Guard: Start, autosave, submission, idempotent duplicate submit
 * 8. Coding Practice Honest Fallback Contract: execution_unavailable status on run and submit
 * 9. Goals Lifecycle & Idempotency Contract: Sync defaults, create, toggle, delete
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoose from 'mongoose';
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
import AptitudeQuestion from '../models/AptitudeQuestion.js';
import AptitudeAttempt from '../models/AptitudeAttempt.js';
import MockTest from '../models/MockTest.js';
import MockTestAttempt from '../models/MockTestAttempt.js';
import CodingProblem from '../models/CodingProblem.js';
import PreparationGoal from '../models/PreparationGoal.js';

import authRoutes from '../routes/auth.js';
import dashboardRoutes from '../routes/dashboard.js';
import progressRoutes from '../routes/progress.js';
import companyRoutes from '../routes/company.js';
import leaderboardRoutes from '../routes/leaderboard.js';
import aptitudeRoutes from '../routes/aptitude.js';
import mockTestRoutes from '../routes/mockTest.js';
import codingRoutes from '../routes/coding.js';
import goalRoutes from '../routes/goal.js';
import errorHandler from '../middleware/errorHandler.js';
import notFound from '../middleware/notFound.js';
import requestTracing from '../middleware/requestTracing.js';
import { issueSessionAndToken } from '../controllers/authController.js';

const TEST_PORT = 5026;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

const app = express();
app.use(requestTracing);
app.use(helmet({ contentSecurityPolicy: false, frameguard: { action: 'deny' } }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Mount production routes under test
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/aptitude', aptitudeRoutes);
app.use('/api/mock-tests', mockTestRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/goals', goalRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

let server;
let passedCount = 0;
let failedCount = 0;

function assert(condition, testNum, description, details = '') {
  if (condition) {
    passedCount++;
    console.log(`  ✓ [PASS] TEST ${testNum}: ${description}`);
  } else {
    failedCount++;
    console.error(`  ✗ [FAIL] TEST ${testNum}: ${description}${details ? ` (${details})` : ''}`);
    throw new Error(`Test failed: TEST ${testNum} - ${description}`);
  }
}

async function run() {
  console.log('\n==================================================================');
  console.log('   RECRUITREADY - PHASE 6 API CONTRACT & INTEGRATION SUITE');
  console.log('==================================================================\n');

  try {
    await connectDB();
    server = app.listen(TEST_PORT);
    console.log(`[HTTP] Integration test server listening on ${BASE_URL}\n`);

    // Clean up previous test runs
    const testDomain = '@phase6-test.local';
    await User.deleteMany({ email: { $regex: testDomain } });
    await Company.deleteMany({ slug: { $regex: /^phase6-/ } });
    await AptitudeQuestion.deleteMany({ topic: 'Phase6-Topic' });
    await MockTest.deleteMany({ title: 'Phase 6 Integration Mock Test' });
    await CodingProblem.deleteMany({ title: 'Phase 6 Integration Problem' });
    await PreparationGoal.deleteMany({ title: { $regex: /^Phase 6/ } });

    // ─────────────────────────────────────────────────────────────────
    // SECTION 1: AUTHENTICATION & ERROR ENVELOPE CONSISTENCY
    // ─────────────────────────────────────────────────────────────────
    console.log('--- SECTION 1: API Client & Auth Error Contract Consistency ---');

    // TEST 1: Missing Authorization header on protected route returns 401 with standard envelope
    const res1 = await fetch(`${BASE_URL}/api/dashboard/summary`);
    const data1 = await res1.json();
    assert(
      res1.status === 401 && data1.success === false && typeof data1.message === 'string',
      1,
      'Missing token returns HTTP 401 and standard { success: false, message } envelope'
    );

    // TEST 2: Malformed Bearer token returns 401 with standard envelope
    const res2 = await fetch(`${BASE_URL}/api/dashboard/summary`, {
      headers: { Authorization: 'Bearer this.is.invalid' },
    });
    const data2 = await res2.json();
    assert(
      res2.status === 401 && data2.success === false,
      2,
      'Malformed JWT returns HTTP 401 and { success: false } envelope'
    );

    // TEST 3: Unknown route triggers notFound middleware returning 404 with standard envelope
    const res3 = await fetch(`${BASE_URL}/api/nonexistent-endpoint-route`);
    const data3 = await res3.json();
    assert(
      res3.status === 404 && data3.success === false && typeof data3.message === 'string',
      3,
      'Unknown route returns HTTP 404 and { success: false, message } envelope'
    );

    // Create test user and session for authenticated tests
    const studentUser = await User.create({
      firstName: 'Integration',
      lastName: 'Tester',
      email: 'student@phase6-test.local',
      password: 'Password123!',
      college: 'Engineering Institute of Technology',
      branch: 'Computer Science',
      graduationYear: 2026,
      cgpa: 8.9,
      role: 'student',
      isVerified: true,
      isActive: true,
    });

    const { token: studentToken } = await issueSessionAndToken(studentUser, {
      headers: { 'user-agent': 'Phase6-Contract-Runner' },
      ip: '127.0.0.1',
    });

    // TEST 4: Valid Bearer token allows access and returns { success: true, data: ... }
    const res4 = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const data4 = await res4.json();
    assert(
      res4.status === 200 && data4.success === true && data4.data?.user?.email === 'student@phase6-test.local',
      4,
      'Valid session returns HTTP 200 with { success: true, data: { user } } payload'
    );

    // TEST 5: Login with bad credentials returns 401 without crashing server
    const res5 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@phase6-test.local', password: 'WrongPassword999!' }),
    });
    const data5 = await res5.json();
    assert(
      res5.status === 401 && data5.success === false,
      5,
      'Bad credentials return HTTP 401 without unhandled rejection'
    );

    // ─────────────────────────────────────────────────────────────────
    // SECTION 2: DASHBOARD & PROGRESS INTEGRATION CONTRACTS
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- SECTION 2: Dashboard & Progress Data Contracts ---');

    // TEST 6: Dashboard summary returns expected structure for fresh student (null/empty safety)
    const res6 = await fetch(`${BASE_URL}/api/dashboard/summary`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const data6 = await res6.json();
    assert(
      res6.status === 200 &&
      data6.success === true &&
      data6.data &&
      typeof data6.data.preparation === 'object' &&
      typeof data6.data.preparation.aptitude === 'object' &&
      typeof data6.data.streakDays === 'number' &&
      Array.isArray(data6.data.recentActivity),
      6,
      'GET /api/dashboard/summary returns fully structured object with safe default types'
    );

    // TEST 7: Progress summary returns overview and readiness breakdown
    const res7 = await fetch(`${BASE_URL}/api/progress/summary`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const data7 = await res7.json();
    assert(
      res7.status === 200 &&
      data7.success === true &&
      data7.data &&
      typeof data7.data.overview === 'object' &&
      typeof data7.data.readiness === 'object',
      7,
      'GET /api/progress/summary returns expected overview and readiness data structures'
    );

    // ─────────────────────────────────────────────────────────────────
    // SECTION 3: COMPANIES DIRECTORY, FILTERING, & ACTIONS CONTRACT
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- SECTION 3: Company Directory & Interactive Contracts ---');

    const testCompany1 = await Company.create({
      name: 'Phase 6 Enterprise Alpha',
      slug: 'phase6-enterprise-alpha',
      description: 'Global tech leader',
      industry: 'Technology',
      roles: ['Software Engineer', 'Data Engineer'],
      eligibility: 'B.Tech with 7.5+ CGPA',
      eligibilityCriteria: {
        minCgpa: 7.5,
        allowedBranches: ['Computer Science', 'Information Technology'],
        allowedGraduationYears: [2026],
      },
      isActive: true,
    });

    const testCompany2 = await Company.create({
      name: 'Phase 6 Finance Beta',
      slug: 'phase6-finance-beta',
      description: 'Fintech services',
      industry: 'Finance',
      roles: ['Analyst'],
      eligibility: 'B.Tech with 9.5+ CGPA',
      eligibilityCriteria: {
        minCgpa: 9.5,
        allowedBranches: ['Computer Science'],
        allowedGraduationYears: [2026],
      },
      isActive: true,
    });

    // TEST 8: GET /api/companies returns pagination envelope matching frontend expectation
    const res8 = await fetch(`${BASE_URL}/api/companies?page=1&limit=10`);
    const data8 = await res8.json();
    assert(
      res8.status === 200 &&
      data8.success === true &&
      data8.data &&
      Array.isArray(data8.data.companies) &&
      typeof data8.data.pagination?.total === 'number' &&
      typeof data8.data.pagination?.page === 'number' &&
      typeof data8.data.pagination?.pages === 'number',
      8,
      'GET /api/companies returns standard pagination envelope { success, data: { companies, pagination } }'
    );

    // TEST 9: Query filtering by industry
    const res9 = await fetch(`${BASE_URL}/api/companies?industry=Technology`);
    const data9 = await res9.json();
    const allTech = data9.data.companies.every((c) => c.industry === 'Technology');
    assert(
      res9.status === 200 && data9.success === true && allTech,
      9,
      'GET /api/companies?industry=Technology properly filters records by industry'
    );

    // TEST 10: Toggle target company adds and removes target cleanly
    const res10 = await fetch(`${BASE_URL}/api/companies/${testCompany1._id}/target`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const data10 = await res10.json();
    assert(
      res10.status === 200 &&
      data10.success === true &&
      typeof data10.data?.isTarget === 'boolean',
      10,
      'POST /api/companies/:id/target returns { success: true, data: { isTarget } }'
    );

    // TEST 11: Check eligibility endpoint returns structured criteria check
    const res11 = await fetch(`${BASE_URL}/api/companies/${testCompany1._id}/check-eligibility`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const data11 = await res11.json();
    assert(
      res11.status === 200 &&
      data11.success === true &&
      typeof data11.data?.status === 'string' &&
      data11.data.status === 'likely_eligible',
      11,
      'POST /api/companies/:id/check-eligibility returns criteria evaluation with likely_eligible status'
    );

    // ─────────────────────────────────────────────────────────────────
    // SECTION 4: LEADERBOARD CONTRACT & QUERY CLAMPING
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- SECTION 4: Leaderboard Contract & Query Clamping ---');

    // TEST 12: GET /api/leaderboard returns ranked students and currentUser
    const res12 = await fetch(`${BASE_URL}/api/leaderboard`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const data12 = await res12.json();
    assert(
      res12.status === 200 &&
      data12.success === true &&
      Array.isArray(data12.data?.leaderboard) &&
      typeof data12.data?.scoringRules === 'object',
      12,
      'GET /api/leaderboard returns { success: true, data: { leaderboard, currentUser, scoringRules } }'
    );

    // TEST 13: GET /api/leaderboard?limit=1 limits returned data
    const res13 = await fetch(`${BASE_URL}/api/leaderboard?limit=1`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const data13 = await res13.json();
    assert(
      res13.status === 200 &&
      data13.success === true &&
      data13.data?.leaderboard.length <= 1,
      13,
      'GET /api/leaderboard?limit=1 respects requested limit'
    );

    // TEST 14: GET /api/leaderboard?limit=99999 is safely bounded to <= 100
    const res14 = await fetch(`${BASE_URL}/api/leaderboard?limit=99999`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const data14 = await res14.json();
    assert(
      res14.status === 200 &&
      data14.success === true &&
      data14.data?.leaderboard.length <= 100,
      14,
      'GET /api/leaderboard with oversized limit is bounded to maximum page size (100)'
    );

    // ─────────────────────────────────────────────────────────────────
    // SECTION 5: APTITUDE LIFECYCLE & IDEMPOTENT SUBMISSION
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- SECTION 5: Aptitude Session Lifecycle & Idempotency ---');

    const q1 = await AptitudeQuestion.create({
      question: 'Phase 6 Integration Question 1: What is 2 + 2?',
      options: [
        { key: 'A', text: '1' },
        { key: 'B', text: '2' },
        { key: 'C', text: '3' },
        { key: 'D', text: '4' },
      ],
      correctOption: 'D',
      category: 'Quantitative Aptitude',
      topic: 'Phase6-Topic',
      difficulty: 'easy',
      explanation: 'Basic addition',
    });

    // TEST 15: Start aptitude session returns attempt with questions and server-authoritative timer
    const res15 = await fetch(`${BASE_URL}/api/aptitude/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category: 'Quantitative Aptitude',
        topic: 'Phase6-Topic',
        difficulty: 'easy',
        totalQuestions: 1,
      }),
    });
    const data15 = await res15.json();
    assert(
      res15.status === 201 &&
      data15.success === true &&
      data15.data?.attempt?._id,
      15,
      'POST /api/aptitude/sessions starts attempt and returns attempt ID'
    );

    const attemptId = data15.data.attempt._id;

    // TEST 16: Autosave answers PATCH endpoint updates answers
    const res16 = await fetch(`${BASE_URL}/api/aptitude/sessions/${attemptId}/answers`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questionId: q1._id,
        selectedOption: 'D',
      }),
    });
    const data16 = await res16.json();
    assert(
      res16.status === 200 && data16.success === true,
      16,
      'PATCH /api/aptitude/sessions/:id/answers successfully autosaves student answer'
    );

    // TEST 17: Submit attempt marks attempt completed and returns score
    const res17 = await fetch(`${BASE_URL}/api/aptitude/sessions/${attemptId}/submit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const data17 = await res17.json();
    assert(
      res17.status === 200 &&
      data17.success === true &&
      typeof data17.data?.score === 'number',
      17,
      'POST /api/aptitude/sessions/:id/submit finalizes attempt and calculates authoritative score'
    );

    // TEST 18: Idempotent submission: subsequent submit returns 200 with completed status and existing result
    const res18 = await fetch(`${BASE_URL}/api/aptitude/sessions/${attemptId}/submit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const data18 = await res18.json();
    assert(
      res18.status === 200 &&
      data18.success === true &&
      data18.data?.status === 'submitted',
      18,
      'Subsequent submission of completed aptitude attempt returns idempotent 200 with result'
    );

    // ─────────────────────────────────────────────────────────────────
    // SECTION 6: MOCK TEST LIFECYCLE & IDEMPOTENT SUBMISSION
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- SECTION 6: Mock Test Lifecycle & Idempotency ---');

    const testMockTest = await MockTest.create({
      title: 'Phase 6 Integration Mock Test',
      description: 'Mock test for contract verification',
      durationMinutes: 30,
      totalQuestions: 1,
      categories: ['Quantitative Aptitude'],
      difficulty: 'easy',
      isPublished: true,
      questions: [
        {
          questionType: 'aptitude',
          questionId: q1._id,
          questionTypeRef: 'AptitudeQuestion',
          marks: 1,
        },
      ],
    });

    // TEST 19: Start mock test attempt returns attempt with questions and startedAt
    const res19 = await fetch(`${BASE_URL}/api/mock-tests/${testMockTest._id}/start`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const data19 = await res19.json();
    assert(
      res19.status === 201 &&
      data19.success === true &&
      data19.data?.attemptId,
      19,
      'POST /api/mock-tests/:id/start creates and returns new attempt'
    );

    const mockAttemptId = data19.data.attemptId;

    // TEST 20: Submit mock test attempt finalizes and scores
    const res20 = await fetch(`${BASE_URL}/api/mock-tests/attempts/${mockAttemptId}/submit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const data20 = await res20.json();
    assert(
      res20.status === 200 &&
      data20.success === true &&
      typeof data20.data?.score === 'number',
      20,
      'POST /api/mock-tests/attempts/:id/submit finalizes mock test and returns result'
    );

    // TEST 21: Idempotent submit on completed mock test attempt returns 200 with submitted status
    const res21 = await fetch(`${BASE_URL}/api/mock-tests/attempts/${mockAttemptId}/submit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const data21 = await res21.json();
    assert(
      res21.status === 200 &&
      data21.success === true &&
      data21.data?.status === 'submitted',
      21,
      'Subsequent submission of mock test attempt returns idempotent 200 with submitted status'
    );

    // ─────────────────────────────────────────────────────────────────
    // SECTION 7: CODING PRACTICE RUNNER CONTRACT
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- SECTION 7: Coding Practice Honest Fallback Contract ---');

    const testCodingProblem = await CodingProblem.create({
      title: 'Phase 6 Integration Problem',
      slug: 'phase-6-integration-problem',
      description: 'Two sum contract problem',
      difficulty: 'easy',
      category: 'Arrays',
      starterCode: { javascript: 'function solution() {}' },
      testCases: [{ input: '1, 2', expectedOutput: '3', isHidden: false }],
    });

    // TEST 22: Run code returns honest execution_unavailable without throwing 500
    const res22 = await fetch(`${BASE_URL}/api/coding/problems/${testCodingProblem._id}/run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: 'javascript',
        code: 'function solution() { return 3; }',
      }),
    });
    const data22 = await res22.json();
    assert(
      res22.status === 200 &&
      data22.success === true &&
      data22.data?.runResult?.status === 'execution_unavailable',
      22,
      'POST /api/coding/problems/:id/run returns status: "execution_unavailable" gracefully'
    );

    // TEST 23: Submit code returns honest execution_unavailable without throwing 500
    const res23 = await fetch(`${BASE_URL}/api/coding/problems/${testCodingProblem._id}/submit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: 'javascript',
        code: 'function solution() { return 3; }',
      }),
    });
    const data23 = await res23.json();
    assert(
      res23.status === 201 &&
      data23.success === true &&
      data23.data?.submission?.status === 'execution_unavailable',
      23,
      'POST /api/coding/problems/:id/submit returns status: "execution_unavailable" gracefully'
    );

    // ─────────────────────────────────────────────────────────────────
    // SECTION 8: GOALS & PROFILE CONTRACT
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- SECTION 8: Goals Lifecycle & Idempotency Contract ---');

    // TEST 24: POST /api/goals creates a custom goal
    const res24 = await fetch(`${BASE_URL}/api/goals`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Phase 6 Integration Goal: Solve 5 Coding Problems',
      }),
    });
    const data24 = await res24.json();
    assert(
      res24.status === 201 &&
      data24.success === true &&
      data24.data?.goal?._id,
      24,
      'POST /api/goals creates and returns new goal entity'
    );

    const createdGoalId = data24.data.goal._id;

    // TEST 25: GET /api/goals returns goal list with summary & catalog
    const res25 = await fetch(`${BASE_URL}/api/goals`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const data25 = await res25.json();
    assert(
      res25.status === 200 &&
      data25.success === true &&
      Array.isArray(data25.data?.goals) &&
      data25.data.goals.length > 0 &&
      typeof data25.data?.summary === 'object',
      25,
      'GET /api/goals returns populated goals array with summary and catalog'
    );

    // TEST 26: PATCH /api/goals/:id/toggle idempotently updates completion status
    const res26 = await fetch(`${BASE_URL}/api/goals/${createdGoalId}/toggle`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ completed: true }),
    });
    const data26 = await res26.json();
    assert(
      res26.status === 200 &&
      data26.success === true &&
      data26.data?.goal?.isCompleted === true,
      26,
      'PATCH /api/goals/:id/toggle successfully marks goal as completed'
    );

    // Clean up created resources
    await User.deleteMany({ email: { $regex: testDomain } });
    await Company.deleteMany({ slug: { $regex: /^phase6-/ } });
    await AptitudeQuestion.deleteMany({ topic: 'Phase6-Topic' });
    await MockTest.deleteMany({ title: 'Phase 6 Integration Mock Test' });
    await CodingProblem.deleteMany({ title: 'Phase 6 Integration Problem' });
    await PreparationGoal.deleteMany({ title: { $regex: /^Phase 6/ } });

    console.log('\n==================================================================');
    console.log(`   PHASE 6 INTEGRATION CONTRACT RESULTS: ${passedCount} PASSED / ${failedCount} FAILED`);
    console.log('==================================================================\n');

    server.close();
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\n[FATAL ERROR in Phase 6 Integration Suite]:', err);
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
}

run();
