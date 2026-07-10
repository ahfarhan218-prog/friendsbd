const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/', async (req, res) => {
  try {
    const period = req.query.period || 'alltime';
    let sortField = 'points';
    if (period === 'daily') sortField = 'dailyPoints';
    else if (period === 'weekly') sortField = 'weeklyPoints';

    const users = await User.find({ isBot: { $ne: true } })
      .sort({ [sortField]: -1 })
      .limit(100)
      .select('id name username avatar level points dailyPoints weeklyPoints role isVerified createdAt')
      .lean();

    res.json({ period, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
