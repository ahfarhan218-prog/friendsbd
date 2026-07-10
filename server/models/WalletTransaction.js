const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ['deposit', 'withdrawal', 'purchase', 'reward', 'transfer'], required: true },
  method: { type: String, enum: ['bkash', 'nagad', 'rocket', 'system', 'gift'], default: 'system' },
  amount: { type: Number, required: true },
  currency: { type: String, enum: ['taka', 'ap', 'goldenCoins'], default: 'taka' },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  reference: String,
  senderId: String,
  senderName: String,
  note: String,
  createdAt: { type: Number, default: () => Date.now() }
}, { _id: false });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
