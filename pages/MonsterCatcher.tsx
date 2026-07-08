import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { triggerToast } from '../components/NotificationToast';
import { API_BASE, mongoService } from '../services/mongoService';
import { User } from '../types';

const RARITY_COLORS = {
  Common: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  Uncommon: 'text-green-400 bg-green-500/10 border-green-500/20',
  Rare: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Legendary: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
};

const ZONES = [
  { name: 'Forest', icon: '🌲', cost: 3, stamina: 10, durationText: '10-15m', desc: 'A safe zone for beginners.', color: 'from-green-600/20 to-emerald-800/20' },
  { name: 'Cave', icon: '🦇', cost: 10, stamina: 20, durationText: '20-30m', desc: 'Dark and humid, home to uncommon beasts.', color: 'from-gray-600/20 to-stone-800/20' },
  { name: 'Volcano', icon: '🌋', cost: 25, stamina: 40, durationText: '40-60m', desc: 'Extreme heat, high rare encounter rate.', color: 'from-red-600/20 to-orange-800/20' },
  { name: 'Shadow Peak', icon: '⛰️', cost: 50, stamina: 60, durationText: '90-120m', desc: 'Only for the elite. Legends await.', color: 'from-purple-600/20 to-indigo-900/20' }
];

const MonsterCatcher: React.FC = () => {
  const navigate = useNavigate();
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'hunt' | 'collection' | 'shop' | 'fuse' | 'arena' | 'market'>('hunt');
  
  // Game State
  const [colorBalls, setColorBalls] = useState(0);
  const [goldenBalls, setGoldenBalls] = useState(0);
  const [stamina, setStamina] = useState(100);
  const [maxStamina, setMaxStamina] = useState(100);
  const [plusses, setPlusses] = useState(0);
  const [ap, setAp] = useState(0);
  const [collection, setCollection] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(0);
  
  // Arena State
  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
  const [battleLogs, setBattleLogs] = useState<string[]>([]);
  const [showBattleModal, setShowBattleModal] = useState(false);

  // Market State
  const [marketListings, setMarketListings] = useState<any[]>([]);
  const [marketSellPrice, setMarketSellPrice] = useState<string>('');

  useEffect(() => {
    const sessionStr = localStorage.getItem('user_session');
    if (!sessionStr) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(sessionStr);
    setActiveUser(user);
    fetchStatus(user.id);
  }, []);

  const fetchStatus = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE}/monster/status?userId=${userId}`);
      const data = await res.json();
      if (res.ok) {
        setColorBalls(data.colorBalls);
        setGoldenBalls(data.goldenBalls);
        setStamina(data.stamina);
        setMaxStamina(data.maxStamina);
        setPlusses(data.plusses);
        setAp(data.ap);
        setCollection(data.collection);
        setActiveSession(data.activeSession);
        setCanClaimDaily(data.canClaimDaily);
        setDailyStreak(data.dailyStreakCount);
        if (data.serverTime) {
          setServerTimeOffset(data.serverTime - Date.now());
        }
        if (data.activeSession && !data.activeSession.isCompleted) {
          updateTimer(data.activeSession.endTime, data.serverTime ? data.serverTime - Date.now() : serverTimeOffset);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarket = async () => {
    try {
      const res = await fetch(`${API_BASE}/monster/market`);
      const data = await res.json();
      if (res.ok) setMarketListings(data.listings);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 'market') fetchMarket();
  }, [activeTab]);

  const updateTimer = (endTime: number, offset = serverTimeOffset) => {
    const now = Date.now() + offset;
    const diff = endTime - now;
    setTimeLeft(diff > 0 ? diff : 0);
  };

  useEffect(() => {
    if (activeSession && timeLeft > 0) {
      const interval = setInterval(() => {
        updateTimer(activeSession.endTime, serverTimeOffset);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeSession, timeLeft, serverTimeOffset]);

  const handleStartHunt = async (zoneName: string, useGoldenBall: boolean, cost: number, staminaCost: number) => {
    if (stamina < staminaCost) {
      triggerToast({ id: 'err', type: 'ERROR', message: 'Not enough Stamina!' } as any);
      return;
    }
    if (useGoldenBall && goldenBalls < 1) {
      triggerToast({ id: 'err', type: 'ERROR', message: 'Not enough Golden Balls!' } as any);
      return;
    }
    if (!useGoldenBall && colorBalls < cost) {
      triggerToast({ id: 'err', type: 'ERROR', message: 'Not enough Color Balls!' } as any);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/monster/hunt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUser?.id, zoneName, useGoldenBall })
      });
      const data = await res.json();
      if (res.ok) {
        setActiveSession(data.session);
        setColorBalls(data.colorBalls);
        setGoldenBalls(data.goldenBalls);
        setStamina(data.stamina);
        if (data.serverTime) {
          const offset = data.serverTime - Date.now();
          setServerTimeOffset(offset);
          updateTimer(data.session.endTime, offset);
        } else {
          updateTimer(data.session.endTime, serverTimeOffset);
        }
        triggerToast({ id: 'ok', type: 'SYSTEM', message: `Started hunting in ${zoneName}!` } as any);
      } else {
        triggerToast({ id: 'err', type: 'ERROR', message: data.error } as any);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClaim = async () => {
    try {
      const res = await fetch(`${API_BASE}/monster/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUser?.id })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast({ id: 'claim', type: 'SYSTEM', message: `Caught ${data.monsterName}!` } as any);
        
        mongoService.addActivity({
          id: 'act_' + Date.now(),
          time: new Date().toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' }),
          username: activeUser?.username || activeUser?.name || 'Unknown',
          msg: `caught a ${data.monsterName}!`,
          timestamp: Date.now(),
          link: `/monster-catcher`
        });

        setActiveSession(null);
        fetchStatus(activeUser!.id);
      } else {
        triggerToast({ id: 'err', type: 'ERROR', message: data.error } as any);
        if (data.error === 'No active hunt') {
          setActiveSession(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDaily = async () => {
    try {
      const res = await fetch(`${API_BASE}/monster/daily`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUser?.id })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast({ id: 'daily', type: 'SYSTEM', message: data.rewardMsg } as any);
        setCanClaimDaily(false);
        setColorBalls(data.colorBalls);
        setGoldenBalls(data.goldenBalls);
        setDailyStreak(data.streak);
      } else {
        triggerToast({ id: 'err', type: 'ERROR', message: data.error } as any);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFuse = async (monsterName: string) => {
    try {
      const res = await fetch(`${API_BASE}/monster/fuse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUser?.id, commonMonsterName: monsterName })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast({ id: 'fuse', type: 'SYSTEM', message: `Fusion successful! You got ${data.resultName} (${data.rarity})` } as any);
        setCollection(data.collection);
      } else {
        triggerToast({ id: 'err', type: 'ERROR', message: data.error } as any);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBuyBalls = async (amount: number, isGolden: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/monster/shop/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUser?.id, amount, isGolden })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast({ id: 'shop', type: 'SYSTEM', message: `Purchase successful!` } as any);
        setColorBalls(data.colorBalls);
        setGoldenBalls(data.goldenBalls);
        setPlusses(data.plusses);
      } else {
        triggerToast({ id: 'err', type: 'ERROR', message: data.error } as any);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBattle = async () => {
    if (selectedTeam.length === 0) return;
    try {
      const res = await fetch(`${API_BASE}/monster/arena/battle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUser?.id, teamIds: selectedTeam })
      });
      const data = await res.json();
      if (res.ok) {
        setBattleLogs(data.logs);
        setShowBattleModal(true);
        if (data.isWin) fetchStatus(activeUser!.id);
      } else {
        triggerToast({ id: 'err', type: 'ERROR', message: data.error } as any);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleListMarket = async (monsterName: string) => {
    if (!marketSellPrice || isNaN(Number(marketSellPrice))) {
      triggerToast({ id: 'err', type: 'ERROR', message: 'Invalid price' } as any);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/monster/market/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUser?.id, monsterName, pricePlusses: Number(marketSellPrice) })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast({ id: 'market', type: 'SYSTEM', message: 'Listed successfully!' } as any);
        setMarketSellPrice('');
        fetchStatus(activeUser!.id);
      } else {
        triggerToast({ id: 'err', type: 'ERROR', message: data.error } as any);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBuyMarket = async (listingId: string) => {
    try {
      const res = await fetch(`${API_BASE}/monster/market/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUser?.id, listingId })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast({ id: 'market', type: 'SYSTEM', message: 'Purchase successful!' } as any);
        setPlusses(data.plusses);
        fetchMarket();
        fetchStatus(activeUser!.id);
      } else {
        triggerToast({ id: 'err', type: 'ERROR', message: data.error } as any);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const remM = m % 60;
    const remS = s % 60;
    if (h > 0) return `${h}h ${remM}m ${remS}s`;
    return `${m}m ${remS}s`;
  };

  if (loading) return <div className="text-white text-center mt-20">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans pb-20">
      {/* Header */}
      <div className="bg-slate-900 p-4 sticky top-0 z-10 border-b border-slate-800 flex justify-between items-center shadow-lg">
        <button onClick={() => navigate(-1)} className="p-2 bg-slate-800 rounded-full">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 uppercase">Monster Catcher</h1>
        <div className="w-9 text-sm text-right text-emerald-400 font-bold">Streak: {dailyStreak}</div>
      </div>

      {/* Stats Bar */}
      <div className="px-4 py-3 bg-slate-800/50 flex justify-around border-b border-slate-700/50">
        <div className="text-center">
          <p className="text-xs sm:text-sm text-slate-400 font-bold uppercase">Stamina</p>
          <p className="font-black text-amber-400 flex flex-wrap items-center justify-center gap-1 text-sm">⚡ {stamina}/{maxStamina}</p>
        </div>
        <div className="text-center">
          <p className="text-xs sm:text-sm text-slate-400 font-bold uppercase">Balls</p>
          <p className="font-black text-emerald-400 flex flex-wrap items-center justify-center gap-1 text-sm">🎨 {colorBalls} | 🌟 {goldenBalls}</p>
        </div>
        <div className="text-center">
          <p className="text-xs sm:text-sm text-slate-400 font-bold uppercase">Plusses</p>
          <p className="font-black text-cyan-400 flex flex-wrap items-center justify-center gap-1 text-sm">➕ {plusses}</p>
        </div>
      </div>

      {/* Daily Reward Banner */}
      {canClaimDaily && (
        <div className="m-4 p-4 bg-gradient-to-r from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 rounded-xl flex items-center justify-between">
          <div>
            <p className="font-black text-emerald-400 text-sm">Daily Streak Bonus!</p>
            <p className="text-sm text-emerald-200/70">{dailyStreak >= 6 ? 'Claim your +1 Golden Ball' : 'Claim your +5 free Color Balls'}</p>
          </div>
          <button onClick={handleDaily} className="px-4 py-2 bg-emerald-500 text-white font-black text-sm rounded-lg shadow-lg hover:bg-emerald-400 active:scale-95 transition">
            CLAIM
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap px-2 py-4 gap-2 overflow-x-auto no-scrollbar border-b border-slate-800">
        {['hunt', 'collection', 'shop', 'fuse', 'arena', 'market'].map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t as any)}
            className={`px-4 py-2 rounded-full font-black text-sm uppercase tracking-wider shrink-0 transition ${activeTab === t ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-slate-800 text-slate-400'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="p-4">
        
        {/* HUNT TAB */}
        {activeTab === 'hunt' && (
          <div className="space-y-4">
            {activeSession ? (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 sm:p-6 text-center shadow-xl">
                <div className="text-6xl mb-4 animate-bounce">🏃💨</div>
                <h3 className="text-lg font-black text-white mb-2">Hunting in {activeSession.zoneName}...</h3>
                <p className="text-sm text-slate-400 mb-6">Your monster catcher is searching the area.</p>
                
                <div className="w-full bg-slate-900 rounded-full h-4 mb-4 overflow-hidden border border-slate-700">
                  <div 
                    className="bg-gradient-to-r from-emerald-400 to-cyan-500 h-full transition-all duration-1000 ease-linear"
                    style={{ width: `${Math.max(0, Math.min(100, 100 - (timeLeft / (activeSession.endTime - activeSession.startTime)) * 100))}%` }}
                  ></div>
                </div>
                
                {timeLeft > 0 ? (
                  <p className="text-2xl font-black text-emerald-400 font-mono tracking-widest">{formatTime(timeLeft)}</p>
                ) : (
                  <button onClick={handleClaim} className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black uppercase tracking-widest text-lg shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 transition-transform">
                    Claim Reward
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-4">
                {ZONES.map(z => (
                  <div key={z.name} className={`bg-gradient-to-br ${z.color} border border-slate-700 p-4 rounded-2xl relative overflow-hidden group`}>
                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <div>
                        <span className="text-3xl block mb-2">{z.icon}</span>
                        <h3 className="font-black text-lg text-white">{z.name}</h3>
                        <p className="text-sm text-white/60">{z.desc}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-white/50 block">⏱️ {z.durationText}</span>
                        <span className="text-sm font-bold text-amber-400 block mt-1">⚡ {z.stamina} Stamina</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4 relative z-10">
                      <button onClick={() => handleStartHunt(z.name, false, z.cost, z.stamina)} className="flex flex-wrap-1 py-2 bg-slate-900/80 rounded-lg text-sm font-black text-white hover:bg-slate-900 transition flex flex-wrap items-center justify-center gap-2 border border-slate-700">
                        <span>🎨 {z.cost}</span> Catch
                      </button>
                      <button onClick={() => handleStartHunt(z.name, true, z.cost, z.stamina)} className="flex flex-wrap-1 py-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-sm font-black text-white shadow-lg active:scale-95 transition flex flex-wrap items-center justify-center gap-1">
                        <span>🌟 1</span> Golden Catch
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* COLLECTION TAB */}
        {activeTab === 'collection' && (
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Your Monsters ({collection.reduce((a,c) => a + c.count, 0)})</h2>
            {collection.length === 0 ? (
              <p className="text-center text-slate-500 py-10 font-bold">You haven't caught any monsters yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 gap-3">
                {collection.map((m, i) => (
                  <div key={i} className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center relative ${RARITY_COLORS[m.rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.Common}`}>
                    <span className="absolute -top-2 -right-2 bg-slate-900 text-white text-sm font-black w-6 h-6 rounded-full flex items-center justify-center border border-slate-700 shadow-lg">x{m.count}</span>
                    <img src={`https://robohash.org/${m.monsterName}?set=set2&size=100x100`} alt={m.monsterName} className="w-16 h-16 mb-2 drop-shadow-lg" />
                    <span className="font-black text-sm text-white">{m.monsterName}</span>
                    <span className="text-xs sm:text-sm uppercase tracking-widest mt-1 opacity-80 font-bold">{m.rarity} • {m.element}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SHOP TAB */}
        {activeTab === 'shop' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-700 text-center">
              <h3 className="text-xl font-black text-white mb-2">Buy Color Balls 🎨</h3>
              <p className="text-sm text-slate-400 mb-6">Convert your Plusses (➕) into Color Balls to hunt for monsters.</p>
              
              <div className="flex flex-wrap gap-2 justify-center">
                <button onClick={() => handleBuyBalls(1, false)} className="px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl hover:bg-slate-700 transition">
                  <div className="font-black text-emerald-400 text-lg mb-1">+1 Ball</div>
                  <div className="text-sm text-slate-400 font-bold">50 Plusses</div>
                </button>
                <button onClick={() => handleBuyBalls(5, false)} className="px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl hover:bg-slate-700 transition">
                  <div className="font-black text-emerald-400 text-lg mb-1">+5 Balls</div>
                  <div className="text-sm text-slate-400 font-bold">250 Plusses</div>
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-900/40 to-orange-900/40 p-4 sm:p-6 rounded-2xl border border-amber-500/30 text-center mt-4">
              <h3 className="text-xl font-black text-amber-400 mb-2">Buy Golden Balls 🌟</h3>
              <p className="text-sm text-amber-200/60 mb-6">Golden balls double your chance of catching Rare & Legendary monsters!</p>
              
              <button onClick={() => handleBuyBalls(1, true)} className="px-3 sm:px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl hover:opacity-90 transition w-full shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <div className="font-black text-white text-lg mb-1">+1 Golden Ball</div>
                <div className="text-sm text-white/80 font-bold">150 Plusses</div>
              </button>
            </div>
          </div>
        )}

        {/* FUSE TAB */}
        {activeTab === 'fuse' && (
          <div className="space-y-4">
             <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl text-center mb-6">
               <h3 className="font-black text-cyan-400 mb-2">Fusion System</h3>
               <p className="text-sm text-slate-400">Combine 3 identical <span className="text-gray-300 font-bold">Common</span> monsters to generate 1 random <span className="text-green-400 font-bold">Uncommon</span> monster!</p>
             </div>

             <div className="grid grid-cols-1 gap-3">
               {collection.filter(m => m.rarity === 'Common' && m.count >= 3).length === 0 ? (
                 <p className="text-center text-slate-500 py-4 font-bold">You don't have 3 of the same Common monster.</p>
               ) : (
                 collection.filter(m => m.rarity === 'Common' && m.count >= 3).map((m, i) => (
                   <div key={i} className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
                     <div className="flex flex-wrap items-center gap-3">
                       <img src={`https://robohash.org/${m.monsterName}?set=set2&size=60x60`} alt={m.monsterName} className="w-10 h-10" />
                       <div>
                         <p className="font-black text-white">{m.monsterName}</p>
                         <p className="text-xs sm:text-sm text-slate-400 font-bold uppercase tracking-widest">Available: {m.count}</p>
                       </div>
                     </div>
                     <button onClick={() => handleFuse(m.monsterName)} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-black text-sm uppercase tracking-widest rounded-lg shadow-lg active:scale-95 transition">
                       Fuse 3x
                     </button>
                   </div>
                 ))
               )}
             </div>
          </div>
        )}

        {/* ARENA TAB */}
        {activeTab === 'arena' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-red-900/20 to-rose-900/20 border border-red-500/20 p-4 rounded-xl text-center mb-6">
               <h3 className="font-black text-rose-400 mb-2">World Boss Arena ⚔️</h3>
               <p className="text-sm text-rose-200/70">Deploy up to 3 monsters. Higher rarity = higher power. Winning grants +50 AP!</p>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Deploy Team ({selectedTeam.length}/3)</h4>
              <div className="flex flex-wrap gap-2">
                {collection.map((m, i) => {
                  const isSelected = selectedTeam.includes(m.monsterName);
                  return (
                    <button 
                      key={i} 
                      onClick={() => {
                        if (isSelected) setSelectedTeam(prev => prev.filter(name => name !== m.monsterName));
                        else if (selectedTeam.length < 3) setSelectedTeam(prev => [...prev, m.monsterName]);
                      }}
                      className={`px-3 py-2 text-sm font-black rounded-lg border transition ${isSelected ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                    >
                      <div className="flex flex-col items-center">
                        <img src={`https://robohash.org/${m.monsterName}?set=set2&size=40x40`} alt={m.monsterName} className="w-8 h-8 mb-1" />
                        <span>{m.monsterName}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button 
              onClick={handleBattle}
              disabled={selectedTeam.length === 0}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-black uppercase tracking-widest text-lg shadow-[0_0_20px_rgba(225,29,72,0.4)] active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
            >
              Battle Boss
            </button>
          </div>
        )}

        {/* MARKETPLACE TAB */}
        {activeTab === 'market' && (
          <div className="space-y-6">
            {/* Sell Box */}
            <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
              <h3 className="font-black text-white mb-4 text-sm">Sell a Monster</h3>
              <div className="flex flex-wrap gap-2">
                <select id="marketSelect" className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white outline-none">
                  <option value="">Select Monster...</option>
                  {collection.map((m, i) => (
                    <option key={i} value={m.monsterName}>{m.monsterName}</option>
                  ))}
                </select>
                <input 
                  type="number" 
                  value={marketSellPrice}
                  onChange={e => setMarketSellPrice(e.target.value)}
                  placeholder="Price (➕)" 
                  className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white outline-none placeholder:text-slate-500" 
                />
                <button 
                  onClick={() => {
                    const select = document.getElementById('marketSelect') as HTMLSelectElement;
                    if(select.value) handleListMarket(select.value);
                  }}
                  className="px-4 py-2 bg-emerald-500 text-white font-black text-sm rounded-lg hover:bg-emerald-400 transition"
                >
                  List
                </button>
              </div>
            </div>

            {/* Active Listings */}
            <div>
              <h3 className="font-black text-slate-400 uppercase tracking-widest text-sm mb-4">Active Listings</h3>
              <div className="space-y-3">
                {marketListings.length === 0 ? (
                  <p className="text-center text-slate-500 text-sm font-bold py-4">No monsters listed currently.</p>
                ) : (
                  marketListings.map(item => (
                    <div key={item._id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                      <div className="flex flex-wrap items-center gap-3">
                        <img src={`https://robohash.org/${item.monsterName}?set=set2&size=40x40`} alt={item.monsterName} className="w-8 h-8" />
                        <div>
                          <p className="font-black text-white text-sm">{item.monsterName}</p>
                          <p className="text-xs sm:text-sm text-slate-400 font-bold uppercase">{item.rarity} • {item.element}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-black text-cyan-400 text-sm">➕ {item.pricePlusses}</span>
                        {item.sellerId !== activeUser?.id && (
                          <button onClick={() => handleBuyMarket(item._id)} className="px-3 py-1.5 bg-cyan-500 text-white font-black text-sm rounded-md shadow-lg active:scale-95 transition">
                            Buy
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Battle Modal */}
      <AnimatePresence>
        {showBattleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                <h3 className="font-black text-white">Combat Log</h3>
                <button onClick={() => setShowBattleModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <div className="p-4 overflow-y-auto space-y-3 font-mono text-sm">
                {battleLogs.map((log, i) => (
                  <p key={i} className={`${log.includes('VICTORY') ? 'text-emerald-400 font-black text-sm' : log.includes('DEFEAT') ? 'text-red-400 font-black text-sm' : 'text-slate-300'}`}>
                    {log}
                  </p>
                ))}
              </div>
              <div className="p-4 bg-slate-800 border-t border-slate-700">
                <button onClick={() => setShowBattleModal(false)} className="w-full py-2 bg-slate-700 text-white font-black rounded-lg hover:bg-slate-600 transition">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MonsterCatcher;


