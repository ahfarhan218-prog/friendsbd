const mongoose = require('mongoose');

const ballLogSchema = new mongoose.Schema({
  match_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
  innings: { type: Number, required: true, enum: [1, 2] },
  over_number: { type: Number, required: true },
  ball_number: { type: Number, required: true },
  batsman_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  bowler_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  batsman_digit: { type: Number, required: true, min: 0, max: 6 },
  bowler_digit: { type: Number, required: true, min: 0, max: 6 },
  runs_scored: { type: Number, required: true },
  is_wicket: { type: Boolean, default: false },
  out_type: { type: String, enum: ['match', 'wrong_post', 'timeout'], default: null },
  created_at: { type: Date, default: Date.now }
});

// Frequent query for current innings timeline
ballLogSchema.index({ match_id: 1, innings: 1 });

module.exports = mongoose.model('BallLog', ballLogSchema);
