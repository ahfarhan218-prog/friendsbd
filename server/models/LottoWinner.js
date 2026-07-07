const mongoose = require('mongoose');

const lottoWinnerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  uid: String,
  username: String,
  prize_won: String,
  created_at: { type: Number, default: Date.now }
});

module.exports = mongoose.model('LottoWinner', lottoWinnerSchema, 'lotto_winners');