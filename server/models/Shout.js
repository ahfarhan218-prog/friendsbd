const mongoose = require('mongoose');

const shoutReplySchema = new mongoose.Schema({
  id: String,
  userId: String,
  userName: String,
  userAvatar: String,
  content: String,
  timestamp: Number
}, { _id: false });

const shoutSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  displayId: Number,
  user: String,
  username: String,
  userId: String,
  avatar: String,
  content: String,
  time: String,
  timestamp: { type: Number, index: true },
  userReactions: { type: Map, of: String, default: {} },
  replies: [shoutReplySchema],
  isPremium: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  isClosed: { type: Boolean, default: false },
  pinExpiry: Number,
  isQuiz: Boolean
}, { _id: false });

module.exports = mongoose.model('Shout', shoutSchema);
