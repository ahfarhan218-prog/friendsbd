const express = require('express');
const router = express.Router();
const PushSubscription = require('../models/PushSubscription');
const { authenticateToken } = require('../middleware/auth');

router.post('/subscribe', authenticateToken, async (req, res) => {
  try {
    const { endpoint, keys, userAgent } = req.body;
    if (!endpoint || !keys) return res.status(400).json({ error: 'Missing subscription data' });
    await PushSubscription.findOneAndUpdate(
      { userId: req.user.id, endpoint },
      { $set: { userId: req.user.id, endpoint, keys, userAgent, createdAt: Date.now() } },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/unsubscribe', authenticateToken, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await PushSubscription.deleteOne({ userId: req.user.id, endpoint });
    } else {
      await PushSubscription.deleteMany({ userId: req.user.id });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
