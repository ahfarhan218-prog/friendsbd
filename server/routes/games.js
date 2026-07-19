const express = require('express');
const router = express.Router();
const Game = require('../models/Game');

const GAME_NAMES = ['golden_coin', 'silver_coin', 'color_ball'];
const DEFAULT_GAME_STATE = {
  active: false,
  claimTime: 0,
  spawnTime: 0,
  claimedBy: null,
  claimedByName: null,
  claimedByAvatar: null,
  nextSpawnTime: null
};

// Initialize game documents if they don't exist
const initGames = async () => {
  for (const name of GAME_NAMES) {
    await Game.findOneAndUpdate(
      { id: name },
      { $setOnInsert: { id: name, ...DEFAULT_GAME_STATE } },
      { upsert: true, new: true }
    );
  }
  console.log('✅ Game documents initialized (golden_coin, silver_coin, color_ball)');
};
initGames().catch(err => console.error('❌ initGames failed:', err.message));

// GET all games state
router.get('/', async (req, res) => {
  try {
    const games = await Game.find({}).lean();
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single game state — auto-create if missing to prevent 404 FetchErrors
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    if (!GAME_NAMES.includes(gameId)) {
      return res.status(404).json({ error: 'Unknown game ID' });
    }
    const game = await Game.findOneAndUpdate(
      { id: gameId },
      { $setOnInsert: { id: gameId, ...DEFAULT_GAME_STATE } },
      { upsert: true, new: true }
    ).lean();
    res.json(game);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update game state
router.patch('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    if (!GAME_NAMES.includes(gameId)) {
      return res.status(404).json({ error: 'Unknown game ID' });
    }
    const updated = await Game.findOneAndUpdate(
      { id: gameId },
      { $set: req.body },
      { new: true, upsert: true }
    ).lean();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
