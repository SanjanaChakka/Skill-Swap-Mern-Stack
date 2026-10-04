import Listing from '../models/Listing.js';
import User from '../models/User.js';
import SwapRequest from '../models/SwapRequest.js';
import Review from '../models/Review.js';
import { asyncHandler } from '../middleware/error.js';

export const getFeed = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [recentListings, newMembers, recentSwaps, spotlights] = await Promise.all([
    Listing.find({ isActive: true, isFlagged: false })
      .sort('-createdAt')
      .limit(5)
      .populate('owner', 'name profilePhoto reputationScore'),
    User.find({ role: 'user' }).sort('-joinedAt').limit(5).select('name profilePhoto bio joinedAt skills'),
    SwapRequest.find({ status: 'completed' })
      .sort('-completedAt')
      .limit(5)
      .populate('fromUser', 'name profilePhoto')
      .populate('toUser', 'name profilePhoto'),
    Listing.find({ isActive: true, isFlagged: false, completionCount: { $gt: 0 } })
      .sort('-completionCount')
      .limit(5)
      .populate('owner', 'name profilePhoto'),
  ]);

  const items = [];

  for (const l of recentListings) {
    items.push({
      type: 'listing',
      timestamp: l.createdAt,
      user: l.owner,
      listing: l,
      title: `${l.owner.name} ${l.type === 'offer' ? 'is offering' : 'is seeking'}: ${l.title}`,
      body: l.description.slice(0, 140),
    });
  }

  for (const m of newMembers) {
    items.push({
      type: 'member',
      timestamp: m.joinedAt,
      user: m,
      title: `${m.name} joined the community`,
      body: m.bio || `${m.name} is ready to swap skills.`,
    });
  }

  for (const s of recentSwaps) {
    items.push({
      type: 'swap',
      timestamp: s.completedAt,
      user: null,
      title: `Swap completed: ${s.terms?.offeredSkill} ⇄ ${s.terms?.requestedSkill}`,
      body: `${s.fromUser?.name} and ${s.toUser?.name} completed a skill exchange.`,
    });
  }

  for (const l of spotlights) {
    items.push({
      type: 'spotlight',
      timestamp: l.createdAt,
      user: l.owner,
      title: `Skill spotlight: ${l.title}`,
      body: `${l.completionCount} swaps completed — ${l.description.slice(0, 120)}`,
    });
  }

  items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const paged = items.slice(skip, skip + Number(limit));
  res.json({ items: paged, total: items.length, page: Number(page) });
});
