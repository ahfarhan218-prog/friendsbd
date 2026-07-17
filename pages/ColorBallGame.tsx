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
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#1a0a2e] to-[#0a0a1a] pb-32 overflow-x-hidden">
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes shimmer { 0%{background-position:-200%} 100%{background-position:200%} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 20px rgba(236,72,153,0.3)} 50%{box-shadow:0 0 40px rgba(236,72,153,0.6)} }
        .color-card { background:linear-gradient(135deg,rgba(28,28,46,0.9),rgba(17,10,42,0.9)); border:1px solid rgba(255,255,255,0.06); border-radius:24px; backdrop-filter:blur(12px); transition:all .3s; }
        .color-card:hover { border-color:rgba(236,72,153,0.2); }
      `}</style>

      {/* HEADER */}
      <header className="relative pt-12 pb-28 px-3 sm:px-6 overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-900/40 via-rose-900/20 to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex justify-between items-center mb-8 max-w-4xl mx-auto">
          <button onClick={() => navigate('/apps')} className="p-3 bg-white/5 rounded-2xl active:scale-90 border border-white/10 hover:bg-white/10 hover:border-fuchsia-500/30 transition-all">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-rose-400 to-amber-400 drop-shadow-[0_0_15px_rgba(251,113,133,0.3)]">Color Ball</h2>
            <p className="text-sm font-black uppercase tracking-widest text-fuchsia-300/70">Nightly Canvas Event</p>
          </div>
          <Link to="/color-ball-leaderboard" className="p-3 bg-white/5 rounded-2xl active:scale-90 border border-white/10 hover:bg-white/10 hover:border-fuchsia-500/30 transition-all group">
            <span className="text-sm font-black text-fuchsia-300 group-hover:text-fuchsia-200">🏆</span>
          </Link>
        </div>

        <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto">
          <div className="color-card p-4 sm:p-6 sm:p-8 w-full shadow-2xl shadow-fuchsia-900/20 text-center border-fuchsia-500/10">
            <AnimatePresence mode="wait">
              {isActive ? (
                <motion.div
                  key="active" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                  className="space-y-6"
                >
                  <motion.div
                    animate={{ rotateZ: 360, scale: [1, 1.15, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="text-7xl drop-shadow-[0_0_30px_rgba(236,72,153,0.6)]"
                  >
                    🎨
                  </motion.div>
                  <h3 className="text-2xl font-black text-fuchsia-400 italic tracking-tighter drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">BALL DETECTED!</h3>
                  <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-sm font-bold text-fuchsia-300/60 uppercase tracking-widest">Tap to claim your color</motion.div>
                  <button
                    onClick={handleGrab} disabled={isClaiming}
                    className="w-full bg-gradient-to-r from-fuchsia-600 via-rose-500 to-amber-500 text-white font-black py-4 rounded-2xl shadow-[0_0_25px_rgba(236,72,153,0.4)] uppercase tracking-[0.2em] text-sm hover:scale-105 hover:shadow-[0_0_40px_rgba(236,72,153,0.6)] active:scale-95 transition-all relative overflow-hidden disabled:opacity-60 border border-fuchsia-400/30"
                    style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
                  >
                    {isClaiming ? '🎨 COLLECTING...' : '🎨 COLLECT BALL NOW'}
                    <motion.div
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute inset-y-0 w-20 bg-white/20 skew-x-12"
                    />
                  </button>
                </motion.div>
              ) : isGameTime ? (
                <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6">
                  <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity }} className="text-5xl mb-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">🖼️</motion.div>
                  <p className="text-lg font-black text-fuchsia-300/70 uppercase tracking-widest">Awaiting inspiration...</p>
                  <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                    {[1,2,3].map(i => <motion.div key={i} animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }} transition={{ repeat: Infinity, duration: 1.5, delay: i*0.3 }} className="w-2 h-2 bg-fuchsia-400 rounded-full shadow-[0_0_8px_#f43f5e]" />)}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="closed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6 space-y-4">
                  <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }} className="text-6xl mb-2 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">🌜</motion.div>
                  <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">Studio Closed</h3>
                  <div className="inline-block bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-2xl px-4 py-2">
                    <p className="text-xs sm:text-sm font-bold text-fuchsia-300 uppercase tracking-widest">Active 5:00 PM — 12:00 AM</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="px-5 -mt-16 space-y-6 relative z-10 max-w-lg mx-auto">
        {/* STATS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { icon: '🎨', label: 'My Balls', value: currentUser?.colorBalls || 0, color: 'from-fuchsia-600/20 to-rose-600/20 border-fuchsia-500/20' },
            { icon: '🏆', label: 'Rank', value: '#—', color: 'from-amber-600/20 to-orange-600/20 border-amber-500/20' },
            { icon: '⚡', label: 'AP Earned', value: `+${winners.reduce((s,w)=>s+(w.pointsWon||0),0)*5}`, color: 'from-violet-600/20 to-purple-600/20 border-violet-500/20' },
          ].map(s => (
            <div key={s.label} className={`bg-gradient-to-br ${s.color} border rounded-2xl p-3 text-center`}>
              <span className="text-lg block mb-0.5">{s.icon}</span>
              <p className="text-sm sm:text-lg font-black text-white">{s.value}</p>
              <p className="text-xs text-white/50 font-bold uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* RECENT WINNERS */}
        <div className="color-card p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse" />
              Recent Painters
            </h4>
            <span className="text-xs font-bold text-white/30 bg-white/5 px-2 py-1 rounded-full">{winners.length} claims</span>
          </div>
          <div className="space-y-2">
            {winners.length > 0 ? winners.map((w, idx) => (
              <motion.div
                key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-fuchsia-500/30 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img src={w.avatar} className="w-9 h-9 rounded-xl border border-white/10 shadow-sm group-hover:scale-105 group-hover:border-fuchsia-500/50 transition-transform object-cover" alt="" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#1C1C2E] rounded-full" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white group-hover:text-fuchsia-300 transition-colors truncate">{w.username}</p>
                    <p className="text-xs font-bold text-white/40 uppercase">Claimed in {(w.grabTime/1000).toFixed(2)}s</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-black text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/20 px-2 py-1 rounded-lg">🎨+{w.pointsWon}</span>
                  <span className="text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">+5 AP</span>
                </div>
              </motion.div>
            )) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
                <div className="text-4xl mb-3 opacity-30">🎨</div>
                <p className="text-sm font-black text-white/30 uppercase tracking-widest">No recent activity</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* PROTOCOL NOTE */}
        <div className="color-card p-4 sm:p-6 text-center relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <p className="text-xs font-black text-fuchsia-400/80 uppercase tracking-[0.3em] mb-3 drop-shadow-md">Protocol Note</p>
            <p className="text-sm font-medium text-slate-300 leading-relaxed">
              Color balls spawn randomly every <span className="text-fuchsia-300 font-bold">10-15 minutes</span> between{' '}
              <span className="text-rose-300 font-bold">5:00 PM — 12:00 AM</span>.
              Be quick to expand your canvas!
            </p>
          </div>
          <Link to="/color-ball-leaderboard" className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-fuchsia-600 to-rose-500 text-white font-black text-sm rounded-xl uppercase tracking-wider hover:scale-105 transition-all shadow-lg shadow-fuchsia-900/30">
            🏆 View Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ColorBallGame;
