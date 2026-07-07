const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  participantIds: [{ type: String, index: true }],
  lastMessage: String,
  lastTimestamp: { type: Number, index: true },
  isGroup: { type: Boolean, default: false },
  groupName: String,
  icon: String,
}, { _id: false, strict: false }); // strict: false allows dynamic unread_{userId} fields

module.exports = mongoose.model('Conversation', conversationSchema);
