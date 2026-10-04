import { Router } from 'express';
import {
  createSwapRequest,
  respondToSwap,
  getMySwaps,
  getSwap,
  getSwapSummary,
} from '../controllers/swapController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(getMySwaps));
router.post('/', requireAuth, asyncHandler(createSwapRequest));
router.get('/summary/:id', requireAuth, asyncHandler(getSwapSummary));
router.get('/:id', requireAuth, asyncHandler(getSwap));
router.post('/:id/:action', requireAuth, asyncHandler(respondToSwap));

export default router;
