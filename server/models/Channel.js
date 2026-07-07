const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  channelId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  logoUrl: { type: String, default: '' },
  streamUrl: { type: String, required: true }, // The secure HLS/DASH url
  category: [{ type: String }],
  isPremium: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Channel', channelSchema);
