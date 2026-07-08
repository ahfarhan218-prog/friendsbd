import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { API_BASE } from '../services/mongoService';

const Rewards: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'earn' | 'redeem'>('earn');
  const [checkedIn, setCheckedIn] = useState(false);
  const [claimedRewards, setClaimedRewards] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('user_session');
    if (saved) {
      const userData = JSON.parse(saved);
      setUser(userData);
      const savedRewards = localStorage.getItem(`rewards_${userData.id}`);
      if (savedRewards) setClaimedRewards(JSON.parse(savedRewards));
    }
  }, []);

  const syncPoints = async (newPoints: number) => {
    if (!user) return;
    const updatedUser = { ...user, points: newPoints };
    setUser(updatedUser);
    localStorage.setItem('user_session', JSON.stringify(updatedUser));
    try {
      await fetch(`${API_BASE}/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: newPoints })
      });
    } catch {}
  };

  const handleCheckIn = () => {
    if (checkedIn || !user) return;
    syncPoints(user.points + 20);
    setCheckedIn(true);
  };

  const handleRedeem = (id: string, cost: number) => {
    if (!user || user.points < cost || claimedRewards.includes(id)) return;
    syncPoints(user.points - cost);
    const newClaimed = [...claimedRewards, id];
    setClaimedRewards(newClaimed);
    localStorage.setItem(`rewards_${user.id}`, JSON.stringify(newClaimed));
  };

  const earnTasks = [
    { id: 'shout', label: 'Post a Shout', desc: 'Share your thoughts with the community', pts: 15, icon: '📢', color: 'bg-blue-500/10 text-blue-400' },
    { id: 'quiz', label: 'Win a Quiz', desc: 'Get all answers correct in a quiz', pts: 50, icon: '🧠', color: 'bg-green-500/10 text-green-400' },
    { id: 'friend', label: 'Add a Friend', desc: 'Connect with a new person', pts: 10, icon: '🤝', color: 'bg-purple-500/10 text-purple-400' },
    { id: 'premium', label: 'Go Premium', desc: 'Unlock the ultimate social status', pts: 500, icon: '👑', color: 'bg-amber-500/10 text-amber-400' },
  ];

  const redeemItems = [
    { id: 'gold_name', label: 'Golden Name', desc: 'Stand out in the shoutbox', cost: 200, icon: '✨' },
    { id: 'double_xp', label: '2X XP Booster', desc: 'Double your level gains for 24h', cost: 500, icon: '⚡' },
    { id: 'chat_bubble', label: 'Neon Bubble', desc: 'Custom chat message style', cost: 350, icon: '💬' },
    { id: 'exclusive_tag', label: 'Elite Tag', desc: 'Exclusive profile badge', cost: 1000, icon: '🎗️' },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0B0B1A] pb-24">
      <header className="relative overflow-hidden bg-gradient-to-br from-[#110a2a] via-[#1d0d4a] to-[#0d1a6b] text-white p-6 pb-20 rounded-b-[2rem] sm:rounded-b-[3rem] shadow-lg shadow-purple-900/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_0%,_#7c3aed33,_transparent_70%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0B0B1A] to-transparent" />
        <div className="absolute top-8 right-4 w-24 h-24 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 bg-black/20 rounded-full backdrop-blur-sm active:scale-90 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            </button>
            <div>
              <h2 className="text-2xl font-bold">Rewards Hub</h2>
              <p className="text-[10px] opacity-70 uppercase tracking-widest font-bold">Earn & Redeem Points</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-2xl flex items-center gap-2 border border-white/10">
              <span className="text-yellow-400 text-sm">💰</span>
              <span className="font-black text-sm">{user.points}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 -mt-16 flex flex-col gap-6 mb-24">
        {/* Daily Check-in */}
        <div className="bg-[#1C1C2E] rounded-[2.5rem] p-6 border border-white/5 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col">
              <h3 className="text-lg font-black text-white">Daily Bonus</h3>
              <p className="text-xs text-white/50">Come back tomorrow for more!</p>
            </div>
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-2xl">🎁</div>
          </div>
          <button onClick={handleCheckIn} disabled={checkedIn}
            className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              checkedIn ? 'bg-[#161b22] text-white/30 shadow-none cursor-not-allowed border border-white/5' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30 hover:opacity-90 active:scale-[0.98]'}`}>
            {checkedIn ? 'CHECKED IN TODAY' : 'CLAIM DAILY +20 COINS'}
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-[#1C1C2E] p-2 rounded-[2rem] border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button onClick={() => setActiveTab('earn')}
            className={`py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'earn' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30' : 'text-white/40 hover:bg-[#161b22]'}`}>
            <span>⭐</span> EARN POINTS
          </button>
          <button onClick={() => setActiveTab('redeem')}
            className={`py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'redeem' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30' : 'text-white/40 hover:bg-[#161b22]'}`}>
            <span>🎁</span> REDEEM SHOP
          </button>
        </div>

        {/* Content */}
        <div className="bg-[#1C1C2E] rounded-[2.5rem] p-6 border border-white/5 shadow-md">
          {activeTab === 'earn' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black text-white/50 uppercase tracking-widest">Available Tasks</h4>
                <span className="text-[10px] text-white/30">Refreshes Daily</span>
              </div>
              <div className="space-y-5">
                {earnTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${task.color} shadow-sm group-hover:scale-110 transition-transform`}>
                        {task.icon}
                      </div>
                      <div>
                        <h5 className="font-bold text-white text-sm leading-tight">{task.label}</h5>
                        <p className="text-[10px] text-white/50 mt-0.5">{task.desc}</p>
                      </div>
                    </div>
                    <div className="bg-[#161b22] px-3 py-1 rounded-full border border-white/5">
                      <span className="text-xs font-black text-purple-400">+{task.pts}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black text-white/50 uppercase tracking-widest">Redeem Rewards</h4>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-white/40">Balance:</span>
                  <span className="text-[10px] font-black text-amber-500">💰 {user.points}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {redeemItems.map((item) => {
                  const isOwned = claimedRewards.includes(item.id);
                  const canAfford = user.points >= item.cost;
                  return (
                    <div key={item.id} className={`p-4 rounded-3xl border transition-all flex items-center justify-between ${isOwned ? 'bg-[#161b22] border-white/5 opacity-60' : 'bg-[#1C1C2E] border-white/5 hover:border-purple-500/30'}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-2xl">
                          {item.icon}
                        </div>
                        <div>
                          <h5 className="font-bold text-white text-sm">{item.label}</h5>
                          <p className="text-[10px] text-white/50">{item.desc}</p>
                        </div>
                      </div>
                      <button onClick={() => handleRedeem(item.id, item.cost)} disabled={isOwned || !canAfford}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                          isOwned ? 'bg-emerald-500/10 text-emerald-400 cursor-default' : canAfford ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30 hover:opacity-90 active:scale-95' : 'bg-[#161b22] text-white/30 cursor-not-allowed border border-white/5'}`}>
                        {isOwned ? 'OWNED' : `REDEEM ${item.cost}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Level Progress */}
        <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-[2.5rem] p-6 text-white shadow-xl mb-6 overflow-hidden relative border border-purple-500/10">
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Level Progress</p>
                <h4 className="text-xl font-black">Level {user.level} <span className="text-sm opacity-50 ml-1">→ Level {(user.level || 1) + 1}</span></h4>
              </div>
              <p className="text-xs font-bold">{user.points}/5000 XP</p>
            </div>
            <div className="h-2.5 bg-black/20 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 transition-all duration-1000" style={{ width: `${Math.min((user.points / 5000) * 100, 100)}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rewards;

