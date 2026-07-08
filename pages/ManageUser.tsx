import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { mongoService, API_BASE } from '../services/mongoService';
import { triggerToast } from '../components/NotificationToast';

const AdminUserManagement: React.FC = () => {
  const { userId } = useParams();
  const [loading, setLoading] = useState(true);
  const [targetUser, setTargetUser] = useState<any>(null);

  const [reason, setReason] = useState('');
  const [plusses, setPlusses] = useState('0');
  const [goldCoins, setGoldCoins] = useState('0');
  const [silverCoins, setSilverCoins] = useState('0');
  const [takaBalance, setTakaBalance] = useState('0');
  const [selectedRole, setSelectedRole] = useState('user');

  // Restrictions States
  const [banStates, setBanStates] = useState({
    fullBan: false,
    pmBan: false,
    shoutBan: false,
    chatBan: false,
    shadowBan: false,
  });

  // Automated Strike System
  const [strikes, setStrikes] = useState(0);

  // 2FA Security
  const [disable2FAConfirm, setDisable2FAConfirm] = useState(false);

  // Direct System Notice
  const [systemNotice, setSystemNotice] = useState('');

  // Active Devices
  const [activeSession, setActiveSession] = useState(false);

  // Activity Timeline
  const [activityTimeline, setActivityTimeline] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    const loadUser = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`${API_BASE}/users/${userId}`);
        if (!res.ok) throw new Error('User not found');
        const userData = await res.json();
        
        if (active) {
          setTargetUser(userData);
          setPlusses(userData.plusses?.toString() || '0');
          setGoldCoins(userData.goldenCoins?.toString() || '0');
          setSilverCoins(userData.silverPoints?.toString() || '0');
          setTakaBalance(userData.balance_taka?.toString() || '0');
          setSelectedRole(userData.user_role || userData.role || 'user');
          setStrikes(userData.strikes || 0);
          setBanStates({
            fullBan: !!userData.isBanned,
            pmBan: !!userData.pmBan,
            shoutBan: !!userData.shoutBan,
            chatBan: !!userData.chatBan,
            shadowBan: !!userData.isShadowBanned,
          });
          setActiveSession(!!userData.sessionToken);

          // Fetch activities
          const username = userData.username || userData.name;
          if (username) {
             const acts = await mongoService.getUserActivities(username);
             setActivityTimeline(acts);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (active) setLoading(false);
      }
    };
    loadUser();
    return () => { active = false; };
  }, [userId]);

  const handleAdminUpdate = async (updates: any) => {
    if (!reason.trim()) {
      triggerToast({ id: 'err-reason', type: 'SYSTEM', message: 'Action Reason is required!', senderId: 'sys', senderName: 'System', timestamp: Date.now(), isRead: true });
      return;
    }
    const res = await mongoService.adminUpdateUser(targetUser.id, updates);
    if (res) {
      setTargetUser(res);
      triggerToast({ id: `ok-${Date.now()}`, type: 'SYSTEM', message: 'User updated successfully.', senderId: 'sys', senderName: 'System', timestamp: Date.now(), isRead: true });
    } else {
      triggerToast({ id: `err-${Date.now()}`, type: 'SYSTEM', message: 'Failed to update user.', senderId: 'sys', senderName: 'System', timestamp: Date.now(), isRead: true });
    }
  };

  const handleToggleBan = async (key: string, dbField: string) => {
    if (!reason.trim()) {
      triggerToast({ id: 'err-reason', type: 'SYSTEM', message: 'Action Reason is required!', senderId: 'sys', senderName: 'System', timestamp: Date.now(), isRead: true });
      return;
    }
    const isActive = (banStates as any)[key];
    const newState = !isActive;
    setBanStates(prev => ({ ...prev, [key]: newState }));
    await handleAdminUpdate({ [dbField]: newState });
  };

  const issueStrike = async () => {
    if (!reason.trim()) {
      triggerToast({ id: 'err-reason', type: 'SYSTEM', message: 'Action Reason is required!', senderId: 'sys', senderName: 'System', timestamp: Date.now(), isRead: true });
      return;
    }
    const newStrikes = Math.min(strikes + 1, 3);
    setStrikes(newStrikes);
    await handleAdminUpdate({ strikes: newStrikes });
  };

  const forceLogout = async () => {
    if (!reason.trim()) {
      triggerToast({ id: 'err-reason', type: 'SYSTEM', message: 'Action Reason is required!', senderId: 'sys', senderName: 'System', timestamp: Date.now(), isRead: true });
      return;
    }
    const success = await mongoService.forceLogoutUser(targetUser.id);
    if (success) {
      setActiveSession(false);
      triggerToast({ id: 'logout', type: 'SYSTEM', message: 'User forcefully logged out.', senderId: 'sys', senderName: 'System', timestamp: Date.now(), isRead: true });
    }
  };

  const injectAlert = async () => {
    if (!systemNotice.trim()) return;
    const success = await mongoService.sendSystemNotice(targetUser.id, systemNotice);
    if (success) {
      setSystemNotice('');
      triggerToast({ id: 'alert', type: 'SYSTEM', message: 'System alert injected successfully.', senderId: 'sys', senderName: 'System', timestamp: Date.now(), isRead: true });
    }
  };

  function timeAgo(ts: number) {
    if (!ts) return 'Unknown';
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'Just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  function formatTime(seconds: number) {
    if (!seconds) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  if (loading) {
    return <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center text-white font-black animate-pulse">LOADING USER DATA...</div>;
  }

  if (!targetUser) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] flex flex-col items-center justify-center text-white gap-4">
        <h2 className="text-xl font-black text-red-500">USER NOT FOUND</h2>
        <Link to="/admin" className="px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all">Go Back</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F1A] text-white pb-12 font-inter w-full overflow-x-hidden text-sm sm:text-base">

      {/* HEADER SECTION */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#110a2a] via-[#1d0d4a] to-[#0d1a6b] pt-8 pb-16 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_0%,_#7c3aed23,_transparent_70%)]" />
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase">Admin Control Panel</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-white/70 bg-white/5 border border-white/10 px-3 py-2 rounded-xl w-fit">
            <span>Managing <span className="text-purple-400 font-bold">@{targetUser.username || targetUser.name}</span></span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] bg-red-500/20 text-red-400 font-black px-2 py-0.5 rounded uppercase tracking-wider">RBAC Active</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="px-4 -mt-8 space-y-5 relative z-10 max-w-4xl mx-auto w-full">

        {/* TOP SUB-NAV BAR */}
        <div className="grid grid-cols-3 gap-2 bg-[#1C1C2E] border border-white/5 p-1.5 rounded-2xl">
          <Link to="/admin" className="py-2.5 text-sm sm:text-base font-black rounded-xl text-center transition-all text-white/40 hover:text-white/70">
            📊 Dashboard
          </Link>
          <button className="py-2.5 text-sm sm:text-base font-black rounded-xl text-center transition-all bg-purple-600 text-white">
            🔧 User Tools
          </button>
          <button className="py-2.5 text-sm sm:text-base font-black rounded-xl text-center transition-all text-white/40 hover:text-white/70">
            📋 Audit Log
          </button>
        </div>

        {/* SECTION TITLE */}
        <div className="bg-[#161626] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">🔧</span>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">User Management Tools</h2>
            <p className="text-sm text-white/50 font-medium mt-0.5">Target: {targetUser.username || targetUser.name} · All actions are logged.</p>
          </div>
        </div>

        {/* TARGET USER PROFILE CARD */}
        <div className="bg-[#1C1C2E] border border-purple-500/30 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-lg shadow-purple-900/10">
          <div className="flex items-center gap-3 min-w-0">
            <img src={targetUser.avatar} alt="avatar" className="w-12 h-12 rounded-full object-cover border border-white/10" />
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                @{targetUser.username || targetUser.name}
                {targetUser.isBanned || targetUser.strikes >= 3 ? (
                  <span className="text-xs bg-red-500/20 text-red-400 font-black px-2.5 py-1 rounded-full uppercase">Banned</span>
                ) : (
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 font-black px-2.5 py-1 rounded-full uppercase">Clean</span>
                )}
              </h3>
              <p className="text-sm text-white/50 font-mono mt-1 truncate">ID: {targetUser.id} · Role: {targetUser.user_role || targetUser.role}</p>
            </div>
          </div>
          <Link to="/admin" className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-lg font-bold text-white/60 shrink-0">✕</Link>
        </div>

        {/* 5. USER ENGAGEMENT STATS ANALYTICS MINI-DASHBOARD */}
        <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4 sm:p-5 space-y-4">
          <h4 className="text-sm sm:text-base font-black text-white/60 uppercase tracking-widest flex items-center gap-2">
            📈 Engagement Analytics
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#161626] border border-white/5 rounded-xl p-4">
              <p className="text-xs sm:text-sm font-bold text-white/40 uppercase tracking-wider mb-1">Avg Online/Day</p>
              <p className="text-xl sm:text-2xl font-black text-white">{formatTime(targetUser.todayOnlineTime || 0)}</p>
            </div>
            <div className="bg-[#161626] border border-white/5 rounded-xl p-4">
              <p className="text-xs sm:text-sm font-bold text-white/40 uppercase tracking-wider mb-1">Total Points</p>
              <p className="text-xl sm:text-2xl font-black text-amber-400">{targetUser.points?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-[#161626] border border-white/5 rounded-xl p-4">
              <p className="text-xs sm:text-sm font-bold text-white/40 uppercase tracking-wider mb-1">Level</p>
              <p className="text-xl sm:text-2xl font-black text-purple-400 truncate">Lvl {targetUser.level || 1}</p>
            </div>
          </div>
        </div>

        {/* 3. DETAILED USER ACTIVITY TIMELINE */}
        <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4 sm:p-5 space-y-4">
          <h4 className="text-sm sm:text-base font-black text-white/60 uppercase tracking-widest flex items-center gap-2">
            🕒 24h Activity Timeline
          </h4>
          <div className="bg-[#161626] border border-white/5 rounded-xl p-4 max-h-[250px] overflow-y-auto custom-scrollbar space-y-4">
            {activityTimeline.length === 0 ? (
              <p className="text-sm text-white/40 font-bold text-center py-4">No recent activity found.</p>
            ) : activityTimeline.map((act, idx) => (
              <div key={act.id || idx} className="flex gap-4 relative">
                <div className="absolute top-2.5 left-2 w-0.5 h-full bg-white/5 -z-10" />
                <div className="w-4 h-4 rounded-full bg-purple-500 border-4 border-[#161626] shrink-0 mt-1" />
                <div>
                  <p className="text-sm sm:text-base font-bold text-white/90">{act.msg || (act.isTopic ? 'Created a new topic' : 'Activity logged')}</p>
                  <p className="text-xs sm:text-sm font-bold text-white/40 mt-0.5">{timeAgo(act.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 1. ACTIVE DEVICES & SESSION TRACKER */}
        <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h4 className="text-sm sm:text-base font-black text-white/60 uppercase tracking-widest flex items-center gap-2">
              📱 Active Sessions
            </h4>
            <button onClick={forceLogout} className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 font-black text-sm uppercase tracking-wider py-2.5 px-4 rounded-xl active:scale-95 transition-all w-full sm:w-auto">
              Force Logout All
            </button>
          </div>
          <div className="space-y-2">
            {activeSession ? (
              <div className="bg-[#161626] border border-white/5 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    Primary Session
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-white/40 mt-1">Logged in via Auth Token</p>
                </div>
                <div className="text-xs sm:text-sm font-bold text-white/30 uppercase tracking-wider bg-white/5 px-3 py-1.5 rounded-lg w-fit">
                  Active
                </div>
              </div>
            ) : (
              <p className="text-sm text-white/40 font-bold p-2">No active sessions found.</p>
            )}
          </div>
        </div>

        {/* ACTION REASON - INPUT */}
        <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4 sm:p-5 space-y-3">
          <label className="text-sm sm:text-base font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
            ⚠️ Action Reason <span className="text-red-500 text-xs sm:text-sm">(Required for all modifications)</span>
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide a valid reason for auditing logs..."
            className="w-full bg-[#11111E] border border-white/10 focus:border-amber-500/50 rounded-xl px-4 py-3.5 text-base sm:text-lg text-white placeholder-white/20 outline-none transition-all font-medium"
          />
        </div>

        {/* 4. AUTOMATED STRIKE & WARNING SYSTEM */}
        <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4 sm:p-5 space-y-4">
          <h4 className="text-sm sm:text-base font-black text-white/60 uppercase tracking-widest flex items-center gap-2">
            🚨 Automated Strike System
          </h4>
          <div className="bg-[#161626] border border-white/5 p-4 sm:p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base font-bold text-white/80 uppercase">Warning Level</span>
              <span className="text-sm sm:text-base font-black text-amber-400">{strikes} / 3 Strikes</span>
            </div>
            
            {/* Progress Bar */}
            <div className="flex gap-2 h-3">
              {[1, 2, 3].map(s => (
                <div key={s} className={`flex-1 rounded-full ${s <= strikes ? (s === 3 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]') : 'bg-white/10'}`} />
              ))}
            </div>
            
            <p className="text-xs sm:text-sm text-white/40 font-medium">
              Hitting 3 strikes automatically triggers a 7-day system restriction across all interactive modules.
            </p>
            
            <button 
              onClick={issueStrike}
              className="w-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/50 text-amber-400 font-black text-sm sm:text-base uppercase tracking-wider py-3 px-4 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span className="text-lg">⚠️</span> Issue +1 Strike
            </button>
          </div>
        </div>

        {/* RESTRICTION TOGGLES & 2. SHADOW BAN */}
        <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4 sm:p-5 space-y-4">
          <h4 className="text-sm sm:text-base font-black text-white/60 uppercase tracking-widest flex items-center gap-2">
            🚫 Restriction Toggles
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { key: 'fullBan', label: 'Full Ban', dbField: 'isBanned' },
              { key: 'pmBan', label: 'PM Ban', dbField: 'pmBan' },
              { key: 'shoutBan', label: 'Shout Ban', dbField: 'shoutBan' },
              { key: 'chatBan', label: 'Chat Ban', dbField: 'chatBan' },
              { key: 'shadowBan', label: 'Shadow Ban', dbField: 'isShadowBanned' },
            ].map((toggle) => {
              const isActive = (banStates as any)[toggle.key];
              return (
                <button
                  key={toggle.key}
                  onClick={() => handleToggleBan(toggle.key, toggle.dbField)}
                  className={`p-3.5 sm:p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center min-w-0 active:scale-[0.95] ${isActive ? (toggle.key === 'shadowBan' ? 'bg-indigo-900/40 border-indigo-500 text-indigo-300 font-black shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-red-600/30 border-red-500 text-white font-black') : 'bg-[#11111E] border-white/5 text-white/60 font-medium hover:bg-white/5'}`}
                >
                  <span className="text-sm sm:text-base font-bold truncate w-full mb-1.5">{toggle.label}</span>
                  <span className={`text-[11px] sm:text-xs px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${isActive ? (toggle.key === 'shadowBan' ? 'bg-indigo-500 text-white' : 'bg-red-500 text-white') : 'bg-white/10 text-white/40'}`}>
                    {isActive ? 'ON' : 'OFF'}
                  </span>
                </button>
              );
            })}
          </div>
          {banStates.shadowBan && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-xs sm:text-sm text-indigo-300/80 font-medium bg-indigo-900/20 border border-indigo-500/20 p-3 rounded-xl mt-3">
              Ghost Restrict Active: User can post normally, but their content is globally hidden from other users.
            </motion.p>
          )}
        </div>

        {/* 7. DIRECT SYSTEM SCREEN NOTICE */}
        <div className="bg-[#1C1C2E] border border-cyan-500/30 rounded-2xl p-4 sm:p-5 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <h4 className="text-sm sm:text-base font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2 relative z-10">
            ✉️ Send Direct System Notice Alert
          </h4>
          <p className="text-xs sm:text-sm text-white/50 relative z-10">
            This notice will pop up natively on the user's active viewport and lock their screen until they acknowledge it.
          </p>
          <div className="space-y-3 relative z-10">
            <textarea
              value={systemNotice}
              onChange={(e) => setSystemNotice(e.target.value)}
              placeholder="e.g., Please avoid using bad words..."
              className="w-full bg-[#11111E] border border-white/10 focus:border-cyan-500/50 rounded-xl px-4 py-3.5 text-sm sm:text-base text-white placeholder-white/20 outline-none min-h-[100px] resize-y"
            />
            <button onClick={injectAlert} className="w-full bg-cyan-500 hover:bg-cyan-600 text-[#090d16] font-black text-sm sm:text-base uppercase tracking-wider py-3.5 rounded-xl active:scale-[0.98] transition-all">
              Inject Alert Now
            </button>
          </div>
        </div>

        {/* 6. 2FA / SECURITY OVERRIDES */}
        <div className="bg-[#1C1C2E] border border-red-500/20 rounded-2xl p-4 sm:p-5 space-y-4">
          <h4 className="text-sm sm:text-base font-black text-red-400/80 uppercase tracking-widest flex items-center gap-2">
            🔐 Security Overrides
          </h4>
          <div className="bg-red-950/20 border border-red-500/20 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm sm:text-base font-bold text-white">Disable / Reset 2FA Code</p>
              <p className="text-xs sm:text-sm text-red-400/60 mt-0.5">Emergency action for account recovery only.</p>
            </div>
            
            {disable2FAConfirm ? (
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={() => setDisable2FAConfirm(false)} className="flex-1 sm:flex-none px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all">
                  Cancel
                </button>
                <button onClick={() => setDisable2FAConfirm(false)} className="flex-1 sm:flex-none px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-black transition-all">
                  Confirm Reset
                </button>
              </div>
            ) : (
              <button onClick={() => setDisable2FAConfirm(true)} className="w-full sm:w-auto px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 rounded-xl text-sm font-black transition-all">
                Reset 2FA
              </button>
            )}
          </div>
        </div>

        {/* WALLET & STAT DRIVERS */}
        <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4 sm:p-5 space-y-5">
          <h4 className="text-sm sm:text-base font-black text-white/60 uppercase tracking-widest flex items-center gap-2">
            💰 Wallet & Stat Drivers
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: '👍 Plusses', val: plusses, set: setPlusses, dbField: 'plusses' },
              { label: '🪙 Gold Coins', val: goldCoins, set: setGoldCoins, dbField: 'goldenCoins' },
              { label: '🔘 Silver Coins', val: silverCoins, set: setSilverCoins, dbField: 'silverPoints' },
              { label: '💵 Taka Balance', val: takaBalance, set: setTakaBalance, dbField: 'balance_taka' },
            ].map((inputItem) => (
              <div key={inputItem.label} className="flex flex-col gap-2">
                <label className="text-xs sm:text-sm font-bold text-white/60 uppercase tracking-wider">{inputItem.label}</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={inputItem.val}
                    onChange={(e) => inputItem.set(e.target.value)}
                    className="flex-1 bg-[#11111E] border border-white/10 rounded-xl px-4 py-3 text-base text-white font-mono outline-none"
                  />
                  <button onClick={() => handleAdminUpdate({ [inputItem.dbField]: Number(inputItem.val) })} className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-black text-sm uppercase tracking-wider px-5 rounded-xl shrink-0 transition-all">
                    Set
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SYSTEM ROLE SHIFT */}
        <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4 sm:p-5 space-y-4">
          <h4 className="text-sm sm:text-base font-black text-white/60 uppercase tracking-widest flex items-center gap-2">
            🛡️ System Role Shift
          </h4>
          <div className="flex flex-wrap gap-2.5">
            {['starter', 'user', 'trusted_member', 'premium', 'moderator', 'admin'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex-1 min-w-[120px] ${selectedRole === role ? 'bg-indigo-600 text-white border border-indigo-400/30 shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'bg-[#11111E] text-white/40 border border-white/5 hover:border-white/10'}`}
              >
                {role.replace('_', ' ')}
              </button>
            ))}
          </div>
          <button onClick={() => handleAdminUpdate({ user_role: selectedRole })} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-sm sm:text-base uppercase tracking-wider py-3.5 rounded-xl active:scale-[0.98] transition-all mt-4">
            Apply Role Shift
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminUserManagement;