const express = require('express');
const router = express.Router();
const Shout = require('../models/Shout');
const User = require('../models/User');

// GET shouts (latest 50, ordered by timestamp desc)
router.get('/', async (req, res) => {
  try {
    const shouts = await Shout.find({}).sort({ timestamp: -1 }).limit(50).lean();
    res.json(shouts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create/upsert shout
router.post('/', async (req, res) => {
  try {
    const shout = req.body;
    const isNew = !(await Shout.exists({ id: shout.id }));
    await Shout.findOneAndUpdate(
      { id: shout.id },
      { $set: shout },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (isNew && shout.userId && !shout.content?.includes('Updated their profile picture')) {
      const bd = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
      const weekKey = (() => { const d = new Date(); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); const m = new Date(d.setDate(diff)); return m.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); })();
      const user = await User.findOne({ id: shout.userId }).lean();
      const update = { $inc: { points: 2, dailyPoints: 2, weeklyPoints: 2 }, $set: {} };
      if (user?.lastDailyReset !== bd) { update.$set = { ...update.$set, lastDailyReset: bd }; update.$inc.dailyPoints = 2; }
      if (user?.lastWeeklyReset !== weekKey) { update.$set = { ...update.$set, lastWeeklyReset: weekKey }; update.$inc.weeklyPoints = 2; }
      await User.findOneAndUpdate({ id: shout.userId }, update);
    }
    if (global.__socketEmitter) {
      global.__socketEmitter.emitToRoom('shouts', 'shout:updated', shout);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE shout
router.delete('/:shoutId', async (req, res) => {
  try {
    await Shout.findOneAndDelete({ id: req.params.shoutId });
    if (global.__socketEmitter) {
      global.__socketEmitter.emitToRoom('shouts', 'shout:deleted', req.params.shoutId);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH reaction
router.patch('/:id/react', async (req, res) => {
  try {
    const { userId, reaction } = req.body;
    const shout = await Shout.findOne({ id: req.params.id });
    if (!shout) return res.status(404).json({error: 'Not found'});
    
    let userReactions = shout.userReactions || {};
    if (userReactions[userId] === reaction) {
      delete userReactions[userId];
    } else {
      userReactions[userId] = reaction;
    }
    
    await Shout.findOneAndUpdate({ id: req.params.id }, { $set: { userReactions: userReactions } });
    if (global.__socketEmitter) {
      global.__socketEmitter.emitToRoom('shouts', 'shout:reacted', { id: req.params.id, userReactions });
    }
    res.json({ success: true, userReactions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

