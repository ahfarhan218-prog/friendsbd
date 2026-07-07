import React from 'react';
import { User, Conversation, AppRoute } from './types';

export const COLORS = {
  primary: '#7F00FF',
  secondary: '#ec4899',
  accent: '#facc15',
  success: '#22c55e',
  danger: '#ef4444',
  bg: '#f8fafc',
};

// Seed initial system admin user if not already initialized
export const initializeAuthDB = () => {
  const usersKey = 'friends_bd_users';
  const existing = localStorage.getItem(usersKey);
  const adminAccount: User = {
    id: 'admin_user',
    name: 'System Admin',
    username: 'admin',
    avatar: 'https://picsum.photos/seed/admin/200',
    level: 15,
    points: 1250,
    silverPoints: 450,
    goldenCoins: 25,
    plusses: 85,
    ap: 1420,
    totalAp: 1420,
    lastApReset: Date.now(),
    isOnline: true,
    isPremium: true,
    isVerified: true,
    role: 'admin',
    email: 'admin@friendsbd.com',
    password: 'admin123' // Password for login: admin123
  } as any;

  if (!existing) {
    const initialUsers = [adminAccount];
    localStorage.setItem(usersKey, JSON.stringify(initialUsers));
  } else {
    try {
      const parsed = JSON.parse(existing);
      const admin = parsed.find((u: any) => u.id === 'admin_user');
      if (admin && admin.password === 'admin') {
        admin.password = 'admin123';
        localStorage.setItem(usersKey, JSON.stringify(parsed));
      }
    } catch (e) {
      localStorage.setItem(usersKey, JSON.stringify([adminAccount]));
    }
  }
};

// Call initialization immediately
initializeAuthDB();

// Fetch live users list (excluding current) helper to update references
export const syncContextWithSession = () => {
  try {
    const session = localStorage.getItem('user_session');
    if (session) {
      const parsedSession: User = JSON.parse(session);
      // Synchronize key properties of MOCK_USER reference
      Object.assign(MOCK_USER, parsedSession);
      
      const allUsers: any[] = JSON.parse(localStorage.getItem('friends_bd_users') || '[]');
      const others = allUsers.filter(u => u.id !== parsedSession.id);
      
      // Update MOCK_FRIENDS in-place to reflect other real registered users
      MOCK_FRIENDS.length = 0;
      others.forEach(o => {
        MOCK_FRIENDS.push({
          id: o.id,
          name: o.name,
          username: o.username || o.name.toLowerCase().replace(/\s/g, '_'),
          avatar: o.avatar || `https://picsum.photos/seed/${o.id}/200`,
          level: o.level || 1,
          points: o.points || 100,
          silverPoints: o.silverPoints || 30,
          goldenCoins: o.goldenCoins || 5,
          plusses: o.plusses || 0,
          isOnline: (o.id === 'bot_chatgirl' || o.username === 'chatgirl' || o.userId === 1) ? true : (o.isOnline !== undefined ? o.isOnline : false),
          isVerified: o.isVerified !== undefined ? o.isVerified : false,
          role: o.role || 'user',
          mutualFriends: 0
        });
      });
    }
  } catch (e) {
    console.error('Core sync failed:', e);
  }
};

export const MOCK_USER: User = {
  id: 'me',
  name: 'Mehedi Hasan',
  username: 'mehedi_hasan',
  avatar: 'https://picsum.photos/seed/mehedi/200',
  level: 15,
  points: 1250,
  silverPoints: 450,
  goldenCoins: 25,
  plusses: 85,
  isOnline: true,
  isPremium: true,
  isVerified: true,
  role: 'admin'
};

export const MOCK_FRIENDS: User[] = [];

export const APP_DRAWER_DATA = [
  {
    id: 'games_contests',
    name: 'Games & Tournaments',
    desc: 'Participate in tournaments, play coin games, or test your luck in the lottery.',
    icon: '🎮',
    columns: 4,
    apps: [
      { id: AppRoute.TOURNAMENT, name: 'Cricket Tournament', icon: '🏏', color: 'bg--500/10 text--400 border--500/20' },
      { id: AppRoute.COIN_GAME, name: 'Golden Coin', icon: '💰', color: 'bg--500/10 text--400 border--500/20' },
      { id: AppRoute.SILVER_GAME, name: 'Silver Rush', icon: '🔘', color: 'bg--500/10 text--400 border--500/20' },
      { id: AppRoute.LOTTO, name: 'Lotto', icon: '✨', color: 'bg--500/10 text--400 border--500/20' },
      { id: AppRoute.CASTLE, name: 'Castle', icon: '🏰', color: 'bg--500/10 text--400 border--500/20' },
      { id: 'genie-cave', name: 'Genie Cave', icon: '🧞‍♂️', color: 'bg--500/10 text--400 border--500/20' },
      { id: 'farm', name: 'Farm', icon: '🚜', color: 'bg--500/10 text--400 border--500/20' },
      { id: 'ludo', name: 'Ludo', icon: '🎲', color: 'bg--500/10 text--400 border--500/20' },
      { id: AppRoute.CRICKET, name: 'Cricket', icon: '🏏', color: 'bg--500/10 text--400 border--500/20' },
      { id: 'football', name: 'Football', icon: '⚽', color: 'bg--500/10 text--400 border--500/20' },
      { id: 'colorball', name: 'Color Ball', icon: '🎨', color: 'bg-gradient-to-tr from-amber-400/20 to-rose-500/20 text-rose-700 border-rose-200' },
      { id: AppRoute.MONSTER_CATCHER, name: 'Monster Catcher', icon: '🐲', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
      { id: 'cricket-system-testing', name: 'Cricket System Testing', icon: '🏏', color: 'bg--500/10 text--400 border--500/20' },
      { id: 'cricket-2', name: 'Cricket 2', icon: '📝', color: 'bg--500/10 text--400 border--500/20' },
    ]
  },
  {
    id: 'explore',
    name: 'Explore',
    desc: 'Discover marketplace, blogs, events and more.',
    icon: '🧭',
    columns: 4,
    apps: [
      { id: 'marketplace', name: 'Marketplace', icon: '🏪', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
      { id: 'inventory',   name: 'Inventory',   icon: '🎒', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
      { id: 'blog',        name: 'Blog',        icon: '📝', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
      { id: 'clan',        name: 'Clans',       icon: '⚔️', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
      { id: 'calendar',    name: 'Events',      icon: '📅', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
      { id: 'groups',      name: 'Groups',      icon: '👥', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
      { id: 'gallery',     name: 'Gallery',     icon: '🖼️', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
      { id: 'stories',     name: 'Stories',     icon: '📸', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
      { id: 'live-tv',     name: 'Live TV',     icon: '📺', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    ]
  },
  {
    id: 'social_community',
    name: 'Social & Community',
    desc: 'Connect with community members, chat in rooms, or check forum topics.',
    icon: '💬',
    columns: 5,
    apps: [
      { id: AppRoute.MY_PROFILE, name: 'My Profile', icon: '👤', color: 'bg--500/10 text--400 border--500/20' },
      { id: 'inbox', name: 'Inbox', icon: '📩', color: 'bg--500/10 text--400 border--500/20', badge: '0/2' },
      { id: AppRoute.CONFERENCE, name: 'Conference', icon: '📹', color: 'bg--500/10 text--400 border--500/20', badge: '145' },
      { id: AppRoute.NOTIFICATIONS, name: 'Notification', icon: '🔔', color: 'bg--500/10 text--400 border--500/20', badge: '4' },
      { id: AppRoute.FRIENDS, name: 'Friends', icon: '👥', color: 'bg--500/10 text--400 border--500/20', badge: '4/17' },
      { id: 'requests', name: 'Requests', icon: '👥', color: 'bg--500/10 text--400 border--500/20' },
      { id: AppRoute.FORUM_HOME, name: 'Forums', icon: '💬', color: 'bg--500/10 text--400 border--500/20', badge: '2K' },
      { id: 'timeline', name: 'Timeline', icon: '🕒', color: 'bg--500/10 text--400 border--500/20' },
      { id: AppRoute.SHOUTS, name: 'Shouts', icon: '📣', color: 'bg--500/10 text--400 border--500/20' }
    ]
  },
  {
    id: 'ranks_rewards',
    name: 'Ranks & Rewards',
    desc: 'Track your XP leaderboard progress, complete missions, or redeem achievements.',
    icon: '🏆',
    columns: 5,
    apps: [
      { id: AppRoute.RANKS, name: 'Leaderboard', icon: '🏆', color: 'bg--500/10 text--400 border--500/20' },
      { id: AppRoute.AP_LEADERBOARD, name: 'AP Board', icon: '🔮', color: 'bg--500/10 text--400 border--500/20' },
      { id: AppRoute.REWARDS, name: 'Rewards', icon: '🎗️', color: 'bg--500/10 text--400 border--500/20' },
      { id: AppRoute.MISSIONS, name: 'Missions', icon: '🎯', color: 'bg--500/10 text--400 border--500/20' },
      { id: AppRoute.QUIZ, name: 'Quiz Area', icon: '🧠', color: 'bg--500/10 text--400 border--500/20', badge: '6' },
      { id: 'winners', name: 'Winners', icon: '🏆', color: 'bg--500/10 text--400 border--500/20', badge: '18' },
    ]
  },
  {
    id: 'store_marketplace',
    name: 'Store & Elite',
    desc: 'Purchase customized items, convert coins, or upgrade to FriendsBD Elite membership.',
    icon: '👑',
    columns: 5,
    apps: [
      { id: 'elite-upgrade', name: 'FriendsBD Elite', icon: '💎', color: 'bg--500/10 text--400 border--500/20' },
      { id: AppRoute.SHOP, name: 'Gift Shop', icon: '🎁', color: 'bg--500/10 text--400 border--500/20' },
      { id: 'popularity', name: 'Popularity', icon: '👜', color: 'bg--500/10 text--400 border--500/20' },
      { id: 'verified', name: 'Verified', icon: '✔️', color: 'bg--500/10 text--400 border--500/20' },
      { id: 'convert', name: 'Convert', icon: '⛓️', color: 'bg--500/10 text--400 border--500/20' },
      { id: 'subscribe', name: 'Subscribe', icon: '⚡', color: 'bg--500/10 text--400 border--500/20' },
      { id: 'top_member', name: 'Top Member', icon: '👤', color: 'bg--500/10 text--400 border--500/20' },
      { id: '3d_theme', name: '3D Theme', icon: '🎨', color: 'bg--500/10 text--400 border--500/20' },
      { id: 'win_gift', name: 'Win Gift', icon: '🏅', color: 'bg--500/10 text--400 border--500/20', badge: '2' },
    ]
  },
  {
    id: 'system_tools',
    name: 'Tools & Moderation',
    desc: 'Access staff dashboards, seek tech support, or manage BBCode formatting.',
    icon: '🛡️',
    columns: 4,
    apps: [
      { id: 'staff', name: 'Staff Panel', icon: '🛡️', color: 'bg--500/10 text--400 border--500/20', badge: '10' },
      { id: AppRoute.SUPPORT, name: 'Support', icon: '🎧', color: 'bg--500/10 text--400 border--500/20' },
      { id: AppRoute.REMINDERS, name: 'Reminders', icon: '⏰', color: 'bg--500/10 text--400 border--500/20' },
      { id: AppRoute.BB_DASHBOARD, name: 'BB Dashboard', icon: '📊', color: 'bg--500/10 text--400 border--500/20' },
      { id: AppRoute.BB_EDITOR, name: 'BB Editor', icon: '📝', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
      { id: AppRoute.BB_GUIDE, name: 'BB Guide', icon: '📚', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
      { id: 'stats', name: 'Statistics', icon: '📊', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    ]
  }
];
