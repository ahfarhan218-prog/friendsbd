import { User, DailyMission } from '../types';
import { mongoService } from '../services/mongoService';
import { triggerToast } from '../components/NotificationToast';

export const DAILY_MISSIONS: DailyMission[] = [
  { id: 'daily_login',   title: 'Daily Check-in',     description: 'Log in to the app today',                        rewardType: 'points',       rewardAmount: 50  },
  { id: 'visit_forum',   title: 'Community Citizen',   description: 'Visit the community forums and explore topics',  rewardType: 'silverPoints', rewardAmount: 10  },
  { id: 'play_game',     title: 'Gamer',               description: 'Play any game (Golden Coin, Silver Rush)',       rewardType: 'goldenCoins',  rewardAmount: 2   },
  { id: 'send_message',  title: 'Social Butterfly',    description: 'Send a message to a friend today',               rewardType: 'silverPoints', rewardAmount: 15  },
  { id: 'visit_profile', title: 'Profile Visitor',     description: 'Visit your own profile page',                    rewardType: 'points',       rewardAmount: 25  },
  { id: 'watch_live_tv', title: 'TV Watcher',          description: 'Open the Live TV section and watch any channel', rewardType: 'points',       rewardAmount: 30  },
];

export const checkMissionCompletion = async (user: User, missionId: string) => {
  if (!user || !user.id || user.id === 'me') return user; // Skip for mock user

  const today = new Date().toISOString().split('T')[0];
  let currentMissions = user.dailyMissions;

  // Reset if it's a new day
  if (!currentMissions || currentMissions.date !== today) {
    currentMissions = {
      date: today,
      completed: []
    };
  }

  if (currentMissions.completed.includes(missionId)) {
    return user; // Already completed today
  }

  const mission = DAILY_MISSIONS.find(m => m.id === missionId);
  if (!mission) return user;

  // Mark as completed
  const newCompleted = [...currentMissions.completed, missionId];
  const updatedMissions = { date: today, completed: newCompleted };

  // Calculate new rewards
  const updates: Partial<User> = {
    dailyMissions: updatedMissions
  };
  
  if (mission.rewardType === 'points') {
    updates.points = (user.points || 0) + mission.rewardAmount;
  } else if (mission.rewardType === 'goldenCoins') {
    updates.goldenCoins = (user.goldenCoins || 0) + mission.rewardAmount;
  } else if (mission.rewardType === 'silverPoints') {
    updates.silverPoints = (user.silverPoints || 0) + mission.rewardAmount;
  }

  // Save to backend
  try {
    await mongoService.updateUser(user.id, updates);
    
    // Show toast for reward
    triggerToast({
      id: `mission-${missionId}-${Date.now()}`,
      senderId: 'system',
      senderName: 'Mission Completed',
      senderAvatar: 'https://picsum.photos/seed/mission/200',
      type: 'REWARD',
      message: `You earned ${mission.rewardAmount} ${mission.rewardType.replace('Points', ' Points').replace('Coins', ' Coins')}!`,
      timestamp: Date.now(),
      isRead: false
    });

    // Return the updated user so local context/state can be synced if needed
    return { ...user, ...updates } as User;
  } catch (error) {
    console.error('Failed to update mission', error);
    return user;
  }
};
