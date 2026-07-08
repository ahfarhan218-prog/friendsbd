import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../services/mongoService';
import { User } from '../types';

const Friends: React.FC = () => {
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [followings, setFollowings] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('user_session');
    if (!raw) return;
    const session = JSON.parse(raw);
    setCurrentUser(session);
    setFollowings(session.following || []);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    fetch(`${API_BASE}/users`).then(r => r.json()).then(users => {
      setAllUsers(users.filter((u: User) => u.id !== currentUser.id));
    }).catch(() => {});
  }, [currentUser]);

  const friends = allUsers.filter(u => followings.includes(u.id));
  const onlineFriends = friends.filter(u => u.isOnline);
  const suggestions = allUsers.filter(u => !followings.includes(u.id)).slice(0, 10);

  const handleAddFriend = async (targetId: string, targetName: string) => {
    try {
      const res = await fetch(`${API_BASE}/users/${currentUser!.id}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: currentUser!.id })
      });
      if (!res.ok) return;
      setFollowings(prev => [...prev, targetId]);
      const updated = { ...currentUser!, following: [...(currentUser!.following || []), targetId] };
      setCurrentUser(updated);
      localStorage.setItem('user_session', JSON.stringify(updated));
      const { triggerToast } = await import('../components/NotificationToast');
      triggerToast({ id: 'friend-added-' + Date.now(), senderId: 'system', senderName: 'System', senderAvatar: '', type: 'SYSTEM', message: `You are now following ${targetName}!`, timestamp: Date.now(), isRead: false } as any);
    } catch (e) { console.error(e); }
  };

  const handleUnfollow = async (targetId: string, targetName: string) => {
    try {
      await fetch(`${API_BASE}/users/${targetId}/follow`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: currentUser!.id })
      });
      setFollowings(prev => prev.filter(id => id !== targetId));
      const updated = { ...currentUser!, following: (currentUser!.following || []).filter((id: string) => id !== targetId) };
      setCurrentUser(updated);
      localStorage.setItem('user_session', JSON.stringify(updated));
    } catch (e) { console.error(e); }
  };

  const filtered = searchQuery ? friends.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : friends;

  return (
    <div className="min-h-screen bg-[#0B0B1A] pb-20">
      <header className="relative overflow-hidden bg-gradient-to-br from-[#110a2a] via-[#1d0d4a] to-[#0d1a6b] text-white p-4 sm:p-6 pb-20 rounded-b-[3rem] shadow-lg shadow-purple-900/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_0%,_#7c3aed33,_transparent_70%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0B0B1A] to-transparent" />
        <div className="absolute top-8 right-4 w-24 h-24 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-wrap items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-black/20 rounded-full active:scale-90 transition-transform backdrop-blur-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          </button>
          <h2 className="text-2xl font-bold">Friends</h2>
        </div>
      </header>

      <div className="px-4 -mt-16 flex flex-col gap-6 mb-24">
        {/* Stats */}
        <div className="bg-[#1C1C2E] rounded-[2.5rem] p-4 sm:p-6 border border-[#30363d] shadow-lg relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/5 rounded-full" />
          <div className="relative z-10">
            <h3 className="text-lg font-black text-white mb-4">My Friends</h3>
            <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#161b22] rounded-xl p-4 border border-[#30363d]">
                <p className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-wider">Following</p>
                <p className="text-3xl font-black text-white mt-1">{friends.length}</p>
              </div>
              <div className="bg-[#161b22] rounded-xl p-4 border border-[#30363d]">
                <p className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-wider">Online Now</p>
                <p className="text-3xl font-black text-green-400 mt-1">{onlineFriends.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search friends..." className="w-full bg-[#161b22] border border-[#30363d] rounded-2xl py-4 px-12 text-sm text-gray-200 focus:outline-none focus:border-purple-500 placeholder-gray-500" />
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>

        {/* Friends List */}
        <div className="space-y-3">
          {filtered.length === 0 && searchQuery && <p className="text-center text-gray-500 text-sm py-8">No friends match your search.</p>}
          {filtered.length === 0 && !searchQuery && <p className="text-center text-gray-500 text-sm py-8">You're not following anyone yet. Check suggestions below!</p>}
          {filtered.map(friend => (
            <div key={friend.id} className="bg-[#1C1C2E] p-5 rounded-[2rem] border border-[#30363d] hover:border-purple-500/30 transition-all cursor-pointer group" onClick={() => navigate(`/profile/${friend.username}`)}>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="relative">
                  <img src={friend.avatar || `https://picsum.photos/seed/${friend.id}/100`} className="w-14 h-14 rounded-2xl object-cover border-2 border-[#30363d] group-hover:border-purple-500/40 transition-all" alt="" />
                  {friend.isOnline && <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#1C1C2E] rounded-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-black text-gray-100 truncate">{friend.name}</h4>
                    {friend.isVerified && <span className="text-blue-400 text-sm">✓</span>}
                    {friend.isPremium && <span className="text-sm bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-full font-bold">👑</span>}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 font-bold">@{friend.username} · Level {friend.level || 1}</p>
                </div>
                <svg className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 gap-3" onClick={e => e.stopPropagation()}>
                <button onClick={() => navigate(`/chat?userId=${friend.id}`)} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-900/30 hover:opacity-90 transition-all text-sm flex flex-wrap items-center justify-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                  Message
                </button>
                <button onClick={() => handleUnfollow(friend.id, friend.name)} className="bg-[#161b22] text-gray-400 font-bold py-3 rounded-xl hover:bg-red-900/20 hover:text-red-400 transition-all text-sm border border-[#30363d]">
                  Unfollow
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="bg-[#090d16]/80 backdrop-blur-xl border border-[#30363d] shadow-xl shadow-purple-900/10 rounded-[2.5rem] p-4 sm:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <h4 className="relative z-10 text-xs sm:text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 uppercase tracking-widest mb-4 flex flex-wrap items-center gap-2">
              <span className="text-lg">✨</span> People You May Know
            </h4>
            <div className="flex flex-wrap gap-4 overflow-x-auto pb-2 no-scrollbar">
                {suggestions.map(sug => (
                  <div key={sug.id} className="min-w-[130px] bg-[#1C1C2E] rounded-3xl p-4 flex flex-col items-center text-center border border-white/5 hover:border-purple-500/30 transition-all">
                    <img src={sug.avatar || `https://picsum.photos/seed/${sug.id}/100`} className="w-14 h-14 rounded-2xl mb-3 object-cover border-2 border-purple-500/30" alt="" />
                    <p className="text-xs sm:text-sm font-black text-gray-100 truncate w-full mb-3">{sug.name}</p>
                    <button onClick={() => handleAddFriend(sug.id, sug.name)}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-black px-4 py-2 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-purple-900/30">
                      FOLLOW
                    </button>
                  </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

export default Friends;

