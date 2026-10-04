import { Navigate, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className="spin" />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;

  const doLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <Link to="/admin" className="admin-brand">
          🛡️ SkillSwap Admin
        </Link>
        <div className="admin-topbar-right">
          <Link to="/" className="admin-link">View site</Link>
          <span className="admin-user">{user.name}</span>
          <button className="btn btn-sm btn-outline" onClick={doLogout}>Logout</button>
        </div>
      </header>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
