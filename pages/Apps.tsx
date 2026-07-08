import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_DRAWER_DATA } from '../constants';
import { triggerToast } from '../components/NotificationToast';

const Apps: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Define valid routes configured in App.tsx
  const VALID_ROUTES = new Set([
    'tournament',
    'coin-game',
    'silver-game',
    'lotto',
    'castle',
    'genie-cave',
    'farm',
    'ludo',
    'cricket',
    'football',
    'colorball',
    'monster-catcher',
    'profile/me',
    'inbox',
    'conference',
    'notifications',
    'friends',
    'requests',
    'forum',
    'timeline',
    'shouts',
    'ranks',
    'ap-leaderboard',
    'rewards',
    'missions',
    'quiz',
    'winners',
    'premium',
    'shop',
    'staff',
    'support',
    'reminders',
    'bb-dashboard',
    'bb-editor',
    'bb-guide',
    'cricket-system-testing',
    'cricket-2',
    'marketplace',
    'inventory',
    'stats',
    'blog',
    'clan',
    'calendar',
    'groups',
    'gallery',
    'stories',
    'live-tv'
  ]);

  const handleAppClick = (appId: string, name: string) => {
    if (VALID_ROUTES.has(appId)) {
      navigate(`/${appId}`);
    } else {
      triggerToast({
        id: 'upcoming-' + appId,
        senderId: 'system',
        senderName: 'System Core',
        senderAvatar: 'https://i.pravatar.cc/100?img=12',
        type: 'SYSTEM',
        message: `✨ The "${name}" portal is currently under active development and will launch in the next update!`,
        timestamp: Date.now(),
        isRead: false
      } as any);
    }
  };

  // Filter apps based on search query
  const filteredSections = APP_DRAWER_DATA.map((section) => {
    const matchingApps = section.apps.filter(
      (app) =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...section, apps: matchingApps };
  }).filter((section) => section.apps.length > 0);

  return (
    <div className="min-h-screen bg-transparent font-inter pb-32">
      {/* Header Accent */}
      <div className="w-full flex justify-center pt-5 pb-3">
        <div className="w-16 h-1 bg-white/20 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]"></div>
      </div>

      {/* Header & Description */}
      <div className="max-w-4xl mx-auto px-6 pt-4 space-y-5">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 uppercase tracking-tight drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">App Center</h2>
          <p className="text-xs text-white/50 font-medium max-w-md mx-auto leading-relaxed">
            Browse and launch all community modules, interactive games, and social tools.
          </p>
        </div>

        {/* Real-time Search Input */}
        <div className="relative max-w-md mx-auto group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-purple-400 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search apps or categories..."
            className="w-full bg-[#110a2a]/60 backdrop-blur-xl border border-white/10 focus:border-purple-500/50 focus:shadow-[0_0_20px_rgba(168,85,247,0.2)] rounded-2xl py-3.5 px-5 pl-12 text-sm text-white font-medium transition-all outline-none placeholder:text-white/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Categories / Grid Lists */}
      <div className="max-w-4xl mx-auto px-6 mt-10 space-y-8">
        {filteredSections.length === 0 ? (
          <div className="bg-[#1C1C2E]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-12 text-center space-y-3 shadow-xl max-w-md mx-auto">
            <span className="text-5xl block drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">🔍</span>
            <h4 className="font-black text-sm text-white">No Apps Match Your Search</h4>
            <p className="text-[11px] text-white/40 font-medium leading-relaxed max-w-xs mx-auto">
              We couldn't find any tools matching "{searchQuery}". Try double-checking your spelling.
            </p>
          </div>
        ) : (
          filteredSections.map((section) => (
            <div
              key={section.id}
              className="bg-[#1C1C2E]/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl hover:border-purple-500/30 transition-all duration-500 animate-fade-in relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors pointer-events-none" />
              
              {/* Category Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/5 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner shadow-white/5">
                    {section.icon || '✨'}
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white tracking-tight">{section.name}</h3>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">{section.desc}</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-purple-300 bg-purple-500/20 border border-purple-500/30 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                  {section.apps.length} {section.apps.length === 1 ? 'App' : 'Apps'}
                </span>
              </div>

              {/* Apps Grid Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-x-4 gap-y-8 pt-8 relative z-10">
                {section.apps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => handleAppClick(app.id, app.name)}
                    className="flex flex-col items-center group/app active:scale-95 transition-transform duration-300 select-none cursor-pointer outline-none"
                  >
                    <div className="relative">
                      {/* Squirclish Icon Container */}
                      <div className={`${app.color} w-16 h-16 rounded-[1.25rem] flex items-center justify-center text-3xl shadow-lg border backdrop-blur-md transition-all duration-300 group-hover/app:scale-110 group-hover/app:shadow-purple-500/20 group-hover/app:border-purple-500/50`}>
                        <span className="drop-shadow-md select-none group-hover/app:animate-bounce">{app.icon}</span>
                      </div>

                      {/* Pill Badge */}
                      {app.badge && (
                        <span className="absolute -top-2 -right-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.5)] z-10">
                          {app.badge}
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-black text-white/60 mt-3 text-center leading-tight truncate w-full px-1 group-hover/app:text-purple-300 transition-colors duration-300">
                      {app.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Apps;

