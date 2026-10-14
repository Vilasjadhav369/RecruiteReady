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
import MockTest from '../models/MockTest.js';
import MockTestAttempt from '../models/MockTestAttempt.js';
import CodingProblem from '../models/CodingProblem.js';
import CodingSubmission from '../models/CodingSubmission.js';

import dashboardRoutes from '../routes/dashboard.js';
import progressRoutes from '../routes/progress.js';
import leaderboardRoutes from '../routes/leaderboard.js';
import aptitudeRoutes from '../routes/aptitude.js';
import mockTestRoutes from '../routes/mockTest.js';
import codingRoutes from '../routes/coding.js';
import errorHandler from '../middleware/errorHandler.js';
import requestTracing from '../middleware/requestTracing.js';
import { generateToken } from '../utils/jwt.js';

const TEST_PORT = 5014;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

const app = express();
app.use(requestTracing);
app.use(helmet({ contentSecurityPolicy: false, frameguard: { action: 'deny' } }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/aptitude', aptitudeRoutes);
app.use('/api/mock-tests', mockTestRoutes);
app.use('/api/coding', codingRoutes);
app.use(errorHandler);

let server;
let student1;
let student1Token;
let student2;
let student2Token;
let testMockTest;
let testProblem;
let testQuestion;

const results = [];
function recordTest(testName, passed, details = '') {
  results.push({ testName, passed, details });
  const status = passed ? '✓ [PASS]' : '✗ [FAIL]';
  console.log(`  ${status} ${testName}${details ? ` (${details})` : ''}`);
}

async function run() {
  console.log('===============================================================');
  console.log(' PHASE 4: DATA ACCESS & PERFORMANCE HARDENING TEST SUITE');
  console.log('===============================================================');

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/recruiteready';
    await mongoose.connect(mongoUri);
    console.log(`Connected to MongoDB for Phase 4 verification: ${mongoUri}`);

    await new Promise((resolve) => {
      server = app.listen(TEST_PORT, () => {
        console.log(`Test Express server listening on ${BASE_URL}`);
        resolve();
      });
    });

    const runId = Date.now().toString(36);

    // 1. Setup Student 1 and Student 2
    student1 = await User.create({
      firstName: 'PerfStudentOne',
      lastName: 'Runner',
      email: `perf1_${runId}@recruitready.local`,
      password: 'ValidPassword123!',
      role: 'student',
      isActive: true,
      emailVerified: true,
      college: 'Tech University',
      branch: 'Computer Science',
      graduationYear: 2026,
      preparationLevel: 'Intermediate',
      targetCompanies: ['Google', 'Microsoft'],
      preparationGoals: ['Ace DSA', 'Daily Practice'],
    });
    student1Token = generateToken(student1);

    student2 = await User.create({
      firstName: 'PerfStudentTwo',
      lastName: 'Tester',
      email: `perf2_${runId}@recruitready.local`,
      password: 'ValidPassword123!',
      role: 'student',
      isActive: true,
      emailVerified: true,
      college: 'Tech Institute',
      branch: 'Information Technology',
      graduationYear: 2026,
      preparationLevel: 'Beginner',
      targetCompanies: ['Amazon'],
      preparationGoals: ['Master Aptitude'],
    });
    student2Token = generateToken(student2);

    // 2. Setup Questions and Mock Test
    testQuestion = await AptitudeQuestion.create({
      question: `What is the output of run_${runId}?`,
      options: [
        { key: 'A', text: 'Option A' },
        { key: 'B', text: 'Option B' },
        { key: 'C', text: 'Option C' },
        { key: 'D', text: 'Option D' },
      ],
      correctOption: 'B',
      explanation: 'Detailed explanation for option B',
      category: 'Quantitative Aptitude',
      topic: 'Percentages',
      difficulty: 'medium',
      isActive: true,
    });

    testMockTest = await MockTest.create({
      title: `Phase 4 Performance Benchmark Mock ${runId}`,
      description: 'Comprehensive placement test',
      durationMinutes: 60,
      totalQuestions: 1,
      categories: ['Quantitative Aptitude'],
      difficulty: 'medium',
      questions: [
        {
          questionId: testQuestion._id,
          questionType: 'aptitude',
          question: testQuestion.question,
          options: testQuestion.options,
          correctOption: testQuestion.correctOption,
          category: testQuestion.category,
          topic: testQuestion.topic,
          marks: 1,
        },
      ],
      isPublished: true,
    });

    testProblem = await CodingProblem.create({
      title: `Binary Sum ${runId}`,
      slug: `binary-sum-${runId}`,
      description: 'Calculate sum of binary strings',
      difficulty: 'medium',
      category: 'Strings',
      topics: ['Strings', 'Bit Manipulation'],
      sampleTestCases: [{ input: '1, 1', expectedOutput: '10' }],
      hiddenTestCases: [{ input: '10, 1', expectedOutput: '11' }],
      starterCode: { javascript: 'function addBinary(a, b) {}' },
    });

    // 3. Seed student 1 attempts with heavy snapshots and code
    const longCodeString = '// Heavy user code block\n'.repeat(50) + 'function solve() { return 42; }';
    const heavySnapshot = {
      questionId: testQuestion._id,
      questionType: 'aptitude',
      question: testQuestion.question,
      options: testQuestion.options,
      correctOption: 'B',
      explanation: 'Very extensive long explanation text for solution '.repeat(20),
      category: testQuestion.category,
      topic: testQuestion.topic,
      difficulty: 'medium',
      marks: 1,
    };

    // Aptitude attempt 1 (submitted)
    await AptitudeAttempt.create({
      user: student1._id,
      questionIds: [testQuestion._id],
      questionSnapshots: [heavySnapshot],
      answers: [{ questionId: testQuestion._id, selectedOption: 'B', isCorrect: true, marksObtained: 1 }],
      category: 'Quantitative Aptitude',
      topic: 'Percentages',
      difficulty: 'medium',
      totalQuestions: 1,
      correctAnswers: 1,
      wrongAnswers: 0,
      unanswered: 0,
      score: 1,
      percentage: 100,
      status: 'submitted',
      startedAt: new Date(Date.now() - 3600000),
      submittedAt: new Date(Date.now() - 3000000),
      timeLimitSeconds: 600,
    });

    // Mock test attempt (submitted)
    await MockTestAttempt.create({
      user: student1._id,
      mockTest: testMockTest._id,
      questionSnapshots: [heavySnapshot],
      answers: [{ questionId: testQuestion._id, selectedOption: 'B', isCorrect: true, marksObtained: 1 }],
      totalQuestions: 1,
      correctAnswers: 1,
      wrongAnswers: 0,
      unanswered: 0,
      score: 1,
      percentage: 100,
      status: 'submitted',
      startedAt: new Date(Date.now() - 7200000),
      submittedAt: new Date(Date.now() - 6000000),
      timeLimitSeconds: 3600,
    });

    // Coding submission (accepted)
    await CodingSubmission.create({
      user: student1._id,
      problem: testProblem._id,
      language: 'javascript',
      code: longCodeString,
      status: 'accepted',
      passedTests: 2,
      totalTests: 2,
      submittedAt: new Date(),
    });

    // Student 2 activity (so both are ranked on leaderboard)
    await AptitudeAttempt.create({
      user: student2._id,
      questionIds: [testQuestion._id],
      questionSnapshots: [heavySnapshot],
      answers: [{ questionId: testQuestion._id, selectedOption: 'B', isCorrect: true, marksObtained: 1 }],
      category: 'Quantitative Aptitude',
      topic: 'Percentages',
      difficulty: 'medium',
      totalQuestions: 1,
      correctAnswers: 1,
      wrongAnswers: 0,
      unanswered: 0,
      score: 1,
      percentage: 100,
      status: 'submitted',
      startedAt: new Date(Date.now() - 1000000),
      submittedAt: new Date(),
      timeLimitSeconds: 600,
    });

    // ==============================================================
    // SUITE 1: Dashboard Query Optimization & Projection
    // ==============================================================
    console.log('\n--- Suite 1: Dashboard Data Access & Contract ---');
    const tStartDash = Date.now();
    const dashRes = await fetch(`${BASE_URL}/api/dashboard/summary`, {
      headers: { Authorization: `Bearer ${student1Token}` },
    });
    const tDash = Date.now() - tStartDash;
    const dashBody = await dashRes.json();

    recordTest(
      'Dashboard Summary responds with HTTP 200',
      dashRes.status === 200,
      `Status: ${dashRes.status}`
    );
    recordTest(
      'Dashboard Summary execution latency under 500ms',
      tDash < 500,
      `Duration: ${tDash}ms`
    );
    recordTest(
      'Dashboard Summary contains valid placement metrics',
      dashBody.success === true &&
        dashBody.data.preparation?.aptitude?.completed >= 1 &&
        dashBody.data.preparation?.coding?.solved >= 1 &&
        dashBody.data.preparation?.mockTests?.completed >= 1,
      `Apt: ${dashBody.data?.preparation?.aptitude?.completed}, Code: ${dashBody.data?.preparation?.coding?.solved}, Mock: ${dashBody.data?.preparation?.mockTests?.completed}`
    );
    recordTest(
      'Dashboard response excludes questionSnapshots array from summary payload',
      !JSON.stringify(dashBody).includes('Very extensive long explanation text'),
      'Verified zero heavy snapshot leakage in dashboard response'
    );

    // ==============================================================
    // SUITE 2: Progress Analytics Consolidation & Strict Projections
    // ==============================================================
    console.log('\n--- Suite 2: Progress Analytics Engine Optimization ---');
    const tStartProg = Date.now();
    const progRes = await fetch(`${BASE_URL}/api/progress/summary`, {
      headers: { Authorization: `Bearer ${student1Token}` },
    });
    const tProg = Date.now() - tStartProg;
    const progBody = await progRes.json();

    recordTest(
      'Progress Summary responds with HTTP 200',
      progRes.status === 200,
      `Status: ${progRes.status}`
    );
    recordTest(
      'Progress Summary latency under 500ms',
      tProg < 500,
      `Duration: ${tProg}ms`
    );
    recordTest(
      'Progress overview contains authentic aggregated counts',
      progBody.success === true &&
        progBody.data.overview.completedAptitudeAttempts >= 1 &&
        progBody.data.overview.uniqueCodingSolved >= 1 &&
        progBody.data.overview.completedMockTests >= 1,
      `Overview: ${JSON.stringify(progBody.data?.overview?.totalActivities)} activities`
    );
    recordTest(
      'Progress analytics excludes heavy question snapshots and submission code',
      !JSON.stringify(progBody).includes('Heavy user code block') &&
        !JSON.stringify(progBody).includes('Very extensive long explanation text'),
      'Strict projection verified: neither snapshots nor source code leaked'
    );
    recordTest(
      'Placement readiness is calculated accurately',
      progBody.data.readiness &&
        progBody.data.readiness.isEligible === true &&
        typeof progBody.data.readiness.score === 'number',
      `Score: ${progBody.data?.readiness?.score}, Level: ${progBody.data?.readiness?.level}`
    );

    // ==============================================================
    // SUITE 3: Leaderboard Bounded Limit & Overall Rank Integrity
    // ==============================================================
    console.log('\n--- Suite 3: Leaderboard Response Bounds & Contract ---');
    const lbResAll = await fetch(`${BASE_URL}/api/leaderboard`, {
      headers: { Authorization: `Bearer ${student1Token}` },
    });
    const lbBodyAll = await lbResAll.json();

    recordTest(
      'Leaderboard default query responds with HTTP 200',
      lbResAll.status === 200,
      `Status: ${lbResAll.status}`
    );
    recordTest(
      'Leaderboard computes active participants with verified scores',
      lbBodyAll.data.leaderboard.length >= 2 && lbBodyAll.data.totalRankedStudents >= 2,
      `Ranked: ${lbBodyAll.data.totalRankedStudents}`
    );
    recordTest(
      'CurrentUser context returns accurate rank and scores',
      lbBodyAll.data.currentUser.isRanked === true &&
        typeof lbBodyAll.data.currentUser.rank === 'number' &&
        lbBodyAll.data.currentUser.rank >= 1 &&
        lbBodyAll.data.currentUser.score === 65,
      `Rank: ${lbBodyAll.data.currentUser.rank}, Score: ${lbBodyAll.data.currentUser.score}`
    );

    // Test clamped limit query
    const lbResLimit = await fetch(`${BASE_URL}/api/leaderboard?limit=1`, {
      headers: { Authorization: `Bearer ${student2Token}` },
    });
    const lbBodyLimit = await lbResLimit.json();

    recordTest(
      'Leaderboard query respects bounded limit parameter',
      lbBodyLimit.data.leaderboard.length === 1,
      `Requested limit=1, returned ${lbBodyLimit.data.leaderboard.length} entries`
    );
    recordTest(
      'totalRankedStudents remains accurate when limit is bounded',
      lbBodyLimit.data.totalRankedStudents >= 2,
      `Total ranked: ${lbBodyLimit.data.totalRankedStudents}`
    );
    recordTest(
      'CurrentUser rank remains accurate even if user is sliced out of limited array',
      lbBodyLimit.data.currentUser.isRanked === true &&
        lbBodyLimit.data.currentUser.rank >= 2,
      `Student 2 Rank: ${lbBodyLimit.data.currentUser.rank}`
    );

    // ==============================================================
    // SUITE 4: Assessment History Optimization & Snapshot Stripping
    // ==============================================================
    console.log('\n--- Suite 4: History Endpoints Projection Hardening ---');

    // Aptitude History
    const aptHistRes = await fetch(`${BASE_URL}/api/aptitude/history?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${student1Token}` },
    });
    const aptHistBody = await aptHistRes.json();
    const aptAttempt = aptHistBody.data?.attempts?.[0];

    recordTest(
      'Aptitude history returns HTTP 200 and pagination envelope',
      aptHistRes.status === 200 && aptHistBody.data?.pagination?.total >= 1,
      `Attempts: ${aptHistBody.data?.pagination?.total}`
    );
    recordTest(
      'Aptitude history excludes questionSnapshots from response items',
      aptAttempt && !aptAttempt.questionSnapshots && !aptAttempt.answers,
      'Verified questionSnapshots and answers projected out'
    );

    // Mock Test History
    const mockHistRes = await fetch(`${BASE_URL}/api/mock-tests/history?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${student1Token}` },
    });
    const mockHistBody = await mockHistRes.json();
    const mockAttempt = mockHistBody.data?.attempts?.[0];

    recordTest(
      'Mock test history returns HTTP 200 and pagination envelope',
      mockHistRes.status === 200 && mockHistBody.data?.pagination?.total >= 1,
      `Attempts: ${mockHistBody.data?.pagination?.total}`
    );
    recordTest(
      'Mock test history excludes questionSnapshots and answers from response items',
      mockAttempt && !mockAttempt.questionSnapshots && !mockAttempt.answers,
      'Verified questionSnapshots and answers projected out'
    );

    // Coding Submissions List
    const codeHistRes = await fetch(`${BASE_URL}/api/coding/submissions?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${student1Token}` },
    });
    const codeHistBody = await codeHistRes.json();
    const codeSubmission = codeHistBody.data?.submissions?.[0];

    recordTest(
      'Coding submissions returns HTTP 200 and pagination envelope',
      codeHistRes.status === 200 && codeHistBody.data?.pagination?.total >= 1,
      `Submissions: ${codeHistBody.data?.pagination?.total}`
    );
    recordTest(
      'Coding submissions list excludes heavy code field',
      codeSubmission && !codeSubmission.code,
      'Verified code projected out in submission list'
    );

    // Single Submission Retrieval Retains Code
    if (codeSubmission?._id) {
      const singleSubRes = await fetch(`${BASE_URL}/api/coding/submissions/${codeSubmission._id}`, {
        headers: { Authorization: `Bearer ${student1Token}` },
      });
      const singleSubBody = await singleSubRes.json();
      recordTest(
        'Single submission detail retains code for inspection',
        singleSubRes.status === 200 && Boolean(singleSubBody.data?.submission?.code),
        'Verified code retained on single-submission endpoint'
      );
    }

    // ==============================================================
    // SUITE 5: Index Verification
    // ==============================================================
    console.log('\n--- Suite 5: Database Index Verification ---');
    const aptIndexes = await AptitudeAttempt.collection.getIndexes();
    const mockIndexes = await MockTestAttempt.collection.getIndexes();
    const codeIndexes = await CodingSubmission.collection.getIndexes();
    const userIndexes = await User.collection.getIndexes();

    const hasAptUserStatus = Object.values(aptIndexes).some(
      (idx) => idx[0] && idx[0][0] === 'user' && idx[0][1] === 1 && idx[1] && idx[1][0] === 'status'
    ) || Object.keys(aptIndexes).some((k) => k.includes('user_1_status_1'));

    const hasMockUserStatus = Object.values(mockIndexes).some(
      (idx) => idx[0] && idx[0][0] === 'user' && idx[0][1] === 1 && idx[1] && idx[1][0] === 'status'
    ) || Object.keys(mockIndexes).some((k) => k.includes('user_1_status_1'));

    const hasCodeUserStatus = Object.values(codeIndexes).some(
      (idx) => idx[0] && idx[0][0] === 'user' && idx[0][1] === 1 && idx[1] && idx[1][0] === 'status'
    ) || Object.keys(codeIndexes).some((k) => k.includes('user_1_status_1'));

    const hasUserRoleActive = Object.values(userIndexes).some(
      (idx) => idx[0] && idx[0][0] === 'role' && idx[0][1] === 1 && idx[1] && idx[1][0] === 'isActive'
    ) || Object.keys(userIndexes).some((k) => k.includes('role_1_isActive_1'));

    recordTest(
      'AptitudeAttempt has index covering { user: 1, status: 1 }',
      hasAptUserStatus,
      `Keys found: ${Object.keys(aptIndexes).join(', ')}`
    );
    recordTest(
      'MockTestAttempt has index covering { user: 1, status: 1 }',
      hasMockUserStatus,
      `Keys found: ${Object.keys(mockIndexes).join(', ')}`
    );
    recordTest(
      'CodingSubmission has index covering { user: 1, status: 1 }',
      hasCodeUserStatus,
      `Keys found: ${Object.keys(codeIndexes).join(', ')}`
    );
    recordTest(
      'User has index covering { role: 1, isActive: 1 }',
      hasUserRoleActive,
      `Keys found: ${Object.keys(userIndexes).join(', ')}`
    );

  } catch (err) {
    console.error('Test execution encountered unexpected error:', err);
    recordTest('Phase 4 suite completion without unhandled exception', false, err.message);
  } finally {
    // Teardown test artifacts
    try {
      if (student1?._id) await User.deleteOne({ _id: student1._id });
      if (student2?._id) await User.deleteOne({ _id: student2._id });
      if (testMockTest?._id) await MockTest.deleteOne({ _id: testMockTest._id });
      if (testQuestion?._id) await AptitudeQuestion.deleteOne({ _id: testQuestion._id });
      if (testProblem?._id) await CodingProblem.deleteOne({ _id: testProblem._id });
      if (student1?._id) {
        await AptitudeAttempt.deleteMany({ user: student1._id });
        await MockTestAttempt.deleteMany({ user: student1._id });
        await CodingSubmission.deleteMany({ user: student1._id });
      }
      if (student2?._id) {
        await AptitudeAttempt.deleteMany({ user: student2._id });
      }
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();

    console.log('\n===============================================================');
    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;
    console.log(` SUMMARY: ${passedCount}/${totalCount} assertions passed.`);
    console.log('===============================================================');
    if (passedCount < totalCount) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

run();
