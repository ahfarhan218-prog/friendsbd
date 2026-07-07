import { API_BASE } from '../services/mongoService';
import { triggerToast } from '../components/NotificationToast';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: Record<string, Achievement> = {
  first_win: {
    id: 'first_win',
    title: 'First Win',
    description: 'You won your first game!',
    icon: '🏆'
  },
  forum_veteran: {
    id: 'forum_veteran',
    title: 'Forum Veteran',
    description: 'Created 5 forum topics.',
    icon: '💎'
  },
  rich_kid: {
    id: 'rich_kid',
    title: 'Rich Kid',
    description: 'Earned 10,000 points.',
    icon: '🤑'
  },
  quiz_master: {
    id: 'quiz_master',
    title: 'Quiz Master',
    description: 'Got a perfect score in a quiz.',
    icon: '🧠'
  },
  social_butterfly: {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Sent 10 friend requests.',
    icon: '🦋'
  },
  chatty: {
    id: 'chatty',
    title: 'Chatty',
    description: 'Sent 50 messages.',
    icon: '💬'
  },
  elite: {
    id: 'elite',
    title: 'Elite',
    description: 'Upgraded to Elite membership.',
    icon: '💎'
  }
};

export const unlockAchievement = async (achievementId: string) => {
  const session = localStorage.getItem('user_session');
  if (!session) return;
  const user = JSON.parse(session);
  if (!user.id) return;

  try {
    const res = await fetch(`${API_BASE}/achievements/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, achievementId })
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data.alreadyUnlocked) return;

    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return;

    triggerToast({
      id: 'ach-' + Date.now(),
      senderId: 'system',
      senderName: 'Achievement Unlocked!',
      senderAvatar: 'https://ui-avatars.com/api/?name=Ach+ieve&background=random',
      type: 'SYSTEM',
      message: `You unlocked: ${achievement.icon} ${achievement.title}`,
      timestamp: Date.now(),
      isRead: false
    } as any);

    // Add to AP log
    const apLog = JSON.parse(localStorage.getItem('ap_log') || '[]');
    apLog.unshift({ id: Date.now(), title: `Achievement: ${achievement.title}`, amount: 0, date: new Date().toISOString(), icon: achievement.icon });
    localStorage.setItem('ap_log', JSON.stringify(apLog));
  } catch (err) {
    console.error('Failed to unlock achievement:', err);
  }
};
