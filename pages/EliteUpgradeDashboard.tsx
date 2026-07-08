import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../services/mongoService';
import { apService } from '../services/apService';
import { triggerToast } from '../components/NotificationToast';
import { User } from '../types';

interface TierOption {
  days: number;
  cost: number;
}

const RP_TIERS: TierOption[] = [
  { days: 30, cost: 20 },
  { days: 60, cost: 35 },
  { days: 90, cost: 50 }
];

const TAKA_TIERS: TierOption[] = [
  { days: 30, cost: 50 },
  { days: 60, cost: 80 },
  { days: 90, cost: 100 }
];

const EliteUpgradeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [selectedRpTier, setSelectedRpTier] = useState<number>(0);
  const [selectedTakaTier, setSelectedTakaTier] = useState<number>(0);
  const [rpLoading, setRpLoading] = useState(false);
  const [takaLoading, setTakaLoading] = useState(false);

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('user_session');
      if (saved) {
        setUser(JSON.parse(saved));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const getTakaBalance = (u: any) => {
    return u.balance_taka !== undefined ? u.balance_taka : (u.taka_balance !== undefined ? u.taka_balance : 0);
  };

  const getRpBalance = (u: any) => {
    return u.reputation_points || 0;
  };

  const getEliteExpiryText = () => {
    if (!user.elite_active_until) return 'Not Active';
    const expiry = typeof user.elite_active_until === 'number' 
      ? user.elite_active_until 
      : (user.elite_active_until as any).seconds 
        ? (user.elite_active_until as any).seconds * 1000 
        : new Date(user.elite_active_until).getTime();

    if (expiry < Date.now()) return 'Expired';
    return `Active until ${new Date(expiry).toLocaleDateString()}`;
  };

  // Purchase via Reputation Points (RP)
  const handleUpgradeViaRp = async () => {
    const tier = RP_TIERS[selectedRpTier];
    const rpBalance = getRpBalance(user);

    if (rpBalance < tier.cost) {
      alert(`Insufficient Reputation Points! You need ${tier.cost} RP, but you only have ${rpBalance} RP.`);
      return;
    }

    setRpLoading(true);
    try {
      let responseOk = false;
      let newRpBalance = rpBalance - tier.cost;
      let newExpiry = Date.now() + tier.days * 24 * 60 * 60 * 1000;

      // 1. Try Endpoint Call
      try {
        const userId = JSON.parse(localStorage.getItem('user_session') || '{}').id || 'anonymous';
        const res = await fetch(`${API_BASE}/elite/upgrade-via-rp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, days: tier.days, cost: tier.cost })
        });

        if (res.ok) {
          const data = await res.json();
          newRpBalance = data.newRp;
          newExpiry = data.eliteExpiry;
          responseOk = true;
        } else {
          const errData = await res.json();
          console.warn('API returned error, using local fallback:', errData);
        }
      } catch (apiError) {
        console.warn('Backend API unreachable. Using local fallback:', apiError);
      }

      // 2. Client-side local fallback (no Firestore)
      if (!responseOk) {
        const currentRp = getRpBalance(user);
        if (currentRp < tier.cost) throw new Error('Insufficient Reputation Points.');
        const currentExpiryTime = typeof user.elite_active_until === 'number'
          ? user.elite_active_until
          : user.elite_active_until ? new Date(user.elite_active_until as any).getTime() : 0;
        const baseTime = Math.max(Date.now(), currentExpiryTime);
        newRpBalance = currentRp - tier.cost;
        newExpiry = baseTime + tier.days * 24 * 60 * 60 * 1000;
      }

      // 3. Award +20 AP (Rule 13: Premium/Elite Upgrade)
      apService.awardAP(20, 'FriendsBD Elite Upgrade Boost', '💎', true, true);

      // 4. Update Local State and storage
      const updatedUser = { 
        ...user, 
        reputation_points: newRpBalance,
        elite_active_until: newExpiry,
        isPremium: true,
        premiumExpiry: newExpiry
      };
      setUser(updatedUser);
      localStorage.setItem('user_session', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('storage'));

      triggerToast({
        id: 'elite-rp-' + Date.now(),
        senderId: 'system',
        senderName: 'Elite Service',
        senderAvatar: 'https://i.pravatar.cc/100?img=12',
        type: 'REWARD',
        message: `Welcome to FriendsBD Elite! Activation successful for ${tier.days} Days! 💎`,
        timestamp: Date.now(),
        isRead: false
      } as any);

    } catch (e: any) {
      alert(`Activation Failed: ${e.message}`);
    } finally {
      setRpLoading(false);
    }
  };

  // Purchase via Taka Wallet
  const handleUpgradeViaTaka = async () => {
    const tier = TAKA_TIERS[selectedTakaTier];
    const takaBalance = getTakaBalance(user);

    if (takaBalance < tier.cost) {
      alert(`Insufficient Account Balance! Gifting or buying requires ৳${tier.cost}, but you have ৳${takaBalance}. Please add funds to your wallet first.`);
      return;
    }

    setTakaLoading(true);
    try {
      let responseOk = false;
      let newTakaBalance = takaBalance - tier.cost;
      let newExpiry = Date.now() + tier.days * 24 * 60 * 60 * 1000;

      // 1. Try Endpoint Call
      try {
        const userId = JSON.parse(localStorage.getItem('user_session') || '{}').id || 'anonymous';
        const res = await fetch(`${API_BASE}/elite/upgrade-via-wallet`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, days: tier.days, cost: tier.cost })
        });

        if (res.ok) {
          const data = await res.json();
          newTakaBalance = data.newTaka;
          newExpiry = data.eliteExpiry;
          responseOk = true;
        } else {
          const errData = await res.json();
          console.warn('API returned error, using local fallback:', errData);
        }
      } catch (apiError) {
        console.warn('Backend API unreachable. Using local fallback:', apiError);
      }

      // 2. Client-side local fallback (no Firestore)
      if (!responseOk) {
        const currentTaka = getTakaBalance(user);
        if (currentTaka < tier.cost) throw new Error('Insufficient Account Balance.');
        const currentExpiryTime = typeof user.elite_active_until === 'number'
          ? user.elite_active_until
          : user.elite_active_until ? new Date(user.elite_active_until as any).getTime() : 0;
        const baseTime = Math.max(Date.now(), currentExpiryTime);
        newTakaBalance = currentTaka - tier.cost;
        newExpiry = baseTime + tier.days * 24 * 60 * 60 * 1000;
      }

      // 3. Award +20 AP (Rule 13: Premium/Elite Upgrade)
      apService.awardAP(20, 'FriendsBD Elite Upgrade Boost', '💎', true, true);

      // 4. Update Local State and storage
      const updatedUser = { 
        ...user, 
        balance_taka: newTakaBalance,
        taka_balance: newTakaBalance,
        elite_active_until: newExpiry,
        isPremium: true,
        premiumExpiry: newExpiry
      };
      setUser(updatedUser);
      localStorage.setItem('user_session', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('storage'));

      triggerToast({
        id: 'elite-taka-' + Date.now(),
        senderId: 'system',
        senderName: 'Elite Service',
        senderAvatar: 'https://i.pravatar.cc/100?img=12',
        type: 'REWARD',
        message: `Welcome to FriendsBD Elite! Activation successful for ${tier.days} Days! 💎`,
        timestamp: Date.now(),
        isRead: false
      } as any);

    } catch (e: any) {
      alert(`Activation Failed: ${e.message}`);
    } finally {
      setTakaLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent font-sans pb-32">
      {/* Top Navbar */}
      <div className="max-w-md mx-auto px-4 pt-6 flex justify-between items-center">
        <button 
          onClick={() => navigate('/apps')} 
          className="p-3 bg-white border border-[#cbd5e1] rounded-2xl active:scale-95 transition-all text-black hover:bg-slate-50 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-black text-black uppercase tracking-tight">FriendsBD Elite</h2>
        <div className="w-11 h-11 bg-white border border-[#cbd5e1] rounded-2xl flex items-center justify-center shadow-sm text-lg">
          💎
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-md mx-auto px-4 mt-6 space-y-6">
        
        {/* Elite Status Banner */}
        <div className="bg-white border border-[#cbd5e1] rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Membership Tier</p>
            <h3 className="font-extrabold text-base text-black">FriendsBD Elite Status</h3>
          </div>
          <span className={`font-black text-xs px-3.5 py-1 rounded-full uppercase tracking-wider ${getEliteExpiryText().startsWith('Active') ? 'text-[#0f766e] bg-[#0f766e]/10 border border-[#0f766e]/20' : 'text-slate-500 bg-slate-100 border border-slate-200'}`}>
            {getEliteExpiryText()}
          </span>
        </div>

        {/* Perks Benefit Card */}
        <div className="bg-[#ffffff] border border-[#cbd5e1] rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-black text-[#000000] uppercase tracking-wider text-sm">✨ Elite Privileges</h3>
          
          <ul className="space-y-3.5 text-xs text-slate-700 font-semibold">
            <li className="flex flex-wrap items-start gap-3">
              <span className="text-amber-500 text-sm shrink-0">⭐</span>
              <span className="text-[#000000]">Elite members can edit their Forum Topics, Posts, and Shouts.</span>
            </li>
            <li className="flex flex-wrap items-start gap-3">
              <span className="text-amber-500 text-sm shrink-0">⭐</span>
              <span className="text-[#000000]">Elite members can Upload Custom Smilies.</span>
            </li>
            <li className="flex flex-wrap items-start gap-3">
              <span className="text-amber-500 text-sm shrink-0">⭐</span>
              <span className="text-[#000000]">Elite members can change their Nickname Color dynamically.</span>
            </li>
          </ul>
        </div>

        {/* Current Balances Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-[#cbd5e1] rounded-2xl p-4 shadow-sm text-center">
            <span className="text-lg block mb-1">🏅</span>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reputation Points</p>
            <p className="font-extrabold text-sm text-[#000000] mt-1">{getRpBalance(user)} RP</p>
          </div>
          <div className="bg-white border border-[#cbd5e1] rounded-2xl p-4 shadow-sm text-center">
            <span className="text-lg block mb-1">💵</span>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Wallet Balance</p>
            <p className="font-extrabold text-sm text-[#000000] mt-1">৳{getTakaBalance(user)}</p>
          </div>
        </div>

        {/* Purchase Options Container */}
        <div className="space-y-6">
          
          {/* Purchase via RP Tiers */}
          <div className="bg-white border border-[#cbd5e1] rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-black text-black uppercase tracking-wider text-sm">🏅 Purchase via RP Tiers</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Upgrade using your earned reputation points.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 gap-2">
              {RP_TIERS.map((tier, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedRpTier(idx)}
                  className={`border-2 rounded-xl p-3 text-center transition-all flex flex-col items-center justify-center ${selectedRpTier === idx ? 'bg-[#6d28d9]/5 border-[#6d28d9] text-[#6d28d9]' : 'border-[#cbd5e1] hover:border-slate-400 text-slate-600'}`}
                >
                  <span className="text-xs font-black">{tier.days} Days</span>
                  <span className="text-[10px] font-bold mt-1 text-slate-400">{tier.cost} RP</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleUpgradeViaRp}
              disabled={rpLoading || getRpBalance(user) < RP_TIERS[selectedRpTier].cost}
              className="w-full bg-[#6d28d9] hover:bg-[#6d28d9]/90 active:scale-95 text-[#f4f5f6] font-bold py-3.5 px-6 rounded-xl shadow-sm transition-all uppercase tracking-wider text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {rpLoading ? 'PROCESSING...' : getRpBalance(user) < RP_TIERS[selectedRpTier].cost ? 'INSUFFICIENT RP' : `UPGRADE FOR ${RP_TIERS[selectedRpTier].cost} RP`}
            </button>
          </div>

          {/* Purchase via Taka Tiers */}
          <div className="bg-white border border-[#cbd5e1] rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-black text-black uppercase tracking-wider text-sm">৳ Purchase via Taka Tiers</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Upgrade instantly using your wallet funds.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 gap-2">
              {TAKA_TIERS.map((tier, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedTakaTier(idx)}
                  className={`border-2 rounded-xl p-3 text-center transition-all flex flex-col items-center justify-center ${selectedTakaTier === idx ? 'bg-[#6d28d9]/5 border-[#6d28d9] text-[#6d28d9]' : 'border-[#cbd5e1] hover:border-slate-400 text-slate-600'}`}
                >
                  <span className="text-xs font-black">{tier.days} Days</span>
                  <span className="text-[10px] font-bold mt-1 text-slate-400">৳{tier.cost}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleUpgradeViaTaka}
              disabled={takaLoading || getTakaBalance(user) < TAKA_TIERS[selectedTakaTier].cost}
              className="w-full bg-[#6d28d9] hover:bg-[#6d28d9]/90 active:scale-95 text-[#f4f5f6] font-bold py-3.5 px-6 rounded-xl shadow-sm transition-all uppercase tracking-wider text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {takaLoading ? 'PROCESSING...' : getTakaBalance(user) < TAKA_TIERS[selectedTakaTier].cost ? 'INSUFFICIENT WALLET BALANCE' : `UPGRADE FOR ৳${TAKA_TIERS[selectedTakaTier].cost}`}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default EliteUpgradeDashboard;

