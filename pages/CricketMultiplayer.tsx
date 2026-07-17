import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, getAuthHeaders } from '../services/mongoService';
import { getSocket } from '../services/socketService';

const CricketMultiplayer: React.FC = () => {
  const navigate = useNavigate();
  const session = JSON.parse(localStorage.getItem('user_session') || 'null');
  const [matches, setMatches] = useState<any[]>([]);
  const [activeMatch, setActiveMatch] = useState<any>(null);
  const [digit, setDigit] = useState('');
  const [msg, setMsg] = useState('');
  const token = localStorage.getItem('auth_token');

  const loadMatches = useCallback(async () => {
    try { const r = await fetch(`${API_BASE}/cricket-multiplayer`); if (r.ok) setMatches(await r.json()); } catch (_) {}
  }, []);

  useEffect(() => { loadMatches(); }, [loadMatches]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on('cricket:created', loadMatches);
    socket.on('cricket:started', (data: any) => { loadMatches(); setActiveMatch(data.match); });
    socket.on('cricket:update', (data: any) => { setActiveMatch(data.match); });
    socket.on('cricket:ended', (data: any) => { setMsg(`🏆 ${data.winner?.name || 'Player'} won!`); setTimeout(() => { setActiveMatch(null); loadMatches(); }, 3000); });
    return () => { socket.off('cricket:created', loadMatches); socket.off('cricket:started'); socket.off('cricket:update'); socket.off('cricket:ended'); };
  }, [loadMatches]);

  const createMatch = async () => {
    try {
      const r = await fetch(`${API_BASE}/cricket-multiplayer/create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: session?.name || 'Player' })
      });
      const d = await r.json();
      if (r.ok) { setMsg('✅ Match created! Waiting for opponent...'); loadMatches(); }
      else setMsg('❌ ' + (d.error || 'Failed'));
    } catch (e: any) { setMsg(e.message); }
  };

  const joinMatch = async (matchId: string) => {
    try {
      const r = await fetch(`${API_BASE}/cricket-multiplayer/${matchId}/join`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: session?.name || 'Player' })
      });
      const d = await r.json();
      if (r.ok) { setActiveMatch(d.match); const socket = getSocket(); if (socket) socket.emit('cricket:join', matchId); setMsg('✅ Joined match!'); }
      else setMsg('❌ ' + (d.error || 'Failed'));
    } catch (e: any) { setMsg(e.message); }
  };

  const playDigit = async () => {
    if (!digit || !activeMatch) return;
    const d = parseInt(digit);
    if (isNaN(d) || d < 0 || d > 9) { setMsg('Enter a digit 0-9'); return; }
    setMsg('');
    try {
      const r = await fetch(`${API_BASE}/cricket-multiplayer/${activeMatch.id}/play`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ digit: d })
      });
      const data = await r.json();
      if (r.ok) { setActiveMatch(data.match); if (data.match.status === 'completed') setMsg(`🏆 Match over!`); }
      else setMsg('❌ ' + (data.error || 'Failed'));
    } catch (e: any) { setMsg(e.message); }
    setDigit('');
  };

  const battingPlayer = activeMatch?.currentBatting === 1 ? activeMatch.player1 : activeMatch.player2;
  const isMyTurn = battingPlayer?.id === session?.id;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a] p-4 sm:p-6 overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-black text-white mb-2">🏏 Cricket Multiplayer</h1>
        <p className="text-sm text-white/40 mb-6">Play 1v1 cricket in real-time</p>
        {msg && <div className="text-sm text-center mb-4 font-bold text-white/80 bg-purple-500/10 p-3 rounded-xl border border-purple-500/20">{msg}</div>}

        {activeMatch ? (
          <div className="space-y-4">
            <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-4">
                <div className="text-center">
                  <p className="text-xs text-white/40">{activeMatch.player1?.name}</p>
                  <p className="text-3xl font-black text-white">{activeMatch.player1?.runs}/{activeMatch.player1?.wickets}</p>
                  <p className="text-xs text-white/40">({activeMatch.player1?.balls} balls)</p>
                </div>
                <span className="text-white/40 font-bold">vs</span>
                <div className="text-center">
                  <p className="text-xs text-white/40">{activeMatch.player2?.name}</p>
                  <p className="text-3xl font-black text-white">{activeMatch.player2?.runs}/{activeMatch.player2?.wickets}</p>
                  <p className="text-xs text-white/40">({activeMatch.player2?.balls} balls)</p>
                </div>
              </div>
              {activeMatch.status === 'active' && (
                <div className="text-center">
                  <p className="text-sm text-white/60 mb-2">Innings {activeMatch.innings} • {activeMatch.target > 0 ? `Target: ${activeMatch.target}` : 'Batting'}</p>
                  {isMyTurn ? (
                    <div className="flex items-center justify-center gap-3">
                      <input className="bg-[#161b22] border border-[#30363d] rounded-xl p-2.5 text-white text-sm w-20 text-center" type="number" min="0" max="9" placeholder="0-9" value={digit} onChange={e => setDigit(e.target.value)} onKeyDown={e => e.key === 'Enter' && playDigit()} />
                      <button onClick={playDigit} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm">🏏 Play!</button>
                    </div>
                  ) : <p className="text-amber-400 font-bold">⏳ Waiting for opponent...</p>}
                </div>
              )}
            </div>
            <button onClick={() => { setActiveMatch(null); loadMatches(); }} className="text-sm text-white/60 hover:text-white">← Back to matches</button>
          </div>
        ) : (
          <>
            <button onClick={createMatch} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-2xl text-sm mb-6">🏏 Create Match</button>
            {matches.length === 0 ? (
              <div className="text-center py-16 text-white/60">
                <p className="text-5xl mb-4">🏏</p>
                <p className="font-bold">No active matches</p>
                <p className="text-xs mt-2">Create one or wait for others</p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map(m => (
                  <div key={m.id} className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-bold">{m.player1?.name} <span className="text-white/40">vs</span> {m.player2?.name || 'Waiting...'}</p>
                        <p className="text-xs text-white/40">{m.innings ? `Innings ${m.innings}` : 'Not started'}</p>
                      </div>
                      {m.status === 'waiting' && session && m.player1?.id !== session.id && (
                        <button onClick={() => joinMatch(m.id)} className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-sm">Join</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CricketMultiplayer;
