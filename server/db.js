const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/friends_bd';
  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log('✅ MongoDB connected:', uri.replace(/\/\/.*@/, '//<credentials>@'));
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
