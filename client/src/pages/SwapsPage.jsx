import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { swapApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Avatar from '../components/Avatar';

const STATUS_COLORS = {
  pending: 'pending',
  counter_offered: 'counter',
  accepted: 'accepted',
  confirmed: 'confirmed',
  completed: 'completed',
  declined: 'declined',
  cancelled: 'cancelled',
  disputed: 'disputed',
};

const TABS = ['all', 'pending', 'accepted', 'confirmed', 'completed', 'cancelled', 'declined', 'disputed'];

export default function SwapsPage() {
  const { user } = useAuth();
  const { swapEvent } = useSocket();
  const [tab, setTab] = useState('all');
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    swapApi
      .list(tab === 'all' ? {} : { status: tab })
      .then((r) => setSwaps(r.swaps))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [tab]);

  // Reload instantly when the other party changes a swap status (real-time)
  useEffect(() => {
    if (swapEvent) load();
  }, [swapEvent]);

  const other = (s) => (String(s.fromUser?._id) === String(user?._id) ? s.toUser : s.fromUser);

  return (
    <div className="container mt-2 mb-3">
      <div className="flex-between mb-2">
        <h1 className="page-title">My swaps</h1>
        <Link to="/browse" className="btn btn-outline">Find a partner</Link>
      </div>

      <div className="tabs mb-2">
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="spin" />
      ) : swaps.length === 0 ? (
        <div className="card empty">
          <p>No swaps in this view.</p>
          <Link to="/dashboard" className="btn mt-2">See match recommendations</Link>
        </div>
      ) : (
        <div className="grid grid-2">
          {swaps.map((s) => (
            <Link key={s._id} to={`/swaps/${s._id}`} className="card swap-card">
              <div className="flex-between">
                <div className="flex">
                  <Avatar user={other(s)} />
                  <div>
                    <strong>{other(s)?.name}</strong>
                    <div className="text-sm muted">
                      {s.terms?.offeredSkill} ⇄ {s.terms?.requestedSkill}
                    </div>
                  </div>
                </div>
                <span className={`status-chip ${STATUS_COLORS[s.status] || ''}`}>{s.status.replace('_', ' ')}</span>
              </div>
              <p className="text-sm muted mt-1">
                {s.terms?.session?.format} · {s.terms?.session?.durationMinutes} min ·{' '}
                {s.terms?.session?.date ? new Date(s.terms.session.date).toLocaleDateString() : 'date TBD'}
              </p>
              <p className="text-sm mt-1">
                {s.status === 'pending' && 'Waiting for the other party to respond.'}
                {s.status === 'accepted' && (String(s.awaitingConfirmationFrom) === String(user?._id) ? 'Acceptance received — confirm the agreement!' : 'Accepted — waiting for the other party to confirm.')}
                {s.status === 'confirmed' && (s.completedBy?.length ? 'Both parties confirmed — you marked it complete, waiting for the other party.' : 'Both parties confirmed. Mark "Swapped successfully" to complete!')}
                {s.status === 'completed' && 'Completed — leave a review!'}
                {s.status === 'counter_offered' && (String(s.counterOfferBy) === String(user?._id) ? 'Your counter-offer is waiting.' : 'New counter-offer terms proposed.')}
                {s.status === 'disputed' && 'A dispute has been raised on this swap.'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
