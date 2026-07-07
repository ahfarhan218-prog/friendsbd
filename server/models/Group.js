const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  description: String,
  avatar: String,
  ownerId: String,
  ownerName: String,
  members: [{ userId: String, name: String, role: { type: String, enum: ['member', 'admin', 'owner'], default: 'member' }, joinedAt: Number }],
  isPublic: { type: Boolean, default: true },
  createdAt: { type: Number, default: () => Date.now() }
}, { _id: false });

module.exports = mongoose.model('Group', groupSchema);
