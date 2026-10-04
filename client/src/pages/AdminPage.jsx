import { useEffect, useState } from 'react';
import { adminApi, errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

const TABS = ['Dashboard', 'Connections', 'Users', 'Verification'];

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('Dashboard');
  return (
    <div className="container mt-2 mb-3">
      <div className="admin-head">
        <div>
          <h1 className="page-title mb-0">Admin Dashboard</h1>
          <p className="muted text-sm">Welcome, {user?.name}. Here you can manage users, connections and verification.</p>
        </div>
      </div>
      <div className="tabs mb-2">
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'Dashboard' && <AdminDashboard />}
      {tab === 'Connections' && <AdminConnections />}
      {tab === 'Users' && <AdminUsers />}
      {tab === 'Verification' && <AdminVerification />}
    </div>
  );
}

function useAdmin() {
  const [err, setErr] = useState('');
  const showErr = (e) => setErr(errMsg(e));
  return { err, showErr };
}

function AdminDashboard() {
  const [data, setData] = useState(null);
  useEffect(() => {
    adminApi.dashboard().then((d) => setData(d)).catch(() => {});
  }, []);
  if (!data) return <div className="spin" />;
  return (
    <>
      <div className="grid grid-4">
        {[
          ['Total users', data.stats.users],
          ['Total swaps', data.stats.swaps],
          ['Active swaps', data.stats.activeSwaps],
          ['Completed swaps', data.stats.completedSwaps],
        ].map(([label, val]) => (
          <div key={label} className="card stat-tile">
            <div className="stat-label">{label}</div>
            <div className="stat-value">{val}</div>
          </div>
        ))}
      </div>
      <div className="card mt-2">
        <h3 className="mb-1">Recent registrations</h3>
        {data.recentUsers.map((u) => (
          <div key={u._id} className="feed-row">
            <Avatar user={u} />
            <div>
              <div className="text-sm"><strong>{u.name}</strong></div>
              <div className="text-sm muted">{u.email} · joined {new Date(u.joinedAt).toLocaleDateString()}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

const STATUS_META = {
  pending: { label: 'Pending', cls: 'pending' },
  counter_offered: { label: 'Countered', cls: 'counter' },
  accepted: { label: 'Accepted', cls: 'accepted' },
  confirmed: { label: 'Confirmed', cls: 'confirmed' },
  completed: { label: 'Completed', cls: 'completed' },
  declined: { label: 'Declined', cls: 'declined' },
  cancelled: { label: 'Cancelled', cls: 'cancelled' },
  disputed: { label: 'Disputed', cls: 'disputed' },
};
const FILTERS = ['', 'pending', 'accepted', 'confirmed', 'completed', 'counter_offered', 'declined', 'cancelled', 'disputed'];

function AdminConnections() {
  const { err, showErr } = useAdmin();
  const [status, setStatus] = useState('');
  const [data, setData] = useState(null);
  const load = () => adminApi.swaps({ status: status || undefined, limit: 100 }).then((d) => setData(d)).catch(showErr);
  useEffect(() => { load(); }, [status]);
  if (!data) return <div className="spin" />;

  return (
    <div className="card">
      {err && <div className="alert alert-error">{err}</div>}
      <div className="flex-between mb-1">
        <h3 className="mb-0">Skill connections &amp; swap history</h3>
        <span className="muted text-sm">{data.total} swap{data.total === 1 ? '' : 's'}</span>
      </div>
      <div className="filter-chips mb-1">
        {FILTERS.map((s) => (
          <button
            key={s || 'all'}
            className={`chip-filter ${status === s ? 'active' : ''}`}
            onClick={() => setStatus(s)}
          >
            {s ? STATUS_META[s].label : 'All'}
          </button>
        ))}
      </div>
      {data.swaps.length === 0 && <p className="muted">No swaps yet.</p>}
      {data.swaps.map((sw) => (
        <div key={sw._id} className="admin-swap-row">
          <div className="admin-swap-people">
            <div className="flex">
              <Avatar user={sw.fromUser} />
              <div className="ml-1">
                <div className="text-sm"><strong>{sw.fromUser?.name || 'User'}</strong></div>
                <div className="text-xs muted">requested swap</div>
              </div>
            </div>
            <span className="swap-arrow">⇄</span>
            <div className="flex">
              <Avatar user={sw.toUser} />
              <div className="ml-1">
                <div className="text-sm"><strong>{sw.toUser?.name || 'User'}</strong></div>
                <div className="text-xs muted">receives request</div>
              </div>
            </div>
          </div>
          <div className="admin-swap-skills">
            <span className="skill-offer">{sw.terms?.offeredSkill || '—'}</span>
            <span className="swap-arrow">⇄</span>
            <span className="skill-req">{sw.terms?.requestedSkill || '—'}</span>
          </div>
          <div className="admin-swap-status">
            <span className={`status-chip ${STATUS_META[sw.status]?.cls || 'pending'}`}>{STATUS_META[sw.status]?.label || sw.status}</span>
          </div>
          <div className="admin-swap-date text-xs muted">
            {new Date(sw.createdAt).toLocaleDateString()}<br />{new Date(sw.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminUsers() {
  const { err, showErr } = useAdmin();
  const [data, setData] = useState(null);
  const load = () => adminApi.users({ limit: 100 }).then((d) => setData(d)).catch(showErr);
  useEffect(() => { load(); }, []);
  if (!data) return <div className="spin" />;

  const approve = async (u) => { await adminApi.verifyUser(u._id).catch(showErr); load(); };
  const del = async (u) => {
    if (!confirm(`Delete ${u.name} permanently? This removes their listings, swaps, chats, reviews and notifications.`)) return;
    await adminApi.deleteUser(u._id).catch(showErr);
    load();
  };

  return (
    <div className="card">
      {err && <div className="alert alert-error">{err}</div>}
      <div className="flex-between mb-1">
        <h3 className="mb-0">Total users</h3>
        <span className="muted text-sm">{data.total}</span>
      </div>
      <table className="admin-table">
        <thead>
          <tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Rep</th><th>Swaps</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {data.users.map((u) => (
            <tr key={u._id}>
              <td><strong>{u.name}</strong></td>
              <td className="muted">{u.email}</td>
              <td>{u.role}</td>
              <td>
                {u.isVerified && <span className="badge-chip">✓ Verified</span>}
                {u.verificationPending && <span className="badge-chip">⏳ Pending verification</span>}
                {u.isFlagged && <span className="badge-chip flag">🚩 Flagged</span>}
                {!u.isVerified && !u.verificationPending && !u.isFlagged && <span className="muted text-sm">—</span>}
              </td>
              <td>{u.reputationScore}</td>
              <td>{u.swapsCompleted}</td>
              <td>
                <div className="flex">
                  {u.verificationPending && <button className="btn btn-sm btn-success" onClick={() => approve(u)}>Approve ✓</button>}
                  <button className="btn btn-sm btn-danger" onClick={() => del(u)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminVerification() {
  const { err, showErr } = useAdmin();
  const [data, setData] = useState(null);
  const load = () => adminApi.verificationQueue().then((d) => setData(d)).catch(showErr);
  useEffect(() => { load(); }, []);
  if (!data) return <div className="spin" />;

  const approve = async (u) => { await adminApi.verifyUser(u._id).catch(showErr); load(); };

  return (
    <div className="card">
      {err && <div className="alert alert-error">{err}</div>}
      <h3 className="mb-1">Identity verification requests</h3>
      {data.queue.length === 0 && <p className="muted">No pending verification requests. Users can request one from their Settings page.</p>}
      {data.queue.map((u) => (
        <div key={u._id} className="feed-row">
          <Avatar user={u} />
          <div className="flex-1">
            <strong className="text-sm">{u.name}</strong>
            <div className="text-sm muted">{u.email} · requested {new Date(u.joinedAt).toLocaleDateString()}</div>
            <div className="text-sm">{u.bio}</div>
          </div>
          <button className="btn btn-sm btn-success" onClick={() => approve(u)}>Approve ✓</button>
        </div>
      ))}
    </div>
  );
}
