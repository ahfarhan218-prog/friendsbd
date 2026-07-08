import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ForumThread, ForumPost, User } from '../types';
import { forumService } from '../services/forumService';
import { API_BASE } from '../services/mongoService';
import { triggerToast } from './NotificationToast';
import { BBCodeParser } from './BBCodeParser';

interface TopicOptionsPaneProps {
  thread: ForumThread;
  mainPost: ForumPost | null;
  currentUser: User | null;
  onUpdateThread: (updates: Partial<ForumThread>) => Promise<void>;
  onUpdateMainPost: (newContent: string) => Promise<void>;
  onDeleteThread: () => Promise<void>;
  onQuote: () => void;
  onClose: () => void;
}

type ActiveTab = 'general' | 'edit' | 'manage' | 'info';

const TOOLBAR_ACTIONS = [
  { label: 'B',    title: 'Bold',    wrap: ['**', '**'],   sample: 'bold text' },
  { label: 'I',    title: 'Italic',  wrap: ['*', '*'],     sample: 'italic text' },
  { label: 'H3',   title: 'Header',  wrap: ['\n### ', '\n'], sample: 'Header' },
  { label: '❝',   title: 'Quote',   wrap: ['\n> ', '\n'],  sample: 'quote' },
  { label: '</>',  title: 'Code',    wrap: ['`', '`'],     sample: 'code' },
  { label: '🔗',   title: 'Link',    wrap: ['[', '](https://)'], sample: 'text' },
  { label: '==',   title: 'Highlight', wrap: ['==', '=='], sample: 'highlight' },
];

const TopicOptionsPane: React.FC<TopicOptionsPaneProps> = ({
  thread,
  mainPost,
  currentUser,
  onUpdateThread,
  onUpdateMainPost,
  onDeleteThread,
  onQuote,
  onClose,
}) => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ActiveTab>('general');
  const [editedTitle, setEditedTitle]     = useState(thread.title || '');
  const [editedContent, setEditedContent] = useState(mainPost?.content || '');
  const [editedTags, setEditedTags]       = useState((thread.tags || []).join(', '));
  const [previewMode, setPreviewMode]     = useState(false);

  const [reported, setReported]           = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportReason, setReportReason]   = useState('');
  const [showReportForm, setShowReportForm] = useState(false);

  const [isSavingContent, setIsSavingContent] = useState(false);
  const [isSavingMeta, setIsSavingMeta]       = useState(false);
  const [isDeletingThread, setIsDeletingThread] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [copiedLink, setCopiedLink] = useState(false);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (mainPost) setEditedContent(mainPost.content);
  }, [mainPost]);

  const isAdmin = currentUser?.role === 'admin';
  const isMod   = currentUser?.role === 'moderator';
  const isAuthor = currentUser?.id === thread.authorId;
  const isStaff = isAdmin || isMod;
  const canEdit = isStaff || isAuthor;
  const canManage = isStaff;

  // Insert markdown into textarea
  const insertFormat = (wrap: string[], sample: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = editedContent.substring(start, end) || sample;
    const replacement = wrap[0] + selected + wrap[1];
    const newVal = editedContent.substring(0, start) + replacement + editedContent.substring(end);
    setEditedContent(newVal);
    setTimeout(() => {
      ta.focus();
      const pos = start + wrap[0].length + selected.length + wrap[1].length;
      ta.setSelectionRange(pos, pos);
    }, 10);
  };

  const handleReport = async () => {
    if (reported || isSubmittingReport || !reportReason.trim()) return;
    setIsSubmittingReport(true);
    try {
      await fetch(`${API_BASE}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'R' + Date.now(),
          senderId: currentUser?.id || 'anonymous',
          senderName: currentUser?.username || 'anonymous',
          type: 'SYSTEM',
          message: `⚑ Report on thread "${thread.title}": ${reportReason}`,
          timestamp: Date.now(),
          isRead: false
        })
      });
      setReported(true);
      setShowReportForm(false);
      triggerToast({ id: 'report-ok', senderId: 'system', senderName: 'Forums', senderAvatar: '', type: 'SYSTEM', message: '🚨 Report submitted to moderators.', timestamp: Date.now(), isRead: false } as any);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleSaveContent = async () => {
    if (!editedContent.trim() || isSavingContent) return;
    setIsSavingContent(true);
    try {
      await onUpdateMainPost(editedContent.trim());
      triggerToast({ id: 'content-ok', senderId: 'system', senderName: 'Forums', senderAvatar: '', type: 'SYSTEM', message: '✅ Post content updated!', timestamp: Date.now(), isRead: false } as any);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingContent(false);
    }
  };

  const handleSaveMeta = async () => {
    if (isSavingMeta) return;
    setIsSavingMeta(true);
    try {
      const tags = editedTags.split(',').map(t => t.trim()).filter(Boolean);
      await onUpdateThread({ title: editedTitle.trim(), tags });
      triggerToast({ id: 'meta-ok', senderId: 'system', senderName: 'Forums', senderAvatar: '', type: 'SYSTEM', message: '✅ Topic details updated!', timestamp: Date.now(), isRead: false } as any);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingMeta(false);
    }
  };

  const handleDeleteThread = async () => {
    setIsDeletingThread(true);
    try {
      await onDeleteThread();
    } catch (err) {
      console.error(err);
      setIsDeletingThread(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#/forum/thread/${thread.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const allTabs: { id: ActiveTab; label: string; icon: string; show: boolean }[] = [
    { id: 'general', label: 'General',  icon: '⚙️', show: true },
    { id: 'edit',    label: 'Edit Post', icon: '✏️', show: !!canEdit && !!mainPost },
    { id: 'manage',  label: 'Manage',    icon: '🛡️', show: !!canManage },
    { id: 'info',    label: 'Info',      icon: 'ℹ️',  show: true },
  ];
  const TABS = allTabs.filter(t => t.show);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col bg-[#090d16] overflow-hidden"
    >
      {/* Ambient glows */}
      <div className="absolute top-0 right-0 w-full max-w-[20rem] sm:w-80 h-80 bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full max-w-[20rem] sm:w-80 h-80 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* ── TOP HEADER ── */}
      <div className="shrink-0 border-b border-[#1f293d]/60 px-5 py-4 flex flex-wrap items-center gap-4 bg-slate-950/50 backdrop-blur-xl">
        <button
          onClick={onClose}
          className="p-2.5 bg-[#121824] hover:bg-slate-800 border border-[#1f293d] rounded-2xl text-slate-400 hover:text-white transition-all active:scale-95 shrink-0"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-indigo-400 uppercase tracking-[0.3em]">Topic Options</p>
          <h1 className="text-sm font-black text-white truncate">{thread.title}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {thread.isPinned  && <span className="text-amber-400 text-base">📌</span>}
          {thread.isLocked  && <span className="text-rose-400 text-base">🔒</span>}
          <span className="px-2 py-0.5 text-sm font-black uppercase bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">#{thread.id}</span>
        </div>
      </div>

      {/* ── TAB NAV ── */}
      <div className="shrink-0 flex flex-wrap gap-1 px-4 pt-3 pb-0 overflow-x-auto scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-wrap items-center gap-1.5 px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${
              activeTab === tab.id
                ? 'bg-[#121824] border-b-indigo-500 text-white shadow-lg'
                : 'bg-transparent border-b-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

          {/* ━━━━━ GENERAL TAB ━━━━━ */}
          <AnimatePresence mode="wait">
            {activeTab === 'general' && (
              <motion.div key="general" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">

                {/* Author card */}
                <div className="bg-[#121824] border border-[#1f293d] rounded-3xl p-5 flex flex-wrap items-center gap-4">
                  <img
                    src={thread.authorAvatar || 'https://picsum.photos/seed/anon/200'}
                    alt={thread.authorName}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-[#1f293d]"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/anon/200'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white">@{thread.authorName}</p>
                    <p className="text-xs sm:text-sm text-slate-500 font-bold mt-0.5">Topic Author</p>
                    <p className="text-sm text-slate-600 font-bold mt-1">
                      Created {new Date(thread.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-indigo-400">{thread.replyCount || 0}</p>
                    <p className="text-sm text-slate-500 font-bold">replies</p>
                    <p className="text-sm font-black text-slate-300 mt-1">{thread.views || 0}</p>
                    <p className="text-sm text-slate-500 font-bold">views</p>
                  </div>
                </div>

                {/* Action buttons grid */}
                <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 gap-3">
                  <ActionBtn
                    icon="✉️" label="Send PM to Author"
                    onClick={() => { navigate('/inbox', { state: { composeTo: thread.authorName } }); onClose(); }}
                  />
                  <ActionBtn
                    icon="👤" label="View Author Profile"
                    onClick={() => { navigate(`/profile/${thread.authorId}`); onClose(); }}
                  />
                  <ActionBtn
                    icon="❝" label="Quote Main Post" color="amber"
                    onClick={() => { onQuote(); onClose(); }}
                  />
                  <ActionBtn
                    icon={copiedLink ? '✅' : '🔗'} label={copiedLink ? 'Link Copied!' : 'Copy Thread Link'} color="teal"
                    onClick={handleCopyLink}
                  />
                  <ActionBtn
                    icon="🏠" label="Go to Home"
                    onClick={() => { navigate('/home'); onClose(); }}
                  />
                  <ActionBtn
                    icon="💬" label="Back to Forums"
                    onClick={() => { navigate('/forum'); onClose(); }}
                  />
                </div>

                {/* Report section */}
                <div className="bg-[#121824] border border-[#1f293d] rounded-3xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#1f293d]/50">
                    <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest">Report Topic</h3>
                  </div>
                  {reported ? (
                    <div className="px-5 py-4 flex flex-wrap items-center gap-3">
                      <span className="text-emerald-400 text-lg">✅</span>
                      <p className="text-sm font-bold text-emerald-400">Report submitted successfully. Moderators will review it.</p>
                    </div>
                  ) : showReportForm ? (
                    <div className="p-5 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 gap-2">
                        {['Spam', 'Harassment', 'Misinformation', 'Inappropriate Content', 'Off-topic', 'Other'].map(r => (
                          <button key={r} onClick={() => setReportReason(r)}
                            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all text-left ${
                              reportReason === r
                                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                                : 'bg-[#090d16] border-[#1f293d] text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={reportReason}
                        onChange={e => setReportReason(e.target.value)}
                        placeholder="Describe the issue..."
                        className="w-full bg-[#090d16] border border-[#1f293d] text-white focus:outline-none focus:border-rose-500/60 rounded-2xl px-4 py-3 text-sm font-medium transition-colors placeholder-slate-600"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setShowReportForm(false)}
                          className="flex-1 py-2.5 border border-[#1f293d] hover:bg-slate-800 text-slate-400 font-bold text-sm uppercase tracking-widest rounded-2xl transition-all">
                          Cancel
                        </button>
                        <button
                          onClick={handleReport}
                          disabled={isSubmittingReport || !reportReason.trim()}
                          className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all"
                        >
                          {isSubmittingReport ? 'Submitting...' : '🚨 Submit Report'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowReportForm(true)}
                      className="w-full px-5 py-4 flex flex-wrap items-center gap-3 text-rose-400 hover:bg-rose-500/5 transition-colors text-left group"
                    >
                      <span className="text-lg group-hover:scale-110 transition-transform">🚨</span>
                      <div>
                        <p className="text-sm font-black">Report This Topic</p>
                        <p className="text-sm text-slate-500 font-bold">Flag for moderator review</p>
                      </div>
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ━━━━━ EDIT TAB ━━━━━ */}
            {activeTab === 'edit' && canEdit && mainPost && (
              <motion.div key="edit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

                {/* Title edit */}
                <div className="bg-[#121824] border border-[#1f293d] rounded-3xl p-5 space-y-3">
                  <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest">Topic Title</h3>
                  <input
                    type="text" maxLength={100}
                    value={editedTitle} onChange={e => setEditedTitle(e.target.value)}
                    className="w-full bg-[#090d16] border border-[#1f293d] text-white focus:outline-none focus:border-indigo-500 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors"
                  />
                  <div className="text-right text-sm text-slate-600 font-bold">{editedTitle.length}/100</div>

                  <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest mt-1">Tags <span className="text-slate-600 normal-case font-medium">(comma separated)</span></h3>
                  <input
                    type="text"
                    value={editedTags} onChange={e => setEditedTags(e.target.value)}
                    placeholder="e.g. cricket, news, discussion"
                    className="w-full bg-[#090d16] border border-[#1f293d] text-white focus:outline-none focus:border-indigo-500 rounded-2xl px-4 py-3 text-sm font-medium transition-colors placeholder-slate-600"
                  />
                  {editedTags && (
                    <div className="flex flex-wrap gap-1">
                      {editedTags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-black rounded-lg">#{tag}</span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleSaveMeta}
                    disabled={isSavingMeta || !editedTitle.trim()}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-lg transition-all active:scale-[0.98] flex flex-wrap items-center justify-center gap-2"
                  >
                    {isSavingMeta ? <><div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Saving...</> : '💾 Save Title & Tags'}
                  </button>
                </div>

                {/* Content edit */}
                <div className="bg-[#121824] border border-[#1f293d] rounded-3xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest">Main Post Content</h3>
                    <button
                      onClick={() => setPreviewMode(!previewMode)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-black uppercase tracking-widest border transition-all ${
                        previewMode
                          ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
                          : 'bg-[#090d16] border-[#1f293d] text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {previewMode ? '✏️ Edit' : '👁 Preview'}
                    </button>
                  </div>

                  {previewMode ? (
                    <div className="min-h-[200px] bg-[#090d16] border border-[#1f293d] rounded-2xl p-4 text-sm text-slate-200 leading-relaxed">
                      <BBCodeParser rawText={editedContent} />
                    </div>
                  ) : (
                    <>
                      {/* Toolbar */}
                      <div className="flex flex-wrap gap-1 p-1.5 bg-[#090d16] rounded-2xl border border-[#1f293d]/60">
                        {TOOLBAR_ACTIONS.map(action => (
                          <button key={action.label} type="button"
                            onClick={() => insertFormat(action.wrap, action.sample)}
                            title={action.title}
                            className="h-7 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-[#1f293d] text-slate-400 hover:text-white active:scale-95 transition-all text-xs sm:text-sm font-black"
                          >{action.label}</button>
                        ))}
                      </div>
                      <textarea
                        ref={textareaRef}
                        value={editedContent}
                        onChange={e => setEditedContent(e.target.value)}
                        rows={10}
                        className="w-full bg-[#090d16] border border-[#1f293d] text-white focus:outline-none focus:border-indigo-500 rounded-2xl px-4 py-3.5 text-sm font-normal resize-y leading-relaxed transition-colors placeholder-slate-600"
                      />
                      <div className="flex justify-between text-sm text-slate-600 font-bold px-1">
                        <span>Markdown supported: **bold**, *italic*, `code`, &gt; quote</span>
                        <span>{editedContent.length} chars</span>
                      </div>
                    </>
                  )}

                  <button
                    onClick={handleSaveContent}
                    disabled={isSavingContent || !editedContent.trim()}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-lg transition-all active:scale-[0.98] flex flex-wrap items-center justify-center gap-2"
                  >
                    {isSavingContent ? <><div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Saving...</> : '💾 Update Post Content'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ━━━━━ MANAGE TAB ━━━━━ */}
            {activeTab === 'manage' && canManage && (
              <motion.div key="manage" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

                {/* Status controls */}
                <div className="bg-[#121824] border border-[#1f293d] rounded-3xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[#1f293d]/50">
                    <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest">Thread Controls</h3>
                  </div>
                  <div className="divide-y divide-[#1f293d]/50">
                    <StaffToggleRow
                      icon="📌" label="Pin Topic"
                      desc={thread.isPinned ? 'Currently pinned at top' : 'Not pinned'}
                      isActive={thread.isPinned}
                      activeColor="amber"
                      onToggle={() => onUpdateThread({ isPinned: !thread.isPinned })}
                    />
                    <StaffToggleRow
                      icon="🔒" label="Lock Topic"
                      desc={thread.isLocked ? 'New replies disabled' : 'Replies allowed'}
                      isActive={thread.isLocked}
                      activeColor="rose"
                      onToggle={() => onUpdateThread({ isLocked: !thread.isLocked })}
                    />
                    <StaffToggleRow
                      icon="👁️" label="Hide Category"
                      desc={thread.isLocked ? 'Category visible' : 'Category visible to members'}
                      isActive={false}
                      activeColor="slate"
                      onToggle={() => {}}
                      disabled
                    />
                  </div>
                </div>

                {/* Staff quick actions */}
                <div className="bg-[#121824] border border-[#1f293d] rounded-3xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[#1f293d]/50">
                    <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest">Staff Actions</h3>
                  </div>
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 gap-3">
                    <ActionBtn icon="✉️" label="Message Author"
                      onClick={() => { navigate('/inbox', { state: { composeTo: thread.authorName } }); onClose(); }} />
                    <ActionBtn icon="👤" label="View Author"
                      onClick={() => { navigate(`/profile/${thread.authorId}`); onClose(); }} />
                    <ActionBtn icon="🏷️" label={thread.isPinned ? 'Unpin Thread' : 'Pin to Top'} color={thread.isPinned ? 'rose' : 'amber'}
                      onClick={() => onUpdateThread({ isPinned: !thread.isPinned })} />
                    <ActionBtn icon={thread.isLocked ? '🔓' : '🔒'} label={thread.isLocked ? 'Unlock Replies' : 'Lock Replies'} color="rose"
                      onClick={() => onUpdateThread({ isLocked: !thread.isLocked })} />
                  </div>
                </div>

                {/* Danger zone */}
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-3xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-rose-500/20">
                    <h3 className="text-xs sm:text-sm font-black text-rose-500/70 uppercase tracking-widest">⚠️ Danger Zone</h3>
                  </div>
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full px-5 py-4 flex flex-wrap items-center gap-3 text-rose-400 hover:bg-rose-500/10 transition-colors text-left group"
                    >
                      <span className="text-lg group-hover:scale-110 transition-transform">🗑️</span>
                      <div>
                        <p className="text-sm font-black">Delete This Topic</p>
                        <p className="text-sm text-slate-500 font-bold">Permanently removes thread and all replies</p>
                      </div>
                    </button>
                  ) : (
                    <div className="p-5 space-y-3">
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-center">
                        <span className="text-3xl block mb-2">⚠️</span>
                        <p className="text-sm font-black text-rose-400">Are you absolutely sure?</p>
                        <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1">This will delete "{thread.title}" and <strong className="text-rose-400">{thread.replyCount} replies</strong> permanently.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setShowDeleteConfirm(false)} disabled={isDeletingThread}
                          className="flex-1 py-3 border border-[#1f293d] hover:bg-slate-800 text-slate-400 font-bold text-sm uppercase tracking-widest rounded-2xl transition-all">
                          Cancel
                        </button>
                        <button onClick={handleDeleteThread} disabled={isDeletingThread}
                          className="flex flex-wrap-1 py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-70 text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all flex flex-wrap items-center justify-center gap-2">
                          {isDeletingThread ? <><div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Deleting...</> : '🗑️ Yes, Delete'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ━━━━━ INFO TAB ━━━━━ */}
            {activeTab === 'info' && (
              <motion.div key="info" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

                <div className="bg-[#121824] border border-[#1f293d] rounded-3xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[#1f293d]/50">
                    <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest">Thread Information</h3>
                  </div>
                  <div className="divide-y divide-[#1f293d]/40">
                    {[
                      { label: 'Thread ID',      value: `#${thread.id}` },
                      { label: 'Author',          value: `@${thread.authorName}` },
                      { label: 'Category ID',     value: thread.categoryId },
                      { label: 'Created',         value: new Date(thread.createdAt).toLocaleString('en-GB') },
                      { label: 'Last Activity',   value: new Date(thread.lastActivity || thread.createdAt).toLocaleString('en-GB') },
                      { label: 'Total Replies',   value: String(thread.replyCount || 0) },
                      { label: 'Total Views',     value: String(thread.views || 0) },
                      { label: 'Status',          value: thread.isLocked ? 'Locked' : 'Open' },
                      { label: 'Pinned',          value: thread.isPinned ? 'Yes' : 'No' },
                      { label: 'Tags',            value: (thread.tags || []).length > 0 ? (thread.tags || []).join(', ') : 'None' },
                    ].map(row => (
                      <div key={row.label} className="px-5 py-3 flex flex-wrap items-center justify-between gap-4">
                        <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest shrink-0">{row.label}</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-200 text-right truncate">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick stats visual */}
                <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 gap-3">
                  {[
                    { icon: '💬', value: thread.replyCount || 0, label: 'Replies' },
                    { icon: '👁️', value: thread.views || 0, label: 'Views' },
                    { icon: '🏷️', value: (thread.tags || []).length, label: 'Tags' },
                  ].map(s => (
                    <div key={s.label} className="bg-[#121824] border border-[#1f293d] rounded-2xl p-4 text-center">
                      <span className="text-xl block mb-1">{s.icon}</span>
                      <p className="text-lg font-black text-white">{s.value}</p>
                      <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Thread permalink */}
                <div className="bg-[#121824] border border-[#1f293d] rounded-3xl p-5 space-y-2">
                  <h3 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest">Permalink</h3>
                  <div className="flex flex-wrap items-center gap-2 bg-[#090d16] border border-[#1f293d] rounded-2xl px-4 py-3">
                    <span className="text-slate-500 text-sm shrink-0">🔗</span>
                    <p className="text-xs sm:text-sm text-slate-400 font-mono truncate flex-1">
                      {window.location.origin}/#/forum/thread/{thread.id}
                    </p>
                    <button onClick={handleCopyLink}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black uppercase rounded-xl transition-all shrink-0">
                      {copiedLink ? '✅' : 'Copy'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── BOTTOM CLOSE BAR ── */}
      <div className="shrink-0 border-t border-[#1f293d]/60 bg-slate-950/50 backdrop-blur-xl px-4 py-3">
        <button
          onClick={onClose}
          className="w-full max-w-2xl mx-auto block py-3.5 bg-[#121824] hover:bg-slate-800 border border-[#1f293d] text-slate-300 hover:text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all flex flex-wrap items-center justify-center gap-2"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Topic
        </button>
      </div>
    </motion.div>
  );
};

// ── Sub-components ──────────────────────────────────

interface ActionBtnProps {
  icon: string;
  label: string;
  color?: 'default' | 'amber' | 'teal' | 'rose' | 'indigo';
  onClick: () => void;
}

const COLOR_MAP: Record<string, string> = {
  default: 'bg-[#090d16] border-[#1f293d] text-slate-300 hover:border-slate-700 hover:text-white',
  amber:   'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/40',
  teal:    'bg-teal-500/10 border-teal-500/20 text-teal-400 hover:bg-teal-500/20 hover:border-teal-500/40',
  rose:    'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/40',
  indigo:  'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-500/40',
};

const ActionBtn: React.FC<ActionBtnProps> = ({ icon, label, color = 'default', onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-wrap items-center gap-2.5 p-3.5 rounded-2xl border text-left transition-all active:scale-[0.97] group ${COLOR_MAP[color]}`}
  >
    <span className="text-base shrink-0 group-hover:scale-110 transition-transform">{icon}</span>
    <span className="text-xs sm:text-sm font-black uppercase tracking-wide leading-snug">{label}</span>
  </button>
);

interface StaffToggleRowProps {
  icon: string;
  label: string;
  desc: string;
  isActive: boolean;
  activeColor: 'amber' | 'rose' | 'slate';
  onToggle: () => void;
  disabled?: boolean;
}

const TOGGLE_COLORS: Record<string, string> = {
  amber: 'bg-amber-500',
  rose:  'bg-rose-500',
  slate: 'bg-slate-600',
};

const StaffToggleRow: React.FC<StaffToggleRowProps> = ({ icon, label, desc, isActive, activeColor, onToggle, disabled }) => (
  <div className={`px-5 py-4 flex flex-wrap items-center justify-between gap-4 ${disabled ? 'opacity-40' : ''}`}>
    <div className="flex flex-wrap items-center gap-3 min-w-0">
      <span className="text-lg shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-black text-white">{label}</p>
        <p className="text-xs sm:text-sm text-slate-500 font-bold">{desc}</p>
      </div>
    </div>
    <button
      onClick={!disabled ? onToggle : undefined}
      disabled={disabled}
      className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${isActive ? TOGGLE_COLORS[activeColor] : 'bg-slate-700'}`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all ${isActive ? 'left-7' : 'left-1'}`} />
    </button>
  </div>
);

export default TopicOptionsPane;

