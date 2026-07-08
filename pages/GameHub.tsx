import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { API_BASE } from '../services/mongoService';

interface GameHubProps {
  game: string;
  icon: string;
  color: string;
}

const GameHub: React.FC<GameHubProps> = ({ game, icon, color }) => {
  const navigate = useNavigate();
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE}/users`).then(r => r.json()).then(users => {
      setOnlineCount(users.filter((u: any) => u.isOnline).length * 3 + 102);
    }).catch(() => setOnlineCount(1402));
  }, []);

  const topPlayers = [
    { name: 'Shahriar', xp: '+2,450 XP' }, { name: 'Taaj', xp: '+1,800 XP' }, { name: 'smsumon', xp: '+1,200 XP' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B1A] font-inter">
      <header className="relative overflow-hidden bg-gradient-to-br from-[#110a2a] via-[#1d0d4a] to-[#0d1a6b] text-white p-4 sm:p-6 pb-24 rounded-b-[4rem] shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_0%,_#7c3aed33,_transparent_70%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0B0B1A] to-transparent" />
        <div className="absolute top-8 right-4 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl" />
            <div className="relative z-10 flex justify-between items-center mb-8 flex-wrap gap-3">
          <button onClick={() => navigate(-1)} className="p-3 bg-black/20 rounded-2xl active:scale-90 border border-white/10 backdrop-blur-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="text-center">
            <h2 className="text-2xl font-black uppercase tracking-tighter italic">{game}</h2>
            <p className="text-sm font-black uppercase tracking-widest text-white/50">Multiplayer Session</p>
          </div>
          <button className="p-3 bg-black/20 rounded-2xl border border-white/10 backdrop-blur-sm">⚙️</button>
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-white/10 rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl backdrop-blur-md border border-white/10 mb-4">
            {icon}
          </div>
          <div className="flex flex-wrap items-center gap-2 bg-black/20 px-4 py-1.5 rounded-full backdrop-blur-sm">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="text-xs sm:text-sm font-black text-white uppercase tracking-widest">{onlineCount.toLocaleString()} Players Online</span>
          </div>
        </div>
      </header>

      <div className="px-5 -mt-12 space-y-6 relative z-10 pb-24">
        <div className="bg-[#1C1C2E] p-4 sm:p-8 rounded-[3rem] border border-white/5 shadow-lg space-y-8">
          <div className="text-center">
            <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-1">Ready to start?</h3>
            <p className="text-xs sm:text-sm text-white/50 font-bold tracking-widest uppercase">Select your game mode below</p>
          </div>
          <div className="space-y-4">
            <button className="w-full bg-[#161b22] p-5 rounded-2xl flex items-center justify-between group hover:bg-[#1C1C2E] transition-all border border-white/5 active:scale-[0.99] hover:border-purple-500/30">
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl text-white shadow-lg bg-gradient-to-br from-purple-600 to-indigo-600">🎮</div>
                <div className="text-left">
                  <p className="text-sm font-black text-white">Ranked Match</p>
                  <p className="text-sm font-bold text-white/40 uppercase">Competitive · 50 Coins Entry</p>
                </div>
              </div>
              <span className="text-white/40 group-hover:text-purple-400 transition-colors">→</span>
            </button>
            <button className="w-full bg-[#161b22] p-5 rounded-2xl flex items-center justify-between group hover:bg-[#1C1C2E] transition-all border border-white/5 active:scale-[0.99] hover:border-purple-500/30">
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl text-white shadow-lg bg-gradient-to-br from-purple-600 to-indigo-600">👥</div>
                <div className="text-left">
                  <p className="text-sm font-black text-white">Play with Friends</p>
                  <p className="text-sm font-bold text-white/40 uppercase">Private Room · Custom Rules</p>
                </div>
              </div>
              <span className="text-white/40 group-hover:text-purple-400 transition-colors">→</span>
            </button>
          </div>
          <button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-purple-900/30 uppercase tracking-widest text-xs sm:text-sm hover:opacity-90 active:scale-[0.98] transition-all">
            Quick Play Now ⚡
          </button>
        </div>

        <div className="bg-[#090d16]/80 backdrop-blur-xl border border-[#30363d] shadow-xl shadow-purple-900/10 rounded-[3rem] p-4 sm:p-8 text-white relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Global Leaderboard</h4>
            <span className="text-sm font-black bg-[#161b22] px-3 py-1 rounded-full border border-white/5 text-white/40">Weekly</span>
          </div>
          <div className="space-y-4">
            {topPlayers.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-2">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-sm font-black text-white/60">#0{i + 1}</span>
                  <img src={`https://picsum.photos/seed/p${i + 10}/50`} className="w-8 h-8 rounded-lg border border-purple-500/30" alt="" />
                  <span className="text-sm font-bold text-white/80">{p.name}</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-emerald-400">{p.xp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHub;

