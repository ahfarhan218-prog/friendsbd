import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../services/mongoService';

const Requests: React.FC = () => {
  const navigate = useNavigate();
  const [reqs, setReqs] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const raw = localStorage.getItem('user_session');
    if (!raw) return;
    const session = JSON.parse(raw);
    setCurrentUser(session);
    fetch(`${API_BASE}/notifications/${session.id}`).then(r => r.json()).then(notifs => {
      const actionable = notifs.filter((n: any) =>
        ['FRIEND_REQ', 'SYSTEM'].includes(n.type) && !n.isRead
      );
      setReqs(actionable);
    }).catch(() => {});
  }, []);

  const handleAction = async (id: string) => {
    if (!currentUser) return;
    await fetch(`${API_BASE}/notifications/${currentUser.id}/${id}/read`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    setReqs(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0B0B1A] font-inter pb-24">
      <header className="relative overflow-hidden bg-gradient-to-br from-[#110a2a] via-[#1d0d4a] to-[#0d1a6b] text-white p-6 pb-20 rounded-b-[2rem] sm:rounded-b-[3rem] shadow-lg shadow-purple-900/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_0%,_#7c3aed33,_transparent_70%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0B0B1A] to-transparent" />
        <div className="absolute top-8 right-4 w-24 h-24 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 bg-black/20 rounded-full backdrop-blur-sm active:scale-90 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            </button>
            <h2 className="text-2xl font-black">Inbox Requests</h2>
          </div>
          <span className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-xl border border-white/10">👤</span>
        </div>
      </header>

      <div className="px-5 -mt-12 space-y-4 pb-24">
        <AnimatePresence mode="popLayout">
          {reqs.length > 0 ? reqs.map((r) => (
            <motion.div key={r.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: 50 }}
              className="bg-[#1C1C2E] p-5 rounded-[2.5rem] border border-white/5 flex flex-wrap items-center gap-4 shadow-md hover:border-purple-500/30 transition-all">
              <img src={r.senderAvatar || `https://i.pravatar.cc/100?img=${Math.floor(Math.random() * 70)}`} className="w-14 h-14 rounded-2xl border-2 border-purple-500/30 object-cover" alt="" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">{r.type === 'FRIEND_REQ' ? 'Friend Request' : r.type}</p>
                <h3 className="text-sm font-black text-white truncate">{r.senderName}</h3>
                <p className="text-[9px] text-white/40 font-bold uppercase truncate">{r.message}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => handleAction(r.id)} className="w-9 h-9 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center hover:bg-emerald-500 transition-all active:scale-90">✓</button>
                <button onClick={() => handleAction(r.id)} className="w-9 h-9 bg-[#161b22] text-white/40 rounded-xl border border-white/5 flex items-center justify-center hover:bg-red-900/20 hover:text-red-400 transition-all active:scale-90">✕</button>
              </div>
            </motion.div>
          )) : (
            <div className="bg-[#1C1C2E] rounded-[3rem] p-16 text-center border border-white/5 shadow-md">
              <div className="text-5xl mb-4 opacity-30">📭</div>
              <p className="text-xs font-black text-white/40 uppercase tracking-widest">No pending requests</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Requests;

