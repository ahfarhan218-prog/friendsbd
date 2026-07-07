const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  userName: { type: String },
  userAvatar: { type: String },
  mediaUrl: { type: String }, // Now optional
  mediaType: { type: String, enum: ['image', 'video', 'text'], default: 'image' },
  content: { type: String }, // text/caption
  backgroundColor: { type: String, default: '#000000' }, // for text-only stories
  viewedBy: [{ type: String }],
  reactions: [{
    emoji: { type: String },
    userId: { type: String },
    userName: { type: String },
    userAvatar: { type: String },
    timestamp: { type: Number, default: () => Date.now() }
  }],
  createdAt: { type: Date, default: Date.now, expires: 86400 } // TTL Index: Expires after 24 hours
});

module.exports = mongoose.model('Story', storySchema);
