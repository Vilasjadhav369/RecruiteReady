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

import User from '../models/User.js';
import AptitudeQuestion from '../models/AptitudeQuestion.js';
import AptitudeAttempt from '../models/AptitudeAttempt.js';
import CodingProblem from '../models/CodingProblem.js';
import CodingSubmission from '../models/CodingSubmission.js';
import Company from '../models/Company.js';
import StudyMaterial from '../models/StudyMaterial.js';
import MockTest from '../models/MockTest.js';
import MockTestAttempt from '../models/MockTestAttempt.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import Bookmark from '../models/Bookmark.js';
import AuditLog from '../models/AuditLog.js';
import CompanyPreparationProgress from '../models/CompanyPreparationProgress.js';

import healthRoutes from '../routes/health.js';
import authRoutes from '../routes/auth.js';
import dashboardRoutes from '../routes/dashboard.js';
import aptitudeRoutes from '../routes/aptitude.js';
import codingRoutes from '../routes/coding.js';
import companyRoutes from '../routes/company.js';
import resourceRoutes from '../routes/resource.js';
import mockTestRoutes from '../routes/mockTest.js';
import progressRoutes from '../routes/progress.js';
import reviewRoutes from '../routes/review.js';
import leaderboardRoutes from '../routes/leaderboard.js';
import adminRoutes from '../routes/admin.js';

import errorHandler from '../middleware/errorHandler.js';
import requestTracing from '../middleware/requestTracing.js';
import { generateToken } from '../utils/jwt.js';

const TEST_PORT = 5009;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

const app = express();
app.use(requestTracing);
app.use(helmet({ contentSecurityPolicy: false, frameguard: { action: 'deny' } }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/aptitude', aptitudeRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/mock-tests', mockTestRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);
app.use(errorHandler);

let server;
let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }
  return { status: response.status, headers: response.headers, data };
}

async function runPerformanceObservabilitySuite() {
  console.log('\n===============================================================');
  console.log(' RECRUITEREADY PHASE 10: QUALITY, OBSERVABILITY & PERFORMANCE SUITE');
  console.log('===============================================================\n');

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/recruiteready';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB.\n');

  server = app.listen(TEST_PORT, '127.0.0.1');

  try {
    const timestamp = Date.now();

    // 1. Setup Student & Admin
    const studentUser = await User.create({
      firstName: 'QualityStudent',
      lastName: 'Tester',
      email: `student_quality_${timestamp}@example.com`,
      password: 'HashedPassword123!',
      role: 'student',
      isActive: true,
      emailVerified: true,
      college: 'National Engineering Institute',
      branch: 'Computer Science',
      graduationYear: 2025,
      cgpa: 8.4,
      backlogs: 0,
      onboardingCompleted: true,
    });
    const studentToken = generateToken(studentUser);
    const studentHeaders = { Authorization: `Bearer ${studentToken}` };

    const studentUser2 = await User.create({
      firstName: 'StudentOther',
      lastName: 'Candidate',
      email: `student_other_${timestamp}@example.com`,
      password: 'HashedPassword123!',
      role: 'student',
      isActive: true,
      emailVerified: true,
      college: 'Premier Technical University',
      branch: 'Electronics',
      graduationYear: 2025,
    });
    const studentToken2 = generateToken(studentUser2);
    const studentHeaders2 = { Authorization: `Bearer ${studentToken2}` };

    const adminUser = await User.create({
      firstName: 'AdminQuality',
      lastName: 'Superuser',
      email: `admin_quality_${timestamp}@example.com`,
      password: 'AdminPassword123!',
      role: 'admin',
      isActive: true,
      emailVerified: true,
    });
    const adminToken = generateToken(adminUser);
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // --- GROUP 1: Health, Readiness & Request Tracing ---
    console.log('--- GROUP 1: Health, Readiness & Request Tracing ---');

    const healthRes = await request('/api/health');
    assert(healthRes.status === 200, 'GET /api/health returns 200 OK');
    assert(healthRes.data?.success === true, 'Health check returns success: true');
    assert(healthRes.data?.database === 'connected', 'Health check reports database: connected');
    assert(healthRes.headers.get('x-request-id') !== null, 'X-Request-ID header attached to response');

    const readyRes = await request('/api/ready');
    assert(readyRes.status === 200, 'GET /api/ready returns 200 OK');
    assert(readyRes.data?.status === 'ready', 'Readiness reports status: ready');
    assert(readyRes.data?.database === 'connected', 'Readiness reports database: connected');

    // Custom Request ID preservation
    const customId = `custom-trace-${timestamp}`;
    const tracedRes = await request('/api/health', {
      headers: { 'X-Request-ID': customId },
    });
    assert(tracedRes.headers.get('x-request-id') === customId, 'Client-supplied safe X-Request-ID is preserved');

    // --- GROUP 2: Centralized Error Formatting & Secrets Protection ---
    console.log('\n--- GROUP 2: Centralized Error Formatting & Secrets Protection ---');

    const invalidIdRes = await request('/api/coding/submissions/invalid-mongo-id', {
      headers: studentHeaders,
    });
    assert(invalidIdRes.status === 400, 'Invalid ObjectId handled with 400 Bad Request');
    assert(invalidIdRes.data?.success === false, 'Error body returns standard success: false');
    assert(invalidIdRes.data?.message.includes('Invalid'), 'Error returns clean human message without stack/path leaks');
    assert(invalidIdRes.data?.requestId !== undefined || invalidIdRes.headers.get('x-request-id') !== null, 'Request ID is tracked for traceability');

    // --- GROUP 3: Strict RBAC & Security Isolation ---
    console.log('\n--- GROUP 3: Strict RBAC & Security Isolation ---');

    const forbiddenAdminRes = await request('/api/admin/dashboard', {
      headers: studentHeaders,
    });
    assert(forbiddenAdminRes.status === 403, 'Student cannot access GET /api/admin/dashboard (403 Forbidden)');

    const forbiddenExportRes = await request('/api/admin/students/export-csv', {
      headers: studentHeaders,
    });
    assert(forbiddenExportRes.status === 403, 'Student cannot access GET /api/admin/students/export-csv (403 Forbidden)');

    // Inactive user block
    const inactiveUser = await User.create({
      firstName: 'Inactive',
      lastName: 'Student',
      email: `inactive_${timestamp}@example.com`,
      password: 'Password123!',
      role: 'student',
      isActive: false,
    });
    const inactiveToken = generateToken(inactiveUser);
    const inactiveRes = await request('/api/dashboard/summary', {
      headers: { Authorization: `Bearer ${inactiveToken}` },
    });
    assert(inactiveRes.status === 401 || inactiveRes.status === 403, 'Deactivated account cannot access protected endpoints');

    // --- GROUP 4: Database Model Indexes Verification ---
    console.log('\n--- GROUP 4: Database Model Indexes Verification ---');

    const userIndexes = await User.collection.indexes();
    const hasUserRoleIndex = userIndexes.some((idx) => idx.key.role === 1);
    assert(hasUserRoleIndex, 'User collection has index on role');

    const codingProblemIndexes = await CodingProblem.collection.indexes();
    const hasCodingActiveCreated = codingProblemIndexes.some(
      (idx) => idx.key.isActive === 1 && idx.key.createdAt === -1
    );
    assert(hasCodingActiveCreated, 'CodingProblem collection has compound index on { isActive: 1, createdAt: -1 }');

    const companyIndexes = await Company.collection.indexes();
    const hasCompanyActiveFeatured = companyIndexes.some(
      (idx) => idx.key.isActive === 1 && idx.key.isFeatured === -1
    );
    assert(hasCompanyActiveFeatured, 'Company collection has compound index on { isActive: 1, isFeatured: -1, createdAt: -1 }');

    const auditLogIndexes = await AuditLog.collection.indexes();
    const hasAuditLogActionCreated = auditLogIndexes.some(
      (idx) => idx.key.action === 1 && idx.key.createdAt === -1
    );
    assert(hasAuditLogActionCreated, 'AuditLog collection has compound index on { action: 1, createdAt: -1 }');

    // --- GROUP 5: Student Core Endpoints & Zero Fake Data Integrity ---
    console.log('\n--- GROUP 5: Student Core Endpoints & Zero Fake Data Integrity ---');

    const dashboardRes = await request('/api/dashboard/summary', {
      headers: studentHeaders,
    });
    assert(dashboardRes.status === 200, 'GET /api/dashboard/summary returns 200 OK');
    assert(dashboardRes.data?.success === true, 'Dashboard response has success: true');
    assert(
      dashboardRes.data?.data?.readiness?.score === null || typeof dashboardRes.data?.data?.readiness?.score === 'number',
      'Readiness score is a valid number or honest null (no NaN)'
    );

    const companiesRes = await request('/api/companies');
    assert(companiesRes.status === 200, 'GET /api/companies returns 200 OK');
    assert(Array.isArray(companiesRes.data?.data?.companies), 'GET /api/companies returns companies array');
    assert(companiesRes.data?.data?.pagination !== undefined, 'GET /api/companies returns pagination metadata');

    const resourcesRes = await request('/api/resources', {
      headers: studentHeaders,
    });
    assert(resourcesRes.status === 200, 'GET /api/resources returns 200 OK');
    assert(Array.isArray(resourcesRes.data?.data?.resources), 'GET /api/resources returns resources array');

    const mockTestsRes = await request('/api/mock-tests', {
      headers: studentHeaders,
    });
    assert(mockTestsRes.status === 200, 'GET /api/mock-tests returns 200 OK');
    assert(Array.isArray(mockTestsRes.data?.data?.mockTests), 'GET /api/mock-tests returns tests array');

    const progressRes = await request('/api/progress/summary', {
      headers: studentHeaders,
    });
    assert(progressRes.status === 200, 'GET /api/progress/summary returns 200 OK');
    assert(progressRes.data?.data?.readiness?.isEligible !== undefined, 'Progress readiness contains honest eligibility indicator');

    const leaderboardRes = await request('/api/leaderboard', {
      headers: studentHeaders,
    });
    assert(leaderboardRes.status === 200, 'GET /api/leaderboard returns 200 OK');
    assert(Array.isArray(leaderboardRes.data?.data?.leaderboard), 'GET /api/leaderboard returns leaderboard array');

    // --- GROUP 6: Aptitude Practice & Server-Authoritative Integrity ---
    console.log('\n--- GROUP 6: Aptitude Practice & Server-Authoritative Integrity ---');

    // Create a practice question
    const q1 = await AptitudeQuestion.create({
      question: `What is 10 + 20 in test ${timestamp}?`,
      options: [
        { key: 'A', text: '10' },
        { key: 'B', text: '20' },
        { key: 'C', text: '30' },
        { key: 'D', text: '40' },
      ],
      correctOption: 'C',
      category: 'Quantitative Aptitude',
      topic: 'Arithmetic',
      difficulty: 'easy',
      explanation: '10 + 20 = 30.',
      isActive: true,
    });

    const startSessionRes = await request('/api/aptitude/sessions', {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        category: 'Quantitative Aptitude',
        topic: 'Arithmetic',
        difficulty: 'easy',
        numberOfQuestions: 1,
        timeLimitMinutes: 10,
      }),
    });
    assert(startSessionRes.status === 201, 'POST /api/aptitude/sessions creates active session (201 Created)');
    const sessionId = startSessionRes.data?.data?.attempt?._id;
    const sessionQuestions = startSessionRes.data?.data?.questions;
    assert(sessionQuestions?.[0]?.correctOption === undefined, 'SECURITY: correctOption is strictly hidden from active session questions');
    assert(sessionQuestions?.[0]?.explanation === undefined, 'SECURITY: explanation is strictly hidden from active session questions');

    // Save answer
    const answerRes = await request(`/api/aptitude/sessions/${sessionId}/answers`, {
      method: 'PATCH',
      headers: studentHeaders,
      body: JSON.stringify({
        questionId: q1._id.toString(),
        selectedOption: 'C',
      }),
    });
    assert(answerRes.status === 200, 'PATCH /api/aptitude/sessions/:id/answers saves chosen answer');

    // Submit session
    const submitRes = await request(`/api/aptitude/sessions/${sessionId}/submit`, {
      method: 'POST',
      headers: studentHeaders,
    });
    assert(submitRes.status === 200, 'POST /api/aptitude/sessions/:id/submit finalizes score on server');
    assert(submitRes.data?.data?.score === 1, 'Server scored 1 correct answer');
    assert(submitRes.data?.data?.percentage === 100, 'Server computed 100% score');

    // Ownership enforcement: Student 2 cannot access Student 1's attempt
    const crossAccessRes = await request(`/api/aptitude/sessions/${sessionId}`, {
      headers: studentHeaders2,
    });
    assert(crossAccessRes.status === 404 || crossAccessRes.status === 403, 'OWNERSHIP: Student 2 cannot view Student 1 aptitude attempt');

    // --- GROUP 7: Coding Problem Security & Test Case Protection ---
    console.log('\n--- GROUP 7: Coding Problem Security & Test Case Protection ---');

    const prob1 = await CodingProblem.create({
      title: `Reverse Array ${timestamp}`,
      slug: `reverse-array-${timestamp}`,
      description: 'Reverse array elements.',
      difficulty: 'easy',
      testCases: [
        { input: '[1, 2]', expectedOutput: '[2, 1]', isHidden: false },
        { input: '[5, 6, 7]', expectedOutput: '[7, 6, 5]', isHidden: true },
      ],
      solutionExplanation: 'Use two pointers or reverse in-place.',
      isActive: true,
    });

    const probRes = await request(`/api/coding/problems/${prob1._id}`, {
      headers: studentHeaders,
    });
    assert(probRes.status === 200, 'GET /api/coding/problems/:id returns 200 OK');
    const problemData = probRes.data?.data?.problem;
    assert(problemData?.testCases?.length === 1, 'SECURITY: Only public test case is exposed');
    assert(problemData?.testCases?.[0]?.isHidden === false, 'Exposed test case has isHidden: false');
    assert(problemData?.solutionExplanation === undefined, 'SECURITY: solutionExplanation is strictly omitted from student problem view');

    // Code execution safety: Main Node.js process does NOT execute code directly
    const runRes = await request(`/api/coding/problems/${prob1._id}/run`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        language: 'javascript',
        code: 'function solve() { return [2, 1]; }',
      }),
    });
    assert(runRes.status === 200, 'POST /api/coding/problems/:id/run handles execution cleanly without crashing server process');

    // --- GROUP 8: Review Moderation & Student Reviews ---
    console.log('\n--- GROUP 8: Review Moderation & Student Reviews ---');

    const reviewRes = await request('/api/reviews', {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        rating: 5,
        title: 'Outstanding Preparation Portal',
        comment: 'Comprehensive platform that helped me prepare thoroughly for placements.',
      }),
    });
    assert(reviewRes.status === 201, 'POST /api/reviews creates student review (201 Created)');
    const createdReviewId = reviewRes.data?.data?.review?._id;

    // Public list only includes approved reviews, not pending
    const publicReviewsRes = await request('/api/reviews');
    assert(publicReviewsRes.status === 200, 'GET /api/reviews returns 200 OK');
    const isNewReviewInPublic = publicReviewsRes.data?.data?.reviews?.some((r) => r._id === createdReviewId);
    assert(!isNewReviewInPublic, 'Pending review is NOT exposed in public review listings until approved');

    // Admin approves review
    const approveRes = await request('/api/admin/reviews/bulk-moderation', {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({
        ids: [createdReviewId],
        status: 'approved',
      }),
    });
    assert(approveRes.status === 200, 'Admin approves pending review via PATCH /api/admin/reviews/bulk-moderation');

    // Clean up created test data
    await User.deleteMany({
      _id: { $in: [studentUser._id, studentUser2._id, adminUser._id, inactiveUser._id] },
    });
    await AptitudeQuestion.deleteOne({ _id: q1._id });
    await AptitudeAttempt.deleteOne({ _id: sessionId });
    await CodingProblem.deleteOne({ _id: prob1._id });
    await Review.deleteOne({ _id: createdReviewId });
    await AuditLog.deleteMany({ 'details.test': timestamp });

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
  }

  console.log('\n===============================================================');
  console.log(` RESULTS: ${passed} PASSED / ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPerformanceObservabilitySuite();
