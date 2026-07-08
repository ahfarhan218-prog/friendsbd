import React, { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../services/mongoService';
import { MatchState } from '../types';
import { MatchScoreboard } from '../components/MatchScoreboard';
import { MatchGameControls } from '../components/MatchGameControls';
import { matchService } from '../services/matchService';
import { useOutletContext } from 'react-router-dom';
import { User } from '../types';

const TournamentDashboard: React.FC = () => {
  const { currentUser } = useOutletContext<{ currentUser: User | null }>();
  const [matches, setMatches] = useState<MatchState[]>([]);
  const [loading, setLoading] = useState(true);
  const activeRef = useRef(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch(`${API_BASE}/matches`);
        if (activeRef.current) {
          const data = await res.json();
          setMatches(data);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Failed to fetch matches:', err);
        if (activeRef.current) setLoading(false);
      }
    };

    fetchMatches();
    const interval = setInterval(fetchMatches, 5000);
    return () => {
      activeRef.current = false;
      clearInterval(interval);
    };
  }, []);

  const handleCreateMatch = async () => {
    const topicId = prompt('Enter the Forum Topic ID for this match:');
    if (!topicId) return;
    const teamA = prompt('Enter Team A Name:');
    const teamB = prompt('Enter Team B Name:');
    if (teamA && teamB) {
      await matchService.createMatch(topicId, teamA, teamB);
      alert('Match created successfully!');
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-[#e1e1e1] font-sans antialiased pb-32">
      <header className="pt-10 pb-6 px-3 sm:px-6 border-b border-[#1f293d]/50 bg-slate-950/20 backdrop-blur-md relative overflow-hidden">
        <div className="max-w-full max-w-5xl mx-auto px-4 sm:px-6 mx-auto flex justify-between items-center relative z-10">
          <div>
            <span className="text-xs sm:text-sm font-black text-indigo-400 uppercase tracking-[0.3em] block mb-1">Official Game</span>
            <h1 className="text-2xl font-black text-white tracking-tight">Forum Cricket Tournament</h1>
          </div>
          <button 
            onClick={handleCreateMatch}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold text-sm uppercase tracking-wider transition-all shadow-lg"
          >
            + New Match
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none" />
      </header>

      <main className="max-w-full max-w-5xl mx-auto px-4 sm:px-6 mx-auto px-3 sm:px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20 bg-[#121824] rounded-3xl border border-[#1f293d]">
            <span className="text-5xl block mb-4">🏏</span>
            <h3 className="text-lg font-bold text-white mb-2">No Active Matches</h3>
            <p className="text-slate-400 text-sm">Create a new match to get started.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {matches.map(match => (
              <div key={match.id} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[1.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                <div className="relative">
                  <MatchScoreboard matchData={match} />
                  <div className="mt-4">
                    <MatchGameControls matchData={match} currentUser={currentUser} />
                  </div>
                  <div className="absolute bottom-4 right-4 flex flex-wrap gap-2">
                    <a href={`/forum/topic/${match.topicId}`} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sm font-bold text-white uppercase tracking-wider rounded-lg transition-colors border border-slate-600">
                      Go to Topic ➜
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TournamentDashboard;

