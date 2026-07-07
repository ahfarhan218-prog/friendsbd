const mongoose = require('mongoose');

const quizSubmissionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: String,
  quizId: String,
  quizTitle: String,
  score: Number,
  timestamp: { type: Number, default: Date.now }
});

module.exports = mongoose.model('QuizSubmission', quizSubmissionSchema, 'quiz_submissions');