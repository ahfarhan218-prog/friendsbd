const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  action: { type: String, required: true },
  targetId: String,
  targetType: String,
  deletedBy: String,
  deletedByName: String,
  details: String,
  timestamp: { type: Number, default: Date.now }
});

module.exports = mongoose.model('AdminLog', adminLogSchema);
