const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// GET notifications for a user
router.get('/:userId', async (req, res) => {
  try {
    const notifs = await Notification.find({ userId: req.params.userId })
      .sort({ timestamp: -1 }).limit(60).lean();
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add notification for a user
router.post('/:userId', async (req, res) => {
  try {
    const notif = { ...req.body, userId: req.params.userId };
    await Notification.findOneAndUpdate(
      { userId: req.params.userId, id: notif.id },
      { $set: notif },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH mark single notification as read
router.patch('/:userId/:notifId/read', async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { userId: req.params.userId, id: req.params.notifId },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH mark all notifications as read
router.patch('/:userId/read-all', async (req, res) => {
  try {
    const { notifIds } = req.body;
    await Notification.updateMany(
      { userId: req.params.userId, id: { $in: notifIds } },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE all notifications
router.delete('/:userId/all', async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.params.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE single notification
router.delete('/:userId/:notifId', async (req, res) => {
  try {
    await Notification.findOneAndDelete({ userId: req.params.userId, id: req.params.notifId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
