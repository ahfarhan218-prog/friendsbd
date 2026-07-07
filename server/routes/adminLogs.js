const express = require('express');
const router = express.Router();
const AdminLog = require('../models/AdminLog');

// GET all admin logs (latest first, max 100)
router.get('/', async (req, res) => {
  try {
    const logs = await AdminLog.find({}).sort({ timestamp: -1 }).limit(100).lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create admin log
router.post('/', async (req, res) => {
  try {
    const log = req.body;
    await AdminLog.findOneAndUpdate(
      { id: log.id },
      { $set: log },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
