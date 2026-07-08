import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ForumCategory, ForumThread, User } from '../types';
import { forumService } from '../services/forumService';
import { API_BASE } from '../services/mongoService';
import { triggerToast } from '../components/NotificationToast';

const colorMap: Record<string, string> = {
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
};

const EMOJI_OPTIONS = ['📁','🌍','📢','🎮','💡','🏏','💻','🔥','⭐','🎯','💬','🛡️','🎨','🚀','🎵'];

interface ForumStats {
  weeklyTopPoster: string;
  lastPost: string;
  lastPostThreadId: string | null;
  totalUsers: number;
  totalPostsDisplay: number;
  totalThreads: number;
}

const ForumHome: React.FC = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [allThreads, setAllThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [searchSort, setSearchSort] = useState<'newest' | 'oldest'>('newest');
  const [searchResults, setSearchResults] = useState<ForumThread[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchingDb, setSearchingDb] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [stats, setStats] = useState<ForumStats>({
    weeklyTopPoster: 'Calculating...',
    lastPost: 'None',
    lastPostThreadId: null,
    totalUsers: 0,
    totalPostsDisplay: 0,
    totalThreads: 0
  });

  // Admin category creation modal
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📁');
  const [newCatColor, setNewCatColor] = useState('indigo');
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  // Load user session
  useEffect(() => {
    try {
      const sess = localStorage.getItem('user_session');
      if (sess) setCurrentUser(JSON.parse(sess));
    } catch (e) { console.error(e); }
  }, []);

  // Fetch Forum data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, threads, statsData] = await Promise.all([
          forumService.fetchCategories(),
          forumService.fetchThreads(),
          forumService.fetchForumStats()
        ]);

        setCategories(cats);
        setAllThreads(threads);
        setStats({
          weeklyTopPoster: statsData.weeklyTopPoster || 'No activity',
          lastPost: statsData.lastPost || 'None',
          lastPostThreadId: statsData.lastPostThreadId || null,
          totalUsers: statsData.totalUsers || 0,
          totalPostsDisplay: statsData.totalPostsDisplay || 0,
          totalThreads: statsData.totalThreads || 0
        });
      } catch (err) {
        console.error('Failed to load forum home:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getTopicCountForCategory = (catId: string) =>
    allThreads.filter(t => t.categoryId === catId).length;

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatDesc.trim()) return;
    setIsSubmittingCat(true);
    try {
      const catId = String(categories.length + 1);
      const slug = newCatName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      const newCat: ForumCategory = {
        id: catId,
        name: newCatName.trim(),
        slug,
        description: newCatDesc.trim(),
        icon: newCatIcon.trim() || '📁',
        color: newCatColor,
        subCategories: []
      };
      await forumService.createCategory(newCat);
      setCategories(prev => [...prev, newCat]);
      setNewCatName(''); setNewCatDesc(''); setNewCatIcon('📁'); setNewCatColor('indigo');
      setIsAddCatModalOpen(false);
      triggerToast({ id: 'add-cat-' + Date.now(), senderId: 'system', senderName: 'Forums', senderAvatar: '', type: 'SYSTEM', message: '📁 Category created!', timestamp: Date.now(), isRead: false } as any);
    } catch (err) {
      console.error(err);
      alert('Failed to add category.');
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const handleDeleteCategory = async (catId: string, catName: string) => {
    if (!confirm(`Delete category "${catName}"? All threads inside will remain.`)) return;
    setDeletingCatId(catId);
    try {
      await forumService.deleteCategory(catId);
      setCategories(prev => prev.filter(c => c.id !== catId));
      triggerToast({ id: 'del-cat-' + Date.now(), senderId: 'system', senderName: 'Forums', senderAvatar: '', type: 'SYSTEM', message: '🗑️ Category deleted.', timestamp: Date.now(), isRead: false } as any);
    } catch (err) {
      alert('Failed to delete category.');
    } finally {
      setDeletingCatId(null);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchText.trim()) { setIsSearching(false); return; }
    setIsSearching(true);
    setSearchingDb(true);
    try {
      const q = searchText.toLowerCase().trim();
      const matchedThreads = allThreads.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.authorName.toLowerCase().includes(q) ||
        (t.tags || []).some(tag => tag.toLowerCase().includes(q))
      );

      // Also search post content
      const postsRes = await fetch(`${API_BASE}/forum/posts`);
      const posts = await postsRes.json();
      const matchedThreadIdsFromPosts = new Set<string>();
      posts.forEach((p: any) => {
        if (p.content?.toLowerCase().includes(q) && p.threadId) {
          matchedThreadIdsFromPosts.add(p.threadId);
        }
      });

      const combined = [...matchedThreads];
      matchedThreadIdsFromPosts.forEach(tid => {
        if (!combined.some(t => t.id === tid)) {
          const found = allThreads.find(t => t.id === tid);
          if (found) combined.push(found);
        }
      });

      setSearchResults(combined);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearchingDb(false);
    }
  };

  const sortedSearchResults = useMemo(() => {
    return [...searchResults].sort((a, b) => {
      const aT = a.lastActivity || a.createdAt || 0;
      const bT = b.lastActivity || b.createdAt || 0;
      return searchSort === 'newest' ? bT - aT : aT - bT;
    });
  }, [searchResults, searchSort]);

  const isAdmin = currentUser?.role === 'admin';
  const isStaff = isAdmin || currentUser?.role === 'moderator';

  return (
    <div className="min-h-screen bg-transparent text-[#e1e1e1] font-sans antialiased pb-32 relative">
      {/* Glow orbs */}
      <div className="absolute top-0 left-10 w-full max-w-sm h-96 bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-40 right-10 w-full max-w-sm h-96 bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[600px] bg-blue-900/3 rounded-full blur-[160px] pointer-events-none" />

      {/* HEADER */}
      <header className="sticky top-0 z-40 p-4 max-w-5xl mx-auto">
        <div className="bg-slate-950/70 backdrop-blur-xl border border-[#1f293d]/60 rounded-3xl px-5 py-4 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/apps')}
              className="p-2.5 bg-[#121824] hover:bg-slate-800 border border-[#1f293d] rounded-2xl text-slate-400 hover:text-white transition-all active:scale-95"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">💬</span>
                <h1 className="text-base font-black text-white tracking-tight">Discussion Forums</h1>
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Explore topics & discussions</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/forum/create')}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.97] flex items-center gap-1.5"
          >
            <span className="text-sm leading-none">+</span> New Topic
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-4 space-y-6">

        {/* STATS DASHBOARD */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { label: 'Weekly Top', value: stats.weeklyTopPoster, icon: '🏆', color: 'text-amber-400', sub: 'Poster' },
            { label: 'Members', value: stats.totalUsers.toLocaleString(), icon: '👥', color: 'text-blue-400', sub: 'Active Users' },
            { label: 'Topics', value: stats.totalThreads.toLocaleString(), icon: '📝', color: 'text-indigo-400', sub: 'Discussions' },
            { label: 'Posts', value: stats.totalPostsDisplay.toLocaleString(), icon: '💬', color: 'text-emerald-400', sub: 'Total Entries' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.07 }}
              className="bg-[#121824] border border-[#1f293d] p-4 rounded-3xl text-left relative overflow-hidden shadow-lg group"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">{stat.label}</span>
                  <p className={`text-sm font-black mt-1 truncate ${stat.color}`}>{loading ? '...' : stat.value}</p>
                  <span className="text-[9px] text-slate-600 font-bold">{stat.sub}</span>
                </div>
                <span className="text-2xl opacity-20 select-none group-hover:opacity-30 transition-opacity">{stat.icon}</span>
              </div>
            </motion.div>
          ))}
        </motion.section>

        {/* LAST POST TRACKER */}
        {stats.lastPostThreadId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => navigate(`/forum/thread/${stats.lastPostThreadId}`)}
            className="bg-indigo-600/8 border border-indigo-500/20 rounded-3xl px-5 py-3 flex items-center gap-3 cursor-pointer hover:border-indigo-500/40 transition-all group"
          >
            <span className="text-indigo-400 text-base shrink-0">🕒</span>
            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Last Activity</span>
              <p className="text-xs font-bold text-indigo-300 group-hover:text-indigo-200 truncate transition-colors">{stats.lastPost}</p>
            </div>
            <svg className="w-4 h-4 text-indigo-500 group-hover:text-indigo-300 group-hover:translate-x-1 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </motion.div>
        )}

        {/* CATEGORIES SECTION */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Forum Categories</h2>
              <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black rounded-lg">{categories.length}</span>
            </div>
            {isAdmin && (
              <button
                onClick={() => setIsAddCatModalOpen(true)}
                className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
              >
                + Add Category
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-24 bg-[#121824] border border-[#1f293d] rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat, i) => {
                const gradient = colorMap[cat.color] || 'from-indigo-600 to-purple-600';
                const topicsCount = getTopicCountForCategory(cat.id);
                const isDeleting = deletingCatId === cat.id;

                return (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                    className="relative group"
                  >
                    <div
                      onClick={() => navigate(`/forum/cat/${cat.slug}`)}
                      className={`bg-[#121824] border border-[#1f293d] rounded-3xl p-5 flex items-center justify-between gap-4 cursor-pointer hover:border-slate-700 transition-all active:scale-[0.99] shadow-lg ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${gradient} shadow-lg flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform`}>
                          {cat.icon || '📁'}
                        </div>
                        <div className="text-left min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors truncate">{cat.name}</h3>
                            {cat.isHidden && (
                              <span className="px-1.5 py-0.5 text-[7px] font-black uppercase bg-slate-800 border border-slate-700 rounded text-slate-400">Hidden</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 truncate">{cat.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
                              🎯 {topicsCount} topics
                            </span>
                          </div>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    {/* Admin delete button */}
                    {isAdmin && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id, cat.name); }}
                        className="absolute top-3 right-10 w-6 h-6 rounded-lg bg-rose-500/0 hover:bg-rose-500/20 text-rose-400 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-xs"
                        title="Delete category"
                      >
                        🗑️
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* SEARCH SECTION */}
        <section className="bg-[#121824] border border-[#1f293d] rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#1f293d]/50 pb-4 mb-5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              🔍 Global Search
            </h3>
            {isSearching && (
              <button
                onClick={() => { setIsSearching(false); setSearchText(''); setSearchResults([]); }}
                className="text-[10px] font-bold text-rose-400 hover:text-rose-300 transition-colors"
              >
                Clear ✕
              </button>
            )}
          </div>

          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 bg-[#090d16] border border-[#1f293d] rounded-2xl px-4 py-3 flex items-center gap-3 focus-within:border-indigo-500/60 transition-colors">
                <span className="text-slate-500 text-sm shrink-0">🔍</span>
                <input
                  type="text"
                  value={searchText}
                  onChange={e => { setSearchText(e.target.value); if (!e.target.value.trim()) { setIsSearching(false); setSearchResults([]); } }}
                  placeholder="Search by title, author, tag, or content..."
                  className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-slate-600 font-medium"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={searchSort}
                  onChange={e => setSearchSort(e.target.value as any)}
                  className="bg-[#090d16] border border-[#1f293d] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl px-3 py-3 outline-none cursor-pointer appearance-none"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
                <button
                  type="submit"
                  disabled={searchingDb || !searchText.trim()}
                  className="px-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-95 shrink-0"
                >
                  {searchingDb ? '...' : 'Search'}
                </button>
              </div>
            </div>
          </form>

          <AnimatePresence>
            {isSearching && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-5 border-t border-[#1f293d]/50 pt-5"
              >
                {searchingDb ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                ) : sortedSearchResults.length === 0 ? (
                  <div className="py-10 text-center text-slate-500 text-xs font-bold">No results found for "{searchText}"</div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-500 font-bold mb-3">{sortedSearchResults.length} result(s) found</p>
                    {sortedSearchResults.map(t => (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => navigate(`/forum/thread/${t.id}`)}
                        className="bg-[#090d16] border border-[#1f293d] p-4 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-indigo-500/30 transition-all group"
                      >
                        <span className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm shrink-0">
                          {t.isPinned ? '📌' : t.isLocked ? '🔒' : '💬'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-black text-white group-hover:text-indigo-400 transition-colors truncate">{t.title}</h4>
                          <p className="text-[9px] text-slate-500 font-bold mt-0.5">
                            by @{t.authorName} · {t.replyCount || 0} replies · {new Date(t.lastActivity || t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </p>
                        </div>
                        <svg className="w-4 h-4 text-slate-700 group-hover:text-indigo-400 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* QUICK LINKS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/forum/create')}
            className="bg-gradient-to-br from-indigo-600/20 to-purple-600/10 border border-indigo-500/20 hover:border-indigo-500/40 p-5 rounded-3xl text-left transition-all group"
          >
            <span className="text-2xl block mb-2">✍️</span>
            <h4 className="text-xs font-black text-white group-hover:text-indigo-400 transition-colors">Create Topic</h4>
            <p className="text-[9px] text-slate-500 font-bold mt-1">Start a new discussion</p>
          </button>
          <div
            onClick={() => navigate('/staff')}
            className="bg-gradient-to-br from-amber-600/10 to-orange-600/5 border border-amber-500/15 hover:border-amber-500/30 p-5 rounded-3xl text-left transition-all group"
          >
            <span className="text-2xl block mb-2">🛡️</span>
            <h4 className="text-xs font-black text-white group-hover:text-amber-400 transition-colors">Staff Forum</h4>
            <p className="text-[9px] text-slate-500 font-bold mt-1">Moderator discussions</p>
          </div>
        </section>
      </main>

      {/* ADD CATEGORY MODAL */}
      <AnimatePresence>
        {isAddCatModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmittingCat && setIsAddCatModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-[#121824] rounded-3xl border border-[#1f293d] p-6 max-w-md w-full shadow-2xl relative z-10 space-y-5 text-left"
            >
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">📁 Create New Category</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Admin only</p>
              </div>

              <form onSubmit={handleAddCategory} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Category Name</label>
                  <input
                    type="text" required maxLength={30} disabled={isSubmittingCat}
                    value={newCatName} onChange={e => setNewCatName(e.target.value)}
                    placeholder="Enter category name..."
                    className="bg-[#090d16] border border-[#1f293d] text-white focus:outline-none focus:border-indigo-500 rounded-2xl p-3 w-full text-xs font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Description</label>
                  <input
                    type="text" required maxLength={100} disabled={isSubmittingCat}
                    value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)}
                    placeholder="Short description..."
                    className="bg-[#090d16] border border-[#1f293d] text-white focus:outline-none focus:border-indigo-500 rounded-2xl p-3 w-full text-xs font-semibold transition-colors"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Icon Emoji</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:grid-cols-5 gap-1 bg-[#090d16] border border-[#1f293d] rounded-2xl p-2">
                      {EMOJI_OPTIONS.map(em => (
                        <button key={em} type="button" onClick={() => setNewCatIcon(em)}
                          className={`w-full aspect-square rounded-xl flex items-center justify-center text-base transition-all ${newCatIcon === em ? 'bg-indigo-500/30 ring-1 ring-indigo-500' : 'hover:bg-slate-800'}`}
                        >{em}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Color Theme</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {Object.entries(colorMap).map(([color, gradient]) => (
                        <button key={color} type="button" onClick={() => setNewCatColor(color)}
                          className={`h-8 rounded-xl bg-gradient-to-r ${gradient} transition-all ${newCatColor === color ? 'ring-2 ring-white scale-105' : 'opacity-60 hover:opacity-90'}`}
                        />
                      ))}
                    </div>
                    <p className="text-[9px] text-slate-500 text-center pt-1 capitalize">{newCatColor}</p>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-[#090d16] border border-[#1f293d] rounded-2xl p-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${colorMap[newCatColor] || colorMap.indigo} flex items-center justify-center text-lg shrink-0`}>
                    {newCatIcon}
                  </div>
                  <div>
                    <p className="text-xs font-black text-white">{newCatName || 'Category Name'}</p>
                    <p className="text-[9px] text-slate-500">{newCatDesc || 'Description...'}</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" disabled={isSubmittingCat} onClick={() => setIsAddCatModalOpen(false)}
                    className="w-1/3 py-3 border border-[#1f293d] hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all"
                  >Cancel</button>
                  <button type="submit" disabled={isSubmittingCat || !newCatName.trim() || !newCatDesc.trim()}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-all active:scale-[0.98]"
                  >
                    {isSubmittingCat ? 'Creating...' : 'Create Category'}
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

export default ForumHome;

