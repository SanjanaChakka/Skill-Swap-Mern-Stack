import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { asyncHandler } from '../middleware/error.js';
import { notifyUser } from '../services/notificationService.js';

function isParticipant(conv, userId) {
  return conv.participants.some((p) => String(p) === String(userId));
}

export const getOrCreateConversation = asyncHandler(async (req, res) => {
  const { otherUserId, swapRequestId } = req.body;
  if (!otherUserId) return res.status(400).json({ message: 'otherUserId is required' });

  let conv = await Conversation.findOne({
    participants: { $all: [req.userId, otherUserId] },
  });

  if (!conv) {
    conv = await Conversation.create({
      participants: [req.userId, otherUserId],
      swapRequest: swapRequestId || undefined,
    });
  }

  const populated = await Conversation.populate(conv, { path: 'participants', select: 'name profilePhoto' });
  res.json({ conversation: populated });
});

export const getMyConversations = asyncHandler(async (req, res) => {
  const convos = await Conversation.find({ participants: req.userId })
    .populate('participants', 'name profilePhoto reputationScore isVerified')
    .sort('-lastMessageAt');
  res.json({ conversations: convos });
});

export const getMessages = asyncHandler(async (req, res) => {
  const conv = await Conversation.findById(req.params.id);
  if (!conv) return res.status(404).json({ message: 'Conversation not found' });
  if (!isParticipant(conv, req.userId)) return res.status(403).json({ message: 'Not your conversation' });

  const messages = await Message.find({ conversation: conv._id })
    .sort('createdAt')
    .populate('sender', 'name profilePhoto');

  await Message.updateMany(
    { conversation: conv._id, readBy: { $ne: req.userId } },
    { $addToSet: { readBy: req.userId } }
  );

  res.json({ conversation: conv, messages });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const conv = await Conversation.findById(req.params.id);
  if (!conv) return res.status(404).json({ message: 'Conversation not found' });
  if (!isParticipant(conv, req.userId)) return res.status(403).json({ message: 'Not your conversation' });

  const { content, videoLink } = req.body;
  if (!content && !videoLink) return res.status(400).json({ message: 'Message content is required' });

  const type = videoLink ? 'video_link' : 'text';
  const message = await Message.create({
    conversation: conv._id,
    sender: req.userId,
    content: videoLink ? 'Shared a video call link' : content,
    videoLink: videoLink || '',
    type,
    readBy: [req.userId],
  });

  conv.lastMessage = content || (videoLink ? 'Video call link shared' : '');
  conv.lastMessageAt = new Date();
  await conv.save();

  const full = await Message.populate(message, { path: 'sender', select: 'name profilePhoto' });

  const io = req.app.get('io');
  const otherUserId = conv.participants.find((p) => String(p) !== req.userId);
  if (otherUserId && io) {
    io.to(`user:${String(otherUserId)}`).emit('message:new', {
      conversationId: String(conv._id),
      message: full,
    });
  }

  if (content && otherUserId) {
    const fromName = (await import('../models/User.js')).default.findById(req.userId).select('name');
    const u = await fromName;
    notifyUser({
      userId: otherUserId,
      type: 'message',
      title: `New message from ${u?.name || 'a user'}`,
      body: content.slice(0, 120),
      data: { conversationId: String(conv._id) },
      sendEmail: false,
    });
  }

  res.status(201).json({ message: full });
});

export const shareVideoLink = asyncHandler(async (req, res) => {
  const { videoLink } = req.body;
  if (!videoLink) return res.status(400).json({ message: 'videoLink is required' });
  req.body.content = '';
  req.body.videoLink = videoLink;
  return sendMessage(req, res);
});

export const markConversationRead = asyncHandler(async (req, res) => {
  await Message.updateMany(
    { conversation: req.params.id, readBy: { $ne: req.userId } },
    { $addToSet: { readBy: req.userId } }
  );
  res.json({ ok: true });
});
