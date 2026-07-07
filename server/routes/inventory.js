const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');

// GET /api/inventory/:userId - Get user inventory
router.get('/:userId', async (req, res) => {
  try {
    const items = await Inventory.find({ userId: req.params.userId }).lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/inventory - Add item to inventory
router.post('/', async (req, res) => {
  try {
    const { userId, itemId, itemName, itemType, quantity } = req.body;
    if (!userId || !itemId) return res.status(400).json({ error: 'userId and itemId required.' });

    const existing = await Inventory.findOne({ userId, itemId });
    if (existing) {
      await Inventory.findOneAndUpdate({ userId, itemId }, { $inc: { quantity: quantity || 1 } });
      return res.json({ success: true, inventory: await Inventory.findOne({ userId, itemId }).lean() });
    }

    const entry = new Inventory({
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId, itemId, itemName, itemType: itemType || 'item',
      quantity: quantity || 1, acquiredAt: Date.now()
    });
    await entry.save();
    res.json({ success: true, inventory: entry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/inventory/:id/equip - Toggle equip status
router.patch('/:id/equip', async (req, res) => {
  try {
    const entry = await Inventory.findOne({ id: req.params.id });
    if (!entry) return res.status(404).json({ error: 'Item not found.' });
    await Inventory.findOneAndUpdate({ id: req.params.id }, { $set: { equipped: !entry.equipped } });
    res.json({ success: true, equipped: !entry.equipped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
