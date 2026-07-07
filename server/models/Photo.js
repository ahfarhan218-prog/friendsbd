const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  url: String,
  caption: String,
  uploadedBy: String,
  likes: { type: Number, default: 0 },
  timestamp: { type: Number, index: true }
}, { _id: false });

module.exports = mongoose.model('Photo', photoSchema);
