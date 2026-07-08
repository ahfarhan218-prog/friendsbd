const mongoose = require('mongoose');
const Channel = require('./models/Channel');

const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/friendsbd";

mongoose.connect(mongoURI)
  .then(async () => {
    console.log('MongoDB connected');
    const channels = [
      {
        channelId: 'somoy_tv',
        name: 'Somoy TV',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/87/Somoy_TV.svg/1200px-Somoy_TV.svg.png',
        streamUrl: 'https://somoytv-live.akamaized.net/hls/live/2065842/somoytv/master.m3u8',
        category: ['BD', 'News'],
        isPremium: false
      },
      {
        channelId: 'jamuna_tv',
        name: 'Jamuna TV',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Jamuna_Television_Logo.svg/1200px-Jamuna_Television_Logo.svg.png',
        streamUrl: 'https://jamuna-live.akamaized.net/hls/live/2085348/jamuna/master.m3u8',
        category: ['BD', 'News'],
        isPremium: false
      },
      {
        channelId: 'channel_i',
        name: 'Channel i',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/Channel_i_logo.svg/1200px-Channel_i_logo.svg.png',
        streamUrl: 'https://ts-live.akamaized.net/hls/live/2096758/channel-i/master.m3u8',
        category: ['BD', 'Entertainment'],
        isPremium: false
      },
      {
        channelId: 'atn_bangla',
        name: 'ATN Bangla',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/ATN_Bangla.png',
        streamUrl: 'https://atn-live.akamaized.net/hls/live/2096759/atn-bangla/master.m3u8',
        category: ['BD', 'Entertainment'],
        isPremium: false
      },
      {
        channelId: 'star_sports_1',
        name: 'Star Sports 1',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Star_Sports_1.png',
        streamUrl: 'https://dai.google.com/linear/hls/event/B0R9fK9vSPec6E8Q0n0c2g/master.m3u8',
        category: ['Sports', 'Premium', 'International'],
        isPremium: true
      },
      {
        channelId: 'tsports',
        name: 'T Sports',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4b/T_Sports_logo.svg/1200px-T_Sports_logo.svg.png',
        streamUrl: 'https://dai.google.com/linear/hls/event/tsports/master.m3u8',
        category: ['Sports', 'BD', 'Premium'],
        isPremium: true
      },
      {
        channelId: 'discovery',
        name: 'Discovery Channel',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Discovery_Channel_2019_logo.svg/1200px-Discovery_Channel_2019_logo.svg.png',
        streamUrl: 'https://dai.google.com/linear/hls/event/discovery/master.m3u8',
        category: ['Nature', 'Infotainment', 'International'],
        isPremium: false
      },
      {
        channelId: 'chutti_tv',
        name: 'Chutti TV (Kids)',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/Chutti_TV_logo.svg/1200px-Chutti_TV_logo.svg.png',
        streamUrl: 'https://dai.google.com/linear/hls/event/chutti/master.m3u8',
        category: ['Kids', 'Regional'],
        isPremium: false
      }
    ];

    for (const c of channels) {
      await Channel.findOneAndUpdate({ channelId: c.channelId }, c, { upsert: true, new: true });
      console.log(`Upserted channel: ${c.name}`);
    }
    console.log('Seed completed successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
