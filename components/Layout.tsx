
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, SiteNotification, UserReminder } from '../types';
import { PageWrapper } from './PageWrapper';
import { gameService } from '../services/gameService';
import { triggerToast } from './NotificationToast';
import { mongoService } from '../services/mongoService';
import FriendsBDLogo from './FriendsBDLogo';



interface LayoutProps {
  user: User;
  onLogout: () => void;
}

const NAV_ITEMS = [
  {
    id: 'home', label: 'Home', path: '/home', emoji: '🏠',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    id: 'shouts', label: 'History', path: '/shouts', emoji: '📣',
    icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z',
  },
  {
    id: 'apps', label: 'Apps', path: '/apps', emoji: '🎮',
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
  },
  {
    id: 'chat', label: 'Chat', path: '/chat', emoji: '💬',
    icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
  },
  {
    id: 'notifications', label: 'Alerts', path: '/notifications', emoji: '🔔',
    icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  },
  {
    id: 'elite-upgrade', label: 'FriendsBD Elite', path: '/elite-upgrade', emoji: '💎',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    id: 'profile', label: 'Me', path: '/profile', emoji: '👤',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
];

const getPageLocationLabel = (pathname: string): string => {
  if (pathname === '/home') return 'Home Page';
  if (pathname === '/shouts') return 'Shout History';
  if (pathname === '/apps') return 'App Center';
  if (pathname === '/chat') return 'Chat Room';
  if (pathname === '/elite-upgrade') return 'FriendsBD Elite';
  if (pathname === '/profile') return 'My Profile';
  if (pathname.startsWith('/profile/')) return 'Viewing Profile';
  if (pathname === '/settings') return 'Settings';
  if (pathname === '/notifications') return 'Notifications';
  if (pathname === '/friends') return 'Friends List';
  if (pathname === '/coin-game') return 'Golden Coin Game';
  if (pathname === '/silver-game') return 'Silver Rush Game';
  if (pathname === '/tournament') return 'Tournaments';
  if (pathname === '/ranks') return 'Leaderboard';
  if (pathname === '/rewards') return 'Rewards Store';
  if (pathname === '/missions') return 'Daily Missions';
  if (pathname === '/quiz') return 'Quiz Area';
  if (pathname === '/marketplace') return 'Marketplace';
  if (pathname === '/inventory') return 'Inventory';
  if (pathname.startsWith('/blog')) return 'Blog';
  if (pathname === '/clan') return 'Clans';
  if (pathname === '/calendar') return 'Events';
  if (pathname === '/groups') return 'Groups';
  if (pathname === '/gallery') return 'Gallery';
  if (pathname === '/stories') return 'Stories';
  return 'Browsing';
};

const Layout: React.FC<LayoutProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [goldActive, setGoldActive] = useState(false);
  const [silverActive, setSilverActive] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);


  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!user.id) return;

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    let accumulatedSeconds = 0;

    const interval = setInterval(() => {
      const now = Date.now();
      const isIdle = (now - lastActivityRef.current) > 2 * 60 * 1000; // 2 minutes

      if (!isIdle) {
        accumulatedSeconds += 1;

        try {
          const session = localStorage.getItem('user_session');
          if (session) {
            const parsed = JSON.parse(session);
            const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });

            if (parsed.lastOnlineDate !== dateStr) {
              parsed.todayOnlineTime = 1;
              parsed.lastOnlineDate = dateStr;
            } else {
              parsed.todayOnlineTime = (parsed.todayOnlineTime || 0) + 1;
            }
            parsed.totalOnlineTime = (parsed.totalOnlineTime || 0) + 1;

            localStorage.setItem('user_session', JSON.stringify(parsed));
            window.dispatchEvent(new Event('storage'));
          }
        } catch (e) {
          console.error('Failed to update active time locally:', e);
        }

        if (accumulatedSeconds >= 10) {
          const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
          const currentLoc = getPageLocationLabel(location.pathname);
          mongoService.incrementUserOnlineTime(user.id, accumulatedSeconds, dateStr);
          mongoService.updateUser(user.id, {
            lastActiveTime: Date.now(),
            currentLocation: currentLoc,
            isOnline: true
          });
          accumulatedSeconds = 0;
        }
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      clearInterval(interval);

      if (accumulatedSeconds > 0) {
        const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
        mongoService.incrementUserOnlineTime(user.id, accumulatedSeconds, dateStr);
      }
    };
  }, [user.id]);

  useEffect(() => {
    if (!user.id) return;
    const unsub = mongoService.listenUserNotifications(user.id, (notifs) => {
      // Count only non-MESSAGE type for the notification bell
      setUnreadNotifs(notifs.filter(n => !n.isRead && n.type !== 'MESSAGE').length);
      // Count unread MESSAGE type for the inbox/chat badge
      setUnreadMsgs(notifs.filter(n => !n.isRead && n.type === 'MESSAGE').length);
    });
    return () => unsub();
  }, [user.id]);

  useEffect(() => {
    const checkReminders = () => {
      const saved = localStorage.getItem('friends_bd_reminders');
      if (!saved) return;
      const reminders: UserReminder[] = JSON.parse(saved);
      const now = Date.now();
      let changed = false;
      const updated = reminders.map(r => {
        if (!r.isNotified && r.dueTime <= now) {
          triggerToast({ id: 'reminder-notif-' + r.id, senderId: 'system', senderName: 'Temporal Protocol', senderAvatar: 'https://picsum.photos/seed/time/100', type: 'SYSTEM', message: `URGENT: ${r.title}`, timestamp: Date.now(), isRead: false });
          changed = true;
          return { ...r, isNotified: true };
        }
        return r;
      });
      if (changed) localStorage.setItem('friends_bd_reminders', JSON.stringify(updated));
    };
    const interval = setInterval(checkReminders, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    gameService.initSpawner();
    setGoldActive(gameService.checkActiveCoin('gold'));
    setSilverActive(gameService.checkActiveCoin('silver'));
    const onDrop = (e: any) => { if (e.detail.type === 'gold') setGoldActive(true); if (e.detail.type === 'silver') setSilverActive(true); };
    const onClaimGold = () => setGoldActive(false);
    const onClaimSilver = () => setSilverActive(false);
    const onStateUpdated = (e: any) => {
      if (e.detail?.type === 'gold') setGoldActive(e.detail.active);
      if (e.detail?.type === 'silver') setSilverActive(e.detail.active);
    };
    window.addEventListener('coin-dropped', onDrop);
    window.addEventListener('coin-claimed', onClaimGold);
    window.addEventListener('silver-claimed', onClaimSilver);
    window.addEventListener('coin-state-updated', onStateUpdated);
    return () => {
      window.removeEventListener('coin-dropped', onDrop);
      window.removeEventListener('coin-claimed', onClaimGold);
      window.removeEventListener('silver-claimed', onClaimSilver);
      window.removeEventListener('coin-state-updated', onStateUpdated);
    };
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="layout-root">

      {/* ═══════════════════════════════════════════
          DESKTOP SIDEBAR
      ═══════════════════════════════════════════ */}
      <aside className={`layout-sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>

        {/* Sidebar glow */}
        <div className="sidebar-glow" />

        {/* Brand */}
        <div className="sidebar-brand" onClick={() => navigate('/home')}>
          <FriendsBDLogo size={42} />
          {!sidebarCollapsed && (
            <div>
              <span className="brand-title">friends bd</span>
              <span className="brand-sub">Community Platform</span>
            </div>
          )}
          <button className="collapse-btn" onClick={(e) => { e.stopPropagation(); setSidebarCollapsed(c => !c); }} title="Toggle sidebar">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={sidebarCollapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
            </svg>
          </button>
        </div>

        {/* User card */}
        {!sidebarCollapsed && (
          <div className="sidebar-user-card" onClick={() => navigate('/profile')}>
            <div className="user-avatar-wrap">
              <img src={user.avatar} alt="" className="user-avatar" />
              <span className="user-online-dot" />
            </div>
            <div className="user-info">
              <div className="user-name-row">
                <span className="user-name">{user.name}</span>
                {user.isVerified && <span title="Verified">✔️</span>}
              {user.isPremium && <span title="FriendsBD Elite">💎</span>}
              </div>
              <span className="user-username">@{user.username}</span>
            </div>
            {user.role === 'admin' && <span className="admin-badge">ADM</span>}
          </div>
        )}
        {sidebarCollapsed && (
          <div className="collapsed-avatar-wrap" onClick={() => navigate('/profile')}>
            <img src={user.avatar} alt="" className="user-avatar" />
            <span className="user-online-dot" />
          </div>
        )}

        {/* Nav items */}
        <nav className="sidebar-nav">
          {!sidebarCollapsed && <span className="nav-section-label">Navigation</span>}
          {NAV_ITEMS.map(item => {
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`sidebar-nav-item ${active ? 'nav-item-active' : ''} ${sidebarCollapsed ? 'nav-item-collapsed' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {active && <span className="nav-active-bar" />}
                <span className="nav-emoji">{item.emoji}</span>
                {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
                {!sidebarCollapsed && item.id === 'chat' && unreadMsgs > 0 && (
                  <span className="nav-badge">{unreadMsgs}</span>
                )}
                {sidebarCollapsed && item.id === 'chat' && unreadMsgs > 0 && (
                  <span className="nav-badge-dot" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="sidebar-bottom">
          <button className="sidebar-action-btn" onClick={() => navigate('/notifications')}>
            <span className="action-icon">🔔</span>
            {!sidebarCollapsed && <span className="action-label">Notifications</span>}
            {unreadNotifs > 0 && <span className={`notif-indicator ${sidebarCollapsed ? 'notif-dot' : 'notif-pill'}`}>{sidebarCollapsed ? '' : unreadNotifs}</span>}
          </button>
          <button className="sidebar-action-btn sidebar-logout" onClick={onLogout}>
            <span className="action-icon">🚪</span>
            {!sidebarCollapsed && <span className="action-label">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════ */}
      <div className={`layout-main ${sidebarCollapsed ? 'main-collapsed' : ''}`}>
        <main className="layout-content">
          <PageWrapper>
            <Outlet context={{ user }} />
          </PageWrapper>

          {/* Coin alerts */}
          <div className="coin-alerts">
            <AnimatePresence>
              {goldActive && location.pathname !== '/coin-game' && (
                <motion.div key="gold-anim" initial={{ scale: 0, x: 50 }} animate={{ scale: 1, x: 0 }} exit={{ scale: 0, x: 50 }}>
                  <Link to="/coin-game" className="coin-alert-btn coin-gold">💰</Link>
                </motion.div>
              )}
              {silverActive && location.pathname !== '/silver-game' && (
                <motion.div key="silver-anim" initial={{ scale: 0, x: 50 }} animate={{ scale: 1, x: 0 }} exit={{ scale: 0, x: 50 }}>
                  <Link to="/silver-game" className="coin-alert-btn coin-silver">🔘</Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* ═══════════════════════════════════════════
            MOBILE BOTTOM NAV
        ═══════════════════════════════════════════ */}
        <nav className="mobile-nav">
          <div className="mobile-nav-inner">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`mobile-nav-item ${active ? 'mobile-item-active' : ''}`}
                >
                  {active && (
                    <motion.div
                      layoutId="mobile-active-pill"
                      className="mobile-active-bg"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <div className="mobile-icon-wrap">
                    <span className="mobile-emoji">{item.emoji}</span>
                    {item.id === 'chat' && unreadMsgs > 0 && (
                      <span className="mobile-badge">{unreadMsgs > 9 ? '9+' : unreadMsgs}</span>
                    )}
                    {item.id === 'notifications' && unreadNotifs > 0 && (
                      <span className="mobile-badge">{unreadNotifs > 9 ? '9+' : unreadNotifs}</span>
                    )}
                  </div>
                  <span className={`mobile-label ${active ? 'mobile-label-active' : ''}`}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* ═══════════════════════════════════════════
          STYLES
      ═══════════════════════════════════════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');

        * { box-sizing: border-box; }

        .layout-root {
          display: flex;
          min-height: 100vh;
          background: #0F0F1A;
          background-image: radial-gradient(ellipse at 50% 0%, rgba(124, 58, 237, 0.15) 0%, transparent 70%), linear-gradient(135deg, #110a2a 0%, #1d0d4a 50%, #0d1a6b 100%);
          font-family: 'Inter', sans-serif;
          color: #e2e8f0;
        }

        /* ── SIDEBAR ── */
        .layout-sidebar {
          width: 260px;
          min-height: 100vh;
          background: linear-gradient(160deg, #0f0a1e 0%, #1a1030 50%, #0d0b1a 100%);
          border-right: 1px solid rgba(167,139,250,0.1);
          display: none;
          flex-direction: column;
          padding: 1.5rem 1rem;
          position: fixed;
          inset-y: 0;
          left: 0;
          z-index: 40;
          transition: width 0.3s cubic-bezier(0.4,0,0.2,1);
          overflow: hidden;
          box-shadow: 4px 0 40px rgba(0,0,0,0.3);
        }
        @media (min-width: 768px) {
          .layout-sidebar { display: flex; }
        }
        .sidebar-collapsed { width: 72px; }

        .sidebar-glow {
          position: absolute;
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%);
          top: -50px; left: -50px;
          pointer-events: none;
        }

        /* Brand */
        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0.5rem 0.5rem 1.25rem;
          cursor: pointer;
          position: relative;
          flex-shrink: 0;
        }
        .brand-logo-img {
          width: 38px; height: 38px;
          object-fit: contain;
          flex-shrink: 0;
          filter: drop-shadow(0 4px 10px rgba(124,58,237,0.4));
        }
        .brand-title {
          display: block;
          font-size: 1rem; font-weight: 900; font-style: italic;
          background: linear-gradient(135deg, #a78bfa, #f9a8d4);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em; white-space: nowrap;
        }
        .brand-sub {
          display: block;
          font-size: 0.55rem; font-weight: 700; color: rgba(167,139,250,0.5);
          text-transform: uppercase; letter-spacing: 0.12em; margin-top: -2px;
          white-space: nowrap;
        }
        .collapse-btn {
          margin-left: auto;
          width: 26px; height: 26px;
          border-radius: 8px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.4);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s; flex-shrink: 0;
        }
        .collapse-btn:hover { background: rgba(167,139,250,0.2); color: #a78bfa; }

        /* User card */
        .sidebar-user-card {
          display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(167,139,250,0.15);
          border-radius: 16px;
          padding: 10px 12px;
          margin-bottom: 1.5rem;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .sidebar-user-card:hover {
          background: rgba(167,139,250,0.1);
          border-color: rgba(167,139,250,0.3);
        }
        .collapsed-avatar-wrap {
          position: relative; width: 38px; height: 38px;
          margin: 0 auto 1.5rem; cursor: pointer; flex-shrink: 0;
        }
        .user-avatar-wrap { position: relative; flex-shrink: 0; }
        .user-avatar {
          width: 36px; height: 36px;
          border-radius: 10px; object-fit: cover;
          border: 2px solid rgba(167,139,250,0.3);
        }
        .user-online-dot {
          position: absolute;
          bottom: -2px; right: -2px;
          width: 10px; height: 10px;
          border-radius: 50%;
          background: #4ade80;
          border: 2px solid #0f0a1e;
          box-shadow: 0 0 6px #4ade80;
        }
        .user-info { flex: 1; min-width: 0; }
        .user-name-row { display: flex; align-items: center; gap: 4px; }
        .user-name { font-size: 0.72rem; font-weight: 800; color: #e2e8f0; truncate: true; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .user-username { font-size: 0.6rem; font-weight: 600; color: rgba(167,139,250,0.6); }
        .admin-badge {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #fff; font-size: 0.55rem; font-weight: 900;
          padding: 2px 7px; border-radius: 6px; flex-shrink: 0;
          letter-spacing: 0.05em;
        }

        /* Nav */
        .sidebar-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(167,139,250,0.2) transparent; }
        .sidebar-nav::-webkit-scrollbar { width: 4px; }
        .sidebar-nav::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.2); border-radius: 4px; }
        .nav-section-label {
          font-size: 0.55rem; font-weight: 800; color: rgba(255,255,255,0.2);
          text-transform: uppercase; letter-spacing: 0.15em;
          padding: 0 8px; margin-bottom: 4px; white-space: nowrap;
        }
        .sidebar-nav-item {
          position: relative;
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;
          border: none; background: transparent; cursor: pointer;
          transition: all 0.2s;
          color: rgba(255,255,255,0.4);
          text-align: left; width: 100%;
          white-space: nowrap;
          overflow: hidden;
        }

        .sidebar-nav-item:hover {
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.8);
        }
        .nav-item-active {
          background: linear-gradient(135deg, rgba(124,58,237,0.25), rgba(236,72,153,0.15)) !important;
          color: #c4b5fd !important;
          border: 1px solid rgba(167,139,250,0.2);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .nav-item-collapsed { justify-content: center; padding: 10px; }
        .nav-active-bar {
          position: absolute; left: 0; top: 50%; transform: translateY(-50%);
          width: 3px; height: 60%; border-radius: 0 4px 4px 0;
          background: linear-gradient(180deg, #a78bfa, #ec4899);
          box-shadow: 0 0 8px rgba(167,139,250,0.6);
        }
        .nav-emoji { font-size: 1.1rem; flex-shrink: 0; }
        .nav-label { font-size: 0.72rem; font-weight: 700; flex: 1; }
        .nav-badge {
          background: linear-gradient(135deg, #ec4899, #f43f5e);
          color: #fff; font-size: 0.6rem; font-weight: 900;
          padding: 2px 7px; border-radius: 999px; flex-shrink: 0;
        }
        .nav-badge-dot {
          position: absolute; top: 8px; right: 8px;
          width: 8px; height: 8px; border-radius: 50%;
          background: #ec4899; border: 2px solid #0f0a1e;
        }

        /* Bottom actions */
        .sidebar-bottom {
          border-top: 1px solid rgba(255,255,255,0.06);
          padding-top: 0.75rem;
          display: flex; flex-direction: column; gap: 4px;
          flex-shrink: 0;
        }
        .sidebar-action-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 14px;
          border: none; background: transparent; cursor: pointer;
          transition: all 0.2s; color: rgba(255,255,255,0.4);
          text-align: left; width: 100%; white-space: nowrap; overflow: hidden;
        }
        .sidebar-action-btn:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7); }
        .sidebar-logout:hover { background: rgba(239,68,68,0.1) !important; color: #f87171 !important; }
        .action-icon { font-size: 1rem; flex-shrink: 0; }
        .action-label { font-size: 0.72rem; font-weight: 700; flex: 1; }
        .notif-pill {
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          color: #fff; font-size: 0.6rem; font-weight: 900;
          padding: 2px 8px; border-radius: 999px; margin-left: auto;
        }
        .notif-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #ec4899; margin-left: auto; flex-shrink: 0;
        }
        .notif-indicator { flex-shrink: 0; }

        /* ── MAIN ── */
        .layout-main {
          flex: 1;
          display: flex; flex-direction: column;
          min-height: 100vh;
          margin-left: 0;
          transition: margin-left 0.3s cubic-bezier(0.4,0,0.2,1);
        }
        @media (min-width: 768px) {
          .layout-main { margin-left: 260px; }
          .main-collapsed { margin-left: 72px; }
        }
        .layout-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          width: 100%;
          max-width: 100%;
        }
        @media (min-width: 768px) {
          .layout-content {  }
        }

        /* Coin alerts */
        .coin-alerts {
          position: fixed; bottom: 100px; right: 1.25rem;
          z-index: 100; pointer-events: none;
          display: flex; flex-direction: column; gap: 12px;
        }
        .coin-alert-btn {
          pointer-events: auto;
          width: 56px; height: 56px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem;
          border: 3px solid #fff;
          box-shadow: 0 8px 25px rgba(0,0,0,0.25);
          text-decoration: none;
          animation: coinPop 0.5s cubic-bezier(0.34,1.56,0.64,1);
        }
        .coin-gold { background: linear-gradient(135deg, #f59e0b, #f97316); box-shadow: 0 8px 25px rgba(245,158,11,0.5); }
        .coin-silver { background: linear-gradient(135deg, #94a3b8, #64748b); box-shadow: 0 8px 25px rgba(100,116,139,0.5); }
        @keyframes coinPop { from { transform: scale(0) rotate(-20deg); } to { transform: scale(1) rotate(0); } }

        /* ── MOBILE BOTTOM NAV ── */
        .mobile-nav {
          display: flex; justify-content: center;
          position: fixed; bottom: 0; left: 0; right: 0;
          padding: 0 1rem 1rem;
          z-index: 50;
        }
        @media (min-width: 768px) { .mobile-nav { display: none; } }

        .mobile-nav-inner {
          display: flex; align-items: center;
          background: rgba(15, 10, 30, 0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(167,139,250,0.15);
          border-radius: 999px;
          padding: 8px 12px;
          gap: 4px;
          box-shadow:
            0 -4px 30px rgba(0,0,0,0.3),
            0 20px 40px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,255,255,0.05);
          width: 100%;
          max-width: 380px;
        }

        .mobile-nav-item {
          flex: 1;
          display: flex; flex-direction: column; align-items: center;
          gap: 3px; padding: 6px 4px;
          border: none; background: transparent; cursor: pointer;
          position: relative; border-radius: 999px;
          transition: all 0.2s;
        }
        .mobile-active-bg {
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(124,58,237,0.35), rgba(236,72,153,0.2));
          border-radius: 999px;
          border: 1px solid rgba(167,139,250,0.25);
          box-shadow: 0 0 20px rgba(124,58,237,0.2);
        }
        .mobile-icon-wrap {
          position: relative; z-index: 1;
          display: flex; align-items: center; justify-content: center;
        }
        .mobile-emoji {
          font-size: 1.2rem;
          filter: grayscale(0);
          transition: transform 0.2s;
        }
        .mobile-nav-item:not(.mobile-item-active) .mobile-emoji {
          filter: grayscale(0.5) opacity(0.6);
        }
        .mobile-item-active .mobile-emoji {
          transform: scale(1.1);
          filter: drop-shadow(0 0 6px rgba(167,139,250,0.6));
        }
        .mobile-badge {
          position: absolute; top: -6px; right: -8px;
          background: linear-gradient(135deg, #ec4899, #f43f5e);
          color: #fff; font-size: 0.55rem; font-weight: 900;
          min-width: 16px; height: 16px; border-radius: 999px;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid #0f0a1e; padding: 0 3px;
        }
        .mobile-label {
          position: relative; z-index: 1;
          font-size: 0.55rem; font-weight: 700;
          color: rgba(255,255,255,0.3);
          text-transform: uppercase; letter-spacing: 0.05em;
          transition: color 0.2s;
          white-space: nowrap;
        }
        .mobile-label-active {
          color: #c4b5fd;
        }
      `}</style>
    </div>
  );
};

export default Layout;

