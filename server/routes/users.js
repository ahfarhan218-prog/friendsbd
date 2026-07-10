const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Activity = require('../models/Activity');
const AdminLog = require('../models/AdminLog');
const { Meta } = require('../models/ApTransaction');

const { authenticateToken, optionalAuth } = require('../middleware/auth');

const SENSITIVE_FIELDS = ['passwordHash', 'verificationToken', 'resetToken', 'resetTokenExpiry', 'sessionToken', 'sessionExpiry'];

function sanitizeUser(user, includeEmail = false) {
  if (!user) return user;
  const safe = { ...user };
  for (const field of SENSITIVE_FIELDS) {
    delete safe[field];
  }
  if (!includeEmail) {
    delete safe.email;
  }
  return safe;
}

// GET all users (public, no auth required)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}).lean();
    // Strip email from public listing
    res.json(users.map(u => sanitizeUser(u, false)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single user by id field
router.get('/:userId', optionalAuth, async (req, res) => {
  try {
    const user = await User.findOne({ 
      $or: [ { id: req.params.userId }, { username: req.params.userId } ] 
    }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Include email only if viewing own profile
    const showEmail = req.user && req.user.id === user.id;
    const safe = sanitizeUser(user, showEmail);
    if (req.user && req.user.id !== user.id) {
      delete safe.sessionToken;
      delete safe.sessionExpiry;
    }
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET user by username
router.get('/by-username/:username', async (req, res) => {
  try {
    const users = await User.find({ username: req.params.username }).lean();
    res.json(users.map(sanitizeUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create/upsert user (authenticated users only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const allowedFields = ['name', 'username', 'avatar', 'bio', 'gender', 'fromCountry', 'currentLocation', 'customStatus'];
    const safeData = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) safeData[key] = req.body[key];
    }
    safeData.id = req.body.id;
    if (!safeData.id) return res.status(400).json({ error: 'User ID required' });
    if (safeData.id !== req.user.id) {
      return res.status(403).json({ error: 'Cannot create/modify another user' });
    }
    await User.findOneAndUpdate(
      { id: safeData.id },
      { $set: safeData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update user (own profile only, field whitelist)
router.patch('/:userId', authenticateToken, async (req, res) => {
  try {
    if (req.params.userId !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own profile.' });
    }
    const ALLOWED_UPDATE_FIELDS = ['name', 'username', 'avatar', 'bio', 'gender', 'fromCountry', 'currentLocation', 'customStatus', 'ghostMode', 'hiddenVisit', 'education', 'work'];
    const safeData = {};
    for (const key of ALLOWED_UPDATE_FIELDS) {
      if (req.body[key] !== undefined) safeData[key] = req.body[key];
    }
    const updated = await User.findOneAndUpdate(
      { id: req.params.userId },
      { $set: safeData },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(sanitizeUser(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update session token (legacy, maintained for compatibility - JWT replaces this)
router.patch('/:userId/session', authenticateToken, async (req, res) => {
  try {
    if (req.params.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized.' });
    }
    const { sessionToken, sessionExpiry } = req.body;
    await User.findOneAndUpdate(
      { id: req.params.userId },
      { $set: { sessionToken, sessionExpiry } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH increment online time
router.patch('/:userId/online-time', authenticateToken, async (req, res) => {
  try {
    if (req.params.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized.' });
    }
    const { seconds, dateStr } = req.body;
    const user = await User.findOne({ id: req.params.userId }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    let update;
    if (user.lastOnlineDate !== dateStr) {
      update = {
        todayOnlineTime: seconds,
        $inc: { totalOnlineTime: seconds },
        lastOnlineDate: dateStr
      };
    } else {
      update = {
        $inc: { todayOnlineTime: seconds, totalOnlineTime: seconds },
        lastOnlineDate: dateStr
      };
    }
    await User.findOneAndUpdate({ id: req.params.userId }, update);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:userId/award-points - Increment points (daily/weekly/all-time)
router.post('/:userId/award-points', authenticateToken, async (req, res) => {
  try {
    if (req.params.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized.' });
    }
    const { points } = req.body;
    if (!points || typeof points !== 'number' || points <= 0) {
      return res.status(400).json({ error: 'Invalid points value' });
    }
    const bd = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
    const weekKey = (() => { const d = new Date(); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); const m = new Date(d.setDate(diff)); return m.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); })();
    const user = await User.findOne({ id: req.params.userId }).lean();
    const update = { $inc: { points, dailyPoints: points, weeklyPoints: points } };
    if (user.lastDailyReset !== bd) { update.$set = { lastDailyReset: bd }; update.$inc.dailyPoints = points; }
    if (user.lastWeeklyReset !== weekKey) { if (!update.$set) update.$set = {}; update.$set.lastWeeklyReset = weekKey; update.$inc.weeklyPoints = points; }
    const updated = await User.findOneAndUpdate({ id: req.params.userId }, update, { new: true }).lean();
    if (global.__socketEmitter) {
      global.__socketEmitter.emitToRoom('users', 'user:points', { userId: req.params.userId, points: updated?.points, dailyPoints: updated?.dailyPoints, weeklyPoints: updated?.weeklyPoints });
    }
    res.json({ success: true, points });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:userId - Delete user permanently (own account or admin only)
router.delete('/:userId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id }).lean();
    if (req.params.userId !== req.user.id && (!user || user.role !== 'admin')) {
      return res.status(403).json({ error: 'Not authorized to delete this user.' });
    }
    const deleted = await User.findOneAndDelete({ id: req.params.userId });
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET next sequential user ID
router.get('/meta/next-user-id', async (req, res) => {
  try {
    const meta = await Meta.findOneAndUpdate(
      { id: 'user_counter' },
      { $inc: { count: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ nextId: meta.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:id/follow - Follow a user
router.post('/:id/follow', authenticateToken, async (req, res) => {
  try {
    const followerId = req.user.id;
    if (followerId === req.params.id) return res.status(400).json({ error: 'Cannot follow yourself' });

    const target = await User.findOne({ id: req.params.id });
    const follower = await User.findOne({ id: followerId });
    if (!target || !follower) return res.status(404).json({ error: 'User not found' });

    const following = follower.following || [];
    const followers = target.followers || [];
    if (!following.includes(req.params.id)) following.push(req.params.id);
    if (!followers.includes(followerId)) followers.push(followerId);

    await User.findOneAndUpdate({ id: followerId }, { $set: { following } });
    await User.findOneAndUpdate({ id: req.params.id }, { $set: { followers } });

    if (global.__socketEmitter) {
      global.__socketEmitter.emitToUser(req.params.id, 'user:followed', { followerId, followerName: follower.name });
    }

    res.json({ success: true, following, followers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id/follow - Unfollow a user
router.delete('/:id/follow', authenticateToken, async (req, res) => {
  try {
    const followerId = req.user.id;

    const target = await User.findOne({ id: req.params.id });
    const follower = await User.findOne({ id: followerId });
    if (!target || !follower) return res.status(404).json({ error: 'User not found' });

    let following = follower.following || [];
    let followers = target.followers || [];
    following = following.filter(id => id !== req.params.id);
    followers = followers.filter(id => id !== followerId);

    await User.findOneAndUpdate({ id: followerId }, { $set: { following } });
    await User.findOneAndUpdate({ id: req.params.id }, { $set: { followers } });

    res.json({ success: true, following, followers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id/suggested - Get suggested users to follow
router.get('/:id/suggested', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const following = user.following || [];
    const allUsers = await User.find({}).lean();
    const suggested = allUsers
      .filter(u => u.id !== req.params.id && !following.includes(u.id) && !u.isBot)
      .sort(() => Math.random() - 0.5)
      .slice(0, 10)
      .map(u => sanitizeUser(u));

    res.json(suggested);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// POST /api/users/:userId/admin-update - Admin only update
router.post('/:userId/admin-update', authenticateToken, async (req, res) => {
  try {
    const adminUser = await User.findOne({ id: req.user.id }).lean();
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    const { reason, updates } = req.body;
    if (!reason) return res.status(400).json({ error: 'Reason is required' });
    
    // Auto 7-day ban trigger
    if (updates.strikes >= 3) {
      updates.isBanned = true;
    }

    // Only allow specific fields for admin update
    const ALLOWED_ADMIN_UPDATES = ['role', 'user_role', 'isPremium', 'isBanned', 'isShadowBanned', 'pmBan', 'shoutBan', 'chatBan', 'strikes', 'isVerified', 'level', 'points', 'silverPoints', 'goldenCoins', 'ap', 'plusses', 'balance_ap', 'balance_taka'];
    const safeUpdates = {};
    for (const key of ALLOWED_ADMIN_UPDATES) {
      if (updates[key] !== undefined) safeUpdates[key] = updates[key];
    }

    const updated = await User.findOneAndUpdate(
      { id: req.params.userId },
      { $set: safeUpdates },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'User not found' });

    const actionDesc = Object.keys(safeUpdates).map(k => `${k} -> ${safeUpdates[k]}`).join(', ');
    await AdminLog.create({
      id: `audit_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      action: `Admin Update: ${actionDesc}`,
      targetId: req.params.userId,
      targetType: 'user',
      deletedBy: req.user.id,
      deletedByName: adminUser.name || 'System Admin',
      details: reason
    });

    res.json(sanitizeUser(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:userId/force-logout
router.post('/:userId/force-logout', authenticateToken, async (req, res) => {
  try {
    const adminUser = await User.findOne({ id: req.user.id }).lean();
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Reason is required' });

    const updated = await User.findOneAndUpdate(
      { id: req.params.userId },
      { $set: { sessionToken: null, sessionExpiry: 0 } },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'User not found' });

    await AdminLog.create({
      id: `audit_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      action: 'Force Logout All Devices',
      targetId: req.params.userId,
      targetType: 'user',
      deletedBy: req.user.id,
      deletedByName: adminUser.name || 'System Admin',
      details: reason
    });

    res.json({ success: true, message: 'All devices logged out.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:userId/audit
router.get('/:userId/audit', async (req, res) => {
  try {
    const logs = await AdminLog.find({ targetId: req.params.userId, targetType: 'user' })
      .sort({ timestamp: -1 })
      .lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
