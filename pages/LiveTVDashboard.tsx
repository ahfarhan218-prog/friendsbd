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
  // ── BANGLADESH ──
  {
    id: 'atv',
    name: 'A Television (ATV)',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/54/A_Television_logo.png/200px-A_Television_logo.png',
    streamUrl: 'https://atv.amagi.tv/amagi_hls_data_atvbd-atelevision/CDN/playlist.m3u8',
    category: ['BD', 'News', 'Entertainment'],
    country: 'BD',
    isPremium: false,
    description: 'A Television - Bangladesh News & Entertainment',
  },
  {
    id: 'ekattor',
    name: 'Ekattor TV',
    logo: 'https://upload.wikimedia.org/wikipedia/en/1/1d/Ekattor_tv_logo.png',
    streamUrl: 'https://live.ekattor.tv/ekattor/ekattor.m3u8',
    category: ['BD', 'News'],
    country: 'BD',
    isPremium: false,
    description: 'Ekattor TV - Leading Bengali News Channel',
  },
  {
    id: 'somoy',
    name: 'Somoy TV',
    logo: 'https://upload.wikimedia.org/wikipedia/en/7/79/Somoy_TV_Logo.png',
    streamUrl: 'https://b-hls-14.doppiocdn.live/hls/2371614/2371614.m3u8',
    category: ['BD', 'News'],
    country: 'BD',
    isPremium: false,
    description: 'Somoy TV - Bangladesh 24/7 News',
  },
  {
    id: 'channel24',
    name: 'Channel 24',
    logo: 'https://upload.wikimedia.org/wikipedia/en/2/2e/Channel_24_Bangladesh.png',
    streamUrl: 'https://b-hls-14.doppiocdn.live/hls/3152426/3152426.m3u8',
    category: ['BD', 'News'],
    country: 'BD',
    isPremium: false,
    description: 'Channel 24 - Bangladeshi News Channel',
  },
  {
    id: 'ntv',
    name: 'NTV Bangladesh',
    logo: 'https://upload.wikimedia.org/wikipedia/en/b/bf/NTV_Bangladesh.jpg',
    streamUrl: 'https://ntv.amagi.tv/amagi_hls_data_atvbd-ntv/CDN/playlist.m3u8',
    category: ['BD', 'Entertainment', 'News'],
    country: 'BD',
    isPremium: false,
    description: 'NTV - Entertainment & News from Bangladesh',
  },
  {
    id: 'rtv',
    name: 'RTV Bangladesh',
    logo: 'https://upload.wikimedia.org/wikipedia/en/7/7b/RTV_Logo.png',
    streamUrl: 'https://rtv.amagi.tv/amagi_hls_data_rtvbd-rtv/CDN/playlist.m3u8',
    category: ['BD', 'Entertainment'],
    country: 'BD',
    isPremium: false,
    description: 'RTV - Bangladesh Entertainment',
  },
  {
    id: 'dbc',
    name: 'DBC News',
    logo: 'https://upload.wikimedia.org/wikipedia/en/f/fb/DBC_News_logo.png',
    streamUrl: 'https://b-hls-14.doppiocdn.live/hls/2371660/2371660.m3u8',
    category: ['BD', 'News'],
    country: 'BD',
    isPremium: false,
    description: 'DBC News - Dhaka Broadcast Corporation',
  },
  {
    id: 'bdnews24',
    name: 'BDNews24 TV',
    logo: 'https://ui-avatars.com/api/?name=BDN24&background=c0392b&color=fff&bold=true&size=128',
    streamUrl: 'https://bnnews.amagi.tv/amagi_hls_data_bnnewslive-bnnewstv/CDN/playlist.m3u8',
    category: ['BD', 'News'],
    country: 'BD',
    isPremium: false,
    description: 'BDNews24 - Online News from Bangladesh',
  },
  {
    id: 'jamuna',
    name: 'Jamuna TV',
    logo: 'https://upload.wikimedia.org/wikipedia/en/f/f1/Jamuna_Television_logo.png',
    streamUrl: 'https://b-hls-14.doppiocdn.live/hls/3117700/3117700.m3u8',
    category: ['BD', 'News', 'Entertainment'],
    country: 'BD',
    isPremium: false,
    description: 'Jamuna TV - Bangladesh',
  },
  {
    id: 'tara',
    name: 'Tara Muzik',
    logo: 'https://ui-avatars.com/api/?name=Tara+M&background=8e44ad&color=fff&bold=true&size=128',
    streamUrl: 'https://taramusik.amagi.tv/amagi_hls_data_starbd-taramusik/CDN/playlist.m3u8',
    category: ['BD', 'Music'],
    country: 'BD',
    isPremium: false,
    description: 'Tara Muzik - Bengali Music Channel',
  },

  // ── INDIA ──
  {
    id: 'aaj_tak',
    name: 'Aaj Tak',
    logo: 'https://upload.wikimedia.org/wikipedia/en/6/6b/Aajtak_logo.png',
    streamUrl: 'https://aajtaklive-lh.akamaihd.net/i/aajtaklive_1@327786/master.m3u8',
    category: ['IN', 'News', 'Hindi'],
    country: 'IN',
    isPremium: false,
    description: 'Aaj Tak - India\'s No.1 Hindi News Channel',
  },
  {
    id: 'india_tv',
    name: 'India TV',
    logo: 'https://upload.wikimedia.org/wikipedia/en/7/70/India_TV_logo.png',
    streamUrl: 'https://indiatv-lh.akamaihd.net/i/indiatv_1@493635/master.m3u8',
    category: ['IN', 'News', 'Hindi'],
    country: 'IN',
    isPremium: false,
    description: 'India TV - Hindi News',
  },
  {
    id: 'star_plus',
    name: 'Star Plus',
    logo: 'https://upload.wikimedia.org/wikipedia/en/3/3d/Star_Plus_logo_2021.png',
    streamUrl: 'https://starplus.amagi.tv/amagi_hls_data_startv-starplus/CDN/playlist.m3u8',
    category: ['IN', 'Hindi', 'Entertainment'],
    country: 'IN',
    isPremium: false,
    description: 'Star Plus - India\'s Entertainment Leader',
  },
  {
    id: 'colors',
    name: 'Colors TV',
    logo: 'https://upload.wikimedia.org/wikipedia/en/1/12/Colors_TV_Logo.png',
    streamUrl: 'https://colorstv.amagi.tv/amagi_hls_data_colorstv-colorstv/CDN/playlist.m3u8',
    category: ['IN', 'Hindi', 'Entertainment'],
    country: 'IN',
    isPremium: false,
    description: 'Colors TV - Vibrant Hindi Entertainment',
  },
  {
    id: 'zee_news',
    name: 'Zee News',
    logo: 'https://upload.wikimedia.org/wikipedia/en/9/98/Zee_News_logo.png',
    streamUrl: 'https://zee24ghantanews-lh.akamaihd.net/i/zee24ghantanews_1@225849/master.m3u8',
    category: ['IN', 'News', 'Hindi'],
    country: 'IN',
    isPremium: false,
    description: 'Zee News - Hindi News Channel',
  },
  {
    id: 'sony_max',
    name: 'Sony MAX',
    logo: 'https://upload.wikimedia.org/wikipedia/en/1/1d/Sony_MAX_India_Logo.png',
    streamUrl: 'https://sonymax.amagi.tv/amagi_hls_data_sonyliv-sonymax/CDN/playlist.m3u8',
    category: ['IN', 'Movies', 'Hindi'],
    country: 'IN',
    isPremium: false,
    description: 'Sony MAX - Blockbuster Movies',
  },
  {
    id: 'sun_tv',
    name: 'Sun TV',
    logo: 'https://upload.wikimedia.org/wikipedia/en/f/f3/Sun_TV.png',
    streamUrl: 'https://suntv.amagi.tv/amagi_hls_data_suntv-suntv/CDN/playlist.m3u8',
    category: ['IN', 'Entertainment', 'Regional'],
    country: 'IN',
    isPremium: false,
    description: 'Sun TV - Tamil Entertainment',
  },
  {
    id: 'dd_national',
    name: 'DD National',
    logo: 'https://upload.wikimedia.org/wikipedia/en/6/6f/DD_National_logo.png',
    streamUrl: 'https://ddnational.amagi.tv/amagi_hls_data_prasarbharati-ddnational/CDN/playlist.m3u8',
    category: ['IN', 'Entertainment', 'News'],
    country: 'IN',
    isPremium: false,
    description: 'Doordarshan National - India\'s Public Broadcaster',
  },

  // ── CRICKET / SPORTS ──
  {
    id: 'willow_cricket',
    name: 'Willow Cricket',
    logo: 'https://upload.wikimedia.org/wikipedia/en/8/84/Willow_TV_logo.png',
    streamUrl: 'https://willowtvhd-lh.akamaihd.net/i/willowtv_1@304847/master.m3u8',
    category: ['Sports', 'Cricket', 'INTL'],
    country: 'INTL',
    isPremium: false,
    description: 'Willow Cricket - Live Cricket Streaming',
  },
  {
    id: 'dd_sports',
    name: 'DD Sports',
    logo: 'https://upload.wikimedia.org/wikipedia/en/b/bb/DD_Sports_logo.png',
    streamUrl: 'https://ddsports.amagi.tv/amagi_hls_data_prasarbharati-ddsports/CDN/playlist.m3u8',
    category: ['Sports', 'Cricket', 'IN'],
    country: 'IN',
    isPremium: false,
    description: 'DD Sports - India\'s Sports Channel',
  },
  {
    id: 'star_sports_1',
    name: 'Star Sports 1',
    logo: 'https://upload.wikimedia.org/wikipedia/en/a/a2/Star_Sports_1_logo.png',
    streamUrl: 'https://starsports1.amagi.tv/amagi_hls_data_starsports-starsports1/CDN/playlist.m3u8',
    category: ['Sports', 'Cricket', 'Football', 'IN'],
    country: 'IN',
    isPremium: false,
    description: 'Star Sports 1 - Live Cricket & Football',
  },
  {
    id: 'star_sports_2',
    name: 'Star Sports 2',
    logo: 'https://upload.wikimedia.org/wikipedia/en/3/3a/Star_Sports_2_logo.png',
    streamUrl: 'https://starsports2.amagi.tv/amagi_hls_data_starsports-starsports2/CDN/playlist.m3u8',
    category: ['Sports', 'Cricket', 'Football', 'IN'],
    country: 'IN',
    isPremium: false,
    description: 'Star Sports 2 - Live Sports Coverage',
  },
  {
    id: 'sony_six',
    name: 'Sony SIX',
    logo: 'https://upload.wikimedia.org/wikipedia/en/2/24/Sony_Six_logo.png',
    streamUrl: 'https://sonysix.amagi.tv/amagi_hls_data_sonyliv-sonysix/CDN/playlist.m3u8',
    category: ['Sports', 'Cricket', 'Football', 'IN'],
    country: 'IN',
    isPremium: false,
    description: 'Sony SIX - Sports Entertainment',
  },
  {
    id: 'sony_ten1',
    name: 'Sony TEN 1',
    logo: 'https://upload.wikimedia.org/wikipedia/en/9/90/Sony_TEN_1_logo.png',
    streamUrl: 'https://sonyten1.amagi.tv/amagi_hls_data_sonyliv-sonyten1/CDN/playlist.m3u8',
    category: ['Sports', 'Cricket', 'Football', 'IN'],
    country: 'IN',
    isPremium: false,
    description: 'Sony TEN 1 - Live Sports',
  },
  {
    id: 'sony_ten2',
    name: 'Sony TEN 2',
    logo: 'https://upload.wikimedia.org/wikipedia/en/c/c8/Sony_TEN_2_logo.png',
    streamUrl: 'https://sonyten2.amagi.tv/amagi_hls_data_sonyliv-sonyten2/CDN/playlist.m3u8',
    category: ['Sports', 'Football', 'IN'],
    country: 'IN',
    isPremium: false,
    description: 'Sony TEN 2 - Football & Sports',
  },
  {
    id: 'eurosport',
    name: 'Eurosport',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Eurosport_logo.svg/320px-Eurosport_logo.svg.png',
    streamUrl: 'https://eurosport.amagi.tv/amagi_hls_data_eurosport-eurosport/CDN/playlist.m3u8',
    category: ['Sports', 'Football', 'Cricket', 'INTL'],
    country: 'INTL',
    isPremium: false,
    description: 'Eurosport - Pan-European Sports',
  },

  // ── INTERNATIONAL / NEWS ──
  {
    id: 'bbc_world',
    name: 'BBC World News',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/BBC_World_News_2022_%28Boxed%29.svg/320px-BBC_World_News_2022_%28Boxed%29.svg.png',
    streamUrl: 'https://vs-hls-push-ww-live.akamaized.net/x=4/i=urn:bbc:pips:service:bbc_world_service/t=3840/v=pv14/b=5070016/me=1/init.m3u8',
    category: ['News', 'INTL'],
    country: 'INTL',
    isPremium: false,
    description: 'BBC World News - Global Breaking News',
  },
  {
    id: 'al_jazeera',
    name: 'Al Jazeera English',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Al_Jazeera_English.svg/320px-Al_Jazeera_English.svg.png',
    streamUrl: 'https://aljazeera-eng-apple-live.adaptive.level3.net/apple/aljazeera/english/applelive.m3u8',
    category: ['News', 'INTL'],
    country: 'INTL',
    isPremium: false,
    description: 'Al Jazeera English - Middle East & World News',
  },
  {
    id: 'cgtn',
    name: 'CGTN News',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/CGTN_logo.svg/320px-CGTN_logo.svg.png',
    streamUrl: 'https://live.cgtn.com/1000/prog_index.m3u8',
    category: ['News', 'INTL'],
    country: 'INTL',
    isPremium: false,
    description: 'CGTN - China Global Television Network',
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
