
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { gameService } from '../services/gameService';
import { triggerToast } from '../components/NotificationToast';
import { checkMissionCompletion } from '../utils/missions';

const getDhakaDate = (): Date => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * 6);
};

const SilverCoinGame: React.FC = () => {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [winners, setWinners] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const bdNow = getDhakaDate();
  const hours = bdNow.getHours();
  const isGameTime = hours >= 10 && hours < 15;

  const loadWinners = () => {
    const logs = JSON.parse(localStorage.getItem('friends_bd_silver_logs') || '[]');
    setWinners(logs.slice(0, 5));
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('user_session');
      if (saved) {
        const u = JSON.parse(saved);
        setCurrentUser(u);
        checkMissionCompletion(u, 'play_game').catch(() => {});
      }
    } catch (e) {}

    gameService.initSpawner();
    setIsActive(gameService.checkActiveCoin('silver'));
    loadWinners();

    const onDrop = (e: any) => { if (e.detail.type === 'silver') setIsActive(true); };
    const onClaim = () => { setIsActive(false); loadWinners(); };
    const onStateUpdated = (e: any) => { if (e.detail?.type === 'silver') setIsActive(e.detail.active); };

    window.addEventListener('coin-dropped', onDrop);
    window.addEventListener('silver-claimed', onClaim);
    window.addEventListener('coin-state-updated', onStateUpdated);

    return () => {
      window.removeEventListener('coin-dropped', onDrop);
      window.removeEventListener('silver-claimed', onClaim);
      window.removeEventListener('coin-state-updated', onStateUpdated);
    };
  }, []);

  const handleGrab = async () => {
    if (isClaiming || !isActive) return;
    setIsClaiming(true);
    if (!currentUser) { setIsClaiming(false); return; }
    const claimer = currentUser;
    const result = await gameService.claimSilverCoin(claimer.id, claimer.username || claimer.name, claimer.avatar);
    if (result.success) {
      triggerToast({
        id: 'silver-win-' + Date.now(), senderId: 'system', senderName: 'System', 
        senderAvatar: 'https://picsum.photos/seed/sys/100', type: 'REWARD',
        message: result.msg, timestamp: Date.now(), isRead: false
      });
    }
    setIsClaiming(false);
    setIsActive(false);
  };

  return (
    <div className="min-h-screen bg-transparent font-inter pb-32">
      {/* HEADER SECTION */}
      <header className="relative bg-[#090d16]/80 backdrop-blur-xl border-b border-[#30363d] pt-12 pb-24 px-6 rounded-b-[4rem] shadow-xl overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 p-32 bg-cyan-500/10 rounded-full blur-3xl -ml-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 right-0 p-24 bg-blue-500/10 rounded-full blur-2xl -mr-16 pointer-events-none" />
        
        <div className="relative z-10 flex justify-between items-center mb-8">
           <button onClick={() => navigate('/apps')} className="p-3 bg-white/5 rounded-2xl active:scale-90 border border-white/10 hover:bg-white/10 transition-colors">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
           </button>
           <div className="text-center">
             <h2 className="text-2xl font-black uppercase tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-slate-300 to-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">Silver Rush</h2>
             <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">High Frequency Event</p>
           </div>
           <Link to="/silver-leaderboard" className="p-3 bg-white/5 text-cyan-300 rounded-2xl active:scale-90 border border-white/10 hover:bg-white/10 hover:border-cyan-400/30 transition-all shadow-lg">
              <span className="text-sm font-black">🥈</span>
           </Link>
        </div>

        <div className="relative z-10 flex flex-col items-center">
            <div className="bg-[#161b22]/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl border border-[#30363d] shadow-2xl shadow-cyan-900/20 text-center w-full max-w-[400px]">
              <AnimatePresence mode="wait">
                {isActive ? (
                  <motion.div 
                    key="active" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                    className="space-y-6"
                  >
                     <motion.div 
                        animate={{ rotateY: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="text-7xl drop-shadow-[0_0_20px_rgba(255,255,255,0.7)]"
                     >
                       🔘
                     </motion.div>
                     <h3 className="text-2xl font-black text-cyan-300 italic tracking-tighter drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">SILVER DETECTED!</h3>
                     <button 
                       onClick={handleGrab} disabled={isClaiming}
                       className="w-full bg-gradient-to-r from-slate-200 to-cyan-200 text-slate-900 font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.4)] uppercase tracking-[0.2em] text-xs hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] active:scale-95 transition-all relative overflow-hidden disabled:opacity-60 border border-cyan-100"
                     >
                       {isClaiming ? 'COLLECTING...' : 'COLLECT SILVER NOW'}
                       <motion.div 
                         animate={{ x: ['-100%', '200%'] }} 
                         transition={{ duration: 1.5, repeat: Infinity }}
                         className="absolute inset-y-0 w-20 bg-white/40 skew-x-12" 
                       />
                     </button>
                  </motion.div>
                ) : isGameTime ? (
                  <div className="py-6">
                     <div className="text-4xl opacity-50 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] mb-4">📡</div>
                     <p className="text-xs font-black text-cyan-400/70 uppercase tracking-widest">Scanning local nodes...</p>
                     <div className="flex justify-center gap-1.5 mt-4">
                        {[1,2,3].map(i => <motion.div key={i} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: i*0.2 }} className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_5px_#22d3ee]" />)}
                     </div>
                  </div>
                ) : (
                  <div className="py-6 space-y-4">
                     <div className="text-5xl mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">⏳</div>
                     <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Game Closed</h3>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-[200px] mx-auto">
                        Silver Rush opens daily from 10:00 AM to 3:00 PM. See you tomorrow!
                     </p>
                  </div>
                )}
              </AnimatePresence>
           </div>
        </div>
      </header>

      <div className="px-5 -mt-8 space-y-6 relative z-10 max-w-lg mx-auto">
         {/* RECENT WINNERS */}
         <div className="bg-[#161b22]/80 backdrop-blur-xl p-8 rounded-[3rem] shadow-xl border border-[#30363d] space-y-6">
            <h4 className="text-sm font-black text-white uppercase tracking-tighter italic mb-2">Recent Silver Hunters</h4>
            <div className="space-y-3">
               {winners.length > 0 ? winners.map((w, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-cyan-500/30 transition-all group">
                     <div className="flex items-center gap-3">
                        <img src={w.avatar} className="w-9 h-9 rounded-xl border border-white/10 shadow-sm group-hover:scale-105 group-hover:border-cyan-500/50 transition-transform object-cover" alt="" />
                        <div>
                           <p className="text-xs font-black text-white group-hover:text-cyan-300 transition-colors">{w.username}</p>
                           <p className="text-[8px] font-bold text-slate-500 uppercase">
                              Claimed in {(w.grabTime/1000).toFixed(2)}s
                           </p>
                        </div>
                     </div>
                     <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-lg shadow-[0_0_10px_rgba(34,211,238,0.1)]">+{w.pointsWon} Coin</span>
                        <span className="text-[9px] font-black text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-lg">+5 AP</span>
                     </div>
                  </div>
               )) : (
                  <p className="text-[10px] text-center text-slate-500 uppercase font-black py-6">No recent activity</p>
               )}
            </div>
         </div>

         {/* PROTOCOL NOTE */}
         <div className="bg-gradient-to-br from-[#1C1C2E] to-[#110a2a] rounded-[2.5rem] p-8 text-center relative overflow-hidden shadow-2xl border border-white/5">
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
               <p className="text-[10px] font-black text-cyan-400/80 uppercase tracking-[0.3em] mb-3 drop-shadow-md">Protocol Note</p>
               <p className="text-xs font-medium text-slate-300 leading-relaxed">
                  Silver coins spawn randomly every <span className="text-white font-bold">10-15 minutes</span> between <span className="text-cyan-300 font-bold">10:00 AM and 3:00 PM</span>. They are common, but highly competitive. 
                  Maintain low latency for optimal performance.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default SilverCoinGame;
