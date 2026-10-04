import { Router } from 'express';
import {
  createListing,
  getMyListings,
  getListing,
  updateListing,
  deleteListing,
  searchListings,
  getCategories,
  getFeaturedListings,
} from '../controllers/listingController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

router.get('/', asyncHandler(searchListings));
router.get('/categories', asyncHandler(getCategories));
router.get('/featured', asyncHandler(getFeaturedListings));
router.get('/mine', requireAuth, asyncHandler(getMyListings));
router.post('/', requireAuth, asyncHandler(createListing));
router.get('/:id', asyncHandler(getListing));
router.put('/:id', requireAuth, asyncHandler(updateListing));
router.delete('/:id', requireAuth, asyncHandler(deleteListing));

export default router;
