const express = require('express');
const router = express.Router();
const Referral = require('../models/Referral');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

router.get('/my', authenticateToken, async (req, res) => {
  try {
    const refs = await Referral.find({ referrerId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json(refs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/claim', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Referral code required' });

    const referrer = await User.findOne({ id: code });
    if (!referrer) return res.status(404).json({ error: 'Invalid referral code' });
    if (referrer.id === req.user.id) return res.status(400).json({ error: 'Cannot refer yourself' });

    const existing = await Referral.findOne({ referredId: req.user.id });
    if (existing) return res.status(409).json({ error: 'Referral already claimed' });

    const ref = new Referral({
      id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      referrerId: referrer.id,
      referredId: req.user.id,
      referredName: req.user.name || 'New User',
      status: 'verified'
    });
    await ref.save();

    // Reward both users
    await User.findOneAndUpdate({ id: referrer.id }, { $inc: { points: 200, goldenCoins: 10, silverPoints: 50 } });
    await User.findOneAndUpdate({ id: req.user.id }, { $inc: { points: 100, goldenCoins: 5, silverPoints: 25 } });

    res.json({ success: true, message: 'Referral reward claimed! Both you and your referrer got bonus points!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
