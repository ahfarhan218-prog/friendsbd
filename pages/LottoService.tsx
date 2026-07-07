import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { mongoService, API_BASE } from '../services/mongoService';
import { triggerToast } from '../components/NotificationToast';
import LottoGiftModule from '../components/LottoGiftModule';
import { User } from '../types';

interface Winner {
  id: string;
  username: string;
  prize_won: string;
  created_at?: any;
}

const LottoService: React.FC = () => {
  const navigate = useNavigate();
  const [activeUser, setActiveUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<'subscribe' | 'gift'>('subscribe');
  const [winners, setWinners] = useState<Winner[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const activeRef = useRef(true);

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('user_session');
      if (saved) {
        setActiveUser(JSON.parse(saved));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const fetchWinners = async () => {
      try {
        const res = await fetch(`${API_BASE}/lotto/winners`);
        if (activeRef.current) {
          const data = await res.json();
          if (data.length > 0) setWinners(data);
        }
      } catch (err) {
        console.warn("Failed to fetch winners:", err);
      }
    };
    fetchWinners();
    const interval = setInterval(fetchWinners, 10000);
    return () => {
      activeRef.current = false;
      clearInterval(interval);
    };
  }, []);

  const marqueeWinners = [...winners, ...winners, ...winners];

  const handleSubscribe = async () => {
    if (activeUser.goldenCoins < 15) {
      alert("Insufficient Golden Coins! Subscription costs 15 Golden Coins.");
      return;
    }

    setSubLoading(true);
    try {
      const res = await fetch(`${API_BASE}/lotto/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUser.id })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Subscription failed');
      }

      const data = await res.json();

      const updatedUser = {
        ...activeUser,
        goldenCoins: data.newCoins,
        lotto_active_until: data.lottoExpiry
      };

      if (data.prize.includes('Premium')) {
        updatedUser.isPremium = true;
        const currentPrem = activeUser.premiumExpiry || Date.now();
        updatedUser.premiumExpiry = Math.max(Date.now(), currentPrem) + 7 * 24 * 60 * 60 * 1000;
      } else if (data.prize.includes('RP')) {
        updatedUser.reputation_points = (activeUser.reputation_points || 0) + 5;
      } else if (data.prize.includes('Plusses')) {
        updatedUser.plusses = (activeUser.plusses || 0) + 250;
      }

      setActiveUser(updatedUser);
      localStorage.setItem('user_session', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('storage'));

      const updateData: Record<string, any> = {
        goldenCoins: updatedUser.goldenCoins,
        isPremium: updatedUser.isPremium || false,
        premiumExpiry: updatedUser.premiumExpiry || null,
        reputation_points: updatedUser.reputation_points || 0,
        plusses: updatedUser.plusses || 0
      };
      if (updatedUser.lotto_active_until) updateData.lotto_active_until = updatedUser.lotto_active_until;
      await mongoService.updateUser(activeUser.id, updateData as any);

      triggerToast({
        id: 'subscribe-lotto-' + Date.now(),
        senderId: 'system',
        senderName: 'Lotto System',
        senderAvatar: 'https://i.pravatar.cc/100?img=12',
        type: 'SYSTEM',
        message: `Successfully Subscribed! Lotto activated for 7 days! 🎫`,
        timestamp: Date.now(),
        isRead: false
      } as any);

      triggerToast({
        id: 'magic-box-' + Date.now(),
        senderId: 'system',
        senderName: 'Magic Box Roll',
        senderAvatar: 'https://i.pravatar.cc/100?img=15',
        type: 'REWARD',
        message: `🎁 Magic Box Roll awarded you: ${data.prize}!`,
        timestamp: Date.now(),
        isRead: false
      } as any);

    } catch (e: any) {
      alert(`Subscription failed: ${e.message}`);
    } finally {
      setSubLoading(false);
    }
  };

  const getLottoStatusText = () => {
    if (!activeUser.lotto_active_until) return 'Inactive';
    let time = 0;
    if (typeof activeUser.lotto_active_until === 'number') {
      time = activeUser.lotto_active_until;
    } else {
      time = new Date(activeUser.lotto_active_until).getTime();
    }
    if (time < Date.now()) return 'Expired';
    return `Active until ${new Date(time).toLocaleDateString()}`;
  };

  return (
    <div className="min-h-screen bg-transparent font-sans pb-32 overflow-x-hidden">
      <div className="max-w-md mx-auto px-4 pt-6 flex justify-between items-center">
        <button 
          onClick={() => navigate('/apps')} 
          className="p-3 bg-white border border-[#cbd5e1] rounded-2xl active:scale-95 transition-all text-black hover:bg-slate-50 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-black text-black uppercase tracking-tight">Golden Lotto Portal</h2>
        <div className="flex items-center gap-2 bg-white border border-[#cbd5e1] px-4 py-2 rounded-2xl shadow-sm">
          <span className="text-amber-500">🪙</span>
          <span className="font-extrabold text-sm text-black">{activeUser.goldenCoins}</span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6 space-y-6">
        <div className="overflow-hidden w-full relative whitespace-nowrap bg-[#0f766e]/10 text-[#0f766e] border border-[#0f766e]/20 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center gap-4">
          <span className="shrink-0 font-bold bg-[#0f766e] text-white px-2.5 py-1 rounded-lg uppercase tracking-wider text-[8px] z-10">
            Live Winners
          </span>
          <div className="animate-marquee-wrapper overflow-hidden w-full relative flex">
            <div className="animate-marquee flex gap-8 whitespace-nowrap">
              {marqueeWinners.map((w, index) => (
                <span key={`${w.id}-${index}`} className="inline-block font-semibold">
                  🎉 @{w.username} won <strong className="text-black">{w.prize_won}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Subscription Status</p>
            <h3 className="font-extrabold text-base text-black">Golden Lotto</h3>
          </div>
          <span className={`font-black text-xs px-3.5 py-1 rounded-full uppercase tracking-wider ${getLottoStatusText().startsWith('Active') ? 'text-[#0f766e] bg-[#0f766e]/10 border border-[#0f766e]/20' : 'text-slate-500 bg-slate-100 border border-slate-200'}`}>
            {getLottoStatusText()}
          </span>
        </div>

        <div className="flex bg-[#cbd5e1]/40 p-1 rounded-2xl gap-1 border border-[#cbd5e1]/65">
          <button
            onClick={() => setActiveTab('subscribe')}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${activeTab === 'subscribe' ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-black'}`}
          >
            🎫 Subscribe Portal
          </button>
          <button
            onClick={() => setActiveTab('gift')}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${activeTab === 'gift' ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-black'}`}
          >
            🎁 Lotto Gifting Hub
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'subscribe' ? (
            <motion.div
              key="subscribe-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-white border border-[#cbd5e1] rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-black text-black uppercase tracking-wider text-sm">✨ Subscription Perks</h3>
                <ul className="space-y-3.5 text-xs text-slate-600 font-medium">
                  <li className="flex items-start gap-3">
                    <span className="text-[#0f766e] text-base shrink-0">⚡</span>
                    <div>
                      <strong className="text-black block">3x AP Boost Multiplier</strong>
                      Boost hourly online duration rewards from 5 Plusses to 15 Plusses per hour automatically.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#0f766e] text-base shrink-0">🎁</span>
                    <div>
                      <strong className="text-black block">Instant Magic Box Loot Roll</strong>
                      Unboxing roll executes instantly upon subscribing: win either 7 Days Premium, +5 RP, or +250 Plusses.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#0f766e] text-base shrink-0">🛡️</span>
                    <div>
                      <strong className="text-black block">Secure Server Roll</strong>
                      Every transaction and roll runs on the MongoDB backend.
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-white border border-[#cbd5e1] rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="font-black text-black uppercase tracking-wider text-sm">🎫 Select Package</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Confirm subscription to start your boost.</p>
                </div>

                <div className="border border-[#cbd5e1] bg-[#f8fafc] rounded-2xl p-5 flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-xs font-extrabold text-black">Package 1 (Standard)</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">7 Days Boost Subscription</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[#6d28d9]">15 Golden Coins</p>
                  </div>
                </div>

                <button
                  onClick={handleSubscribe}
                  disabled={subLoading || activeUser.goldenCoins < 15}
                  className="w-full bg-[#6d28d9] hover:bg-[#6d28d9]/90 active:scale-95 text-[#f4f5f6] font-bold py-4 px-6 rounded-2xl shadow-md transition-all uppercase tracking-widest text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {subLoading ? 'PROCESSING...' : activeUser.goldenCoins < 15 ? 'INSUFFICIENT GOLDEN COINS' : 'SUBSCRIBE & OPEN MAGIC BOX'}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="gift-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <LottoGiftModule 
                currentUser={activeUser}
                onCoinsUpdated={(newCoins) => {
                  setActiveUser(prev => ({ ...prev, goldenCoins: newCoins }));
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-marquee {
          display: flex;
          gap: 2rem;
          animation: marquee 20s linear infinite;
        }
        .animate-marquee-wrapper {
          display: flex;
          width: 100%;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default LottoService;