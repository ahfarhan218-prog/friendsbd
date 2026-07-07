const mongoose = require('mongoose');
const Channel = require('./models/Channel');

const uri = 'mongodb://localhost:27017/friends_bd';
mongoose.connect(uri).then(async () => {
  const result = await Channel.updateMany(
    {}, 
    { $set: { streamUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8' } }
  );
  console.log('Updated ' + result.modifiedCount + ' channels to working stream URL.');
  process.exit();
});
