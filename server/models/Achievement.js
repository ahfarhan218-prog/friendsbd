const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  achievementId: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  icon: String,
  unlockedAt: { type: Number, default: () => Date.now() }
});

achievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

achievementSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Achievement', achievementSchema);
