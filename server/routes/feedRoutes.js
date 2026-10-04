import { Router } from 'express';
import { getFeed } from '../controllers/feedController.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

router.get('/', asyncHandler(getFeed));

export default router;
