const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Shout = require('../models/Shout');
const { ForumThread } = require('../models/Forum');

// GET /api/search?q=keyword&type=users|shouts|forum|all
router.get('/', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const type = req.query.type || 'all';
    if (!q) return res.json({ users: [], shouts: [], forum: [] });

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const results = {};

    if (type === 'all' || type === 'users') {
      results.users = await User.find({
        $or: [{ name: regex }, { username: regex }, { email: regex }]
      }).limit(10).select('id name username avatar level points isOnline');
    }

    if (type === 'all' || type === 'shouts') {
      results.shouts = await Shout.find({
        $or: [{ content: regex }, { authorName: regex }]
      }).sort({ createdAt: -1 }).limit(10).select('id content authorName authorAvatar createdAt');
    }

    if (type === 'all' || type === 'forum') {
      results.forum = await ForumThread.find({
        $or: [{ title: regex }, { content: regex }, { authorName: regex }]
      }).sort({ createdAt: -1 }).limit(10).select('id title content authorName createdAt categoryId');
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
