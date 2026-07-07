import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ForumCategory, ForumThread, User } from '../types';
import { forumService } from '../services/forumService';
import { triggerToast } from '../components/NotificationToast';

type SortMode = 'newest' | 'oldest' | 'mostReplies' | 'pinned';

const TOOLBAR_ACTIONS = [
  { label: 'B', title: 'Bold', wrap: ['**', '**'], sample: 'bold text' },
  { label: 'I', title: 'Italic', wrap: ['*', '*'], sample: 'italic text' },
  { label: 'H3', title: 'Header', wrap: ['\n### ', '\n'], sample: 'Header Title' },
  { label: '❝', title: 'Quote', wrap: ['\n> ', '\n'], sample: 'quote text' },
  { label: '</>', title: 'Code', wrap: ['`', '`'], sample: 'code' },
  { label: '🔗', title: 'Link', wrap: ['[', '](https://)'], sample: 'link text' },
];

const TopicListView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Load user
  useEffect(() => {
    try {
      const sess = localStorage.getItem('user_session');
      if (sess) setCurrentUser(JSON.parse(sess));
    } catch (e) { console.error(e); }
  }, []);

  // Fetch category
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const cats = await forumService.fetchCategories();
        const found = cats.find(c => c.slug === slug);
        if (found) setCategory(found);
      } catch (err) {
        console.error('Failed to resolve category:', err);
      }
    };
    fetchCategory();
  }, [slug]);

  // Fetch threads (poll)
  const fetchThreads = useCallback(async () => {
    if (!category?.id) return;
    try {
      const data = await forumService.fetchThreads(category.id);
      setThreads(data);
    } catch (err) {
      console.error('Failed to fetch threads:', err);
    } finally {
      setLoading(false);
    }
  }, [category?.id]);

  useEffect(() => {
    if (!category?.id) return;
    setLoading(true);
    fetchThreads();
    const interval = setInterval(fetchThreads, 10000);
    return () => clearInterval(interval);
  }, [fetchThreads]);

  // Sorting
  const sortedThreads = useMemo(() => {
    return [...threads].sort((a, b) => {
      if (sortMode === 'pinned') return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
      if (sortMode === 'oldest') return (a.createdAt || 0) - (b.createdAt || 0);
      if (sortMode === 'mostReplies') return (b.replyCount || 0) - (a.replyCount || 0);
      // newest — pinned always first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (b.lastActivity || 0) - (a.lastActivity || 0);
    });
  }, [threads, sortMode]);

  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'moderator';

  const insertFormat = (wrap: string[], sample: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = newContent.substring(start, end) || sample;
    const replacement = wrap[0] + selected + wrap[1];
    const newVal = newContent.substring(0, start) + replacement + newContent.substring(end);
    setNewContent(newVal);
    setTimeout(() => {
      ta.focus();
      const pos = start + wrap[0].length + selected.length + wrap[1].length;
      ta.setSelectionRange(pos, pos);
    }, 10);
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || !currentUser) return;

    setIsSubmitting(true);
    try {
      const tags = newTags.split(',').map(t => t.trim()).filter(Boolean);
      const threadId = 'T' + Date.now();
      const firstPostId = 'P' + Date.now();
      const newThread: ForumThread = {
        id: threadId,
        categoryId: category?.id || '',
        title: newTitle.trim(),
        tags,
        authorId: currentUser.id,
        authorName: currentUser.username,
        authorAvatar: currentUser.avatar || 'https://picsum.photos/seed/anon/200',
        replyCount: 0,
        views: 0,
        isPinned: isPinned && isStaff,
        isLocked: isLocked && isStaff,
        createdAt: Date.now(),
        lastActivity: Date.now()
      };

      await forumService.createThread(
        newThread,
        {
          id: firstPostId,
          threadId,
          authorId: currentUser.id,
          authorName: currentUser.username,
          authorAvatar: currentUser.avatar || 'https://picsum.photos/seed/anon/200',
          content: newContent.trim(),
          timestamp: Date.now(),
          reactions: {},
          userReactions: {}
        },
        currentUser.id,
        currentUser.ap || 0,
        currentUser.totalAp || 0
      );

      triggerToast({ id: 'nt-' + Date.now(), senderId: 'system', senderName: 'Forums', senderAvatar: '', type: 'SYSTEM', message: '🚀 Topic created! +15 AP', timestamp: Date.now(), isRead: false } as any);
      setNewTitle(''); setNewContent(''); setNewTags(''); setIsPinned(false); setIsLocked(false);
      setIsModalOpen(false);
      setTimeout(fetchThreads, 500);
    } catch (err) {
      console.error('Failed to create topic:', err);
      triggerToast({ id: 'nt-fail-' + Date.now(), senderId: 'system', senderName: 'Forums', senderAvatar: '', type: 'SYSTEM', message: '❌ Could not create topic.', timestamp: Date.now(), isRead: false } as any);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryName = category?.name || (slug ? slug.replace(/-/g, ' ').toUpperCase() : 'Forums');
  const catGradient = category?.color ? ({
    indigo: 'from-indigo-600 to-purple-600',
    blue:   'from-blue-600 to-cyan-500',
    orange: 'from-orange-500 to-amber-500',
    teal:   'from-teal-500 to-emerald-500',
    rose:   'from-rose-600 to-pink-600',
    green:  'from-green-500 to-emerald-500',
    amber:  'from-amber-500 to-yellow-400',
    violet: 'from-violet-600 to-purple-500',
    red:    'from-red-600 to-rose-500',
    cyan:   'from-cyan-500 to-sky-500',
  } as Record<string,string>)[category.color] || 'from-indigo-600 to-purple-600' : 'from-indigo-600 to-purple-600';

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  };

  return (
    <div className="min-h-screen bg-transparent text-[#e1e1e1] font-sans antialiased pb-32 relative overflow-x-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/4 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-80 h-80 bg-purple-600/4 rounded-full blur-[100px] pointer-events-none" />

      {/* HEADER */}
      <header className="sticky top-0 z-40 p-4 max-w-5xl mx-auto">
        <div className="bg-slate-950/70 backdrop-blur-xl border border-[#1f293d]/60 rounded-3xl px-5 py-4 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/forum')}
              className="p-2.5 bg-[#121824] hover:bg-slate-800 border border-[#1f293d] rounded-2xl text-slate-400 hover:text-white transition-all active:scale-95"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <div className="flex items-center gap-2">
                {category && (
                  <span className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${catGradient} flex items-center justify-center text-sm shrink-0`}>
                    {category.icon || '📁'}
                  </span>
                )}
                <div>
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] block">Forums › Category</span>
                  <h1 className="text-base font-black text-white tracking-tight leading-tight">{categoryName}</h1>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.97] flex items-center gap-1.5"
          >
            <span className="text-sm leading-none">+</span> New Topic
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-4 space-y-4">

        {/* Category description */}
        {category?.description && (
          <div className="bg-[#121824]/60 border border-[#1f293d]/40 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-indigo-400 text-sm shrink-0">ℹ️</span>
            <p className="text-[11px] text-slate-400 font-medium">{category.description}</p>
          </div>
        )}

        {/* Controls bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-bold">
              {loading ? '...' : `${sortedThreads.length} topic${sortedThreads.length !== 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Sort:</span>
            <div className="flex gap-1">
              {(['newest', 'oldest', 'mostReplies', 'pinned'] as SortMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
                    sortMode === mode
                      ? 'bg-indigo-600/30 border border-indigo-500/40 text-indigo-400'
                      : 'bg-[#121824] border border-[#1f293d] text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {mode === 'mostReplies' ? '💬' : mode === 'pinned' ? '📌' : mode === 'newest' ? '🆕' : '🕰️'}{' '}
                  {mode === 'mostReplies' ? 'Replies' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Thread list */}
        <div className="bg-[#121824] border border-[#1f293d] rounded-3xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-slate-800 rounded-2xl animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-800 rounded-full animate-pulse w-3/4" />
                    <div className="h-2 bg-slate-800/50 rounded-full animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedThreads.length === 0 ? (
            <div className="py-20 text-center space-y-4 max-w-xs mx-auto">
              <span className="text-5xl block">💬</span>
              <h3 className="text-sm font-black text-white">No Topics Yet</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Be the first to start a discussion in this category!</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mx-auto px-6 py-3 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/40 text-xs font-black uppercase tracking-widest rounded-2xl transition-all block"
              >
                Start First Topic
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#1f293d]/60">
              {sortedThreads.map((thread, i) => (
                <motion.div
                  key={thread.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(`/forum/thread/${thread.id}`)}
                  className="px-5 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/40 transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Status icon */}
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-base shrink-0 transition-transform group-hover:scale-105 ${
                      thread.isLocked ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      thread.isPinned ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {thread.isLocked ? '🔒' : thread.isPinned ? '📌' : '💬'}
                    </div>

                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        {thread.isPinned && (
                          <span className="px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest bg-amber-500/15 text-amber-400 border border-amber-500/25 rounded-md">Pinned</span>
                        )}
                        {thread.isLocked && (
                          <span className="px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest bg-rose-500/15 text-rose-400 border border-rose-500/25 rounded-md">Locked</span>
                        )}
                        {(thread.tags || []).slice(0, 2).map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest bg-slate-800 text-slate-400 border border-slate-700 rounded-md">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <h4 className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors truncate leading-snug">
                        {thread.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] text-slate-500 font-semibold">
                          by <span className="text-slate-400">@{thread.authorName}</span>
                        </p>
                        <span className="text-slate-700">·</span>
                        <p className="text-[10px] text-slate-500 font-semibold">{timeAgo(thread.lastActivity || thread.createdAt)}</p>
                        {thread.lastPostAuthor && thread.lastPostAuthor !== thread.authorName && (
                          <>
                            <span className="text-slate-700">·</span>
                            <p className="text-[10px] text-slate-500 font-semibold">last by <span className="text-slate-400">@{thread.lastPostAuthor}</span></p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-center hidden sm:block">
                      <span className="text-xs font-black text-white block">{thread.views || 0}</span>
                      <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">Views</span>
                    </div>
                    <div className="text-center min-w-[40px]">
                      <span className="text-xs font-black text-indigo-400 block">{thread.replyCount || 0}</span>
                      <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wider">Replies</span>
                    </div>
                    <svg className="w-4 h-4 text-slate-700 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* CREATE TOPIC MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="bg-[#121824] rounded-t-3xl sm:rounded-3xl border border-[#1f293d] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative z-10"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-[#121824] border-b border-[#1f293d]/60 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white">🚀 New Discussion Topic</h3>
                  <p className="text-[10px] text-indigo-400 font-bold mt-0.5">in {categoryName}</p>
                </div>
                <button onClick={() => !isSubmitting && setIsModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all text-sm">✕</button>
              </div>

              <form onSubmit={handleCreateTopic} className="p-6 space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Topic Title *</label>
                  <input
                    type="text" required maxLength={100} disabled={isSubmitting}
                    value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    placeholder="Enter a clear and descriptive topic title..."
                    className="bg-[#090d16] border border-[#1f293d] text-white focus:outline-none focus:border-indigo-500 rounded-2xl p-3.5 w-full text-sm font-semibold transition-colors placeholder-slate-600"
                  />
                  <div className="text-right text-[9px] text-slate-600 font-bold pr-1">{newTitle.length}/100</div>
                </div>

                {/* Markdown toolbar + content */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Content *</label>
                  <div className="flex flex-wrap gap-1 p-1.5 bg-[#090d16] rounded-t-2xl border border-b-0 border-[#1f293d]">
                    {TOOLBAR_ACTIONS.map(action => (
                      <button key={action.label} type="button"
                        onClick={() => insertFormat(action.wrap, action.sample)}
                        title={action.title}
                        className="h-7 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-[#1f293d] text-slate-400 hover:text-white active:scale-95 transition-all text-[10px] font-black"
                      >{action.label}</button>
                    ))}
                  </div>
                  <textarea
                    ref={textareaRef}
                    required rows={7} disabled={isSubmitting}
                    value={newContent} onChange={e => setNewContent(e.target.value)}
                    placeholder="Write your post content here... Markdown formatting supported: **bold**, *italic*, > quote, `code`, [link](url)"
                    className="w-full bg-[#090d16] border border-[#1f293d] rounded-b-2xl text-white focus:outline-none focus:border-indigo-500 px-4 py-3 text-xs font-medium resize-none leading-relaxed transition-colors placeholder-slate-600"
                  />
                  <div className="text-right text-[9px] text-slate-600 font-bold pr-1">{newContent.length} chars</div>
                </div>

                {/* Tags */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tags <span className="text-slate-600 normal-case">(optional, comma separated)</span></label>
                  <input
                    type="text" disabled={isSubmitting}
                    value={newTags} onChange={e => setNewTags(e.target.value)}
                    placeholder="e.g. cricket, news, discussion"
                    className="bg-[#090d16] border border-[#1f293d] text-white focus:outline-none focus:border-indigo-500 rounded-2xl p-3 w-full text-xs font-medium transition-colors placeholder-slate-600"
                  />
                  {newTags && (
                    <div className="flex flex-wrap gap-1 px-1">
                      {newTags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black rounded-lg">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Staff controls */}
                {isStaff && (
                  <div className="grid grid-cols-2 gap-3 bg-[#090d16] border border-amber-500/20 p-4 rounded-2xl">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1.5">📌 Pin Topic</span>
                      <div
                        onClick={() => setIsPinned(!isPinned)}
                        className={`w-10 h-6 rounded-full transition-all cursor-pointer relative ${isPinned ? 'bg-amber-500' : 'bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isPinned ? 'left-5' : 'left-1'}`} />
                      </div>
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-[10px] font-bold text-rose-400 uppercase flex items-center gap-1.5">🔒 Lock Topic</span>
                      <div
                        onClick={() => setIsLocked(!isLocked)}
                        className={`w-10 h-6 rounded-full transition-all cursor-pointer relative ${isLocked ? 'bg-rose-500' : 'bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isLocked ? 'left-5' : 'left-1'}`} />
                      </div>
                    </label>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button type="button" disabled={isSubmitting} onClick={() => setIsModalOpen(false)}
                    className="w-1/3 py-3.5 border border-[#1f293d] hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all"
                  >Cancel</button>
                  <button type="submit" disabled={isSubmitting || !newTitle.trim() || !newContent.trim()}
                    className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Publishing...</>
                    ) : '🚀 Publish Topic'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TopicListView;
