import express from 'express';
import {
  getCompanies,
  getCompanyById,
  getCompanyPreparation,
  getCompanyProgress,
  updateCompanyProgress,
  checkStudentEligibility,
  toggleTargetCompany,
} from '../controllers/companyController.js';
import protect, { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Publicly browseable company tracks (with optional user personalization)
router.get('/', optionalAuth, getCompanies);
router.get('/:id', optionalAuth, getCompanyById);

// Authenticated student preparation and interactive actions
router.get('/:id/preparation', protect, getCompanyPreparation);
router.get('/:id/progress', protect, getCompanyProgress);
router.patch('/:id/progress', protect, updateCompanyProgress);
router.post('/:id/target', protect, toggleTargetCompany);
router.post('/:id/check-eligibility', protect, checkStudentEligibility);

export default router;

