import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoutEntry, User, ForumCategory } from '../types';
import { syncContextWithSession } from '../constants';
import { triggerToast } from '../components/NotificationToast';
import { forumService } from '../services/forumService';
import { gameService } from '../services/gameService';
import { mongoService, API_BASE } from '../services/mongoService';

const ROLES = ['admin', 'moderator', 'premium', 'user'];

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'users',     label: 'Users',     icon: '👥' },
  { id: 'shouts',    label: 'Shouts',    icon: '📢' },
  { id: 'forum',     label: 'Forum',     icon: '🗂️' },
  { id: 'broadcast', label: 'Broadcast', icon: '📡' },
  { id: 'games',     label: 'Games',     icon: '🎮' },
  { id: 'config',    label: 'Config',    icon: '⚙️' },
  { id: 'logs',      label: 'Logs',      icon: '📋' },
];

const toast = (msg: string) =>
  triggerToast({ id: 'adm-' + Date.now(), senderId: 'admin', senderName: 'Admin', senderAvatar: '', type: 'SYSTEM', message: msg, timestamp: Date.now(), isRead: false });

const Toggle: React.FC<{ value: boolean; onChange: () => void; color?: string }> = ({ value, onChange, color = 'bg-purple-600' }) => (
  <button onClick={onChange} className={`w-12 h-6 rounded-full p-1 flex transition-all duration-300 ${value ? `${color} justify-end` : 'bg-white/10 justify-start'}`}>
    <div className="w-4 h-4 bg-white rounded-full shadow" />
  </button>
);

const StatCard: React.FC<{ icon: string; label: string; value: string | number; sub?: string; color: string }> = ({ icon, label, value, sub, color }) => (
  <div className={`bg-[#1C1C2E] border border-white/5 rounded-2xl p-4 flex flex-wrap items-center gap-4`}>
    <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-2xl shrink-0`}>{icon}</div>
    <div className="min-w-0">
      <p className="text-xs font-black text-white/60 uppercase tracking-widest">{label}</p>
      <p className="text-xl font-black text-white">{value}</p>
      {sub && <p className="text-xs text-emerald-400 font-bold mt-0.5">{sub}</p>}
    </div>
  </div>
);

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const sessionUserId = (() => {
    try { return JSON.parse(localStorage.getItem('user_session') || '{}').id; }
    catch { return null; }
  })();
  const [shouts, setShouts] = useState<ShoutEntry[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [goldTimeLeft, setGoldTimeLeft] = useState('--:--');
  const [silverTimeLeft, setSilverTimeLeft] = useState('--:--');
  const [colorTimeLeft, setColorTimeLeft] = useState('--:--');
  const [spawnTimers, setSpawnTimers] = useState<Record<string, string>>({ gold: '', silver: '', color: '' });
  const [goldInput, setGoldInput] = useState('');
  const [silverInput, setSilverInput] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [editingCategory, setEditingCategory] = useState<ForumCategory | null>(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [catFormData, setCatFormData] = useState<Omit<ForumCategory, 'id' | 'subCategories'>>({
    name: '', slug: '', description: '', icon: '💬', color: 'bg-purple-600', isHidden: false, allowedRoles: ['user', 'premium', 'moderator', 'admin']
  });
  const [announcement, setAnnouncement] = useState('');
  const [isLockdown, setIsLockdown] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('all');
  const [clock, setClock] = useState(new Date());
  const [bannedUsers, setBannedUsers] = useState<string[]>([]);
  const [logs, setLogs] = useState<{ id: string; type: string; msg: string; time: string }[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);

  useEffect(() => {
    loadShouts();
    loadUsersList();
    loadAdminLogs();
    const savedAnn = localStorage.getItem('friends_bd_announcement') || '';
    setAnnouncement(savedAnn);
    setIsLockdown(localStorage.getItem('friends_bd_lockdown') === 'true');
    setIsMaintenance(localStorage.getItem('friends_bd_maintenance') === 'true');
    setBannedUsers(JSON.parse(localStorage.getItem('friends_bd_banned') || '[]'));
    loadForumData();
    const savedActs = localStorage.getItem('friends_bd_activities');
    if (savedActs) setActivities(JSON.parse(savedActs));

    const clockTimer = setInterval(() => setClock(new Date()), 1000);

    const gameTimer = setInterval(() => {
      const fmt = (next: number | null, active: boolean) => {
        if (!next) return active ? 'ACTIVE' : 'READY';
        const diff = next - Date.now();
        if (diff <= 0) return 'DROP!';
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
      };
      setGoldTimeLeft(fmt(gameService.getNextSpawnTime('gold'), gameService.checkActiveCoin('gold')));
      setSilverTimeLeft(fmt(gameService.getNextSpawnTime('silver'), gameService.checkActiveCoin('silver')));
      setColorTimeLeft(fmt(gameService.getNextSpawnTime('color'), gameService.checkActiveCoin('color')));
    }, 1000);

    // Simulated live logs
    const logEvents = [
      { type: 'INFO', msg: 'Firestore sync: OK (12ms)' },
      { type: 'INFO', msg: 'User session validated: @shahriar' },
      { type: 'WARN', msg: 'Rate limit hit on shout endpoint' },
      { type: 'INFO', msg: 'Forum category cached' },
      { type: 'DANGER', msg: 'Failed login attempt from unknown IP' },
      { type: 'SUCCESS', msg: 'Backup completed (512MB)' },
      { type: 'INFO', msg: 'New user registered' },
      { type: 'WARN', msg: 'Coin drop timer expired' },
    ];
    const logTimer = setInterval(() => {
      const ev = logEvents[Math.floor(Math.random() * logEvents.length)];
      setLogs(prev => [...prev.slice(-20), { id: Math.random().toString(36), ...ev, time: new Date().toLocaleTimeString([], { hour12: true }) }]);
    }, 3500);

    return () => { clearInterval(clockTimer); clearInterval(gameTimer); clearInterval(logTimer); };
  }, []);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const loadShouts = () => { const s = localStorage.getItem('friends_bd_shouts'); if (s) setShouts(JSON.parse(s)); };
  const loadUsersList = () => { const u = localStorage.getItem('friends_bd_users'); if (u) setUsersList(JSON.parse(u)); };
  const loadForumData = async () => { const cats = await forumService.fetchCategories(); setCategories(cats); };
  const loadAdminLogs = async () => { try { const res = await fetch('http://localhost:5000/api/admin-logs'); if (res.ok) setAdminLogs(await res.json()); } catch (e) {} };

  const saveUsersList = (list: User[]) => {
    setUsersList(list);
    localStorage.setItem('friends_bd_users', JSON.stringify(list));
  };

  const saveShouts = (list: ShoutEntry[]) => {
    setShouts(list);
    localStorage.setItem('friends_bd_shouts', JSON.stringify(list));
  };

  const handleUpdateConfig = () => {
    localStorage.setItem('friends_bd_announcement', announcement);
    localStorage.setItem('friends_bd_lockdown', String(isLockdown));
    localStorage.setItem('friends_bd_maintenance', String(isMaintenance));
    window.dispatchEvent(new Event('storage'));
    toast('✅ Platform config saved and broadcast.');
  };

  const handleUpdateRole = (uid: string, role: string) => {
    const list = usersList.map(u => u.id === uid ? { ...u, role: role as any } : u);
    saveUsersList(list);
    mongoService.updateUser(uid, { role: role as any }).catch(err => console.warn(err));
    toast(`Role updated to ${role}`);
  };

  const handleToggleVerified = (uid: string) => {
    const user = usersList.find(u => u.id === uid);
    if (!user) return;
    const newStatus = !user.isVerified;
    const list = usersList.map(u => u.id === uid ? { ...u, isVerified: newStatus } : u);
    saveUsersList(list);
    mongoService.updateUser(uid, { isVerified: newStatus }).catch(err => console.warn(err));
    syncContextWithSession();
    toast('Verification status updated.');
  };

  const handleTogglePremium = (uid: string) => {
    const user = usersList.find(u => u.id === uid);
    if (!user) return;
    const newStatus = !user.isPremium;
    const list = usersList.map(u => u.id === uid ? { ...u, isPremium: newStatus } : u);
    saveUsersList(list);
    mongoService.updateUser(uid, { isPremium: newStatus }).catch(err => console.warn(err));
    syncContextWithSession();
    toast('Premium status updated.');
  };

  const handleBanUser = (uid: string) => {
    const isBanned = bannedUsers.includes(uid);
    const newBanned = isBanned ? bannedUsers.filter(id => id !== uid) : [...bannedUsers, uid];
    setBannedUsers(newBanned);
    localStorage.setItem('friends_bd_banned', JSON.stringify(newBanned));
    mongoService.updateUser(uid, { isBanned: !isBanned }).catch(err => console.warn(err));
    toast(isBanned ? '🔓 User unbanned.' : '🚫 User banned.');
  };

  const handleShadowBan = (uid: string) => {
    const user = usersList.find(u => u.id === uid);
    if (!user) return;
    const newStatus = !(user as any).isShadowBanned;
    const list = usersList.map(u => u.id === uid ? { ...u, isShadowBanned: newStatus } : u);
    saveUsersList(list);
    mongoService.updateUser(uid, { isShadowBanned: newStatus }).catch(err => console.warn(err));
    toast('👻 Shadow ban toggled.');
  };

  const handleDeleteUser = (uid: string) => {
    const active = localStorage.getItem('user_session');
    if (active && JSON.parse(active).id === uid) { alert('Cannot delete your own session.'); return; }
    if (!confirm('Delete this user permanently?')) return;
    saveUsersList(usersList.filter(u => u.id !== uid));
    mongoService.deleteUser(uid).catch(err => console.warn(err));
    toast('🗑️ User deleted.');
  };

  const handleSaveUserStats = () => {
    if (!editingUser) return;
    const list = usersList.map(u => u.id === editingUser.id ? { ...u, ...editingUser } : u);
    saveUsersList(list);
    if (editingUser.id === sessionUserId) {
      const sess = JSON.parse(localStorage.getItem('user_session') || '{}');
      localStorage.setItem('user_session', JSON.stringify({ ...sess, ...editingUser }));
    }
    mongoService.updateUser(editingUser.id, {
      goldenCoins: editingUser.goldenCoins,
      silverPoints: editingUser.silverPoints,
      colorBalls: editingUser.colorBalls,
      goldenBalls: editingUser.goldenBalls,
      magicPoints: editingUser.magicPoints,
      reputation_points: editingUser.reputation_points,
      points: editingUser.points,
      plusses: editingUser.plusses,
      level: editingUser.level,
      stamina: editingUser.stamina,
      maxStamina: editingUser.maxStamina,
      ap: editingUser.ap,
      totalAp: editingUser.totalAp,
      role: editingUser.role,
      isPremium: editingUser.isPremium,
      isVerified: editingUser.isVerified
    }).catch(err => console.warn('Admin user stats update failed:', err));
    setEditingUser(null);
    toast('✅ User stats saved.');
  };

  const handleDeleteShout = (id: string) => { saveShouts(shouts.filter(s => s.id !== id)); toast('Shout deleted.'); };
  const handleTogglePinShout = (id: string) => { saveShouts(shouts.map(s => s.id === id ? { ...s, isPinned: !s.isPinned } : s)); };
  const handleClearAllShouts = () => { if (!confirm('Clear ALL shouts?')) return; saveShouts([]); toast('🗑️ All shouts cleared.'); };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    await forumService.deleteCategory(id);
    await loadForumData();
    toast('Category deleted.');
  };

  const handleSaveCategory = async () => {
    if (!catFormData.name || !catFormData.slug) return;
    if (editingCategory) await forumService.updateCategory(editingCategory.id, catFormData);
    else await forumService.createCategory(catFormData);
    await loadForumData();
    setShowCatForm(false);
    setEditingCategory(null);
    setCatFormData({ name: '', slug: '', description: '', icon: '💬', color: 'bg-purple-600', isHidden: false, allowedRoles: ['user', 'premium', 'moderator', 'admin'] });
    toast('Forum category saved.');
  };

  const handleSendBroadcast = () => {
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) return;
    toast(`📡 Broadcast sent to ${broadcastTarget}: "${broadcastTitle}"`);
    setBroadcastTitle('');
    setBroadcastMsg('');
  };

  const handleDropCoin = async (type: 'gold' | 'silver' | 'color') => {
    try {
      await gameService.dropCoin(type);
      toast(`🪙 ${type === 'gold' ? 'Gold' : type === 'silver' ? 'Silver' : 'Color Ball'} dropped manually!`);
    } catch (err: any) {
      toast(`❌ Failed to drop: ${err.message || err}`);
    }
  };

  const handleSetSpawnTimer = async (type: 'gold' | 'silver' | 'color', minsStr: string) => {
    const mins = parseFloat(minsStr);
    if (isNaN(mins) || mins <= 0) {
      toast('⚠️ Please enter a valid number of minutes.');
      return;
    }
    try {
      const targetTime = Date.now() + mins * 60 * 1000;
      await gameService.setNextSpawnTime(type, targetTime);
      toast(`⏰ Next spawn set in ${mins} minute(s).`);
      if (type === 'gold') setGoldInput('');
      else if (type === 'silver') setSilverInput('');
      else if (type === 'color') setColorInput('');
    } catch (err: any) {
      toast(`❌ Failed to set timer: ${err.message || err}`);
    }
  };

  const stats = useMemo(() => [
    { icon: '👥', label: 'Total Users',  value: usersList.length,                             sub: '+12% this week',    color: 'bg-purple-500/20 text-purple-300' },
    { icon: '🟢', label: 'Online Now',   value: usersList.filter(u => u.isOnline && (!u.lastActiveTime || (Date.now() - u.lastActiveTime) <= 30 * 60 * 1000)).length,     sub: 'Live',              color: 'bg-emerald-500/20 text-emerald-300' },
    { icon: '📢', label: 'Total Shouts', value: shouts.length,                                sub: 'LIVE',              color: 'bg-amber-500/20 text-amber-300' },
    { icon: '👑', label: 'Premium',      value: usersList.filter(u => u.isPremium).length,    sub: 'Members',           color: 'bg-pink-500/20 text-pink-300' },
    { icon: '🛡️', label: 'Staff',       value: usersList.filter(u => ['admin','moderator'].includes(u.role||'')).length, sub: 'Active',    color: 'bg-blue-500/20 text-blue-300' },
    { icon: '🚫', label: 'Banned',       value: bannedUsers.length,                           sub: 'Accounts',          color: 'bg-rose-500/20 text-rose-300' },
  ], [shouts.length, usersList, bannedUsers]);

  const filteredUsers = usersList.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50 transition-colors font-medium placeholder-white/20';

  return (
    <div className="min-h-screen bg-transparent flex font-inter text-white">

      {/* ── SIDEBAR ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/70 z-[200] backdrop-blur-sm" />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 25 }}
              className="fixed inset-y-0 left-0 w-72 bg-[#12122A] z-[201] flex flex-col border-r border-white/5 shadow-2xl">
              <div className="p-6 border-b border-white/5">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center text-lg">🛡️</div>
                  <div>
                    <h2 className="text-sm font-black text-white">Admin Console</h2>
                    <p className="text-xs text-purple-400/60 font-bold">FriendsBD • v5.0</p>
                  </div>
                </div>
                <p className="text-xs text-white/40 font-mono mt-3">{clock.toLocaleTimeString([], { hour12: true })}</p>
              </div>
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {TABS.map(tab => (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                    className={`w-full flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all ${activeTab === tab.id
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50'
                      : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                    <span className="text-lg">{tab.icon}</span>
                    {tab.label}
                    {tab.id === 'users' && usersList.length > 0 && (
                      <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded-full font-black">{usersList.length}</span>
                    )}
                  </button>
                ))}
              </nav>
              <div className="p-4 border-t border-white/5 space-y-2">
                <div className={`flex items-center justify-between p-3 rounded-xl ${isLockdown ? 'bg-rose-500/20 border border-rose-500/30' : 'bg-white/5'}`}>
                  <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-rose-400">🔒 Lockdown</span>
                  <Toggle value={isLockdown} onChange={() => { setIsLockdown(!isLockdown); }} color="bg-rose-600" />
                </div>
                <div className={`flex items-center justify-between p-3 rounded-xl ${isMaintenance ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-white/5'}`}>
                  <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-amber-400">🛠️ Maintenance</span>
                  <Toggle value={isMaintenance} onChange={() => setIsMaintenance(!isMaintenance)} color="bg-amber-500" />
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Bar */}
        <header className="sticky top-0 z-[100] bg-[#0F0F1A]/95 backdrop-blur-2xl border-b border-white/5 px-4 py-3 flex flex-wrap items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center border border-white/5 active:scale-90 transition-all">
            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-black text-white flex flex-wrap items-center gap-2">
              {TABS.find(t => t.id === activeTab)?.icon} {TABS.find(t => t.id === activeTab)?.label}
            </h1>
          </div>

          {/* Quick status pills */}
          <div className="flex flex-wrap items-center gap-2">
            {isLockdown && <span className="text-xs font-black uppercase bg-rose-500/20 text-rose-400 px-2 py-1 rounded-full border border-rose-500/30">🔒 LOCKDOWN</span>}
            {isMaintenance && <span className="text-xs font-black uppercase bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full border border-amber-500/30">🛠️ MAINT</span>}
            <span className="text-xs font-mono text-white/40 hidden sm:block">{clock.toLocaleTimeString([], { hour12: true })}</span>
          </div>

          <button onClick={() => navigate('/home')} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center active:scale-90 transition-all text-white/40 hover:text-white">
            🚪
          </button>
        </header>

        {/* Tab Content */}
        <main className="flex-1 p-4 overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* ── DASHBOARD ── */}
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                  <h3 className="text-xs sm:text-sm font-black text-white/60 uppercase tracking-[0.3em]">📊 Overview Statistics</h3>
                  <button
                    onClick={() => navigate('/admin/stats')}
                    className="w-fit text-xs sm:text-sm font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl transition-all active:scale-95 shadow-sm"
                  >
                    View Member Status Engine Stats →
                  </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 gap-3">
                  {stats.map(s => <StatCard key={s.label} {...s} />)}
                </div>

                {/* Game Timers */}
                <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4">
                  <h3 className="text-xs font-black text-white/60 uppercase tracking-[0.3em] mb-3">🎮 Game Coin Timers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 gap-3">
                    {[
                      { label: 'Gold Coin', value: goldTimeLeft, color: 'text-amber-400', bg: 'border-amber-500/20', type: 'gold' as const, inputVal: goldInput, setInputVal: setGoldInput },
                      { label: 'Silver Coin', value: silverTimeLeft, color: 'text-slate-300', bg: 'border-slate-500/20', type: 'silver' as const, inputVal: silverInput, setInputVal: setSilverInput },
                      { label: 'Color Ball', value: colorTimeLeft, color: 'text-rose-400', bg: 'border-rose-500/20', type: 'color' as const, inputVal: colorInput, setInputVal: setColorInput },
                    ].map(coin => (
                      <div key={coin.label} className={`bg-white/5 rounded-2xl p-4 text-center border ${coin.bg} flex flex-col justify-between`}>
                        <div>
                          <p className="text-xs font-black text-white/60 uppercase tracking-widest mb-1">{coin.label}</p>
                          <p className={`text-2xl font-black font-mono ${coin.color} mb-2`}>{coin.value}</p>
                        </div>
                        <div className="space-y-2.5 mt-3">
                          <button onClick={() => handleDropCoin(coin.type)}
                            className="w-full text-xs font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 py-2 rounded-xl transition-all active:scale-90 border border-white/5">
                            Force Drop
                          </button>
                          <div className="flex flex-wrap gap-1">
                            <input type="number" step="any" placeholder="Mins" value={coin.inputVal} onChange={e => coin.setInputVal(e.target.value)}
                              className="w-[45%] bg-[#0f0f1a]/80 border border-white/10 rounded-lg text-xs sm:text-sm text-center font-bold outline-none text-white focus:border-purple-500/50" />
                            <button onClick={() => handleSetSpawnTimer(coin.type, coin.inputVal)}
                              className="flex-1 text-xs font-black uppercase tracking-widest bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 py-2 rounded-xl transition-all active:scale-90 border border-purple-500/20">
                              Set Timer
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Traffic Chart */}
                <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-black text-white/60 uppercase tracking-[0.3em]">📈 Platform Traffic</h3>
                    <span className="text-xs text-white/40 font-bold uppercase">Last 12 hours</span>
                  </div>
                  <div className="h-32 flex flex-wrap items-end gap-1.5 border-b border-white/5 px-2 pb-0">
                    {[20,35,28,60,45,72,55,80,68,92,84,100].map((v, i) => (
                      <div key={i} className="group relative flex-1">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{v}%</div>
                        <div className="w-full bg-gradient-to-t from-purple-600/60 to-purple-400/60 rounded-t-lg transition-all hover:from-purple-500 hover:to-purple-300 cursor-pointer" style={{ height: `${v}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between pt-2 px-2">
                    {['12p','2a','4a','6a','8a','10a','12p','2p','4p','6p','8p','10p'].map(t => (
                      <span key={t} className="text-[7px] text-white/40 font-mono">{t}</span>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4">
                  <h3 className="text-xs font-black text-white/60 uppercase tracking-[0.3em] mb-3">🕒 Recent Activity</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {activities.slice(0, 8).map((act, i) => (
                      <div key={i} className="flex flex-wrap items-start gap-3 p-2.5 bg-white/5 rounded-xl">
                        <span className="text-xs font-mono text-white/40 bg-white/5 px-2 py-1 rounded-lg shrink-0">{act.time}</span>
                        <p className="text-xs text-white/50"><span className="font-black text-white/70">@{act.username}</span> {act.msg}</p>
                      </div>
                    ))}
                    {activities.length === 0 && <p className="text-center text-white/40 text-xs py-6">No activity yet</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── USERS ── */}
            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

                {/* Search + stats row */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex flex-wrap-1 bg-[#1C1C2E] border border-white/5 rounded-2xl px-4 flex flex-wrap items-center gap-2 focus-within:border-purple-500/40 transition-colors">
                    <span className="text-white/60 text-sm">🔍</span>
                    <input placeholder="Search users..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent border-none text-sm text-white placeholder-white/20 py-3 outline-none font-medium" />
                  </div>
                  <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl px-4 flex items-center text-center">
                    <span className="text-xs font-black text-white">{usersList.length} <span className="text-white/60 font-bold">total</span></span>
                  </div>
                </div>

                {/* User list */}
                <div className="space-y-2">
                  {filteredUsers.map(u => (
                    <div key={u.id} className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-3 flex flex-wrap items-center gap-3 hover:border-purple-500/20 transition-colors">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <img src={u.avatar} className="w-11 h-11 rounded-xl object-cover border-2 border-white/5" alt="" />
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-[#1C1C2E] rounded-full ${u.isOnline ? 'bg-emerald-400' : 'bg-white/20'}`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-black text-white truncate">{u.name}</span>
                          {u.isVerified && <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full font-black">✔ Verified</span>}
                          {u.isPremium && <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-black">👑</span>}
                          {bannedUsers.includes(u.id) && <span className="text-xs bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded-full font-black">🚫 BANNED</span>}
                          {(u as any).isShadowBanned && <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full font-black">👻</span>}
                        </div>
                        <p className="text-xs text-white/60 font-bold mt-0.5">#{(u as any).userId} · @{u.username} · {u.points || 0} pts · Lv.{u.level || 1} · RP: {(u as any).reputation_points || 0} · 🥇: {(u as any).goldenCoins || 0}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        {/* Role selector */}
                        <select value={u.role || 'user'} onChange={e => handleUpdateRole(u.id, e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-lg text-xs font-black text-white/60 py-1.5 px-2 outline-none cursor-pointer appearance-none">
                          {ROLES.map(r => <option key={r} value={r} className="bg-[#1C1C2E]">{r}</option>)}
                        </select>

                        {[
                          { title: 'Edit Stats', icon: '✏️', action: () => setEditingUser(u), active: false, activeColor: '' },
                          { title: 'Verify', icon: '✔️', action: () => handleToggleVerified(u.id), active: !!u.isVerified, activeColor: 'bg-blue-500/30 border-blue-500/40' },
                          { title: 'Premium', icon: '👑', action: () => handleTogglePremium(u.id), active: !!u.isPremium, activeColor: 'bg-amber-500/30 border-amber-500/40' },
                          { title: 'Shadow Ban', icon: '👻', action: () => handleShadowBan(u.id), active: !!(u as any).isShadowBanned, activeColor: 'bg-purple-500/30 border-purple-500/40' },
                          { title: bannedUsers.includes(u.id) ? 'Unban' : 'Ban', icon: '🚫', action: () => handleBanUser(u.id), active: bannedUsers.includes(u.id), activeColor: 'bg-rose-500/30 border-rose-500/40' },
                          { title: 'Delete', icon: '🗑️', action: () => handleDeleteUser(u.id), active: false, activeColor: '' },
                        ].map(btn => (
                          <button key={btn.title} title={btn.title} onClick={btn.action}
                            disabled={btn.icon === '🗑️' && u.id === sessionUserId}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm border transition-all active:scale-90 ${btn.active ? btn.activeColor : 'bg-white/5 border-white/5'} ${btn.icon === '🗑️' ? 'hover:bg-rose-500/20 hover:border-rose-500/30' : 'hover:bg-white/10'} disabled:opacity-20`}>
                            {btn.icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="py-16 text-center text-white/40 text-sm font-bold">No users found.</div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── SHOUTS ── */}
            {activeTab === 'shouts' && (
              <motion.div key="shouts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm text-white/60 font-bold uppercase tracking-widest">{shouts.length} total shouts</p>
                  <button onClick={handleClearAllShouts} className="text-xs font-black uppercase tracking-widest text-rose-400 bg-rose-400/10 border border-rose-400/20 px-4 py-2 rounded-xl hover:bg-rose-400/20 active:scale-90 transition-all">
                    🗑️ Clear All
                  </button>
                </div>
                <div className="space-y-2">
                  {shouts.map(shout => (
                    <div key={shout.id} className={`bg-[#1C1C2E] border rounded-2xl p-4 ${shout.isPinned ? 'border-amber-500/30' : 'border-white/5'}`}>
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <img src={shout.avatar} className="w-8 h-8 rounded-xl object-cover shrink-0" alt="" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-white">{shout.user}</p>
                          <p className="text-xs text-white/60 font-bold">{shout.time}</p>
                        </div>
                        {shout.isPinned && <span className="text-xs font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">📌 Pinned</span>}
                        <div className="flex flex-wrap gap-1.5 shrink-0">
                          <button onClick={() => handleTogglePinShout(shout.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all active:scale-90 ${shout.isPinned ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                            {shout.isPinned ? 'Unpin' : 'Pin'}
                          </button>
                          <button onClick={() => handleDeleteShout(shout.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:bg-rose-500/30 active:scale-90 transition-all">
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-white/60 font-medium leading-relaxed">{shout.content}</p>
                      <p className="text-xs text-white/40 font-bold mt-2">{Object.keys(shout.userReactions || {}).length} reactions · {(shout.replies || []).length} replies</p>
                    </div>
                  ))}
                  {shouts.length === 0 && <div className="py-16 text-center text-white/40 text-sm font-bold">No shouts.</div>}
                </div>
              </motion.div>
            )}

            {/* ── FORUM ── */}
            {activeTab === 'forum' && (
              <motion.div key="forum" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm text-white/60 font-bold uppercase tracking-widest">{categories.length} categories</p>
                  <button onClick={() => { setShowCatForm(true); setEditingCategory(null); setCatFormData({ name: '', slug: '', description: '', icon: '💬', color: 'bg-purple-600', isHidden: false, allowedRoles: ROLES }); }}
                    className="flex flex-wrap items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-black uppercase tracking-widest px-4 py-2.5 rounded-xl active:scale-90 transition-all">
                    + New Category
                  </button>
                </div>

                {/* Category form */}
                <AnimatePresence>
                  {showCatForm && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      className="bg-[#1C1C2E] border border-purple-500/30 rounded-2xl p-5 space-y-4">
                      <h4 className="text-sm font-black text-white">{editingCategory ? 'Edit Category' : 'New Category'}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 gap-3">
                        <input value={catFormData.name} onChange={e => setCatFormData({ ...catFormData, name: e.target.value })} className={inputCls} placeholder="Category Name" />
                        <input value={catFormData.slug} onChange={e => setCatFormData({ ...catFormData, slug: e.target.value })} className={inputCls} placeholder="slug-name" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 gap-3">
                        <input value={catFormData.icon} onChange={e => setCatFormData({ ...catFormData, icon: e.target.value })} className={inputCls} placeholder="Icon emoji" />
                        <input value={catFormData.color} onChange={e => setCatFormData({ ...catFormData, color: e.target.value })} className={inputCls} placeholder="bg-purple-600" />
                      </div>
                      <textarea value={catFormData.description} onChange={e => setCatFormData({ ...catFormData, description: e.target.value })} className={inputCls + ' resize-none h-20'} placeholder="Description" />
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                        <span className="text-xs font-black text-white/50">Hidden from Public</span>
                        <Toggle value={!!catFormData.isHidden} onChange={() => setCatFormData({ ...catFormData, isHidden: !catFormData.isHidden })} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white/60 uppercase tracking-widest mb-2">Allowed Roles</p>
                        <div className="flex flex-wrap gap-2">
                          {ROLES.map(r => (
                            <button key={r} onClick={() => setCatFormData(prev => ({ ...prev, allowedRoles: prev.allowedRoles?.includes(r) ? prev.allowedRoles.filter(x => x !== r) : [...(prev.allowedRoles || []), r] }))}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${catFormData.allowedRoles?.includes(r) ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={handleSaveCategory} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest active:scale-95 transition-all">Save</button>
                        <button onClick={() => setShowCatForm(false)} className="px-6 bg-white/5 text-white/40 py-3 rounded-xl text-xs sm:text-sm font-black uppercase hover:bg-white/10 transition-all">Cancel</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Category list */}
                <div className="space-y-2">
                  {categories.map(cat => (
                    <div key={cat.id} className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4 flex flex-wrap items-center gap-4 hover:border-white/10 transition-colors">
                      <div className={`w-12 h-12 rounded-2xl ${cat.color} flex items-center justify-center text-2xl shrink-0`}>{cat.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-white">{cat.name}</h4>
                          {cat.isHidden && <span className="text-xs font-black text-white/60 bg-white/5 px-1.5 py-0.5 rounded-full uppercase">Hidden</span>}
                        </div>
                        <p className="text-xs text-white/60 font-bold">{cat.allowedRoles?.join(', ') || 'Public'}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button onClick={() => { setEditingCategory(cat); setCatFormData({ name: cat.name, slug: cat.slug, description: cat.description, icon: cat.icon, color: cat.color, isHidden: cat.isHidden, allowedRoles: cat.allowedRoles || [] }); setShowCatForm(true); }}
                          className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-sm active:scale-90 transition-all">✏️</button>
                        <button onClick={() => handleDeleteCategory(cat.id)}
                          className="w-9 h-9 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl flex items-center justify-center text-sm active:scale-90 transition-all">🗑️</button>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && <div className="py-16 text-center text-white/40 text-sm font-bold">No categories yet.</div>}
                </div>
              </motion.div>
            )}

            {/* ── BROADCAST ── */}
            {activeTab === 'broadcast' && (
              <motion.div key="broadcast" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-black text-white flex flex-wrap items-center gap-2">📡 Global Broadcast</h3>
                  <input value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} className={inputCls} placeholder="Broadcast title..." />
                  <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} className={inputCls + ' resize-none h-28'} placeholder="Message body..." />
                  <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 gap-3">
                    <div>
                      <p className="text-xs font-black text-white/60 uppercase tracking-widest mb-2">Target Audience</p>
                      <select value={broadcastTarget} onChange={e => setBroadcastTarget(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none appearance-none cursor-pointer">
                        <option value="all" className="bg-[#1C1C2E]">All Users</option>
                        <option value="premium" className="bg-[#1C1C2E]">Premium Only</option>
                        <option value="staff" className="bg-[#1C1C2E]">Staff Only</option>
                        <option value="online" className="bg-[#1C1C2E]">Online Users</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button onClick={handleSendBroadcast} disabled={!broadcastTitle.trim() || !broadcastMsg.trim()}
                        className="w-full flex flex-wrap items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-30 text-white font-black text-xs sm:text-sm uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-purple-900/30 active:scale-95 transition-all">
                        📡 Send Broadcast
                      </button>
                    </div>
                  </div>
                </div>

                {/* Announcement Banner */}
                <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-black text-white">📢 Site Announcement Ticker</h3>
                  <textarea value={announcement} onChange={e => setAnnouncement(e.target.value)} className={inputCls + ' resize-none h-20'} placeholder="Announcement text for marquee ticker..." />
                  <button onClick={handleUpdateConfig} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-xs sm:text-sm uppercase tracking-widest py-3 rounded-xl active:scale-95 transition-all">
                    Update Announcement
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── GAMES ── */}
            {activeTab === 'games' && (
              <motion.div key="games" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                {[
                  { type: 'gold' as const, label: 'Golden Coin', color: 'amber', icon: '🥇', timer: goldTimeLeft, inputVal: goldInput, setInputVal: setGoldInput },
                  { type: 'silver' as const, label: 'Silver Coin', color: 'slate', icon: '🥈', timer: silverTimeLeft, inputVal: silverInput, setInputVal: setSilverInput },
                  { type: 'color' as const, label: 'Color Ball', color: 'rose', icon: '🎨', timer: colorTimeLeft, inputVal: colorInput, setInputVal: setColorInput },
                ].map(g => (
                  <div key={g.type} className={`bg-[#1C1C2E] border border-${g.type === 'gold' ? 'amber' : g.type === 'silver' ? 'slate' : 'rose'}-500/20 rounded-2xl p-5`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-3xl">{g.icon}</span>
                        <div>
                          <h4 className="text-sm font-black text-white">{g.label} Game</h4>
                          <p className={`text-xs font-black text-${g.type === 'gold' ? 'amber' : g.type === 'silver' ? 'slate' : 'rose'}-400 uppercase tracking-widest`}>Next drop: {g.timer}</p>
                        </div>
                      </div>
                      <div className={`text-2xl font-black font-mono text-${g.type === 'gold' ? 'amber' : g.type === 'silver' ? 'slate' : 'rose'}-400`}>{g.timer}</div>
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 gap-3">
                        <button onClick={() => handleDropCoin(g.type)}
                          className={`py-3 bg-${g.type === 'gold' ? 'amber' : g.type === 'silver' ? 'slate' : 'rose'}-500/20 border border-${g.type === 'gold' ? 'amber' : g.type === 'silver' ? 'slate' : 'rose'}-500/30 text-${g.type === 'gold' ? 'amber' : g.type === 'silver' ? 'slate' : 'rose'}-400 font-black text-xs sm:text-sm uppercase tracking-widest rounded-xl hover:bg-${g.type === 'gold' ? 'amber' : g.type === 'silver' ? 'slate' : 'rose'}-500/30 active:scale-95 transition-all`}>
                          🪙 Force Drop
                        </button>
                        <button onClick={() => toast(`${g.label} game ended.`)}
                          className="py-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-black text-xs sm:text-sm uppercase tracking-widest rounded-xl hover:bg-rose-500/20 active:scale-95 transition-all">
                          🛑 End Game
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                        <span className="text-xs font-bold text-white/50 shrink-0">Set Next Drop:</span>
                        <input type="number" step="any" placeholder="Enter minutes (e.g. 0.5)" value={g.inputVal} onChange={e => g.setInputVal(e.target.value)}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg text-xs py-1.5 px-3 outline-none text-white focus:border-purple-500/50" />
                        <button onClick={() => handleSetSpawnTimer(g.type, g.inputVal)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-widest rounded-lg transition-all active:scale-95">
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Leaderboard quick view */}
                <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-5">
                  <h4 className="text-sm font-black text-white mb-3">🏆 Top Coin Holders</h4>
                  <div className="space-y-2">
                    {[...usersList].sort((a, b) => ((b as any).goldenCoins || 0) - ((a as any).goldenCoins || 0)).slice(0, 5).map((u, i) => (
                      <div key={u.id} className="flex flex-wrap items-center gap-3 p-2.5 bg-white/5 rounded-xl">
                        <span className="text-sm font-black text-white/40 w-5">#{i + 1}</span>
                        <img src={u.avatar} className="w-7 h-7 rounded-lg object-cover shrink-0" alt="" />
                        <span className="text-xs font-black text-white flex-1">{u.name}</span>
                        <span className="text-xs sm:text-sm font-black text-amber-400">🥇 {(u as any).goldenCoins || 0}</span>
                        <span className="text-xs sm:text-sm font-black text-slate-400">🥈 {(u as any).silverPoints || 0}</span>
                      </div>
                    ))}
                    {usersList.length === 0 && <p className="text-center text-white/40 text-xs py-4">No data</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── CONFIG ── */}
            {activeTab === 'config' && (
              <motion.div key="config" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

                {/* Platform Controls */}
                <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-black text-white">🌐 Platform Controls</h3>
                  {[
                    { label: '🔒 Global Lockdown', sub: 'Prevent all user posts', value: isLockdown, onChange: () => setIsLockdown(!isLockdown), color: 'bg-rose-600' },
                    { label: '🛠️ Maintenance Mode', sub: 'Show maintenance page to users', value: isMaintenance, onChange: () => setIsMaintenance(!isMaintenance), color: 'bg-amber-500' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                      <div>
                        <p className="text-sm font-black text-white">{item.label}</p>
                        <p className="text-xs text-white/60 font-bold mt-0.5">{item.sub}</p>
                      </div>
                      <Toggle value={item.value} onChange={item.onChange} color={item.color} />
                    </div>
                  ))}
                  <button onClick={handleUpdateConfig}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm uppercase tracking-widest py-3.5 rounded-xl shadow-lg shadow-purple-900/30 active:scale-95 transition-all">
                    💾 Save & Broadcast Changes
                  </button>
                </div>

                {/* Reports Queue */}
                <div className="bg-[#1C1C2E] border border-amber-500/20 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-black text-amber-400">🚨 Reports Queue</h3>
                    <button onClick={async () => {
                      try { const r = await fetch(`${API_BASE}/reports?status=pending`); if (r.ok) { const reports = await r.json(); localStorage.setItem('friends_bd_reports', JSON.stringify(reports)); toast(`📋 ${reports.length} pending reports`); } } catch {}
                    }} className="text-xs font-bold text-amber-400/60 hover:text-amber-300 uppercase tracking-widest">Refresh</button>
                  </div>
                  {(() => {
                    const reports = JSON.parse(localStorage.getItem('friends_bd_reports') || '[]');
                    if (reports.length === 0) return <p className="text-xs text-white/60 text-center py-4">No pending reports</p>;
                    return reports.slice(0, 5).map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">Report: {r.reason}</p>
                          <p className="text-xs text-white/60">Target: {r.targetName || r.targetId} · by {r.reporterName}</p>
                        </div>
                        <div className="flex flex-wrap gap-1 shrink-0">
                          <button onClick={async () => { try { await fetch(`${API_BASE}/reports/${r.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status:'resolved', resolvedBy:'admin'}) }); const s=JSON.parse(localStorage.getItem('friends_bd_reports')||'[]'); localStorage.setItem('friends_bd_reports', JSON.stringify(s.filter((x:any)=>x.id!==r.id))); toast('✅ Resolved'); } catch{} }} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-black rounded-lg">✅</button>
                          <button onClick={async () => { try { await fetch(`${API_BASE}/reports/${r.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status:'dismissed', resolvedBy:'admin'}) }); const s=JSON.parse(localStorage.getItem('friends_bd_reports')||'[]'); localStorage.setItem('friends_bd_reports', JSON.stringify(s.filter((x:any)=>x.id!==r.id))); toast('⛔ Dismissed'); } catch{} }} className="px-2 py-1 bg-rose-500/20 text-rose-400 text-xs font-black rounded-lg">⛔</button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                {/* Danger Zone */}
                <div className="bg-[#1C1C2E] border border-rose-500/20 rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-black text-rose-400">⚠️ Danger Zone</h3>
                  {[
                    { label: 'Clear All Shouts', sub: 'Permanently deletes all shouts', action: handleClearAllShouts, icon: '🗑️' },
                    { label: 'Reset All Bans', sub: 'Unban all banned users', action: () => { setBannedUsers([]); localStorage.setItem('friends_bd_banned', '[]'); toast('All bans reset.'); }, icon: '🔓' },
                    { label: 'Clear Activity Log', sub: 'Wipe all activity history', action: () => { setActivities([]); localStorage.setItem('friends_bd_activities', '[]'); toast('Activity log cleared.'); }, icon: '📋' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between p-4 bg-rose-500/5 rounded-xl border border-rose-500/10">
                      <div>
                        <p className="text-xs font-black text-white">{item.icon} {item.label}</p>
                        <p className="text-xs text-white/60 font-bold">{item.sub}</p>
                      </div>
                      <button onClick={item.action} className="px-4 py-2 bg-rose-500/20 text-rose-400 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-rose-500/30 border border-rose-500/20 active:scale-90 transition-all">
                        Execute
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── LOGS ── */}
            {activeTab === 'logs' && (
              <motion.div key="logs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Live system logs */}
                <div className="bg-[#0a0a1a] border border-white/5 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </span>
                      <span className="text-xs sm:text-sm font-black text-white/40 uppercase tracking-widest">Live System Logs</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {['bg-rose-500', 'bg-amber-500', 'bg-emerald-500'].map(c => <div key={c} className={`w-2 h-2 rounded-full ${c}`} />)}
                    </div>
                  </div>
                  <div className="p-4 space-y-1.5 h-52 overflow-y-auto font-mono">
                    {logs.map(log => (
                      <div key={log.id} className="text-xs sm:text-sm flex flex-wrap items-start gap-2">
                        <span className="text-white/40 shrink-0">[{log.time}]</span>
                        <span className={`font-black shrink-0 ${log.type === 'WARN' ? 'text-amber-400' : log.type === 'DANGER' ? 'text-rose-400' : log.type === 'SUCCESS' ? 'text-emerald-400' : 'text-purple-400'}`}>{log.type}:</span>
                        <span className="text-white/50">{log.msg}</span>
                      </div>
                    ))}
                    {logs.length === 0 && <p className="text-white/40 text-xs">Waiting for events...</p>}
                    <div ref={logEndRef} />
                  </div>
                </div>

                {/* Admin Action Logs */}
                <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-black text-white/60 uppercase tracking-[0.3em]">🗑️ Deleted Shout Logs</h3>
                    <span className="text-xs text-white/40 font-mono">{adminLogs.filter(l => l.action === 'SHOUT_DELETED').length} entries</span>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {adminLogs.filter(l => l.action === 'SHOUT_DELETED').length > 0 ? adminLogs.filter(l => l.action === 'SHOUT_DELETED').map((log, i) => (
                      <div key={log.id || i} className="flex flex-wrap items-start gap-3 p-3 bg-rose-500/5 rounded-xl hover:bg-rose-500/10 transition-colors border border-rose-500/10">
                        <span className="text-xs font-mono text-rose-400/60 bg-rose-500/10 px-2 py-1 rounded-lg shrink-0 mt-0.5">{new Date(log.timestamp).toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' })}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-rose-300/70 leading-relaxed">
                            <span className="font-black text-rose-400">{log.deletedByName}</span> deleted {log.details}
                          </p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-center text-white/40 text-xs py-8">No deletion logs yet.</p>
                    )}
                  </div>
                </div>

                {/* User activity logs */}
                <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4">
                  <h3 className="text-xs font-black text-white/60 uppercase tracking-[0.3em] mb-3">👤 User Activity</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {activities.length > 0 ? activities.map((act, i) => (
                      <div key={i} className="flex flex-wrap items-start gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                        <span className="text-xs font-mono text-white/40 bg-white/5 px-2 py-1 rounded-lg shrink-0 mt-0.5">{act.time}</span>
                        <p className="text-xs text-white/50 leading-relaxed">
                          <span className="font-black text-white/70">@{act.username}</span> {act.msg}
                        </p>
                      </div>
                    )) : (
                      <p className="text-center text-white/40 text-xs py-8">No activity logged yet.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {/* ── EDIT USER STATS MODAL ── */}
      <AnimatePresence>
        {editingUser && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingUser(null)} className="fixed inset-0 bg-black/80 z-[300] backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-center z-[301] pointer-events-none p-4">
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-[#1C1C2E] border border-purple-500/20 rounded-[2rem] shadow-2xl p-6 w-full max-w-full max-w-4xl mx-auto px-4 sm:px-6 max-h-[95vh] flex flex-col pointer-events-auto">
              <div className="flex flex-wrap items-center gap-3 mb-5 pb-4 border-b border-white/5">
                <img src={editingUser.avatar} className="w-12 h-12 rounded-2xl object-cover border-2 border-purple-500/30" alt="" />
                <div>
                  <h3 className="text-sm font-black text-white">{editingUser.name}</h3>
                  <p className="text-xs sm:text-sm text-purple-400/60 font-bold">@{editingUser.username}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 md:grid-cols-1 sm:grid-cols-2 gap-4 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Level',        key: 'level',        type: 'number' },
                  { label: 'Points (XP)',  key: 'points',       type: 'number' },
                  { label: 'Plusses',      key: 'plusses',      type: 'number' },
                  { label: 'Golden Coins', key: 'goldenCoins',  type: 'number' },
                  { label: 'Silver Points',key: 'silverPoints', type: 'number' },
                  { label: 'Color Balls',  key: 'colorBalls',   type: 'number' },
                  { label: 'Golden Balls', key: 'goldenBalls',  type: 'number' },
                  { label: 'Magic Points', key: 'magicPoints',  type: 'number' },
                  { label: 'Reputation',   key: 'reputation_points', type: 'number' },
                  { label: 'Stamina',      key: 'stamina',      type: 'number' },
                  { label: 'Max Stamina',  key: 'maxStamina',   type: 'number' },
                  { label: 'Daily AP',     key: 'ap',           type: 'number' },
                  { label: 'Total AP',     key: 'totalAp',      type: 'number' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="text-xs font-black text-white/60 uppercase tracking-widest block mb-1">{field.label}</label>
                    <input type={field.type} value={(editingUser as any)[field.key] || 0}
                      onChange={e => setEditingUser({ ...editingUser, [field.key]: parseInt(e.target.value) || 0 } as User)}
                      className={inputCls} />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-black text-white/60 uppercase tracking-widest block mb-1">Role</label>
                  <select value={editingUser.role || 'user'} onChange={e => setEditingUser({ ...editingUser, role: e.target.value as any })}
                    className={inputCls + ' appearance-none cursor-pointer'}>
                    {ROLES.map(r => <option key={r} value={r} className="bg-[#1C1C2E]">{r}</option>)}
                  </select>
                </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <span className="text-xs font-black text-white/50">Verified Badge</span>
                    <Toggle value={!!editingUser.isVerified} onChange={() => setEditingUser({ ...editingUser, isVerified: !editingUser.isVerified })} />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <span className="text-xs font-black text-white/50">Premium Status</span>
                    <Toggle value={!!editingUser.isPremium} onChange={() => setEditingUser({ ...editingUser, isPremium: !editingUser.isPremium })} color="bg-amber-500" />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-white/5 shrink-0">
                <button onClick={handleSaveUserStats} className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest active:scale-95 transition-all">Save Changes</button>
                <button onClick={() => setEditingUser(null)} className="px-6 bg-white/5 text-white/40 py-3 rounded-xl text-xs sm:text-sm font-black uppercase hover:bg-white/10 transition-all">Cancel</button>
              </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;



