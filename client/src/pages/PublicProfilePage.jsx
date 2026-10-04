import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userApi, reviewApi } from '../api';
import Avatar from '../components/Avatar';
import Stars from '../components/Stars';
import ListingCard from '../components/ListingCard';

export default function PublicProfilePage() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    userApi.profile(id).then((d) => setData(d)).catch(() => {});
  }, [id]);

  if (!data) return <div className="spin" />;
  const u = data.user;

  return (
    <div className="container mt-2 mb-3">
      <div className="card mb-2">
        <div className="flex">
          <Avatar user={u} size="lg" />
          <div>
            <h1 className="page-title">{u.name} {u.isVerified && <span className="verified">✓</span>}</h1>
            <div className="text-sm muted">{u.location?.city || 'Remote'}</div>
            <div className="text-sm">⭐ {u.reputationScore} reputation · 🤝 {u.swapsCompleted} swaps · 💬 {u.reviewsReceived} reviews</div>
          </div>
        </div>
        <p className="mt-2">{u.bio}</p>
        <div className="mt-1">
          {u.badges?.map((b) => (
            <span key={b.name} className="badge-chip">{b.icon} {b.name}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="mb-1">Offering</h3>
          {data.offered.length === 0 ? <p className="muted text-sm">No offerings.</p> : (
            <div className="grid">
              {data.offered.map((l) => <ListingCard key={l._id} listing={l} />)}
            </div>
          )}
        </div>
        <div className="card">
          <h3 className="mb-1">Seeking</h3>
          {data.sought.length === 0 ? <p className="muted text-sm">Nothing sought.</p> : (
            <div className="grid">
              {data.sought.map((l) => <ListingCard key={l._id} listing={l} />)}
            </div>
          )}
        </div>
      </div>

      <div className="card mt-2">
        <h3 className="mb-1">Reviews</h3>
        {data.reviews.length === 0 ? (
          <p className="muted text-sm">No reviews yet.</p>
        ) : (
          data.reviews.map((r) => (
            <div key={r._id} className="feed-row">
              <Avatar user={r.reviewer} />
              <div>
                <div className="text-sm"><strong>{r.reviewer?.name}</strong> <Stars value={r.rating} /> {r.rating}</div>
                <p className="text-sm">{r.comment}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card mt-2">
        <h3 className="mb-1">Availability</h3>
        <div className="avail-grid">
          {(u.availability?.schedule || []).map((d) => (
            <div key={d.day} className={`avail-day ${d.available ? '' : 'avail-off'}`}>
              <strong className="text-sm">{d.day.slice(0, 3)}</strong>
              <span className="muted text-sm">{d.available ? `${d.start}–${d.end}` : '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
