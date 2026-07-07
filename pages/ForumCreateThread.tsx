import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ForumThread, ForumPost, User, ForumCategory } from '../types';
import { forumService } from '../services/forumService';
import { apService } from '../services/apService';
import { unlockAchievement } from '../utils/achievements';
import { triggerToast } from '../components/NotificationToast';

const ForumCreateThread: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load user session
  useEffect(() => {
    try {
      const sess = localStorage.getItem('user_session');
      if (sess) {
        setCurrentUser(JSON.parse(sess));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const activeUser = currentUser || null;

  useEffect(() => {
    const loadCats = async () => {
      try {
        const cats = await forumService.fetchCategories();
        setCategories(cats);
        if (cats.length > 0) {
          setCategoryId(cats[0].id);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCats();
  }, []);

  const insertMarkdown = (syntax: 'bold' | 'italic' | 'header' | 'quote' | 'code' | 'link' | 'highlight') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.substring(start, end);
    
    let replacement = '';
    switch (syntax) {
      case 'bold':
        replacement = `**${selected || 'bold text'}**`;
        break;
      case 'italic':
        replacement = `*${selected || 'italic text'}*`;
        break;
      case 'header':
        replacement = `\n### ${selected || 'Header Title'}\n`;
        break;
      case 'quote':
        replacement = `\n> ${selected || 'Quote text'}\n`;
        break;
      case 'code':
        replacement = `\`${selected || 'code text'}\``;
        break;
      case 'link':
        replacement = `[${selected || 'link label'}](https://example.com)`;
        break;
      case 'highlight':
        replacement = `==${selected || 'highlight text'}==`;
        break;
    }
    
    const newVal = content.substring(0, start) + replacement + content.substring(end);
    setContent(newVal);
    
    setTimeout(() => {
      ta.focus();
      const newCursorPos = start + replacement.length;
      ta.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Please fill out both Title and Content fields.');
      return;
    }
    if (activeUser.id === 'guest') {
      alert('You must be logged in to create a thread.');
      return;
    }

    setLoading(true);
    setError(null);

    const threadId = `T${Date.now()}`;
    const tagsList = tags.split(',').map(t => t.trim()).filter(Boolean);
    const newThread: ForumThread = {
      id: threadId,
      categoryId: categoryId || '1',
      authorId: activeUser.id,
      authorName: activeUser.username,
      authorAvatar: activeUser.avatar || 'https://picsum.photos/seed/anon/200',
      title: title.trim(),
      tags: tagsList,
      isPinned: false,
      isLocked: false,
      views: 0,
      replyCount: 0,
      lastActivity: Date.now(),
      createdAt: Date.now()
    };

    const firstPost: ForumPost = {
      id: `P${Date.now()}`,
      threadId,
      authorId: activeUser.id,
      authorName: activeUser.username,
      authorAvatar: activeUser.avatar || 'https://picsum.photos/seed/anon/200',
      content: content.trim(),
      timestamp: Date.now(),
      reactions: {},
      userReactions: {}
    };

    try {
      const resp = await forumService.createThread(
        newThread,
        firstPost,
        activeUser.id,
        activeUser.ap || 0,
        activeUser.totalAp || 0
      );
      
      // Award AP
      apService.awardAP(15, 'Forum Topic Created', '⚡', true, false);
      
      const myTopics = JSON.parse(localStorage.getItem('my_forum_topics_count') || '0') + 1;
      localStorage.setItem('my_forum_topics_count', JSON.stringify(myTopics));
      if (myTopics === 1) {
        unlockAchievement('forum_veteran');
      }

      triggerToast({
        id: 'create-thread-ok-' + Date.now(),
        senderId: 'system',
        senderName: 'Forums',
        senderAvatar: activeUser.avatar,
        type: 'SYSTEM',
        message: '🚀 New topic published successfully! +15 AP',
        timestamp: Date.now(),
        isRead: false
      } as any);

      navigate(`/forum/thread/${resp.threadId || threadId}`);
    } catch (err: any) {
      console.error('Failed to create topic:', err);
      setError(err.message || 'Failed to create topic. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-[#e1e1e1] font-sans antialiased pb-32 relative overflow-x-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-10 w-80 h-80 bg-indigo-600/5 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-purple-600/5 rounded-full blur-[110px] pointer-events-none" />

      {/* HEADER SECTION */}
      <header className="p-6 max-w-5xl mx-auto flex items-center justify-between border-b border-[#1f293d]/50 bg-slate-950/20 backdrop-blur-md rounded-b-[2rem]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-[#121824] hover:bg-slate-800 border border-[#1f293d] rounded-2xl text-slate-400 hover:text-white transition-all active:scale-95 shadow-sm"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="text-left">
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] block mb-0.5">Forums › Editor</span>
            <h1 className="text-lg font-black text-white tracking-tight">Create Discussion Topic</h1>
          </div>
        </div>
      </header>

      {/* EDITOR CONTENT */}
      <main className="max-w-3xl mx-auto px-6 mt-6 space-y-5 relative z-10 text-left">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3"
          >
            <span className="text-rose-400 text-xl shrink-0">⚠️</span>
            <p className="text-rose-300 text-xs font-bold">{error}</p>
          </motion.div>
        )}

        {/* CATEGORY SELECTOR */}
        <div className="bg-[#121824] rounded-3xl border border-[#1f293d] p-5 space-y-3 shadow-lg">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Select category</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all active:scale-95 flex items-center gap-3 ${
                  categoryId === cat.id
                    ? 'bg-indigo-600/10 border-indigo-500/50 shadow-md text-white'
                    : 'bg-[#090d16] border-[#1f293d] text-slate-400 hover:border-slate-800'
                }`}
              >
                <span className="text-xl shrink-0">{cat.icon || '📁'}</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-wide truncate">{cat.name}</p>
                  <p className="text-[9px] text-slate-500 truncate mt-0.5">{cat.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* TITLE */}
        <div className="bg-[#121824] rounded-3xl border border-[#1f293d] p-5 shadow-lg space-y-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Topic Title</label>
          <input
            type="text"
            required
            maxLength={100}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter a descriptive topic title..."
            className="w-full bg-[#090d16] border border-[#1f293d] rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-600 font-semibold outline-none focus:border-indigo-500 transition-colors"
          />
          <div className="flex justify-between items-center px-1">
            <span className="text-[8px] text-slate-500 font-semibold">Make it clear and helpful.</span>
            <span className="text-[9px] text-slate-500 font-bold font-mono">{title.length}/100</span>
          </div>
        </div>

        {/* DESCRIPTION + MARKDOWN TOOLBAR */}
        <div className="bg-[#121824] rounded-3xl border border-[#1f293d] p-5 shadow-lg space-y-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Main Post / Description Body</label>

          {/* Markdown Toolbar */}
          <div className="flex flex-wrap gap-1 p-1.5 bg-[#090d16] rounded-2xl border border-[#1f293d]/50">
            {[
              { label: 'B', syntax: 'bold' as const, title: 'Bold Text' },
              { label: 'I', syntax: 'italic' as const, title: 'Italic Text' },
              { label: 'H', syntax: 'header' as const, title: 'Header tag' },
              { label: 'Quote', syntax: 'quote' as const, title: 'Blockquote' },
              { label: 'Code', syntax: 'code' as const, title: 'Inline Code block' },
              { label: 'Link', syntax: 'link' as const, title: 'Add Link' },
              { label: 'Highlight', syntax: 'highlight' as const, title: 'Highlight glowing badge' },
            ].map(t => (
              <button
                key={t.label}
                type="button"
                onClick={() => insertMarkdown(t.syntax)}
                title={t.title}
                className="h-8 px-3 rounded-xl bg-[#121824] border border-[#1f293d] text-slate-400 hover:text-indigo-400 hover:border-indigo-500/40 active:scale-95 transition-all text-[9px] font-black uppercase tracking-wider"
              >
                {t.label}
              </button>
            ))}
          </div>

          <textarea
            ref={textareaRef}
            required
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your topic introduction... Markdown bold, italics, links, blockquotes, code, and glowing highlights (==text==) are fully supported."
            rows={8}
            className="w-full bg-[#090d16] border border-[#1f293d] text-white focus:outline-none focus:border-indigo-500 rounded-2xl px-4 py-3.5 text-xs font-medium resize-y leading-relaxed transition-colors placeholder-slate-600"
          />
          <div className="flex justify-between items-center px-1">
            <span className="text-[8px] text-slate-500 font-semibold">Write an informative description for other members.</span>
            <span className="text-[9px] text-slate-500 font-bold font-mono">{content.length} characters</span>
          </div>
        </div>

        {/* TAGS */}
        <div className="bg-[#121824] rounded-3xl border border-[#1f293d] p-5 shadow-lg space-y-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Tags <span className="text-slate-600 normal-case font-medium">(optional, comma separated)</span></label>
          <input
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="e.g. cricket, news, question"
            className="w-full bg-[#090d16] border border-[#1f293d] rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-600 font-medium outline-none focus:border-indigo-500 transition-colors"
          />
          {tags && (
            <div className="flex flex-wrap gap-1 px-1">
              {tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black rounded-lg">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="button"
          onClick={handlePublish}
          disabled={!title.trim() || !content.trim() || loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black py-4 rounded-3xl text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Publishing Topic...
            </>
          ) : (
            <>Publish Topic</>
          )}
        </button>
      </main>
    </div>
  );
};

export default ForumCreateThread;
