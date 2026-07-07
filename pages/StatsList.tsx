import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mongoService } from '../services/mongoService';
import { formatLargeNumber } from '../utils/formatNumber';

const typeDetails: Record<string, { title: string, metricLabel: string }> = {
  'all-members': { title: 'All Members', metricLabel: 'Status' },
  'males': { title: 'Males', metricLabel: 'Gender' },
  'females': { title: 'Females', metricLabel: 'Gender' },
  'top-posters': { title: 'Top Posters', metricLabel: 'Posts' },
  'top-shouters': { title: 'Top Shouters', metricLabel: 'Shouts' },
  'longest-online': { title: 'Longest Online', metricLabel: 'Online Time' },
  'golden-coins': { title: 'Top Golden Coins', metricLabel: 'Coins' },
  'account-balance': { title: 'Top Account Balance', metricLabel: 'Balance' },
  'top-profile-viewers': { title: 'Top Profile Viewers', metricLabel: 'Views' },
  'top-topics': { title: 'Top Topics Creator', metricLabel: 'Topics' },
  'staff': { title: 'Staff Members', metricLabel: 'Role' },
  'verified': { title: 'Verified Users', metricLabel: 'Status' },
  'premium': { title: 'Premium Users', metricLabel: 'Status' },
  'banned': { title: 'Banned Users', metricLabel: 'Status' },
  'shout-banned': { title: 'Shout Banned', metricLabel: 'Status' },
  'inbox-banned': { title: 'Inbox Banned', metricLabel: 'Status' },
  'birthdays': { title: 'Birthday Today', metricLabel: 'Birthday' },
};

const StatsList: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const details = type && typeDetails[type] ? typeDetails[type] : { title: 'Statistics List', metricLabel: 'Value' };
  const { title, metricLabel } = details;

  useEffect(() => {
    if (!type) return;
    setLoading(true);
    mongoService.getStatsList(type, 20, 0)
      .then(res => {
        setData(res.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching list:', err);
        setLoading(false);
      });
  }, [type]);

  // Helper for formatting time (Longest Online)
  const formatTime = (seconds: number) => {
    if (!seconds) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const getMetricDisplay = (user: any) => {
    if (type === 'longest-online') return formatTime(user.metricValue);
    if (user.metricValue !== null && user.metricValue !== undefined) return formatLargeNumber(user.metricValue);
    
    // For roles/booleans where metric is purely presence
    if (type === 'staff') return <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded-md uppercase text-[9px] font-black">{user.role}</span>;
    if (type === 'verified') return '✅';
    if (type === 'premium') return '💎';
    if (type === 'banned') return '🔨';
    if (type === 'all-members') return 'Active';
    if (type === 'males') return 'Male';
    if (type === 'females') return 'Female';
    if (type === 'birthdays') return '🎂';
    if (type && type.includes('banned')) return '🚫';

    return '-';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a] font-sans pb-20 pt-6 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all">
            ←
          </button>
          <div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
              {title}
            </h1>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1">
              Top 20 Aggregate
            </p>
          </div>
        </div>

        <div className="bg-[#1C1C2E]/60 border border-purple-500/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          <div className="space-y-3">
            {loading ? (
              // Skeleton Loader
              [...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl animate-pulse">
                  <div className="w-6 h-6 bg-white/10 rounded-lg" />
                  <div className="w-10 h-10 bg-white/10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 bg-white/10 rounded-md" />
                    <div className="h-2 w-1/4 bg-white/10 rounded-md" />
                  </div>
                  <div className="w-12 h-6 bg-white/10 rounded-md" />
                </div>
              ))
            ) : data.length === 0 ? (
              <div className="text-center py-20">
                <span className="text-4xl opacity-20">📭</span>
                <p className="text-xs font-bold text-white/30 uppercase mt-4">No Data Available</p>
              </div>
            ) : (
              data.map((user, index) => (
                <div 
                  key={user.id} 
                  onClick={() => navigate(`/profile/${user.id}`)}
                  className="flex items-center gap-4 p-4 bg-[#161b22]/50 hover:bg-[#161b22] border border-transparent hover:border-purple-500/20 rounded-2xl cursor-pointer transition-all group"
                >
                  {/* Rank Badge */}
                  <div className="w-8 h-8 flex items-center justify-center bg-white/5 text-xs font-black text-white/30 rounded-xl shrink-0 group-hover:text-purple-400 transition-colors">
                    #{index + 1}
                  </div>
                  
                  {/* Avatar */}
                  <img 
                    src={user.avatar || 'https://i.ibb.co/tCq9gM1/default-avatar.png'} 
                    alt={user.name}
                    className="w-12 h-12 rounded-xl object-cover border border-white/5 group-hover:border-purple-500/50 transition-all shrink-0"
                  />
                  
                  {/* Name / Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-black text-white truncate">{user.name}</span>
                      {user.isVerified && <span className="text-blue-400 text-sm">✅</span>}
                      {user.isPremium && <span className="text-amber-400 text-sm">💎</span>}
                    </div>
                    <span className="text-xs font-bold text-white/30 uppercase tracking-widest truncate">@{user.username}</span>
                  </div>
                  
                  {/* Metric */}
                  <div className="text-right shrink-0">
                    <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">{metricLabel}</div>
                    <div className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                      {getMetricDisplay(user)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StatsList;
