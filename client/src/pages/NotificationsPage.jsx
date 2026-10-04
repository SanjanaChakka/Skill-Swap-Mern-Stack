import { useEffect, useState } from 'react';
import { notificationApi } from '../api';
import { timeAgo } from '../utils';
import { useSocket } from '../context/SocketContext';

export default function NotificationsPage() {
  const { notifications, fetchUnread, markRead } = useSocket();
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchUnread();
    notificationApi.list({ limit: 50 }).then((r) => setItems(r.notifications)).catch(() => {});
  }, []);

  useEffect(() => {
    if (notifications.length) {
      setItems((prev) => {
        const ids = new Set(prev.map((n) => n._id));
        const merged = [...notifications.filter((n) => !ids.has(n._id)), ...prev];
        return merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });
    }
  }, [notifications]);

  const iconFor = (t) => {
    switch (t) {
      case 'swap': return '🤝';
      case 'swap_request': return '📨';
      case 'message': return '💬';
      case 'review': return '⭐';
      case 'badge': return '🏅';
      case 'moderation': return '🚩';
      case 'verification': return '✅';
      case 'dispute': return '⚖️';
      default: return '🔔';
    }
  };

  return (
    <div className="container mt-2 mb-3" style={{ maxWidth: 720 }}>
      <div className="flex-between mb-2">
        <h1 className="page-title">Notifications</h1>
        <button className="btn btn-sm btn-outline" onClick={() => markRead('all')}>Mark all read</button>
      </div>

      <div className="card">
        {items.length === 0 && <div className="empty">You're all caught up! 🎉</div>}
        {items.map((n) => (
          <div
            key={n._id}
            className={`notif-item ${n.read ? '' : 'unread'}`}
            onClick={() => markRead(n._id)}
          >
            <span className="notif-icon">{iconFor(n.type)}</span>
            <div className="flex-1">
              <div className="text-sm"><strong>{n.title}</strong></div>
              {n.body && <div className="text-sm muted">{n.body}</div>}
              <div className="text-sm muted">{timeAgo(n.createdAt)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
