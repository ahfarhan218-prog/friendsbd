import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoutEntry, User } from '../types';
import { parseMentions } from '../utils/textUtils';
import { BBCodeParser } from './BBCodeParser';

const REACTIONS = [
  { type: 'like',  icon: '👍', label: 'Like',  bg: 'from-blue-500 to-blue-600'   },
  { type: 'love',  icon: '❤️', label: 'Love',  bg: 'from-rose-500 to-pink-600'   },
  { type: 'haha',  icon: '😆', label: 'Haha',  bg: 'from-yellow-400 to-amber-500'},
  { type: 'wow',   icon: '😮', label: 'Wow',   bg: 'from-orange-400 to-amber-500'},
  { type: 'sad',   icon: '😢', label: 'Sad',   bg: 'from-sky-400 to-blue-500'    },
  { type: 'fire',  icon: '🔥', label: 'Fire',  bg: 'from-orange-500 to-red-600'  },
];

const PIN_DURATIONS = [
  { label: '1 Min', value: 1 },
  { label: '2 Min', value: 2 },
  { label: '3 Min', value: 3 },
  { label: '5 Min', value: 5 },
  { label: '1 Hour', value: 60 },
  { label: '24 Hours', value: 1440 },
  { label: '7 Days', value: 10080 },
  { label: 'Forever', value: -1 },
];

interface Props {
  shout: ShoutEntry;
  currentUser: User;
  onReact: (id: string, type: string) => void;
  onReply: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
  onPin?: (id: string, minutes?: number) => void;
  onToggleLock?: (id: string) => void;
  onEdit?: (shout: ShoutEntry) => void;
  onSwipeReply?: (shout: ShoutEntry) => void;
  showId?: boolean;
}

const formatShoutTime = (timestamp: number): string => {
  if (!timestamp) return 'Just now';
  const diff = Date.now() - timestamp;
  if (diff < 30000) {
    return 'Just now';
  }
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const ShoutCard: React.FC<Props> = ({ shout, currentUser, onReact, onReply, onDelete, onPin, onToggleLock, onEdit, onSwipeReply }) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showPinMenu, setShowPinMenu] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isDraggedPast, setIsDraggedPast] = useState(false);
  const [timeLabel, setTimeLabel] = useState(() => formatShoutTime(shout.timestamp));
  const [showReactionsModal, setShowReactionsModal] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const reactionsRef = useRef<HTMLDivElement>(null);

  const isOwner = currentUser.id === shout.userId;
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'moderator' || currentUser.isPremium;
  const isSuperAdmin = currentUser.role === 'admin';
  const myReaction = shout.userReactions?.[currentUser.id];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowPinMenu(false);
      }
      if (reactionsRef.current && !reactionsRef.current.contains(e.target as Node)) {
        setShowReactions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLabel(formatShoutTime(shout.timestamp));
    }, 10000);
    return () => clearInterval(interval);
  }, [shout.timestamp]);

  useEffect(() => {
    if (showReactionsModal) {
      try {
        const saved = localStorage.getItem('friends_bd_users');
        if (saved) setAllUsers(JSON.parse(saved));
      } catch (e) {}
    }
  }, [showReactionsModal]);

  const reactionCounts = Object.values(shout.userReactions || {}).reduce((acc: Record<string,number>, type) => {
    acc[type as string] = (acc[type as string] || 0) + 1;
    return acc;
  }, {});

  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    onReply(shout.id, replyText);
    setReplyText('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-[1.75rem] overflow-visible ${shout.isPinned
        ? 'ring-2 ring-amber-400/40 shadow-xl shadow-amber-900/20'
        : 'shadow-lg shadow-black/20'}`}>

      {/* Pinned badge */}
      {shout.isPinned && (
        <div className="absolute -top-3 -right-2 z-20 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg shadow-amber-500/30 flex items-center gap-1">
          📌 Pinned
        </div>
      )}

      {/* Swipe Reply Background Indicator */}
      {onSwipeReply && (
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center justify-start pointer-events-none z-0">
          <motion.div
            animate={{
              scale: isDraggedPast ? 1.25 : 0.95,
              opacity: isDraggedPast ? 1 : 0.4,
              backgroundColor: isDraggedPast ? 'rgba(124, 58, 237, 0.4)' : 'rgba(124, 58, 237, 0.1)',
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-10 h-10 rounded-full border border-purple-500/30 flex items-center justify-center text-purple-400 text-sm"
          >
            ↩️
          </motion.div>
        </div>
      )}

      <motion.div
        drag={onSwipeReply ? "x" : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 100 }}
        dragElastic={{ left: 0, right: 0.5 }}
        onDrag={(event, info) => {
          if (info.offset.x > 60) {
            if (!isDraggedPast) setIsDraggedPast(true);
          } else {
            if (isDraggedPast) setIsDraggedPast(false);
          }
        }}
        onDragEnd={(event, info) => {
          setIsDraggedPast(false);
          if (info.offset.x > 60 && onSwipeReply) {
            onSwipeReply(shout);
          }
        }}
        className={`rounded-[1.75rem] border overflow-visible relative z-10 ${shout.isPinned
          ? 'bg-gradient-to-br from-[#1e1a00] to-[#1C1C2E] border-amber-500/20'
          : 'bg-[#1C1C2E] border-white/5'}`}
        style={{ x: 0 }}
      >

        {/* CARD HEADER */}
        <div className="flex items-start justify-between p-4 pb-0">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${shout.username}`} className="shrink-0">
              <div className="relative">
                <img src={shout.avatar} className="w-11 h-11 rounded-xl object-cover border-2 border-white/10" alt="" />
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#1C1C2E] rounded-full" />
              </div>
            </Link>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link to={`/profile/${shout.username}`} className="text-sm font-black text-white hover:text-purple-300 transition-colors">
                  {shout.user}
                </Link>
                {(shout.userId === 'bot_chatgirl' || shout.username === 'chatgirl' || shout.userId === 1) && (
                  <span className="text-[8px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest border border-purple-500/30">🤖 Bot</span>
                )}
                {shout.isPremium && <span title="Premium" className="text-[10px] bg-amber-400/20 text-amber-400 px-1.5 py-0.5 rounded-full font-black">👑</span>}
                {shout.isQuiz && <span className="text-[8px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">❓ Quiz</span>}
                {shout.isClosed && <span className="text-[8px] bg-rose-400/20 text-rose-400 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">{shout.isQuiz ? 'Comments Hidden' : 'Locked'}</span>}
              </div>
              <p className="text-[9px] text-white/30 font-bold mt-0.5">
                {timeLabel}
                {shout.pinExpiry && <span className="text-amber-400/70 ml-2">· Expires {new Date(shout.pinExpiry).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
              </p>
            </div>
          </div>

          {/* Options Menu */}
          <div className="relative shrink-0" ref={menuRef}>
            <button onClick={() => { setShowMenu(!showMenu); setShowPinMenu(false); }}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white active:scale-90 transition-all">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div initial={{ opacity: 0, scale: 0.9, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -5 }}
                  className="absolute top-10 right-0 w-48 bg-[#252540] border border-white/10 rounded-2xl shadow-2xl p-2 z-[60]">
                  {(isOwner || isAdmin) && (
                    <button onClick={() => { onEdit?.(shout); setShowMenu(false); }}
                      className="w-full text-left px-3 py-2.5 text-[10px] font-black uppercase text-white/60 hover:bg-white/10 hover:text-white rounded-xl transition-all flex items-center gap-3">
                      ✏️ Edit Shout
                    </button>
                  )}
                  {isAdmin && (
                    <>
                      <div className="relative">
                        <button onClick={() => shout.isPinned ? (onPin?.(shout.id), setShowMenu(false)) : setShowPinMenu(!showPinMenu)}
                          className="w-full text-left px-3 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all flex items-center justify-between text-amber-400/70 hover:bg-amber-400/10 hover:text-amber-400">
                          <span className="flex items-center gap-3">📌 {shout.isPinned ? 'Unpin' : 'Pin Shout'}</span>
                          {!shout.isPinned && <span className="text-white/20">›</span>}
                        </button>
                        <AnimatePresence>
                          {showPinMenu && (
                            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                              className="absolute right-full top-0 mr-2 w-36 bg-[#252540] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50">
                              {PIN_DURATIONS.map(d => (
                                <button key={d.label} onClick={() => { onPin?.(shout.id, d.value); setShowPinMenu(false); setShowMenu(false); }}
                                  className="w-full text-left px-3 py-2 text-[9px] font-black uppercase text-white/50 hover:bg-white/10 hover:text-white rounded-lg transition-all">
                                  {d.label}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <button onClick={() => { onToggleLock?.(shout.id); setShowMenu(false); }}
                        className="w-full text-left px-3 py-2.5 text-[10px] font-black uppercase text-white/60 hover:bg-orange-400/10 hover:text-orange-400 rounded-xl transition-all flex items-center gap-3">
                        {shout.isClosed ? '🔓 Open Comments' : '🔒 Hide/Close Comments'}
                      </button>
                      <button onClick={() => { onDelete?.(shout.id); setShowMenu(false); }}
                        className="w-full text-left px-3 py-2.5 text-[10px] font-black uppercase text-rose-400/70 hover:bg-rose-400/10 hover:text-rose-400 rounded-xl transition-all flex items-center gap-3">
                        🗑️ Delete
                      </button>
                    </>
                  )}
                  {!isAdmin && !isOwner && (
                    <button className="w-full text-left px-3 py-2.5 text-[10px] font-black uppercase text-rose-400/70 hover:bg-rose-400/10 hover:text-rose-400 rounded-xl transition-all flex items-center gap-3">
                      🚩 Report
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* CONTENT */}
        <div className="px-4 py-3">
          <div className="text-sm leading-relaxed font-medium bbcode-render bbcode-render-dark">
            <BBCodeParser rawText={shout.content} />
          </div>
        </div>

        {/* REACTION PILLS */}
        {totalReactions > 0 && (
          <div 
            onClick={() => setShowReactionsModal(true)} 
            className="px-4 pb-2 flex flex-wrap gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            title="View who reacted"
          >
            {Object.entries(reactionCounts).map(([type, count]) => (
              <div key={type} className="flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
                <span className="text-xs">{REACTIONS.find(r => r.type === type)?.icon || '👍'}</span>
                <span className="text-[9px] font-black text-white/40">{count}</span>
              </div>
            ))}
          </div>
        )}

        {/* ACTION BAR */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-white/5">

          {/* React Button */}
          <div className="relative" ref={reactionsRef}>
            <button
              onClick={() => !shout.isClosed && setShowReactions(!showReactions)}
              disabled={shout.isClosed}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                myReaction
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30'
                  : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
              } ${shout.isClosed ? 'opacity-30 cursor-not-allowed' : ''}`}>
              <span>{myReaction ? REACTIONS.find(r => r.type === myReaction)?.icon : '👍'}</span>
              <span>{myReaction || 'React'}</span>
            </button>

            <AnimatePresence>
              {showReactions && !shout.isClosed && (
                <motion.div initial={{ opacity: 0, y: 8, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.9 }}
                  className="absolute bottom-full left-0 mb-2 flex gap-1 p-2 bg-[#252540] border border-white/10 rounded-2xl shadow-2xl z-[60]">
                  {REACTIONS.map(r => (
                    <button key={r.type} onClick={() => { onReact(shout.id, r.type); setShowReactions(false); }}
                      title={r.label}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:scale-125 active:scale-90 ${myReaction === r.type ? `bg-gradient-to-br ${r.bg}` : 'hover:bg-white/10'}`}>
                      <span className="text-lg">{r.icon}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Reply Toggle */}
          <button 
            onClick={() => setShowReplies(!showReplies)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${
              shout.isClosed 
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20' 
                : showReplies 
                  ? 'bg-purple-600/30 text-purple-300' 
                  : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>{shout.isClosed ? '🔒' : '💬'}</span>
            <span>{shout.isClosed ? `Quiz Mode (${shout.replies?.length || 0})` : shout.replies?.length || 0}</span>
          </button>
        </div>

        {/* REPLIES */}
        <AnimatePresence>
          {showReplies && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/5 overflow-hidden">
              <div className="p-4 space-y-3">
                {/* Quiz/Hidden Comments Banner */}
                {shout.isClosed && (
                  <div className="text-center py-2 px-3 text-[9px] font-black text-rose-400/80 uppercase tracking-widest bg-rose-500/5 rounded-xl border border-rose-500/10">
                    {isSuperAdmin 
                      ? '🔒 Quiz/Private Mode Active (Showing all replies to Admins)' 
                      : '🔒 Quiz Active: Your answers are hidden from other members.'}
                  </div>
                )}

                {/* Existing replies */}
                {(() => {
                  const visibleReplies = [...(shout.replies || [])]
                    .filter(reply => !shout.isClosed || isSuperAdmin || reply.userId === currentUser.id)
                    .sort((a, b) => b.timestamp - a.timestamp);

                  return visibleReplies.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {visibleReplies.map(reply => (
                        <div key={reply.id} className="flex items-start gap-2.5">
                          <img src={reply.userAvatar} className="w-7 h-7 rounded-lg object-cover border border-white/5 shrink-0 mt-0.5" alt="" />
                          <div className="flex-1 bg-white/5 rounded-2xl px-3 py-2 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <Link 
                                to={`/profile/${reply.username}`} 
                                className="text-[10px] font-black text-purple-300/80 hover:text-purple-400 transition-colors"
                              >
                                {reply.userName}
                              </Link>
                              <span className="text-[8px] text-white/30 font-bold font-mono">
                                {new Date(reply.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                            <div className="text-xs leading-snug bbcode-render bbcode-render-dark">
                              <BBCodeParser rawText={reply.content} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-[10px] text-white/20 font-bold uppercase tracking-widest py-2">
                      {shout.isClosed && !isSuperAdmin ? 'Your answers will appear here' : 'No replies yet'}
                    </p>
                  );
                })()}

                {/* Reply input */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 focus-within:border-purple-500/40 transition-colors">
                  <img src={currentUser.avatar} className="w-7 h-7 rounded-lg object-cover border border-white/10 shrink-0" alt="" />
                  <input value={replyText} onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                    placeholder={shout.isClosed ? "Write your answer..." : "Write a reply..."}
                    className="flex-1 bg-transparent border-none text-sm text-white/80 placeholder-white/20 py-3 outline-none font-medium" />
                  <button onClick={handleSendReply} disabled={!replyText.trim()}
                    className="w-8 h-8 bg-purple-600 disabled:opacity-30 text-white rounded-xl flex items-center justify-center active:scale-90 transition-all shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* REACTIONS DETAIL MODAL */}
      <AnimatePresence>
        {showReactionsModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReactionsModal(false)}
              className="fixed inset-0 bg-black/85 z-[300] backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1C1C2E] border border-purple-500/20 rounded-[2rem] shadow-2xl p-6 w-[90%] max-w-sm max-h-[70vh] overflow-y-auto z-[301] font-inter text-white"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-300">👍 Reactions ({totalReactions})</h3>
                <button
                  onClick={() => setShowReactionsModal(false)}
                  className="text-white/40 hover:text-white bg-white/5 w-6 h-6 rounded-full flex items-center justify-center transition-all text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                {Object.entries(shout.userReactions || {}).map(([userId, type]) => {
                  const u = allUsers.find(x => x.id === userId) || {
                    id: userId,
                    name: 'User',
                    username: 'user_' + userId.substring(0, 4),
                    avatar: `https://picsum.photos/seed/${userId}/100`
                  };
                  const reactIcon = REACTIONS.find(r => r.type === type)?.icon || '👍';
                  return (
                    <div key={userId} className="flex items-center justify-between p-2.5 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                      <Link
                        to={`/profile/${u.username}`}
                        onClick={() => setShowReactionsModal(false)}
                        className="flex items-center gap-3 min-w-0"
                      >
                        <img src={u.avatar} className="w-9 h-9 rounded-xl object-cover border border-white/10 shrink-0" alt="" />
                        <div className="min-w-0">
                          <p className="text-xs font-black text-white truncate">{u.name}</p>
                          <p className="text-[9px] text-purple-400 font-bold">@{u.username}</p>
                        </div>
                      </Link>
                      <span className="text-xl bg-white/5 w-8 h-8 rounded-full flex items-center justify-center border border-white/5 shadow-md">
                        {reactIcon}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ShoutCard;
