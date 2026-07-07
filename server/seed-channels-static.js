const mongoose = require('mongoose');
const Channel = require('./models/Channel');

const CHANNELS = [
  // ── 🇧🇩 BANGLADESHI TV ──
  { channelId: 'bd_gtv',          name: 'GTV',                   category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/gtv.png' },
  { channelId: 'bd_channel9',     name: 'Channel 9',             category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/channel9.png' },
  { channelId: 'bd_atn_bangla',   name: 'ATN Bangla',            category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/atnbangla.png' },
  { channelId: 'bd_ntv',          name: 'NTV',                   category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/ntv.png' },
  { channelId: 'bd_rtv',          name: 'RTV',                   category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/rtv.png' },
  { channelId: 'bd_channel_i',    name: 'Channel i',             category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/channeli.png' },
  { channelId: 'bd_maasranga',    name: 'Maasranga TV',          category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/maasranga.png' },
  { channelId: 'bd_banglavision', name: 'Banglavision',          category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/banglavision.png' },
  { channelId: 'bd_ekushey',      name: 'Ekushey TV',            category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/ekushey.png' },
  { channelId: 'bd_desh_tv',      name: 'Desh TV',               category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/deshtv.png' },
  { channelId: 'bd_boishakhi',    name: 'Boishakhi TV',          category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/boishakhi.png' },
  { channelId: 'bd_somoy',        name: 'Somoy TV',              category: ['All','BD','News'],          logoUrl: 'https://img.iptv.design/logo/somoy.png' },
  { channelId: 'bd_independent',  name: 'Independent TV',        category: ['All','BD','News'],          logoUrl: 'https://img.iptv.design/logo/independent.png' },
  { channelId: 'bd_jamuna',       name: 'Jamuna TV',             category: ['All','BD','News'],          logoUrl: 'https://img.iptv.design/logo/jamuna.png' },
  { channelId: 'bd_dbc_news',     name: 'DBC News',              category: ['All','BD','News'],          logoUrl: 'https://img.iptv.design/logo/dbcnews.png' },
  { channelId: 'bd_atn_news',     name: 'ATN News',              category: ['All','BD','News'],          logoUrl: 'https://img.iptv.design/logo/atnnews.png' },
  { channelId: 'bd_channel24',    name: 'Channel 24',            category: ['All','BD','News'],          logoUrl: 'https://img.iptv.design/logo/channel24.png' },

  // ── 🏏 SPORTS ──
  { channelId: 'sports_t_sports',     name: 'T Sports',               category: ['All','Sports'],            logoUrl: 'https://img.iptv.design/logo/tsports.png' },
  { channelId: 'sports_sony_ten1',    name: 'Sony Sports Ten 1',      category: ['All','Sports'],            logoUrl: 'https://img.iptv.design/logo/sonyten1.png' },
  { channelId: 'sports_sony_ten2',    name: 'Sony Sports Ten 2',      category: ['All','Sports'],            logoUrl: 'https://img.iptv.design/logo/sonyten2.png' },
  { channelId: 'sports_sony_ten3',    name: 'Sony Sports Ten 3',      category: ['All','Sports'],            logoUrl: 'https://img.iptv.design/logo/sonyten3.png' },
  { channelId: 'sports_sony_ten4',    name: 'Sony Sports Ten 4',      category: ['All','Sports'],            logoUrl: 'https://img.iptv.design/logo/sonyten4.png' },
  { channelId: 'sports_star_sports1', name: 'Star Sports 1',          category: ['All','Sports'],            logoUrl: 'https://img.iptv.design/logo/starsports1.png' },
  { channelId: 'sports_star_sports2', name: 'Star Sports 2',          category: ['All','Sports'],            logoUrl: 'https://img.iptv.design/logo/starsports2.png' },
  { channelId: 'sports_star_sports3', name: 'Star Sports 3',          category: ['All','Sports'],            logoUrl: 'https://img.iptv.design/logo/starsports3.png' },
  { channelId: 'sports_eurosport',    name: 'Eurosport',              category: ['All','Sports'],            logoUrl: 'https://img.iptv.design/logo/eurosport.png' },
  { channelId: 'sports_espn',         name: 'ESPN',                   category: ['All','Sports'],            logoUrl: 'https://img.iptv.design/logo/espn.png' },

  // ── 🇮🇳 INDIAN ENTERTAINMENT ──
  { channelId: 'in_star_plus',     name: 'Star Plus',            category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/starplus.png' },
  { channelId: 'in_colors',        name: 'Colors TV',            category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/colors.png' },
  { channelId: 'in_sony_tv',       name: 'Sony TV',              category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/sony.png' },
  { channelId: 'in_zee_tv',        name: 'Zee TV',              category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/zeetv.png' },
  { channelId: 'in_star_bharat',   name: 'Star Bharat',          category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/starbharat.png' },
  { channelId: 'in_andtv',         name: '&TV',                  category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/andtv.png' },
  { channelId: 'in_sab_tv',        name: 'SAB TV',              category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/sabtv.png' },

  // ── 🇮🇳 INDIAN NEWS ──
  { channelId: 'in_aaj_tak',       name: 'Aaj Tak',              category: ['All','Hindi','News'], logoUrl: 'https://img.iptv.design/logo/aajtak.png' },
  { channelId: 'in_abp_news',      name: 'ABP News',             category: ['All','Hindi','News'], logoUrl: 'https://img.iptv.design/logo/abpnews.png' },
  { channelId: 'in_india_tv',      name: 'India TV',             category: ['All','Hindi','News'], logoUrl: 'https://img.iptv.design/logo/indiatv.png' },
  { channelId: 'in_news18',        name: 'News18 India',         category: ['All','Hindi','News'], logoUrl: 'https://img.iptv.design/logo/news18.png' },
  { channelId: 'in_ndtv',          name: 'NDTV 24x7',            category: ['All','Hindi','News'], logoUrl: 'https://img.iptv.design/logo/ndtv.png' },
  { channelId: 'in_times_now',     name: 'Times Now',            category: ['All','Hindi','News'], logoUrl: 'https://img.iptv.design/logo/timesnow.png' },
  { channelId: 'in_republic',      name: 'Republic TV',          category: ['All','Hindi','News'], logoUrl: 'https://img.iptv.design/logo/republic.png' },

  // ── 🇮🇳 INDIAN MOVIES ──
  { channelId: 'in_star_gold',     name: 'Star Gold',            category: ['All','Hindi','Movies'], logoUrl: 'https://img.iptv.design/logo/stargold.png' },
  { channelId: 'in_sony_max',      name: 'Sony Max',             category: ['All','Hindi','Movies'], logoUrl: 'https://img.iptv.design/logo/sonymax.png' },
  { channelId: 'in_zee_cinema',    name: 'Zee Cinema',           category: ['All','Hindi','Movies'], logoUrl: 'https://img.iptv.design/logo/zeecinema.png' },
  { channelId: 'in_pictures',      name: '& Pictures',           category: ['All','Hindi','Movies'], logoUrl: 'https://img.iptv.design/logo/andpictures.png' },

  // ── 🧒 KIDS ──
  { channelId: 'kids_nick',        name: 'Nickelodeon',          category: ['All','Kids'], logoUrl: 'https://img.iptv.design/logo/nick.png' },
  { channelId: 'kids_cn',          name: 'Cartoon Network',     category: ['All','Kids'], logoUrl: 'https://img.iptv.design/logo/cartoonnetwork.png' },
  { channelId: 'kids_pogo',        name: 'Pogo',                 category: ['All','Kids'], logoUrl: 'https://img.iptv.design/logo/pogo.png' },
  { channelId: 'kids_disney',      name: 'Disney Channel',       category: ['All','Kids'], logoUrl: 'https://img.iptv.design/logo/disney.png' },

  // ── 🎵 MUSIC ──
  { channelId: 'music_mtv',        name: 'MTV',                  category: ['All','Music'], logoUrl: 'https://img.iptv.design/logo/mtv.png' },
  { channelId: 'music_vh1',        name: 'VH1',                  category: ['All','Music'], logoUrl: 'https://img.iptv.design/logo/vh1.png' },
  { channelId: 'music_9xm',        name: '9XM',                  category: ['All','Music'], logoUrl: 'https://img.iptv.design/logo/9xm.png' },
  { channelId: 'music_zoom',       name: 'Zoom TV',              category: ['All','Music'], logoUrl: 'https://img.iptv.design/logo/zoom.png' },
];

const FALLBACK_STREAM = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

const seed = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/friends_bd';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);

    const existing = await Channel.countDocuments();
    if (existing > 0) {
      console.log(`📺 ${existing} channels exist, dropping old ones for refresh...`);
      await Channel.deleteMany({});
    }

    const docs = CHANNELS.map(c => ({
      ...c,
      streamUrl: FALLBACK_STREAM,
      isPremium: false,
      status: 'active'
    }));

    await Channel.insertMany(docs);
    console.log(`✅ Inserted ${docs.length} channels successfully!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seed();
