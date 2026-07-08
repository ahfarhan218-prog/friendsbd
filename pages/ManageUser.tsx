import React, { useState } from 'react';
import { motion } from 'framer-motion';

const AdminUserManagement: React.FC = () => {
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
  const [strikes, setStrikes] = useState(1);

  // 2FA Security
  const [disable2FAConfirm, setDisable2FAConfirm] = useState(false);

  // Direct System Notice
  const [systemNotice, setSystemNotice] = useState('');

  // Mock Active Devices
  const activeDevices = [
    { id: 1, os: 'Windows 11', browser: 'Chrome', ip: '192.168.1.45', loc: 'Dhaka, BD', time: 'Active now' },
    { id: 2, os: 'iOS 17', browser: 'Safari', ip: '103.45.67.12', loc: 'Chittagong, BD', time: 'Last seen 2h ago' }
  ];

  // Mock Activity Timeline
  const activityTimeline = [
    { id: 101, time: '10:24 AM', desc: 'Reacted ❤️ to shout #142' },
    { id: 102, time: '09:15 AM', desc: 'Sent PM to @himu' },
    { id: 103, time: '08:45 AM', desc: 'Purchased Elite Badge (30 days)' },
    { id: 104, time: 'Yesterday', desc: 'Logged in via Chrome (Windows 11)' },
  ];

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
            <span>Logged in as <span className="text-purple-400 font-bold">@himu</span></span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] bg-red-500/20 text-red-400 font-black px-2 py-0.5 rounded uppercase tracking-wider">RBAC Active</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="px-4 -mt-8 space-y-5 relative z-10 max-w-4xl mx-auto w-full">

        {/* TOP SUB-NAV BAR */}
        <div className="grid grid-cols-3 gap-2 bg-[#1C1C2E] border border-white/5 p-1.5 rounded-2xl">
          {['📊 Dashboard', '🔧 User Tools', '📋 Audit Log'].map((tab, idx) => (
            <button key={tab} className={`py-2.5 text-sm sm:text-base font-black rounded-xl text-center transition-all ${idx === 1 ? 'bg-purple-600 text-white' : 'text-white/40 hover:text-white/70'}`}>
              {tab.split(' ')[1] || tab}
            </button>
          ))}
        </div>

        {/* SECTION TITLE */}
        <div className="bg-[#161626] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">🔧</span>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">User Management Tools</h2>
            <p className="text-sm text-white/50 font-medium mt-0.5">Search → Select → Act · All actions are logged.</p>
          </div>
        </div>

        {/* TARGET USER PROFILE CARD */}
        <div className="bg-[#1C1C2E] border border-purple-500/30 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-lg shadow-purple-900/10">
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              @farhan
              <span className="text-xs bg-emerald-500/20 text-emerald-400 font-black px-2.5 py-1 rounded-full uppercase">Clean</span>
            </h3>
            <p className="text-sm text-white/50 font-mono mt-1 truncate">ID: user_1783448468998 · Role: user</p>
          </div>
          <button className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-lg font-bold text-white/60">✕</button>
        </div>

        {/* 5. USER ENGAGEMENT STATS ANALYTICS MINI-DASHBOARD */}
        <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4 sm:p-5 space-y-4">
          <h4 className="text-sm sm:text-base font-black text-white/60 uppercase tracking-widest flex items-center gap-2">
            📈 Engagement Analytics
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#161626] border border-white/5 rounded-xl p-4">
              <p className="text-xs sm:text-sm font-bold text-white/40 uppercase tracking-wider mb-1">Avg Online/Day</p>
              <p className="text-xl sm:text-2xl font-black text-white">4h 12m</p>
            </div>
            <div className="bg-[#161626] border border-white/5 rounded-xl p-4">
              <p className="text-xs sm:text-sm font-bold text-white/40 uppercase tracking-wider mb-1">Total Points Spent</p>
              <p className="text-xl sm:text-2xl font-black text-amber-400">12,450</p>
            </div>
            <div className="bg-[#161626] border border-white/5 rounded-xl p-4">
              <p className="text-xs sm:text-sm font-bold text-white/40 uppercase tracking-wider mb-1">Top Interaction</p>
              <p className="text-xl sm:text-2xl font-black text-purple-400 truncate">@himu</p>
            </div>
          </div>
        </div>

        {/* 3. DETAILED USER ACTIVITY TIMELINE */}
        <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4 sm:p-5 space-y-4">
          <h4 className="text-sm sm:text-base font-black text-white/60 uppercase tracking-widest flex items-center gap-2">
            🕒 24h Activity Timeline
          </h4>
          <div className="bg-[#161626] border border-white/5 rounded-xl p-4 max-h-[250px] overflow-y-auto custom-scrollbar space-y-4">
            {activityTimeline.map(act => (
              <div key={act.id} className="flex gap-4 relative">
                <div className="absolute top-2.5 left-2 w-0.5 h-full bg-white/5 -z-10" />
                <div className="w-4 h-4 rounded-full bg-purple-500 border-4 border-[#161626] shrink-0 mt-1" />
                <div>
                  <p className="text-sm sm:text-base font-bold text-white/90">{act.desc}</p>
                  <p className="text-xs sm:text-sm font-bold text-white/40 mt-0.5">{act.time}</p>
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
            <button className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 font-black text-sm uppercase tracking-wider py-2.5 px-4 rounded-xl active:scale-95 transition-all w-full sm:w-auto">
              Force Logout All
            </button>
          </div>
          <div className="space-y-2">
            {activeDevices.map(dev => (
              <div key={dev.id} className="bg-[#161626] border border-white/5 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    {dev.browser} on {dev.os}
                    {dev.time === 'Active now' && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-white/40 mt-1">IP: {dev.ip} · {dev.loc}</p>
                </div>
                <div className="text-xs sm:text-sm font-bold text-white/30 uppercase tracking-wider bg-white/5 px-3 py-1.5 rounded-lg w-fit">
                  {dev.time}
                </div>
              </div>
            ))}
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
              onClick={() => setStrikes(s => Math.min(s + 1, 3))}
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
              { key: 'fullBan', label: 'Full Ban' },
              { key: 'pmBan', label: 'PM Ban' },
              { key: 'shoutBan', label: 'Shout Ban' },
              { key: 'chatBan', label: 'Chat Ban' },
              { key: 'shadowBan', label: 'Shadow Ban' },
            ].map((toggle) => {
              const isActive = (banStates as any)[toggle.key];
              return (
                <button
                  key={toggle.key}
                  onClick={() => setBanStates(prev => ({ ...prev, [toggle.key]: !isActive }))}
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
            <button className="w-full bg-cyan-500 hover:bg-cyan-600 text-[#090d16] font-black text-sm sm:text-base uppercase tracking-wider py-3.5 rounded-xl active:scale-[0.98] transition-all">
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
                <button className="flex-1 sm:flex-none px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-black transition-all">
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
              { label: '👍 Plusses', val: plusses, set: setPlusses, placeholder: '0' },
              { label: '🪙 Gold Coins', val: goldCoins, set: setGoldCoins, placeholder: '0' },
              { label: '🔘 Silver Coins', val: silverCoins, set: setSilverCoins, placeholder: '0' },
              { label: '💵 Taka Balance', val: takaBalance, set: setTakaBalance, placeholder: '0' },
            ].map((inputItem) => (
              <div key={inputItem.label} className="flex flex-col gap-2">
                <label className="text-xs sm:text-sm font-bold text-white/60 uppercase tracking-wider">{inputItem.label}</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={inputItem.val}
                    onChange={(e) => inputItem.set(e.target.value)}
                    placeholder={inputItem.placeholder}
                    className="flex-1 bg-[#11111E] border border-white/10 rounded-xl px-4 py-3 text-base text-white font-mono outline-none"
                  />
                  <button className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-black text-sm uppercase tracking-wider px-5 rounded-xl shrink-0 transition-all">
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
          <button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-sm sm:text-base uppercase tracking-wider py-3.5 rounded-xl active:scale-[0.98] transition-all mt-4">
            Apply Role Shift
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminUserManagement;