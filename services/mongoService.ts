/**
 * mongoService.ts
 * Replaces firebaseService.ts — all data is fetched from our Express/MongoDB backend.
 * Real-time listeners (onSnapshot) are replaced with polling via setInterval.
 */

import { User, ShoutEntry, HighlightPhoto } from '../types';

// ── Configuration ──────────────────────────────────────────────────────────────
// Priority order for API base URL:
//   1. window.__API_BASE__  — runtime override injected into index.html (best for production)
//   2. VITE_API_BASE        — baked in at Vite build time (set in Vercel env vars)
//   3. http://localhost:5000/api — local dev fallback
//
// To set the production URL without rebuilding, add this to your index.html <head>:
//   <script>window.__API_BASE__ = "https://your-app.up.railway.app/api";</script>
//
// Or set VITE_API_BASE in Vercel / Netlify / your CI environment variables.
const rawBase: string =
  (window as any).__API_BASE__ ||
  import.meta.env.VITE_API_BASE ||
  'http://localhost:5000/api';

const isLocalhostBase = rawBase.includes('localhost') || rawBase.includes('127.0.0.1');
const isOnLAN = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  && /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(window.location.hostname);

// Only swap localhost→LAN IP for local-network access (e.g. phone on same WiFi).
// Never replace localhost with a cloud hostname (Vercel, Railway, etc.).
export const API_BASE: string = (isLocalhostBase && isOnLAN)
  ? rawBase.replace(/localhost|127\.0\.0\.1/, window.location.hostname)
  : rawBase;

// ── HTTP Helpers ──────────────────────────────────────────────────────────────

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: getAuthHeaders(),
      ...options
    });
  } catch (err: any) {
    // Network-level failure (server unreachable, CORS preflight blocked, DNS error, etc.)
    throw new Error(`Network error on ${path}: ${err?.message || 'Failed to fetch'}`);
  }
  if (res.status === 401) {
    // Token expired — clear session and redirect to login
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_session');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API Error [${res.status}] ${path}: ${errText}`);
  }
  return res.json() as Promise<T>;
}

const get = <T>(path: string) => apiFetch<T>(path, { method: 'GET' });
const post = <T>(path: string, body: any) => apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });
const patch = <T>(path: string, body: any) => apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
const del = <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' });
const put = <T>(path: string, body: any) => apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) });

// ── Polling Helper ────────────────────────────────────────────────────────────
// Returns an "unsubscribe" function similar to Firebase's onSnapshot

function createPoller<T>(
  fetchFn: () => Promise<T>,
  callback: (data: T) => void,
  intervalMs: number
): () => void {
  let active = true;

  const run = async () => {
    if (!active) return;
    try {
      const data = await fetchFn();
      if (active) callback(data);
    } catch (err) {
      // non-fatal — just retry next interval
    }
    if (active) {
      setTimeout(run, intervalMs);
    }
  };

  run(); // immediate first call
  return () => { active = false; };
}

// ── Seed / Init ───────────────────────────────────────────────────────────────

export async function seedIfEmpty(): Promise<void> {
  // Seeding is handled server-side on startup
  console.log('MongoDB backend connected — seeding handled by server.');
}

// ── User ID Counter ───────────────────────────────────────────────────────────

async function getNextUserId(): Promise<number> {
  const data = await get<{ nextId: number }>('/users/meta/next-user-id');
  return data.nextId;
}

// ── Main Service Object ────────────────────────────────────────────────────────

export const mongoService = {
  // ── Sync Listeners (polling-based) ───────────────────────────────────────

  listenUsers: (callback: (users: User[]) => void): (() => void) => {
    const now = Date.now();
    return createPoller(
      () => get<User[]>('/users'),
      (users) => {
        const processed = users.map((u: User) => {
          if (u.id === 'bot_chatgirl' || u.username === 'chatgirl' || u.userId === 1) {
            return { ...u, isOnline: true, lastActiveTime: now - 1000 };
          }
          if (u.isOnline && u.lastActiveTime) {
            if (now - u.lastActiveTime > 30 * 60 * 1000) {
              return { ...u, isOnline: false };
            }
          }
          return u;
        });
        callback(processed);
      },
      5000
    );
  },

  listenUser: (userId: string, callback: (user: User | null) => void): (() => void) => {
    return createPoller(
      () => get<User>(`/users/${userId}`).catch(() => null as any),
      (user) => {
        if (user && (user.id === 'bot_chatgirl' || user.username === 'chatgirl' || user.userId === 1)) {
          callback({ ...user, isOnline: true });
        } else {
          callback(user);
        }
      },
      5000
    );
  },

  getUser: async (userId: string): Promise<User | null> => {
    try {
      return await get<User>(`/users/${userId}`);
    } catch {
      return null;
    }
  },

  listenShouts: (callback: (shouts: ShoutEntry[]) => void): (() => void) => {
    return createPoller(
      () => get<ShoutEntry[]>('/shouts'),
      callback,
      3000
    );
  },

  listenPhotos: (callback: (photos: HighlightPhoto[]) => void): (() => void) => {
    return createPoller(
      () => get<HighlightPhoto[]>('/photos'),
      callback,
      10000
    );
  },

  listenActivities: (callback: (activities: any[]) => void): (() => void) => {
    return createPoller(
      () => get<any[]>('/activities'),
      callback,
      5000
    );
  },

  getUserActivities: async (username: string): Promise<any[]> => {
    try {
      return await get<any[]>(`/activities/user/${encodeURIComponent(username)}`);
    } catch {
      return [];
    }
  },


  // ── Write Actions ─────────────────────────────────────────────────────────

  addUser: async (u: User): Promise<void> => {
    await post('/users', u);
  },

  getNextUserId,

  updateUser: async (userId: string, data: Partial<User>): Promise<void> => {
    if (Object.keys(data).length === 0) return;
    try {
      await patch(`/users/${userId}`, data);
    } catch (err: any) {
      // Swallow network errors (server unreachable, CORS, etc.) so fire-and-forget
      // callers (presence, heartbeat, etc.) never surface as uncaught promise rejections
      console.warn(`[updateUser] Failed to update user ${userId}:`, err?.message || err);
    }
  },

  deleteUser: async (userId: string): Promise<void> => {
    await del(`/users/${userId}`);
  },

  incrementUserOnlineTime: async (userId: string, seconds: number, dateStr: string): Promise<void> => {
    try {
      await patch(`/users/${userId}/online-time`, { seconds, dateStr });
    } catch (err) {
      console.warn('Failed to increment user online time:', err);
    }
  },

  addShout: async (s: ShoutEntry): Promise<void> => {
    await post('/shouts', s);
  },

  deleteShout: async (shoutId: string): Promise<void> => {
    await del(`/shouts/${shoutId}`);
  },

  addAdminLog: async (log: any): Promise<void> => {
    await post('/admin-logs', log);
  },

  addPhoto: async (ph: HighlightPhoto): Promise<void> => {
    await post('/photos', ph);
  },

  addActivity: async (act: any): Promise<void> => {
    await post('/activities', act);
  },

  // ── Notifications ─────────────────────────────────────────────────────────

  listenUserNotifications: (userId: string, callback: (notifs: any[]) => void): (() => void) => {
    return createPoller(
      () => get<any[]>(`/notifications/${userId}`),
      callback,
      5000
    );
  },

  addNotification: async (userId: string, notif: any): Promise<void> => {
    try {
      await post(`/notifications/${userId}`, notif);
    } catch (err) {
      console.warn('addNotification error:', err);
    }
  },

  markNotificationRead: async (userId: string, notifId: string): Promise<void> => {
    try {
      await patch(`/notifications/${userId}/${notifId}/read`, {});
    } catch (err) {
      console.warn('markNotificationRead error:', err);
    }
  },

  markAllNotificationsRead: async (userId: string, notifIds: string[]): Promise<void> => {
    try {
      await patch(`/notifications/${userId}/read-all`, { notifIds });
    } catch (err) {
      console.warn('markAllRead error:', err);
    }
  },

  deleteNotification: async (userId: string, notifId: string): Promise<void> => {
    try {
      await del(`/notifications/${userId}/${notifId}`);
    } catch (err) {
      console.warn('deleteNotification error:', err);
    }
  },

  deleteAllNotifications: async (userId: string): Promise<void> => {
    try {
      await del(`/notifications/${userId}/all`);
    } catch (err) {
      console.warn('deleteAllNotifications error:', err);
    }
  },

  // ── Messages ──────────────────────────────────────────────────────────────

  sendMessage: async (convId: string, message: any): Promise<void> => {
    try {
      await post(`/messages/conv/${convId}/messages`, message);
    } catch (err) {
      console.warn('sendMessage error:', err);
    }
  },

  listenMessages: (convId: string, callback: (msgs: any[]) => void): (() => void) => {
    return createPoller(
      () => get<any[]>(`/messages/conv/${convId}/messages`),
      callback,
      2000
    );
  },

  markMessageRead: async (convId: string, msgId: string): Promise<void> => {
    try {
      await patch(`/messages/conv/${convId}/messages/${msgId}/read`, {});
    } catch (err) {
      console.warn('markMessageRead error:', err);
    }
  },

  saveConversation: async (convId: string, data: any): Promise<void> => {
    try {
      await post('/messages/conversations', { id: convId, ...data });
    } catch (err) {
      console.warn('saveConversation error:', err);
    }
  },

  listenConversations: (userId: string, callback: (convs: any[]) => void): (() => void) => {
    return createPoller(
      () => get<any[]>(`/messages/conversations/${userId}`),
      callback,
      5000
    );
  },

  sendMessageNotification: async (
    recipientId: string,
    senderId: string,
    senderName: string,
    senderAvatar: string,
    messageText: string,
    convId: string
  ): Promise<void> => {
    try {
      await post('/messages/message-notification', {
        recipientId, senderId, senderName, senderAvatar, messageText, convId
      });
    } catch (err) {
      console.warn('sendMessageNotification error:', err);
    }
  },

  listenUnreadMessageCount: (userId: string, callback: (count: number) => void): (() => void) => {
    return createPoller(
      () => get<{ count: number }>(`/messages/conversations/${userId}/unread-count`).then(d => d.count),
      callback,
      5000
    );
  },

  // --- Leaderboard ---
  getLeaderboard: (period: 'alltime' | 'daily' | 'weekly' = 'alltime') => get<{ period: string; users: any[] }>(`/leaderboard?period=${period}`),
  awardPoints: async (points: number): Promise<boolean> => {
    try {
      const session = JSON.parse(localStorage.getItem('user_session') || 'null');
      if (!session) return false;
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE}/users/${session.id}/award-points`, { method: 'POST', headers, body: JSON.stringify({ points }) });
      return res.ok;
    } catch { return false; }
  },

  // --- Statistics ---
  getStatsOverview: () => get<any>('/stats/overview'),
  getStatsList: (type: string, limit: number = 20, skip: number = 0) => get<any>(`/stats/list?type=${type}&limit=${limit}&skip=${skip}`),

  // --- Live TV ---
  getChannels: () => get<any>('/channels'),
  getChannelStream: (channelId: string) => get<{streamUrl: string}>(`/channels/${channelId}/stream`),
  toggleFavoriteChannel: (channelId: string) => post<any>(`/channels/${channelId}/favorite`, {}),
  adminUpdateUser: async (targetId: string, updates: any, reason: string, adminId: string, adminName: string): Promise<any> => {
    try {
      const res = await fetch(`${API_BASE}/users/${targetId}/admin-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, adminId, adminName, updates })
      });
      if (!res.ok) throw new Error('Failed to update user');
      return await res.json();
    } catch (err) {
      console.error(err);
      return null;
    }
  },

  forceLogoutUser: async (targetId: string, reason: string, adminId: string, adminName: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/users/${targetId}/force-logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, adminId, adminName })
      });
      return res.ok;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  getUserAuditLogs: async (targetId: string): Promise<any[]> => {
    try {
      const res = await fetch(`${API_BASE}/users/${targetId}/audit`);
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      return await res.json();
    } catch (err) {
      console.error(err);
      return [];
    }
  },

  sendSystemNotice: async (targetId: string, message: string): Promise<boolean> => {
    try {
      const payload = {
        id: `sys_${Date.now()}_${Math.floor(Math.random()*1000)}`,
        userId: targetId,
        senderId: 'system',
        senderName: 'System Admin',
        senderAvatar: 'https://picsum.photos/seed/admin/200',
        type: 'SYSTEM',
        message: message,
        timestamp: Date.now(),
        isRead: false
      };
      const res = await fetch(`${API_BASE}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.ok;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
};

// ── Backward-compatibility alias removed — use mongoService directly ─────────
