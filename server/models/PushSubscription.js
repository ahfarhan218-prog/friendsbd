const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  endpoint: { type: String, required: true },
  keys: {
    p256dh: String,
    auth: String
  },
  userAgent: String,
  createdAt: { type: Number, default: () => Date.now() }
}, { _id: false });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
