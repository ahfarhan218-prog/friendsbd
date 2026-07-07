const mongoose = require('mongoose');

const reputationLogSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  action: { type: String, required: true },
  points: { type: Number, required: true },
  source: String,
  sourceId: String,
  description: String,
  createdAt: { type: Number, default: () => Date.now() }
});

reputationLogSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('ReputationLog', reputationLogSchema);
