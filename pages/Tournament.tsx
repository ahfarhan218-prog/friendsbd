
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Match = {
  id: string;
  team1: string;
  team2: string;
  winner?: string;
};

type BracketData = {
  round1: Match[];
  round2: Match[];
  round3: Match[];
};

const Tournament: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'overview' | 'schedule' | 'standings' | 'bracket'>('bracket');

  // Initial Bracket State
  const [bracket, setBracket] = useState<BracketData>({
    round1: [
      { id: 'r1m1', team1: 'Warriors XI', team2: 'Thunder Kings' },
      { id: 'r1m2', team1: 'Royal Strikers', team2: 'Phoenix Blasters' },
      { id: 'r1m3', team1: 'Dhaka Dynamites', team2: 'Sylhet Strikers' },
      { id: 'r1m4', team1: 'Comilla Victorians', team2: 'Khulna Tigers' },
    ],
    round2: [
      { id: 'r2m1', team1: 'TBD', team2: 'TBD' },
      { id: 'r2m2', team1: 'TBD', team2: 'TBD' },
    ],
    round3: [
      { id: 'r3m1', team1: 'TBD', team2: 'TBD' },
    ],
  });

  const handleSelectWinner = (roundKey: keyof BracketData, matchIndex: number, team: string) => {
    if (team === 'TBD') return;

    const newBracket = { ...bracket };
    newBracket[roundKey][matchIndex].winner = team;

    // Advance to next round logic
    if (roundKey === 'round1') {
      const nextMatchIdx = Math.floor(matchIndex / 2);
      const isTeam1 = matchIndex % 2 === 0;
      if (isTeam1) {
        newBracket.round2[nextMatchIdx].team1 = team;
      } else {
        newBracket.round2[nextMatchIdx].team2 = team;
      }
      // Reset winner of next round if it was previously set
      newBracket.round2[nextMatchIdx].winner = undefined;
      newBracket.round3[0].winner = undefined;
      newBracket.round3[0].team1 = 'TBD';
      newBracket.round3[0].team2 = 'TBD';
    } else if (roundKey === 'round2') {
      const isTeam1 = matchIndex === 0;
      if (isTeam1) {
        newBracket.round3[0].team1 = team;
      } else {
        newBracket.round3[0].team2 = team;
      }
      newBracket.round3[0].winner = undefined;
    }

    setBracket(newBracket);
  };

  const renderMatch = (roundKey: keyof BracketData, match: Match, index: number, isFinal: boolean = false) => (
    <div key={match.id} className="relative py-6 z-10">
      <div className={`rounded-2xl shadow-lg border overflow-hidden w-44 transition-all duration-300 ${isFinal ? 'bg-gradient-to-br from-amber-600/80 to-orange-900/80 border-amber-500/50 backdrop-blur-md' : 'bg-[#090d16]/90 border-[#30363d] backdrop-blur-sm'}`}>
        <div 
          onClick={() => handleSelectWinner(roundKey, index, match.team1)}
          className={`px-4 py-3 text-[11px] font-black border-b border-[#30363d] flex justify-between items-center transition-all cursor-pointer h-12 ${
            match.winner === match.team1 
            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-inner border-b-transparent' 
            : match.team1 === 'TBD' ? 'bg-[#0f172a]/50 text-slate-500' : 'text-slate-200 hover:bg-white/5 hover:text-white'
          }`}
        >
          <span className="truncate pr-2">{match.team1}</span>
          {match.winner === match.team1 && <span className="drop-shadow-md">✔️</span>}
        </div>
        <div 
          onClick={() => handleSelectWinner(roundKey, index, match.team2)}
          className={`px-4 py-3 text-[11px] font-black flex justify-between items-center transition-all cursor-pointer h-12 ${
            match.winner === match.team2 
            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-inner' 
            : match.team2 === 'TBD' ? 'bg-[#0f172a]/50 text-slate-500' : 'text-slate-200 hover:bg-white/5 hover:text-white'
          }`}
        >
          <span className="truncate pr-2">{match.team2}</span>
          {match.winner === match.team2 && <span className="drop-shadow-md">✔️</span>}
        </div>
      </div>
      
      {/* Connectors for Non-Final rounds */}
      {!isFinal && (
        <div className={`absolute -right-8 top-1/2 -translate-y-1/2 w-8 border-t-2 ${match.winner ? 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'border-[#30363d]'}`}></div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent pb-32">
      <header className="relative bg-[#090d16]/80 backdrop-blur-xl border-b border-[#30363d] p-6 pt-12 pb-24 rounded-b-[4rem] shadow-xl overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 p-32 bg-purple-600/10 rounded-full blur-3xl -ml-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 right-0 p-24 bg-pink-500/10 rounded-full blur-2xl -mr-16 pointer-events-none" />
        
            <div className="relative z-10 flex items-center justify-between flex-wrap gap-3">
           <div className="flex items-center gap-4">
             <button onClick={() => navigate(-1)} className="p-3 bg-white/5 rounded-2xl active:scale-90 border border-white/10 hover:bg-white/10 transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
             </button>
             <div>
               <h2 className="text-2xl font-black italic tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 drop-shadow-[0_0_10px_rgba(192,38,211,0.3)]">Tournaments</h2>
               <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Competitive Arena</p>
             </div>
           </div>
           <div className="text-3xl drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">🏆</div>
        </div>
      </header>

      <div className="px-5 -mt-16 flex flex-col gap-6 mb-24 relative z-10 max-w-lg mx-auto">
        {/* Promo Card */}
        <div className="bg-gradient-to-br from-purple-700 to-pink-800 rounded-[3rem] p-8 shadow-[0_0_30px_rgba(192,38,211,0.3)] text-center relative overflow-hidden border border-pink-500/30">
           <div className="absolute top-4 right-1/2 translate-x-1/2 flex items-center gap-2 bg-red-600/80 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-400/50 shadow-[0_0_15px_rgba(220,38,38,0.5)]">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]"></span>
              Live Now
           </div>
           <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
           
           <div className="mt-6 relative z-10">
              <h3 className="text-2xl font-black mb-2 flex flex-col items-center justify-center gap-2 uppercase italic leading-tight text-white drop-shadow-md">
                 <span>🏏 Super Over League</span>
                 <span className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)] text-lg">SEASON 1</span>
              </h3>
              <p className="text-[10px] text-pink-100 font-medium leading-relaxed max-w-[240px] mx-auto mt-4 px-4 bg-black/20 rounded-2xl py-3 border border-white/10 backdrop-blur-sm">
                 Tap on a team to advance them through the bracket. Experience the journey to glory!
              </p>
           </div>
        </div>

        {/* Tabs */}
        <div className="bg-[#161b22]/80 backdrop-blur-xl p-2 rounded-[2rem] shadow-xl border border-[#30363d] grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-2">
           {(['overview', 'schedule', 'standings', 'bracket'] as const).map((t) => (
             <button
               key={t}
               onClick={() => setTab(t)}
               className={`py-3 rounded-[1.5rem] text-[9px] font-black transition-all uppercase tracking-widest ${
                 tab === t 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_15px_rgba(192,38,211,0.4)] border border-pink-500/50' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
               }`}
             >
               {t}
             </button>
           ))}
        </div>

        {/* Bracket Content */}
        {tab === 'bracket' && (
          <div className="bg-[#161b22]/80 backdrop-blur-xl rounded-[3rem] p-6 pt-10 shadow-xl border border-[#30363d] overflow-x-auto no-scrollbar relative min-h-[600px]">
             <div className="flex items-center gap-3 text-purple-400 font-black text-[10px] uppercase tracking-[0.2em] mb-12 bg-purple-900/30 w-fit px-5 py-2 rounded-full border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                <span className="text-xl">📊</span> Knockout Stage
             </div>

             <div className="flex gap-12 min-w-[700px] py-4 relative">
                {/* Round 1: Quarter Finals */}
                <div className="flex flex-col justify-between gap-4 relative">
                   <p className="text-[9px] font-black text-purple-400 uppercase tracking-[0.2em] text-center mb-6 bg-[#0f172a] py-2 rounded-full border border-purple-500/20 shadow-inner">Quarter Finals</p>
                   <div className="flex flex-col gap-8">
                    {bracket.round1.map((m, i) => (
                      <div key={m.id} className="relative">
                        {renderMatch('round1', m, i)}
                        {/* Bracket tree lines */}
                        {i % 2 === 0 ? (
                          <div className="absolute -right-8 top-1/2 w-8 h-12 border-r-2 border-t-2 border-[#30363d] rounded-tr-xl"></div>
                        ) : (
                          <div className="absolute -right-8 bottom-1/2 w-8 h-12 border-r-2 border-b-2 border-[#30363d] rounded-br-xl"></div>
                        )}
                      </div>
                    ))}
                   </div>
                </div>

                {/* Round 2: Semi Finals */}
                <div className="flex flex-col justify-around relative">
                   <p className="text-[9px] font-black text-purple-400 uppercase tracking-[0.2em] text-center mb-6 bg-[#0f172a] py-2 rounded-full border border-purple-500/20 shadow-inner">Semi Finals</p>
                   <div className="flex flex-col justify-around h-full gap-24">
                    {bracket.round2.map((m, i) => (
                      <div key={m.id} className="relative">
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 border-t-2 border-[#30363d]"></div>
                        {renderMatch('round2', m, i)}
                        {/* Bracket tree lines */}
                        {i === 0 ? (
                          <div className="absolute -right-8 top-1/2 w-8 h-24 border-r-2 border-t-2 border-[#30363d] rounded-tr-2xl"></div>
                        ) : (
                          <div className="absolute -right-8 bottom-1/2 w-8 h-24 border-r-2 border-b-2 border-[#30363d] rounded-br-2xl"></div>
                        )}
                      </div>
                    ))}
                   </div>
                </div>

                {/* Round 3: Finals */}
                <div className="flex flex-col justify-center relative">
                   <p className="text-[9px] font-black text-amber-400 uppercase tracking-[0.2em] text-center mb-6 bg-[#1e1b4b] py-2 rounded-full border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">Grand Finale</p>
                   <div className="flex flex-col justify-center h-full">
                    {bracket.round3.map((m, i) => (
                      <div key={m.id} className="relative">
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 border-t-2 border-[#30363d]"></div>
                        
                        {/* Winner Spotlight Decoration */}
                        {m.winner && (
                          <div className="absolute -top-24 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-20">
                             <div className="w-16 h-16 bg-gradient-to-br from-amber-300 to-amber-600 rounded-full flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(245,158,11,0.6)] border-4 border-[#161b22]">🏆</div>
                             <span className="text-[8px] font-black text-amber-200 uppercase mt-3 tracking-[0.2em] bg-amber-900/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-amber-500/50 shadow-lg">Season Champion</span>
                          </div>
                        )}
                        
                        {renderMatch('round3', m, i, true)}
                        
                        {/* Winner label inside match card if applicable */}
                        {m.winner && (
                          <div className="absolute -bottom-12 left-0 right-0 text-center">
                             <p className="text-[11px] font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 uppercase tracking-widest drop-shadow-md">{m.winner} Wins!</p>
                          </div>
                        )}
                      </div>
                    ))}
                   </div>
                </div>
             </div>
             
             <div className="mt-20 p-6 bg-[#0f172a] rounded-[2rem] border border-[#30363d] flex items-center gap-5 shadow-inner">
               <div className="w-12 h-12 shrink-0 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(99,102,241,0.2)]">💡</div>
               <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic pr-2">
                 Click on a participating team to declare them the winner of their current match. 
                 The bracket will automatically update and advance the winner to the next round.
               </p>
             </div>
          </div>
        )}

        {/* Other Tabs content */}
        {tab === 'schedule' && (
          <div className="bg-[#161b22]/80 backdrop-blur-xl rounded-[3rem] p-8 shadow-xl border border-[#30363d] space-y-6">
             <div className="flex items-center gap-3 text-purple-400 font-black text-[10px] uppercase tracking-[0.2em] mb-6 bg-purple-900/30 w-fit px-5 py-2 rounded-full border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                <span className="text-xl">📅</span> Full Schedule
             </div>
             {[1, 2, 3].map(i => (
               <div key={i} className="bg-[#090d16]/80 p-5 rounded-[2rem] border border-[#30363d] shadow-inner flex items-center justify-between group hover:border-purple-500/50 transition-colors">
                 <div>
                   <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">Match #{i+5}</p>
                   <p className="text-sm font-black text-white italic tracking-tight">TBD vs TBD</p>
                   <p className="text-[9px] text-slate-500 font-bold mt-2 uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full inline-block"></span> Stadium Dhaka • Jan 2{i+5}, 2026
                   </p>
                 </div>
                 <div className="bg-purple-900/20 px-4 py-2 rounded-2xl text-[9px] font-black text-purple-300 border border-purple-500/20 uppercase tracking-[0.2em] shadow-sm">Upcoming</div>
               </div>
             ))}
          </div>
        )}

        {tab === 'overview' && (
          <div className="bg-[#161b22]/80 backdrop-blur-xl rounded-[3rem] p-8 shadow-xl border border-[#30363d]">
             <div className="space-y-6">
                <div className="flex items-center gap-4 mb-4 bg-[#090d16]/80 p-5 rounded-[2rem] border border-[#30363d]">
                   <div className="w-14 h-14 rounded-[1.5rem] bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(245,158,11,0.2)]">💰</div>
                   <div>
                      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Prize Pool</h4>
                      <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 italic tracking-tighter">50,000 COINS</p>
                   </div>
                </div>
                <div className="p-6 bg-indigo-900/20 rounded-[2rem] border border-indigo-500/20 shadow-inner">
                   <h5 className="text-[10px] font-black text-indigo-400 uppercase mb-4 tracking-[0.2em] flex items-center gap-3">
                     <span className="text-xl">📜</span> Rules & Format
                   </h5>
                   <ul className="space-y-4 pl-1">
                      <li className="text-[11px] font-medium text-slate-300 flex items-center gap-4">
                         <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-[10px] text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)]">1</div>
                         Single elimination knockout format
                      </li>
                      <li className="text-[11px] font-medium text-slate-300 flex items-center gap-4">
                         <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-[10px] text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)]">2</div>
                         6 Over Super matches (Virtual)
                      </li>
                      <li className="text-[11px] font-medium text-slate-300 flex items-center gap-4">
                         <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-[10px] text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)]">3</div>
                         Grand Finals on Sunday, Jan 28
                      </li>
                   </ul>
                </div>
                <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black py-5 rounded-[2rem] shadow-[0_0_20px_rgba(99,102,241,0.3)] uppercase text-[10px] tracking-[0.2em] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all border border-purple-400/30">
                   Register My Team
                </button>
             </div>
          </div>
        )}

        {tab === 'standings' && (
           <div className="bg-[#161b22]/80 backdrop-blur-xl rounded-[3rem] p-8 shadow-xl border border-[#30363d]">
              <div className="flex items-center justify-between mb-8 px-2">
                 <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] flex items-center gap-3">
                    <span className="text-xl">🏆</span> Team Rankings
                 </h4>
                 <span className="text-[8px] font-black text-slate-300 bg-white/10 px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/5 backdrop-blur-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                    Live
                 </span>
              </div>
              <div className="space-y-4">
                 {[
                   { name: 'Warriors XI', w: 6, l: 0, pts: 120 },
                   { name: 'Dhaka Dynamites', w: 5, l: 1, pts: 100 },
                   { name: 'Royal Strikers', w: 4, l: 2, pts: 80 },
                   { name: 'Sylhet Strikers', w: 3, l: 3, pts: 60 }
                 ].map((team, idx) => (
                   <div key={idx} className="flex items-center justify-between p-5 bg-[#090d16]/80 rounded-[2rem] border border-[#30363d] shadow-inner hover:border-purple-500/30 transition-colors group">
                      <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-[11px] font-black text-white shadow-lg ${
                            idx === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 border border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                            : (idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 border border-slate-300' 
                            : (idx === 2 ? 'bg-gradient-to-br from-amber-700 to-orange-900 border border-amber-800' 
                            : 'bg-white/10 border border-white/5 text-slate-400'))
                         }`}>
                           #{idx + 1}
                         </div>
                         <div>
                            <p className="text-xs font-black text-white italic tracking-tighter group-hover:text-purple-300 transition-colors">{team.name}</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">W: <span className="text-emerald-400">{team.w}</span> | L: <span className="text-rose-400">{team.l}</span></p>
                         </div>
                      </div>
                      <div className="bg-purple-900/30 px-4 py-2 rounded-xl border border-purple-500/20 flex flex-col items-center">
                         <span className="text-[12px] font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">{team.pts}</span>
                         <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">PTS</span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default Tournament;

