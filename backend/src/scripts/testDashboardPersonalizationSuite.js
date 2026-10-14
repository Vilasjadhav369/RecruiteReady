/**
 * Comprehensive Automated Verification Suite for
 * Phase P1.3-1: Adaptive Dashboard Personalization & Preparation Goals
 */

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import User from '../models/User.js';
import Session from '../models/Session.js';
import MockTest from '../models/MockTest.js';
import MockTestAttempt from '../models/MockTestAttempt.js';
import AptitudeAttempt from '../models/AptitudeAttempt.js';
import CodingSubmission from '../models/CodingSubmission.js';
import CodingProblem from '../models/CodingProblem.js';
import Company from '../models/Company.js';
import dashboardRoutes from '../routes/dashboard.js';
import errorHandler from '../middleware/errorHandler.js';
import { generateToken } from '../utils/jwt.js';

const TEST_PORT = 5012;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use('/api/dashboard', dashboardRoutes);
app.use(errorHandler);

let server;
let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passed++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  ✗ [FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
  }
}

async function request(endpoint, token) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function run() {
  console.log('\n=== Starting Phase P1.3-1 Adaptive Dashboard Suite ===\n');

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI not found');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`Test server running on port ${TEST_PORT}`);
      resolve();
    });
  });

  const createdUserIds = [];

  try {
    // -------------------------------------------------------------------------
    // Test 1: In-Progress Assessment ALWAYS retains Priority 1 (Unfinished Assessment)
    // -------------------------------------------------------------------------
    console.log('\n--- Section 1: In-Progress Assessment Invariant (Priority 1) ---');
    const userP1 = await User.create({
      firstName: 'Priority1',
      lastName: 'Tester',
      email: `test_p1_${Date.now()}@example.com`,
      password: 'DummyPassword123!',
      college: 'National Institute of Tech',
      branch: 'Computer Science',
      graduationYear: 2026,
      preparationLevel: 'Placement Ready',
      targetCompanies: ['Google', 'Amazon'],
      preparationGoals: ['Master DP and Graphs'],
    });
    createdUserIds.push(userP1._id);

    const qId1 = new mongoose.Types.ObjectId();
    const activeAptAttempt = await AptitudeAttempt.create({
      user: userP1._id,
      category: 'Quantitative',
      topic: 'Probability',
      totalQuestions: 10,
      timeLimitSeconds: 600,
      status: 'in_progress',
      answers: [{ questionId: qId1, selectedOption: 'A' }],
    });

    const tokenP1 = generateToken(userP1);
    const resP1 = await request('/api/dashboard/summary', tokenP1);
    if (resP1.status !== 200) console.log('Test 1 error response:', resP1);

    assert(resP1.status === 200, 'Test 1.1: Dashboard responds with 200 for user with in-progress attempt');
    assert(resP1.data?.data?.recommendation?.priority === 1, 'Test 1.2: Recommendation priority is 1');
    assert(resP1.data?.data?.recommendation?.reason === 'unfinished_assessment', 'Test 1.3: Recommendation reason is unfinished_assessment');
    assert(resP1.data?.data?.continueActivity?.type === 'aptitude', 'Test 1.4: continueActivity contains aptitude');

    await AptitudeAttempt.deleteMany({ user: userP1._id });

    // -------------------------------------------------------------------------
    // Test 2: Just Starting / Level 1 Recommendation (Priority 5)
    // -------------------------------------------------------------------------
    console.log('\n--- Section 2: "Just Starting" Foundations Adaptive Recommendation ---');
    const userJustStarting = await User.create({
      firstName: 'Novice',
      lastName: 'Student',
      email: `test_novice_${Date.now()}@example.com`,
      password: 'DummyPassword123!',
      college: 'State Engineering College',
      branch: 'Information Technology',
      graduationYear: 2027,
      preparationLevel: 'Just Starting',
      targetCompanies: [],
      preparationGoals: ['Solve 50 basic problems', 'Quantitative Foundations'],
    });
    createdUserIds.push(userJustStarting._id);

    // Give user 1 completed aptitude test with solid score (>60%) so Priority 2a does not trigger
    await AptitudeAttempt.create({
      user: userJustStarting._id,
      category: 'Quantitative',
      topic: 'Percentages',
      totalQuestions: 10,
      timeLimitSeconds: 600,
      correctAnswers: 8,
      percentage: 80,
      status: 'submitted',
    });

    // Give user 1 solved coding problem so Priority 2b does not trigger
    const dummyProblem = await CodingProblem.findOne() || await CodingProblem.create({
      title: 'Two Sum Basics',
      slug: `two-sum-basics-${Date.now()}`,
      difficulty: 'Easy',
      description: 'Find two indices',
    });
    await CodingSubmission.create({
      user: userJustStarting._id,
      problem: dummyProblem._id,
      status: 'accepted',
      code: 'function solution() { return true; }',
      language: 'javascript',
    });

    // Ensure a published mock test exists for mock attempts
    let pubMock = await MockTest.findOne({ isPublished: true });
    let createdPubMock = null;
    if (!pubMock) {
      createdPubMock = await MockTest.create({
        title: 'Campus Grand Mock Exam 2026',
        description: 'Comprehensive campus placement test',
        durationMinutes: 60,
        totalQuestions: 40,
        isPublished: true,
      });
      pubMock = createdPubMock;
    }

    // Give user 1 completed mock test so Priority 2c does not trigger
    await MockTestAttempt.create({
      user: userJustStarting._id,
      mockTest: pubMock._id,
      totalQuestions: 20,
      timeLimitSeconds: 1200,
      correctAnswers: 16,
      percentage: 80,
      status: 'submitted',
    });

    const tokenJS = generateToken(userJustStarting);
    const resJS = await request('/api/dashboard/summary', tokenJS);

    assert(resJS.status === 200, 'Test 2.1: Dashboard responds with 200 for Just Starting student');
    assert(resJS.data?.data?.recommendation?.reason === 'level_foundation', 'Test 2.2: Reason is level_foundation');
    assert(resJS.data?.data?.recommendation?.actionLink === '/aptitude', 'Test 2.3: Action link directs to foundational /aptitude');
    assert(resJS.data?.data?.recommendation?.priority === 5, 'Test 2.4: Priority is 5');
    assert(Array.isArray(resJS.data?.data?.preparationGoals) && resJS.data?.data?.preparationGoals.length === 2, 'Test 2.5: preparationGoals returned in summary payload');

    // -------------------------------------------------------------------------
    // Test 3: "Placement Ready" Adaptive Recommendation
    // -------------------------------------------------------------------------
    console.log('\n--- Section 3: "Placement Ready" Simulation Adaptive Recommendation ---');
    const userPlacementReady = await User.create({
      firstName: 'Apex',
      lastName: 'Senior',
      email: `test_apex_${Date.now()}@example.com`,
      password: 'DummyPassword123!',
      college: 'Indian Institute of Technology',
      branch: 'Computer Science',
      graduationYear: 2026,
      preparationLevel: 'Placement Ready',
      targetCompanies: [],
      preparationGoals: ['Benchmark mock percentiles'],
    });
    createdUserIds.push(userPlacementReady._id);

    // Provide baseline completions so Priority 2a/2b/2c do not trigger
    await AptitudeAttempt.create({
      user: userPlacementReady._id,
      category: 'Logical',
      topic: 'Syllogisms',
      totalQuestions: 10,
      timeLimitSeconds: 600,
      correctAnswers: 9,
      percentage: 90,
      status: 'submitted',
    });
    await CodingSubmission.create({
      user: userPlacementReady._id,
      problem: dummyProblem._id,
      status: 'accepted',
      code: 'function solution() { return true; }',
      language: 'javascript',
    });
    await MockTestAttempt.create({
      user: userPlacementReady._id,
      mockTest: pubMock._id,
      totalQuestions: 30,
      timeLimitSeconds: 1800,
      correctAnswers: 26,
      percentage: 86,
      status: 'submitted',
    });

    const tokenPR = generateToken(userPlacementReady);
    const resPR = await request('/api/dashboard/summary', tokenPR);

    assert(resPR.status === 200, 'Test 3.1: Dashboard responds with 200 for Placement Ready student');
    assert(resPR.data?.data?.recommendation?.reason === 'placement_ready_mock', 'Test 3.2: Reason is placement_ready_mock');
    assert(resPR.data?.data?.recommendation?.actionLink === '/mock-tests', 'Test 3.3: Directs to /mock-tests');
    assert(resPR.data?.data?.recommendation?.priority === 5, 'Test 3.4: Priority is 5');

    // -------------------------------------------------------------------------
    // Test 4: Intermediate / Beginner with Weak Areas
    // -------------------------------------------------------------------------
    console.log('\n--- Section 4: Intermediate with Weak Performance Targeting ---');
    const userIntermediate = await User.create({
      firstName: 'Steady',
      lastName: 'Learner',
      email: `test_steady_${Date.now()}@example.com`,
      password: 'DummyPassword123!',
      college: 'BITS Pilani',
      branch: 'Electrical Engineering',
      graduationYear: 2026,
      preparationLevel: 'Intermediate',
      targetCompanies: [],
      preparationGoals: ['Master Speed Math', 'Solve 100 LeetCode Mediums'],
    });
    createdUserIds.push(userIntermediate._id);

    // 1 completed aptitude test with low score (40%) but high enough overall avg to not trigger 2a (or let's add one 90% and one 50% => avg 70%)
    await AptitudeAttempt.create({
      user: userIntermediate._id,
      category: 'Quantitative',
      topic: 'Permutations & Combinations',
      totalQuestions: 10,
      timeLimitSeconds: 600,
      correctAnswers: 4,
      percentage: 40,
      status: 'submitted',
    });
    await AptitudeAttempt.create({
      user: userIntermediate._id,
      category: 'Quantitative',
      topic: 'Percentages',
      totalQuestions: 10,
      timeLimitSeconds: 600,
      correctAnswers: 10,
      percentage: 100,
      status: 'submitted',
    });
    // avg = 70%, so Priority 2a (avg < 60%) does not trigger, but lowAptitude has 1 item!

    await CodingSubmission.create({
      user: userIntermediate._id,
      problem: dummyProblem._id,
      status: 'accepted',
      code: 'function solution() { return true; }',
      language: 'python',
    });
    await MockTestAttempt.create({
      user: userIntermediate._id,
      mockTest: pubMock._id,
      totalQuestions: 20,
      timeLimitSeconds: 1200,
      correctAnswers: 15,
      percentage: 75,
      status: 'submitted',
    });

    const tokenInt = generateToken(userIntermediate);
    const resInt = await request('/api/dashboard/summary', tokenInt);

    assert(resInt.status === 200, 'Test 4.1: Dashboard responds with 200 for Intermediate student');
    assert(resInt.data?.data?.recommendation?.reason === 'weak_topic_targeted', 'Test 4.2: Recommendation targets weak area (weak_topic_targeted)');
    assert(resInt.data?.data?.recommendation?.title.includes('Permutations & Combinations'), 'Test 4.3: Title mentions the specific weak topic');
    assert(resInt.data?.data?.weakAreas?.items?.length > 0, 'Test 4.4: weakAreas contains the identified gap');

    // -------------------------------------------------------------------------
    // Test 5: Fallback for Unknown / Missing Preparation Level
    // -------------------------------------------------------------------------
    console.log('\n--- Section 5: Deterministic Fallback for Missing / Unknown Level ---');
    const userLegacy = await User.create({
      firstName: 'Legacy',
      lastName: 'User',
      email: `test_legacy_${Date.now()}@example.com`,
      password: 'DummyPassword123!',
      college: 'Delhi Technological University',
      branch: 'Mechanical',
      graduationYear: 2025,
      preparationLevel: '', // Empty string level
      targetCompanies: [], // Empty so Priority 3 does not trigger
      preparationGoals: [], // Empty goals tested in 5.4
    });
    // Fields filled without prepLevel & prepGoals: firstName(10), lastName(10), college(15), branch(15), gradYear(10) = 60%.
    // To bypass Priority 4 (profileCompletion < 70) WITHOUT setting targetCompanies or preparationLevel/goals,
    // we can test that when preparationLevel is empty/unknown, Priority 4 recommends completing profile if < 70%,
    // OR if user has a complete profile (e.g. 70% reached with targetCompanies or goals), it falls back to daily_consistency.
    // Let's test a complete profile with targetCompanies where company has empty array OR let's add another test user for empty goals:
    createdUserIds.push(userLegacy._id);

    // Let's create userLegacyComplete with 75% profile (has preparationGoals: ['Generic Goal'] or targetCompanies)
    // Actually, if user has targetCompanies, Priority 3 triggers!
    // So to bypass Priority 3, targetCompanies MUST be empty.
    // Total weights: firstName(10) + lastName(10) + college(15) + branch(15) + gradYear(10) + prepGoals(10) = 70%!
    // With 70%, profileCompletion.percentage < 70 is FALSE (70 is NOT < 70).
    // So userLegacyWithGoals has 70%, targetCompanies: [], prepLevel: ''.
    const userLegacyNoLevel = await User.create({
      firstName: 'LegacyNoLevel',
      lastName: 'Student',
      email: `test_nolevel_${Date.now()}@example.com`,
      password: 'DummyPassword123!',
      college: 'Delhi Technological University',
      branch: 'Mechanical',
      graduationYear: 2025,
      preparationLevel: '', // Empty string level
      targetCompanies: [], // Empty so Priority 3 does not trigger
      preparationGoals: ['Master Tech Round'], // 10% => exactly 70% total completion!
    });
    createdUserIds.push(userLegacyNoLevel._id);

    await AptitudeAttempt.create({
      user: userLegacyNoLevel._id,
      category: 'Logical',
      topic: 'Blood Relations',
      totalQuestions: 10,
      timeLimitSeconds: 600,
      correctAnswers: 8,
      percentage: 80,
      status: 'submitted',
    });
    await CodingSubmission.create({
      user: userLegacyNoLevel._id,
      problem: dummyProblem._id,
      status: 'accepted',
      code: 'function solution() { return true; }',
      language: 'cpp',
    });
    await MockTestAttempt.create({
      user: userLegacyNoLevel._id,
      mockTest: pubMock._id,
      totalQuestions: 20,
      timeLimitSeconds: 1200,
      correctAnswers: 16,
      percentage: 80,
      status: 'submitted',
    });

    const tokenLegNoLevel = generateToken(userLegacyNoLevel);
    const resLegNoLevel = await request('/api/dashboard/summary', tokenLegNoLevel);

    assert(resLegNoLevel.status === 200, 'Test 5.1: Dashboard responds with 200 for student without prep level');
    assert(resLegNoLevel.data?.data?.recommendation?.reason === 'daily_consistency', 'Test 5.2: Recommendation falls back gracefully to daily_consistency');
    assert(resLegNoLevel.data?.data?.recommendation?.priority === 5, 'Test 5.3: Priority is 5');

    // Also verify empty preparationGoals array for userLegacy:
    const tokenLegEmpty = generateToken(userLegacy);
    const resLegEmpty = await request('/api/dashboard/summary', tokenLegEmpty);
    assert(Array.isArray(resLegEmpty.data?.data?.preparationGoals) && resLegEmpty.data?.data?.preparationGoals.length === 0, 'Test 5.4: Empty preparationGoals handled gracefully');

    // -------------------------------------------------------------------------
    // Test 6: Profile Completion Payload Contract & Missing-Field Checklist (P1.3-2)
    // -------------------------------------------------------------------------
    console.log('\n--- Section 6: Missing-Field Dashboard Contract (P1.3-2) ---');

    // Test 6A: User with multiple missing fields
    const userIncomplete = await User.create({
      firstName: 'Incomplete',
      lastName: 'Candidate',
      email: `test_incomplete_${Date.now()}@example.com`,
      password: 'DummyPassword123!',
      college: '  ', // Whitespace-only should fail
      branch: '', // Empty
      graduationYear: null, // Missing
      preparationLevel: 'Beginner', // 15%
      targetCompanies: [], // Empty
      preparationGoals: [], // Empty
      profilePhoto: 'https://example.com/photo.jpg', // Optional: must not grant percentage
      cgpa: 9.5, // Optional: must not grant percentage
      backlogs: 0, // Optional: must not grant percentage
    });
    createdUserIds.push(userIncomplete._id);

    const tokenIncomplete = generateToken(userIncomplete);
    const resIncomplete = await request('/api/dashboard/summary', tokenIncomplete);

    assert(resIncomplete.status === 200, 'Test 6.1: Dashboard responds with 200 for incomplete profile');
    const pcData = resIncomplete.data?.data?.profileCompletion;
    assert(Boolean(pcData), 'Test 6.2: profileCompletion exists in summary payload');
    assert(pcData.percentage < 100, 'Test 6.3: percentage is < 100 for incomplete profile');

    const missingKeys = pcData.missingFields.map((f) => f.key);
    assert(missingKeys.includes('college'), 'Test 6.4: Whitespace college is identified as missing');
    assert(missingKeys.includes('branch'), 'Test 6.5: Empty branch is identified as missing');
    assert(missingKeys.includes('graduationYear'), 'Test 6.6: Null graduationYear is identified as missing');
    assert(missingKeys.includes('targetCompanies'), 'Test 6.7: Empty targetCompanies is identified as missing');
    assert(missingKeys.includes('preparationGoals'), 'Test 6.8: Empty preparationGoals is identified as missing');
    assert(!missingKeys.includes('firstName'), 'Test 6.9: Valid firstName is not missing');
    assert(!missingKeys.includes('lastName'), 'Test 6.10: Valid lastName is not missing');
    assert(!missingKeys.includes('preparationLevel'), 'Test 6.11: Valid preparationLevel is not missing');

    // Confirm labels are human-readable (not internal keys)
    const collegeField = pcData.missingFields.find((f) => f.key === 'college');
    assert(collegeField?.label && typeof collegeField.label === 'string' && collegeField.label !== 'college', 'Test 6.12: Label is human-readable (e.g. "College")');

    // Test 6B: User with 100% complete profile (optional fields absent)
    const userComplete = await User.create({
      firstName: 'Fully',
      lastName: 'Complete',
      email: `test_complete_${Date.now()}@example.com`,
      password: 'DummyPassword123!',
      college: 'Indian Institute of Technology Bombay',
      branch: 'Computer Science',
      graduationYear: 2026,
      preparationLevel: 'Placement Ready',
      targetCompanies: ['Google', 'Microsoft'],
      preparationGoals: ['Master Advanced Algorithms'],
      // Note: profilePhoto, cgpa, and backlogs are deliberately omitted
    });
    createdUserIds.push(userComplete._id);

    const tokenComplete = generateToken(userComplete);
    const resComplete = await request('/api/dashboard/summary', tokenComplete);

    assert(resComplete.status === 200, 'Test 6.13: Dashboard responds with 200 for 100% complete user');
    const completePcData = resComplete.data?.data?.profileCompletion;
    assert(completePcData?.percentage === 100, 'Test 6.14: Complete user earns exactly 100%');
    assert(Array.isArray(completePcData?.missingFields) && completePcData.missingFields.length === 0, 'Test 6.15: missingFields is empty for 100% complete profile');
    assert(completePcData?.completedFields?.length === 8, 'Test 6.16: completedFields has all 8 contract fields');

    // Test 6C: Invariant check - P1.3-1 recommendation & preparationGoals unchanged
    assert(resComplete.data?.data?.recommendation !== null, 'Test 6.17: P1.3-1 recommendation is intact');
    assert(Array.isArray(resComplete.data?.data?.preparationGoals) && resComplete.data?.data?.preparationGoals.length === 1, 'Test 6.18: P1.3-1 preparationGoals payload is intact');

    // Clean up created mock test if any
    if (createdPubMock) {
      await MockTest.deleteOne({ _id: createdPubMock._id });
    }

    // -------------------------------------------------------------------------
    // Test 7: Target Company Deep Links (P1.4 Step 3)
    // -------------------------------------------------------------------------
    console.log('\n--- Section 7: Target Company Deep Links (P1.4 Step 3) ---');

    // Create test active company with slug
    const testActiveCompany = await Company.create({
      name: `ApexCorp_${Date.now()}`,
      slug: `apex-corp-${Date.now()}`,
      description: 'Global tech enterprise',
      industry: 'Enterprise Software',
      roles: ['Software Engineer'],
      isActive: true,
    });

    // Create test inactive company
    const testInactiveCompany = await Company.create({
      name: `InactiveCo_${Date.now()}`,
      slug: `inactive-co-${Date.now()}`,
      description: 'Legacy inactive entity',
      industry: 'Consulting',
      isActive: false,
    });

    // Test 7A: Active catalog company matching user's target produces direct link (/companies/<slug>)
    // Setup a user who has completed aptitude & coding problem, has mock tests, so Priority 2 does not trigger, and profile is >= 70%
    const userActiveTarget = await User.create({
      firstName: 'DirectLink',
      lastName: 'Candidate',
      email: `test_direct_${Date.now()}@example.com`,
      password: 'DummyPassword123!',
      college: 'Apex Engineering Institute',
      branch: 'Computer Science',
      graduationYear: 2026,
      preparationLevel: 'Intermediate',
      targetCompanies: [testActiveCompany.name, 'Fallback Tech'],
      preparationGoals: ['System Design Mastery'],
    });
    createdUserIds.push(userActiveTarget._id);

    // Give user 1 completed aptitude attempt, 1 accepted coding submission, 1 submitted mock test
    const problemForSection7 = await CodingProblem.findOne();
    if (problemForSection7) {
      await CodingSubmission.create({
        user: userActiveTarget._id,
        problem: problemForSection7._id,
        language: 'javascript',
        code: '// solved',
        status: 'accepted',
      });
    }

    await AptitudeAttempt.create({
      user: userActiveTarget._id,
      category: 'Quantitative',
      topic: 'Arithmetic',
      status: 'submitted',
      totalQuestions: 10,
      timeLimitSeconds: 600,
      correctAnswers: 9,
      percentage: 90,
    });

    await MockTestAttempt.create({
      user: userActiveTarget._id,
      mockTest: pubMock._id,
      status: 'submitted',
      totalQuestions: 20,
      timeLimitSeconds: 1200,
      correctAnswers: 18,
      percentage: 90,
      startedAt: new Date(Date.now() - 3600000),
      submittedAt: new Date(),
    });

    const tokenActive = generateToken(userActiveTarget);
    const resActive = await request('/api/dashboard/summary', tokenActive);

    assert(resActive.status === 200, 'Test 7.1: Dashboard responds with 200 for active target company');
    const recActive = resActive.data?.data?.recommendation;
    assert(recActive?.priority === 3, 'Test 7.2: Recommendation is Priority 3 (target_company)');
    assert(recActive?.reason === 'target_company', 'Test 7.3: Recommendation reason is target_company');
    assert(
      recActive?.actionLink === `/companies/${encodeURIComponent(testActiveCompany.slug)}`,
      'Test 7.4: actionLink directs to active company canonical slug (/companies/<slug>)',
      `got ${recActive?.actionLink}`
    );
    assert(
      recActive?.title === `Prepare for ${testActiveCompany.name}`,
      'Test 7.5: Title correctly preserves "Prepare for <Company>" format'
    );

    // Verify section 11 targetCompanies links
    const targetCompList = resActive.data?.data?.targetCompanies;
    assert(Array.isArray(targetCompList) && targetCompList.length === 2, 'Test 7.6: targetCompanies list returned');
    const firstMatched = targetCompList.find((c) => c.name === testActiveCompany.name);
    assert(firstMatched?.hasTrack === true, 'Test 7.7: Active catalog company hasTrack is true');
    assert(
      firstMatched?.link === `/companies/${encodeURIComponent(testActiveCompany.slug)}`,
      'Test 7.8: Active company link in targetCompanies uses canonical slug',
      `got ${firstMatched?.link}`
    );

    // Test 7B: Custom company falls back safely to /companies
    const userCustomTarget = await User.create({
      firstName: 'CustomCo',
      lastName: 'Student',
      email: `test_customco_${Date.now()}@example.com`,
      password: 'DummyPassword123!',
      college: 'Tech University',
      branch: 'IT',
      graduationYear: 2026,
      preparationLevel: 'Intermediate',
      targetCompanies: ['My Brand New Startup LLC'],
      preparationGoals: ['Master Frontend & Backend'],
    });
    createdUserIds.push(userCustomTarget._id);

    if (problemForSection7) {
      await CodingSubmission.create({
        user: userCustomTarget._id,
        problem: problemForSection7._id,
        language: 'javascript',
        code: '// solved',
        status: 'accepted',
      });
    }

    await AptitudeAttempt.create({
      user: userCustomTarget._id,
      category: 'Logical',
      topic: 'Puzzles',
      status: 'submitted',
      totalQuestions: 10,
      timeLimitSeconds: 600,
      correctAnswers: 9,
      percentage: 90,
    });

    await MockTestAttempt.create({
      user: userCustomTarget._id,
      mockTest: pubMock._id,
      status: 'submitted',
      totalQuestions: 20,
      timeLimitSeconds: 1200,
      correctAnswers: 18,
      percentage: 90,
      startedAt: new Date(Date.now() - 3600000),
      submittedAt: new Date(),
    });

    const tokenCustom = generateToken(userCustomTarget);
    const resCustom = await request('/api/dashboard/summary', tokenCustom);
    const recCustom = resCustom.data?.data?.recommendation;

    assert(recCustom?.priority === 3, 'Test 7.9: Custom target company triggers Priority 3');
    assert(
      recCustom?.actionLink === '/companies',
      'Test 7.10: Custom uncataloged company safely falls back to /companies',
      `got ${recCustom?.actionLink}`
    );

    const customTargetList = resCustom.data?.data?.targetCompanies;
    const customFirst = customTargetList?.find((c) => c.name === 'My Brand New Startup LLC');
    assert(customFirst?.hasTrack === false, 'Test 7.11: Custom company hasTrack is false');
    assert(customFirst?.link === '/companies', 'Test 7.12: Custom company link falls back to /companies');

    // Test 7C: Inactive catalog company falls back safely to /companies
    const userInactiveTarget = await User.create({
      firstName: 'InactiveCo',
      lastName: 'Student',
      email: `test_inactco_${Date.now()}@example.com`,
      password: 'DummyPassword123!',
      college: 'Tech University',
      branch: 'IT',
      graduationYear: 2026,
      preparationLevel: 'Intermediate',
      targetCompanies: [testInactiveCompany.name],
      preparationGoals: ['Pass Interviews'],
    });
    createdUserIds.push(userInactiveTarget._id);

    if (problemForSection7) {
      await CodingSubmission.create({
        user: userInactiveTarget._id,
        problem: problemForSection7._id,
        language: 'javascript',
        code: '// solved',
        status: 'accepted',
      });
    }

    await AptitudeAttempt.create({
      user: userInactiveTarget._id,
      category: 'Logical',
      topic: 'Series',
      status: 'submitted',
      totalQuestions: 10,
      timeLimitSeconds: 600,
      correctAnswers: 9,
      percentage: 90,
    });

    await MockTestAttempt.create({
      user: userInactiveTarget._id,
      mockTest: pubMock._id,
      status: 'submitted',
      totalQuestions: 20,
      timeLimitSeconds: 1200,
      correctAnswers: 18,
      percentage: 90,
      startedAt: new Date(Date.now() - 3600000),
      submittedAt: new Date(),
    });

    const tokenInactive = generateToken(userInactiveTarget);
    const resInactive = await request('/api/dashboard/summary', tokenInactive);
    const recInactive = resInactive.data?.data?.recommendation;

    assert(
      recInactive?.actionLink === '/companies',
      'Test 7.13: Inactive catalog company recommendation safely falls back to /companies',
      `got ${recInactive?.actionLink}`
    );

    // Test 7D: Priority 1 (in-progress assessment) strictly overrides target company recommendation
    await AptitudeAttempt.create({
      user: userActiveTarget._id,
      category: 'Verbal',
      topic: 'Vocabulary',
      status: 'in_progress',
      totalQuestions: 10,
      timeLimitSeconds: 600,
      startedAt: new Date(),
    });

    const resOverride = await request('/api/dashboard/summary', tokenActive);
    const recOverride = resOverride.data?.data?.recommendation;
    assert(recOverride?.priority === 1, 'Test 7.14: In-progress assessment strictly overrides target company recommendation (Priority 1)');
    assert(recOverride?.reason === 'unfinished_assessment', 'Test 7.15: Override reason is unfinished_assessment');

    // Test 7E: Invariant check - Profile completion, missing fields, and preparation goals remain intact
    assert(resActive.data?.data?.profileCompletion?.percentage === 100, 'Test 7.16: Profile completion intact for complete user');
    assert(resActive.data?.data?.preparationGoals?.length === 1, 'Test 7.17: preparationGoals payload intact');

    // Clean up created companies
    await Company.deleteMany({ _id: { $in: [testActiveCompany._id, testInactiveCompany._id] } });

  } catch (err) {
    console.error('Test suite error:', err);
    failed++;
  } finally {
    // Clean up created test data
    if (createdUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
      await AptitudeAttempt.deleteMany({ user: { $in: createdUserIds } });
      await CodingSubmission.deleteMany({ user: { $in: createdUserIds } });
      await MockTestAttempt.deleteMany({ user: { $in: createdUserIds } });
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  }

  console.log(`\n=== Suite Completed: ${passed} Passed, ${failed} Failed ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

run();
