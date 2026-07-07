const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/elite/upgrade-via-rp — Upgrade to Elite using Reputation Points
router.post('/upgrade-via-rp', async (req, res) => {
  try {
    const { userId, days, cost } = req.body;
    if (!userId || !days || !cost) {
      return res.status(400).json({ error: 'userId, days, and cost are required.' });
    }

    const user = await User.findOne({ id: userId });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if ((user.reputation_points || 0) < cost) {
      return res.status(400).json({ error: 'Insufficient Reputation Points.' });
    }

    const currentExpiry = user.premiumExpiry || 0;
    const baseTime = Math.max(Date.now(), currentExpiry);
    const newRp = (user.reputation_points || 0) - cost;
    const eliteExpiry = baseTime + days * 24 * 60 * 60 * 1000;

    await User.findOneAndUpdate(
      { id: userId },
      {
        $set: {
          reputation_points: newRp,
          premiumExpiry: eliteExpiry,
          elite_active_until: eliteExpiry,
          isPremium: true
        }
      }
    );

    res.json({ success: true, newRp, eliteExpiry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/elite/upgrade-via-wallet — Upgrade to Elite using Taka Wallet
router.post('/upgrade-via-wallet', async (req, res) => {
  try {
    const { userId, days, cost } = req.body;
    if (!userId || !days || !cost) {
      return res.status(400).json({ error: 'userId, days, and cost are required.' });
    }

    const user = await User.findOne({ id: userId });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if ((user.balance_taka || 0) < cost) {
      return res.status(400).json({ error: 'Insufficient Taka balance.' });
    }

    const currentExpiry = user.premiumExpiry || 0;
    const baseTime = Math.max(Date.now(), currentExpiry);
    const newTaka = (user.balance_taka || 0) - cost;
    const eliteExpiry = baseTime + days * 24 * 60 * 60 * 1000;

    await User.findOneAndUpdate(
      { id: userId },
      {
        $set: {
          balance_taka: newTaka,
          premiumExpiry: eliteExpiry,
          elite_active_until: eliteExpiry,
          isPremium: true
        }
      }
    );

    res.json({ success: true, newTaka, eliteExpiry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
