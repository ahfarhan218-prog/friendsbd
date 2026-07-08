import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ShoutEntry } from '../types';
import { triggerToast } from '../components/NotificationToast';
import { mongoService } from '../services/mongoService';

interface HighlightPhoto {
  id: string;
  url: string;
  caption: string;
  uploadedBy: string;
  likes: number;
  timestamp: number;
}

const Highlights: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'shouter';
  
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [users, setUsers] = useState<User[]>([]);
  const [shouts, setShouts] = useState<ShoutEntry[]>([]);
  const [photos, setPhotos] = useState<HighlightPhoto[]>([]);
  const [newCaption, setNewCaption] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<HighlightPhoto | null>(null);
  
  const [wavedUsers, setWavedUsers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  useEffect(() => {
    const unsubscribeUsers = mongoService.listenUsers((loadedUsers) => {
      setUsers(loadedUsers);
      localStorage.setItem('friends_bd_users', JSON.stringify(loadedUsers));
    });

    const unsubscribeShouts = mongoService.listenShouts((loadedShouts) => {
      setShouts(loadedShouts);
      localStorage.setItem('friends_bd_shouts', JSON.stringify(loadedShouts));
    });

    const unsubscribePhotos = mongoService.listenPhotos((loadedPhotos) => {
      setPhotos(loadedPhotos);
      localStorage.setItem('friends_bd_recent_photos', JSON.stringify(loadedPhotos));
    });

    return () => {
      unsubscribeUsers();
      unsubscribeShouts();
      unsubscribePhotos();
    };
  }, []);

  // Compute midnight of today
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  // Filter 24 hours (today only) data
  const todayShouts = shouts.filter(s => s.timestamp >= midnight);
  const todayPhotos = photos.filter(p => p.timestamp >= midnight);

  const getTodayXP = (usr: User) => {
    const sCount = todayShouts.filter(s => s.userId === usr.id || s.user === usr.name).length;
    const pCount = todayPhotos.filter(p => p.uploadedBy === usr.username || p.uploadedBy === usr.name).length;
    return (sCount * 10) + (pCount * 20); // 10 XP per shout, 20 XP per photo today
  };

  const activeUsersToday = users.filter(usr => getTodayXP(usr) > 0 || usr.isOnline || (usr.lastActiveTime && usr.lastActiveTime >= midnight));
  const topMembersToday = [...activeUsersToday].sort((a, b) => getTodayXP(b) - getTodayXP(a));

  const getShouterStats = () => {
    const counts: Record<string, { user: string; avatar: string; count: number }> = {};
    todayShouts.forEach(s => {
      const uId = s.userId || 'unknown';
      if (!counts[uId]) {
        counts[uId] = { user: s.user, avatar: s.avatar, count: 0 };
      }
      counts[uId].count += 1;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count);
  };

  const handlePhotoUpload = (e: React.FormEvent) => {
    e.preventDefault();
    const activeUserStr = localStorage.getItem('user_session');
    let activeUser: any = { name: 'Guest' };
    if (activeUserStr) {
      try {
        activeUser = JSON.parse(activeUserStr);
      } catch (e) {}
    }

    const urlToUse = newPhotoUrl.trim() || `https://picsum.photos/seed/${Math.random().toString()}/600/400`;

    const newPhoto: HighlightPhoto = {
      id: 'photo_' + Date.now(),
      url: urlToUse,
      caption: newCaption.trim() || 'A beautiful moment shared on FriendsBD!',
      uploadedBy: activeUser.username || activeUser.name,
      likes: 1,
      timestamp: Date.now()
    };

    mongoService.addPhoto(newPhoto);
    setNewCaption('');
    setNewPhotoUrl('');
    
    triggerToast({
      id: 'photo-upload-' + Date.now(),
      senderId: 'system',
      senderName: 'Activity Hub',
      senderAvatar: activeUser.avatar || 'https://picsum.photos/seed/sys/100',
      type: 'SYSTEM',
      message: 'Your photo was shared with the community!',
      timestamp: Date.now(),
      isRead: false
    });
  };

  const handleLikePhoto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = photos.map(p => {
      if (p.id === id) {
        const newer = { ...p, likes: p.likes + 1 };
        mongoService.addPhoto(newer);
        return newer;
      }
      return p;
    });
    setPhotos(updated);
    localStorage.setItem('friends_bd_recent_photos', JSON.stringify(updated));

    if (selectedPhoto?.id === id) {
      setSelectedPhoto(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
    }
  };

  const handleWave = (username: string) => {
    setWavedUsers(prev => ({ ...prev, [username]: true }));
    triggerToast({
      id: 'wave-' + Date.now(), senderId: 'system', senderName: 'Vibe Match',
      senderAvatar: 'https://picsum.photos/seed/wave/100', type: 'SYSTEM',
      message: `You waved 👋 to @${username}!`, timestamp: Date.now(), isRead: false
    });

    const currentNotifs = JSON.parse(localStorage.getItem('friends_bd_notifications') || '[]');
    const newNotif = {
      id: 'wave_notif_' + Date.now(), senderId: 'current', senderName: 'Your Buddy',
      senderAvatar: 'https://picsum.photos/seed/mehedi/100', type: 'SYSTEM',
      message: `@${username} waved back at you! 😊`, timestamp: Date.now() + 2000, isRead: false
    };
    
    setTimeout(() => {
      localStorage.setItem('friends_bd_notifications', JSON.stringify([newNotif, ...currentNotifs]));
      triggerToast(newNotif as any);
    }, 2000);
  };

  const shouters = getShouterStats();

  return (
    <div className="min-h-screen bg-transparent flex flex-col pb-24 font-inter text-[#e2e8f0]">
      {/* Dark Theme Modern Header */}
      <header className="relative bg-[#090d16]/80 backdrop-blur-xl border-b border-[#30363d] p-6 pb-20 shrink-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-600/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex items-center gap-4">
          <button 
            onClick={() => navigate('/home')} 
            className="w-10 h-10 bg-[#161b22] hover:bg-[#30363d] rounded-xl flex items-center justify-center border border-[#30363d] transition-all active:scale-95"
            title="Go Home"
          >
            ⬅️
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Today's Highlights</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300 mt-1">Daily 24H Activities & Trends</p>
          </div>
        </div>
      </header>

      {/* Floating Category Navigation */}
      <div className="px-5 -mt-10 relative z-20">
        <div className="bg-[#161b22]/90 backdrop-blur-md rounded-[2.5rem] p-2 shadow-2xl border border-[#30363d] flex overflow-x-auto no-scrollbar gap-1">
          {[
            { id: 'shouter', label: '📢 Shouter' },
            { id: 'top-member', label: '👑 Top Member' },
            { id: 'active', label: '⚡ Active' },
            { id: 'photos', label: '📸 Gallery' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider shrink-0 transition-all ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-[#30363d]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Container */}
      <div className="px-5 mt-6 flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'shouter' && (
            <motion.div
              key="shouter"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4"
            >
              <div className="bg-[#161b22]/80 backdrop-blur-md rounded-[2.5rem] p-6 border border-[#30363d] shadow-xl text-left">
                <h3 className="text-base font-black text-white leading-none">📢 Today's Shouter Stats</h3>
                <p className="text-[10px] text-purple-300 font-bold uppercase tracking-wider mt-1 mb-5">Members who shouted most today</p>

                {shouters.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-sm font-medium italic">No shouts yet today. Be the first!</div>
                ) : (
                  <div className="divide-y divide-[#30363d]">
                    {shouters.map((sh, idx) => (
                      <div key={sh.user + idx} className="py-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 text-center text-xs font-black ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-300' : 'text-[#8b5a2b]'}`}>
                            {idx + 1}
                          </span>
                          <img src={sh.avatar} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-[#30363d]" alt="" />
                          <div>
                            <p className="text-xs font-black text-white">{sh.user}</p>
                            <p className="text-[9px] text-purple-400 font-bold uppercase tracking-wider">Today Rank {idx + 1}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="bg-purple-900/30 text-purple-300 font-mono text-xs font-black px-3 py-1 rounded-full uppercase border border-purple-500/20">
                            {sh.count} {sh.count === 1 ? 'shout' : 'shouts'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Shouts */}
              <div className="bg-[#161b22]/80 backdrop-blur-md rounded-[2.5rem] p-6 border border-[#30363d] shadow-xl text-left">
                <h4 className="text-xs font-black text-purple-300 uppercase tracking-widest mb-4">Today's Shared Broadcasts</h4>
                {todayShouts.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-sm font-medium italic">No broadcasts today.</div>
                ) : (
                  <div className="space-y-4">
                    {todayShouts.slice(0, 10).map(s => (
                      <div key={s.id} className="p-4 bg-[#090d16] rounded-3xl border border-[#30363d] flex gap-3">
                        <img src={s.avatar} className="w-9 h-9 rounded-xl object-cover shrink-0 border border-[#30363d]" alt="" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-black text-white truncate">{s.user}</span>
                            {s.isPremium && <span className="text-[10px]" title="Premium">👑</span>}
                            <span className="text-[8px] font-bold font-mono text-slate-500 ml-auto">{s.time}</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed font-bold">{s.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'top-member' && (
            <motion.div
              key="top-member"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4"
            >
              <div className="bg-[#161b22]/80 backdrop-blur-md rounded-[2.5rem] p-6 border border-[#30363d] shadow-xl text-left">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-black text-white leading-none">👑 Today's Elite Leaderboard</h3>
                    <p className="text-[10px] text-purple-300 font-bold uppercase tracking-wider mt-1">Based on Today's 24H XP Activity</p>
                  </div>
                  <span className="text-2xl animate-pulse">🏆</span>
                </div>

                {topMembersToday.length === 0 ? (
                   <div className="text-center py-6 text-slate-500 text-sm font-medium italic">No activity recorded today yet!</div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {topMembersToday.map((usr, idx) => (
                      <div 
                        key={usr.id} 
                        onClick={() => navigate(`/profile/${usr.username}`)}
                        className="p-4 rounded-3xl bg-[#090d16] hover:bg-[#30363d]/50 border border-[#30363d] transition-all duration-300 flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-full bg-[#161b22] font-mono text-xs font-black text-slate-300 border border-[#30363d] shadow-inner group-hover:border-purple-500">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                          </div>
                          <img src={usr.avatar} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-[#30363d] shadow-md" alt="" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="text-xs font-black text-white truncate group-hover:text-purple-400 transition-colors">{usr.name}</p>
                              {usr.isVerified && <span className="text-[10px]">✔️</span>}
                              {usr.isPremium && <span className="text-[10px]">👑</span>}
                            </div>
                            <p className="text-[8px] font-black text-pink-400 uppercase tracking-widest mt-0.5">Today's XP: {getTodayXP(usr)}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                            Global Lv. {usr.level || 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'active' && (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4"
            >
              <div className="bg-[#161b22]/80 backdrop-blur-md rounded-[2.5rem] p-6 border border-[#30363d] shadow-xl text-left">
                <h3 className="text-base font-black text-white leading-none">⚡ Today's Online Status</h3>
                <p className="text-[10px] text-purple-300 font-bold uppercase tracking-wider mt-1 mb-5">Members active on FriendsBD today</p>

                {activeUsersToday.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-sm font-medium italic">No members active today yet!</div>
                ) : (
                  <div className="space-y-3.5">
                    {activeUsersToday.map((usr) => (
                      <div 
                        key={usr.id} 
                        className="p-3.5 rounded-3xl bg-[#090d16] border border-[#30363d] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img src={usr.avatar} className="w-10 h-10 rounded-xl object-cover border border-[#30363d]" alt="" />
                            <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#161b22] ${usr.isOnline ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-slate-500'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-black text-white">{usr.name}</span>
                              {usr.isPremium && <span className="text-[10px]">👑</span>}
                            </div>
                            <p className="text-[9px] text-slate-400 font-bold">
                              {usr.isOnline ? 'Active now' : 'Active earlier today'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleWave(usr.username)}
                            disabled={wavedUsers[usr.username]}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                              wavedUsers[usr.username]
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-not-allowed'
                                : 'bg-[#161b22] hover:bg-[#30363d] border-[#30363d] text-slate-300 active:scale-95'
                            }`}
                          >
                            {wavedUsers[usr.username] ? 'Waved ' : '👋 Wave'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'photos' && (
            <motion.div
              key="photos"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Image Upload Box */}
              <div className="bg-[#161b22]/80 backdrop-blur-md rounded-[2.5rem] p-6 border border-[#30363d] shadow-xl text-left">
                <h3 className="text-base font-black text-white leading-none mb-1">📸 Upload Today's Photo</h3>
                <p className="text-[10px] text-purple-300 font-bold uppercase tracking-wider mb-4">Share a moment from today (resets at midnight!)</p>

                <form onSubmit={handlePhotoUpload} className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Image URL (optional)"
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      className="flex-1 bg-[#090d16] p-3 rounded-2xl text-[11px] font-bold text-white placeholder-slate-500 border border-[#30363d] focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Photo caption (e.g. Bangladesh cup win!)"
                      value={newCaption}
                      onChange={(e) => setNewCaption(e.target.value)}
                      required
                      className="flex-1 bg-[#090d16] p-3 rounded-2xl text-[11px] font-bold text-white placeholder-slate-500 border border-[#30363d] focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-[10px] font-black uppercase tracking-wider px-5 rounded-2xl transition-all active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    >
                      Share
                    </button>
                  </div>
                </form>
              </div>

              {/* Photo grid */}
              <div className="bg-[#161b22]/80 backdrop-blur-md rounded-[2.5rem] p-6 border border-[#30363d] shadow-xl text-left">
                <p className="text-[10px] font-black text-purple-300 uppercase tracking-wider mb-4">Today's Gallery (Resets at midnight)</p>
                {todayPhotos.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-sm font-medium italic">No photos uploaded today. Share the first one!</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 sm:grid-cols-4 gap-4">
                    {todayPhotos.map(p => (
                      <div 
                        key={p.id}
                        onClick={() => setSelectedPhoto(p)}
                        className="group cursor-pointer bg-[#090d16] border border-[#30363d] rounded-3xl overflow-hidden shadow-sm hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:border-purple-500/50 transition-all duration-300 relative aspect-square"
                      >
                        <img referrerPolicy="no-referrer" src={p.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" alt="" />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-white">
                          <p className="text-[8px] font-black uppercase tracking-wide text-purple-300">📸 @{p.uploadedBy}</p>
                          <p className="text-[9px] font-bold truncate">{p.caption}</p>
                        </div>

                        <div className="absolute top-2 right-2 bg-[#090d16]/60 backdrop-blur-md text-white border border-[#30363d] rounded-full px-2 py-0.5 text-[8px] font-black flex items-center gap-1 uppercase">
                          ❤️ {p.likes}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lightbox / Enlarged Photo Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0F0F1A]/95 z-[300] flex items-center justify-center p-6 backdrop-blur-sm"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#161b22] text-[#e2e8f0] border border-[#30363d] rounded-[3rem] max-w-lg w-full overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.2)] relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-[#090d16]/80 text-white rounded-full flex items-center justify-center text-sm font-bold z-50 hover:bg-rose-500/20 hover:text-rose-400 border border-[#30363d] hover:border-rose-500/30 transition-all"
              >
                ✕
              </button>

              <div className="p-1">
                <img referrerPolicy="no-referrer" src={selectedPhoto.url} className="w-full text-center h-64 md:h-80 object-cover rounded-[2.5rem] shadow-inner" alt="" />
              </div>
              
              <div className="p-6 md:p-8 text-left">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
                    <p className="text-[9px] text-purple-400 font-black uppercase tracking-widest leading-none">Shared By @{selectedPhoto.uploadedBy}</p>
                  </div>
                  <button 
                    onClick={(e) => handleLikePhoto(selectedPhoto.id, e)}
                    className="flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 px-3.5 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-colors active:scale-95"
                  >
                    ❤️ {selectedPhoto.likes} Likes
                  </button>
                </div>

                <p className="text-xs font-bold text-slate-300 leading-relaxed mb-6">
                  {selectedPhoto.caption}
                </p>

                <div className="border-t border-[#30363d] pt-4 flex gap-2">
                  <input
                    type="text"
                    disabled
                    placeholder="Comments disabled for this public highlight"
                    className="flex-1 bg-[#090d16] p-3 rounded-2xl text-[10px] font-bold text-slate-500 placeholder-slate-600 border border-[#30363d] outline-none"
                  />
                  <button
                    disabled
                    className="bg-[#30363d] text-slate-500 text-[9px] font-black uppercase tracking-wider px-4 rounded-2xl transition-all"
                  >
                    Post
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Highlights;

