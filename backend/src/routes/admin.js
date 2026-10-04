import express from 'express';
import {
  getAdminDashboardStats,
  getStudents,
  getStudentById,
  updateStudentStatus,
  getAdminAptitudeQuestions,
  createAptitudeQuestion,
  getAptitudeQuestionById,
  updateAptitudeQuestion,
  updateAptitudeQuestionStatus,
  getAdminCodingProblems,
  createCodingProblem,
  getAdminCodingProblemById,
  updateCodingProblem,
  updateCodingProblemStatus,
  getAdminCompanies,
  createCompany,
  getAdminCompanyById,
  updateCompany,
  updateCompanyStatus,
  getAdminResources,
  createResource,
  getAdminResourceById,
  updateResource,
  updateResourceStatus,
  getAdminMockTests,
  createMockTest,
  getAdminMockTestById,
  updateMockTest,
  updateMockTestStatus,
  getAdminReviews,
  approveReview,
  rejectReview,
  deleteAdminReview,
  getAdminAnalytics,
} from '../controllers/adminController.js';
import protect from '../middleware/auth.js';
import { requireAdmin } from '../middleware/role.js';

const router = express.Router();

// Strict security: all admin endpoints require valid JWT AND admin role
router.use(protect, requireAdmin);

// Dashboard & Analytics
router.get('/dashboard', getAdminDashboardStats);
router.get('/analytics', getAdminAnalytics);

// Students
router.get('/students', getStudents);
router.get('/students/:id', getStudentById);
router.patch('/students/:id/status', updateStudentStatus);

// Aptitude Questions
router.get('/aptitude/questions', getAdminAptitudeQuestions);
router.post('/aptitude/questions', createAptitudeQuestion);
router.get('/aptitude/questions/:id', getAptitudeQuestionById);
router.put('/aptitude/questions/:id', updateAptitudeQuestion);
router.patch('/aptitude/questions/:id/status', updateAptitudeQuestionStatus);

// Coding Problems
router.get('/coding/problems', getAdminCodingProblems);
router.post('/coding/problems', createCodingProblem);
router.get('/coding/problems/:id', getAdminCodingProblemById);
router.put('/coding/problems/:id', updateCodingProblem);
router.patch('/coding/problems/:id/status', updateCodingProblemStatus);

// Companies
router.get('/companies', getAdminCompanies);
router.post('/companies', createCompany);
router.get('/companies/:id', getAdminCompanyById);
router.put('/companies/:id', updateCompany);
router.patch('/companies/:id/status', updateCompanyStatus);

// Study Resources
router.get('/resources', getAdminResources);
router.post('/resources', createResource);
router.get('/resources/:id', getAdminResourceById);
router.put('/resources/:id', updateResource);
router.patch('/resources/:id/status', updateResourceStatus);

// Mock Tests
router.get('/mock-tests', getAdminMockTests);
router.post('/mock-tests', createMockTest);
router.get('/mock-tests/:id', getAdminMockTestById);
router.put('/mock-tests/:id', updateMockTest);
router.patch('/mock-tests/:id/status', updateMockTestStatus);

// Reviews Moderation
router.get('/reviews', getAdminReviews);
router.patch('/reviews/:id/approve', approveReview);
router.patch('/reviews/:id/reject', rejectReview);
router.delete('/reviews/:id', deleteAdminReview);

export default router;
