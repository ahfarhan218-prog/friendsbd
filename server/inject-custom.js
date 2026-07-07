const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/friends_bd').then(async () => {
  const Channel = require('./models/Channel');
  
  const channels = [
    { name: 'Doraemon', streamUrl: 'https://live20.bozztv.com/giatvplayout7/giatv-209902/tracks-v1a1/mono.ts.m3u8', isPremium: true, category: ['Kids'] },
    { name: 'Gopal Bhar', streamUrl: 'https://live20.bozztv.com/giatvplayout7/giatv-209611/tracks-v1a1/mono.ts.m3u8', isPremium: true, category: ['Kids'] },
    { name: 'Motu Patlu', streamUrl: 'https://live20.bozztv.com/giatvplayout7/giatv-209622/tracks-v1a1/mono.ts.m3u8', isPremium: true, category: ['Kids'] },
    { name: 'BPL 2026', streamUrl: 'https://live.mncdn.shop/fc95d30e-5323-4c12-bb38-7a1e3f04acc2/index.m3u8', isPremium: true, category: ['Sports'] },
    { name: 'Goldmines Movies', streamUrl: 'https://cdn-2.pishow.tv/live/1461/master.m3u8', isPremium: true, category: ['Movies'] },
    { name: 'TNS Sports-3', streamUrl: 'https://7pal.short.gy/tntspts3', isPremium: false, category: ['Sports'] },
    { name: 'Star Jalsha HD', streamUrl: 'https://ultrashort.info/5yLqax', isPremium: false, category: ['BD'] },
    { name: 'MK Six', streamUrl: 'https://cdn-3.pishow.tv/live/1253/master.m3u8', isPremium: false, category: ['Movies'] },
    { name: 'TRT 2 HD', streamUrl: 'https://tv-trt2.medya.trt.com.tr/master.m3u8', isPremium: false, category: ['All'] },
    { name: 'ZB Kartun', streamUrl: 'https://server.zillarbarta.com/zbcatun/tracks-v1a1/mono.ts.m3u8', isPremium: false, category: ['Kids'] },
    { name: 'ZB Cinema', streamUrl: 'https://server.zillarbarta.com/ZBCINEMA/tracks-v1a1/mono.ts.m3u8', isPremium: false, category: ['Movies'] },
    { name: '8X music', streamUrl: 'https://epiconvh.akamaized.net/live/showbox/master.m3u8', isPremium: false, category: ['Music'] },
    { name: 'Cowboy tv', streamUrl: 'https://amg17292-amg17292c1-distrotv-us-4170.playouts.now.amagi.tv/playlist/amg17292-tetonridgellc-tetonridgefast-distrotvus/playlist.m3u8', isPremium: false, category: ['Sports'] },
    { name: 'MTR Sports-1', streamUrl: 'https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg02873-kravemedia-mtrspt1-distrotv/playlist.m3u8', isPremium: false, category: ['Sports'] },
    { name: 'GUBBARE', streamUrl: 'https://epiconvh.akamaized.net/live/gubbare/master.m3u8', isPremium: false, category: ['All'] },
    { name: 'Ekhon TV', streamUrl: 'https://app24.jagobd.com.bd/c3VydmVyX8RpbEU9Mi8xNy8yMFDDEHGcfRgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcEdsEfeDeKiNkVN3PTOmdFsaWRtaW51aiPhnPTI2/globaltv.stream/playlist.m3u8', isPremium: false, category: ['News', 'BD'] },
    { name: 'Channel 9', streamUrl: 'https://app24.jagobd.com.bd/c3VydmVyX8RpbEU9Mi8xNy8yMFDDEHGcfRgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcEdsEfeDeKiNkVN3PTOmdFsaWRtaW51aiPhnPTI2/channel9hd.stream/playlist.m3u8', isPremium: false, category: ['BD'] },
    { name: 'The Q Kahaniyan', streamUrl: 'http://163.61.227.29:8000/play/a04v/index.m3u8', isPremium: false, category: ['Hindi'] },
    { name: 'Movies Thriller', streamUrl: 'https://shls-live-enc.edgenextcdn.net/out/v1/f6d718e841f8442f8374de47f18c93a7/index.m3u8', isPremium: false, category: ['Movies'] },
    { name: 'ZEE ANMOL', streamUrl: 'http://163.61.227.29:8000/play/a04a/index.m3u8', isPremium: false, category: ['Hindi'] },
    { name: 'Dangal 2', streamUrl: 'http://163.61.227.29:8000/play/a04b/index.m3u8', isPremium: false, category: ['Hindi'] },
    { name: 'Dangal', streamUrl: 'https://live-dangal.akamaized.net/liveabr/playlist.m3u8', isPremium: false, category: ['Hindi'] },
    { name: 'CNBC Indonesia', streamUrl: 'https://live.cnbcindonesia.com/livecnbc/smil:cnbctv.smil/master.m3u8', isPremium: false, category: ['News'] },
    { name: 'GOLDMINES MOVIES 2', streamUrl: 'http://163.61.227.29:8000/play/a04l/index.m3u8', isPremium: false, category: ['Movies'] },
    { name: 'B4U MOVIES', streamUrl: 'http://163.61.227.29:8000/play/a047/index.m3u8', isPremium: false, category: ['Movies'] }
  ];

  for (const ch of channels) {
    ch.channelId = ch.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    ch.logoUrl = '';
    ch.language = 'Bengali';
    ch.country = 'BD';
    if (!ch.category.includes('All')) ch.category.push('All');
    
    await Channel.updateOne(
      { channelId: ch.channelId },
      { $set: ch },
      { upsert: true }
    );
  }
  
  console.log('Successfully injected custom channels!');
  process.exit(0);
});
