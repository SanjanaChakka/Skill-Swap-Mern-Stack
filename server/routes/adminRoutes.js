import { Router } from 'express';
import {
  getDashboard,
  getAnalytics,
  flagListing,
  unflagListing,
  flagUser,
  unflagUser,
  verifyUser,
  listAllUsers,
  listAllListings,
  listAllSwaps,
  listAllDisputes,
  resolveDispute,
  deleteUser,
  approveVerificationQueue,
} from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/dashboard', asyncHandler(getDashboard));
router.get('/analytics', asyncHandler(getAnalytics));
router.get('/users', asyncHandler(listAllUsers));
router.get('/listings', asyncHandler(listAllListings));
router.get('/swaps', asyncHandler(listAllSwaps));
router.get('/disputes', asyncHandler(listAllDisputes));
router.get('/verification-queue', asyncHandler(approveVerificationQueue));

router.post('/listings/:id/flag', asyncHandler(flagListing));
router.post('/listings/:id/unflag', asyncHandler(unflagListing));
router.post('/users/:id/flag', asyncHandler(flagUser));
router.post('/users/:id/unflag', asyncHandler(unflagUser));
router.post('/users/:id/verify', asyncHandler(verifyUser));
router.delete('/users/:id', asyncHandler(deleteUser));
router.post('/disputes/:id/resolve', asyncHandler(resolveDispute));

export default router;
