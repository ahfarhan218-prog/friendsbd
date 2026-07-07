const mongoose = require('mongoose');

const lineupSchema = new mongoose.Schema({
  match_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
  team_id: { type: String, required: true, index: true },
  captain_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  batting_order: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  bowling_order: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  backup_bowler_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  choice: { type: String, enum: ['bat', 'ball'], required: true },
  late_submission: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Ensure a team can only have one lineup per match
lineupSchema.index({ match_id: 1, team_id: 1 }, { unique: true });

module.exports = mongoose.model('Lineup', lineupSchema);
