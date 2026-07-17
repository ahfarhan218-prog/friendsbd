import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import { DAILY_MISSIONS, checkMissionCompletion } from '../utils/missions';

// ─── Extended mission data with extra metadata ────────────────────────────────
const MISSION_META: Record<string, { icon: string; color: string; gradient: string; category: string; difficulty: 'Easy' | 'Medium' | 'Hard'; xp: number; navigateTo?: string }> = {
  daily_login:   { icon: '☀️', color: 'from-amber-500 to-orange-500',    gradient: 'from-amber-500/20 to-orange-500/10',   category: 'Daily',   difficulty: 'Easy',   xp: 10 },
  visit_forum:   { icon: '💬', color: 'from-blue-500 to-indigo-600',     gradient: 'from-blue-500/20 to-indigo-500/10',    category: 'Social',  difficulty: 'Easy',   xp: 20, navigateTo: '/forum' },
  play_game:     { icon: '🎮', color: 'from-purple-500 to-pink-600',     gradient: 'from-purple-500/20 to-pink-500/10',    category: 'Gaming',  difficulty: 'Easy',   xp: 25, navigateTo: '/coin-game' },
  send_message:  { icon: '✉️', color: 'from-teal-500 to-cyan-600',       gradient: 'from-teal-500/20 to-cyan-500/10',      category: 'Social',  difficulty: 'Easy',   xp: 15, navigateTo: '/inbox' },
  visit_profile: { icon: '👤', color: 'from-rose-500 to-pink-600',       gradient: 'from-rose-500/20 to-pink-500/10',      category: 'Profile', difficulty: 'Easy',   xp: 10, navigateTo: '/profile' },
  watch_live_tv: { icon: '📺', color: 'from-indigo-500 to-violet-600',   gradient: 'from-indigo-500/20 to-violet-500/10',  category: 'Media',   difficulty: 'Easy',   xp: 20, navigateTo: '/live-tv' },
};

// ─── Weekly missions ──────────────────────────────────────────────────────────
const WEEKLY_MISSIONS = [
  { id: 'w_post_5',     title: 'Active Poster',      description: 'Post 5 times in the community forum',  icon: '📝', reward: 200, rewardType: 'points',       difficulty: 'Medium', progress: 2, target: 5,  gradient: 'from-cyan-500/20 to-blue-500/10',    color: 'from-cyan-400 to-blue-500' },
  { id: 'w_invite',     title: 'Social Butterfly',   description: 'Invite 3 friends to join FriendsBD',   icon: '👥', reward: 10,  rewardType: 'goldenCoins',  difficulty: 'Hard',   progress: 1, target: 3,  gradient: 'from-yellow-500/20 to-amber-500/10',  color: 'from-yellow-400 to-amber-500' },
  { id: 'w_quiz',       title: 'Quiz Champion',      description: 'Complete 3 quiz sessions this week',   icon: '🧠', reward: 50,  rewardType: 'silverPoints', difficulty: 'Medium', progress: 0, target: 3,  gradient: 'from-green-500/20 to-emerald-500/10', color: 'from-green-400 to-emerald-500' },
  { id: 'w_game_win',   title: 'Game Winner',        description: 'Win 2 coin games this week',           icon: '🏆', reward: 15,  rewardType: 'goldenCoins',  difficulty: 'Hard',   progress: 0, target: 2,  gradient: 'from-rose-500/20 to-pink-500/10',     color: 'from-rose-400 to-pink-500' },
  { id: 'w_profile',    title: 'Profile Polish',     description: 'Update your profile & add a bio',      icon: '✨', reward: 100, rewardType: 'points',       difficulty: 'Easy',   progress: 0, target: 1,  gradient: 'from-violet-500/20 to-purple-500/10', color: 'from-violet-400 to-purple-500' },
];

// ─── Achievement badges ───────────────────────────────────────────────────────
const BADGES = [
  { id: 'first_mission',  icon: '🎯', label: 'First Mission',   desc: 'Complete your 1st mission',    unlocked: true  },
  { id: 'streak_3',       icon: '🔥', label: '3-Day Streak',    desc: 'Log in 3 days in a row',        unlocked: true  },
  { id: 'streak_7',       icon: '⚡', label: 'Week Warrior',    desc: 'Log in 7 days in a row',        unlocked: false },
  { id: 'gamer',          icon: '🎮', label: 'True Gamer',      desc: 'Play 10 games total',           unlocked: false },
  { id: 'social',         icon: '💬', label: 'Social Star',     desc: 'Post 20 forum messages',        unlocked: false },
  { id: 'champion',       icon: '🏆', label: 'Champion',        desc: 'Complete all weekly missions',  unlocked: false },
];

const REWARD_ICONS: Record<string, string> = { points: '⭐', goldenCoins: '💰', silverPoints: '🔘' };
const REWARD_LABELS: Record<string, string> = { points: 'Points', goldenCoins: 'Golden Coins', silverPoints: 'Silver' };

const DailyMissions: React.FC = () => {
  const { user } = useOutletContext<{ user: User }>();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'badges'>('daily');
  const [streak] = useState(3);
  const [claimedAll, setClaimedAll] = useState(false);
  const [celebrateId, setCelebrateId] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const { dailyMissions } = currentUser || {};
  const isCorrectDate = dailyMissions?.date === today;
  const completedList = isCorrectDate ? (dailyMissions?.completed || []) : [];
  const totalCompleted = completedList.length;
  const totalMissions = DAILY_MISSIONS.length;
  const progressPercent = Math.round((totalCompleted / totalMissions) * 100);
  const allDone = totalCompleted >= totalMissions;

  useEffect(() => {
    setCurrentUser(user);
    if (user && user.id !== 'me') {
      checkMissionCompletion(user, 'daily_login').then((updatedUser) => {
        if (updatedUser) {
          setCurrentUser(updatedUser);
          const session = localStorage.getItem('user_session');
          if (session) {
            const parsed = JSON.parse(session);
            if (parsed.id === updatedUser.id)
              localStorage.setItem('user_session', JSON.stringify(updatedUser));
          }
        }
      });
    }
  }, [user]);

  const handleNavigate = (missionId: string) => {
    if (completedList.includes(missionId)) return;
    const meta = MISSION_META[missionId];
    if (meta?.navigateTo) navigate(meta.navigateTo);
  };

  const handleClaimAll = () => {
    setClaimedAll(true);
    setCelebrateId('all');
    setTimeout(() => setCelebrateId(null), 2000);
  };

  const tabs = [
    { id: 'daily',   label: 'Daily',   icon: '🎯', count: `${totalCompleted}/${totalMissions}` },
    { id: 'weekly',  label: 'Weekly',  icon: '📅', count: `${WEEKLY_MISSIONS.filter(m => m.progress >= m.target).length}/${WEEKLY_MISSIONS.length}` },
    { id: 'badges',  label: 'Badges',  icon: '🏅', count: `${BADGES.filter(b => b.unlocked).length}/${BADGES.length}` },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#080818] via-[#0d0d22] to-[#080818] pb-24 font-sans overflow-x-hidden">

      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden px-4 pt-6 pb-32">
        {/* Animated background orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-600/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-8 left-10 w-40 h-40 bg-purple-600/15 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute top-8 right-10 w-40 h-40 bg-blue-600/15 rounded-full blur-[60px] pointer-events-none" />

        <div className="relative z-10 max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all"
            >
              ←
            </button>
            <span className="text-white/40 text-sm font-bold uppercase tracking-widest">Missions</span>
          </div>

          <div className="mt-4 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-black text-white leading-tight">
                Daily <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Missions</span>
              </h1>
              <p className="text-white/50 text-sm mt-1">Complete tasks, earn rewards & climb ranks</p>
            </div>
            {/* Streak badge */}
            <div className="flex flex-col items-center bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/30 rounded-2xl px-4 py-2">
              <span className="text-2xl">🔥</span>
              <span className="text-orange-400 font-black text-lg leading-none">{streak}</span>
              <span className="text-orange-400/60 text-xs font-bold uppercase tracking-wider">Streak</span>
            </div>
          </div>

          {/* ── Stats Row ─────────────────────────────────────────────── */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Completed',  value: totalCompleted,                icon: '✅', color: 'text-emerald-400' },
              { label: 'Pending',    value: totalMissions - totalCompleted, icon: '⏳', color: 'text-amber-400'  },
              { label: 'XP Today',   value: completedList.reduce((acc, id) => acc + (MISSION_META[id]?.xp || 0), 0), icon: '⚡', color: 'text-indigo-400' },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 border border-white/8 rounded-2xl p-3 text-center backdrop-blur-sm"
              >
                <div className="text-xl mb-1">{s.icon}</div>
                <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-white/40 text-xs font-bold uppercase tracking-wider mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* ── Progress bar ──────────────────────────────────────────── */}
          <div className="mt-4 bg-white/5 border border-white/8 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-white/70 text-sm font-bold">Daily Progress</span>
              <span className="text-indigo-400 font-black text-sm">{progressPercent}%</span>
            </div>
            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative"
              >
                <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
              </motion.div>
            </div>
            {allDone && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-3 text-center"
              >
                <span className="text-emerald-400 font-black text-sm">🎉 All missions complete! Come back tomorrow.</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Card (overlaps header) ─────────────────────────────────── */}
      <div className="relative z-10 -mt-24 max-w-xl mx-auto px-4">
        <div className="bg-[#12122a]/90 border border-white/8 rounded-3xl backdrop-blur-xl shadow-2xl overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-white/8 p-2 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-white/5 text-white/30'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* ── DAILY tab ──────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {activeTab === 'daily' && (
              <motion.div
                key="daily"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="p-4 space-y-3"
              >
                {/* Claim all banner */}
                {allDone && !claimedAll && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-emerald-400 font-black text-sm">🎊 All Done!</div>
                      <div className="text-emerald-400/60 text-xs">Claim your bonus reward</div>
                    </div>
                    <button
                      onClick={handleClaimAll}
                      className="bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-500/30"
                    >
                      Claim 🎁
                    </button>
                  </motion.div>
                )}

                {DAILY_MISSIONS.map((mission, idx) => {
                  const isCompleted = completedList.includes(mission.id);
                  const meta = MISSION_META[mission.id] || { icon: '⭐', color: 'from-slate-500 to-slate-600', gradient: 'from-slate-500/10 to-slate-600/5', category: 'Daily', difficulty: 'Easy', xp: 10 };

                  return (
                    <motion.div
                      key={mission.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      onClick={() => handleNavigate(mission.id)}
                      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer group ${
                        isCompleted
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : `bg-gradient-to-br ${meta.gradient} border-white/8 hover:border-white/20 hover:scale-[1.01]`
                      }`}
                    >
                      {/* Completed overlay shimmer */}
                      {isCompleted && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/5 to-transparent animate-pulse pointer-events-none" />
                      )}

                      <div className="p-4 flex items-start gap-4">
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-2xl shadow-lg flex-shrink-0 ${isCompleted ? 'opacity-60' : ''}`}>
                          {isCompleted ? '✅' : meta.icon}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <h3 className={`font-black text-sm ${isCompleted ? 'text-emerald-400' : 'text-white'}`}>
                              {mission.title}
                            </h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              meta.difficulty === 'Easy'   ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                              meta.difficulty === 'Medium' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                                                             'text-rose-400 border-rose-500/30 bg-rose-500/10'
                            }`}>
                              {meta.difficulty}
                            </span>
                            <span className="text-[10px] font-bold text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                              {meta.category}
                            </span>
                          </div>
                          <p className="text-white/50 text-xs leading-relaxed">{mission.description}</p>

                          {/* Progress */}
                          <div className="mt-2.5 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: isCompleted ? '100%' : '0%' }}
                                transition={{ duration: 0.8, delay: idx * 0.1 + 0.3 }}
                                className={`h-full rounded-full ${isCompleted ? 'bg-emerald-400' : `bg-gradient-to-r ${meta.color}`}`}
                              />
                            </div>
                            <span className="text-white/30 text-[10px] font-bold">{isCompleted ? '1/1' : '0/1'}</span>
                          </div>

                          {/* XP */}
                          <div className="mt-1.5 flex items-center gap-1">
                            <span className="text-indigo-400 text-[10px] font-bold">+{meta.xp} XP</span>
                          </div>
                        </div>

                        {/* Reward */}
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-black ${
                            mission.rewardType === 'points'       ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                            mission.rewardType === 'goldenCoins'  ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                                                                    'bg-slate-500/10 border-slate-500/30 text-slate-400'
                          }`}>
                            <span>{REWARD_ICONS[mission.rewardType]}</span>
                            <span>+{mission.rewardAmount}</span>
                          </div>

                          {!isCompleted && meta.navigateTo && (
                            <button className="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1.5 rounded-xl hover:bg-indigo-500/20 transition-all">
                              Go →
                            </button>
                          )}

                          {isCompleted && (
                            <div className="text-emerald-400 text-xs font-black">Done ✓</div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* ── Bonus tip card ── */}
                <div className="mt-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <div className="text-indigo-300 font-black text-xs uppercase tracking-wider mb-1">Pro Tip</div>
                    <p className="text-white/50 text-xs leading-relaxed">
                      Complete all daily missions to maintain your streak and unlock exclusive badges. Missions reset every day at midnight!
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── WEEKLY tab ─────────────────────────────────────────────── */}
            {activeTab === 'weekly' && (
              <motion.div
                key="weekly"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="p-4 space-y-3"
              >
                {/* Weekly reset timer */}
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-3 flex items-center gap-3">
                  <span className="text-2xl">⏰</span>
                  <div>
                    <div className="text-purple-300 font-black text-xs uppercase tracking-wider">Resets In</div>
                    <div className="text-white font-black text-sm">
                      {(() => {
                        const now = new Date();
                        const nextMonday = new Date(now);
                        nextMonday.setDate(now.getDate() + ((7 - now.getDay() + 1) % 7 || 7));
                        nextMonday.setHours(0, 0, 0, 0);
                        const diff = nextMonday.getTime() - now.getTime();
                        const d = Math.floor(diff / 86400000);
                        const h = Math.floor((diff % 86400000) / 3600000);
                        return `${d}d ${h}h`;
                      })()}
                    </div>
                  </div>
                </div>

                {WEEKLY_MISSIONS.map((mission, idx) => {
                  const pct = Math.min(100, Math.round((mission.progress / mission.target) * 100));
                  const done = mission.progress >= mission.target;

                  return (
                    <motion.div
                      key={mission.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className={`relative overflow-hidden rounded-2xl border transition-all ${
                        done
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : `bg-gradient-to-br ${mission.gradient} border-white/8`
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${mission.color} flex items-center justify-center text-2xl shadow-lg flex-shrink-0 ${done ? 'opacity-60' : ''}`}>
                            {done ? '✅' : mission.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <h3 className={`font-black text-sm ${done ? 'text-emerald-400' : 'text-white'}`}>
                                {mission.title}
                              </h3>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                mission.difficulty === 'Easy'   ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                                mission.difficulty === 'Medium' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                                                                  'text-rose-400 border-rose-500/30 bg-rose-500/10'
                              }`}>
                                {mission.difficulty}
                              </span>
                            </div>
                            <p className="text-white/50 text-xs leading-relaxed">{mission.description}</p>

                            {/* Progress */}
                            <div className="mt-2.5">
                              <div className="flex justify-between text-[10px] font-bold text-white/30 mb-1">
                                <span>Progress</span>
                                <span>{mission.progress} / {mission.target}</span>
                              </div>
                              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 1, delay: idx * 0.1 }}
                                  className={`h-full rounded-full bg-gradient-to-r ${mission.color}`}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Reward */}
                          <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-black flex-shrink-0 ${
                            mission.rewardType === 'points'       ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                            mission.rewardType === 'goldenCoins'  ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                                                                    'bg-slate-500/10 border-slate-500/30 text-slate-400'
                          }`}>
                            <span>{REWARD_ICONS[mission.rewardType]}</span>
                            <span>+{mission.reward}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* ── BADGES tab ─────────────────────────────────────────────── */}
            {activeTab === 'badges' && (
              <motion.div
                key="badges"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="p-4"
              >
                <div className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span>🏅</span> Achievement Badges
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BADGES.map((badge, idx) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.07 }}
                      className={`relative rounded-2xl border p-4 text-center transition-all ${
                        badge.unlocked
                          ? 'bg-gradient-to-br from-indigo-500/15 to-purple-500/10 border-indigo-500/30'
                          : 'bg-white/3 border-white/5 opacity-50 grayscale'
                      }`}
                    >
                      {badge.unlocked && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      )}
                      <div className="text-3xl mb-2">{badge.icon}</div>
                      <div className={`font-black text-xs mb-1 ${badge.unlocked ? 'text-white' : 'text-white/30'}`}>
                        {badge.label}
                      </div>
                      <div className="text-white/30 text-[10px] leading-tight">{badge.desc}</div>
                      {badge.unlocked && (
                        <div className="mt-2 text-[10px] font-black text-emerald-400 bg-emerald-500/10 rounded-lg py-0.5">
                          ✓ Unlocked
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Badge progress */}
                <div className="mt-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/60 text-xs font-bold">Badge Collection</span>
                    <span className="text-indigo-400 font-black text-xs">{BADGES.filter(b => b.unlocked).length}/{BADGES.length}</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(BADGES.filter(b => b.unlocked).length / BADGES.length) * 100}%` }}
                      transition={{ duration: 1 }}
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Streak calendar ──────────────────────────────────────────────── */}
        <div className="mt-4 bg-[#12122a]/90 border border-white/8 rounded-3xl backdrop-blur-xl p-4">
          <div className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
            <span>📆</span> Login Streak — Last 7 Days
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (6 - i));
              const label = d.toLocaleDateString('en', { weekday: 'short' }).charAt(0);
              const active = i >= 7 - streak;
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={`w-full aspect-square rounded-xl flex items-center justify-center text-sm font-black transition-all ${
                    active
                      ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30'
                      : 'bg-white/5 text-white/20'
                  }`}>
                    {active ? '🔥' : '·'}
                  </div>
                  <span className="text-white/30 text-[10px] font-bold">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Daily reward chest ───────────────────────────────────────────── */}
        <div className="mt-4 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 border border-amber-500/20 rounded-3xl p-5 flex items-center gap-4">
          <div className="text-4xl">🎁</div>
          <div className="flex-1">
            <div className="text-amber-400 font-black text-sm">Daily Bonus Chest</div>
            <div className="text-white/40 text-xs mt-0.5">Complete all missions to unlock your bonus reward chest</div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-amber-400 font-black text-xs">{progressPercent}%</span>
            </div>
          </div>
          <button
            disabled={!allDone}
            className={`text-xs font-black px-4 py-2.5 rounded-2xl uppercase tracking-wider transition-all ${
              allDone
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-lg shadow-amber-500/30 hover:scale-105'
                : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
          >
            {allDone ? 'Open!' : 'Locked'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyMissions;
