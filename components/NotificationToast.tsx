
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SiteNotification } from '../types';

export const triggerToast = (notif: SiteNotification) => {
  const event = new CustomEvent('friends-bd-toast', { detail: notif });
  window.dispatchEvent(event);
};

const NotificationToast: React.FC = () => {
  const [activeToast, setActiveToast] = useState<SiteNotification | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleToast = (e: any) => {
      setActiveToast(e.detail);
      // Auto-clear toast after 5 seconds
      setTimeout(() => setActiveToast(null), 5000);
    };

    window.addEventListener('friends-bd-toast', handleToast);
    return () => window.removeEventListener('friends-bd-toast', handleToast);
  }, []);

  if (!activeToast) return null;

  return (
    <div className="fixed top-6 left-0 right-0 z-[2000] flex justify-center px-4 pointer-events-none">
      <AnimatePresence>
        {activeToast && (
          <motion.div
            key={activeToast.id}
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            onClick={() => {
              if (activeToast.shoutId) {
                navigate(`/shouts?id=${activeToast.shoutId}`);
                setActiveToast(null);
              }
            }}
            className="pointer-events-auto cursor-pointer max-w-md w-full bg-white/90 backdrop-blur-xl border border-purple-100 rounded-[2rem] p-4 shadow-[0_20px_40px_rgba(127,0,255,0.15)] flex items-center gap-4 relative overflow-hidden group"
          >
            {/* Progress Bar Timer */}
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5, ease: 'linear' }}
              className="absolute bottom-0 left-0 h-1 bg-[#7F00FF]/30"
            />

            <div className="relative shrink-0">
              {activeToast.type === 'SYSTEM' ? (
                <div className="w-12 h-12 rounded-2xl shadow-sm border-2 border-white bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-xl">
                  {activeToast.message.includes('🏆') ? '🏆' : activeToast.message.includes('💎') ? '💎' : activeToast.message.includes('🥇') ? '🥇' : '✨'}
                </div>
              ) : (
                <img 
                  src={activeToast.senderAvatar} 
                  className="w-12 h-12 rounded-2xl shadow-sm border-2 border-white" 
                  alt="" 
                />
              )}
              <span className="absolute -bottom-1 -right-1 bg-[#7F00FF] text-white text-[10px] w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                {activeToast.type === 'REACTION' ? '🔥' : activeToast.type === 'SYSTEM' ? '🎯' : '🔔'}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-slate-700 leading-tight">
                <span className="font-black text-slate-900">{activeToast.senderName}</span> {activeToast.message.replace(/🏆|💎|🥇|✨/g, '')}
              </p>
              {activeToast.shoutId && <p className="text-[8px] font-black text-[#7F00FF] uppercase tracking-[0.2em] mt-1">Tap to View</p>}
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); setActiveToast(null); }}
              className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationToast;

