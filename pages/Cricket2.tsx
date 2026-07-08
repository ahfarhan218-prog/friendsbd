import React, { useState, useEffect } from 'react';
import { COMMENTARY_MATRIX } from '../utils/commentary';

// --- Interfaces ---
interface MatchSetup {
  matchNo: string;
  venue: string;
  homeTeam: string;
  homeCaptain: string;
  homeOwner: string;
  awayTeam: string;
  awayCaptain: string;
  awayOwner: string;
  battingFirst: string;
  bowlingFirst: string;
  team1Batters: string[];
  team1Bowlers: string[];
  team2Batters: string[];
  team2Bowlers: string[];
}

interface GameState {
  innings: 1 | 2;
  runs: number;
  wickets: number;
  balls: number;
  target: number | null;
  batterName: string;
  batterRuns: number;
  bowlerName: string;
  bowlerRuns: number;
  bowlerBalls: number;
  bbcode: string;
  latestCommentary: string;
}

const Cricket2: React.FC = () => {
  const [phase, setPhase] = useState<'setup' | 'playing'>('setup');
  const [setup, setSetup] = useState<MatchSetup>({
    matchNo: '6', venue: 'Neutral', homeTeam: 'SCS', homeCaptain: 'Faruk', homeOwner: 'Nahian',
    awayTeam: 'QRK', awayCaptain: 'Hira', awayOwner: 'Rhetoric',
    battingFirst: 'QRK', bowlingFirst: 'SCS',
    team1Batters: ['', '', '', '', '', ''],
    team1Bowlers: ['', '', '', '', '', ''],
    team2Batters: ['', '', '', '', '', ''],
    team2Bowlers: ['', '', '', '', '', '']
  });

  const [gameState, setGameState] = useState<GameState>({
    innings: 1, runs: 0, wickets: 0, balls: 0, target: null,
    batterName: '', batterRuns: 0, bowlerName: '', bowlerRuns: 0, bowlerBalls: 0,
    bbcode: '', latestCommentary: ''
  });

  // Load state from local storage if exists
  useEffect(() => {
    const saved = localStorage.getItem('cricket2_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.setup) setSetup(parsed.setup);
        if (parsed.gameState) setGameState(parsed.gameState);
        if (parsed.phase) setPhase(parsed.phase);
      } catch (e) {}
    }
  }, []);

  const saveState = (newState: Partial<{setup: MatchSetup, gameState: GameState, phase: string}>) => {
    const combined = { setup, gameState, phase, ...newState };
    localStorage.setItem('cricket2_state', JSON.stringify(combined));
  };

  const startMatch = () => {
    const newGameState = {
      ...gameState,
      batterName: setup.team1Batters[0] || 'Batter 1',
      bowlerName: setup.team1Bowlers[0] || 'Bowler 1'
    };
    setGameState(newGameState);
    setPhase('playing');
    saveState({ phase: 'playing', gameState: newGameState });
  };

  // --- Handlers for Setup ---
  const handleSetupChange = (key: keyof MatchSetup, value: string) => {
    const newSetup = { ...setup, [key]: value };
    setSetup(newSetup);
    saveState({ setup: newSetup });
  };

  const handleArrayChange = (arrayKey: keyof MatchSetup, index: number, value: string) => {
    const arr = [...(setup[arrayKey] as string[])];
    arr[index] = value;
    const newSetup = { ...setup, [arrayKey]: arr };
    setSetup(newSetup);
    saveState({ setup: newSetup });
  };

  // --- Handlers for Playing ---
  const getCommentary = (runs: number, isOut: boolean) => {
    const matrix = isOut ? COMMENTARY_MATRIX.out : COMMENTARY_MATRIX.notOut;
    // Find closest bucket
    const buckets = Object.keys(matrix).map(Number).sort((a,b)=>a-b);
    let selectedBucket = 0;
    for (const b of buckets) {
      if (runs >= b) selectedBucket = b;
    }
    const comments = matrix[selectedBucket.toString() as keyof typeof matrix];
    if (!comments || comments.length === 0) return "দুর্দান্ত খেলা চলছে!";
    return comments[Math.floor(Math.random() * comments.length)];
  };

  const formatOvers = (totalBalls: number) => {
    const overs = Math.floor(totalBalls / 6);
    const balls = totalBalls % 6;
    return `${overs}.${balls}`;
  };

  const generateBBCode = (runsGained: number | 'W', state: GameState, comment: string) => {
    const battingTeam = state.innings === 1 ? setup.battingFirst : setup.bowlingFirst;
    const oversStr = formatOvers(state.balls);
    const crr = state.balls > 0 ? ((state.runs / state.balls) * 6).toFixed(2) : '0.00';
    const proj = state.balls > 0 ? Math.floor((state.runs / state.balls) * 30) : 0; // Assuming 5 overs match

    return `[b][big][center][clr=dodgerblue]SRCC | M-${setup.matchNo} | ${setup.homeTeam} vs ${setup.awayTeam}[/clr]
${state.innings === 1 ? '1st Innings' : '2nd Innings'}
[/center][/big][small][i][clr=silver]FortiBD.Com © 2026[/clr][/i][/small]
[b][center][big][clr=red]${battingTeam}: ${state.runs} / ${state.wickets}[/clr][/big]
Overs: ${oversStr}
[br/][ CRR: ${crr} RPO | [clr=grey]Projected Score: ${proj}[/clr] ]
[ref][/center]
Batter: [/b]@${state.batterName}@[b]
Bowler: [/b]@${state.bowlerName}@[b]
Post: [clr=red][big]${runsGained}[/big][/clr] Balls[/b]
Commentary: [clr=F39C12]${comment}[/clr]`;
  };

  const scoreBall = (runsGained: number, isWicket: boolean) => {
    const newRuns = gameState.runs + runsGained;
    const newWickets = gameState.wickets + (isWicket ? 1 : 0);
    const newBalls = gameState.balls + 1;
    const newBatterRuns = gameState.batterRuns + runsGained;
    
    const comment = getCommentary(newBatterRuns, isWicket);
    
    const newState = {
      ...gameState,
      runs: newRuns,
      wickets: newWickets,
      balls: newBalls,
      batterRuns: isWicket ? 0 : newBatterRuns,
      bowlerRuns: gameState.bowlerRuns + runsGained,
      bowlerBalls: gameState.bowlerBalls + 1,
      latestCommentary: comment
    };
    
    // Generate BBCode using the new state
    newState.bbcode = generateBBCode(isWicket ? 'W' : runsGained, newState, comment);
    
    setGameState(newState);
    saveState({ gameState: newState });
  };

  const copyBBCode = () => {
    navigator.clipboard.writeText(gameState.bbcode);
    alert('BBCode Copied!');
  };

  return (
    <div className="min-h-screen bg-transparent p-5 md:p-8 font-sans pb-32 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-[#30363d] gap-4">
        <div>
          <h1 className="text-3xl font-black text-white m-0 tracking-tight flex items-center gap-3 drop-shadow-md">
            <span className="text-4xl">🏏</span> 
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">Match Controller v2</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2 font-medium uppercase tracking-widest">
            {phase === 'setup' ? 'Setup Match Information' : 'Live Match Dashboard & BBCode Generator'}
          </p>
        </div>
        {phase === 'playing' && (
          <button 
            onClick={() => { setPhase('setup'); saveState({phase: 'setup'}) }} 
            className="bg-[#161b22]/80 backdrop-blur-md border border-[#30363d] px-5 py-2.5 rounded-xl text-white font-bold cursor-pointer hover:bg-white/10 transition-colors shadow-lg active:scale-95 flex items-center gap-2"
          >
            <span>⚙️</span> Edit Setup
          </button>
        )}
      </div>

      {phase === 'setup' && (
        <div className="setup-phase animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-[#090d16]/80 backdrop-blur-xl border border-[#30363d] rounded-[2rem] p-6 md:p-8 mb-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            
            <h3 className="text-sm font-black text-emerald-400 tracking-[0.15em] uppercase mb-6 flex items-center gap-2 relative z-10">
              <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></span>
              Match Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
              <InputBox label="Match No." val={setup.matchNo} onChange={v => handleSetupChange('matchNo', v)} />
              <InputBox label="Venue" val={setup.venue} onChange={v => handleSetupChange('venue', v)} />
              <InputBox label="Home Team" val={setup.homeTeam} onChange={v => handleSetupChange('homeTeam', v)} />
              <InputBox label="Away Team" val={setup.awayTeam} onChange={v => handleSetupChange('awayTeam', v)} />
              <InputBox label="Home Captain" val={setup.homeCaptain} onChange={v => handleSetupChange('homeCaptain', v)} />
              <InputBox label="Away Captain" val={setup.awayCaptain} onChange={v => handleSetupChange('awayCaptain', v)} />
              <InputBox label="Home Owner" val={setup.homeOwner} onChange={v => handleSetupChange('homeOwner', v)} />
              <InputBox label="Away Owner" val={setup.awayOwner} onChange={v => handleSetupChange('awayOwner', v)} />
              <InputBox label="1st Innings Bat" val={setup.battingFirst} onChange={v => handleSetupChange('battingFirst', v)} />
              <InputBox label="1st Innings Bowl" val={setup.bowlingFirst} onChange={v => handleSetupChange('bowlingFirst', v)} />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <TeamTable title="First Innings Batters" data={setup.team1Batters} onChange={(i, v) => handleArrayChange('team1Batters', i, v)} color="text-sky-400" borderColor="border-sky-500/30" />
            <TeamTable title="First Innings Bowlers" data={setup.team1Bowlers} onChange={(i, v) => handleArrayChange('team1Bowlers', i, v)} color="text-indigo-400" borderColor="border-indigo-500/30" hasBackup />
          </div>

          <div className="mt-10 flex justify-center">
            <button 
              onClick={startMatch} 
              className="bg-gradient-to-r from-emerald-600 to-teal-600 border border-emerald-400/50 px-10 py-4 rounded-2xl text-white font-black text-lg cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 uppercase tracking-widest"
            >
              <span className="text-2xl">🚀</span> Start Match
            </button>
          </div>
        </div>
      )}

      {phase === 'playing' && (
        <div className="playing-phase grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
          {/* Main Controls */}
          <div className="flex flex-col gap-6">
            <div className="bg-[#090d16]/90 backdrop-blur-xl border border-[#30363d] rounded-[2.5rem] p-8 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              <p className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-500 mb-2">CURRENT SCORE</p>
              <h2 className="text-6xl md:text-7xl font-black text-white m-0 mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                {gameState.runs} <span className="text-slate-600 text-5xl font-light mx-2">/</span> <span className="text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]">{gameState.wickets}</span>
              </h2>
              <div className="inline-block bg-slate-800/80 px-6 py-2 rounded-full border border-slate-700 shadow-inner">
                <span className="text-sm text-slate-400 font-bold uppercase tracking-widest mr-2">Overs</span>
                <span className="text-lg text-white font-black">{formatOvers(gameState.balls)}</span>
              </div>
            </div>

            {/* Current Players */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#161b22]/80 backdrop-blur-md border border-[#30363d] rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-sky-500/50 transition-colors">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-sky-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="text-xs text-sky-400 font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span>🏏</span> Current Batter
                </div>
                <input 
                  value={gameState.batterName} 
                  onChange={e => setGameState({...gameState, batterName: e.target.value})} 
                  className="w-full bg-[#090d16]/60 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-sky-500/50 transition-colors mb-3 shadow-inner"
                  placeholder="Batter Name"
                />
                <div className="text-sm text-slate-400 font-medium bg-slate-800/50 py-2 px-3 rounded-lg border border-slate-700/50">
                  Batter Runs: <strong className="text-white text-lg ml-2">{gameState.batterRuns}</strong>
                </div>
              </div>
              
              <div className="bg-[#161b22]/80 backdrop-blur-md border border-[#30363d] rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="text-xs text-indigo-400 font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span>🎯</span> Current Bowler
                </div>
                <input 
                  value={gameState.bowlerName} 
                  onChange={e => setGameState({...gameState, bowlerName: e.target.value})} 
                  className="w-full bg-[#090d16]/60 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-indigo-500/50 transition-colors mb-3 shadow-inner"
                  placeholder="Bowler Name"
                />
                <div className="text-sm text-slate-400 font-medium bg-slate-800/50 py-2 px-3 rounded-lg border border-slate-700/50">
                  Overs Bowled: <strong className="text-white text-lg ml-2">{formatOvers(gameState.bowlerBalls)}</strong>
                </div>
              </div>
            </div>

            {/* Score Actions */}
            <div className="bg-[#161b22]/80 backdrop-blur-xl border border-[#30363d] rounded-[2rem] p-6 shadow-xl">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Log Action</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:grid-cols-6 gap-3">
                {[0, 1, 2, 3, 4, 6].map(run => (
                  <button 
                    key={run} 
                    onClick={() => scoreBall(run, false)} 
                    className="bg-[#090d16] border border-slate-700 rounded-xl py-4 text-white text-2xl font-black cursor-pointer hover:bg-slate-800 hover:border-slate-500 transition-all active:scale-95 shadow-inner hover:shadow-lg"
                  >
                    {run}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <button 
                  onClick={() => scoreBall(0, true)} 
                  className="w-full bg-rose-600/20 border border-rose-500/50 rounded-xl py-4 text-rose-500 text-xl font-black cursor-pointer hover:bg-rose-600 hover:text-white transition-all active:scale-95 shadow-inner uppercase tracking-widest"
                >
                  Wicket
                </button>
              </div>
            </div>
          </div>

          {/* BBCode Output */}
          <div className="h-full">
            <div className="bg-[#161b22]/90 backdrop-blur-xl border border-[#30363d] rounded-[2rem] p-6 h-full flex flex-col shadow-2xl relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex justify-between items-center mb-4 relative z-10">
                <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest m-0 flex items-center gap-2">
                  <span className="text-lg">📋</span> BBCode Output
                </h3>
                <button 
                  onClick={copyBBCode} 
                  className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-4 py-2 rounded-lg font-bold text-xs cursor-pointer hover:bg-emerald-500 hover:text-white transition-all active:scale-95 uppercase tracking-wider"
                >
                  Copy
                </button>
              </div>
              <textarea 
                readOnly 
                value={gameState.bbcode}
                className="flex-1 bg-[#090d16] border border-slate-700/80 rounded-xl p-4 text-sky-300 text-xs font-mono resize-none outline-none focus:border-emerald-500/50 transition-colors shadow-inner relative z-10 w-full min-h-[300px] leading-relaxed"
              />
              {gameState.latestCommentary && (
                <div className="mt-4 p-4 bg-amber-900/20 border border-amber-500/30 rounded-xl text-xs text-amber-400 italic font-medium shadow-inner relative z-10 leading-relaxed">
                  <span className="text-sm not-italic mr-2">💬</span> {gameState.latestCommentary}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// --- Sub Components ---
const InputBox: React.FC<{label: string, val: string, onChange: (v:string)=>void}> = ({label, val, onChange}) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">{label}</label>
    <input 
      type="text" 
      value={val} 
      onChange={e => onChange(e.target.value)} 
      className="bg-[#090d16]/80 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-semibold outline-none focus:border-emerald-500/50 transition-colors shadow-inner w-full"
    />
  </div>
);

const TeamTable: React.FC<{ title: string, data: string[], onChange: (i:number, v:string)=>void, color: string, borderColor: string, hasBackup?: boolean }> = ({ title, data, onChange, color, borderColor, hasBackup }) => (
  <div className="flex-1 bg-[#161b22]/80 backdrop-blur-md border border-[#30363d] rounded-2xl overflow-hidden shadow-xl">
    <div className={`px-5 py-4 bg-[#090d16] border-b ${borderColor} text-sm font-black ${color} uppercase tracking-widest`}>
      {title}
    </div>
    <div className="p-5 space-y-3">
      {data.map((player, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-6 text-xs text-slate-500 font-black flex items-center justify-center shrink-0">{i + 1}</span>
          <input 
            type="text" 
            value={player} 
            onChange={e => onChange(i, e.target.value)} 
            placeholder={`Player ${i + 1}`} 
            className="flex-1 bg-[#090d16]/60 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm font-semibold outline-none focus:border-slate-400 transition-colors shadow-inner"
          />
        </div>
      ))}
      {hasBackup && (
        <div className="flex items-center gap-3 mt-5 pt-5 border-t border-slate-700/50">
          <span className="w-6 text-xs text-amber-500 font-black flex items-center justify-center shrink-0">B</span>
          <input 
            type="text" 
            placeholder="Backup Player" 
            className="flex-1 bg-amber-900/10 border border-amber-500/30 rounded-lg px-3 py-2.5 text-white text-sm font-semibold outline-none focus:border-amber-500/60 transition-colors shadow-inner"
          />
        </div>
      )}
    </div>
  </div>
);

export default Cricket2;

