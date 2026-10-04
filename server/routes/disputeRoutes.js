import { Router } from 'express';
import { createDispute, getMyDisputes, getDispute } from '../controllers/disputeController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(getMyDisputes));
router.post('/', requireAuth, asyncHandler(createDispute));
router.get('/:id', requireAuth, asyncHandler(getDispute));

export default router;
