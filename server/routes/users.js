const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Activity = require('../models/Activity');
const AdminLog = require('../models/AdminLog');
const { Meta } = require('../models/ApTransaction');

// GET all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single user by id field
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ 
      $or: [ { id: req.params.userId }, { username: req.params.userId } ] 
    }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET user by username
router.get('/by-username/:username', async (req, res) => {
  try {
    const users = await User.find({ username: req.params.username }).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create/upsert user
router.post('/', async (req, res) => {
  try {
    const { sessionToken, sessionExpiry, ...safeUser } = req.body;
    await User.findOneAndUpdate(
      { id: safeUser.id },
      { $set: safeUser },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update user
router.patch('/:userId', async (req, res) => {
  try {
    const { sessionToken, sessionExpiry, ...safeData } = req.body;
    const updated = await User.findOneAndUpdate(
      { id: req.params.userId },
      { $set: safeData },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update session token
router.patch('/:userId/session', async (req, res) => {
  try {
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
router.patch('/:userId/online-time', async (req, res) => {
  try {
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

// DELETE /api/users/:userId - Delete user permanently
router.delete('/:userId', async (req, res) => {
  try {
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
router.post('/:id/follow', async (req, res) => {
  try {
    const { followerId } = req.body;
    if (!followerId) return res.status(400).json({ error: 'followerId required' });
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
router.delete('/:id/follow', async (req, res) => {
  try {
    const { followerId } = req.body;
    if (!followerId) return res.status(400).json({ error: 'followerId required' });

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
      .map(({ passwordHash, ...safe }) => safe);

    res.json(suggested);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// POST /api/users/:userId/admin-update - Admin only update
router.post('/:userId/admin-update', async (req, res) => {
  try {
    const { reason, adminId, adminName, updates } = req.body;
    if (!reason || !adminId) return res.status(400).json({ error: 'Missing reason or admin info' });
    
    // Auto 7-day ban trigger
    if (updates.strikes >= 3) {
      updates.isBanned = true;
    }

    const updated = await User.findOneAndUpdate(
      { id: req.params.userId },
      { $set: updates },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'User not found' });

    // Create Audit Log
    const actionDesc = Object.keys(updates).map(k => `${k} -> ${updates[k]}`).join(', ');
    await AdminLog.create({
      id: `audit_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      action: `Admin Update: ${actionDesc}`,
      targetId: req.params.userId,
      targetType: 'user',
      deletedBy: adminId,
      deletedByName: adminName || 'System Admin',
      details: reason
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:userId/force-logout
router.post('/:userId/force-logout', async (req, res) => {
  try {
    const { reason, adminId, adminName } = req.body;
    if (!reason || !adminId) return res.status(400).json({ error: 'Missing reason or admin info' });

    const updated = await User.findOneAndUpdate(
      { id: req.params.userId },
      { $set: { sessionToken: null, sessionExpiry: 0 } },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'User not found' });

    // Create Audit Log
    await AdminLog.create({
      id: `audit_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      action: 'Force Logout All Devices',
      targetId: req.params.userId,
      targetType: 'user',
      deletedBy: adminId,
      deletedByName: adminName || 'System Admin',
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
