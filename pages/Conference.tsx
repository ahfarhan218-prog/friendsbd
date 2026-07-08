import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ConferenceRoom, RoomMessage, User } from '../types';
import { API_BASE } from '../services/mongoService';
import { triggerToast } from '../components/NotificationToast';
import { BBCodeParser } from '../components/BBCodeParser';

const Conference: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<ConferenceRoom | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch all users for member/invite display
  useEffect(() => {
    fetch(`${API_BASE}/users`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setAllUsers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Load Data
  useEffect(() => {
    const session = localStorage.getItem('user_session');
    let currentUser: User | null = null;
    if (session) {
      currentUser = JSON.parse(session);
      setActiveUser(currentUser);
    } else {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      try {
        // Fetch room
        const roomRes = await fetch(`${API_BASE}/conference/rooms?userId=${currentUser?.id}`);
        if (roomRes.ok) {
          const rooms = await roomRes.json();
          const foundRoom = rooms.find((r: ConferenceRoom) => r.id === roomId);
          
          if (!foundRoom) {
            navigate('/conference');
            return;
          }

          const isAdmin = currentUser?.role === 'admin';
          const isInvited = foundRoom.invites.includes(currentUser?.id);
          const isMember = foundRoom.members.includes(currentUser?.id);
          
          // Automatically join if invited
          if (isInvited && !isMember) {
            await fetch(`${API_BASE}/conference/rooms/${roomId}/join`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: currentUser?.id })
            });
            foundRoom.members.push(currentUser?.id);
          }
          setRoom(foundRoom);
        }

        // Fetch messages
        const msgRes = await fetch(`${API_BASE}/conference/rooms/${roomId}/messages?userId=${currentUser?.id}`);
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          setMessages(msgData);
        }
      } catch (err) {
        console.error('Error loading conference data', err);
      }
    };

    loadData();
    const interval = setInterval(loadData, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [roomId, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, messages.length]);

  const handleSend = async () => {
    if (!inputText.trim() || !room || !activeUser) return;

    if (editingId) {
      try {
        await fetch(`${API_BASE}/conference/messages/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: inputText })
        });
        setMessages(messages.map(m => m.id === editingId ? { ...m, text: inputText, isEdited: true } : m));
        setEditingId(null);
      } catch (err) {
        console.error('Error editing message', err);
      }
    } else {
      try {
        const res = await fetch(`${API_BASE}/conference/rooms/${roomId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: activeUser.id,
            senderName: activeUser.name,
            senderAvatar: activeUser.avatar,
            text: inputText
          })
        });
        if (res.ok) {
          const newMessage = await res.json();
          setMessages([...messages, newMessage]);
        }
      } catch (err) {
        console.error('Error sending message', err);
      }
    }
    setInputText('');
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      await fetch(`${API_BASE}/conference/messages/${id}`, { method: 'DELETE' });
      setMessages(messages.filter(m => m.id !== id));
    } catch (err) {
      console.error('Error deleting message', err);
    }
  };

  const handlePinMessage = async (id: string) => {
    const msg = messages.find(m => m.id === id);
    if (!msg) return;
    try {
      await fetch(`${API_BASE}/conference/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !msg.isPinned })
      });
      setMessages(messages.map(m => m.id === id ? { ...m, isPinned: !m.isPinned } : m));
    } catch (err) {
      console.error('Error pinning message', err);
    }
  };

  const handleReact = async (msgId: string, emoji: string) => {
    if (!activeUser) return;
    try {
      await fetch(`${API_BASE}/conference/messages/${msgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction: emoji, reactionUserId: activeUser.id })
      });
      
      setMessages(messages.map(m => {
        if (m.id === msgId) {
          const newReactions = { ...m.reactions };
          if (newReactions[activeUser.id] === emoji) {
            delete newReactions[activeUser.id];
          } else {
            newReactions[activeUser.id] = emoji;
          }
          return { ...m, reactions: newReactions };
        }
        return m;
      }));
    } catch (err) {
      console.error('Error reacting to message', err);
    }
  };

  const handleInvite = async (friendId: string) => {
    try {
      await fetch(`${API_BASE}/conference/rooms/${roomId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: friendId })
      });
      if (room) {
        setRoom({ ...room, invites: [...room.invites, friendId] });
      }
    } catch (err) {
      console.error('Error inviting user', err);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!activeUser || memberId === activeUser.id) return;
    
    const mUser = [...allUsers, activeUser].find(u => u?.id === memberId);
    if (!window.confirm(`Revoke conference access for ${mUser?.name || 'this operative'}?`)) return;

    try {
      await fetch(`${API_BASE}/conference/rooms/${roomId}/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: memberId })
      });
      
      if (room) {
        setRoom({ ...room, members: room.members.filter(id => id !== memberId) });
      }

      triggerToast({
        id: 'member-removed-' + Date.now(),
        senderId: 'system',
        senderName: 'System',
        senderAvatar: 'https://picsum.photos/seed/sys/100',
        type: 'SYSTEM',
        message: `${mUser?.name || 'Member'} has been removed from the session.`,
        timestamp: Date.now(),
        isRead: false
      });
    } catch (err) {
      console.error('Error removing user', err);
    }
  };

  const handleDeleteRoom = async () => {
    if (!window.confirm("Terminate this conference permanently?")) return;
    try {
      await fetch(`${API_BASE}/conference/rooms/${roomId}`, { method: 'DELETE' });
      navigate('/conference');
    } catch (err) {
      console.error('Error deleting room', err);
    }
  };

  if (!room || !activeUser) return null;

  const isOwner = room.creatorId === activeUser.id;
  const isAdmin = activeUser.role === 'admin';
  const pinnedMessages = messages.filter(m => m.isPinned);

  return (
    <div className="h-screen bg-[#0F0F1A] flex flex-col font-inter text-white" style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(124, 58, 237, 0.15) 0%, transparent 70%), linear-gradient(135deg, #110a2a 0%, #1d0d4a 50%, #0d1a6b 100%)' }}>
      
      {/* HEADER */}
      <header className="relative z-50 bg-[#12122A]/80 backdrop-blur-xl border-b border-purple-500/20 p-4 sm:p-6 pb-6 shadow-[0_4px_30px_rgba(0,0,0,0.5)] shrink-0">
         <div className="flex justify-between items-center mb-4">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
               <button onClick={() => navigate('/conference')} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl active:scale-90 border border-white/10 transition-colors">
                  <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
               </button>
               <div>
                  <h2 className="text-lg sm:text-xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">{room.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                     <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                     <p className="text-sm sm:text-xs sm:text-sm font-black uppercase tracking-widest text-emerald-400/80">{room.members.length} Secure Connections</p>
                  </div>
               </div>
            </div>
            <div className="flex flex-wrap gap-2">
               {(isOwner || isAdmin) && (
                 <button onClick={handleDeleteRoom} className="w-10 h-10 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 flex items-center justify-center transition-colors">🗑️</button>
               )}
               <button onClick={() => setShowMembers(true)} className="w-10 h-10 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl border border-indigo-500/30 flex items-center justify-center transition-colors shadow-[0_0_15px_rgba(99,102,241,0.2)]">👥</button>
            </div>
         </div>

         {/* PINNED MESSAGES SECTION */}
         <AnimatePresence>
            {pinnedMessages.length > 0 && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-2 mt-2">
                 {pinnedMessages.map(pm => (
                   <div key={pm.id} className="bg-[#1A1A35]/60 backdrop-blur-md border border-amber-500/20 rounded-2xl p-3 flex flex-wrap items-center gap-3 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                      <span className="text-amber-400">📌</span>
                      <div className="flex-1 min-w-0">
                         <p className="text-xs sm:text-sm font-black text-amber-400 uppercase tracking-widest">{pm.senderName}</p>
                         <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">{pm.text}</p>
                      </div>
                      {(isOwner || isAdmin) && (
                        <button onClick={() => handlePinMessage(pm.id)} className="text-sm font-black text-slate-500 hover:text-white uppercase transition-colors">Unpin</button>
                      )}
                   </div>
                 ))}
              </motion.div>
            )}
         </AnimatePresence>
      </header>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 custom-scrollbar relative z-10">
         {messages.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-6 sm:p-12 opacity-50">
              <div className="text-6xl mb-6 drop-shadow-[0_0_20px_rgba(167,139,250,0.5)]">🛡️</div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-purple-300">Encrypted Tunnel Active</h3>
              <p className="text-xs sm:text-sm font-bold text-slate-400 mt-2">All data is ephemeral and secured locally.</p>
           </div>
         ) : messages.map((m) => {
           const isMe = m.senderId === activeUser.id;
           return (
             <div key={m.id} className={`flex flex-wrap items-end gap-3 group animate-in fade-in slide-in-from-bottom-2 ${isMe ? 'flex flex-wrap-row-reverse' : ''}`}>
                <img src={m.senderAvatar} className="w-8 h-8 sm:w-10 sm:h-10 rounded-[1rem] shadow-lg border border-white/10" alt="" />
                
                <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                   {/* Name & Time */}
                   <div className={`flex flex-wrap items-center gap-2 mb-1 px-1 ${isMe ? 'flex flex-wrap-row-reverse' : ''}`}>
                      <p className="text-xs sm:text-sm font-black text-purple-300/80 uppercase tracking-widest">{isMe ? 'YOU' : m.senderName}</p>
                      <p className="text-sm font-bold text-slate-500 uppercase">{new Date(m.timestamp).toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' })}</p>
                      {m.isEdited && <span className="text-[7px] font-bold text-slate-400 uppercase">Edited</span>}
                   </div>
                   
                   {/* Bubble */}
                   <div className="relative group">
                     {/* Actions (Hover) */}
                     <div className={`absolute -top-8 ${isMe ? 'right-0' : 'left-0'} opacity-0 group-hover:opacity-100 transition-opacity flex flex-wrap gap-1 bg-[#12122A]/90 backdrop-blur-md border border-white/10 p-1 rounded-xl z-20`}>
                        {(isMe || isAdmin) && (
                          <>
                            <button onClick={() => { setInputText(m.text); setEditingId(m.id); }} className="w-6 h-6 flex items-center justify-center text-xs sm:text-sm text-slate-400 hover:text-purple-400 transition-colors bg-white/5 rounded-lg">✏️</button>
                            <button onClick={() => handleDeleteMessage(m.id)} className="w-6 h-6 flex items-center justify-center text-xs sm:text-sm text-slate-400 hover:text-rose-400 transition-colors bg-white/5 rounded-lg">🗑️</button>
                          </>
                        )}
                        {(isOwner || isAdmin) && (
                          <button onClick={() => handlePinMessage(m.id)} className={`w-6 h-6 flex items-center justify-center text-xs sm:text-sm transition-colors bg-white/5 rounded-lg ${m.isPinned ? 'text-amber-500' : 'text-slate-400 hover:text-amber-400'}`}>📌</button>
                        )}
                        <button onClick={() => handleReact(m.id, '👍')} className="w-6 h-6 flex items-center justify-center text-xs sm:text-sm text-slate-400 hover:text-white transition-colors bg-white/5 rounded-lg">👍</button>
                        <button onClick={() => handleReact(m.id, '❤️')} className="w-6 h-6 flex items-center justify-center text-xs sm:text-sm text-slate-400 hover:text-white transition-colors bg-white/5 rounded-lg">❤️</button>
                     </div>

                     {/* Message Content */}
                     <div className={`px-4 sm:px-5 py-3 sm:py-4 rounded-[1.5rem] shadow-xl relative z-10 ${
                       isMe 
                         ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-br-sm border border-purple-400/30' 
                         : 'bg-[#1A1A35]/80 backdrop-blur-md text-slate-200 rounded-bl-sm border border-white/5'
                     }`}>
                        <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">
                          <BBCodeParser rawText={m.text} />
                        </div>
                        
                        {/* REACTIONS DISPLAY */}
                        {Object.keys(m.reactions).length > 0 && (
                          <div className={`mt-2 flex flex-wrap gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                             {Object.entries(Object.values(m.reactions).reduce((acc: Record<string, number>, emoji: string) => {
                               acc[emoji] = (acc[emoji] || 0) + 1;
                               return acc;
                             }, {})).map(([emoji, count]) => (
                               <button key={emoji} onClick={() => handleReact(m.id, emoji)} className="bg-black/20 border border-white/10 rounded-lg px-2 py-0.5 flex flex-wrap items-center gap-1.5 hover:bg-black/40 transition-colors">
                                  <span className="text-xs sm:text-sm">{emoji}</span>
                                  <span className="text-sm font-black text-white/70">{count}</span>
                               </button>
                             ))}
                          </div>
                        )}
                     </div>
                   </div>

                   {/* SEEN BY DISPLAY */}
                   <div className={`mt-1 flex items-center px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {m.seenBy.length > 1 && (
                        <div className="flex -space-x-1.5 opacity-60 hover:opacity-100 transition-opacity">
                          {m.seenBy.filter(id => id !== m.senderId).slice(0, 3).map(id => (
                            <div key={id} className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#12122A] border border-slate-700 flex items-center justify-center overflow-hidden">
                               <img src={`https://picsum.photos/seed/${id}/20`} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                          {m.seenBy.length > 4 && <span className="text-[6px] font-black text-slate-400 pl-2">+{m.seenBy.length - 4} Seen</span>}
                        </div>
                      )}
                   </div>
                </div>
             </div>
           );
         })}
         <div ref={scrollRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-4 sm:p-6 bg-[#12122A]/80 backdrop-blur-xl border-t border-purple-500/20 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50">
         <div className="flex flex-wrap items-center gap-2 sm:gap-3 max-w-full max-w-4xl mx-auto px-4 sm:px-6 mx-auto">
            {/* Attachment Placeholders */}
            <button className="w-10 h-10 shrink-0 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-slate-400 transition-colors" title="Attach File (Simulated)">📎</button>
            <button className="hidden sm:flex w-10 h-10 shrink-0 bg-white/5 hover:bg-white/10 rounded-full items-center justify-center text-slate-400 transition-colors" title="Audio Message (Simulated)">🎤</button>

            <div className={`flex-1 bg-[#0F0F1A] border ${editingId ? 'border-amber-500/50' : 'border-purple-500/30'} focus-within:border-purple-500/70 rounded-full px-5 py-1.5 flex items-center transition-all shadow-inner`}>
               <input 
                 value={inputText}
                 onChange={e => setInputText(e.target.value)}
                 onKeyPress={e => e.key === 'Enter' && handleSend()}
                 placeholder={editingId ? "Editing message..." : "Type your message..."}
                 className="flex-1 bg-transparent border-none text-sm font-medium py-2.5 text-white outline-none placeholder-slate-500"
               />
               {editingId && <button onClick={() => { setEditingId(null); setInputText(''); }} className="text-rose-400 hover:text-rose-300 text-xs sm:text-sm font-black uppercase px-2 transition-colors">Cancel</button>}
            </div>

            <button 
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all active:scale-90 disabled:opacity-50 disabled:shadow-none hover:shadow-[0_0_30px_rgba(124,58,237,0.6)]"
            >
               <svg className="w-5 h-5 sm:w-6 sm:h-6 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            </button>
         </div>
      </div>

      {/* MEMBER SIDEBAR / DRAWER */}
      <AnimatePresence>
        {showMembers && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMembers(false)} className="fixed inset-0 bg-[#07070F]/80 backdrop-blur-md z-[200]" />
            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed inset-y-0 right-0 w-full max-w-[20rem] sm:w-80 bg-[#12122A] border-l border-purple-500/20 z-[201] p-4 sm:p-6 sm:p-8 flex flex-col rounded-l-[2rem] sm:rounded-l-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.8)]">
               <div className="flex items-center justify-between mb-8 sm:mb-10">
                  <div>
                    <h2 className="text-xl font-black italic tracking-tighter text-white">Personnel</h2>
                    <p className="text-xs sm:text-sm text-indigo-400/80 font-bold uppercase tracking-widest">Active Operatives</p>
                  </div>
                  <button onClick={() => setShowMembers(false)} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors">✕</button>
               </div>

               <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2">
                  {/* CURRENT MEMBERS */}
                  <div className="space-y-3">
                     <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-2">Members ({room.members.length})</h3>
                     {room.members.map(mid => {
                       const mUser = [...allUsers, activeUser].find(u => u?.id === mid);
                       return (
                         <div key={mid} className="bg-[#1A1A35]/60 p-3 sm:p-4 rounded-2xl flex items-center justify-between border border-white/5">
                            <div className="flex flex-wrap items-center gap-3">
                               <img src={mUser?.avatar || `https://picsum.photos/seed/${mid}/50`} className="w-9 h-9 rounded-xl shadow-md border border-white/10" alt="" />
                               <div>
                                  <p className="text-sm font-black text-white">{mUser?.name || 'Unknown'}</p>
                                  <p className={`text-sm font-bold uppercase ${mid === room.creatorId ? 'text-amber-400' : 'text-indigo-400'}`}>{mid === room.creatorId ? 'Owner' : 'Operative'}</p>
                               </div>
                            </div>
                            {(isOwner || isAdmin) && mid !== room.creatorId && (
                              <button onClick={() => handleRemoveMember(mid)} className="w-7 h-7 bg-white/5 hover:bg-rose-500/20 text-xs sm:text-sm rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors">✕</button>
                            )}
                         </div>
                       );
                     })}
                  </div>

                  {/* INVITE SECTION */}
                  {(isOwner || isAdmin) && (
                    <div className="space-y-3">
                       <h3 className="text-sm font-black text-purple-400 uppercase tracking-[0.2em] px-2">Secure Invite</h3>
                       <div className="space-y-2">
                          {allUsers.filter(f => f.id && !room.members.includes(f.id) && !room.invites.includes(f.id)).map(f => (
                            <button key={f.id} onClick={() => handleInvite(f.id)} className="w-full flex items-center justify-between p-3 sm:p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 hover:bg-purple-500/20 transition-colors group">
                               <div className="flex flex-wrap items-center gap-3">
                                  <img src={f.avatar} className="w-8 h-8 rounded-lg border border-white/10" alt="" />
                                  <p className="text-sm font-black text-purple-100">{f.name}</p>
                               </div>
                               <span className="text-sm font-black text-purple-400 group-hover:scale-125 transition-transform">➕</span>
                            </button>
                          ))}
                          {room.invites.length > 0 && (
                            <div className="pt-4 space-y-2 opacity-60">
                               <p className="text-sm font-black uppercase text-slate-400 px-2 tracking-widest">Pending Invites</p>
                               {room.invites.map(iid => {
                                 const iUser = allUsers.find(u => u.id === iid);
                                 return (
                                   <div key={iid} className="flex flex-wrap items-center gap-3 p-3 border border-dashed border-white/10 rounded-xl grayscale opacity-70">
                                      <img src={iUser?.avatar || `https://picsum.photos/seed/${iid}/30`} className="w-6 h-6 rounded-lg" alt="" />
                                      <p className="text-xs sm:text-sm font-bold text-slate-400">{iUser?.name || 'Unknown'}</p>
                                   </div>
                                 );
                               })}
                            </div>
                          )}
                       </div>
                    </div>
                  )}
               </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(167, 139, 250, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(167, 139, 250, 0.4);
        }
      `}</style>
    </div>
  );
};

export default Conference;

