const express = require('express');
const router = express.Router();
const SystemMatch = require('../models/SystemMatch');

// Get all system matches (or filter by active)
router.get('/', async (req, res) => {
  try {
    const matches = await SystemMatch.find().sort({ createdAt: -1 });
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Get single match
router.get('/:id', async (req, res) => {
  try {
    const match = await SystemMatch.findOne({ id: req.params.id });
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

// Create new match
router.post('/', async (req, res) => {
  try {
    const newMatch = new SystemMatch(req.body);
    const savedMatch = await newMatch.save();
    res.status(201).json(savedMatch);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create match' });
  }
});

// Update match (used for every ball, over, text post)
router.put('/:id', async (req, res) => {
  try {
    const updated = await SystemMatch.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update match' });
  }
});

// Delete match
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await SystemMatch.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ error: 'Match not found' });
    res.json({ success: true, deleted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete match' });
  }
});

module.exports = router;
