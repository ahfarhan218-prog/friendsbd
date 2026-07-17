import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────
//  BUILT-IN CHANNEL DATA (working free streams)
// ─────────────────────────────────────────────
interface Channel {
  id: string;
  name: string;
  logo: string;
  streamUrl: string;
  category: string[];
  country: 'BD' | 'IN' | 'INTL';
  isPremium: boolean;
  description?: string;
}

const CHANNELS: Channel[] = [
  {
    id: 'tvlist_0',
    name: 'Doraemon',
    logo: '',
    streamUrl: 'https://live20.bozztv.com/giatvplayout7/giatv-209902/tracks-v1a1/mono.ts.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: true
  },
  {
    id: 'tvlist_1',
    name: 'ZB Cinema',
    logo: '',
    streamUrl: 'https://server.zillarbarta.com/ZBCINEMA/tracks-v1a1/mono.ts.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_2',
    name: 'Ekhon TV',
    logo: '',
    streamUrl: 'https://app24.jagobd.com.bd/c3VydmVyX8RpbEU9Mi8xNy8yMFDDEHGcfRgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcEdsEfeDeKiNkVN3PTOmdFsaWRtaW51aiPhnPTI2/globaltv.stream/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_3',
    name: 'Channel 9',
    logo: '',
    streamUrl: 'https://app24.jagobd.com.bd/c3VydmVyX8RpbEU9Mi8xNy8yMFDDEHGcfRgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcEdsEfeDeKiNkVN3PTOmdFsaWRtaW51aiPhnPTI2/channel9hd.stream/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_4',
    name: 'Dhoom Music',
    logo: '',
    streamUrl: 'https://cdn-1.pishow.tv/live/1456/1456_1.m3u8',
    category: ["All","BD","Music"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_5',
    name: 'AAKASH AATH',
    logo: '',
    streamUrl: 'https://cdn-4.pishow.tv/live/969/master.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_6',
    name: 'R Plus Gold',
    logo: '',
    streamUrl: 'https://cdn-4.pishow.tv/live/1231/1231_1.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_7',
    name: 'Ekhone TV',
    logo: '',
    streamUrl: 'https://app24.jagobd.com.bd/c3VydmVyX8RpbEU9Mi8xNy8yMFDDEHGcfRgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcEdsEfeDeKiNkVN3PTOmdFsaWRtaW51aiPhnPTI2/globaltv.stream/tracks-v1a1/mono.m3u8',
    category: ["All","BD","News"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_8',
    name: 'Jago News 24',
    logo: '',
    streamUrl: 'https://app24.jagobd.com.bd/c3VydmVyX8RpbEU9Mi8xNy8yMFDDEHGcfRgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcEdsEfeDeKiNkVN3PTOmdFsaWRtaW51aiPhnPTI2/jagonews24.stream/tracks-v1a1/mono.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_9',
    name: 'Channel S HD',
    logo: '',
    streamUrl: 'https://app24.jagobd.com.bd/c3VydmVyX8RpbEU9Mi8xNy8yMFDDEHGcfRgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcEdsEfeDeKiNkVN3PTOmdFsaWRtaW51aiPhnPTI2/channels.stream/tracks-v1a1/mono.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_10',
    name: 'Gazi TV',
    logo: '',
    streamUrl: 'https://app24.jagobd.com.bd/c3VydmVyX8RpbEU9Mi8xNy8yMFDDEHGcfRgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcEdsEfeDeKiNkVN3PTOmdFsaWRtaW51aiPhnPTI2/gazibdz.stream/tracks-v1a1/mono.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_11',
    name: 'Channel S UK',
    logo: '',
    streamUrl: 'https://app24.jagobd.com.bd/c3VydmVyX8RpbEU9Mi8xNy8yMFDDEHGcfRgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcEdsEfeDeKiNkVN3PTOmdFsaWRtaW51aiPhnPTI2/chsukoff.stream/tracks-v1a1/mono.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_12',
    name: 'Arabica TV',
    logo: '',
    streamUrl: 'http://istream.binarywaves.com:8081/hls/arabica/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_13',
    name: 'Zee Bangla Cinema',
    logo: 'https://s3.aynaott.com/storage/7fc825467116fd9653dc0495c0532e01',
    streamUrl: 'https://tvsen6.aynascope.net/ZeeBanglaCinema/index.m3u8?e=1767961149&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=a5a4502b444fb1c69741542866354c09',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_14',
    name: 'Zee Bangla International',
    logo: 'https://s3.aynaott.com/storage/0cb865748deefd42e69fd9a221cf38ee',
    streamUrl: 'https://tvsen5.aynascope.net/PNEb3v2q6GBk/index.m3u8?e=1767961148&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=e142f58b0ae3ead501fc874f78636809',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_15',
    name: 'Enter 10 Bangla',
    logo: 'https://s3.aynaott.com/storage/2b00567c538d392c8050124f0064c4a1',
    streamUrl: 'https://live-bangla.akamaized.net/liveabr/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_16',
    name: 'DD Bangla',
    logo: 'https://s3.aynaott.com/storage/e5117c508d18adf0a3f2475eb1fd5a9d',
    streamUrl: 'https://d3eyhgoylams0m.cloudfront.net/v1/manifest/93ce20f0f52760bf38be911ff4c91ed02aa2fd92/ed7bd2c7-8d10-4051-b397-2f6b90f99acb/2e9e32a4-c4f7-49c3-96d6-c4e3660c7e3f/2.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_17',
    name: 'TIME TV USA',
    logo: 'https://s3.aynaott.com/storage/111bfd01fb43770e925ca9cf16663f56',
    streamUrl: 'https://tvsen7.aynascope.net/timetv/index.m3u8?e=1767960994&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=53e6151222dcaacddae889e746cfe738',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_18',
    name: 'SA TV',
    logo: 'https://s3.aynaott.com/storage/f710d2ff532cb7e7b75566232c5b72d3',
    streamUrl: 'https://tvsen6.aynascope.net/satv/index.m3u8?e=1767960994&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=cf9ef67edd3fe2cedb7c1e4b690b145c',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_19',
    name: 'RTV',
    logo: 'https://s3.aynaott.com/storage/094587a26f2c5e4f2962104728ec8c5d',
    streamUrl: 'https://tvsen5.aynascope.net/RtvHD/index.m3u8?e=1767960993&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=36d5dcf75dcbac777b5409e2a4e34409',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_20',
    name: 'Peace TV Bangla HD',
    logo: 'https://s3.aynaott.com/storage/e33b23f7dc3d39008d672952c33069d4',
    streamUrl: 'https://tvsen7.aynascope.net/PeaceTvBanglaHD/index.m3u8?e=1767960993&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=ef0ab5f8084bfb4539597a3952d3d17a',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_21',
    name: 'NTV',
    logo: 'https://s3.aynaott.com/storage/1a619c9b917eb35898020cd323e415a7',
    streamUrl: 'https://tvsen5.aynascope.net/ntvbd/index.m3u8?e=1767960992&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=e3a7b8c00f965dd6a59787f5c6901d11',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_22',
    name: 'NEXUS TV',
    logo: 'https://s3.aynaott.com/storage/90635c3edf6e3c8dd92210b7248f1fa0',
    streamUrl: 'https://tvsen6.aynascope.net/nexustv/index.m3u8?e=1767960991&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=244ed21470e24c90aa97d96317c94f83',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_23',
    name: 'My TV',
    logo: 'https://s3.aynaott.com/storage/c5b2c623863fbe4033d59d52ff7371ac',
    streamUrl: 'https://tvsen6.aynascope.net/mytv/index.m3u8?e=1767960991&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=b12e10dc794a0b30df91286a0627142d',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_24',
    name: 'Mohona TV',
    logo: 'https://s3.aynaott.com/storage/73082846fdc15d9f0e7268b104c55d92',
    streamUrl: 'https://tvsen6.aynascope.net/mohonatv/index.m3u8?e=1767960990&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=c9624eeebcd926aa3592e926b0f1e81e',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_25',
    name: 'Maasranga TV',
    logo: 'https://s3.aynaott.com/storage/1b5cb8c7901739cd7d201a38d2ab4737',
    streamUrl: 'https://tvsen5.aynascope.net/maasrangatv/index.m3u8?e=1767960990&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=da3d04cbd6bf672840c40dd8b5faab4f',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_26',
    name: 'Global TV',
    logo: 'https://s3.aynaott.com/storage/ffd7ba9b76ad555933f94bcb7ff26b44',
    streamUrl: 'https://tvsen6.aynascope.net/globaltvhd/index.m3u8?e=1767960989&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=2167702d23ca52e10c412b28a7c10f52',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_27',
    name: 'Gazi TV',
    logo: 'https://s3.aynaott.com/storage/417a833f6d83021c99bfc3d4176610f4',
    streamUrl: 'https://tvsen5.aynascope.net/Ravc7gPCZpxk/index.m3u8?e=1767960988&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=acafd5276772b07a085bdacef01cdcb3',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_28',
    name: 'ETV',
    logo: 'https://s3.aynaott.com/storage/8a1af81802b0728c064c2adabcdc72c8',
    streamUrl: 'https://tvsen6.aynascope.net/etv/index.m3u8?e=1767960988&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=d61990e63d05f1aa720b7742fe80f7f1',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_29',
    name: 'Duronto TV',
    logo: 'https://s3.aynaott.com/storage/51f1530c076c027e431bf18a49613f0b',
    streamUrl: 'https://tvsen6.aynascope.net/durontotv-live/index.m3u8?e=1767960987&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=0269ec0a62bf2f586c51dbbf9f55beb4',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_30',
    name: 'Drama 24',
    logo: 'https://s3.aynaott.com/storage/08773290bf83a917aebc07810f12ed49',
    streamUrl: 'https://vods2.aynascope.net/gseriesDrama/index.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_31',
    name: 'Desh TV',
    logo: 'https://s3.aynaott.com/storage/d10390e5434e8cb44172257abd714beb',
    streamUrl: 'https://tvsen6.aynascope.net/deshtv/index.m3u8?e=1767960986&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=f9281989402726532babb1525a9e6d8f',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_32',
    name: 'Deepto TV',
    logo: 'https://s3.aynaott.com/storage/76717b7a598a30815a1bdb16ecd3af6c',
    streamUrl: 'https://tvsen5.aynascope.net/DeeptoTVHD/index.m3u8?e=1767960985&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=d6d9a77149d2d89bb1441af8d13090b6',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_33',
    name: 'Channel I',
    logo: 'https://s3.aynaott.com/storage/8e998f20a9cc52cb8eb1f52a5bf38204',
    streamUrl: 'https://tvsen6.aynascope.net/channeli/index.m3u8?e=1767960984&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=b6b061862745930178d92661642b4783',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_34',
    name: 'Channel 9',
    logo: 'https://s3.aynaott.com/storage/a959f06b4fc9e1421f867b6c1601fe43',
    streamUrl: 'https://tvsen6.aynascope.net/channel9/index.m3u8?e=1767960984&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=7e7a4b27d0464523d76d290e0c6cb687',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_35',
    name: 'Boishakhi TV',
    logo: 'https://s3.aynaott.com/storage/58658d4594ca1ff3c5031c9d8e3d9fc0',
    streamUrl: 'https://tvsen6.aynascope.net/boishakhitv/index.m3u8?e=1767960983&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=7b5f0203f1f3eaccee71468aa7d269d1',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_36',
    name: 'Bijoy TV',
    logo: 'https://s3.aynaott.com/storage/f23d6f82c1a16458fe0e4c6f11b8fd87',
    streamUrl: 'https://tvsen6.aynascope.net/bijoytv/index.m3u8?e=1767960983&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=2af774b71adab03c51540c5bb28c0f87',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_37',
    name: 'Bangla Vision',
    logo: 'https://s3.aynaott.com/storage/788ab3e49b2aa6af247722762ed6e72a',
    streamUrl: 'https://tvsen5.aynascope.net/banglavision/index.m3u8?e=1767960982&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=b96d2910ffc7a59d7270e87ccd30b646',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_38',
    name: 'Bangla TV',
    logo: 'https://s3.aynaott.com/storage/e42ecfa90e3d6b15bdb7fea5ef673864',
    streamUrl: 'https://tvsen6.aynascope.net/banglatv/index.m3u8?e=1767960982&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=b6658bf0f670d96b5af79e6f56e59d29',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_39',
    name: 'BTV World',
    logo: 'https://s3.aynaott.com/storage/b30147b97d86754e4b97fc2989628391',
    streamUrl: 'https://tvsen6.aynascope.net/btv_world/index.m3u8?e=1767960981&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=838e266e92378897f2f9c4aa3690279d',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_40',
    name: 'BTV NATIONAL HD',
    logo: 'https://s3.aynaott.com/storage/9b6f35f73a099b7a5885a970523c5f78',
    streamUrl: 'https://tvsen6.aynascope.net/btvhd/index.m3u8?e=1767960980&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=e113dd28078fbaf09e189f3e261a9bf9',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_41',
    name: 'BTV CTG',
    logo: 'https://s3.aynaott.com/storage/00da8a07fb26b2fb79359ee535e4c7bc',
    streamUrl: 'https://tvsen6.aynascope.net/btvctg/index.m3u8?e=1767960980&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=bb61292e1c20a3f988592f24905ccebb',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_42',
    name: 'Asian TV',
    logo: 'https://s3.aynaott.com/storage/5282cec3a2e9349b750540d658cf1b6c',
    streamUrl: 'https://tvsen6.aynascope.net/asiantv/index.m3u8?e=1767960979&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=7f794e0702cc664d6282906bde53ae7d',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_43',
    name: 'Ananda TV',
    logo: 'https://s3.aynaott.com/storage/897698f593fc07974fc46881a440733d',
    streamUrl: 'https://tvsen6.aynascope.net/anandatv/index.m3u8?e=1767960979&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=24980bf8b090d2d3a7cdcf10abf32f35',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_44',
    name: 'ATN Bangla',
    logo: 'https://s3.aynaott.com/storage/eff41809fca04f7c1da5481e135d7913',
    streamUrl: 'https://tvsen5.aynascope.net/atnbangla/index.m3u8?e=1767960978&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=8b09afedfeb09fd5d67984a135208115',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_45',
    name: '[BD] Ananda TV',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/wCM3l5sBEef-9-uVXFvD/posters/d80f7aee-5bd7-4edc-97eb-ead0e3ebbe09.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/anandatv/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_46',
    name: '[BD] Bijoy TV',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/bns4l5sBcqxnFHJBVZ32/posters/feaf9f3d-cc3b-4a3d-81a3-2cb703e561eb.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/bijoytv/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_47',
    name: '[BD] Jamuna TV',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/PiL635oBEef-9-uV2uCe/posters/36f380e0-6c71-4b27-a73b-2afb3ce7e982.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/jamuna_tv/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_48',
    name: 'Me-tv',
    logo: '',
    streamUrl: 'https://iptvbd.live/metv1080/1080.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_49',
    name: 'R Plus',
    logo: '',
    streamUrl: 'https://thelegitpro.in/pntv/rplusnews24x7/tracks-v1a1/mono.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_50',
    name: 'R Plus Gould',
    logo: '',
    streamUrl: 'https://cdn-4.pishow.tv/live/1231/1231_2.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_51',
    name: 'Jankhar tv',
    logo: '',
    streamUrl: 'https://dbcanada.sonarbanglatv.com/jhankartv/jtv/index.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_52',
    name: 'Deshi tv',
    logo: '',
    streamUrl: 'http://208.86.19.13:81/514.stream/index.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_53',
    name: 'Kolkata TV',
    logo: '',
    streamUrl: 'https://cdn.ottlive.co.in/kolkatatv/index.m3u8',
    category: ["All","BD","News"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_54',
    name: 'ATN Music',
    logo: '',
    streamUrl: 'https://app.ncare.live/c3VydmVyX8RpbEU9Mi8xNy8yMDE0GIDU6RgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcGVMZEJCTEFWeVN3PTOmdFsaWRtaW51aiPhnPTI/atnmusic.stream/playlist.m3u8',
    category: ["All","BD","Music"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_55',
    name: 'NTV UK',
    logo: '',
    streamUrl: 'https://app.ncare.live/c3VydmVyX8RpbEU9Mi8xNy8yMDE0GIDU6RgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcGVMZEJCTEFWeVN3PTOmdFsaWRtaW51aiPhnPTI2/ntvuk00332211.stream/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_56',
    name: 'Green TV',
    logo: '',
    streamUrl: 'https://app.ncare.live/c3VydmVyX8RpbEU9Mi8xNy8yMDE0GIDU6RgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcGVMZEJCTEFWeVN3PTOmdFsaWRtaW51aiPhnPTI2/greentv.stream/live-orgin/greentv.stream/chunks.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_57',
    name: 'Channel S UK HD',
    logo: '',
    streamUrl: 'https://app.ncare.live/c3VydmVyX8RpbEU9Mi8xNy8yMDE0GIDU6RgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcGVMZEJCTEFWeVN3PTOmdFsaWRtaW51aiPhnPTI/chsukoff.stream/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_58',
    name: 'BTV World',
    logo: '',
    streamUrl: 'http://103.230.105.252:1935/live/btv/manifest.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_59',
    name: 'Dipto TV',
    logo: '',
    streamUrl: 'https://owrcovcrpy.gpcdn.net/bpk-tv/1711/output/1711-audio_113412_eng=113200-video=1692000.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_60',
    name: 'Channel I',
    logo: '',
    streamUrl: 'https://owrcovcrpy.gpcdn.net/bpk-tv/1723/output/1723-audio_113532_eng=113200-video=1692000.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_61',
    name: 'NTV',
    logo: '',
    streamUrl: 'https://owrcovcrpy.gpcdn.net/bpk-tv/1716/output/1716-audio_113462_eng=113200-video=1692000.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_62',
    name: 'Independent TV',
    logo: '',
    streamUrl: 'https://owrcovcrpy.gpcdn.net/bpk-tv/1704/output/1704-audio_113342_eng=113200-video=1692000.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_63',
    name: 'Ekattor HD 71 üáßüá©',
    logo: '',
    streamUrl: 'https://owrcovcrpy.gpcdn.net/bpk-tv/1705/output/1705-audio_113352_eng=113200-video=1692000.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_64',
    name: 'Channel 24 üáßüá©',
    logo: '',
    streamUrl: 'https://owrcovcrpy.gpcdn.net/bpk-tv/1703/output/1703-audio_113332_eng=113200-video=1692000.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_65',
    name: 'BTV üáßüá©',
    logo: '',
    streamUrl: 'https://owrcovcrpy.gpcdn.net/bpk-tv/1709/output/1709-audio_113392_eng=113200-video=1692000.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_66',
    name: 'Somoy TV üáßüá©',
    logo: '',
    streamUrl: 'https://owrcovcrpy.gpcdn.net/bpk-tv/1702/output/1702-audio_113322_eng=113200-video=1692000.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_67',
    name: 'Bollywood Movies',
    logo: '',
    streamUrl: 'https://cloudfrontnet.vercel.app/tplay/playout/209593/master.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_68',
    name: '4/7 Doraemon',
    logo: '',
    streamUrl: 'https://cloudfrontnet.vercel.app/tplay/playout/209902/master.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_69',
    name: 'Bollywood Movies',
    logo: '',
    streamUrl: 'https://cloudfrontnet.vercel.app/tplay/playout/209612/master.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_70',
    name: 'Jumuna TV üáßüá©',
    logo: '',
    streamUrl: 'https://owrcovcrpy.gpcdn.net/bpk-tv/1701/output/1701-audio_113312_eng=113200-video=1692000.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_71',
    name: 'Kolkata Movies',
    logo: '',
    streamUrl: 'https://cloudfrontnet.vercel.app/tplay/playout/209627/master.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_72',
    name: '24/7 Gopal Bhar',
    logo: '',
    streamUrl: 'https://cloudfrontnet.vercel.app/tplay/playout/209611/master.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_73',
    name: '24/7 Shinchan',
    logo: '',
    streamUrl: 'https://cloudfrontnet.vercel.app/tplay/playout/209901/master.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_74',
    name: '24/7 Motu Patlu',
    logo: '',
    streamUrl: 'https://cloudfrontnet.vercel.app/tplay/playout/209622/master.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_75',
    name: 'bijoy-tv',
    logo: 'http://tvassets.roarzone.info/images/bijoy-tv.jpg',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/ext/bijoy-tv/index.m3u8?token=29f2153aff82e894eed541024f753b5390e64523-fd137a76f8600b5bcd95548d9ecc6f54-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_76',
    name: 'ekhon',
    logo: 'http://tvassets.roarzone.info/images/ekhon-tv.jpg',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/edge2/ekhontv/index.m3u8?token=76f6cf282e3d51bf9a16c70543d85600aa8e5cbe-d946a57c7e08deff122fead7f16b8ad2-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_77',
    name: 'sangsad tv',
    logo: 'http://tvassets.roarzone.info/images/88.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/88/index.m3u8?token=c333dfe453ef70288251bf41c38ec3f7ce9bdb08-ddcb4ba2f839fb964c068a11e423e3e2-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_78',
    name: 'sa tv',
    logo: 'http://tvassets.roarzone.info/images/15.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/15/index.m3u8?token=d14c03c4b72e020cc1998674f83245259bd858ca-16ed9267b765fcf2c273f61d6f03e853-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_79',
    name: 'rtv',
    logo: 'http://tvassets.roarzone.info/images/14.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/14/index.m3u8?token=a97bc7d7de72039ad86694ed831e48988fd526e3-51b19ae614dd36a4f9e730d8932e323e-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_80',
    name: 'ntv',
    logo: 'http://tvassets.roarzone.info/images/54.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/54/index.m3u8?token=59570e30cb03386c154ea07bfb31674682a69c34-af12d292a82384427f98244d7b956960-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_81',
    name: 'news24',
    logo: 'http://tvassets.roarzone.info/images/18.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/18/index.m3u8?token=b82624c310d6394c2c3230a29d9bf531acca59be-bbedefa3d8a18714fd5bd8c6b3318d23-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_82',
    name: 'my tv',
    logo: 'http://tvassets.roarzone.info/images/56.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/56/index.m3u8?token=646026414cffe613e7de924b3b94d68678cc0f7a-c6105f3aff9cde90d9a6b97d25c79142-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_83',
    name: 'movie bangla tv',
    logo: 'http://tvassets.roarzone.info/images/86.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/86/index.m3u8?token=9a5069f726e022792c168588212114586eb2a7db-2010b7a3d97411ef9ad5cd00f0a989f8-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_84',
    name: 'mohona tv',
    logo: 'http://tvassets.roarzone.info/images/50.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/50/index.m3u8?token=fa3cfa27afa7ab54d56fea6b9b82b6d23b756fe0-746a39cc21961173b3aacc5fa0097f61-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_85',
    name: 'maasranga',
    logo: 'http://tvassets.roarzone.info/images/51.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/51/index.m3u8?token=d9259128e6e9f238d7d8cd06dca8ce73edd01796-86b4feafd3fec42696a05f1486b48ca3-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_86',
    name: 'independent tv',
    logo: 'http://tvassets.roarzone.info/images/12.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/12/index.m3u8?token=0f74aa4e30ec31c2cf267ffb3966356e97eeca14-a6f37e4f90a05c7c4f31cf7fcdd9ad38-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_87',
    name: 'duronto tv',
    logo: 'http://tvassets.roarzone.info/images/10.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/10/index.m3u8?token=616b50b6a12420f8583ba6357474ba6ad9229901-4ac247553b39a86bae27791e6ea5ff3b-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_88',
    name: 'desh tv',
    logo: 'http://tvassets.roarzone.info/images/9.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/9/index.m3u8?token=b77e7dacca5ca073bb66443a624d86d87bdf81a7-a87a942eca914448325664a7bd0d06cc-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_89',
    name: 'deepto tv',
    logo: 'http://tvassets.roarzone.info/images/8.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/8/index.m3u8?token=b3df923810c51cc96003e9373be7c036f3f87752-6f29e558d3ed12842a8fcdbb64486f61-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_90',
    name: 'ekattor tv',
    logo: 'http://tvassets.roarzone.info/images/11.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/11/index.m3u8?token=3c4c4a13564b99af6f2a2ce3fd8c1c45de94cc05-15ade8993c2e603489ed27e310154b5a-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_91',
    name: 'dbc news',
    logo: 'http://tvassets.roarzone.info/images/7.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/7/index.m3u8?token=7b760df0fcd702fb2ed45123edbc44453e957d4f-225197fc315028d23a4a8f5dfdee2287-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_92',
    name: 'channel i',
    logo: 'http://tvassets.roarzone.info/images/6.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/6/index.m3u8?token=f8ca16e990d9aa39234021edf7041b1774702423-b241b93b0c633a6fdf5b6777a8283db6-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_93',
    name: 'channel 9',
    logo: 'http://tvassets.roarzone.info/images/4.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/4/index.m3u8?token=ce83d1cdc3c93dab402687fcaf41195eb3558441-066db3b8080566bb7cacf6680547600e-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_94',
    name: 'btv world',
    logo: 'http://tvassets.roarzone.info/images/84.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/84/index.m3u8?token=250b7efd76679498a069b5a4c0a894ea1cf5f63c-95da25d0ea3c2641136c6126ed67baed-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_95',
    name: 'btv',
    logo: 'http://tvassets.roarzone.info/images/53.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/53/index.m3u8?token=b48170c0a840c67427d46c1e45ce4361dd2f6056-d3a626f7939e7717f0b05cb1440126eb-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_96',
    name: 'boishakhi tv',
    logo: 'http://tvassets.roarzone.info/images/61.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/61/index.m3u8?token=c6b7fc26028f6a18e9859f06816a0a225086c591-7db8a6a2fc1b80e7d2e64349b15775aa-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_97',
    name: 'bangla tv',
    logo: 'http://tvassets.roarzone.info/images/19.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/19/index.m3u8?token=6671a1e3143b0dfc854e2d9f2caeebdc8731bec8-c2dc0bf4fffbe40020c40e060325bec8-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_98',
    name: 'banglavision tv',
    logo: 'http://tvassets.roarzone.info/images/3.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/3/index.m3u8?token=c0b825af412df0372be7a1a29d525e79f8c83a20-8ce6a73c09d61a24519fc72a247b7431-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_99',
    name: 'atn news',
    logo: 'http://tvassets.roarzone.info/images/49.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/49/index.m3u8?token=5620df8cc57c79411ee60a794d4d7373aaf18c71-268a046340ea20ec7a1624ef5183f862-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_100',
    name: 'atn bangla',
    logo: 'http://tvassets.roarzone.info/images/2.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/2/index.m3u8?token=96241696377c2473bab88b92236da950a7e4b333-bd8d9be3e35638c97849f0fffc825b04-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_101',
    name: 'asian tv',
    logo: 'http://tvassets.roarzone.info/images/62.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/edge/asian-tv/index.m3u8?token=e0deac473f534cfbfd109d58b868ac6604d54b29-8210ce371055f423ad954ff6c0525b55-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_102',
    name: 'ekushy tv',
    logo: 'http://tvassets.roarzone.info/images/65.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/65/index.m3u8?token=9368d7f7ed9dc28ee5949d90d0a374b7c10cddeb-c2273d0c2c5aafda33dc50c1629b1329-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_103',
    name: 'somoy tv',
    logo: 'http://tvassets.roarzone.info/images/17.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/edge2/somoy/index.m3u8?token=56f64f3bcfbe32d2f79367fbed6df2977be7bced-660ca57e9fe25ec74ccf5e5c69a6bd2b-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_104',
    name: 'channel 24',
    logo: 'http://tvassets.roarzone.info/images/5.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/edge2/channel24/index.m3u8?token=4b5ba52eff270fb7631185fba35ee1d962ef1251-df8cde2e419865530996a88652982b89-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_105',
    name: 'nagorik tv',
    logo: 'http://tvassets.roarzone.info/images/59.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/edge2/nagorik/index.m3u8?token=fc480985eb1ed48b456ce20683e7c81561527ac6-25d8299e183cc2e544de020e087152ba-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_106',
    name: 'jamuna tv',
    logo: 'http://tvassets.roarzone.info/images/13.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/edge2/jamunatv/index.m3u8?token=5162997205ff952854b7a7f91911520c5cb9d430-b90424be9ab5bda1ddcf9f73dd325ef5-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_107',
    name: 'sony aath',
    logo: 'http://tvassets.roarzone.info/images/33.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/33/index.m3u8?token=042c21f792a62c883098b3b6f7264ba2603ce8c5-f9a6e0998af85dfea44ac70df5fcccaa-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_108',
    name: 'colors bangla',
    logo: 'http://tvassets.roarzone.info/images/66.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/66/index.m3u8?token=86f603462054f169bd8b9540b2d4709162b8d543-321eabc8d1dc006ed9120cdcca9344c3-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_109',
    name: 'zee bangla cinema',
    logo: 'http://tvassets.roarzone.info/images/29.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/29/index.m3u8?token=5425285a6483c61cd93b228b6d28a2958171678c-7b912e0c87157d9bdc0f1560ea553729-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_110',
    name: 'zee bangla',
    logo: 'http://tvassets.roarzone.info/images/34.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/34/index.m3u8?token=be1784f5bfdaea9495e953a970004983a50acd79-314502730939a328044c5e768d3973c9-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_111',
    name: 'star jalsha movies',
    logo: 'http://tvassets.roarzone.info/images/31.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/31/index.m3u8?token=d3b2f51a99ea5714ceaf8050e11d488893ffa1f2-9e49001925f18ae7a47aa65cc80eb994-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_112',
    name: 'star jalsha',
    logo: 'http://tvassets.roarzone.info/images/30.png',
    streamUrl: 'https://edge2.roarzone.info:8443/roarzone/bk/30/index.m3u8?token=797afe3f54d98d2fdc15a5198bb2aedc7e6e3a0e-7ab86367f95869241b8ef8ac73d46042-1767124697-1767121097',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_113',
    name: '[BD] & Pictures HD',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/QMwWnZUBtpl-Sbt7S2sx/posters/8cad9a82-842a-47bf-a060-f17011f11c07.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/andpicture_hd/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_114',
    name: '[BD] Discovery Turbo',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/Ay6s-JQBv9knK3AHJTY1/posters/e8f65578-e82d-4e4a-a1ff-073becc5bd71.webp',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/discovery_turbo/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_115',
    name: '[BD] Discovery Science',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/AS6s-JQBv9knK3AHDTZb/posters/eab8fd0f-9351-464c-b45e-332f38b49f4b.webp',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/discovery_science/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_116',
    name: '[BD] Investigation Discovery HD',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/ay7uX5UBv9knK3AHs6TI/posters/deb3c186-b2e1-4a91-aafb-d86f9128b851.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/discovary_investigation_hd/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_117',
    name: '[BD] TLC HD',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/7S6j-JQBv9knK3AHbzXC/posters/0973097c-bc5c-4b28-aaca-f04d6f6cb5e2.webp',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/tlc_hd/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_118',
    name: '[BD] TLC',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/7C6j-JQBv9knK3AHVzUA/posters/e8f84105-5efe-4e91-a0d4-18a0849cf2f2.webp',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/tlc_sd/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_119',
    name: '[BD] HUM Masala',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/T9O9X5UBm1RY_In7UXFv/posters/30e0f372-eb3e-4cf9-be1e-b196a40c2fc7.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/hum_masala/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_120',
    name: '[BD] Discovery HD',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/KC6x-JQBv9knK3AHqjYc/posters/55e554f1-dbbb-47bd-97fe-fca878726c4c.webp',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/discovery_hd/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_121',
    name: '[BD] Eurosport HD',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/Uy6Q-JQBv9knK3AHcDUQ/posters/01709bcd-6d53-4710-a64f-bc49cecf1d61.webp',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/euro_sports_hd/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_122',
    name: '[BD] Discovery',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/KS6x-JQBv9knK3AHwDZy/posters/6594d216-aaca-4eee-b6f5-bbc6b80feb15.webp',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/discovery_sd/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_123',
    name: '[BD] Discovery Kids',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/1i6e-JQBv9knK3AHHTXR/posters/325887a7-84ea-4cf9-a6fd-6111ddc25671.webp',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/discovery_kids/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_124',
    name: '[BD] Sony Entertainment Television',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/2S5t-JQBv9knK3AHJTTW/posters/ae74f943-77c9-4395-a16c-8ed84b439080.webp',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/sony_entertainment/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_125',
    name: '[BD] Sony MAX HD',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/Ai51-JQBv9knK3AH_jWs/posters/663e52a6-1a9f-4458-b4aa-7c03d84972f1.webp',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/sony_max_hd/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_126',
    name: '[BD] Cartoon Network HD +',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/1y6e-JQBv9knK3AHNDWb/posters/ee9ba01b-1bcf-436b-b273-7b857f0810fb.webp',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/cartoon_network_hd/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_127',
    name: '[BD] B4U Movies APAC',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/PC6F-JQBv9knK3AHlTUO/posters/fb0243ba-39a0-4101-a78c-c197be550c6c.webp',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/b4u_movies/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_128',
    name: '[BD] Cartoon Network',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/mC6W-JQBv9knK3AHfDWA/posters/d2a02d82-fde4-4769-a6d9-95c0560e2120.webp',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/cartoon_network_sd/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_129',
    name: '[BD] POGO',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/ny6W-JQBv9knK3AHujXC/posters/7e7c2afe-a663-4c09-983a-2d0fa0f1ca9a.webp',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/pogo_sd/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_130',
    name: '[BD] Sony PIX HD',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/Ly6C-JQBv9knK3AHOjXt/posters/252e64ca-8d99-46e7-a951-e10c1703c11d.webp',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/sonypix_hd/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_131',
    name: '[BD] B4U Music',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/PS6F-JQBv9knK3AHqjVz/posters/0f83ee72-be0f-4861-94df-30b158d3df8d.webp',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/b4u_music/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_132',
    name: '[BD] BFL | Live 1',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/HHnAgJkBcqxnFHJBabwO/posters/c5bce54b-66b1-4e4f-9a7f-45a551e16f49.png',
    streamUrl: 'https://mprod-cdn.toffeelive.com/live/match-11/index.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_133',
    name: '[BD] ICC Test Championship Highlights',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/PnZefJcBcqxnFHJBoxca/posters/955ae898-8336-4936-8d78-c6b8866e35f7.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/icc_wtc_final/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_134',
    name: '[BD] HUM Sitaray',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/WtPBX5UBm1RY_In7mXEU/posters/188d51f6-aeef-41ed-835b-e25ff911e209.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/hum_sitaray/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_135',
    name: '[BD] HUM',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/0C63X5UBv9knK3AHxaOs/posters/6dce1143-1045-4fec-ac4f-86d2bfb32447.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/hum_tv/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_136',
    name: '[BD] CNN',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/VC6Q-JQBv9knK3AHhTXt/posters/63e79814-8fcf-4c3e-bb66-408b2a402613.webp',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/cnn/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_137',
    name: '[BD] Sony Entertainment Television HD',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/-y50-JQBv9knK3AHLzSn/posters/0ab48ac0-ec84-4ca2-9601-746ff3cb809e.webp',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/sonyentertainmnt_hd/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_138',
    name: '[BD] BFL | Live 2',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/MXnGgJkBcqxnFHJBILyR/posters/fc0d65fb-78c4-481a-a2ce-775796e3b39e.png',
    streamUrl: 'https://mprod-cdn.toffeelive.com/live/match-12/index.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_139',
    name: '[BD] BFL | Live 4',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/Ey9jtJoBNnOkwJLWw06R/posters/4e83252b-223d-42a6-a56b-8598aa17e2e8.png',
    streamUrl: 'https://mprod-cdn.toffeelive.com/live/match-18/index.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_140',
    name: '[BD] BFL | Live 3',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/LnlKhJkBcqxnFHJBU8GM/posters/74e6a7bb-f850-4ec5-991f-7a882b04db37.png',
    streamUrl: 'https://mprod-cdn.toffeelive.com/live/match-13/index.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_141',
    name: '[BD] EPL Channel 5',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/6CHi_5gBEef-9-uV-Bx_/posters/95066512-a117-4532-8569-0d13ffc046ef.png',
    streamUrl: 'https://mprod-cdn.toffeelive.com/live/match-5/index.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_142',
    name: '[BD] EPL Channel 4',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/OyEz-ZgBEef-9-uVnhcx/posters/f2143475-cf44-441a-b55d-58b2b5569aa5.png',
    streamUrl: 'https://mprod-cdn.toffeelive.com/live/match-4/index.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_143',
    name: '[BD] EPL channel 3',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/Pi1TqZgBNnOkwJLWVggf/posters/d0bb78b5-4690-4c12-9c7b-e785eb8d7336.png',
    streamUrl: 'https://mprod-cdn.toffeelive.com/live/match-3/index.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_144',
    name: '[BD] Sony SAB HD',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/ES55-JQBv9knK3AHNDWC/posters/13411be9-62b9-4a99-a062-b6e91dfb1099.webp',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/sonysab_hd/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_145',
    name: '[BD] Zee Action',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/Pc3RD5YBtpl-Sbt7doxr/posters/33d667ae-bcc3-4f6b-b376-76c552136923.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/zee_action/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_146',
    name: '[BD] Zee Cinema HD',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/5y7HX5UBv9knK3AHs6Nk/posters/7582fb79-c15f-4247-ba5b-1d2dd27f3d71.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/zee_cinema_hd/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_147',
    name: '[BD] Zee Bangla Cinema',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/-C7MX5UBv9knK3AHdKOi/posters/90d82846-70b9-44ee-9f7e-e440f00b3be8.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/zee_bangla_cinema/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_148',
    name: '[BD] Zee Bangla',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/kK2aX5UBrjBfS2_RBcKf/posters/ba5dd8dc-4f87-414a-b57f-c9ecdeda5253.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/zee_bangla/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_149',
    name: '[BD] &TV HD',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/5cwRnZUBtpl-Sbt7wWrN/posters/5779ade3-e9ba-4107-b3da-bae6f891500a.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/and_tv_hd/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_150',
    name: '[BD] Zee Bollywood',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/OnSlPJYBcqxnFHJB6lFX/posters/d9ccb2a6-227f-4a41-8714-efaddab5cf5e.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/zee_bollywood/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_151',
    name: '[BD] Zee Anmol',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/7x0Jd5YBEef-9-uVv_Gy/posters/f9c07bfc-9fde-40d0-91a1-e28c5840f400.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/zee_anmol/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_152',
    name: '[BD] Zing',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/DK8dd5YBrjBfS2_Ru22e/posters/a4e57fd0-1853-4540-a9bc-0265ee43b5cb.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/zing_sd/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_153',
    name: '[BD] Zee Cafe',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/U3QEd5YBcqxnFHJBpYzc/posters/8bc7ae1b-1a46-4b76-bdb1-13c7dbd3a95c.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/zee_cafe_hd/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_154',
    name: '[BD] Zee TV HD',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/ltPQX5UBm1RY_In7b3F1/posters/d039d9df-9877-4969-a0b6-56888ebe2385.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/zee_tv_hd/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_155',
    name: '[BD] Toffee Dramas',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/DNMXs5UBm1RY_In7IJ72/posters/5638c4e8-36ba-4e8e-848e-233183b3ec17.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/toffee_drama/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_156',
    name: '[BD] Toffee Movies',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/b60Ss5UBrjBfS2_RJPb8/posters/2e5b8ff3-9deb-4040-947e-4ce6a4674ef0.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/toffee_movie/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_157',
    name: '[BD] Sony BBC Earth HD',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/MC6C-JQBv9knK3AHUzUT/posters/a8c32fd3-2ba7-437c-85ac-de2f1b2fa6ca.webp',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/sonybbc_earth_hd/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_158',
    name: '[BD] Sony MAX 2',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/Ii5_-JQBv9knK3AHLDV3/posters/d961cc87-81b6-4b30-8414-8c0af2774818.webp',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/sonymax_2/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_159',
    name: '[BD] Sony YAY',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/IC5_-JQBv9knK3AHFDXh/posters/36df4012-80f2-4a98-9970-3b663f62093f.webp',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/sonyyay/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_160',
    name: '[BD] Sony MAX',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/Ay52-JQBv9knK3AHFDWt/posters/00afb30b-3c19-4c4c-abd8-891db94e4767.webp',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/sony_max/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_161',
    name: '[BD] Sony Aath',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/xi6xX5UBv9knK3AH9aMk/posters/f4db1c12-b10f-46e8-a09b-e0efb8820970.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/sonyaath/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_162',
    name: '[BD] Sony Ten Cricket',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/ra2x_pQBrjBfS2_RWG9l/posters/795170c2-ec78-457e-9fa0-54a23d23361c.webp',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/ten_cricket/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_163',
    name: '[BD] Sony Ten Sports 5 HD',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/vi5n-JQBv9knK3AHqzTC/posters/241705c1-06a9-4694-92c6-0013d1879e42.webp',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/sony_sports_5_hd/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_164',
    name: '[BD] Sony Ten Sports 1 HD',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/py5j-JQBv9knK3AHxDTY/posters/ea3358b9-2bec-4615-a889-daa2e396c74c.webp',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/sony_sports_1_hd/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_165',
    name: '[BD] Sony Ten Sports 2 HD',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/sy5m-JQBv9knK3AHYTTk/posters/5e40bf0e-633f-4d37-a3b2-3d606f0ac19a.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/sony_sports_2_hd/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_166',
    name: '[BD] EPL channel 2',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/Mi1QqZgBNnOkwJLWxggo/posters/3e9d4d0a-a346-4b39-92b5-13e9238ad240.png',
    streamUrl: 'https://mprod-cdn.toffeelive.com/live/match-2/index.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_167',
    name: '[BD] Bangla TV',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/JiK-_poBEef-9-uVZv6L/posters/757a328e-70d6-45de-b093-0a843c69ade7.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/bangla_tv/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_168',
    name: '[BD] Asian TV',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/MyK__poBEef-9-uVmf5l/posters/1eadef5b-28e7-4dc2-b42f-c67a3357c9a0.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/asian_tv/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_169',
    name: '[BD] Ekhon TV',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/o3v235oBcqxnFHJBkAdC/posters/159af631-796d-4342-a2a7-c272f32bcd32.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/ekhon_tv/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_170',
    name: '[BD] Global TV',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/0y_tDJsBNnOkwJLWNrdE/posters/2ff058e1-630f-4657-8dc6-b677e65642c5.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/global_tv/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_171',
    name: '[BD] Channel S',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/WyPuDJsBEef-9-uVUA_z/posters/ea20055c-a824-443c-8083-ce8e2da8b922.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/channel_s_tv/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_172',
    name: '[BD] Ekattor TV',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/PS_La5oBNnOkwJLWLRN_/posters/e8c444fd-ee3b-4bf3-bb0a-f969bc295f82.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/ekattor_tv/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_173',
    name: '[BD] Channel i',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/qnv835oBcqxnFHJBuQcB/posters/348dfac3-c1e0-485d-a72b-3d282c9e2c73.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/channel_i/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_174',
    name: '[BD] Somoy TV',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/Xi_Ga5oBNnOkwJLWkhKP/posters/ef2899d5-1ae0-4fee-aee5-45f9b0b3ba80.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/somoy_tv/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_175',
    name: '[BD] Independent TV',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/ES_cZZsBNnOkwJLW1Oz1/posters/b872b8f5-cb6b-45a1-a1cd-7609df51d614.png',
    streamUrl: 'https://bldcmprod-cdn.toffeelive.com/cdn/live/independent_tv/playlist.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_176',
    name: '[BD] EPL channel 1',
    logo: 'https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/JS1AqZgBNnOkwJLWlwg-/posters/08617b27-2af1-4035-bcc3-d054ce42ca4b.png',
    streamUrl: 'https://mprod-cdn.toffeelive.com/live/match-1/index.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_177',
    name: 'MAASRANGA HD',
    logo: 'https://static.wikia.nocookie.net/etv-gspn-bangla/images/a/a3/Maasranga_TV_HD_logo.png',
    streamUrl: 'http://mtv.sunplex.live/MAASRANGA-TV/index.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_178',
    name: 'MY TV',
    logo: 'https://raw.githubusercontent.com/subirkumarpaul/Logo/main/My%20TV.svg.png',
    streamUrl: 'https://mytvbangla.com/0.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_179',
    name: 'MUSIC BANGLA',
    logo: 'https://static.wikia.nocookie.net/logopedia/images/7/75/Music_Bangla_new.jpeg',
    streamUrl: 'http://live.matribhumitv.com/music-bangla/index.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
  {
    id: 'tvlist_180',
    name: 'Deshe Bideshe',
    logo: 'https://pbs.twimg.com/profile_images/739539785304281088/zMwNO936_400x400.jpg',
    streamUrl: 'https://dbcanada.sonarbanglatv.com/deshebideshe/dbtv/index.m3u8',
    category: ["All","BD"],
    country: 'BD',
    isPremium: false
  },
];

const CATEGORIES = ['All', 'Favorites', '🇧🇩 BD', '🇮🇳 India', '🏏 Cricket', '⚽ Football', '📰 News', '🎬 Entertainment', '🎵 Music', '🎥 Movies', 'Regional'];

const CAT_MAP: Record<string, string> = {
  'All': 'All',
  'Favorites': 'Favorites',
  '🇧🇩 BD': 'BD',
  '🇮🇳 India': 'IN',
  '🏏 Cricket': 'Cricket',
  '⚽ Football': 'Football',
  '📰 News': 'News',
  '🎬 Entertainment': 'Entertainment',
  '🎵 Music': 'Music',
  '🎥 Movies': 'Movies',
  'Regional': 'Regional',
};

// ─────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────
const LiveTVDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [streamError, setStreamError] = useState(false);
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);

  // Quality
  const [qualityLevels, setQualityLevels] = useState<any[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // Floating (mini) player
  const [isFloating, setIsFloating] = useState(false);
  const [floatPos, setFloatPos] = useState({ x: 0, y: 0 });
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  // Volume / mute
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  // Load favorites
  useEffect(() => {
    try {
      const saved = localStorage.getItem('live_tv_favorites_v2');
      if (saved) setFavorites(JSON.parse(saved));
    } catch {}
  }, []);

  // ── HLS Player Setup ──
  useEffect(() => {
    if (!activeChannel || !videoRef.current) return;
    const video = videoRef.current;

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    setStreamError(false);
    setIsStreamLoading(true);
    setQualityLevels([]);
    setCurrentQuality(-1);

    const url = activeChannel.streamUrl;

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        liveSyncDuration: 3,
        liveMaxLatencyDuration: 10,
        enableWorker: true,
        lowLatencyMode: true,
        manifestLoadingMaxRetry: 3,
        levelLoadingMaxRetry: 3,
        fragLoadingMaxRetry: 3,
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        setIsStreamLoading(false);
        setQualityLevels(data.levels);
        setCurrentQuality(-1);
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => setCurrentQuality(data.level));
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else { hls.destroy(); setIsStreamLoading(false); setStreamError(true); }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => { setIsStreamLoading(false); video.play().catch(() => {}); });
      video.addEventListener('error', () => { setIsStreamLoading(false); setStreamError(true); });
    } else {
      setStreamError(true);
    }

    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [activeChannel]);

  // ── Floating Player on Scroll ──
  useEffect(() => {
    const handleScroll = () => {
      if (!playerContainerRef.current || !activeChannel) return;
      const rect = playerContainerRef.current.getBoundingClientRect();
      if (rect.bottom < 60) {
        setIsFloating(true);
      } else {
        setIsFloating(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeChannel]);

  // ── Draggable floating player (touch + mouse) ──
  const onDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isFloating) return;
    isDragging.current = true;
    const client = 'touches' in e ? e.touches[0] : e;
    dragStart.current = { x: client.clientX, y: client.clientY, posX: floatPos.x, posY: floatPos.y };
  }, [isFloating, floatPos]);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      const client = 'touches' in e ? (e as TouchEvent).touches[0] : (e as MouseEvent);
      setFloatPos({
        x: dragStart.current.posX + client.clientX - dragStart.current.x,
        y: dragStart.current.posY + client.clientY - dragStart.current.y,
      });
    };
    const onUp = () => { isDragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  const changeQuality = (level: number) => {
    if (hlsRef.current) { hlsRef.current.currentLevel = level; setCurrentQuality(level); setShowQualityMenu(false); }
  };

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('live_tv_favorites_v2', JSON.stringify(next));
      return next;
    });
  };

  const handleChannelClick = (ch: Channel) => {
    if (activeChannel?.id === ch.id) return;
    setActiveChannel(ch);
    setStreamError(false);
    setIsFloating(false);
    setFloatPos({ x: 0, y: 0 });
    // Scroll to player
    setTimeout(() => playerContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const closePlayer = () => {
    setActiveChannel(null);
    setStreamError(false);
    setIsFloating(false);
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
  };

  const filteredChannels = CHANNELS.filter(ch => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || ch.name.toLowerCase().includes(q) || ch.description?.toLowerCase().includes(q);
    const cat = CAT_MAP[selectedCategory] || selectedCategory;
    const matchesCat =
      cat === 'All' ? true :
      cat === 'Favorites' ? favorites.includes(ch.id) :
      ch.category.includes(cat);
    return matchesSearch && matchesCat;
  });

  const getCatCount = (label: string) => {
    const cat = CAT_MAP[label] || label;
    if (cat === 'All') return CHANNELS.length;
    if (cat === 'Favorites') return CHANNELS.filter(c => favorites.includes(c.id)).length;
    return CHANNELS.filter(c => c.category.includes(cat)).length;
  };

  const flagOf = (c: Channel) => c.country === 'BD' ? '🇧🇩' : c.country === 'IN' ? '🇮🇳' : '🌐';

  // ── Floating player style ──
  const floatingStyle: React.CSSProperties = isFloating ? {
    position: 'fixed',
    bottom: 90,
    right: 12,
    width: 'min(320px, 92vw)',
    zIndex: 9999,
    transform: `translate(${floatPos.x}px, ${floatPos.y}px)`,
    cursor: 'grab',
  } : {};

  return (
    <div className="livetv-root">
      {/* ── HEADER ── */}
      <div className="livetv-header">
        <button onClick={() => navigate(-1)} className="livetv-back-btn">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="livetv-title">📺 Live TV</h1>
          <p className="livetv-subtitle">BD · India · Cricket · Football</p>
        </div>
        <div className="livetv-live-pill">
          <span className="livetv-dot" />
          LIVE
        </div>
      </div>

      {/* ── NOW PLAYING BAR ── */}
      {activeChannel && (
        <div className="livetv-now-playing">
          <img
            src={activeChannel.logo}
            alt={activeChannel.name}
            className="livetv-np-logo"
            onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChannel.name)}&background=1e1e2f&color=fff&bold=true`; }}
          />
          <div className="livetv-np-info">
            <span className="livetv-np-name">{flagOf(activeChannel)} {activeChannel.name}</span>
            <span className="livetv-np-desc">{activeChannel.description}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
            {/* Quality button */}
            <div style={{ position: 'relative' }}>
              <button className="livetv-ctrl-btn" onClick={() => setShowQualityMenu(p => !p)} title="Quality">
                ⚙️
              </button>
              <AnimatePresence>
                {showQualityMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="livetv-quality-menu"
                  >
                    <div className="livetv-quality-title">Quality</div>
                    <button onClick={() => changeQuality(-1)} className={`livetv-quality-item ${currentQuality === -1 ? 'active' : ''}`}>
                      Auto {currentQuality === -1 && '✓'}
                    </button>
                    {qualityLevels.map((lv, i) => (
                      <button key={i} onClick={() => changeQuality(i)} className={`livetv-quality-item ${currentQuality === i ? 'active' : ''}`}>
                        {lv.height}p {currentQuality === i && '✓'}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button className="livetv-ctrl-btn livetv-close-btn" onClick={closePlayer} title="Close">✕</button>
          </div>
        </div>
      )}

      {/* ── VIDEO PLAYER ── */}
      <div ref={playerContainerRef} className="livetv-player-anchor">
        <div
          className={`livetv-player-wrap ${isFloating ? 'floating' : ''}`}
          style={floatingStyle}
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
        >
          {isFloating && (
            <div className="livetv-float-controls">
              <button onClick={() => { setIsFloating(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="livetv-float-btn" title="Expand">⤢</button>
              <button onClick={closePlayer} className="livetv-float-btn livetv-float-close" title="Close">✕</button>
            </div>
          )}

          {activeChannel ? (
            <>
              {isStreamLoading && !streamError && (
                <div className="livetv-overlay">
                  <div className="livetv-spinner" />
                  <p className="livetv-overlay-text">Connecting to {activeChannel.name}…</p>
                </div>
              )}
              {streamError && (
                <div className="livetv-overlay livetv-error">
                  <span style={{ fontSize: 40 }}>⚠️</span>
                  <p className="livetv-overlay-text" style={{ marginTop: 8 }}>Stream unavailable</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4, textAlign: 'center', maxWidth: 220 }}>
                    This channel's stream is offline or blocked. Try another.
                  </p>
                  <button className="livetv-retry-btn" onClick={() => { setStreamError(false); setActiveChannel({ ...activeChannel }); }}>
                    Retry
                  </button>
                </div>
              )}
              <video
                ref={videoRef}
                className="livetv-video"
                controls
                playsInline
                autoPlay
                muted={isMuted}
                onWaiting={() => setIsStreamLoading(true)}
                onPlaying={() => setIsStreamLoading(false)}
                onVolumeChange={e => { setIsMuted((e.target as HTMLVideoElement).muted); setVolume((e.target as HTMLVideoElement).volume); }}
              />
              {isFloating && (
                <div className="livetv-float-label">
                  {flagOf(activeChannel)} {activeChannel.name}
                </div>
              )}
            </>
          ) : (
            <div className="livetv-idle">
              <div className="livetv-idle-icon">📺</div>
              <p className="livetv-idle-text">Select a channel to start watching</p>
              <p className="livetv-idle-sub">BD · India · Cricket · Football · News</p>
            </div>
          )}
        </div>
      </div>

      {/* ── SEARCH ── */}
      <div className="livetv-search-wrap">
        <span className="livetv-search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search channels…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="livetv-search"
        />
        {searchQuery && (
          <button className="livetv-search-clear" onClick={() => setSearchQuery('')}>✕</button>
        )}
      </div>

      {/* ── CATEGORY TABS ── */}
      <div className="livetv-cats">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`livetv-cat-btn ${selectedCategory === cat ? 'active' : ''}`}
          >
            {cat}
            <span className="livetv-cat-count">{getCatCount(cat)}</span>
          </button>
        ))}
      </div>

      {/* ── CHANNEL GRID ── */}
      <div className="livetv-grid">
        {filteredChannels.length === 0 ? (
          <div className="livetv-empty">No channels found</div>
        ) : filteredChannels.map(ch => {
          const isActive = activeChannel?.id === ch.id;
          const isFav = favorites.includes(ch.id);
          return (
            <div
              key={ch.id}
              onClick={() => handleChannelClick(ch)}
              className={`livetv-channel ${isActive ? 'livetv-channel-active' : ''}`}
            >
              {/* Logo */}
              <div className="livetv-ch-logo-wrap">
                <img
                  src={ch.logo}
                  alt={ch.name}
                  className="livetv-ch-logo"
                  loading="lazy"
                  onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ch.name)}&background=1e1e2f&color=fff&bold=true&size=100`; }}
                />
                {isActive && <span className="livetv-live-badge">LIVE</span>}
              </div>

              {/* Info */}
              <div className="livetv-ch-info">
                <div className="livetv-ch-name">
                  <span>{flagOf(ch)}</span>
                  <span className={isActive ? 'text-indigo-400' : ''}>{ch.name}</span>
                </div>
                <div className="livetv-ch-cats">
                  {ch.category.slice(0, 3).map(c => (
                    <span key={c} className="livetv-ch-cat-tag">{c}</span>
                  ))}
                </div>
              </div>

              {/* Favorite */}
              <button className="livetv-fav-btn" onClick={e => toggleFavorite(e, ch.id)}>
                <span style={{ fontSize: 18 }}>{isFav ? '❤️' : '🤍'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* ── STYLES ── */}
      <style>{`
        .livetv-root {
          min-height: 100vh;
          background: linear-gradient(160deg, #06060f 0%, #0d0d24 50%, #06060f 100%);
          color: #fff;
          font-family: 'Inter', sans-serif;
          padding: 1rem 1rem 6rem;
          overflow-x: hidden;
        }
        @media (min-width: 768px) { .livetv-root { padding: 1.5rem 2rem 4rem; } }

        /* HEADER */
        .livetv-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
        }
        .livetv-back-btn {
          width: 40px; height: 40px; border-radius: 12px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.6); cursor: pointer; transition: all 0.2s;
          flex-shrink: 0;
        }
        .livetv-back-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
        .livetv-title { font-size: clamp(1.2rem, 4vw, 1.6rem); font-weight: 900; background: linear-gradient(135deg, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 0; }
        .livetv-subtitle { font-size: 0.7rem; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.12em; margin: 2px 0 0; }
        .livetv-live-pill { margin-left: auto; display: flex; align-items: center; gap: 6px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #f87171; font-size: 0.65rem; font-weight: 900; letter-spacing: 0.15em; padding: 4px 10px; border-radius: 999px; }
        .livetv-dot { width: 6px; height: 6px; border-radius: 50%; background: #ef4444; animation: livePulse 1.2s ease-in-out infinite; }
        @keyframes livePulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.5); } }

        /* NOW PLAYING */
        .livetv-now-playing {
          display: flex; align-items: center; gap: 12px;
          background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.25);
          border-radius: 18px; padding: 12px 14px; margin-bottom: 1rem;
          backdrop-filter: blur(12px); flex-wrap: wrap;
        }
        .livetv-np-logo { width: 48px; height: 48px; border-radius: 12px; object-fit: contain; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); flex-shrink: 0; }
        .livetv-np-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
        .livetv-np-name { font-size: 0.9rem; font-weight: 800; color: #a5b4fc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .livetv-np-desc { font-size: 0.7rem; color: rgba(255,255,255,0.4); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .livetv-ctrl-btn { width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .livetv-ctrl-btn:hover { background: rgba(255,255,255,0.12); }
        .livetv-close-btn:hover { background: rgba(239,68,68,0.2) !important; color: #f87171; }
        .livetv-quality-menu { position: absolute; right: 0; top: 42px; width: 140px; background: #161b22; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 6px; z-index: 999; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .livetv-quality-title { font-size: 0.6rem; font-weight: 800; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.12em; padding: 4px 8px 6px; }
        .livetv-quality-item { width: 100%; text-align: left; padding: 8px 10px; border-radius: 10px; font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.7); background: transparent; border: none; cursor: pointer; transition: all 0.15s; display: flex; justify-content: space-between; }
        .livetv-quality-item:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .livetv-quality-item.active { background: #6366f1; color: #fff; }

        /* PLAYER */
        .livetv-player-anchor {
          width: 100%;
          aspect-ratio: 16/9;
          margin-bottom: 1.25rem;
          position: relative;
        }
        .livetv-player-wrap {
          width: 100%; height: 100%;
          background: #000;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08);
          position: relative;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6);
        }
        .livetv-player-wrap.floating {
          height: auto;
          aspect-ratio: 16/9;
          border-radius: 16px;
          border: 2px solid rgba(99,102,241,0.7);
          box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.3);
        }
        .livetv-video { width: 100%; height: 100%; object-fit: contain; display: block; }
        .livetv-overlay {
          position: absolute; inset: 0; z-index: 20;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
        }
        .livetv-spinner { width: 44px; height: 44px; border: 4px solid rgba(255,255,255,0.15); border-top-color: #818cf8; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .livetv-overlay-text { margin-top: 14px; font-size: 0.85rem; font-weight: 700; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.1em; }
        .livetv-retry-btn { margin-top: 14px; padding: 8px 20px; border-radius: 10px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); color: #fff; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .livetv-retry-btn:hover { background: rgba(255,255,255,0.2); }
        .livetv-idle { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 10px; }
        .livetv-idle-icon { font-size: clamp(2.5rem, 8vw, 4rem); animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .livetv-idle-text { font-size: 0.9rem; font-weight: 700; color: rgba(255,255,255,0.5); text-align: center; }
        .livetv-idle-sub { font-size: 0.7rem; color: rgba(255,255,255,0.3); font-weight: 600; letter-spacing: 0.08em; text-align: center; }

        /* FLOATING CONTROLS */
        .livetv-float-controls { position: absolute; top: 8px; right: 8px; z-index: 30; display: flex; gap: 6px; }
        .livetv-float-btn { width: 28px; height: 28px; border-radius: 50%; background: rgba(0,0,0,0.7); border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.8); font-size: 0.75rem; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .livetv-float-btn:hover { background: rgba(255,255,255,0.15); color: #fff; }
        .livetv-float-close:hover { background: rgba(239,68,68,0.5) !important; color: #fff; }
        .livetv-float-label { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); padding: 20px 10px 8px; font-size: 0.72rem; font-weight: 700; color: rgba(255,255,255,0.8); pointer-events: none; }

        /* SEARCH */
        .livetv-search-wrap { position: relative; margin-bottom: 1rem; }
        .livetv-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 1rem; pointer-events: none; }
        .livetv-search { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 12px 40px 12px 42px; color: #fff; font-size: 0.88rem; font-weight: 600; outline: none; transition: border-color 0.2s; }
        .livetv-search::placeholder { color: rgba(255,255,255,0.25); }
        .livetv-search:focus { border-color: rgba(99,102,241,0.5); background: rgba(99,102,241,0.05); }
        .livetv-search-clear { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: rgba(255,255,255,0.4); cursor: pointer; font-size: 0.9rem; padding: 4px; }

        /* CATEGORIES */
        .livetv-cats {
          display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px;
          margin-bottom: 1rem; scrollbar-width: none;
        }
        .livetv-cats::-webkit-scrollbar { display: none; }
        .livetv-cat-btn {
          white-space: nowrap; padding: 8px 14px; border-radius: 12px;
          font-size: 0.8rem; font-weight: 700; border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.5);
          cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px;
          flex-shrink: 0;
        }
        .livetv-cat-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8); }
        .livetv-cat-btn.active { background: #6366f1; color: #fff; border-color: #6366f1; box-shadow: 0 4px 20px rgba(99,102,241,0.3); }
        .livetv-cat-count { background: rgba(0,0,0,0.25); border-radius: 6px; padding: 1px 6px; font-size: 0.65rem; }
        .livetv-cat-btn.active .livetv-cat-count { background: rgba(255,255,255,0.2); }

        /* CHANNEL GRID */
        .livetv-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        @media (min-width: 480px) { .livetv-grid { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 900px) { .livetv-grid { grid-template-columns: 1fr 1fr 1fr; } }
        @media (min-width: 1200px) { .livetv-grid { grid-template-columns: repeat(4, 1fr); } }

        .livetv-channel {
          display: flex; align-items: center; gap: 12px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; padding: 12px; cursor: pointer;
          transition: all 0.2s; position: relative; overflow: hidden;
        }
        .livetv-channel:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.1); transform: translateY(-1px); }
        .livetv-channel-active {
          background: rgba(99,102,241,0.1) !important;
          border-color: rgba(99,102,241,0.4) !important;
          box-shadow: 0 0 20px rgba(99,102,241,0.15);
        }
        .livetv-ch-logo-wrap { position: relative; flex-shrink: 0; }
        .livetv-ch-logo { width: 52px; height: 52px; border-radius: 12px; object-fit: contain; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); }
        .livetv-live-badge { position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); background: #ef4444; color: #fff; font-size: 0.5rem; font-weight: 900; letter-spacing: 0.08em; padding: 2px 6px; border-radius: 6px; white-space: nowrap; }
        .livetv-ch-info { flex: 1; min-width: 0; }
        .livetv-ch-name { display: flex; align-items: center; gap: 5px; font-size: 0.85rem; font-weight: 800; color: #e2e8f0; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .livetv-ch-cats { display: flex; flex-wrap: wrap; gap: 4px; }
        .livetv-ch-cat-tag { font-size: 0.6rem; font-weight: 700; color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.05); padding: 2px 7px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.06em; }
        .livetv-fav-btn { background: transparent; border: none; cursor: pointer; flex-shrink: 0; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 10px; transition: all 0.2s; }
        .livetv-fav-btn:hover { background: rgba(255,255,255,0.06); }
        .livetv-empty { grid-column: 1/-1; text-align: center; padding: 40px 20px; color: rgba(255,255,255,0.3); font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; }
      `}</style>
    </div>
  );
};

export default LiveTVDashboard;
