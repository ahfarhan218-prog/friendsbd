const express = require('express');
const router = express.Router();
const ClanWar = require('../models/ClanWar');
const Clan = require('../models/Clan');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const wars = await ClanWar.find({}).sort({ createdAt: -1 }).limit(50).lean();
    res.json(wars);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/declare', authenticateToken, async (req, res) => {
  try {
    const { clanId1, clanId2, type } = req.body;
    if (!clanId1 || !clanId2) return res.status(400).json({ error: 'Both clan IDs required' });
    const clan1 = await Clan.findOne({ id: clanId1 }).lean();
    const clan2 = await Clan.findOne({ id: clanId2 }).lean();
    if (!clan1 || !clan2) return res.status(404).json({ error: 'Clan not found' });
    const isLeader = clan1.members.some(m => m.userId === req.user.id && (m.role === 'leader' || m.role === 'co-leader'));
    if (!isLeader) return res.status(403).json({ error: 'Only clan leaders can declare war' });
    const war = new ClanWar({
      id: `war_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      clanId1, clanId2,
      clanName1: clan1.name,
      clanName2: clan2.name,
      type: type || 'cricket',
      createdBy: req.user.id,
      status: 'pending'
    });
    await war.save();
    if (global.__socketEmitter) {
      global.__socketEmitter.emitToAll('clanwars', 'clanwar:declared', war);
    }
    res.json({ success: true, war });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/accept', authenticateToken, async (req, res) => {
  try {
    const war = await ClanWar.findOne({ id: req.params.id });
    if (!war) return res.status(404).json({ error: 'War not found' });
    if (war.status !== 'pending') return res.status(400).json({ error: 'War already accepted or completed' });
    const clan2 = await Clan.findOne({ id: war.clanId2 }).lean();
    const isLeader = clan2.members.some(m => m.userId === req.user.id && (m.role === 'leader' || m.role === 'co-leader'));
    if (!isLeader) return res.status(403).json({ error: 'Only clan leaders can accept wars' });
    war.status = 'active';
    war.startedAt = Date.now();
    await war.save();
    if (global.__socketEmitter) {
      global.__socketEmitter.emitToAll('clanwars', 'clanwar:started', war);
    }
    res.json({ success: true, war });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/score', authenticateToken, async (req, res) => {
  try {
    const { clanId, points } = req.body;
    const war = await ClanWar.findOne({ id: req.params.id });
    if (!war || war.status !== 'active') return res.status(400).json({ error: 'War not active' });
    if (war.clanId1 === clanId) war.score1 += points;
    else if (war.clanId2 === clanId) war.score2 += points;
    else return res.status(400).json({ error: 'Invalid clan' });
    await war.save();
    if (global.__socketEmitter) {
      global.__socketEmitter.emitToAll('clanwars', 'clanwar:score', war);
    }
    res.json({ success: true, war });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/end', authenticateToken, async (req, res) => {
  try {
    const war = await ClanWar.findOne({ id: req.params.id });
    if (!war || war.status !== 'active') return res.status(400).json({ error: 'War not active' });
    war.status = 'completed';
    war.endedAt = Date.now();
    if (war.score1 > war.score2) war.winnerId = war.clanId1;
    else if (war.score2 > war.score1) war.winnerId = war.clanId2;
    const winnerClan = war.winnerId ? await Clan.findOne({ id: war.winnerId }) : null;
    if (winnerClan) {
      winnerClan.xp += war.xpPool;
      await winnerClan.save();
    }
    await war.save();
    if (global.__socketEmitter) {
      global.__socketEmitter.emitToAll('clanwars', 'clanwar:ended', war);
    }
    res.json({ success: true, war });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
