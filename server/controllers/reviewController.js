import Review from '../models/Review.js';
import SwapRequest from '../models/SwapRequest.js';
import { asyncHandler } from '../middleware/error.js';
import { notifyUser } from '../services/notificationService.js';
import { refreshReputation } from '../services/reputationService.js';

export const createReview = asyncHandler(async (req, res) => {
  const { swapRequestId, revieweeId, skillQuality, punctuality, communication, comment } = req.body;
  if (!swapRequestId || !revieweeId) {
    return res.status(400).json({ message: 'swapRequestId and revieweeId are required' });
  }
  if (String(revieweeId) === req.userId) {
    return res.status(400).json({ message: 'You cannot review yourself' });
  }

  const swap = await SwapRequest.findById(swapRequestId);
  if (!swap) return res.status(404).json({ message: 'Swap not found' });
  if (swap.status !== 'completed') {
    return res.status(400).json({ message: 'Reviews are only available after a swap is completed' });
  }
  if (![String(swap.fromUser), String(swap.toUser)].includes(String(req.userId))) {
    return res.status(403).json({ message: 'Only swap participants can review' });
  }

  const existing = await Review.findOne({ swapRequest: swapRequestId, reviewer: req.userId });
  if (existing) return res.status(409).json({ message: 'You already reviewed this swap' });

  const rating = Math.round(((Number(skillQuality) + Number(punctuality) + Number(communication)) / 3) * 10) / 10;

  const review = await Review.create({
    swapRequest: swapRequestId,
    reviewer: req.userId,
    reviewee: revieweeId,
    skillQuality: Number(skillQuality),
    punctuality: Number(punctuality),
    communication: Number(communication),
    rating,
    comment: comment || '',
  });

  await refreshReputation(revieweeId);

  const reviewer = await (await import('../models/User.js')).default.findById(req.userId).select('name');
  notifyUser({
    userId: revieweeId,
    type: 'review',
    title: 'You received a new review',
    body: `${reviewer?.name || 'A user'} rated your swap ${rating}/5`,
    data: { reviewId: review._id },
    sendEmail: false,
  });

  res.status(201).json({ review });
});

export const getReviewsForUser = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ reviewee: req.params.userId })
    .populate('reviewer', 'name profilePhoto')
    .sort('-createdAt');
  res.json({ reviews });
});

export const getMyPendingReviewTargets = asyncHandler(async (req, res) => {
  const completed = await SwapRequest.find({
    status: 'completed',
    $or: [{ fromUser: req.userId }, { toUser: req.userId }],
  });

  const pending = [];
  for (const swap of completed) {
    const already = await Review.findOne({ swapRequest: swap._id, reviewer: req.userId });
    const otherId = String(swap.fromUser) === req.userId ? String(swap.toUser) : String(swap.fromUser);
    if (!already) {
      pending.push({ swap, revieweeId: otherId });
    }
  }
  res.json({ pending });
});
