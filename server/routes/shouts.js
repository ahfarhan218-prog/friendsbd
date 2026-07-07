const express = require('express');
const router = express.Router();
const Shout = require('../models/Shout');

// GET shouts (latest 50, ordered by timestamp desc)
router.get('/', async (req, res) => {
  try {
    const shouts = await Shout.find({}).sort({ timestamp: -1 }).limit(50).lean();
    res.json(shouts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create/upsert shout
router.post('/', async (req, res) => {
  try {
    const shout = req.body;
    await Shout.findOneAndUpdate(
      { id: shout.id },
      { $set: shout },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE shout
router.delete('/:shoutId', async (req, res) => {
  try {
    await Shout.findOneAndDelete({ id: req.params.shoutId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// PATCH reaction
router.patch('/:id/react', async (req, res) => {
  try {
    const { userId, reaction } = req.body;
    const shout = await Shout.findOne({ id: req.params.id });
    if (!shout) return res.status(404).json({error: 'Not found'});
    
    // Mongoose documents need to be modified carefully if it's a mixed type, 
    // or we can just replace the whole object
    let userReactions = shout.userReactions || {};
    if (userReactions[userId] === reaction) {
      delete userReactions[userId];
    } else {
      userReactions[userId] = reaction;
    }
    
    await Shout.findOneAndUpdate({ id: req.params.id }, { $set: { userReactions: userReactions } });
    res.json({ success: true, userReactions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

