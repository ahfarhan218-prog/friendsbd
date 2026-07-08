import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoutEntry, User } from '../types';
import ShoutCard from '../components/ShoutCard';
import { mongoService } from '../services/mongoService';
import { triggerToast } from '../components/NotificationToast';
import { apTransactionService } from '../services/apTransactionService';

const QUICK_EMOJIS = ['🔥', '💯', '🇧🇩', '🏏', '😂', '❤️', '👀', '✨'];

const ShoutHistory: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get('id');

  const [shouts, setShouts] = useState<ShoutEntry[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [filter, setFilter] = useState<'all' | 'mine' | 'pinned'>('all');
  const [shoutText, setShoutText] = useState('');
  const [editingShout, setEditingShout] = useState<ShoutEntry | null>(null);
  const [replyingTo, setReplyingTo] = useState<ShoutEntry | null>(null);
  const [shoutType, setShoutType] = useState<'normal' | 'quiz'>('normal');
  const [isLockdown, setIsLockdown] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shoutsRef = useRef<ShoutEntry[]>([]);
  shoutsRef.current = shouts;

  useEffect(() => {
    // Load active user session
    const savedSession = localStorage.getItem('user_session');
    if (savedSession) {
      try {
        setActiveUser(JSON.parse(savedSession));
      } catch (e) {
        console.error(e);
      }
    }

    // Load lockdown state
    setIsLockdown(localStorage.getItem('friends_bd_lockdown') === 'true');

    // Live sync shouts from Firebase
    const unsubShouts = mongoService.listenShouts(s => {
      setShouts(s);
      localStorage.setItem('friends_bd_shouts', JSON.stringify(s));
    });

    // Auto cleanup expired pins and comments locking every 5 seconds
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      shoutsRef.current.forEach(async (shout) => {
        if (shout.pinExpiry && shout.pinExpiry < now) {
          if (shout.isPinned || shout.isClosed) {
            try {
              const cleanedShout = JSON.parse(JSON.stringify({
                ...shout,
                isPinned: false,
                isClosed: false,
                pinExpiry: null
              }));
              await mongoService.addShout(cleanedShout);
            } catch (e) {
              console.warn('Failed to auto-cleanup shout:', e);
            }
          }
        }
      });
    }, 5000);

    return () => {
      unsubShouts();
      clearInterval(cleanupInterval);
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to highlighted shout if present
    if (highlightedId && shouts.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`shout-${highlightedId}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [highlightedId, shouts]);

  const saveShouts = (newShouts: ShoutEntry[]) => {
    setShouts(newShouts);
    localStorage.setItem('friends_bd_shouts', JSON.stringify(newShouts));
    newShouts.forEach(sh => {
      const cleanSh = JSON.parse(JSON.stringify(sh));
      mongoService.addShout(cleanSh);
    });
  };

  const handleAddShout = () => {
    if (!shoutText.trim() || isLockdown) return;
    if (editingShout) {
      const updated = shouts.map(s =>
        s.id === editingShout.id ? { ...s, content: shoutText, time: 'Edited' } : s
      );
      saveShouts(updated);
      setEditingShout(null);
      triggerToast({
        id: 'shout-edited-' + Date.now(),
        senderId: 'system',
        senderName: 'FriendsBD',
        senderAvatar: activeUser.avatar,
        type: 'SYSTEM',
        message: '✏️ Shout updated successfully!',
        timestamp: Date.now(),
        isRead: false
      });
    } else {
      const counter = parseInt(localStorage.getItem('shout_id_counter') || '100') + 1;
      const targetUsername = replyingTo 
        ? (replyingTo.username || replyingTo.user.toLowerCase().replace(/\s+/g, '')) 
        : '';
      
      const contentWithReply = replyingTo
        ? `@${targetUsername} [Reply to #${replyingTo.displayId}](/shouts?id=${replyingTo.id}) ${shoutText}`
        : shoutText;

      const isQuiz = shoutType === 'quiz';
      const newShout: ShoutEntry = {
        id: Date.now().toString(),
        displayId: counter,
        user: activeUser.name,
        username: activeUser.username || activeUser.name.toLowerCase().replace(/\s+/g, ''),
        userId: activeUser.id,
        avatar: activeUser.avatar,
        content: contentWithReply,
        time: 'Just now',
        timestamp: Date.now(),
        userReactions: {},
        replies: [],
        isPremium: !!activeUser.isPremium,
        isPinned: isQuiz ? true : false,
        isClosed: isQuiz ? true : false,
        pinExpiry: isQuiz ? Date.now() + 3 * 60 * 1000 : undefined,
        isQuiz: isQuiz
      };
      saveShouts([newShout, ...shouts]);
      setShoutType('normal');
      localStorage.setItem('shout_id_counter', counter.toString());
      
      apTransactionService.adjustUserAP(activeUser.id, 'SHOUT_POSTED').catch(e => console.warn('AP Add Failed:', e));
      
      mongoService.addActivity({
        id: 'act_' + Date.now(),
        time: new Date().toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' }),
        username: activeUser.username || activeUser.name,
        msg: 'Posted a shout.',
        timestamp: Date.now()
      });

      triggerToast({
        id: 'shout-ok-' + Date.now(),
        senderId: 'system',
        senderName: 'FriendsBD',
        senderAvatar: activeUser.avatar,
        type: 'SYSTEM',
        message: '🚀 Your shout is live!',
        timestamp: Date.now(),
        isRead: false
      });

      // Direct reply notification
      if (replyingTo && replyingTo.userId !== activeUser.id) {
        import('../services/notificationService').then(({ notificationService }) => {
          notificationService.sendNotification(
            replyingTo.userId,
            'MENTION',
            { id: activeUser.id, name: activeUser.name, avatar: activeUser.avatar },
            `replied to your shout: "${shoutText.substring(0, 30)}..."`,
            `/shouts?id=${newShout.id}`
          );
        }).catch(err => console.warn('Reply notification error:', err));
      }

      // Mentions
      import('../services/notificationService').then(({ notificationService }) => {
        notificationService.handleMentions(
          contentWithReply,
          { id: activeUser.id, name: activeUser.name, avatar: activeUser.avatar },
          '/shouts',
          `shout`
        );
      }).catch(err => console.warn('Mentions trigger error:', err));
      
      setReplyingTo(null);
    }
    setShoutText('');
  };

  const handleReact = (id: string, type: string) => {
    if (isLockdown) return;
    const shout = shouts.find(s => s.id === id);
    if (shout && activeUser.id !== shout.userId) {
      import('../services/notificationService').then(({ notificationService }) => {
        notificationService.sendNotification(
          shout.userId,
          'REACTION',
          { id: activeUser.id, name: activeUser.name, avatar: activeUser.avatar },
          `reacted ${type} to your shout: "${shout.content.substring(0, 30)}..."`,
          `/shouts?id=${shout.id}`
        );
      }).catch(err => console.warn('Reaction notification error:', err));
    }
    saveShouts(shouts.map(s => s.id === id ? { ...s, userReactions: { ...s.userReactions, [activeUser.id]: type } } : s));
  };

  const handleReply = (id: string, content: string) => {
    if (isLockdown) return;
    const shout = shouts.find(s => s.id === id);
    if (shout) {
      if (activeUser.id !== shout.userId) {
        import('../services/notificationService').then(({ notificationService }) => {
          notificationService.sendNotification(
            shout.userId,
            'LIKE',
            { id: activeUser.id, name: activeUser.name, avatar: activeUser.avatar },
            `replied to your shout: "${content.substring(0, 30)}..."`,
            `/shouts?id=${shout.id}`
          );
        }).catch(err => console.warn('Reply notification error:', err));
      }
      import('../services/notificationService').then(({ notificationService }) => {
        notificationService.handleMentions(
          content,
          { id: activeUser.id, name: activeUser.name, avatar: activeUser.avatar },
          '/shouts',
          `reply to shout`
        );
      }).catch(err => console.warn('Reply mentions error:', err));
    }
    saveShouts(shouts.map(s => s.id === id ? { ...s, replies: [...(s.replies||[]), { id: Math.random().toString(), userId: activeUser.id, userName: activeUser.name, userAvatar: activeUser.avatar, content, timestamp: Date.now() }] } : s));
  };

  const handlePin = (id: string, minutes?: number) => {
    if (!['admin','moderator'].includes(activeUser.role || '') && !activeUser.isPremium) return;
    saveShouts(shouts.map(s => {
      if (s.id !== id) return s;
      const pinning = !s.isPinned;
      return { ...s, isPinned: pinning, pinExpiry: pinning && minutes && minutes !== -1 ? Date.now() + minutes * 60000 : undefined };
    }));
  };

  const handleToggleLock = (id: string) => {
    saveShouts(shouts.map(s => s.id === id ? { ...s, isClosed: !s.isClosed } : s));
  };

  const handleDelete = (id: string) => {
    const shoutToDelete = shouts.find(x => x.id === id);
    if (shoutToDelete) {
      const preview = (shoutToDelete.content || '').replace(/\[.*?\]/g, '').trim().substring(0, 80);
      mongoService.addAdminLog({
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        action: 'SHOUT_DELETED',
        targetId: id,
        targetType: 'shout',
        deletedBy: activeUser.id,
        deletedByName: activeUser.name,
        details: `"${preview}" by @${shoutToDelete.username}`,
        timestamp: Date.now()
      }).catch(e => console.warn('Failed to log deletion:', e));

      apTransactionService.adjustUserAP(shoutToDelete.userId, 'SHOUT_DELETED').catch(e => console.warn('AP Subtract Failed:', e));
    }
    mongoService.deleteShout(id);
    setShouts(shouts.filter(x => x.id !== id));
  };

  const handleEdit = (shout: ShoutEntry) => {
    setEditingShout(shout);
    setShoutText(shout.content);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filtered = shouts
    .filter(s => {
      if (filter === 'mine' && activeUser) return s.userId === activeUser.id;
      if (filter === 'pinned') return s.isPinned;
      return true;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.timestamp - a.timestamp;
    });

  if (!activeUser) return (
    <div className="min-h-screen bg-transparent flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent flex flex-col pb-24 font-inter text-white">
      {/* Premium Hero Header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#110a2a] via-[#1d0d4a] to-[#0d1a6b] pt-8 sm:pt-10 pb-16 sm:pb-20 px-4 sm:px-5 rounded-b-[2rem] sm:rounded-b-[3rem] shadow-2xl shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_0%,_#7c3aed33,_transparent_70%)]" />
        <div className="absolute top-8 right-4 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-4 left-8 w-24 h-24 bg-indigo-600/10 rounded-full blur-2xl" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => navigate('/home')}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all active:scale-90 border border-white/10 backdrop-blur-md"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h2 className="text-2xl font-black tracking-tight italic bg-gradient-to-r from-white via-purple-200 to-indigo-200 bg-clip-text text-transparent">
                Feed History
              </h2>
              <p className="text-xs font-black uppercase opacity-50 tracking-[0.2em] text-purple-300">
                Community Archive
              </p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-3 py-1.5 flex flex-wrap items-center gap-2">
            <span className="text-lg">📢</span>
            <span className="text-xs font-black font-mono text-purple-300">{shouts.length}</span>
          </div>
        </div>
      </header>

      {/* Content Container */}
      <div className="px-5 space-y-6 -mt-10 relative z-20">
        
        {/* Shout Composer Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-[#1C1C2E] border rounded-[2rem] overflow-hidden transition-colors shadow-2xl ${
            editingShout ? 'border-amber-500/30' : 'border-white/5 focus-within:border-purple-500/30'
          }`}
        >
          {editingShout && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-amber-400">✏️ Editing Shout</span>
              <button
                onClick={() => {
                  setEditingShout(null);
                  setShoutText('');
                }}
                className="text-xs font-black text-white/60 hover:text-white uppercase tracking-widest"
              >
                Cancel
              </button>
            </div>
          )}

          {replyingTo && (
            <div className="bg-purple-950/40 border-b border-purple-500/20 px-4 py-2.5 flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-xs font-black uppercase tracking-widest text-purple-400">↩️ Replying to @{replyingTo.username || replyingTo.user.toLowerCase().replace(/\s+/g, '')}</span>
                <p className="text-xs text-white/50 truncate mt-0.5">{replyingTo.content}</p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-xs sm:text-sm font-black text-white/60 hover:text-white bg-white/5 w-6 h-6 rounded-full flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>
          )}

          {/* Composer Header */}
          <div className="flex flex-wrap items-center gap-3 px-4 pt-4">
            <img src={activeUser.avatar} className="w-9 h-9 rounded-xl object-cover border-2 border-white/10 shrink-0" alt="" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white">{activeUser.name}</p>
              <p className="text-xs text-white/60 font-bold">Broadcasting to archive stream</p>
            </div>
            <span className="text-xs font-black text-white/40 font-mono">{shoutText.length} characters</span>
          </div>

          {/* Admin Shout Mode Selector */}
          {['admin', 'moderator'].includes(activeUser.role || '') && (
            <div className="flex flex-wrap gap-2 px-4 pt-3 pb-1 border-t border-white/5 bg-white/[0.02]">
              <button
                type="button"
                onClick={() => setShoutType('normal')}
                className={`flex flex-wrap items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  shoutType === 'normal'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                    : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
                }`}
              >
                📢 Normal Shout
              </button>
              <button
                type="button"
                onClick={() => setShoutType('quiz')}
                className={`flex flex-wrap items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  shoutType === 'quiz'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30'
                    : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
                }`}
              >
                ❓ Quiz Shout (3m Lock)
              </button>
            </div>
          )}

          {/* Text Area */}
          <div className="px-4 pt-2 pb-3">
            <textarea
              ref={textareaRef}
              value={shoutText}
              onChange={e => setShoutText(e.target.value)}
              disabled={isLockdown}
              placeholder={isLockdown ? '🔒 Posting is locked by administration' : 'What is on your mind? Shout it out!'}
              rows={3}
              className="w-full bg-transparent border-none text-sm text-white/80 placeholder-white/20 outline-none resize-none font-medium leading-relaxed"
            />
          </div>

          {/* Composer Footer */}
          <div className="flex items-center justify-between px-4 pb-4 border-t border-white/5 pt-3">
            <div className="flex gap-1 flex-wrap">
              {QUICK_EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => !isLockdown && setShoutText(prev => prev + e)}
                  disabled={isLockdown}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-sm active:scale-90 transition-all disabled:opacity-30"
                >
                  {e}
                </button>
              ))}
            </div>
            <button
              onClick={handleAddShout}
              disabled={!shoutText.trim() || isLockdown}
              className="flex flex-wrap items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-widest px-5 py-2.5 rounded-2xl shadow-lg shadow-purple-900/40 active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {editingShout ? 'Update' : 'Shout'}
            </button>
          </div>
        </motion.div>

        {/* Sticky Filter Bar */}
        <div className="sticky top-0 z-40 bg-[#0F0F1A]/80 backdrop-blur-xl py-2">
          <div className="bg-[#1C1C2E] p-1.5 rounded-[2rem] border border-white/5 flex flex-wrap gap-1.5 shadow-2xl">
            {[
              { id: 'all', label: 'All Shouts' },
              { id: 'mine', label: 'My Shouts' },
              { id: 'pinned', label: 'Pinned' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`flex-1 py-3 rounded-[1.5rem] text-xs sm:text-sm font-black uppercase tracking-widest transition-all ${
                  filter === f.id
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Shouts Feed */}
        <div className="space-y-4" ref={scrollContainerRef}>
          <AnimatePresence mode="popLayout">
            {filtered.length > 0 ? (
              filtered.map(s => (
                <div
                  key={s.id}
                  id={`shout-${s.id}`}
                  className={`transition-all duration-300 ${
                    highlightedId === s.id ? 'ring-4 ring-purple-500/30 rounded-[2rem]' : ''
                  }`}
                >
                  <ShoutCard
                    shout={s}
                    currentUser={activeUser}
                    onReact={handleReact}
                    onReply={handleReply}
                    onDelete={handleDelete}
                    onPin={handlePin}
                    onToggleLock={handleToggleLock}
                    onEdit={handleEdit}
                    onSwipeReply={setReplyingTo}
                    showId={false}
                  />
                </div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 text-center bg-[#1C1C2E] rounded-[2rem] border border-white/5"
              >
                <div className="text-5xl mb-4">📜</div>
                <p className="text-sm font-black text-white/40 uppercase tracking-widest">No entries found</p>
                <p className="text-xs sm:text-sm text-white/40 font-bold mt-1">Try changing your filter options</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default ShoutHistory;

