const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'event', 'maintenance'], default: 'info' },
  authorId: String,
  authorName: String,
  active: { type: Boolean, default: true },
  createdAt: { type: Number, default: () => Date.now() },
  expiresAt: Number
});

announcementSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Announcement', announcementSchema);
