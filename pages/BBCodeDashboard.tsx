import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BBCodeParser } from '../components/BBCodeParser';
import { API_BASE } from '../services/mongoService';

const BBCodeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All Posts');

  useEffect(() => {
    fetch(`${API_BASE}/blog`).then(r => r.json()).then(data => {
      setPosts(data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'All Posts' ? posts : posts.filter(p => (p.tags || []).includes(filter.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#0B0B1A] pb-24 font-inter overflow-x-hidden">
      <header className="relative overflow-hidden bg-gradient-to-br from-[#110a2a] via-[#1d0d4a] to-[#0d1a6b] text-white p-6 pb-20 rounded-b-[3.5rem] shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_0%,_#7c3aed33,_transparent_70%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0B0B1A] to-transparent" />
        <div className="absolute top-8 right-4 w-24 h-24 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex justify-between items-center">
          <button onClick={() => navigate('/apps')} className="p-3 bg-black/20 rounded-2xl active:scale-90 border border-white/10 backdrop-blur-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-black italic tracking-tighter">BB DASHBOARD</h1>
            <p className="text-[9px] font-black uppercase tracking-widest text-white/50">Formatted Social Feed</p>
          </div>
          <button onClick={() => navigate('/bb-editor')} className="p-3 bg-black/20 rounded-2xl border border-white/10 backdrop-blur-sm active:scale-90 transition-all">✍️</button>
        </div>
      </header>

      <div className="px-5 -mt-10 space-y-6 relative z-10">
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {['All Posts', 'Shouts', 'Announcements', 'Forum'].map((cat) => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`whitespace-nowrap px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === cat ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-900/30' : 'bg-[#1C1C2E] text-white/40 border border-white/5'}`}>
              {cat}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {loading ? (
            <div className="py-20 text-center"><div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
          ) : filtered.length === 0 ? (
            <div className="bg-[#1C1C2E] rounded-[2.5rem] p-12 text-center border border-white/5">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">No posts yet. Create one!</p>
            </div>
          ) : (
            filtered.map((post) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[#1C1C2E] rounded-[2.5rem] p-6 border border-white/5 shadow-md hover:border-purple-500/30 transition-all">
                <div className="flex items-center gap-4 mb-5">
                  <img src={post.authorAvatar || `https://picsum.photos/seed/${post.authorId}/100`} className="w-12 h-12 rounded-2xl border-2 border-purple-500/30 object-cover" alt="" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-black text-white">{post.authorName || post.author}</h3>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${(post.tags || []).includes('announcement') ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {post.tags?.[0] || 'post'}
                      </span>
                    </div>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">
                      {new Date(post.publishedAt || post.createdAt || post.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>

                {post.title && <h2 className="text-base font-black text-gray-100 mb-3">{post.title}</h2>}

                <div className="bg-[#161b22] p-5 rounded-2xl border border-white/5 text-[13px] text-white/70 leading-relaxed overflow-hidden">
                  <BBCodeParser rawText={post.content} />
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
                  <div className="flex gap-4">
                    <button className="flex items-center gap-1.5 text-white/40 hover:text-purple-400 transition-colors">
                      <span className="text-lg">👍</span>
                      <span className="text-[10px] font-black">{post.likes || 0}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-white/40 hover:text-purple-400 transition-colors">
                      <span className="text-lg">💬</span>
                      <span className="text-[10px] font-black">{post.views || 0}</span>
                    </button>
                  </div>
                  <button className="text-[10px] font-black text-purple-400 uppercase tracking-widest hover:text-purple-300 transition-colors">Share 🔗</button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <button onClick={() => navigate('/bb-editor')}
        className="fixed bottom-28 md:bottom-8 right-6 md:right-8 w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-purple-900/40 flex items-center justify-center text-2xl active:scale-90 transition-transform z-50 border border-white/10">
        ✍️
      </button>
    </div>
  );
};

export default BBCodeDashboard;
