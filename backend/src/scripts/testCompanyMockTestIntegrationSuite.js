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
import Company from '../models/Company.js';
import MockTest from '../models/MockTest.js';
import MockTestAttempt from '../models/MockTestAttempt.js';
import AptitudeQuestion from '../models/AptitudeQuestion.js';
import CompanyPreparationProgress from '../models/CompanyPreparationProgress.js';

import adminRoutes from '../routes/admin.js';
import companyRoutes from '../routes/company.js';
import mockTestRoutes from '../routes/mockTest.js';
import errorHandler from '../middleware/errorHandler.js';
import { generateToken } from '../utils/jwt.js';

const TEST_PORT = 5027;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

const app = express();
app.use(helmet({ contentSecurityPolicy: false, frameguard: { action: 'deny' } }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/admin', adminRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/mock-tests', mockTestRoutes);
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
    body: options.body !== undefined ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch (err) {
    data = null;
  }
  return { status: res.status, data };
}

async function runCompanyMockTestIntegrationSuite() {
  console.log('\n===============================================================');
  console.log(' P1.5 STEP 3: COMPANY-SPECIFIC MOCK TEST INTEGRATION SUITE');
  console.log('===============================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/recruiteready';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.\n');

  server = app.listen(TEST_PORT, '127.0.0.1');

  const timestamp = Date.now();

  try {
    // ── 1. Create Test Users ──
    const studentUser = await User.create({
      firstName: 'MockStudent',
      lastName: 'PrepUser',
      email: `mockstudent_${timestamp}@example.com`,
      password: 'StudentPassword123!',
      role: 'student',
      isActive: true,
      emailVerified: true,
      graduationYear: 2026,
      branch: 'Computer Science',
      cgpa: 8.5,
      backlogs: 0,
      targetCompanies: [],
    });
    const studentToken = generateToken(studentUser);
    const studentHeaders = { Authorization: `Bearer ${studentToken}` };

    const adminUser = await User.create({
      firstName: 'MockAdmin',
      lastName: 'Superuser',
      email: `mockadmin_${timestamp}@example.com`,
      password: 'AdminPassword123!',
      role: 'admin',
      isActive: true,
      emailVerified: true,
    });
    const adminToken = generateToken(adminUser);
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // ── 2. Create Active & Inactive Companies ──
    const activeCompany = await Company.create({
      name: `Acme Corp ${timestamp}`,
      slug: `acme-corp-${timestamp}`,
      description: 'Leading technology consulting firm',
      industry: 'Technology',
      roles: ['Software Engineer'],
      aptitudeTopics: ['Time and Work'],
      codingTopics: ['Arrays'],
      interviewTopics: ['Data Structures'],
      resources: [{ title: 'Prep Guide', url: 'https://example.com/guide', type: 'article' }],
      isActive: true,
    });

    const emptyPrepCompany = await Company.create({
      name: `Beta Labs ${timestamp}`,
      slug: `beta-labs-${timestamp}`,
      description: 'Research oriented development company',
      industry: 'Technology',
      roles: ['Researcher'],
      aptitudeTopics: ['Probability'],
      codingTopics: ['Strings'],
      interviewTopics: ['Algorithms'],
      resources: [],
      isActive: true,
    });

    const inactiveCompany = await Company.create({
      name: `Ghost Corp ${timestamp}`,
      slug: `ghost-corp-${timestamp}`,
      description: 'Deactivated firm',
      industry: 'Consulting',
      isActive: false,
    });

    // ── 3. Create Sample Aptitude Question for Test Composition ──
    const aptQ = await AptitudeQuestion.create({
      question: `What is 15 * 4 in ${timestamp}?`,
      options: [
        { key: 'A', text: '50' },
        { key: 'B', text: '60' },
        { key: 'C', text: '70' },
        { key: 'D', text: '80' },
      ],
      correctOption: 'B',
      category: 'Quantitative Aptitude',
      topic: 'Time and Work',
      difficulty: 'medium',
      explanation: '15 * 4 = 60.',
      isActive: true,
    });

    // ── SECTION 1: GENERIC MOCK TEST BACKWARD COMPATIBILITY ──
    console.log('--- SECTION 1: Generic Mock Test Backward Compatibility ---');

    const genericTest = await MockTest.create({
      title: `Generic Assessment ${timestamp}`,
      description: 'Platform wide mock assessment',
      durationMinutes: 45,
      difficulty: 'medium',
      categories: ['Quantitative Aptitude'],
      instructions: 'Standard instructions',
      questions: [
        {
          questionType: 'aptitude',
          questionId: aptQ._id,
          questionTypeRef: 'AptitudeQuestion',
          marks: 1,
        },
      ],
      isPublished: true,
      company: null,
    });

    assert(genericTest.company === null, 'Generic mock test company defaults cleanly to null');

    const genericListRes = await request('/api/mock-tests', { headers: studentHeaders });
    assert(genericListRes.status === 200, 'GET /api/mock-tests returns 200 OK');
    const hasGeneric = genericListRes.data?.data?.mockTests?.some((t) => t._id === genericTest._id.toString());
    assert(hasGeneric, 'Generic mock test appears in standard mock-test directory');

    const filteredGenericRes = await request('/api/mock-tests?company=generic', { headers: studentHeaders });
    assert(filteredGenericRes.status === 200, 'GET /api/mock-tests?company=generic returns 200 OK');
    const allFilteredAreGeneric = filteredGenericRes.data?.data?.mockTests?.every((t) => t.company === null);
    assert(allFilteredAreGeneric, 'company=generic query returns exclusively generic mock tests');

    // ── SECTION 2: ADMIN COMPANY ASSIGNMENT & VALIDATION ──
    console.log('\n--- SECTION 2: Admin Company Assignment & Validation ---');

    // 2.1 Student forbidden
    const forbiddenCreateRes = await request('/api/admin/mock-tests', {
      method: 'POST',
      headers: studentHeaders,
      body: {
        title: 'Unauthorized Test',
        durationMinutes: 30,
        company: activeCompany._id.toString(),
      },
    });
    assert(forbiddenCreateRes.status === 403, 'RBAC: Student cannot create mock test (403 Forbidden)');

    // 2.2 Invalid ObjectId rejected
    const invalidIdRes = await request('/api/admin/mock-tests', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        title: 'Bad ID Test',
        durationMinutes: 30,
        company: 'not-a-valid-mongo-id',
      },
    });
    assert(invalidIdRes.status === 400, 'Invalid company ObjectId rejected with 400 Bad Request');

    // 2.3 Nonexistent company rejected
    const nonExistentCompanyId = new mongoose.Types.ObjectId().toString();
    const nonExistentRes = await request('/api/admin/mock-tests', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        title: 'Nonexistent Company Test',
        durationMinutes: 30,
        company: nonExistentCompanyId,
      },
    });
    assert(nonExistentRes.status === 400, 'Nonexistent company rejected with 400 Bad Request');

    // 2.4 Create valid company-specific test
    const validCreateRes = await request('/api/admin/mock-tests', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        title: `Acme Placement Mock ${timestamp}`,
        description: 'Targeted assessment for Acme Corp recruitment drive',
        durationMinutes: 60,
        difficulty: 'medium',
        categories: ['Quantitative Aptitude'],
        instructions: 'Test instructions',
        questions: [
          {
            questionType: 'aptitude',
            questionId: aptQ._id.toString(),
            questionTypeRef: 'AptitudeQuestion',
            marks: 1,
          },
        ],
        isPublished: true,
        company: activeCompany._id.toString(),
      },
    });
    assert(validCreateRes.status === 201, 'POST /api/admin/mock-tests creates company mock test (201 Created)');
    const companyTestId = validCreateRes.data?.data?.mockTest?._id;
    assert(validCreateRes.data?.data?.mockTest?.company?._id === activeCompany._id.toString(), 'Company reference persisted and populated in admin response');

    // 2.5 Draft test creation does not silently publish
    const draftCreateRes = await request('/api/admin/mock-tests', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        title: `Acme Draft Mock ${timestamp}`,
        durationMinutes: 30,
        isPublished: false,
        company: activeCompany._id.toString(),
        questions: [
          {
            questionType: 'aptitude',
            questionId: aptQ._id.toString(),
            questionTypeRef: 'AptitudeQuestion',
            marks: 1,
          },
        ],
      },
    });
    assert(draftCreateRes.status === 201, 'Draft company test created (201 Created)');
    const draftTestId = draftCreateRes.data?.data?.mockTest?._id;
    assert(draftCreateRes.data?.data?.mockTest?.isPublished === false, 'Company assignment does NOT silently publish draft test');

    // 2.6 Reassignment and clearing
    const clearCompanyRes = await request(`/api/admin/mock-tests/${companyTestId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: {
        company: null,
      },
    });
    assert(clearCompanyRes.status === 200, 'PUT /api/admin/mock-tests/:id accepts company: null');
    assert(clearCompanyRes.data?.data?.mockTest?.company === null, 'Mock test returned to generic status when company is cleared');

    // Reassign back to activeCompany
    await request(`/api/admin/mock-tests/${companyTestId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: {
        company: activeCompany._id.toString(),
      },
    });

    // ── SECTION 3: COMPANY ROADMAP DISPLAY & EMPTY STATES ──
    console.log('\n--- SECTION 3: Company Roadmap Display & Empty States ---');

    // 3.1 Company with 0 mock tests
    const emptyPrepRes = await request(`/api/companies/${emptyPrepCompany._id}/preparation`, {
      headers: studentHeaders,
    });
    assert(emptyPrepRes.status === 200, 'GET /api/companies/:id/preparation succeeds for company with 0 mock tests');
    assert(emptyPrepRes.data?.data?.sections?.mockTests?.total === 0, 'Sections.mockTests.total is 0 when no mock tests exist');
    assert(Array.isArray(emptyPrepRes.data?.data?.sections?.mockTests?.items) && emptyPrepRes.data?.data?.sections?.mockTests?.items.length === 0, 'Sections.mockTests.items is empty array');
    const hasMockStepWhenEmpty = emptyPrepRes.data?.data?.roadmap?.some((s) => s.id === 'mock-tests');
    assert(!hasMockStepWhenEmpty, 'Roadmap omits mock-tests step when 0 company tests exist');

    // 3.2 Company with published mock test
    const companyPrepRes = await request(`/api/companies/${activeCompany._id}/preparation`, {
      headers: studentHeaders,
    });
    assert(companyPrepRes.status === 200, 'GET /api/companies/:id/preparation returns 200 for active company');
    assert(companyPrepRes.data?.data?.sections?.mockTests?.total === 1, 'Sections.mockTests reflects 1 published test');
    const mockStep = companyPrepRes.data?.data?.roadmap?.find((s) => s.id === 'mock-tests');
    assert(mockStep !== undefined, 'Roadmap includes dedicated "mock-tests" step');
    assert(mockStep?.actionUrl === '#company-mock-tests', 'Roadmap step provides correct in-page anchor (#company-mock-tests)');

    // 3.3 Draft test strictly excluded from student roadmap
    const prepTestIds = companyPrepRes.data?.data?.sections?.mockTests?.items?.map((t) => t._id);
    assert(!prepTestIds.includes(draftTestId), 'Draft/unpublished mock test is strictly excluded from student company roadmap');

    // 3.4 Data protection & security: Sensitive fields not leaked
    const roadmapTestItem = companyPrepRes.data?.data?.sections?.mockTests?.items?.[0];
    assert(roadmapTestItem?.correctOption === undefined, 'SECURITY: correctOption is strictly hidden from roadmap response');
    assert(roadmapTestItem?.explanation === undefined, 'SECURITY: explanation is strictly hidden from roadmap response');
    assert(roadmapTestItem?.questions === undefined, 'SECURITY: questions array is not exposed in roadmap listing');

    // ── SECTION 4: INACTIVE COMPANY HANDLING ──
    console.log('\n--- SECTION 4: Inactive Company Handling ---');

    // 4.1 Inactive company preparation returns 404
    const inactivePrepRes = await request(`/api/companies/${inactiveCompany._id}/preparation`, {
      headers: studentHeaders,
    });
    assert(inactivePrepRes.status === 404, 'Inactive company preparation endpoint returns 404 Not Found to students');

    // 4.2 Test assigned to inactive company does not expose inactive company branding
    const inactiveTest = await MockTest.create({
      title: `Inactive Company Mock ${timestamp}`,
      durationMinutes: 30,
      isPublished: true,
      company: inactiveCompany._id,
    });

    const inactiveFilterRes = await request(`/api/mock-tests?company=${inactiveCompany._id}`, {
      headers: studentHeaders,
    });
    assert(inactiveFilterRes.status === 200, 'GET /api/mock-tests?company=<inactiveId> returns 200');
    assert(inactiveFilterRes.data?.data?.mockTests?.length === 0, 'Querying tests for inactive company returns empty set');

    const publicListRes = await request('/api/mock-tests', { headers: studentHeaders });
    const fetchedInactiveTest = publicListRes.data?.data?.mockTests?.find((t) => t._id === inactiveTest._id.toString());
    assert(fetchedInactiveTest?.company === null, 'Test referencing inactive company sanitizes company to null in student directory');

    // ── SECTION 5: ATTEMPT STATUS & PROGRESS MATHEMATICS ──
    console.log('\n--- SECTION 5: Attempt Status & Progress Mathematics ---');

    // 5.1 Initial status is not_started, uncompleted
    assert(roadmapTestItem?.attemptStatus === 'not_started', 'Unattempted mock test has attemptStatus: "not_started"');
    assert(roadmapTestItem?.isCompleted === false, 'Unattempted mock test has isCompleted: false');

    // 5.2 In-progress attempt does NOT count as completion
    const inProgressAttempt = await MockTestAttempt.create({
      user: studentUser._id,
      mockTest: companyTestId,
      status: 'in_progress',
      totalQuestions: 1,
      startedAt: new Date(),
      timeLimitSeconds: 3600,
      questionSnapshots: [],
      answers: [],
    });

    const inProgressPrepRes = await request(`/api/companies/${activeCompany._id}/preparation`, {
      headers: studentHeaders,
    });
    const inProgressItem = inProgressPrepRes.data?.data?.sections?.mockTests?.items?.find((t) => t._id === companyTestId);
    assert(inProgressItem?.attemptStatus === 'in_progress', 'Live attempt reflects attemptStatus: "in_progress"');
    assert(inProgressItem?.isCompleted === false, 'In-progress attempt does NOT prematurely count as completed');

    // 5.3 Expired attempt does NOT count as successful completion
    inProgressAttempt.status = 'expired';
    await inProgressAttempt.save();

    const expiredPrepRes = await request(`/api/companies/${activeCompany._id}/preparation`, {
      headers: studentHeaders,
    });
    const expiredItem = expiredPrepRes.data?.data?.sections?.mockTests?.items?.find((t) => t._id === companyTestId);
    assert(expiredItem?.attemptStatus === 'expired', 'Expired attempt reflects attemptStatus: "expired"');
    assert(expiredItem?.isCompleted === false, 'Expired attempt is NOT treated as completed');

    // 5.4 Submitted attempt counts as verified completion and updates progress math
    inProgressAttempt.status = 'submitted';
    inProgressAttempt.score = 1;
    inProgressAttempt.percentage = 100;
    inProgressAttempt.submittedAt = new Date();
    await inProgressAttempt.save();

    const submittedPrepRes = await request(`/api/companies/${activeCompany._id}/preparation`, {
      headers: studentHeaders,
    });
    const submittedItem = submittedPrepRes.data?.data?.sections?.mockTests?.items?.find((t) => t._id === companyTestId);
    assert(submittedItem?.attemptStatus === 'submitted', 'Submitted attempt reflects attemptStatus: "submitted"');
    assert(submittedItem?.isCompleted === true, 'Submitted attempt marks isCompleted: true');
    assert(submittedItem?.verifiedByActivity === true, 'Submitted attempt sets verifiedByActivity: true');
    assert(submittedItem?.percentage === 100, 'Score percentage (100%) exposed accurately');

    // Verify progress math
    const progress = submittedPrepRes.data?.data?.studentProgress;
    assert(progress.completedItems >= 1, 'Completed mock test increments completedItems count');
    assert(typeof progress.percentage === 'number' && progress.percentage > 0, 'Progress percentage mathematically incorporates mock test completion');

    // Cleanup
    await User.deleteMany({ _id: { $in: [studentUser._id, adminUser._id] } });
    await Company.deleteMany({ _id: { $in: [activeCompany._id, emptyPrepCompany._id, inactiveCompany._id] } });
    await MockTest.deleteMany({ _id: { $in: [genericTest._id, companyTestId, draftTestId, inactiveTest._id] } });
    await MockTestAttempt.deleteMany({ _id: inProgressAttempt._id });
    await AptitudeQuestion.deleteOne({ _id: aptQ._id });

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

runCompanyMockTestIntegrationSuite();
