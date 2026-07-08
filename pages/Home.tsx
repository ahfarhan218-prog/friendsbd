import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoutEntry, SiteNotification, User } from '../types';
import ShoutCard from '../components/ShoutCard';
import { triggerToast } from '../components/NotificationToast';
import { mongoService } from '../services/mongoService';
import { apTransactionService } from '../services/apTransactionService';

const QUICK_EMOJIS = ['🔥', '💯', '🇧🇩', '🏏', '😂', '❤️', '👀', '✨'];

const formatOnlineTime = (seconds?: number): string => {
  if (!seconds) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m`;
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [shoutText, setShoutText] = useState('');
  const [shouts, setShouts] = useState<ShoutEntry[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [editingShout, setEditingShout] = useState<ShoutEntry | null>(null);
  const [replyingTo, setReplyingTo] = useState<ShoutEntry | null>(null);
  const [announcement, setAnnouncement] = useState('Welcome to FriendsBD! Join the Cricket Tournament today 🏏');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLockdown, setIsLockdown] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [shoutType, setShoutType] = useState<'normal' | 'quiz'>('normal');
  const shoutsRef = useRef<ShoutEntry[]>([]);
  shoutsRef.current = shouts;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedSession = localStorage.getItem('user_session');
    if (savedSession) {
      try {
        const parsedUser = JSON.parse(savedSession);
        setActiveUser(parsedUser);
        const isOnline = !parsedUser.ghostMode;
        mongoService.addUser({ ...parsedUser, isOnline });
      } catch (e) { console.error(e); }
    }

    const savedAnn = localStorage.getItem('friends_bd_announcement');
    if (savedAnn) setAnnouncement(savedAnn);
    setIsLockdown(localStorage.getItem('friends_bd_lockdown') === 'true');
    setIsMaintenance(localStorage.getItem('friends_bd_maintenance') === 'true');

    const unsubUsers = mongoService.listenUsers(users => {
      setUsersList(users);
      localStorage.setItem('friends_bd_users', JSON.stringify(users));
    });
    const unsubShouts = mongoService.listenShouts(s => {
      setShouts(s);
      localStorage.setItem('friends_bd_shouts', JSON.stringify(s));
    });
    const unsubPhotos = mongoService.listenPhotos(p => {
      setPhotos(p);
      localStorage.setItem('friends_bd_recent_photos', JSON.stringify(p));
    });
    const unsubActs = mongoService.listenActivities(a => {
      setActivities(a);
      localStorage.setItem('friends_bd_activities', JSON.stringify(a));
    });

    const handleStorage = () => {
      const ann = localStorage.getItem('friends_bd_announcement');
      if (ann) setAnnouncement(ann);
      setIsLockdown(localStorage.getItem('friends_bd_lockdown') === 'true');
      setIsMaintenance(localStorage.getItem('friends_bd_maintenance') === 'true');
      const sess = localStorage.getItem('user_session');
      if (sess) { try { setActiveUser(JSON.parse(sess)); } catch (e) {} }
    };
    window.addEventListener('storage', handleStorage);

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

    // ── Online presence tracking ──────────────────────────────────────────────
    // Update current user's isOnline + lastActiveTime in Firestore every 60 seconds
    let presenceUserId: string | null = null;
    try {
      const sess = localStorage.getItem('user_session');
      if (sess) presenceUserId = JSON.parse(sess).id;
    } catch (_) {}

    const updatePresence = () => {
      if (!presenceUserId) return;
      let isOnline = true;
      try {
        const sess = localStorage.getItem('user_session');
        if (sess) {
          isOnline = !JSON.parse(sess).ghostMode;
        }
      } catch (_) {}
      mongoService.updateUser(presenceUserId, {
        isOnline,
        lastActiveTime: Date.now()
      });
    };
    updatePresence(); // run immediately on load
    const presenceInterval = setInterval(updatePresence, 60000); // every 60s

    // Mark offline when page is closed/navigated away
    const markOffline = () => {
      if (!presenceUserId) return;
      mongoService.updateUser(presenceUserId, { isOnline: false });
    };
    window.addEventListener('beforeunload', markOffline);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('beforeunload', markOffline);
      unsubUsers(); unsubShouts(); unsubPhotos(); unsubActs();
      clearInterval(cleanupInterval);
      clearInterval(presenceInterval);
      markOffline(); // mark offline on component unmount too
    };
  }, []);

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
      saveShouts(shouts.map(s => s.id === editingShout.id ? { ...s, content: shoutText, time: 'Edited' } : s));
      setEditingShout(null);
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
      
      // Award AP
      apTransactionService.adjustUserAP(activeUser.id, 'SHOUT_POSTED')
        .then(({ newBalance }) => {
          const saved = localStorage.getItem('user_session');
          if (saved) {
            const parsed = JSON.parse(saved);
            parsed.balance_ap = newBalance;
            localStorage.setItem('user_session', JSON.stringify(parsed));
            window.dispatchEvent(new Event('storage'));
          }
        })
        .catch(err => console.warn('Failed to award shout AP:', err));

      setShoutType('normal');
      localStorage.setItem('shout_id_counter', counter.toString());
      mongoService.addActivity({
        id: 'act_' + Date.now(),
        time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        username: activeUser.username || activeUser.name,
        msg: 'Posted a shout.', timestamp: Date.now()
      });
      triggerToast({ id: 'shout-ok-' + Date.now(), senderId: 'system', senderName: 'FriendsBD', senderAvatar: activeUser.avatar, type: 'SYSTEM', message: '🚀 Your shout is live!', timestamp: Date.now(), isRead: false });

      // Swipe reply direct notification
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

      // Trigger mentions parsing
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
      // Trigger mentions for reply content
      import('../services/notificationService').then(({ notificationService }) => {
        notificationService.handleMentions(
          content,
          { id: activeUser.id, name: activeUser.name, avatar: activeUser.avatar },
          '/home',
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

  if (!activeUser) return (
    <div className="min-h-screen bg-transparent flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
    </div>
  );

  const isAdmin = activeUser.role === 'admin' || activeUser.role === 'moderator' || activeUser.isPremium;
  const sortedShouts = [...shouts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.timestamp - a.timestamp;
  }).slice(0, 20);

  const totalOnline = usersList.filter(u => u.isOnline && (!u.lastActiveTime || (Date.now() - u.lastActiveTime) <= 30 * 60 * 1000)).length || 1;
  const premiumCount = usersList.filter(u => u.isPremium).length;
  const staffCount = usersList.filter(u => u.role === 'admin' || u.role === 'moderator').length;
  const newestUser = usersList.length > 0 ? usersList[usersList.length - 1] : activeUser;
  
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  const midnightTime = midnight.getTime();
  
  const todayShouts = shouts.filter(s => s.timestamp >= midnightTime);
  const todayPhotos = photos.filter(p => p.timestamp >= midnightTime);
  
  const topShouter = (() => {
    if (!todayShouts.length) return { name: 'N/A', count: 0 };
    const counts: Record<string, number> = {};
    todayShouts.forEach(s => { counts[s.user] = (counts[s.user] || 0) + 1; });
    const [name, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];
    return { name, count };
  })();

  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

  if (isMaintenance && !isAdmin) return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="text-6xl mb-4 animate-bounce">🛠️</div>
      <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Maintenance Mode</h1>
      <p className="text-white/30 text-sm max-w-xs">We are performing server updates. Check back soon!</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent pb-28 font-inter">

      <header className="relative overflow-hidden bg-gradient-to-br from-[#110a2a] via-[#1d0d4a] to-[#0d1a6b] pt-12 pb-32 px-5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_0%,_#7c3aed33,_transparent_70%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0F0F1A] to-transparent" />
        {/* Floating orbs */}
        <div className="absolute top-8 right-4 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-12 left-8 w-24 h-24 bg-indigo-600/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                friends <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">bd</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button onClick={() => navigate('/admin')}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center border border-white/10 active:scale-90 transition-all">
                  ⚙️
                </button>
              )}
              <button onClick={() => navigate('/notifications')}
                className="relative w-10 h-10 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center border border-white/10 active:scale-90 transition-all">
                🔔
              </button>
            </div>
          </div>

          {/* ── TIME-BASED GREETING CARD ── */}
          {(() => {
            const h = currentTime.getHours();
            const greetings = [
              { range: [5, 12],  emoji: '☀️',  msg: 'Good Morning',   sub: 'Start your day strong!',         bg: 'from-amber-500/25 via-orange-500/15 to-yellow-600/10',  border: 'border-amber-400/20', dot: 'bg-amber-400' },
              { range: [12, 17], emoji: '🌤️',  msg: 'Good Afternoon', sub: "Hope you're having a great day!", bg: 'from-sky-500/25 via-blue-500/15 to-indigo-600/10',      border: 'border-sky-400/20',  dot: 'bg-sky-400' },
              { range: [17, 21], emoji: '🌆',  msg: 'Good Evening',   sub: 'Time to wind down & socialize.',  bg: 'from-violet-500/25 via-purple-500/15 to-fuchsia-600/10', border: 'border-violet-400/20', dot: 'bg-violet-400' },
              { range: [21, 24], emoji: '🌙',  msg: 'Good Night',     sub: 'Still up? We got you! 😄',        bg: 'from-indigo-500/25 via-blue-800/15 to-slate-800/10',    border: 'border-indigo-400/20', dot: 'bg-indigo-400' },
              { range: [0, 5],   emoji: '🌙',  msg: 'Good Night',     sub: 'Still up? We got you! 😄',        bg: 'from-indigo-500/25 via-blue-800/15 to-slate-800/10',    border: 'border-indigo-400/20', dot: 'bg-indigo-400' },
            ];
            const g = greetings.find(x => h >= x.range[0] && h < x.range[1])!;
            const displayName = activeUser.name?.split(' ')[0] || activeUser.username || 'Friend';
            return (
              <div className={`relative mb-4 rounded-2xl bg-gradient-to-br ${g.bg} border ${g.border} backdrop-blur-sm overflow-hidden`}>
                {/* shimmer line */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.15em] mb-0.5 truncate">{displayName}</p>
                    <p className="text-xl font-black text-white leading-tight tracking-tight">
                      {g.msg} <span className="inline-block">{g.emoji}</span>
                    </p>
                    <p className="text-[11px] text-white/50 font-medium mt-0.5">{g.sub}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-white font-mono tabular-nums tracking-tight">{formattedTime}</p>
                    <p className="text-[9px] text-white/35 font-bold mt-0.5">{formattedDate}</p>
                    <span className={`inline-flex items-center gap-1 mt-1 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/10`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${g.dot} animate-pulse`} />
                      Live
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Announcement ticker */}
          {announcement && (
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-3 overflow-hidden">
              <span className="text-[8px] font-black uppercase tracking-widest text-purple-300 bg-purple-500/30 px-2 py-1 rounded-lg shrink-0">📢 News</span>
              <div className="flex-1 overflow-hidden">
                <div className="whitespace-nowrap animate-marquee text-[11px] text-white/70 font-medium">{announcement}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{announcement}</div>
              </div>
            </div>
          )}

          {/* Online pulse */}
          <div className="flex items-center gap-2 mt-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{totalOnline} online now</span>
          </div>
        </div>
      </header>


      <div className="px-4 -mt-16 space-y-5 relative z-10">

        {/* ── PROFILE CARD ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/profile/' + activeUser.username)}
          className="bg-[#1C1C2E] border border-white/5 rounded-[2rem] p-4 flex items-center gap-4 cursor-pointer hover:border-purple-500/30 active:scale-[0.98] transition-all shadow-xl">
          <div className="relative shrink-0">
            <img src={activeUser.avatar} className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-500/30" alt="" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-[#1C1C2E] rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-black text-white">{activeUser.name}</span>
              {activeUser.isVerified && <span className="text-[10px]">✔️</span>}
              {activeUser.isPremium && <span className="text-[8px] bg-amber-400/20 text-amber-400 px-1.5 py-0.5 rounded-full font-black">👑 Premium</span>}
            </div>
            <p className="text-[10px] text-purple-400/70 font-bold mt-0.5">@{activeUser.username}</p>
            <p className="text-[9px] text-emerald-400 font-black flex items-center gap-1 mt-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5 w-fit">
              🟢 Today: {formatOnlineTime(activeUser.todayOnlineTime)}
            </p>
          </div>
          <div className="flex gap-4 text-center shrink-0">
            <div>
              <p className="text-lg font-black text-white">{activeUser.points || 0}</p>
              <p className="text-[8px] text-white/30 font-bold uppercase tracking-widest">XP</p>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <p className="text-lg font-black text-white">Lv.{activeUser.level || 1}</p>
              <p className="text-[8px] text-white/30 font-bold uppercase tracking-widest">Level</p>
            </div>
          </div>
        </motion.div>

        {/* ── QUICK STATS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: '🟢', label: 'Online', value: totalOnline, filter: 'online', color: 'from-emerald-600/20 to-emerald-700/20 border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-emerald-950/20' },
            { icon: '👑', label: 'Premium', value: premiumCount, filter: 'premium', color: 'from-amber-500/20 to-orange-600/20 border-amber-500/20 hover:border-amber-500/40 hover:shadow-amber-950/20' },
            { icon: '🛡️', label: 'Staff', value: staffCount, filter: 'staff', color: 'from-blue-600/20 to-indigo-600/20 border-blue-500/20 hover:border-blue-500/40 hover:shadow-blue-950/20' },
          ].map(s => (
            <button
              key={s.label}
              onClick={() => navigate(`/members?filter=${s.filter}`)}
              className={`bg-gradient-to-br ${s.color} border rounded-2xl p-3 text-center transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] hover:shadow-xl cursor-pointer outline-none`}
            >
              <span className="text-xl block mb-1">{s.icon}</span>
              <p className="text-lg font-black text-white">{s.value}</p>
              <p className="text-[8px] text-white/30 font-bold uppercase tracking-widest">{s.label}</p>
            </button>
          ))}
        </div>

        {/* ── SHOUT COMPOSER ── */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`bg-[#1C1C2E] border rounded-[2rem] overflow-hidden transition-colors ${editingShout ? 'border-amber-500/30' : 'border-white/5 focus-within:border-purple-500/30'}`}>
          {editingShout && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">✏️ Editing Shout</span>
              <button onClick={() => { setEditingShout(null); setShoutText(''); }}
                className="text-[9px] font-black text-white/30 hover:text-white uppercase tracking-widest">Cancel</button>
            </div>
          )}

          {replyingTo && (
            <div className="bg-purple-950/40 border-b border-purple-500/20 px-4 py-2.5 flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-purple-400">↩️ Replying to @{replyingTo.username || replyingTo.user.toLowerCase().replace(/\s+/g, '')}</span>
                <p className="text-xs text-white/50 truncate mt-0.5">{replyingTo.content}</p>
              </div>
              <button onClick={() => setReplyingTo(null)}
                className="text-[10px] font-black text-white/30 hover:text-white bg-white/5 w-6 h-6 rounded-full flex items-center justify-center transition-all">✕</button>
            </div>
          )}

          {/* Composer header */}
          <div className="flex items-center gap-3 px-4 pt-4">
            <img src={activeUser.avatar} className="w-9 h-9 rounded-xl object-cover border-2 border-white/10 shrink-0" alt="" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white">{activeUser.name}</p>
              <p className="text-[9px] text-white/30 font-bold">Broadcasting to all members</p>
            </div>
            <span className="text-[9px] font-black text-white/20 font-mono">{shoutText.length} characters</span>
          </div>

          {/* Admin Shout Mode Selector */}
          {['admin', 'moderator'].includes(activeUser.role || '') && (
            <div className="flex gap-2 px-4 pt-3 pb-1 border-t border-white/5 bg-white/[0.02]">
              <button
                type="button"
                onClick={() => setShoutType('normal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  shoutType === 'quiz'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30'
                    : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
                }`}
              >
                ❓ Quiz Shout (3m Lock)
              </button>
            </div>
          )}

          {/* Textarea */}
          <div className="px-4 pt-2 pb-3">
            <textarea
              ref={textareaRef}
              value={shoutText}
              onChange={e => setShoutText(e.target.value)}
              disabled={isLockdown}
              placeholder={isLockdown ? '🔒 Posting is locked by administration' : "What's on your mind?"}
              rows={3}
              className="w-full bg-transparent border-none text-sm text-white/80 placeholder-white/20 outline-none resize-none font-medium leading-relaxed"
            />
          </div>

          {/* Footer: emojis + send */}
          <div className="flex items-center justify-between px-4 pb-4 border-t border-white/5 pt-3">
            <div className="flex gap-1 flex-wrap">
              {QUICK_EMOJIS.map(e => (
                <button key={e} onClick={() => !isLockdown && setShoutText(prev => prev + e)}
                  disabled={isLockdown}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-sm active:scale-90 transition-all disabled:opacity-30">
                  {e}
                </button>
              ))}
            </div>
            <button onClick={handleAddShout} disabled={!shoutText.trim() || isLockdown}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-widest px-5 py-2.5 rounded-2xl shadow-lg shadow-purple-900/40 active:scale-95 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {editingShout ? 'Update' : 'Shout'}
            </button>
          </div>
        </motion.div>


        {/* ── SHOUT STREAM ── */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-600" />
            </span>
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Live Shout Stream</h3>
          </div>

          <AnimatePresence mode="popLayout">
            {sortedShouts.length > 0 ? (
              <div className="space-y-4">
                {sortedShouts.slice(0, 3).map(s => (
                  <ShoutCard
                    key={s.id}
                    shout={s}
                    currentUser={activeUser}
                    onReact={handleReact}
                    onReply={handleReply}
                    onDelete={id => {
                      const shoutToDelete = shouts.find(x => x.id === id);
                      if (shoutToDelete) {
                        apTransactionService.adjustUserAP(shoutToDelete.userId, 'SHOUT_DELETED')
                          .then(({ newBalance }) => {
                            if (shoutToDelete.userId === activeUser.id) {
                              const saved = localStorage.getItem('user_session');
                              if (saved) {
                                const parsed = JSON.parse(saved);
                                parsed.balance_ap = newBalance;
                                localStorage.setItem('user_session', JSON.stringify(parsed));
                                window.dispatchEvent(new Event('storage'));
                              }
                            }
                          })
                          .catch(e => console.warn('Failed to deduct shout AP:', e));
                        const preview = (shoutToDelete.content || '').replace(/\[.*?\]/g, '').trim().substring(0, 80);
                        mongoService.addAdminLog({
                          id: 'log_' + Date.now(),
                          action: 'SHOUT_DELETED',
                          targetId: id,
                          targetType: 'shout',
                          deletedBy: activeUser.id,
                          deletedByName: activeUser.name,
                          details: `"${preview}" by @${shoutToDelete.username}`,
                          timestamp: Date.now()
                        }).catch(e => console.warn('Failed to log deletion:', e));
                      }
                      mongoService.deleteShout(id);
                      setShouts(shouts.filter(x => x.id !== id));
                    }}
                    onPin={handlePin}
                    onToggleLock={id => saveShouts(shouts.map(x => x.id === id ? { ...x, isClosed: !x.isClosed } : x))}
                    onEdit={shout => { setEditingShout(shout); setShoutText(shout.content); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    onSwipeReply={setReplyingTo}
                  />
                ))}

                {/* See All Shouts link */}
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => navigate('/shouts')}
                  className="w-full flex items-center justify-between bg-[#1C1C2E] border border-white/8 hover:border-purple-500/40 rounded-[2rem] px-5 py-4 group active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-lg">
                      📣
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black text-white">See All Shouts</p>
                      <p className="text-[9px] text-white/30 font-bold mt-0.5">
                        {shouts.length > 3 ? `${shouts.length - 3} more shouts in history` : 'View full shout history'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-purple-400 group-hover:translate-x-1 transition-transform">
                    <span className="text-[10px] font-black uppercase tracking-widest">History</span>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </motion.button>
              </div>
            ) : (
              <div className="py-20 text-center bg-[#1C1C2E] rounded-[2rem] border border-white/5">
                <span className="text-5xl block mb-4">📣</span>
                <p className="text-sm font-black text-white/20 uppercase tracking-widest">No shouts yet</p>
                <p className="text-[10px] text-white/10 font-bold mt-1">Be the first to broadcast!</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RECENT ACTIVITY ── */}
        {activities.length > 0 && (
          <div className="bg-[#1C1C2E] border border-white/5 rounded-[2rem] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[9px] font-black text-purple-400/70 uppercase tracking-[0.3em]">🕒 Recent Activity</h3>
              <button onClick={() => navigate('/timeline')} className="text-[9px] font-black text-white/30 hover:text-white uppercase tracking-widest transition-colors">View All →</button>
            </div>
            <div className="space-y-3">
              {activities.slice(0, 5).map((act, i) => (
                <div key={act.id || i} className="flex items-start gap-3">
                  <span className="text-[9px] font-mono text-white/20 bg-white/5 px-2 py-1 rounded-lg shrink-0 mt-0.5">{act.time}</span>
                  <p className="text-xs text-white/50 leading-relaxed">
                    <span onClick={() => navigate(`/profile/${act.username}`)} className="font-black text-white/70 cursor-pointer hover:text-purple-300 transition-colors">{act.username}</span>{' '}
                    {act.isTopic ? (
                      <><span className="text-white/30">posted topic</span>{' '}
                      <span onClick={() => navigate('/forum')} className="text-purple-400 cursor-pointer font-bold hover:underline">"{act.topicTitle}"</span></>
                    ) : act.msg}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TODAY'S HIGHLIGHTS STRIP ── */}
        <div className="bg-[#090d16]/80 backdrop-blur-xl border border-[#30363d] shadow-xl shadow-purple-900/10 rounded-[2rem] p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
              Today's Highlights
            </h3>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest bg-[#161b22] px-2 py-0.5 rounded-full border border-[#30363d]">Live 24H</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
            {[
              { 
                icon: '🏆', label: 'Top Shouter', value: topShouter.name, 
                sub: `${topShouter.count} shouts today`, onClick: () => navigate('/highlights?tab=shouter'),
                bg: 'hover:bg-purple-500/10 hover:border-purple-500/30' 
              },
              { 
                icon: '👥', label: 'Newest Member', value: newestUser.username || newestUser.name, 
                sub: 'Just joined us!', onClick: () => navigate(`/profile/${newestUser.username}`),
                bg: 'hover:bg-blue-500/10 hover:border-blue-500/30'
              },
              { 
                icon: '📸', label: 'Today\'s Gallery', value: `${todayPhotos.length} photos`, 
                sub: 'View highlights', onClick: () => navigate('/highlights?tab=photos'),
                bg: 'hover:bg-pink-500/10 hover:border-pink-500/30'
              },
            ].map(item => (
              <button key={item.label} onClick={item.onClick}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl bg-[#161b22]/50 border border-[#30363d] transition-all duration-300 ${item.bg} text-left group`}>
                <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">{item.label}</p>
                  <p className="text-sm font-black text-white truncate group-hover:text-purple-300 transition-colors">{item.value}</p>
                  <p className="text-[9px] text-slate-500 font-bold truncate mt-0.5">{item.sub}</p>
                </div>
                <span className="text-slate-600 group-hover:text-purple-400 transition-colors shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Suggested Users */}
        {(() => {
          const s = JSON.parse(localStorage.getItem('user_session') || '{}');
          const following = s.following || [];
          const suggested = usersList.filter(u => u.id !== s.id && !following.includes(u.id) && !u.isBot).slice(0, 5);
          if (suggested.length === 0) return null;
          return (
            <div className="bg-[#090d16]/80 backdrop-blur-xl border border-[#30363d] rounded-[2rem] p-5">
              <h3 className="text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 uppercase tracking-[0.2em] mb-4">👥 Suggested Users</h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {suggested.map(u => (
                  <button key={u.id} onClick={() => navigate(`/profile/${u.username}`)} className="w-28 p-3 text-center shrink-0 bg-[#1C1C2E] border border-white/5 rounded-2xl hover:border-purple-500/30 transition-all">
                    <img src={u.avatar} className="w-12 h-12 rounded-full mx-auto border-2 border-purple-500/30 mb-2 object-cover" alt="" />
                    <p className="text-xs font-bold text-white truncate">{u.name}</p>
                    <p className="text-[9px] text-white/30 truncate">@{u.username}</p>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .animate-marquee { display: inline-block; animation: marquee 30s linear infinite; }
        .pf-card { background:#1C1C2E; border:1px solid rgba(255,255,255,0.06); border-radius:20px; transition:all .3s; }
        .pf-card:hover { border-color:rgba(168,85,247,0.15); }
      `}</style>
    </div>
  );
};

export default Home;

