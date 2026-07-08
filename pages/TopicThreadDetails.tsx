import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ForumThread, ForumPost, User } from '../types';
import { forumService } from '../services/forumService';
import { triggerToast } from '../components/NotificationToast';
import { BBCodeParser } from '../components/BBCodeParser';
import TopicOptionsPane from '../components/TopicOptionsPane';

const REACTIONS = ['👍','❤️','😂','😮','😢','🔥','🎯','💯'];

const timeAgo = (ts: number) => {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatFull = (ts: number) => {
  const d = new Date(ts);
  return `${d.getDate().toString().padStart(2,'0')}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getFullYear()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
};

interface PostCardProps {
  post: ForumPost;
  index: number;
  isMainPost: boolean;
  currentUser: User | null;
  isStaff: boolean;
  onQuote: (p: ForumPost) => void;
  onEdit: (p: ForumPost) => void;
  onDelete: (p: ForumPost) => void;
  onReact: (postId: string, emoji: string) => void;
  usersMap: Record<string, User>;
}

const PostCard: React.FC<PostCardProps> = ({ post, index, isMainPost, currentUser, isStaff, onQuote, onEdit, onDelete, onReact, usersMap }) => {
  const [showReactions, setShowReactions] = useState(false);
  const reactionRef = useRef<HTMLDivElement>(null);

  const userReacted = currentUser ? (post.userReactions?.[currentUser.id] || null) : null;
  const totalReactions = Object.values(post.reactions || {}).reduce((a: number, b) => a + (Number(b) || 0), 0);
  const canEdit = currentUser && (currentUser.id === post.authorId) && !post.is_deleted;
  const canDelete = currentUser && (currentUser.id === post.authorId || isStaff) && !post.is_deleted;
  const postUser = usersMap[post.authorId];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (reactionRef.current && !reactionRef.current.contains(e.target as Node)) {
        setShowReactions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (post.is_deleted) {
    return (
      <div className="bg-[#121824]/50 border border-[#1f293d]/40 rounded-3xl px-5 py-4 flex flex-wrap items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">🗑️</div>
        <p className="text-xs sm:text-sm text-slate-600 italic font-medium">This post was deleted.</p>
      </div>
    );
  }

  if (post.isSystemPost) {
    let editedBy = 'Someone', editedByAvatar = '', editTime = post.timestamp;
    if (post.content.startsWith('__EDIT_LOG__:')) {
      const parts = post.content.split(':');
      editedBy = parts[1] || 'Someone';
      editedByAvatar = parts[2] || '';
      editTime = parseInt(parts[3]) || post.timestamp;
    }
    return (
      <div className="bg-[#121824] border border-indigo-500/20 rounded-3xl p-5 shadow-lg shadow-indigo-500/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] pointer-events-none" />
        <div className="flex flex-wrap items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border-2 border-indigo-500/30 flex items-center justify-center shrink-0 text-xl">
            ⚙️
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-white">{post.authorName}</span>
              <span className="px-1.5 py-0.5 bg-purple-500/15 border border-purple-500/30 text-purple-400 text-[7px] font-black uppercase tracking-widest rounded-md">⭐ Premium User!</span>
            </div>
            <p className="text-sm text-slate-300 mt-1">
              <strong className="text-indigo-400">{editedBy}</strong> Edited the topic!
            </p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              {new Date(editTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, weekday: 'short', day: '2-digit', month: 'short', year: '2-digit' })} <span className="text-emerald-400 font-bold">[+]</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      id={`post-${post.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.05, 0.3) }}
      className={`${
        isMainPost 
        ? 'bg-[#0f172a]/90 backdrop-blur-xl border border-indigo-500/30 ring-1 ring-indigo-500/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden' 
        : 'bg-[#161b22]/70 backdrop-blur-md border border-[#30363d]/70 rounded-3xl shadow-lg relative overflow-hidden ml-0 md:ml-8 mt-2'
      }`}
    >
      {isMainPost && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />}
      <div className={`${isMainPost ? 'p-6 md:p-8' : 'p-5'}`}>
        {/* Post header */}
        <div className="flex flex-wrap items-start gap-4 mb-4">
          {/* Avatar */}
          <Link to={`/profile/${postUser?.username || post.authorName}`} className="relative shrink-0 block cursor-pointer transition-transform hover:scale-105 active:scale-95">
            <img
              src={post.authorAvatar || 'https://picsum.photos/seed/anon/200'}
              alt={post.authorName}
              className="w-10 h-10 rounded-2xl object-cover border-2 border-[#1f293d]"
              onError={e => { (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/anon/200'; }}
            />
            {postUser?.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#121824]" />
            )}
          </Link>

          {/* Author info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/profile/${postUser?.username || post.authorName}`} className="text-sm font-black text-white hover:text-indigo-400 hover:underline transition-colors cursor-pointer">{post.authorName}</Link>
              {postUser?.role === 'admin' && (
                <span className="px-1.5 py-0.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[7px] font-black uppercase tracking-widest rounded-md">Admin</span>
              )}
              {postUser?.role === 'moderator' && (
                <span className="px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[7px] font-black uppercase tracking-widest rounded-md">Mod</span>
              )}
              {postUser?.isPremium && (
                <span className="px-1.5 py-0.5 bg-purple-500/15 border border-purple-500/30 text-purple-400 text-[7px] font-black uppercase tracking-widest rounded-md">⭐ Premium</span>
              )}
              {isMainPost && (
                <span className="px-1.5 py-0.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-[7px] font-black uppercase tracking-widest rounded-md">OP</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className="text-xs sm:text-sm text-slate-500 font-medium">{timeAgo(post.timestamp)}</span>
              {post.updated_at && post.updated_at > post.timestamp && (
                <span className="text-xs text-emerald-500/70 font-bold italic">· edited {timeAgo(post.updated_at)}</span>
              )}
              <span className="text-xs sm:text-sm text-slate-600">#{index + 1}</span>
            </div>
          </div>

          {/* Actions menu */}
          <div className="flex flex-wrap items-center gap-1 shrink-0">
            {canEdit && (
              <button onClick={() => onEdit(post)}
                className="w-7 h-7 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 flex items-center justify-center text-xs transition-all"
                title="Edit post"
              >✏️</button>
            )}
            {canDelete && (
              <button onClick={() => onDelete(post)}
                className="w-7 h-7 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 flex items-center justify-center text-xs transition-all"
                title="Delete post"
              >🗑️</button>
            )}
          </div>
        </div>

        {/* Post body */}
        <div className="pl-14 space-y-3">
          <div className="text-sm text-slate-200 leading-relaxed font-normal prose-sm max-w-none">
            <BBCodeParser rawText={post.content} />
          </div>

          {post.editedBy && post.editedAt && (
            <div className="mt-4 pt-2 border-t border-[#1f293d]/40 flex flex-wrap gap-1 text-xs sm:text-sm text-slate-500 font-medium italic">
              <span>Last Edited: {new Date(post.editedAt).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, weekday: 'short', day: '2-digit', month: 'short', year: '2-digit' })}</span>
              <span>By: <strong className="text-indigo-400">{post.editedBy}</strong></span>
              <span>({timeAgo(post.editedAt)} ago)</span>
            </div>
          )}

          {/* Reactions & actions row */}
          <div className="flex items-center justify-between pt-2">
            {/* Reactions display */}
            <div className="flex items-center gap-2 flex-wrap">
              {Object.entries(post.reactions || {}).filter(([, count]) => Number(count) > 0).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => currentUser && onReact(post.id, emoji)}
                  className={`flex flex-wrap items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all active:scale-95 border ${
                    userReacted === emoji
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                      : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="text-xs sm:text-sm">{count}</span>
                </button>
              ))}

              {/* Add reaction button */}
              <div className="relative" ref={reactionRef}>
                <button
                  onClick={() => setShowReactions(!showReactions)}
                  className="flex flex-wrap items-center gap-1 px-2.5 py-1 rounded-xl text-xs bg-slate-800/40 border border-slate-700/40 text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-all"
                >
                  {userReacted || '😊'} <span className="text-xs">+</span>
                </button>

                <AnimatePresence>
                  {showReactions && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.85, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.85, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full left-0 mb-2 bg-[#1a2235] border border-[#1f293d] rounded-2xl p-2 flex flex-wrap gap-1 shadow-2xl z-30"
                    >
                      {REACTIONS.map(em => (
                        <button
                          key={em}
                          onClick={() => { if (currentUser) { onReact(post.id, em); setShowReactions(false); } }}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-base hover:bg-slate-700 active:scale-90 transition-all ${userReacted === em ? 'bg-indigo-500/30 ring-1 ring-indigo-500' : ''}`}
                        >{em}</button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Quote button */}
            <button
              onClick={() => onQuote(post)}
              className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 transition-all"
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h11M3 6h11M3 14h5m5 4l3-3-3-3" />
              </svg>
              Quote
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main Component ---

const TopicThreadDetails: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();

  const [thread, setThread] = useState<ForumThread | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [sending, setSending] = useState(false);
  const [relatedThreads, setRelatedThreads] = useState<ForumThread[]>([]);

  // Edit post state
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [editContent, setEditContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete confirm
  const [deletingPost, setDeletingPost] = useState<ForumPost | null>(null);

  const replyRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const sess = localStorage.getItem('user_session');
      if (sess) setCurrentUser(JSON.parse(sess));
    } catch (e) { console.error(e); }
  }, []);

  const loadData = useCallback(async (silent = false) => {
    if (!threadId) return;
    if (!silent) setLoading(true);
    try {
      const [threadData, postsData] = await Promise.all([
        forumService.fetchThread(threadId),
        forumService.fetchPosts(threadId)
      ]);

      if (threadData?.id) {
        setThread(threadData);
        setPosts(postsData.sort((a, b) => a.timestamp - b.timestamp));
        setError(null);
      } else {
        setError('Topic not found.');
      }
    } catch (err) {
      if (!silent) setError('Could not load this topic.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 8000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Increment views once
  useEffect(() => {
    if (!threadId) return;
    forumService.updateThread(threadId, {}).catch(() => {});
    forumService.fetchThread(threadId).then(t => {
      if (t) forumService.updateThread(threadId, { views: (t.views || 0) + 1 }).catch(() => {});
    }).catch(() => {});
  }, [threadId]);

  // Load related threads
  useEffect(() => {
    if (!threadId) return;
    forumService.fetchRelatedThreads(threadId).then(setRelatedThreads).catch(() => {});
  }, [threadId]);

  // Load users map from posts
  useEffect(() => {
    if (posts.length === 0) return;
    // Build partial map from post data
    const map: Record<string, User> = {};
    posts.forEach(p => {
      if (!map[p.authorId]) {
        map[p.authorId] = {
          id: p.authorId,
          name: p.authorName,
          username: p.authorName,
          avatar: p.authorAvatar,
          isOnline: false,
          level: 1,
          points: 0,
          silverPoints: 0,
          plusses: 0,
          goldenCoins: 0
        } as User;
      }
    });
    setUsersMap(map);
  }, [posts]);

  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'moderator';
  const mainPost = posts.length > 0 ? posts[0] : null;
  const replies = mainPost ? posts.filter(p => p.id !== mainPost.id) : [];

  const handleSendReply = async () => {
    if (!replyContent.trim() || !threadId || !currentUser) return;
    if (thread?.isLocked && !isStaff) {
      triggerToast({ id: 'locked', senderId: 'system', senderName: 'Forums', senderAvatar: '', type: 'SYSTEM', message: '🔒 This topic is locked.', timestamp: Date.now(), isRead: false } as any);
      return;
    }

    setSending(true);
    try {
      await forumService.createPost(threadId, currentUser, replyContent, currentUser.ap || 0, currentUser.totalAp || 0);
      setReplyContent('');
      triggerToast({ id: 'reply-ok-' + Date.now(), senderId: 'system', senderName: 'Forums', senderAvatar: '', type: 'SYSTEM', message: '💬 Reply posted! +5 AP', timestamp: Date.now(), isRead: false } as any);
      await loadData(true);
      setTimeout(() => replyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    } catch (err) {
      triggerToast({ id: 'reply-fail', senderId: 'system', senderName: 'Forums', senderAvatar: '', type: 'SYSTEM', message: '❌ Failed to post reply.', timestamp: Date.now(), isRead: false } as any);
    } finally {
      setSending(false);
    }
  };

  const handleQuote = (p: ForumPost) => {
    const quote = `> **@${p.authorName} said:**\n> ${p.content.split('\n').join('\n> ')}\n\n`;
    setReplyContent(prev => prev + quote);
    setTimeout(() => {
      replyInputRef.current?.focus();
      replyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const handleEdit = (p: ForumPost) => {
    setEditingPost(p);
    setEditContent(p.content);
  };

  const handleSaveEdit = async () => {
    if (!editingPost || !threadId || !editContent.trim()) return;
    setSavingEdit(true);
    try {
      await forumService.updatePost(threadId, editingPost.id, editContent.trim(), currentUser?.username, currentUser?.avatar, editingPost.id === mainPost?.id);
      triggerToast({ id: 'edit-ok', senderId: 'system', senderName: 'Forums', senderAvatar: '', type: 'SYSTEM', message: '✏️ Post updated!', timestamp: Date.now(), isRead: false } as any);
      setEditingPost(null);
      await loadData(true);
    } catch (err) {
      alert('Failed to update post.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeletePost = async (p: ForumPost) => {
    setDeletingPost(null);
    try {
      await forumService.deletePost(threadId!, p.id);
      triggerToast({ id: 'del-ok', senderId: 'system', senderName: 'Forums', senderAvatar: '', type: 'SYSTEM', message: '🗑️ Post deleted.', timestamp: Date.now(), isRead: false } as any);
      await loadData(true);
    } catch (err) {
      alert('Failed to delete post.');
    }
  };

  const handleReact = async (postId: string, emoji: string) => {
    if (!currentUser) return;
    try {
      const result = await forumService.toggleReaction(postId, emoji, currentUser.id);
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        return { ...p, reactions: result.reactions, userReactions: result.userReactions };
      }));
    } catch (err) {
      console.error('Reaction failed:', err);
    }
  };

  const handleUpdateThread = async (updates: Partial<ForumThread>) => {
    if (!thread) return;
    try {
      await forumService.updateThread(thread.id, updates);
      setThread(prev => prev ? { ...prev, ...updates } : prev);
    } catch (err) { console.error(err); }
  };

  const handleDeleteThread = async () => {
    if (!thread) return;
    try {
      await forumService.deleteThread(thread.id);
      navigate('/forum');
    } catch (err) { console.error(err); }
  };

  const handleUpdateMainPost = async (content: string) => {
    if (!mainPost) return;
    await forumService.updatePost(threadId!, mainPost.id, content, currentUser?.username, currentUser?.avatar, true);
  };

  // --- Loading / Error states ---
  if (loading) return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Loading thread...</span>
    </div>
  );

  if (error || !thread) return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center gap-4 text-center px-8">
      <span className="text-4xl">💬</span>
      <h2 className="text-base font-black text-white">{error || 'Topic Not Found'}</h2>
      <p className="text-xs text-slate-500">This topic may have been deleted or moved.</p>
      <button onClick={() => navigate('/forum')}
        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all">
        Back to Forums
      </button>
    </div>
  );

  const uniquePosters = Array.from(new Set(posts.map(p => p.authorName)));

  return (
    <div className="min-h-screen bg-transparent text-[#e1e1e1] font-sans antialiased pb-32 relative">
      {/* Ambient glows */}
      <div className="absolute top-0 right-0 w-full max-w-sm h-96 bg-indigo-600/4 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-80 h-80 bg-purple-600/4 rounded-full blur-[100px] pointer-events-none" />

      {/* STICKY HEADER */}
      <header className="sticky top-0 z-40 p-4 max-w-full max-w-4xl mx-auto px-4 sm:px-6 mx-auto">
        <div className="bg-slate-950/70 backdrop-blur-xl border border-[#1f293d]/60 rounded-3xl px-5 py-3 flex flex-wrap items-center gap-3 shadow-2xl">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-[#121824] hover:bg-slate-800 border border-[#1f293d] rounded-xl text-slate-400 hover:text-white transition-all active:scale-95 shrink-0"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              <span className="text-xs text-indigo-400 font-black uppercase tracking-widest cursor-pointer hover:text-indigo-300" onClick={() => navigate('/forum')}>Forums</span>
              <span className="text-slate-700 text-xs">›</span>
              <span className="text-xs text-slate-500 font-bold truncate">{thread.title}</span>
            </div>
            <h1 className="text-sm font-black text-white truncate leading-snug">{thread.title}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Thread status badges */}
            {thread.isPinned && <span className="text-amber-400 text-base" title="Pinned">📌</span>}
            {thread.isLocked && <span className="text-rose-400 text-base" title="Locked">🔒</span>}

            {/* Staff controls */}
            {isStaff && (
              <div className="flex flex-wrap items-center gap-1">
                <button
                  onClick={() => handleUpdateThread({ isPinned: !thread.isPinned })}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-black uppercase border transition-all ${thread.isPinned ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/10' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-amber-400 hover:border-amber-500/30'}`}
                  title={thread.isPinned ? 'Unpin' : 'Pin'}
                >
                  {thread.isPinned ? '📌 Pinned' : '📌 Pin'}
                </button>
                <button
                  onClick={() => handleUpdateThread({ isLocked: !thread.isLocked })}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-black uppercase border transition-all ${thread.isLocked ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/30'}`}
                  title={thread.isLocked ? 'Unlock' : 'Lock'}
                >
                  {thread.isLocked ? '🔒 Locked' : '🔒 Lock'}
                </button>
              </div>
            )}

            <button
              onClick={() => setShowOptions(true)}
              className="p-2 bg-[#121824] hover:bg-slate-800 border border-[#1f293d] rounded-xl text-slate-400 hover:text-white transition-all"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-full max-w-4xl mx-auto px-4 sm:px-6 mx-auto px-4 mt-4 space-y-4">

        {/* Thread meta info bar */}
        <div className="bg-[#121824] border border-[#1f293d] rounded-2xl px-5 py-3 flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 text-xs">💬</span>
            <span className="text-xs font-bold text-white">{replies.length}</span>
            <span className="text-xs sm:text-sm text-slate-500 font-bold">replies</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 text-xs">👁️</span>
            <span className="text-xs font-bold text-white">{thread.views || 0}</span>
            <span className="text-xs sm:text-sm text-slate-500 font-bold">views</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 text-xs">👤</span>
            <span className="text-xs font-bold text-white">{uniquePosters.length}</span>
            <span className="text-xs sm:text-sm text-slate-500 font-bold">unique posters</span>
          </div>
          {(thread.tags || []).length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap ml-auto">
              {thread.tags!.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 text-xs font-black rounded-lg">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Locked banner */}
        {thread.isLocked && (
          <div className="bg-rose-500/8 border border-rose-500/20 rounded-2xl px-5 py-3 flex flex-wrap items-center gap-3">
            <span className="text-rose-400 text-lg shrink-0">🔒</span>
            <div>
              <p className="text-xs font-black text-rose-400">Topic Locked</p>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">New replies are disabled. Only staff can reply.</p>
            </div>
          </div>
        )}

        {/* POSTS */}
        {/* POSTS */}
        <div className="space-y-4">
          {/* Jump controls */}
          <div className="flex items-center justify-between px-2">
            <span className="text-xs sm:text-sm text-slate-500 font-bold">{posts.length} post{posts.length !== 1 ? 's' : ''}</span>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-xs font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors">↑ First</button>
              <span className="text-slate-700">·</span>
              <button onClick={() => replyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                className="text-xs font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors">↓ Reply</button>
            </div>
          </div>

          {/* Main post */}
          {mainPost && (
            <PostCard
              post={mainPost} index={0} isMainPost
              currentUser={currentUser} isStaff={isStaff}
              onQuote={handleQuote} onEdit={handleEdit}
              onDelete={p => setDeletingPost(p)}
              onReact={handleReact} usersMap={usersMap}
            />
          )}

          {/* Replies */}
          {replies.map((reply, i) => (
            <PostCard
              key={reply.id}
              post={reply} index={i + 1} isMainPost={false}
              currentUser={currentUser} isStaff={isStaff}
              onQuote={handleQuote} onEdit={handleEdit}
              onDelete={p => setDeletingPost(p)}
              onReact={handleReact} usersMap={usersMap}
            />
          ))}

          {/* Reply box */}
          <div ref={replyRef} className="bg-[#121824] border border-[#1f293d] rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 blur-[50px] pointer-events-none" />
            {thread.isLocked && !isStaff ? (
              <div className="text-center py-4">
                <p className="text-xs text-slate-500 font-bold">🔒 This topic is locked. New replies are disabled.</p>
              </div>
            ) : currentUser ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <img
                    src={currentUser.avatar || 'https://picsum.photos/seed/anon/200'}
                    alt={currentUser.username}
                    className="w-8 h-8 rounded-xl object-cover border border-[#1f293d] shrink-0"
                  />
                  <div>
                    <span className="text-xs font-black text-white">{currentUser.username}</span>
                    <p className="text-xs text-slate-500 font-bold">Leave a reply</p>
                  </div>
                </div>
                <textarea
                  ref={replyInputRef}
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  disabled={sending}
                  placeholder="Write your reply... Markdown formatting supported: **bold**, *italic*, > quote, `code`"
                  rows={5}
                  className="w-full bg-[#090d16] border border-[#1f293d] text-white focus:outline-none focus:border-indigo-500 rounded-2xl px-4 py-3.5 text-sm font-normal resize-none transition-colors placeholder-slate-600 leading-relaxed"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-slate-600 font-bold">{replyContent.length} chars · +5 AP on submit</span>
                  <button
                    onClick={handleSendReply}
                    disabled={sending || !replyContent.trim()}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-all active:scale-[0.97] flex flex-wrap items-center gap-2"
                  >
                    {sending ? (
                      <><div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Posting...</>
                    ) : '💬 Post Reply'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-slate-400 font-bold">Login to join the discussion</p>
                <button onClick={() => navigate('/login')}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all">
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Related threads */}
        {relatedThreads.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Related Topics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 gap-3">
              {relatedThreads.map(t => (
                <div
                  key={t.id}
                  onClick={() => navigate(`/forum/thread/${t.id}`)}
                  className="bg-[#121824] border border-[#1f293d] rounded-2xl p-4 cursor-pointer hover:border-slate-700 transition-all group flex flex-wrap items-center gap-3"
                >
                  <span className="text-lg shrink-0">{t.isLocked ? '🔒' : t.isPinned ? '📌' : '💬'}</span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-white group-hover:text-indigo-400 transition-colors truncate">{t.title}</h4>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">{t.replyCount || 0} replies</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Unique posters footer */}
        <div className="bg-[#121824]/50 border border-[#1f293d]/40 rounded-2xl px-5 py-3">
          <span className="text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-widest mr-2">Posters:</span>
          {uniquePosters.map((name, i) => (
            <React.Fragment key={name}>
              <span className="text-xs sm:text-sm text-indigo-400 font-bold cursor-pointer hover:text-indigo-300 transition-colors">@{name}</span>
              {i < uniquePosters.length - 1 && <span className="text-slate-700 mx-1">·</span>}
            </React.Fragment>
          ))}
        </div>
      </main>

      {/* EDIT POST MODAL */}
      <AnimatePresence>
        {editingPost && (
          <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !savingEdit && setEditingPost(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="bg-[#121824] rounded-t-3xl sm:rounded-3xl border border-[#1f293d] w-full max-w-2xl shadow-2xl relative z-10"
            >
              <div className="border-b border-[#1f293d]/60 px-6 py-4 flex items-center justify-between">
                <h3 className="text-sm font-black text-white">✏️ Edit Post</h3>
                <button onClick={() => !savingEdit && setEditingPost(null)}
                  className="w-7 h-7 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all text-sm">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <textarea
                  value={editContent} onChange={e => setEditContent(e.target.value)}
                  disabled={savingEdit} rows={8}
                  className="w-full bg-[#090d16] border border-[#1f293d] text-white focus:outline-none focus:border-indigo-500 rounded-2xl px-4 py-3.5 text-sm font-normal resize-none transition-colors placeholder-slate-600 leading-relaxed"
                />
                <div className="flex flex-wrap gap-3">
                  <button disabled={savingEdit} onClick={() => setEditingPost(null)}
                    className="w-1/3 py-3 border border-[#1f293d] hover:bg-slate-800 text-slate-400 font-bold text-xs uppercase tracking-widest rounded-2xl transition-all">Cancel</button>
                  <button disabled={savingEdit || !editContent.trim()} onClick={handleSaveEdit}
                    className="flex flex-wrap-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex flex-wrap items-center justify-center gap-2">
                    {savingEdit ? <><div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Saving...</> : '💾 Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRM MODAL */}
      <AnimatePresence>
        {deletingPost && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeletingPost(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#121824] rounded-3xl border border-rose-500/30 p-6 max-w-sm w-full shadow-2xl relative z-10 text-center space-y-4"
            >
              <span className="text-4xl block">🗑️</span>
              <h3 className="text-sm font-black text-white">Delete This Post?</h3>
              <p className="text-xs text-slate-400">This action cannot be undone. The post will be marked as deleted.</p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setDeletingPost(null)}
                  className="flex-1 py-3 border border-[#1f293d] hover:bg-slate-800 text-slate-400 font-bold text-xs uppercase tracking-widest rounded-2xl transition-all">Cancel</button>
                <button onClick={() => handleDeletePost(deletingPost)}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OPTIONS PANEL */}
      {showOptions && thread && (
        <TopicOptionsPane
          thread={thread}
          mainPost={mainPost}
          currentUser={currentUser}
          onUpdateThread={handleUpdateThread}
          onUpdateMainPost={handleUpdateMainPost}
          onDeleteThread={handleDeleteThread}
          onQuote={() => mainPost && handleQuote(mainPost)}
          onClose={() => setShowOptions(false)}
        />
      )}
    </div>
  );
};

export default TopicThreadDetails;

