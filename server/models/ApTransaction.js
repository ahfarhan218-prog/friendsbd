const mongoose = require('mongoose');

const apTransactionSchema = new mongoose.Schema({
  user_id: { type: String, index: true },
  amount_delta: Number,
  action_type: String,
  timestamp: { type: Number, default: () => Date.now() }
});

const metaSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // e.g. 'user_counter'
  count: { type: Number, default: 0 }
}, { _id: false });

const ApTransaction = mongoose.model('ApTransaction', apTransactionSchema);
const Meta = mongoose.model('Meta', metaSchema);

module.exports = { ApTransaction, Meta };
