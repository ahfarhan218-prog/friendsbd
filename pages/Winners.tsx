import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { API_BASE } from '../services/mongoService';

const Winners: React.FC = () => {
  const navigate = useNavigate();
  const [winners, setWinners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/lotto/winners`).then(r => r.json()).then(data => {
      setWinners(data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0B1A] font-inter text-white pb-24">
      <header className="relative overflow-hidden bg-gradient-to-br from-[#110a2a] via-[#1d0d4a] to-[#0d1a6b] p-6 pt-12 pb-24 text-center shadow-lg shadow-purple-900/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_0%,_#7c3aed33,_transparent_70%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0B0B1A] to-transparent" />
        <div className="absolute top-8 right-4 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-12 left-8 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
        <button onClick={() => navigate(-1)} className="absolute left-6 top-12 p-3 bg-black/20 rounded-2xl border border-white/10 backdrop-blur-sm active:scale-90 hover:bg-white/10 transition-all z-10">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div className="relative z-10">
          <h1 className="text-xs font-black uppercase tracking-[0.5em] text-amber-400 mb-2">Hall of Fame</h1>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-2 text-white">Winners Circle</h2>
          <p className="text-[10px] text-white/40 font-bold tracking-widest uppercase">The elite of FriendsBD</p>
        </div>
      </header>

      <div className="px-5 space-y-6 mt-12">
        {loading && <p className="text-center text-[10px] text-gray-500 font-black uppercase tracking-widest">Loading winners...</p>}
        {!loading && winners.length === 0 && (
          <p className="text-center text-[10px] text-gray-600 font-black uppercase tracking-widest py-12">No winners recorded yet</p>
        )}
        {winners.map((w, i) => (
          <motion.div key={w.id || i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-[#1C1C2E] border border-white/5 p-6 rounded-[3rem] flex items-center gap-6 relative group shadow-md hover:border-purple-500/30 transition-all">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/10 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition-opacity" />
              <img src={w.avatar || `https://picsum.photos/seed/${w.username || w.uid}/200`} className="w-20 h-20 rounded-[2.2rem] border-2 border-purple-500/30 relative z-10 object-cover" alt="" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-slate-950 font-black text-xs z-20 shadow-xl">
                #{i + 1}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black tracking-tighter mb-1 text-white">{w.username || 'Anonymous'}</h3>
              <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-3">{w.prize_won || 'Prize Won'}</p>
              <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase">
                <span>Won:</span>
                <span className="text-white text-xs font-black">{w.prize_won || 'N/A'}</span>
              </div>
            </div>
            <div className="text-3xl grayscale group-hover:grayscale-0 transition-all opacity-20 group-hover:opacity-100">🏆</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Winners;
