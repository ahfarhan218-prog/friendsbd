
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerToast } from '../components/NotificationToast';
import { mongoService } from '../services/mongoService';
import { apTransactionService } from '../services/apTransactionService';

const MysteryCastle: React.FC = () => {
  const navigate = useNavigate();
  const [activeUser, setActiveUser] = useState<any>(null);
  const [attempts, setAttempts] = useState(5);
  const [revealing, setRevealing] = useState<number | null>(null);
  const [result, setResult] = useState<'win' | 'lose' | 'trap' | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem('castle_stats');
    if (saved) {
      const stats = JSON.parse(saved);
      if (stats.date === today) {
        setAttempts(stats.count);
      } else {
        localStorage.setItem('castle_stats', JSON.stringify({ date: today, count: 5 }));
      }
    }
  }, []);

  const handleDoorSelect = (index: number) => {
    if (attempts <= 0 || revealing !== null) return;

    setRevealing(index);
    const outcome = Math.random();
    const type = outcome > 0.7 ? 'win' : (outcome > 0.3 ? 'lose' : 'trap');
    
    setTimeout(() => {
      setResult(type);
      const newAttempts = attempts - 1;
      setAttempts(newAttempts);
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('castle_stats', JSON.stringify({ date: today, count: newAttempts }));

      if (type === 'win') {
        const updated = { ...activeUser, silverPoints: activeUser.silverPoints + 25 };
        setActiveUser(updated);
        localStorage.setItem('user_session', JSON.stringify(updated));
        
        apTransactionService.adjustUserAP(activeUser.id, 'MCG_COMPLETED')
          .then(({ newBalance }) => {
            const saved = localStorage.getItem('user_session');
            if (saved) {
              const parsed = JSON.parse(saved);
              parsed.balance_ap = newBalance;
              localStorage.setItem('user_session', JSON.stringify(parsed));
              setActiveUser(parsed);
              window.dispatchEvent(new Event('storage'));
            }
          })
          .catch(e => console.warn(e));

        triggerToast({
          id: 'castle-win', senderId: 'castle', senderName: 'Mystery Castle', senderAvatar: '',
          type: 'REWARD', message: 'TREASURE FOUND! +25 Silver Points! 🏺', timestamp: Date.now(), isRead: false
        });

        mongoService.addActivity({
          id: 'act_' + Date.now(),
          time: new Date().toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' }),
          username: activeUser.username || activeUser.name,
          msg: `found treasure in Mystery Castle!`,
          timestamp: Date.now(),
          link: `/castle`
        });
      } else if (type === 'trap') {
         triggerToast({
          id: 'castle-trap', senderId: 'castle', senderName: 'Mystery Castle', senderAvatar: '',
          type: 'SYSTEM', message: 'IT WAS A TRAP! You lost 5 points! 💀', timestamp: Date.now(), isRead: false
        });
        const updated = { ...activeUser, points: Math.max(0, activeUser.points - 5) };
        setActiveUser(updated);
        localStorage.setItem('user_session', JSON.stringify(updated));
      }

      setTimeout(() => {
        setRevealing(null);
        setResult(null);
      }, 2000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-transparent font-inter pb-32 overflow-x-hidden">
      {/* HEADER SECTION */}
      <header className="relative bg-[#090d16]/80 backdrop-blur-xl border-b border-[#30363d] pt-12 pb-12 px-3 sm:px-6 rounded-b-[4rem] shadow-xl overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 p-32 bg-indigo-500/10 rounded-full blur-3xl -ml-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 right-0 p-24 bg-purple-500/10 rounded-full blur-2xl -mr-16 pointer-events-none" />
        
            <div className="relative z-10 flex justify-between items-center mb-4 flex-wrap gap-3">
           <button onClick={() => navigate('/apps')} className="p-3 bg-white/5 rounded-2xl active:scale-90 border border-white/10 hover:bg-white/10 transition-colors">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
           </button>
           <div className="text-center">
             <h2 className="text-2xl font-black uppercase tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.3)]">Mystery Castle</h2>
             <p className="text-sm font-black uppercase tracking-widest text-slate-400">Daily Exploration Protocol</p>
           </div>
           <div className="w-12" />
        </div>
      </header>

      <div className="px-5 mt-8 space-y-12 max-w-lg mx-auto">
         {/* ATTEMPTS CARD */}
         <div className="bg-[#161b22]/80 backdrop-blur-xl border border-[#30363d] p-4 sm:p-8 rounded-[3rem] text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-indigo-500/20 px-4 py-2 rounded-bl-3xl border-b border-l border-indigo-500/30 text-sm font-black uppercase text-indigo-300 tracking-widest shadow-[0_0_15px_rgba(99,102,241,0.2)]">Level 1: Outer Wall</div>
            
            <p className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest mb-3 mt-2">Attempts Remaining</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
               <h3 className="text-5xl font-black text-white italic tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{attempts}</h3>
               <span className="text-xl font-black text-slate-600 self-end mb-2">/ 5</span>
            </div>
         </div>

         {/* DOORS */}
         <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
              <motion.button 
                key={i}
                whileHover={revealing === null && attempts > 0 ? { scale: 1.05, y: -5 } : {}}
                whileTap={revealing === null && attempts > 0 ? { scale: 0.95 } : {}}
                onClick={() => handleDoorSelect(i)}
                disabled={revealing !== null || attempts <= 0}
                className={`relative h-64 rounded-t-[3rem] rounded-b-[1.5rem] border-x-4 border-t-4 transition-all duration-500 overflow-hidden group ${
                  revealing === i 
                    ? 'border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.5)] bg-[#1e1b4b]/80 backdrop-blur-md' 
                    : 'border-[#30363d] bg-[#161b22]/60 hover:bg-[#161b22]/90 hover:border-slate-600 backdrop-blur-sm'
                }`}
              >
                 <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                    <span className="text-5xl grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-300 transform group-hover:scale-110">🚪</span>
                    <span className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-300 transition-colors">Door {i+1}</span>
                 </div>

                 <AnimatePresence>
                    {revealing === i && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }} 
                        animate={{ opacity: 1, scale: 1 }}
                        className={`absolute inset-0 flex flex-col items-center justify-center gap-3 z-20 ${
                          result === 'win' 
                            ? 'bg-amber-500/90 shadow-[inset_0_0_50px_rgba(251,191,36,0.6)] backdrop-blur-md' 
                            : (result === 'trap' ? 'bg-rose-600/90 shadow-[inset_0_0_50px_rgba(225,29,72,0.6)] backdrop-blur-md' : 'bg-[#0f172a]/90 backdrop-blur-md')
                        }`}
                      >
                         <motion.span 
                           className="text-5xl drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                           animate={result ? { scale: [1, 1.2, 1] } : { rotate: 360 }}
                           transition={result ? { duration: 0.5 } : { duration: 1, repeat: Infinity, ease: "linear" }}
                         >
                           {result === 'win' ? '🏺' : (result === 'trap' ? '💀' : (result === 'lose' ? '💨' : '⌛'))}
                         </motion.span>
                         {result && (
                           <span className="text-xs sm:text-sm font-black text-white uppercase tracking-widest">
                              {result === 'win' ? '+25 Points' : (result === 'trap' ? '-5 Points' : 'Empty')}
                           </span>
                         )}
                      </motion.div>
                    )}
                 </AnimatePresence>
              </motion.button>
            ))}
         </div>

         {/* LEGEND */}
         <div className="bg-gradient-to-br from-[#1C1C2E] to-[#110a2a] border border-white/5 p-4 sm:p-8 rounded-[3rem] text-center shadow-xl relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
            <h4 className="text-xs sm:text-sm font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 relative z-10 drop-shadow-md">Legend of the Vault</h4>
            <p className="text-sm font-medium text-slate-300 leading-relaxed italic px-4 relative z-10">
               "Three doors stand between you and the ancient silver vaults. One holds <span className="text-amber-400 font-bold">fortune</span>, one holds wind, and one... a <span className="text-rose-400 font-bold">deadly trap</span> for the unwary."
            </p>
         </div>
      </div>
    </div>
  );
};

export default MysteryCastle;

