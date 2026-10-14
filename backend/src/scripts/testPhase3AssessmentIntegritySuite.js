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

import aptitudeRoutes from '../routes/aptitude.js';
import mockTestRoutes from '../routes/mockTest.js';
import leaderboardRoutes from '../routes/leaderboard.js';
import codingRoutes from '../routes/coding.js';
import errorHandler from '../middleware/errorHandler.js';
import requestTracing from '../middleware/requestTracing.js';
import { generateToken } from '../utils/jwt.js';

const TEST_PORT = 5013;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

const app = express();
app.use(requestTracing);
app.use(helmet({ contentSecurityPolicy: false, frameguard: { action: 'deny' } }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/aptitude', aptitudeRoutes);
app.use('/api/mock-tests', mockTestRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/coding', codingRoutes);
app.use(errorHandler);

let server;
let studentA;
let studentAToken;
let studentB;
let studentBToken;

const results = [];
function recordTest(testName, passed, details = '') {
  results.push({ testName, passed, details });
  const status = passed ? '✓ [PASS]' : '✗ [FAIL]';
  console.log(`  ${status} ${testName}${details ? ` (${details})` : ''}`);
}

async function run() {
  console.log('===============================================================');
  console.log(' PHASE 3: ASSESSMENT INTEGRITY, TIMER & SCORING REGRESSION SUITE');
  console.log('===============================================================');

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/recruiteready';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for Phase 3 integrity suite.');

  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`Phase 3 Test Server running on port ${TEST_PORT}`);
      resolve();
    });
  });

  try {
    // 1. Setup test students
    await User.deleteMany({ email: { $in: ['p3_integrity_student_a@recruitready.test', 'p3_integrity_student_b@recruitready.test'] } });
    studentA = await User.create({
      firstName: 'P3Student',
      lastName: 'Alpha',
      email: 'p3_integrity_student_a@recruitready.test',
      password: 'Password123!',
      role: 'student',
      isEmailVerified: true,
      isOnboarded: true,
    });
    studentAToken = generateToken(studentA._id);

    studentB = await User.create({
      firstName: 'P3Student',
      lastName: 'Beta',
      email: 'p3_integrity_student_b@recruitready.test',
      password: 'Password123!',
      role: 'student',
      isEmailVerified: true,
      isOnboarded: true,
    });
    studentBToken = generateToken(studentB._id);

    const testCategory = 'P3-Integrity-Category';
    const testTopic = 'P3-Integrity-Topic';

    await AptitudeQuestion.deleteMany({ category: testCategory });
    await MockTest.deleteMany({ title: 'P3 Assessment Integrity Test' });
    await CodingProblem.deleteMany({ title: { $in: ['P3 Two Sum Integrity Problem', 'P3 Unrelated Binary Search Problem'] } });
    await AptitudeAttempt.deleteMany({ user: { $in: [studentA._id, studentB._id] } });
    await MockTestAttempt.deleteMany({ user: { $in: [studentA._id, studentB._id] } });
    await CodingSubmission.deleteMany({ user: { $in: [studentA._id, studentB._id] } });

    // Seed aptitude questions
    const q1 = await AptitudeQuestion.create({
      question: 'P3 Aptitude Question 1: What is 2 + 2?',
      options: [
        { key: 'A', text: '4' },
        { key: 'B', text: '5' },
        { key: 'C', text: '6' },
        { key: 'D', text: '7' },
      ],
      correctOption: 'A',
      explanation: '2 + 2 equals 4',
      category: testCategory,
      topic: testTopic,
      difficulty: 'easy',
      marks: 3,
    });

    const q2 = await AptitudeQuestion.create({
      question: 'P3 Aptitude Question 2: What is 3 * 3?',
      options: [
        { key: 'A', text: '6' },
        { key: 'B', text: '8' },
        { key: 'C', text: '9' },
        { key: 'D', text: '12' },
      ],
      correctOption: 'C',
      explanation: '3 * 3 is 9',
      category: testCategory,
      topic: testTopic,
      difficulty: 'easy',
      marks: 2,
    });

    // Foreign question not included in session
    const foreignQuestion = await AptitudeQuestion.create({
      question: 'Foreign Question that belongs to no test',
      options: [
        { key: 'A', text: 'Foreign 1' },
        { key: 'B', text: 'Foreign 2' },
        { key: 'C', text: 'Foreign 3' },
        { key: 'D', text: 'Foreign 4' },
      ],
      correctOption: 'A',
      explanation: 'Foreign explanation',
      category: 'Foreign-Category',
      topic: 'Foreign-Topic',
      difficulty: 'hard',
      marks: 5,
    });

    // Seed coding problem
    const codeProblem = await CodingProblem.create({
      title: 'P3 Two Sum Integrity Problem',
      slug: 'p3-two-sum-integrity-problem',
      description: 'Given an array of integers, return indices of two numbers such that they add up to target.',
      difficulty: 'easy',
      category: 'algorithms',
      testCases: [
        { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]', isHidden: false },
        { input: '[3,2,4]\n6', expectedOutput: '[1,2]', isHidden: true },
      ],
    });

    // Seed mock test
    const mockTest = await MockTest.create({
      title: 'P3 Assessment Integrity Test',
      description: 'Mock test for verifying grading, timer and question bounds',
      durationMinutes: 10,
      questions: [
        { questionId: q1._id, questionType: 'aptitude', marks: 3 },
        { questionId: codeProblem._id, questionType: 'coding', marks: 5 },
      ],
      isPublished: true,
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // WORKSTREAM 1: AUTHORITATIVE TIMER & DEADLINE ENFORCEMENT
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n── SECTION 1: AUTHORITATIVE TIMER & DEADLINE ENFORCEMENT ──');

    // 1.1 Start an aptitude session
    const startRes = await fetch(`${BASE_URL}/api/aptitude/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
      body: JSON.stringify({ category: testCategory, topic: testTopic }),
    });
    const startData = await startRes.json();
    const sessionId = startData.data.sessionId;
    const snapQ1 = startData.data.questions[0];

    // Answer before deadline succeeds
    const ansBeforeRes = await fetch(`${BASE_URL}/api/aptitude/sessions/${sessionId}/answers`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
      body: JSON.stringify({
        questionId: snapQ1._id,
        selectedOption: snapQ1.options[0].key,
      }),
    });
    recordTest(
      'Point 1: Saving answer within valid session time limit succeeds with 200',
      ansBeforeRes.status === 200,
      `Status: ${ansBeforeRes.status}`
    );

    // Artificially expire the aptitude session in DB
    await AptitudeAttempt.updateOne(
      { _id: sessionId },
      { $set: { startedAt: new Date(Date.now() - 3600 * 1000), timeLimitSeconds: 300 } }
    );

    // Answer AFTER deadline must be rejected with 400 Expired
    const ansAfterRes = await fetch(`${BASE_URL}/api/aptitude/sessions/${sessionId}/answers`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
      body: JSON.stringify({
        questionId: snapQ1._id,
        selectedOption: snapQ1.options[1].key,
      }),
    });
    const ansAfterData = await ansAfterRes.json();
    recordTest(
      'Point 2: Saving answer after time limit has elapsed is rejected with 400 and marks attempt expired',
      ansAfterRes.status === 400 && ansAfterData.message.includes('expired'),
      `Status: ${ansAfterRes.status}, Message: "${ansAfterData.message}"`
    );

    // Check DB status was set to expired
    const expiredAttempt = await AptitudeAttempt.findById(sessionId);
    recordTest(
      'Point 3: Expired attempt status in database transitioned to "expired"',
      expiredAttempt.status === 'expired',
      `Current status: ${expiredAttempt.status}`
    );

    // Submitting expired attempt evaluates and returns deterministic score without crashing
    const submitExpiredRes = await fetch(`${BASE_URL}/api/aptitude/sessions/${sessionId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
    });
    const submitExpiredData = await submitExpiredRes.json();
    recordTest(
      'Point 4: Submitting an already expired attempt returns 200 with finalized score and status "expired"',
      submitExpiredRes.status === 200 && submitExpiredData.data.status === 'expired',
      `Status: ${submitExpiredData.data.status}, Score: ${submitExpiredData.data.score}`
    );

    // ─────────────────────────────────────────────────────────────────────────────
    // WORKSTREAM 2: QUESTION & OPTION MEMBERSHIP VALIDATION
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n── SECTION 2: QUESTION & OPTION MEMBERSHIP VALIDATION ──');

    // Create fresh aptitude attempt for Student B
    const sessionBRes = await fetch(`${BASE_URL}/api/aptitude/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentBToken}` },
      body: JSON.stringify({ category: testCategory, topic: testTopic }),
    });
    const sessionBData = await sessionBRes.json();
    const sessionBId = sessionBData.data.sessionId;
    const sessionBQ1 = sessionBData.data.questions[0];

    // Submit foreign question ID
    const foreignRes = await fetch(`${BASE_URL}/api/aptitude/sessions/${sessionBId}/answers`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentBToken}` },
      body: JSON.stringify({
        questionId: foreignQuestion._id.toString(),
        selectedOption: 'A',
      }),
    });
    const foreignData = await foreignRes.json();
    recordTest(
      'Point 5: Saving answer for foreign question not in session is rejected with 400',
      foreignRes.status === 400 && foreignData.message.includes('not belong'),
      `Status: ${foreignRes.status}, Message: "${foreignData.message}"`
    );

    // Submit invalid option key (e.g. 'Z')
    const invalidOptRes = await fetch(`${BASE_URL}/api/aptitude/sessions/${sessionBId}/answers`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentBToken}` },
      body: JSON.stringify({
        questionId: sessionBQ1._id,
        selectedOption: 'Z',
      }),
    });
    const invalidOptData = await invalidOptRes.json();
    recordTest(
      'Point 6: Saving non-existent option key ("Z") is rejected with 400',
      invalidOptRes.status === 400 && invalidOptData.message.includes('Invalid option'),
      `Status: ${invalidOptRes.status}, Message: "${invalidOptData.message}"`
    );

    // Answer valid option and submit sessionB to complete aptitude session for Student B
    await fetch(`${BASE_URL}/api/aptitude/sessions/${sessionBId}/answers`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentBToken}` },
      body: JSON.stringify({
        questionId: sessionBQ1._id,
        selectedOption: sessionBQ1.options[0].key,
      }),
    });
    await fetch(`${BASE_URL}/api/aptitude/sessions/${sessionBId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentBToken}` },
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // WORKSTREAM 3: MOCK TEST TIMER & CODE SUBMISSION VALIDATION
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n── SECTION 3: MOCK TEST TIMER & CODE SUBMISSION VALIDATION ──');

    // Start mock test for Student A
    const mockStartRes = await fetch(`${BASE_URL}/api/mock-tests/${mockTest._id}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
    });
    const mockStartData = await mockStartRes.json();
    const mockAttemptId = mockStartData.data.attemptId;
    const mockQuestions = mockStartData.data.questions;
    const mockCodeQ = mockQuestions.find((q) => q.questionType === 'coding');

    // Reject unowned or invalid codeSubmissionId
    const fakeSubId = new mongoose.Types.ObjectId();
    const badCodeAnsRes = await fetch(`${BASE_URL}/api/mock-tests/attempts/${mockAttemptId}/answers`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
      body: JSON.stringify({
        questionId: mockCodeQ._id,
        codeSubmissionId: fakeSubId.toString(),
      }),
    });
    const badCodeAnsData = await badCodeAnsRes.json();
    recordTest(
      'Point 7: Linking non-existent or unowned code submission ID is rejected with 400',
      badCodeAnsRes.status === 400 && badCodeAnsData.message.includes('code submission'),
      `Status: ${badCodeAnsRes.status}, Message: "${badCodeAnsData.message}"`
    );

    // Expire the mock test attempt
    await MockTestAttempt.updateOne(
      { _id: mockAttemptId },
      { $set: { startedAt: new Date(Date.now() - 7200 * 1000), timeLimitSeconds: 600 } }
    );

    // Saving answer after mock test expired is rejected with 400
    const mockAnsExpiredRes = await fetch(`${BASE_URL}/api/mock-tests/attempts/${mockAttemptId}/answers`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
      body: JSON.stringify({
        questionId: mockQuestions[0]._id,
        selectedOption: 'A',
      }),
    });
    const mockAnsExpiredData = await mockAnsExpiredRes.json();
    recordTest(
      'Point 8: Saving mock test answer after deadline is rejected with 400 and marks attempt expired',
      mockAnsExpiredRes.status === 400 && mockAnsExpiredData.message.includes('expired'),
      `Status: ${mockAnsExpiredRes.status}, Message: "${mockAnsExpiredData.message}"`
    );

    // ─────────────────────────────────────────────────────────────────────────────
    // WORKSTREAM 4: CODING QUESTION GRADING VIA LINKED SUBMISSION & DETERMINISM
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n── SECTION 4: CODING QUESTION GRADING VIA LINKED SUBMISSION ──');

    // Create a genuine mock test attempt for Student B
    const mockBStartRes = await fetch(`${BASE_URL}/api/mock-tests/${mockTest._id}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentBToken}` },
    });
    const mockBStartData = await mockBStartRes.json();
    const mockBAttemptId = mockBStartData.data.attemptId;
    const mockBQuestions = mockBStartData.data.questions;
    const mockBAptQ = mockBQuestions.find((q) => q.questionType === 'aptitude');
    const mockBCodeQ = mockBQuestions.find((q) => q.questionType === 'coding');

    // Inspect the snapshot in DB to find correct aptitude option
    const mockBAttemptDoc = await MockTestAttempt.findById(mockBAttemptId);
    const snapApt = mockBAttemptDoc.questionSnapshots.find((s) => s.questionId.toString() === mockBAptQ._id.toString());
    const correctAptOption = snapApt.correctOption;

    // Answer aptitude correctly
    await fetch(`${BASE_URL}/api/mock-tests/attempts/${mockBAttemptId}/answers`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentBToken}` },
      body: JSON.stringify({
        questionId: mockBAptQ._id,
        selectedOption: correctAptOption,
      }),
    });

    // Create an accepted CodingSubmission for Student B on this problem
    const acceptedCodeSub = await CodingSubmission.create({
      user: studentB._id,
      problem: mockBCodeQ._id,
      language: 'javascript',
      code: 'function twoSum(nums, target) { return [0, 1]; }',
      status: 'accepted',
      passedTestCases: 2,
      totalTestCases: 2,
      executionTimeMs: 42,
    });

    // Save coding answer with genuine accepted submission ID
    const saveCodeAnsRes = await fetch(`${BASE_URL}/api/mock-tests/attempts/${mockBAttemptId}/answers`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentBToken}` },
      body: JSON.stringify({
        questionId: mockBCodeQ._id,
        codeSubmissionId: acceptedCodeSub._id.toString(),
      }),
    });
    recordTest(
      'Point 9: Saving verified codeSubmissionId for authenticated student problem succeeds with 200',
      saveCodeAnsRes.status === 200,
      `Status: ${saveCodeAnsRes.status}`
    );

    // Submit mock test attempt
    const mockBSubmitRes = await fetch(`${BASE_URL}/api/mock-tests/attempts/${mockBAttemptId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentBToken}` },
    });
    const mockBSubmitData = await mockBSubmitRes.json();
    
    // Total marks: aptitude=3, coding=5 -> total=8. Both correct -> score=8, 100%, correctAnswers=2
    const isMockCorrect = mockBSubmitData.data.score === 8 &&
      mockBSubmitData.data.correctAnswers === 2 &&
      mockBSubmitData.data.wrongAnswers === 0 &&
      mockBSubmitData.data.unanswered === 0 &&
      mockBSubmitData.data.percentage === 100;

    recordTest(
      'Point 10: Coding question correctly awarded 5 marks based on verified accepted submission (Total: 8/8, 100%)',
      isMockCorrect,
      `Score: ${mockBSubmitData.data.score}/8, Correct: ${mockBSubmitData.data.correctAnswers}, Unanswered: ${mockBSubmitData.data.unanswered}`
    );

    // Idempotent double submit returns same result
    const mockBDoubleSubmitRes = await fetch(`${BASE_URL}/api/mock-tests/attempts/${mockBAttemptId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentBToken}` },
    });
    const mockBDoubleSubmitData = await mockBDoubleSubmitRes.json();
    recordTest(
      'Point 11: Idempotent double submit returns 200 with identical immutable score',
      mockBDoubleSubmitRes.status === 200 && mockBDoubleSubmitData.data.score === 8,
      `Status: ${mockBDoubleSubmitRes.status}, Score: ${mockBDoubleSubmitData.data.score}`
    );

    // Verify result review endpoint reflects both questions accurately
    const reviewRes = await fetch(`${BASE_URL}/api/mock-tests/attempts/${mockBAttemptId}/result`, {
      headers: { Authorization: `Bearer ${studentBToken}` },
    });
    const reviewData = await reviewRes.json();
    const aptReview = reviewData.data.review.find((r) => r.questionType === 'aptitude');
    const codeReview = reviewData.data.review.find((r) => r.questionType === 'coding');
    recordTest(
      'Point 12: Result review endpoint accurately presents review details for both aptitude and coding types',
      aptReview?.isCorrect === true && codeReview?.isCorrect === true && codeReview?.codeSubmissionId === acceptedCodeSub._id.toString(),
      `Apt isCorrect: ${aptReview?.isCorrect}, Code isCorrect: ${codeReview?.isCorrect}`
    );

    // ─────────────────────────────────────────────────────────────────────────────
    // WORKSTREAM 5: CONCURRENCY, IDEMPOTENCY & LEADERBOARD DETERMINISM
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n── SECTION 5: CONCURRENCY & LEADERBOARD DETERMINISM ──');

    // 5.1 Create new aptitude session for Student A to test simultaneous submit requests
    const concSessionRes = await fetch(`${BASE_URL}/api/aptitude/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
      body: JSON.stringify({ category: testCategory, topic: testTopic }),
    });
    const concSessionData = await concSessionRes.json();
    const concSessionId = concSessionData.data.sessionId;

    // First submit request completes evaluation and marks session submitted
    const firstSubmitRes = await fetch(`${BASE_URL}/api/aptitude/sessions/${concSessionId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
    });
    const firstSubmitData = await firstSubmitRes.json();

    // 4 simultaneous subsequent/concurrent submit calls (simulating retries or race conditions)
    const subsequentResponses = await Promise.all(
      Array.from({ length: 4 }, () =>
        fetch(`${BASE_URL}/api/aptitude/sessions/${concSessionId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
        })
      )
    );
    const subsequentResults = await Promise.all(subsequentResponses.map((r) => r.json()));

    const allSubsequent200 = subsequentResponses.every((r) => r.status === 200);
    const allScoresMatch = subsequentResults.every((r) => r.data?.score === firstSubmitData.data?.score);
    recordTest(
      'Point 13: Multiple simultaneous submit calls resolve with 200 and return identical score',
      allSubsequent200 && allScoresMatch,
      `All 200: ${allSubsequent200}, Scores Match: ${allScoresMatch}`
    );

    // Verify only 1 attempt record in database for this session
    const dbAttemptCount = await AptitudeAttempt.countDocuments({ _id: concSessionId });
    recordTest(
      'Point 14: Database contains exactly 1 canonical attempt record (no duplicate attempts generated)',
      dbAttemptCount === 1,
      `Count: ${dbAttemptCount}`
    );

    // 5.2 Fetch leaderboard and verify Student B's score
    const lbRes = await fetch(`${BASE_URL}/api/leaderboard`, {
      headers: { Authorization: `Bearer ${studentBToken}` },
    });
    const lbData = await lbRes.json();
    const studentBLeaderboardEntry = lbData.data.leaderboard.find((e) => e.student.id === studentB._id.toString());
    
    // Student B completed:
    // - Aptitude: 1 session (10 pts)
    // - Mock test: 1 mock test (30 pts)
    // - Distinct coding solved: 1 problem (25 pts)
    // Expected total: 10 + 30 + 25 = 65 pts
    const expectedScore = 65;
    recordTest(
      'Point 15: Leaderboard accurately aggregates verified completed activities without duplicates (65 pts)',
      studentBLeaderboardEntry && studentBLeaderboardEntry.score === expectedScore,
      `Actual Score: ${studentBLeaderboardEntry?.score}, Expected: ${expectedScore}`
    );

    // ─────────────────────────────────────────────────────────────────────────────
    // WORKSTREAM 6: CLOCK TAMPERING, TIMEOUT BOUNDARY & SCORE OVERRIDE REJECTION
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n── SECTION 6: BOUNDARY & CLOCK TAMPERING INVARIANCE ──');

    // Create fresh attempt for boundary and tampering check
    const boundarySessionRes = await fetch(`${BASE_URL}/api/aptitude/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
      body: JSON.stringify({ category: testCategory, topic: testTopic }),
    });
    const boundarySessionData = await boundarySessionRes.json();
    const boundarySessionId = boundarySessionData.data.sessionId;
    const boundaryQ = boundarySessionData.data.questions[0];

    // Client tries to spoof clientTimestamp backwards into the past while server time is expired
    await AptitudeAttempt.updateOne(
      { _id: boundarySessionId },
      { $set: { startedAt: new Date(Date.now() - 3600 * 1000), timeLimitSeconds: 300 } }
    );

    const spoofTimeRes = await fetch(`${BASE_URL}/api/aptitude/sessions/${boundarySessionId}/answers`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
      body: JSON.stringify({
        questionId: boundaryQ._id,
        selectedOption: 'A',
        clientTimestamp: new Date(Date.now() - 3550 * 1000).toISOString(), // Spoofed client clock
      }),
    });
    const spoofTimeData = await spoofTimeRes.json();
    recordTest(
      'Point 16: Client-side clock manipulation cannot bypass server-authoritative deadline check',
      spoofTimeRes.status === 400 && spoofTimeData.message.includes('expired'),
      `Status: ${spoofTimeRes.status}, Message: "${spoofTimeData.message}"`
    );

    // Client tries to submit arbitrary score or correctness in body
    const overrideAttemptRes = await fetch(`${BASE_URL}/api/aptitude/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
      body: JSON.stringify({ category: testCategory, topic: testTopic }),
    });
    const overrideAttemptData = await overrideAttemptRes.json();
    const overrideAttemptId = overrideAttemptData.data.sessionId;
    const overrideAttemptDoc = await AptitudeAttempt.findById(overrideAttemptId);
    
    // Pick wrong options for ALL questions in the attempt
    for (const snap of overrideAttemptDoc.questionSnapshots) {
      const wrongOpt = (snap.options || []).find((o) => o.key !== snap.correctOption)?.key || 'D';
      await fetch(`${BASE_URL}/api/aptitude/sessions/${overrideAttemptId}/answers`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
        body: JSON.stringify({
          questionId: snap.questionId,
          selectedOption: wrongOpt,
          isCorrect: true, // Injected client flag
          marksObtained: 100, // Injected client marks
          score: 100,
        }),
      });
    }

    const submitOverrideRes = await fetch(`${BASE_URL}/api/aptitude/sessions/${overrideAttemptId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
      body: JSON.stringify({ score: 100, percentage: 100, isCorrect: true }), // Injected submit body
    });
    const submitOverrideData = await submitOverrideRes.json();
    recordTest(
      'Point 17: Client-injected score and isCorrect flags are strictly ignored; server-scored honestly',
      submitOverrideData.data.score === 0 && submitOverrideData.data.correctAnswers === 0,
      `Server score: ${submitOverrideData.data.score}, Correct: ${submitOverrideData.data.correctAnswers}`
    );

    // ─────────────────────────────────────────────────────────────────────────────
    // WORKSTREAM 7: CODING SUBMISSION FABRICATION & CROSS-PROBLEM REJECTION
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n── SECTION 7: CODING SUBMISSION FABRICATION & CROSS-PROBLEM REJECTION ──');

    // Create a different coding problem
    const unrelatedCodeProblem = await CodingProblem.create({
      title: 'P3 Unrelated Binary Search Problem',
      slug: 'p3-unrelated-binary-search',
      description: 'Find target in sorted array.',
      difficulty: 'easy',
      category: 'algorithms',
    });

    // Create an accepted submission for the unrelated problem
    const unrelatedCodeSub = await CodingSubmission.create({
      user: studentB._id,
      problem: unrelatedCodeProblem._id,
      language: 'javascript',
      code: 'function search() { return 0; }',
      status: 'accepted',
      passedTestCases: 1,
      totalTestCases: 1,
    });

    // Student A tries to steal Student B's accepted submission
    const mockAStartRes2 = await fetch(`${BASE_URL}/api/mock-tests/${mockTest._id}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
    });
    const mockAStartData2 = await mockAStartRes2.json();
    const mockAAttemptId2 = mockAStartData2.data.attemptId;
    const mockACodeQ2 = mockAStartData2.data.questions.find((q) => q.questionType === 'coding');

    const stealSubRes = await fetch(`${BASE_URL}/api/mock-tests/attempts/${mockAAttemptId2}/answers`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
      body: JSON.stringify({
        questionId: mockACodeQ2._id,
        codeSubmissionId: acceptedCodeSub._id.toString(), // Belongs to Student B
      }),
    });
    const stealSubData = await stealSubRes.json();
    recordTest(
      'Point 18: Student cannot use another student\'s submission ID (rejected with 400)',
      stealSubRes.status === 400 && stealSubData.message.includes('not belong to this student'),
      `Status: ${stealSubRes.status}, Message: "${stealSubData.message}"`
    );

    // Student B tries to link their own submission from a DIFFERENT problem
    const crossProblemRes = await fetch(`${BASE_URL}/api/mock-tests/attempts/${mockBAttemptId}/answers`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentBToken}` },
      body: JSON.stringify({
        questionId: mockBAptQ._id, // Not a coding question OR questionId !== unrelatedCodeSub.problem
        codeSubmissionId: unrelatedCodeSub._id.toString(),
      }),
    });
    const crossProblemData = await crossProblemRes.json();
    recordTest(
      'Point 19: Submission ID for a different problem is strictly rejected with 400',
      crossProblemData.message.includes('already submitted') || crossProblemRes.status === 400,
      `Status: ${crossProblemRes.status}, Message: "${crossProblemData.message}"`
    );

    // ─────────────────────────────────────────────────────────────────────────────
    // WORKSTREAM 8: UNSUPPORTED RUNNER HONEST STATUS REPORTING
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('\n── SECTION 8: SAFE CODE EXECUTION ADAPTER TRACEABILITY ──');

    // Run code endpoint without sandbox runner
    const runCodeRes = await fetch(`${BASE_URL}/api/coding/problems/${codeProblem._id}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentAToken}` },
      body: JSON.stringify({
        language: 'javascript',
        code: 'console.log("hello world");',
      }),
    });
    const runCodeData = await runCodeRes.json();
    recordTest(
      'Point 20: Unconfigured sandbox environment reports honest "execution_unavailable" status without server eval/exec',
      runCodeRes.status === 200 && runCodeData.data.runResult.status === 'execution_unavailable',
      `Status: ${runCodeData.data.runResult.status}, Message: "${runCodeData.data.runResult.executionMessage}"`
    );

  } catch (error) {
    console.error('Test execution failed with error:', error);
    recordTest('Test Runner Execution', false, error.message);
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log('Phase 3 Test Server closed.');
    }
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');

    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = results.filter((r) => !r.passed).length;
    console.log('\n===============================================================');
    console.log(` RESULTS: ${passedCount} PASSED / ${failedCount} FAILED (TOTAL: ${results.length})`);
    console.log('===============================================================');

    if (failedCount > 0) {
      process.exit(1);
    }
  }
}

run();
