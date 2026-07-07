import React, { useState, useEffect } from 'react';
import { API_BASE } from '../services/mongoService';

interface RewardHistoryItem {
  id: string;
  target_user_id: string;
  target_username: string;
  requested_by_id: string;
  requested_by_username: string;
  transaction_type: 'ADD' | 'MINUS';
  plusses_amount: number;
  rp_amount: number;
  reason: string;
  quiz_id: string;
  quiz_title: string;
  quiz_link: string;
  status: 'Approved';
  approved_by_id: string;
  approved_by_username: string;
  created_at: any;
  actioned_at: any;
}

interface PublicRewardHistoryTabProps {
  profileUserId: string;
}

// Custom detailed time conversion calculation function
function formatTimeAgoDetailed(timestamp: any): string {
  if (!timestamp) return 'Unknown time';
  const millis = timestamp.seconds ? timestamp.seconds * 1000 : Number(timestamp);
  const diffMs = Date.now() - millis;
  
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return 'Just now';

  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins} minutes ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    const remMins = diffMins % 60;
    return `${diffHours} hours ${remMins} minutes ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  const remHours = diffHours % 24;
  return `${diffDays} days ${remHours} hours ago`;
}

const PublicRewardHistoryTab: React.FC<PublicRewardHistoryTabProps> = ({ profileUserId }) => {
  const [history, setHistory] = useState<RewardHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileUserId) return;
    setLoading(true);

    const fetchHistory = async () => {
            try {
                const res = await fetch(`${API_BASE}/extras/reward-approvals?status=approved&is_public=true`);
                const data = await res.json();
                setHistory(data);
                setLoading(false);
            } catch (err) {
                setLoading(false);
            }
        };
        fetchHistory();
  }, [profileUserId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-2">
        <div className="w-5 h-5 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Loading history ledger...</span>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="py-12 bg-slate-900/10 border border-[#1f293d]/50 rounded-[2rem] text-center space-y-2 max-w-sm mx-auto">
        <span className="text-2xl block">🏅</span>
        <h4 className="text-xs font-black text-white">No Point Modifications</h4>
        <p className="text-[10px] text-slate-400">This member has no recorded point award/deduction history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map(item => (
        <div
          key={item.id}
          className="bg-[#121824] border border-[#1f293d] p-5 rounded-[2rem] text-left relative overflow-hidden transition-all duration-300 hover:border-slate-800"
        >
          {/* Header row - delta + timing */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1f293d]/50">
            <div>
              {item.transaction_type === 'ADD' ? (
                <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-xl text-xs font-black font-mono">
                  +{item.plusses_amount} Plusses / +{item.rp_amount} RP
                </span>
              ) : (
                <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-xl text-xs font-black font-mono">
                  -{item.plusses_amount} Plusses / -{item.rp_amount} RP
                </span>
              )}
            </div>

            <span className="text-[10px] font-semibold text-slate-500 font-mono">
              🕒 {formatTimeAgoDetailed(item.actioned_at || item.created_at)}
            </span>
          </div>

          {/* Body block - reason */}
          <div className="py-3">
            <span className="text-[9px] font-extrabold text-slate-500 uppercase block tracking-widest mb-1.5">Audit Justification</span>
            <blockquote className="text-xs text-slate-300 bg-[#090d16]/40 border-l-2 border-indigo-500/60 pl-3 py-1.5 rounded-r-xl italic leading-relaxed">
              "{item.reason}"
            </blockquote>
          </div>

          {/* Footer - quiz link and auditor details */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-[#1f293d]/30 text-[10px]">
            <a
              href={item.quiz_link}
              className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5 hover:underline"
            >
              <span>🎯</span> Target Quiz: {item.quiz_title}
            </a>

            <div className="text-slate-500 font-semibold flex items-center gap-2">
              <span>Audited by: @{item.approved_by_username || 'admin'}</span>
              <span>•</span>
              <span>Requested by: @{item.requested_by_username}</span>
            </div>
          </div>

        </div>
      ))}
    </div>
  );
};

export default PublicRewardHistoryTab;
