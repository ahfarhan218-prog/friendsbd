import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../services/mongoService';
import { getSocket } from '../services/socketService';

const ClanWars: React.FC = () => {
  const [wars, setWars] = useState<any[]>([]);
  const [clans, setClans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const session = JSON.parse(localStorage.getItem('user_session') || 'null');
  const [selectedClan1, setSelectedClan1] = useState('');
  const [selectedClan2, setSelectedClan2] = useState('');
  const [warType, setWarType] = useState('cricket');
  const [msg, setMsg] = useState('');

  const loadWars = useCallback(async () => {
    try { const r = await fetch(`${API_BASE}/clan-wars`); if (r.ok) setWars(await r.json()); } catch (_) {}
    finally { setLoading(false); }
  }, []);

  const loadClans = useCallback(async () => {
    try { const r = await fetch(`${API_BASE}/clan`); if (r.ok) setClans(await r.json()); } catch (_) {}
  }, []);

  useEffect(() => { loadWars(); loadClans(); }, [loadWars, loadClans]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('clanwar:join', 'global');
    const onUpdate = () => loadWars();
    socket.on('clanwar:declared', onUpdate);
    socket.on('clanwar:started', onUpdate);
    socket.on('clanwar:score', onUpdate);
    socket.on('clanwar:ended', onUpdate);
    return () => { socket.off('clanwar:declared', onUpdate); socket.off('clanwar:started', onUpdate); socket.off('clanwar:score', onUpdate); socket.off('clanwar:ended', onUpdate); };
  }, [loadWars]);

  const declareWar = async () => {
    if (!selectedClan1 || !selectedClan2) return;
    setMsg('');
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetch(`${API_BASE}/clan-wars/declare`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ clanId1: selectedClan1, clanId2: selectedClan2, type: warType })
      });
      const d = await r.json();
      if (r.ok) { setMsg('⚔️ War declared!'); loadWars(); }
      else setMsg('❌ ' + (d.error || 'Failed'));
    } catch (e: any) { setMsg('❌ ' + e.message); }
  };

  const acceptWar = async (warId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetch(`${API_BASE}/clan-wars/${warId}/accept`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      if (r.ok) { setMsg('✅ War accepted!'); loadWars(); }
      else { const d = await r.json(); setMsg('❌ ' + (d.error || 'Failed')); }
    } catch (e: any) { setMsg('❌ ' + e.message); }
  };

  const endWar = async (warId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetch(`${API_BASE}/clan-wars/${warId}/end`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      if (r.ok) { setMsg('🏁 War ended!'); loadWars(); }
      else { const d = await r.json(); setMsg('❌ ' + (d.error || 'Failed')); }
    } catch (e: any) { setMsg('❌ ' + e.message); }
  };

  const userClan = clans.find(c => c.members?.some((m: any) => m.userId === session?.id));
  const isLeader = userClan && userClan.members?.some((m: any) => m.userId === session?.id && (m.role === 'leader' || m.role === 'co-leader'));

  if (loading) return <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center"><div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-black text-white mb-2">⚔️ Clan Wars</h1>
        <p className="text-sm text-white/40 mb-6">Challenge rival clans to battle</p>

        {msg && <div className="text-sm text-center mb-4 font-bold text-white/80 bg-purple-500/10 p-3 rounded-xl border border-purple-500/20">{msg}</div>}

        {isLeader && (
          <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-5 mb-6 space-y-3">
            <h3 className="font-bold text-white">⚔️ Declare War</h3>
            <div className="flex flex-wrap gap-3">
              <select className="flex-1 bg-[#161b22] border border-[#30363d] rounded-xl p-2.5 text-white text-sm" value={selectedClan1} onChange={e => setSelectedClan1(e.target.value)}>
                <option value="">Your Clan</option>
                {clans.filter(c => c.members?.some((m: any) => m.userId === session?.id)).map(c => <option key={c.id} value={c.id}>{c.name} [{c.tag}]</option>)}
              </select>
              <select className="flex-1 bg-[#161b22] border border-[#30363d] rounded-xl p-2.5 text-white text-sm" value={selectedClan2} onChange={e => setSelectedClan2(e.target.value)}>
                <option value="">Target Clan</option>
                {clans.filter(c => c.id !== selectedClan1).map(c => <option key={c.id} value={c.id}>{c.name} [{c.tag}]</option>)}
              </select>
              <select className="bg-[#161b22] border border-[#30363d] rounded-xl p-2.5 text-white text-sm" value={warType} onChange={e => setWarType(e.target.value)}>
                <option value="cricket">🏏 Cricket</option>
                <option value="quiz">🧠 Quiz</option>
                <option value="coin_grab">💰 Coin Grab</option>
              </select>
              <button onClick={declareWar} className="bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm">Declare War!</button>
            </div>
          </div>
        )}

        {wars.length === 0 ? (
          <div className="text-center py-20 text-white/60">
            <p className="text-5xl mb-4">⚔️</p>
            <p className="font-bold">No clan wars yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {wars.map(w => {
              const amLeader = userClan && (w.clanId1 === userClan.id || w.clanId2 === userClan.id) && isLeader;
              const canAccept = w.status === 'pending' && w.clanId2 === userClan?.id && amLeader;
              return (
                <div key={w.id} className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-white">{w.clanName1}</span>
                      <span className="text-sm text-white/40">vs</span>
                      <span className="text-lg font-black text-white">{w.clanName2}</span>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${w.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : w.status === 'completed' ? 'bg-slate-500/10 text-slate-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {w.status === 'active' ? '🔴 LIVE' : w.status === 'completed' ? '✅ Done' : '⏳ Pending'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-white/60">🎯 {w.type}</span>
                    {w.status === 'active' && (
                      <span className="text-white font-bold">{w.score1} - {w.score2}</span>
                    )}
                    {w.winnerId && (
                      <span className="text-amber-400 font-bold">🏆 {w.winnerId === w.clanId1 ? w.clanName1 : w.clanName2} Won!</span>
                    )}
                  </div>
                  {canAccept && <button onClick={() => acceptWar(w.id)} className="mt-3 bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-sm">Accept War</button>}
                  {w.status === 'active' && amLeader && <button onClick={() => endWar(w.id)} className="mt-3 ml-2 bg-slate-600 text-white font-bold px-4 py-2 rounded-xl text-sm">End War</button>}
                </div>
              );
            })}
          </div>
        )}
        <style>{pfStyles}</style>
      </div>
    </div>
  );
};

const pfStyles = `
  .pf-card { background:#1C1C2E; border:1px solid rgba(255,255,255,0.06); border-radius:20px; transition:all .3s; }
  .pf-card:hover { border-color:rgba(168,85,247,0.15); }
  .pf-input { background:rgba(22,27,34,0.8); border:1px solid #30363d; border-radius:12px; padding:10px 14px; color:#fff; font-size:0.85rem; outline:none; transition:all .3s; }
  .pf-input:focus { border-color:#a78bfa; }
  .pf-btn { padding:8px 20px; border-radius:12px; font-weight:700; font-size:0.75rem; border:none; cursor:pointer; transition:all .3s; }
  .pf-btn-primary { background:linear-gradient(135deg,#7c3aed,#a855f7); color:#fff; }
  .pf-btn-primary:hover { transform:translateY(-1px); box-shadow:0 8px 25px rgba(124,58,237,0.3); }
`;
export default ClanWars;
