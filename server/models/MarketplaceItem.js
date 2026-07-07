const mongoose = require('mongoose');

const marketplaceItemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sellerId: String,
  sellerName: String,
  title: String,
  description: String,
  price: Number,
  currency: { type: String, enum: ['goldenCoins', 'silverPoints', 'ap', 'taka'], default: 'goldenCoins' },
  type: { type: String, enum: ['badge', 'item', 'service', 'collectible'], default: 'item' },
  status: { type: String, enum: ['active', 'sold', 'cancelled'], default: 'active' },
  buyerId: String,
  createdAt: { type: Number, default: () => Date.now() },
  soldAt: Number
}, { _id: false });

module.exports = mongoose.model('MarketplaceItem', marketplaceItemSchema);
