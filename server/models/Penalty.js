const mongoose = require('mongoose');

const penaltySchema = new mongoose.Schema({
  match_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tournament_type: { type: String, enum: ['tournament', 'vcf'], required: true },
  deduction_type: { type: String, enum: ['rp', 'plusses'], required: true },
  amount_deducted: { type: Number, required: true, min: 1 },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Penalty', penaltySchema);
