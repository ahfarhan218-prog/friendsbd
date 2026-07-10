import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoutEntry, SiteNotification, User } from '../types';
import ShoutCard from '../components/ShoutCard';
import { triggerToast } from '../components/NotificationToast';
import { mongoService } from '../services/mongoService';
import { apTransactionService } from '../services/apTransactionService';
import { getSocket } from '../services/socketService';

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
    });
    const unsubShouts = mongoService.listenShouts(s => {
      setShouts(s);
    });
    const socket = getSocket();
    if (socket) {
      socket.on('shout:updated', (s: ShoutEntry) => {
        setShouts(prev => { const i = prev.findIndex(x => x.id === s.id); if (i >= 0) { const c = [...prev]; c[i] = s; return c; } return [s, ...prev]; });
      });
      socket.on('shout:deleted', (id: string) => {
        setShouts(prev => prev.filter(x => x.id !== id));
      });
      socket.on('shout:reacted', (data: { id: string; userReactions: any }) => {
        setShouts(prev => prev.map(s => s.id === data.id ? { ...s, userReactions: data.userReactions } : s));
      });
    }
    const unsubPhotos = mongoService.listenPhotos(p => {
      setPhotos(p);
    });
    const unsubActs = mongoService.listenActivities(a => {
      setActivities(a);
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
    updatePresence();
    const presenceInterval = setInterval(updatePresence, 60000);

    const markOffline = () => {
      if (!presenceUserId) return;
      mongoService.updateUser(presenceUserId, { isOnline: false });
    };
    window.addEventListener('beforeunload', markOffline);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('beforeunload', markOffline);
      unsubUsers(); unsubShouts(); unsubPhotos(); unsubActs();
      if (socket) { socket.off('shout:updated'); socket.off('shout:deleted'); socket.off('shout:reacted'); }
      clearInterval(cleanupInterval);
      clearInterval(presenceInterval);
      markOffline();
    };
  }, []);

  const pushShoutUpdate = (updatedShout: ShoutEntry) => {
    setShouts(prev => prev.map(s => s.id === updatedShout.id ? updatedShout : s));
    mongoService.addShout(JSON.parse(JSON.stringify(updatedShout)));
  };

  const handleAddShout = () => {
    if (!shoutText.trim() || isLockdown || !activeUser) return;
    if (editingShout) {
      pushShoutUpdate({ ...editingShout, content: shoutText, time: 'Edited' });
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
        isPinned: isQuiz,
        isClosed: isQuiz,
        pinExpiry: isQuiz ? Date.now() + 3 * 60 * 1000 : undefined,
        isQuiz: isQuiz
      };
      setShouts(prev => [newShout, ...prev]);
      mongoService.addShout(JSON.parse(JSON.stringify(newShout)));
      const socket = getSocket();
      if (socket) socket.emit('shout:created', newShout);
      
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
        time: currentTime.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' }),
        username: activeUser.username || activeUser.name,
        msg: 'Posted a shout.', 
        timestamp: Date.now(),
        link: '/shouts'
      });
      triggerToast({ id: 'shout-ok-' + Date.now(), senderId: 'system', senderName: 'FriendsBD', senderAvatar: activeUser.avatar, type: 'SYSTEM', message: '🚀 Your shout is live!', timestamp: Date.now(), isRead: false });

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
    if (isLockdown || !activeUser) return;
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
      pushShoutUpdate({ ...shout, userReactions: { ...shout.userReactions, [activeUser.id]: type } });
    }
  };

  const handleReply = (id: string, content: string) => {
    if (isLockdown || !activeUser) return;
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
          '/home',
          `reply to shout`
        );
      }).catch(err => console.warn('Reply mentions error:', err));
      pushShoutUpdate({ ...shout, replies: [...(shout.replies||[]), { id: Math.random().toString(), userId: activeUser.id, userName: activeUser.name, userAvatar: activeUser.avatar, content, timestamp: Date.now() }] });
    }
  };

  const handlePin = (id: string, minutes?: number) => {
    if (!activeUser || (!['admin','moderator'].includes(activeUser.role || '') && !activeUser.isPremium)) return;
    const shout = shouts.find(s => s.id === id);
    if (shout) {
      const pinning = !shout.isPinned;
      pushShoutUpdate({ ...shout, isPinned: pinning, pinExpiry: pinning && minutes && minutes !== -1 ? Date.now() + minutes * 60000 : undefined });
    }
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

  const formattedTime = currentTime.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

  if (isMaintenance && !isAdmin) return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4 text-center text-white">
      <div className="text-5xl mb-4 animate-bounce">🛠️</div>
      <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Maintenance Mode</h1>
      <p className="text-white/60 text-sm max-w-xs">We are performing server updates. Check back soon!</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent pb-28 font-inter w-full overflow-x-hidden">
      <header className="relative overflow-hidden bg-gradient-to-br from-[#110a2a] via-[#1d0d4a] to-[#0d1a6b] pt-10 pb-28 px-4 sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_0%,_#7c3aed33,_transparent_70%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0F0F1A] to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                friends <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">bd</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button onClick={() => navigate('/admin')}
                  className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/10 active:scale-90 transition-all text-sm">
                  ⚙️
                </button>
              )}
              <button onClick={() => navigate('/notifications')}
                className="relative w-9 h-9 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/10 active:scale-90 transition-all text-sm">
                🔔
              </button>
            </div>
          </div>

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
                <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white/40 uppercase tracking-[0.15em] mb-0.5 truncate">{displayName}</p>
                    <p className="text-lg sm:text-xl font-black text-white leading-tight tracking-tight">
                      {g.msg} <span className="inline-block">{g.emoji}</span>
                    </p>
                    <p className="text-xs sm:text-sm text-white/50 font-medium mt-0.5">{g.sub}</p>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t border-white/5 sm:border-none pt-2 sm:pt-0 shrink-0">
                    <p className="text-base sm:text-lg font-black text-white font-mono tabular-nums tracking-tight">{formattedTime}</p>
                    <div className="text-right sm:mt-0.5">
                      <p className="text-sm text-white/60 font-bold hidden sm:block">{formattedDate}</p>
                      <span className="inline-flex items-center gap-1 text-sm font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/10">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${g.dot} animate-pulse`} />
                        Live
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {announcement && (
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 flex items-center gap-3 overflow-hidden">
              <span className="text-sm font-black uppercase tracking-widest text-purple-300 bg-purple-500/30 px-2 py-0.5 rounded shrink-0">📢 News</span>
              <div className="flex-1 overflow-hidden">
                <div className="whitespace-nowrap animate-marquee text-xs sm:text-sm text-white/70 font-medium">{announcement}</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mt-3.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-sm text-white/40 font-bold uppercase tracking-widest">{totalOnline} online now</span>
          </div>
        </div>
      </header>

      <div className="px-3 sm:px-4 -mt-14 space-y-4 relative z-10 max-w-5xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/profile/' + activeUser.username)}
          className="bg-[#1C1C2E] border border-white/5 rounded-2xl sm:rounded-[2rem] p-3.5 flex flex-col sm:flex-row items-center sm:items-center gap-3.5 cursor-pointer hover:border-purple-500/30 active:scale-[0.99] transition-all shadow-xl w-full">
          <div className="flex items-center gap-3.5 w-full sm:w-auto flex-1 min-w-0">
            <div className="relative shrink-0">
              <img src={activeUser.avatar} className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl object-cover border-2 border-purple-500/30" alt="" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#1C1C2E] rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-black text-white truncate break-all">{activeUser.name}</span>
                {activeUser.isVerified && <span className="text-xs sm:text-sm">✔️</span>}
                {activeUser.isPremium && <span className="text-sm bg-amber-400/20 text-amber-400 px-1.5 py-0.5 rounded-full font-black">👑</span>}
              </div>
              <p className="text-xs sm:text-sm text-purple-400/70 font-bold">@{activeUser.username}</p>
              <p className="text-sm text-emerald-400 font-black flex items-center gap-1 mt-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5 w-fit">
                🟢 {formatOnlineTime(activeUser.todayOnlineTime)}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-around sm:justify-end gap-6 border-t border-white/5 sm:border-none pt-3 sm:pt-0 w-full sm:w-auto shrink-0">
            <div className="text-center">
              <p className="text-base sm:text-lg font-black text-white">{activeUser.points || 0}</p>
              <p className="text-sm text-white/60 font-bold uppercase tracking-widest">XP</p>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="text-center">
              <p className="text-base sm:text-lg font-black text-white">Lv.{activeUser.level || 1}</p>
              <p className="text-sm text-white/60 font-bold uppercase tracking-widest">Level</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
          {[
            { icon: '🟢', label: 'Online', value: totalOnline, filter: 'online', color: 'from-emerald-600/20 to-emerald-700/20 border-emerald-500/20' },
            { icon: '👑', label: 'Premium', value: premiumCount, filter: 'premium', color: 'from-amber-500/20 to-orange-600/20 border-amber-500/20' },
            { icon: '🛡️', label: 'Staff', value: staffCount, filter: 'staff', color: 'from-blue-600/20 to-indigo-600/20 border-blue-500/20' },
          ].map(s => (
            <button key={s.label} onClick={() => navigate(`/members?filter=${s.filter}`)}
              className={`bg-gradient-to-br ${s.color} border rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center active:scale-[0.95] transition-all cursor-pointer outline-none min-w-0`}>
              <span className="text-lg sm:text-xl block mb-0.5">{s.icon}</span>
              <p className="text-sm sm:text-lg font-black text-white truncate">{s.value}</p>
              <p className="text-sm sm:text-xs text-white/60 font-bold uppercase tracking-wider truncate">{s.label}</p>
            </button>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`bg-[#1C1C2E] border rounded-2xl sm:rounded-[2rem] overflow-hidden transition-colors ${editingShout ? 'border-amber-500/30' : 'border-white/5 focus-within:border-purple-500/30'} w-full`}>
          {editingShout && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-1.5 flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-widest text-amber-400">✏️ Editing</span>
              <button onClick={() => { setEditingShout(null); setShoutText(''); }} className="text-sm font-black text-white/60 hover:text-white uppercase">Cancel</button>
            </div>
          )}

          {replyingTo && (
            <div className="bg-purple-950/40 border-b border-purple-500/20 px-3 py-2 flex items-center justify-between">
              <div className="min-w-0 flex-1 mr-2">
                <span className="text-sm font-black uppercase tracking-widest text-purple-400">↩️ Reply to @{replyingTo.username || replyingTo.user.toLowerCase().replace(/\s+/g, '')}</span>
                <p className="text-sm text-white/50 truncate mt-0.5">{replyingTo.content}</p>
              </div>
              <button onClick={() => setReplyingTo(null)} className="text-xs sm:text-sm font-black text-white/60 bg-white/5 w-5 h-5 rounded-full flex items-center justify-center shrink-0">✕</button>
            </div>
          )}

          <div className="flex items-center gap-2.5 px-3 pt-3.5">
            <img src={activeUser.avatar} className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0" alt="" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white truncate">{activeUser.name}</p>
            </div>
            <span className="text-sm font-black text-white/50 font-mono">{shoutText.length} ch</span>
          </div>

          {['admin', 'moderator'].includes(activeUser.role || '') && (
            <div className="flex gap-1.5 px-3 pt-2.5 pb-1 overflow-x-auto no-scrollbar">
              <button type="button" onClick={() => setShoutType('normal')}
                className={`px-2.5 py-1 rounded-lg text-sm font-black uppercase tracking-wider shrink-0 transition-all ${shoutType === 'normal' ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/40'}`}>
                📢 Normal
              </button>
              <button type="button" onClick={() => setShoutType('quiz')}
                className={`px-2.5 py-1 rounded-lg text-sm font-black uppercase tracking-wider shrink-0 transition-all ${shoutType === 'quiz' ? 'bg-rose-600 text-white' : 'bg-white/5 text-white/40'}`}>
                ❓ Quiz (3m)
              </button>
            </div>
          )}

          <div className="px-3 pt-2 pb-1.5">
            <textarea ref={textareaRef} value={shoutText} onChange={e => setShoutText(e.target.value)} disabled={isLockdown}
              placeholder={isLockdown ? '🔒 Posting is locked' : "What's on your mind?"} rows={3}
              className="w-full bg-transparent border-none text-sm text-white/80 placeholder-white/20 outline-none resize-none font-medium leading-normal" />
          </div>

          <div className="flex flex-col gap-2.5 px-3 pb-3 border-t border-white/5 pt-2.5">
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex gap-1 overflow-x-auto py-0.5 no-scrollbar flex-1 max-w-[70%] sm:max-w-none">
                {QUICK_EMOJIS.map(e => (
                  <button key={e} onClick={() => !isLockdown && setShoutText(prev => prev + e)} disabled={isLockdown}
                    className="w-7 h-7 shrink-0 rounded-lg bg-white/5 flex items-center justify-center text-sm active:scale-90 transition-all">
                    {e}
                  </button>
                ))}
              </div>
              <button onClick={handleAddShout} disabled={!shoutText.trim() || isLockdown}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider px-4 py-2 rounded-xl shrink-0 active:scale-95 transition-all disabled:opacity-30">
                {editingShout ? 'Update' : 'Shout'}
              </button>
            </div>
          </div>
        </motion.div>

        <div className="w-full">
          <div className="flex items-center gap-1.5 mb-2.5 px-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-600" />
            </span>
            <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">Live Shout Stream</h3>
          </div>

          <AnimatePresence mode="popLayout">
            {sortedShouts.length > 0 ? (
              <div className="space-y-3 w-full">
                {sortedShouts.slice(0, 3).map(s => (
                  <ShoutCard key={s.id} shout={s} currentUser={activeUser} onReact={handleReact} onReply={handleReply}
                    onDelete={id => {
                      const shoutToDelete = shouts.find(x => x.id === id);
                      if (shoutToDelete) {
                        apTransactionService.adjustUserAP(shoutToDelete.userId, 'SHOUT_DELETED').catch(e => console.warn(e));
                      }
                      mongoService.deleteShout(id);
                      setShouts(shouts.filter(x => x.id !== id));
                    }}
                    onPin={handlePin}
                    onToggleLock={id => {
                      const shout = shouts.find(x => x.id === id);
                      if (shout) pushShoutUpdate({ ...shout, isClosed: !shout.isClosed });
                    }}
                    onEdit={shout => { setEditingShout(shout); setShoutText(shout.content); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    onSwipeReply={setReplyingTo}
                  />
                ))}

                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => navigate('/shouts')}
                  className="w-full flex items-center justify-between bg-[#1C1C2E] border border-white/5 rounded-2xl p-3.5 group active:scale-[0.99] transition-all">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-sm shrink-0">📣</div>
                    <div className="text-left min-w-0">
                      <p className="text-sm font-black text-white">See All Shouts</p>
                      <p className="text-sm text-white/60 font-bold truncate mt-0.5">
                        {shouts.length > 3 ? `${shouts.length - 3} more shouts in history` : 'View history'}
                      </p>
                    </div>
                  </div>
                  <span className="text-purple-400 text-sm font-black uppercase tracking-wider shrink-0">→</span>
                </motion.button>
              </div>
            ) : (
              <div className="py-12 text-center bg-[#1C1C2E] rounded-2xl border border-white/5 w-full">
                <span className="text-3xl block mb-2">📣</span>
                <p className="text-sm font-black text-white/40 uppercase tracking-widest">No shouts yet</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {activities.length > 0 && (
          <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4 w-full">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-black text-purple-400/70 uppercase tracking-[0.2em]">🕒 Recent Activity</h3>
              <button onClick={() => navigate('/timeline')} className="text-sm font-black text-white/60 hover:text-white uppercase tracking-wider">All →</button>
            </div>
            <div className="space-y-2.5">
              {activities.slice(0, 5).map((act, i) => (
                <div key={act.id || i} className="flex items-start gap-2 min-w-0">
                  <span className="text-sm font-mono text-white/40 bg-white/5 px-1.5 py-0.5 rounded shrink-0 mt-0.5">{act.time}</span>
                  <p className="text-sm text-white/50 leading-normal truncate flex-1 min-w-0 break-all">
                    <span onClick={() => navigate(`/profile/${act.username}`)} className="font-black text-white/70 cursor-pointer">{act.username}</span>{' '}
                    {act.link ? (
                      <span onClick={() => navigate(act.link)} className="cursor-pointer hover:underline text-cyan-400">
                        {act.isTopic ? `posted "${act.topicTitle}"` : act.msg}
                      </span>
                    ) : (
                      <span>{act.isTopic ? `posted "${act.topicTitle}"` : act.msg}</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-[#090d16]/80 backdrop-blur-xl border border-[#30363d] shadow-xl rounded-2xl p-4 w-full relative overflow-hidden">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Highlights
            </h3>
            <span className="text-sm font-bold text-slate-500 bg-[#161b22] px-2 py-0.5 rounded-full border border-[#30363d]">24H</span>
          </div>

          <div className="flex flex-col gap-2 w-full">
            {[
              { icon: '🏆', label: 'Top Shouter', value: topShouter.name, sub: `${topShouter.count} shouts`, onClick: () => navigate('/highlights?tab=shouter') },
              { icon: '👥', label: 'Newest Member', value: newestUser.username || newestUser.name, sub: 'Just joined!', onClick: () => navigate(`/profile/${newestUser.username}`) },
              { icon: '📸', label: 'Gallery', value: `${todayPhotos.length} photos`, sub: 'View photos', onClick: () => navigate('/highlights?tab=photos') },
            ].map(item => (
              <button key={item.label} onClick={item.onClick}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#161b22]/50 border border-[#30363d] text-left min-w-0 active:bg-white/[0.02]">
                <span className="text-xl shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-black text-white truncate break-all">{item.value}</p>
                  <p className="text-sm text-slate-500 font-medium truncate">{item.sub}</p>
                </div>
                <span className="text-slate-600 text-sm shrink-0">→</span>
              </button>
            ))}
          </div>
        </div>

        {(() => {
          const s = JSON.parse(localStorage.getItem('user_session') || '{}');
          const following = s.following || [];
          const suggested = usersList.filter(u => u.id !== s.id && !following.includes(u.id) && !u.isBot).slice(0, 5);
          if (suggested.length === 0) return null;
          return (
            <div className="bg-[#090d16]/80 backdrop-blur-xl border border-[#30363d] rounded-2xl p-4 w-full">
              <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 uppercase tracking-[0.2em] mb-3">👥 Suggested</h3>
              <div className="flex gap-2.5 overflow-x-auto pb-1.5 no-scrollbar w-full">
                {suggested.map(u => (
                  <button key={u.id} onClick={() => navigate(`/profile/${u.username}`)} className="w-24 p-2.5 text-center shrink-0 bg-[#1C1C2E] border border-white/5 rounded-xl min-w-0">
                    <img src={u.avatar} className="w-10 h-10 rounded-full mx-auto border border-purple-500/30 mb-1.5 object-cover" alt="" />
                    <p className="text-xs sm:text-sm font-bold text-white truncate">{u.name}</p>
                    <p className="text-sm text-white/60 truncate">@{u.username}</p>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default Home;