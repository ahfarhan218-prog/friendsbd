import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
const REQUIRED_POINTS = 34;

const GenieCave: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [magicPoints, setMagicPoints] = useState<number>(0.1);
  const [isOpening, setIsOpening] = useState(false);
  const [caveOpened, setCaveOpened] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('user_session');
    if (session) {
      setUser(JSON.parse(session));
    }
  }, []);

  useEffect(() => {
    if (user && user.magicPoints !== undefined) {
      setMagicPoints(user.magicPoints);
    }
  }, [user]);

  const progress = Math.min(100, (magicPoints / REQUIRED_POINTS) * 100);

  const simulateEarn = () => {
    const earned = parseFloat((Math.random() * 5 + 1).toFixed(1));
    const nextPoints = parseFloat((magicPoints + earned).toFixed(1));
    setMagicPoints(nextPoints);

    if (nextPoints >= REQUIRED_POINTS && !caveOpened) {
      triggerDrama();
    }
  };

  const triggerDrama = () => {
    setIsOpening(true);
    setTimeout(() => {
      setIsOpening(false);
      setCaveOpened(true);
    }, 4000); // 4 seconds of maximum drama
  };

  return (
    <div className="min-h-screen bg-transparent font-inter pb-32 overflow-x-hidden">
      {/* HEADER SECTION */}
      <header className="relative bg-[#090d16]/80 backdrop-blur-xl border-b border-[#30363d] pt-12 pb-24 px-6 rounded-b-[4rem] shadow-xl overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 p-32 bg-purple-500/10 rounded-full blur-3xl -ml-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 right-0 p-24 bg-pink-500/10 rounded-full blur-2xl -mr-16 pointer-events-none" />
        
        <div className="relative z-10 flex justify-between items-center mb-8">
           <button onClick={() => navigate('/apps')} className="p-3 bg-white/5 rounded-2xl active:scale-90 border border-white/10 hover:bg-white/10 transition-colors">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
           </button>
           <div className="text-center">
             <h2 className="text-2xl font-black uppercase tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 drop-shadow-[0_0_10px_rgba(192,38,211,0.3)]">Genie Cave</h2>
             <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Magic Cave Game</p>
           </div>
           <div className="p-3 bg-white/5 text-purple-300 rounded-2xl border border-white/10 shadow-lg">
              <span className="text-sm font-black">🧞‍♂️</span>
           </div>
        </div>
      </header>

      <div className="px-5 -mt-16 space-y-6 relative z-10 max-w-lg mx-auto">
         {/* GENIE STATUS */}
         <div className="bg-[#161b22]/80 backdrop-blur-xl p-8 rounded-[3rem] shadow-xl border border-[#30363d] text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-500/20 text-purple-300 border border-purple-500/30 px-6 py-1 rounded-full text-[10px] font-black tracking-widest uppercase backdrop-blur-sm shadow-[0_0_15px_rgba(168,85,247,0.2)]">
               Phase: Requirement
            </div>

            <div className="relative w-24 h-24 mx-auto mb-6 mt-4">
               <motion.div 
                 className="absolute inset-0 bg-radial-gradient from-purple-500/60 to-transparent rounded-full blur-xl"
                 animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                 transition={{ repeat: Infinity, duration: 2 }}
               />
               <div className="relative z-10 text-6xl leading-[6rem] drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]">🧞‍♂️</div>
            </div>
            <h2 className="text-xl font-black text-white tracking-tighter italic mb-3 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">AWAKENED GENIE</h2>
            <p className="text-xs text-slate-400 font-medium leading-relaxed px-4">
              The genie is awake and judging your points.<br/>
              Collect enough magic points and he will open the cave with <strong className="text-purple-300">maximum drama</strong>.
            </p>
         </div>

         {/* QUEST CARD */}
         <div className="bg-gradient-to-br from-[#1C1C2E] to-[#110a2a] p-8 rounded-[3rem] shadow-2xl border border-white/5 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-center text-slate-400 mb-6 relative z-10">Current Quest</h3>
            
            <div className="flex gap-4 mb-6 relative z-10">
               <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-1 shadow-inner">
                  <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase">Current</span>
                  <span className="text-3xl font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">{magicPoints}</span>
               </div>
               <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-1 shadow-inner">
                  <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase">Required</span>
                  <span className="text-3xl font-black text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]">{REQUIRED_POINTS}</span>
               </div>
            </div>

            <div className="bg-black/30 rounded-2xl p-5 border border-white/5 relative z-10">
               <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Magic Progress</span>
                  <span className="text-xs font-black text-cyan-400">{Math.floor(progress)}%</span>
               </div>
               
               <div className="h-3 bg-white/5 rounded-full overflow-hidden mb-4 shadow-inner border border-white/5">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)] relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                     <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>
                  </motion.div>
               </div>
               
               <div className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                 {caveOpened ? <span className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">✨ Cave Opened! ✨</span> : 'Need More Magic Points'}
               </div>
            </div>
         </div>

         {/* ACTION BUTTONS */}
         {!caveOpened && (
           <motion.button 
             className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black py-5 rounded-3xl shadow-[0_0_20px_rgba(219,39,119,0.3)] uppercase tracking-[0.2em] text-xs hover:shadow-[0_0_30px_rgba(219,39,119,0.5)] disabled:opacity-50 transition-all border border-pink-400/50"
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             onClick={simulateEarn}
             disabled={isOpening}
           >
             {isOpening ? 'Opening Cave...' : '✨ Simulate Earn Magic'}
           </motion.button>
         )}

         {/* DRAMA OVERLAY */}
         <AnimatePresence>
           {isOpening && (
             <motion.div 
               className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
             >
               <motion.div 
                 className="text-center"
                 initial={{ scale: 0.5, rotate: -10 }}
                 animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                 transition={{ duration: 4 }}
               >
                 <motion.div 
                   className="text-[6rem] mb-6 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] inline-block"
                   animate={{ rotate: 360 }}
                   transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                 >
                   🌪️
                 </motion.div>
                 <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] mb-3">UNLEASHING THE MAGIC!</h2>
                 <p className="text-slate-300 text-sm font-bold tracking-widest uppercase">The Genie is opening the cave...</p>
               </motion.div>
             </motion.div>
           )}

           {caveOpened && (
             <motion.div 
               className="bg-gradient-to-br from-emerald-500 to-teal-700 p-8 rounded-[3rem] shadow-[0_0_30px_rgba(16,185,129,0.4)] text-center border border-emerald-400 mt-6 relative overflow-hidden"
               initial={{ opacity: 0, y: 50 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
             >
               <div className="absolute inset-0 bg-white/10 w-full h-full animate-pulse pointer-events-none"></div>
               <div className="text-6xl mb-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]">💎</div>
               <h2 className="text-2xl font-black text-white italic tracking-tighter mb-2 drop-shadow-md">THE CAVE IS OPEN!</h2>
               <p className="text-emerald-100 text-xs font-medium mb-6">You have proved your worth to the Awakened Genie.</p>
               <motion.button 
                 className="bg-white text-teal-800 font-black py-4 px-8 rounded-2xl shadow-xl uppercase tracking-widest text-xs hover:bg-emerald-50 transition-colors"
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => alert('Treasure claimed!')}
               >
                 Enter Cave
               </motion.button>
             </motion.div>
           )}
         </AnimatePresence>
      </div>
    </div>
  );
};

export default GenieCave;
