const express = require('express');
const router = express.Router();
const Photo = require('../models/Photo');

// GET photos (latest 30, ordered by timestamp desc)
router.get('/', async (req, res) => {
  try {
    const photos = await Photo.find({}).sort({ timestamp: -1 }).limit(30).lean();
    res.json(photos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create/upsert photo
router.post('/', async (req, res) => {
  try {
    const photo = req.body;
    await Photo.findOneAndUpdate(
      { id: photo.id },
      { $set: photo },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
