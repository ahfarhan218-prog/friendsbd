
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { gameService } from '../services/gameService';
import { CoinStats } from '../types';
import { mongoService } from '../services/mongoService';

const SilverCoinLeaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<CoinStats[]>([]);

  useEffect(() => {
    const unsubscribe = mongoService.listenUsers((dbUsers) => {
      const activeUsers = dbUsers.filter(u => (u.silverPoints || 0) > 0);
      const coinStatsList: CoinStats[] = activeUsers.map(u => ({
        userId: u.id,
        username: u.username || u.name,
        avatar: u.avatar,
        totalGrabbed: u.silverPoints || 0,
        totalValue: u.silverPoints || 0,
        fastestGrab: 0,
        lastWin: 0
      }));

      coinStatsList.sort((a, b) => b.totalGrabbed - a.totalGrabbed);
      setStats(coinStatsList);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-transparent font-inter pb-32">
      <header className="bg-slate-600 text-white p-4 sm:p-6 pb-20 rounded-b-[4rem] shadow-xl text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <button onClick={() => navigate('/silver-game')} className="absolute left-6 top-6 p-3 bg-white/10 rounded-2xl active:scale-90 border border-white/10">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="text-sm font-black uppercase tracking-[0.5em] text-slate-400 mb-2 mt-4">Silver Rank</h1>
        <h2 className="text-3xl font-black italic tracking-tighter uppercase">Metallic Elite</h2>
      </header>

      <div className="px-5 -mt-10 space-y-4 relative z-10">
         <div className="bg-white rounded-[3rem] p-4 sm:p-6 shadow-xl border border-slate-200">
            {stats.length > 0 ? stats.map((u, idx) => (
               <motion.div 
                  key={u.userId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between p-4 bg-slate-50/50 rounded-[2rem] mb-2 border border-slate-100"
               >
                  <div className="flex flex-wrap items-center gap-4">
                     <span className="w-6 text-xs sm:text-sm font-black text-slate-400">#{idx + 1}</span>
                     <img src={u.avatar} className="w-10 h-10 rounded-xl shadow-sm border border-white" alt="" />
                     <div>
                        <p className="text-sm font-black text-slate-800">{u.username}</p>
                        <p className="text-sm font-bold text-slate-400 uppercase">Fastest: {(u.fastestGrab/1000).toFixed(2)}s</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-sm font-black text-slate-500">{u.totalGrabbed} Grabs</p>
                     <p className="text-sm font-black text-blue-500 uppercase">+{u.totalValue} Silver</p>
                  </div>
               </motion.div>
            )) : (
               <div className="py-20 text-center opacity-20">
                  <p className="text-sm font-black uppercase">No Data Available</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default SilverCoinLeaderboard;

