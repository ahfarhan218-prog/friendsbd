const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');

// GET activities (latest 25, ordered by timestamp desc)
router.get('/', async (req, res) => {
  try {
    const activities = await Activity.find({}).sort({ timestamp: -1 }).limit(25).lean();
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create/upsert activity
router.post('/', async (req, res) => {
  try {
    const act = req.body;
    await Activity.findOneAndUpdate(
      { id: act.id },
      { $set: act },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
