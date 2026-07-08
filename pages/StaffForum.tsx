import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { forumService } from '../services/forumService';
import { ForumPost, User } from '../types';
import { apService } from '../services/apService';

const StaffForum: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [shoutlyText, setShoutlyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. RBAC: Load user and verify staff status
    const sessionStr = localStorage.getItem('user_session');
    if (sessionStr) {
      try {
        const user = JSON.parse(sessionStr);
        setCurrentUser(user);
        if (user.role !== 'admin' && user.role !== 'moderator') {
          navigate('/'); // redirect non-staff
          return;
        }
      } catch (e) {
        navigate('/');
        return;
      }
    } else {
      navigate('/');
      return;
    }

    // 2. Load content
    const loadContent = async () => {
      setLoading(true);
      try {
        const data = await forumService.fetchPosts('T-STAFF');
        setPosts(data);
      } catch (e) {
        console.error("Staff forum error:", e);
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, [navigate]);

  useEffect(() => {
    // Auto-scroll to bottom when posts change
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [posts]);

  const handlePublish = async () => {
    if (!shoutlyText.trim() || !currentUser) return;
    try {
      const newPost = await forumService.createPost('T-STAFF', currentUser, shoutlyText, currentUser.ap || 0, currentUser.totalAp || 0);
      setPosts([...posts, newPost]);
      setShoutlyText('');
      apService.awardAP(5, 'Staff Forum Activity', '🛡️', true, false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this staff message?")) return;
    setDeletingId(postId);
    try {
      await forumService.deletePost('T-STAFF', postId);
      setPosts(posts.map(p => p.id === postId ? { ...p, is_deleted: true, content: '[This message was deleted]' } : p));
    } catch (e) {
      console.error(e);
      alert("Failed to delete post");
    } finally {
      setDeletingId(null);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-transparent text-[#e1e1e1] font-sans antialiased pb-32 relative flex flex-col">
      {/* Background Glow */}
      <div className="absolute top-0 left-10 w-full max-w-sm h-96 bg-amber-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-40 right-10 w-full max-w-sm h-96 bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#090d16]/80 backdrop-blur-xl border-b border-[#30363d] p-4 flex items-center justify-between shadow-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => navigate('/forum')}
            className="w-10 h-10 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex flex-wrap items-center gap-2">
              <span className="text-amber-500">🛡️</span> STAFF FORUM
            </h1>
            <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">Private Discussion Area</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-white">{currentUser.name}</p>
            <p className="text-xs sm:text-sm text-amber-500 font-bold uppercase">{currentUser.role}</p>
          </div>
          <img src={currentUser.avatar} alt="You" className="w-10 h-10 rounded-xl border border-[#30363d] shadow-lg" />
        </div>
      </div>

      {/* Chat Area */}
      <main className="flex-1 max-w-full max-w-4xl mx-auto px-4 sm:px-6 w-full mx-auto p-4 flex flex-col gap-4 mt-4 mb-24">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-4">Decrypting Channel...</p>
          </div>
        ) : (
          posts.map((post) => {
            const isMe = post.authorId === currentUser.id;
            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={post.id} 
                className={`flex flex-wrap gap-4 max-w-[85%] ${isMe ? 'self-end flex flex-wrap-row-reverse' : 'self-start'}`}
              >
                {/* Avatar */}
                <div className="shrink-0">
                  <img src={post.authorAvatar} alt={post.authorName} className="w-10 h-10 rounded-xl border border-[#30363d] shadow-lg shadow-black/50" />
                </div>
                
                {/* Message Bubble */}
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex flex-wrap items-center gap-2 mb-1 px-1">
                    <Link to={`/profile/${post.authorName}`} className="text-sm font-bold text-slate-300 hover:text-amber-400 hover:underline transition-colors">
                      {post.authorName}
                    </Link>
                    <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                      {new Date(post.timestamp).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className={`group relative p-4 rounded-2xl text-[14px] leading-relaxed shadow-xl border ${
                    post.is_deleted ? 'bg-[#161b22] border-[#30363d] text-slate-500 italic' :
                    isMe ? 'bg-gradient-to-br from-amber-600/20 to-orange-600/10 border-amber-500/30 text-amber-50' : 
                    'bg-[#161b22] border-[#30363d] text-slate-200'
                  }`}>
                    {post.content}
                    
                    {/* Hover Options */}
                    {!post.is_deleted && (isMe || currentUser.role === 'admin') && (
                      <div className={`absolute top-2 ${isMe ? '-left-12' : '-right-12'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <button 
                          onClick={() => handleDelete(post.id)}
                          disabled={deletingId === post.id}
                          className="w-8 h-8 rounded-full bg-[#1a1f27] border border-red-500/30 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                          title="Delete Message"
                        >
                          {deletingId === post.id ? '...' : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={endOfMessagesRef} />
      </main>

      {/* Fixed Composer Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#090d16]/90 backdrop-blur-xl border-t border-[#30363d] p-4 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="max-w-full max-w-4xl mx-auto px-4 sm:px-6 mx-auto">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-2 flex flex-wrap items-end gap-2 focus-within:border-amber-500/50 focus-within:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all">
            <textarea
              value={shoutlyText}
              onChange={e => setShoutlyText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handlePublish();
                }
              }}
              placeholder="Type a secure message to staff..."
              className="flex-1 bg-transparent border-none outline-none text-[#e1e1e1] placeholder-slate-500 p-3 min-h-[50px] max-h-[150px] resize-y text-sm font-medium"
            />
            <button 
              onClick={handlePublish}
              disabled={!shoutlyText.trim()}
              className="mb-1 mr-1 shrink-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
          <p className="text-center mt-2 text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest">
            Press <kbd className="bg-[#1a1f27] px-1.5 py-0.5 rounded border border-[#30363d]">Enter</kbd> to send
          </p>
        </div>
      </div>
    </div>
  );
};

export default StaffForum;

