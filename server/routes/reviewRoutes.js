import { Router } from 'express';
import {
  createReview,
  getReviewsForUser,
  getMyPendingReviewTargets,
} from '../controllers/reviewController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

router.get('/pending', requireAuth, asyncHandler(getMyPendingReviewTargets));
router.post('/', requireAuth, asyncHandler(createReview));
router.get('/user/:userId', asyncHandler(getReviewsForUser));

export default router;
