const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  current_innings: { type: Number, default: 1, enum: [1, 2] },
  batting_team_id: { type: String, required: true },
  bowling_team_id: { type: String, required: true },
  target: { type: Number, default: null },
  total_runs: { type: Number, default: 0 },
  total_wickets: { type: Number, default: 0, max: 10 },
  total_overs: { type: Number, default: 0.0 }, // e.g. 10.5
  max_overs: { type: Number, required: true },
  extras: { type: Number, default: 0 },
  current_batsman_index: { type: Number, default: 1 },
  current_bowler_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  backup_used: { type: Boolean, default: false },
  backup_privilege_lost: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'completed', 'walkover'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Match', matchSchema);
