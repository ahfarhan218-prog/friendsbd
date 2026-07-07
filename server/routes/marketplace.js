const express = require('express');
const router = express.Router();
const MarketplaceItem = require('../models/MarketplaceItem');
const User = require('../models/User');

// GET /api/marketplace - List active listings
router.get('/', async (req, res) => {
  try {
    const filter = { status: 'active' };
    if (req.query.sellerId) filter.sellerId = req.query.sellerId;
    if (req.query.type) filter.type = req.query.type;
    const items = await MarketplaceItem.find(filter).sort({ createdAt: -1 }).limit(50).lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/marketplace - Create listing
router.post('/', async (req, res) => {
  try {
    const { sellerId, sellerName, title, description, price, currency, type } = req.body;
    if (!sellerId || !title || !price) return res.status(400).json({ error: 'sellerId, title, and price required.' });
    const item = new MarketplaceItem({
      id: `mkt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      sellerId, sellerName, title, description, price, currency: currency || 'goldenCoins',
      type: type || 'item', status: 'active', createdAt: Date.now()
    });
    await item.save();
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/marketplace/:id/buy - Buy item
router.post('/:id/buy', async (req, res) => {
  try {
    const { buyerId } = req.body;
    if (!buyerId) return res.status(400).json({ error: 'buyerId required.' });
    const item = await MarketplaceItem.findOne({ id: req.params.id, status: 'active' });
    if (!item) return res.status(404).json({ error: 'Item not found or sold.' });
    if (item.sellerId === buyerId) return res.status(400).json({ error: 'Cannot buy your own item.' });

    const buyer = await User.findOne({ id: buyerId });
    const seller = await User.findOne({ id: item.sellerId });
    if (!buyer || !seller) return res.status(404).json({ error: 'User not found.' });

    const currencyMap = { goldenCoins: 'goldenCoins', silverPoints: 'silverPoints', ap: 'balance_ap', taka: 'balance_taka' };
    const currencyField = currencyMap[item.currency] || item.currency;
    if ((buyer[currencyField] || 0) < item.price) return res.status(400).json({ error: 'Insufficient balance.' });

    await User.findOneAndUpdate({ id: buyerId }, { $inc: { [currencyField]: -item.price } });
    await User.findOneAndUpdate({ id: item.sellerId }, { $inc: { [currencyField]: item.price } });
    await MarketplaceItem.findOneAndUpdate({ id: item.id }, { $set: { status: 'sold', buyerId, soldAt: Date.now() } });

    res.json({ success: true, message: 'Purchase successful!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/marketplace/:id - Cancel listing
router.delete('/:id', async (req, res) => {
  try {
    const item = await MarketplaceItem.findOneAndUpdate(
      { id: req.params.id, status: 'active' },
      { $set: { status: 'cancelled' } }
    );
    if (!item) return res.status(404).json({ error: 'Item not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
