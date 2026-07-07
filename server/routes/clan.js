const express = require('express');
const router = express.Router();
const Clan = require('../models/Clan');
const User = require('../models/User');

// GET /api/clan - List all clans
router.get('/', async (req, res) => {
  try {
    const clans = await Clan.find({}).sort({ level: -1 }).lean();
    res.json(clans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clan - Create clan
router.post('/', async (req, res) => {
  try {
    const { name, tag, description, leaderId, leaderName, avatar } = req.body;
    if (!name || !tag || !leaderId) return res.status(400).json({ error: 'name, tag, and leaderId required.' });
    const existing = await Clan.findOne({ $or: [{ name }, { tag }] });
    if (existing) return res.status(409).json({ error: 'Clan name or tag already taken.' });
    const clan = new Clan({
      id: `clan_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name, tag: tag.toUpperCase(), description, avatar, leaderId, leaderName,
      members: [{ userId: leaderId, name: leaderName, role: 'leader', joinedAt: Date.now() }],
      level: 1, xp: 0, createdAt: Date.now()
    });
    await clan.save();
    res.json({ success: true, clan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clan/:id/join - Join clan
router.post('/:id/join', async (req, res) => {
  try {
    const { userId, userName } = req.body;
    const clan = await Clan.findOne({ id: req.params.id });
    if (!clan) return res.status(404).json({ error: 'Clan not found.' });
    if (!clan.isOpen) return res.status(403).json({ error: 'Clan is closed.' });
    if (clan.members.find(m => m.userId === userId)) return res.status(409).json({ error: 'Already a member.' });
    clan.members.push({ userId, name: userName, role: 'member', joinedAt: Date.now() });
    await clan.save();
    res.json({ success: true, clan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clan/:id/leave - Leave clan
router.post('/:id/leave', async (req, res) => {
  try {
    const { userId } = req.body;
    const clan = await Clan.findOne({ id: req.params.id });
    if (!clan) return res.status(404).json({ error: 'Clan not found.' });
    const member = clan.members.find(m => m.userId === userId);
    if (!member) return res.status(400).json({ error: 'Not a member.' });
    if (member.role === 'leader') return res.status(400).json({ error: 'Leader cannot leave. Transfer leadership first.' });
    clan.members = clan.members.filter(m => m.userId !== userId);
    await clan.save();
    res.json({ success: true, clan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clan/:id/kick - Kick member
router.post('/:id/kick', async (req, res) => {
  try {
    const { userId, requesterId } = req.body;
    const clan = await Clan.findOne({ id: req.params.id });
    if (!clan) return res.status(404).json({ error: 'Clan not found.' });
    const requester = clan.members.find(m => m.userId === requesterId);
    if (!requester || (requester.role !== 'leader' && requester.role !== 'co-leader')) {
      return res.status(403).json({ error: 'Not authorized.' });
    }
    clan.members = clan.members.filter(m => m.userId !== userId);
    await clan.save();
    res.json({ success: true, clan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
