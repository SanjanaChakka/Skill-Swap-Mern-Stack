import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { messageApi, errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Avatar from '../components/Avatar';
import { timeAgo } from '../utils';

export default function MessagingPage() {
  const { user } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { socket, messageEvent } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [showVideo, setShowVideo] = useState(false);
  const [err, setErr] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    messageApi.conversations().then((r) => setConversations(r.conversations)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!conversationId) {
      setActive(null);
      setMessages([]);
      return;
    }
    messageApi.messages(conversationId).then((r) => {
      setActive(r.conversation);
      setMessages(r.messages);
    }).catch((e) => setErr(errMsg(e)));
  }, [conversationId]);

  useEffect(() => {
    if (messageEvent && messageEvent.conversationId === conversationId) {
      setMessages((prev) => [...prev.filter((m) => m._id !== messageEvent.message._id), messageEvent.message]);
    } else if (messageEvent) {
      messageApi.conversations().then((r) => setConversations(r.conversations)).catch(() => {});
    }
  }, [messageEvent]);

  useEffect(() => {
    if (!socket || !conversationId) return;
    socket.emit('joinConversation', conversationId);
    return () => {
      socket.emit('leaveConversation', conversationId);
    };
  }, [conversationId, socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const openConversation = async (otherUser) => {
    try {
      const { conversation } = await messageApi.getOrCreate({ otherUserId: otherUser });
      navigate(`/messages/${conversation._id}`);
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const { message } = await messageApi.send(conversationId, { content: text });
      setMessages((prev) => [...prev, message]);
      setText('');
      messageApi.conversations().then((r) => setConversations(r.conversations)).catch(() => {});
    } catch (e2) {
      setErr(errMsg(e2));
    }
  };

  const shareVideo = async (e) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;
    try {
      const { message } = await messageApi.shareVideo(conversationId, videoUrl);
      setMessages((prev) => [...prev, message]);
      setVideoUrl('');
      setShowVideo(false);
    } catch (e3) {
      setErr(errMsg(e3));
    }
  };

  const otherOf = (conv) => conv.participants?.find((p) => String(p._id) !== String(user?._id));

  return (
    <div className="container mt-2 mb-3">
      <h1 className="page-title mb-2">Messages</h1>
      {err && <div className="alert alert-error">{err}</div>}

      <div className="messaging">
        <div className="conv-list card">
          {conversations.length === 0 && <p className="muted text-sm">No conversations yet. Request a swap to start chatting!</p>}
          {conversations.map((conv) => {
            const other = otherOf(conv);
            return (
              <div
                key={conv._id}
                className={`conv-item ${String(conv._id) === String(conversationId) ? 'active' : ''}`}
                onClick={() => openConversation(other)}
              >
                <Avatar user={other} />
                <div className="flex-1">
                  <div className="flex-between">
                    <strong className="text-sm">{other?.name}</strong>
                    <span className="muted text-sm">{timeAgo(conv.lastMessageAt)}</span>
                  </div>
                  <div className="text-sm muted conv-preview">{conv.lastMessage || 'Start a conversation'}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="chat card">
          {!active ? (
            <div className="empty">
              <p>Select a conversation to start chatting.</p>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <div className="flex">
                  <Avatar user={otherOf(active)} />
                  <strong>{otherOf(active)?.name}</strong>
                </div>
              </div>
              <div className="chat-body">
                {messages.length === 0 && <div className="empty">Say hello and discuss your swap details 👋</div>}
                {messages.map((m) => {
                  const mine = String(m.sender?._id) === String(user?._id);
                  return (
                    <div key={m._id} className={`msg ${mine ? 'mine' : 'theirs'}`}>
                      {m.type === 'video_link' ? (
                        <div className="video-card">
                          <div>🎥 Video call link shared</div>
                          <a href={m.videoLink} target="_blank" rel="noreferrer">{m.videoLink}</a>
                        </div>
                      ) : (
                        <span>{m.content}</span>
                      )}
                      <div className="msg-time">{timeAgo(m.createdAt)}</div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <div className="chat-input">
                {showVideo ? (
                  <form className="flex" onSubmit={shareVideo}>
                    <input
                      placeholder="https://zoom.us/… or https://meet.google.com/…"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                    <button className="btn btn-success btn-sm">Share link</button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowVideo(false)}>✕</button>
                  </form>
                ) : (
                  <form className="flex" onSubmit={send}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      title="Share video call link"
                      onClick={() => setShowVideo(true)}
                    >
                      🎥
                    </button>
                    <input placeholder="Type a message…" value={text} onChange={(e) => setText(e.target.value)} />
                    <button className="btn btn-sm">Send</button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
