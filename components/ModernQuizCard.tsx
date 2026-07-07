import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Quiz } from './QuizUpsertModal';

interface ModernQuizCardProps {
  quiz: Quiz;
  isStaff: boolean;
  isCompleted: boolean;
  onPlay: (quiz: Quiz) => void;
  onEdit: (quiz: Quiz) => void;
  onTogglePin: (quiz: Quiz) => Promise<void>;
  onToggleStatus: (quiz: Quiz) => Promise<void>;
  onDelete: (quiz: Quiz) => Promise<void>;
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const ModernQuizCard: React.FC<ModernQuizCardProps> = ({
  quiz,
  isStaff,
  isCompleted,
  onPlay,
  onEdit,
  onTogglePin,
  onToggleStatus,
  onDelete
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAction = async (actionFn: () => Promise<void>) => {
    setIsUpdating(true);
    setShowMenu(false);
    try {
      await actionFn();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className={`relative bg-[#121824] border rounded-3xl p-5 flex flex-col justify-between min-h-[260px] overflow-hidden transition-all duration-300 ${
        quiz.isPinned
          ? 'border-amber-500/40 shadow-[0_4px_20px_rgba(245,158,11,0.08)] bg-gradient-to-b from-[#161c2b] to-[#121824]'
          : 'border-[#1f293d] hover:border-[#2a374e] hover:shadow-[0_4px_20px_rgba(0,0,0,0.25)]'
      }`}
    >
      {/* Glow highlight for Pinned or Live */}
      {quiz.isPinned && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
      )}
      {quiz.type === 'live' && !quiz.isClosed && (
        <div className="absolute top-0 left-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
      )}

      {/* Card Loading Overlay */}
      {isUpdating && (
        <div className="absolute inset-0 bg-[#090d16]/70 backdrop-blur-[2px] z-10 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      )}

      {/* ── CARD HEADER ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black font-mono px-2 py-0.5 bg-[#090d16] text-[#6366f1] border border-[#1f293d] rounded-lg">
              ID: {quiz.id?.substring(0, 5).toUpperCase() || 'NEW'}
            </span>
            {quiz.type === 'live' ? (
              <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Live Deck
              </span>
            ) : (
              <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md">
                Standard
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {quiz.isPinned && (
              <span className="text-amber-400 text-sm" title="Pinned to top">
                📌
              </span>
            )}

            {/* Staff Menu Trigger */}
            {isStaff && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 text-slate-400 hover:text-white bg-slate-850 hover:bg-slate-800 rounded-lg border border-[#1f293d] transition-all"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>

                {/* Dropdown Options */}
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 mt-1.5 w-36 bg-[#161f30] border border-[#2a374e] rounded-2xl shadow-xl py-2 z-30 text-xs flex flex-col">
                      <button
                        type="button"
                        onClick={() => handleAction(() => onTogglePin(quiz))}
                        className="px-3.5 py-2 text-left text-slate-300 hover:text-white hover:bg-[#1e293b] font-bold transition-all flex items-center gap-1.5"
                      >
                        📍 {quiz.isPinned ? 'Unpin Quiz' : 'Pin Quiz'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(() => onToggleStatus(quiz))}
                        className="px-3.5 py-2 text-left text-slate-300 hover:text-white hover:bg-[#1e293b] font-bold transition-all flex items-center gap-1.5"
                      >
                        {quiz.isClosed ? '🟢 Activate' : '🔴 Close Quiz'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowMenu(false); onEdit(quiz); }}
                        className="px-3.5 py-2 text-left text-slate-300 hover:text-white hover:bg-[#1e293b] font-bold transition-all flex items-center gap-1.5"
                      >
                        ✏️ Edit Config
                      </button>
                      <hr className="border-[#1f293d] my-1" />
                      <button
                        type="button"
                        onClick={() => handleAction(() => onDelete(quiz))}
                        className="px-3.5 py-2 text-left text-rose-400 hover:text-rose-300 hover:bg-[#1e293b] font-bold transition-all flex items-center gap-1.5"
                      >
                        🗑️ Delete Quiz
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h4 className="text-sm font-black text-white leading-tight tracking-tight hover:text-indigo-400 transition-colors">
          {quiz.title}
        </h4>

        {/* Description */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {quiz.description || 'Test your knowledge and claim free AP points.'}
        </p>
      </div>

      {/* ── CARD FOOTER ── */}
      <div className="mt-5 space-y-4 pt-3 border-t border-[#1f293d]/50">
        <div className="flex items-center justify-between text-[10px]">
          {/* Creator Profile */}
          <div className="flex items-center gap-1.5">
            <img
              src={quiz.creatorAvatar}
              alt={quiz.creatorName}
              className="w-5 h-5 rounded-lg border border-[#1f293d] object-cover"
              onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${quiz.creatorName}/100`; }}
            />
            <span className="font-bold text-slate-400">@{quiz.creatorName}</span>
          </div>

          <span className="font-semibold text-slate-500 font-mono">
            🕒 {timeAgo(quiz.timestamp)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          {/* Status Badges */}
          <div className="flex items-center gap-1.5">
            {quiz.isClosed ? (
              <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg">
                Closed
              </span>
            ) : (
              <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg">
                Open
              </span>
            )}

            {isCompleted && (
              <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg flex items-center gap-0.5">
                ✓ Passed
              </span>
            )}
          </div>

          {/* Action CTA Button */}
          {quiz.isClosed ? (
            <button
              disabled
              className="px-4 py-2 bg-slate-800 text-slate-500 text-xs font-black rounded-xl border border-[#1f293d] cursor-not-allowed transition-all"
            >
              Locked
            </button>
          ) : (
            <button
              onClick={() => onPlay(quiz)}
              className={`px-4 py-2 text-xs font-black rounded-xl border transition-all ${
                isCompleted
                  ? 'bg-slate-800/40 text-slate-400 hover:text-white border-[#1f293d] hover:bg-indigo-600 hover:border-indigo-500'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent shadow-md hover:shadow-indigo-600/15'
              }`}
            >
              {isCompleted ? 'Retry Quiz' : `Play Quiz (+${quiz.rewardAp || 50} AP)`}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ModernQuizCard;
