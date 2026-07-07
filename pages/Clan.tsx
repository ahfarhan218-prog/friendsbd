import React, { useState, useEffect } from 'react';
import { API_BASE } from '../services/mongoService';

const Clan: React.FC = () => {
  const [clans, setClans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const session = JSON.parse(localStorage.getItem('user_session') || 'null');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', tag: '', description: '' });

  const loadClans = async () => {
    try { const r = await fetch(`${API_BASE}/clan`); if (r.ok) setClans(await r.json()); } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadClans(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.tag || !session) return;
    try {
      await fetch(`${API_BASE}/clan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, leaderId: session.id, leaderName: session.name }) });
      setShowCreate(false); setForm({ name: '', tag: '', description: '' }); loadClans();
    } catch (e) { console.warn(e); }
  };

  const handleJoin = async (clanId: string) => {
    if (!session) return;
    try { await fetch(`${API_BASE}/clan/${clanId}/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: session.id, userName: session.name }) }); loadClans(); } catch (e) { console.warn(e); }
  };

  const handleLeave = async (clanId: string) => {
    if (!session) return;
    try { await fetch(`${API_BASE}/clan/${clanId}/leave`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: session.id }) }); loadClans(); } catch (e) { console.warn(e); }
  };

  const isMember = (c: any) => c.members?.some((m: any) => m.userId === session?.id);

  if (loading) return <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center"><div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a] p-4 sm:p-6 overflow-x-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">⚔️ Clans</h1>
            <p className="text-sm text-white/40 mt-1">Join or create a clan</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)} className="pf-btn pf-btn-primary">{showCreate ? 'Cancel' : '+ Create Clan'}</button>
        </div>

        {showCreate && (
          <div className="pf-card p-5 mb-6 space-y-3">
            <input className="pf-input w-full" placeholder="Clan name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input className="pf-input w-full" placeholder="Tag (e.g. FBD)" maxLength={5} value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })} />
            <input className="pf-input w-full" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <button onClick={handleCreate} className="pf-btn pf-btn-primary w-full">Create Clan</button>
          </div>
        )}

        {clans.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <p className="text-5xl mb-4">⚔️</p>
            <p className="font-bold">No clans yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {clans.map(c => (
              <div key={c.id} className="pf-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-black text-white">{c.name}</h3>
                    <span className="text-[10px] font-bold text-purple-400 px-2 py-1 rounded-full bg-purple-500/10">[{c.tag}]</span>
                  </div>
                  <span className="text-xs text-white/30">Lv.{c.level}</span>
                </div>
                <p className="text-sm text-white/50 mb-3">{c.description || 'No description'}</p>
                <div className="flex items-center justify-between text-xs text-white/30 mb-3">
                  <span>👥 {c.members?.length || 0} members</span>
                  <span>👑 {c.leaderName}</span>
                </div>
                {session && (
                  isMember(c)
                    ? <button onClick={() => handleLeave(c.id)} className="pf-btn pf-btn-ghost w-full">Leave Clan</button>
                    : <button onClick={() => handleJoin(c.id)} className="pf-btn pf-btn-primary w-full">Join Clan</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{pfStyles}</style>
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
  .pf-btn-ghost { background:rgba(255,255,255,0.05); color:#a78bfa; border:1px solid rgba(168,85,247,0.2); }
`;

export default Clan;
