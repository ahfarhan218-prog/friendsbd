import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import { mongoService } from '../services/mongoService';

const APLeaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [mode, setMode] = useState<'daily' | 'weekly' | 'total'>('total');
  
  const currentUserId = (() => {
    try { return JSON.parse(localStorage.getItem('user_session') || '{}').id; }
    catch { return null; }
  })();

  useEffect(() => {
    const unsubscribe = mongoService.listenUsers((dbUsers) => {
      const sorted = [...dbUsers].sort((a, b) => {
        const valA = mode === 'daily' ? (a.ap || 0) : mode === 'weekly' ? (a.weeklyAp || 0) : (a.totalAp || 0);
        const valB = mode === 'daily' ? (b.ap || 0) : mode === 'weekly' ? (b.weeklyAp || 0) : (b.totalAp || 0);
        return valB - valA;
      });
      setUsers(sorted);
    });
    return () => unsubscribe();
  }, [mode]);

  const getAPBadge = (ap: number) => {
     if (ap >= 1000) return { label: 'Oracle', bg: 'bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-600', icon: '⚡', text: 'text-amber-900', border: 'border-yellow-300' };
     if (ap >= 500) return { label: 'Community Legend', bg: 'bg-gradient-to-r from-indigo-500 to-purple-600', icon: '👑', text: 'text-white', border: 'border-purple-400' };
     if (ap >= 200) return { label: 'Helpful Expert', bg: 'bg-gradient-to-r from-emerald-400 to-teal-500', icon: '🌟', text: 'text-white', border: 'border-emerald-300' };
     if (ap >= 50) return { label: 'Rising Star', bg: 'bg-gradient-to-r from-blue-400 to-cyan-500', icon: '✨', text: 'text-white', border: 'border-blue-300' };
     return null;
  };

  const getScore = (u: User) => mode === 'daily' ? (u.ap || 0) : mode === 'weekly' ? (u.weeklyAp || 0) : (u.totalAp || 0);

  const top3 = users.slice(0, 3);
  const remainingUsers = users.slice(3);

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden font-sans pb-24">
      {/* Header */}
      <header className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-800 text-white p-4 sm:p-6 pb-20 rounded-b-[2rem] sm:rounded-b-[3rem] shadow-lg overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-20px] left-[-20px] w-40 h-40 bg-blue-300 opacity-20 rounded-full blur-xl"></div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">AP Board ⚡</h2>
              <p className="text-xs sm:text-sm font-medium opacity-80 mt-0.5">Top community contributors</p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 -mt-10 sm:-mt-12 flex flex-col gap-6 max-w-4xl mx-auto relative z-20">
        
        {/* Toggle Categories */}
        <div className="flex bg-white/80 p-1.5 rounded-2xl backdrop-blur-xl shadow-lg border border-white/40 mx-auto w-full sm:w-auto">
          {(['daily', 'weekly', 'total'] as const).map(m => (
            <button 
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 sm:flex-none px-4 sm:px-8 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                mode === m ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transform scale-[1.02]' : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        <div className="bg-white rounded-[2rem] sm:rounded-[3rem] pt-12 pb-6 px-4 sm:px-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center relative mt-4">
           {/* Decorative Crown */}
           <div className="absolute -top-6 text-5xl drop-shadow-lg animate-bounce">👑</div>
           
           <div className="flex items-end justify-center w-full h-56 sm:h-64 gap-2 sm:gap-4 mt-4">
              <AnimatePresence mode="popLayout">
                {top3.map((u, idx) => {
                  const places = [
                      { rank: '1st', bg: 'bg-gradient-to-t from-yellow-500 to-yellow-400', h: 'h-40 sm:h-48', imgSize: 'w-20 h-20 sm:w-24 sm:h-24', border: 'border-yellow-200', icon: '🥇', shadow: 'shadow-yellow-500/50' },
                      { rank: '2nd', bg: 'bg-gradient-to-t from-slate-400 to-slate-300', h: 'h-32 sm:h-36', imgSize: 'w-16 h-16 sm:w-20 sm:h-20', border: 'border-slate-200', icon: '🥈', shadow: 'shadow-slate-400/50' },
                      { rank: '3rd', bg: 'bg-gradient-to-t from-orange-500 to-orange-400', h: 'h-24 sm:h-28', imgSize: 'w-14 h-14 sm:w-16 sm:h-16', border: 'border-orange-200', icon: '🥉', shadow: 'shadow-orange-500/50' }
                  ];
                  
                  // Reorder to 2nd, 1st, 3rd visually
                  let displayUser = u;
                  let config = places[0];
                  let visualOrder = 1;
                  
                  if (idx === 0) { config = places[0]; visualOrder = 2; }
                  else if (idx === 1) { config = places[1]; visualOrder = 1; }
                  else if (idx === 2) { config = places[2]; visualOrder = 3; }

                  return (
                    <motion.div 
                      key={`${displayUser.id}-${mode}`}
                      layout
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="flex flex-col items-center flex-1 max-w-[120px]"
                      style={{ order: visualOrder }}
                    >
                        <div className="relative mb-3 group cursor-pointer">
                          <div className={`absolute inset-0 bg-white rounded-full blur-md opacity-50`}></div>
                          <img src={displayUser.avatar} className={`${config.imgSize} relative rounded-full border-[3px] sm:border-4 ${config.border} object-cover shadow-lg group-hover:scale-105 transition-transform`} alt={displayUser.name} />
                          <span className="absolute -bottom-2 -right-2 text-xl sm:text-2xl z-10 drop-shadow-md">{config.icon}</span>
                        </div>
                        <div className={`w-full ${config.bg} rounded-t-2xl sm:rounded-t-3xl ${config.h} flex flex-col items-center justify-start pt-3 sm:pt-4 text-white px-1 shadow-lg ${config.shadow} relative overflow-hidden`}>
                          <div className="absolute inset-0 bg-white opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:10px_10px]"></div>
                          <p className="text-[10px] sm:text-xs font-black uppercase text-white/80 drop-shadow-sm tracking-widest z-10">{config.rank}</p>
                          <p className="text-xs sm:text-sm font-bold text-center truncate w-full px-1 drop-shadow-md z-10 mt-1">{displayUser.name.split(' ')[0]}</p>
                          <div className="mt-auto mb-3 sm:mb-4 bg-black/20 px-3 py-1 rounded-full z-10 backdrop-blur-sm border border-white/10">
                            <p className="text-xs sm:text-sm font-black drop-shadow-sm">{getScore(displayUser)}</p>
                          </div>
                        </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
           </div>
        </div>

        {/* List Rankings */}
        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-3 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
           <div className="flex items-center gap-2 px-4 mb-5 text-indigo-700 font-bold uppercase text-xs sm:text-sm tracking-widest bg-indigo-50/50 py-3 rounded-2xl border border-indigo-100/50">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
              Community Rankings
           </div>
           
           <div className="space-y-2.5">
             <AnimatePresence>
             {remainingUsers.map((rank, index) => {
               const actualRank = index + 4;
               const badge = getAPBadge(rank.ap || 0); // AP badge always based on total AP usually, but let's keep it based on daily if we want, or totalAp. We'll use totalAp for badges so it reflects their overall standing.
               const badgeTotal = getAPBadge(rank.totalAp || 0);
               const isMe = rank.id === currentUserId;
               
               return (
               <motion.div 
                 layout
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 transition={{ duration: 0.2, delay: index * 0.03 }}
                 key={`${rank.id}-${mode}`} 
                 className={`group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl sm:rounded-3xl transition-all duration-300 hover:shadow-md ${isMe ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 shadow-sm scale-[1.01] z-10' : 'bg-slate-50/50 hover:bg-white border border-slate-100'}`}
               >
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl flex items-center justify-center font-black text-slate-500 text-sm sm:text-base bg-white shadow-sm border border-slate-100 group-hover:scale-110 transition-transform ${isMe ? 'text-blue-600 border-blue-200 bg-blue-50' : ''}`}>
                    #{actualRank}
                  </div>
                  
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm group-hover:border-blue-200 transition-colors">
                       <img src={rank.avatar} alt={rank.name} className="w-full h-full object-cover" />
                    </div>
                    {isMe && <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>}
                  </div>
                  
                  <div className="min-w-0 flex-1 py-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className={`font-bold text-sm sm:text-base truncate ${isMe ? 'text-blue-700' : 'text-slate-800'}`}>
                        {rank.name} {isMe && <span className="text-xs font-bold text-blue-500 opacity-80 ml-1">(You)</span>}
                      </h4>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-1.5">
                      <div className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-1 w-fit">
                        <span className="text-amber-500">⚡</span> {getScore(rank)} AP
                      </div>
                      
                      {badgeTotal && (
                        <div title={`Rank: ${badgeTotal.label}`} className={`flex items-center gap-1 ${badgeTotal.bg} ${badgeTotal.text} px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-sm shrink-0`}>
                           <span className="drop-shadow-sm">{badgeTotal.label}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                  </div>
               </motion.div>
               );
             })}
             </AnimatePresence>
           </div>
        </div>
      </div>
    </div>
  );
};

export default APLeaderboard;
