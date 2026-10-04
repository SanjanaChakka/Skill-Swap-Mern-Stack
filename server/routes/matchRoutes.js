import { Router } from 'express';
import { getRecommendations } from '../controllers/matchController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(getRecommendations));

export default router;
