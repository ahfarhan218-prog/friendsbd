
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mongoService } from '../services/mongoService';
import { triggerToast } from '../components/NotificationToast';
import { motion, AnimatePresence } from 'framer-motion';
import { apTransactionService } from '../services/apTransactionService';

type Plan = {
  id: string;
  label: string;
  price: number;
  days: number;
  emoji: string;
  badge: string | null;
  color: string;
  highlight: boolean;
  features: string[];
};

const PLANS: Plan[] = [
  {
    id: 'week',
    label: '7 Days',
    price: 10,
    days: 7,
    emoji: '⚡',
    badge: null,
    color: 'from-indigo-500 to-purple-600',
    highlight: false,
    features: [
      'Golden Coin next-drop radar',
      'Coin timer countdown',
      'Premium badge on profile',
      'Priority in leaderboard',
    ],
  },
  {
    id: 'month',
    label: '30 Days',
    price: 30,
    days: 30,
    emoji: '👑',
    badge: 'BEST VALUE',
    color: 'from-amber-400 to-orange-500',
    highlight: true,
    features: [
      'Golden Coin next-drop radar',
      'Coin timer countdown',
      'Premium badge on profile',
      'Priority in leaderboard',
      'Double AP on coin grabs',
      'Exclusive premium avatar frame',
    ],
  },
];

const Premium: React.FC = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('month');
  const [user, setUser] = useState<any>(null);
  const [premiumExpiry, setPremiumExpiry] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('user_session');
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      if (u.premiumExpiry) {
        setPremiumExpiry(u.premiumExpiry);
      }
    }
  }, []);

  const isActivePremium = premiumExpiry ? premiumExpiry > Date.now() : false;

  const formatExpiry = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const getDaysLeft = (ts: number) => {
    const diff = ts - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  };

  const handleUpgrade = async (plan: Plan) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setIsProcessing(plan.id);

    try {
      // Simulate payment delay
      await new Promise(resolve => setTimeout(resolve, 1800));

      const now = Date.now();
      const durationMs = plan.days * 24 * 60 * 60 * 1000;
      // If already premium, extend from current expiry; otherwise from now
      const currentExpiry = (premiumExpiry && premiumExpiry > now) ? premiumExpiry : now;
      const newExpiry = currentExpiry + durationMs;

      // Update Firestore
      await mongoService.updateUser(user.id, {
        isPremium: true,
        premiumExpiry: newExpiry,
        premiumPlan: plan.id,
      });

      // Award AP for Premium Upgrade
      const { newBalance } = await apTransactionService.adjustUserAP(user.id, 'PREMIUM_UPGRADE');

      // Update local storage session
      user.isPremium = true;
      user.premiumExpiry = newExpiry;
      user.premiumPlan = plan.id;
      user.balance_ap = newBalance;
      localStorage.setItem('user_session', JSON.stringify(user));
      window.dispatchEvent(new Event('storage'));

      setPremiumExpiry(newExpiry);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);

      triggerToast({
        id: 'premium-success-' + Date.now(),
        senderId: 'system',
        senderName: 'System',
        senderAvatar: 'https://picsum.photos/seed/sys/100',
        type: 'SYSTEM',
        message: `👑 Premium activated! You now have access to the Golden Coin radar for ${plan.days} days.`,
        timestamp: Date.now(),
        isRead: false,
      });
    } catch (e) {
      console.error(e);
      triggerToast({
        id: 'premium-fail-' + Date.now(),
        senderId: 'system',
        senderName: 'System',
        senderAvatar: 'https://picsum.photos/seed/sys/100',
        type: 'SYSTEM',
        message: 'Upgrade failed. Please try again.',
        timestamp: Date.now(),
        isRead: false,
      });
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-32">
      {/* Header */}
      <header className="relative overflow-hidden px-6 pt-8 pb-16">
        {/* Background glow orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute top-10 right-0 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white/70 hover:text-white transition-colors mb-8"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/>
            </svg>
          </button>

          <div className="text-center">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-6xl mb-4"
            >👑</motion.div>
            <h1 className="text-3xl font-black text-white tracking-tight">FriendsBD Premium</h1>
            <p className="text-sm text-white/50 mt-2 font-medium">Unlock exclusive Golden Coin radar & more</p>
          </div>
        </div>
      </header>

      <div className="px-5 -mt-8 space-y-6 relative z-10">

        {/* Active Premium Status */}
        <AnimatePresence>
          {isActivePremium && premiumExpiry && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-amber-400/20 to-orange-400/10 border border-amber-400/30 rounded-3xl p-5 flex items-center gap-4"
            >
              <div className="text-3xl">✅</div>
              <div className="flex-1">
                <p className="text-sm font-black text-amber-300">Premium Active</p>
                <p className="text-xs text-white/50 mt-0.5">
                  Expires {formatExpiry(premiumExpiry)} &nbsp;·&nbsp; {getDaysLeft(premiumExpiry)} days left
                </p>
              </div>
              <button
                onClick={() => navigate('/coin-game')}
                className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-2 rounded-xl hover:bg-amber-400/20 transition-colors"
              >
                Open Radar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Animation */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-r from-green-500/20 to-emerald-500/10 border border-green-500/30 rounded-3xl p-6 text-center"
            >
              <div className="text-4xl mb-2">🎉</div>
              <p className="text-sm font-black text-green-400">Premium Activated!</p>
              <p className="text-xs text-white/50 mt-1">Golden Coin radar is now unlocked</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Plan Selector */}
        <div className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-white/30 text-center">Choose Your Plan</h2>

          {PLANS.map((plan) => (
            <motion.div
              key={plan.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative rounded-3xl p-1 cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? `bg-gradient-to-br ${plan.color} shadow-2xl`
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                  {plan.badge}
                </div>
              )}

              <div className={`rounded-[1.4rem] p-5 ${selectedPlan === plan.id ? 'bg-black/30' : 'bg-transparent'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Radio dot */}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedPlan === plan.id ? 'border-white bg-white' : 'border-white/20'
                    }`}>
                      {selectedPlan === plan.id && (
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{plan.emoji} {plan.label}</p>
                      <p className="text-[9px] text-white/40 uppercase font-bold">Premium Access</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-white">৳{plan.price}</p>
                    <p className="text-[9px] text-white/40 font-bold uppercase">for {plan.days} days</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-green-400">✓</span>
                      <span className="text-[11px] text-white/60 font-medium">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        {(() => {
          const plan = PLANS.find(p => p.id === selectedPlan)!;
          return (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => handleUpgrade(plan)}
              disabled={isProcessing !== null}
              className={`w-full py-5 rounded-[2rem] font-black text-lg text-white shadow-2xl transition-all relative overflow-hidden ${
                isProcessing
                  ? 'bg-white/10 cursor-not-allowed'
                  : `bg-gradient-to-r ${plan.color} shadow-purple-500/30 hover:brightness-110`
              }`}
            >
              {isProcessing === plan.id ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-block"
                  >⚙️</motion.span>
                  Processing...
                </span>
              ) : (
                `Activate ${plan.label} — ৳${plan.price}`
              )}
              {!isProcessing && (
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-y-0 w-20 bg-white/20 skew-x-12"
                />
              )}
            </motion.button>
          );
        })()}

        <p className="text-[10px] text-white/20 text-center font-medium">
          Payment is simulated. Plans auto-renew via bKash / Nagad. Cancel anytime.
        </p>

        {/* Feature Highlights */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-5">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 text-center">Why Premium?</h3>
          {[
            { icon: '🎯', title: 'Golden Coin Radar', desc: 'See exactly when the next Golden Coin will drop — 13 to 18 minute countdown timer.' },
            { icon: '🪙', title: '5 Grabs Per Day', desc: 'Maximize all 5 daily grabs with the radar. Normal users miss coins — you won\'t.' },
            { icon: '⚡', title: 'Instant Notifications', desc: 'Get real-time push alerts the moment a coin appears so you\'re always first.' },
            { icon: '👑', title: 'Premium Badge', desc: 'Stand out with an exclusive crown badge displayed on your profile.' },
          ].map((item, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shrink-0">
                {item.icon}
              </div>
              <div>
                <h4 className="text-sm font-black text-white">{item.title}</h4>
                <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white/20 text-center">FAQ</h3>
          {[
            { q: 'When does my premium start?', a: 'Immediately after purchase. If you already have premium, your plan extends from your current expiry date.' },
            { q: 'What happens when it expires?', a: 'The radar timer gets hidden and you return to the free experience. Your coins and AP remain.' },
            { q: 'Can I grab coins without premium?', a: 'Yes! The 5-grabs-per-day limit applies to all users. Premium just gives you the radar to not miss any drop.' },
          ].map((item, i) => (
            <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-4">
              <p className="text-xs font-black text-white/60">{item.q}</p>
              <p className="text-[11px] text-white/30 mt-1 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Premium;
