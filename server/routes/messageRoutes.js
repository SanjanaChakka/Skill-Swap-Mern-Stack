import { Router } from 'express';
import {
  getOrCreateConversation,
  getMyConversations,
  getMessages,
  sendMessage,
  shareVideoLink,
  markConversationRead,
} from '../controllers/messageController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(getMyConversations));
router.post('/', requireAuth, asyncHandler(getOrCreateConversation));
router.get('/:id', requireAuth, asyncHandler(getMessages));
router.get('/:id/read', requireAuth, asyncHandler(markConversationRead));
router.post('/:id/messages', requireAuth, asyncHandler(sendMessage));
router.post('/:id/video-link', requireAuth, asyncHandler(shareVideoLink));

export default router;
