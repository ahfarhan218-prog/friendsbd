
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { gameService } from '../services/gameService';
import { CoinStats } from '../types';
import { mongoService } from '../services/mongoService';

const GoldenCoinLeaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'weekly' | 'daily'>('all');
  const [stats, setStats] = useState<CoinStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = mongoService.listenUsers((dbUsers) => {
      const activeUsers = dbUsers.filter(u => (u.goldenCoins || 0) > 0);
      const coinStatsList: CoinStats[] = activeUsers.map(u => ({
        userId: u.id,
        username: u.username || u.name,
        avatar: u.avatar,
        totalGrabbed: u.goldenCoins || 0,
        totalValue: u.goldenCoins || 0,
        fastestGrab: 0,
        lastWin: 0
      }));

      coinStatsList.sort((a, b) => b.totalGrabbed - a.totalGrabbed);
      setStats(coinStatsList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [filter]);

  const podium = useMemo(() => stats.slice(0, 3), [stats]);
  const others = useMemo(() => stats.slice(3), [stats]);
  const currentUserId = (() => {
    try { return JSON.parse(localStorage.getItem('user_session') || '{}').id; }
    catch { return null; }
  })();

  const myRank = useMemo(() => {
    if (!currentUserId) return null;
    const index = stats.findIndex(s => s.userId === currentUserId);
    return index !== -1 ? { rank: index + 1, data: stats[index] } : null;
  }, [stats, currentUserId]);

  const getBadge = (grabbed: number) => {
    if (grabbed >= 50) return { label: 'Coin Hunter', icon: '🏹' };
    if (grabbed >= 10) return { label: 'Fast Fingers', icon: '⚡' };
    return null;
  };

  return (
    <div className="min-h-screen bg-transparent font-inter pb-40">
      <header className="bg-gradient-to-br from-[#7F00FF] to-[#4F0099] text-white p-6 pb-20 rounded-b-[4rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-amber-400/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="relative z-10 flex justify-between items-center mb-8 flex-wrap gap-3">
          <button onClick={() => navigate('/coin-game')} className="p-3 bg-white/10 rounded-2xl active:scale-90 border border-white/10">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="text-center">
            <h2 className="text-2xl font-black uppercase tracking-tighter italic text-amber-400">Coin Rankings</h2>
            <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Global Grab Statistics</p>
          </div>
          <div className="w-12" />
        </div>

        {/* Tab Selection */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-1.5 flex flex-wrap gap-1 border border-white/10">
          {(['all', 'weekly', 'daily'] as const).map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === f ? 'bg-amber-400 text-purple-900 shadow-lg' : 'text-white/60 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="px-5 -mt-10 space-y-8 relative z-10">
        {/* PODIUM SECTION */}
        <div className="flex flex-wrap items-end justify-center gap-2 h-72 pb-4">
          {/* 2nd Place */}
          {podium[1] && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }} 
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center flex-1 max-w-[100px]"
            >
              <div className="relative mb-3">
                <img src={podium[1].avatar} className="w-14 h-14 rounded-full border-4 border-slate-300 shadow-lg" alt="" />
                <span className="absolute -top-2 -right-2 text-2xl" title="2nd Place">🥈</span>
              </div>
              <div className="w-full bg-slate-100 rounded-t-3xl h-24 flex flex-col items-center justify-center p-2 border-x border-t border-slate-200">
                <p className="text-[10px] font-black text-slate-800 truncate w-full text-center">{podium[1].username}</p>
                <p className="text-xs font-black text-slate-500">{podium[1].totalGrabbed}</p>
                <p className="text-[7px] font-bold text-slate-400 uppercase">Grabs</p>
              </div>
            </motion.div>
          )}

          {/* 1st Place */}
          {podium[0] && (
            <motion.div 
              initial={{ opacity: 0, y: 70 }} 
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center flex-1 max-w-[120px] relative z-20"
            >
              <div className="relative mb-4 group">
                <div className="absolute -inset-2 bg-amber-400/20 rounded-full blur group-hover:bg-amber-400/40 transition-all" />
                <img src={podium[0].avatar} className="w-20 h-20 rounded-full border-4 border-amber-400 shadow-2xl relative z-10" alt="" />
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xl animate-bounce" title="Coin King">👑</div>
              </div>
              <div className="w-full bg-gradient-to-t from-amber-50 to-white rounded-t-[2.5rem] h-36 flex flex-col items-center justify-center p-3 border-x border-t border-amber-200 shadow-[0_-15px_30px_rgba(251,191,36,0.1)]">
                <p className="text-xs font-black text-amber-600 uppercase tracking-tighter mb-1">Coin King</p>
                <p className="text-xs font-black text-slate-900 truncate w-full text-center">{podium[0].username}</p>
                <p className="text-xl font-black text-amber-500">{podium[0].totalGrabbed}</p>
                <p className="text-[8px] font-black text-amber-600/50 uppercase tracking-widest">Grand Total</p>
              </div>
            </motion.div>
          )}

          {/* 3rd Place */}
          {podium[2] && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }} 
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center flex-1 max-w-[100px]"
            >
              <div className="relative mb-3">
                <img src={podium[2].avatar} className="w-14 h-14 rounded-full border-4 border-orange-200 shadow-lg" alt="" />
                <span className="absolute -top-2 -right-2 text-2xl" title="3rd Place">🥉</span>
              </div>
              <div className="w-full bg-orange-50/30 rounded-t-3xl h-20 flex flex-col items-center justify-center p-2 border-x border-t border-orange-100">
                <p className="text-[10px] font-black text-slate-800 truncate w-full text-center">{podium[2].username}</p>
                <p className="text-xs font-black text-orange-400">{podium[2].totalGrabbed}</p>
                <p className="text-[7px] font-bold text-orange-300 uppercase">Grabs</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* LIST SECTION */}
        <div className="bg-white rounded-[3rem] p-6 shadow-xl border border-slate-100">
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Global Ranking</h3>
            <span className="text-[8px] font-black bg-slate-50 text-slate-400 px-3 py-1 rounded-full">{stats.length} Active Players</span>
          </div>

          <div className="space-y-3">
            {others.length > 0 ? others.map((u, idx) => (
              <motion.div 
                key={u.userId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-[2rem] hover:bg-white hover:shadow-lg hover:border-purple-100 transition-all group"
              >
                <div className="flex flex-wrap items-center gap-4">
                  <span className="w-6 text-center text-[10px] font-black text-slate-300 group-hover:text-purple-400">#{idx + 4}</span>
                  <div className="relative">
                    <img src={u.avatar} className="w-10 h-10 rounded-xl border border-white shadow-sm" alt="" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-xs font-black text-slate-800">{u.username}</p>
                      {getBadge(u.totalGrabbed) && (
                        <span className="text-[10px]" title={getBadge(u.totalGrabbed)?.label}>
                          {getBadge(u.totalGrabbed)?.icon}
                        </span>
                      )}
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">
                      Fastest: {(u.fastestGrab / 1000).toFixed(2)}s
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-purple-600">{u.totalGrabbed} Grabs</p>
                  <p className="text-[8px] font-black text-amber-500 uppercase">+{u.totalValue} Pts</p>
                </div>
              </motion.div>
            )) : !loading && podium.length === 0 && (
              <div className="py-20 text-center opacity-30">
                <div className="text-5xl mb-4">🏆</div>
                <p className="text-xs font-black uppercase tracking-widest leading-relaxed">
                  No records yet.<br/>Be the first to claim a coin!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MY RANK STICKY FOOTER */}
      <AnimatePresence>
        {myRank && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-28 md:bottom-8 left-0 md:left-72 right-0 max-w-md mx-auto px-6 z-[60]"
          >
            <div className="bg-slate-900 text-white rounded-[2rem] p-5 shadow-2xl border border-white/10 flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <div className="bg-amber-400 text-purple-900 w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-lg">
                  #{myRank.rank}
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">My Progress</p>
                  <p className="text-sm font-black italic">Rank Performance</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-amber-400">{myRank.data.totalGrabbed} Coins</p>
                <p className="text-[8px] font-bold text-slate-500 uppercase">Top {((myRank.rank / stats.length) * 100).toFixed(0)}% of players</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GoldenCoinLeaderboard;

