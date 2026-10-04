import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listingApi, feedApi } from '../api';
import ListingCard from '../components/ListingCard';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'Technology', 'Arts', 'Languages', 'Music', 'Fitness', 'Cooking', 'Business', 'Education', 'Photography', 'Other',
];

const CAT_ICONS = {
  Technology: '💻', Arts: '🎨', Languages: '🗣️', Music: '🎸', Fitness: '🧘', Cooking: '🍳',
  Business: '💼', Education: '📚', Photography: '📷', Other: '✨',
};

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [feed, setFeed] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    listingApi.featured().then((r) => setFeatured(r.listings)).catch(() => {});
    feedApi.get({ limit: 4 }).then((r) => setFeed(r.items)).catch(() => {});
  }, []);

  const doSearch = (e) => {
    e.preventDefault();
    navigate(`/browse?q=${encodeURIComponent(search)}`);
  };

  return (
    <div>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-text">
            <h1>
              Trade skills. <span className="grad">No money.</span> Grow together.
            </h1>
            
            <form className="hero-search" onSubmit={doSearch}>
              <input
                placeholder="Search skills… e.g. guitar, python, yoga, design"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="btn">Search</button>
            </form>
            <div className="flex mt-2">
              {user ? (
                <button className="btn" onClick={() => navigate('/listings/new')}>
                  + Offer your skill
                </button>
              ) : (
                <button className="btn" onClick={() => navigate('/register')}>
                  Register
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container mt-3">
        <h2 className="section-title">Browse by category</h2>
        <div className="category-grid">
          {CATEGORIES.map((c) => (
            <Link key={c} to={`/browse?category=${encodeURIComponent(c)}`} className="category-tile card">
              <span className="cat-icon">{CAT_ICONS[c] || '✨'}</span>
              <span>{c}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container mt-3">
        <div className="flex-between">
          <h2 className="section-title">Trending skill offerings</h2>
          <Link to="/browse?type=offer">See all →</Link>
        </div>
        <div className="grid grid-3 mt-1">
          {featured.map((l) => (
            <ListingCard key={l._id} listing={l} />
          ))}
        </div>
      </section>

      <section className="container mt-3 mb-3">
        <div className="flex-between">
          <h2 className="section-title">Community activity</h2>
          <Link to="/feed">Full feed →</Link>
        </div>
        <div className="card mt-1">
          {feed.map((item, i) => (
            <div key={i} className="feed-row">
              <span className="feed-icon">{item.type === 'swap' ? '🤝' : item.type === 'member' ? '👋' : item.type === 'spotlight' ? '✨' : '📌'}</span>
              <div>
                <div className="text-sm">
                  <strong>{item.title}</strong>
                </div>
                <div className="text-sm muted">{item.body}</div>
              </div>
            </div>
          ))}
          {feed.length === 0 && <div className="empty">No activity yet — be the first to swap!</div>}
        </div>
      </section>
    </div>
  );
}
