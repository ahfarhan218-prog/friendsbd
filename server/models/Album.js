const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: String,
  title: String,
  description: String,
  photos: [{ url: String, caption: String, uploadedAt: Number }],
  coverUrl: String,
  createdAt: { type: Number, default: () => Date.now() }
}, { _id: false });

module.exports = mongoose.model('Album', albumSchema);
