const express = require('express');
const router = express.Router();
const Game = require('../models/Game');

const GAME_NAMES = ['golden_coin', 'silver_coin', 'color_ball'];

// Initialize game documents if they don't exist
const initGames = async () => {
  for (const name of GAME_NAMES) {
    await Game.findOneAndUpdate(
      { id: name },
      { $setOnInsert: { id: name, active: false, claimTime: 0, spawnTime: 0 } },
      { upsert: true }
    );
  }
};
initGames().catch(console.error);

// GET all games state
router.get('/', async (req, res) => {
  try {
    const games = await Game.find({}).lean();
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single game state
router.get('/:gameId', async (req, res) => {
  try {
    const game = await Game.findOne({ id: req.params.gameId }).lean();
    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.json(game);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update game state
router.patch('/:gameId', async (req, res) => {
  try {
    const updated = await Game.findOneAndUpdate(
      { id: req.params.gameId },
      { $set: req.body },
      { new: true, upsert: true }
    ).lean();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
