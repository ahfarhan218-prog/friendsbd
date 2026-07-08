import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { gameService } from '../services/gameService';
import { triggerToast } from '../components/NotificationToast';
import { mongoService } from '../services/mongoService';
import { checkMissionCompletion } from '../utils/missions';
import { apService } from '../services/apService';

const getDhakaDate = (): Date => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * 6);
};

const ColorBallGame: React.FC = () => {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [winners, setWinners] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const bdNow = getDhakaDate();
  const hours = bdNow.getHours();
  const isGameTime = hours >= 17 && hours < 24;

  const loadWinners = () => {
    const logs = JSON.parse(localStorage.getItem('friends_bd_color_logs') || '[]');
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
    setIsActive(gameService.checkActiveCoin('color'));
    loadWinners();

    const onDrop = (e: any) => { if (e.detail.type === 'color') setIsActive(true); };
    const onClaim = () => { setIsActive(false); loadWinners(); };
    const onStateUpdated = (e: any) => { if (e.detail?.type === 'color') setIsActive(e.detail.active); };

    window.addEventListener('coin-dropped', onDrop);
    window.addEventListener('color-claimed', onClaim);
    window.addEventListener('coin-state-updated', onStateUpdated);

    return () => {
      window.removeEventListener('coin-dropped', onDrop);
      window.removeEventListener('color-claimed', onClaim);
      window.removeEventListener('coin-state-updated', onStateUpdated);
    };
  }, []);

  const handleGrab = async () => {
    if (isClaiming || !isActive) return;
    setIsClaiming(true);
    if (!currentUser) { setIsClaiming(false); return; }
    const claimer = currentUser;
    const result = await gameService.claimColorBall(claimer.id, claimer.username || claimer.name, claimer.avatar);
    if (result.success) {
      triggerToast({
        id: 'color-win-' + Date.now(), senderId: 'system', senderName: 'System', 
        senderAvatar: 'https://picsum.photos/seed/sys/100', type: 'REWARD',
        message: result.msg, timestamp: Date.now(), isRead: false
      });

      mongoService.addActivity({
        id: 'act_' + Date.now(),
        time: new Date().toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' }),
        username: claimer.username || claimer.name,
        msg: `grabbed a Color Ball!`,
        timestamp: Date.now(),
        link: `/color-game`
      });
    } else {
      alert(result.msg);
    }
    setIsClaiming(false);
    setIsActive(false);
  };

  return (
    <div className="min-h-screen bg-transparent font-inter pb-32">
      {/* HEADER SECTION */}
      <header className="relative bg-[#090d16]/80 backdrop-blur-xl border-b border-[#30363d] pt-12 pb-24 px-3 sm:px-6 rounded-b-[4rem] shadow-xl overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 p-32 bg-rose-500/10 rounded-full blur-3xl -ml-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 right-0 p-24 bg-amber-500/10 rounded-full blur-2xl -mr-16 pointer-events-none" />
        
        <div className="relative z-10 flex justify-between items-center mb-8">
           <button onClick={() => navigate('/apps')} className="p-3 bg-white/5 rounded-2xl active:scale-90 border border-white/10 hover:bg-white/10 transition-colors">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
           </button>
           <div className="text-center">
             <h2 className="text-2xl font-black uppercase tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400 drop-shadow-[0_0_10px_rgba(251,113,133,0.3)]">Color Ball</h2>
             <p className="text-sm font-black uppercase tracking-widest text-slate-400">Nightly Canvas Event</p>
           </div>
           {/* Replace this link with a dedicated leaderboard if created later */}
           <div className="p-3 bg-white/5 text-rose-300 rounded-2xl border border-white/10 shadow-lg">
              <span className="text-sm font-black">🎨</span>
           </div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
            <div className="bg-[#161b22]/80 rounded-3xl p-4 sm:p-6 sm:p-8 backdrop-blur-xl border border-[#30363d] shadow-2xl shadow-rose-900/20 text-center w-full max-w-[400px]">
              <AnimatePresence mode="wait">
                {isActive ? (
                  <motion.div 
                    key="active" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                    className="space-y-6"
                  >
                     <motion.div 
                        animate={{ rotateZ: 360, scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="text-7xl drop-shadow-[0_0_25px_rgba(244,63,94,0.6)]"
                     >
                       🎨
                     </motion.div>
                     <h3 className="text-2xl font-black text-rose-400 italic tracking-tighter drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">BALL DETECTED!</h3>
                     <button 
                       onClick={handleGrab} disabled={isClaiming}
                       className="w-full bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(244,63,94,0.4)] uppercase tracking-[0.2em] text-sm hover:scale-105 hover:shadow-[0_0_30px_rgba(244,63,94,0.6)] active:scale-95 transition-all relative overflow-hidden disabled:opacity-60 border border-rose-400"
                     >
                       {isClaiming ? 'COLLECTING...' : 'COLLECT BALL NOW'}
                       <motion.div 
                         animate={{ x: ['-100%', '200%'] }} 
                         transition={{ duration: 1.5, repeat: Infinity }}
                         className="absolute inset-y-0 w-20 bg-white/30 skew-x-12" 
                       />
                     </button>
                  </motion.div>
                ) : isGameTime ? (
                  <div className="py-6">
                     <div className="text-4xl opacity-50 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] mb-4">🖼️</div>
                     <p className="text-sm font-black text-rose-400/70 uppercase tracking-widest">Awaiting inspiration...</p>
                     <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                        {[1,2,3].map(i => <motion.div key={i} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: i*0.2 }} className="w-1.5 h-1.5 bg-rose-400 rounded-full shadow-[0_0_5px_#f43f5e]" />)}
                     </div>
                  </div>
                ) : (
                  <div className="py-6 space-y-4">
                     <div className="text-5xl mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">🌜</div>
                     <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Studio Closed</h3>
                     <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest max-w-[200px] mx-auto">
                        Color Ball is active daily from 5:00 PM to 12:00 AM. See you later!
                     </p>
                  </div>
                )}
              </AnimatePresence>
           </div>
        </div>
      </header>

      <div className="px-5 -mt-8 space-y-6 relative z-10 max-w-lg mx-auto">
         {/* RECENT WINNERS */}
         <div className="bg-[#161b22]/80 backdrop-blur-xl p-4 sm:p-8 rounded-[3rem] shadow-xl border border-[#30363d] space-y-6">
            <h4 className="text-sm font-black text-white uppercase tracking-tighter italic mb-2">Recent Painters</h4>
            <div className="space-y-3">
               {winners.length > 0 ? winners.map((w, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-rose-500/30 transition-all group">
                     <div className="flex flex-wrap items-center gap-3">
                        <img src={w.avatar} className="w-9 h-9 rounded-xl border border-white/10 shadow-sm group-hover:scale-105 group-hover:border-rose-500/50 transition-transform object-cover" alt="" />
                        <div>
                           <p className="text-sm font-black text-white group-hover:text-rose-300 transition-colors">{w.username}</p>
                           <p className="text-sm font-bold text-slate-500 uppercase">
                              Claimed in {(w.grabTime/1000).toFixed(2)}s
                           </p>
                        </div>
                     </div>
                     <div className="flex flex-col items-end gap-1">
                        <span className="text-xs sm:text-sm font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-lg shadow-[0_0_10px_rgba(244,63,94,0.1)]">+{w.pointsWon} Ball</span>
                        <span className="text-sm font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">+5 AP</span>
                     </div>
                  </div>
               )) : (
                  <p className="text-xs sm:text-sm text-center text-slate-500 uppercase font-black py-6">No recent activity</p>
               )}
            </div>
         </div>

         {/* PROTOCOL NOTE */}
         <div className="bg-gradient-to-br from-[#1C1C2E] to-[#110a2a] rounded-[2.5rem] p-4 sm:p-8 text-center relative overflow-hidden shadow-2xl border border-white/5">
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
               <p className="text-xs sm:text-sm font-black text-rose-400/80 uppercase tracking-[0.3em] mb-3 drop-shadow-md">Protocol Note</p>
               <p className="text-sm font-medium text-slate-300 leading-relaxed">
                  Color balls spawn randomly every <span className="text-white font-bold">10-15 minutes</span> between <span className="text-rose-300 font-bold">5:00 PM and 12:00 AM</span>. 
                  Be quick to expand your canvas!
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ColorBallGame;

