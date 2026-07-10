const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  referrerId: { type: String, required: true, index: true },
  referredId: { type: String, required: true, unique: true },
  referredName: String,
  status: { type: String, enum: ['pending', 'verified', 'rewarded'], default: 'pending' },
  rewardGiven: { type: Boolean, default: false },
  createdAt: { type: Number, default: () => Date.now() }
}, { _id: false });

module.exports = mongoose.model('Referral', referralSchema);
