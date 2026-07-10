const mongoose = require('mongoose');

const clanWarSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  clanId1: { type: String, required: true },
  clanId2: { type: String, required: true },
  clanName1: String,
  clanName2: String,
  status: { type: String, enum: ['pending', 'active', 'completed'], default: 'pending' },
  type: { type: String, enum: ['cricket', 'quiz', 'coin_grab'], default: 'cricket' },
  score1: { type: Number, default: 0 },
  score2: { type: Number, default: 0 },
  winnerId: String,
  xpPool: { type: Number, default: 500 },
  startedAt: Number,
  endedAt: Number,
  createdBy: String,
  createdAt: { type: Number, default: () => Date.now() }
});

module.exports = mongoose.model('ClanWar', clanWarSchema);
