import React from 'react';
import { MatchState } from '../types';

export const MatchScoreboard: React.FC<{ matchData: MatchState }> = ({ matchData }) => {
  // Graceful fallback during schema migrations
  const teamA = matchData.battingTeam || 'Team A';
  const teamB = matchData.bowlingTeam || 'Team B';
  const scoreA = matchData.scores?.[teamA] || { runs: 0, wickets: 0, ballsBowled: 0, extras: 0, oversBowled: 0 };
  const scoreB = matchData.scores?.[teamB] || { runs: 0, wickets: 0, ballsBowled: 0, extras: 0, oversBowled: 0 };
  
  const latestLog = matchData.logs && matchData.logs.length > 0 
    ? matchData.logs[matchData.logs.length - 1] 
    : null;

  return (
    <div className="bg-slate-900 text-white rounded-xl p-4 mb-4 shadow-xl border border-slate-700 font-mono relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600 rounded-full blur-3xl opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600 rounded-full blur-3xl opacity-20 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-center border-b border-slate-700 pb-3 mb-3">
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest flex flex-wrap items-center gap-2">
            {matchData.status === 'LIVE' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
            {matchData.status === 'WAITING' && <span className="w-2 h-2 rounded-full bg-yellow-500" />}
            {matchData.status === 'COMPLETED' && <span className="w-2 h-2 rounded-full bg-green-500" />}
            {matchData.status} MATCH
          </span>
          <span className="text-sm font-bold text-purple-400 uppercase bg-purple-900/30 px-2 py-1 rounded-md border border-purple-800/50">
            INNINGS {matchData.innings || 1}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-center">
          <div className="text-center">
            <h3 className="text-sm font-bold text-slate-300 truncate">{teamA}</h3>
            <div className="text-2xl font-black mt-1">
              {scoreA.runs}/{scoreA.wickets}
            </div>
            <div className="text-sm text-slate-400 mt-1">
              {scoreA.oversBowled}.{scoreA.ballsBowled} Overs
            </div>
          </div>
          
          <div className="text-center flex flex-col items-center justify-center">
            <div className="text-sm font-black text-slate-500 italic mb-2">VS</div>
            <div className="text-xs sm:text-sm uppercase font-bold text-yellow-400 bg-yellow-900/30 px-2 py-0.5 rounded border border-yellow-700">
              {matchData.battingTeam} Batting
            </div>
          </div>
          
          <div className="text-center">
            <h3 className="text-sm font-bold text-slate-300 truncate">{teamB}</h3>
            <div className="text-2xl font-black mt-1">
              {scoreB.runs}/{scoreB.wickets}
            </div>
            <div className="text-sm text-slate-400 mt-1">
              {scoreB.oversBowled}.{scoreB.ballsBowled} Overs
            </div>
          </div>
        </div>

        {latestLog && (
          <div className="mt-4 pt-3 border-t border-slate-700/50">
            <p className="text-sm text-slate-400 mb-1 font-bold uppercase tracking-wider">Latest Action</p>
            <p className="text-sm text-green-400 bg-green-900/20 px-3 py-2 rounded-lg border border-green-800/30">
              {latestLog.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

