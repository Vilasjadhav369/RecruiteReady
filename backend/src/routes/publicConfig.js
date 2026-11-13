import { Router } from 'express';
import { isEmailVerificationRequired } from '../config/features.js';

const router = Router();

/**
 * GET /api/public-config
 * Returns public configuration flags:
 * { emailVerificationRequired } and nothing else.
 */
router.get('/public-config', (req, res) => {
  res.status(200).json({
    emailVerificationRequired: isEmailVerificationRequired(),
  });
});

export default router;
