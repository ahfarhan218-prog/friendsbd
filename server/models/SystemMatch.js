const mongoose = require('mongoose');

const systemMatchSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  phase: { type: String, enum: ['setup', 'live', 'innings_break', 'complete'], default: 'setup' },
  team1Name: { type: String, default: 'Team 1' },
  team2Name: { type: String, default: 'Team 2' },
  winner: { type: String, default: null },
  match: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Number },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SystemMatch', systemMatchSchema);
