const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

const activeMatches = new Map();

router.get('/', (req, res) => {
  const available = [];
  activeMatches.forEach((m, id) => {
    if (m.status === 'waiting' || m.status === 'active') {
      available.push({ id, player1: m.player1, player2: m.player2, status: m.status, innings: m.innings });
    }
  });
  res.json(available);
});

router.post('/create', authenticateToken, (req, res) => {
  try {
    const matchId = `cricket_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    activeMatches.set(matchId, {
      id: matchId,
      player1: { id: req.user.id, name: req.body.name || 'Player 1', runs: 0, balls: 0, wickets: 0, digits: [] },
      player2: null,
      status: 'waiting',
      innings: 1,
      target: 0,
      currentBatting: 1,
      currentBowling: 2,
      toss: null,
      createdAt: Date.now()
    });
    if (global.__socketEmitter) {
      global.__socketEmitter.emitToAll('cricket', 'cricket:created', { matchId });
    }
    res.json({ success: true, matchId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/join', authenticateToken, (req, res) => {
  try {
    const match = activeMatches.get(req.params.id);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    if (match.status !== 'waiting') return res.status(400).json({ error: 'Match already started' });
    if (match.player1.id === req.user.id) return res.status(400).json({ error: 'Cannot join your own match' });
    match.player2 = { id: req.user.id, name: req.body.name || 'Player 2', runs: 0, balls: 0, wickets: 0, digits: [] };
    match.status = 'active';
    match.toss = Math.random() > 0.5 ? 1 : 2;
    match.currentBatting = match.toss;
    match.currentBowling = match.toss === 1 ? 2 : 1;
    if (global.__socketEmitter) {
      global.__socketEmitter.emitToAll('cricket', 'cricket:started', { matchId: req.params.id, match });
    }
    res.json({ success: true, match });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/play', authenticateToken, (req, res) => {
  try {
    const { digit } = req.body;
    const match = activeMatches.get(req.params.id);
    if (!match || match.status !== 'active') return res.status(400).json({ error: 'Match not active' });

    const player = match.player1.id === req.user.id ? match.player1 : match.player2;
    if (!player) return res.status(400).json({ error: 'You are not in this match' });

    const battingPlayer = match.currentBatting === 1 ? match.player1 : match.player2;
    const bowlingPlayer = match.currentBowling === 1 ? match.player1 : match.player2;

    if (player.id !== battingPlayer.id) {
      return res.status(400).json({ error: 'It is not your turn to bat' });
    }

    const run = parseInt(digit);
    if (isNaN(run) || run < 0 || run > 9) return res.status(400).json({ error: 'Invalid digit (0-9)' });

    const bowlingDigit = bowlingPlayer.digits[battingPlayer.balls] || null;
    battingPlayer.digits.push(run);

    if (bowlingDigit !== null && run === bowlingDigit) {
      battingPlayer.wickets++;
      if (battingPlayer.wickets >= 10) {
        if (match.innings === 1) {
          match.innings = 2;
          match.target = match.player1.runs + 1;
          match.currentBatting = 2;
          match.currentBowling = 1;
        } else {
          match.status = 'completed';
          const winner = match.player1.runs > match.player2.runs ? match.player1 : match.player2;
          if (global.__socketEmitter) {
            global.__socketEmitter.emitToAll('cricket', 'cricket:ended', { matchId: req.params.id, winner });
          }
        }
      }
    } else {
      battingPlayer.runs += run;
    }

    battingPlayer.balls++;

    if (match.status === 'active' && match.innings === 2 && match.player2.runs >= match.target) {
      match.status = 'completed';
      if (global.__socketEmitter) {
        global.__socketEmitter.emitToAll('cricket', 'cricket:ended', { matchId: req.params.id, winner: match.player2 });
      }
    }

    if (global.__socketEmitter) {
      global.__socketEmitter.emitToAll('cricket', 'cricket:update', { matchId: req.params.id, match });
    }

    res.json({ success: true, match });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
