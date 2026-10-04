import Dispute from '../models/Dispute.js';
import SwapRequest from '../models/SwapRequest.js';
import { asyncHandler } from '../middleware/error.js';
import { notifyUser } from '../services/notificationService.js';

export const createDispute = asyncHandler(async (req, res) => {
  const { swapRequestId, reason, description } = req.body;
  if (!swapRequestId || !reason) {
    return res.status(400).json({ message: 'swapRequestId and reason are required' });
  }

  const swap = await SwapRequest.findById(swapRequestId);
  if (!swap) return res.status(404).json({ message: 'Swap not found' });
  if (![String(swap.fromUser), String(swap.toUser)].includes(String(req.userId))) {
    return res.status(403).json({ message: 'Only swap participants can raise a dispute' });
  }

  const existing = await Dispute.findOne({ swapRequest: swapRequestId, status: { $in: ['open', 'under_review'] } });
  if (existing) return res.status(409).json({ message: 'A dispute is already open for this swap' });

  const against = String(swap.fromUser) === req.userId ? swap.toUser : swap.fromUser;

  const dispute = await Dispute.create({
    swapRequest: swapRequestId,
    raisedBy: req.userId,
    against,
    reason,
    description: description || '',
    status: 'open',
  });

  swap.status = 'disputed';
  await swap.save();

  const admins = await (await import('../models/User.js')).default.find({ role: 'admin' }).distinct('_id');
  for (const adminId of admins) {
    notifyUser({
      userId: adminId,
      type: 'dispute',
      title: 'New dispute reported',
      body: `Dispute on swap ${swapRequestId}: ${reason}`,
      data: { disputeId: dispute._id },
      sendEmail: false,
    });
  }

  res.status(201).json({ dispute });
});

export const getMyDisputes = asyncHandler(async (req, res) => {
  const disputes = await Dispute.find({ $or: [{ raisedBy: req.userId }, { against: req.userId }] })
    .populate('swapRequest')
    .sort('-createdAt');
  res.json({ disputes });
});

export const getDispute = asyncHandler(async (req, res) => {
  const dispute = await Dispute.findById(req.params.id)
    .populate('swapRequest')
    .populate('raisedBy', 'name')
    .populate('against', 'name');
  if (!dispute) return res.status(404).json({ message: 'Dispute not found' });
  res.json({ dispute });
});
