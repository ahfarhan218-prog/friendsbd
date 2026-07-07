import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { API_BASE } from '../services/mongoService';

const BlogViewer: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = JSON.parse(localStorage.getItem('user_session') || 'null');
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/blog/${id}`);
        if (r.ok) setPost(await r.json());
      } catch (e) { console.warn(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center"><div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>;
  if (!post) return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a] p-6">
      <div className="max-w-3xl mx-auto text-center py-20 text-white/30">
        <p className="text-5xl mb-4">📝</p>
        <p className="font-bold">Post not found</p>
        <button onClick={() => navigate('/blog')} className="pf-btn pf-btn-primary mt-4">Back to Blog</button>
      </div>
      <style>{pfStyles}</style>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a] p-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/blog')} className="pf-btn pf-btn-ghost mb-4">← Back to Blog</button>

        <div className="pf-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <img src={post.authorAvatar} className="w-12 h-12 rounded-full object-cover border-2 border-purple-500/30" alt="" />
            <div>
              <p className="text-sm font-bold text-white">{post.authorName}</p>
              <p className="text-[10px] text-white/30">{new Date(post.publishedAt).toLocaleDateString()} · {post.views || 0} views</p>
            </div>
          </div>

          <h1 className="text-3xl font-black text-white mb-4">{post.title}</h1>

          {post.tags?.length > 0 && (
            <div className="flex gap-2 mb-4">
              {post.tags.map((tag: string) => (
                <span key={tag} className="text-[10px] text-purple-400 px-2 py-1 rounded-full bg-purple-500/10">#{tag}</span>
              ))}
            </div>
          )}

          <div className="prose prose-invert max-w-none text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>

          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/5">
            {session?.id === post.authorId && (
              <Link to={`/blog/edit/${post.id}`} className="pf-btn pf-btn-ghost">✏️ Edit</Link>
            )}
          </div>
        </div>
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

export default BlogViewer;
