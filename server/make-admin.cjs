const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/friendsbd').then(async () => {
    const user = await mongoose.connection.collection('users').findOne({});
    if (user) {
        await mongoose.connection.collection('users').updateOne(
            { _id: user._id },
            { $set: { role: 'admin', isPremium: true, goldenCoins: 100 } }
        );
        console.log('Made user admin:', user.username);
    } else {
        console.log('No users found in db.');
    }
    process.exit(0);
});
