const mongoose = require('mongoose');

const visitorMessageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  profileUserId: { type: String, required: true, index: true },
  authorId: { type: String, required: true },
  authorName: String,
  authorAvatar: String,
  message: String,
  createdAt: { type: Number, default: () => Date.now() }
}, { _id: false });

module.exports = mongoose.model('VisitorMessage', visitorMessageSchema);
