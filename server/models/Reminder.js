const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  dueTime: { type: Number, required: true },
  isNotified: { type: Boolean, default: false },
  createdAt: { type: Number, default: () => Date.now() }
});

reminderSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Reminder', reminderSchema);
