import User from '../models/User.js';
import ReviewModel from '../models/Review.js';
import mongoose from 'mongoose';
import { notifyUser } from './notificationService.js';

const BADGE_DEFINITIONS = [
  { name: 'First Swap', minSwaps: 1, icon: '🌱', description: 'Completed your first skill swap' },
  { name: '5 Swaps Completed', minSwaps: 5, icon: '🤝', description: 'Completed 5 skill swaps' },
  { name: '10 Swaps Completed', minSwaps: 10, icon: '🏅', description: 'Completed 10 skill swaps' },
  { name: '25 Swaps Completed', minSwaps: 25, icon: '🏆', description: 'Completed 25 skill swaps' },
  { name: 'Top Rated Teacher', minRating: 4.8, icon: '⭐', description: 'Maintain an average rating of 4.8+' },
  { name: 'Reliable Member', minRating: 4.5, icon: '🛡️', description: 'Maintain an average rating of 4.5+' },
  { name: 'Active Contributor', minReviews: 3, icon: '💬', description: 'Received 3 reviews' },
];

function toObjectId(id) {
  return mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : id;
}

export async function getRatingStats(userId) {
  const reviews = await ReviewModel.aggregate([
    { $match: { reviewee: toObjectId(userId) } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);
  const stats = reviews[0] || { avgRating: 0, count: 0 };
  return { avgRating: Math.round(stats.avgRating * 10) / 10, count: stats.count };
}

/** Recompute a user's reputation score from review data and grant milestone badges. */
export async function refreshReputation(userId) {
  const user = await User.findById(userId);
  if (!user) return null;

  const { avgRating, count } = await getRatingStats(userId);

  const score = count === 0 ? 0 : Math.round(avgRating * 20) + Math.min(count, 10);
  user.reputationScore = score;
  user.reviewsReceived = count;
  await user.save();

  const newBadges = [];
  for (const def of BADGE_DEFINITIONS) {
    if (user.badges.some((b) => b.name === def.name)) continue;
    const earned =
      (def.minSwaps !== undefined && user.swapsCompleted >= def.minSwaps) ||
      (def.minRating !== undefined && avgRating >= def.minRating) ||
      (def.minReviews !== undefined && count >= def.minReviews);
    if (earned) newBadges.push(def);
  }

  for (const badge of newBadges) {
    user.badges.push({
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
    });
    notifyUser({
      userId,
      type: 'badge',
      title: `Badge earned: ${badge.name}`,
      body: badge.description,
      data: { badge: badge.name },
      sendEmail: false,
    });
  }
  if (newBadges.length) await user.save();

  return { user, avgRating, count, newBadges };
}
