const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const User = require('../models/User');

// GET activities (latest 25, ordered by timestamp desc)
router.get('/', async (req, res) => {
  try {
    const activities = await Activity.find({}).sort({ timestamp: -1 }).limit(25).lean();
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET activities for a specific user
router.get('/user/:username', async (req, res) => {
  try {
    const activities = await Activity.find({ username: req.params.username })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create/upsert activity
router.post('/', async (req, res) => {
  try {
    const act = req.body;
    const isNew = !(await Activity.exists({ id: act.id }));
    await Activity.findOneAndUpdate(
      { id: act.id },
      { $set: act },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (isNew && act.username) {
      const bd = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
      const weekKey = (() => { const d = new Date(); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); const m = new Date(d.setDate(diff)); return m.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); })();
      const user = await User.findOne({ $or: [{ username: act.username }, { name: act.username }] }).lean();
      if (user) {
        const update = { $inc: { points: 1, dailyPoints: 1, weeklyPoints: 1 }, $set: {} };
        if (user.lastDailyReset !== bd) { update.$set = { ...update.$set, lastDailyReset: bd }; update.$inc.dailyPoints = 1; }
        if (user.lastWeeklyReset !== weekKey) { update.$set = { ...update.$set, lastWeeklyReset: weekKey }; update.$inc.weeklyPoints = 1; }
        await User.findOneAndUpdate({ id: user.id }, update);
      }
    }
    if (global.__socketEmitter) {
      global.__socketEmitter.emitToRoom('activities', 'activity:updated', act);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
