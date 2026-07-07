const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['standard', 'live'], default: 'standard' },
  rewardAp: { type: Number, default: 50 },
  isPinned: { type: Boolean, default: false },
  isClosed: { type: Boolean, default: false },
  questions: [{
    q: String,
    options: [String],
    correct: Number
  }],
  creatorId: String,
  creatorName: String,
  creatorAvatar: String,
  timestamp: { type: Number, default: Date.now }
});

module.exports = mongoose.model('Quiz', quizSchema, 'quizzes');