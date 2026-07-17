
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CricketMatch: React.FC = () => {
  const navigate = useNavigate();
  const [score, setScore] = useState({ runs: 89, wickets: 5, overs: 5, balls: 0 });
  const [isLive, setIsLive] = useState(true);

  // Simulate Live Match updates
  useEffect(() => {
    if (!isLive) return;
    
    const interval = setInterval(() => {
      setScore(prev => {
        let newBalls = prev.balls + 1;
        let newOvers = prev.overs;
        let newRuns = prev.runs + Math.floor(Math.random() * 5); // 0-4 runs
        let newWickets = prev.wickets;

        if (newBalls >= 6) {
          newBalls = 0;
          newOvers += 1;
        }

        // Randomly lose a wicket (low probability)
        if (Math.random() > 0.95 && newWickets < 10) {
          newWickets += 1;
        }

        return { runs: newRuns, wickets: newWickets, overs: newOvers, balls: newBalls };
      });
    }, 4000); // Update every 4 seconds

    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="min-h-screen bg-transparent pb-32 overflow-x-hidden">
      <header className="relative bg-[#090d16]/80 backdrop-blur-xl border-b border-[#30363d] p-4 sm:p-6 pt-12 pb-24 rounded-b-[4rem] shadow-xl overflow-hidden shrink-0">
         <div className="absolute top-0 left-0 p-32 bg-indigo-600/10 rounded-full blur-3xl -ml-16 -mt-16 pointer-events-none" />
         <div className="absolute bottom-0 right-0 p-24 bg-emerald-500/10 rounded-full blur-2xl -mr-16 pointer-events-none" />
         
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-3">
           <div className="flex flex-wrap items-center gap-4">
             <button onClick={() => navigate(-1)} className="p-3 bg-white/5 rounded-2xl active:scale-90 border border-white/10 hover:bg-white/10 transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
             </button>
             <div>
               <h2 className="text-2xl font-black italic tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">Live Match</h2>
               <p className="text-sm font-black uppercase tracking-widest text-slate-400">Dhaka Tigers vs Sylhet</p>
             </div>
           </div>
           <div className="flex flex-wrap items-center gap-2 bg-rose-600/80 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-widest border border-rose-400/50 shadow-[0_0_15px_rgba(225,29,72,0.5)] animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"></span>
              Live
           </div>
         </div>
      </header>

      <div className="px-5 -mt-16 flex flex-col gap-6 mb-24 relative z-10 max-w-lg mx-auto">
        {/* Dynamic Match Score Card */}
        <div className="bg-[#161b22]/80 backdrop-blur-xl rounded-[3rem] p-4 sm:p-8 shadow-2xl border border-[#30363d] relative overflow-hidden">
           <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
           <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
           
           <div className="flex justify-between items-center mb-10 relative z-10">
              <div className="flex flex-col items-center">
                 <div className="relative group">
                    <img src="https://picsum.photos/seed/p1/100" className="w-16 h-16 rounded-[1.5rem] shadow-[0_0_20px_rgba(255,255,255,0.1)] border-2 border-slate-600 group-hover:scale-110 transition-transform" alt="" />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#161b22] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                 </div>
                 <p className="text-xs sm:text-sm font-black text-white mt-3 uppercase tracking-tighter drop-shadow-md">DHAKA TIGERS</p>
                 <span className="text-sm bg-emerald-900/40 text-emerald-300 px-3 py-1 rounded-full font-black mt-2 uppercase border border-emerald-500/30">Batting</span>
              </div>
              
              <div className="text-center px-4">
                 <div className="bg-[#090d16]/90 px-3 sm:px-6 py-4 rounded-[2rem] shadow-inner border border-[#30363d] mb-3 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                    <p className="text-xs sm:text-sm uppercase font-black tracking-[0.3em] text-slate-500 mb-1">SCORE</p>
                    <p className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 transition-all drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                      {score.runs}<span className="text-slate-600 mx-1 text-2xl font-light">/</span><span className="text-rose-400">{score.wickets}</span>
                    </p>
                 </div>
                 <p className="text-xs sm:text-sm font-black text-indigo-400 uppercase tracking-widest bg-indigo-900/20 py-1.5 rounded-full border border-indigo-500/20">
                    OVERS {score.overs}.{score.balls}
                 </p>
              </div>

              <div className="flex flex-col items-center">
                 <div className="relative group">
                    <img src="https://picsum.photos/seed/p2/100" className="w-16 h-16 rounded-[1.5rem] shadow-[0_0_20px_rgba(0,0,0,0.5)] border-2 border-[#30363d] opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all" alt="" />
                 </div>
                 <p className="text-xs sm:text-sm font-black text-slate-500 mt-3 uppercase tracking-tighter group-hover:text-white transition-colors">SYLHET STRIKERS</p>
                 <span className="text-sm text-amber-500/50 font-black mt-2 uppercase tracking-widest border border-amber-500/20 px-3 py-1 rounded-full bg-amber-900/10">Wait..</span>
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
             <div className="bg-[#090d16]/60 p-5 rounded-[2rem] border border-[#30363d] shadow-inner hover:border-emerald-500/30 transition-colors">
                <p className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Current Batter</p>
                <p className="text-sm font-black text-white italic tracking-tight">S. Hasan <span className="text-emerald-400">(34*)</span></p>
             </div>
             <div className="bg-[#090d16]/60 p-5 rounded-[2rem] border border-[#30363d] shadow-inner hover:border-indigo-500/30 transition-colors">
                <p className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Current Bowler</p>
                <p className="text-sm font-black text-white italic tracking-tight">M. Rahman <span className="text-indigo-400">(2/15)</span></p>
             </div>
           </div>
        </div>

        {/* Live Match Feed Simulation */}
        <div className="bg-[#161b22]/80 backdrop-blur-xl rounded-[3rem] p-4 sm:p-8 shadow-xl border border-[#30363d]">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs sm:text-sm font-black text-indigo-400 uppercase tracking-[0.2em] flex flex-wrap items-center gap-3">
                <span className="text-xl">📢</span> Live Commentary
              </h3>
              <span className="text-sm font-black text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 uppercase tracking-widest">Updating...</span>
           </div>
           
           <div className="space-y-4">
              <div className="flex flex-wrap gap-4 items-start p-4 bg-indigo-900/20 rounded-[2rem] border border-indigo-500/30 shadow-inner group transition-all hover:bg-indigo-900/30">
                 <div className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs sm:text-sm font-black shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-indigo-400 group-hover:scale-110 transition-transform">4</div>
                 <div>
                    <p className="text-sm font-bold text-slate-200 leading-relaxed">FOUR! S. Hasan pulls it away beautifully into the deep square leg boundary.</p>
                    <p className="text-sm text-indigo-300 mt-2 uppercase font-black tracking-widest opacity-80">Over 5.2 • Ball 2</p>
                 </div>
              </div>
              <div className="flex flex-wrap gap-4 items-start p-4 bg-[#090d16]/60 rounded-[2rem] border border-[#30363d] shadow-inner group transition-all hover:bg-white/5">
                 <div className="w-10 h-10 shrink-0 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-300 text-xs sm:text-sm font-black border border-slate-600 group-hover:scale-110 transition-transform">1</div>
                 <div>
                    <p className="text-sm font-medium text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">Single to mid-on, comfortably keeping the strike for the next ball.</p>
                    <p className="text-sm text-slate-500 mt-2 uppercase font-black tracking-widest">Over 5.1 • Ball 1</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Refresh / Join Button */}
        <button 
          onClick={() => navigate('/chat')}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black py-5 rounded-[2rem] shadow-[0_0_20px_rgba(16,185,129,0.3)] flex flex-wrap items-center justify-center gap-3 transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-95 uppercase tracking-[0.2em] text-xs sm:text-sm border border-emerald-400/50"
        >
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
           Join Live Match Chat
        </button>

        <p className="text-center text-sm text-slate-500 font-black uppercase tracking-[0.2em] mt-4 flex flex-wrap items-center justify-center gap-2">
          <span>Data Stream: <span className="text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">Optimized</span></span>
          <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
          <span>Latency: <span className="text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">24ms</span></span>
        </p>
      </div>
    </div>
  );
};

export default CricketMatch;

