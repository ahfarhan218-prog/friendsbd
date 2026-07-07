const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  reporterId: String,
  reporterName: String,
  targetId: String,
  targetName: String,
  targetType: { type: String, enum: ['user', 'shout', 'forum_post', 'forum_thread', 'message'], default: 'user' },
  reason: String,
  details: String,
  status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' },
  resolvedBy: String,
  resolvedAt: Number,
  createdAt: { type: Number, default: () => Date.now() }
}, { _id: false });

module.exports = mongoose.model('Report', reportSchema);
