import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/db.js';
import app from '../app.js';
import User from '../models/User.js';
import Session from '../models/Session.js';
import CodingProblem from '../models/CodingProblem.js';
import CodingSubmission from '../models/CodingSubmission.js';
import AptitudeQuestion from '../models/AptitudeQuestion.js';
import AptitudeAttempt from '../models/AptitudeAttempt.js';
import MockTest from '../models/MockTest.js';
import MockTestAttempt from '../models/MockTestAttempt.js';
import PreparationGoal, {
  normalizeGoalText,
  resolveGoalTemplate,
  PREDEFINED_GOAL_CATALOG,
} from '../models/PreparationGoal.js';
import { assertTestDatabase, createTestSession } from './testHelpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();
assertTestDatabase();

const TEST_PORT = 5028;
let serverInstance = null;

const request = (path, options = {}) => {
  return new Promise((resolve, reject) => {
    const { method = 'GET', headers = {}, body = null } = options;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let data = null;
          try {
            data = JSON.parse(raw);
          } catch {
            data = raw;
          }
          resolve({ status: res.statusCode, headers: res.headers, data });
        });
      }
    );
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
};

const runGoalTrackingSuite = async () => {
  console.log('\n===============================================================');
  console.log(' P1.6 PHASE 1: PREPARATION GOAL TRACKING SUITE');
  console.log('===============================================================\n');

  await connectDB();
  console.log('Connected to MongoDB.');

  serverInstance = app.listen(TEST_PORT);
  await new Promise((r) => setTimeout(r, 600));

  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
      failed++;
    }
  };

  try {
    const timestamp = Date.now();

    // Create 2 test students
    const student1 = await User.create({
      firstName: 'Student',
      lastName: 'One',
      email: `goal_student_one_${timestamp}@test.com`,
      password: 'Password123!',
      role: 'student',
      preparationGoals: [],
    });
    const student1Token = await createTestSession(student1);
    const s1Headers = { Authorization: `Bearer ${student1Token}` };

    const student2 = await User.create({
      firstName: 'Student',
      lastName: 'Two',
      email: `goal_student_two_${timestamp}@test.com`,
      password: 'Password123!',
      role: 'student',
      preparationGoals: [],
    });
    const student2Token = await createTestSession(student2);
    const s2Headers = { Authorization: `Bearer ${student2Token}` };

    // ── SECTION 1: AUTHENTICATION & SECURITY ──
    console.log('--- SECTION 1: Authentication & Access Control ---');

    const unauthRes = await request('/api/goals');
    assert(unauthRes.status === 401, 'GET /api/goals requires authentication (401)');

    const emptyListRes = await request('/api/goals', { headers: s1Headers });
    assert(emptyListRes.status === 200, 'GET /api/goals returns 200 OK for student');
    assert(Array.isArray(emptyListRes.data?.data?.goals) && emptyListRes.data?.data?.goals.length === 0, 'New student starts with 0 goals');
    assert(emptyListRes.data?.data?.summary?.overallPercentage === 0, 'Honest 0% overall progress for empty goals');

    // ── SECTION 2: CREATE, VALIDATE & CATALOG MAPPING ──
    console.log('\n--- SECTION 2: Goal Creation & Catalog Mapping ---');

    // Blank goal validation
    const blankGoalRes = await request('/api/goals', {
      method: 'POST',
      headers: s1Headers,
      body: { text: '   ' },
    });
    assert(blankGoalRes.status === 400, 'POST /api/goals rejects blank text with 400 Bad Request');

    // Overlong text validation (> 100 chars)
    const longGoalRes = await request('/api/goals', {
      method: 'POST',
      headers: s1Headers,
      body: { text: 'A'.repeat(105) },
    });
    assert(longGoalRes.status === 400, 'POST /api/goals rejects text > 100 characters with 400 Bad Request');

    // Predefined catalog goal creation: Coding & DSA (Solve 100+ DSA and algorithmic problems)
    const dsaGoalRes = await request('/api/goals', {
      method: 'POST',
      headers: s1Headers,
      body: { text: 'Solve 100+ DSA and algorithmic problems' },
    });
    assert(dsaGoalRes.status === 201, 'POST /api/goals creates catalog coding goal (201 Created)');
    const dsaGoal = dsaGoalRes.data?.data?.goal;
    assert(dsaGoal?.templateKey === 'solve_100_dsa', 'Maps to canonical templateKey "solve_100_dsa"');
    assert(dsaGoal?.evaluationType === 'automated', 'Coding goal has evaluationType: "automated"');
    assert(dsaGoal?.calculatedProgress?.metricType === 'coding_distinct_solved', 'Metric type is coding_distinct_solved');
    assert(dsaGoal?.calculatedProgress?.target === 100, 'Target value is 100 problems');
    assert(dsaGoal?.calculatedProgress?.current === 0, 'Current solved count starts at 0');
    assert(dsaGoal?.isCompleted === false, 'Initially uncompleted');

    // Verify User.preparationGoals synchronization
    const s1UserAfterCreate = await User.findById(student1._id).lean();
    assert(s1UserAfterCreate.preparationGoals.includes('Solve 100+ DSA and algorithmic problems'), 'User.preparationGoals string array synchronized with new goal');

    // Aptitude catalog goal: Achieve 80%+ accuracy in Quantitative Aptitude
    const aptGoalRes = await request('/api/goals', {
      method: 'POST',
      headers: s1Headers,
      body: { text: 'Achieve 80%+ accuracy in Quantitative Aptitude' },
    });
    assert(aptGoalRes.status === 201, 'POST /api/goals creates catalog aptitude goal (201 Created)');
    const aptGoal = aptGoalRes.data?.data?.goal;
    assert(aptGoal?.templateKey === 'aptitude_80_accuracy', 'Maps to canonical templateKey "aptitude_80_accuracy"');
    assert(aptGoal?.calculatedProgress?.metricType === 'aptitude_aggregate_accuracy', 'Metric type is aptitude_aggregate_accuracy');
    assert(aptGoal?.calculatedProgress?.target === 80, 'Target is 80%');
    assert(aptGoal?.calculatedProgress?.minSessionsRequired === 3, 'Enforces 3-session minimum threshold');

    // Mock test catalog goal: Complete 5 full-length placement mock tests
    const mockGoalRes = await request('/api/goals', {
      method: 'POST',
      headers: s1Headers,
      body: { text: 'Complete 5 full-length placement mock tests' },
    });
    assert(mockGoalRes.status === 201, 'POST /api/goals creates catalog mock test goal (201 Created)');
    const mockGoal = mockGoalRes.data?.data?.goal;
    assert(mockGoal?.templateKey === 'complete_5_mocks', 'Maps to canonical templateKey "complete_5_mocks"');
    assert(mockGoal?.calculatedProgress?.target === 5, 'Target is 5 mock tests');

    // Custom goal: conservative fallback to self-reported manual_checkbox
    const customGoalRes = await request('/api/goals', {
      method: 'POST',
      headers: s1Headers,
      body: { text: 'Read Clean Architecture and design patterns' },
    });
    assert(customGoalRes.status === 201, 'POST /api/goals creates custom goal (201 Created)');
    const customGoal = customGoalRes.data?.data?.goal;
    assert(customGoal?.templateKey === null, 'Custom goal templateKey is null');
    assert(customGoal?.evaluationType === 'self_reported', 'Custom goal evaluationType is "self_reported"');
    assert(customGoal?.calculatedProgress === null, 'No automated metric fabricated for custom goal');
    assert(customGoal?.statusLabel === 'Not Started', 'Status label is "Not Started"');

    // ── SECTION 3: DUPLICATE PREVENTION & NORMALIZATION ──
    console.log('\n--- SECTION 3: Duplicate Prevention & Normalization ---');

    // Duplicate exact text rejected with 409
    const dupRes = await request('/api/goals', {
      method: 'POST',
      headers: s1Headers,
      body: { text: 'Solve 100+ DSA and algorithmic problems' },
    });
    assert(dupRes.status === 409, 'Duplicate exact goal rejected with 409 Conflict');

    // Duplicate with different casing and whitespace rejected with 409
    const dupCasedRes = await request('/api/goals', {
      method: 'POST',
      headers: s1Headers,
      body: { text: '   SOLVE 100+   DSA AND algorithmic   PROBLEMS  ' },
    });
    assert(dupCasedRes.status === 409, 'Duplicate normalized goal (casing/whitespace) rejected with 409 Conflict');

    // ── SECTION 4: EDIT, DELETE, RE-ADD & IDENTITY STABILITY ──
    console.log('\n--- SECTION 4: Edit, Delete, Re-Add & Identity ---');

    // PATCH /api/goals/:id updates text
    const updateRes = await request(`/api/goals/${customGoal.id}`, {
      method: 'PATCH',
      headers: s1Headers,
      body: { text: 'Read Clean Code and Design Patterns Book' },
    });
    assert(updateRes.status === 200, 'PATCH /api/goals/:id updates goal text (200 OK)');
    assert(updateRes.data?.data?.goal?.text === 'Read Clean Code and Design Patterns Book', 'Updated text reflected');
    assert(updateRes.data?.data?.goal?.id === customGoal.id, 'Stable ObjectId identity preserved after edit');

    // Verify User.preparationGoals synchronized after update
    const s1UserAfterUpdate = await User.findById(student1._id).lean();
    assert(s1UserAfterUpdate.preparationGoals.includes('Read Clean Code and Design Patterns Book'), 'User.preparationGoals synchronized with updated text');

    // DELETE /api/goals/:id soft-deletes
    const deleteRes = await request(`/api/goals/${customGoal.id}`, {
      method: 'DELETE',
      headers: s1Headers,
    });
    assert(deleteRes.status === 200, 'DELETE /api/goals/:id soft-deletes goal (200 OK)');

    const listAfterDelete = await request('/api/goals', { headers: s1Headers });
    const hasDeletedInList = listAfterDelete.data?.data?.goals?.some((g) => g.id === customGoal.id);
    assert(!hasDeletedInList, 'Soft-deleted goal excluded from active list');

    const s1UserAfterDelete = await User.findById(student1._id).lean();
    assert(!s1UserAfterDelete.preparationGoals.includes('Read Clean Code and Design Patterns Book'), 'Soft-deleted goal removed from User.preparationGoals');

    // Re-adding deleted goal reactivates existing document
    const reAddRes = await request('/api/goals', {
      method: 'POST',
      headers: s1Headers,
      body: { text: 'Read Clean Code and Design Patterns Book' },
    });
    assert(reAddRes.status === 201, 'Re-adding previously deleted goal succeeds (201 Created)');
    assert(reAddRes.data?.data?.goal?.id === customGoal.id, 'Reactivates exact original ObjectId document');
    assert(reAddRes.data?.data?.goal?.manualCompleted === false, 'Re-activated goal resets manual completion state');

    // ── SECTION 5: CROSS-USER ISOLATION & IDOR PROTECTION ──
    console.log('\n--- SECTION 5: Cross-User Isolation (IDOR) ---');

    const crossToggleRes = await request(`/api/goals/${dsaGoal.id}/toggle`, {
      method: 'PATCH',
      headers: s2Headers,
      body: { completed: true },
    });
    assert(crossToggleRes.status === 404, 'Student 2 cannot toggle Student 1 goal (404 Not Found)');

    const crossUpdateRes = await request(`/api/goals/${dsaGoal.id}`, {
      method: 'PATCH',
      headers: s2Headers,
      body: { text: 'Malicious modification' },
    });
    assert(crossUpdateRes.status === 404, 'Student 2 cannot update Student 1 goal (404 Not Found)');

    const crossDeleteRes = await request(`/api/goals/${dsaGoal.id}`, {
      method: 'DELETE',
      headers: s2Headers,
    });
    assert(crossDeleteRes.status === 404, 'Student 2 cannot delete Student 1 goal (404 Not Found)');

    // ── SECTION 6: METRIC INTEGRITY — CODING DISTINCT SOLVED ──
    console.log('\n--- SECTION 6: Metric Integrity — Coding Distinct Solved ---');

    const testProblemA = await CodingProblem.create({
      title: 'Problem Alpha',
      slug: `problem-alpha-${timestamp}`,
      description: 'Test problem description Alpha',
      difficulty: 'easy',
      topics: ['Arrays'],
      isActive: true,
      testCases: [{ input: '1', expectedOutput: '1', isHidden: false }],
    });
    const testProblemB = await CodingProblem.create({
      title: 'Problem Beta',
      slug: `problem-beta-${timestamp}`,
      description: 'Test problem description Beta',
      difficulty: 'medium',
      topics: ['Strings'],
      isActive: true,
      testCases: [{ input: 'a', expectedOutput: 'a', isHidden: false }],
    });

    // 3 submissions on Problem A: 2 accepted, 1 failed
    await CodingSubmission.create({
      user: student1._id,
      problem: testProblemA._id,
      language: 'javascript',
      code: 'return 1;',
      status: 'accepted',
    });
    await CodingSubmission.create({
      user: student1._id,
      problem: testProblemA._id,
      language: 'python',
      code: 'return 1',
      status: 'accepted', // Duplicate accepted submission on same problem!
    });
    await CodingSubmission.create({
      user: student1._id,
      problem: testProblemA._id,
      language: 'cpp',
      code: 'return 0;',
      status: 'wrong_answer', // Failed
    });

    // 1 execution_unavailable submission on Problem B
    await CodingSubmission.create({
      user: student1._id,
      problem: testProblemB._id,
      language: 'javascript',
      code: 'return 0;',
      status: 'execution_unavailable', // Must not count!
    });

    const codingCheckRes = await request('/api/goals', { headers: s1Headers });
    const enrichedDsaGoal = codingCheckRes.data?.data?.goals?.find((g) => g.id === dsaGoal.id);
    assert(enrichedDsaGoal?.calculatedProgress?.current === 1, 'Distinct problem deduplication: 2 accepted submissions on Problem A count as exactly 1 solved problem');
    assert(enrichedDsaGoal?.calculatedProgress?.percentage === 1, 'Math clamped correctly (1 / 100 = 1%)');

    // ── SECTION 7: METRIC INTEGRITY — APTITUDE AGGREGATE ACCURACY ──
    console.log('\n--- SECTION 7: Metric Integrity — Aptitude Aggregate Accuracy ---');

    // Attempt 1: 5/5 correct (100%)
    await AptitudeAttempt.create({
      user: student1._id,
      status: 'submitted',
      totalQuestions: 5,
      correctAnswers: 5,
      score: 5,
      percentage: 100,
      timeLimitSeconds: 600,
    });

    // With only 1 attempt, check sample-building rule
    const aptCheckRes1 = await request('/api/goals', { headers: s1Headers });
    const enrichedAptGoal1 = aptCheckRes1.data?.data?.goals?.find((g) => g.id === aptGoal.id);
    assert(enrichedAptGoal1?.calculatedProgress?.hasSufficientSample === false, '1 attempt is below 3-session minimum threshold (hasSufficientSample: false)');
    assert(enrichedAptGoal1?.isCompleted === false, 'Cannot auto-satisfy without minimum 3 sessions');
    assert(enrichedAptGoal1?.calculatedProgress?.statusNote?.includes('1/3 tests'), 'Status note explains sample building state');

    // Attempt 2: 5/5 correct (100%)
    await AptitudeAttempt.create({
      user: student1._id,
      status: 'submitted',
      totalQuestions: 5,
      correctAnswers: 5,
      score: 5,
      percentage: 100,
      timeLimitSeconds: 600,
    });

    // Attempt 3: In-progress attempt (must NOT be counted)
    await AptitudeAttempt.create({
      user: student1._id,
      status: 'in_progress',
      totalQuestions: 5,
      correctAnswers: 5,
      timeLimitSeconds: 600,
    });

    // Attempt 4: Expired attempt (must NOT be counted)
    await AptitudeAttempt.create({
      user: student1._id,
      status: 'expired',
      totalQuestions: 5,
      correctAnswers: 0,
      timeLimitSeconds: 600,
    });

    // Attempt 5: Third submitted attempt: 8/10 correct (80%)
    // Total: (5 + 5 + 8) / (5 + 5 + 10) = 18 / 20 = 90% aggregate accuracy
    await AptitudeAttempt.create({
      user: student1._id,
      status: 'submitted',
      totalQuestions: 10,
      correctAnswers: 8,
      score: 8,
      percentage: 80,
      timeLimitSeconds: 600,
    });

    const aptCheckRes2 = await request('/api/goals', { headers: s1Headers });
    const enrichedAptGoal2 = aptCheckRes2.data?.data?.goals?.find((g) => g.id === aptGoal.id);
    assert(enrichedAptGoal2?.calculatedProgress?.hasSufficientSample === true, '3 submitted sessions satisfy minimum sample threshold');
    assert(enrichedAptGoal2?.calculatedProgress?.current === 90, 'Aggregate accuracy accurately computed (18/20 = 90%)');
    assert(enrichedAptGoal2?.calculatedProgress?.isSatisfied === true, 'Target 80% met with 90% accuracy (isSatisfied: true)');
    assert(enrichedAptGoal2?.isCompleted === true, 'Goal automatically marked as completed by verified activity');
    assert(enrichedAptGoal2?.statusLabel === 'Completed (Verified)', 'Status label is "Completed (Verified)"');

    // ── SECTION 8: METRIC INTEGRITY — MOCK TESTS SUBMITTED ──
    console.log('\n--- SECTION 8: Metric Integrity — Mock Tests Submitted ---');

    const sampleMockTest = await MockTest.create({
      title: 'Company Assessment',
      durationMinutes: 60,
      totalQuestions: 10,
      isPublished: true,
    });

    // 1 submitted attempt
    await MockTestAttempt.create({
      user: student1._id,
      mockTest: sampleMockTest._id,
      status: 'submitted',
      totalQuestions: 10,
      score: 10,
      percentage: 100,
      timeLimitSeconds: 3600,
    });

    // 1 in_progress attempt (ignored)
    await MockTestAttempt.create({
      user: student1._id,
      mockTest: sampleMockTest._id,
      status: 'in_progress',
      totalQuestions: 10,
      timeLimitSeconds: 3600,
    });

    // 1 expired attempt (ignored)
    await MockTestAttempt.create({
      user: student1._id,
      mockTest: sampleMockTest._id,
      status: 'expired',
      totalQuestions: 10,
      timeLimitSeconds: 3600,
    });

    const mockCheckRes = await request('/api/goals', { headers: s1Headers });
    const enrichedMockGoal = mockCheckRes.data?.data?.goals?.find((g) => g.id === mockGoal.id);
    assert(enrichedMockGoal?.calculatedProgress?.current === 1, 'Only submitted mock test counts (current: 1 / 5)');
    assert(enrichedMockGoal?.isCompleted === false, 'Target 5 not yet reached (isCompleted: false)');

    // ── SECTION 9: MANUAL COMPLETION & REOPENING SEMANTICS ──
    console.log('\n--- SECTION 9: Manual Completion & Reopening Semantics ---');

    // Manually mark the custom goal as complete
    const toggleDoneRes = await request(`/api/goals/${customGoal.id}/toggle`, {
      method: 'PATCH',
      headers: s1Headers,
      body: { completed: true },
    });
    assert(toggleDoneRes.status === 200, 'PATCH /api/goals/:id/toggle completes goal (200 OK)');
    assert(toggleDoneRes.data?.data?.goal?.manualCompleted === true, 'manualCompleted is true');
    assert(toggleDoneRes.data?.data?.goal?.statusLabel === 'Completed (Self-Reported)', 'Status label is "Completed (Self-Reported)"');

    // GET request is idempotent and does not mutate manual state
    const idempotentGetRes = await request('/api/goals', { headers: s1Headers });
    const idempotentCustomGoal = idempotentGetRes.data?.data?.goals?.find((g) => g.id === customGoal.id);
    assert(idempotentCustomGoal?.manualCompleted === true, 'GET request preserved manual completion state without mutation');

    // Reopen custom goal
    const toggleReopenRes = await request(`/api/goals/${customGoal.id}/toggle`, {
      method: 'PATCH',
      headers: s1Headers,
      body: { completed: false },
    });
    assert(toggleReopenRes.status === 200, 'PATCH /api/goals/:id/toggle reopens goal (200 OK)');
    assert(toggleReopenRes.data?.data?.goal?.manualCompleted === false, 'manualCompleted reset to false');
    assert(toggleReopenRes.data?.data?.goal?.statusLabel === 'Not Started', 'Status label back to "Not Started"');

    // ── SECTION 10: LEGACY PROFILE COMPATIBILITY & RECONCILIATION ──
    console.log('\n--- SECTION 10: Legacy Profile Endpoint Synchronization ---');

    // Student 2 updates profile with 2 string goals via PUT /api/auth/profile
    const legacyUpdateRes = await request('/api/auth/profile', {
      method: 'PUT',
      headers: s2Headers,
      body: {
        preparationGoals: [
          'Solve 100+ DSA and algorithmic problems',
          'Custom Student 2 Target Goal',
        ],
      },
    });
    assert(legacyUpdateRes.status === 200, 'PUT /api/auth/profile succeeds with preparationGoals string array');

    // Query /api/goals for Student 2: confirms PreparationGoal documents were created seamlessly
    const s2GoalListRes = await request('/api/goals', { headers: s2Headers });
    assert(s2GoalListRes.status === 200, 'GET /api/goals returns goals created via legacy profile update');
    assert(s2GoalListRes.data?.data?.goals?.length === 2, 'Student 2 has exactly 2 goals');
    const s2Dsa = s2GoalListRes.data?.data?.goals?.find((g) => g.text === 'Solve 100+ DSA and algorithmic problems');
    assert(s2Dsa?.templateKey === 'solve_100_dsa', 'Legacy string mapped accurately to solve_100_dsa');

    // Student 2 removes one goal via PUT /api/auth/profile
    await request('/api/auth/profile', {
      method: 'PUT',
      headers: s2Headers,
      body: {
        preparationGoals: ['Custom Student 2 Target Goal'],
      },
    });
    const s2GoalListAfterRemoval = await request('/api/goals', { headers: s2Headers });
    assert(s2GoalListAfterRemoval.data?.data?.goals?.length === 1, 'Removed goal soft-deleted from active goal list');
    assert(s2GoalListAfterRemoval.data?.data?.goals?.[0]?.text === 'Custom Student 2 Target Goal', 'Remaining goal intact');

    // ── SECTION 11: TARGETED HARDENING — TEMPLATE-KEY VALIDATION & EDIT DRIFT ──
    console.log('\n--- SECTION 11: Template-Key Validation & Metric Downgrade on Edit ---');

    // 11.1 Mismatched templateKey: custom text with valid templateKey must NOT receive automated metric
    const spoofTemplateRes = await request('/api/goals', {
      method: 'POST',
      headers: s1Headers,
      body: {
        text: 'Drink two cups of coffee every morning',
        templateKey: 'solve_100_dsa', // Malicious attempt to spoof template
      },
    });
    assert(spoofTemplateRes.status === 201, 'POST /api/goals accepts goal (201 Created)');
    const spoofGoal = spoofTemplateRes.data?.data?.goal;
    assert(spoofGoal?.templateKey === null, 'Mismatched templateKey is strictly ignored (templateKey === null)');
    assert(spoofGoal?.category === 'custom', 'Goal assigned to category "custom"');
    assert(spoofGoal?.evaluationType === 'self_reported', 'Spoofed goal strictly defaults to "self_reported" evaluation');
    assert(spoofGoal?.calculatedProgress === null, 'No automated metric assigned for mismatched custom text');

    // 11.2 Text edit drift: Editing an automated goal to custom text must downgrade its metric
    const createDsaForEditRes = await request('/api/goals', {
      method: 'POST',
      headers: s2Headers,
      body: { text: 'Solve 100+ DSA and algorithmic problems' },
    });
    const dsaForEditId = createDsaForEditRes.data?.data?.goal?.id;

    const editDsaToCustomRes = await request(`/api/goals/${dsaForEditId}`, {
      method: 'PATCH',
      headers: s2Headers,
      body: { text: 'Read high level system design articles' },
    });
    assert(editDsaToCustomRes.status === 200, 'PATCH /api/goals/:id updates text (200 OK)');
    const editedDsaGoal = editDsaToCustomRes.data?.data?.goal;
    assert(editedDsaGoal?.id === dsaForEditId, 'Stable ObjectId preserved after editing');
    assert(editedDsaGoal?.templateKey === null, 'Template key cleared when text no longer matches catalog');
    assert(editedDsaGoal?.evaluationType === 'self_reported', 'Metric type downgraded strictly to self_reported');
    assert(editedDsaGoal?.calculatedProgress === null, 'Automated metric calculations removed after downgrade');

    // ── SECTION 12: TARGETED HARDENING — IDEMPOTENT TOGGLE & RECOVERY ──
    console.log('\n--- SECTION 12: Idempotent Toggle & Synchronization Recovery ---');

    // 12.1 Toggle without explicit boolean returns 400 Bad Request
    const invalidToggleRes1 = await request(`/api/goals/${spoofGoal.id}/toggle`, {
      method: 'PATCH',
      headers: s1Headers,
      body: {}, // Missing completed field
    });
    assert(invalidToggleRes1.status === 400, 'PATCH /api/goals/:id/toggle rejects missing completed field with 400');

    const invalidToggleRes2 = await request(`/api/goals/${spoofGoal.id}/toggle`, {
      method: 'PATCH',
      headers: s1Headers,
      body: { completed: 'yes' }, // Non-boolean
    });
    assert(invalidToggleRes2.status === 400, 'PATCH /api/goals/:id/toggle rejects non-boolean completed with 400');

    // 12.2 Retrying exact explicit toggle is idempotent
    const toggleTrue1 = await request(`/api/goals/${spoofGoal.id}/toggle`, {
      method: 'PATCH',
      headers: s1Headers,
      body: { completed: true },
    });
    assert(toggleTrue1.status === 200 && toggleTrue1.data?.data?.goal?.manualCompleted === true, 'First toggle to true succeeds');

    const toggleTrue2 = await request(`/api/goals/${spoofGoal.id}/toggle`, {
      method: 'PATCH',
      headers: s1Headers,
      body: { completed: true }, // Redundant retry
    });
    assert(toggleTrue2.status === 200 && toggleTrue2.data?.data?.goal?.manualCompleted === true, 'Retry of completed: true remains true (idempotent, no flip)');

    // 12.3 Controlled sync recovery via POST /api/goals/sync
    // Simulate discrepancy: manually inject a string into User.preparationGoals without goal document
    await User.findByIdAndUpdate(student1._id, {
      $push: { preparationGoals: 'Simulated Out-of-Sync Orphan Goal' },
    });

    const syncRes = await request('/api/goals/sync', {
      method: 'POST',
      headers: s1Headers,
    });
    assert(syncRes.status === 200, 'POST /api/goals/sync reconciles goals (200 OK)');
    const recoveredGoal = syncRes.data?.data?.goals?.find((g) => g.text === 'Simulated Out-of-Sync Orphan Goal');
    assert(recoveredGoal !== undefined, 'Out-of-sync string reconciled and created as PreparationGoal document');
    assert(recoveredGoal?.evaluationType === 'self_reported', 'Recovered goal cleanly defaults to self_reported');

    // --- SECTION 13: Profile-Save Reconciliation Signal & Repeated Sync Retries ---
    console.log('\n--- SECTION 13: Profile-Save Reconciliation Signal & Repeated Sync Retries ---');
    // 13.1 Normal profile save succeeds and signals goalSyncPending: false
    const normalProfileRes = await request('/api/auth/profile', {
      method: 'PUT',
      headers: s1Headers,
      body: {
        preparationGoals: [
          'Solve 100+ DSA and algorithmic problems',
          'Master Dynamic Programming and Graphs',
        ],
      },
    });
    assert(normalProfileRes.status === 200, 'PUT /api/auth/profile succeeds with 200 OK');
    assert(normalProfileRes.data?.data?.goalSyncPending === false, 'Successful profile save returns goalSyncPending: false');
    assert(Array.isArray(normalProfileRes.data?.data?.user?.preparationGoals), 'User model reflects updated preparationGoals');

    // 13.2 Verify goalSyncPending is NOT persisted to User model
    const dbUserAfterProfile = await User.findById(student1._id).lean();
    assert(dbUserAfterProfile.goalSyncPending === undefined, 'goalSyncPending is response metadata only and is NOT persisted to User model in MongoDB');

    // 13.3 Deterministic failure path test: Simulate reconciliation failure while profile save succeeds
    const originalFind = PreparationGoal.find;
    try {
      // Mock PreparationGoal.find to throw once during reconcileGoalsFromStringArray
      PreparationGoal.find = function () {
        throw new Error('Simulated transient DB failure during goal reconciliation');
      };

      const failProfileRes = await request('/api/auth/profile', {
        method: 'PUT',
        headers: s1Headers,
        body: {
          firstName: 'AnandUpdated',
          preparationGoals: [
            'Solve 100+ DSA and algorithmic problems',
            'Master Dynamic Programming and Graphs',
            'Temporary Transient Goal',
          ],
        },
      });

      assert(failProfileRes.status === 200, 'Profile save succeeds (200 OK) even when goal reconciliation throws');
      assert(failProfileRes.data?.data?.user?.firstName === 'AnandUpdated', 'User profile updates are safely persisted');
      assert(failProfileRes.data?.data?.goalSyncPending === true, 'Explicit goalSyncPending: true returned to signal client recovery required');
    } finally {
      // Restore real PreparationGoal.find immediately
      PreparationGoal.find = originalFind;
    }

    // 13.4 Automatic recovery succeeds via POST /api/goals/sync
    const autoRecoveryRes = await request('/api/goals/sync', {
      method: 'POST',
      headers: s1Headers,
    });
    assert(autoRecoveryRes.status === 200, 'Automatic recovery call to POST /api/goals/sync succeeds with 200 OK');
    const autoRecoveredGoal = autoRecoveryRes.data?.data?.goals?.find((g) => g.text === 'Temporary Transient Goal');
    assert(autoRecoveredGoal !== undefined, 'Pending goal document successfully created during recovery');

    // 13.5 Automatic recovery fails and manual retry succeeds
    // Simulate first recovery attempt failing, second succeeding
    let mockFailCount = 1;
    PreparationGoal.find = function (...args) {
      if (mockFailCount > 0) {
        mockFailCount--;
        throw new Error('Simulated transient network drop during recovery');
      }
      return originalFind.apply(this, args);
    };

    try {
      const failRecoveryRes = await request('/api/goals/sync', {
        method: 'POST',
        headers: s1Headers,
      });
      assert(failRecoveryRes.status === 500, 'Simulated network drop on auto-recovery returns controlled 500 failure');

      // Manual retry succeeds
      const manualRetryRes = await request('/api/goals/sync', {
        method: 'POST',
        headers: s1Headers,
      });
      assert(manualRetryRes.status === 200, 'Manual user retry succeeds with 200 OK after prior failure');
    } finally {
      PreparationGoal.find = originalFind;
    }

    // 13.6 Concurrent or repeated retries do not create duplicate active goals or trigger infinite loop
    const concurrentSyncs = await Promise.all([
      request('/api/goals/sync', { method: 'POST', headers: s1Headers }),
      request('/api/goals/sync', { method: 'POST', headers: s1Headers }),
      request('/api/goals/sync', { method: 'POST', headers: s1Headers }),
    ]);

    assert(concurrentSyncs.every((r) => r.status === 200), 'All concurrent sync calls respond with 200 OK');
    const finalActiveGoals = await PreparationGoal.find({ user: student1._id, isActive: true });
    const uniqueKeys = new Set(finalActiveGoals.map((g) => g.normalizedKey));
    assert(finalActiveGoals.length === uniqueKeys.size, 'Concurrent sync retries produce zero duplicate active goal documents');

    // 13.7 Sync requires authentication
    const unauthSync = await request('/api/goals/sync', {
      method: 'POST',
    });
    assert(unauthSync.status === 401, 'POST /api/goals/sync requires authentication (401 Unauthorized)');

    console.log('\n===============================================================');
    console.log(` RESULTS: ${passed} PASSED / ${failed} FAILED (TOTAL: ${passed + failed})`);
    console.log('===============================================================\n');
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
};

runGoalTrackingSuite();
