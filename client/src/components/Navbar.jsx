import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Avatar from './Avatar';

function NotificationBell() {
  const { unread, notifications, markRead } = useSocket();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  return (
    <div className="notif-wrap" onClick={(e) => e.stopPropagation()}>
      <button className="nav-link notif-btn" onClick={() => setOpen((o) => !o)} aria-label="Notifications">
        🔔{unread > 0 && <span className="notif-dot">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="notif-dropdown card">
          <div className="flex-between mb-1">
            <strong>Notifications</strong>
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/notifications')}>
              View all
            </button>
          </div>
          {notifications.length === 0 && <div className="muted text-sm">No notifications yet.</div>}
          {notifications.slice(0, 6).map((n) => (
            <div key={n._id} className={`notif-item ${n.read ? '' : 'unread'}`} onClick={() => markRead(n._id)}>
              <div className="text-sm">
                <strong>{n.title}</strong>
              </div>
              <div className="text-sm muted">{n.body}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container flex-between">
        <Link to="/" className="brand">
          🤝 SkillSwap
        </Link>
        <nav className="nav-links">
          <NavLink to="/browse">Browse</NavLink>
          <NavLink to="/feed">Community</NavLink>
          <NavLink to="/swaps">My Swaps</NavLink>
          <NavLink to="/messages">Messages</NavLink>
        </nav>
        <div className="nav-right">
          {user ? (
            <>
              <NotificationBell />
              <button className="btn btn-sm" onClick={() => navigate('/listings/new')}>
                + Offer a Skill
              </button>
              <div className="nav-user">
                <Link to="/me">
                  <Avatar user={user} />
                </Link>
                <button className="nav-link" onClick={doLogout}>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/login')}>
                Login
              </button>
              <button className="btn btn-sm" onClick={() => navigate('/register')}>
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
