import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, ShoutEntry } from '../types';
import { API_BASE, mongoService } from '../services/mongoService';
import { gameService } from '../services/gameService';
import { BBCodeParser } from '../components/BBCodeParser';
import PublicRewardHistoryTab from '../components/PublicRewardHistoryTab';
import { uploadImageToImgBB } from '../utils/imgbb';
import ShoutModal from '../components/ShoutModal';
import { triggerToast } from '../components/NotificationToast';
import { formatLargeNumber } from '../utils/formatNumber';

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function formatDate(ts: number) {
  if (!ts) return 'Unknown';
  return new Date(ts).toLocaleDateString('en-BD', { year: 'numeric', month: 'long' });
}

function formatDateShort(ts: number) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatOnlineTime(seconds?: number): string {
  if (!seconds) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m`;
}

function xpProgress(points: number, level: number) {
  const base = (level - 1) * 150;
  const cap = level * 150;
  return Math.min(100, Math.round(((points - base) / (cap - base)) * 100));
}

const ROLE_META: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  admin:     { label: 'Admin',     color: '#f43f5e', bg: 'rgba(244,63,94,0.12)',    emoji: '🛡️' },
  moderator: { label: 'Moderator', color: '#f97316', bg: 'rgba(249,115,22,0.12)',  emoji: '⚖️' },
  user:      { label: 'Member',    color: '#7c3aed', bg: 'rgba(124,58,237,0.12)',  emoji: '👤' },
};

const ACHIEVEMENTS = [
  { id: 'veteran',  icon: '🏅', label: 'Veteran',     desc: '500 XP',   check: (u: any) => (u.points||0) >= 500 },
  { id: 'premium',  icon: '💎', label: 'FriendsBD Elite', desc: 'Elite',  check: (u: any) => !!u.isPremium },
  { id: 'verified', icon: '✅', label: 'Verified',    desc: 'Verified', check: (u: any) => !!u.isVerified },
  { id: 'elite',    icon: '💎', label: 'Elite',       desc: 'Lv.10',    check: (u: any) => (u.level||0) >= 10 },
  { id: 'goldrush', icon: '🪙', label: 'Gold Rush',   desc: '10 coins', check: (u: any) => (u.goldenCoins||0) >= 10 },
  { id: 'social',   icon: '💬', label: 'Social',      desc: '50 plusses',check: (u: any) => (u.plusses||0) >= 50 },
  { id: 'ap_king',  icon: '⚡', label: 'AP King',     desc: '500 AP',   check: (u: any) => (u.ap||0) >= 500 },
  { id: 'silver',   icon: '🔘', label: 'Silver Pro',  desc: '100 silver',check: (u: any) => (u.silverPoints||0) >= 100 },
];

const GAMIFIED_BADGES: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  prediction_master: { label: 'Prediction Master', icon: '🔮', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  league_champion:   { label: 'League Champion',   icon: '🥇', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  shout_king:        { label: 'Shout King',        icon: '💥', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
  night_owl:         { label: 'Night Owl',         icon: '🌙', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  coin_tycoon:       { label: 'Coin Tycoon',       icon: '💎', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  verified_merchant: { label: 'Verified Merchant', icon: '🛡️', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' }
};

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [viewerSession, setViewerSession] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(null);
  const [shouts, setShouts] = useState<ShoutEntry[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [authErr, setAuthErr] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [todayGrabs, setTodayGrabs] = useState(0);
  const [userThreads, setUserThreads] = useState<any[]>([]);
  const [allForumThreads, setAllForumThreads] = useState<any[]>([]);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [activitySubTab, setActivitySubTab] = useState<'topics' | 'posts' | 'shouts'>('topics');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [avatarShoutId, setAvatarShoutId] = useState<string | null>(null);
  const [showShoutModal, setShowShoutModal] = useState<string | null>(null);

  const [editingAbout, setEditingAbout] = useState(false);
  const [editLoc, setEditLoc] = useState('');
  const [editGen, setEditGen] = useState('Male');
  const [editEdu, setEditEdu] = useState('');
  const [editWork, setEditWork] = useState('');

  const [statusInput, setStatusInput] = useState('');
  const [postText, setPostText] = useState('');
  const [visitorMessages, setVisitorMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    const profileShouts = shouts.filter(s => s.userId === profile.id && s.content.includes('Updated their profile picture'));
    if (profileShouts.length > 0) {
      profileShouts.sort((a, b) => b.timestamp - a.timestamp);
      setAvatarShoutId(profileShouts[0].id);
    }
  }, [shouts, profile]);

  const currentUser = allUsers.find(u => u.id === viewerSession?.id);

  useEffect(() => {
    if (currentUser && profile) {
      setIsFollowing(currentUser.following?.includes(profile.id) || false);
    }
  }, [currentUser, profile]);

  const handleFollow = async () => {
    if (!currentUser || !profile) return;
    const newIsFollowing = !isFollowing;
    setIsFollowing(newIsFollowing);
    const myFollowing = currentUser.following || [];
    const theirFollowers = profile.followers || [];
    try {
      if (newIsFollowing) {
        if (!myFollowing.includes(profile.id)) myFollowing.push(profile.id);
        if (!theirFollowers.includes(currentUser.id)) theirFollowers.push(currentUser.id);
      } else {
        const myIdx = myFollowing.indexOf(profile.id);
        if (myIdx > -1) myFollowing.splice(myIdx, 1);
        const theirIdx = theirFollowers.indexOf(currentUser.id);
        if (theirIdx > -1) theirFollowers.splice(theirIdx, 1);
      }
      await mongoService.updateUser(currentUser.id, { following: myFollowing } as any);
      await mongoService.updateUser(profile.id, { followers: theirFollowers } as any);
    } catch (err) {
      console.error('Follow toggle failed', err);
      setIsFollowing(!newIsFollowing);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploadingAvatar(true);
    try {
      const imageUrl = await uploadImageToImgBB(file);
      await fetch(`${API_BASE}/users/${profile.id}`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ avatar: imageUrl }) });
      const shoutId = 'sh_' + Date.now();
      const newShout = { id: shoutId, displayId: Date.now(), user: profile.name, username: profile.username, userId: profile.id, avatar: imageUrl, content: `Updated their profile picture \n\n [img]${imageUrl}[/img]`, time: 'Just now', timestamp: Date.now(), userReactions: {}, replies: [], isPremium: !!profile.isPremium, isPinned: false, isClosed: false };
      await mongoService.addShout(newShout as any);
      triggerToast({ id: 'avatar-update', type: 'SYSTEM', message: 'Profile picture updated!', senderId: 'system', senderName: 'System', senderAvatar: imageUrl, timestamp: Date.now(), isRead: false });
      setProfile({ ...profile, avatar: imageUrl });
      try { const s = JSON.parse(localStorage.getItem('user_session') || '{}'); if (s.id === profile.id) localStorage.setItem('user_session', JSON.stringify({ ...s, avatar: imageUrl })); } catch {}
    } catch (err: any) {
      triggerToast({ id: 'avatar-error', type: 'SYSTEM', message: 'Failed to upload: ' + err.message, senderId: 'system', senderName: 'System', senderAvatar: 'https://picsum.photos/seed/sys/200', timestamp: Date.now(), isRead: false });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveAboutMe = async () => {
    if (!profile) return;
    const updates = { fromCountry: editLoc, gender: editGen, education: editEdu, work: editWork };
    try {
      await fetch(`${API_BASE}/users/${profile.id}`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(updates) });
      setProfile((p: any) => p ? { ...p, ...updates } : p);
      try { const s = JSON.parse(localStorage.getItem('user_session') || '{}'); if (s.id === profile.id) localStorage.setItem('user_session', JSON.stringify({ ...s, ...updates })); } catch {}
      setEditingAbout(false);
    } catch(err) { console.error(err); }
  };

  useEffect(() => {
    if (profile) {
      setEditLoc(profile.fromCountry || 'Bangladesh');
      setEditGen(profile.gender || 'Not specified');
      setEditEdu(profile.education || '');
      setEditWork(profile.work || '');
    }
  }, [profile]);

  useEffect(() => {
    let active = true;
    try { const s = JSON.parse(localStorage.getItem('user_session') || '{}'); if (s && s.id) setViewerSession(s); } catch {}
    if (!userId) { setNotFound(true); setLoading(false); return; }
    setLoading(true);
    const loadTargetUser = async () => {
      try {
        const res = await fetch(`${API_BASE}/users/${userId}`);
        if (res.ok) {
          const userData = await res.json();
          if (active) {
            setProfile(userData);
            setNotFound(false);
            try {
              const [shoutsRes, usersRes, actRes, threadsRes, postsRes] = await Promise.all([
                fetch(`${API_BASE}/shouts`), fetch(`${API_BASE}/users`), fetch(`${API_BASE}/activities`), fetch(`${API_BASE}/forum/threads`), fetch(`${API_BASE}/forum/posts`)
              ]);
              if (shoutsRes.ok) { const shoutsData = await shoutsRes.json(); setShouts(shoutsData.filter((s: any) => s.userId === userData.id || s.username === userData.username)); }
              if (usersRes.ok) { const usersData = await usersRes.json(); setAllUsers(usersData); }
              const userActs = await mongoService.getUserActivities(userData.username || userData.name);
              setActivities(userActs);
              if (threadsRes.ok) { const threadsData = await threadsRes.json(); setAllForumThreads(threadsData); setUserThreads(threadsData.filter((t: any) => t.authorId === userData.id)); }
              if (postsRes.ok) { const postsData = await postsRes.json(); setUserPosts(postsData.filter((p: any) => p.authorId === userData.id && !p.is_deleted)); }
              const vmRes = await fetch(`${API_BASE}/visitor-messages/${userData.id}`);
              if (vmRes.ok) setVisitorMessages(await vmRes.json());
            } catch (e) { console.warn('Failed related fetches'); }
            setLoading(false);
          }
        } else { if (active) { setNotFound(true); setLoading(false); } }
      } catch (err) { console.error('Failed to load target user', err); if (active) { setNotFound(true); setLoading(false); } }
    };
    loadTargetUser();
    return () => { active = false; };
  }, [userId]);

  const saveBio = useCallback(async () => {
    if (!profile) return;
    setProfile((p: any) => p ? { ...p, bio: bioText } : p);
    await mongoService.updateUser(profile.id, { bio: bioText } as any);
    try { const s = JSON.parse(localStorage.getItem('user_session') || '{}'); localStorage.setItem('user_session', JSON.stringify({ ...s, bio: bioText })); } catch {}
    setEditingBio(false);
  }, [profile, bioText]);

  const updatePremiumSettings = useCallback(async (updates: any) => {
    if (!profile) return;
    setProfile((p: any) => ({ ...p, ...updates }));
    await mongoService.updateUser(profile.id, updates as any);
    try { const s = JSON.parse(localStorage.getItem('user_session') || '{}'); localStorage.setItem('user_session', JSON.stringify({ ...s, ...updates })); } catch {}
  }, [profile]);

  const handleReaction = async (shoutId: string, reaction: string) => {
    const session = JSON.parse(localStorage.getItem('user_session') || 'null');
    if (!session) return;
    try {
      const res = await fetch(`${API_BASE}/shouts/${shoutId}/react`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: session.id, reaction }) });
      if (res.ok) { const { userReactions } = await res.json(); setShouts((prev: any) => prev.map((s: any) => s.id === shoutId ? { ...s, userReactions } : s)); }
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center overflow-x-hidden">
      <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
    </div>
  );
  if (notFound) return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center gap-4 p-4 sm:p-8 overflow-x-hidden">
      <p className="text-red-400 font-bold text-sm">User not found.</p>
      <button onClick={() => navigate('/')} className="bg-purple-600 text-white font-bold text-sm px-3 sm:px-6 py-3 rounded-xl hover:bg-purple-500">Go Home</button>
    </div>
  );
  if (authErr || !profile) return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center gap-4 p-4 sm:p-8 overflow-x-hidden">
      <p className="text-red-400 font-bold text-sm">{authErr || 'Profile not found.'}</p>
      <button onClick={() => navigate('/login')} className="bg-purple-600 text-white font-bold text-sm px-3 sm:px-6 py-3 rounded-xl hover:bg-purple-500">Go to Login</button>
    </div>
  );

  const role = viewerSession?.role || 'user';
  const isStaff = role === 'admin' || role === 'moderator';
  const isPremiumActive = !!(profile.isPremium && profile.premiumExpiry && profile.premiumExpiry > Date.now());
  const isOwnProfile = viewerSession?.id === profile?.id;

  const roleMeta = ROLE_META[profile.role || 'user'] || ROLE_META.user;
  const earned = ACHIEVEMENTS.filter(a => a.check(profile));
  const lvl = profile.level || 1;
  const pts = profile.points || 0;
  const progress = xpProgress(pts, lvl);

  const walletItems = [
    { label: 'Active Points', value: profile.ap || 0, icon: '⚡', color: '#f97316' },
    { label: 'Total AP', value: profile.totalAp || profile.ap || 0, icon: '📊', color: '#c084fc' },
    { label: 'AP Balance', value: profile.balance_ap || 0, icon: '💳', color: '#38bdf8' },
    { label: 'Profile Points', value: profile.points || 0, icon: '⭐', color: '#fbbf24' },
    { label: 'Golden Coins', value: profile.goldenCoins || 0, icon: '🪙', color: '#f59e0b' },
    { label: 'Silver Points', value: profile.silverPoints || 0, icon: '🔘', color: '#94a3b8' },
    { label: 'Color Balls', value: profile.colorBalls || 0, icon: '🎨', color: '#ec4899' },
    { label: 'Magic Points', value: profile.magicPoints || 0, icon: '✨', color: '#a855f7' },
    { label: 'Plusses', value: profile.plusses || 0, icon: '➕', color: '#8b5cf6' },
    { label: 'Total Plusses', value: profile.total_plusses || 0, icon: '📈', color: '#0284c7' },
    { label: 'Reputation', value: profile.reputation_points || 0, icon: '💎', color: '#3b82f6' },
    { label: 'Total RP', value: profile.total_rp || 0, icon: '🏅', color: '#ea580c' },
    { label: 'Taka Balance', value: profile.balance_taka || 0, icon: '💵', color: '#22c55e' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a] font-sans pb-20 overflow-x-hidden">
      <style>{`
        @keyframes gradient-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .pf-card { background:#1C1C2E; border:1px solid rgba(255,255,255,0.06); border-radius:20px; transition:all .3s; }
        .pf-card:hover { border-color:rgba(168,85,247,0.15); }
        .pf-glass { background:rgba(22,27,34,0.5); border:1px solid #30363d; backdrop-filter:blur(20px); }
        .pf-mini-stat { background:rgba(22,27,34,0.5); border:1px solid #30363d; border-radius:16px; padding:16px 12px; text-align:center; transition:all .3s; }
        .pf-mini-stat:hover { border-color:rgba(168,85,247,0.3); transform:translateY(-2px); background:rgba(168,85,247,0.1); }
        .pf-input { background:rgba(22,27,34,0.8); border:1px solid #30363d; border-radius:12px; padding:10px 14px; color:#fff; font-size:0.85rem; outline:none; transition:all .3s; }
        .pf-input:focus { border-color:#a78bfa; background:rgba(168,85,247,0.1); }
        .pf-btn { padding:8px 20px; border-radius:12px; font-weight:700; font-size:0.75rem; border:none; cursor:pointer; transition:all .3s; }
        .pf-btn-primary { background:linear-gradient(135deg,#7c3aed,#a855f7); color:#fff; }
        .pf-btn-primary:hover { transform:translateY(-1px); box-shadow:0 8px 25px rgba(124,58,237,0.3); }
        .pf-btn-secondary { background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.8); }
        .pf-btn-secondary:hover { background:rgba(255,255,255,0.15); color:#fff; }
        .pf-btn-ghost { background:rgba(255,255,255,0.05); color:#a78bfa; border:1px solid rgba(168,85,247,0.2); }
        .pf-btn-ghost:hover { background:rgba(168,85,247,0.1); }
        .pf-btn-follow { background:linear-gradient(135deg,#ec4899,#a855f7); color:#fff; }
        .pf-btn-follow:hover { transform:translateY(-1px); box-shadow:0 8px 25px rgba(236,72,153,0.3); }
        .pf-btn-following { background:rgba(255,255,255,0.08); color:#a78bfa; border:1px solid rgba(168,85,247,0.2); }
        .pf-btn-following:hover { background:rgba(168,85,247,0.1); }
        .pf-tab { padding:8px 16px; border-radius:12px; font-size:0.75rem; font-weight:700; color:rgba(255,255,255,0.5); cursor:pointer; transition:all .3s; background:transparent; border:none; white-space:nowrap; }
        .pf-tab-active { background:rgba(168,85,247,0.15); color:#a78bfa; }
        .pf-tab:hover { color:rgba(255,255,255,0.8); }
        .pf-toggle { width:44px; height:24px; border-radius:12px; border:none; cursor:pointer; position:relative; transition:all .3s; }
        .pf-toggle-knob { width:18px; height:18px; border-radius:50%; background:#fff; position:absolute; top:3px; transition:all .3s; box-shadow:0 2px 4px rgba(0,0,0,0.2); }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:rgba(168,85,247,0.3); border-radius:4px; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #30363d; border-radius: 10px; }
      `}</style>

      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="h-48 bg-gradient-to-br from-purple-700 via-purple-600 to-pink-600" style={{ animation: 'gradient-shift 8s ease infinite', backgroundSize: '200% 200%' }} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      </div>

      <div className="max-w-full max-w-6xl mx-auto px-4 sm:px-6 mx-auto px-4 -mt-24 relative z-10">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left Column */}
          <div className="lg:w-80 shrink-0">
            {/* Profile Card */}
            <div className="pf-card p-4 sm:p-6 text-center">
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarUpload} hidden />
              <div className="relative inline-block" onClick={() => { if (isOwnProfile) { fileInputRef.current?.click(); } else if (avatarShoutId) { setShowShoutModal(avatarShoutId); } }} style={{ cursor: isOwnProfile || avatarShoutId ? 'pointer' : 'default' }}>
                <div className="relative">
                  <img src={profile.avatar} alt="" className="w-24 h-24 rounded-2xl object-cover border-2 border-purple-500/30 mx-auto shadow-xl" style={{ animation: 'float 4s ease-in-out infinite' }}
                    onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${profile.id}/200`; }} />
                  {uploadingAvatar && <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center"><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>}
                  {isOwnProfile && (
                    <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="absolute -bottom-1 -right-1 w-8 h-8 bg-purple-600 text-white rounded-xl flex items-center justify-center border-2 border-[#0a0a1a] shadow-lg hover:bg-purple-500 transition-all">
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                  )}
                </div>
                <span className="absolute bottom-1 right-3 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0a0a1a]" />
              </div>

              <h1 className="text-xl font-black text-white mt-4 flex flex-wrap items-center justify-center gap-2">
                {profile.name} {profile.isVerified && <svg className="w-5 h-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
              </h1>

              <div className="inline-flex flex-wrap items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-sm font-bold" style={{
                background: roleMeta.bg,
                color: roleMeta.color
              }}>
                {roleMeta.emoji} {roleMeta.label}
              </div>

              {profile.customStatus && (
                <p className="text-sm text-purple-300/60 mt-2 flex flex-wrap items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  {profile.customStatus}
                </p>
              )}

              {/* Level Bar */}
              <div className="mt-4 px-2">
                <div className="flex justify-between text-xs sm:text-sm text-white/40 font-bold mb-1.5">
                  <span>Level {lvl}</span>
                  <span>{profile.points || 0} / {lvl * 150} XP</span>
                </div>
                <div className="h-1.5 bg-[#161b22] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {/* Bio */}
              <div className="mt-4 px-1">
                {editingBio ? (
                  <div className="space-y-2">
                    <textarea className="pf-input w-full resize-none" value={bioText} maxLength={150} rows={3} autoFocus onChange={e => setBioText(e.target.value)} placeholder="Tell people about yourself…" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-white/60">{bioText.length}/150</span>
                      <div className="flex flex-wrap gap-2">
                        <button className="pf-btn pf-btn-ghost" onClick={() => setEditingBio(false)}>Cancel</button>
                        <button className="pf-btn pf-btn-primary" onClick={saveBio}>Save Bio</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-white/60 leading-relaxed cursor-pointer hover:text-white/80 transition-colors" onClick={() => isOwnProfile && setEditingBio(true)}>
                    {profile.bio || (isOwnProfile ? 'Tap to add your bio ✏️' : 'No bio yet.')}
                  </p>
                )}
              </div>

              {/* Follow / Message / Edit Buttons */}
              <div className="flex flex-wrap gap-2 mt-5">
                {!isOwnProfile ? (
                  <>
                    <button onClick={() => navigate('/chat?userId=' + profile.id)} className="pf-btn pf-btn-primary flex flex-wrap-1 flex flex-wrap items-center justify-center gap-1.5">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                      Message
                    </button>
                    <button onClick={handleFollow} className={`pf-btn flex flex-wrap-1 flex flex-wrap items-center justify-center gap-1.5 ${isFollowing ? 'pf-btn-ghost' : 'pf-btn-follow'}`}>
                      {isFollowing ? (
                        <><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Following</>
                      ) : (
                        <><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg> Follow</>
                      )}
                    </button>
                  </>
                ) : (
                  <button onClick={() => navigate('/settings')} className="pf-btn pf-btn-primary w-full">
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 gap-2 mt-5">
                {[
                  { icon: '⚡', label: 'AP', value: profile.ap || 0, color: '#f97316' },
                  { icon: '👥', label: 'Followers', value: profile.followers?.length || 0, color: '#ec4899' },
                  { icon: '📝', label: 'Posts', value: shouts.length, color: '#60a5fa' },
                  { icon: '🏆', label: 'Badges', value: earned.length, color: '#f59e0b' },
                ].map((s, i) => (
                  <div key={i} className="pf-mini-stat">
                    <div className="text-lg mb-1" style={{ color: s.color }}>{s.icon}</div>
                    <div className="text-lg font-black text-white">{s.value}</div>
                    <div className="text-sm font-bold text-white/60 uppercase tracking-wider mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Total Online Time */}
              <div className="mt-3 bg-[#1C1C2E] border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between hover:bg-[#161b22] transition-colors cursor-default">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xl shadow-inner border border-emerald-500/20">
                    ⏱️
                  </div>
                  <div className="text-left">
                    <p className="text-xs sm:text-sm font-bold text-emerald-400/80 uppercase tracking-wider mb-0.5">Total Online Time</p>
                    <p className="text-sm font-black text-emerald-50">{formatOnlineTime(profile.totalOnlineTime || 0)}</p>
                  </div>
                </div>
                <div className="text-emerald-500/50">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              </div>

              {/* About Me */}
              <div className="mt-5 pt-5 border-t border-[#30363d]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider">About Me</h3>
                  {isOwnProfile && (
                    <button onClick={() => setEditingAbout(!editingAbout)} className="text-xs sm:text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors">
                      {editingAbout ? 'Cancel' : 'Edit'}
                    </button>
                  )}
                </div>
                {editingAbout ? (
                  <div className="space-y-2.5 text-left">
                    {['Location', 'Gender', 'Education', 'Work'].map((field, i) => (
                      <div key={field}>
                        <label className="text-xs sm:text-sm font-bold text-white/60 uppercase tracking-wider">{field}</label>
                        {field === 'Gender' ? (
                          <select className="pf-input w-full mt-1" value={editGen} onChange={e => setEditGen(e.target.value)}>
                            <option>Male</option><option>Female</option><option>Other</option><option>Not specified</option>
                          </select>
                        ) : (
                          <input type="text" className="pf-input w-full mt-1"
                            value={[editLoc, editEdu, editWork][i]}
                            onChange={e => {
                              const setters = [setEditLoc, setEditEdu, setEditWork];
                              setters[i](e.target.value);
                            }}
                            placeholder={`Enter ${field.toLowerCase()}...`} />
                        )}
                      </div>
                    ))}
                    <button onClick={saveAboutMe} className="pf-btn pf-btn-primary w-full mt-1">Save Details</button>
                  </div>
                ) : (
                  <div className="space-y-2 text-left">
                    {[
                      { icon: '📍', label: 'Location', val: profile.fromCountry || 'Bangladesh' },
                      { icon: '⚧️', label: 'Gender', val: profile.gender || 'Not specified' },
                      { icon: '🎓', label: 'Education', val: profile.education || 'Not specified' },
                      { icon: '💼', label: 'Work', val: profile.work || 'Not specified' },
                    ].map((item, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-2.5 text-sm">
                        <span className="text-base">{item.icon}</span>
                        <span className="text-white/40 text-xs sm:text-sm font-bold uppercase tracking-wider w-20 shrink-0">{item.label}</span>
                        <span className="text-white/70 font-medium truncate">{item.val}</span>
                      </div>
                    ))}
                    {profile.createdAt && (
                      <div className="flex flex-wrap items-center gap-2.5 text-sm">
                        <span className="text-base">📅</span>
                        <span className="text-white/40 text-xs sm:text-sm font-bold uppercase tracking-wider w-20 shrink-0">Joined</span>
                        <span className="text-white/70 font-medium">{new Date(profile.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Achievements */}
              <div className="mt-5 pt-5 border-t border-[#30363d]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider">Achievements</h3>
                  <span className="text-xs sm:text-sm font-bold text-purple-400">{earned.length}/{ACHIEVEMENTS.length}</span>
                </div>
                <div className="h-1.5 bg-[#161b22] rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-purple-500 transition-all duration-500" style={{ width: `${(earned.length / ACHIEVEMENTS.length) * 100}%` }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 gap-2">
                  {ACHIEVEMENTS.map(a => {
                    const unlocked = a.check(profile);
                    return (
                      <div key={a.id} className={`flex flex-wrap items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${unlocked ? 'bg-purple-500/10 text-purple-300' : 'bg-[#161b22]/50 text-white/40'}`}>
                        <span className={unlocked ? '' : 'grayscale opacity-30'}>{a.icon}</span>
                        <span>{a.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Special Badges */}
              {profile.badges && profile.badges.length > 0 && (
                <div className="mt-5 pt-5 border-t border-[#30363d]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-emerald-400/80 uppercase tracking-wider">🎮 Gamified Badges</h3>
                    <span className="text-xs sm:text-sm font-bold text-emerald-400">{profile.badges.length} Unlocked</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.badges.map((b: string) => {
                      const badge = GAMIFIED_BADGES[b];
                      if (!badge) return null;
                      return (
                        <div key={b} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-black border ${badge.bg} ${badge.color}`}>
                          <span>{badge.icon}</span>
                          <span>{badge.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="flex-1 space-y-5 min-w-0">
            {/* Activity Overview */}
            <div className="pf-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-purple-400 uppercase tracking-[0.15em]">Activity Overview</p>
                  <h2 className="text-lg font-black text-white mt-0.5">{profile.name}'s Activity</h2>
                </div>
                {isPremiumActive && <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">🔥 Rising</span>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-3">
                {[
                  { icon: '🧵', label: 'Topics', value: userThreads.length, color: '#a78bfa' },
                  { icon: '💬', label: 'Posts', value: userPosts.length, color: '#60a5fa' },
                  { icon: '📣', label: 'Shouts', value: shouts.length, color: '#34d399' },
                  { icon: '🏆', label: 'Achievements', value: earned.length, color: '#fbbf24' },
                ].map((s, i) => (
                  <div key={i} className="bg-[#161b22]/50 rounded-xl p-4 border border-[#30363d] hover:border-purple-500/30 transition-all">
                    <div className="text-lg mb-1">{s.icon}</div>
                    <div className="text-xl font-black text-white">{s.value}</div>
                    <div className="text-sm font-bold text-white/60 uppercase tracking-wider mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Wallet */}
            <div className="pf-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-white flex flex-wrap items-center gap-2">🔥 Wallet</h2>
                <span className="text-xs sm:text-sm font-bold text-purple-400 uppercase tracking-[0.15em]">Live</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-2.5">
                {walletItems.map((s, i) => (
                  <div key={i} className="bg-[#161b22]/50 rounded-xl p-3 border border-[#30363d] flex flex-wrap items-center gap-3 hover:bg-[#161b22] transition-all">
                    <div className="text-xl shrink-0" style={{ color: s.color }}>{s.icon}</div>
                    <div className="min-w-0">
                      <div className="text-base font-black text-white truncate" title={String(s.value)}>
                        {typeof s.value === 'number' ? formatLargeNumber(s.value) : s.value}
                      </div>
                      <div className="text-sm font-bold text-white/60 uppercase tracking-wider truncate">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Section */}
            <div className="pf-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-white">📋 Activity</h2>
                <div className="flex flex-wrap gap-1 text-xs sm:text-sm text-white/60">
                  <span className="px-2 py-1 rounded-lg bg-[#161b22] border border-[#30363d]">🧵 {userThreads.length}</span>
                  <span className="px-2 py-1 rounded-lg bg-[#161b22] border border-[#30363d]">💬 {userPosts.length}</span>
                  <span className="px-2 py-1 rounded-lg bg-[#161b22] border border-[#30363d]">📣 {shouts.length}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4 overflow-x-auto pb-1">
                {(['topics', 'posts', 'shouts'] as const).map(tab => (
                  <button key={tab} onClick={() => setActivitySubTab(tab)}
                    className={`px-4 py-2 rounded-xl text-sm font-black transition-all tracking-wider ${activitySubTab === tab
                      ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-900/40 scale-105'
                      : 'bg-[#161b22] text-gray-400 border border-[#30363d] hover:border-purple-500/40 hover:text-gray-200'}`}>
                    {tab === 'topics' ? '📝 Topics' : tab === 'posts' ? '💬 Posts' : '📢 Shouts'}
                  </button>
                ))}
              </div>



              {activitySubTab === 'topics' && (
                userThreads.length === 0 ? <p className="text-white/60 text-sm text-center py-8">No topics created yet.</p>
                  : <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                    {[...userThreads].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).map(t => (
                      <Link key={t.id} to={`/forum/thread/${t.id}`} className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[#161b22]/40 border border-[#30363d]/50 hover:bg-[#161b22] hover:border-purple-500/30 transition-all group">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-lg shrink-0">🧵</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white/80 truncate group-hover:text-purple-300 transition-colors">{t.title}</p>
                          <p className="text-xs sm:text-sm text-white/60 flex flex-wrap items-center gap-2 mt-0.5">
                            <span>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}</span>
                            <span className="w-1 h-1 rounded-full bg-white/20"></span>
                            <span>{t.replyCount || 0} replies</span>
                            {t.viewCount ? <><span className="w-1 h-1 rounded-full bg-white/20"></span><span>{t.viewCount} views</span></> : null}
                            {t.lastActivity ? <><span className="w-1 h-1 rounded-full bg-white/20"></span><span>Last: {new Date(t.lastActivity).toLocaleDateString()}</span></> : null}
                          </p>
                        </div>
                        {t.isPinned && <span className="text-xs sm:text-sm px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">📌</span>}
                        <svg className="w-4 h-4 text-white/40 shrink-0 group-hover:text-purple-400/40 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </Link>
                    ))}
                  </div>
              )}

              {activitySubTab === 'posts' && (
                userPosts.length === 0 ? <p className="text-white/60 text-sm text-center py-8">No posts yet.</p>
                  : <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                    {[...userPosts].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).map(p => {
                      const thread = allForumThreads.find((t: any) => t.id === p.threadId);
                      const preview = (p.content || '').replace(/\[.*?\]/g, '').trim();
                      const reactions = Object.keys(p.userReactions || {}).length;
                      const isLiked = reactions > 0;
                      return (
                        <Link key={p.id} to={`/forum/thread/${p.threadId}`} className="flex flex-wrap items-start gap-3 p-3 rounded-xl bg-[#161b22]/40 border border-[#30363d]/50 hover:bg-[#161b22] hover:border-purple-500/30 transition-all group">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-lg shrink-0">💬</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-purple-300/60 truncate group-hover:text-purple-300 transition-colors">{thread ? thread.title : `Thread #${p.threadId}`}</p>
                            <p className="text-sm text-white/70 truncate mt-0.5">{preview.substring(0, 100)}{preview.length > 100 ? '…' : ''}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-xs sm:text-sm text-white/60">{p.timestamp ? new Date(p.timestamp).toLocaleDateString() : '—'}</span>
                              {isLiked && <span className="text-xs sm:text-sm text-rose-400/60">❤️ {reactions}</span>}
                              {p.replyTo && <span className="text-xs sm:text-sm text-white/40">↪️ reply</span>}
                            </div>
                          </div>
                          {isLiked && <span className="text-xs sm:text-sm px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">{reactions}</span>}
                        </Link>
                      );
                    })}
                  </div>
              )}

              {activitySubTab === 'shouts' && (
                shouts.length === 0 ? <p className="text-white/60 text-sm text-center py-8">No shouts yet.</p>
                  : <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                    {[...shouts].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).map(s => {
                      const preview = (s.content || '').replace(/\[.*?\]/g, '').trim();
                      const reactions = Object.keys(s.userReactions || {}).length;
                      const replies = (s.replies || []).length;
                      return (
                        <div key={s.id} className={`flex flex-wrap items-start gap-3 p-3 rounded-xl border transition-all ${s.isPinned
                          ? 'bg-amber-500/5 border-amber-500/20'
                          : 'bg-[#161b22]/40 border-[#30363d]/50 hover:bg-[#161b22] hover:border-purple-500/30'}`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${s.isPinned ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>📣</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {s.isPinned && <span className="text-xs sm:text-sm px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold leading-none">📌 Pinned</span>}
                            </div>
                            <p className="text-sm text-white/70 truncate mt-1">{preview.substring(0, 100)}{preview.length > 100 ? '…' : ''}</p>
                            <div className="flex flex-wrap items-center gap-3 mt-1">
                              <span className="text-xs sm:text-sm text-white/60">{s.timestamp ? new Date(s.timestamp).toLocaleDateString() : '—'}</span>
                              {reactions > 0 && <span className="text-xs sm:text-sm text-rose-400/60">❤️ {reactions}</span>}
                              {replies > 0 && <span className="text-xs sm:text-sm text-blue-400/60">💬 {replies}</span>}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 shrink-0">
                            {reactions > 0 && <span className="text-xs sm:text-sm px-2 py-1 rounded-lg bg-rose-500/10 text-rose-400 font-bold">❤️{reactions}</span>}
                            {replies > 0 && <span className="text-xs sm:text-sm px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 font-bold">💬{replies}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
              )}
            </div>

            {/* Visitor Messages */}
            <div className="pf-card p-5">
              <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">💬 Visitor Messages</h2>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {visitorMessages.length === 0 ? (
                  <p className="text-white/40 text-sm text-center py-4">No messages yet. Leave one below!</p>
                ) : (
                  visitorMessages.slice(0, 10).map((vm: any) => (
                    <div key={vm.id} className="flex items-start gap-3 bg-[#161b22] rounded-xl p-3">
                      <img src={vm.authorAvatar} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-purple-400">{vm.authorName}</p>
                        <p className="text-sm text-white/80">{vm.message}</p>
                        <p className="text-xs text-white/40 mt-1">{new Date(vm.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {viewerSession && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a message..."
                    className="flex-1 bg-[#161b22] border border-[#30363d] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-purple-500/40"
                    id="vm-input-up"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        const msg = input.value.trim();
                        if (!msg) return;
                        fetch(`${API_BASE}/visitor-messages`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            id: `vm_${Date.now()}`,
                            profileUserId: profile.id,
                            authorId: viewerSession.id,
                            authorName: viewerSession.name,
                            authorAvatar: viewerSession.avatar,
                            message: msg
                          })
                        }).then(() => {
                          input.value = '';
                          setVisitorMessages(prev => [{ id: `vm_${Date.now()}`, authorId: viewerSession.id, authorName: viewerSession.name, authorAvatar: viewerSession.avatar, message: msg, createdAt: Date.now() }, ...prev]);
                        }).catch(err => console.warn(err));
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {/* Premium Tools */}
            {isPremiumActive && (
              <div className="pf-card p-5">
                <h2 className="text-lg font-black text-white mb-4">💎 Elite Tools</h2>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <input type="text" maxLength={30} value={statusInput} onChange={e => setStatusInput(e.target.value)} placeholder="Custom status..." className="pf-input flex-1" />
                    <button onClick={() => updatePremiumSettings({ customStatus: statusInput })} className="pf-btn pf-btn-primary">Set</button>
                  </div>
                  {[
                    { key: 'ghostMode', title: '👻 Ghost Mode', desc: 'Appear offline while browsing' },
                    { key: 'hiddenVisit', title: '🕵️ Hidden Visits', desc: 'Visit profiles anonymously' },
                  ].map(t => (
                    <div key={t.key} className="flex items-center justify-between p-3 rounded-xl bg-[#161b22]/50">
                      <div>
                        <p className="text-sm font-bold text-white/80">{t.title}</p>
                        <p className="text-xs sm:text-sm text-white/60">{t.desc}</p>
                      </div>
                      <button className="pf-toggle" style={{ background: profile[t.key] ? '#7c3aed' : '#30363d' }}
                        onClick={() => updatePremiumSettings({ [t.key]: !profile[t.key] })}>
                        <div className="pf-toggle-knob" style={{ left: profile[t.key] ? '23px' : '3px' }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Panel */}
            {isStaff && (
              <div className="pf-card p-4 sm:p-6 text-center">
                <span className="text-4xl block mb-3">🛡️</span>
                <h3 className="text-white font-black text-lg mb-1">Admin Control Panel</h3>
                <p className="text-white/40 text-sm mb-4">Access site management and moderation tools.</p>
                <div className="flex flex-col gap-2">
                  <Link to="/admin" className="pf-btn pf-btn-primary inline-block">Go to Admin Panel</Link>
                  {!isOwnProfile && (
                    <Link to={`/manage-user/${profile.id}`} className="pf-btn pf-btn-secondary inline-block text-sm">
                      ✏️ Edit This User
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Reward History */}
            <div className="pf-card p-5">
              <PublicRewardHistoryTab profileUserId={profile.id} />
            </div>
          </div>
        </div>
      </div>

      {showShoutModal && (
        <ShoutModal
          shoutId={showShoutModal}
          onClose={() => setShowShoutModal(null)}
          currentUser={profile as any}
        />
      )}
    </div>
  );
};

export default UserProfile;

