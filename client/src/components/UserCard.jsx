import { Link } from 'react-router-dom';
import Avatar from './Avatar';

export default function UserCard({ user }) {
  return (
    <Link to={`/profile/${user._id}`} className="user-card card">
      <div className="flex">
        <Avatar user={user} />
        <div>
          <strong>{user.name}</strong>
          {user.isVerified && <span className="verified"> ✓</span>}
          <div className="text-sm muted">{user.location?.city || 'Remote'}</div>
        </div>
      </div>
      <p className="text-sm mt-1">{user.bio?.slice(0, 100)}</p>
      <div className="flex mt-1 text-sm">
        <span>⭐ {user.reputationScore || 0}</span>
        <span className="muted">· {user.swapsCompleted || 0} swaps</span>
      </div>
      <div className="mt-1">
        {user.skills?.offered?.slice(0, 3).map((s) => (
          <span key={s} className="chip">{s}</span>
        ))}
      </div>
    </Link>
  );
}
