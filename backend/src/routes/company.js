import express from 'express';
import { getCompanies, getCompanyById } from '../controllers/companyController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// Allow authenticated students to view company preparation tracks
router.use(protect);

router.get('/', getCompanies);
router.get('/:id', getCompanyById);

export default router;
