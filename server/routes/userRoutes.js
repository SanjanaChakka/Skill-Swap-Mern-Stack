import { Router } from 'express';
import {
  updateProfile,
  getUserProfile,
  getPublicUsers,
  bookmarkListing,
  getBookmarks,
  setAvailability,
  requestVerification,
  getMe,
  deleteAccount,
} from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/', asyncHandler(getPublicUsers));
router.get('/me', requireAuth, asyncHandler(getMe));
router.put('/me', requireAuth, upload.single('profilePhoto'), asyncHandler(updateProfile));
router.delete('/me', requireAuth, asyncHandler(deleteAccount));
router.put('/me/availability', requireAuth, asyncHandler(setAvailability));
router.post('/me/verification', requireAuth, asyncHandler(requestVerification));
router.post('/me/bookmarks', requireAuth, asyncHandler(bookmarkListing));
router.get('/me/bookmarks', requireAuth, asyncHandler(getBookmarks));
router.get('/:id', asyncHandler(getUserProfile));

export default router;
