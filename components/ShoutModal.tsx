import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoutEntry, User } from '../types';
import ShoutCard from './ShoutCard';
import { mongoService, API_BASE } from '../services/mongoService';

interface ShoutModalProps {
  shoutId: string | null;
  onClose: () => void;
  currentUser: User;
}

const ShoutModal: React.FC<ShoutModalProps> = ({ shoutId, onClose, currentUser }) => {
  const [shout, setShout] = useState<ShoutEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shoutId) return;
    setLoading(true);
    const unsub = mongoService.listenShouts((shouts) => {
      const found = shouts.find(s => s.id === shoutId);
      if (found) setShout(found);
      setLoading(false);
    });
    return () => unsub();
  }, [shoutId]);

  if (!shoutId) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-[#090d16] rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Avatar Post</h3>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-white/50 text-xs font-bold">
                Loading...
              </div>
            ) : shout ? (
              <ShoutCard 
                shout={shout}
                activeUser={currentUser}
                onReact={async (id, type) => {
                  const existingReacts = shout.userReactions || {};
                  const currentReaction = existingReacts[currentUser.id];
                  let newReacts = { ...existingReacts };
                  if (currentReaction === type) {
                    delete newReacts[currentUser.id];
                  } else {
                    newReacts[currentUser.id] = type;
                  }
                  await fetch(`${API_BASE}/shouts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userReactions: newReacts }) });
                }}
                onReply={() => {
                  // Re-use ShoutCard's internal reply state if possible, or we may need to handle it.
                  // For now, ShoutCard handles its own reply text input UI? 
                  // Let's check how ShoutCard handles replies. It triggers onReply(shout)
                }}
                onEdit={() => {}}
                onDelete={() => {}}
                onPin={() => {}}
                onClose={() => {}}
              />
            ) : (
              <div className="flex items-center justify-center py-20 text-white/50 text-xs font-bold">
                Post not found.
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShoutModal;

