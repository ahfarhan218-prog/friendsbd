import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { DAILY_MISSIONS, checkMissionCompletion } from '../utils/missions';

const DailyMissions: React.FC = () => {
  const { user } = useOutletContext<{ user: User }>();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User>(user);
  
  const today = new Date().toISOString().split('T')[0];
  const { dailyMissions } = currentUser || {};
  const isCorrectDate = dailyMissions?.date === today;
  const completedList = isCorrectDate ? (dailyMissions?.completed || []) : [];

  useEffect(() => {
    setCurrentUser(user);
    // Auto-complete daily login if not done today
    if (user && user.id !== 'me') {
      checkMissionCompletion(user, 'daily_login').then((updatedUser) => {
        if (updatedUser) {
          setCurrentUser(updatedUser);
          
          // Also update localStorage so the UI updates globally across routes without a full DB listener 
          // (in a real app, a user context provider would listen to firestore updates directly)
          const session = localStorage.getItem('user_session');
          if (session) {
             const parsed = JSON.parse(session);
             if (parsed.id === updatedUser.id) {
               localStorage.setItem('user_session', JSON.stringify(updatedUser));
               // Optionally update friends_bd_users list if we were relying on it locally
             }
          }
        }
      });
    }
  }, [user]);

  const getRewardIcon = (type: string) => {
    if (type === 'points') return '⭐';
    if (type === 'goldenCoins') return '💰';
    return '🔘';
  };

  const getRewardColor = (type: string) => {
    if (type === 'points') return 'text-amber-500 bg-amber-50 border-amber-200';
    if (type === 'goldenCoins') return 'text-yellow-500 bg-yellow-50 border-yellow-200';
    return 'text-slate-500 bg-slate-100 border-slate-300';
  };

  const getRewardName = (type: string) => {
    if (type === 'points') return 'Points';
    if (type === 'goldenCoins') return 'Golden Coins';
    return 'Silver Points';
  };

  // Helper to guide users to the relevant section
  const handleNavigateToMission = (missionId: string) => {
     if (completedList.includes(missionId)) return;
     
     switch(missionId) {
        case 'visit_forum':
           navigate('/forum');
           break;
        case 'play_game':
           navigate('/coin-game'); // default to golden coin for now
           break;
     }
  };

  const totalCompleted = completedList.length;
  const totalMissions = DAILY_MISSIONS.length;
  const progressPercent = Math.round((totalCompleted / totalMissions) * 100);

  return (
    <div className="min-h-screen bg-transparent pb-20">
      {/* Header Panel */}
      <div className="bg-indigo-600 text-white pt-8 pb-10 px-6 rounded-b-[2rem] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="text-3xl">🎯</span>
            <h1 className="text-2xl font-black tracking-tight">Daily Missions</h1>
          </div>
          <p className="text-indigo-100 text-sm font-medium mb-6">Complete tasks to earn extra rewards!</p>

          {/* Progress Bar */}
          <div className="bg-indigo-800/40 rounded-xl p-4 backdrop-blur-sm border border-indigo-500/30">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2 text-indigo-100">
               <span>Your Progress</span>
               <span>{totalCompleted} / {totalMissions}</span>
            </div>
            <div className="w-full h-3 bg-indigo-900/50 rounded-full overflow-hidden">
               <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercent}%` }}
               ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Missions List */}
      <div className="px-5 mt-8 space-y-4">
        {DAILY_MISSIONS.map(mission => {
           const isCompleted = completedList.includes(mission.id);
           const rewardStyle = getRewardColor(mission.rewardType);

           return (
             <div 
               key={mission.id} 
               onClick={() => handleNavigateToMission(mission.id)}
               className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-all cursor-pointer ${
                 isCompleted ? 'border-emerald-200 opacity-60 grayscale-[0.5]' : 'border-slate-100 hover:border-indigo-200 hover:shadow-md'
               }`}
             >
               <div className="flex justify-between items-start">
                 <div className="flex-1 pr-4">
                   <h3 className={`font-bold ${isCompleted ? 'text-emerald-700 decoration-2' : 'text-slate-800'}`}>
                     {mission.title}
                     {isCompleted && <span className="ml-2 text-emerald-500 text-sm">✓</span>}
                   </h3>
                   <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                     {mission.description}
                   </p>
                   
                   {/* Visual Progress Bar */}
                   <div className="mt-3">
                     <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-400 tracking-wider mb-1.5 uppercase">
                       <span>Status</span>
                       <span>{isCompleted ? '1' : '0'} / 1</span>
                     </div>
                     <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                       <div 
                         className={`h-full rounded-full transition-all duration-1000 ${
                           isCompleted ? 'bg-emerald-400 w-full' : 'bg-indigo-300 w-0'
                         }`}
                       ></div>
                     </div>
                   </div>
                 </div>
                 
                 <div className="ml-4 flex flex-col items-end">
                   <div className={`flex flex-wrap items-center gap-1.5 px-2.5 py-1 rounded-lg border ${rewardStyle}`}>
                     <span className="text-sm">{getRewardIcon(mission.rewardType)}</span>
                     <span className="font-bold text-sm">+{mission.rewardAmount}</span>
                   </div>
                   {!isCompleted && mission.id !== 'daily_login' && (
                      <button className="mt-3 text-xs sm:text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full uppercase tracking-wider hover:bg-indigo-100 transition-colors">
                        Go
                      </button>
                   )}
                 </div>
               </div>
             </div>
           );
        })}
      </div>
    </div>
  );
};

export default DailyMissions;

