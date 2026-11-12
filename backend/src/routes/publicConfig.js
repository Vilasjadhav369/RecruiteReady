import { Router } from 'express';
import { isEmailVerificationRequired, isInviteCodeRequired } from '../config/features.js';

const router = Router();

/**
 * GET /api/public-config
 * Returns public configuration flags:
 * { emailVerificationRequired, inviteCodeRequired } and nothing else.
 */
router.get('/public-config', (req, res) => {
  res.status(200).json({
    emailVerificationRequired: isEmailVerificationRequired(),
    inviteCodeRequired: isInviteCodeRequired(),
  });
});

export default router;
