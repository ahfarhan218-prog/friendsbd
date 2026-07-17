import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { mongoService } from '../services/mongoService';

const TABS = [
  { key: 'alltime', label: 'All Time', icon: '🏆' },
  { key: 'weekly', label: 'This Week', icon: '📅' },
  { key: 'daily', label: 'Today', icon: '☀️' },
];

const SilverCoinLeaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<'alltime' | 'daily' | 'weekly'>('alltime');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUserId = (() => {
    try { return JSON.parse(localStorage.getItem('user_session') || '{}').id; }
    catch { return null; }
  })();

  const getField = () => {
    if (period === 'daily') return 'dailySilverPoints';
    if (period === 'weekly') return 'weeklySilverPoints';
    return 'silverPoints';
  };

  useEffect(() => {
    setLoading(true);
    const field = getField();
    const unsub = mongoService.listenUsers((dbUsers) => {
      const sorted = dbUsers
        .filter(u => (u[field] || 0) > 0)
        .sort((a: any, b: any) => (b[field] || 0) - (a[field] || 0));
      setUsers(sorted);
      setLoading(false);
    });
    return () => unsub();
  }, [period]);

  const field = getField();
  const podium = useMemo(() => users.slice(0, 3), [users]);
  const others = useMemo(() => users.slice(3), [users]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a] pb-20 overflow-x-hidden">
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .lb-card { background:#1C1C2E; border:1px solid rgba(255,255,255,0.06); border-radius:20px; transition:all .3s; }
        .lb-card:hover { border-color:rgba(148,163,184,0.15); }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #30363d; border-radius: 10px; }
      `}</style>

      <header className="bg-gradient-to-r from-slate-600 via-slate-500 to-cyan-600 text-white p-4 sm:p-6 pb-16 sm:pb-20 rounded-b-[2rem] sm:rounded-b-[3rem] shadow-lg shadow-slate-900/30">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-full active:scale-90 transition-transform backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            </button>
            <div>
              <h2 className="text-2xl font-black italic">Silver Leaderboard 🥈</h2>
              <p className="text-xs sm:text-sm opacity-70 font-bold uppercase tracking-wider">Top silver earners</p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 -mt-16 flex flex-col gap-6 mb-24 max-w-4xl mx-auto">
        <div className="lb-card p-1.5 flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setPeriod(tab.key as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-black uppercase tracking-wider transition-all ${
                period === tab.key
                  ? 'bg-gradient-to-r from-slate-500 to-cyan-500 text-white shadow-lg shadow-slate-900/40 scale-105'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-slate-500/30 border-t-slate-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="lb-card p-4 sm:p-6 flex flex-col items-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-4xl mb-3">🥈</motion.div>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">{period === 'daily' ? "Today's" : period === 'weekly' ? "This Week's" : 'All Time'} Top Silver</p>
              <div className="flex items-end justify-center gap-3 sm:gap-6 w-full min-h-[200px]">
                {podium[1] && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col items-center flex-1 max-w-[120px]">
                    <div className="relative mb-2">
                      <img src={podium[1].avatar} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-slate-400/30 object-cover shadow-lg" alt="" />
                      <span className="absolute -top-2 -right-2 text-xl">🥈</span>
                    </div>
                    <div className="w-full bg-gradient-to-t from-slate-700/40 to-slate-500/20 rounded-t-3xl h-20 sm:h-24 flex flex-col items-center justify-center p-2 text-center border-t border-slate-500/20">
                      <p className="text-xs font-black uppercase text-slate-300">2nd</p>
                      <p className="text-xs font-bold text-white truncate w-full px-1">{podium[1].name?.split(' ')[0]}</p>
                      <p className="text-xs font-medium text-slate-200">{podium[1][field] || 0} pts</p>
                    </div>
                  </motion.div>
                )}
                {podium[0] && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="flex flex-col items-center flex-1 max-w-[140px]" style={{ animation: 'float 4s ease-in-out infinite' }}>
                    <div className="relative mb-2">
                      <img src={podium[0].avatar} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-cyan-400/50 object-cover shadow-xl shadow-slate-900/30" alt="" />
                      <span className="absolute -top-3 -right-2 text-2xl">👑</span>
                    </div>
                    <div className="w-full bg-gradient-to-t from-slate-600 to-slate-400/30 rounded-t-3xl h-28 sm:h-32 flex flex-col items-center justify-center p-2 text-center border-t border-slate-400/30 shadow-lg shadow-slate-900/20">
                      <p className="text-xs font-black uppercase text-cyan-300">#1</p>
                      <p className="text-xs sm:text-sm font-black text-white truncate w-full px-1">{podium[0].name?.split(' ')[0]}</p>
                      <p className="text-xs sm:text-sm font-bold text-cyan-200">{podium[0][field] || 0} pts</p>
                    </div>
                  </motion.div>
                )}
                {podium[2] && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col items-center flex-1 max-w-[120px]">
                    <div className="relative mb-2">
                      <img src={podium[2].avatar} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-slate-400/20 object-cover shadow-lg" alt="" />
                      <span className="absolute -top-2 -right-2 text-xl">🥉</span>
                    </div>
                    <div className="w-full bg-gradient-to-t from-slate-800/40 to-slate-600/20 rounded-t-3xl h-16 sm:h-20 flex flex-col items-center justify-center p-2 text-center border-t border-slate-500/10">
                      <p className="text-xs font-black uppercase text-slate-400">3rd</p>
                      <p className="text-xs font-bold text-white truncate w-full px-1">{podium[2].name?.split(' ')[0]}</p>
                      <p className="text-xs font-medium text-slate-300">{podium[2][field] || 0} pts</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="lb-card p-4">
              <div className="flex items-center gap-2 px-3 mb-4 text-slate-400 font-black uppercase text-xs tracking-widest">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                Rankings ({users.length})
              </div>
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                {others.length === 0 && users.length === 0 && (
                  <p className="text-center text-sm text-white/40 py-8">No users found.</p>
                )}
                {others.map((rank, index) => {
                  const globalIndex = index + 4;
                  const isSelf = rank.id === currentUserId;
                  return (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={rank.id}
                      className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                        isSelf
                          ? 'bg-cyan-500/10 border border-cyan-500/30 shadow-md'
                          : 'bg-[#161b22]/50 border border-transparent hover:bg-[#161b22] hover:border-white/5'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                        globalIndex <= 10 ? 'bg-slate-500/20 text-slate-400' : 'bg-[#30363d]/50 text-white/40'
                      }`}>
                        {globalIndex}
                      </div>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <img src={rank.avatar} alt="" className="w-9 h-9 rounded-xl object-cover border border-white/10 shrink-0"
                          onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${rank.id}/100`; }} />
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-white truncate">
                            {rank.name} {isSelf && <span className="text-cyan-400 text-xs">(You)</span>}
                            {rank.isVerified && <span className="ml-1 text-blue-400">✓</span>}
                          </h4>
                          <p className="text-xs text-white/40 font-medium">Level {rank.level || 1}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-slate-300">{rank[field]?.toLocaleString() || 0}</p>
                        <p className="text-xs text-white/30">pts</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SilverCoinLeaderboard;
