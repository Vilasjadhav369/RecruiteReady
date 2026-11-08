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
dotenv.config();
assertTestDatabase();

import User from '../models/User.js';
import AptitudeQuestion from '../models/AptitudeQuestion.js';
import AptitudeAttempt from '../models/AptitudeAttempt.js';
import MockTest from '../models/MockTest.js';
import MockTestAttempt from '../models/MockTestAttempt.js';
import CodingProblem from '../models/CodingProblem.js';

import aptitudeRoutes from '../routes/aptitude.js';
import mockTestRoutes from '../routes/mockTest.js';
import errorHandler from '../middleware/errorHandler.js';
import requestTracing from '../middleware/requestTracing.js';
import { generateToken } from '../utils/jwt.js';
import { assertTestDatabase, createTestSession } from './testHelpers.js';

const TEST_PORT = 5012;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

const app = express();
app.use(requestTracing);
app.use(helmet({ contentSecurityPolicy: false, frameguard: { action: 'deny' } }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/aptitude', aptitudeRoutes);
app.use('/api/mock-tests', mockTestRoutes);
app.use(errorHandler);

let server;
let studentUser;
let studentToken;
let studentBUser;
let studentBToken;

const results = [];
function recordTest(testName, passed, details = '') {
  results.push({ testName, passed, details });
  const status = passed ? '✓ [PASS]' : '✗ [FAIL]';
  console.log(`  ${status} ${testName}${details ? ` (${details})` : ''}`);
}

async function run() {
  console.log('===============================================================');
  console.log(' PHASE P0: ASSESSMENT SECURITY, INTEGRITY & RELIABILITY SUITE');
  console.log('===============================================================');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/recruitready_test';
  assertTestDatabase();
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for Phase P0 verification suite.');
  await AptitudeAttempt.syncIndexes();
  await MockTestAttempt.syncIndexes();

  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`Phase P0 Test Server running on port ${TEST_PORT}`);
      resolve();
    });
  });

  try {
    // Setup test students
    await User.deleteMany({ email: { $in: ['p0_test_student_a@recruitready.test', 'p0_test_student_b@recruitready.test'] } });
    studentUser = await User.create({
      firstName: 'P0Student',
      lastName: 'Alpha',
      email: 'p0_test_student_a@recruitready.test',
      password: 'Password123!',
      role: 'student',
      isEmailVerified: true,
      isOnboarded: true,
    });
    studentToken = await createTestSession(studentUser);

    studentBUser = await User.create({
      firstName: 'P0Student',
      lastName: 'Beta',
      email: 'p0_test_student_b@recruitready.test',
      password: 'Password123!',
      role: 'student',
      isEmailVerified: true,
      isOnboarded: true,
    });
    studentBToken = await createTestSession(studentBUser);

    // Setup isolated test questions
    const testCategory = 'P0-Assessment-Category';
    const testTopic = 'P0-Integrity-Topic';
    await AptitudeQuestion.deleteMany({ category: testCategory });
    await AptitudeAttempt.deleteMany({ user: { $in: [studentUser._id, studentBUser._id] } });
    await MockTest.deleteMany({ title: 'P0 Mock Assessment' });
    await MockTestAttempt.deleteMany({ user: { $in: [studentUser._id, studentBUser._id] } });

    const q1 = await AptitudeQuestion.create({
      question: 'P0 Question One: What is 10 + 10?',
      options: [
        { key: 'A', text: '20' },
        { key: 'B', text: '30' },
        { key: 'C', text: '40' },
        { key: 'D', text: '50' },
      ],
      correctOption: 'A',
      explanation: '10 plus 10 equals 20.',
      category: testCategory,
      topic: testTopic,
      difficulty: 'medium',
      marks: 2,
      isActive: true,
    });

    const q2 = await AptitudeQuestion.create({
      question: 'P0 Question Two: What is 5 x 5?',
      options: [
        { key: 'A', text: '15' },
        { key: 'B', text: '25' },
        { key: 'C', text: '35' },
        { key: 'D', text: '45' },
      ],
      correctOption: 'B',
      explanation: '5 times 5 is 25.',
      category: testCategory,
      topic: testTopic,
      difficulty: 'medium',
      marks: 3,
      isActive: true,
    });

    console.log('\n── SECTION 1: SECURE OPTION SHUFFLING & ANSWER KEY PROTECTION (P0-A) ──');
    // Test 1: Start session
    const startRes = await fetch(`${BASE_URL}/api/aptitude/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ category: testCategory, topic: testTopic, numberOfQuestions: 2 }),
    });
    const startData = await startRes.json();
    const sessionId = startData?.data?.sessionId;

    recordTest(
      'Point 1: POST /api/aptitude/sessions creates attempt and returns 201',
      startRes.status === 201 && !!sessionId,
      `sessionId: ${sessionId}`
    );

    // Test 2: Verify questions do NOT leak correctOption, explanation, or originalKey
    const receivedQuestions = startData?.data?.questions || [];
    const hasLeak = receivedQuestions.some((q) => q.correctOption || q.explanation || q.options?.some((o) => o.originalKey));
    recordTest(
      'Point 2: Session response strictly strips correctOption, explanation, and originalKey',
      !hasLeak && receivedQuestions.length === 2
    );

    // Test 3: Verify all options have keys A, B, C, D
    const optionsAreNormalized = receivedQuestions.every((q) => {
      const keys = q.options.map((o) => o.key);
      return keys.join('') === 'ABCD';
    });
    recordTest(
      'Point 3: Shuffled options are mapped cleanly to standard keys A, B, C, D',
      optionsAreNormalized
    );

    // Test 4: Verify reload/GET returns identical shuffled options (idempotence)
    const getRes1 = await fetch(`${BASE_URL}/api/aptitude/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const getData1 = await getRes1.json();
    const getRes2 = await fetch(`${BASE_URL}/api/aptitude/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const getData2 = await getRes2.json();

    const q1OptionsFirst = getData1.data?.questions?.[0]?.options?.map((o) => o.text).join('|');
    const q1OptionsSecond = getData2.data?.questions?.[0]?.options?.map((o) => o.text).join('|');
    recordTest(
      'Point 4: Successive GET /sessions/:id calls maintain identical shuffled option mapping',
      q1OptionsFirst === q1OptionsSecond && !!q1OptionsFirst
    );

    console.log('\n── SECTION 2: QUESTION SNAPSHOTTING & IMMUTABILITY (P0-B) ──');
    // Test 5: Verify attempt document in DB contains questionSnapshots
    const dbAttempt = await AptitudeAttempt.findById(sessionId);
    recordTest(
      'Point 5: Database attempt document stores frozen questionSnapshots with internal correctOption',
      Array.isArray(dbAttempt.questionSnapshots) && dbAttempt.questionSnapshots.length === 2
    );

    // Test 6: Verify internal correctOption matches the shuffled option text
    const snap1 = dbAttempt.questionSnapshots.find((s) => s.questionId.toString() === q1._id.toString());
    const matchedOption = snap1.options.find((o) => o.key === snap1.correctOption);
    recordTest(
      'Point 6: Snapshot correctOption key accurately corresponds to the original correct answer text ("20")',
      matchedOption?.text === '20',
      `Assigned correctOption: ${snap1.correctOption}, text: ${matchedOption?.text}`
    );

    // Test 7: Admin edits question in DB; active attempt remains completely unaffected
    await AptitudeQuestion.findByIdAndUpdate(q1._id, {
      question: 'MODIFIED TEXT BY ADMIN: Should NOT affect student session',
      marks: 999,
      correctOption: 'D',
    });

    const getResAfterAdminEdit = await fetch(`${BASE_URL}/api/aptitude/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const getDataAfterEdit = await getResAfterAdminEdit.json();
    const studentSeenQ1 = getDataAfterEdit.data?.questions?.find((q) => q._id.toString() === q1._id.toString());
    recordTest(
      'Point 7: Admin modification to live question does not mutate question in active student attempt',
      studentSeenQ1?.question === 'P0 Question One: What is 10 + 10?' && studentSeenQ1?.marks === 2,
      `Text: "${studentSeenQ1?.question}", Marks: ${studentSeenQ1?.marks}`
    );

    console.log('\n── SECTION 3: ATTEMPT RESUMPTION & ORPHAN PREVENTION (P0-C) ──');
    // Test 8: Start session again with same category and topic
    const resumeRes = await fetch(`${BASE_URL}/api/aptitude/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ category: testCategory, topic: testTopic, numberOfQuestions: 2 }),
    });
    const resumeData = await resumeRes.json();
    recordTest(
      'Point 8: POST /api/aptitude/sessions resumes active non-expired attempt instead of duplicating',
      resumeRes.status === 200 && resumeData?.data?.sessionId?.toString() === sessionId.toString(),
      `Resumed session ID: ${resumeData?.data?.sessionId}`
    );

    const activeAttemptsCount = await AptitudeAttempt.countDocuments({
      user: studentUser._id,
      category: testCategory,
      status: 'in_progress',
    });
    recordTest(
      'Point 9: Exactly one active attempt exists in database (zero orphaned attempts created)',
      activeAttemptsCount === 1
    );

    console.log('\n── SECTION 4: ANSWER VERSIONING & AUTOSAVE RELIABILITY (P0-D) ──');
    // Test 10: Save answer with version 2
    const saveV2Res = await fetch(`${BASE_URL}/api/aptitude/sessions/${sessionId}/answers`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ questionId: q1._id, selectedOption: snap1.correctOption, version: 2 }),
    });
    const saveV2Data = await saveV2Res.json();
    recordTest(
      'Point 10: PATCH /answers saves answer with client version 2',
      saveV2Res.status === 200 && saveV2Data?.data?.version === 2
    );

    // Test 11: Attempt stale out-of-order write with version 1
    const saveV1Res = await fetch(`${BASE_URL}/api/aptitude/sessions/${sessionId}/answers`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ questionId: q1._id, selectedOption: 'D', version: 1 }),
    });
    const saveV1Data = await saveV1Res.json();
    const attemptAfterStale = await AptitudeAttempt.findById(sessionId);
    const ans1 = attemptAfterStale.answers.find((a) => a.questionId.toString() === q1._id.toString());
    recordTest(
      'Point 11: Out-of-order stale packet (version 1) is safely discarded, retaining version 2 answer',
      saveV1Res.status === 200 && ans1.selectedOption === snap1.correctOption && ans1.version === 2,
      `Current option: ${ans1.selectedOption}, version: ${ans1.version}`
    );

    // Also answer question 2 correctly
    const snap2 = dbAttempt.questionSnapshots.find((s) => s.questionId.toString() === q2._id.toString());
    await fetch(`${BASE_URL}/api/aptitude/sessions/${sessionId}/answers`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ questionId: q2._id, selectedOption: snap2.correctOption, version: 1 }),
    });

    console.log('\n── SECTION 5: FOCUS-LOSS INTEGRITY TELEMETRY (P0-E) ──');
    // Test 12: Record valid telemetry event
    const telemRes = await fetch(`${BASE_URL}/api/aptitude/sessions/${sessionId}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ eventType: 'tab_hidden', metadata: { windowWidth: 1440 } }),
    });
    const telemData = await telemRes.json();
    recordTest(
      'Point 12: POST /telemetry accepts valid tab_hidden event',
      telemRes.status === 200 && telemData?.data?.eventType === 'tab_hidden'
    );

    // Test 13: Invalid telemetry event is rejected
    const invalidTelemRes = await fetch(`${BASE_URL}/api/aptitude/sessions/${sessionId}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ eventType: 'unsupported_event_type' }),
    });
    recordTest(
      'Point 13: POST /telemetry rejects invalid event type with 400 Bad Request',
      invalidTelemRes.status === 400
    );

    // Test 14: Cross-user authorization check for telemetry
    const crossTelemRes = await fetch(`${BASE_URL}/api/aptitude/sessions/${sessionId}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentBToken}` },
      body: JSON.stringify({ eventType: 'window_blur' }),
    });
    recordTest(
      'Point 14: Telemetry endpoint rejects unauthorized student access (returns 404)',
      crossTelemRes.status === 404
    );

    console.log('\n── SECTION 6: EVALUATION AGAINST SNAPSHOT & REVIEW (P0-A, P0-B) ──');
    // Test 15: Submit session
    const submitRes = await fetch(`${BASE_URL}/api/aptitude/sessions/${sessionId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const submitData = await submitRes.json();
    recordTest(
      'Point 15: POST /submit finalizes test and returns 200 with honest evaluation',
      submitRes.status === 200 && submitData?.data?.status === 'submitted'
    );

    // Test 16: Verify score evaluated against frozen snapshots (Q1 was 2 marks, Q2 was 3 marks, total = 5 marks, 100%)
    recordTest(
      'Point 16: Evaluation accurately scored against snapshot (score: 5, percentage: 100%, 2/2 correct)',
      submitData?.data?.score === 5 && submitData?.data?.percentage === 100 && submitData?.data?.correctAnswers === 2,
      `Score: ${submitData?.data?.score}, Percentage: ${submitData?.data?.percentage}%`
    );

    // Test 17: Result review uses snapshot presentation
    const resultRes = await fetch(`${BASE_URL}/api/aptitude/results/${sessionId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const resultData = await resultRes.json();
    const reviewItems = resultData?.data?.review || [];
    const rev1 = reviewItems.find((r) => r.questionId.toString() === q1._id.toString());
    recordTest(
      'Point 17: GET /results/:id review renders options matching presentation order seen by student',
      rev1?.selectedOption === snap1.correctOption && rev1?.isCorrect === true && rev1?.explanation === '10 plus 10 equals 20.',
      `Selected: ${rev1?.selectedOption}, Correct: ${rev1?.correctOption}`
    );

    console.log('\n── SECTION 7: MOCK TEST PARITY & MULTI-TYPE SNAPSHOTTING ──');
    // Test 18: Mock Test attempt creation with snapshots
    const codingProblem = await CodingProblem.create({
      title: 'P0 Palindrome Number',
      slug: 'p0-palindrome-number',
      description: 'Check if integer is a palindrome',
      difficulty: 'easy',
      starterCode: { javascript: 'function isPalindrome(x) {}' },
      testCases: [
        { input: '121', expectedOutput: 'true', isHidden: false },
        { input: '-121', expectedOutput: 'false', isHidden: true },
      ],
      points: 10,
    });

    const mockTest = await MockTest.create({
      title: 'P0 Mock Assessment',
      durationMinutes: 20,
      questions: [
        { questionType: 'aptitude', questionId: q1._id, questionTypeRef: 'AptitudeQuestion', marks: 2 },
        { questionType: 'coding', questionId: codingProblem._id, questionTypeRef: 'CodingProblem', marks: 10 },
      ],
      isPublished: true,
    });

    const startMockRes = await fetch(`${BASE_URL}/api/mock-tests/${mockTest._id}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const startMockData = await startMockRes.json();
    const mockAttemptId = startMockData?.data?.attemptId;
    recordTest(
      'Point 18: POST /api/mock-tests/:id/start creates snapshot attempt with mixed aptitude & coding questions',
      startMockRes.status === 201 && !!mockAttemptId
    );

    // Test 19: Verify coding question snapshot hides hidden test cases
    const mockQuestions = startMockData?.data?.questions || [];
    const codingQ = mockQuestions.find((q) => q.questionType === 'coding');
    recordTest(
      'Point 19: Mock test coding question strictly excludes hidden test cases from student payload',
      codingQ && !codingQ.testCases
    );

    // Test 20: Mock test telemetry endpoint
    const mockTelemRes = await fetch(`${BASE_URL}/api/mock-tests/attempts/${mockAttemptId}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ eventType: 'window_blur' }),
    });
    const mockTelemData = await mockTelemRes.json();
    recordTest(
      'Point 20: POST /api/mock-tests/attempts/:id/telemetry records window_blur event',
      mockTelemRes.status === 200 && mockTelemData?.data?.eventType === 'window_blur'
    );

    console.log('\n── SECTION 8: REGRESSION — POST-SUBMIT MUTATIONS & IDEMPOTENT SUBMIT ──');
    // Test 21: Lost-response retry: Calling submit on already-submitted session returns 200 idempotently
    const duplicateSubmitRes = await fetch(`${BASE_URL}/api/aptitude/sessions/${sessionId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const duplicateSubmitData = await duplicateSubmitRes.json();
    recordTest(
      'Point 21: Redundant submit call (lost response recovery) returns 200 OK with stable finalized data',
      duplicateSubmitRes.status === 200 && duplicateSubmitData.data?.status === 'submitted' && duplicateSubmitData.data?.score === 5
    );

    // Test 22: Post-submission answer modification rejected
    const postSubmitSaveRes = await fetch(`${BASE_URL}/api/aptitude/sessions/${sessionId}/answers`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ questionId: q1._id, selectedOption: 'B', version: 99 }),
    });
    recordTest(
      'Point 22: Attempting to patch answer on submitted attempt is strictly rejected with 400',
      postSubmitSaveRes.status === 400
    );

    console.log('\n── SECTION 9: REGRESSION — COMPREHENSIVE CROSS-USER ISOLATION ──');
    // Test 23: Student B cannot GET Student A's aptitude session
    const xGetApt = await fetch(`${BASE_URL}/api/aptitude/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${studentBToken}` },
    });
    recordTest('Point 23: Cross-user GET /aptitude/sessions/:id returns 404', xGetApt.status === 404);

    // Test 24: Student B cannot PATCH Student A's aptitude answers
    const xPatchApt = await fetch(`${BASE_URL}/api/aptitude/sessions/${sessionId}/answers`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentBToken}` },
      body: JSON.stringify({ questionId: q1._id, selectedOption: 'A' }),
    });
    recordTest('Point 24: Cross-user PATCH /aptitude/sessions/:id/answers returns 404', xPatchApt.status === 404);

    // Test 25: Student B cannot POST Student A's aptitude submit
    const xSubmitApt = await fetch(`${BASE_URL}/api/aptitude/sessions/${sessionId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentBToken}` },
    });
    recordTest('Point 25: Cross-user POST /aptitude/sessions/:id/submit returns 404', xSubmitApt.status === 404);

    // Test 26: Student B cannot GET Student A's aptitude results
    const xResultApt = await fetch(`${BASE_URL}/api/aptitude/results/${sessionId}`, {
      headers: { Authorization: `Bearer ${studentBToken}` },
    });
    recordTest('Point 26: Cross-user GET /aptitude/results/:id returns 404', xResultApt.status === 404);

    // Test 27: Student B cannot GET Student A's mock attempt
    const xGetMock = await fetch(`${BASE_URL}/api/mock-tests/attempts/${mockAttemptId}`, {
      headers: { Authorization: `Bearer ${studentBToken}` },
    });
    recordTest('Point 27: Cross-user GET /mock-tests/attempts/:id returns 404', xGetMock.status === 404);

    // Test 28: Student B cannot PATCH Student A's mock answers
    const xPatchMock = await fetch(`${BASE_URL}/api/mock-tests/attempts/${mockAttemptId}/answers`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentBToken}` },
      body: JSON.stringify({ questionId: q1._id, selectedOption: 'A' }),
    });
    recordTest('Point 28: Cross-user PATCH /mock-tests/attempts/:id/answers returns 404', xPatchMock.status === 404);

    // Test 29: Student B cannot POST Student A's mock telemetry
    const xTelemMock = await fetch(`${BASE_URL}/api/mock-tests/attempts/${mockAttemptId}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentBToken}` },
      body: JSON.stringify({ eventType: 'window_blur' }),
    });
    recordTest('Point 29: Cross-user POST /mock-tests/attempts/:id/telemetry returns 404', xTelemMock.status === 404);

    // Test 30: Student B cannot POST Student A's mock submit
    const xSubmitMock = await fetch(`${BASE_URL}/api/mock-tests/attempts/${mockAttemptId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentBToken}` },
    });
    recordTest('Point 30: Cross-user POST /mock-tests/attempts/:id/submit returns 404', xSubmitMock.status === 404);

    console.log('\n── SECTION 10: REGRESSION — CONCURRENT ATTEMPT-START REQUESTS ──');
    // Test 31: Concurrent attempt starts for student B
    const concurrentStarts = await Promise.all([
      fetch(`${BASE_URL}/api/aptitude/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentBToken}` },
        body: JSON.stringify({ category: testCategory, topic: testTopic, numberOfQuestions: 2 }),
      }),
      fetch(`${BASE_URL}/api/aptitude/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentBToken}` },
        body: JSON.stringify({ category: testCategory, topic: testTopic, numberOfQuestions: 2 }),
      }),
    ]);
    const startDataA = await concurrentStarts[0].json();
    const startDataB = await concurrentStarts[1].json();
    const activeStudentBAttempts = await AptitudeAttempt.countDocuments({
      user: studentBUser._id,
      category: testCategory,
      status: 'in_progress',
    });
    recordTest(
      'Point 31: Rapid/concurrent attempt starts resolve without duplicate in_progress attempts (count = 1)',
      activeStudentBAttempts === 1 && (startDataA.data?.sessionId || startDataB.data?.sessionId)
    );

    console.log('\n── SECTION 11: REGRESSION — TELEMETRY INVARIANCE & NON-PUNITIVE AUDIT ──');
    // Test 32: Multiple telemetry events on student B session do not alter scores, answers, or deadlines
    const studentBSessionId = startDataA.data?.sessionId || startDataB.data?.sessionId;
    const initialBSession = await AptitudeAttempt.findById(studentBSessionId);

    await fetch(`${BASE_URL}/api/aptitude/sessions/${studentBSessionId}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentBToken}` },
      body: JSON.stringify({ eventType: 'window_blur' }),
    });
    await fetch(`${BASE_URL}/api/aptitude/sessions/${studentBSessionId}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentBToken}` },
      body: JSON.stringify({ eventType: 'tab_hidden' }),
    });

    const sessionAfterTelem = await AptitudeAttempt.findById(studentBSessionId);
    recordTest(
      'Point 32: Focus-loss telemetry events strictly do NOT alter score, answers, status, or time limits',
      sessionAfterTelem.score === initialBSession.score &&
        sessionAfterTelem.status === initialBSession.status &&
        sessionAfterTelem.timeLimitSeconds === initialBSession.timeLimitSeconds &&
        sessionAfterTelem.integrityEvents.length === 2
    );

    console.log('\n── SECTION 12: REGRESSION — LEGACY ATTEMPTS & DELETED SOURCE QUESTIONS ──');
    // Test 33: Create legacy attempt without questionSnapshots
    const legacyQ = await AptitudeQuestion.create({
      question: 'Legacy Question To Be Deleted',
      options: [
        { key: 'A', text: 'OptA' },
        { key: 'B', text: 'OptB' },
        { key: 'C', text: 'OptC' },
        { key: 'D', text: 'OptD' },
      ],
      correctOption: 'A',
      explanation: 'Legacy explanation',
      category: testCategory,
      topic: testTopic,
      difficulty: 'medium',
      isActive: true,
    });

    const legacyAttempt = await AptitudeAttempt.create({
      user: studentUser._id,
      questionIds: [legacyQ._id],
      questionSnapshots: [], // Explicitly empty legacy format
      answers: [{ questionId: legacyQ._id, selectedOption: 'A', version: 1 }],
      category: testCategory,
      topic: testTopic,
      difficulty: 'medium',
      totalQuestions: 1,
      status: 'submitted',
      startedAt: new Date(Date.now() - 3600000),
      submittedAt: new Date(),
      timeLimitSeconds: 600,
    });

    // Hard-delete the source question to simulate admin purging
    await AptitudeQuestion.findByIdAndDelete(legacyQ._id);

    const legacyResultRes = await fetch(`${BASE_URL}/api/aptitude/results/${legacyAttempt._id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const legacyResultData = await legacyResultRes.json();
    recordTest(
      'Point 33: Legacy attempt with deleted source question fetches results without 500 crash',
      legacyResultRes.status === 200 && Array.isArray(legacyResultData.data?.review)
    );

    // Clean up test data
    await AptitudeQuestion.deleteMany({ category: testCategory });
    await AptitudeAttempt.deleteMany({ user: { $in: [studentUser._id, studentBUser._id] } });
    await MockTest.deleteMany({ _id: mockTest._id });
    await MockTestAttempt.deleteMany({ user: { $in: [studentUser._id, studentBUser._id] } });
    await CodingProblem.deleteMany({ _id: codingProblem._id });
    await User.deleteMany({ email: { $in: ['p0_test_student_a@recruitready.test', 'p0_test_student_b@recruitready.test'] } });

  } catch (error) {
    console.error('Test suite uncaught error:', error);
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log('\n===============================================================');
  console.log(` RESULTS: ${passedCount} PASSED / ${failedCount} FAILED (TOTAL: ${results.length})`);
  console.log('===============================================================');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run();
