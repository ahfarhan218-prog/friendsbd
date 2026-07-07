import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { triggerToast } from '../components/NotificationToast';
import { apTransactionService } from '../services/apTransactionService';
import { mongoService } from '../services/mongoService';

interface ShopItem {
  name: string;
  price: number;
  icon: string;
  type: string;
}

const Shop: React.FC = () => {
  const navigate = useNavigate();
  const [activeUser, setActiveUser] = useState<any>(null);
  const [isBuying, setIsBuying] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('user_session');
    if (saved) {
      setActiveUser(JSON.parse(saved));
    }
  }, []);

  const items: ShopItem[] = [
    { name: 'Fire Avatar Frame', price: 500, icon: '🔥', type: 'Frame' },
    { name: 'Diamond Badge', price: 1200, icon: '💎', type: 'Badge' },
    { name: 'Red Skateboard', price: 300, icon: '🛹', type: 'Gift' },
    { name: 'Superstar Flair', price: 800, icon: '⭐', type: 'Flair' },
    { name: 'Cool Shades', price: 150, icon: '🕶️', type: 'Gift' },
    { name: 'Lucky Clover', price: 200, icon: '🍀', type: 'Gift' },
  ];

  const handleBuy = async (item: ShopItem) => {
    if (!activeUser.id) {
      triggerToast({
        id: 'shop-no-auth-' + Date.now(),
        senderId: 'system',
        senderName: 'System',
        senderAvatar: '',
        type: 'SYSTEM',
        message: 'Please log in to purchase items.',
        timestamp: Date.now(),
        isRead: false
      } as any);
      return;
    }

    const userPoints = activeUser.points || 0;
    if (userPoints < item.price) {
      triggerToast({
        id: 'shop-insufficient-' + Date.now(),
        senderId: 'system',
        senderName: 'Shop Manager',
        senderAvatar: '',
        type: 'SYSTEM',
        message: `Insufficient points! You need ${item.price - userPoints} more points.`,
        timestamp: Date.now(),
        isRead: false
      } as any);
      return;
    }

    setIsBuying(item.name);
    try {
      // 1. Deduct points from user doc in Firestore
      const newPoints = userPoints - item.price;
      await mongoService.updateUser(activeUser.id, {
        points: newPoints
      });

      // 2. Award AP for utilizing fun item
      const { newBalance } = await apTransactionService.adjustUserAP(activeUser.id, 'USER_FUN_UTILIZED');

      // 3. Update local user session state
      const updatedUser = {
        ...activeUser,
        points: newPoints,
        balance_ap: newBalance
      };
      setActiveUser(updatedUser);
      localStorage.setItem('user_session', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('storage'));

      triggerToast({
        id: 'shop-success-' + Date.now(),
        senderId: 'shop',
        senderName: 'Gift Shop',
        senderAvatar: 'https://i.pravatar.cc/100?img=12',
        type: 'REWARD',
        message: `Purchased ${item.name}! -${item.price} pts & +2.0 AP utilized! 🎁`,
        timestamp: Date.now(),
        isRead: false
      } as any);
    } catch (err) {
      console.error('Failed to buy item:', err);
      triggerToast({
        id: 'shop-fail-' + Date.now(),
        senderId: 'system',
        senderName: 'Shop Manager',
        senderAvatar: '',
        type: 'SYSTEM',
        message: 'Transaction failed. Please try again.',
        timestamp: Date.now(),
        isRead: false
      } as any);
    } finally {
      setIsBuying(null);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-[#e1e1e1] font-sans antialiased pb-24 relative text-left">
      {/* Glow effects */}
      <div className="absolute top-0 right-10 w-80 h-80 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
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
            <span className="text-[9px] font-black text-purple-400 uppercase tracking-[0.3em] block mb-0.5">Gift Shop</span>
            <h1 className="text-lg font-black text-white tracking-tight">Virtual items</h1>
          </div>
        </div>
        <div className="bg-[#121824] border border-[#1f293d] px-4 py-2 rounded-2xl text-right flex items-center gap-3">
          <div>
            <span className="text-[8px] text-slate-500 font-bold uppercase block tracking-wider">Your Points</span>
            <span className="text-sm font-black text-yellow-400 font-mono">{activeUser.points || 0} pts</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-5xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
          {items.map((item, i) => (
            <div
              key={i}
              className="bg-[#121824] border border-[#1f293d] rounded-3xl p-5 flex flex-col items-center text-center shadow-lg relative overflow-hidden group hover:border-purple-500/20 transition-all hover:scale-[1.02]"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#090d16] border border-[#1f293d] flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">
                {item.type}
              </p>
              <h4 className="font-black text-white text-xs mb-4">
                {item.name}
              </h4>
              <button
                onClick={() => handleBuy(item)}
                disabled={isBuying !== null}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[10px] font-black py-3 rounded-xl transition-all active:scale-95 shadow-md shadow-purple-900/10 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isBuying === item.name ? (
                  <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>🪙 {item.price} pts</>
                )}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Shop;
