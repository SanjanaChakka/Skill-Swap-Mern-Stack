import Listing from '../models/Listing.js';
import { asyncHandler } from '../middleware/error.js';
import { notifyUser } from '../services/notificationService.js';

export const CATEGORIES = [
  'Technology',
  'Arts',
  'Languages',
  'Music',
  'Fitness',
  'Cooking',
  'Business',
  'Education',
  'Photography',
  'Other',
];

export const getCategories = asyncHandler(async (req, res) => {
  res.json({ categories: CATEGORIES });
});

export const createListing = asyncHandler(async (req, res) => {
  const { title, description, type, category, tags, proficiencyLevel, sessionFormat, durationMinutes, frequency, portfolio } = req.body;

  if (!title || !description || !type || !category) {
    return res.status(400).json({ message: 'title, description, type, and category are required' });
  }
  if (!['offer', 'seek'].includes(type)) {
    return res.status(400).json({ message: 'type must be "offer" or "seek"' });
  }

  const listing = await Listing.create({
    owner: req.userId,
    title,
    description,
    type,
    category,
    tags: Array.isArray(tags) ? tags.map((t) => String(t).toLowerCase()) : [],
    proficiencyLevel: proficiencyLevel || 'Intermediate',
    sessionFormat: sessionFormat || 'Both',
    durationMinutes: durationMinutes || 60,
    frequency: frequency || 'Weekly',
    portfolio: portfolio || '',
  });

  // auto-add listed skills to the user's skill profile
  await import('../models/User.js').then(({ default: User }) =>
    User.findByIdAndUpdate(req.userId, {
      $addToSet: { [`skills.${type === 'offer' ? 'offered' : 'sought'}`]: title },
    })
  );

  res.status(201).json({ listing });
});

export const getMyListings = asyncHandler(async (req, res) => {
  const listings = await Listing.find({ owner: req.userId }).sort('-createdAt');
  res.json({ listings });
});

export const getListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id).populate('owner', 'name bio profilePhoto location reputationScore isVerified swapsCompleted badges skills availability');
  if (!listing) return res.status(404).json({ message: 'Listing not found' });
  res.json({ listing });
});

export const updateListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findOne({ _id: req.params.id, owner: req.userId });
  if (!listing) return res.status(404).json({ message: 'Listing not found' });

  const allowed = ['title', 'description', 'category', 'tags', 'proficiencyLevel', 'sessionFormat', 'durationMinutes', 'frequency', 'portfolio', 'isActive'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) listing[key] = req.body[key];
  }
  if (req.body.tags !== undefined) {
    listing.tags = req.body.tags.map((t) => String(t).toLowerCase());
  }
  await listing.save();
  res.json({ listing });
});

export const deleteListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findOneAndDelete({ _id: req.params.id, owner: req.userId });
  if (!listing) return res.status(404).json({ message: 'Listing not found' });
  res.json({ message: 'Listing deleted' });
});

export const searchListings = asyncHandler(async (req, res) => {
  const { q, type, category, tag, level, format, city, maxDistance, page = 1, limit = 12 } = req.query;
  const query = { isActive: true, isFlagged: false };

  if (type && ['offer', 'seek'].includes(type)) query.type = type;
  if (category) query.category = { $regex: `^${category}$`, $options: 'i' };
  if (level) query.proficiencyLevel = { $regex: level, $options: 'i' };
  if (format) query.sessionFormat = { $regex: format, $options: 'i' };
  if (tag) query.tags = tag.toLowerCase();

  if (q) {
    query.$text = { $search: q };
  }

  let sort = { createdAt: -1 };
  let skip = (Number(page) - 1) * Number(limit);

  let listings;
  let total;
  let matchCounts = null;

  if (city) {
    const { default: User } = await import('../models/User.js');
    const owners = await User.find({ 'location.city': { $regex: city, $options: 'i' } }).distinct('_id');
    query.owner = { $in: owners };
  }

  if (q) {
    const agg = [
      { $match: query },
      { $project: { score: { $meta: 'textScore' }, doc: '$$ROOT' } },
      { $sort: { score: -1 } },
      { $skip: skip },
      { $limit: Number(limit) },
      { $replaceRoot: { newRoot: '$doc' } },
    ];
    listings = await Listing.aggregate(agg);
    const countAgg = await Listing.aggregate([{ $match: query }, { $count: 'total' }]);
    total = countAgg[0]?.total || 0;
  } else {
    [listings, total] = await Promise.all([
      Listing.find(query).sort(sort).skip(skip).limit(Number(limit)),
      Listing.countDocuments(query),
    ]);
  }

  listings = await Listing.populate(listings, {
    path: 'owner',
    select: 'name profilePhoto location reputationScore isVerified',
  });

  if (tag || !q) {
    matchCounts = await Listing.aggregate([
      { $match: { isActive: true, isFlagged: false, ...(type ? { type } : {}) } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
  }

  res.json({
    listings,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    categories: CATEGORIES,
    matchCounts: matchCounts || [],
  });
});

export const getFeaturedListings = asyncHandler(async (req, res) => {
  const listings = await Listing.find({ isActive: true, isFlagged: false, type: 'offer' })
    .sort('-completionCount')
    .limit(6)
    .populate('owner', 'name profilePhoto reputationScore isVerified');
  res.json({ listings });
});
