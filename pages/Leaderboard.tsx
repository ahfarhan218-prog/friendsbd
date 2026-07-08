import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User } from '../types';
import { mongoService } from '../services/mongoService';

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUserId = (() => {
    try { return JSON.parse(localStorage.getItem('user_session') || '{}').id; }
    catch { return null; }
  })();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = mongoService.listenUsers((dbUsers) => {
      const sorted = [...dbUsers].sort((a, b) => (b.points || 0) - (a.points || 0));
      setUsers(sorted);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const podium = users.slice(0, 3);
  const others = users.slice(3);

  return (
    <div className="min-h-screen bg-transparent">
      <header className="bg-purple-700 text-white p-4 sm:p-6 pb-16 sm:pb-20 rounded-b-[2rem] sm:rounded-b-[3rem] flex items-center justify-between flex-wrap gap-2">
         <div className="flex flex-wrap items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 bg-purple-600 rounded-full">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            </button>
            <div>
              <h2 className="text-2xl font-bold">Leaderboard 👑</h2>
              <p className="text-xs sm:text-sm opacity-70">Top performers this month</p>
            </div>
         </div>
         <div className="flex flex-wrap gap-3">
            <button className="p-2 bg-purple-600 rounded-full"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg></button>
            <button className="p-2 bg-purple-600 rounded-full"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg></button>
         </div>
      </header>

      <div className="px-4 -mt-16 flex flex-col gap-6 mb-24">
        {/* Top 3 Podium */}
        <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-50 flex flex-col items-center">
           <div className="text-3xl mb-4">👑</div>
           <div className="flex flex-wrap items-end justify-center gap-4 w-full h-48">
              {/* 2nd */}
              {podium[1] && (
                <div className="flex flex-col items-center flex-1">
                   <div className="relative mb-2">
                      <img src={podium[1].avatar} className="w-16 h-16 rounded-full border-4 border-purple-200 object-cover" alt="" />
                      <span className="absolute -top-2 -right-2 text-xl">🥈</span>
                   </div>
                   <div className="w-full bg-purple-300 rounded-t-3xl h-24 flex flex-col items-center justify-center text-white p-2 text-center">
                      <p className="text-xs font-black uppercase">2nd</p>
                      <p className="text-xs sm:text-sm font-bold truncate w-full px-1">{podium[1].name.split(' ')[0]}</p>
                      <p className="text-xs sm:text-sm font-medium opacity-80">{podium[1].points}</p>
                   </div>
                </div>
              )}
              {/* 1st */}
              {podium[0] && (
                <div className="flex flex-col items-center flex-1">
                   <div className="relative mb-2">
                      <img src={podium[0].avatar} className="w-20 h-20 rounded-full border-4 border-purple-400 object-cover" alt="" />
                      <span className="absolute -top-2 -right-2 text-2xl">🥇</span>
                   </div>
                   <div className="w-full bg-purple-600 rounded-t-3xl h-32 flex flex-col items-center justify-center text-white p-2 text-center">
                      <p className="text-sm font-black uppercase">1st</p>
                      <p className="text-xs font-bold truncate w-full px-1">{podium[0].name.split(' ')[0]}</p>
                      <p className="text-xs font-medium opacity-80">{podium[0].points}</p>
                   </div>
                </div>
              )}
              {/* 3rd */}
              {podium[2] && (
                <div className="flex flex-col items-center flex-1">
                   <div className="relative mb-2">
                      <img src={podium[2].avatar} className="w-16 h-16 rounded-full border-4 border-purple-100 object-cover" alt="" />
                      <span className="absolute -top-2 -right-2 text-xl">🥉</span>
                   </div>
                   <div className="w-full bg-purple-200 rounded-t-3xl h-20 flex flex-col items-center justify-center text-purple-700 p-2 text-center">
                      <p className="text-xs font-black uppercase">3rd</p>
                      <p className="text-xs sm:text-sm font-bold truncate w-full px-1">{podium[2].name.split(' ')[0]}</p>
                      <p className="text-xs sm:text-sm font-medium opacity-80">{podium[2].points}</p>
                   </div>
                </div>
              )}
           </div>
        </div>

        {/* List Rankings */}
        <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-slate-50">
           <div className="flex flex-wrap items-center gap-2 px-4 mb-4 text-purple-700 font-bold uppercase text-xs sm:text-sm tracking-widest bg-purple-50 py-2 rounded-xl">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
              Rankings
           </div>
           
           <div className="space-y-2">
             {others.map((rank, index) => {
               const globalIndex = index + 4;
               const isSelf = rank.id === currentUserId;
               return (
                 <motion.div 
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   key={rank.id} 
                   className={`flex flex-wrap items-center gap-4 p-3 rounded-2xl ${isSelf ? 'bg-purple-50 border-2 border-purple-200 shadow-md scale-105 z-10' : 'bg-slate-50 border border-transparent'}`}
                 >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-white bg-slate-300 text-xs`}>
                      {globalIndex}
                    </div>
                    <div className="flex flex-wrap-1 flex flex-wrap items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                         <img src={rank.avatar} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 text-xs truncate">{rank.name} {isSelf && '(You)'}</h4>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium">{rank.points} points</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-slate-400">—</span>
                    </div>
                 </motion.div>
               );
             })}
             {users.length === 0 && !loading && (
               <p className="text-center text-xs text-slate-400 py-6">No users found.</p>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

