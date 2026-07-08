import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import { mongoService } from '../services/mongoService';

const getCountryFlag = (country?: string) => {
  if (!country) return '❓ Unknown';
  if (country.toLowerCase() === 'bangladesh') return '🇧🇩 Bangladesh';
  if (country.toLowerCase() === 'india') return '🇮🇳 India';
  return `❓ ${country}`;
};

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

  const formatIdleTime = (lastActiveTime?: number) => {
    if (!lastActiveTime) return '1 Second!';
    const diff = timeTick - lastActiveTime;
    if (diff <= 0) return '1 Second!';
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) {
      return `${seconds === 1 ? '1 Second!' : `${seconds} seconds`}`;
    }
    const minutes = Math.floor(seconds / 60);
    const remSeconds = seconds % 60;
    if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ${remSeconds} second${remSeconds !== 1 ? 's' : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    return `${hours} hour${hours > 1 ? 's' : ''} ${remMinutes} minute${remMinutes !== 1 ? 's' : ''}`;
  };

  useEffect(() => {
    // Sync active user
    const saved = localStorage.getItem('user_session');
    if (saved) {
      try {
        setActiveUser(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }

    // Sync all users
    const unsub = mongoService.listenUsers(list => {
      setUsers(list);
    });

    return () => unsub();
  }, []);

  // Update URL query param when filter state changes
  useEffect(() => {
    setSearchParams({ filter });
  }, [filter, setSearchParams]);

  // Sync state if URL query param changes from outside
  useEffect(() => {
    const queryFilter = searchParams.get('filter');
    if (queryFilter && queryFilter !== filter) {
      setFilter(queryFilter);
    }
  }, [searchParams]);

  const onlineUsers = users.filter(u => {
    if (!u.isOnline) return false;
    // Additional client-side idle check (30 min) as safety net
    if (u.lastActiveTime) {
      const idleMs = timeTick - u.lastActiveTime;
      if (idleMs > 30 * 60 * 1000) return false;
    }
    return true;
  });

  const filteredUsers = users.filter(u => {
    // Filter by category
    if (filter === 'online') {
      if (!u.isOnline) return false;
      if (u.lastActiveTime) {
        const idleMs = timeTick - u.lastActiveTime;
        if (idleMs > 30 * 60 * 1000) return false;
      }
    }
    if (filter === 'premium' && !u.isPremium) return false;
    if (filter === 'staff' && u.role !== 'admin' && u.role !== 'moderator') return false;

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const getHeaderTitle = () => {
    switch (filter) {
      case 'online': return 'Online Members';
      case 'premium': return 'Premium Members';
      case 'staff': return 'Staff Members';
      default: return 'All Members';
    }
  };

  const getHeaderIcon = () => {
    switch (filter) {
      case 'online': return '🟢';
      case 'premium': return '👑';
      case 'staff': return '🛡️';
      default: return '👥';
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-24 font-inter text-white">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#110a2a] via-[#1d0d4a] to-[#0d1a6b] pt-10 pb-20 px-5 rounded-b-[3rem] shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_0%,_#7c3aed33,_transparent_70%)]" />
        <div className="absolute top-8 right-4 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-4 left-8 w-24 h-24 bg-indigo-600/10 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-wrap items-center gap-4">
          <button
            onClick={() => navigate('/home')}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all active:scale-90 border border-white/10 backdrop-blur-md"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl">{getHeaderIcon()}</span>
              <h2 className="text-2xl font-black tracking-tight italic bg-gradient-to-r from-white via-purple-200 to-indigo-200 bg-clip-text text-transparent">
                {getHeaderTitle()}
              </h2>
            </div>
            <p className="text-[9px] font-black uppercase opacity-50 tracking-[0.2em] text-purple-300">
              Community Directory
            </p>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="px-5 space-y-6 -mt-10 relative z-20">
        {/* Search Bar */}
        <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl flex items-center px-4 focus-within:border-purple-500/40 transition-colors shadow-2xl">
          <svg className="w-5 h-5 text-white/30 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none text-sm text-white/80 placeholder-white/20 py-4 outline-none font-medium"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-white/30 hover:text-white transition-colors">
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="bg-[#1C1C2E] p-1.5 rounded-[2rem] border border-white/5 flex flex-wrap gap-1.5 shadow-2xl">
          {[
            { id: 'all', label: 'All', count: null },
            { id: 'online', label: 'Online', count: onlineUsers.length },
            { id: 'premium', label: 'Premium', count: null },
            { id: 'staff', label: 'Staff', count: null }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex flex-wrap-1 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex flex-wrap items-center justify-center gap-1 ${
                filter === f.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              {f.id === 'online' && (
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse" />
              )}
              {f.label}
              {f.count !== null && (
                <span className={`text-[9px] font-black px-1 py-0 rounded-full ml-0.5 ${filter === f.id ? 'bg-white/20' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Member Grid/List */}
        <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredUsers.length > 0 ? (
              [...filteredUsers]
                .sort((a, b) => {
                  if (filter === 'online') {
                    return (b.lastActiveTime || 0) - (a.lastActiveTime || 0);
                  }
                  return (a.userId || 0) - (b.userId || 0);
                })
                .map(u => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-[#1C1C2E] border border-white/5 rounded-[2rem] p-5 flex flex-col justify-between hover:border-purple-500/20 transition-all shadow-xl"
                  >
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="relative shrink-0">
                        <img
                          src={u.avatar || `https://picsum.photos/seed/${u.id}/100`}
                          className="w-16 h-16 rounded-[1.5rem] object-cover border-2 border-white/10"
                          alt=""
                        />
                        {u.isOnline && (
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-[#1C1C2E] rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link to={u.id === activeUser.id ? '/profile' : `/profile/${u.username}`} className="hover:underline shrink-0">
                            <span className={`text-sm font-black truncate max-w-[200px] ${u.isOnline ? 'text-emerald-400' : 'text-white'}`}>
                              {u.username.trim() === '' ? '' : u.username}
                            </span>
                          </Link>
                          {u.isPremium && (
                            <span className="text-[10px] text-emerald-300 font-bold italic">
                              (Premium User!)
                            </span>
                          )}
                          {u.isVerified && <span className="text-[10px]">✔️</span>}
                          {(u.id === 'bot_chatgirl' || u.username === 'chatgirl' || u.userId === 1) && (
                            <span className="text-[8px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest border border-purple-500/30">
                              🤖 Bot
                            </span>
                          )}
                          {u.role === 'admin' && (
                            <span className="text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">
                              🛡️ Admin
                            </span>
                          )}
                          {u.role === 'moderator' && (
                            <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">
                              🛡️ Mod
                            </span>
                          )}
                        </div>

                        {u.isOnline ? (
                          <div className="text-[11px] text-white/70 font-semibold space-y-0.5 mt-1 font-mono">
                            <p><span className="text-white/40 font-bold">From:</span> {getCountryFlag(u.fromCountry)}</p>
                            <p><span className="text-white/40 font-bold">Where:</span> {((timeTick - (u.lastActiveTime || 0)) > 2 * 60 * 1000) ? 'Ghost Mode' : (u.currentLocation || 'Home Page')}</p>
                            <p><span className="text-white/40 font-bold">Idle For:</span> {formatIdleTime(u.lastActiveTime)}</p>
                          </div>
                        ) : (
                          <>
                            <p className="text-[10px] text-purple-400/70 font-bold mt-0.5">@{u.username}</p>
                            <p className="text-[9px] text-white/30 font-bold mt-1 uppercase tracking-wider">
                              Level {u.level} • {u.points} XP
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-5">
                      <button
                        onClick={() => navigate(`/chat?userId=${u.id}`)}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-3 rounded-xl transition-all text-xs text-center shadow-lg shadow-purple-900/20"
                      >
                        Message
                      </button>
                    </div>
                  </motion.div>
                ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-20 text-center bg-[#1C1C2E] rounded-[2rem] border border-white/5"
              >
                <span className="text-5xl block mb-4">👥</span>
                <p className="text-sm font-black text-white/20 uppercase tracking-widest">No members found</p>
                <p className="text-[10px] text-white/10 font-bold mt-1">Try searching another query</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CommunityMembers;


