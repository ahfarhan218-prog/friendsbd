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
  ACTIVITY: { icon: '✨', color: 'bg-fuchsia-500' }
};

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return Math.floor(diff / 86400000) + 'd ago';
}

const Timeline: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/activities`).then(r => r.json()).then(data => {
      const mapped = data.map((a: any) => {
        const type = a.isTopic ? 'EVENT' : a.msg?.includes('tournament') || a.msg?.includes('Tournament') ? 'TOURNAMENT' : a.msg?.includes('quiz') || a.msg?.includes('Quiz') ? 'QUIZ' : 'ACTIVITY';
        const cfg = typeConfig[type] || { icon: '📌', color: 'bg-slate-700' };
        return { 
          time: a.timestamp ? timeAgo(a.timestamp) : a.time, 
          type, 
          msg: a.msg, 
          username: a.username,
          icon: cfg.icon, 
          color: cfg.color, 
          link: a.link,
          topicTitle: a.topicTitle
        };
      });
      setEvents(mapped);
      setLoading(false);
    }).catch(() => { setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-[#090d16] font-inter pb-24">
      <header className="relative bg-[#090d16]/80 backdrop-blur-xl border-b border-[#30363d] pt-12 pb-24 px-3 sm:px-6 rounded-b-[4rem] shadow-xl overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 p-32 bg-fuchsia-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 p-24 bg-purple-500/10 rounded-full blur-2xl -ml-16 pointer-events-none" />
        
        <div className="relative z-10 flex items-center justify-between mb-8">
          <button onClick={() => navigate(-1)} className="p-3 bg-white/5 rounded-2xl active:scale-90 border border-white/10 hover:bg-white/10 transition-colors">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="text-center">
            <h2 className="text-2xl font-black uppercase tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400 drop-shadow-[0_0_10px_rgba(217,70,239,0.3)]">Global Timeline</h2>
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">Live Activity Feed</p>
          </div>
          <div className="w-12 h-12" /> {/* Spacer for centering */}
        </div>
      </header>

      <div className="px-5 -mt-12 space-y-8 relative z-10 max-w-2xl mx-auto pb-24">
        <div className="pf-card p-5 sm:p-8">
          {loading ? (
             <div className="flex justify-center py-12">
               <div className="w-8 h-8 border-2 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin" />
             </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-black text-white/50 uppercase tracking-widest">No activities recorded yet.</p>
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 border-l-2 border-fuchsia-500/30 space-y-8">
              {events.map((ev, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -15 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.05 }} 
                  className="relative group"
                >
                  {/* Glowing Dot */}
                  <div className="absolute -left-[31px] sm:-left-[39px] top-2 w-4 h-4 bg-fuchsia-500 rounded-full border-[3px] border-[#0d1117] shadow-[0_0_15px_rgba(217,70,239,0.8)] group-hover:scale-125 transition-transform duration-300" />
                  
                  <div 
                    onClick={() => ev.link && navigate(ev.link)}
                    className={`bg-[#161b22]/80 backdrop-blur-sm border border-[#30363d] p-4 sm:p-5 rounded-[2rem] shadow-lg transition-all ${ev.link ? 'cursor-pointer hover:border-fuchsia-500/40 hover:-translate-y-1' : 'hover:border-purple-500/30'}`}
                  >
                    <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-fuchsia-400 uppercase tracking-widest bg-fuchsia-500/10 border border-fuchsia-500/20 px-2.5 py-0.5 rounded-lg">
                          {ev.type}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest flex flex-wrap items-center gap-1">
                         🕒 {ev.time}
                      </span>
                    </div>
                    
                    <p className="text-sm sm:text-base font-bold text-white/90 leading-relaxed mt-1">
                      {ev.username && <span className="text-purple-400">{ev.username}</span>} {ev.msg}
                      {ev.topicTitle && (
                        <span className="text-amber-400 block mt-1.5 italic text-sm border-l-2 border-amber-500/30 pl-3">
                          "{ev.topicTitle}"
                        </span>
                      )}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Timeline;

