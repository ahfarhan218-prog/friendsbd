import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import { mongoService } from '../services/mongoService';

const FILTERS = [
  { id: 'all', label: 'All', icon: '👥' },
  { id: 'online', label: 'Online', icon: '🟢' },
  { id: 'male', label: 'Male', icon: '♂️' },
  { id: 'female', label: 'Female', icon: '♀️' },
  { id: 'staff', label: 'Staff', icon: '🛡️' },
  { id: 'premium', label: 'Premium', icon: '👑' },
];

const CommunityMembers: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'all';

  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<string>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [timeTick, setTimeTick] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setTimeTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('user_session');
    if (saved) { try { setActiveUser(JSON.parse(saved)); } catch (e) { console.error(e); } }
    const unsub = mongoService.listenUsers(list => setUsers(list));
    return () => unsub();
  }, []);

  useEffect(() => { setSearchParams({ filter }); }, [filter]);
  useEffect(() => { const q = searchParams.get('filter'); if (q && q !== filter) setFilter(q); }, [searchParams]);

  const onlineUsers = users.filter(u => {
    if (!u.isOnline) return false;
    if (u.lastActiveTime && (timeTick - u.lastActiveTime) > 30 * 60 * 1000) return false;
    return true;
  });

  const filteredUsers = users.filter(u => {
    if (filter === 'online') {
      if (!u.isOnline) return false;
      if (u.lastActiveTime && (timeTick - u.lastActiveTime) > 30 * 60 * 1000) return false;
    }
    if (filter === 'male') {
      const g = (u.gender || '').toLowerCase();
      if (g !== 'male' && g !== '♂️') return false;
    }
    if (filter === 'female') {
      const g = (u.gender || '').toLowerCase();
      if (g !== 'female' && g !== '♀️' && g !== 'girl' && g !== 'woman') return false;
    }
    if (filter === 'staff' && u.role !== 'admin' && u.role !== 'moderator') return false;
    if (filter === 'premium' && !u.isPremium) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return u.name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a] pb-24 font-inter">
      <style>{`
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .mb-card { background:#1C1C2E; border:1px solid rgba(255,255,255,0.06); border-radius:20px; transition:all .3s; }
        .mb-card:hover { border-color:rgba(168,85,247,0.15); }
        .mb-input { background:rgba(22,27,34,0.8); border:1px solid #30363d; border-radius:12px; padding:10px 14px; color:#fff; font-size:0.85rem; outline:none; transition:all .3s; }
        .mb-input:focus { border-color:#a78bfa; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #30363d; border-radius: 10px; }
      `}</style>

      {/* Header */}
      <header className="bg-gradient-to-r from-purple-700 via-purple-600 to-pink-600 text-white p-4 sm:p-6 pb-16 sm:pb-20 rounded-b-[2rem] sm:rounded-b-[3rem] shadow-lg shadow-purple-900/30">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/home')} className="p-2 bg-white/10 rounded-full active:scale-90 transition-transform backdrop-blur-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          </button>
          <div>
            <h2 className="text-2xl font-black italic">Community Members 👥</h2>
            <p className="text-xs sm:text-sm opacity-70 font-bold uppercase tracking-wider">{filteredUsers.length} members</p>
          </div>
        </div>
      </header>

      <div className="px-4 -mt-16 flex flex-col gap-4 max-w-4xl mx-auto relative z-20">
        {/* Search */}
        <div className="mb-card p-1 flex items-center px-4 gap-3">
          <svg className="w-5 h-5 text-white/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search members..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none text-sm text-white/80 placeholder-white/20 py-3 outline-none font-medium" />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-white/40 hover:text-white transition-colors text-sm font-black">✕</button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="mb-card p-1.5 flex flex-wrap gap-1">
          {FILTERS.map(f => {
            const isActive = filter === f.id;
            const count = f.id === 'online' ? onlineUsers.length : null;
            return (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1.5 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-900/40 scale-105'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                }`}>
                <span>{f.icon}</span>
                <span className="hidden sm:inline">{f.label}</span>
                {count !== null && (
                  <span className={`text-xs font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Member Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {filteredUsers.length > 0 ? (
              [...filteredUsers]
                .sort((a, b) => {
                  if (filter === 'online') return (b.lastActiveTime || 0) - (a.lastActiveTime || 0);
                  return (a.userId || 0) - (b.userId || 0);
                })
                .map(u => {
                  const isOnline = u.isOnline && (!u.lastActiveTime || (timeTick - u.lastActiveTime) <= 30 * 60 * 1000);
                  return (
                  <motion.div key={u.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
                    className="mb-card p-5 flex flex-col items-center gap-3 text-center">
                    <div className="relative shrink-0">
                      <img src={u.avatar || `https://picsum.photos/seed/${u.id}/100`} className="w-16 h-16 rounded-full object-cover border-2 border-white/10 mx-auto" alt=""
                        onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${u.id}/100`; }} />
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-[#1C1C2E] rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-gray-500'}`}
                        style={isOnline ? { animation: 'pulse-dot 2s infinite' } : {}} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <Link to={u.id === activeUser?.id ? '/profile' : `/profile/${u.username}`} className="hover:underline">
                          <span className="text-sm font-black text-white truncate max-w-[160px] block">{u.name}</span>
                        </Link>
                        {u.isVerified && <span className="text-blue-400 text-xs">✓</span>}
                      </div>
                      <p className="text-xs text-white/40 font-medium mt-0.5">@{u.username}</p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {isOnline && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          🟢 {u.lastActiveTime ? (() => { const s = Math.floor((timeTick - u.lastActiveTime) / 1000); if (s < 60) return 'Active now'; const m = Math.floor(s / 60); return `${m}m ago`; })() : 'Online'}
                        </span>
                      )}
                      {!isOnline && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20">
                          ⚫ Offline
                        </span>
                      )}
                      {u.role === 'admin' && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">🛡️ Admin</span>}
                      {u.role === 'moderator' && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">⚖️ Mod</span>}
                      {u.isPremium && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">👑 Premium</span>}
                      {(u.id === 'bot_chatgirl' || u.username === 'chatgirl' || u.userId === 1) && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">🤖 Bot</span>
                      )}
                      {u.gender && (u.gender.toLowerCase() === 'male' || u.gender.toLowerCase() === 'female') && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10">
                          {u.gender.toLowerCase() === 'male' ? '♂️' : '♀️'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-3 text-xs text-white/40 font-medium">
                      <span>Lv.{u.level || 1}</span>
                      <span>•</span>
                      <span>{u.points || 0} XP</span>
                      <span>•</span>
                      <span>{u.fromCountry ? (u.fromCountry.toLowerCase() === 'bangladesh' ? '🇧🇩' : u.fromCountry.toLowerCase() === 'india' ? '🇮🇳' : '🌍') : '🌍'}</span>
                    </div>

                    <button onClick={() => navigate(`/chat?userId=${u.id}`)}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-2.5 rounded-xl transition-all text-sm text-center shadow-lg shadow-purple-900/20 active:scale-[0.98]">
                      💬 Message
                    </button>
                  </motion.div>
                  );
                })
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-20 text-center mb-card p-8">
                <span className="text-5xl block mb-4">👥</span>
                <p className="text-sm font-black text-white/40 uppercase tracking-widest">No members found</p>
                <p className="text-xs text-white/10 font-bold mt-1">Try another filter or search query</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CommunityMembers;
