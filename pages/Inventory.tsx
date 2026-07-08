import React, { useState, useEffect } from 'react';
import { API_BASE } from '../services/mongoService';

const Inventory: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const session = JSON.parse(localStorage.getItem('user_session') || 'null');

  const loadItems = async () => {
    if (!session) return;
    try {
      const res = await fetch(`${API_BASE}/inventory/${session.id}`);
      if (res.ok) setItems(await res.json());
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadItems(); }, []);

  const handleEquip = async (itemId: string) => {
    try { await fetch(`${API_BASE}/inventory/${itemId}/equip`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' }); loadItems(); } catch (e) { console.warn(e); }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center"><div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a] p-4 sm:p-6">
      <div className="max-w-full max-w-4xl mx-auto px-4 sm:px-6 mx-auto">
        <h1 className="text-2xl font-black text-white mb-2">🎒 Inventory</h1>
        <p className="text-sm text-white/40 mb-6">{items.length} items owned</p>

        {items.length === 0 ? (
          <div className="text-center py-20 text-white/60">
            <p className="text-5xl mb-4">🎒</p>
            <p className="font-bold">Your inventory is empty</p>
            <p className="text-sm mt-1">Visit the shop or marketplace to get items!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {items.map(item => (
              <div key={item.id} className="pf-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs sm:text-sm font-bold text-purple-400 uppercase tracking-wider px-2 py-1 rounded-full bg-purple-500/10">{item.itemType}</span>
                  {item.equipped && <span className="text-xs sm:text-sm font-bold text-emerald-400 px-2 py-1 rounded-full bg-emerald-500/10">✅ Equipped</span>}
                </div>
                <h3 className="text-lg font-black text-white">{item.itemName || item.itemId}</h3>
                <p className="text-sm text-white/50 mt-1">Qty: {item.quantity}</p>
                <p className="text-xs sm:text-sm text-white/40 mt-2">Acquired {new Date(item.acquiredAt).toLocaleDateString()}</p>
                <button onClick={() => handleEquip(item.id)} className={`pf-btn w-full mt-3 ${item.equipped ? 'pf-btn-ghost' : 'pf-btn-primary'}`}>
                  {item.equipped ? 'Unequip' : 'Equip'}
                </button>
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
  .pf-btn { padding:8px 20px; border-radius:12px; font-weight:700; font-size:0.75rem; border:none; cursor:pointer; transition:all .3s; }
  .pf-btn-primary { background:linear-gradient(135deg,#7c3aed,#a855f7); color:#fff; }
  .pf-btn-primary:hover { transform:translateY(-1px); box-shadow:0 8px 25px rgba(124,58,237,0.3); }
  .pf-btn-ghost { background:rgba(255,255,255,0.05); color:#a78bfa; border:1px solid rgba(168,85,247,0.2); }
`;

export default Inventory;

