import Listing from '../models/Listing.js';
import User from '../models/User.js';

const SKILL_SYNONYMS = {
  javascript: ['js', 'web development', 'node', 'react', 'frontend'],
  python: ['programming', 'coding', 'automation', 'data science'],
  guitar: ['music', 'guitar lessons'],
  cooking: ['baking', 'meal prep', 'cuisine'],
  yoga: ['fitness', 'meditation', 'wellness'],
  design: ['graphic design', 'logo', 'ui', 'ux', 'photoshop'],
  english: ['language', 'speaking', 'grammar'],
  spanish: ['language', 'speaking'],
  photography: ['photo', 'camera'],
  excel: ['spreadsheets', 'data analysis'],
  marketing: ['social media', 'seo', 'branding'],
  drawing: ['art', 'painting', 'sketching'],
};

function expandSkillTerms(terms) {
  const expanded = new Set();
  for (const t of terms) {
    const key = String(t).toLowerCase().trim();
    expanded.add(key);
    for (const [word, syns] of Object.entries(SKILL_SYNONYMS)) {
      if (key.includes(word) || word.includes(key)) {
        syns.forEach((s) => expanded.add(s));
      }
    }
  }
  return [...expanded];
}

function matchScore(termsA, termsB) {
  const a = expandSkillTerms(termsA);
  const b = expandSkillTerms(termsB);
  let score = 0;
  for (const ta of a) {
    for (const tb of b) {
      if (ta === tb) score += 3;
      else if (ta.includes(tb) || tb.includes(ta)) score += 1.5;
    }
  }
  return Math.min(score, 10);
}

/**
 * Recommend potential swap partners for a user.
 * Strategy: find listings (offers) whose skills overlap with the user's sought skills,
 * and listings (seeks) whose skills overlap with the user's offered skills.
 */
export async function recommendMatches(userId, { limit = 10, city, maxDistanceKm, category } = {}) {
  const user = await User.findById(userId).select('skills location availability isVerified reputationScore badges profilePhoto name bio');
  if (!user) return [];

  const sought = expandSkillTerms(user.skills.sought);
  const offered = expandSkillTerms(user.skills.offered);

  const query = { isActive: true, isFlagged: false, owner: { $ne: userId } };
  if (category) query.category = category;
  if (city) {
    const cityMatch = await User.find({ 'location.city': new RegExp(city, 'i') }).distinct('_id');
    query.owner = { $in: cityMatch, $ne: userId };
  }

  const candidates = await Listing.find(query)
    .populate('owner', 'name bio profilePhoto location city reputationScore isVerified swapsCompleted badges skills')
    .limit(200);

  const results = [];
  for (const listing of candidates) {
    const tags = expandSkillTerms([listing.title, listing.description, ...listing.tags, listing.category]);
    let score = 0;
    if (listing.type === 'offer') score += matchScore(sought, tags);
    if (listing.type === 'seek') score += matchScore(offered, tags);

    if (listing.owner.location?.city && city && user.location?.city) {
      if (String(listing.owner.location.city).toLowerCase() === String(city).toLowerCase()) score += 1;
    }

    score += (listing.owner.reputationScore || 0) / 100;
    if (listing.owner.isVerified) score += 0.5;
    if (listing.sessionFormat && listing.sessionFormat === 'Online') score += 0.25;

    if (score > 0) {
      results.push({
        score: Math.round(score * 100) / 100,
        user: listing.owner,
        listing,
        reason: listing.type === 'offer' ? 'offers a skill you want to learn' : 'seeks a skill you can teach',
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}
