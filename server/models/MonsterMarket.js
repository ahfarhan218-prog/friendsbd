const mongoose = require('mongoose');

const monsterMarketSchema = new mongoose.Schema({
  sellerId: { type: String, required: true },
  monsterName: { type: String, required: true },
  rarity: { type: String, required: true },
  element: { type: String, required: true },
  pricePlusses: { type: Number, required: true },
  createdAt: { type: Number, default: () => Date.now() }
});

module.exports = mongoose.model('MonsterMarket', monsterMarketSchema);
