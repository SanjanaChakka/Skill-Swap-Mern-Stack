import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { matchApi } from '../api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    refreshUser().catch(() => {});
    load();
  }, [city, category]);

  const load = () => {
    setLoading(true);
    matchApi
      .recommendations({ limit: 12, city: city || undefined, category: category || undefined })
      .then((r) => setMatches(r.matches))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const goSwap = (match) => {
    const m = match.listing;
    navigate(`/listings/${m._id}`);
  };

  return (
    <div className="container mt-2 mb-3">
      <div className="card mb-2 brand-card">
        <h1 className="page-title">✨ Your match recommendations</h1>
        <p className="muted">
          Based on your profile, {user?.name || 'friend'}: you offer <strong>{user?.skills?.offered?.join(', ') || 'nothing yet'}</strong>{' '}
          and want to learn <strong>{user?.skills?.sought?.join(', ') || 'nothing yet'}</strong>. Add your skills on your{' '}
          <Link to="/me/settings">profile</Link> for better matches.
        </p>
        <div className="grid grid-2 mt-2">
          <div className="form-group" style={{ margin: 0 }}>
            <label>City filter</label>
            <input placeholder="e.g. Austin" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {['Technology', 'Arts', 'Languages', 'Music', 'Fitness', 'Cooking', 'Business', 'Education', 'Photography', 'Other'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="spin" />
      ) : matches.length === 0 ? (
        <div className="card empty">
          <p>No matches found yet. Add skills you offer and want to learn to your profile.</p>
          <Link to="/me/settings" className="btn mt-2">Update profile skills</Link>
        </div>
      ) : (
        <div className="grid grid-2">
          {matches.map((m, i) => (
            <div key={i} className="card match-card">
              <div className="flex-between">
                <div className="flex">
                  <Avatar user={m.user} />
                  <div>
                    <strong>{m.user?.name}</strong>
                    {m.user?.isVerified && <span className="verified"> ✓</span>}
                    <div className="text-sm muted">{m.user?.location?.city || 'Remote'}</div>
                  </div>
                </div>
                <span className="chip match-score">Match {Math.round(m.score * 20)}%</span>
              </div>
              <p className="text-sm mt-1">
                <strong>{m.user?.name}</strong> {m.reason} — "{m.listing?.title}"
              </p>
              <p className="text-sm muted">{m.listing?.description?.slice(0, 110)}</p>
              <div className="flex mt-1 text-sm">
                <span>⭐ {m.user?.reputationScore}</span>
                <span className="muted">· {m.user?.swapsCompleted} swaps</span>
                <span className="muted">· {m.listing?.sessionFormat}</span>
              </div>
              <div className="flex mt-2">
                <button className="btn btn-sm" onClick={() => goSwap(m)}>
                  {m.listing.type === 'offer' ? 'Request swap' : 'Offer my skill'}
                </button>
                <Link to={`/profile/${m.user?._id}`} className="btn btn-sm btn-outline">Profile</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
