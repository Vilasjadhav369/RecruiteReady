import express from 'express';
import {
  getAdminDashboardStats,
  getAdminHealth,
  getAdminAuditLogs,
  getStudents,
  exportStudentsCsv,
  getStudentById,
  updateStudentStatus,
  bulkUpdateStudentStatus,
  getAdminAptitudeQuestions,
  createAptitudeQuestion,
  getAptitudeQuestionById,
  updateAptitudeQuestion,
  updateAptitudeQuestionStatus,
  bulkUpdateAptitudeStatus,
  deleteAptitudeQuestion,
  getAdminCodingProblems,
  createCodingProblem,
  getAdminCodingProblemById,
  updateCodingProblem,
  updateCodingProblemStatus,
  bulkUpdateCodingStatus,
  deleteCodingProblem,
  getAdminCompanies,
  createCompany,
  getAdminCompanyById,
  updateCompany,
  updateCompanyStatus,
  bulkUpdateCompanyStatus,
  deleteCompany,
  getAdminResources,
  createResource,
  getAdminResourceById,
  updateResource,
  updateResourceStatus,
  bulkUpdateResourceStatus,
  deleteResource,
  getAdminMockTests,
  createMockTest,
  getAdminMockTestById,
  updateMockTest,
  updateMockTestStatus,
  bulkUpdateMockTestStatus,
  deleteMockTest,
  getAdminReviews,
  approveReview,
  rejectReview,
  bulkUpdateReviewStatus,
  deleteAdminReview,
  getAdminAnalytics,
} from '../controllers/adminController.js';
import protect from '../middleware/auth.js';
import { requireAdmin } from '../middleware/role.js';

const router = express.Router();

// Strict security: all admin endpoints require valid JWT AND admin role
router.use(protect, requireAdmin);

// Dashboard, Health, Audit & Analytics
router.get('/dashboard', getAdminDashboardStats);
router.get('/health', getAdminHealth);
router.get('/audit-logs', getAdminAuditLogs);
router.get('/analytics', getAdminAnalytics);

// Students
router.get('/students/export-csv', exportStudentsCsv);
router.patch('/students/bulk-status', bulkUpdateStudentStatus);
router.get('/students', getStudents);
router.get('/students/:id', getStudentById);
router.patch('/students/:id/status', updateStudentStatus);

// Aptitude Questions
router.patch('/aptitude/questions/bulk-status', bulkUpdateAptitudeStatus);
router.get('/aptitude/questions', getAdminAptitudeQuestions);
router.post('/aptitude/questions', createAptitudeQuestion);
router.get('/aptitude/questions/:id', getAptitudeQuestionById);
router.put('/aptitude/questions/:id', updateAptitudeQuestion);
router.patch('/aptitude/questions/:id/status', updateAptitudeQuestionStatus);
router.delete('/aptitude/questions/:id', deleteAptitudeQuestion);

// Coding Problems
router.patch('/coding/problems/bulk-status', bulkUpdateCodingStatus);
router.get('/coding/problems', getAdminCodingProblems);
router.post('/coding/problems', createCodingProblem);
router.get('/coding/problems/:id', getAdminCodingProblemById);
router.put('/coding/problems/:id', updateCodingProblem);
router.patch('/coding/problems/:id/status', updateCodingProblemStatus);
router.delete('/coding/problems/:id', deleteCodingProblem);

// Companies
router.patch('/companies/bulk-status', bulkUpdateCompanyStatus);
router.get('/companies', getAdminCompanies);
router.post('/companies', createCompany);
router.get('/companies/:id', getAdminCompanyById);
router.put('/companies/:id', updateCompany);
router.patch('/companies/:id/status', updateCompanyStatus);
router.delete('/companies/:id', deleteCompany);

// Study Resources
router.patch('/resources/bulk-status', bulkUpdateResourceStatus);
router.get('/resources', getAdminResources);
router.post('/resources', createResource);
router.get('/resources/:id', getAdminResourceById);
router.put('/resources/:id', updateResource);
router.patch('/resources/:id/status', updateResourceStatus);
router.delete('/resources/:id', deleteResource);

// Mock Tests
router.patch('/mock-tests/bulk-status', bulkUpdateMockTestStatus);
router.get('/mock-tests', getAdminMockTests);
router.post('/mock-tests', createMockTest);
router.get('/mock-tests/:id', getAdminMockTestById);
router.put('/mock-tests/:id', updateMockTest);
router.patch('/mock-tests/:id/status', updateMockTestStatus);
router.delete('/mock-tests/:id', deleteMockTest);

// Reviews Moderation
router.patch('/reviews/bulk-moderation', bulkUpdateReviewStatus);
router.get('/reviews', getAdminReviews);
router.patch('/reviews/:id/approve', approveReview);
router.patch('/reviews/:id/reject', rejectReview);
router.delete('/reviews/:id', deleteAdminReview);

export default router;
