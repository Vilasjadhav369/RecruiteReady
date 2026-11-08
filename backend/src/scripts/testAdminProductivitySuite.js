/**
 * Comprehensive Automated Verification Suite for
 * ADMIN PRODUCTIVITY 2.0 (Phases 1-66)
 *
 * Covers:
 * 1. Admin Dashboard Real Metrics & NaN Safety
 * 2. Pending Actions Breakdown & Real Health Summary
 * 3. Platform Health Diagnostics API (/api/admin/health)
 * 4. Security & Audit Trail API (/api/admin/audit-logs)
 * 5. Student Directory Filtering, Sorting, Pagination
 * 6. Safe CSV Export (No credentials, audit event logged)
 * 7. Bulk Status Mutation: Students (with Role Protection)
 * 8. Bulk Status Mutation: Aptitude Questions
 * 9. Bulk Status Mutation: Coding Problems
 * 10. Bulk Status Mutation: Companies
 * 11. Bulk Status Mutation: Study Resources
 * 12. Bulk Status Mutation: Mock Tests (Question validation)
 * 13. Bulk Moderation: Reviews (with moderatedBy / moderatedAt)
 * 14. Strict RBAC Enforcement (403 for students on all endpoints)
 * 15. AuditLog Event Creation across administrative mutations
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { assertTestDatabase, createTestSession } from './testHelpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();
assertTestDatabase();

import User from '../models/User.js';
import Session from '../models/Session.js';
import AptitudeQuestion from '../models/AptitudeQuestion.js';
import CodingProblem from '../models/CodingProblem.js';
import Company from '../models/Company.js';
import StudyMaterial from '../models/StudyMaterial.js';
import MockTest from '../models/MockTest.js';
import Review from '../models/Review.js';
import AuditLog from '../models/AuditLog.js';

import adminRoutes from '../routes/admin.js';
import { generateToken } from '../utils/jwt.js';
import errorHandler from '../middleware/errorHandler.js';

const TEST_PORT = 5009;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Mount admin router
app.use('/api/admin', adminRoutes);
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

async function runTests() {
  console.log('\n=============================================================');
  console.log('   STARTING ADMIN PRODUCTIVITY 2.0 COMPREHENSIVE TEST SUITE  ');
  console.log('=============================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/recruitready_test';
  await mongoose.connect(mongoUri);

  server = app.listen(TEST_PORT);

  try {
    // ── Setup Test Actors ──
    const timestamp = Date.now();
    const adminEmail = `admin_prod_${timestamp}@example.com`;
    const studentEmail = `student_prod_${timestamp}@example.com`;

    let testAdmin = await User.create({
      firstName: 'Admin',
      lastName: 'Productivity',
      email: adminEmail,
      password: 'SecurePass123!',
      role: 'admin',
      isActive: true,
      emailVerified: true,
    });

    let testStudent = await User.create({
      firstName: 'Student',
      lastName: 'Candidate',
      email: studentEmail,
      password: 'SecurePass123!',
      role: 'student',
      college: 'Apex Tech University',
      branch: 'Computer Science',
      graduationYear: 2026,
      cgpa: 8.8,
      backlogs: 0,
      isActive: true,
      emailVerified: true,
    });

    // Create a second student for batch tests
    let testStudent2 = await User.create({
      firstName: 'StudentTwo',
      lastName: 'CandidateTwo',
      email: `student2_prod_${timestamp}@example.com`,
      password: 'SecurePass123!',
      role: 'student',
      college: 'Premier State College',
      branch: 'Information Technology',
      graduationYear: 2025,
      cgpa: 7.9,
      backlogs: 1,
      isActive: true,
      emailVerified: false,
    });

    // Active JWT tokens for auth middleware
    const adminToken = await createTestSession(testAdmin);
    const studentToken = await createTestSession(testStudent);

    const adminHeaders = {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    };

    const studentHeaders = {
      Authorization: `Bearer ${studentToken}`,
      'Content-Type': 'application/json',
    };

    // ── SECTION 1: STRICT RBAC VERIFICATION (STUDENTS RECEIVE 403) ──
    console.log('\n--- Section 1: Strict RBAC Protection ---');

    const resDashStudent = await fetch(`${BASE_URL}/api/admin/dashboard`, { headers: studentHeaders });
    assert(resDashStudent.status === 403, 1, 'Student attempting GET /api/admin/dashboard returns 403 Forbidden');

    const resHealthStudent = await fetch(`${BASE_URL}/api/admin/health`, { headers: studentHeaders });
    assert(resHealthStudent.status === 403, 2, 'Student attempting GET /api/admin/health returns 403 Forbidden');

    const resAuditStudent = await fetch(`${BASE_URL}/api/admin/audit-logs`, { headers: studentHeaders });
    assert(resAuditStudent.status === 403, 3, 'Student attempting GET /api/admin/audit-logs returns 403 Forbidden');

    const resStudentsStudent = await fetch(`${BASE_URL}/api/admin/students`, { headers: studentHeaders });
    assert(resStudentsStudent.status === 403, 4, 'Student attempting GET /api/admin/students returns 403 Forbidden');

    const resCsvStudent = await fetch(`${BASE_URL}/api/admin/students/export-csv`, { headers: studentHeaders });
    assert(resCsvStudent.status === 403, 5, 'Student attempting GET /api/admin/students/export-csv returns 403 Forbidden');

    // ── SECTION 2: ADMIN DASHBOARD REAL METRICS & ZERO NAN ──
    console.log('\n--- Section 2: Admin Dashboard Real Metrics & NaN Safety ---');

    const resDash = await fetch(`${BASE_URL}/api/admin/dashboard`, { headers: adminHeaders });
    assert(resDash.status === 200, 6, 'Admin GET /api/admin/dashboard returns 200 OK');

    const dashData = (await resDash.json()).data;
    assert(typeof dashData.students?.total === 'number' && !isNaN(dashData.students.total), 7, 'students.total is valid number');
    assert(typeof dashData.students?.active === 'number' && !isNaN(dashData.students.active), 8, 'students.active is valid number');
    assert(typeof dashData.aptitude?.questions === 'number' && !isNaN(dashData.aptitude.questions), 9, 'aptitude.questions is valid number');
    assert(typeof dashData.coding?.problems === 'number' && !isNaN(dashData.coding.problems), 10, 'coding.problems is valid number');
    assert(typeof dashData.companies?.total === 'number' && !isNaN(dashData.companies.total), 11, 'companies.total is valid number (No NaN)');
    assert(typeof dashData.resources?.total === 'number' && !isNaN(dashData.resources.total), 12, 'resources.total is valid number');
    assert(typeof dashData.mockTests?.total === 'number' && !isNaN(dashData.mockTests.total), 13, 'mockTests.total is valid number');
    assert(typeof dashData.reviews?.total === 'number' && !isNaN(dashData.reviews.total), 14, 'reviews.total is valid number');

    assert(dashData.pendingActions !== undefined, 15, 'Dashboard returns pendingActions object');
    assert(typeof dashData.pendingActions.totalPending === 'number', 16, 'pendingActions.totalPending is valid number');
    assert(typeof dashData.pendingActions.pendingReviews === 'number', 17, 'pendingActions.pendingReviews is valid number');
    assert(typeof dashData.pendingActions.unpublishedMockTests === 'number', 18, 'pendingActions.unpublishedMockTests is valid number');

    assert(dashData.health !== undefined, 19, 'Dashboard returns health summary');
    assert(dashData.health.dbStatus === 'connected', 20, 'health.dbStatus is "connected"');
    assert(Array.isArray(dashData.activity), 21, 'Dashboard returns activity feed array');

    // ── SECTION 3: PLATFORM HEALTH DIAGNOSTICS API ──
    console.log('\n--- Section 3: Platform Health Diagnostics API ---');

    const resHealth = await fetch(`${BASE_URL}/api/admin/health`, { headers: adminHeaders });
    assert(resHealth.status === 200, 22, 'Admin GET /api/admin/health returns 200 OK');

    const healthData = (await resHealth.json()).data;
    assert(healthData.status === 'healthy', 23, 'healthData.status is healthy');
    assert(healthData.database.status === 'connected', 24, 'healthData.database.status is connected');
    assert(typeof healthData.database.pingMs === 'number' && healthData.database.pingMs >= 0, 25, 'healthData reports live ping time in ms');
    assert(typeof healthData.process.uptimeSeconds === 'number', 26, 'healthData reports node uptime in seconds');
    assert(typeof healthData.process.memory.heapUsedMb === 'number', 27, 'healthData reports heap memory in MB');
    assert(typeof healthData.collections.users === 'number', 28, 'healthData reports collection counts');

    // ── SECTION 4: SECURITY & AUDIT TRAIL API ──
    console.log('\n--- Section 4: Security & Audit Trail API ---');

    const resAudit = await fetch(`${BASE_URL}/api/admin/audit-logs`, { headers: adminHeaders });
    assert(resAudit.status === 200, 29, 'Admin GET /api/admin/audit-logs returns 200 OK');

    const auditData = (await resAudit.json()).data;
    assert(Array.isArray(auditData.logs), 30, 'auditData returns logs array');
    assert(auditData.pagination && typeof auditData.pagination.total === 'number', 31, 'auditData returns pagination metadata');
    assert(Array.isArray(auditData.filters?.availableActions), 32, 'auditData returns availableActions filter options');

    // ── SECTION 5: STUDENT MANAGEMENT, FILTERING & SORTING ──
    console.log('\n--- Section 5: Student Directory & Advanced Filters ---');

    const resStudents = await fetch(`${BASE_URL}/api/admin/students`, { headers: adminHeaders });
    assert(resStudents.status === 200, 33, 'Admin GET /api/admin/students returns 200 OK');

    const studentsData = (await resStudents.json()).data;
    assert(Array.isArray(studentsData.students), 34, 'Returns students array');
    assert(Array.isArray(studentsData.filters?.availableBranches), 35, 'Returns availableBranches filters list');
    assert(Array.isArray(studentsData.filters?.availableGraduationYears), 36, 'Returns availableGraduationYears filters list');

    // Filter by branch
    const resBranchFilter = await fetch(`${BASE_URL}/api/admin/students?branch=Computer%20Science`, { headers: adminHeaders });
    const branchFilteredData = (await resBranchFilter.json()).data;
    assert(
      branchFilteredData.students.every((s) => s.branch === 'Computer Science'),
      37,
      'Filtering by branch returns only matching students'
    );

    // Sorting
    const resSort = await fetch(`${BASE_URL}/api/admin/students?sortBy=firstName&sortOrder=asc`, { headers: adminHeaders });
    assert(resSort.status === 200, 38, 'Sorting students by firstName ascending succeeds');

    // ── SECTION 6: SAFE CSV EXPORT ──
    console.log('\n--- Section 6: Safe CSV Export ---');

    const resCsv = await fetch(`${BASE_URL}/api/admin/students/export-csv`, { headers: adminHeaders });
    assert(resCsv.status === 200, 39, 'Admin GET /api/admin/students/export-csv returns 200 OK');
    assert(resCsv.headers.get('content-type')?.includes('text/csv'), 40, 'CSV export returns text/csv content type');

    const csvText = await resCsv.text();
    assert(csvText.includes('"First Name","Last Name","Email"'), 41, 'CSV export includes proper headers');
    assert(!csvText.includes('password') && !csvText.includes('token') && !csvText.includes('hash'), 42, 'CSV strictly excludes passwords, tokens, and hashes');

    // Verify audit event was recorded for export
    const exportLog = await AuditLog.findOne({ action: 'admin_export_students_csv' });
    assert(Boolean(exportLog), 43, 'AuditLog created an entry for admin_export_students_csv');

    // ── SECTION 7: BULK MUTATIONS & ROLE PROTECTION ──
    console.log('\n--- Section 7: Bulk Status Mutations & Security Protection ---');

    // Bulk student deactivation
    const resBulkStudent = await fetch(`${BASE_URL}/api/admin/students/bulk-status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({
        ids: [testStudent._id.toString(), testStudent2._id.toString(), testAdmin._id.toString()],
        isActive: false,
      }),
    });
    assert(resBulkStudent.status === 200, 44, 'PATCH /api/admin/students/bulk-status returns 200 OK');

    const updatedAdmin = await User.findById(testAdmin._id);
    assert(updatedAdmin.isActive === true, 45, 'SECURITY: Admin account can NEVER be deactivated by bulk student status endpoint');

    const updatedStudent1 = await User.findById(testStudent._id);
    assert(updatedStudent1.isActive === false, 46, 'Target student was successfully deactivated');

    // Bulk activate them back
    await fetch(`${BASE_URL}/api/admin/students/bulk-status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({
        ids: [testStudent._id.toString(), testStudent2._id.toString()],
        isActive: true,
      }),
    });

    // ── SECTION 8: APTITUDE BULK STATUS ──
    console.log('\n--- Section 8: Aptitude Questions Bulk Status ---');

    const aptQ = await AptitudeQuestion.create({
      question: `What is the output of 2 + 2 in base 4? (${timestamp})`,
      options: [
        { key: 'A', text: '10' },
        { key: 'B', text: '4' },
        { key: 'C', text: '11' },
        { key: 'D', text: '0' },
      ],
      correctOption: 'A',
      category: 'Quantitative Aptitude',
      topic: 'Number Systems',
      difficulty: 'easy',
      explanation: 'In base 4, 4 is represented as 10.',
      isActive: true,
      createdBy: testAdmin._id,
    });

    const resBulkApt = await fetch(`${BASE_URL}/api/admin/aptitude/questions/bulk-status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ ids: [aptQ._id.toString()], isActive: false }),
    });
    assert(resBulkApt.status === 200, 47, 'PATCH /api/admin/aptitude/questions/bulk-status succeeds with 200');

    const aptReloaded = await AptitudeQuestion.findById(aptQ._id);
    assert(aptReloaded.isActive === false, 48, 'Aptitude question isActive updated to false');

    // ── SECTION 9: CODING PROBLEMS BULK STATUS ──
    console.log('\n--- Section 9: Coding Problems Bulk Status ---');

    const codeP = await CodingProblem.create({
      title: `Admin Test Problem ${timestamp}`,
      slug: `admin-test-problem-${timestamp}`,
      description: 'Problem description for bulk test',
      difficulty: 'medium',
      isActive: true,
      createdBy: testAdmin._id,
    });

    const resBulkCode = await fetch(`${BASE_URL}/api/admin/coding/problems/bulk-status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ ids: [codeP._id.toString()], isActive: false }),
    });
    assert(resBulkCode.status === 200, 49, 'PATCH /api/admin/coding/problems/bulk-status succeeds with 200');

    // ── SECTION 10: COMPANIES BULK STATUS ──
    console.log('\n--- Section 10: Companies Bulk Status ---');

    const testComp = await Company.create({
      name: `Corp ${timestamp}`,
      slug: `corp-${timestamp}`,
      isActive: true,
      createdBy: testAdmin._id,
    });

    const resBulkComp = await fetch(`${BASE_URL}/api/admin/companies/bulk-status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ ids: [testComp._id.toString()], isActive: false }),
    });
    assert(resBulkComp.status === 200, 50, 'PATCH /api/admin/companies/bulk-status succeeds with 200');

    // ── SECTION 11: STUDY RESOURCES BULK STATUS ──
    console.log('\n--- Section 11: Study Resources Bulk Status ---');

    const testRes = await StudyMaterial.create({
      title: `Resource ${timestamp}`,
      type: 'pdf',
      category: 'Operating Systems',
      topic: 'Deadlocks',
      url: 'https://example.com/deadlocks.pdf',
      isActive: true,
      uploadedBy: testAdmin._id,
    });

    const resBulkRes = await fetch(`${BASE_URL}/api/admin/resources/bulk-status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ ids: [testRes._id.toString()], isActive: false }),
    });
    assert(resBulkRes.status === 200, 51, 'PATCH /api/admin/resources/bulk-status succeeds with 200');

    // ── SECTION 12: MOCK TESTS BULK STATUS WITH QUESTION VALIDATION ──
    console.log('\n--- Section 12: Mock Test Publishing & Question Validation ---');

    // Empty mock test (0 questions)
    const emptyTest = await MockTest.create({
      title: `Empty Test ${timestamp}`,
      durationMinutes: 30,
      questions: [],
      isPublished: false,
      createdBy: testAdmin._id,
    });

    // Attempting to publish an empty mock test must fail with 400!
    const resPublishEmpty = await fetch(`${BASE_URL}/api/admin/mock-tests/bulk-status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ ids: [emptyTest._id.toString()], isPublished: true }),
    });
    assert(resPublishEmpty.status === 400, 52, 'Publishing mock test with 0 questions fails with 400 Bad Request');

    // Single publish of empty test must also fail with 400
    const resSinglePublishEmpty = await fetch(`${BASE_URL}/api/admin/mock-tests/${emptyTest._id}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ isPublished: true }),
    });
    assert(resSinglePublishEmpty.status === 400, 53, 'Single publish of empty mock test fails with 400');

    // ── SECTION 13: REVIEWS BULK MODERATION ──
    console.log('\n--- Section 13: Review Bulk Moderation ---');

    const testReview = await Review.create({
      user: testStudent._id,
      rating: 5,
      title: 'Outstanding placement preparation suite',
      comment: 'Very helpful aptitude and mock assessments.',
      status: 'pending',
    });

    const resMod = await fetch(`${BASE_URL}/api/admin/reviews/bulk-moderation`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ ids: [testReview._id.toString()], status: 'approved' }),
    });
    assert(resMod.status === 200, 54, 'PATCH /api/admin/reviews/bulk-moderation succeeds with 200');

    const modReview = await Review.findById(testReview._id);
    assert(modReview.status === 'approved', 55, 'Review status changed to approved');
    assert(Boolean(modReview.moderatedBy) && Boolean(modReview.moderatedAt), 56, 'Review records moderatedBy and moderatedAt');

    // ── Clean up test artifacts ──
    await User.deleteMany({ _id: { $in: [testAdmin._id, testStudent._id, testStudent2._id] } });
    await Session.deleteMany({ user: { $in: [testAdmin._id, testStudent._id] } });
    await AptitudeQuestion.deleteOne({ _id: aptQ._id });
    await CodingProblem.deleteOne({ _id: codeP._id });
    await Company.deleteOne({ _id: testComp._id });
    await StudyMaterial.deleteOne({ _id: testRes._id });
    await MockTest.deleteOne({ _id: emptyTest._id });
    await Review.deleteOne({ _id: testReview._id });
    await AuditLog.deleteMany({ action: { $regex: /admin_/ } });

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
  }

  console.log('\n=============================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
