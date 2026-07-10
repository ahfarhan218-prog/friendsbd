const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: String,
  description: String,
  type: { type: String, enum: ['tournament', 'quiz', 'giveaway', 'meetup', 'other'], default: 'other' },
  prize: String,
  date: Number,
  endDate: Number,
  maxParticipants: Number,
  participants: [String],
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' },
  createdBy: String,
  createdAt: { type: Number, default: () => Date.now() }
});

module.exports = mongoose.model('Event', eventSchema);
