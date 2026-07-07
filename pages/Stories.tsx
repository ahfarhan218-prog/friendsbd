import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE } from '../services/mongoService';

interface Reaction {
  emoji: string;
  userId: string;
  userName: string;
  userAvatar: string;
}

interface Story {
  id: string;
  mediaUrl?: string;
  mediaType: 'image' | 'video' | 'text';
  content?: string;
  backgroundColor?: string;
  isViewed: boolean;
  createdAt: string;
  reactions?: Reaction[];
}

interface UserGroup {
  userId: string;
  userName: string;
  userAvatar: string;
  stories: Story[];
}

const BG_COLORS = ['#0a0a1a', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#3B82F6'];
const REACTIONS = ['❤️', '😂', '😮', '😢', '🔥', '👍'];

const Stories: React.FC = () => {
  const [feed, setFeed] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const session = JSON.parse(localStorage.getItem('user_session') || 'null');

  // Player State
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState<number>(5000); // ms
  const [uploading, setUploading] = useState(false);

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newStoryText, setNewStoryText] = useState('');
  const [newStoryFile, setNewStoryFile] = useState<File | null>(null);
  const [newStoryFileUrl, setNewStoryFileUrl] = useState<string | null>(null);
  const [newStoryBg, setNewStoryBg] = useState(BG_COLORS[1]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const fetchFeed = async () => {
    if (!session) return;
    try {
      const res = await fetch(`${API_BASE}/stories/feed?userId=${session.id}`);
      if (res.ok) {
        const data = await res.json();
        setFeed(data.feed || []);
      }
    } catch (e) {
      console.warn('Failed to fetch stories feed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setNewStoryFile(file);
    setNewStoryFileUrl(URL.createObjectURL(file));
  };

  const handlePostStory = async () => {
    if (!session) return;
    if (!newStoryFile && !newStoryText.trim()) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('userId', session.id);
    formData.append('userName', session.name || session.username || 'User');
    formData.append('userAvatar', session.avatar || 'https://picsum.photos/200');
    
    if (newStoryText.trim()) {
      formData.append('content', newStoryText.trim());
    }

    if (newStoryFile) {
      formData.append('media', newStoryFile);
    } else {
      formData.append('mediaType', 'text');
      formData.append('backgroundColor', newStoryBg);
    }

    try {
      const res = await fetch(`${API_BASE}/stories`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        closeCreateModal();
        fetchFeed();
      } else {
        const err = await res.json();
        alert('Upload failed: ' + err.error);
      }
    } catch (error) {
      console.warn('Upload error', error);
      alert('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setNewStoryText('');
    setNewStoryFile(null);
    if (newStoryFileUrl) URL.revokeObjectURL(newStoryFileUrl);
    setNewStoryFileUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const activeGroup = activeGroupIndex !== null ? feed[activeGroupIndex] : null;
  const activeStory = activeGroup ? activeGroup.stories[activeStoryIndex] : null;

  // Mark story as viewed optimistically and in backend
  const markAsViewed = useCallback(async (groupIdx: number, storyIdx: number) => {
    if (!session) return;
    const group = feed[groupIdx];
    const story = group.stories[storyIdx];
    if (story.isViewed) return;

    // Optimistic UI update
    setFeed(prev => {
      const newFeed = [...prev];
      newFeed[groupIdx].stories[storyIdx].isViewed = true;
      return newFeed;
    });

    try {
      await fetch(`${API_BASE}/stories/${story.id}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.id })
      });
    } catch (e) {
      console.warn('Failed to mark story as viewed', e);
    }
  }, [feed, session]);

  const handleReact = async (emoji: string) => {
    if (!session || activeGroupIndex === null || activeStoryIndex === null || !activeStory) return;

    // Optimistic Update
    setFeed(prev => {
      const newFeed = [...prev];
      const targetStory = newFeed[activeGroupIndex].stories[activeStoryIndex];
      if (!targetStory.reactions) targetStory.reactions = [];
      targetStory.reactions = targetStory.reactions.filter(r => r.userId !== session.id);
      targetStory.reactions.push({
        emoji,
        userId: session.id,
        userName: session.name || session.username || 'User',
        userAvatar: session.avatar || 'https://picsum.photos/200'
      });
      return newFeed;
    });

    try {
      await fetch(`${API_BASE}/stories/${activeStory.id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.id,
          userName: session.name || session.username || 'User',
          userAvatar: session.avatar || 'https://picsum.photos/200',
          emoji
        })
      });
    } catch (error) {
      console.warn('Reaction failed', error);
    }
  };

  // Navigate to next story or user
  const handleNext = useCallback(() => {
    if (activeGroupIndex === null || !activeGroup) return;
    
    if (activeStoryIndex < activeGroup.stories.length - 1) {
      setActiveStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (activeGroupIndex < feed.length - 1) {
      setActiveGroupIndex(prev => prev! + 1);
      setActiveStoryIndex(0);
      setProgress(0);
    } else {
      closePlayer();
    }
  }, [activeGroupIndex, activeGroup, activeStoryIndex, feed.length]);

  // Navigate to prev story or user
  const handlePrev = useCallback(() => {
    if (activeGroupIndex === null || !activeGroup) return;

    if (activeStoryIndex > 0) {
      setActiveStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (activeGroupIndex > 0) {
      const prevGroup = feed[activeGroupIndex - 1];
      setActiveGroupIndex(activeGroupIndex - 1);
      setActiveStoryIndex(prevGroup.stories.length - 1);
      setProgress(0);
    }
  }, [activeGroupIndex, activeGroup, activeStoryIndex, feed]);

  const closePlayer = () => {
    setActiveGroupIndex(null);
    setActiveStoryIndex(0);
    setProgress(0);
    setIsPaused(false);
  };

  const openPlayer = (groupIdx: number) => {
    setActiveGroupIndex(groupIdx);
    const group = feed[groupIdx];
    const firstUnviewedIdx = group.stories.findIndex(s => !s.isViewed);
    setActiveStoryIndex(firstUnviewedIdx !== -1 ? firstUnviewedIdx : 0);
    setProgress(0);
    setIsPaused(false);
  };

  // Run side-effects when active story changes
  useEffect(() => {
    if (activeGroupIndex !== null && activeStory) {
      markAsViewed(activeGroupIndex, activeStoryIndex);
      
      // Default duration for images and text is 5s
      if (activeStory.mediaType === 'image' || activeStory.mediaType === 'text') {
        setVideoDuration(5000);
      }
    }
  }, [activeGroupIndex, activeStoryIndex, activeStory, markAsViewed]);

  // The Animation Loop for Progress Bar
  useEffect(() => {
    if (activeGroupIndex === null || !activeStory) return;

    lastTimeRef.current = performance.now();

    const animate = (time: number) => {
      if (!isPaused) {
        const delta = time - lastTimeRef.current;
        setProgress(prev => {
          const newProg = prev + (delta / videoDuration) * 100;
          if (newProg >= 100) {
            handleNext();
            return 100;
          }
          return newProg;
        });
      }
      lastTimeRef.current = time;
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameRef.current);
  }, [activeGroupIndex, activeStory, isPaused, videoDuration, handleNext]);

  // Video playback sync with pause state
  useEffect(() => {
    if (videoRef.current) {
      if (isPaused) videoRef.current.pause();
      else videoRef.current.play().catch(() => {});
    }
  }, [isPaused]);


  if (loading) return <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center"><div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0a0a1a] p-4 sm:p-6 relative overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-white">📖 Stories</h1>
          <button 
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Add Story
          </button>
        </div>

        {feed.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <p className="text-5xl mb-4">📖</p>
            <p className="font-bold">No stories right now</p>
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
            {feed.map((group, idx) => {
              const allViewed = group.stories.every(s => s.isViewed);
              return (
                <button 
                  key={group.userId} 
                  onClick={() => openPlayer(idx)} 
                  className="flex flex-col items-center shrink-0 w-20 space-y-2 group"
                >
                  <div className={`p-[2px] rounded-full transition-all duration-300 ${allViewed ? 'bg-gray-600' : 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 group-hover:scale-105'}`}>
                    <div className="bg-[#0a0a1a] p-[3px] rounded-full">
                      <img 
                        src={group.userAvatar || 'https://picsum.photos/200'} 
                        className="w-16 h-16 rounded-full object-cover" 
                        alt={group.userName} 
                      />
                    </div>
                  </div>
                  <p className="text-xs font-medium text-white/80 truncate w-full text-center">
                    {group.userName}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* --- Create Story Modal --- */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#1C1C2E] rounded-2xl w-full max-w-md overflow-hidden border border-white/10 shadow-2xl">
              <div className="flex justify-between items-center p-4 border-b border-white/10">
                <h3 className="text-white font-bold text-lg">Create Story</h3>
                <button onClick={closeCreateModal} className="text-white/50 hover:text-white">✕</button>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Preview Area */}
                <div 
                  className="w-full h-64 rounded-xl flex items-center justify-center overflow-hidden relative"
                  style={{ backgroundColor: !newStoryFile ? newStoryBg : '#000' }}
                >
                  {newStoryFileUrl ? (
                    newStoryFile?.type.startsWith('video/') ? (
                      <video src={newStoryFileUrl} className="w-full h-full object-contain" autoPlay muted loop playsInline />
                    ) : (
                      <img src={newStoryFileUrl} className="w-full h-full object-contain" alt="Preview" />
                    )
                  ) : null}

                  {/* Text Overlay in Preview */}
                  {newStoryText && (
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                      <p className={`text-white text-2xl font-bold text-center leading-snug drop-shadow-lg ${newStoryFile ? 'bg-black/40 px-4 py-2 rounded-xl backdrop-blur-sm' : ''}`}>
                        {newStoryText}
                      </p>
                    </div>
                  )}

                  {!newStoryFile && !newStoryText && (
                    <p className="text-white/30 text-sm font-medium">Type something or upload a file</p>
                  )}
                </div>

                {/* Controls */}
                <div>
                  <textarea 
                    placeholder="Add text..." 
                    value={newStoryText}
                    onChange={(e) => setNewStoryText(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white placeholder-white/30 resize-none outline-none focus:border-purple-500"
                    rows={2}
                  />
                </div>

                {!newStoryFile && (
                  <div>
                    <p className="text-xs text-white/50 mb-2 uppercase tracking-wider font-bold">Background Color</p>
                    <div className="flex gap-2">
                      {BG_COLORS.map(color => (
                        <button 
                          key={color}
                          onClick={() => setNewStoryBg(color)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${newStoryBg === color ? 'border-white scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileSelect} 
                      accept="image/*,video/*" 
                      className="hidden" 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white text-sm font-medium transition-colors"
                    >
                      {newStoryFile ? 'Change File' : '🖼️ Add Media'}
                    </button>
                    {newStoryFile && (
                      <button onClick={() => { setNewStoryFile(null); setNewStoryFileUrl(null); }} className="ml-2 text-red-400 text-sm hover:underline">
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <button 
                    onClick={handlePostStory}
                    disabled={uploading || (!newStoryFile && !newStoryText.trim())}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 rounded-lg text-white font-bold transition-colors"
                  >
                    {uploading ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- Fullscreen Player Modal --- */}
        {activeGroup && activeStory && (
          <div className="fixed inset-0 z-50 bg-black flex items-center justify-center sm:p-4">
            <div 
              className="relative w-full max-w-md h-full sm:h-[90vh] bg-[#111] sm:rounded-2xl overflow-hidden flex flex-col select-none"
              onPointerDown={() => setIsPaused(true)}
              onPointerUp={() => setIsPaused(false)}
              onPointerLeave={() => setIsPaused(false)}
            >
              {/* Segmented Progress Bars */}
              <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 p-2 pt-4 px-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                {activeGroup.stories.map((s, idx) => {
                  let width = '0%';
                  if (idx < activeStoryIndex) width = '100%';
                  else if (idx === activeStoryIndex) width = `${progress}%`;

                  return (
                    <div key={s.id} className="h-1 rounded-full bg-white/30 flex-1 overflow-hidden">
                      <div className="h-full bg-white transition-all duration-75 ease-linear" style={{ width }} />
                    </div>
                  );
                })}
              </div>

              {/* User Header */}
              <div className="absolute top-6 left-0 right-0 z-30 flex items-center justify-between px-4 pointer-events-none">
                <div className="flex items-center gap-3">
                  <img src={activeGroup.userAvatar} className="w-10 h-10 rounded-full border border-white/20" alt="" />
                  <div>
                    <p className="text-white font-semibold text-sm shadow-black drop-shadow-md">{activeGroup.userName}</p>
                    <p className="text-white/70 text-xs drop-shadow-md">
                      {new Date(activeStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); closePlayer(); }} 
                  className="p-2 text-white/80 hover:text-white pointer-events-auto"
                >
                  ✕
                </button>
              </div>

              {/* Media Content */}
              <div className="flex-1 flex items-center justify-center bg-black relative">
                {activeStory.mediaType === 'text' ? (
                  <div 
                    className="w-full h-full flex items-center justify-center p-8"
                    style={{ backgroundColor: activeStory.backgroundColor || '#0a0a1a' }}
                  >
                    <p className="text-white text-3xl font-bold text-center leading-snug drop-shadow-lg">
                      {activeStory.content}
                    </p>
                  </div>
                ) : activeStory.mediaType === 'video' ? (
                  <video
                    ref={videoRef}
                    src={activeStory.mediaUrl?.startsWith('http') ? activeStory.mediaUrl : `${API_BASE.replace('/api', '')}${activeStory.mediaUrl}`}
                    className="w-full h-full object-contain"
                    autoPlay
                    muted
                    playsInline
                    onLoadedMetadata={(e) => {
                      const dur = e.currentTarget.duration;
                      if (dur && dur !== Infinity) {
                        setVideoDuration(dur * 1000); 
                      } else {
                        setVideoDuration(5000); 
                      }
                    }}
                    onEnded={handleNext}
                  />
                ) : (
                  <img 
                    src={activeStory.mediaUrl?.startsWith('http') ? activeStory.mediaUrl : `${API_BASE.replace('/api', '')}${activeStory.mediaUrl}`}
                    className="w-full h-full object-contain"
                    alt=""
                  />
                )}
                
                {/* Text Overlay for Image/Video */}
                {activeStory.mediaType !== 'text' && activeStory.content && (
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 p-4 text-center z-20 pointer-events-none">
                    <p className="text-white text-2xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] px-4 py-2 bg-black/40 rounded-xl inline-block backdrop-blur-sm">
                      {activeStory.content}
                    </p>
                  </div>
                )}
              </div>

              {/* Reaction Bar */}
              <div className="absolute bottom-6 left-0 right-0 px-4 flex justify-between items-center z-30 pointer-events-none">
                {/* Show who reacted */}
                <div className="flex -space-x-2 pointer-events-auto relative group">
                  {activeStory.reactions?.map((r, i) => i < 3 ? (
                    <div key={i} className="relative z-10 w-8 h-8 rounded-full border-2 border-[#111] overflow-hidden">
                      <img src={r.userAvatar} className="w-full h-full object-cover" title={`${r.userName} reacted ${r.emoji}`} alt="" />
                      <div className="absolute bottom-[-4px] right-[-4px] text-[10px] bg-black rounded-full">{r.emoji}</div>
                    </div>
                  ) : null)}
                  {activeStory.reactions && activeStory.reactions.length > 3 && (
                    <div className="z-0 w-8 h-8 rounded-full border-2 border-[#111] bg-gray-800 flex items-center justify-center text-[10px] text-white">
                      +{activeStory.reactions.length - 3}
                    </div>
                  )}
                  {activeStory.reactions && activeStory.reactions.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex flex-col bg-black/80 rounded p-2 text-xs text-white whitespace-nowrap z-50">
                      {activeStory.reactions.map(r => (
                        <div key={r.userId} className="flex items-center gap-2">
                          <img src={r.userAvatar} className="w-4 h-4 rounded-full" />
                          <span>{r.userName} {r.emoji}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Send Reaction */}
                <div className="flex gap-2 pointer-events-auto bg-black/40 backdrop-blur-md rounded-full px-3 py-2 border border-white/10">
                  {REACTIONS.map(emoji => (
                    <button 
                      key={emoji}
                      onClick={(e) => { e.stopPropagation(); handleReact(emoji); }}
                      className="text-xl hover:scale-125 hover:-translate-y-1 transition-all drop-shadow-md"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation Click Areas */}
              <div 
                className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
              />
              <div 
                className="absolute inset-y-0 right-0 w-1/3 z-20 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stories;
