import Notification from '../models/Notification.js';
import { asyncHandler } from '../middleware/error.js';

export const getMyNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const query = { user: req.userId };
  if (unreadOnly === 'true') query.read = false;

  const skip = (Number(page) - 1) * Number(limit);
  const [notifications, total, unread] = await Promise.all([
    Notification.find(query).sort('-createdAt').skip(skip).limit(Number(limit)),
    Notification.countDocuments(query),
    Notification.countDocuments({ user: req.userId, read: false }),
  ]);

  res.json({ notifications, total, unread, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

export const markRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (id === 'all') {
    await Notification.updateMany({ user: req.userId, read: false }, { read: true });
  } else {
    await Notification.updateOne({ _id: id, user: req.userId }, { read: true });
  }
  res.json({ ok: true });
});
