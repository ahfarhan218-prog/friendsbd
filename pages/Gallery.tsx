import React, { useState, useEffect } from 'react';
import { API_BASE } from '../services/mongoService';

const Gallery: React.FC = () => {
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const session = JSON.parse(localStorage.getItem('user_session') || 'null');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [msg, setMsg] = useState('');

  const loadAlbums = async () => {
    if (!session) return;
    try { const r = await fetch(`${API_BASE}/albums/user/${session.id}`); if (r.ok) setAlbums(await r.json()); } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAlbums(); }, []);

  const handleCreate = async () => {
    if (!form.title || !session) return;
    try {
      const r = await fetch(`${API_BASE}/albums`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, userId: session.id }) });
      if (r.ok) { setMsg('✅ Album created!'); setShowCreate(false); setForm({ title: '', description: '' }); loadAlbums(); }
      else { const e = await r.json(); setMsg('❌ ' + (e.error || 'Failed')); }
    } catch (e: any) { setMsg('❌ ' + e.message); }
  };

  const handleAddPhoto = async () => {
    if (!photoUrl || !selectedAlbum) return;
    try {
      const r = await fetch(`${API_BASE}/albums/${selectedAlbum}/photos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: photoUrl, caption: '' }) });
      if (r.ok) { setMsg('✅ Photo added!'); setPhotoUrl(''); loadAlbums(); }
      else { const e = await r.json(); setMsg('❌ ' + (e.error || 'Failed')); }
    } catch (e: any) { setMsg('❌ ' + e.message); }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center"><div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a] p-4 sm:p-6">
      <div className="max-w-full max-w-5xl mx-auto px-4 sm:px-6 mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">📸 Gallery</h1>
            <p className="text-sm text-white/40 mt-1">Your photo albums</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)} className="pf-btn pf-btn-primary">{showCreate ? 'Cancel' : '+ New Album'}</button>
        </div>

        {msg && <div className="text-sm text-center mb-4 font-bold text-white/80">{msg}</div>}

        {showCreate && (
          <div className="pf-card p-5 mb-6 space-y-3">
            <input className="pf-input w-full" placeholder="Album title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <input className="pf-input w-full" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <button onClick={handleCreate} className="pf-btn pf-btn-primary w-full">Create Album</button>
          </div>
        )}

        {albums.length === 0 ? (
          <div className="text-center py-20 text-white/60"><p className="text-5xl mb-4">📸</p><p className="font-bold">No albums yet</p></div>
        ) : (
          <div className="space-y-6">
            {albums.map(album => (
              <div key={album.id} className="pf-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-black text-white">{album.title}</h3>
                    <p className="text-xs text-white/50">{album.description}</p>
                    <p className="text-xs sm:text-sm text-white/60 mt-1">{album.photos?.length || 0} photos</p>
                  </div>
                  <button onClick={() => setSelectedAlbum(selectedAlbum === album.id ? null : album.id)} className="pf-btn pf-btn-ghost text-xs">
                    {selectedAlbum === album.id ? 'Close' : '+ Add Photo'}
                  </button>
                </div>

                {selectedAlbum === album.id && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    <input className="pf-input flex-1" placeholder="Image URL..." value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} />
                    <button onClick={handleAddPhoto} className="pf-btn pf-btn-primary shrink-0">Add</button>
                  </div>
                )}

                {album.photos?.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-2">
                    {album.photos.map((p: any, i: number) => (
                      <img key={i} src={p.url} className="w-full h-28 object-cover rounded-xl" alt="" onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/200x150/1C1C2E/a78bfa?text=Photo'; }} />
                    ))}
                  </div>
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

export default Gallery;

