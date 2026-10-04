import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import { CATEGORY_COLORS, formatDate } from '../utils';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api';
import { useState } from 'react';

export default function ListingCard({ listing, onBookmarkChange }) {
  const { user } = useAuth();
  const owner = listing.owner || {};
  const isOffer = listing.type === 'offer';
  const [bookmarked, setBookmarked] = useState(() =>
    user ? (user.bookmarkedListings || []).some((b) => String(b) === String(listing._id)) : false
  );
  const [busy, setBusy] = useState(false);

  const toggleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    setBusy(true);
    try {
      const res = await userApi.bookmark(listing._id);
      setBookmarked(res.bookmarked);
      onBookmarkChange?.(res.bookmarked);
    } catch {
      /* ignore */
    }
    setBusy(false);
  };

  const color = CATEGORY_COLORS[listing.category] || '#6b7280';

  return (
    <Link to={`/listings/${listing._id}`} className="listing-card card">
      <div className="listing-top">
        <span className="chip" style={{ background: color + '22', color }}>
          {listing.category}
        </span>
        <span className={`chip ${isOffer ? 'chip-offer' : 'chip-seek'}`}>{isOffer ? 'Offering' : 'Seeking'}</span>
        {user && (
          <button className="bookmark-btn" onClick={toggleBookmark} disabled={busy} aria-label="Save listing">
            {bookmarked ? '⭐' : '☆'}
          </button>
        )}
      </div>
      <h3 className="listing-title">{listing.title}</h3>
      <p className="listing-desc">{listing.description}</p>
      <div className="mt-1">
        {listing.tags?.slice(0, 4).map((t) => (
          <span key={t} className="chip">{t}</span>
        ))}
      </div>
      <div className="listing-meta">
        <span>{listing.proficiencyLevel}</span>
        <span>·</span>
        <span>{listing.sessionFormat}</span>
        <span>·</span>
        <span>{listing.durationMinutes} min</span>
      </div>
      <div className="flex mt-2">
        <Avatar user={owner} />
        <div>
          <strong className="text-sm">{owner.name || 'Member'}</strong>
          <div className="text-sm muted">
            {owner.location?.city || 'Remote'} {owner.isVerified && <span className="verified">✓ Verified</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
