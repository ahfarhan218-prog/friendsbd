import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { triggerToast } from '../components/NotificationToast';
import { apTransactionService } from '../services/apTransactionService';
import { API_BASE } from '../services/mongoService';

const AddNewQuizForm: React.FC = () => {
  const navigate = useNavigate();

  // Form Field States
  const [title, setTitle] = useState('');
  const [topicId, setTopicId] = useState('');
  const [host, setHost] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Open' | 'Closed'>('Open');
  const [isPinned, setIsPinned] = useState(false);
  const [quizType, setQuizType] = useState<'Standard' | 'Live'>('Standard');

  // UI Flow States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [currentUserAvatar, setCurrentUserAvatar] = useState('');

  // Auto-populate Host/Username from localStorage user_session
  useEffect(() => {
    try {
      const sess = localStorage.getItem('user_session');
      if (sess) {
        const parsed = JSON.parse(sess);
        if (parsed.username) {
          setHost(parsed.username);
        } else if (parsed.name) {
          setHost(parsed.name.replace(/\s+/g, '').toLowerCase());
        }
        if (parsed.avatar) {
          setCurrentUserAvatar(parsed.avatar);
        }
      }
    } catch (e) {
      console.error('Error reading session for quiz form:', e);
    }
  }, []);

  // Form Validation Logic
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Quiz title cannot be empty.';
    } else if (title.trim().length < 4) {
      errors.title = 'Title must be at least 4 characters.';
    }

    if (!topicId.trim()) {
      errors.topicId = 'Topic ID/Year is required (e.g. 1997 or general).';
    }

    if (!host.trim()) {
      errors.host = 'Host username is required.';
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
        senderName: 'System',
        senderAvatar: 'https://i.pravatar.cc/100?img=12',
        type: 'SYSTEM',
        message: 'Please resolve the highlighted validation errors.',
        timestamp: Date.now(),
        isRead: false
      } as any);
      return;
    }

    setIsSubmitting(true);

    try {
      const activeUid = JSON.parse(localStorage.getItem('user_session') || '{}').id || 'anonymous';

      // ── DATA MODEL SPECIFICATION ──
      const docData = {
        status,
        topic_id: topicId.trim(),
        title: title.trim(),
        created_by_username: host.trim(),
        created_by_uid: activeUid,
        short_description: description.trim(),
        is_pinned: isPinned,
        type: quizType,
        updated_at: Date.now(),

        // ── DASHBOARD SCHEMA BACKWARD COMPATIBILITY ──
        description: description.trim(),
        isPinned: isPinned,
        isClosed: status === 'Closed',
        rewardAp: 50,
        timestamp: Date.now(),
        creatorId: activeUid,
        creatorName: host.trim(),
        creatorAvatar: currentUserAvatar || 'https://picsum.photos/seed/quiz/200',
        questions: [
          {
            q: `Sample Question for ${title.trim()}`,
            options: ["Correct Answer Option", "Incorrect Option A", "Incorrect Option B", "Incorrect Option C"],
            correct: 0
          }
        ]
      };

      await fetch(`${API_BASE}/quizzes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(docData) });

      // Award AP for posting a quiz topic
      apTransactionService.adjustUserAP(activeUid, 'QUIZ_TOPIC_POSTED')
        .then(({ newBalance }) => {
          const saved = localStorage.getItem('user_session');
          if (saved) {
            const parsed = JSON.parse(saved);
            parsed.balance_ap = newBalance;
            localStorage.setItem('user_session', JSON.stringify(parsed));
            window.dispatchEvent(new Event('storage'));
          }
        })
        .catch(err => console.warn('Failed to award quiz topic AP:', err));

      triggerToast({
        id: 'quiz-add-success-' + Date.now(),
        senderId: 'system',
        senderName: 'System',
        senderAvatar: currentUserAvatar || 'https://i.pravatar.cc/100?img=12',
        type: 'SYSTEM',
        message: '🎉 Quiz created successfully!',
        timestamp: Date.now(),
        isRead: false
      } as any);

      // Clear Form Fields
      setTitle('');
      setTopicId('');
      setDescription('');
      setIsPinned(false);
      
      // Redirect back to Quiz Deck
      setTimeout(() => {
        navigate('/quiz');
      }, 500);

    } catch (err: any) {
      console.error('Firestore save failed:', err);
      triggerToast({
        id: 'quiz-add-fail-' + Date.now(),
        senderId: 'system',
        senderName: 'System',
        senderAvatar: 'https://i.pravatar.cc/100?img=12',
        type: 'SYSTEM',
        message: 'Failed to write quiz to database. Try again.',
        timestamp: Date.now(),
        isRead: false
      } as any);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-[#f8fafc] font-sans antialiased p-4 sm:p-6 flex flex-col justify-center items-center relative overflow-x-hidden">
      {/* Decorative Glow elements */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Main Form Container */}
      <div className="bg-[#121824] rounded-3xl border border-[#1f293d] p-4 sm:p-8 max-w-lg w-full shadow-2xl mx-auto my-10 relative overflow-hidden">
        {/* Glow accent matching status */}
        <div className={`absolute top-0 inset-x-0 h-1 transition-all duration-300 ${
          status === 'Open' ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]' : 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
        }`} />

        <div className="text-center mb-6">
          <h2 className="text-xl font-black text-white flex flex-wrap items-center justify-center gap-2">
            🆕 Launch New Quiz
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 uppercase tracking-widest mt-1">
            Specify database tags & metadata details
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Title input */}
          <div className="space-y-1">
            <label className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Quiz Title</label>
            <input
              type="text"
              disabled={isSubmitting}
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (validationErrors.title) {
                  setValidationErrors(prev => ({ ...prev, title: '' }));
                }
              }}
              placeholder="e.g. World Cup 2026 Finals"
              className={`bg-[#090d16] border text-white focus:outline-none focus:border-indigo-500 rounded-2xl p-3.5 w-full transition-all duration-200 text-sm ${
                validationErrors.title ? 'border-rose-500/50 focus:border-rose-500' : 'border-[#1f293d]'
              }`}
            />
            {validationErrors.title && (
              <span className="text-xs sm:text-sm font-bold text-rose-400 px-2 block animate-pulse">
                ⚠️ {validationErrors.title}
              </span>
            )}
          </div>

          {/* Grid row for Topic ID & Host */}
          <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Topic ID */}
            <div className="space-y-1">
              <label className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Topic ID</label>
              <input
                type="text"
                disabled={isSubmitting}
                value={topicId}
                onChange={e => {
                  setTopicId(e.target.value);
                  if (validationErrors.topicId) {
                    setValidationErrors(prev => ({ ...prev, topicId: '' }));
                  }
                }}
                placeholder="e.g. 1997 or general"
                className={`bg-[#090d16] border text-white focus:outline-none focus:border-indigo-500 rounded-2xl p-3.5 w-full transition-all duration-200 text-sm ${
                  validationErrors.topicId ? 'border-rose-500/50 focus:border-rose-500' : 'border-[#1f293d]'
                }`}
              />
              {validationErrors.topicId && (
                <span className="text-xs sm:text-sm font-bold text-rose-400 px-2 block animate-pulse">
                  ⚠️ {validationErrors.topicId}
                </span>
              )}
            </div>

            {/* Host Username */}
            <div className="space-y-1">
              <label className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Host Name</label>
              <input
                type="text"
                disabled={isSubmitting}
                value={host}
                onChange={e => {
                  setHost(e.target.value);
                  if (validationErrors.host) {
                    setValidationErrors(prev => ({ ...prev, host: '' }));
                  }
                }}
                placeholder="Host handle..."
                className={`bg-[#090d16] border text-white focus:outline-none focus:border-indigo-500 rounded-2xl p-3.5 w-full transition-all duration-200 text-sm ${
                  validationErrors.host ? 'border-rose-500/50 focus:border-rose-500' : 'border-[#1f293d]'
                }`}
              />
              {validationErrors.host && (
                <span className="text-xs sm:text-sm font-bold text-rose-400 px-2 block animate-pulse">
                  ⚠️ {validationErrors.host}
                </span>
              )}
            </div>

          </div>

          {/* Description input */}
          <div className="space-y-1">
            <label className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Short Description</label>
            <textarea
              disabled={isSubmitting}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Provide a brief context or instructions for this quiz..."
              rows={3}
              className="bg-[#090d16] border border-[#1f293d] text-white focus:outline-none focus:border-indigo-500 rounded-2xl p-3.5 w-full transition-all duration-200 text-sm resize-none"
            />
          </div>

          {/* Status Selection with glowing accent */}
          <div className="space-y-1">
            <label className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Status Deck</label>
            <div className={`relative rounded-2xl transition-all duration-350 p-[1.5px] ${
              status === 'Open'
                ? 'bg-gradient-to-r from-green-500/20 via-green-500/50 to-green-500/20 shadow-[0_0_12px_rgba(34,197,94,0.15)]'
                : 'bg-gradient-to-r from-rose-500/20 via-rose-500/50 to-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
            }`}>
              <select
                disabled={isSubmitting}
                value={status}
                onChange={e => setStatus(e.target.value as 'Open' | 'Closed')}
                className="bg-[#090d16] text-white border-none rounded-2xl p-3.5 w-full focus:outline-none text-sm cursor-pointer appearance-none"
              >
                <option value="Open" className="bg-[#121824] text-white font-semibold">🟢 Open (Available to play)</option>
                <option value="Closed" className="bg-[#121824] text-white font-semibold">🔴 Closed (Locked/Disabled)</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-sm text-slate-400 font-bold">
                ▼
              </div>
            </div>
          </div>

          {/* Grid row for Type & Pinned */}
          <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Quiz Type */}
            <div className="space-y-1">
              <label className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Quiz Type</label>
              <select
                disabled={isSubmitting}
                value={quizType}
                onChange={e => setQuizType(e.target.value as 'Standard' | 'Live')}
                className="bg-[#090d16] border border-[#1f293d] text-white focus:outline-none focus:border-indigo-500 rounded-2xl p-3.5 w-full text-sm cursor-pointer"
              >
                <option value="Standard" className="bg-[#121824] text-white font-semibold">Standard</option>
                <option value="Live" className="bg-[#121824] text-white font-semibold">Live Tournament</option>
              </select>
            </div>

            {/* Pinned Switch */}
            <div className="flex flex-col justify-between p-3.5 bg-[#090d16] border border-[#1f293d] rounded-2xl text-left h-[68px]">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">Pin Deck</span>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsPinned(!isPinned)}
                  className={`w-10 h-5.5 rounded-full relative transition-all ${
                    isPinned ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-1 transition-all ${
                    isPinned ? 'left-5.5' : 'left-1'
                  }`} />
                </button>
              </div>
              <span className="text-sm font-bold text-slate-500 uppercase">Featured at top</span>
            </div>

          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-black py-4 px-3 sm:px-6 rounded-2xl shadow-xl shadow-indigo-600/10 hover:shadow-indigo-600/25 w-full text-sm uppercase tracking-widest transition-all duration-150 flex flex-wrap items-center justify-center gap-2 ${
                isSubmitting ? 'opacity-80 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Creating Quiz...
                </>
              ) : (
                'Launch Quiz Document'
              )}
            </button>
          </div>

        </form>

        {/* Back Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/quiz')}
            disabled={isSubmitting}
            className="text-sm font-bold text-slate-400 hover:text-indigo-400 transition-colors inline-flex flex-wrap items-center gap-1 bg-transparent border-none cursor-pointer disabled:opacity-50"
          >
            ← Back to Quiz Menu
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddNewQuizForm;

