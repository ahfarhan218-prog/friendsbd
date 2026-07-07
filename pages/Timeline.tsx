import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { API_BASE } from '../services/mongoService';

const typeConfig: Record<string, { icon: string; color: string }> = {
  TOURNAMENT: { icon: '🏆', color: 'bg-purple-600' },
  MILESTONE: { icon: '🎈', color: 'bg-rose-500' },
  EVENT: { icon: '🛍️', color: 'bg-amber-500' },
  QUIZ: { icon: '🧠', color: 'bg-emerald-500' },
  SYSTEM: { icon: '⚙️', color: 'bg-slate-800' },
};

const Timeline: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/activities`).then(r => r.json()).then(data => {
      const mapped = data.map((a: any) => {
        const type = a.isTopic ? 'EVENT' : a.msg?.includes('tournament') || a.msg?.includes('Tournament') ? 'TOURNAMENT' : a.msg?.includes('quiz') || a.msg?.includes('Quiz') ? 'QUIZ' : 'MILESTONE';
        const cfg = typeConfig[type] || { icon: '📌', color: 'bg-slate-700' };
        return { time: a.time || new Date(a.timestamp).toLocaleString(), type, msg: a.msg, icon: cfg.icon, color: cfg.color };
      });
      setEvents(mapped);
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0B1A] font-inter pb-24">
      <header className="relative overflow-hidden bg-gradient-to-br from-[#110a2a] via-[#1d0d4a] to-[#0d1a6b] text-white p-6 pb-20 rounded-b-[3rem] shadow-lg shadow-purple-900/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_0%,_#7c3aed33,_transparent_70%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0B0B1A] to-transparent" />
        <div className="absolute top-8 right-4 w-24 h-24 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 bg-black/20 rounded-full active:scale-90 backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            </button>
            <h2 className="text-2xl font-black">Platform Timeline</h2>
          </div>
          <span className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-xl border border-white/10">🕒</span>
        </div>
      </header>

      <div className="px-5 -mt-12 space-y-8 pb-24">
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#30363d]" />
          <div className="space-y-12 relative z-10">
            {events.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Loading activities...</p>
              </div>
            )}
            {events.map((ev, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex gap-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl text-white shadow-lg shrink-0 ${ev.color}`}>
                  {ev.icon}
                </div>
                <div className="bg-[#1C1C2E] p-5 rounded-[2rem] flex-1 border border-white/5 shadow-md">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">{ev.type}</span>
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{ev.time}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-200 leading-relaxed">{ev.msg}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        {events.length > 0 && (
          <div className="text-center py-4">
            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">End of recent updates</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;
