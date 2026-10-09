/**
 * Comprehensive Automated Verification Suite for
 * GLOBAL SEARCH, BOOKMARKS / SAVED CONTENT, NOTIFICATIONS, and CONTINUE PREPARATION
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
import StudyMaterial from '../models/StudyMaterial.js';
import MockTest from '../models/MockTest.js';
import MockTestAttempt from '../models/MockTestAttempt.js';
import AptitudeQuestion from '../models/AptitudeQuestion.js';
import AptitudeAttempt from '../models/AptitudeAttempt.js';
import Bookmark from '../models/Bookmark.js';
import Notification from '../models/Notification.js';

import searchRoutes from '../routes/search.js';
import bookmarkRoutes from '../routes/bookmark.js';
import notificationRoutes from '../routes/notification.js';
import dashboardRoutes from '../routes/dashboard.js';
import { generateToken } from '../utils/jwt.js';
import errorHandler from '../middleware/errorHandler.js';
import notificationService from '../services/notificationService.js';

const TEST_PORT = 5004;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

const app = express();
app.use(helmet({ contentSecurityPolicy: false, frameguard: { action: 'deny' } }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Mount routers
app.use('/api/search', searchRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
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

async function runSuite() {
  console.log('\n===============================================================');
  console.log('  RECRUITEREADY USABILITY TEST SUITE (SEARCH, BOOKMARKS, NOTIF, CONTINUE)');
  console.log('===============================================================\n');

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/recruiteready';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB:', mongoUri);

    server = app.listen(TEST_PORT, () => {
      console.log(`Test server running on port ${TEST_PORT}\n`);
    });

    // Cleanup existing test artifacts
    await User.deleteMany({ email: { $in: ['test_usability_a@example.com', 'test_usability_b@example.com'] } });
    await Bookmark.deleteMany({});
    await Notification.deleteMany({ title: /\[UsabilityTest\]/ });

    // Seed test users
    const studentA = await User.create({
      firstName: 'Usability',
      lastName: 'TesterA',
      email: 'test_usability_a@example.com',
      password: 'Password123!@#',
      role: 'student',
      isActive: true,
      emailVerified: true,
      onboardingCompleted: true,
    });

    const studentB = await User.create({
      firstName: 'Usability',
      lastName: 'TesterB',
      email: 'test_usability_b@example.com',
      password: 'Password123!@#',
      role: 'student',
      isActive: true,
      emailVerified: true,
      onboardingCompleted: true,
    });

    // Create session & JWT for Student A
    const sessionA = await Session.create({
      user: studentA._id,
      tokenHash: 'test_hash_usability_a',
      userAgent: 'UsabilityTestAgent',
      ipAddress: '127.0.0.1',
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
    });
    const tokenA = generateToken(studentA, sessionA._id);

    // Create session & JWT for Student B
    const sessionB = await Session.create({
      user: studentB._id,
      tokenHash: 'test_hash_usability_b',
      userAgent: 'UsabilityTestAgent',
      ipAddress: '127.0.0.1',
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
    });
    const tokenB = generateToken(studentB, sessionB._id);

    // Seed test content (Company, CodingProblem, StudyMaterial, MockTest)
    const testCompany = await Company.findOneAndUpdate(
      { slug: 'usability-corp-tech' },
      {
        name: 'Usability Corp Technologies',
        slug: 'usability-corp-tech',
        industry: 'Software Engineering',
        description: 'Global tech firm focused on enterprise solutions',
        isActive: true,
      },
      { upsert: true, returnDocument: 'after' }
    );

    const testCodingProblem = await CodingProblem.findOneAndUpdate(
      { slug: 'usability-reverse-string-test' },
      {
        title: 'Usability Reverse String Problem',
        slug: 'usability-reverse-string-test',
        difficulty: 'easy',
        category: 'Strings',
        description: 'Given a string, reverse it.',
        isActive: true,
        testCases: [
          { input: 'hello', output: 'olleh', isHidden: false },
          { input: 'secret', output: 'terces', isHidden: true },
        ],
      },
      { upsert: true, returnDocument: 'after' }
    );

    const testStudyMaterial = await StudyMaterial.findOneAndUpdate(
      { title: 'Usability Algorithms Guide' },
      {
        title: 'Usability Algorithms Guide',
        category: 'Computer Science',
        topic: 'Data Structures',
        type: 'article',
        description: 'A comprehensive study guide on tree algorithms',
        url: 'https://example.com/algorithms-guide',
        isActive: true,
      },
      { upsert: true, returnDocument: 'after' }
    );

    const testMockTest = await MockTest.findOneAndUpdate(
      { title: 'Usability Full Placement Mock' },
      {
        title: 'Usability Full Placement Mock',
        durationMinutes: 45,
        totalQuestions: 20,
        categories: ['Quantitative Aptitude', 'Technical'],
        difficulty: 'medium',
        isPublished: true,
      },
      { upsert: true, returnDocument: 'after' }
    );

    // ==========================================
    // PART 1: GLOBAL SEARCH VERIFICATION
    // ==========================================
    console.log('--- PART 1: GLOBAL SEARCH ---');

    // Test 1: Empty search query returns clean empty structure
    const resEmptySearch = await fetch(`${BASE_URL}/api/search?q=`, { method: 'GET' });
    const jsonEmptySearch = await resEmptySearch.json();
    assert(
      resEmptySearch.status === 200 &&
        jsonEmptySearch.data?.totalResults === 0 &&
        Array.isArray(jsonEmptySearch.data?.companies),
      1,
      'GET /api/search with empty query returns 200 with zero results structure'
    );

    // Test 2: Search query over 100 characters rejected
    const longQ = 'a'.repeat(101);
    const resLongSearch = await fetch(`${BASE_URL}/api/search?q=${longQ}`, { method: 'GET' });
    assert(resLongSearch.status === 400, 2, 'GET /api/search rejects queries over 100 characters with 400');

    // Test 3: Search finds active company by keyword
    const resCompSearch = await fetch(`${BASE_URL}/api/search?q=Usability`, { method: 'GET' });
    const jsonCompSearch = await resCompSearch.json();
    const hasCompany = jsonCompSearch.data?.companies?.some((c) => c.id === testCompany._id.toString());
    assert(
      resCompSearch.status === 200 && hasCompany,
      3,
      'GET /api/search successfully matches real active company'
    );

    // Test 4: Search finds coding problem and does NOT leak hidden test cases
    const hasCoding = jsonCompSearch.data?.coding?.some((cp) => cp.id === testCodingProblem._id.toString());
    const codingFound = jsonCompSearch.data?.coding?.find((cp) => cp.id === testCodingProblem._id.toString());
    assert(
      hasCoding && codingFound.testCases === undefined,
      4,
      'GET /api/search finds coding problem without leaking hidden test cases'
    );

    // Test 5: Search finds study material and mock test
    const hasResource = jsonCompSearch.data?.resources?.some((r) => r.id === testStudyMaterial._id.toString());
    const hasMock = jsonCompSearch.data?.mockTests?.some((m) => m.id === testMockTest._id.toString());
    assert(
      hasResource && hasMock,
      5,
      'GET /api/search finds real active study materials and published mock tests'
    );

    // ==========================================
    // PART 2: BOOKMARKS / SAVED CONTENT
    // ==========================================
    console.log('\n--- PART 2: BOOKMARKS / SAVED CONTENT ---');

    // Test 6: Unauthenticated request rejected with 401
    const resUnauthBm = await fetch(`${BASE_URL}/api/bookmarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemType: 'company', itemId: testCompany._id }),
    });
    assert(resUnauthBm.status === 401, 6, 'POST /api/bookmarks without authentication returns 401');

    // Test 7: Invalid itemType rejected with 400
    const resInvalidType = await fetch(`${BASE_URL}/api/bookmarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ itemType: 'invalid_type', itemId: testCompany._id }),
    });
    assert(resInvalidType.status === 400, 7, 'POST /api/bookmarks rejects invalid itemType with 400');

    // Test 8: Nonexistent item rejected with 404
    const fakeId = new mongoose.Types.ObjectId();
    const resNotFoundItem = await fetch(`${BASE_URL}/api/bookmarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ itemType: 'company', itemId: fakeId }),
    });
    assert(resNotFoundItem.status === 404, 8, 'POST /api/bookmarks rejects nonexistent item with 404');

    // Test 9: Successfully bookmark Company for Student A
    const resAddBmComp = await fetch(`${BASE_URL}/api/bookmarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ itemType: 'company', itemId: testCompany._id }),
    });
    const jsonAddBmComp = await resAddBmComp.json();
    assert(
      resAddBmComp.status === 201 && jsonAddBmComp.isBookmarked === true,
      9,
      'POST /api/bookmarks successfully bookmarks Company for Student A'
    );

    // Test 10: Status endpoint returns true for bookmarked item
    const resStatusComp = await fetch(`${BASE_URL}/api/bookmarks/status/company/${testCompany._id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const jsonStatusComp = await resStatusComp.json();
    assert(
      resStatusComp.status === 200 && jsonStatusComp.isBookmarked === true,
      10,
      'GET /api/bookmarks/status/company/:id returns isBookmarked: true'
    );

    // Test 11: Bookmark toggle removes bookmark when called again
    const resToggleOff = await fetch(`${BASE_URL}/api/bookmarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ itemType: 'company', itemId: testCompany._id }),
    });
    const jsonToggleOff = await resToggleOff.json();
    assert(
      resToggleOff.status === 200 && jsonToggleOff.isBookmarked === false,
      11,
      'POST /api/bookmarks toggles off bookmark when already saved'
    );

    // Test 12: Re-save Company and add Coding Problem, Study Material, Mock Test
    await fetch(`${BASE_URL}/api/bookmarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ itemType: 'company', itemId: testCompany._id }),
    });
    await fetch(`${BASE_URL}/api/bookmarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ itemType: 'coding_problem', itemId: testCodingProblem._id }),
    });
    await fetch(`${BASE_URL}/api/bookmarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ itemType: 'study_material', itemId: testStudyMaterial._id }),
    });
    await fetch(`${BASE_URL}/api/bookmarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ itemType: 'mock_test', itemId: testMockTest._id }),
    });

    const resListBm = await fetch(`${BASE_URL}/api/bookmarks`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const jsonListBm = await resListBm.json();
    assert(
      resListBm.status === 200 &&
        jsonListBm.data?.counts?.all === 4 &&
        jsonListBm.data?.counts?.company === 1 &&
        jsonListBm.data?.counts?.coding_problem === 1 &&
        jsonListBm.data?.counts?.study_material === 1 &&
        jsonListBm.data?.counts?.mock_test === 1,
      12,
      'GET /api/bookmarks returns all 4 saved items with exact category counts'
    );

    // Test 13: Category filter returns only items of that category
    const resFilterCoding = await fetch(`${BASE_URL}/api/bookmarks?itemType=coding_problem`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const jsonFilterCoding = await resFilterCoding.json();
    assert(
      jsonFilterCoding.data?.items?.length === 1 &&
        jsonFilterCoding.data?.items[0]?.itemType === 'coding_problem',
      13,
      'GET /api/bookmarks?itemType=coding_problem filters items accurately'
    );

    // Test 14: DELETE /api/bookmarks/:itemType/:itemId removes bookmark
    const resDelBm = await fetch(
      `${BASE_URL}/api/bookmarks/coding_problem/${testCodingProblem._id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenA}` },
      }
    );
    const jsonDelBm = await resDelBm.json();
    assert(
      resDelBm.status === 200 && jsonDelBm.isBookmarked === false,
      14,
      'DELETE /api/bookmarks/:itemType/:itemId removes bookmark successfully'
    );

    // Test 15: Student isolation: Student B has 0 bookmarks
    const resListBmB = await fetch(`${BASE_URL}/api/bookmarks`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const jsonListBmB = await resListBmB.json();
    assert(
      jsonListBmB.data?.counts?.all === 0 && jsonListBmB.data?.items?.length === 0,
      15,
      'User isolation verified: Student B does not see Student A bookmarks'
    );

    // ==========================================
    // PART 3: NOTIFICATIONS
    // ==========================================
    console.log('\n--- PART 3: NOTIFICATIONS ---');

    // Test 16: Unauthenticated request rejected
    const resUnauthNotif = await fetch(`${BASE_URL}/api/notifications`, { method: 'GET' });
    assert(resUnauthNotif.status === 401, 16, 'GET /api/notifications without auth returns 401');

    // Test 17: Create notifications for Student A using notificationService
    const notif1 = await notificationService.createNotification({
      recipient: studentA._id,
      type: 'security_alert',
      title: '[UsabilityTest] New Login Detected',
      message: 'A new session was initiated from IP 127.0.0.1.',
      link: '/profile',
    });

    const notif2 = await notificationService.createNotification({
      recipient: studentA._id,
      type: 'new_mock_test',
      title: '[UsabilityTest] New Mock Assessment',
      message: 'Usability Full Placement Mock is live.',
      link: `/mock-tests/${testMockTest._id}`,
    });

    const resUnread = await fetch(`${BASE_URL}/api/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const jsonUnread = await resUnread.json();
    assert(
      resUnread.status === 200 && jsonUnread.data?.unreadCount >= 2,
      17,
      'GET /api/notifications/unread-count returns accurate real unread count'
    );

    // Test 18: List notifications returns sorted items
    const resListNotif = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const jsonListNotif = await resListNotif.json();
    assert(
      resListNotif.status === 200 &&
        jsonListNotif.data?.items?.length >= 2 &&
        jsonListNotif.data?.items[0].isRead === false,
      18,
      'GET /api/notifications returns list of unread notifications'
    );

    // Test 19: Mark single notification as read
    const resMarkRead = await fetch(`${BASE_URL}/api/notifications/${notif1._id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const jsonMarkRead = await resMarkRead.json();
    assert(
      resMarkRead.status === 200 && jsonMarkRead.data?.notification?.isRead === true,
      19,
      'PATCH /api/notifications/:id/read marks single notification as read'
    );

    // Test 20: Mark all notifications as read
    const resMarkAll = await fetch(`${BASE_URL}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const resUnreadAfter = await fetch(`${BASE_URL}/api/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const jsonUnreadAfter = await resUnreadAfter.json();
    assert(
      resMarkAll.status === 200 && jsonUnreadAfter.data?.unreadCount === 0,
      20,
      'PATCH /api/notifications/read-all clears all unread notifications to 0'
    );

    // Test 21: Student B cannot mark Student A notification as read
    const resBMarkA = await fetch(`${BASE_URL}/api/notifications/${notif2._id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(
      resBMarkA.status === 404,
      21,
      'User isolation verified: Student B cannot mark Student A notification as read'
    );

    // Test 22: Delete notification
    const resDelNotif = await fetch(`${BASE_URL}/api/notifications/${notif1._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resDelNotif.status === 200, 22, 'DELETE /api/notifications/:id deletes notification');

    // ==========================================
    // PART 4: CONTINUE PREPARATION
    // ==========================================
    console.log('\n--- PART 4: CONTINUE PREPARATION ---');

    // Test 23: When no active attempts exist, continueActivity is null
    const resDashClean = await fetch(`${BASE_URL}/api/dashboard/summary`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const jsonDashClean = await resDashClean.json();
    assert(
      resDashClean.status === 200 && jsonDashClean.data?.continueActivity === null,
      23,
      'GET /api/dashboard/summary returns null continueActivity when no active session exists'
    );

    // Test 24: When in-progress Mock Test attempt exists, continueActivity returns mock_test
    const mockAttempt = await MockTestAttempt.create({
      user: studentA._id,
      mockTest: testMockTest._id,
      status: 'in_progress',
      totalQuestions: 20,
      timeLimitSeconds: 45 * 60,
      answers: [{ questionId: new mongoose.Types.ObjectId(), selectedOption: 'A' }],
      createdAt: new Date(),
    });

    const resDashMock = await fetch(`${BASE_URL}/api/dashboard/summary`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const jsonDashMock = await resDashMock.json();
    const contMock = jsonDashMock.data?.continueActivity;
    assert(
      contMock?.type === 'mock_test' &&
        contMock?.actionLink === `/mock-tests/session/${mockAttempt._id}` &&
        contMock?.actionText === 'Resume Test',
      24,
      'GET /api/dashboard/summary picks in-progress Mock Test with accurate resume link'
    );

    // Test 25: When in-progress Aptitude attempt exists, continueActivity picks aptitude session
    await MockTestAttempt.deleteOne({ _id: mockAttempt._id });

    const aptAttempt = await AptitudeAttempt.create({
      user: studentA._id,
      category: 'Quantitative',
      topic: 'Percentages',
      status: 'in_progress',
      totalQuestions: 10,
      timeLimitSeconds: 15 * 60,
      answers: [],
      createdAt: new Date(),
    });

    const resDashApt = await fetch(`${BASE_URL}/api/dashboard/summary`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const jsonDashApt = await resDashApt.json();
    const contApt = jsonDashApt.data?.continueActivity;
    assert(
      contApt?.type === 'aptitude' &&
        contApt?.actionLink === `/aptitude/session/${aptAttempt._id}` &&
        contApt?.actionText === 'Resume Practice',
      25,
      'GET /api/dashboard/summary picks in-progress Aptitude attempt with accurate resume link'
    );

    // Cleanup
    await AptitudeAttempt.deleteOne({ _id: aptAttempt._id });
    await User.deleteMany({ email: { $in: ['test_usability_a@example.com', 'test_usability_b@example.com'] } });
    await Session.deleteMany({ user: { $in: [studentA._id, studentB._id] } });
    await Bookmark.deleteMany({ user: { $in: [studentA._id, studentB._id] } });
    await Notification.deleteMany({ recipient: { $in: [studentA._id, studentB._id] } });

    console.log('\n===============================================================');
    console.log(`  ALL CRITERIA VERIFIED: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================\n');

    server.close();
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test Suite encountered unhandled fatal error:', err);
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
}

runSuite();
