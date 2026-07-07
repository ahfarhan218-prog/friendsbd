const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // 'golden_coin', 'silver_coin', 'color_ball'
  active: { type: Boolean, default: false },
  spawnTime: { type: Number, default: 0 },
  claimTime: { type: Number, default: 0 },
  claimedBy: String,
  claimedByName: String,
  claimedByAvatar: String,
  nextSpawnTime: Number
}, { _id: false });

module.exports = mongoose.model('Game', gameSchema);
