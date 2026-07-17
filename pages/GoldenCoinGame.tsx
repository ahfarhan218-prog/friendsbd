
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { gameService } from '../services/gameService';
import { triggerToast } from '../components/NotificationToast';
import { mongoService } from '../services/mongoService';
import { checkMissionCompletion } from '../utils/missions';
import { unlockAchievement } from '../utils/achievements';
import { apService } from '../services/apService';

const DAILY_LIMIT = 5;

const getDhakaDate = (): Date => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * 6);
};

const GoldenCoinGame: React.FC = () => {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [winners, setWinners] = useState<any[]>([]);
  const [serverTime, setServerTime] = useState(new Date());
  const [status, setStatus] = useState<'IDLE' | 'SEARCHING'>('IDLE');
  const [isOpen, setIsOpen] = useState(false);
  const [nextSpawn, setNextSpawn] = useState<number | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [hasReveal, setHasReveal] = useState(false);
  const [todayGrabs, setTodayGrabs] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [justGrabbed, setJustGrabbed] = useState(false);

  const loadWinners = () => {
    setWinners(gameService.getLogs('all').slice(0, 5));
  };

  const refreshTodayGrabs = (uid: string) => {
    const count = gameService.getTodayGrabCount(uid);
    setTodayGrabs(count);
  };

  useEffect(() => {
    let uid = '';
    try {
      const saved = localStorage.getItem('user_session');
      if (saved) {
        const u = JSON.parse(saved);
        setCurrentUser(u);
        uid = u.id || '';
        checkMissionCompletion(u, 'play_game').catch(() => {});
        setIsPremium(!!u.isPremium);
        setHasReveal(!!(u.goldenRevealUntil && u.goldenRevealUntil > Date.now()));
        refreshTodayGrabs(uid);
      }
    } catch (e) {}

    const checkOpen = () => {
      const bdNow = getDhakaDate();
      const hours = bdNow.getHours();
      // Open from 5 PM (17) to midnight (< 24)
      setIsOpen(hours >= 17 && hours < 24);
    };
    checkOpen();

    // Start the simulated backend engine
    gameService.initSpawner();
    
    setIsActive(gameService.checkActiveCoin('gold'));
    loadWinners();

    // Update digital clock and radar
    const clock = setInterval(() => {
      setServerTime(new Date());
      checkOpen();
      setNextSpawn(gameService.getNextSpawnTime('gold'));
    }, 1000);

    // Socket Event Listeners (Simulated)
    const onDrop = (e: any) => {
      if (e.detail?.type === 'gold') {
        setIsActive(true);
        setStatus('IDLE');
      }
    };
    
    const onClaim = (e: any) => {
      setIsActive(false);
      loadWinners();
      const currentName = currentUser?.username || '';
      if (e.detail.username !== currentName) {
        triggerToast({
          id: 'claim-broadcast-' + Date.now(),
          senderId: 'system',
          senderName: 'System Broadcast',
          senderAvatar: 'https://picsum.photos/seed/sys/100',
          type: 'REWARD',
          message: `${e.detail.username} grabbed the Golden Coin! 🪙`,
          timestamp: Date.now(),
          isRead: false
        });
      }
    };

    const onStateUpdated = (e: any) => {
      if (e.detail?.type === 'gold') {
        setIsActive(e.detail.active);
        if (e.detail.active) setStatus('IDLE');
      }
    };

    // Refresh daily grabs when storage changes (e.g. after claim)
    const onStorage = () => {
      const saved = localStorage.getItem('user_session');
      if (saved) {
        const u = JSON.parse(saved);
        refreshTodayGrabs(u.id || '');
        setIsPremium(!!u.isPremium);
        setHasReveal(!!(u.goldenRevealUntil && u.goldenRevealUntil > Date.now()));
      }
    };

    window.addEventListener('coin-dropped', onDrop);
    window.addEventListener('coin-claimed', onClaim);
    window.addEventListener('coin-state-updated', onStateUpdated);
    window.addEventListener('storage', onStorage);

    return () => {
      clearInterval(clock);
      window.removeEventListener('coin-dropped', onDrop);
      window.removeEventListener('coin-claimed', onClaim);
      window.removeEventListener('coin-state-updated', onStateUpdated);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const handleGrab = async () => {
    if (isClaiming || !isActive) return;
    if (todayGrabs >= DAILY_LIMIT) {
      triggerToast({
        id: 'limit-' + Date.now(),
        senderId: 'system',
        senderName: 'System',
        senderAvatar: 'https://picsum.photos/seed/sys/100',
        type: 'SYSTEM',
        message: `Daily limit reached! You've grabbed ${DAILY_LIMIT}/${DAILY_LIMIT} coins today.`,
        timestamp: Date.now(),
        isRead: false
      });
      return;
    }

    setIsClaiming(true);

    // Anti-Cheat: Simple bot delay check
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!currentUser) { setIsClaiming(false); return; }
    const claimer = currentUser;
    const result = await gameService.claimCoin(claimer.id, claimer.username || claimer.name, claimer.avatar);
    
    if (result.success) {
      unlockAchievement('first_win');
      if ((claimer.points || 0) >= 10000) {
        unlockAchievement('rich_kid');
      }
      // Update local daily grabs count
      if (result.dailyGrabs !== undefined) setTodayGrabs(result.dailyGrabs);
      
      setJustGrabbed(true);
      setTimeout(() => setJustGrabbed(false), 3000);

      // Fire success toast notification
      triggerToast({
        id: 'grab-success-' + Date.now(),
        senderId: 'system',
        senderName: 'Golden Coin',
        senderAvatar: 'https://picsum.photos/seed/goldcoin/100',
        type: 'REWARD',
        message: `🏆 You grabbed a Golden Coin! +1 Coin & +10 AP added to your profile.`,
        timestamp: Date.now(),
        isRead: false
      });

      mongoService.addActivity({
        id: 'act_' + Date.now(),
        time: new Date().toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' }),
        username: claimer.username || claimer.name,
        msg: `grabbed a Golden Coin!`,
        timestamp: Date.now(),
        link: `/coin-game`
      });
    } else {
      if (result.dailyGrabs !== undefined) setTodayGrabs(result.dailyGrabs);
      triggerToast({
        id: 'grab-fail-' + Date.now(),
        senderId: 'system',
        senderName: 'System',
        senderAvatar: 'https://picsum.photos/seed/sys/100',
        type: 'SYSTEM',
        message: result.msg,
        timestamp: Date.now(),
        isRead: false
      });
    }
    
    setIsClaiming(false);
    setIsActive(false);
  };

  const startSearch = () => {
    setStatus('SEARCHING');
    setTimeout(() => {
      if (!isActive) setStatus('IDLE');
    }, 5000);
  };

  const remaining = DAILY_LIMIT - todayGrabs;
  const limitReached = todayGrabs >= DAILY_LIMIT;

  return (
    <div className="min-h-screen bg-transparent font-inter pb-32 overflow-x-hidden">
      {/* HEADER SECTION */}
      <header className="relative bg-[#090d16]/80 backdrop-blur-xl border-b border-[#30363d] pt-12 pb-24 px-3 sm:px-6 rounded-b-[4rem] shadow-xl overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 p-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 p-24 bg-purple-500/10 rounded-full blur-2xl -ml-16 pointer-events-none" />
        
        <div className="relative z-10 flex justify-between items-center mb-8">
           <button onClick={() => navigate('/apps')} className="p-3 bg-white/5 rounded-2xl active:scale-90 border border-white/10 hover:bg-white/10 transition-colors">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
           </button>
           <div className="text-center">
             <h2 className="text-2xl font-black uppercase tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">Golden Coin</h2>
             <p className="text-sm font-black uppercase tracking-widest text-slate-400">Real-Time Event Hub</p>
           </div>
           <Link to="/coin-leaderboard" className="p-3 bg-white/5 text-amber-400 rounded-2xl active:scale-90 border border-white/10 hover:bg-white/10 hover:border-amber-400/30 transition-all shadow-lg group relative">
              <span className="text-sm font-black">🏆</span>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full border border-transparent shadow-[0_0_10px_#ec4899] animate-pulse"></span>
           </Link>
        </div>

        <div className="relative z-10 flex flex-col items-center">
           {(!isOpen && !isActive) ? (
              <div className="bg-[#161b22]/80 rounded-3xl p-4 sm:p-6 sm:p-8 backdrop-blur-xl border border-[#30363d] shadow-2xl shadow-purple-900/20 text-center w-full max-w-[400px]">
                 <div className="text-5xl mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">🌙</div>
                 <h3 className="text-xl font-black text-white italic tracking-tighter mb-2">EVENT CLOSED</h3>
                 <p className="text-sm text-slate-400 font-medium">Golden Coins drop daily from 5:00 PM to 12:00 AM BDT.</p>
                 
                 <div className="mt-6 p-4 bg-black/40 rounded-2xl border border-white/5">
                    <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-amber-400/70 mb-1">Opens In</p>
                    <p className="text-2xl font-black tracking-widest text-white drop-shadow-md">
                       {(() => {
                         const bdNow = getDhakaDate();
                         const targetTime = new Date(bdNow);
                         targetTime.setHours(17, 0, 0, 0); // 5:00 PM today
                         
                         const diffMs = targetTime.getTime() - bdNow.getTime();
                         if (diffMs <= 0) return "00:00:00";
                         
                         const diffH = Math.floor(diffMs / 3600000);
                         const diffM = Math.floor((diffMs % 3600000) / 60000);
                         const diffS = Math.floor((diffMs % 60000) / 1000);
                         
                         return `${diffH.toString().padStart(2, '0')}:${diffM.toString().padStart(2, '0')}:${diffS.toString().padStart(2, '0')}`;
                       })()}
                     </p>
                 </div>
              </div>
            ) : (
              <div className="bg-[#161b22]/80 rounded-3xl p-5 sm:p-6 backdrop-blur-xl border border-[#30363d] shadow-2xl shadow-purple-900/20 text-center w-full max-w-[400px]">
              <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Network Status</p>
              
              {/* Daily Grab Counter */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
                {Array.from({ length: DAILY_LIMIT }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: i < todayGrabs ? 1 : 0.85 }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all ${
                      i < todayGrabs
                        ? 'bg-amber-400 border-amber-300 text-white shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                        : 'bg-white/5 border-white/10 text-white/40'
                    }`}
                  >
                    {i < todayGrabs ? '🪙' : '○'}
                  </motion.div>
                ))}
              </div>
              <p className="text-sm font-black uppercase tracking-widest text-slate-400 mb-5">
                {limitReached ? '⛔ Daily Limit Reached' : `${remaining} grab${remaining !== 1 ? 's' : ''} remaining today`}
              </p>
              
              <AnimatePresence mode="wait">
                {limitReached ? (
                  <motion.div
                    key="limit"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="space-y-4 py-2"
                  >
                    <div className="text-5xl drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">🔒</div>
                    <h3 className="text-lg font-black text-amber-400 italic tracking-tighter drop-shadow-lg">LIMIT REACHED</h3>
                    <p className="text-xs sm:text-sm font-bold text-slate-400 leading-relaxed">You've grabbed 5 coins today.<br/>Come back tomorrow for more!</p>
                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Resets at 12:00 AM BDT</p>
                  </motion.div>
                ) : isActive ? (
                  <motion.div 
                    key="active"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="space-y-6"
                  >
                     <AnimatePresence>
                       {justGrabbed ? (
                         <motion.div
                           key="grabbed"
                           initial={{ scale: 0.5, opacity: 0 }}
                           animate={{ scale: 1.2, opacity: 1 }}
                           exit={{ scale: 0, opacity: 0 }}
                           className="text-6xl drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]"
                         >🎉</motion.div>
                       ) : (
                         <motion.div
                           key="coin"
                           animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
                           transition={{ duration: 1.5, repeat: Infinity }}
                           className="text-6xl drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]"
                         >💰</motion.div>
                       )}
                     </AnimatePresence>
                     <h3 className="text-2xl font-black text-amber-400 italic tracking-tighter drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">COIN DETECTED!</h3>
                     <p className="text-xs sm:text-sm font-bold text-white/80 bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-xl">FIRST USER TO GRAB WINS 1 COIN & 10 AP</p>
                     <button 
                       onClick={handleGrab}
                       disabled={isClaiming}
                       className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.4)] uppercase tracking-[0.2em] text-sm hover:scale-105 hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] active:scale-95 transition-all relative overflow-hidden disabled:opacity-60 border border-amber-400"
                     >
                       {isClaiming ? 'GRABBING...' : 'GRAB YOUR COIN NOW'}
                       <motion.div 
                         animate={{ x: ['-100%', '200%'] }} 
                         transition={{ duration: 1.5, repeat: Infinity }}
                         className="absolute inset-y-0 w-20 bg-white/30 skew-x-12" 
                       />
                     </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4 py-4"
                  >
                     <div className="text-4xl opacity-50 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">📡</div>
                     <p className="text-sm font-black text-white/50 uppercase leading-relaxed">
                        {status === 'SEARCHING' ? 'Scanning community nodes...' : "No coin available right now."}
                     </p>
                     <button 
                       onClick={startSearch}
                       disabled={status === 'SEARCHING'}
                       className="text-xs sm:text-sm font-black uppercase tracking-widest text-purple-400 border-b border-purple-500/50 pb-1 disabled:opacity-30 transition-all hover:text-purple-300 hover:border-purple-400"
                     >
                        {status === 'SEARCHING' ? 'Searching...' : 'Search for coin'}
                     </button>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
           )}
        </div>
      </header>

      <div className="px-5 -mt-8 space-y-6 relative z-10 max-w-lg mx-auto">
         {/* REVEAL RADAR */}
         {isOpen && (
           <div className="bg-[#161b22]/80 backdrop-blur-xl p-4 sm:p-6 rounded-[2.5rem] shadow-xl border border-[#30363d]">
              <h4 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex flex-wrap items-center gap-2">
                 <span className="text-lg drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">📡</span> {isPremium || hasReveal ? 'Live Countdown' : 'Coin Drop Radar'}
              </h4>
              {isPremium || hasReveal ? (
                 <div className="p-5 bg-gradient-to-r from-amber-900/40 to-purple-900/40 rounded-2xl border border-amber-500/30 shadow-[0_0_20px_rgba(251,191,36,0.15)] text-white flex items-center justify-between">
                    <div>
                       <p className="text-xs sm:text-sm font-black uppercase text-amber-400/80 mb-1">Next Drop In</p>
                       <p className="text-2xl font-black tracking-widest text-white drop-shadow-md">
                          {isActive ? (
                            <span className="text-amber-400 font-bold animate-pulse text-sm">COIN ACTIVE NOW!</span>
                          ) : nextSpawn && nextSpawn > Date.now() ? (() => {
                            const diff = Math.floor((nextSpawn - Date.now()) / 1000);
                            const m = Math.floor(diff / 60);
                            const s = diff % 60;
                            return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                          })() : 'Calculating...'}
                        </p>
                        <p className="text-sm text-amber-300/70 mt-1">Drops every 13–18 min</p>
                    </div>
                    <div className="text-3xl animate-pulse drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">🎯</div>
                 </div>
              ) : (
                 <div className="p-5 bg-black/30 rounded-2xl border border-white/5 text-center space-y-3">
                    <div className="text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">🔒</div>
                    <p className="text-sm font-bold text-slate-400">See the countdown timer for the next Golden Coin drop!</p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <button onClick={() => navigate('/shop')} className="text-xs sm:text-sm font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-5 py-2.5 rounded-xl hover:bg-amber-500/20 transition-colors border border-amber-500/30">
                         🎁 Subscribe w/ Plusses
                      </button>
                      <button onClick={() => navigate('/premium')} className="text-xs sm:text-sm font-black uppercase tracking-widest text-white bg-purple-600 px-5 py-2.5 rounded-xl hover:bg-purple-500 transition-colors shadow-[0_0_15px_rgba(147,51,234,0.4)] border border-purple-400">
                         👑 Get Premium
                      </button>
                    </div>
                 </div>
              )}
           </div>
         )}

         {/* RECENT WINNERS */}
         <div className="bg-[#161b22]/80 backdrop-blur-xl p-4 sm:p-8 rounded-[3rem] shadow-xl border border-[#30363d] space-y-6">
            <div className="flex justify-between items-center px-2">
               <h4 className="text-sm font-black text-white uppercase tracking-tighter italic">Last Coin Gainers</h4>
               <Link to="/coin-leaderboard" className="text-sm font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 hover:bg-purple-500/20 transition-colors">Full Ranks →</Link>
            </div>

            <div className="space-y-3">
               {winners.length > 0 ? winners.map((w, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-purple-500/30 transition-all group"
                  >
                     <div className="flex flex-wrap items-center gap-3">
                        <img src={w.avatar} className="w-9 h-9 rounded-xl border border-white/10 shadow-sm group-hover:scale-105 group-hover:border-purple-500/50 transition-transform object-cover" alt="" />
                        <div>
                           <p className="text-sm font-black text-white group-hover:text-purple-300 transition-colors">{w.username}</p>
                           <p className="text-sm font-bold text-slate-500 uppercase">
                              {new Date(w.timestamp).toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' })}
                           </p>
                        </div>
                     </div>
                     <div className="flex flex-col items-end gap-1">
                       <span className="text-xs sm:text-sm font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg shadow-[0_0_10px_rgba(251,191,36,0.1)]">+1 Coin</span>
                       <span className="text-sm font-black text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-lg">+10 AP</span>
                     </div>
                  </motion.div>
               )) : (
                  <div className="py-10 text-center opacity-40">
                     <p className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-white">No history detected</p>
                  </div>
               )}
            </div>
            
            <div className="pt-4 border-t border-white/5">
                <button 
                onClick={() => navigate('/coin-leaderboard')}
                className="w-full py-2 text-xs sm:text-sm font-black uppercase tracking-widest text-slate-500 hover:text-purple-400 transition-colors flex flex-wrap items-center justify-center gap-2 group"
                >
                <span>View All-Time Rankings</span>
                <span className="group-hover:translate-x-1 group-hover:drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] transition-all">🏆</span>
                </button>
            </div>
         </div>

         {/* HOW IT WORKS */}
         <div className="bg-gradient-to-br from-[#1C1C2E] to-[#110a2a] rounded-[3rem] p-4 sm:p-8 text-white relative overflow-hidden shadow-2xl border border-white/5">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
               <h3 className="text-sm font-black uppercase tracking-[0.3em] text-purple-400 drop-shadow-md">How It Works</h3>
               <div className="space-y-4 pt-2">
                 {[
                   { icon: '⏰', text: 'Opens daily 5:00 PM – 12:00 AM BDT' },
                   { icon: '🎲', text: 'Coins drop randomly every 13–18 minutes' },
                   { icon: '🚀', text: 'First user to tap GRAB wins +1 Coin & +10 AP' },
                   { icon: '🔒', text: 'Max 5 grabs per user per day' },
                   { icon: '👑', text: 'Premium & Reveal subscribers see the countdown timer' },
                 ].map((item, i) => (
                   <div key={i} className="flex flex-wrap items-start gap-3">
                     <span className="text-lg shrink-0 drop-shadow-md">{item.icon}</span>
                     <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">{item.text}</p>
                   </div>
                 ))}
               </div>
                <button 
                  onClick={() => navigate('/shop')}
                  className="mt-4 w-full text-xs sm:text-sm font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-colors border border-amber-400/30 rounded-xl px-4 py-3 hover:bg-amber-400/10 shadow-[0_0_15px_rgba(251,191,36,0.1)]"
                >
                  🎁 Get Reveal Subscription — See Next Drop Time
                </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default GoldenCoinGame;

