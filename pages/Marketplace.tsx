import React, { useState, useEffect } from 'react';
import { API_BASE } from '../services/mongoService';

const Marketplace: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const session = JSON.parse(localStorage.getItem('user_session') || 'null');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', price: '', currency: 'goldenCoins', type: 'item' });

  const loadItems = async () => {
    try {
      const res = await fetch(`${API_BASE}/marketplace`);
      if (res.ok) setItems(await res.json());
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadItems(); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.price || !session) return;
    try {
      await fetch(`${API_BASE}/marketplace`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, price: Number(form.price), sellerId: session.id, sellerName: session.name }) });
      setShowForm(false); setForm({ title: '', description: '', price: '', currency: 'goldenCoins', type: 'item' }); loadItems();
    } catch (e) { console.warn(e); }
  };

  const handleBuy = async (itemId: string) => {
    if (!session) return;
    try {
      const res = await fetch(`${API_BASE}/marketplace/${itemId}/buy`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ buyerId: session.id }) });
      if (res.ok) loadItems();
    } catch (e) { console.warn(e); }
  };

  const handleCancel = async (itemId: string) => {
    try { await fetch(`${API_BASE}/marketplace/${itemId}`, { method: 'DELETE' }); loadItems(); } catch (e) { console.warn(e); }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center"><div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a] p-4 sm:p-6">
      <div className="max-w-full max-w-5xl mx-auto px-4 sm:px-6 mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">🏪 Marketplace</h1>
            <p className="text-sm text-white/40 mt-1">Buy & sell items with other members</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="pf-btn pf-btn-primary">{showForm ? 'Cancel' : '+ Sell Item'}</button>
        </div>

        {showForm && (
          <div className="pf-card p-5 mb-6 space-y-3">
            <input className="pf-input w-full" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <input className="pf-input w-full" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <div className="flex flex-wrap gap-3">
              <input className="pf-input flex-1" type="number" placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              <select className="pf-input" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                <option value="goldenCoins">🪙 Golden Coins</option>
                <option value="silverPoints">🔘 Silver Points</option>
                <option value="ap">⚡ AP</option>
              </select>
              <select className="pf-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="item">Item</option>
                <option value="badge">Badge</option>
                <option value="service">Service</option>
                <option value="collectible">Collectible</option>
              </select>
            </div>
            <button onClick={handleCreate} className="pf-btn pf-btn-primary w-full">List Item</button>
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-20 text-white/60">
            <p className="text-5xl mb-4">🏪</p>
            <p className="font-bold">No items listed yet</p>
            <p className="text-sm mt-1">Be the first to sell something!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {items.map(item => (
              <div key={item.id} className="pf-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs sm:text-sm font-bold text-purple-400 uppercase tracking-wider px-2 py-1 rounded-full bg-purple-500/10">{item.type}</span>
                  <span className="text-xs sm:text-sm text-white/60">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="text-lg font-black text-white mb-1">{item.title}</h3>
                <p className="text-sm text-white/50 mb-4 line-clamp-2">{item.description || 'No description'}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-purple-400">{item.price} {item.currency === 'goldenCoins' ? '🪙' : item.currency === 'silverPoints' ? '🔘' : '⚡'}</span>
                  <div className="flex flex-wrap gap-2">
                    {item.sellerId === session?.id ? (
                      <button onClick={() => handleCancel(item.id)} className="pf-btn pf-btn-ghost text-sm">Cancel</button>
                    ) : (
                      <button onClick={() => handleBuy(item.id)} className="pf-btn pf-btn-primary text-sm">Buy</button>
                    )}
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-white/40 mt-2">by {item.sellerName}</p>
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
  .pf-input { background:rgba(22,27,34,0.8); border:1px solid #30363d; border-radius:12px; padding:10px 14px; color:#fff; font-size:0.85rem; outline:none; transition:all .3s; width:100%; }
  .pf-input:focus { border-color:#a78bfa; }
  .pf-input option { background:#1C1C2E; color:#fff; }
  .pf-btn { padding:8px 20px; border-radius:12px; font-weight:700; font-size:0.75rem; border:none; cursor:pointer; transition:all .3s; }
  .pf-btn-primary { background:linear-gradient(135deg,#7c3aed,#a855f7); color:#fff; }
  .pf-btn-primary:hover { transform:translateY(-1px); box-shadow:0 8px 25px rgba(124,58,237,0.3); }
  .pf-btn-ghost { background:rgba(255,255,255,0.05); color:#a78bfa; border:1px solid rgba(168,85,247,0.2); }
`;

export default Marketplace;

