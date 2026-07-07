const express = require('express');
const router = express.Router();

// Static challenge definitions (can be moved to MongoDB if needed)
const CHALLENGES = [
  { id: 1, title: 'Shout Star', desc: 'Post 5 shouts in 24 hours', total: 5, reward: 50 },
  { id: 2, title: 'Socializer', desc: 'React to 10 different shouts', total: 10, reward: 30 },
  { id: 3, title: 'Tournament Pro', desc: 'Participate in 2 cricket matches', total: 2, reward: 100 },
  { id: 4, title: 'Gift Giver', desc: 'Send 3 gifts to friends', total: 3, reward: 150 },
];

// GET /api/challenges - List all challenges
router.get('/', (req, res) => {
  const userId = req.query.userId;
  // In a full implementation, we'd merge with per-user progress from MongoDB
  const tasks = CHALLENGES.map(c => ({
    ...c,
    progress: 0,
    claimed: false,
  }));
  res.json(tasks);
});

// POST /api/challenges/:id/claim - Claim a challenge reward
router.post('/:id/claim', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required.' });
    const challenge = CHALLENGES.find(c => c.id === parseInt(req.params.id));
    if (!challenge) return res.status(404).json({ error: 'Challenge not found.' });
    // In a full implementation, we'd validate completion and award points in MongoDB
    res.json({ success: true, reward: challenge.reward });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
