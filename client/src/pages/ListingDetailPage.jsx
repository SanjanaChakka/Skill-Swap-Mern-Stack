import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { listingApi, swapApi, userApi, reviewApi } from '../api';
import { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import Stars from '../components/Stars';

export default function ListingDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [reviewStats, setReviewStats] = useState(null);
  const [mySkills, setMySkills] = useState([]);

  const [form, setForm] = useState({});
  const isOwner = listing && user && String(listing.owner._id) === String(user._id);

  useEffect(() => {
    if (!user) return;
    userApi.me().then(({ user: u }) => setMySkills(u.skills?.offered || [])).catch(() => {});
  }, [user]);

  useEffect(() => {
    listingApi.get(id).then(({ listing: l }) => setListing(l)).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (listing) {
      const ownerId = listing.owner?._id;
      if (ownerId) {
        reviewApi.forUser(ownerId).then((r) => {
          if (r.reviews.length) {
            const avg = r.reviews.reduce((s, x) => s + (x.rating || 0), 0) / r.reviews.length;
            setReviewStats({ avg, count: r.reviews.length });
          }
        }).catch(() => {});
      }
    }
  }, [listing]);

  if (!listing) return <div className="spin" />;
  const owner = listing.owner || {};

  const openModal = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setForm({
      toUser: owner._id,
      offeredSkill: mySkills.includes(listing.title) ? listing.title : (mySkills[0] || ''),
      requestedSkill: listing.title,
      session: { format: listing.sessionFormat === 'In-Person' ? 'In-Person' : 'Online', durationMinutes: listing.durationMinutes, frequency: 'Weekly' },
      message: `Hi ${owner.name || 'there'}! I'm interested in your listing "${listing.title}".`,
    });
    setShowModal(true);
  };

  const toggleBookmark = async () => {
    try {
      const res = await userApi.bookmark(listing._id);
      setListing({ ...listing, _bookmarked: res.bookmarked });
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { swap } = await swapApi.create(form);
      navigate(`/swaps/${swap._id}`);
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <div className="container mt-2 mb-3">
      <div className="flex-between mb-2">
        <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>← Back</button>
        {user && !isOwner && (
          <button className="btn btn-outline btn-sm" onClick={toggleBookmark}>
            {listing._bookmarked ? '⭐ Saved' : '☆ Save'}
          </button>
        )}
      </div>

      <div className="grid grid-2">
        <div>
          <div className="card">
            <div className="flex-between">
              <span className={`chip ${listing.type === 'offer' ? 'chip-offer' : 'chip-seek'}`}>
                {listing.type === 'offer' ? 'Offering this skill' : 'Seeking this skill'}
              </span>
              <span className="chip">{listing.category}</span>
            </div>
            <h1 className="page-title mt-1">{listing.title}</h1>
            <p className="muted">{listing.description}</p>

            <div className="grid grid-3 mt-2">
              <div className="stat-box">
                <div className="stat-label">Level</div>
                <div className="stat-value">{listing.proficiencyLevel}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Format</div>
                <div className="stat-value">{listing.sessionFormat}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Duration</div>
                <div className="stat-value">{listing.durationMinutes} min</div>
              </div>
            </div>

            <div className="mt-2">
              <label>Tags</label>
              <div>
                {listing.tags?.map((t) => (
                  <Link key={t} className="chip" to={`/browse?tag=${encodeURIComponent(t)}`}>{t}</Link>
                ))}
              </div>
            </div>

            {listing.portfolio && (
              <div className="mt-2">
                <label>Proof / Portfolio</label>
                <a href={listing.portfolio} target="_blank" rel="noreferrer" className="chip">🔗 View portfolio</a>
              </div>
            )}

            {!isOwner && (
              <button className="btn mt-2" style={{ width: '100%' }} onClick={openModal}>
                {listing.type === 'offer' ? '🤝 Request this swap' : '🙋 Offer this skill'}
              </button>
            )}
            {isOwner && (
              <div className="flex mt-2">
                <button className="btn btn-outline" onClick={() => navigate(`/listings/${listing._id}/edit`)}>Edit</button>
                <Link to="/me/listings" className="btn btn-outline">My listings</Link>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card mb-2">
            <h3 className="mb-1">Posted by</h3>
            <Link to={`/profile/${owner._id}`} className="flex">
              <Avatar user={owner} size="lg" />
              <div>
                <strong>{owner.name}</strong>
                {owner.isVerified && <span className="verified"> ✓ Verified</span>}
                <div className="text-sm muted">{owner.location?.city || 'Remote'}</div>
                <div className="text-sm">
                  {reviewStats ? (
                    <>
                      <Stars value={reviewStats.avg} /> {reviewStats.avg.toFixed(1)} ({reviewStats.count})
                    </>
                  ) : (
                    'No reviews yet'
                  )}
                </div>
              </div>
            </Link>
            <p className="text-sm mt-1">{owner.bio}</p>
            <div className="flex mt-1 text-sm">
              <span>🏅 Reputation: {owner.reputationScore}</span>
              <span className="muted">· {owner.swapsCompleted} swaps</span>
            </div>
            <div className="mt-1">
              {owner.badges?.slice(0, 3).map((b) => (
                <span key={b.name} className="badge-chip">{b.icon} {b.name}</span>
              ))}
            </div>
          </div>

          <div className="card">
            <h4 className="mb-1">Weekly availability</h4>
            {(owner.availability?.schedule || []).filter((d) => d.available).length === 0 ? (
              <p className="muted text-sm">No schedule set.</p>
            ) : (
              <div className="avail-grid">
                {(owner.availability?.schedule || [])
                  .filter((d) => d.available)
                  .map((d) => (
                    <div key={d.day} className="avail-day">
                      <strong className="text-sm">{d.day.slice(0, 3)}</strong>
                      <span className="muted text-sm">{d.start}–{d.end}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1">Send swap request</h3>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={submit}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label>You offer</label>
                  {mySkills.length > 0 ? (
                    <select
                      value={form.offeredSkill}
                      onChange={(e) => setForm({ ...form, offeredSkill: e.target.value })}
                      required
                    >
                      {mySkills.map((sk) => (
                        <option key={sk} value={sk}>{sk}</option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <input
                        value={form.offeredSkill}
                        onChange={(e) => setForm({ ...form, offeredSkill: e.target.value })}
                        placeholder="Type a skill you can teach"
                        required
                      />
                      <p className="muted text-sm mt-1">Tip: add skills to your <Link to="/me/settings">profile</Link> and they'll auto-fill here.</p>
                    </>
                  )}
                </div>
                <div className="form-group">
                  <label>You want</label>
                  <input
                    value={form.requestedSkill}
                    onChange={(e) => setForm({ ...form, requestedSkill: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-3">
                <div className="form-group">
                  <label>Format</label>
                  <select
                    value={form.session?.format}
                    onChange={(e) => setForm({ ...form, session: { ...form.session, format: e.target.value } })}
                  >
                    <option value="Online">Online</option>
                    <option value="In-Person">In-Person</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Duration (min)</label>
                  <input
                    type="number"
                    value={form.session?.durationMinutes}
                    onChange={(e) => setForm({ ...form, session: { ...form.session, durationMinutes: e.target.value } })}
                  />
                </div>
                <div className="form-group">
                  <label>Frequency</label>
                  <select
                    value={form.session?.frequency}
                    onChange={(e) => setForm({ ...form, session: { ...form.session, frequency: e.target.value } })}
                  >
                    <option>Weekly</option>
                    <option>One-time</option>
                    <option>Bi-weekly</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              </div>
              <div className="flex flex-between">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Send swap request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
