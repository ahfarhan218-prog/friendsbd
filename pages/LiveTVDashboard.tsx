import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import { motion, AnimatePresence } from 'framer-motion';
import { mongoService, API_BASE } from '../services/mongoService';

interface Channel {
  _id: string;
  name: string;
  logoUrl: string;
  streamUrl?: string; // Fetched when clicked if allowed
  category: string[];
  isPremium: boolean;
}

const CATEGORIES = ['All', 'Favorites', 'Premium', 'BD', 'Hindi', 'Movies', 'Sports', 'Kids', 'News', 'Music', 'Nature', 'Entertainment', 'Regional', 'Infotainment', 'International'];

const LiveTVDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<boolean>(false);
  const [isStreamLoading, setIsStreamLoading] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [viewersCount, setViewersCount] = useState<number>(0);

  // Quality Selection State
  const [qualityLevels, setQualityLevels] = useState<any[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // Floating Player State
  const [isFloating, setIsFloating] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load current user from session
    const saved = localStorage.getItem('user_session');
    if (saved) {
      setUser(JSON.parse(saved));
    }

    // Load favorites from local storage
    const savedFavs = localStorage.getItem('live_tv_favorites');
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch(e) {}
    }

    // Fetch Channels
    mongoService.getChannels()
      .then(data => {
        setChannels(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load channels:', err);
        setLoading(false);
      });
  }, []);

  // HLS Player Setup
  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    const video = videoRef.current;

    // Cleanup previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        liveSyncDuration: 3,
        liveMaxLatencyDuration: 10,
        enableWorker: true,
        lowLatencyMode: true,
        manifestLoadingMaxRetry: 5,
        levelLoadingMaxRetry: 5,
        fragLoadingMaxRetry: 5,
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setIsStreamLoading(false);
        setQualityLevels(data.levels);
        setCurrentQuality(hls.currentLevel);
        video.play().catch(e => console.error("Autoplay failed:", e));
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        setCurrentQuality(data.level);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setIsStreamLoading(false);
              setStreamError(true);
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari fallback
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsStreamLoading(false);
        video.play().catch(e => console.error("Autoplay failed:", e));
      });
      video.addEventListener('error', () => {
        setIsStreamLoading(false);
        setStreamError(true);
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl]);

  const handleChannelClick = async (channel: Channel) => {
    if (activeChannel?._id === channel._id) {
      return;
    }

    // Premium Check Restriction
    if (channel.isPremium && (!user || !user.isPremium)) {
      setShowPremiumModal(true);
      return;
    }

    setStreamError(false);
    setIsStreamLoading(true);
    // Real-time viewer tracking is now handled by the heartbeat useEffect
    
    try {
      const res = await mongoService.getChannelStream(channel._id);
      
      // Route the HLS stream through our backend proxy to bypass CORS restrictions
      const proxyUrl = `${API_BASE}/proxy/stream?url=${encodeURIComponent(res.streamUrl)}`;
      setStreamUrl(proxyUrl);
      setActiveChannel(channel);
    } catch (err) {
      console.error('Failed to fetch stream:', err);
      setIsStreamLoading(false);
      setStreamError(true);
    }
  };

  // Real-time Heartbeat
  useEffect(() => {
    if (!activeChannel) return;
    
    let active = true;
    const pingHeartbeat = async () => {
      try {
        let guestId = localStorage.getItem('guest_id');
        if (!guestId) {
          guestId = Math.random().toString(36).substring(2, 15);
          localStorage.setItem('guest_id', guestId);
        }
        
        const userId = user?.id || guestId;
        const res = await fetch(`${API_BASE}/channels/${activeChannel._id}/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });
        
        const data = await res.json();
        if (active && data.count) setViewersCount(data.count);
      } catch (err) {}
    };
    
    pingHeartbeat();
    const interval = setInterval(pingHeartbeat, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [activeChannel, user]);

  const changeQuality = (level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
      setCurrentQuality(level);
      setShowQualityMenu(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (playerContainerRef.current) {
        const rect = playerContainerRef.current.getBoundingClientRect();
        if (rect.bottom < 80 && activeChannel && streamUrl) {
          setIsFloating(true);
        } else if (rect.bottom >= 80) {
          setIsFloating(false);
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeChannel, streamUrl]);

  const toggleFavorite = async (e: React.MouseEvent, channelId: string) => {
    e.stopPropagation();
    setFavorites(prev => {
      const isFav = prev.includes(channelId);
      const newFavs = isFav ? prev.filter(id => id !== channelId) : [...prev, channelId];
      localStorage.setItem('live_tv_favorites', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  const filteredChannels = channels.filter(c => {
    // Search filter
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Category filter
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Favorites') return favorites.includes(c._id);
    if (selectedCategory === 'Premium') return c.isPremium;
    
    return c.category.includes(selectedCategory);
  });

  const getCategoryCount = (cat: string) => {
    if (cat === 'All') return channels.length;
    if (cat === 'Favorites') return channels.filter(c => favorites.includes(c._id)).length;
    if (cat === 'Premium') return channels.filter(c => c.isPremium).length;
    return channels.filter(c => c.category.includes(cat)).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a] font-sans pb-20 pt-6 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all">
            +?
          </button>
          <div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              Live TV Dashboard
            </h1>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1">
              Stream Seamlessly
            </p>
          </div>
        </div>

        {/* Active Channel Info Bar */}
        {activeChannel && streamUrl && (
          <div className="relative z-50 mb-4 bg-[#1C1C2E]/60 border border-white/5 rounded-3xl p-4 shadow-xl backdrop-blur-md flex justify-between items-center transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center overflow-hidden border border-white/10 shadow-lg">
                {activeChannel.logoUrl ? (
                  <img 
                    src={activeChannel.logoUrl} 
                    alt={activeChannel.name} 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChannel.name)}&background=1e1e2f&color=ffffff&bold=true`;
                    }}
                  />
                ) : (
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(activeChannel.name)}&background=1e1e2f&color=ffffff&bold=true`} 
                    alt={activeChannel.name} 
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <div>
                <h2 className="text-white font-black text-lg md:text-2xl flex items-center gap-2">
                  {activeChannel.name}
                  {activeChannel.isPremium && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-md border border-amber-500/30">
                      PREMIUM
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="bg-red-500/10 text-red-500 border border-red-500/30 px-2 py-0.5 rounded-md flex items-center gap-1.5 text-[10px] font-bold">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                    </span>
                    {viewersCount.toLocaleString()} watching
                  </div>
                </div>
              </div>
            </div>
            
            {/* Settings / 3-dot Menu */}
            <div className="relative">
              <button 
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              >
                <i className="fas fa-ellipsis-v"></i>
              </button>
              
              <AnimatePresence>
                {showQualityMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-12 w-48 bg-[#161b22] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="text-xs font-bold text-white/40 uppercase tracking-widest px-3 py-2 mb-1">
                      Video Quality
                    </div>
                    <button 
                      onClick={() => changeQuality(-1)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex justify-between items-center ${currentQuality === -1 ? 'bg-indigo-500 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                    >
                      Auto
                      {currentQuality === -1 && <span>✓</span>}
                    </button>
                    {qualityLevels.map((level, idx) => (
                      <button 
                        key={idx}
                        onClick={() => changeQuality(idx)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex justify-between items-center ${currentQuality === idx ? 'bg-indigo-500 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                      >
                        {level.height}p
                        {currentQuality === idx && <span>✓</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Video Player Wrapper (Maintains Layout Space) */}
        <div ref={playerContainerRef} className="w-full relative" style={{ aspectRatio: '16/9' }}>
          {/* Video Player (Normal or Floating) */}
          <motion.div 
            drag={isFloating}
            dragMomentum={false}
            animate={!isFloating ? { x: 0, y: 0 } : undefined}
            style={isFloating ? { touchAction: 'none' } : {}}
            className={`
            ${isFloating 
              ? 'fixed top-24 right-4 md:top-20 md:right-8 w-[280px] md:w-[400px] z-[9999] shadow-2xl rounded-2xl border-2 border-indigo-500/80 bg-black overflow-hidden group cursor-move' 
              : 'w-full h-full bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative group transition-all duration-300'
            }
          `}>
            {isFloating && (
              <div className="absolute top-2 right-2 z-50 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-7 h-7 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white/70 hover:text-white border border-white/10 hover:bg-black/80 transition-all"
                >
                  <i className="fas fa-expand text-[10px]"></i>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveChannel(null);
                    setStreamUrl(null);
                    setStreamError(false);
                    setIsStreamLoading(false);
                    setIsFloating(false);
                  }}
                  className="w-7 h-7 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white/70 hover:text-red-400 border border-white/10 hover:bg-black/80 transition-all"
                >
                  <i className="fas fa-times text-[10px]"></i>
                </button>
              </div>
            )}

            {activeChannel && streamUrl ? (
              <>
              {/* Overlays (Loading/Error) */}
              
              {/* Loading Overlay */}
              {isStreamLoading && !streamError && (
                <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm transition-opacity duration-300">
                  <div className="w-12 h-12 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                  <h3 className="text-white font-bold text-lg tracking-widest uppercase">Connecting...</h3>
                </div>
              )}

              {/* Error Overlay */}
              {streamError && (
                <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm transition-opacity duration-300">
                  <span className="text-4xl mb-4">⚠️</span>
                  <h3 className="text-xl font-bold text-white mb-2">Stream Unavailable</h3>
                  <p className="text-white/60 text-sm max-w-md">
                    This channel's stream is currently offline or unreachable. Please try another channel.
                  </p>
                  <button 
                    onClick={() => {
                      setStreamError(false);
                      setIsStreamLoading(true);
                      // Force a re-mount or simple state toggle to retry
                      const currentUrl = streamUrl;
                      setStreamUrl(null);
                      setTimeout(() => setStreamUrl(currentUrl), 100);
                    }}
                    className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                  >
                    Retry Connection
                  </button>
                </div>
              )}

              {/* Player */}
              <div className="absolute inset-0 bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                  autoPlay
                  poster="https://via.placeholder.com/640x360/000000/ffffff?text=SocialBD+Live+TV"
                  onWaiting={() => setIsStreamLoading(true)}
                  onPlaying={() => setIsStreamLoading(false)}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-[#0a0a1a] to-[#1a1a2e] text-white/30 space-y-4">
              <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center mb-4">
                <span className="text-6xl animate-pulse">📺</span>
              </div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] bg-white/10 px-6 py-2 rounded-full backdrop-blur-md">
                Select a channel to begin
              </p>
            </div>
          )}
        </motion.div>
      </div>

        {/* Controls / Filter Section */}
        <div className="bg-[#1C1C2E]/60 border border-white/5 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-6">
          
          {/* Search */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">🔍</span>
            <input 
              type="text" 
              placeholder="Search Channels..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a1a]/50 text-white placeholder-white/30 text-sm font-bold rounded-xl py-3 pl-12 pr-4 border border-white/5 focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap px-4 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                  selectedCategory === category 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                    : 'bg-[#1C1C2E]/60 text-white/60 hover:bg-[#1C1C2E] hover:text-white border border-white/5'
                }`}
              >
                {category}
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                  selectedCategory === category
                    ? 'bg-white/20 text-white'
                    : 'bg-black/20 text-white/40'
                }`}>
                  {getCategoryCount(category)}
                </span>
              </button>
            ))}
          </div>

          {/* Channels Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse"></div>
              ))
            ) : filteredChannels.length > 0 ? (
              filteredChannels.map(channel => {
                const isFav = favorites.includes(channel._id);
                const isPlaying = activeChannel?._id === channel._id;

                return (
                  <div 
                    key={channel._id}
                    onClick={() => handleChannelClick(channel)}
                    className={`relative p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${isPlaying ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10'}`}
                  >
                    {/* Logo */}
                    <div className="w-14 h-14 bg-white/10 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {channel.logoUrl ? (
                        <img 
                          src={channel.logoUrl} 
                          alt={channel.name} 
                          className="w-full h-full object-contain"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&background=1e1e2f&color=ffffff&bold=true`;
                          }}
                        />
                      ) : (
                        <img 
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&background=1e1e2f&color=ffffff&bold=true`} 
                          alt={channel.name} 
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-grow overflow-hidden">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-sm font-black truncate ${isPlaying ? 'text-indigo-400' : 'text-white'}`}>
                          {channel.name}
                        </h3>
                        {channel.isPremium && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 rounded-md border border-amber-500/30">
                            🔒
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {channel.category.map((cat, idx) => (
                          <span key={idx} className="text-[9px] font-bold text-white/40 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-full">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Favorite Button */}
                    <button 
                      onClick={(e) => toggleFavorite(e, channel._id)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                    >
                      <span className={`text-xl ${isFav ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-white/20 hover:text-white/50'}`}>
                        {isFav ? '❤️' : '🤍'}
                      </span>
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-8 text-center text-white/30 text-xs font-bold uppercase tracking-widest">
                No channels found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Premium Required Modal */}
      <AnimatePresence>
        {showPremiumModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPremiumModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[#161b22] border border-amber-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-3xl mb-4 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                🔒
              </div>
              <h2 className="text-xl font-black text-white mb-2">Premium Content</h2>
              <p className="text-xs text-white/50 mb-6 font-medium leading-relaxed">
                This channel requires an active Elite Premium subscription. Upgrade your account to unlock this stream and more exclusive content.
              </p>
              <div className="w-full flex gap-3">
                <button 
                  onClick={() => setShowPremiumModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-white/50 text-xs font-black uppercase hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setShowPremiumModal(false);
                    navigate('/elite-upgrade');
                  }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black uppercase shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all"
                >
                  Upgrade
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveTVDashboard;
