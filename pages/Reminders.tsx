
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserReminder } from '../types';
import { API_BASE } from '../services/mongoService';
import { triggerToast } from '../components/NotificationToast';

const Reminders: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reminders, setReminders] = useState<UserReminder[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [title, setTitle] = useState(searchParams.get('title') || '');
  const [description, setDescription] = useState(searchParams.get('desc') || '');
  const [time, setTime] = useState('');

  const userId = (() => {
    try { return JSON.parse(localStorage.getItem('user_session') || '{}').id; }
    catch { return null; }
  })();

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_BASE}/reminders/${userId}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setReminders(data))
      .catch(() => {});
  }, [userId]);

  const handleAddReminder = async () => {
    if (!title.trim() || !time || !userId) return;

    try {
      const res = await fetch(`${API_BASE}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title,
          description,
          dueTime: new Date(time).getTime()
        })
      });
      if (!res.ok) throw new Error('Failed to create reminder');
      const data = await res.json();
      setReminders(prev => [...prev, data.reminder]);
      setShowForm(false);
      setTitle('');
      setDescription('');
      setTime('');
      triggerToast({
        id: 'rem-success-' + Date.now(), senderId: 'system', senderName: 'Reminder System',
        senderAvatar: 'https://picsum.photos/seed/clock/100', type: 'SYSTEM',
        message: 'Reminder established. System will notify at scheduled interval.',
        timestamp: Date.now(), isRead: false
      });
    } catch (err) {
      console.error('Failed to create reminder:', err);
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      await fetch(`${API_BASE}/reminders/${id}`, { method: 'DELETE' });
      setReminders(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      console.error('Failed to delete reminder:', err);
    }
  };

  const sortedReminders = [...reminders].sort((a, b) => a.dueTime - b.dueTime);

  return (
    <div className="min-h-screen bg-transparent font-inter pb-32">
      <header className="bg-indigo-600 text-white p-6 pb-20 rounded-b-[4rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="relative z-10 flex justify-between items-center mb-8">
           <button onClick={() => navigate('/apps')} className="p-3 bg-white/10 rounded-2xl active:scale-90 border border-white/10">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
           </button>
           <h2 className="text-2xl font-black uppercase tracking-tighter italic">Reminders</h2>
           <button onClick={() => setShowForm(true)} className="p-3 bg-white/10 rounded-2xl active:scale-90 border border-white/10 text-xl">
             ➕
           </button>
        </div>

        <div className="relative z-10 text-center space-y-2">
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-200">Temporal Protocols</p>
           <h3 className="text-4xl font-black italic tracking-tighter drop-shadow-lg">SESSION TIMERS</h3>
        </div>
      </header>

      <div className="px-5 -mt-10 space-y-6 relative z-10">
        <AnimatePresence>
          {showForm && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white p-6 rounded-[2.5rem] shadow-xl border-2 border-indigo-100 overflow-hidden"
            >
               <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 px-1">New Temporal Alert</h4>
               <div className="space-y-4">
                  <input 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Reminder Title (e.g. Join Tournament)"
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 ring-indigo-200"
                  />
                  <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Detailed Notes..."
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 ring-indigo-200 resize-none h-24"
                  />
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Due Date & Time</p>
                    <input 
                      type="datetime-local" 
                      value={time} 
                      onChange={e => setTime(e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 ring-indigo-200"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddReminder} className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100">Establish</button>
                    <button onClick={() => setShowForm(false)} className="px-6 bg-slate-100 text-slate-400 font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest">Abort</button>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
           {sortedReminders.length > 0 ? sortedReminders.map((rem) => {
             const isPast = rem.dueTime < Date.now();
             return (
              <motion.div 
                key={rem.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white p-6 rounded-[2.5rem] shadow-sm border ${isPast ? 'border-slate-100 opacity-60' : 'border-indigo-100'} flex items-center gap-5`}
              >
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${isPast ? 'bg-slate-100 grayscale' : 'bg-indigo-50 text-indigo-600'}`}>
                    ⏰
                 </div>
                 <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-slate-800 tracking-tight truncate">{rem.title}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 truncate">{rem.description || 'No notes added'}</p>
                    <div className="flex items-center gap-2 mt-2">
                       <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${isPast ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                          {isPast ? 'EXPIRED' : 'ACTIVE'}
                       </span>
                       <span className="text-[8px] font-black text-slate-400 uppercase">{new Date(rem.dueTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                 </div>
                 <button onClick={() => deleteReminder(rem.id)} className="w-10 h-10 bg-slate-50 text-slate-300 rounded-xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-colors">
                    ✕
                 </button>
              </motion.div>
             );
           }) : (
             <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                <div className="text-5xl mb-4 grayscale opacity-20">⏰</div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No temporal protocols active</p>
                <button onClick={() => setShowForm(true)} className="mt-4 text-indigo-600 font-black text-[10px] uppercase tracking-widest underline underline-offset-4">Establish Alert</button>
             </div>
           )}
        </div>

        <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl">
           <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl" />
           <div className="relative z-10">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 mb-4">Neural Link Note</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Establish session timers for your community duties. The system will broadcast a neural toast as soon as the scheduled interval is reached. Ephemeral storage only.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Reminders;
