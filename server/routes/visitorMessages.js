const express = require('express');
const router = express.Router();
const VisitorMessage = require('../models/VisitorMessage');

router.get('/:profileUserId', async (req, res) => {
  try {
    const msgs = await VisitorMessage.find({ profileUserId: req.params.profileUserId })
      .sort({ createdAt: -1 }).limit(50).lean();
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { id, profileUserId, authorId, authorName, authorAvatar, message } = req.body;
    const msg = await VisitorMessage.findOneAndUpdate(
      { id },
      { $set: { profileUserId, authorId, authorName, authorAvatar, message, createdAt: Date.now() } },
      { upsert: true, new: true }
    );
    if (global.__socketEmitter) {
      global.__socketEmitter.emitToUser(profileUserId, 'visitor:message', msg);
    }
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await VisitorMessage.findOneAndDelete({ id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
