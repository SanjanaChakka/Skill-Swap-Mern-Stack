import SwapRequest from '../models/SwapRequest.js';
import Conversation from '../models/Conversation.js';
import Listing from '../models/Listing.js';
import { asyncHandler } from '../middleware/error.js';
import { notifyUser } from '../services/notificationService.js';
import { refreshReputation } from '../services/reputationService.js';

function summarize(sr) {
  const s = sr.terms?.session || {};
  return [
    `Offering: ${sr.terms?.offeredSkill || '—'}`,
    `Requesting: ${sr.terms?.requestedSkill || '—'}`,
    s.date ? `Scheduled: ${new Date(s.date).toLocaleDateString()}` : 'Date: to be arranged',
    `Format: ${s.format || 'Online'}`,
    `Duration: ${s.durationMinutes || 60} min`,
    `Frequency: ${s.frequency || 'Weekly'}`,
  ].join('\n');
}

function getUid(ref) {
  if (!ref) return null;
  return ref._id ? String(ref._id) : String(ref);
}

/** Push a real-time swap status update to both participants over Socket.IO. */
function emitSwapUpdate(req, swap, status) {
  const io = req.app.get('io');
  if (!io) return;
  const payload = { swapId: String(swap._id), status, updatedAt: new Date().toISOString() };
  const fromId = getUid(swap.fromUser);
  const toId = getUid(swap.toUser);
  if (fromId) io.to(`user:${fromId}`).emit('swap:update', payload);
  if (toId) io.to(`user:${toId}`).emit('swap:update', payload);
}

function populateBase(q) {
  return q.populate('fromUser', 'name profilePhoto').populate('toUser', 'name profilePhoto');
}

export const createSwapRequest = asyncHandler(async (req, res) => {
  const { toUser, offeringListing, requestingListing, message, offeredSkill, requestedSkill, session } = req.body;

  if (!toUser || !offeredSkill || !requestedSkill) {
    return res.status(400).json({ message: 'toUser, offeredSkill, and requestedSkill are required' });
  }
  if (String(toUser) === req.userId) {
    return res.status(400).json({ message: 'You cannot send a swap request to yourself' });
  }

  const existing = await SwapRequest.findOne({
    fromUser: req.userId,
    toUser,
    status: { $in: ['pending', 'accepted', 'confirmed'] },
  });
  if (existing) {
    return res.status(409).json({ message: 'You already have an active swap request with this user' });
  }

  const swap = await SwapRequest.create({
    fromUser: req.userId,
    toUser,
    offeringListing: offeringListing || undefined,
    requestingListing: requestingListing || undefined,
    message: message || '',
    terms: {
      offeredSkill,
      requestedSkill,
      session: {
        date: session?.date || null,
        format: session?.format || 'Online',
        durationMinutes: session?.durationMinutes || 60,
        frequency: session?.frequency || 'Weekly',
      },
    },
    status: 'pending',
    awaitingConfirmationFrom: toUser,
  });

  const full = await populateBase(SwapRequest.findById(swap._id));

  notifyUser({
    userId: toUser,
    type: 'swap_request',
    title: 'New swap request',
    body: `${full.fromUser.name} wants to swap ${offeredSkill} for ${requestedSkill}`,
    data: { swapId: swap._id },
    sendEmail: false,
  });

  emitSwapUpdate(req, swap, 'pending');
  res.status(201).json({ swap: full });
});

const VALID_ACTIONS = ['accept', 'decline', 'counter', 'confirm', 'cancel', 'complete', 'dispute'];

export const respondToSwap = asyncHandler(async (req, res) => {
  const { action } = req.params;
  if (!VALID_ACTIONS.includes(action)) return res.status(400).json({ message: 'Invalid action' });

  const swap = await populateBase(SwapRequest.findById(req.params.id));
  if (!swap) return res.status(404).json({ message: 'Swap request not found' });

  const me = String(req.userId);
  const isFrom = me === String(swap.fromUser._id);
  const isTo = me === String(swap.toUser._id);
  if (!isFrom && !isTo) return res.status(403).json({ message: 'Not your swap request' });

  const otherId = isFrom ? String(swap.toUser._id) : String(swap.fromUser._id);

  switch (action) {
    case 'accept': {
      const allowed = isTo ? swap.status === 'pending' : swap.status === 'counter_offered';
      if (!allowed) return res.status(400).json({ message: `Cannot accept a swap in "${swap.status}" state` });
      swap.status = 'accepted';
      swap.awaitingConfirmationFrom = isTo ? swap.fromUser : swap.toUser;
      swap.counterOfferBy = undefined;
      swap.terms = req.body.terms || swap.terms;
      swap.summary = summarize(swap);
      await swap.save();
      notifyUser({
        userId: otherId,
        type: 'swap',
        title: 'Swap accepted — confirm the agreement',
        body: `${(isFrom ? swap.toUser : swap.fromUser).name} accepted your terms. Confirm to schedule.`,
        data: { swapId: swap._id },
      });
      break;
    }

    case 'decline': {
      swap.status = 'declined';
      await swap.save();
      notifyUser({
        userId: otherId,
        type: 'swap',
        title: 'Swap request declined',
        body: `${(isFrom ? swap.toUser : swap.fromUser).name} declined the swap request`,
        data: { swapId: swap._id },
      });
      break;
    }

    case 'counter': {
      const { offeredSkill, requestedSkill, session } = req.body;
      if (!offeredSkill || !requestedSkill) {
        return res.status(400).json({ message: 'Counter-offer needs offeredSkill and requestedSkill' });
      }
      swap.terms = {
        offeredSkill,
        requestedSkill,
        session: { ...swap.terms.session, ...session },
      };
      swap.status = 'counter_offered';
      swap.counterOfferBy = req.userId;
      swap.awaitingConfirmationFrom = isFrom ? swap.toUser : swap.fromUser;
      swap.summary = summarize(swap);
      await swap.save();
      notifyUser({
        userId: otherId,
        type: 'swap',
        title: 'Counter-offer received',
        body: `${(isFrom ? swap.toUser : swap.fromUser).name} proposed new terms`,
        data: { swapId: swap._id },
      });
      break;
    }

    case 'confirm': {
      if (swap.awaitingConfirmationFrom && String(swap.awaitingConfirmationFrom) !== me) {
        return res.status(400).json({ message: 'Waiting for the other party to confirm first' });
      }
      if (swap.status !== 'accepted' && swap.status !== 'counter_offered') {
        return res.status(400).json({ message: `Cannot confirm a swap in "${swap.status}" state` });
      }
      swap.status = 'confirmed';
      swap.awaitingConfirmationFrom = undefined;
      swap.agreedAt = new Date();
      swap.summary = summarize(swap);
      await swap.save();

      const conv = await Conversation.create({
        participants: [swap.fromUser._id, swap.toUser._id],
        swapRequest: swap._id,
        lastMessage: 'Swap confirmed — both parties agreed.',
      });
      await conv.save();

      notifyUser({
        userId: otherId,
        type: 'swap',
        title: 'Swap confirmed!',
        body: 'Both parties have confirmed the swap agreement. It is now scheduled.',
        data: { swapId: swap._id, conversationId: conv._id },
      });
      break;
    }

    case 'cancel': {
      if (!['pending', 'accepted', 'counter_offered', 'confirmed'].includes(swap.status)) {
        return res.status(400).json({ message: 'Cannot cancel this swap' });
      }
      swap.status = 'cancelled';
      await swap.save();
      notifyUser({
        userId: otherId,
        type: 'swap',
        title: 'Swap cancelled',
        body: `${(isFrom ? swap.toUser : swap.fromUser).name} cancelled the swap`,
        data: { swapId: swap._id },
      });
      break;
    }

    case 'complete': {
      if (swap.status !== 'confirmed' && swap.status !== 'completed') {
        return res.status(400).json({ message: 'Only confirmed swaps can be completed' });
      }
      if (!swap.completedBy.some((u) => String(u) === me)) {
        swap.completedBy.push(req.userId);
        swap.completedBy = [...new Set(swap.completedBy.map(String))].map((id) => id);
      }
      const bothDone = swap.completedBy.length === 2;
      swap.status = bothDone ? 'completed' : 'confirmed';
      if (bothDone) {
        swap.completedAt = new Date();

        const { default: User } = await import('../models/User.js');
        const gainedFrom = swap.terms.requestedSkill;
        const gainedTo = swap.terms.offeredSkill;
        await User.updateOne(
          { _id: swap.fromUser },
          {
            $inc: { swapsCompleted: 1 },
            $addToSet: { 'skills.offered': gainedFrom },
            $pull: { 'skills.sought': gainedFrom },
          }
        );
        await User.updateOne(
          { _id: swap.toUser },
          {
            $inc: { swapsCompleted: 1 },
            $addToSet: { 'skills.offered': gainedTo },
            $pull: { 'skills.sought': gainedTo },
          }
        );
        await Listing.updateMany(
          { _id: { $in: [swap.offeringListing, swap.requestingListing].filter(Boolean) } },
          { $inc: { completionCount: 1 } }
        );
        await refreshReputation(swap.fromUser);
        await refreshReputation(swap.toUser);

        notifyUser({
          userId: otherId,
          type: 'swap',
          title: 'Swap completed!',
          body: `Swap complete — you gained ${isFrom ? swap.terms.offeredSkill : swap.terms.requestedSkill}. Leave a review to help the community.`,
          data: { swapId: swap._id },
        });
      } else {
        notifyUser({
          userId: otherId,
          type: 'swap',
          title: 'Swap marked complete',
          body: `${(isFrom ? swap.toUser : swap.fromUser).name} marked the swap complete. Mark it too to finish.`,
          data: { swapId: swap._id },
        });
      }
      await swap.save();
      break;
    }

    default:
      return res.status(400).json({ message: 'Unsupported action' });
  }

  const updated = await populateBase(SwapRequest.findById(swap._id));
  emitSwapUpdate(req, swap, swap.status);
  res.json({ swap: updated });
});

export const getMySwaps = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = { $or: [{ fromUser: req.userId }, { toUser: req.userId }] };
  if (status) query.status = status;

  const swaps = await populateBase(SwapRequest.find(query)).sort('-createdAt');
  res.json({ swaps });
});

export const getSwap = asyncHandler(async (req, res) => {
  const swap = await populateBase(SwapRequest.findById(req.params.id))
    .populate('offeringListing')
    .populate('requestingListing');
  if (!swap) return res.status(404).json({ message: 'Swap not found' });
  if (![String(swap.fromUser._id), String(swap.toUser._id)].includes(String(req.userId))) {
    return res.status(403).json({ message: 'Not your swap' });
  }
  res.json({ swap });
});

export const getSwapSummary = asyncHandler(async (req, res) => {
  const swap = await populateBase(SwapRequest.findById(req.params.id));
  if (!swap) return res.status(404).json({ message: 'Swap not found' });
  if (![String(swap.fromUser._id), String(swap.toUser._id)].includes(String(req.userId))) {
    return res.status(403).json({ message: 'Not your swap' });
  }
  res.json({ summary: swap.summary || summarize(swap), swap });
});
