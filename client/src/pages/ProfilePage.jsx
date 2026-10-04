import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userApi } from '../api';
import { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import Stars from '../components/Stars';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!user) return;
    userApi.profile(user._id).then((d) => setData(d)).catch(() => {});
  }, [user?._id, user?.reputationScore, user?.reviewsReceived]);

  const requestVerification = async () => {
    setErr('');
    setMsg('');
    try {
      await userApi.requestVerification();
      await refreshUser();
      setMsg('Verification request submitted. An admin will review it.');
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  if (!user || !data) return <div className="spin" />;
  const profile = data.user;

  return (
    <div className="container mt-2 mb-3">
      {msg && <div className="alert alert-success">{msg}</div>}
      {err && <div className="alert alert-error">{err}</div>}

      <div className="grid grid-2">
        <div className="card">
          <div className="flex">
            <Avatar user={profile} size="lg" />
            <div>
              <h1 className="page-title">{profile.name}</h1>
              <div className="text-sm muted">
                {profile.location?.city || 'Remote'} · Member since {new Date(profile.joinedAt).toLocaleDateString()}
              </div>
              <div className="text-sm mt-1">
                {profile.isVerified ? (
                  <span className="verified">✓ Identity verified</span>
                ) : profile.verificationPending ? (
                  <span className="muted">Verification pending…</span>
                ) : (
                  <button className="btn btn-sm btn-outline" onClick={requestVerification}>Verify identity</button>
                )}
              </div>
            </div>
          </div>
          <p className="mt-2">{profile.bio || 'No bio yet.'}</p>

          <div className="grid grid-3 mt-2">
            <div className="stat-box"><div className="stat-label">Reputation</div><div className="stat-value">⭐ {profile.reputationScore}</div></div>
            <div className="stat-box"><div className="stat-label">Swaps done</div><div className="stat-value">🤝 {profile.swapsCompleted}</div></div>
            <div className="stat-box"><div className="stat-label">Reviews</div><div className="stat-value">💬 {profile.reviewsReceived}</div></div>
          </div>

          <div className="mt-2">
            <strong className="text-sm">Badges</strong>
            <div className="mt-1">
              {profile.badges?.length ? (
                profile.badges.map((b) => (
                  <span key={b.name} className="badge-chip">{b.icon} {b.name}</span>
                ))
              ) : (
                <span className="muted text-sm">Complete swaps to earn badges!</span>
              )}
            </div>
          </div>

          <div className="flex mt-2">
            <button className="btn" onClick={() => navigate('/me/settings')}>Edit profile</button>
            <Link to="/me/listings" className="btn btn-outline">My listings</Link>
            <Link to="/saved" className="btn btn-outline">Saved ⭐</Link>
          </div>
        </div>

        <div>
          <div className="card mb-2">
            <h3 className="mb-1">Skills I offer</h3>
            <div>{profile.skills?.offered?.map((s) => <span key={s} className="chip">{s}</span>) || <span className="muted text-sm">None yet</span>}</div>
            <h3 className="mt-2 mb-1">Skills I want to learn</h3>
            <div>{profile.skills?.sought?.map((s) => <span key={s} className="chip">{s}</span>) || <span className="muted text-sm">None yet</span>}</div>
          </div>

          <div className="card">
            <h3 className="mb-1">Availability schedule</h3>
            <div className="avail-grid">
              {(profile.availability?.schedule || []).map((d) => (
                <div key={d.day} className={`avail-day ${d.available ? '' : 'avail-off'}`}>
                  <strong className="text-sm">{d.day.slice(0, 3)}</strong>
                  <span className="muted text-sm">{d.available ? `${d.start}–${d.end}` : '—'}</span>
                </div>
              ))}
            </div>
            <button className="btn btn-sm btn-outline mt-2" onClick={() => navigate('/me/settings')}>Update availability</button>
          </div>
        </div>
      </div>

      <div className="card mt-2">
        <h3 className="mb-1">My listings</h3>
        <div className="flex flex-wrap">
          {[...data.offered, ...data.sought].map((l) => (
            <Link key={l._id} to={`/listings/${l._id}`} className="chip">{l.title}</Link>
          ))}
          {data.offered.length + data.sought.length === 0 && (
            <span className="muted text-sm">No listings yet. <Link to="/listings/new">Create one →</Link></span>
          )}
        </div>
      </div>

      <div className="card mt-2">
        <h3 className="mb-1">Reviews I've received</h3>
        {data.reviews.length === 0 ? (
          <p className="muted text-sm">No reviews yet.</p>
        ) : (
          <div className="feed-rows">
            {data.reviews.map((r) => (
              <div key={r._id} className="feed-row">
                <Avatar user={r.reviewer} />
                <div className="flex-1">
                  <div className="text-sm">
                    <strong>{r.reviewer?.name}</strong> <Stars value={r.rating} /> {r.rating}
                  </div>
                  <div className="text-sm muted">Skill {r.skillQuality} · Punctuality {r.punctuality} · Communication {r.communication}</div>
                  <p className="text-sm">{r.comment}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
