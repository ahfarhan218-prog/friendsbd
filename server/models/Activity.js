const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  time: String,
  username: String,
  msg: String,
  isTopic: Boolean,
  topicTitle: String,
  timestamp: { type: Number, index: true }
}, { _id: false });

module.exports = mongoose.model('Activity', activitySchema);
