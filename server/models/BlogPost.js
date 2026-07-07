const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  authorId: String,
  authorName: String,
  authorAvatar: String,
  title: String,
  content: String,
  excerpt: String,
  tags: [String],
  status: { type: String, enum: ['draft', 'published'], default: 'published' },
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  createdAt: { type: Number, default: () => Date.now() },
  publishedAt: Number,
  updatedAt: Number
}, { _id: false });

module.exports = mongoose.model('BlogPost', blogPostSchema);
