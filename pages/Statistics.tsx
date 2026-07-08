import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { mongoService } from '../services/mongoService';
import { formatLargeNumber } from '../utils/formatNumber';

const Statistics: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Drilldown modal state removed in favor of page navigation

  useEffect(() => {
    mongoService.getStatsOverview()
      .then(data => {
        setOverview(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load stats overview:', err);
        setLoading(false);
      });
  }, []);

  const openList = (id: string) => {
    navigate(`/stats/${id}`);
  };

  const CardHeader = ({ title }: { title: string }) => (
    <h2 className="text-sm font-black text-white/50 uppercase tracking-[0.2em] mb-4 border-b border-white/5 pb-2">
      {title}
    </h2>
  );

  const StatItem = ({ label, value, icon, color, onClick }: any) => (
    <div 
      onClick={onClick}
      className={`bg-[#161b22]/80 border border-white/5 rounded-2xl p-4 flex items-center justify-between group transition-all duration-300 ${onClick ? 'cursor-pointer hover:bg-white/5 hover:border-purple-500/30 hover:-translate-y-1' : ''}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg" style={{ backgroundColor: `${color}15`, color }}>
          {icon}
        </div>
        <span className="text-xs font-bold text-white/70 uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-lg font-black text-white">{typeof value === 'number' ? formatLargeNumber(value) : value}</span>
        {onClick && (
          <span className="text-white/40 group-hover:text-purple-400 group-hover:translate-x-1 transition-all">
            ➜
          </span>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a] font-sans pb-20 pt-6 px-4">
      <div className="max-w-full max-w-5xl mx-auto px-4 sm:px-6 mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all">
            ←
          </button>
          <div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
              Statistics Dashboard
            </h1>
            <p className="text-xs sm:text-sm font-bold text-white/60 uppercase tracking-[0.2em] mt-1">
              Global Platform Analytics
            </p>
          </div>
        </div>

        {/* General Stats */}
        <section className="bg-[#1C1C2E]/60 border border-purple-500/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          <CardHeader title="General Stats" />
          <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-4">
            <StatItem label="All Members" value={overview?.totalUsers} icon="👥" color="#8b5cf6" onClick={() => openList('all-members')} />
            <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
              <StatItem label="Males" value={overview?.males} icon="👨" color="#3b82f6" onClick={() => openList('males')} />
              <StatItem label="Females" value={overview?.females} icon="👩" color="#ec4899" onClick={() => openList('females')} />
            </div>
          </div>
        </section>

        {/* Members Toplist */}
        <section className="bg-[#1C1C2E]/60 border border-purple-500/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          <CardHeader title="Members Toplist" />
          <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <StatItem label="Top Posters" icon="📝" color="#f59e0b" onClick={() => openList('top-posters')} />
            <StatItem label="Top Shouters" icon="💬" color="#10b981" onClick={() => openList('top-shouters')} />
            <StatItem label="Longest Online" icon="⏱️" color="#3b82f6" onClick={() => openList('longest-online')} />
            <StatItem label="Top Golden Coins" icon="🪙" color="#fbbf24" onClick={() => openList('golden-coins')} />
            <StatItem label="Top Balance" icon="💵" color="#22c55e" onClick={() => openList('account-balance')} />
            <StatItem label="Top Profile Viewers" icon="👁️" color="#a855f7" onClick={() => openList('top-profile-viewers')} />
            <StatItem label="Top Topics Creator" icon="🧵" color="#f43f5e" onClick={() => openList('top-topics')} />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-1 sm:grid-cols-2 gap-4 gap-8">
          {/* Permission Stats */}
          <section className="bg-[#1C1C2E]/60 border border-purple-500/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
            <CardHeader title="Permission Stats" />
            <div className="space-y-4">
              <StatItem label="Staff List" value={overview?.staff} icon="🛡️" color="#ef4444" onClick={() => openList('staff')} />
              <StatItem label="Verified List" value={overview?.verified} icon="✅" color="#3b82f6" onClick={() => openList('verified')} />
              <StatItem label="Premium Users" value={overview?.premium} icon="💎" color="#f59e0b" onClick={() => openList('premium')} />
            </div>
          </section>

          {/* Other Stats */}
          <section className="bg-[#1C1C2E]/60 border border-purple-500/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
            <CardHeader title="Other Stats" />
            <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
              <StatItem label="Banned" value={overview?.banned} icon="🔨" color="#ef4444" onClick={() => openList('banned')} />
              <StatItem label="Shout Banned" value={overview?.shoutBanned} icon="🔇" color="#f97316" onClick={() => openList('shout-banned')} />
              <StatItem label="Inbox Banned" value={overview?.inboxBanned} icon="🔕" color="#8b5cf6" onClick={() => openList('inbox-banned')} />
              <StatItem label="Birthday Today" value={overview?.birthdays} icon="🎂" color="#ec4899" onClick={() => openList('birthdays')} />
            </div>
          </section>
        </div>
      </div>

    </div>
  );
};

export default Statistics;

