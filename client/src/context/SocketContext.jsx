import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { notificationApi } from '../api';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [messageEvent, setMessageEvent] = useState(null);
  const [swapEvent, setSwapEvent] = useState(null);
  const lastNotif = useRef(null);

  useEffect(() => {
    if (!user) {
      if (socket) socket.disconnect();
      setSocket(null);
      return;
    }
    const token = localStorage.getItem('token');
    const s = io('/', { auth: { token }, transports: ['websocket'] });
    setSocket(s);

    s.on('notification:new', (notif) => {
      if (lastNotif.current && lastNotif.current._id === notif._id) return;
      lastNotif.current = notif;
      setNotifications((prev) => [notif, ...prev]);
      setUnread((n) => n + 1);
    });

    s.on('message:new', ({ conversationId, message }) => {
      setMessageEvent({ conversationId, message, ts: Date.now() });
    });

    s.on('swap:update', ({ swapId, status, updatedAt }) => {
      setSwapEvent({ swapId, status, updatedAt, ts: Date.now() });
    });

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [user]);

  const fetchUnread = useCallback(async () => {
    if (!user) return;
    try {
      const data = await notificationApi.list({ limit: 30 });
      setNotifications(data.notifications);
      setUnread(data.unread);
    } catch {
      /* ignore */
    }
  }, [user]);

  useEffect(() => {
    fetchUnread();
  }, [fetchUnread]);

  const markRead = useCallback(async (id) => {
    setUnread((n) => Math.max(0, n - 1));
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <SocketContext.Provider
      value={{ socket, unread, notifications, markRead, messageEvent, swapEvent, fetchUnread, onlineUsers }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
