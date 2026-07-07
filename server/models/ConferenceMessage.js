const mongoose = require('mongoose');

const conferenceMessageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  roomId: { type: String, required: true, index: true },
  senderId: String,
  senderName: String,
  senderAvatar: String,
  text: String,
  timestamp: { type: Number, index: true },
  isPinned: { type: Boolean, default: false },
  reactions: { type: Map, of: String, default: {} },
  seenBy: [String],
  isEdited: { type: Boolean, default: false }
}, { _id: false });

conferenceMessageSchema.index({ roomId: 1, id: 1 }, { unique: true });

module.exports = mongoose.model('ConferenceMessage', conferenceMessageSchema);
