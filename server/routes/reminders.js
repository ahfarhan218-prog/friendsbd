const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');

// GET /api/reminders/:userId - List reminders for a user
router.get('/:userId', async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.params.userId }).sort({ dueTime: 1 });
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reminders - Create a reminder
router.post('/', async (req, res) => {
  try {
    const { userId, title, description, dueTime } = req.body;
    if (!userId || !title || !dueTime) {
      return res.status(400).json({ error: 'userId, title, and dueTime are required.' });
    }
    const reminder = new Reminder({
      userId,
      title,
      description: description || '',
      dueTime
    });
    await reminder.save();
    res.json({ success: true, reminder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reminders/:id - Delete a reminder
router.delete('/:id', async (req, res) => {
  try {
    await Reminder.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
