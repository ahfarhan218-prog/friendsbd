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

// ── Seed channels if empty ────────────────────────────
const STATIC_CHANNELS = [
  { channelId: 'bd_gtv',          name: 'GTV',                   category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/gtv.png' },
  { channelId: 'bd_channel9',     name: 'Channel 9',             category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/channel9.png' },
  { channelId: 'bd_atn_bangla',   name: 'ATN Bangla',            category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/atnbangla.png' },
  { channelId: 'bd_ntv',          name: 'NTV',                   category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/ntv.png' },
  { channelId: 'bd_rtv',          name: 'RTV',                   category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/rtv.png' },
  { channelId: 'bd_channel_i',    name: 'Channel i',             category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/channeli.png' },
  { channelId: 'bd_maasranga',    name: 'Maasranga TV',          category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/maasranga.png' },
  { channelId: 'bd_banglavision', name: 'Banglavision',          category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/banglavision.png' },
  { channelId: 'bd_ekushey',      name: 'Ekushey TV',            category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/ekushey.png' },
  { channelId: 'bd_desh_tv',      name: 'Desh TV',               category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/deshtv.png' },
  { channelId: 'bd_boishakhi',    name: 'Boishakhi TV',          category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/boishakhi.png' },
  { channelId: 'bd_somoy',        name: 'Somoy TV',              category: ['All','BD','News'],          logoUrl: 'https://img.iptv.design/logo/somoy.png' },
  { channelId: 'bd_independent',  name: 'Independent TV',        category: ['All','BD','News'],          logoUrl: 'https://img.iptv.design/logo/independent.png' },
  { channelId: 'bd_jamuna',       name: 'Jamuna TV',             category: ['All','BD','News'],          logoUrl: 'https://img.iptv.design/logo/jamuna.png' },
  { channelId: 'bd_dbc_news',     name: 'DBC News',              category: ['All','BD','News'],          logoUrl: 'https://img.iptv.design/logo/dbcnews.png' },
  { channelId: 'bd_atn_news',     name: 'ATN News',              category: ['All','BD','News'],          logoUrl: 'https://img.iptv.design/logo/atnnews.png' },
  { channelId: 'bd_channel24',    name: 'Channel 24',            category: ['All','BD','News'],          logoUrl: 'https://img.iptv.design/logo/channel24.png' },
  { channelId: 'sports_t_sports',     name: 'T Sports',               category: ['All','Sports'],            logoUrl: 'https://img.iptv.design/logo/tsports.png' },
  { channelId: 'sports_sony_ten1',    name: 'Sony Sports Ten 1',      category: ['All','Sports'],            logoUrl: 'https://img.iptv.design/logo/sonyten1.png' },
  { channelId: 'sports_sony_ten2',    name: 'Sony Sports Ten 2',      category: ['All','Sports'],            logoUrl: 'https://img.iptv.design/logo/sonyten2.png' },
  { channelId: 'sports_sony_ten3',    name: 'Sony Sports Ten 3',      category: ['All','Sports'],            logoUrl: 'https://img.iptv.design/logo/sonyten3.png' },
  { channelId: 'sports_sony_ten4',    name: 'Sony Sports Ten 4',      category: ['All','Sports'],            logoUrl: 'https://img.iptv.design/logo/sonyten4.png' },
  { channelId: 'sports_star_sports1', name: 'Star Sports 1',          category: ['All','Sports'],            logoUrl: 'https://img.iptv.design/logo/starsports1.png' },
  { channelId: 'sports_star_sports2', name: 'Star Sports 2',          category: ['All','Sports'],            logoUrl: 'https://img.iptv.design/logo/starsports2.png' },
  { channelId: 'sports_star_sports3', name: 'Star Sports 3',          category: ['All','Sports'],            logoUrl: 'https://img.iptv.design/logo/starsports3.png' },
  { channelId: 'sports_eurosport',    name: 'Eurosport',              category: ['All','Sports'],            logoUrl: 'https://img.iptv.design/logo/eurosport.png' },
  { channelId: 'sports_espn',         name: 'ESPN',                   category: ['All','Sports'],            logoUrl: 'https://img.iptv.design/logo/espn.png' },
  { channelId: 'in_star_plus',     name: 'Star Plus',            category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/starplus.png' },
  { channelId: 'in_colors',        name: 'Colors TV',            category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/colors.png' },
  { channelId: 'in_sony_tv',       name: 'Sony TV',              category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/sony.png' },
  { channelId: 'in_zee_tv',        name: 'Zee TV',              category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/zeetv.png' },
  { channelId: 'in_star_bharat',   name: 'Star Bharat',          category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/starbharat.png' },
  { channelId: 'in_andtv',         name: '&TV',                  category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/andtv.png' },
  { channelId: 'in_sab_tv',        name: 'SAB TV',              category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/sabtv.png' },
  { channelId: 'in_aaj_tak',       name: 'Aaj Tak',              category: ['All','Hindi','News'], logoUrl: 'https://img.iptv.design/logo/aajtak.png' },
  { channelId: 'in_abp_news',      name: 'ABP News',             category: ['All','Hindi','News'], logoUrl: 'https://img.iptv.design/logo/abpnews.png' },
  { channelId: 'in_india_tv',      name: 'India TV',             category: ['All','Hindi','News'], logoUrl: 'https://img.iptv.design/logo/indiatv.png' },
  { channelId: 'in_news18',        name: 'News18 India',         category: ['All','Hindi','News'], logoUrl: 'https://img.iptv.design/logo/news18.png' },
  { channelId: 'in_ndtv',          name: 'NDTV 24x7',            category: ['All','Hindi','News'], logoUrl: 'https://img.iptv.design/logo/ndtv.png' },
  { channelId: 'in_times_now',     name: 'Times Now',            category: ['All','Hindi','News'], logoUrl: 'https://img.iptv.design/logo/timesnow.png' },
  { channelId: 'in_republic',      name: 'Republic TV',          category: ['All','Hindi','News'], logoUrl: 'https://img.iptv.design/logo/republic.png' },
  { channelId: 'in_star_gold',     name: 'Star Gold',            category: ['All','Hindi','Movies'], logoUrl: 'https://img.iptv.design/logo/stargold.png' },
  { channelId: 'in_sony_max',      name: 'Sony Max',             category: ['All','Hindi','Movies'], logoUrl: 'https://img.iptv.design/logo/sonymax.png' },
  { channelId: 'in_zee_cinema',    name: 'Zee Cinema',           category: ['All','Hindi','Movies'], logoUrl: 'https://img.iptv.design/logo/zeecinema.png' },
  { channelId: 'in_pictures',      name: '& Pictures',           category: ['All','Hindi','Movies'], logoUrl: 'https://img.iptv.design/logo/andpictures.png' },
  { channelId: 'kids_nick',        name: 'Nickelodeon',          category: ['All','Kids'], logoUrl: 'https://img.iptv.design/logo/nick.png' },
  { channelId: 'kids_cn',          name: 'Cartoon Network',     category: ['All','Kids'], logoUrl: 'https://img.iptv.design/logo/cartoonnetwork.png' },
  { channelId: 'kids_pogo',        name: 'Pogo',                 category: ['All','Kids'], logoUrl: 'https://img.iptv.design/logo/pogo.png' },
  { channelId: 'kids_disney',      name: 'Disney Channel',       category: ['All','Kids'], logoUrl: 'https://img.iptv.design/logo/disney.png' },
  { channelId: 'music_mtv',        name: 'MTV',                  category: ['All','Music'], logoUrl: 'https://img.iptv.design/logo/mtv.png' },
  { channelId: 'music_vh1',        name: 'VH1',                  category: ['All','Music'], logoUrl: 'https://img.iptv.design/logo/vh1.png' },
  { channelId: 'music_9xm',        name: '9XM',                  category: ['All','Music'], logoUrl: 'https://img.iptv.design/logo/9xm.png' },
  { channelId: 'music_zoom',       name: 'Zoom TV',              category: ['All','Music'], logoUrl: 'https://img.iptv.design/logo/zoom.png' },

  // ── 🇧🇩 MORE BD ──
  { channelId: 'bd_asian_tv',     name: 'Asian TV',             category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/asian.png' },
  { channelId: 'bd_bijoy',        name: 'Bijoy TV',             category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/bijoy.png' },
  { channelId: 'bd_satv',         name: 'SA TV',                category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/satv.png' },
  { channelId: 'bd_my_tv',        name: 'My TV',                category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/mytv.png' },
  { channelId: 'bd_ananda',       name: 'Ananda TV',            category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/ananda.png' },
  { channelId: 'bd_bangla_tv',    name: 'Bangla TV',            category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/bangla.png' },
  { channelId: 'bd_mohona',       name: 'Mohona TV',            category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/mohona.png' },
  { channelId: 'bd_nagorik',      name: 'Nagorik TV',           category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/nagorik.png' },

  // ── 🏏 MORE SPORTS ──
  { channelId: 'sports_willow',       name: 'Willow TV',              category: ['All','Sports'], logoUrl: 'https://img.iptv.design/logo/willow.png' },
  { channelId: 'sports_sports18',     name: 'Sports18',               category: ['All','Sports'], logoUrl: 'https://img.iptv.design/logo/sports18.png' },
  { channelId: 'sports_dd_sports',    name: 'DD Sports',              category: ['All','Sports'], logoUrl: 'https://img.iptv.design/logo/ddsports.png' },
  { channelId: 'sports_supersport',   name: 'SuperSport',             category: ['All','Sports'], logoUrl: 'https://img.iptv.design/logo/supersport.png' },
  { channelId: 'sports_beinsports1',  name: 'beIN Sports 1',          category: ['All','Sports'], logoUrl: 'https://img.iptv.design/logo/beinsports1.png' },
  { channelId: 'sports_beinsports2',  name: 'beIN Sports 2',          category: ['All','Sports'], logoUrl: 'https://img.iptv.design/logo/beinsports2.png' },
  { channelId: 'sports_sky_sports',   name: 'Sky Sports',             category: ['All','Sports'], logoUrl: 'https://img.iptv.design/logo/skysports.png' },

  // ── 🇮🇳 MORE INDIAN ──
  { channelId: 'in_colors_infinity',  name: 'Colors Infinity',        category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/colorsinfinity.png' },
  { channelId: 'in_mtv_india',        name: 'MTV India',              category: ['All','Hindi','Entertainment','Music'], logoUrl: 'https://img.iptv.design/logo/mtvindia.png' },
  { channelId: 'in_comedy_central',   name: 'Comedy Central',         category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/comedycentral.png' },
  { channelId: 'in_sony_bbc_earth',   name: 'Sony BBC Earth',        category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/sonybbcearth.png' },
  { channelId: 'in_discovery',        name: 'Discovery',              category: ['All','Hindi','Nature'],      logoUrl: 'https://img.iptv.design/logo/discovery.png' },
  { channelId: 'in_nat_geo',          name: 'National Geographic',    category: ['All','Hindi','Nature'],      logoUrl: 'https://img.iptv.design/logo/natgeo.png' },
  { channelId: 'in_history_tv',       name: 'History TV18',           category: ['All','Hindi','Nature'],      logoUrl: 'https://img.iptv.design/logo/historytv.png' },
  { channelId: 'in_b4u_movies',       name: 'B4U Movies',             category: ['All','Hindi','Movies'],      logoUrl: 'https://img.iptv.design/logo/b4umovies.png' },
  { channelId: 'in_b4u_music',        name: 'B4U Music',              category: ['All','Hindi','Music'],       logoUrl: 'https://img.iptv.design/logo/b4umusic.png' },
  { channelId: 'in_shemaroo',         name: 'Shemaroo TV',            category: ['All','Hindi','Movies'],      logoUrl: 'https://img.iptv.design/logo/shemaroo.png' },

  // ── 🧒 MORE KIDS ──
  { channelId: 'kids_hungama',        name: 'Hungama',                category: ['All','Kids'], logoUrl: 'https://img.iptv.design/logo/hungama.png' },
  { channelId: 'kids_sonic',          name: 'Sonic',                  category: ['All','Kids'], logoUrl: 'https://img.iptv.design/logo/sonic.png' },
  { channelId: 'kids_discovery_kids', name: 'Discovery Kids',         category: ['All','Kids'], logoUrl: 'https://img.iptv.design/logo/discoverykids.png' },

  // ── 🌍 INTERNATIONAL ──
  { channelId: 'intl_bbc_world',      name: 'BBC World News',         category: ['All','News'],  logoUrl: 'https://img.iptv.design/logo/bbcworld.png' },
  { channelId: 'intl_cnn',            name: 'CNN International',      category: ['All','News'],  logoUrl: 'https://img.iptv.design/logo/cnn.png' },
  { channelId: 'intl_al_jazeera',     name: 'Al Jazeera',             category: ['All','News'],  logoUrl: 'https://img.iptv.design/logo/aljazeera.png' },
  { channelId: 'intl_france24',       name: 'France 24',              category: ['All','News'],  logoUrl: 'https://img.iptv.design/logo/france24.png' },
  { channelId: 'intl_dw',             name: 'DW News',                category: ['All','News'],  logoUrl: 'https://img.iptv.design/logo/dw.png' },
];
const FALLBACK_STREAM = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

const seedChannelsIfEmpty = async () => {
  try {
    const Channel = require('./models/Channel');
    const count = await Channel.countDocuments();
    if (count > 0) {
      console.log(`📺 ${count} channels already exist, skipping seed.`);
      return;
    }
    const docs = STATIC_CHANNELS.map(c => ({ ...c, streamUrl: FALLBACK_STREAM, isPremium: false, status: 'active' }));
    await Channel.insertMany(docs);
    console.log(`✅ Seeded ${docs.length} channels`);
  } catch (err) {
    console.warn('Channel seed error (non-fatal):', err.message);
  }
};

// Run seed after DB connects
setTimeout(seedIfEmpty, 2000);
setTimeout(seedChannelsIfEmpty, 5000);

// ── Start Server ────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 FriendsBD API running on http://localhost:${PORT}`);
});
