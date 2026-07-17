import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../services/mongoService';

const Blog: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const session = JSON.parse(localStorage.getItem('user_session') || 'null');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/blog`);
        if (res.ok) setPosts(await res.json());
      } catch (e) { console.warn(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center overflow-x-hidden"><div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a] p-4 sm:p-6 overflow-x-hidden">
      <div className="max-w-full max-w-4xl mx-auto px-4 sm:px-6 mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">📝 Blog</h1>
            <p className="text-sm text-white/40 mt-1">Long-form posts from the community</p>
          </div>
          <button onClick={() => navigate('/blog/new')} className="pf-btn pf-btn-primary">+ Write Post</button>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20 text-white/60">
            <p className="text-5xl mb-4">📝</p>
            <p className="font-bold">No blog posts yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <Link key={post.id} to={`/blog/view/${post.id}`} className="pf-card p-4 sm:p-6 block hover:border-purple-500/30 transition-all">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <img src={post.authorAvatar} className="w-10 h-10 rounded-full object-cover border-2 border-purple-500/30" alt="" />
                  <div>
                    <p className="text-sm font-bold text-white">{post.authorName}</p>
                    <p className="text-xs sm:text-sm text-white/60">{new Date(post.publishedAt).toLocaleDateString()} · {post.views || 0} views</p>
                  </div>
                </div>
                <h2 className="text-xl font-black text-white mb-2">{post.title}</h2>
                <p className="text-sm text-white/50 line-clamp-3">{post.excerpt}</p>
                {post.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {post.tags.map((tag: string) => (
                      <span key={tag} className="text-xs sm:text-sm text-purple-400 px-2 py-1 rounded-full bg-purple-500/10">#{tag}</span>
                    ))}
                  </div>
                )}
              </Link>
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
  .pf-btn { padding:8px 20px; border-radius:12px; font-weight:700; font-size:0.75rem; border:none; cursor:pointer; transition:all .3s; }
  .pf-btn-primary { background:linear-gradient(135deg,#7c3aed,#a855f7); color:#fff; }
  .pf-btn-primary:hover { transform:translateY(-1px); box-shadow:0 8px 25px rgba(124,58,237,0.3); }
`;

export default Blog;

