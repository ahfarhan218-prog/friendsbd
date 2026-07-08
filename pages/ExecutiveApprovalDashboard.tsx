import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../services/mongoService';
import { triggerToast } from '../components/NotificationToast';
import { getUserStatus } from '../utils/statusTiersUtil';

interface RewardRequest {
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
  status: 'Pending' | 'Approved' | 'Rejected';
  approved_by_id: string | null;
  approved_by_username: string | null;
  created_at: any;
  actioned_at: any;
}

const ExecutiveApprovalDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [requests, setRequests] = useState<RewardRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Load user session
  useEffect(() => {
    try {
      const sess = localStorage.getItem('user_session');
      if (sess) {
        setCurrentUser(JSON.parse(sess));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch pending requests and poll for updates
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch(`${API_BASE}/reward-approvals?status=Pending`);
        if (!res.ok) throw new Error('Failed to fetch');
        const list: RewardRequest[] = await res.json();
        list.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
        setRequests(list);
      } catch (err) {
        console.error('Failed to load approvals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
    const interval = setInterval(fetchRequests, 8000);
    return () => clearInterval(interval);
  }, []);

  // Verify authorization
  const isAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'senior_staff';

  const handleApprove = async (req: RewardRequest) => {
    setActioningId(req.id);
    try {
      const approvedById = JSON.parse(localStorage.getItem('user_session') || '{}').id || 'anonymous';

      // 1. Fetch current target user data
      const userRes = await fetch(`${API_BASE}/users/${req.target_user_id}`);
      const userData = userRes.ok ? await userRes.json() : {};
      const plusses = userData.plusses || 0;
      const rp = userData.reputation_points || 0;

      let newPlusses = plusses;
      let newRp = rp;

      if (req.transaction_type === 'ADD') {
        newPlusses = plusses + req.plusses_amount;
        newRp = rp + req.rp_amount;
      } else if (req.transaction_type === 'MINUS') {
        newPlusses = Math.max(0, plusses - req.plusses_amount);
        newRp = Math.max(0, rp - req.rp_amount);
      }

      const resolvedStatus = getUserStatus(newPlusses).title;

      // 2. Update target user balances
      await fetch(`${API_BASE}/users/${req.target_user_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plusses: newPlusses, reputation_points: newRp, status: resolvedStatus })
      });

      // 3. Mark approval as approved
      await fetch(`${API_BASE}/reward-approvals/${req.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Approved',
          approved_by_id: approvedById,
          approved_by_username: currentUser?.username || currentUser?.name || 'admin',
          actioned_at: Date.now()
        })
      });

      // Remove from local list
      setRequests(prev => prev.filter(r => r.id !== req.id));

      triggerToast({
        id: 'approve-ok-' + Date.now(),
        senderId: 'system',
        senderName: 'System',
        senderAvatar: 'https://i.pravatar.cc/100?img=12',
        type: 'SYSTEM',
        message: `Approved successfully! Balances updated atomically.`,
        timestamp: Date.now(),
        isRead: false
      } as any);

    } catch (err: any) {
      console.error('Transaction failed:', err);
      triggerToast({
        id: 'approve-fail-' + Date.now(),
        senderId: 'system',
        senderName: 'System',
        senderAvatar: 'https://i.pravatar.cc/100?img=12',
        type: 'SYSTEM',
        message: 'Transaction failed (check firestore console).',
        timestamp: Date.now(),
        isRead: false
      } as any);
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (req: RewardRequest) => {
    setActioningId(req.id);
    try {
      const approvedById = JSON.parse(localStorage.getItem('user_session') || '{}').id || 'anonymous';

      await fetch(`${API_BASE}/reward-approvals/${req.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Rejected',
          approved_by_id: approvedById,
          approved_by_username: currentUser?.username || currentUser?.name || 'admin',
          actioned_at: Date.now()
        })
      });

      // Remove from local list
      setRequests(prev => prev.filter(r => r.id !== req.id));

      triggerToast({
        id: 'reject-ok-' + Date.now(),
        senderId: 'system',
        senderName: 'System',
        senderAvatar: 'https://i.pravatar.cc/100?img=12',
        type: 'SYSTEM',
        message: `Request for @${req.target_username} rejected.`,
        timestamp: Date.now(),
        isRead: false
      } as any);

    } catch (err: any) {
      console.error('Rejection failed:', err);
    } finally {
      setActioningId(null);
    }
  };

  if (!isAuthorized && !loading) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 text-center">
        <span className="text-4xl">🛡️</span>
        <h2 className="text-lg font-black text-rose-400 mt-2">Access Restrained</h2>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          Only admins or senior staff members are authorized to access this ledger approval panel.
        </p>
        <button
          onClick={() => navigate('/home')}
          className="mt-6 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-2xl transition-all"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-[#e1e1e1] font-sans antialiased pb-24 relative">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-full max-w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-[300px] h-[300px] bg-purple-600/5 rounded-full blur-[95px] pointer-events-none" />

      {/* Header Panel */}
      <header className="p-6 border-b border-[#1f293d]/50 bg-slate-950/20 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-3 text-slate-400 hover:text-white bg-[#121824] hover:bg-slate-800 border border-[#1f293d] rounded-2xl transition-all"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Executive Approval Dashboard</h1>
              <p className="text-xs text-slate-400 mt-1">Review pending point modifications and execute atomic approvals.</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Review Section */}
      <main className="p-6 max-w-5xl mx-auto mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-bold">Streaming Pending approvals...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-20 bg-[#121824]/40 border border-[#1f293d]/50 rounded-[2.5rem] text-center space-y-2 max-w-md mx-auto">
            <span className="text-3xl block">📋</span>
            <h3 className="text-sm font-black text-white">All Caught Up!</h3>
            <p className="text-xs text-slate-400">There are no pending point modification requests to action.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <div
                key={req.id}
                className="bg-[#121824] border border-[#1f293d] p-5 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden transition-all duration-300 hover:border-slate-800"
              >
                {/* Loader overlay for single actioning document */}
                {actioningId === req.id && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1.5px] z-10 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                )}

                {/* Left block - type signature & core metrics */}
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-2.5">
                    {req.transaction_type === 'ADD' ? (
                      <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20 rounded-md">
                        + ADD REQUEST
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md">
                        - DEDUCTION REQUEST
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-500">ID: {req.id.substring(0, 8).toUpperCase()}</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-white">
                      Target User: <span className="text-indigo-400">@{req.target_username}</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl">
                      Audit Reason: <span className="italic">"{req.reason}"</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                    <span>Initiated by: @{req.requested_by_username}</span>
                    <span className="text-slate-600">•</span>
                    <span>🎯 Quiz: <a href={req.quiz_link} className="text-indigo-400 hover:underline">{req.quiz_title}</a></span>
                  </div>
                </div>

                {/* Right block - adjustment values & action buttons */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 min-w-[200px] border-t md:border-t-0 border-[#1f293d]/50 pt-4 md:pt-0">
                  <div className="text-left md:text-right space-y-1">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase block tracking-wider">Requested Delta</span>
                    <h4 className={`text-sm font-black font-mono ${
                      req.transaction_type === 'ADD' ? 'text-green-400' : 'text-rose-400'
                    }`}>
                      {req.transaction_type === 'ADD' ? '+' : '-'}{req.plusses_amount} Plusses / {req.transaction_type === 'ADD' ? '+' : '-'}{req.rp_amount} RP
                    </h4>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReject(req)}
                      className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl text-xs font-bold transition-all"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(req)}
                      className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-green-500/10 transition-all"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ExecutiveApprovalDashboard;

