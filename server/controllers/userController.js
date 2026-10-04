import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Review from '../models/Review.js';
import { asyncHandler } from '../middleware/error.js';
import { refreshReputation } from '../services/reputationService.js';
import { notifyUser } from '../services/notificationService.js';

function publicUser(user) {
  const u = user.toObject ? user.toObject() : user;
  delete u.password;
  return u;
}

function parseField(v) {
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

export const updateProfile = asyncHandler(async (req, res) => {
  const bio = parseField(req.body.bio);
  const name = parseField(req.body.name);
  const location = parseField(req.body.location);
  const availability = parseField(req.body.availability);
  const skills = parseField(req.body.skills);
  const portfolio = parseField(req.body.portfolio);

  const user = await User.findById(req.userId);
  if (name) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (location) {
    user.location = { ...user.location, ...location };
  }
  if (availability) {
    user.availability = { ...user.availability, ...availability };
  }
  if (skills) {
    user.skills = {
      offered: skills.offered ?? user.skills.offered,
      sought: skills.sought ?? user.skills.sought,
    };
  }
  if (portfolio) user.portfolio = portfolio;
  if (req.file) user.profilePhoto = `/uploads/${req.file.filename}`;

  await user.save();
  res.json({ user: publicUser(user) });
});

export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('bookmarkedListings');
  if (!user) return res.status(404).json({ message: 'User not found' });

  const [offered, sought, reviews] = await Promise.all([
    Listing.find({ owner: user._id, type: 'offer', isActive: true }).sort('-createdAt'),
    Listing.find({ owner: user._id, type: 'seek', isActive: true }).sort('-createdAt'),
    Review.find({ reviewee: user._id }).populate('reviewer', 'name profilePhoto').sort('-createdAt'),
  ]);

  res.json({ user: publicUser(user), offered, sought, reviews });
});

export const getPublicUsers = asyncHandler(async (req, res) => {
  const { q, city, page = 1, limit = 12 } = req.query;
  const query = { role: 'user' };

  if (q) {
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { 'skills.offered': { $in: [new RegExp(q, 'i')] } },
      { 'skills.sought': { $in: [new RegExp(q, 'i')] } },
    ];
  }
  if (city) query['location.city'] = { $regex: city, $options: 'i' };

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(query).select('-password').sort('-reputationScore').skip(skip).limit(Number(limit)),
    User.countDocuments(query),
  ]);
  res.json({ users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

export const bookmarkListing = asyncHandler(async (req, res) => {
  const { listingId } = req.body;
  const listing = await Listing.findById(listingId);
  if (!listing) return res.status(404).json({ message: 'Listing not found' });

  const user = await User.findById(req.userId);
  const idx = user.bookmarkedListings.map(String).indexOf(String(listingId));
  let bookmarked;
  if (idx >= 0) {
    user.bookmarkedListings.splice(idx, 1);
    bookmarked = false;
  } else {
    user.bookmarkedListings.push(listingId);
    bookmarked = true;
  }
  await user.save();
  res.json({ bookmarked, bookmarks: user.bookmarkedListings });
});

export const getBookmarks = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId).populate('bookmarkedListings');
  res.json({ listings: user.bookmarkedListings });
});

export const setAvailability = asyncHandler(async (req, res) => {
  const { schedule, timezone } = req.body;
  const user = await User.findById(req.userId);
  user.availability.schedule = schedule || user.availability.schedule;
  if (timezone !== undefined) user.availability.timezone = timezone;
  await user.save();
  res.json({ availability: user.availability });
});

export const requestVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  user.verificationPending = true;
  await user.save();
  res.json({ verificationPending: true, message: 'Verification request submitted' });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId).populate('bookmarkedListings');
  res.json({ user: publicUser(user) });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.userId);
  res.json({ message: 'Account deleted' });
});
