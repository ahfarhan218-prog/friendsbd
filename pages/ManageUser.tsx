import React, { useState } from 'react';
import { motion } from 'framer-motion';

const AdminUserManagement: React.FC = () => {
  const [reason, setReason] = useState('');
  const [warningLvl, setWarningLvl] = useState('0');
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
  });

  return (
    <div className="min-h-screen bg-[#0F0F1A] text-white pb-12 font-inter w-full overflow-x-hidden text-sm sm:text-base">

      {/* HEADER SECTION */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#110a2a] via-[#1d0d4a] to-[#0d1a6b] pt-8 pb-16 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_0%,_#7c3aed23,_transparent_70%)]" />
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase">Admin Control Panel</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/70 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl w-fit">
            <span>Logged in as <span className="text-purple-400 font-bold">@himu</span></span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] bg-red-500/20 text-red-400 font-black px-1.5 py-0.5 rounded uppercase tracking-wider">RBAC Active</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="px-4 -mt-8 space-y-4 relative z-10 max-w-4xl mx-auto w-full">

        {/* TOP SUB-NAV BAR */}
        <div className="grid grid-cols-3 gap-2 bg-[#1C1C2E] border border-white/5 p-1.5 rounded-xl">
          {['📊 Dashboard', '🔧 User Tools', '📋 Audit Log'].map((tab, idx) => (
            <button key={tab} className={`py-2 text-xs sm:text-sm font-black rounded-lg text-center transition-all ${idx === 1 ? 'bg-purple-600 text-white' : 'text-white/40 hover:text-white/70'}`}>
              {tab.split(' ')[1] || tab}
            </button>
          ))}
        </div>

        {/* SECTION TITLE */}
        <div className="bg-[#161626] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-xl">🔧</span>
          <div>
            <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">User Management Tools</h2>
            <p className="text-xs text-white/40 font-medium mt-0.5">Search → Select → Act · All actions are logged.</p>
          </div>
        </div>

        {/* TARGET USER PROFILE CARD */}
        <div className="bg-[#1C1C2E] border border-purple-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              @farhan
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-black px-2 py-0.5 rounded-full uppercase">Clean</span>
            </h3>
            <p className="text-xs text-white/40 font-mono mt-0.5 truncate">ID: user_1783448468998 · Role: user</p>
          </div>
          <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-sm font-bold text-white/60">✕</button>
        </div>

        {/* ACTION REASON - INPUT */}
        <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4 space-y-2">
          <label className="text-xs sm:text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            ⚠️ Action Reason <span className="text-red-500 text-xs">(Required)</span>
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide a valid reason for auditing logs..."
            className="w-full bg-[#11111E] border border-white/10 focus:border-purple-500/50 rounded-xl px-4 py-3 text-base text-white placeholder-white/20 outline-none transition-all font-medium"
          />
        </div>

        {/* INSTANT ACTIONS */}
        <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-black text-white/40 uppercase tracking-widest flex items-center gap-1">⚡ Instant Actions</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-200 font-black text-sm uppercase tracking-wider py-3 px-4 rounded-xl active:scale-[0.98] transition-all text-left flex items-center justify-between">
              <span>🔑 Boot & Force Reset Password</span>
              <span>→</span>
            </button>
            <button className="w-full bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-200 font-black text-sm uppercase tracking-wider py-3 px-4 rounded-xl active:scale-[0.98] transition-all text-left flex items-center justify-between">
              <span>🗑️ Purge All Shouts</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* RESTRICTION TOGGLES */}
        <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-black text-white/40 uppercase tracking-widest flex items-center gap-1">🚫 Restriction Toggles</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { key: 'fullBan', label: 'Full Ban' },
              { key: 'pmBan', label: 'PM Ban' },
              { key: 'shoutBan', label: 'Shout Ban' },
              { key: 'chatBan', label: 'Chat Ban' },
            ].map((toggle) => {
              const isActive = (banStates as any)[toggle.key];
              return (
                <button
                  key={toggle.key}
                  onClick={() => setBanStates(prev => ({ ...prev, [toggle.key]: !isActive }))}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center min-w-0 active:scale-[0.95] ${isActive ? 'bg-red-600/30 border-red-500 text-white font-black' : 'bg-[#11111E] border-white/5 text-white/60 font-medium'}`}
                >
                  <span className="text-xs sm:text-sm truncate w-full mb-1">{toggle.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${isActive ? 'bg-red-500 text-white' : 'bg-white/10 text-white/40'}`}>
                    {isActive ? 'ON' : 'OFF'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* WALLET & STAT DRIVERS */}
        <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4 space-y-4">
          <h4 className="text-xs font-black text-white/40 uppercase tracking-widest flex items-center gap-1">💰 Wallet & Stat Drivers</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: '⚠️ Warning Lvl (0-100)', val: warningLvl, set: setWarningLvl, placeholder: '0' },
              { label: '👍 Plusses', val: plusses, set: setPlusses, placeholder: '0' },
              { label: '🪙 Gold Coins', val: goldCoins, set: setGoldCoins, placeholder: '0' },
              { label: '🔘 Silver Coins', val: silverCoins, set: setSilverCoins, placeholder: '0' },
              { label: '💵 Taka Balance', val: takaBalance, set: setTakaBalance, placeholder: '0' },
            ].map((inputItem) => (
              <div key={inputItem.label} className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-white/60 uppercase">{inputItem.label}</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={inputItem.val}
                    onChange={(e) => inputItem.set(e.target.value)}
                    placeholder={inputItem.placeholder}
                    className="flex-1 bg-[#11111E] border border-white/10 rounded-xl px-3 py-2.5 text-base text-white font-mono outline-none"
                  />
                  <button className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider px-4 rounded-xl shrink-0 transition-all">
                    Set
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SYSTEM ROLE SHIFT */}
        <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-black text-white/40 uppercase tracking-widest flex items-center gap-1">🛡️ System Role Shift (Admin Only)</h4>
          <div className="flex flex-wrap gap-2">
            {['starter', 'user', 'trusted_member', 'premium', 'moderator', 'admin'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${selectedRole === role ? 'bg-indigo-600 text-white border border-indigo-400/30' : 'bg-[#11111E] text-white/40 border border-transparent'}`}
              >
                {role.replace('_', ' ')}
              </button>
            ))}
          </div>
          <button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-sm uppercase tracking-wider py-3 rounded-xl active:scale-[0.98] transition-all mt-2">
            Apply Role Shift
          </button>
        </div>

        {/* CROSS-ACCOUNT INVESTIGATOR */}
        <div className="bg-[#090d16]/80 backdrop-blur-xl border border-[#30363d] rounded-2xl p-4 space-y-2">
          <h4 className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 uppercase tracking-widest flex items-center gap-1.5">
            🌐 Cross-Account IP Investigator
          </h4>
          <div className="bg-[#161b22] border border-[#30363d] p-3 rounded-xl flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Last Known IP</p>
              <p className="text-sm font-black font-mono text-white/50 mt-0.5">Not recorded</p>
            </div>
            <button className="bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] px-3 py-2 text-xs font-black uppercase text-white rounded-lg transition-all active:scale-95">
              Scan
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminUserManagement;