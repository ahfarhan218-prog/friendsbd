
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
// MongoDB backend — no Firebase imports needed
import { User } from './types';
import { MOCK_USER, MOCK_FRIENDS, syncContextWithSession } from './constants';
import { validateSession, clearLocalSession, invalidateSession } from './services/sessionService';

// Pages
import Welcome from './pages/Welcome';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import { ErrorBoundary } from './components/ErrorBoundary';
import Apps from './pages/Apps';
import Friends from './pages/Friends';
import Chat from './pages/Chat';
import Leaderboard from './pages/Leaderboard';
import Rewards from './pages/Rewards';
import CricketMatch from './pages/CricketMatch';
import Tournament from './pages/Tournament';
import Quiz from './pages/Quiz';
import AddNewQuizForm from './pages/AddNewQuizForm';
import UniversalRewardForm from './pages/UniversalRewardForm';
import ExecutiveApprovalDashboard from './pages/ExecutiveApprovalDashboard';
import TournamentDashboard from './pages/TournamentDashboard';
import LiveTVDashboard from './pages/LiveTVDashboard';
import SiteStatsDashboard from './pages/SiteStatsDashboard';
import Statistics from './pages/Statistics';
import StatsList from './pages/StatsList';
import Support from './pages/Support';
import EliteUpgradeDashboard from './pages/EliteUpgradeDashboard';
import Settings from './pages/Settings';
import Shop from './pages/Shop';
import Notifications from './pages/Notifications';
import ConferenceList from './pages/ConferenceList';
import Conference from './pages/Conference';
import ShoutHistory from './pages/ShoutHistory';
import AdminPanel from './pages/AdminPanel';
import ManageUser from './pages/ManageUser';
import GoldenCoinGame from './pages/GoldenCoinGame';
import GoldenCoinLeaderboard from './pages/GoldenCoinLeaderboard';
import SilverCoinGame from './pages/SilverCoinGame';
import SilverCoinLeaderboard from './pages/SilverCoinLeaderboard';
import ColorBallGame from './pages/ColorBallGame';
import LottoService from './pages/LottoService';
import MysteryCastle from './pages/MysteryCastle';
import Reminders from './pages/Reminders';
import DailyMissions from './pages/DailyMissions';
import APLeaderboard from './pages/APLeaderboard';
import CommunityMembers from './pages/CommunityMembers';
import ModernQuizDashboard from './pages/ModernQuizDashboard';
import GenieCave from './pages/GenieCave';
import MonsterCatcher from './pages/MonsterCatcher';

// New Missing Pages
import Highlights from './pages/Highlights';
import Challenges from './pages/Challenges';
import BBCodeParser from './components/BBCodeParser';
import ForumHome from './pages/ForumHome';
import TopicListView from './pages/TopicListView';
import TopicThreadDetails from './pages/TopicThreadDetails';
import ForumCreateThread from './pages/ForumCreateThread';
import Timeline from './pages/Timeline';
import Requests from './pages/Requests';
import Winners from './pages/Winners';
import GameHub from './pages/GameHub';
import StaffForum from './pages/StaffForum';

// BBCode System Pages
import BBCodeDashboard from './pages/BBCodeDashboard';
import BBCodeEditor from './pages/BBCodeEditor';
import BBCodeGuide from './pages/BBCodeGuide';
import CricketSystemTesting from './pages/CricketSystemTesting';
import Cricket2 from './pages/Cricket2';

// Inbox Page
import Inbox from './pages/Inbox';
import Marketplace from './pages/Marketplace';
import Inventory from './pages/Inventory';
import Blog from './pages/Blog';
import BlogEditor from './pages/BlogEditor';
import BlogViewer from './pages/BlogViewer';
import Clan from './pages/Clan';
import Calendar from './pages/Calendar';
import Groups from './pages/Groups';
import Gallery from './pages/Gallery';
import Stories from './pages/Stories';
import VerifyEmail from './pages/VerifyEmail';

// Components
import Layout from './components/Layout';
import NotificationToast from './components/NotificationToast';
import { triggerToast } from './components/NotificationToast';
import ProtectedRoute from './components/ProtectedRoute';
import { apTransactionService } from './services/apTransactionService';
import { mongoService } from './services/mongoService';

const isLottoActive = (userData: any) => {
  if (!userData?.lotto_active_until) return false;
  let time = 0;
  if (typeof userData.lotto_active_until === 'number') {
    time = userData.lotto_active_until;
  } else if (userData.lotto_active_until.seconds) {
    time = userData.lotto_active_until.seconds * 1000;
  } else if (typeof userData.lotto_active_until.toMillis === 'function') {
    time = userData.lotto_active_until.toMillis();
  } else {
    time = new Date(userData.lotto_active_until).getTime();
  }
  return time > Date.now();
};

const PUBLIC_PATHS = ['/welcome', '/login', '/signup'];

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // ── Shared logout handler ──────────────────────────────────────────────────
  const handleLogout = useCallback((reason?: string) => {
    const uid = user?.id || (JSON.parse(localStorage.getItem('user_session') || '{}').id);

    // Clear local state first
    setUser(null);
    clearLocalSession();

    Object.assign(MOCK_USER, {
      id: '', name: '', username: '', avatar: '',
      level: 1, points: 0, silverPoints: 0, goldenCoins: 0,
      plusses: 0, isOnline: false, isPremium: false, isVerified: false, role: 'user'
    });
    MOCK_FRIENDS.length = 0;

    // Invalidate session on explicit user logout (not forced expiry/other-device)
    if (uid && !reason) {
      invalidateSession(uid).catch(() => {});
    }

    if (reason === 'expired') {
      triggerToast({
        id: 'session-expired-' + Date.now(),
        senderId: 'system',
        senderName: 'Session Guard',
        senderAvatar: 'https://i.pravatar.cc/100?img=12',
        type: 'SYSTEM',
        message: '⏰ তোমার session ৩ ঘণ্টা পরে মেয়াদ শেষ। আবার login করো।',
        timestamp: Date.now(),
        isRead: false,
      } as any);
    } else if (reason === 'other_device') {
      triggerToast({
        id: 'other-device-' + Date.now(),
        senderId: 'system',
        senderName: 'Session Guard',
        senderAvatar: 'https://i.pravatar.cc/100?img=12',
        type: 'SYSTEM',
        message: '📱 অন্য একটি device থেকে login হয়েছে। তুমি logout হয়ে গেছ।',
        timestamp: Date.now(),
        isRead: false,
      } as any);
    }

    navigate('/login');
  }, [user, navigate]);

  // ── Load session on mount / path change ───────────────────────────────────
  useEffect(() => {
    const loadUser = () => {
      const saved = localStorage.getItem('user_session');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Quick expiry check without Firestore
          if (parsed.sessionExpiry && Date.now() > parsed.sessionExpiry) {
            handleLogout('expired');
            return;
          }
          setUser(parsed);
          Object.assign(MOCK_USER, parsed);
          syncContextWithSession();
        } catch (_) {
          clearLocalSession();
          navigate('/login');
        }
      } else {
        if (!PUBLIC_PATHS.includes(location.pathname)) {
          navigate('/login');
        }
      }
    };

    loadUser();

    const handleStorage = () => {
      const saved = localStorage.getItem('user_session');
      if (saved) {
        try { setUser(JSON.parse(saved)); } catch (_) {}
      } else {
        // Another tab cleared the session
        if (!PUBLIC_PATHS.includes(location.pathname)) {
          setUser(null);
          navigate('/login');
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [location.pathname]); // eslint-disable-line

  // ── Session validator — runs every 30 seconds ─────────────────────────────
  // Checks: (1) 3-hour expiry, (2) single-device token mismatch
  useEffect(() => {
    if (!user) return;

    const checkSession = async () => {
      const result = await validateSession();
      if (result === 'expired') {
        handleLogout('expired');
      } else if (result === 'other_device') {
        handleLogout('other_device');
      } else if (result === 'no_session') {
        handleLogout();
      }
    };

    // Run immediately, then every 30 seconds
    checkSession();
    const sessionIntervalId = setInterval(checkSession, 30_000);
    return () => clearInterval(sessionIntervalId);
  }, [user?.id]); // eslint-disable-line

  // ── Hourly cumulative online AP tracker & heartbeat engine ─────────────────
  useEffect(() => {
    if (!user || !user.id) return;

    const intervalId = setInterval(() => {
      if (document.hidden) return;

      const now = Date.now();
      const lastPing = parseInt(localStorage.getItem(`ap_last_ping_${user.id}`) || '0', 10);

      // 1. Send secure heartbeat ping to Firestore every 2 minutes
      if (now - lastPing > 2 * 60 * 1000) {
        localStorage.setItem(`ap_last_ping_${user.id}`, now.toString());
        mongoService.updateUser(user.id, {
          lastActiveTime: now,
          isOnline: !user.ghostMode
        }).catch(err => console.warn('Heartbeat ping failed:', err));
      }

      // 2. Active duration tracking (10-second tick)
      const currentSecs = parseInt(localStorage.getItem(`ap_session_seconds_${user.id}`) || '0', 10) || 0;
      const nextSecs = currentSecs + 10;

      if (nextSecs >= 3600) {
        localStorage.setItem(`ap_session_seconds_${user.id}`, '0');

        apTransactionService.adjustUserAP(user.id, 'ONLINE_TIME_PER_HOUR')
          .then(({ newBalance }) => {
            const saved = localStorage.getItem('user_session');
            if (saved) {
              const parsed = JSON.parse(saved);
              parsed.balance_ap = newBalance;
              localStorage.setItem('user_session', JSON.stringify(parsed));
              setUser(parsed);
              window.dispatchEvent(new Event('storage'));
            }
            triggerToast({
              id: 'ap-online-' + Date.now(),
              senderId: 'system',
              senderName: 'System',
              senderAvatar: 'https://i.pravatar.cc/100?img=12',
              type: 'REWARD',
              message: `You earned +10 AP for active session duration! ⚡`,
              timestamp: Date.now(),
              isRead: false
            } as any);
          })
          .catch(err => console.warn('Failed to reward online AP:', err));

        // Lotto Boosted Plusses Reward Engine
        const lottoBoost = isLottoActive(user);
        const plussesEarned = lottoBoost ? 15 : 5;

        // Fetch current plusses and increment locally
        const currentPlusses = user?.plusses || 0;
        mongoService.updateUser(user.id, { plusses: currentPlusses + plussesEarned })
          .then(() => {
            const saved = localStorage.getItem('user_session');
            if (saved) {
              const parsed = JSON.parse(saved);
              parsed.plusses = (parsed.plusses || 0) + plussesEarned;
              localStorage.setItem('user_session', JSON.stringify(parsed));
              setUser(parsed);
              window.dispatchEvent(new Event('storage'));
            }
            triggerToast({
              id: 'plusses-online-' + Date.now(),
              senderId: 'system',
              senderName: 'Lotto Boost',
              senderAvatar: 'https://i.pravatar.cc/100?img=15',
              type: 'REWARD',
              message: lottoBoost
                ? `Lotto active! You earned +15 Plusses for 60m online! 🎫`
                : `You earned +5 Plusses for 60m online!`,
              timestamp: Date.now(),
              isRead: false
            } as any);
          })
          .catch(err => console.warn('Failed to reward online Plusses:', err));
      } else {
        localStorage.setItem(`ap_session_seconds_${user.id}`, nextSecs.toString());
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [user]);

  // ── Login handler (called from Auth page) ─────────────────────────────────
  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('user_session', JSON.stringify(u));
    Object.assign(MOCK_USER, u);
    syncContextWithSession();
    navigate('/home');
  };

  // ── Wrap a page element in ProtectedRoute ──────────────────────────────────
  const protect = (element: React.ReactNode) => (
    <ProtectedRoute>{element}</ProtectedRoute>
  );

  return (
    <>
      <NotificationToast />
      <Routes>
        <Route path="/" element={<Navigate to={user ? '/home' : '/login'} />} />

        {/* Public pages — no sidebar/navbar */}
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login"   element={<Auth mode="login"  onAuth={handleLogin} />} />
        <Route path="/signup"  element={<Auth mode="signup" onAuth={handleLogin} />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Authenticated pages — wrapped in Layout + ProtectedRoute */}
        <Route element={<Layout user={user || MOCK_USER} onLogout={handleLogout} />}>
          <Route path="/home"              element={protect(<Home />)} />
          <Route path="/profile"           element={protect(<ErrorBoundary><Profile /></ErrorBoundary>)} />
          <Route path="/profile/:userId"   element={protect(<UserProfile />)} />
          <Route path="/apps"              element={protect(<Apps />)} />
          <Route path="/friends"           element={protect(<Friends />)} />
          <Route path="/chat"              element={protect(<Chat />)} />
          <Route path="/ranks"             element={protect(<Leaderboard />)} />
          <Route path="/rewards"           element={protect(<Rewards />)} />
          <Route path="/cricket"           element={protect(<CricketMatch />)} />
          <Route path="/tournament"        element={protect(<TournamentDashboard />)} />
          <Route path="/quiz"              element={protect(<Quiz />)} />
          <Route path="/quiz/new"          element={protect(<AddNewQuizForm />)} />
          <Route path="/reward-form"       element={protect(<UniversalRewardForm />)} />
          <Route path="/admin/approvals"   element={protect(<ExecutiveApprovalDashboard />)} />
          <Route path="/admin/stats"       element={protect(<SiteStatsDashboard />)} />
          <Route path="/stats"             element={protect(<Statistics />)} />
          <Route path="/stats/:type"       element={protect(<StatsList />)} />
          <Route path="/live-tv"           element={protect(<LiveTVDashboard />)} />
          <Route path="/support"           element={protect(<Support />)} />
          <Route path="/elite-upgrade"     element={protect(<EliteUpgradeDashboard />)} />
          <Route path="/settings"          element={protect(<Settings />)} />
          <Route path="/shop"              element={protect(<Shop />)} />
          <Route path="/notifications"     element={protect(<Notifications />)} />
          <Route path="/conference"        element={protect(<ConferenceList />)} />
          <Route path="/conference/:roomId" element={protect(<Conference />)} />
          <Route path="/shouts"            element={protect(<ShoutHistory />)} />
          <Route path="/admin"             element={protect(<AdminPanel />)} />
          <Route path="/manage-user/:userId" element={protect(<ManageUser />)} />
          <Route path="/coin-game"         element={protect(<GoldenCoinGame />)} />
          <Route path="/coin-leaderboard"  element={protect(<GoldenCoinLeaderboard />)} />
          <Route path="/silver-game"       element={protect(<SilverCoinGame />)} />
          <Route path="/silver-leaderboard" element={protect(<SilverCoinLeaderboard />)} />
          <Route path="/lotto"             element={protect(<LottoService />)} />
          <Route path="/castle"            element={protect(<MysteryCastle />)} />
          <Route path="/genie-cave"        element={protect(<GenieCave />)} />
          <Route path="/reminders"         element={protect(<Reminders />)} />
          <Route path="/missions"          element={protect(<DailyMissions />)} />
          <Route path="/ap-leaderboard"    element={protect(<APLeaderboard />)} />
          <Route path="/members"           element={protect(<CommunityMembers />)} />

          {/* New Routes */}
          <Route path="/highlights"        element={protect(<Highlights />)} />
          <Route path="/challenges"        element={protect(<Challenges />)} />
          <Route path="/forum"             element={protect(<ForumHome />)} />
          <Route path="/forum/cat/:slug"   element={protect(<TopicListView />)} />
          <Route path="/forum/thread/:threadId" element={protect(<TopicThreadDetails />)} />
          <Route path="/forum/create"      element={protect(<ForumCreateThread />)} />
          <Route path="/timeline"          element={protect(<Timeline />)} />
          <Route path="/requests"          element={protect(<Requests />)} />
          <Route path="/winners"           element={protect(<Winners />)} />
          <Route path="/staff"             element={protect(<StaffForum />)} />
          <Route path="/inbox"             element={protect(<Inbox />)} />
          <Route path="/farm"              element={protect(<GameHub game="Farm" icon="🚜" color="bg-emerald-600" />)} />
          <Route path="/ludo"              element={protect(<GameHub game="Ludo" icon="🎲" color="bg-orange-500" />)} />
          <Route path="/football"          element={protect(<GameHub game="Football" icon="⚽" color="bg-emerald-800" />)} />
          <Route path="/colorball"         element={protect(<ColorBallGame />)} />
          <Route path="/monster-catcher"   element={protect(<MonsterCatcher />)} />

          {/* BBCode System Routes */}
          <Route path="/bb-dashboard"      element={protect(<BBCodeDashboard />)} />
          <Route path="/bb-editor"         element={protect(<BBCodeEditor />)} />
          <Route path="/bb-guide"          element={protect(<BBCodeGuide />)} />
          <Route path="/cricket-system-testing" element={protect(<CricketSystemTesting />)} />

          {/* New Feature Routes */}
          <Route path="/marketplace"       element={protect(<Marketplace />)} />
          <Route path="/inventory"         element={protect(<Inventory />)} />
          <Route path="/blog"              element={protect(<Blog />)} />
          <Route path="/blog/new"          element={protect(<BlogEditor />)} />
          <Route path="/blog/edit/:id"     element={protect(<BlogEditor />)} />
          <Route path="/blog/view/:id"     element={protect(<BlogViewer />)} />
          <Route path="/clan"              element={protect(<Clan />)} />
          <Route path="/calendar"          element={protect(<Calendar />)} />
          <Route path="/groups"            element={protect(<Groups />)} />
          <Route path="/gallery"           element={protect(<Gallery />)} />
          <Route path="/stories"           element={protect(<Stories />)} />
        </Route>
      </Routes>
    </>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;


