const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  convId: { type: String, required: true, index: true },
  senderId: String,
  senderName: String,
  senderAvatar: String,
  text: String,
  timestamp: { type: Number, index: true },
  isRead: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  reactions: { type: Map, of: String, default: {} },
  seenBy: [String],
  isEdited: Boolean
}, { _id: false });

messageSchema.index({ convId: 1, id: 1 }, { unique: true });

module.exports = mongoose.model('Message', messageSchema);
