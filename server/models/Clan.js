const mongoose = require('mongoose');

const clanSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  tag: { type: String, required: true, unique: true },
  description: String,
  avatar: String,
  leaderId: { type: String, required: true },
  leaderName: String,
  members: [{
    userId: String,
    name: String,
    role: { type: String, enum: ['member', 'co-leader', 'leader'], default: 'member' },
    joinedAt: { type: Number, default: () => Date.now() }
  }],
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  isOpen: { type: Boolean, default: true },
  createdAt: { type: Number, default: () => Date.now() }
}, { _id: false });

module.exports = mongoose.model('Clan', clanSchema);
