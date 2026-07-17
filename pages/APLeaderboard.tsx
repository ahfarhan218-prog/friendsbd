import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User } from '../types';
import { mongoService } from '../services/mongoService';

const APLeaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [mode, setMode] = useState<'daily' | 'total'>('total');
  const currentUserId = (() => {
    try { return JSON.parse(localStorage.getItem('user_session') || '{}').id; }
    catch { return null; }
  })();

  useEffect(() => {
    const unsubscribe = mongoService.listenUsers((dbUsers) => {
      const sorted = [...dbUsers].sort((a, b) => {
        const valA = mode === 'daily' ? (a.ap || 0) : (a.totalAp || 0);
        const valB = mode === 'daily' ? (b.ap || 0) : (b.totalAp || 0);
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

  return (
    <div className="min-h-screen bg-transparent overflow-x-hidden">
      <header className="bg-blue-600 text-white p-4 sm:p-6 pb-16 sm:pb-20 rounded-b-[2rem] sm:rounded-b-[3rem] flex items-center justify-between flex-wrap gap-2">
         <div className="flex flex-wrap items-center gap-4">
           <button onClick={() => navigate(-1)} className="p-2 bg-blue-500 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
           </button>
           <div>
             <h2 className="text-2xl font-bold">AP Board ⚡</h2>
             <p className="text-xs sm:text-sm opacity-70">Top community contributors</p>
           </div>
         </div>
      </header>

      <div className="px-4 -mt-16 flex flex-col gap-6 mb-24">
        {/* Toggle */}
        <div className="flex bg-white/20 p-1 rounded-2xl backdrop-blur-md mx-auto relative z-10 w-fit">
          <button 
            onClick={() => setMode('daily')}
            className={`px-3 sm:px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${mode === 'daily' ? 'bg-white text-blue-600 shadow-md' : 'text-white hover:bg-white/10'}`}
          >
            Daily AP
          </button>
          <button 
            onClick={() => setMode('total')}
            className={`px-3 sm:px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${mode === 'total' ? 'bg-white text-blue-600 shadow-md' : 'text-white hover:bg-white/10'}`}
          >
            Total AP
          </button>
        </div>
        {/* Top 3 Podium */}
        <div className="bg-white rounded-[3rem] p-4 sm:p-8 shadow-sm border border-slate-50 flex flex-col items-center">
           <div className="text-3xl mb-4">⚡</div>
           <div className="flex items-end justify-center w-full h-48">
              {users.slice(0, 3).map((u, idx) => {
                 const places = [
                    { rank: '1st', bg: 'bg-blue-500', h: 'h-32', imgSize: 'w-20 h-20', border: 'border-blue-300', icon: '🥇' },
                    { rank: '2nd', bg: 'bg-blue-400', h: 'h-24', imgSize: 'w-16 h-16', border: 'border-blue-200', icon: '🥈' },
                    { rank: '3rd', bg: 'bg-blue-300', h: 'h-20', imgSize: 'w-16 h-16', border: 'border-blue-100', icon: '🥉' }
                 ];
                 
                 // Display order should be 2nd, 1st, 3rd
                 let displayConfig;
                 let displayUser;
                 if (idx === 0 && users.length > 1) { // 2nd place slot
                    displayUser = users[1];
                    displayConfig = places[1];
                 } else if (idx === 1 && users.length > 0) { // 1st place slot
                    displayUser = users[0];
                    displayConfig = places[0];
                 } else if (idx === 2 && users.length > 2) { // 3rd place slot
                    displayUser = users[2];
                    displayConfig = places[2];
                 } else {
                    return <div key={`empty-${idx}`} className="flex-1"></div>;
                 }

                 if (!displayUser) return <div key={`empty-${idx}`} className="flex-1"></div>;

                 return (
                   <motion.div 
                     key={displayUser.id}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: idx * 0.1 }}
                     className="flex flex-col items-center flex-1"
                   >
                      <div className="relative mb-2">
                         <img src={displayUser.avatar} className={`${displayConfig.imgSize} rounded-full border-4 ${displayConfig.border} object-cover`} alt="" />
                         <span className="absolute -top-2 -right-2 text-xl z-10">{displayConfig.icon}</span>
                      </div>
                      <div className={`w-full ${displayConfig.bg} rounded-t-3xl ${displayConfig.h} flex flex-col items-center justify-center text-white p-2`}>
                         <p className="text-sm font-black uppercase text-blue-50 drop-shadow-sm">{displayConfig.rank}</p>
                         <p className="text-xs sm:text-sm font-bold text-center truncate w-full px-1 drop-shadow-sm">{displayUser.name.split(' ')[0]}</p>
                         <p className="text-xs sm:text-sm font-black opacity-90 drop-shadow-sm">{mode === 'daily' ? displayUser.ap || 0 : displayUser.totalAp || 0}</p>
                      </div>
                   </motion.div>
                 );
              })}
           </div>
        </div>

        {/* List Rankings */}
        <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-slate-50">
           <div className="flex flex-wrap items-center gap-2 px-4 mb-4 text-blue-700 font-bold uppercase text-xs sm:text-sm tracking-widest bg-blue-50 py-2 rounded-xl">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
              Community Rankings
           </div>
                      <div className="space-y-2">
             {users.map((rank, index) => {
               const badge = getAPBadge(rank.ap || 0);
               return (
               <motion.div 
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: index * 0.05 }}
                 key={rank.id} 
                  className={`flex flex-wrap items-center gap-4 p-3 rounded-2xl ${rank.id === currentUserId ? 'bg-blue-50 border-2 border-blue-200 shadow-md scale-[1.02] z-10' : 'bg-slate-50 border border-transparent'}`}
               >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-white ${index < 3 ? 'bg-blue-600' : 'bg-slate-300'} text-sm`}>
                    {index + 1}
                  </div>
                  <div className="flex flex-wrap-1 flex flex-wrap items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                       <img src={rank.avatar} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-sm truncate max-w-[120px]">{rank.name} {rank.id === currentUserId && '(You)'}</h4>
                        {badge && (
                          <div title={`${rank.ap} Points: ${badge.label}`} className={`flex flex-wrap items-center gap-1 ${badge.bg} ${badge.text} px-1.5 py-0.5 rounded-full text-sm font-black uppercase tracking-widest border border-white/20 shadow-sm shrink-0`}>
                             <span>{badge.icon}</span> <span className="hidden sm:inline">{badge.label}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">{mode === 'daily' ? rank.ap || 0 : rank.totalAp || 0} AP</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {index === 0 && <span className="text-sm">🥇</span>}
                    {index === 1 && <span className="text-sm">🥈</span>}
                    {index === 2 && <span className="text-sm">🥉</span>}
                    <span className="text-sm text-blue-500">⚡</span>
                  </div>
               </motion.div>
             )})}
           </div>
        </div>
      </div>
    </div>
  );
};

export default APLeaderboard;

