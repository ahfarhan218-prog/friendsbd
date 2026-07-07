const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  id: { type: String, required: true },
  userId: { type: String, required: true, index: true }, // owner of the notification
  senderId: String,
  senderName: String,
  senderAvatar: String,
  type: { type: String, enum: ['MENTION', 'LIKE', 'REWARD', 'FRIEND_REQ', 'SYSTEM', 'REACTION', 'GAME_ALERT', 'MESSAGE'] },
  message: String,
  timestamp: { type: Number, index: true },
  isRead: { type: Boolean, default: false },
  link: String,
  shoutId: String,
  convId: String
}, { _id: false });

notificationSchema.index({ userId: 1, id: 1 }, { unique: true });

module.exports = mongoose.model('Notification', notificationSchema);
