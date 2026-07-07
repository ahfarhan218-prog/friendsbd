const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

// GET /api/announcements - List active announcements
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find({
      active: true,
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: Date.now() } }]
    }).sort({ createdAt: -1 }).limit(10);
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/announcements - Create an announcement
router.post('/', async (req, res) => {
  try {
    const { title, content, type, authorId, authorName, expiresAt } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'title and content required.' });
    const announcement = new Announcement({ title, content, type, authorId, authorName, expiresAt });
    await announcement.save();
    res.json({ success: true, announcement });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/announcements/:id - Deactivate an announcement
router.delete('/:id', async (req, res) => {
  try {
    await Announcement.findByIdAndUpdate(req.params.id, { $set: { active: false } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
