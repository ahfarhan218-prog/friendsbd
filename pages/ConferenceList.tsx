import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ConferenceRoom, User } from '../types';
import { API_BASE } from '../services/mongoService';

const ConferenceList: React.FC = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<ConferenceRoom[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [activeUser, setActiveUser] = useState<User | null>(null);

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

    const fetchRooms = async () => {
      try {
        const res = await fetch(`${API_BASE}/conference/rooms?userId=${currentUser?.id}`);
        if (res.ok) {
          const data = await res.json();
          setRooms(data);
        }
      } catch (err) {
        console.error('Error fetching rooms', err);
      }
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, [navigate]);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || !activeUser) return;
    try {
      const res = await fetch('${API_BASE}/conference/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoomName,
          creatorId: activeUser.id,
          creatorName: activeUser.name
        })
      });
      if (res.ok) {
        const newRoom = await res.json();
        setNewRoomName('');
        setShowCreate(false);
        navigate(`/conference/${newRoom.id}`);
      }
    } catch (err) {
      console.error('Error creating room', err);
    }
  };

  if (!activeUser) return null;

  const isAdmin = activeUser.role === 'admin';
  const myRooms = rooms.filter(r => r.members.includes(activeUser.id) || r.creatorId === activeUser.id);
  const invitedRooms = rooms.filter(r => r.invites.includes(activeUser.id) && !r.members.includes(activeUser.id));
  const otherRooms = rooms.filter(r => !r.members.includes(activeUser.id) && !r.invites.includes(activeUser.id));

  return (
    <div className="min-h-screen bg-[#0F0F1A] font-inter text-white relative" style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(124, 58, 237, 0.15) 0%, transparent 70%), linear-gradient(135deg, #110a2a 0%, #1d0d4a 50%, #0d1a6b 100%)' }}>
      {/* Background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-full max-w-sm h-96 bg-purple-600/30 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-full max-w-sm h-96 bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />

      <header className="relative z-10 bg-[#12122A]/80 backdrop-blur-xl border-b border-purple-500/20 p-4 sm:p-6 pb-20 rounded-b-[3rem] flex items-center justify-between shadow-2xl">
         <div className="flex flex-wrap items-center gap-4">
            <button onClick={() => navigate('/apps')} className="p-2 bg-white/5 border border-white/10 rounded-xl active:scale-90 hover:bg-white/10 transition-colors">
               <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div>
               <h2 className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Conference Hub</h2>
               <p className="text-sm font-black uppercase tracking-widest text-indigo-300/60">Secure Collaboration</p>
            </div>
         </div>
         <button 
           onClick={() => setShowCreate(true)}
           className="w-12 h-12 bg-purple-600/20 hover:bg-purple-600/30 rounded-2xl flex items-center justify-center text-xl backdrop-blur-md border border-purple-500/30 transition-all text-purple-300"
         >
           ➕
         </button>
      </header>

      <div className="relative z-10 px-5 -mt-10 space-y-8 pb-32 max-w-full max-w-4xl mx-auto px-4 sm:px-6 mx-auto">
         {/* MY ACTIVE ROOMS */}
         <section className="space-y-4">
            <h3 className="text-xs sm:text-sm font-black text-purple-400/80 uppercase tracking-widest px-2">My Active Rooms ({myRooms.length})</h3>
            {myRooms.map(room => (
              <motion.button 
                key={room.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/conference/${room.id}`)}
                className="w-full bg-[#1A1A35]/60 hover:bg-[#1f1f3d]/80 backdrop-blur-md p-5 rounded-[2rem] shadow-xl border border-purple-500/20 flex flex-wrap items-center gap-4 text-left transition-all group"
              >
                <div className="w-14 h-14 bg-purple-500/20 group-hover:bg-purple-500/30 rounded-2xl flex items-center justify-center text-2xl border border-purple-500/30 transition-colors">🔒</div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-white truncate">{room.name}</h4>
                  <p className="text-sm text-purple-300/60 font-bold uppercase tracking-widest mt-1">Creator: {room.creatorId === activeUser.id ? 'YOU' : room.creatorName}</p>
                </div>
                <div className="bg-emerald-500/10 text-emerald-400 text-sm font-black px-3 py-1 rounded-full border border-emerald-500/20 uppercase shadow-[0_0_10px_rgba(52,211,153,0.2)]">Active</div>
              </motion.button>
            ))}
            {myRooms.length === 0 && (
              <div className="bg-[#1A1A35]/30 border border-dashed border-purple-500/20 rounded-[2rem] p-4 sm:p-8 text-center backdrop-blur-sm">
                 <p className="text-xs sm:text-sm font-black text-purple-300/50 uppercase tracking-widest">No active sessions</p>
              </div>
            )}
         </section>

         {/* INVITATIONS */}
         {invitedRooms.length > 0 && (
           <section className="space-y-4">
              <h3 className="text-xs sm:text-sm font-black text-orange-400/80 uppercase tracking-widest px-2">Incoming Invitations ({invitedRooms.length})</h3>
              {invitedRooms.map(room => (
                <div key={room.id} className="bg-[#1A1A35]/60 backdrop-blur-md p-5 rounded-[2rem] shadow-xl border border-orange-500/20 flex flex-wrap items-center gap-4">
                  <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center text-2xl border border-orange-500/30">📩</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-white truncate">{room.name}</h4>
                    <p className="text-sm text-orange-300/60 font-bold uppercase mt-1">From: {room.creatorName}</p>
                  </div>
                  <button 
                    onClick={() => navigate(`/conference/${room.id}`)}
                    className="bg-orange-500 text-white text-sm font-black px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.4)] hover:bg-orange-600 transition-colors"
                  >
                    JOIN
                  </button>
                </div>
              ))}
           </section>
         )}

         {/* ADMIN OVERRIDE PANEL */}
         {isAdmin && otherRooms.length > 0 && (
           <section className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 px-2">
                 <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></div>
                 <h3 className="text-xs sm:text-sm font-black text-rose-500 uppercase tracking-widest">Admin Root Access ({otherRooms.length})</h3>
              </div>
              {otherRooms.map(room => (
                <motion.button 
                  key={room.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/conference/${room.id}`)}
                  className="w-full bg-[#120a15]/60 backdrop-blur-md p-5 rounded-[2rem] shadow-xl border border-rose-500/20 flex flex-wrap items-center gap-4 text-left group hover:border-rose-500/40 transition-colors"
                >
                  <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-2xl border border-rose-500/20 group-hover:bg-rose-500/20 transition-colors">⚡</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-white truncate">{room.name}</h4>
                    <p className="text-sm text-rose-300/50 font-bold uppercase mt-1">Creator ID: {room.creatorId}</p>
                  </div>
                  <div className="bg-rose-500/10 text-rose-400 text-sm font-black px-3 py-1 rounded-full border border-rose-500/20 uppercase shadow-[0_0_10px_rgba(244,63,94,0.2)]">Override</div>
                </motion.button>
              ))}
           </section>
         )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)} className="fixed inset-0 bg-[#07070F]/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-[#12122A] border border-purple-500/20 w-full max-w-sm rounded-[3rem] p-4 sm:p-8 shadow-[0_0_50px_rgba(124,58,237,0.15)]">
               <h3 className="text-xl font-black text-white tracking-tighter mb-2">Create Conference</h3>
               <p className="text-xs sm:text-sm text-purple-300/60 font-bold uppercase tracking-widest mb-6">Initialize secure workspace</p>
               <input 
                 autoFocus
                 value={newRoomName}
                 onChange={e => setNewRoomName(e.target.value)}
                 onKeyPress={e => e.key === 'Enter' && handleCreateRoom()}
                 placeholder="Enter Room Name..."
                 className="w-full bg-[#0F0F1A] border-2 border-purple-500/20 focus:border-purple-500/60 rounded-2xl p-4 text-sm font-bold text-white outline-none transition-all mb-6 placeholder-slate-600"
               />
               <div className="flex flex-wrap gap-3">
                  <button onClick={() => setShowCreate(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-black text-xs sm:text-sm rounded-2xl uppercase tracking-widest transition-colors">Cancel</button>
                  <button onClick={handleCreateRoom} disabled={!newRoomName.trim()} className="flex-2 py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white font-black text-xs sm:text-sm rounded-2xl uppercase tracking-widest shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all px-4 sm:px-8">Initialize</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConferenceList;


