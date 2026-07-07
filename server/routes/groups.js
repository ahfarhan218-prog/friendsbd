const express = require('express');
const router = express.Router();
const Group = require('../models/Group');

router.get('/', async (req, res) => {
  try {
    const groups = await Group.find({}).sort({ createdAt: -1 }).lean();
    res.json(groups);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, avatar, ownerId, ownerName, isPublic } = req.body;
    if (!name || !ownerId) return res.status(400).json({ error: 'name and ownerId required.' });
    const group = new Group({
      id: `grp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name, description, avatar, ownerId, ownerName,
      members: [{ userId: ownerId, name: ownerName, role: 'owner', joinedAt: Date.now() }],
      isPublic: isPublic !== false, createdAt: Date.now()
    });
    await group.save();
    res.json({ success: true, group });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/join', async (req, res) => {
  try {
    const { userId, userName } = req.body;
    const group = await Group.findOne({ id: req.params.id });
    if (!group) return res.status(404).json({ error: 'Group not found.' });
    if (!group.isPublic) return res.status(403).json({ error: 'Group is private.' });
    if (group.members.find(m => m.userId === userId)) return res.status(409).json({ error: 'Already a member.' });
    group.members.push({ userId, name: userName, role: 'member', joinedAt: Date.now() });
    await group.save();
    res.json({ success: true, group });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
