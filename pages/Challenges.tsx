
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { API_BASE } from '../services/mongoService';
import { triggerToast } from '../components/NotificationToast';

const Challenges: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const sess = JSON.parse(localStorage.getItem('user_session') || '{}');
      if (sess.id) setUserId(sess.id);
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/challenges${userId ? `?userId=${userId}` : ''}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setTasks(data))
      .catch(() => {});
  }, [userId]);

  const handleClaim = async (id: number, reward: number) => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/challenges/${id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!res.ok) throw new Error('Claim failed');
      setTasks(prev => prev.map(t => t.id === id ? { ...t, claimed: true } : t));
      const session = JSON.parse(localStorage.getItem('user_session') || '{}');
      if (session.points !== undefined) {
        session.points += reward;
        localStorage.setItem('user_session', JSON.stringify(session));
      }
      triggerToast({
        id: 'challenge-claim-' + Date.now(), senderId: 'system', senderName: 'Challenges',
        senderAvatar: '', type: 'REWARD',
        message: `Claimed +${reward} pts from ${tasks.find(t => t.id === id)?.title}!`,
        timestamp: Date.now(), isRead: false
      });
    } catch (err) {
      console.error('Failed to claim challenge:', err);
    }
  };

  const setReminder = (task: any) => {
    navigate(`/reminders?title=${encodeURIComponent(task.title)}&desc=${encodeURIComponent(task.desc)}`);
  };

  return (
    <div className="min-h-screen bg-transparent font-inter">
      <header className="bg-orange-600 text-white p-4 sm:p-6 pb-16 sm:pb-20 rounded-b-[2rem] sm:rounded-b-[3rem] flex items-center justify-between flex-wrap gap-2">
        <div className="flex flex-wrap items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-orange-500 rounded-full active:scale-90">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          </button>
          <h2 className="text-2xl font-black">Daily Challenges</h2>
        </div>
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">🔥</div>
      </header>

      <div className="px-5 -mt-12 space-y-4 pb-24">
        {tasks.map((task) => (
          <motion.div 
            key={task.id} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white p-4 sm:p-6 rounded-[2rem] shadow-sm border ${task.claimed ? 'border-emerald-100 opacity-70' : 'border-slate-100'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-black text-slate-800 text-sm">{task.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 font-bold uppercase tracking-widest">{task.desc}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button 
                  onClick={() => setReminder(task)}
                  className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-sm shadow-sm hover:bg-indigo-100 transition-colors"
                  title="Set Reminder"
                >
                  ⏰
                </button>
                <span className="text-sm font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full">+{task.reward} Pts</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs sm:text-sm font-black text-slate-400 uppercase">
                <span>Progress</span>
                <span>{task.progress}/{task.total}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${(task.progress / task.total) * 100}%` }}
                  className={`h-full ${task.progress >= task.total ? 'bg-emerald-500' : 'bg-orange-500'}`} 
                />
              </div>
            </div>

            <button 
              disabled={task.progress < task.total || task.claimed}
              onClick={() => handleClaim(task.id, task.reward)}
              className={`w-full mt-5 py-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all ${
                task.claimed ? 'bg-emerald-50 text-emerald-500' : 
                task.progress >= task.total ? 'bg-orange-600 text-white shadow-lg shadow-orange-100 active:scale-95' : 
                'bg-slate-50 text-slate-300'
              }`}
            >
              {task.claimed ? 'CLAIMED ✓' : task.progress >= task.total ? 'CLAIM REWARD' : 'IN PROGRESS...'}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Challenges;

