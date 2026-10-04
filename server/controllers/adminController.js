import User from '../models/User.js';
import Listing from '../models/Listing.js';
import SwapRequest from '../models/SwapRequest.js';
import Review from '../models/Review.js';
import Dispute from '../models/Dispute.js';
import Notification from '../models/Notification.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { asyncHandler } from '../middleware/error.js';
import { notifyUser } from '../services/notificationService.js';
import { refreshReputation } from '../services/reputationService.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const [users, listings, swaps, activeSwaps, completedSwaps, reviews, recentUsers] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Listing.countDocuments(),
    SwapRequest.countDocuments(),
    SwapRequest.countDocuments({ status: { $in: ['pending', 'counter_offered', 'accepted', 'confirmed'] } }),
    SwapRequest.countDocuments({ status: 'completed' }),
    Review.countDocuments(),
    User.find({ role: 'user' }).sort('-createdAt').limit(8).select('name email profilePhoto joinedAt'),
  ]);

  res.json({
    stats: { users, listings, swaps, activeSwaps, completedSwaps, reviews },
    recentUsers,
  });
});

export const getAnalytics = asyncHandler(async (req, res) => {
  const [totalSwaps, completedSwaps, topUsers, engagement] = await Promise.all([
    SwapRequest.countDocuments(),
    SwapRequest.countDocuments({ status: 'completed' }),
    Listing.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    User.find({ role: 'user', swapsCompleted: { $gt: 0 } })
      .sort('-reputationScore')
      .limit(10)
      .select('name reputationScore swapsCompleted badges profilePhoto'),
    SwapRequest.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const categoriesData = await Listing.aggregate([
    { $match: { type: 'offer' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 8 },
  ]);

  const reviewStats = await Review.aggregate([
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  res.json({
    totals: { totalSwaps, completedSwaps, pendingSwaps: totalSwaps - completedSwaps },
    popularCategories,
    categoriesData,
    topUsers,
    engagementByMonth: engagement,
    reviewStats: reviewStats[0] || { avg: 0, count: 0 },
  });
});

export const flagListing = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ message: 'Listing not found' });
  listing.isFlagged = true;
  listing.flaggedReason = reason || 'Reported by admin';
  listing.isActive = false;
  await listing.save();

  notifyUser({
    userId: listing.owner,
    type: 'moderation',
    title: 'Your listing was flagged',
    body: `"${listing.title}" was removed for moderation: ${listing.flaggedReason}`,
    data: { listingId: listing._id },
    sendEmail: false,
  });
  res.json({ listing });
});

export const unflagListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ message: 'Listing not found' });
  listing.isFlagged = false;
  listing.flaggedReason = '';
  listing.isActive = true;
  await listing.save();
  res.json({ listing });
});

export const flagUser = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.isFlagged = true;
  user.flaggedReason = reason || 'Reported by admin';
  await user.save();

  notifyUser({
    userId: user._id,
    type: 'moderation',
    title: 'Account flagged',
    body: user.flaggedReason,
    sendEmail: false,
  });
  res.json({ user: { _id: user._id, isFlagged: true } });
});

export const unflagUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.isFlagged = false;
  user.flaggedReason = '';
  await user.save();
  res.json({ user: { _id: user._id, isFlagged: false } });
});

export const verifyUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.isVerified = true;
  user.verificationPending = false;
  await user.save();
  notifyUser({
    userId: user._id,
    type: 'verification',
    title: 'You are now verified!',
    body: 'Your identity verification was approved. The verified badge now shows on your profile.',
    sendEmail: false,
  });
  res.json({ user: { _id: user._id, isVerified: true } });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.role === 'admin') return res.status(400).json({ message: 'Cannot delete an admin account' });

  const userId = user._id;

  await Listing.deleteMany({ owner: userId });

  const convos = await Conversation.find({ participants: userId }).select('_id');
  const convIds = convos.map((c) => c._id);
  if (convIds.length) {
    await Message.deleteMany({ conversation: { $in: convIds } });
    await Conversation.deleteMany({ _id: { $in: convIds } });
  }

  await SwapRequest.deleteMany({ $or: [{ fromUser: userId }, { toUser: userId }] });
  await Review.deleteMany({ $or: [{ reviewer: userId }, { reviewee: userId }] });
  await Dispute.deleteMany({ $or: [{ raisedBy: userId }, { against: userId }] });
  await Notification.deleteMany({ user: userId });

  await User.findByIdAndDelete(userId);
  res.json({ message: `User ${user.name} deleted` });
});

export const listAllUsers = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;
  const query = {};
  if (q) query.$or = [{ name: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }];
  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(query).sort('-createdAt').skip(skip).limit(Number(limit)).select('name email role isVerified verificationPending isFlagged joinedAt reputationScore swapsCompleted'),
    User.countDocuments(query),
  ]);
  res.json({ users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

export const listAllListings = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;
  const query = {};
  if (q) query.$or = [{ title: { $regex: q, $options: 'i' } }, { description: { $regex: q, $options: 'i' } }];
  const skip = (Number(page) - 1) * Number(limit);
  const [listings, total] = await Promise.all([
    Listing.find(query).sort('-createdAt').skip(skip).limit(Number(limit)).populate('owner', 'name'),
    Listing.countDocuments(query),
  ]);
  res.json({ listings, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

export const listAllSwaps = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const query = {};
  if (status) query.status = status;
  const skip = (Number(page) - 1) * Number(limit);
  const [swaps, total] = await Promise.all([
    SwapRequest.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .populate('fromUser', 'name profilePhoto')
      .populate('toUser', 'name profilePhoto'),
    SwapRequest.countDocuments(query),
  ]);
  res.json({ swaps, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

export const listAllDisputes = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.status = status;
  const skip = (Number(page) - 1) * Number(limit);
  const [disputes, total] = await Promise.all([
    Dispute.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .populate('raisedBy', 'name')
      .populate('against', 'name')
      .populate('swapRequest'),
    Dispute.countDocuments(query),
  ]);
  res.json({ disputes, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

export const resolveDispute = asyncHandler(async (req, res) => {
  const { status, resolution } = req.body;
  if (!['resolved', 'dismissed', 'under_review'].includes(status)) {
    return res.status(400).json({ message: 'Invalid resolution status' });
  }
  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

  dispute.status = status;
  dispute.resolution = resolution || '';
  dispute.resolvedBy = req.userId;
  if (status !== 'under_review') dispute.resolvedAt = new Date();
  await dispute.save();

  const swap = await SwapRequest.findById(dispute.swapRequest);
  if (swap && status !== 'under_review') {
    swap.status = status === 'resolved' ? 'disputed' : swap.status;
    await swap.save();
    if (status === 'resolved') {
      await refreshReputation(swap.fromUser);
      await refreshReputation(swap.toUser);
    }
  }

  notifyUser({
    userId: dispute.raisedBy,
    type: 'dispute',
    title: `Dispute ${status}`,
    body: resolution || `Your dispute was marked as ${status}.`,
    data: { disputeId: dispute._id },
    sendEmail: false,
  });

  res.json({ dispute });
});

export const approveVerificationQueue = asyncHandler(async (req, res) => {
  const queue = await User.find({ verificationPending: true }).select('name email joinedAt bio');
  res.json({ queue });
});
