import React, { useState, useEffect } from 'react';
import { API_BASE } from '../services/mongoService';

const Groups: React.FC = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const session = JSON.parse(localStorage.getItem('user_session') || 'null');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const loadGroups = async () => {
    try { const r = await fetch(`${API_BASE}/groups`); if (r.ok) setGroups(await r.json()); } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadGroups(); }, []);

  const handleCreate = async () => {
    if (!form.name || !session) return;
    try {
      await fetch(`${API_BASE}/groups`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, ownerId: session.id, ownerName: session.name }) });
      setShowCreate(false); setForm({ name: '', description: '' }); loadGroups();
    } catch (e) { console.warn(e); }
  };

  const handleJoin = async (groupId: string) => {
    if (!session) return;
    try { await fetch(`${API_BASE}/groups/${groupId}/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: session.id, userName: session.name }) }); loadGroups(); } catch (e) { console.warn(e); }
  };

  const isMember = (g: any) => g.members?.some((m: any) => m.userId === session?.id);

  if (loading) return <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center overflow-x-hidden"><div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a] p-4 sm:p-6 overflow-x-hidden">
      <div className="max-w-full max-w-5xl mx-auto px-4 sm:px-6 mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">👥 Groups</h1>
            <p className="text-sm text-white/40 mt-1">Create and join community groups</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)} className="pf-btn pf-btn-primary">{showCreate ? 'Cancel' : '+ Create Group'}</button>
        </div>

        {showCreate && (
          <div className="pf-card p-5 mb-6 space-y-3">
            <input className="pf-input w-full" placeholder="Group name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input className="pf-input w-full" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <button onClick={handleCreate} className="pf-btn pf-btn-primary w-full">Create Group</button>
          </div>
        )}

        {groups.length === 0 ? (
          <div className="text-center py-20 text-white/60"><p className="text-5xl mb-4">👥</p><p className="font-bold">No groups yet</p></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map(g => (
              <div key={g.id} className="pf-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-black text-white">{g.name}</h3>
                  {!g.isPublic && <span className="text-xs sm:text-sm text-amber-400 px-2 py-1 rounded-full bg-amber-500/10">🔒 Private</span>}
                </div>
                <p className="text-sm text-white/50 mb-3">{g.description || 'No description'}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">👥 {g.members?.length || 0} members</span>
                  {session && g.isPublic && !isMember(g) && (
                    <button onClick={() => handleJoin(g.id)} className="pf-btn pf-btn-primary text-sm">Join</button>
                  )}
                  {isMember(g) && <span className="text-sm text-emerald-400">✅ Member</span>}
                </div>
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
  .pf-input { background:rgba(22,27,34,0.8); border:1px solid #30363d; border-radius:12px; padding:10px 14px; color:#fff; font-size:0.85rem; outline:none; transition:all .3s; }
  .pf-input:focus { border-color:#a78bfa; }
  .pf-btn { padding:8px 20px; border-radius:12px; font-weight:700; font-size:0.75rem; border:none; cursor:pointer; transition:all .3s; }
  .pf-btn-primary { background:linear-gradient(135deg,#7c3aed,#a855f7); color:#fff; }
  .pf-btn-primary:hover { transform:translateY(-1px); box-shadow:0 8px 25px rgba(124,58,237,0.3); }
`;

export default Groups;

