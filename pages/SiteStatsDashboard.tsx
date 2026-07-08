import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../services/mongoService';
import { STATUS_TIERS, getUserStatus } from '../utils/statusTiersUtil';

interface UserData {
  id: string;
  username: string;
  plusses: number;
  avatar: string;
  role: string;
}

const SiteStatsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);
  const [tierCounts, setTierCounts] = useState<Record<string, number>>({});
  const [usersByTier, setUsersByTier] = useState<Record<string, UserData[]>>({});
  const [expandedTier, setExpandedTier] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const activeRef = useRef(true);

  useEffect(() => {
    try {
      const sess = localStorage.getItem('user_session');
      if (sess) {
        setCurrentUser(JSON.parse(sess));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE}/users`);
        if (!activeRef.current) return;
        const users: any[] = await res.json();

        const counts: Record<string, number> = {};
        const groups: Record<string, UserData[]> = {};
        STATUS_TIERS.forEach(tier => {
          counts[tier.title] = 0;
          groups[tier.title] = [];
        });

        users.forEach(u => {
          const plusses = u.plusses || 0;
          const resolved = getUserStatus(plusses);
          counts[resolved.title] = (counts[resolved.title] || 0) + 1;
          groups[resolved.title].push({
            id: u.id,
            username: u.username || u.name || 'Anonymous',
            plusses,
            avatar: u.avatar || 'https://picsum.photos/seed/anon/200',
            role: u.role || 'user'
          });
        });

        setTierCounts(counts);
        setUsersByTier(groups);
        setTotalMembers(users.length);
        setLoading(false);
      } catch (err) {
        console.error('Failed to aggregate users list:', err);
        if (activeRef.current) setLoading(false);
      }
    };

    fetchUsers();
    const interval = setInterval(fetchUsers, 10000);
    return () => {
      activeRef.current = false;
      clearInterval(interval);
    };
  }, []);

  const handleToggleExpand = (title: string) => {
    setExpandedTier(prev => (prev === title ? null : title));
  };

  const isAdminOrStaff = currentUser?.role === 'admin' || currentUser?.role === 'moderator' || currentUser?.role === 'senior_staff';

  if (!isAdminOrStaff && !loading) {
    return (
      <div className="min-h-screen bg-transparent text-[#e1e1e1] flex flex-col items-center justify-center p-8">
        <span className="text-6xl mb-6">🔒</span>
        <h2 className="text-lg font-black uppercase tracking-wider text-rose-500">Access Restricted</h2>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2 max-w-sm text-center">
          You do not have the administrator permissions required to view the Plusses tier statistics.
        </p>
        <button
          onClick={() => navigate('/home')}
          className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-md shadow-indigo-600/20"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white font-sans antialiased pb-32 relative text-left">
      <div className="absolute top-0 right-10 w-full max-w-sm h-96 bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-full max-w-sm h-96 bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />

      <header className="p-6 max-w-5xl mx-auto flex items-center justify-between border-b border-[#1f293d]/50 bg-slate-950/20 backdrop-blur-md rounded-b-[2rem]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-[#121824] hover:bg-slate-800 border border-[#1f293d] rounded-2xl text-slate-400 hover:text-white transition-all active:scale-95 shadow-sm"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] block mb-0.5">Admin Analytics</span>
            <h1 className="text-lg font-black text-white tracking-tight">Member Status Engine</h1>
          </div>
        </div>

        <div className="bg-[#121824] border border-[#1f293d] px-4 py-2 rounded-2xl text-right">
          <span className="text-[9px] text-slate-500 font-bold uppercase block tracking-wider">Total Members</span>
          <span className="text-sm font-black text-indigo-400">{totalMembers} users</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 mt-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Aggregating user plusses data...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1f293d]/50 pb-2">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Plusses Status Tiers List</h2>
              <span className="text-[9px] text-slate-600 font-bold uppercase">Dynamic Aggregation</span>
            </div>

            <div className="space-y-3">
              {STATUS_TIERS.map((tier) => {
                const count = tierCounts[tier.title] || 0;
                const percentage = totalMembers > 0 ? (count / totalMembers) * 100 : 0;
                const isExpanded = expandedTier === tier.title;
                const membersList = usersByTier[tier.title] || [];

                return (
                  <div
                    key={tier.title}
                    className="bg-[#121824] border border-[#1f293d] rounded-2xl overflow-hidden transition-all duration-200"
                  >
                    <div
                      onClick={() => handleToggleExpand(tier.title)}
                      className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/10 transition-colors"
                    >
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black uppercase tracking-wider ${tier.color.split(' ')[0]}`}>
                            {tier.title}
                          </span>
                          <span className="px-1.5 py-0.5 text-[8px] font-bold font-mono bg-[#090d16] border border-[#1f293d] rounded-md text-slate-500">
                            {tier.min} - {tier.max === Infinity ? '∞' : tier.max} Plusses
                          </span>
                        </div>

                        <div className="mt-2.5 flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-[#090d16] rounded-full overflow-hidden border border-[#1f293d]/50">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                            />
                          </div>
                          <span className="text-[9.5px] font-mono font-bold text-slate-500 shrink-0">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <div className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 shadow-sm shadow-indigo-500/5">
                          {count} {count === 1 ? 'Member' : 'Members'}
                        </div>
                        <svg
                          className={`w-4 h-4 text-slate-600 transition-transform ${isExpanded ? 'rotate-90 text-indigo-400' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="border-t border-[#1f293d]/40 bg-[#090d16]/30 overflow-hidden"
                        >
                          {membersList.length === 0 ? (
                            <div className="py-4 text-center text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                              No members currently in this status tier.
                            </div>
                          ) : (
                            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {membersList.map(u => (
                                <div
                                  key={u.id}
                                  onClick={() => navigate(`/profile/${u.username}`)}
                                  className="bg-[#090d16] border border-[#1f293d] p-2.5 rounded-xl flex items-center gap-3 cursor-pointer hover:border-indigo-500/30 transition-all hover:scale-[0.99] group text-left"
                                >
                                  <img
                                    src={u.avatar}
                                    className="w-7 h-7 rounded-lg object-cover border border-[#1f293d]"
                                    alt={u.username}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1">
                                      <span className="text-[11px] font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                                        @{u.username}
                                      </span>
                                    </div>
                                    <p className="text-[9px] font-mono text-slate-500 mt-0.5">
                                      {u.plusses} plusses
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SiteStatsDashboard;


