const mongoose = require('mongoose');

const monsterSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  zoneName: { type: String, required: true },
  startTime: { type: Number, required: true },
  endTime: { type: Number, required: true },
  isCompleted: { type: Boolean, default: false },
  rewardData: {
    monsterName: { type: String },
    rarity: { type: String },
    apReward: { type: Number },
    plussesReward: { type: Number }
  }
});

module.exports = mongoose.model('MonsterSession', monsterSessionSchema);
