const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { ForumPost, ForumThread } = require('../models/Forum');
const Shout = require('../models/Shout');


// --- GET /api/stats/overview ---
router.get('/overview', async (req, res) => {
  try {
    const today = new Date();
    const dobString = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

    const facetPipeline = {
      totalUsers: [{ $count: "count" }],
      males: [{ $match: { gender: "Male" } }, { $count: "count" }],
      females: [{ $match: { gender: "Female" } }, { $count: "count" }],
      staff: [{ $match: { $or: [{ role: { $in: ['admin', 'moderator'] } }, { user_role: { $in: ['admin', 'staff'] } }] } }, { $count: "count" }],
      verified: [{ $match: { isVerified: true } }, { $count: "count" }],
      premium: [{ $match: { isPremium: true } }, { $count: "count" }],
      banned: [{ $match: { isBanned: true } }, { $count: "count" }],
      shoutBanned: [{ $match: { isShadowBanned: true } }, { $count: "count" }],
      // Assume shadowBanned is shoutBanned and inbox banned isn't strictly tracked or we use ghostMode
      inboxBanned: [{ $match: { isShadowBanned: true } }, { $count: "count" }], 
      birthdays: [{ $match: { dob: { $regex: new RegExp(`^${dobString}|${dobString}$`, 'i') } } }, { $count: "count" }]
    };

    const result = await User.aggregate([{ $facet: facetPipeline }]);
    
    // Helper to safely extract count
    const getCount = (arr) => (arr && arr[0] ? arr[0].count : 0);

    const stats = {
      totalUsers: getCount(result[0].totalUsers),
      males: getCount(result[0].males),
      females: getCount(result[0].females),
      staff: getCount(result[0].staff),
      verified: getCount(result[0].verified),
      premium: getCount(result[0].premium),
      banned: getCount(result[0].banned),
      shoutBanned: getCount(result[0].shoutBanned),
      inboxBanned: getCount(result[0].inboxBanned),
      birthdays: getCount(result[0].birthdays)
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats overview:', error);
    res.status(500).json({ error: 'Server error fetching stats.' });
  }
});

// --- GET /api/stats/list ---
router.get('/list', async (req, res) => {
  try {
    const { type, limit = 20, skip = 0 } = req.query;
    const l = parseInt(limit, 10);
    const s = parseInt(skip, 10);

    const userProjection = {
      id: 1, name: 1, username: 1, avatar: 1, isVerified: 1, isPremium: 1, role: 1
    };

    if (type === 'longest-online') {
      const users = await User.find({ totalOnlineTime: { $gt: 0 } })
        .sort({ totalOnlineTime: -1 })
        .skip(s).limit(l)
        .select({ ...userProjection, totalOnlineTime: 1 });
      return res.json({
        type,
        data: users.map(u => ({ ...u.toObject(), metricValue: u.totalOnlineTime }))
      });
    }

    if (type === 'golden-coins') {
      const users = await User.find({ goldenCoins: { $gt: 0 } })
        .sort({ goldenCoins: -1 })
        .skip(s).limit(l)
        .select({ ...userProjection, goldenCoins: 1 });
      return res.json({
        type,
        data: users.map(u => ({ ...u.toObject(), metricValue: u.goldenCoins }))
      });
    }

    if (type === 'account-balance') {
      const users = await User.find({ balance_taka: { $gt: 0 } })
        .sort({ balance_taka: -1 })
        .skip(s).limit(l)
        .select({ ...userProjection, balance_taka: 1 });
      return res.json({
        type,
        data: users.map(u => ({ ...u.toObject(), metricValue: u.balance_taka }))
      });
    }

    if (type === 'top-posters') {
      // Aggregate from ForumPost
      const posters = await ForumPost.aggregate([
        { $match: { is_deleted: false, isSystemPost: false } },
        { $group: { _id: "$authorId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $skip: s },
        { $limit: l }
      ]);
      const userIds = posters.map(p => p._id);
      const users = await User.find({ id: { $in: userIds } }).select(userProjection);
      const data = posters.map(p => {
        const u = users.find(user => user.id === p._id);
        return { ...(u ? u.toObject() : { id: p._id, name: 'Unknown' }), metricValue: p.count };
      });
      return res.json({ type, data });
    }

    if (type === 'top-shouters') {
      const shouters = await Shout.aggregate([
        { $group: { _id: "$userId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $skip: s },
        { $limit: l }
      ]);
      const userIds = shouters.map(p => p._id);
      const users = await User.find({ id: { $in: userIds } }).select(userProjection);
      const data = shouters.map(p => {
        const u = users.find(user => user.id === p._id);
        return { ...(u ? u.toObject() : { id: p._id, name: 'Unknown' }), metricValue: p.count };
      });
      return res.json({ type, data });
    }

    if (type === 'top-topics') {
      const topics = await ForumThread.aggregate([
        { $group: { _id: "$authorId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $skip: s },
        { $limit: l }
      ]);
      const userIds = topics.map(p => p._id);
      const users = await User.find({ id: { $in: userIds } }).select(userProjection);
      const data = topics.map(p => {
        const u = users.find(user => user.id === p._id);
        return { ...(u ? u.toObject() : { id: p._id, name: 'Unknown' }), metricValue: p.count };
      });
      return res.json({ type, data });
    }
    
    if (type === 'top-profile-viewers') {
      // Assuming profile_views or falling back to reputation points
      const users = await User.find({ total_rp: { $gt: 0 } })
        .sort({ total_rp: -1 })
        .skip(s).limit(l)
        .select({ ...userProjection, total_rp: 1 });
      return res.json({
        type,
        data: users.map(u => ({ ...u.toObject(), metricValue: u.total_rp }))
      });
    }

    // Role-based and demographic stats lists
    if (['staff', 'verified', 'premium', 'banned', 'shout-banned', 'inbox-banned', 'all-members', 'males', 'females', 'birthdays'].includes(type)) {
      let query = {};
      if (type === 'staff') query = { $or: [{ role: { $in: ['admin', 'moderator'] } }, { user_role: { $in: ['admin', 'staff'] } }] };
      else if (type === 'verified') query = { isVerified: true };
      else if (type === 'premium') query = { isPremium: true };
      else if (type === 'banned') query = { isBanned: true };
      else if (type === 'shout-banned') query = { isShadowBanned: true };
      else if (type === 'inbox-banned') query = { isShadowBanned: true };
      else if (type === 'all-members') query = {};
      else if (type === 'males') query = { gender: 'Male' };
      else if (type === 'females') query = { gender: 'Female' };
      else if (type === 'birthdays') {
        const today = new Date();
        const dobString = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        query = { dob: { $regex: new RegExp(`^${dobString}|${dobString}$`, 'i') } };
      }

      const users = await User.find(query)
        .sort({ points: -1 })
        .skip(s).limit(l)
        .select(userProjection);
      return res.json({
        type,
        data: users.map(u => ({ ...u.toObject(), metricValue: null })) // No specific metric, just boolean presence
      });
    }

    return res.status(400).json({ error: 'Invalid stats type requested' });
  } catch (error) {
    console.error('Error fetching stats list:', error);
    res.status(500).json({ error: 'Server error fetching list.' });
  }
});

module.exports = router;
