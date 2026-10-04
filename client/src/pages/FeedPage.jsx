import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { feedApi } from '../api';
import Avatar from '../components/Avatar';
import { timeAgo } from '../utils';

export default function FeedPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    feedApi.get({ limit: 50 }).then((r) => setItems(r.items)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const icon = (type) => (type === 'swap' ? '🤝' : type === 'member' ? '👋' : type === 'spotlight' ? '✨' : '📌');
  const title = (t) => (t === 'swap' ? 'Swap completed' : t === 'member' ? 'New member' : t === 'spotlight' ? 'Skill spotlight' : 'New listing');

  return (
    <div className="container mt-2 mb-3" style={{ maxWidth: 720 }}>
      <h1 className="page-title mb-2">Community feed</h1>
      {loading ? (
        <div className="spin" />
      ) : (
        <div className="card">
          {items.length === 0 && <div className="empty">No activity yet. Make the first swap!</div>}
          {items.map((item, i) => (
            <div key={i} className="feed-row">
              <span className="feed-icon">{icon(item.type)}</span>
              {item.user ? (
                <Avatar user={item.user} />
              ) : (
                <span className="feed-icon">{icon('swap')}</span>
              )}
              <div className="flex-1">
                <div className="text-sm">
                  <span className="chip">{title(item.type)}</span> <strong>{item.title}</strong>
                </div>
                <div className="text-sm muted">{item.body}</div>
                <div className="text-sm muted">{timeAgo(item.timestamp)}</div>
                {item.listing && <Link className="text-sm" to={`/listings/${item.listing._id}`}>View listing →</Link>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
