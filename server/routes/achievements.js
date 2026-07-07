const express = require('express');
const router = express.Router();
const Achievement = require('../models/Achievement');

const ACHIEVEMENT_DEFS = {
  first_win:     { title: 'First Win',     description: 'You won your first game!',           icon: '🏆' },
  forum_veteran: { title: 'Forum Veteran',  description: 'Created 5 forum topics.',            icon: '💎' },
  rich_kid:      { title: 'Rich Kid',       description: 'Earned 10,000 points.',              icon: '🤑' },
  quiz_master:   { title: 'Quiz Master',    description: 'Got a perfect score in a quiz.',     icon: '🧠' },
  social_butterfly: { title: 'Social Butterfly', description: 'Sent 10 friend requests.',      icon: '🦋' },
  chatty:        { title: 'Chatty',         description: 'Sent 50 messages.',                  icon: '💬' },
  elite:         { title: 'Elite',          description: 'Upgraded to Elite membership.',      icon: '💎' },
};

// GET /api/achievements/:userId - List unlocked achievements for a user
router.get('/:userId', async (req, res) => {
  try {
    const unlocked = await Achievement.find({ userId: req.params.userId }).sort({ unlockedAt: -1 });
    res.json({ unlocked, definitions: ACHIEVEMENT_DEFS });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/achievements/unlock - Unlock an achievement
router.post('/unlock', async (req, res) => {
  try {
    const { userId, achievementId } = req.body;
    if (!userId || !achievementId) {
      return res.status(400).json({ error: 'userId and achievementId required.' });
    }
    const def = ACHIEVEMENT_DEFS[achievementId];
    if (!def) return res.status(404).json({ error: 'Unknown achievement.' });

    const existing = await Achievement.findOne({ userId, achievementId });
    if (existing) return res.json({ success: true, alreadyUnlocked: true, achievement: existing });

    const achievement = new Achievement({ userId, achievementId, ...def });
    await achievement.save();
    res.json({ success: true, alreadyUnlocked: false, achievement });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
