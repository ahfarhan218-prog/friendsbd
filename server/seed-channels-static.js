const mongoose = require('mongoose');
const Channel = require('./models/Channel');

const CHANNELS = [
  // ── 🇧🇩 BANGLADESHI TV (Core) ──
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

  // ── 🇧🇩 BANGLADESHI (Additional) ──
  { channelId: 'bd_sa_tv',        name: 'SA TV',                 category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/satv.png' },
  { channelId: 'bd_deepto',       name: 'Deepto TV',             category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/deepto.png' },
  { channelId: 'bd_nagorik',      name: 'Nagorik TV',            category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/nagorik.png' },
  { channelId: 'bd_ekattor',      name: 'Ekattor TV',            category: ['All','BD','News'],          logoUrl: 'https://img.iptv.design/logo/ekattor.png' },
  { channelId: 'bd_bijoy',        name: 'Bijoy TV',              category: ['All','BD','News'],          logoUrl: 'https://img.iptv.design/logo/bijoytv.png' },
  { channelId: 'bd_news24',       name: 'News24',                category: ['All','BD','News'],          logoUrl: 'https://img.iptv.design/logo/news24.png' },
  { channelId: 'bd_btv',          name: 'BTV National',          category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/btv.png' },
  { channelId: 'bd_btv_world',    name: 'BTV World',             category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/btvworld.png' },
  { channelId: 'bd_sangshad',     name: 'Sangsad TV',            category: ['All','BD','News'],          logoUrl: 'https://img.iptv.design/logo/sangsadtv.png' },
  { channelId: 'bd_toffee',       name: 'Toffee TV',             category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/toffee.png' },
  { channelId: 'bd_t_sports',     name: 'T Sports',              category: ['All','BD','Sports'],        logoUrl: 'https://img.iptv.design/logo/tsports.png' },
  { channelId: 'bd_gaan_bangla',  name: 'Gaan Bangla',           category: ['All','BD','Music'],         logoUrl: 'https://img.iptv.design/logo/gaanbangla.png' },
  { channelId: 'bd_atn_music',    name: 'ATN Music',             category: ['All','BD','Music'],         logoUrl: 'https://img.iptv.design/logo/atnmusic.png' },
  { channelId: 'bd_duronto',      name: 'Duronto TV',            category: ['All','BD','Kids'],          logoUrl: 'https://img.iptv.design/logo/duronto.png' },
  { channelId: 'bd_my_tv',        name: 'My TV',                 category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/mytv.png' },
  { channelId: 'bd_rupashi',      name: 'Rupashi Bangla',        category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/rupashibangla.png' },
  { channelId: 'bd_cnn_bangla',   name: 'CNN Bangla TV',         category: ['All','BD','News'],          logoUrl: 'https://img.iptv.design/logo/cnnbangla.png' },
  { channelId: 'bd_movie_bangla', name: 'Movie Bangla',          category: ['All','BD','Movies'],        logoUrl: 'https://img.iptv.design/logo/moviebangla.png' },
  { channelId: 'bd_bayanno',      name: 'Bayanno TV',            category: ['All','BD','News'],          logoUrl: 'https://img.iptv.design/logo/bayanno.png' },
  { channelId: 'bd_global',       name: 'Global Television',     category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/globaltvbd.png' },
  { channelId: 'bd_nexus',        name: 'Nexus TV',              category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/nexustv.png' },
  { channelId: 'bd_asian',        name: 'Asian TV',              category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/asiantv.png' },
  { channelId: 'bd_ananda',       name: 'Ananda TV',             category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/anandatv.png' },
  { channelId: 'bd_bangla_tv',    name: 'Bangla TV',             category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/banglatv.png' },
  { channelId: 'bd_mohona',       name: 'Mohona TV',             category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/mohonatv.png' },
  { channelId: 'bd_gazi',         name: 'Gazi TV',               category: ['All','BD','Entertainment'], logoUrl: 'https://img.iptv.design/logo/gazitv.png' },

  // ── 🏏 SPORTS (International) ──
  { channelId: 'sports_sony_ten1',      name: 'Sony Sports Ten 1',      category: ['All','Sports','International'], logoUrl: 'https://img.iptv.design/logo/sonyten1.png' },
  { channelId: 'sports_sony_ten2',      name: 'Sony Sports Ten 2',      category: ['All','Sports','International'], logoUrl: 'https://img.iptv.design/logo/sonyten2.png' },
  { channelId: 'sports_sony_ten3',      name: 'Sony Sports Ten 3',      category: ['All','Sports','International'], logoUrl: 'https://img.iptv.design/logo/sonyten3.png' },
  { channelId: 'sports_sony_ten4',      name: 'Sony Sports Ten 4',      category: ['All','Sports','International'], logoUrl: 'https://img.iptv.design/logo/sonyten4.png' },
  { channelId: 'sports_star_sports1',   name: 'Star Sports 1',          category: ['All','Sports','International'], logoUrl: 'https://img.iptv.design/logo/starsports1.png' },
  { channelId: 'sports_star_sports2',   name: 'Star Sports 2',          category: ['All','Sports','International'], logoUrl: 'https://img.iptv.design/logo/starsports2.png' },
  { channelId: 'sports_star_sports3',   name: 'Star Sports 3',          category: ['All','Sports','International'], logoUrl: 'https://img.iptv.design/logo/starsports3.png' },
  { channelId: 'sports_star_sports1h',  name: 'Star Sports 1 Hindi',    category: ['All','Sports','International'], logoUrl: 'https://img.iptv.design/logo/starsports1h.png' },
  { channelId: 'sports_eurosport',      name: 'Eurosport',              category: ['All','Sports','International'], logoUrl: 'https://img.iptv.design/logo/eurosport.png' },
  { channelId: 'sports_espn',           name: 'ESPN',                   category: ['All','Sports','International'], logoUrl: 'https://img.iptv.design/logo/espn.png' },
  { channelId: 'sports_espn2',          name: 'ESPN2',                  category: ['All','Sports','International'], logoUrl: 'https://img.iptv.design/logo/espn2.png' },
  { channelId: 'sports_bein1',          name: 'beIN Sports 1',          category: ['All','Sports','International'], logoUrl: 'https://img.iptv.design/logo/bein1.png' },
  { channelId: 'sports_bein2',          name: 'beIN Sports 2',          category: ['All','Sports','International'], logoUrl: 'https://img.iptv.design/logo/bein2.png' },
  { channelId: 'sports_bein3',          name: 'beIN Sports 3',          category: ['All','Sports','International'], logoUrl: 'https://img.iptv.design/logo/bein3.png' },
  { channelId: 'sports_sky_sports_pl',  name: 'Sky Sports Premier League', category: ['All','Sports','International'], logoUrl: 'https://img.iptv.design/logo/skysportspl.png' },
  { channelId: 'sports_sky_sports_fn',  name: 'Sky Sports Football',    category: ['All','Sports','International'], logoUrl: 'https://img.iptv.design/logo/skysportsfootball.png' },
  { channelId: 'sports_sky_sports_cr',  name: 'Sky Sports Cricket',     category: ['All','Sports','International'], logoUrl: 'https://img.iptv.design/logo/skysportscricket.png' },
  { channelId: 'sports_sky_sports_me',  name: 'Sky Sports Main Event',  category: ['All','Sports','International'], logoUrl: 'https://img.iptv.design/logo/skysportsmain.png' },
  { channelId: 'sports_sky_news',       name: 'Sky Sports News',        category: ['All','Sports','International'], logoUrl: 'https://img.iptv.design/logo/skysportsnews.png' },
  { channelId: 'sports_olympic',        name: 'Olympic Channel',        category: ['All','Sports','International'], logoUrl: 'https://img.iptv.design/logo/olympic.png' },
  { channelId: 'sports_fox_sports',     name: 'Fox Sports',             category: ['All','Sports','International'], logoUrl: 'https://img.iptv.design/logo/foxsports.png' },
  { channelId: 'sports_laliga_tv',      name: 'LaLiga TV',              category: ['All','Sports','International'], logoUrl: 'https://img.iptv.design/logo/laliga.png' },
  { channelId: 'sports_willow',         name: 'Willow TV',              category: ['All','Sports','International'], logoUrl: 'https://img.iptv.design/logo/willow.png' },
  { channelId: 'sports_star_bangla',    name: 'Star Sports Bangla',     category: ['All','Sports','BD'],            logoUrl: 'https://img.iptv.design/logo/starsportsbangla.png' },
  { channelId: 'sports_dazn',           name: 'DAZN',                   category: ['All','Sports','International'], logoUrl: 'https://img.iptv.design/logo/dazn.png' },
  { channelId: 'sports_ten_sports_pk',  name: 'Ten Sports Pakistan',    category: ['All','Sports','International'], logoUrl: 'https://img.iptv.design/logo/tensports.png' },

  // ── 🇮🇳 INDIAN ENTERTAINMENT ──
  { channelId: 'in_star_plus',       name: 'Star Plus',            category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/starplus.png' },
  { channelId: 'in_colors',          name: 'Colors TV',            category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/colors.png' },
  { channelId: 'in_sony_tv',         name: 'Sony TV',              category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/sony.png' },
  { channelId: 'in_zee_tv',          name: 'Zee TV',               category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/zeetv.png' },
  { channelId: 'in_star_bharat',     name: 'Star Bharat',          category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/starbharat.png' },
  { channelId: 'in_andtv',           name: '&TV',                  category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/andtv.png' },
  { channelId: 'in_sab_tv',          name: 'SAB TV',               category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/sabtv.png' },
  { channelId: 'in_sony_liv',        name: 'SonyLIV',              category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/sonyliv.png' },
  { channelId: 'in_zee5',            name: 'ZEE5',                 category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/zee5.png' },
  { channelId: 'in_hotstar',         name: 'Disney+ Hotstar',      category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/hotstar.png' },
  { channelId: 'in_jio_cinema',      name: 'JioCinema',            category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/jiocinema.png' },
  { channelId: 'in_sun_nxt',         name: 'SUN NXT',              category: ['All','Hindi','Entertainment'], logoUrl: 'https://img.iptv.design/logo/sunnxt.png' },

  // ── 🇮🇳 INDIAN REGIONAL ──
  { channelId: 'in_star_jalsha',     name: 'Star Jalsha',          category: ['All','Regional','Entertainment'], logoUrl: 'https://img.iptv.design/logo/starjalsha.png' },
  { channelId: 'in_zee_bangla',      name: 'Zee Bangla',           category: ['All','Regional','Entertainment'], logoUrl: 'https://img.iptv.design/logo/zeebangla.png' },
  { channelId: 'in_colors_bangla',   name: 'Colors Bangla',        category: ['All','Regional','Entertainment'], logoUrl: 'https://img.iptv.design/logo/colorsbangla.png' },
  { channelId: 'in_star_vijay',      name: 'Star Vijay',           category: ['All','Regional','Entertainment'], logoUrl: 'https://img.iptv.design/logo/vijay.png' },
  { channelId: 'in_sun_tv',          name: 'Sun TV',               category: ['All','Regional','Entertainment'], logoUrl: 'https://img.iptv.design/logo/suntv.png' },
  { channelId: 'in_zee_tamil',       name: 'Zee Tamil',            category: ['All','Regional','Entertainment'], logoUrl: 'https://img.iptv.design/logo/zeetamil.png' },
  { channelId: 'in_colors_tamil',    name: 'Colors Tamil',         category: ['All','Regional','Entertainment'], logoUrl: 'https://img.iptv.design/logo/colorstamil.png' },
  { channelId: 'in_star_suvarna',    name: 'Star Suvarna',         category: ['All','Regional','Entertainment'], logoUrl: 'https://img.iptv.design/logo/suvarna.png' },
  { channelId: 'in_zee_kannada',     name: 'Zee Kannada',          category: ['All','Regional','Entertainment'], logoUrl: 'https://img.iptv.design/logo/zeekannada.png' },
  { channelId: 'in_colors_kannada',  name: 'Colors Kannada',       category: ['All','Regional','Entertainment'], logoUrl: 'https://img.iptv.design/logo/colorskannada.png' },
  { channelId: 'in_star_maa',        name: 'Star Maa',             category: ['All','Regional','Entertainment'], logoUrl: 'https://img.iptv.design/logo/starmaa.png' },
  { channelId: 'in_zee_telugu',      name: 'Zee Telugu',           category: ['All','Regional','Entertainment'], logoUrl: 'https://img.iptv.design/logo/zeetelugu.png' },
  { channelId: 'in_colors_marathi',  name: 'Colors Marathi',       category: ['All','Regional','Entertainment'], logoUrl: 'https://img.iptv.design/logo/colorsmarathi.png' },
  { channelId: 'in_zee_marathi',     name: 'Zee Marathi',          category: ['All','Regional','Entertainment'], logoUrl: 'https://img.iptv.design/logo/zeemarathi.png' },
  { channelId: 'in_colors_gujarati', name: 'Colors Gujarati',      category: ['All','Regional','Entertainment'], logoUrl: 'https://img.iptv.design/logo/colorsgujarati.png' },
  { channelId: 'in_zee_keralam',     name: 'Zee Keralam',          category: ['All','Regional','Entertainment'], logoUrl: 'https://img.iptv.design/logo/zeekeralam.png' },
  { channelId: 'in_asianet',         name: 'Asianet',              category: ['All','Regional','Entertainment'], logoUrl: 'https://img.iptv.design/logo/asianet.png' },
  { channelId: 'in_mazhavil',        name: 'Mazhavil Manorama',    category: ['All','Regional','Entertainment'], logoUrl: 'https://img.iptv.design/logo/mazhavil.png' },
  { channelId: 'in_colors_odia',     name: 'Colors Odia',          category: ['All','Regional','Entertainment'], logoUrl: 'https://img.iptv.design/logo/colorsodia.png' },
  { channelId: 'in_colors_punjabi',  name: 'Colors Punjabi',       category: ['All','Regional','Entertainment'], logoUrl: 'https://img.iptv.design/logo/colorspunjabi.png' },

  // ── 🇮🇳 INDIAN NEWS ──
  { channelId: 'in_aaj_tak',         name: 'Aaj Tak',              category: ['All','Hindi','News'], logoUrl: 'https://img.iptv.design/logo/aajtak.png' },
  { channelId: 'in_abp_news',        name: 'ABP News',             category: ['All','Hindi','News'], logoUrl: 'https://img.iptv.design/logo/abpnews.png' },
  { channelId: 'in_india_tv',        name: 'India TV',             category: ['All','Hindi','News'], logoUrl: 'https://img.iptv.design/logo/indiatv.png' },
  { channelId: 'in_news18',          name: 'News18 India',         category: ['All','Hindi','News'], logoUrl: 'https://img.iptv.design/logo/news18.png' },
  { channelId: 'in_ndtv',            name: 'NDTV 24x7',            category: ['All','Hindi','News'], logoUrl: 'https://img.iptv.design/logo/ndtv.png' },
  { channelId: 'in_times_now',       name: 'Times Now',            category: ['All','Hindi','News'], logoUrl: 'https://img.iptv.design/logo/timesnow.png' },
  { channelId: 'in_republic',        name: 'Republic TV',          category: ['All','Hindi','News'], logoUrl: 'https://img.iptv.design/logo/republic.png' },
  { channelId: 'in_republic_bharat', name: 'Republic Bharat',      category: ['All','Hindi','News'], logoUrl: 'https://img.iptv.design/logo/republicbharat.png' },
  { channelId: 'in_zee_news',        name: 'Zee News',             category: ['All','Hindi','News'], logoUrl: 'https://img.iptv.design/logo/zeenews.png' },
  { channelId: 'in_wion',            name: 'WION',                 category: ['All','Hindi','News'], logoUrl: 'https://img.iptv.design/logo/wion.png' },
  { channelId: 'in_news9',           name: 'News9 Plus',           category: ['All','Hindi','News'], logoUrl: 'https://img.iptv.design/logo/news9.png' },
  { channelId: 'in_tv9_bharatvarsh', name: 'TV9 Bharatvarsh',      category: ['All','Hindi','News'], logoUrl: 'https://img.iptv.design/logo/tv9bharatvarsh.png' },
  { channelId: 'in_abp_ananda',      name: 'ABP Ananda',           category: ['All','Regional','News'], logoUrl: 'https://img.iptv.design/logo/abpananda.png' },

  // ── 🇮🇳 INDIAN MOVIES ──
  { channelId: 'in_star_gold',       name: 'Star Gold',            category: ['All','Hindi','Movies'], logoUrl: 'https://img.iptv.design/logo/stargold.png' },
  { channelId: 'in_sony_max',        name: 'Sony Max',             category: ['All','Hindi','Movies'], logoUrl: 'https://img.iptv.design/logo/sonymax.png' },
  { channelId: 'in_zee_cinema',      name: 'Zee Cinema',           category: ['All','Hindi','Movies'], logoUrl: 'https://img.iptv.design/logo/zeecinema.png' },
  { channelId: 'in_pictures',        name: '& Pictures',           category: ['All','Hindi','Movies'], logoUrl: 'https://img.iptv.design/logo/andpictures.png' },
  { channelId: 'in_sony_max2',       name: 'Sony Max 2',           category: ['All','Hindi','Movies'], logoUrl: 'https://img.iptv.design/logo/sonymax2.png' },
  { channelId: 'in_star_gold2',      name: 'Star Gold 2',          category: ['All','Hindi','Movies'], logoUrl: 'https://img.iptv.design/logo/stargold2.png' },
  { channelId: 'in_b4u_movies',      name: 'B4U Movies',           category: ['All','Hindi','Movies'], logoUrl: 'https://img.iptv.design/logo/b4umovies.png' },
  { channelId: 'in_zee_bollywood',   name: 'Zee Bollywood',        category: ['All','Hindi','Movies'], logoUrl: 'https://img.iptv.design/logo/zeebollywood.png' },

  // ── 🧒 KIDS ──
  { channelId: 'kids_nick',          name: 'Nickelodeon',          category: ['All','Kids'], logoUrl: 'https://img.iptv.design/logo/nick.png' },
  { channelId: 'kids_cn',            name: 'Cartoon Network',      category: ['All','Kids'], logoUrl: 'https://img.iptv.design/logo/cartoonnetwork.png' },
  { channelId: 'kids_pogo',          name: 'Pogo',                 category: ['All','Kids'], logoUrl: 'https://img.iptv.design/logo/pogo.png' },
  { channelId: 'kids_disney',        name: 'Disney Channel',       category: ['All','Kids'], logoUrl: 'https://img.iptv.design/logo/disney.png' },
  { channelId: 'kids_disney_jr',     name: 'Disney Junior',        category: ['All','Kids'], logoUrl: 'https://img.iptv.design/logo/disneyjr.png' },
  { channelId: 'kids_nick_jr',       name: 'Nick Jr.',             category: ['All','Kids'], logoUrl: 'https://img.iptv.design/logo/nickjr.png' },
  { channelId: 'kids_hungama',       name: 'Hungama TV',           category: ['All','Kids'], logoUrl: 'https://img.iptv.design/logo/hungama.png' },
  { channelId: 'kids_sonic',         name: 'Sonic',                category: ['All','Kids'], logoUrl: 'https://img.iptv.design/logo/sonic.png' },

  // ── 🎵 MUSIC ──
  { channelId: 'music_mtv',          name: 'MTV',                  category: ['All','Music'], logoUrl: 'https://img.iptv.design/logo/mtv.png' },
  { channelId: 'music_vh1',          name: 'VH1',                  category: ['All','Music'], logoUrl: 'https://img.iptv.design/logo/vh1.png' },
  { channelId: 'music_9xm',          name: '9XM',                  category: ['All','Music'], logoUrl: 'https://img.iptv.design/logo/9xm.png' },
  { channelId: 'music_zoom',         name: 'Zoom TV',              category: ['All','Music'], logoUrl: 'https://img.iptv.design/logo/zoom.png' },
  { channelId: 'music_9x_jalwa',     name: '9X Jalwa',             category: ['All','Music'], logoUrl: 'https://img.iptv.design/logo/9xjalwa.png' },
  { channelId: 'music_9x_tashan',    name: '9X Tashan',            category: ['All','Music'], logoUrl: 'https://img.iptv.design/logo/9xtashan.png' },
  { channelId: 'music_mtv_beats',    name: 'MTV Beats',            category: ['All','Music'], logoUrl: 'https://img.iptv.design/logo/mtvbeats.png' },

  // ── 🌍 INTERNATIONAL ──
  { channelId: 'int_bbc_world',      name: 'BBC World News',       category: ['All','News','International'], logoUrl: 'https://img.iptv.design/logo/bbcworld.png' },
  { channelId: 'int_cnn',            name: 'CNN International',    category: ['All','News','International'], logoUrl: 'https://img.iptv.design/logo/cnn.png' },
  { channelId: 'int_al_jazeera',     name: 'Al Jazeera English',   category: ['All','News','International'], logoUrl: 'https://img.iptv.design/logo/aljazeera.png' },
  { channelId: 'int_dw',             name: 'DW News',              category: ['All','News','International'], logoUrl: 'https://img.iptv.design/logo/dw.png' },
  { channelId: 'int_france24',       name: 'France 24',            category: ['All','News','International'], logoUrl: 'https://img.iptv.design/logo/france24.png' },
  { channelId: 'int_cgtn',           name: 'CGTN',                 category: ['All','News','International'], logoUrl: 'https://img.iptv.design/logo/cgtn.png' },
  { channelId: 'int_nat_geo',        name: 'National Geographic',  category: ['All','Nature','International'], logoUrl: 'https://img.iptv.design/logo/natgeo.png' },
  { channelId: 'int_nat_geo_wild',   name: 'Nat Geo Wild',         category: ['All','Nature','International'], logoUrl: 'https://img.iptv.design/logo/natgeowild.png' },
  { channelId: 'int_discovery',      name: 'Discovery Channel',    category: ['All','Nature','International'], logoUrl: 'https://img.iptv.design/logo/discovery.png' },
  { channelId: 'int_animal_planet',  name: 'Animal Planet',        category: ['All','Nature','International'], logoUrl: 'https://img.iptv.design/logo/animalplanet.png' },
  { channelId: 'int_history',        name: 'History TV18',         category: ['All','Infotainment','International'], logoUrl: 'https://img.iptv.design/logo/historytv18.png' },
  { channelId: 'int_tlc',            name: 'TLC',                  category: ['All','Infotainment','International'], logoUrl: 'https://img.iptv.design/logo/tlc.png' },
  { channelId: 'int_hbo',            name: 'HBO',                  category: ['All','Movies','International'], logoUrl: 'https://img.iptv.design/logo/hbo.png' },
  { channelId: 'int_hbo_hits',       name: 'HBO Hits',             category: ['All','Movies','International'], logoUrl: 'https://img.iptv.design/logo/hbohits.png' },
  { channelId: 'int_hbo_signature',  name: 'HBO Signature',        category: ['All','Movies','International'], logoUrl: 'https://img.iptv.design/logo/hbosignature.png' },
  { channelId: 'int_star_movies',    name: 'Star Movies',          category: ['All','Movies','International'], logoUrl: 'https://img.iptv.design/logo/starmovies.png' },
  { channelId: 'int_star_world',     name: 'Star World',           category: ['All','Entertainment','International'], logoUrl: 'https://img.iptv.design/logo/starworld.png' },
  { channelId: 'int_axn',            name: 'AXN',                  category: ['All','Entertainment','International'], logoUrl: 'https://img.iptv.design/logo/axn.png' },
  { channelId: 'int_fox_life',       name: 'Fox Life',             category: ['All','Entertainment','International'], logoUrl: 'https://img.iptv.design/logo/foxlife.png' },
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
