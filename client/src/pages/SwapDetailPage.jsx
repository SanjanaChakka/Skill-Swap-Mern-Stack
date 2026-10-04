import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { swapApi, reviewApi, messageApi, disputeApi, errMsg } from '../api';
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

export default function SwapDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { swapEvent } = useSocket();
  const navigate = useNavigate();
  const [swap, setSwap] = useState(null);
  const [summary, setSummary] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null); // 'counter' | 'review' | 'dispute'
  const [pendingReviews, setPendingReviews] = useState([]);

  useEffect(() => {
    load();
    reviewApi.pending().then((r) => setPendingReviews(r.pending)).catch(() => {});
  }, [id]);

  // Reload this swap live when the other party takes an action
  useEffect(() => {
    if (swapEvent && String(swapEvent.swapId) === String(swap?._id)) {
      load();
    }
  }, [swapEvent]);

  const load = () => {
    swapApi.get(id).then(({ swap: s }) => setSwap(s)).catch((e) => setErr(errMsg(e)));
    swapApi.summary(id).then((r) => setSummary(r.summary)).catch(() => {});
  };

  if (err && !swap) return <div className="container mt-2"><div className="alert alert-error">{err}</div></div>;
  if (!swap) return <div className="spin" />;

  const me = String(user?._id);
  const isFrom = me === String(swap.fromUser?._id);
  const other = isFrom ? swap.toUser : swap.fromUser;
  const iMustAct = swap.awaitingConfirmationFrom && String(swap.awaitingConfirmationFrom) === me;
  const awaitingOther = swap.awaitingConfirmationFrom && String(swap.awaitingConfirmationFrom) !== me;
  const iCompleted = (swap.completedBy || []).some((u) => String(u) === me);

  const act = async (action, payload) => {
    setBusy(true);
    setErr('');
    try {
      const res = await swapApi.action(id, action, payload);
      setSwap(res.swap);
      if (action === 'confirm') {
        await messageApi.getOrCreate({ otherUserId: other?._id, swapRequestId: swap._id });
      }
      load();
    } catch (e) {
      setErr(errMsg(e));
    }
    setBusy(false);
  };

  const isReviewed = pendingReviews.some((p) => String(p.swap._id) === String(swap._id));

  return (
    <div className="container mt-2 mb-3">
      <div className="flex-between mb-2">
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/swaps')}>← My swaps</button>
        {swap.status === 'confirmed' && (
          <button className="btn btn-sm btn-outline" onClick={() => messageApi.getOrCreate({ otherUserId: other?._id, swapRequestId: swap._id }).then((r) => navigate(`/messages/${r.conversation._id}`))}>
            💬 Open chat
          </button>
        )}
      </div>

      {err && <div className="alert alert-error">{err}</div>}

      <div className="grid grid-2">
        <div className="card">
          <div className="flex-between">
            <h2 className="page-title">Swap with {other?.name}</h2>
            <span className={`status-chip ${STATUS_COLORS[swap.status] || ''}`}>{swap.status.replace('_', ' ')}</span>
          </div>
          <div className="flex mt-1">
            <Avatar user={other} size="lg" />
            <div>
              <Link to={`/profile/${other?._id}`}>{other?.name}</Link>
              <div className="text-sm muted">⭐ {other?.reputationScore} · {other?.swapsCompleted} swaps</div>
            </div>
          </div>

          <div className="terms-box mt-2">
            <div className="terms-row">
              <span className="muted">You offer (from {other?.name})</span>
              <strong>{isFrom ? swap.terms?.offeredSkill : swap.terms?.requestedSkill}</strong>
            </div>
            <div className="terms-row">
              <span className="muted">You receive</span>
              <strong>{isFrom ? swap.terms?.requestedSkill : swap.terms?.offeredSkill}</strong>
            </div>
          </div>

          <div className="grid grid-3 mt-2">
            <div className="stat-box"><div className="stat-label">Format</div><div className="stat-value">{swap.terms?.session?.format}</div></div>
            <div className="stat-box"><div className="stat-label">Duration</div><div className="stat-value">{swap.terms?.session?.durationMinutes} min</div></div>
            <div className="stat-box"><div className="stat-label">Frequency</div><div className="stat-value">{swap.terms?.session?.frequency}</div></div>
          </div>
          {swap.terms?.session?.date && (
            <p className="text-sm mt-1">📅 Scheduled: {new Date(swap.terms.session.date).toLocaleDateString()}</p>
          )}
          {swap.message && <p className="text-sm muted mt-1">💬 "{swap.message}"</p>}
        </div>

        <div>
          <div className="card mb-2">
            <h3 className="mb-1">Agreement summary</h3>
            <pre className="summary-box">{summary || 'No agreement yet.'}</pre>
            {swap.status === 'confirmed' && (
              <p className="text-sm muted mt-1">Both parties confirmed this agreement on {new Date(swap.agreedAt).toLocaleDateString()}.</p>
            )}
          </div>

          <div className="card">
            <h3 className="mb-1">Actions</h3>

            {(swap.status === 'pending' || swap.status === 'counter_offered') && (
              <div className="action-hint">
                {swap.status === 'counter_offered' && swap.counterOfferBy && String(swap.counterOfferBy) !== me && (
                  <p className="text-sm mb-1">📄 {other?.name} proposed new terms. Review them below.</p>
                )}
                {iMustAct ? (
                  <p className="text-sm mb-1">It's your turn to respond.</p>
                ) : (
                  <p className="text-sm muted mb-1">Waiting for {other?.name} to respond…</p>
                )}
              </div>
            )}

            <div className="flex flex-wrap action-btns">
              {swap.status === 'pending' && iMustAct && (
                <>
                  <button className="btn btn-success btn-sm" onClick={() => act('accept')} disabled={busy}>Accept terms</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setModal('counter')} disabled={busy}>Counter-offer</button>
                  <button className="btn btn-danger btn-sm" onClick={() => act('decline')} disabled={busy}>Decline</button>
                </>
              )}
              {swap.status === 'counter_offered' && iMustAct && (
                <>
                  <button className="btn btn-success btn-sm" onClick={() => act('accept')} disabled={busy}>Accept terms</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setModal('counter')} disabled={busy}>Counter again</button>
                  <button className="btn btn-danger btn-sm" onClick={() => act('decline')} disabled={busy}>Decline</button>
                </>
              )}
              {swap.status === 'accepted' && iMustAct && (
                <>
                  <button className="btn btn-success btn-sm" onClick={() => act('confirm')} disabled={busy}>✓ Confirm agreement</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setModal('counter')} disabled={busy}>Counter-offer</button>
                  <button className="btn btn-danger btn-sm" onClick={() => act('decline')} disabled={busy}>Decline</button>
                </>
              )}
              {swap.status === 'accepted' && awaitingOther && (
                <p className="text-sm muted">⏳ {other?.name} needs to confirm the final agreement.</p>
              )}
              {(swap.status === 'pending' || swap.status === 'counter_offered') && awaitingOther && (
                <button className="btn btn-outline btn-sm" onClick={() => act('cancel')} disabled={busy}>Withdraw request</button>
              )}
              {swap.status === 'confirmed' && (
                <>
                  {iCompleted ? (
                    <p className="text-sm mb-1">✅ You marked this swap as complete — waiting for {other?.name} to confirm.</p>
                  ) : (
                    <button className="btn btn-success btn-sm" onClick={() => act('complete')} disabled={busy}>
                      ✓ Swapped successfully
                    </button>
                  )}
                  <p className="text-sm muted mb-1">
                    {iCompleted
                      ? `Completion 1/2 — ${other?.name} needs to mark it too.`
                      : 'Both parties must mark the swap complete for it to finish.'}
                  </p>
                  <button className="btn btn-outline btn-sm" onClick={() => setModal('dispute')} disabled={busy}>Report issue</button>
                </>
              )}
              {swap.status === 'completed' && (
                <>
                  {isReviewed ? (
                    <p className="text-sm muted">You've reviewed this swap. ✅</p>
                  ) : (
                    <button className="btn btn-sm" onClick={() => setModal('review')} disabled={busy}>⭐ Leave a review</button>
                  )}
                  <button className="btn btn-outline btn-sm" onClick={() => setModal('dispute')} disabled={busy}>Report issue</button>
                </>
              )}
              {swap.status === 'disputed' && (
                <p className="text-sm">A dispute is being reviewed by our team.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {modal === 'counter' && (
        <CounterModal swap={swap} onClose={() => setModal(null)} onSubmit={(payload) => { act('counter', payload).then(() => setModal(null)); }} />
      )}
      {modal === 'review' && (
        <ReviewModal swap={swap} revieweeId={other?._id} onClose={() => setModal(null)} onSubmit={() => { setModal(null); load(); }} />
      )}
      {modal === 'dispute' && (
        <DisputeModal swap={swap} onClose={() => setModal(null)} onSubmit={() => { setModal(null); load(); }} />
      )}
    </div>
  );
}

function CounterModal({ swap, onClose, onSubmit }) {
  const [terms, setTerms] = useState({
    offeredSkill: swap.terms?.offeredSkill,
    requestedSkill: swap.terms?.requestedSkill,
    session: { ...swap.terms?.session },
  });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-1">Propose counter-offer</h3>
        <p className="text-sm muted mb-2">Adjust the terms below and send your counter-proposal.</p>
        <div className="grid grid-2">
          <div className="form-group">
            <label>Offered skill</label>
            <input value={terms.offeredSkill} onChange={(e) => setTerms({ ...terms, offeredSkill: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Requested skill</label>
            <input value={terms.requestedSkill} onChange={(e) => setTerms({ ...terms, requestedSkill: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-3">
          <div className="form-group">
            <label>Format</label>
            <select value={terms.session?.format} onChange={(e) => setTerms({ ...terms, session: { ...terms.session, format: e.target.value } })}>
              <option>Online</option>
              <option>In-Person</option>
            </select>
          </div>
          <div className="form-group">
            <label>Duration (min)</label>
            <input type="number" value={terms.session?.durationMinutes} onChange={(e) => setTerms({ ...terms, session: { ...terms.session, durationMinutes: e.target.value } })} />
          </div>
          <div className="form-group">
            <label>Frequency</label>
            <input value={terms.session?.frequency} onChange={(e) => setTerms({ ...terms, session: { ...terms.session, frequency: e.target.value } })} />
          </div>
        </div>
        <div className="flex flex-between">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={() => onSubmit(terms)}>Send counter-offer</button>
        </div>
      </div>
    </div>
  );
}

function ReviewModal({ swap, revieweeId, onClose, onSubmit }) {
  const [form, setForm] = useState({ skillQuality: 5, punctuality: 5, communication: 5, comment: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await reviewApi.create({ swapRequestId: swap._id, revieweeId, ...form });
      onSubmit();
    } catch (e) {
      setErr(errMsg(e));
    }
    setBusy(false);
  };

  const Rate = ({ label, field }) => (
    <div className="form-group">
      <label>{label}</label>
      <select value={form[field]} onChange={(e) => setForm({ ...form, [field]: Number(e.target.value) })}>
        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
      </select>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-1">Rate this swap</h3>
        {err && <div className="alert alert-error">{err}</div>}
        <div className="grid grid-3">
          <Rate label="Skill quality" field="skillQuality" />
          <Rate label="Punctuality" field="punctuality" />
          <Rate label="Communication" field="communication" />
        </div>
        <div className="form-group">
          <label>Comment</label>
          <textarea rows={3} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="How was the swap experience?" />
        </div>
        <div className="flex flex-between">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={submit} disabled={busy}>{busy ? 'Submitting…' : 'Submit review'}</button>
        </div>
      </div>
    </div>
  );
}

function DisputeModal({ swap, onClose, onSubmit }) {
  const [form, setForm] = useState({ reason: 'No-show', description: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await disputeApi.create({ swapRequestId: swap._id, ...form });
      onSubmit();
    } catch (e) {
      setErr(errMsg(e));
    }
    setBusy(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-1">Report a dispute</h3>
        <p className="text-sm muted mb-2">Our team will review this and follow up with both parties.</p>
        {err && <div className="alert alert-error">{err}</div>}
        <div className="form-group">
          <label>Reason</label>
          <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
            <option>No-show</option>
            <option>Poor skill quality</option>
            <option>Inappropriate behavior</option>
            <option>Misrepresentation</option>
            <option>Other</option>
          </select>
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What happened?" />
        </div>
        <div className="flex flex-between">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={submit} disabled={busy}>{busy ? 'Submitting…' : 'Submit dispute'}</button>
        </div>
      </div>
    </div>
  );
}
