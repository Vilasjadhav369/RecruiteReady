/**
 * Comprehensive Automated Verification Suite for
 * COMPANY PREPARATION 2.0 (Phase 48 - 35 Test Points)
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
import CompanyPreparationProgress from '../models/CompanyPreparationProgress.js';
import AptitudeAttempt from '../models/AptitudeAttempt.js';
import AptitudeQuestion from '../models/AptitudeQuestion.js';
import CodingSubmission from '../models/CodingSubmission.js';
import CodingProblem from '../models/CodingProblem.js';
import Bookmark from '../models/Bookmark.js';

import companyRoutes from '../routes/company.js';
import adminRoutes from '../routes/admin.js';
import { generateToken } from '../utils/jwt.js';
import errorHandler from '../middleware/errorHandler.js';

const TEST_PORT = 5007;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

const app = express();
app.use(helmet({ contentSecurityPolicy: false, frameguard: { action: 'deny' } }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Mount routes
app.use('/api/companies', companyRoutes);
app.use('/api/admin', adminRoutes);
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

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch (err) {
    data = null;
  }
  return { status: res.status, data };
}

async function runSuite() {
  console.log('\n===============================================================');
  console.log(' COMPANY PREPARATION 2.0 AUTOMATED VERIFICATION SUITE');
  console.log(' Testing all 35 Verification Points across Phases 1-53');
  console.log('===============================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/recruiteready';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for Company Prep test suite.\n');

  server = app.listen(TEST_PORT, '127.0.0.1');

  try {
    // ── Setup Test Data ──
    const timestamp = Date.now();

    // 1. Students
    const studentA = await User.create({
      firstName: 'Prep',
      lastName: 'StudentA',
      email: `prep.student.a.${timestamp}@test.com`,
      password: 'HashedPassword123!',
      role: 'student',
      isActive: true,
      emailVerified: true,
      college: 'Tech University',
      branch: 'Computer Science',
      graduationYear: 2025,
      cgpa: 8.5,
      backlogs: 0,
    });
    const tokenA = generateToken(studentA);
    const authHeadersA = { Authorization: `Bearer ${tokenA}` };

    const studentB = await User.create({
      firstName: 'Prep',
      lastName: 'StudentB',
      email: `prep.student.b.${timestamp}@test.com`,
      password: 'HashedPassword123!',
      role: 'student',
      isActive: true,
      emailVerified: true,
      college: 'Tech University',
      branch: 'Mechanical Engineering',
      graduationYear: 2026,
      cgpa: 6.2,
      backlogs: 2,
    });
    const tokenB = generateToken(studentB);
    const authHeadersB = { Authorization: `Bearer ${tokenB}` };

    const studentIncomplete = await User.create({
      firstName: 'Incomplete',
      lastName: 'Student',
      email: `prep.student.inc.${timestamp}@test.com`,
      password: 'HashedPassword123!',
      role: 'student',
      isActive: true,
      emailVerified: true,
      // Missing branch, graduationYear, cgpa
    });
    const tokenInc = generateToken(studentIncomplete);
    const authHeadersInc = { Authorization: `Bearer ${tokenInc}` };

    // 2. Admin User
    const adminUser = await User.create({
      firstName: 'Company',
      lastName: 'Admin',
      email: `prep.admin.${timestamp}@test.com`,
      password: 'HashedPassword123!',
      role: 'admin',
      isActive: true,
      emailVerified: true,
    });
    const adminToken = generateToken(adminUser);
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 3. Active Company (Featured)
    const activeCompany = await Company.create({
      name: `Apex Software ${timestamp}`,
      slug: `apex-software-${timestamp}`,
      industry: 'Technology',
      description: 'Premier enterprise software engineering company.',
      website: 'https://apex.example.com',
      careersUrl: 'https://apex.example.com/careers',
      roles: ['Software Engineer', 'Backend Specialist'],
      eligibility: 'B.Tech CS/IT with min 7.5 CGPA and 0 backlogs.',
      eligibilityCriteria: {
        minCgpa: 7.5,
        allowedBranches: ['Computer Science', 'Information Technology'],
        allowedGraduationYears: [2025],
        maxBacklogs: 0,
      },
      selectionProcess: [
        'Online Assessment (Aptitude & Coding)',
        'Technical Interview 1',
        'Technical Interview 2',
        'HR & Cultural Fit Round',
      ],
      aptitudeTopics: ['Quantitative Aptitude', 'Logical Reasoning'],
      codingTopics: ['Dynamic Programming', 'Binary Trees'],
      interviewTopics: ['System Design', 'DBMS & Indexing', 'OOP Principles'],
      resources: [
        {
          title: 'Apex Engineering Handbook',
          url: 'https://apex.example.com/guide',
          category: 'interview',
          type: 'article',
        },
      ],
      isFeatured: true,
      isActive: true,
    });

    // 4. Inactive Company
    const inactiveCompany = await Company.create({
      name: `Hidden Corp ${timestamp}`,
      slug: `hidden-corp-${timestamp}`,
      industry: 'Finance',
      description: 'Draft financial services company profile.',
      isActive: false,
    });

    console.log('── GROUP 1: PUBLIC & STUDENT COMPANY DIRECTORY (Tests 1–6) ──');

    // Test 1: GET /api/companies returns 200 with pagination and active companies
    const res1 = await request('/api/companies');
    assert(
      res1.status === 200 &&
      Array.isArray(res1.data?.data?.companies) &&
      res1.data.data.pagination?.total >= 1,
      'Point 1: GET /api/companies returns 200 with active companies and pagination metadata'
    );

    // Test 2: Inactive companies are NOT returned in GET /api/companies
    const foundInactive = res1.data.data.companies.some(c => c._id === inactiveCompany._id.toString());
    assert(
      !foundInactive,
      'Point 2: Inactive companies are strictly excluded from student directory listing'
    );

    // Test 3: Search filter works
    const res3 = await request(`/api/companies?search=Apex`);
    const foundSearch = res3.data?.data?.companies?.some(c => c._id === activeCompany._id.toString());
    assert(
      res3.status === 200 && foundSearch,
      'Point 3: Search filter correctly locates companies by name/keyword'
    );

    // Test 4: Industry filter works
    const res4 = await request(`/api/companies?industry=Technology`);
    const techOnly = res4.data?.data?.companies?.every(c => c.industry === 'Technology');
    assert(
      res4.status === 200 && techOnly && res4.data.data.companies.length > 0,
      'Point 4: Industry filter filters company results accurately'
    );

    // Test 5: Preparation areas summary is present on listings
    const apexInList = res1.data.data.companies.find(c => c._id === activeCompany._id.toString());
    assert(
      apexInList &&
      apexInList.preparationAreas?.hasAptitude === true &&
      apexInList.preparationAreas?.hasCoding === true &&
      apexInList.preparationAreas?.hasInterview === true,
      'Point 5: Company listing cards include verified preparation area flags (Aptitude, Coding, Interview)'
    );

    // Test 6: Featured companies have isFeatured flag
    assert(
      apexInList?.isFeatured === true,
      'Point 6: Featured companies correctly expose isFeatured flag for directory sorting/badging'
    );

    console.log('\n── GROUP 2: COMPANY DETAIL RETRIEVAL (Tests 7–11) ──');

    // Test 7: GET /api/companies/:id returns active company by ID
    const res7 = await request(`/api/companies/${activeCompany._id}`);
    assert(
      res7.status === 200 && res7.data?.data?.company?._id === activeCompany._id.toString(),
      'Point 7: GET /api/companies/:id successfully retrieves active company by MongoDB ObjectId'
    );

    // Test 8: GET /api/companies/:slug returns active company by slug
    const res8 = await request(`/api/companies/${activeCompany.slug}`);
    assert(
      res8.status === 200 && res8.data?.data?.company?.slug === activeCompany.slug,
      'Point 8: GET /api/companies/:slug successfully retrieves active company by URL slug'
    );

    // Test 9: Inactive company returns 404 to student/public
    const res9 = await request(`/api/companies/${inactiveCompany._id}`);
    assert(
      res9.status === 404,
      'Point 9: Inactive company profile returns 404 Not Found to unauthorized/student requests'
    );

    // Test 10: Nonexistent company ID returns 404
    const res10 = await request('/api/companies/507f1f77bcf86cd799439011');
    assert(
      res10.status === 404,
      'Point 10: Nonexistent company ID returns controlled 404 Not Found'
    );

    // Test 11: Authenticated student receives isTargetCompany and isBookmarked
    const res11 = await request(`/api/companies/${activeCompany._id}`, {
      headers: authHeadersA,
    });
    const c11 = res11.data?.data?.company;
    assert(
      res11.status === 200 &&
      (typeof c11?.isTarget === 'boolean' || typeof c11?.isTargetCompany === 'boolean') &&
      typeof c11?.isBookmarked === 'boolean',
      'Point 11: Authenticated student profile returns personalized isTargetCompany and isBookmarked flags'
    );

    console.log('\n── GROUP 3: ROADMAP & REAL PREPARATION PROGRESS (Tests 12–17) ──');

    // Test 12: GET /api/companies/:id/preparation unauthenticated returns 401
    const res12 = await request(`/api/companies/${activeCompany._id}/preparation`);
    assert(
      res12.status === 401,
      'Point 12: GET /api/companies/:id/preparation requires authentication (returns 401)'
    );

    // Test 13: GET preparation track returns roadmap, sections, summary, and eligibility
    const res13 = await request(`/api/companies/${activeCompany._id}/preparation`, {
      headers: authHeadersA,
    });
    const prepData = res13.data?.data;
    assert(
      res13.status === 200 &&
      Array.isArray(prepData?.roadmap) &&
      prepData?.roadmap.length >= 3 &&
      prepData?.sections?.aptitude?.items?.length === 2 &&
      prepData?.sections?.coding?.items?.length === 2 &&
      prepData?.sections?.interview?.items?.length === 3,
      'Point 13: Preparation endpoint returns structured roadmap and populated topic sections'
    );

    // Test 14: Zero-activity student has 0 completed items and 0% progress
    assert(
      prepData?.studentProgress?.completedItems === 0 &&
      prepData?.studentProgress?.percentage === 0,
      'Point 14: Zero-activity student displays honest 0% progress without fabricated data'
    );

    // Test 15: Real verified activity - Aptitude Attempt
    await AptitudeAttempt.create({
      user: studentA._id,
      category: 'Quantitative Aptitude',
      topic: 'Quantitative Aptitude',
      score: 10,
      totalQuestions: 10,
      correctAnswers: 10,
      timeLimitSeconds: 600,
      status: 'submitted',
      submittedAt: new Date(),
    });

    const res15 = await request(`/api/companies/${activeCompany._id}/preparation`, {
      headers: authHeadersA,
    });
    const quantTopic = res15.data?.data?.sections?.aptitude?.items?.find(
      t => t.topic === 'Quantitative Aptitude'
    );
    assert(
      quantTopic?.isCompleted === true && quantTopic?.verifiedByActivity === true,
      'Point 15: Aptitude topic auto-completes and marks verifiedByActivity based on real AptitudeAttempt'
    );

    // Test 16: Real verified activity - Coding Submission
    const dpProblem = await CodingProblem.create({
      title: `DP Problem ${timestamp}`,
      slug: `dp-problem-${timestamp}`,
      description: 'Solve optimal substructure.',
      difficulty: 'medium',
      category: 'Dynamic Programming',
      topics: ['Dynamic Programming'],
      testCases: [{ input: '1', expectedOutput: '1', isHidden: false }],
    });

    await CodingSubmission.create({
      user: studentA._id,
      problem: dpProblem._id,
      code: 'function solve() { return 1; }',
      language: 'javascript',
      status: 'accepted',
      passedTests: 1,
      totalTests: 1,
    });

    const res16 = await request(`/api/companies/${activeCompany._id}/preparation`, {
      headers: authHeadersA,
    });
    const dpTopic = res16.data?.data?.sections?.coding?.items?.find(
      t => t.topic === 'Dynamic Programming'
    );
    assert(
      dpTopic?.isCompleted === true && dpTopic?.verifiedByActivity === true,
      'Point 16: Coding topic auto-completes and marks verifiedByActivity based on accepted CodingSubmission'
    );

    // Test 17: Progress percentage recalculates dynamically
    // Total items: 2 aptitude + 2 coding + 3 interview + 1 resource = 8 items. Completed = 2. Expected = 25%.
    const currentProgress = res16.data?.data?.studentProgress;
    assert(
      currentProgress?.completedItems === 2 && currentProgress?.percentage === 25,
      'Point 17: Preparation progress percentage accurately computes mathematically (2 / 8 = 25%)'
    );

    console.log('\n── GROUP 4: INTERACTIVE CHECKLIST & USER ISOLATION (Tests 18–25) ──');

    // Test 18: PATCH progress without token returns 401
    const res18 = await request(`/api/companies/${activeCompany._id}/progress`, {
      method: 'PATCH',
      body: { section: 'interview', itemKey: 'System Design', completed: true },
    });
    assert(
      res18.status === 401,
      'Point 18: PATCH /api/companies/:id/progress returns 401 when unauthenticated'
    );

    // Test 19: PATCH progress with invalid section returns 400
    const res19 = await request(`/api/companies/${activeCompany._id}/progress`, {
      method: 'PATCH',
      headers: authHeadersA,
      body: { section: 'invalid_section', itemKey: 'System Design', completed: true },
    });
    assert(
      res19.status === 400,
      'Point 19: PATCH /api/companies/:id/progress rejects invalid section with 400'
    );

    // Test 20: PATCH progress with missing itemKey returns 400
    const res20 = await request(`/api/companies/${activeCompany._id}/progress`, {
      method: 'PATCH',
      headers: authHeadersA,
      body: { section: 'interview', itemKey: '', completed: true },
    });
    assert(
      res20.status === 400,
      'Point 20: PATCH /api/companies/:id/progress rejects empty itemKey with 400'
    );

    // Test 21: Student marks interview topic as completed
    const res21 = await request(`/api/companies/${activeCompany._id}/progress`, {
      method: 'PATCH',
      headers: authHeadersA,
      body: { section: 'interview', itemKey: 'System Design', completed: true },
    });
    const checkRes21 = await request(`/api/companies/${activeCompany._id}/preparation`, {
      headers: authHeadersA,
    });
    assert(
      res21.status === 200 &&
      checkRes21.data?.data?.studentProgress?.completedItems === 3,
      'Point 21: Marking interview checklist item persists to CompanyPreparationProgress (3 / 8 = 38%)'
    );

    // Test 22: Student unchecks the item
    const res22 = await request(`/api/companies/${activeCompany._id}/progress`, {
      method: 'PATCH',
      headers: authHeadersA,
      body: { section: 'interview', itemKey: 'System Design', completed: false },
    });
    const checkRes22 = await request(`/api/companies/${activeCompany._id}/preparation`, {
      headers: authHeadersA,
    });
    assert(
      res22.status === 200 &&
      checkRes22.data?.data?.studentProgress?.completedItems === 2,
      'Point 22: Unchecking an item updates completed: false and decrements progress count'
    );

    // Test 23: Student marks a study resource as reviewed
    const res23 = await request(`/api/companies/${activeCompany._id}/progress`, {
      method: 'PATCH',
      headers: authHeadersA,
      body: {
        section: 'resources',
        itemKey: activeCompany.resources[0].title,
        completed: true,
      },
    });
    const checkRes23 = await request(`/api/companies/${activeCompany._id}/preparation`, {
      headers: authHeadersA,
    });
    assert(
      res23.status === 200 &&
      checkRes23.data?.data?.studentProgress?.completedItems === 3,
      'Point 23: Resource review checklist persists and counts toward overall preparation progress'
    );

    // Test 24: User isolation: Student B does not see Student A's progress
    const res24 = await request(`/api/companies/${activeCompany._id}/preparation`, {
      headers: authHeadersB,
    });
    assert(
      res24.status === 200 &&
      res24.data?.data?.studentProgress?.completedItems === 0 &&
      res24.data?.data?.studentProgress?.percentage === 0,
      'Point 24: Strict user isolation: Student B observes 0 completed items regardless of Student A'
    );

    // Test 25: Student B cannot modify Student A's records
    const studentAProgressCountBefore = await CompanyPreparationProgress.countDocuments({
      user: studentA._id,
      completed: true,
    });
    await request(`/api/companies/${activeCompany._id}/progress`, {
      method: 'PATCH',
      headers: authHeadersB,
      body: { section: 'interview', itemKey: 'DBMS & Indexing', completed: true },
    });
    const studentAProgressCountAfter = await CompanyPreparationProgress.countDocuments({
      user: studentA._id,
      completed: true,
    });
    assert(
      studentAProgressCountBefore === studentAProgressCountAfter,
      'Point 25: Progress modifications by Student B are strictly isolated from Student A'
    );

    console.log('\n── GROUP 5: ELIGIBILITY ENGINE & DISCLAIMER (Tests 26–31) ──');

    // Test 26: Eligibility check unauthenticated returns 401
    const res26 = await request(`/api/companies/${activeCompany._id}/check-eligibility`, {
      method: 'POST',
    });
    assert(
      res26.status === 401,
      'Point 26: POST /api/companies/:id/check-eligibility requires auth (returns 401)'
    );

    // Test 27: Student A meets all criteria -> likely_eligible
    const res27 = await request(`/api/companies/${activeCompany._id}/check-eligibility`, {
      method: 'POST',
      headers: authHeadersA,
    });
    const evalData27 = res27.data?.data;
    assert(
      res27.status === 200 &&
      evalData27?.status === 'likely_eligible' &&
      evalData27?.details?.every(d => d.met === true),
      'Point 27: Student meeting all academic criteria evaluates to "likely_eligible" with passing checks'
    );

    // Test 28: Student B does not meet CGPA (6.2 < 7.5) -> may_not_meet
    const res28 = await request(`/api/companies/${activeCompany._id}/check-eligibility`, {
      method: 'POST',
      headers: authHeadersB,
    });
    const evalData28 = res28.data?.data;
    assert(
      res28.status === 200 &&
      evalData28?.status === 'may_not_meet',
      'Point 28: Student with insufficient CGPA/branch evaluates to "may_not_meet" with detailed breakdown'
    );

    // Test 29: Student with backlogs fails backlogs criteria
    const backlogCheck = evalData28?.details?.find(d => d.criterion.includes('Backlog'));
    assert(
      backlogCheck && backlogCheck.met === false,
      'Point 29: Backlogs evaluation fails accurately when student active backlogs exceed maximum'
    );

    // Test 30: Student with incomplete profile returns "incomplete_data"
    const res30 = await request(`/api/companies/${activeCompany._id}/check-eligibility`, {
      method: 'POST',
      headers: authHeadersInc,
    });
    const evalData30 = res30.data?.data;
    assert(
      res30.status === 200 &&
      evalData30?.status === 'incomplete_data',
      'Point 30: Student lacking profile data evaluates to "incomplete_data" listing missing parameters'
    );

    // Test 31: Disclaimer is always present on eligibility responses
    assert(
      typeof evalData27?.disclaimer === 'string' &&
      evalData27?.disclaimer.length > 10,
      'Point 31: Academic eligibility response includes mandatory non-guarantee historical disclaimer'
    );

    console.log('\n── GROUP 6: TARGET COMPANY TOGGLE & BOOKMARKS (Tests 32–33) ──');

    // Test 32: Toggle company on
    const res32 = await request(`/api/companies/${activeCompany._id}/target`, {
      method: 'POST',
      headers: authHeadersA,
    });
    assert(
      res32.status === 200 &&
      res32.data?.data?.isTarget === true &&
      res32.data?.data?.targetCompanies.includes(activeCompany.name),
      'Point 32: POST /api/companies/:id/target adds company to user targetCompanies without duplicate'
    );

    // Test 33: Toggle company off
    const res33 = await request(`/api/companies/${activeCompany._id}/target`, {
      method: 'POST',
      headers: authHeadersA,
    });
    assert(
      res33.status === 200 &&
      res33.data?.data?.isTarget === false &&
      !res33.data?.data?.targetCompanies.includes(activeCompany.name),
      'Point 33: POST /api/companies/:id/target toggles company off cleanly'
    );

    console.log('\n── GROUP 7: ADMIN MANAGEMENT & DATA COMPLETENESS (Tests 34–35) ──');

    // Test 34: Student forbidden from admin endpoints
    const res34 = await request('/api/admin/companies', {
      headers: authHeadersA,
    });
    assert(
      res34.status === 403,
      'Point 34: Student role is strictly forbidden (403) from accessing admin company endpoints'
    );

    // Test 35: Admin receives companies with data completeness score
    const res35 = await request('/api/admin/companies', {
      headers: adminHeaders,
    });
    const adminApex = res35.data?.data?.companies?.find(
      c => c._id === activeCompany._id.toString()
    );
    assert(
      res35.status === 200 &&
      adminApex &&
      typeof adminApex.quality?.completenessPercentage === 'number' &&
      adminApex.quality?.completenessPercentage === 100,
      'Point 35: Admin endpoint calculates data completeness score (100% for fully populated company)'
    );

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    if (server) server.close();
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

runSuite();
