const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ReputationLog = require('../models/ReputationLog');

const REPUTATION_RULES = {
  shout_like:     { points: 1,  desc: 'Received a like on shout' },
  forum_post:     { points: 2,  desc: 'Created a forum post' },
  quiz_perfect:   { points: 5,  desc: 'Perfect quiz score' },
  game_win:       { points: 3,  desc: 'Won a game' },
  referral:       { points: 10, desc: 'Referred a new user' },
  daily_login:    { points: 1,  desc: 'Daily login bonus' },
};

// GET /api/reputation/:userId - Get reputation history for a user
router.get('/:userId', async (req, res) => {
  try {
    const logs = await ReputationLog.find({ userId: req.params.userId })
      .sort({ createdAt: -1 }).limit(50);
    const user = await User.findOne({ id: req.params.userId }).select('reputation_points total_rp');
    res.json({ logs, reputation_points: user?.reputation_points || 0, total_rp: user?.total_rp || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reputation/award - Award reputation points
router.post('/award', async (req, res) => {
  try {
    const { userId, action, source, sourceId } = req.body;
    if (!userId || !action) return res.status(400).json({ error: 'userId and action required.' });

    const rule = REPUTATION_RULES[action];
    if (!rule) return res.status(400).json({ error: 'Unknown reputation action.' });

    // Check if already awarded for this source (prevent duplicates)
    if (sourceId) {
      const exists = await ReputationLog.findOne({ userId, action, sourceId });
      if (exists) return res.json({ success: true, alreadyAwarded: true, log: exists });
    }

    const log = new ReputationLog({
      userId,
      action,
      points: rule.points,
      source: source || action,
      sourceId: sourceId || '',
      description: rule.desc
    });
    await log.save();

    await User.findOneAndUpdate(
      { id: userId },
      { $inc: { reputation_points: rule.points, total_rp: rule.points } }
    );

    res.json({ success: true, alreadyAwarded: false, points: rule.points, log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
