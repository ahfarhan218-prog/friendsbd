const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/friends_bd';
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log('✅ MongoDB connected:', uri.replace(/\/\/.*@/, '//<credentials>@'));
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️ Server will continue without database. Retrying in 10s...');
    setTimeout(connectDB, 10000);
  }
};

module.exports = connectDB;
