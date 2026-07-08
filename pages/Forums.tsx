import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { API_BASE } from '../services/mongoService';

const Forums: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/forum/categories`).then(r => r.json()).then(setCategories).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0B1A] font-inter pb-24">
      <header className="relative overflow-hidden bg-gradient-to-br from-[#110a2a] via-[#1d0d4a] to-[#0d1a6b] text-white p-4 sm:p-6 pb-20 rounded-b-[3rem] shadow-lg shadow-purple-900/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_0%,_#7c3aed33,_transparent_70%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0B0B1A] to-transparent" />
        <div className="absolute top-8 right-4 w-24 h-24 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-2">
          <div className="flex flex-wrap items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 bg-black/20 rounded-full active:scale-90 backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            </button>
            <h2 className="text-2xl font-black">Community Forums</h2>
          </div>
          <button onClick={() => navigate('/forum/create')} className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-xl border border-white/10 hover:bg-white/20 transition-all">📝</button>
        </div>
      </header>

      <div className="px-5 -mt-12 space-y-4 pb-24">
        <div className="bg-[#1C1C2E] p-4 rounded-2xl flex flex-wrap items-center gap-3 border border-white/5 focus-within:border-purple-500/30 transition-colors">
          <span className="text-white/60">🔍</span>
          <input placeholder="Search topics..." className="w-full bg-transparent border-none text-sm font-bold outline-none text-white/80 placeholder-white/20" />
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm font-black text-gray-500 uppercase tracking-widest">Loading forums...</p>
          </div>
        )}

        {categories.map((cat) => {
          const colorMap: Record<string, string> = { indigo: 'bg-indigo-600', blue: 'bg-blue-600', orange: 'bg-orange-600', rose: 'bg-rose-600', teal: 'bg-teal-600', amber: 'bg-amber-600', violet: 'bg-violet-600', green: 'bg-green-600' };
          return (
            <motion.button key={cat.id} whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/topic/list?categoryId=${cat.id}&categoryName=${encodeURIComponent(cat.name)}`)}
              className="w-full bg-[#1C1C2E] p-5 rounded-[2rem] border border-white/5 flex flex-wrap items-center gap-5 hover:border-purple-500/30 transition-all text-left shadow-md">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg ${colorMap[cat.color] || 'bg-purple-600'}`}>
                {cat.icon || '💬'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-black text-white">{cat.name}</h3>
                <p className="text-xs sm:text-sm text-white/50 font-bold truncate">{cat.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-black bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full uppercase tracking-widest">Active</span>
                  <span className="text-sm font-black text-white/40 uppercase tracking-widest">• OPEN</span>
                </div>
              </div>
              <span className="text-white/40 group-hover:text-purple-400 transition-colors">→</span>
            </motion.button>
          );
        })}

        <div className="bg-[#090d16]/80 backdrop-blur-xl border border-[#30363d] shadow-xl shadow-purple-900/10 rounded-[2.5rem] p-4 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-16 bg-purple-500/10 rounded-full blur-3xl" />
          <h4 className="text-sm font-black uppercase tracking-widest mb-2 relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Start a Thread</h4>
          <p className="text-xs sm:text-sm text-white/50 leading-relaxed mb-6 relative z-10">Have something interesting to share with the whole community? Create your own public thread now.</p>
          <button onClick={() => navigate('/forum/create')} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black py-4 rounded-2xl text-xs sm:text-sm uppercase tracking-widest shadow-xl shadow-purple-900/40 relative z-10 hover:opacity-90 transition-all active:scale-[0.98]">New Discussion 🚀</button>
        </div>
      </div>
    </div>
  );
};

export default Forums;

