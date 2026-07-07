const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: String,
  itemId: String,
  itemName: String,
  itemType: { type: String, enum: ['badge', 'item', 'collectible', 'consumable'], default: 'item' },
  quantity: { type: Number, default: 1 },
  acquiredAt: { type: Number, default: () => Date.now() },
  equipped: { type: Boolean, default: false }
}, { _id: false });

module.exports = mongoose.model('Inventory', inventorySchema);
