import { mongoService, API_BASE } from './mongoService';
import { User, SiteNotification } from '../types';

const apiFetch = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
};

export const notificationService = {
  /**
   * Helper to send a notification to a specific user.
   */
  sendNotification: async (
    targetUserId: string,
    type: 'MENTION' | 'LIKE' | 'REWARD' | 'FRIEND_REQ' | 'SYSTEM' | 'REACTION' | 'GAME_ALERT',
    sender: { id: string; name: string; avatar: string },
    message: string,
    link?: string
  ): Promise<void> => {
    if (!targetUserId || targetUserId === sender.id) return;

    const notif: SiteNotification = {
      id: `${type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      senderId: sender.id,
      senderName: sender.name,
      senderAvatar: sender.avatar,
      type,
      message,
      timestamp: Date.now(),
      isRead: false,
      link
    };

    await mongoService.addNotification(targetUserId, notif);
  },

  /**
   * Parses text content for @username tags, resolves usernames to user IDs via API,
   * and dispatches a MENTION notification to matching users.
   */
  handleMentions: async (
    content: string,
    author: { id: string; name: string; avatar: string },
    link: string,
    contextTitle: string
  ): Promise<void> => {
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const matches = [...content.matchAll(mentionRegex)];
    const usernames = Array.from(new Set(matches.map(m => m[1].toLowerCase())));

    if (usernames.length === 0) return;

    try {
      for (const username of usernames) {
        const users = await apiFetch<User[]>(`/users/by-username/${username}`);
        for (const user of users) {
          if (user && user.id && user.id !== author.id) {
            notificationService.sendNotification(
              user.id,
              'MENTION',
              author,
              `mentioned you in ${contextTitle}: "${content.substring(0, 35)}..."`,
              link
            );
          }
        }
      }
    } catch (err) {
      console.warn('Mention processing failed:', err);
    }
  }
};
