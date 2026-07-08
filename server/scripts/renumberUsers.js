require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const { Meta } = require('../models/ApTransaction');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/friends_bd';

async function renumberUsers() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Connected to MongoDB');

    const users = await User.find({}).sort({ createdAt: 1 }).lean();
    console.log(`📊 Found ${users.length} users`);

    let count = 0;
    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      const newId = i + 1;
      if (u.userId !== newId) {
        await User.updateOne({ id: u.id }, { $set: { userId: newId } });
        count++;
      }
    }

    console.log(`✅ Renumbered ${count} users`);

    await Meta.updateOne(
      { id: 'user_counter' },
      { $set: { count: users.length } },
      { upsert: true }
    );
    console.log(`✅ Counter set to ${users.length}`);

    await mongoose.disconnect();
    console.log('✅ Done');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

renumberUsers();
