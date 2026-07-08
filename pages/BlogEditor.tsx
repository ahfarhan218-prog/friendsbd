import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE } from '../services/mongoService';

const BlogEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const session = JSON.parse(localStorage.getItem('user_session') || 'null');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/blog/${id}`);
        if (r.ok) {
          const p = await r.json();
          setTitle(p.title);
          setContent(p.content);
          setTags((p.tags || []).join(', '));
        }
      } catch (e) { console.warn(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleSave = async () => {
    if (!title || !content || !session) return;
    setSaving(true);
    setMsg('');
    try {
      const body = { authorId: session.id, authorName: session.name, authorAvatar: session.avatar, title, content, tags: tags.split(',').map(t => t.trim()).filter(Boolean) };
      if (id) {
        const r = await fetch(`${API_BASE}/blog/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (r.ok) { setMsg('✅ Updated!'); setTimeout(() => navigate('/blog'), 1000); }
        else { const e = await r.json(); setMsg('❌ ' + (e.error || 'Failed')); }
      } else {
        const r = await fetch(`${API_BASE}/blog`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (r.ok) navigate('/blog');
        else { const e = await r.json(); setMsg('❌ ' + (e.error || 'Failed')); }
      }
    } catch (e: any) { setMsg('❌ ' + e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center"><div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a] p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-white">{id ? '✏️ Edit Post' : '📝 New Blog Post'}</h1>
          <button onClick={() => navigate('/blog')} className="pf-btn pf-btn-ghost">Back</button>
        </div>
        {msg && <div className="text-sm text-center mb-4 font-bold text-white/80">{msg}</div>}
        <div className="pf-card p-6 space-y-4">
          <input className="pf-input w-full text-lg" placeholder="Post title..." value={title} onChange={e => setTitle(e.target.value)} />
          <textarea className="pf-input w-full min-h-[300px] resize-y" placeholder="Write your content here (BBCode supported)..." value={content} onChange={e => setContent(e.target.value)} />
          <input className="pf-input w-full" placeholder="Tags (comma separated: tech, gaming, news)" value={tags} onChange={e => setTags(e.target.value)} />
          <button onClick={handleSave} disabled={saving} className="pf-btn pf-btn-primary w-full">{saving ? 'Saving...' : id ? 'Update Post' : 'Publish'}</button>
        </div>
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
  .pf-btn-ghost { background:rgba(255,255,255,0.05); color:#a78bfa; border:1px solid rgba(168,85,247,0.2); }
`;

export default BlogEditor;

