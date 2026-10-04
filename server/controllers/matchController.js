import { recommendMatches } from '../services/matching.js';
import { asyncHandler } from '../middleware/error.js';

export const getRecommendations = asyncHandler(async (req, res) => {
  const { limit = 12, city, category } = req.query;
  const results = await recommendMatches(req.userId, {
    limit: Number(limit),
    city,
    category,
  });
  res.json({ matches: results });
});
