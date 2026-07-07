
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SiteNotification } from '../types';
import { mongoService } from '../services/mongoService';
// ── helpers ────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { emoji: string; color: string; bg: string; label: string }> = {
  LIKE:       { emoji: '❤️',  color: '#ec4899', bg: 'rgba(236,72,153,0.12)', label: 'Like' },
  REACTION:   { emoji: '🔥',  color: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'Reaction' },
  MENTION:    { emoji: '📢',  color: '#6366f1', bg: 'rgba(99,102,241,0.12)', label: 'Mention' },
  FRIEND_REQ: { emoji: '👥',  color: '#22c55e', bg: 'rgba(34,197,94,0.12)', label: 'Friend Request' },
  REWARD:     { emoji: '🎁',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Reward' },
  GAME_ALERT: { emoji: '🎮',  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'Game' },
  SYSTEM:     { emoji: '🔔',  color: '#7c3aed', bg: 'rgba(124,58,237,0.12)', label: 'System' },
  MESSAGE:    { emoji: '💬',  color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)', label: 'Message' },
};



const FILTERS = [
  { key: 'ALL',     label: 'All',     emoji: '🔔' },
  { key: 'SOCIAL',  label: 'Social',  emoji: '💬' },
  { key: 'GAMES',   label: 'Games',   emoji: '🎮' },
  { key: 'REWARDS', label: 'Rewards', emoji: '🎁' },
  { key: 'SYSTEM',  label: 'System',  emoji: '⚙️' },
];

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function filterMatch(n: SiteNotification, f: string): boolean {
  if (f === 'ALL') return true;
  if (f === 'SOCIAL') return ['MENTION', 'LIKE', 'FRIEND_REQ', 'REACTION'].includes(n.type);
  if (f === 'GAMES')  return n.type === 'GAME_ALERT';
  if (f === 'REWARDS') return n.type === 'REWARD';
  if (f === 'SYSTEM') return n.type === 'SYSTEM';
  return true;
}

// ── component ──────────────────────────────────────────────────────────────

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<SiteNotification[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const userId = (() => {
    try { return JSON.parse(localStorage.getItem('user_session') || '{}').id || ''; }
    catch { return ''; }
  })();

  // ── Load: Firestore stream ──
  useEffect(() => {
    setLoading(true);

    const unsub = mongoService.listenUserNotifications(userId, (fsNotifs) => {
      setNotifications(fsNotifs as SiteNotification[]);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  // ── Actions ────────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    await mongoService.markAllNotificationsRead(userId, unreadIds);
  }, [notifications, userId]);

  const markRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    await mongoService.markNotificationRead(userId, id);
  }, [userId]);

  const deleteNotif = useCallback(async (id: string) => {
    setDeletingId(id);
    setTimeout(async () => {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await mongoService.deleteNotification(userId, id);
      setDeletingId(null);
    }, 300);
  }, [userId]);

  const clearAllNotifications = useCallback(async () => {
    if (!window.confirm('Are you sure you want to delete all notifications?')) return;
    setNotifications([]);
    await mongoService.deleteAllNotifications(userId);
  }, [userId]);

  // ── Derived ─────────────────────────────────────────────────
  const filtered = notifications.filter(n => filterMatch(n, filter));
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const filterCounts: Record<string, number> = {
    ALL: notifications.length,
    SOCIAL: notifications.filter(n => filterMatch(n, 'SOCIAL')).length,
    GAMES: notifications.filter(n => filterMatch(n, 'GAMES')).length,
    REWARDS: notifications.filter(n => filterMatch(n, 'REWARDS')).length,
    SYSTEM: notifications.filter(n => filterMatch(n, 'SYSTEM')).length,
  };

  return (
    <div className="notif-page">

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="notif-header">
        <div className="notif-header-glow" />

        <div className="notif-header-top">
          <button className="notif-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          <div className="notif-title-block">
            <h1 className="notif-title">Notifications</h1>
            {unreadCount > 0 && (
              <span className="notif-unread-badge">{unreadCount} new</span>
            )}
          </div>

          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button className="notif-mark-all-btn" onClick={markAllRead}>
                ✓ Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button className="notif-clear-all-btn" onClick={clearAllNotifications} title="Delete all notifications">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="notif-filters">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`notif-filter-tab ${filter === f.key ? 'filter-active' : ''}`}
            >
              <span>{f.emoji}</span>
              <span>{f.label}</span>
              {filterCounts[f.key] > 0 && (
                <span className={`filter-count ${filter === f.key ? 'filter-count-active' : ''}`}>
                  {filterCounts[f.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* ── LIST ──────────────────────────────────────────── */}
      <div className="notif-list">

        {loading ? (
          /* Skeleton */
          <div className="notif-skeleton-wrap">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="notif-skeleton">
                <div className="sk-avatar" />
                <div className="sk-body">
                  <div className="sk-line sk-line-wide" />
                  <div className="sk-line sk-line-narrow" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state */
          <div className="notif-empty">
            <div className="notif-empty-icon">📭</div>
            <p className="notif-empty-title">No notifications here</p>
            <p className="notif-empty-sub">You're all caught up! Check back later.</p>
          </div>
        ) : (
          /* Notification cards */
          <>
            {/* Today group */}
            {filtered.some(n => Date.now() - n.timestamp < 86400000) && (
              <p className="notif-group-label">Today</p>
            )}
            {filtered.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.SYSTEM;
              const isDeleting = deletingId === n.id;
              return (
                <div
                  key={n.id}
                  className={`notif-card ${!n.isRead ? 'notif-card-unread' : ''} ${isDeleting ? 'notif-card-exit' : ''} ${n.type === 'MESSAGE' ? 'notif-card-message' : ''}`}
                  onClick={() => { markRead(n.id); if (n.link) navigate(n.link); }}
                >
                  {/* Unread indicator bar */}
                  {!n.isRead && <div className="notif-unread-bar" />}

                  {/* Avatar */}
                  <div className="notif-avatar-wrap">
                    <img
                      src={n.senderAvatar}
                      alt={n.senderName}
                      className="notif-avatar"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${n.senderId}/100`; }}
                    />
                    <div
                      className="notif-type-badge"
                      style={{ background: meta.color }}
                      title={meta.label}
                    >
                      {meta.emoji}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="notif-body">
                    <div className="notif-body-top">
                      <span
                        className="notif-type-pill"
                        style={{ background: meta.bg, color: meta.color }}
                      >
                        {meta.label}
                      </span>
                      <span className="notif-time">{timeAgo(n.timestamp)}</span>
                    </div>
                    <p className="notif-message">
                      <span className="notif-sender">{n.senderName}</span>{' '}
                      {n.message}
                    </p>
                    {/* Message type: show quick reply button */}
                    {n.type === 'MESSAGE' && n.link && (
                      <button
                        className="notif-reply-btn"
                        onClick={(e) => { e.stopPropagation(); markRead(n.id); navigate(n.link!); }}
                      >
                        💬 Open Chat
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="notif-actions" onClick={e => e.stopPropagation()}>
                    {!n.isRead && (
                      <button
                        className="notif-action-btn"
                        onClick={() => markRead(n.id)}
                        title="Mark as read"
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    <button
                      className="notif-action-btn notif-delete-btn"
                      onClick={() => deleteNotif(n.id)}
                      title="Delete"
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ── STYLES ────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        .notif-page {
          min-height: 100vh;
          background: #f8fafc;
          font-family: 'Inter', sans-serif;
          padding-bottom: 5rem;
        }

        /* ── Header ── */
        .notif-header {
          background: linear-gradient(135deg, #4f0abf 0%, #7c3aed 50%, #6d28d9 100%);
          padding: 1.25rem 1.25rem 0;
          border-radius: 0 0 2rem 2rem;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 30px rgba(109,40,217,0.35);
          margin-bottom: 1.25rem;
        }
        .notif-header-glow {
          position: absolute;
          width: 250px; height: 250px;
          background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%);
          top: -80px; right: -60px;
          pointer-events: none;
        }

        .notif-header-top {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          margin-bottom: 1.25rem;
          position: relative;
          z-index: 1;
        }
        .notif-back-btn {
          width: 40px; height: 40px;
          border-radius: 12px;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          backdrop-filter: blur(8px);
        }
        .notif-back-btn:hover { background: rgba(255,255,255,0.25); }
        .notif-back-btn:active { transform: scale(0.93); }

        .notif-title-block {
          flex: 1;
          display: flex; align-items: center; gap: 10px;
        }
        .notif-title {
          font-size: 1.35rem; font-weight: 900; color: #fff;
          letter-spacing: -0.02em; margin: 0;
        }
        .notif-unread-badge {
          background: linear-gradient(135deg, #ec4899, #f43f5e);
          color: #fff; font-size: 0.6rem; font-weight: 800;
          padding: 3px 10px; border-radius: 999px;
          letter-spacing: 0.04em;
          box-shadow: 0 2px 10px rgba(236,72,153,0.4);
          white-space: nowrap;
        }
        .notif-mark-all-btn {
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff; font-size: 0.65rem; font-weight: 700;
          padding: 7px 14px; border-radius: 10px;
          cursor: pointer; transition: all 0.2s;
          white-space: nowrap; flex-shrink: 0;
          backdrop-filter: blur(8px);
          letter-spacing: 0.02em;
        }
        .notif-mark-all-btn:hover { background: rgba(255,255,255,0.25); }

        .notif-clear-all-btn {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fef2f2; font-size: 0.65rem; font-weight: 700;
          padding: 7px 14px; border-radius: 10px;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; gap: 4px;
          white-space: nowrap; flex-shrink: 0;
          backdrop-filter: blur(8px);
          letter-spacing: 0.02em;
        }
        .notif-clear-all-btn:hover { background: rgba(239, 68, 68, 0.4); border-color: rgba(239, 68, 68, 0.5); }
        .notif-clear-all-btn:active { transform: scale(0.95); }

        /* Filter tabs */
        .notif-filters {
          display: flex; gap: 8px;
          overflow-x: auto; padding: 0 2px 1rem;
          scrollbar-width: none;
          position: relative; z-index: 1;
        }
        .notif-filters::-webkit-scrollbar { display: none; }
        .notif-filter-tab {
          display: inline-flex; align-items: center; gap: 5px;
          white-space: nowrap;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.75);
          font-size: 0.7rem; font-weight: 700;
          padding: 7px 14px; border-radius: 10px;
          cursor: pointer; transition: all 0.2s;
          flex-shrink: 0;
          backdrop-filter: blur(8px);
        }
        .notif-filter-tab:hover { background: rgba(255,255,255,0.2); color: #fff; }
        .filter-active {
          background: #fff !important;
          color: #7c3aed !important;
          border-color: #fff !important;
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
        }
        .filter-count {
          background: rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.9);
          font-size: 0.58rem; font-weight: 800;
          padding: 1px 7px; border-radius: 999px;
          min-width: 18px; text-align: center;
        }
        .filter-count-active {
          background: #7c3aed !important;
          color: #fff !important;
        }

        /* ── List ── */
        .notif-list {
          padding: 0 1rem;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .notif-group-label {
          font-size: 0.65rem; font-weight: 800; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.12em;
          padding: 0 4px; margin: 4px 0 2px;
        }

        /* Skeleton */
        .notif-skeleton-wrap { display: flex; flex-direction: column; gap: 10px; }
        .notif-skeleton {
          background: #fff; border-radius: 18px; padding: 16px;
          display: flex; align-items: center; gap: 14px;
          border: 1px solid #f1f5f9;
        }
        .sk-avatar {
          width: 52px; height: 52px; border-radius: 14px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          flex-shrink: 0;
        }
        .sk-body { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .sk-line {
          height: 10px; border-radius: 6px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        .sk-line-wide { width: 70%; }
        .sk-line-narrow { width: 40%; }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Empty */
        .notif-empty {
          text-align: center; padding: 4rem 2rem;
          background: #fff; border-radius: 24px;
          border: 1px solid #f1f5f9;
        }
        .notif-empty-icon { font-size: 3rem; margin-bottom: 1rem; }
        .notif-empty-title {
          font-size: 0.9rem; font-weight: 800; color: #334155;
          margin: 0 0 6px;
        }
        .notif-empty-sub {
          font-size: 0.75rem; color: #94a3b8; font-weight: 500; margin: 0;
        }

        /* ── Card ── */
        .notif-card {
          background: #fff;
          border: 1px solid #f1f5f9;
          border-radius: 18px;
          padding: 14px 14px 14px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .notif-card:hover {
          border-color: #e2e8f0;
          box-shadow: 0 4px 16px rgba(0,0,0,0.07);
          transform: translateY(-1px);
        }
        .notif-card:active { transform: scale(0.99); }
        .notif-card-unread {
          background: linear-gradient(135deg, #faf5ff 0%, #fdf4ff 100%);
          border-color: #e9d5ff;
          box-shadow: 0 2px 12px rgba(124,58,237,0.07);
        }
        .notif-card-exit {
          opacity: 0;
          transform: translateX(30px) scale(0.97);
          pointer-events: none;
        }
        .notif-unread-bar {
          position: absolute;
          left: 0; top: 20%; bottom: 20%;
          width: 3px; border-radius: 0 4px 4px 0;
          background: linear-gradient(180deg, #7c3aed, #ec4899);
          box-shadow: 0 0 8px rgba(124,58,237,0.4);
        }

        /* Avatar */
        .notif-avatar-wrap {
          position: relative; flex-shrink: 0;
          width: 52px; height: 52px;
        }
        .notif-avatar {
          width: 52px; height: 52px;
          border-radius: 14px; object-fit: cover;
          border: 2px solid #f8fafc;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .notif-type-badge {
          position: absolute;
          bottom: -4px; right: -4px;
          width: 22px; height: 22px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.65rem;
          border: 2px solid #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }

        /* Body */
        .notif-body {
          flex: 1; min-width: 0;
          display: flex; flex-direction: column; gap: 5px;
        }
        .notif-body-top {
          display: flex; align-items: center; gap: 8px;
        }
        .notif-type-pill {
          font-size: 0.58rem; font-weight: 800;
          padding: 2px 8px; border-radius: 999px;
          letter-spacing: 0.04em; text-transform: uppercase;
          flex-shrink: 0;
        }
        .notif-time {
          font-size: 0.62rem; font-weight: 600; color: #94a3b8;
          margin-left: auto; flex-shrink: 0;
          white-space: nowrap;
        }
        .notif-message {
          font-size: 0.8rem; color: #475569;
          line-height: 1.45; margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .notif-sender {
          font-weight: 800; color: #1e293b;
        }

        /* Actions */
        .notif-actions {
          display: flex; flex-direction: column; gap: 4px;
          flex-shrink: 0;
        }
        .notif-action-btn {
          width: 30px; height: 30px;
          border-radius: 9px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #94a3b8;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.18s;
        }
        .notif-action-btn:hover { background: #e0f2fe; border-color: #7dd3fc; color: #0284c7; }
        .notif-delete-btn:hover { background: #fef2f2 !important; border-color: #fca5a5 !important; color: #ef4444 !important; }
        .notif-action-btn:active { transform: scale(0.9); }

        /* Message type notification card */
        .notif-card-message {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-color: #bae6fd;
        }
        .notif-card-message .notif-unread-bar {
          background: linear-gradient(180deg, #0ea5e9, #38bdf8);
          box-shadow: 0 0 8px rgba(14,165,233,0.4);
        }

        /* Open Chat reply button inside message notification */
        .notif-reply-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-top: 6px;
          padding: 5px 12px;
          background: linear-gradient(135deg, #0ea5e9, #38bdf8);
          color: #fff;
          font-size: 0.65rem;
          font-weight: 800;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.18s;
          letter-spacing: 0.02em;
          box-shadow: 0 2px 8px rgba(14,165,233,0.3);
        }
        .notif-reply-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(14,165,233,0.4);
        }
        .notif-reply-btn:active { transform: scale(0.95); }

        @media (max-width: 480px) {
          .notif-header { padding: 0.875rem 0.75rem 0; }
          .notif-header-top { gap: 0.5rem; flex-wrap: wrap; }
          .notif-title { font-size: 1.1rem; }
          .notif-mark-all-btn, .notif-clear-all-btn { padding: 4px 8px; font-size: 0.55rem; }
          .notif-card { padding: 10px; gap: 10px; }
          .notif-avatar-wrap, .notif-avatar { width: 40px; height: 40px; }
          .notif-type-badge { width: 18px; height: 18px; font-size: 0.48rem; bottom: -3px; right: -3px; border-width: 1.5px; }
          .notif-actions { gap: 2px; }
          .notif-action-btn { width: 26px; height: 26px; }
          .notif-action-btn svg { width: 12px; height: 12px; }
          .notif-body { gap: 3px; }
          .notif-body-top { gap: 4px; }
          .notif-type-pill { font-size: 0.5rem; padding: 1px 6px; }
          .notif-time { font-size: 0.55rem; }
          .notif-message { font-size: 0.72rem; }
          .notif-empty { padding: 2.5rem 1.25rem; }
          .notif-empty-icon { font-size: 2.2rem; }
          .notif-filters { gap: 5px; padding-bottom: 0.75rem; }
          .notif-filter-tab { padding: 5px 10px; font-size: 0.6rem; }
          .notif-reply-btn { padding: 4px 8px; font-size: 0.55rem; }
        }
      `}</style>
    </div>
  );
};

export default Notifications;
