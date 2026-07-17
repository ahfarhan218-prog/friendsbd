
export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  level: number;
  mutualFriends?: number;
  points: number;
  silverPoints: number;
  isOnline: boolean;
  isPremium?: boolean;
  isVerified?: boolean;
  isShadowBanned?: boolean;
  isBanned?: boolean;
  role?: 'admin' | 'moderator' | 'user';
  isBot?: boolean;
  fromCountry?: string;
  currentLocation?: string;
  lastActiveTime?: number;
  plusses: number;
  goldenCoins: number;
  colorBalls?: number;
  magicPoints?: number;
  ap?: number;
  totalAp?: number;
  lastApReset?: number; // Active Points
  balance_ap?: number;
  last_archive_created_at?: any;
  bio?: string;
  subscriptionStatus?: {
    type: string;
    expiry: number;
  };
  dailyMissions?: {
    date: string;
    completed: string[];
  };
  premiumExpiry?: number;
  goldenRevealUntil?: number;
  premiumPlan?: string;
  userId?: number;
  ghostMode?: boolean;
  hiddenVisit?: boolean;
  customStatus?: string;
  balance_taka?: number;
  reputation_points?: number;
  sessionToken?: string;     // unique token per login session (single-device enforcement)
  sessionExpiry?: number;    // epoch ms — session expires after 3 hours
  following?: string[];
  e2ePublicKey?: any;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  rewardType: 'points' | 'goldenCoins' | 'silverPoints';
  rewardAmount: number;
}

export interface UserReminder {
  id: string;
  title: string;
  description: string;
  dueTime: number;
  isNotified: boolean;
}

export interface LottoPackage {
  id: string;
  name: string;
  cost: number;
  durationDays: number;
  coinsType: 'gold' | 'silver';
}

export interface CastleState {
  attemptsLeft: number;
  lastPlayedDate: string;
}

export enum AppRoute {
  TOURNAMENT = 'tournament',
  RANKS = 'ranks',
  REWARDS = 'rewards',
  CONFERENCE = 'conference',
  NOTIFICATIONS = 'notifications',
  FRIENDS = 'friends',
  CRICKET = 'cricket',
  QUIZ = 'quiz',
  SHOP = 'shop',
  PREMIUM = 'premium',
  SUPPORT = 'support',
  SHOUTS = 'shouts',
  ADMIN = 'admin',
  BB_EDITOR = 'bb-editor',
  BB_DASHBOARD = 'bb-dashboard',
  BB_GUIDE = 'bb-guide',
  FORUM_HOME = 'forum',
  FORUM_CREATE = 'forum/create',
  COIN_GAME = 'coin-game',
  COIN_LEADERBOARD = 'coin-leaderboard',
  SILVER_GAME = 'silver-game',
  SILVER_LEADERBOARD = 'silver-leaderboard',
  LOTTO = 'lotto',
  CASTLE = 'castle',
  REMINDERS = 'reminders',
  MISSIONS = 'missions',
  AP_LEADERBOARD = 'ap-leaderboard',
  MY_PROFILE = 'profile/me',
  MONSTER_CATCHER = 'monster-catcher'
}

export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  subCategories: ForumSubCategory[];
  isHidden?: boolean;
  allowedRoles?: string[];
}

export interface ForumSubCategory {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  threadCount: number;
}

export interface ForumThread {
  id: string;
  categoryId: string;
  subCategoryId?: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  tags?: string[];
  isPinned: boolean;
  pinExpiry?: number;
  isLocked: boolean;
  views: number;
  replyCount: number;
  lastActivity: number;
  lastPostAuthor?: string;
  createdAt: number;
}

export interface ForumPost {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: number;
  updated_at?: number;
  is_deleted?: boolean;
  editedBy?: string;
  editedByAvatar?: string;
  editedAt?: number;
  isSystemPost?: boolean;
  systemAction?: string;
  reactions: Record<string, number>;
  userReactions: Record<string, string>;
  likedBy?: string[];
}

export interface BBCodePost {
  id: string;
  author: string;
  authorId: string;
  avatar: string;
  content: string;
  timestamp: number;
  type: 'shout' | 'forum' | 'announcement';
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isGroup: boolean;
  groupName?: string;
  icon?: string;
}

export interface RoomMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
  isPinned: boolean;
  reactions: Record<string, string>;
  seenBy: string[];
  isEdited?: boolean;
}

export interface ConferenceRoom {
  id: string;
  name: string;
  creatorId: string;
  creatorName: string;
  members: string[];
  invites: string[];
  createdAt: number;
  lastMessage?: string;
}

export interface ShoutReply {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: number;
}

export interface ShoutEntry {
  id: string;
  displayId: number; 
  user: string;
  username?: string;
  userId: string;
  avatar: string;
  content: string;
  time: string;
  timestamp: number;
  userReactions: Record<string, string>; 
  replies: ShoutReply[];
  isPremium: boolean;
  isPinned: boolean;
  isClosed: boolean; 
  pinExpiry?: number;
  isQuiz?: boolean;
}

export interface SiteNotification {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  type: 'MENTION' | 'LIKE' | 'REWARD' | 'FRIEND_REQ' | 'SYSTEM' | 'REACTION' | 'GAME_ALERT';
  message: string;
  timestamp: number;
  isRead: boolean;
  link?: string;
  shoutId?: string;
}

// Added GameLog and CoinStats interfaces to support gamification and statistics tracking
export interface GameLog {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  pointsWon: number;
  grabTime: number;
  timestamp: number;
}

export interface CoinStats {
  userId: string;
  username: string;
  avatar: string;
  totalGrabbed: number;
  totalValue: number;
  fastestGrab: number;
  lastWin: number;
}

export interface HighlightPhoto {
  id: string;
  url: string;
  caption: string;
  uploadedBy?: string;
  likes?: number;
  timestamp?: number;
}



// --- Automated Match System ---
export type MatchStatus = 'WAITING_LINEUPS' | 'TOSS' | 'IN_PROGRESS' | 'COMPLETED' | 'WALKOVER';

export interface MatchScore {
  runs: number;
  wickets: number;
  extras: number;
  oversBowled: number;
  ballsBowled: number;
}

export interface MatchLineup {
  captain: string;
  players: string[];
  backupBowler: string;
}

export interface CurrentOver {
  bowlerId: string | null;
  activeBatsmanId: string | null;
  ballsBowled: number;
  overStartTime: any | null; // Firestore Timestamp
  batsmanPost: string | null;
  bowlerPost: string | null;
  batsmanPostTime: any | null;
  bowlerPostTime: any | null;
}

export interface MatchState {
  id?: string;
  status: 'WAITING' | 'LIVE' | 'COMPLETED';
  topicId: string;
  innings: number;
  battingTeam: string;
  bowlingTeam: string;
  scores: Record<string, MatchScore>;
  lineups: Record<string, MatchLineup>;
  currentOver: CurrentOver;
  logs: { timestamp: any, message: string }[];
  createdAt?: number;
  updatedAt?: number;
}
