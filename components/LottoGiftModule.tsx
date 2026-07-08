import React, { useState, useEffect } from 'react';
import { API_BASE } from '../services/mongoService';
import { triggerToast } from './NotificationToast';
import { User } from '../types';
import { apTransactionService } from '../services/apTransactionService';

interface LottoGiftModuleProps {
  currentUser: User;
  onCoinsUpdated: (newCoins: number) => void;
  onClose?: () => void;
}

interface GiftLog {
  id: string;
  sender_uid: string;
  sender_username: string;
  receiver_uid: string;
  receiver_username: string;
  coins_spent: number;
  timestamp: any;
}

const LottoGiftModule: React.FC<LottoGiftModuleProps> = ({ currentUser, onCoinsUpdated, onClose }) => {
  const [targetUsername, setTargetUsername] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationMsg, setValidationMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [giftLoading, setGiftLoading] = useState(false);
  const [giftHistory, setGiftHistory] = useState<GiftLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    fetchGiftHistory();
  }, [currentUser.id]);

  const fetchGiftHistory = async () => {
    setHistoryLoading(true);
    try {
      const resSent = await fetch(`${API_BASE}/extras/gift-history?sender_uid=${currentUser.id}&limit=10`);
      const sentData = await resSent.json();
      
      const resRecv = await fetch(`${API_BASE}/extras/gift-history?receiver_uid=${currentUser.id}&limit=10`);
      const recvData = await resRecv.json();

      const logs: GiftLog[] = [...sentData, ...recvData];

      // Sort by timestamp descending
      logs.sort((a, b) => {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return timeB - timeA;
      });

      setGiftHistory(logs);
    } catch (e) {
      console.warn('Failed to load gift history:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleValidateUsername = async () => {
    const username = targetUsername.trim().toLowerCase();
    if (!username) return;

    if (username === currentUser.username?.toLowerCase()) {
      setValidationMsg({ text: 'You cannot gift a subscription to yourself!', isError: true });
      return;
    }

    setIsValidating(true);
    setValidationMsg(null);

    try {
      const res = await fetch(`${API_BASE}/users?username=${targetUsername.trim()}`);
      const users = await res.json();

      if (!users || users.length === 0) {
        setValidationMsg({ text: `Username "${targetUsername}" not found.`, isError: true });
      } else {
        const friend = users[0];
        setValidationMsg({ text: `User found: ${friend.name || friend.username} ✅`, isError: false });
      }
    } catch (e) {
      setValidationMsg({ text: 'Validation failed. Direct offline mode active.', isError: false });
    } finally {
      setIsValidating(false);
    }
  };

  const handleGiftLotto = async () => {
    const username = targetUsername.trim();
    if (!username) return;

    if (currentUser.goldenCoins < 15) {
      alert('Insufficient Golden Coins! Gifting requires 15 Golden Coins.');
      return;
    }

    setGiftLoading(true);
    try {
      const res = await fetch(`${API_BASE}/extras/gift-lotto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: currentUser.id, receiverUsername: username, giftAmount: 15 })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send gift.');
      }
      const data = await res.json();
      const newCoinsBalance = data.newCoins || currentUser.goldenCoins - 15;

      // Update Local State and trigger UI update
      onCoinsUpdated(newCoinsBalance);
      const updatedUser = { ...currentUser, goldenCoins: newCoinsBalance };
      localStorage.setItem('user_session', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('storage'));

      apTransactionService.adjustUserAP(currentUser.id, 'SENDING_GIFT')
        .catch(e => console.warn('Failed to add AP for gifting:', e));

      triggerToast({
        id: 'gift-' + Date.now(),
        senderId: 'system',
        senderName: 'Lotto Gift',
        senderAvatar: 'https://i.pravatar.cc/100?img=12',
        type: 'SYSTEM',
        message: `Successfully gifted 7 days lotto subscription to @${username}! 🎁`,
        timestamp: Date.now(),
        isRead: false
      } as any);

      setTargetUsername('');
      setValidationMsg(null);
      fetchGiftHistory();
    } catch (e: any) {
      alert(`Gift Failed: ${e.message}`);
    } finally {
      setGiftLoading(false);
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return '';
    let time = 0;
    if (typeof ts === 'number') {
      time = ts;
    } else if (ts.seconds) {
      time = ts.seconds * 1000;
    } else if (typeof ts.toMillis === 'function') {
      time = ts.toMillis();
    } else {
      time = new Date(ts).getTime();
    }
    return new Date(time).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Gift Input Card */}
      <div className="bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm">
        <h4 className="text-sm font-black text-black uppercase tracking-wider mb-2">🎁 Gift Lotto to Friend</h4>
        <p className="text-xs text-slate-500 font-medium mb-4">
          Deduct 15 Golden Coins from your balance to activate 7 days of 3x AP lotto boost for a friend.
        </p>

        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={targetUsername}
            onChange={(e) => setTargetUsername(e.target.value)}
            placeholder="Type friend's username..."
            className="flex-1 bg-[#f8fafc] border border-[#cbd5e1] focus:border-[#6d28d9] focus:bg-white rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
            disabled={giftLoading}
          />
          <button
            onClick={handleValidateUsername}
            disabled={isValidating || giftLoading || !targetUsername.trim()}
            className="px-4 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors uppercase tracking-wider active:scale-95 disabled:opacity-30"
          >
            {isValidating ? 'Checking...' : 'Verify'}
          </button>
        </div>

        {validationMsg && (
          <p className={`text-xs font-bold mt-2 ${validationMsg.isError ? 'text-[#dc2626]' : 'text-[#0f766e]'}`}>
            {validationMsg.text}
          </p>
        )}

        <button
          onClick={handleGiftLotto}
          disabled={giftLoading || !targetUsername.trim() || !!(validationMsg && validationMsg.isError)}
          className="w-full mt-4 bg-[#6d28d9] hover:bg-[#6d28d9]/90 active:scale-95 text-white font-bold py-3 px-6 rounded-xl shadow-sm transition-all uppercase tracking-wider text-xs disabled:opacity-30"
        >
          {giftLoading ? 'SENDING GIFT...' : 'SEND 7-DAY SUBSCRIPTION GIFT'}
        </button>
      </div>

      {/* Gift History Card */}
      <div className="bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm">
        <h4 className="text-sm font-black text-black uppercase tracking-wider mb-4">📜 Gift Transaction History</h4>
        
        {historyLoading ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : giftHistory.length === 0 ? (
          <p className="text-xs text-slate-500 font-bold text-center py-4">No gifting history logged yet.</p>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar pr-1">
            {giftHistory.map((log) => {
              const isOutgoing = log.sender_uid === currentUser.id;
              return (
                <div key={log.id} className="flex items-center justify-between p-3 bg-[#f8fafc] border border-slate-100 rounded-xl text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-black">
                      {isOutgoing ? (
                        <span>Gifted to <strong className="text-[#6d28d9]">@{log.receiver_username}</strong></span>
                      ) : (
                        <span>Received from <strong className="text-[#0f766e]">@{log.sender_username}</strong></span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold">{formatDate(log.timestamp)}</p>
                  </div>
                  <span className={`font-black uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full ${isOutgoing ? 'text-purple-700 bg-purple-100' : 'text-teal-700 bg-teal-100'}`}>
                    {isOutgoing ? 'Sent' : 'Received'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LottoGiftModule;

