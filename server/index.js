require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./db');

const app = express();
const server = http.createServer(app);
const CORS_ORIGINS = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

const io = new Server(server, {
  cors: {
    origin: CORS_ORIGINS,
    methods: ['GET', 'POST']
  }
});
const path = require('path');

const setupSocket = require('./socketHandler');
const { emitToUser, emitToRoom, getOnlineUsers } = setupSocket(io);
global.__socketEmitter = { emitToUser, emitToRoom, getOnlineUsers };

// ── Middleware ──────────────────────────────────────
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100000,
  message: { error: 'Too many requests, please try again later.' }
});

app.use(cors({
  origin: CORS_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet({ 
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false 
}));
app.use('/api/', limiter);
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Connect to MongoDB ──────────────────────────────
connectDB();

// ── Routes ─────────────────────────────────────────
app.use('/api/auth',           require('./routes/auth'));
app.use('/api/users',          require('./routes/users'));
app.use('/api/shouts',         require('./routes/shouts'));
app.use('/api/photos',         require('./routes/photos'));
app.use('/api/activities',     require('./routes/activities'));
app.use('/api/notifications',  require('./routes/notifications'));
app.use('/api/messages',       require('./routes/messages'));
app.use('/api/forum',          require('./routes/forum'));
app.use('/api/games',          require('./routes/games'));
app.use('/api/matches',        require('./routes/matches'));
app.use('/api/ap',             require('./routes/ap'));
app.use('/api/system-matches', require('./routes/systemMatch'));
app.use('/api/upload',         require('./routes/upload'));
app.use('/api/conference',     require('./routes/conference'));
app.use('/api/quizzes',        require('./routes/quizzes'));
app.use('/api/lotto',          require('./routes/lotto'));
app.use('/api/reports',        require('./routes/reports'));
app.use('/api/marketplace',    require('./routes/marketplace'));
app.use('/api/inventory',      require('./routes/inventory'));
app.use('/api/blog',           require('./routes/blog'));
app.use('/api/clan',           require('./routes/clan'));
app.use('/api/events',         require('./routes/events'));
app.use('/api/groups',         require('./routes/groups'));
app.use('/api/albums',         require('./routes/albums'));
app.use('/api/stories',        require('./routes/stories'));
app.use('/api/reward-approvals', require('./routes/rewardApprovals'));
app.use('/api/admin-logs',       require('./routes/adminLogs'));
app.use('/api/elite',            require('./routes/elite'));
app.use('/api/reminders',        require('./routes/reminders'));
app.use('/api/challenges',       require('./routes/challenges'));
app.use('/api/achievements',     require('./routes/achievements'));
app.use('/api/search',           require('./routes/search'));
app.use('/api/reputation',       require('./routes/reputation'));
app.use('/api/announcements',    require('./routes/announcements'));
app.use('/api/monster',          require('./routes/monster'));
app.use('/api/stats',            require('./routes/stats'));
app.use('/api/proxy',            require('./routes/proxy'));
app.use('/api/channels',         require('./routes/channels'));

// ── Health Check ────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ── Seed initial data ───────────────────────────────
const seedIfEmpty = async () => {
  try {
    const User = require('./models/User');
    const Shout = require('./models/Shout');
    const Photo = require('./models/Photo');
    const Activity = require('./models/Activity');

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Seeding initial data...');
      const now = Date.now();

      const users = [
        { id: 'bot_chatgirl', userId: 1, name: 'Chatgirl', username: 'chatgirl', avatar: 'https://picsum.photos/seed/chatgirl/200', level: 99, points: 9999, silverPoints: 9999, goldenCoins: 999, plusses: 999, isOnline: true, isPremium: false, isVerified: true, role: 'user', isBot: true, fromCountry: 'India', currentLocation: 'Home Page', lastActiveTime: now - 1000, bio: 'Hello! I am Chatgirl, the official assistant bot of FriendsBD 🇧🇩', createdAt: now },
        { id: 'admin_user', userId: 10, name: 'System Admin', username: 'admin', avatar: 'https://picsum.photos/seed/admin/200', level: 15, points: 1250, silverPoints: 450, goldenCoins: 25, plusses: 85, isOnline: true, isPremium: true, isVerified: true, role: 'admin', createdAt: now },
        { id: 'user_shahriar', userId: 11, name: 'Shahriar Rahman', username: 'shahriar', avatar: 'https://picsum.photos/seed/shahriar/200', level: 13, points: 940, silverPoints: 310, goldenCoins: 12, plusses: 45, isOnline: true, isPremium: false, isVerified: true, role: 'admin', createdAt: now },
        { id: 'user_smsumonhossain', userId: 2, name: 'smsumonhossain', username: 'smsumonhossain', avatar: 'https://picsum.photos/seed/smsumon/200', level: 8, points: 650, silverPoints: 120, goldenCoins: 4, plusses: 15, isOnline: false, isPremium: true, isVerified: true, role: 'user', fromCountry: 'Bangladesh', createdAt: now },
        { id: 'user_taaj', userId: 4, name: 'Taaj', username: 'Taaj', avatar: 'https://picsum.photos/seed/taaj/200', level: 12, points: 1100, silverPoints: 240, goldenCoins: 9, plusses: 38, isOnline: false, isPremium: true, isVerified: true, role: 'user', fromCountry: 'Bangladesh', createdAt: now },
        { id: 'user_mahim', userId: 3, name: 'Mahim Ahmed', username: 'mahim_sis', avatar: 'https://picsum.photos/seed/mahim/200', level: 9, points: 720, silverPoints: 180, goldenCoins: 5, plusses: 23, isOnline: false, isPremium: true, isVerified: false, role: 'user', createdAt: now },
        { id: 'user_tanvir', userId: 5, name: 'Tanvir Hossain', username: 'tanvir', avatar: 'https://picsum.photos/seed/tanvir/200', level: 5, points: 410, silverPoints: 95, goldenCoins: 2, plusses: 10, isOnline: false, isPremium: false, isVerified: false, role: 'user', createdAt: now },
      ];

      for (const u of users) {
        await User.findOneAndUpdate({ id: u.id }, { $set: u }, { upsert: true });
      }

      const shouts = [
        { id: 'sh1', displayId: 101, user: 'System Admin', userId: 'admin_user', avatar: 'https://picsum.photos/seed/admin/200', content: 'Cricket match tournament registrations are closing soon! Register today 🏏', time: '1h ago', timestamp: now - 3600000, userReactions: {}, replies: [], isPremium: true, isPinned: true, isClosed: false },
        { id: 'sh2', displayId: 102, user: 'shahriar', userId: 'user_shahriar', avatar: 'https://picsum.photos/seed/shahriar/200', content: 'What a game! Completed the quiz tournament with full score! 🥇🏆', time: '3h ago', timestamp: now - 10800000, userReactions: {}, replies: [], isPremium: false, isPinned: false, isClosed: false },
        { id: 'sh3', displayId: 103, user: 'mahim_sis', userId: 'user_mahim', avatar: 'https://picsum.photos/seed/mahim/200', content: 'Just uploaded our meetup pictures in the forum. Check them out under General lounge.', time: '5h ago', timestamp: now - 18000000, userReactions: {}, replies: [], isPremium: true, isPinned: false, isClosed: false },
      ];
      for (const s of shouts) {
        await Shout.findOneAndUpdate({ id: s.id }, { $set: s }, { upsert: true });
      }

      const photos = [
        { id: 'p1', url: 'https://picsum.photos/seed/cricket1/600/400', caption: 'Lords Ground Champions Team Cup celebration! 🏆🏏', uploadedBy: 'shahriar', likes: 24, timestamp: now - 14400000 },
        { id: 'p2', url: 'https://picsum.photos/seed/tech/600/400', caption: 'Our setup workspace and custom community avatars display.', uploadedBy: 'mahim_sis', likes: 18, timestamp: now - 18000000 },
        { id: 'p3', url: 'https://picsum.photos/seed/sunset/600/400', caption: 'A beautiful afternoon in Dhaka after a friendly game 🌅', uploadedBy: 'system', likes: 12, timestamp: now - 25200000 },
        { id: 'p4', url: 'https://picsum.photos/seed/gaming/600/400', caption: 'Mystery Castle cleared on stage 10. Ultimate badge obtained!', uploadedBy: 'admin', likes: 35, timestamp: now - 32400000 },
      ];
      for (const ph of photos) {
        await Photo.findOneAndUpdate({ id: ph.id }, { $set: ph }, { upsert: true });
      }

      const activities = [
        { id: 'act1', time: '11:11 PM', username: 'shahriar', msg: 'Updated their profile information.', timestamp: now - 600000 },
        { id: 'act2', time: '04:41 PM', username: 'shahriar', isTopic: true, topicTitle: 'Community Update', msg: 'Created By shahriar', timestamp: now - 14400000 },
        { id: 'act3', time: '08:22 PM', username: 'mahim_sis', msg: 'Changed their profile picture.', timestamp: now - 43200000 },
      ];
      for (const act of activities) {
        await Activity.findOneAndUpdate({ id: act.id }, { $set: act }, { upsert: true });
      }

      console.log('✅ Seed complete!');
    }
  } catch (err) {
    console.warn('Seed error (non-fatal):', err.message);
  }
};

// Run seed after DB connects
setTimeout(seedIfEmpty, 2000);

// ── Start Server ────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 FriendsBD API running on http://localhost:${PORT}`);
});
