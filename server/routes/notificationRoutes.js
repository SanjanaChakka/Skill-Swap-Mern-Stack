import { Router } from 'express';
import { getMyNotifications, markRead } from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(getMyNotifications));
router.post('/:id/read', requireAuth, asyncHandler(markRead));

export default router;
