const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const { v4: uuidv4 } = require('crypto');

// GET all matches
router.get('/', async (req, res) => {
  try {
    const matches = await Match.find({}).lean();
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET match by topicId
router.get('/by-topic/:topicId', async (req, res) => {
  try {
    const match = await Match.findOne({ topicId: req.params.topicId }).lean();
    res.json(match || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create match
router.post('/', async (req, res) => {
  try {
    const { topicId, teamA, teamB } = req.body;
    const id = `match_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newMatch = {
      id,
      topicId,
      battingTeam: teamA,
      bowlingTeam: teamB,
      status: 'WAITING',
      innings: 1,
      scores: {
        [teamA]: { runs: 0, wickets: 0, ballsBowled: 0, extras: 0, oversBowled: 0 },
        [teamB]: { runs: 0, wickets: 0, ballsBowled: 0, extras: 0, oversBowled: 0 }
      },
      lineups: {
        [teamA]: { captain: '', players: [], backupBowler: '' },
        [teamB]: { captain: '', players: [], backupBowler: '' }
      },
      currentOver: {
        bowlerId: null,
        activeBatsmanId: null,
        ballsBowled: 0,
        overStartTime: null,
        batsmanPost: null,
        bowlerPost: null,
        batsmanPostTime: null,
        bowlerPostTime: null
      },
      logs: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await Match.findOneAndUpdate(
      { id },
      { $set: newMatch },
      { upsert: true, new: true }
    );
    res.json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update match
router.patch('/:matchId', async (req, res) => {
  try {
    await Match.findOneAndUpdate(
      { id: req.params.matchId },
      { $set: { ...req.body, updatedAt: Date.now() } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
