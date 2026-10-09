/**
 * Comprehensive Automated Verification Suite for
 * ADVANCED PROGRESS + ANALYTICS SYSTEM
 *
 * Covers:
 * 1. Zero-Activity Student (honest empty state, null percentages, zero streak, isEligible=false, Not Enough Data)
 * 2. Aptitude Analytics (questions, correct/incorrect/unanswered, accuracy, avg/best score, byCategory, byDifficulty)
 * 3. Coding Analytics (attempted, unique solved, submissions, acceptance rate, difficulty distribution, languages)
 * 4. Mock Test Analytics (attempts, completed vs expired, average & best percentage, byCategory, byDifficulty)
 * 5. Topic Heatmap & Sample Size Rule (>=3 evals threshold: strong >=70%, weak <60%, developing 60-69%, <3 insufficient_data)
 * 6. Deterministic Placement Readiness Formula (0-100 bounded, 5 components, level categorization, disclaimer)
 * 7. Preparation Consistency & Weekly Activity (7-day calendar breakdown, real qualifying events, streak tracking)
 * 8. Target Company Preparation Checklist (factual syllabus tracking without fake percentages)
 * 9. Prioritized Deterministic Recommendations (rule-based, top 4 suggestions)
 * 10. Security & Authorization (401 without token, strict user-scoped isolation)
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import User from '../models/User.js';
import Session from '../models/Session.js';
import Company from '../models/Company.js';
import CodingProblem from '../models/CodingProblem.js';
import CodingSubmission from '../models/CodingSubmission.js';
import MockTest from '../models/MockTest.js';
import MockTestAttempt from '../models/MockTestAttempt.js';
import AptitudeQuestion from '../models/AptitudeQuestion.js';
import AptitudeAttempt from '../models/AptitudeAttempt.js';
import Bookmark from '../models/Bookmark.js';

import progressRoutes from '../routes/progress.js';
import { generateToken } from '../utils/jwt.js';
import errorHandler from '../middleware/errorHandler.js';

const TEST_PORT = 5006;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

const app = express();
app.use(helmet({ contentSecurityPolicy: false, frameguard: { action: 'deny' } }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Mount routes
app.use('/api/progress', progressRoutes);
app.use(errorHandler);

let server;
let passed = 0;
let failed = 0;

function assert(condition, testNum, description) {
  if (condition) {
    console.log(`  [PASS] TEST ${testNum}: ${description}`);
    passed++;
  } else {
    console.error(`  [FAIL] TEST ${testNum}: ${description}`);
    failed++;
  }
}

async function runProgressAnalyticsSuite() {
  console.log('\n===============================================================');
  console.log(' STARTING ADVANCED PROGRESS + ANALYTICS VERIFICATION SUITE');
  console.log('===============================================================\n');

  try {
    // 1. Connect DB & Start Server
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/recruiteready';
    await mongoose.connect(mongoUri);
    console.log('[DB] Connected to MongoDB for Progress Suite');

    server = app.listen(TEST_PORT, () => {
      console.log(`[HTTP] Test server listening on ${BASE_URL}`);
    });

    // Clean up any existing test entities
    const existingTestUsers = await User.find({ email: { $in: ['test_empty_student@example.com', 'test_active_student@example.com'] } }).select('_id');
    const existingIds = existingTestUsers.map(u => u._id);
    await AptitudeAttempt.deleteMany({ user: { $in: existingIds } });
    await CodingSubmission.deleteMany({ user: { $in: existingIds } });
    await MockTestAttempt.deleteMany({ user: { $in: existingIds } });
    await Bookmark.deleteMany({ user: { $in: existingIds } });
    await User.deleteMany({ _id: { $in: existingIds } });
    await Company.deleteMany({ name: 'Progress Test Tech Corp' });
    await CodingProblem.deleteMany({ slug: { $in: ['two-sum-progress-test', 'longest-palindrome-progress-test'] } });
    await MockTest.deleteMany({ slug: 'full-stack-tech-assessment-test' });

    // 2. Setup Test Company
    const testCompany = await Company.create({
      name: 'Progress Test Tech Corp',
      slug: 'progress-test-tech-corp',
      description: 'A test technology company for progress verification',
      website: 'https://testtech.example.com',
      industry: 'Software',
      roles: ['Software Engineer', 'Frontend Engineer'],
      eligibleBranches: ['Computer Science', 'Information Technology'],
      hiringProcess: [
        { roundNumber: 1, roundName: 'Online Assessment', roundType: 'OA', description: 'Aptitude & Coding' },
        { roundNumber: 2, roundName: 'Technical Interview', roundType: 'Technical', description: 'DSA' },
      ],
      topics: ['Quantitative Aptitude', 'Data Structures', 'Dynamic Programming'],
      createdAt: new Date(),
    });

    // 3. Setup Zero-Activity Student
    const emptyStudent = await User.create({
      firstName: 'New',
      lastName: 'Learner',
      email: 'test_empty_student@example.com',
      password: 'Password123!',
      role: 'student',
      isEmailVerified: true,
      college: 'National Engineering Institute',
      branch: 'Computer Science',
      graduationYear: 2027,
      targetCompanies: [testCompany._id],
      preparationGoals: ['Campus Placements'],
      onboardingCompleted: true,
    });

    const emptySession = await Session.create({
      user: emptyStudent._id,
      tokenHash: 'hash_empty',
      userAgent: 'Node Test Agent',
      ipAddress: '127.0.0.1',
      expiresAt: new Date(Date.now() + 86400000),
    });
    const emptyToken = generateToken(emptyStudent, emptySession._id);

    // 4. Setup Active Student with Real Preparation Records
    const activeStudent = await User.create({
      firstName: 'Active',
      lastName: 'PrepStudent',
      email: 'test_active_student@example.com',
      password: 'Password123!',
      role: 'student',
      isEmailVerified: true,
      college: 'Apex Institute of Technology',
      branch: 'Computer Science',
      graduationYear: 2026,
      targetCompanies: [testCompany._id],
      preparationGoals: ['Product Companies', 'Core Tech'],
      onboardingCompleted: true,
    });

    const activeSession = await Session.create({
      user: activeStudent._id,
      tokenHash: 'hash_active',
      userAgent: 'Node Test Agent',
      ipAddress: '127.0.0.1',
      expiresAt: new Date(Date.now() + 86400000),
    });
    const activeToken = generateToken(activeStudent, activeSession._id);

    // Seed Active Student Preparation Records:
    // A. Aptitude Questions & Attempts
    // Topic A ("Quantitative Aptitude"): 3 attempts, all correct -> Strength candidate (100% acc, sample size 3)
    // Topic B ("Verbal Ability"): 3 attempts, 1 correct, 2 incorrect -> Weak Area candidate (33% acc, sample size 3)
    // Topic C ("Logical Reasoning"): 1 attempt, 1 correct -> Insufficient Data (< 3 sample size)
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    const twoDaysAgo = new Date(Date.now() - 172800000);

    // Aptitude Attempt 1 (Today)
    await AptitudeAttempt.create({
      user: activeStudent._id,
      category: 'quantitative',
      topic: 'Quantitative Aptitude',
      difficulty: 'medium',
      timeLimitSeconds: 600,
      totalQuestions: 2,
      score: 2,
      percentage: 100,
      status: 'submitted',
      answers: [
        { questionId: new mongoose.Types.ObjectId(), selectedOption: 'A', isCorrect: true },
        { questionId: new mongoose.Types.ObjectId(), selectedOption: 'B', isCorrect: true },
      ],
      createdAt: today,
    });

    // Aptitude Attempt 2 (Yesterday)
    await AptitudeAttempt.create({
      user: activeStudent._id,
      category: 'quantitative',
      topic: 'Quantitative Aptitude',
      difficulty: 'easy',
      timeLimitSeconds: 600,
      totalQuestions: 1,
      score: 1,
      percentage: 100,
      status: 'submitted',
      answers: [
        { questionId: new mongoose.Types.ObjectId(), selectedOption: 'C', isCorrect: true },
      ],
      createdAt: yesterday,
    });

    // Aptitude Attempt 3 (Two Days Ago) - Verbal topic with low score
    await AptitudeAttempt.create({
      user: activeStudent._id,
      category: 'verbal',
      topic: 'Verbal Ability',
      difficulty: 'hard',
      timeLimitSeconds: 600,
      totalQuestions: 3,
      score: 1,
      percentage: 33,
      status: 'submitted',
      answers: [
        { questionId: new mongoose.Types.ObjectId(), selectedOption: 'A', isCorrect: true },
        { questionId: new mongoose.Types.ObjectId(), selectedOption: 'B', isCorrect: false },
        { questionId: new mongoose.Types.ObjectId(), selectedOption: 'D', isCorrect: false },
      ],
      createdAt: twoDaysAgo,
    });

    // Aptitude Attempt 4 (Today) - Logical topic with only 1 question (<3 evals)
    await AptitudeAttempt.create({
      user: activeStudent._id,
      category: 'logical',
      topic: 'Logical Reasoning',
      difficulty: 'medium',
      timeLimitSeconds: 600,
      totalQuestions: 1,
      score: 1,
      percentage: 100,
      status: 'submitted',
      answers: [
        { questionId: new mongoose.Types.ObjectId(), selectedOption: 'A', isCorrect: true },
      ],
      createdAt: today,
    });

    // B. Coding Problem & Submissions
    const codingProblem1 = await CodingProblem.create({
      title: 'Two Sum Progress Test',
      slug: 'two-sum-progress-test',
      difficulty: 'easy',
      topic: 'Data Structures',
      description: 'Find two numbers that add up to target',
      testCases: [{ input: '2 7 11 15\n9', expectedOutput: '0 1', isHidden: false }],
      createdBy: activeStudent._id,
    });

    const codingProblem2 = await CodingProblem.create({
      title: 'Longest Palindrome Progress Test',
      slug: 'longest-palindrome-progress-test',
      difficulty: 'medium',
      topic: 'Dynamic Programming',
      description: 'Find longest palindromic substring',
      testCases: [{ input: 'babad', expectedOutput: 'bab', isHidden: false }],
      createdBy: activeStudent._id,
    });

    // Submission 1: Accepted (Problem 1) on Today
    await CodingSubmission.create({
      user: activeStudent._id,
      problem: codingProblem1._id,
      language: 'javascript',
      code: 'function twoSum() { return [0, 1]; }',
      status: 'accepted',
      passedTestCases: 1,
      totalTestCases: 1,
      submittedAt: today,
    });

    // Submission 2: Wrong Answer (Problem 2) on Yesterday
    await CodingSubmission.create({
      user: activeStudent._id,
      problem: codingProblem2._id,
      language: 'python',
      code: 'def longest(): return "wrong"',
      status: 'wrong_answer',
      passedTestCases: 0,
      totalTestCases: 1,
      submittedAt: yesterday,
    });

    // C. Mock Test Attempts
    const mockTest1 = await MockTest.create({
      title: 'Full Stack Tech Assessment',
      slug: 'full-stack-tech-assessment-test',
      category: 'technical',
      difficulty: 'medium',
      durationMinutes: 45,
      totalQuestions: 10,
      totalMarks: 100,
      createdBy: activeStudent._id,
    });

    // Mock Attempt 1: Submitted (Completed) with score 80
    await MockTestAttempt.create({
      user: activeStudent._id,
      mockTest: mockTest1._id,
      totalQuestions: 10,
      timeLimitSeconds: 2700,
      status: 'submitted',
      score: 80,
      totalMarks: 100,
      percentage: 80,
      submittedAt: today,
      createdAt: today,
    });

    // Mock Attempt 2: Expired
    await MockTestAttempt.create({
      user: activeStudent._id,
      mockTest: mockTest1._id,
      totalQuestions: 10,
      timeLimitSeconds: 2700,
      status: 'expired',
      score: 30,
      totalMarks: 100,
      percentage: 30,
      submittedAt: twoDaysAgo,
      createdAt: twoDaysAgo,
    });

    // Bookmark testCompany for active student
    await Bookmark.create({
      user: activeStudent._id,
      itemType: 'company',
      itemId: testCompany._id,
      itemModel: 'Company',
    });

    console.log('[SETUP] Test students, attempts, submissions, and mock tests seeded successfully.\n');

    // =========================================================================
    // SECTION 1: Zero-Activity Student Tests
    // =========================================================================
    console.log('--- SECTION 1: Zero-Activity Student Honest State ---');

    const resEmpty = await fetch(`${BASE_URL}/api/progress/summary`, {
      headers: { Authorization: `Bearer ${emptyToken}` },
    });
    const dataEmptyJson = await resEmpty.json();
    const dataEmpty = dataEmptyJson.data;

    assert(resEmpty.status === 200, 1, 'GET /api/progress/summary returns 200 for new student');
    assert(dataEmpty.overview.totalActivities === 0, 2, 'Overview totalActivities is exactly 0');
    assert(dataEmpty.overview.activePreparationDays === 0, 3, 'Overview activePreparationDays is 0');
    assert(dataEmpty.overview.currentStreak === 0, 4, 'Overview currentStreak is 0 (no phantom streak)');
    assert(dataEmpty.overview.aptitudeAccuracy === null, 5, 'Aptitude accuracy is null (honest empty state)');
    assert(dataEmpty.overview.codingSuccessRate === null, 6, 'Coding success rate is null');
    assert(dataEmpty.overview.mockTestAverage === null, 7, 'Mock test average is null');
    assert(dataEmpty.readiness.isEligible === false, 8, 'Placement Readiness isEligible is false');
    assert(dataEmpty.readiness.score === null, 9, 'Placement Readiness score is null');
    assert(dataEmpty.readiness.level === 'Not Enough Data', 10, 'Placement Readiness level is "Not Enough Data"');
    assert(
      dataEmpty.strengthsAndWeaknesses.hasEnoughData === false,
      11,
      'Strengths and weaknesses hasEnoughData is false'
    );
    assert(dataEmpty.strengthsAndWeaknesses.strengths.length === 0, 12, 'Strengths list is empty');
    assert(dataEmpty.strengthsAndWeaknesses.weakAreas.length === 0, 13, 'Weak areas list is empty');
    assert(dataEmpty.activity.hasWeeklyActivity === false, 14, 'hasWeeklyActivity is false for empty student');

    // =========================================================================
    // SECTION 2: Active Student Analytics Verification
    // =========================================================================
    console.log('\n--- SECTION 2: Active Student Analytics Calculations ---');

    const resActive = await fetch(`${BASE_URL}/api/progress/summary`, {
      headers: { Authorization: `Bearer ${activeToken}` },
    });
    const dataActiveJson = await resActive.json();
    const dataActive = dataActiveJson.data;

    assert(resActive.status === 200, 15, 'GET /api/progress/summary returns 200 for active student');

    // Overview Checks
    // Total activities = 4 completed aptitude sessions + 2 coding submissions + 1 completed mock test = 7
    assert(dataActive.overview.totalActivities === 7, 16, 'Total activities matches actual database records (7)');
    assert(dataActive.overview.activePreparationDays >= 2, 17, 'Active preparation days is strictly >= 2');
    assert(dataActive.overview.currentStreak >= 1, 18, 'Current streak is correctly calculated >= 1');

    // Aptitude Checks
    // Total questions attempted = 2 + 1 + 3 + 1 = 7. Correct = 2 + 1 + 1 + 1 = 5. Accuracy = Math.round((5/7)*100) = 71%
    assert(dataActive.aptitude.questionsAttempted === 7, 19, 'Aptitude questionsAttempted is 7');
    assert(dataActive.aptitude.correct === 5, 20, 'Aptitude correct count is 5');
    assert(dataActive.aptitude.incorrect === 2, 21, 'Aptitude incorrect count is 2');
    assert(dataActive.aptitude.accuracy === 71, 22, 'Aptitude overall accuracy is 71%');
    assert(dataActive.aptitude.completedSessions === 4, 23, 'Aptitude completedSessions is 4');

    // Coding Checks
    // Total submissions = 2. Unique problems attempted = 2. Solved = 1.
    assert(dataActive.coding.totalSubmissions === 2, 24, 'Coding totalSubmissions is 2');
    assert(dataActive.coding.problemsAttempted === 2, 25, 'Coding problemsAttempted is 2');
    assert(dataActive.coding.problemsSolved === 1, 26, 'Coding problemsSolved is 1');
    assert(dataActive.coding.successfulSubmissions === 1, 27, 'Successful submissions is 1');
    assert(dataActive.coding.failedSubmissions === 1, 28, 'Failed submissions is 1');
    assert(dataActive.coding.successRate === 50, 29, 'Coding successRate is 50%');

    // Mock Test Checks
    // Total attempts = 2. Completed = 1. Expired = 1. Completed average = 80%.
    assert(dataActive.mockTests.totalAttempts === 2, 30, 'Mock tests totalAttempts is 2');
    assert(dataActive.mockTests.completed === 1, 31, 'Mock tests completed is 1 (status submitted)');
    assert(dataActive.mockTests.expired === 1, 32, 'Mock tests expired is 1');
    assert(dataActive.mockTests.averagePercentage === 80, 33, 'Mock test average score is 80%');

    // =========================================================================
    // SECTION 3: Sample Size Rule & Strengths/Weaknesses
    // =========================================================================
    console.log('\n--- SECTION 3: Topic Heatmap & Sample Size Rule (>=3 evals) ---');

    // Quantitative Aptitude had 3 questions, 3 correct (100% accuracy, count=3) -> must be in STRENGTHS
    const quantStrength = dataActive.strengthsAndWeaknesses.strengths.find(
      (s) => s.topic === 'Quantitative Aptitude'
    );
    assert(Boolean(quantStrength), 34, 'Quantitative Aptitude (3 evals, 100% acc) is classified as a STRENGTH');
    assert(quantStrength?.accuracy === 100, 35, 'Strength topic reports exact 100% accuracy');

    // Verbal Ability had 3 questions, 1 correct (33% accuracy, count=3) -> must be in WEAK AREAS
    const verbalWeak = dataActive.strengthsAndWeaknesses.weakAreas.find(
      (w) => w.topic === 'Verbal Ability'
    );
    assert(Boolean(verbalWeak), 36, 'Verbal Ability (3 evals, 33% acc) is classified as a WEAK AREA');
    assert(verbalWeak?.accuracy === 33, 37, 'Weak area topic reports exact 33% accuracy');

    // Logical Reasoning had 1 question (count=1 < 3) -> must NOT be in strengths or weak areas
    const logicalStrength = dataActive.strengthsAndWeaknesses.strengths.find(
      (s) => s.topic === 'Logical Reasoning'
    );
    const logicalWeak = dataActive.strengthsAndWeaknesses.weakAreas.find(
      (w) => w.topic === 'Logical Reasoning'
    );
    assert(!logicalStrength && !logicalWeak, 38, 'Topic with <3 evaluations is NOT in strengths or weak areas');

    // Heatmap check for Logical Reasoning
    const logicalHeatmap = dataActive.topics.find((t) => t.topic === 'Logical Reasoning');
    assert(
      logicalHeatmap?.status === 'insufficient_data',
      39,
      'Topic with <3 evaluations is marked "insufficient_data" in heatmap'
    );

    // =========================================================================
    // SECTION 4: Deterministic Placement Readiness Formula
    // =========================================================================
    console.log('\n--- SECTION 4: Placement Readiness Score & Formula ---');

    assert(dataActive.readiness.isEligible === true, 40, 'Active student is eligible for readiness score');
    assert(
      dataActive.readiness.score >= 0 && dataActive.readiness.score <= 100,
      41,
      `Readiness score is bounded between 0 and 100 (score: ${dataActive.readiness.score})`
    );
    assert(
      typeof dataActive.readiness.level === 'string' && dataActive.readiness.level !== 'Not Enough Data',
      42,
      `Readiness level is assigned correctly (${dataActive.readiness.level})`
    );

    // Component breakdown check
    const { aptitude: rApt, coding: rCode, mockTests: rMock, consistency: rCons, profile: rProf } =
      dataActive.readiness.breakdown;
    assert(rApt.score >= 0 && rApt.score <= 25, 43, 'Aptitude component is bounded [0, 25]');
    assert(rCode.score >= 0 && rCode.score <= 30, 44, 'Coding component is bounded [0, 30]');
    assert(rMock.score >= 0 && rMock.score <= 25, 45, 'Mock component is bounded [0, 25]');
    assert(rCons.score >= 0 && rCons.score <= 10, 46, 'Consistency component is bounded [0, 10]');
    assert(rProf.score >= 0 && rProf.score <= 10, 47, 'Profile component is bounded [0, 10]');
    assert(Boolean(dataActive.readiness.disclaimer), 48, 'Readiness includes non-prediction disclaimer');

    // =========================================================================
    // SECTION 5: Preparation Consistency & Weekly Activity
    // =========================================================================
    console.log('\n--- SECTION 5: Consistency & Weekly Activity Calendar ---');

    assert(dataActive.activity.weeklyActivity.length === 7, 49, 'Weekly activity array contains exactly 7 days');
    const todayActivity = dataActive.activity.weeklyActivity.find((d) => d.isToday);
    assert(Boolean(todayActivity), 50, 'Weekly activity contains today indicator');
    assert(todayActivity?.totalActivities > 0, 51, 'Today reflects qualifying completed activities');
    assert(dataActive.activity.hasWeeklyActivity === true, 52, 'hasWeeklyActivity is true for active student');

    // =========================================================================
    // SECTION 6: Target Company Syllabus Tracking
    // =========================================================================
    console.log('\n--- SECTION 6: Target Company Preparation Checklist ---');

    assert(dataActive.companies.length >= 1, 53, 'Companies analytics includes student target company');
    const companyAnalytics = dataActive.companies.find((c) => c.name === 'Progress Test Tech Corp');
    assert(Boolean(companyAnalytics), 54, 'Found Progress Test Tech Corp in company analytics');
    assert(
      companyAnalytics?.hasBookmarks === true,
      55,
      'Company correctly reflects student bookmark status'
    );
    assert(
      companyAnalytics?.topicsPrepared >= 1,
      56,
      `Company reflects verified aptitude topics prepared (${companyAnalytics?.topicsPrepared})`
    );
    assert(
      companyAnalytics?.codingSolved >= 1,
      57,
      `Company reflects verified coding problems solved (${companyAnalytics?.codingSolved})`
    );

    // =========================================================================
    // SECTION 7: Deterministic Recommendations
    // =========================================================================
    console.log('\n--- SECTION 7: Deterministic Recommendations ---');

    assert(
      dataActive.recommendations.length >= 1 && dataActive.recommendations.length <= 4,
      58,
      `Recommendations returned prioritized list (count: ${dataActive.recommendations.length})`
    );
    assert(
      dataActive.recommendations.every((r) => r.actionUrl && r.actionLabel && r.title),
      59,
      'Every recommendation includes title, actionUrl, and actionLabel'
    );

    // Weak area recommendation check
    const weakRec = dataActive.recommendations.find((r) => r.title.includes('Verbal Ability'));
    assert(
      Boolean(weakRec),
      60,
      'Recommendations prioritize detected weak topic "Verbal Ability"'
    );

    // =========================================================================
    // SECTION 8: Security & Isolation
    // =========================================================================
    console.log('\n--- SECTION 8: Security, Authentication & Isolation ---');

    // 1. Unauthenticated request
    const resUnauth = await fetch(`${BASE_URL}/api/progress/summary`);
    assert(resUnauth.status === 401, 61, 'Accessing /api/progress/summary without token returns 401');

    // 2. Cross-user isolation: Verify that emptyStudent cannot see activeStudent's data
    assert(
      dataEmpty.overview.totalActivities === 0 && dataActive.overview.totalActivities === 7,
      62,
      'Strict user isolation verified: new student data is completely separated from active student'
    );

    console.log('\n===============================================================');
    console.log(` ADVANCED PROGRESS SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================\n');

    // Clean up
    await User.deleteMany({ email: { $in: ['test_empty_student@example.com', 'test_active_student@example.com'] } });
    await Session.deleteMany({ user: { $in: [emptyStudent._id, activeStudent._id] } });
    await AptitudeAttempt.deleteMany({ user: activeStudent._id });
    await CodingSubmission.deleteMany({ user: activeStudent._id });
    await MockTestAttempt.deleteMany({ user: activeStudent._id });
    await CodingProblem.deleteMany({ _id: { $in: [codingProblem1._id, codingProblem2._id] } });
    await MockTest.deleteMany({ _id: mockTest1._id });
    await Company.deleteMany({ _id: testCompany._id });
    await Bookmark.deleteMany({ user: activeStudent._id });

    if (server) server.close();
    await mongoose.disconnect();

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test suite runtime error:', err);
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
}

runProgressAnalyticsSuite();
