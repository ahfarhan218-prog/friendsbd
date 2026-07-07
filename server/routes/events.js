const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const events = await Event.find(filter).sort({ date: 1 }).lean();
    res.json(events);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, type, prize, date, endDate, maxParticipants, createdBy } = req.body;
    if (!title || !date) return res.status(400).json({ error: 'title and date required.' });
    const event = new Event({
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title, description, type, prize, date, endDate, maxParticipants,
      participants: [], status: date > Date.now() ? 'upcoming' : 'ongoing', createdBy, createdAt: Date.now()
    });
    await event.save();
    res.json({ success: true, event });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/register', async (req, res) => {
  try {
    const { userId } = req.body;
    const event = await Event.findOne({ id: req.params.id });
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    if (event.participants.includes(userId)) return res.status(409).json({ error: 'Already registered.' });
    if (event.maxParticipants && event.participants.length >= event.maxParticipants) {
      return res.status(400).json({ error: 'Event full.' });
    }
    event.participants.push(userId);
    await event.save();
    res.json({ success: true, event });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
