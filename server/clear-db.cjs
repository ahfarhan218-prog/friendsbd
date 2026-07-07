const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/friendsbd').then(async () => {
    try {
        const collections = await mongoose.connection.db.collections();
        for (let collection of collections) {
            console.log(`Dropping collection: ${collection.collectionName}`);
            await collection.drop();
        }
        console.log('✅ All demo data deleted successfully!');
    } catch (err) {
        console.error('Error deleting data:', err);
    } finally {
        process.exit(0);
    }
});
