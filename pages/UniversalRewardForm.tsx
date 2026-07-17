import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE } from '../services/mongoService';
import { triggerToast } from '../components/NotificationToast';

const UniversalRewardForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Target User info from query parameters
  const targetIdParam = searchParams.get('userId') || '';
  const targetNameParam = searchParams.get('username') || '';

  // Form Fields
  const [targetUserId, setTargetUserId] = useState(targetIdParam);
  const [targetUsername, setTargetUsername] = useState(targetNameParam);
  const [transactionType, setTransactionType] = useState<'ADD' | 'MINUS'>('ADD');
  const [plussesAmount, setPlussesAmount] = useState(5);
  const [rpAmount, setRpAmount] = useState(2);
  const [reason, setReason] = useState('');
  const [quizId, setQuizId] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [quizLink, setQuizLink] = useState('');

  // UI Flow States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Load staff profile session
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

  // Quick pre-populate quiz fields when Quiz ID changes
  useEffect(() => {
    if (quizId.trim()) {
      setQuizLink(`/quiz`);
      // Optionally attempt to fetch quiz title
      const fetchQuizTitle = async () => {
        try {
          const quizzesStr = localStorage.getItem('friends_bd_quizzes');
          if (quizzesStr) {
            const quizzes = JSON.parse(quizzesStr);
            const q = quizzes.find((x: any) => x.id === quizId || x.topic_id === quizId);
            if (q) setQuizTitle(q.title || '');
          }
        } catch (err) {
          console.warn(err);
        }
      };
      fetchQuizTitle();
    } else {
      setQuizLink('');
      setQuizTitle('');
    }
  }, [quizId]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!targetUserId.trim()) {
      errors.targetUserId = 'Target User UID is required.';
    }
    if (!targetUsername.trim()) {
      errors.targetUsername = 'Target User Username is required.';
    }
    if (!reason.trim()) {
      errors.reason = 'A mandatory justification reason is required.';
    } else if (reason.trim().length < 8) {
      errors.reason = 'Reason must be at least 8 characters long.';
    }
    if (plussesAmount <= 0 && rpAmount <= 0) {
      errors.points = 'You must award/deduct at least 1 Plus or 1 RP.';
    }
    if (plussesAmount < 0 || rpAmount < 0) {
      errors.points = 'Point amounts must be positive integers.';
    }
    if (!quizId.trim()) {
      errors.quizId = 'Associated Quiz ID is required.';
    }
    if (!quizTitle.trim()) {
      errors.quizTitle = 'Associated Quiz Title is required.';
    }
    if (!quizLink.trim()) {
      errors.quizLink = 'Associated Quiz Link is required.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    if (!validateForm()) {
      triggerToast({
        id: 'validation-fail-' + Date.now(),
        senderId: 'system',
        senderName: 'Gatekeeper',
        senderAvatar: 'https://i.pravatar.cc/100?img=12',
        type: 'SYSTEM',
        message: 'Please complete all mandatory form fields.',
        timestamp: Date.now(),
        isRead: false
      } as any);
      return;
    }

    setIsSubmitting(true);

    try {
      const activeUid = currentUser?.id || 'anonymous';
      const activeUsername = currentUser?.username || currentUser?.name || 'staff';

      const res = await fetch(`${API_BASE}/reward-approvals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: activeUid,
          requesterName: activeUsername,
          targetUserId: targetUserId.trim(),
          targetUserName: targetUsername.trim(),
          transaction_type: transactionType,
          plusses_amount: Math.floor(plussesAmount),
          rp_amount: Math.floor(rpAmount),
          reason: reason.trim(),
          quiz_id: quizId.trim(),
          quiz_title: quizTitle.trim(),
          quiz_link: quizLink.trim()
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit approval request.');
      }

      triggerToast({
        id: 'approval-req-ok-' + Date.now(),
        senderId: 'system',
        senderName: 'System',
        senderAvatar: 'https://i.pravatar.cc/100?img=12',
        type: 'SYSTEM',
        message: 'Reward request submitted for approval.',
        timestamp: Date.now(),
        isRead: false
      } as any);

      // Reset Form fields
      setReason('');
      setQuizId('');
      setQuizTitle('');
      setQuizLink('');

      // Redirect back to profile page of the target user
      setTimeout(() => {
        navigate(`/profile/${targetUserId.trim()}`);
      }, 600);

    } catch (err: any) {
      console.error('Request submission failed:', err);
      triggerToast({
        id: 'approval-req-fail-' + Date.now(),
        senderId: 'system',
        senderName: 'System',
        senderAvatar: 'https://i.pravatar.cc/100?img=12',
        type: 'SYSTEM',
        message: 'Failed to submit approval request: ' + (err.message || 'Unknown error'),
        timestamp: Date.now(),
        isRead: false
      } as any);
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen bg-transparent text-[#e1e1e1] font-sans antialiased p-4 sm:p-6 flex flex-col justify-center items-center relative overflow-x-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-indigo-600/5 rounded-full blur-[85px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-purple-600/5 rounded-full blur-[85px] pointer-events-none" />

      {/* Form Card Container */}
      <div className="bg-[#121824] rounded-3xl border border-[#1f293d] p-4 sm:p-8 max-w-lg w-full shadow-2xl mx-auto my-10 relative overflow-hidden">
        
        {/* Glow indicator aligned with transaction type */}
        <div className={`absolute top-0 inset-x-0 h-1 transition-all duration-300 ${
          transactionType === 'ADD' ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]' : 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
        }`} />

        <div className="text-center mb-6">
          <h2 className="text-xl font-black text-white flex flex-wrap items-center justify-center gap-2">
            🏆 Point Allocation Form
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 uppercase tracking-widest mt-1">
            Request Plusses & RP changes for validation
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Target User Details (Disabled/ReadOnly) */}
          <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Member ID</label>
              <input
                type="text"
                readOnly
                value={targetUserId}
                onChange={e => setTargetUserId(e.target.value)}
                className="bg-[#090d16] border border-[#1f293d] text-slate-400 rounded-2xl p-3.5 w-full text-sm outline-none cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Username</label>
              <input
                type="text"
                readOnly
                value={targetUsername ? `@${targetUsername}` : ''}
                className="bg-[#090d16] border border-[#1f293d] text-slate-400 rounded-2xl p-3.5 w-full text-sm outline-none cursor-not-allowed"
              />
            </div>
          </div>

          {/* Operation Toggle Switch */}
          <div className="space-y-1">
            <label className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Operation Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 bg-[#090d16] border border-[#1f293d] p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setTransactionType('ADD')}
                className={`py-3.5 text-sm font-black uppercase rounded-xl transition-all ${
                  transactionType === 'ADD'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Award Points (+)
              </button>
              <button
                type="button"
                onClick={() => setTransactionType('MINUS')}
                className={`py-3.5 text-sm font-black uppercase rounded-xl transition-all ${
                  transactionType === 'MINUS'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Deduct Points (-)
              </button>
            </div>
          </div>

          {/* Point Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Plusses</label>
              <input
                type="number"
                min={0}
                max={50}
                required
                disabled={isSubmitting}
                value={plussesAmount}
                onChange={e => setPlussesAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="bg-[#090d16] border border-[#1f293d] text-white focus:outline-none focus:border-indigo-500 rounded-2xl p-3.5 w-full text-sm font-mono font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Reputation Points (RP)</label>
              <input
                type="number"
                min={0}
                max={20}
                required
                disabled={isSubmitting}
                value={rpAmount}
                onChange={e => setRpAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="bg-[#090d16] border border-[#1f293d] text-white focus:outline-none focus:border-indigo-500 rounded-2xl p-3.5 w-full text-sm font-mono font-bold"
              />
            </div>
            {validationErrors.points && (
              <span className="col-span-2 text-xs sm:text-sm font-bold text-rose-400 px-2 block animate-pulse">
                ⚠️ {validationErrors.points}
              </span>
            )}
          </div>

          {/* Associated Quiz Fields */}
          <div className="p-4 bg-[#090d16]/60 border border-[#1f293d] rounded-2xl space-y-3">
            <span className="text-sm font-black uppercase text-slate-400 tracking-widest block">Associated Quiz Attributions</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-500 uppercase">Quiz Topic ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1997"
                  disabled={isSubmitting}
                  value={quizId}
                  onChange={e => setQuizId(e.target.value)}
                  className="bg-[#090d16] border border-[#1f293d] text-white focus:outline-none focus:border-indigo-500 rounded-xl p-2.5 w-full text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-500 uppercase">Quiz Title</label>
                <input
                  type="text"
                  required
                  placeholder="Quiz Title..."
                  disabled={isSubmitting}
                  value={quizTitle}
                  onChange={e => setQuizTitle(e.target.value)}
                  className="bg-[#090d16] border border-[#1f293d] text-white focus:outline-none focus:border-indigo-500 rounded-xl p-2.5 w-full text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-500 uppercase">Quiz Link</label>
              <input
                type="text"
                required
                placeholder="e.g. /quiz"
                disabled={isSubmitting}
                value={quizLink}
                onChange={e => setQuizLink(e.target.value)}
                className="bg-[#090d16] border border-[#1f293d] text-white focus:outline-none focus:border-indigo-500 rounded-xl p-2.5 w-full text-sm font-mono"
              />
            </div>
            {validationErrors.quizId && (
              <span className="text-xs sm:text-sm font-bold text-rose-400 px-1 block animate-pulse">
                ⚠️ Missing quiz configuration credentials.
              </span>
            )}
          </div>

          {/* Mandatory Reason */}
          <div className="space-y-1">
            <label className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Mandatory Audit Justification</label>
            <textarea
              required
              disabled={isSubmitting}
              value={reason}
              onChange={e => {
                setReason(e.target.value);
                if (validationErrors.reason) {
                  setValidationErrors(prev => ({ ...prev, reason: '' }));
                }
              }}
              placeholder="State the detailed reason for this point audit ledger entry..."
              rows={3}
              className={`bg-[#090d16] border text-white focus:outline-none focus:border-indigo-500 rounded-2xl p-3.5 w-full text-sm resize-none transition-all ${
                validationErrors.reason ? 'border-rose-500/50 focus:border-rose-500' : 'border-[#1f293d]'
              }`}
            />
            {validationErrors.reason && (
              <span className="text-xs sm:text-sm font-bold text-rose-400 px-2 block animate-pulse">
                ⚠️ {validationErrors.reason}
              </span>
            )}
          </div>

          {/* Submission button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`py-4 px-3 sm:px-6 text-sm font-black uppercase tracking-widest rounded-2xl shadow-xl w-full transition-all duration-150 flex flex-wrap items-center justify-center gap-2 ${
                transactionType === 'ADD'
                  ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-600/10 hover:shadow-green-600/20'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/10 hover:shadow-rose-600/20'
              } ${isSubmitting ? 'opacity-85 cursor-not-allowed' : 'active:scale-[0.98]'}`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Submitting Ledger...
                </>
              ) : (
                'Request Point Audit Approval'
              )}
            </button>
          </div>

        </form>

        {/* Back Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate(`/profile/${targetUserId}`)}
            disabled={isSubmitting}
            className="text-sm font-bold text-slate-400 hover:text-indigo-400 transition-colors bg-transparent border-none cursor-pointer disabled:opacity-50"
          >
            ← Back to User Profile
          </button>
        </div>

      </div>
    </div>
  );
};

export default UniversalRewardForm;

