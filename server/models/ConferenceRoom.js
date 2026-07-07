const mongoose = require('mongoose');

const conferenceRoomSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  creatorId: { type: String, required: true },
  creatorName: { type: String, required: true },
  members: { type: [String], default: [] },
  invites: { type: [String], default: [] },
  createdAt: { type: Number, default: Date.now }
}, { _id: false });

module.exports = mongoose.model('ConferenceRoom', conferenceRoomSchema);
