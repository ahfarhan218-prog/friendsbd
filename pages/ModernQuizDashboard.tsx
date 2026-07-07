import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { mongoService, API_BASE } from '../services/mongoService';
import { apService } from '../services/apService';
import { unlockAchievement } from '../utils/achievements';
import { triggerToast } from '../components/NotificationToast';
import ModernQuizCard from '../components/ModernQuizCard';
import QuizUpsertModal, { Quiz, Question } from '../components/QuizUpsertModal';
import { apTransactionService } from '../services/apTransactionService';

const ModernQuizDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [completions, setCompletions] = useState<Record<string, { score: number; timestamp: number }>>({});
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'standard' | 'live' | 'completed' | 'pinned'>('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [pageJumpInput, setPageJumpInput] = useState('');

  const [upsertModalOpen, setUpsertModalOpen] = useState(false);
  const [selectedQuizForEdit, setSelectedQuizForEdit] = useState<Quiz | null>(null);
  const [defaultModalType, setDefaultModalType] = useState<'standard' | 'live'>('standard');

  const [activePlayingQuiz, setActivePlayingQuiz] = useState<Quiz | null>(null);
  const [currentQuestionStep, setCurrentQuestionStep] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);

  const activeRef = useRef(true);

  useEffect(() => {
    const saved = localStorage.getItem('user_session');
    if (saved) {
      try { setCurrentUser(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        const [quizzesRes, subsRes] = await Promise.all([
          fetch(`${API_BASE}/quizzes`),
          currentUser?.id ? fetch(`${API_BASE}/quizzes/submissions/${currentUser.id}`) : Promise.resolve(null)
        ]);

        if (!activeRef.current) return;

        const quizzesData = await quizzesRes.json();
        const list: Quiz[] = quizzesData.map((q: any) => ({ id: q.id, ...q }));
        list.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return (b.timestamp || 0) - (a.timestamp || 0);
        });
        setQuizzes(list);

        if (subsRes) {
          const subsData = await subsRes.json();
          const records: Record<string, { score: number; timestamp: number }> = {};
          subsData.forEach((s: any) => {
            if (s.quizId) {
              records[s.quizId] = { score: s.score, timestamp: s.timestamp };
            }
          });
          setCompletions(records);
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch quizzes:', err);
        if (activeRef.current) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => {
      activeRef.current = false;
      clearInterval(interval);
    };
  }, [currentUser?.id]);

  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'moderator';

  const handleTogglePin = async (quiz: Quiz) => {
    if (!quiz.id) return;
    try {
      await fetch(`${API_BASE}/quizzes/${quiz.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !quiz.isPinned })
      });
      setQuizzes(prev => prev.map(q => q.id === quiz.id ? { ...q, isPinned: !q.isPinned } : q));
      triggerToast({
        id: 'pin-ok-' + Date.now(),
        senderId: 'system',
        senderName: 'System',
        senderAvatar: 'https://i.pravatar.cc/100?img=12',
        type: 'SYSTEM',
        message: `Quiz "${quiz.title}" ${!quiz.isPinned ? 'pinned to top 📌' : 'unpinned'}`,
        timestamp: Date.now(),
        isRead: false
      } as any);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (quiz: Quiz) => {
    if (!quiz.id) return;
    try {
      const nextClosedState = !quiz.isClosed;
      await fetch(`${API_BASE}/quizzes/${quiz.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isClosed: nextClosedState })
      });
      setQuizzes(prev => prev.map(q => q.id === quiz.id ? { ...q, isClosed: nextClosedState } : q));
      triggerToast({
        id: 'status-ok-' + Date.now(),
        senderId: 'system',
        senderName: 'System',
        senderAvatar: 'https://i.pravatar.cc/100?img=12',
        type: 'SYSTEM',
        message: `Quiz deck is now ${nextClosedState ? 'closed 🔴' : 'open 🟢'}`,
        timestamp: Date.now(),
        isRead: false
      } as any);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteQuiz = async (quiz: Quiz) => {
    if (!quiz.id) return;
    if (!window.confirm(`Are you sure you want to delete "${quiz.title}"?`)) return;
    try {
      await fetch(`${API_BASE}/quizzes/${quiz.id}`, { method: 'DELETE' });
      setQuizzes(prev => prev.filter(q => q.id !== quiz.id));
      
      if (quiz.authorId) {
        apTransactionService.adjustUserAP(quiz.authorId, 'QUIZ_TOPIC_DELETED')
          .catch(e => console.warn('Failed to deduct AP on quiz delete:', e));
      }

      triggerToast({
        id: 'delete-ok-' + Date.now(),
        senderId: 'system',
        senderName: 'System',
        senderAvatar: 'https://i.pravatar.cc/100?img=12',
        type: 'SYSTEM',
        message: 'Quiz deleted successfully.',
        timestamp: Date.now(),
        isRead: false
      } as any);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveQuiz = async (payload: Omit<Quiz, 'id'> & { id?: string }) => {
    try {
      if (payload.id) {
        const { id, ...rest } = payload;
        await fetch(`${API_BASE}/quizzes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rest)
        });
        triggerToast({
          id: 'upsert-ok-' + Date.now(),
          senderId: 'system',
          senderName: 'System',
          senderAvatar: 'https://i.pravatar.cc/100?img=12',
          type: 'SYSTEM',
          message: 'Quiz configuration updated!',
          timestamp: Date.now(),
          isRead: false
        } as any);
      } else {
        const newQuiz = { ...payload, id: `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, timestamp: Date.now() };
        await fetch(`${API_BASE}/quizzes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newQuiz)
        });
        triggerToast({
          id: 'upsert-add-' + Date.now(),
          senderId: 'system',
          senderName: 'System',
          senderAvatar: 'https://i.pravatar.cc/100?img=12',
          type: 'SYSTEM',
          message: 'New Quiz launched successfully!',
          timestamp: Date.now(),
          isRead: false
        } as any);
      }
    } catch (err) {
      console.error(err);
      throw new Error('Could not save quiz parameters.');
    }
  };

  const openCreateModal = (type: 'standard' | 'live') => {
    setSelectedQuizForEdit(null);
    setDefaultModalType(type);
    setUpsertModalOpen(true);
  };

  const openEditModal = (quiz: Quiz) => {
    setSelectedQuizForEdit(quiz);
    setUpsertModalOpen(true);
  };

  const startPlayingQuiz = (quiz: Quiz) => {
    setActivePlayingQuiz(quiz);
    setCurrentQuestionStep(0);
    setQuizScore(0);
    setQuizFinished(false);
    setIsSubmittingScore(false);
  };

  const selectAnswer = (isCorrect: boolean) => {
    let nextScore = quizScore;
    if (isCorrect) {
      nextScore = quizScore + 1;
      setQuizScore(nextScore);
    }

    if (!activePlayingQuiz) return;

    if (currentQuestionStep < activePlayingQuiz.questions.length - 1) {
      setCurrentQuestionStep(currentQuestionStep + 1);
    } else {
      setQuizFinished(true);
      if (nextScore === activePlayingQuiz.questions.length) {
        submitPerfectScore(activePlayingQuiz, nextScore);
      }
    }
  };

  const submitPerfectScore = async (quiz: Quiz, finalScore: number) => {
    if (!currentUser?.id || !quiz.id) return;
    setIsSubmittingScore(true);
    try {
      const rewardAmount = quiz.rewardAp || 50;

      if (completions[quiz.id]) {
        triggerToast({
          id: 'quiz-claimed-' + Date.now(),
          senderId: 'system',
          senderName: 'System',
          senderAvatar: 'https://i.pravatar.cc/100?img=12',
          type: 'SYSTEM',
          message: 'Reward already claimed for this quiz.',
          timestamp: Date.now(),
          isRead: false
        } as any);
        setIsSubmittingScore(false);
        return;
      }

      const subRes = await fetch(`${API_BASE}/quizzes/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          quizId: quiz.id,
          quizTitle: quiz.title,
          score: finalScore
        })
      });

      if (!subRes.ok) {
        const err = await subRes.json();
        throw new Error(err.error || 'Failed to submit');
      }

      await mongoService.updateUser(currentUser.id, {
        $inc: { ap: rewardAmount, totalAp: rewardAmount }
      } as any);

      apService.awardAP(rewardAmount, `Quiz completion: ${quiz.title}`, '💯', true, false);
      unlockAchievement('quiz_master');
      
      const sess = localStorage.getItem('user_session');
      if (sess) {
        const parsed = JSON.parse(sess);
        parsed.ap = (parsed.ap || 0) + rewardAmount;
        parsed.totalAp = (parsed.totalAp || 0) + rewardAmount;
        localStorage.setItem('user_session', JSON.stringify(parsed));
        window.dispatchEvent(new Event('storage'));
      }

      setCompletions(prev => ({
        ...prev,
        [quiz.id!]: { score: finalScore, timestamp: Date.now() }
      }));
    } catch (err) {
      console.error('Quiz submission failed:', err);
    } finally {
      setIsSubmittingScore(false);
    }
  };

  const filteredQuizzes = quizzes.filter(q => {
    const matchesSearch = 
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.creatorName || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === 'standard') return q.type === 'standard';
    if (activeTab === 'live') return q.type === 'live';
    if (activeTab === 'completed') return !!(q.id && completions[q.id]);
    if (activeTab === 'pinned') return q.isPinned;
    return true;
  });

  const totalItems = filteredQuizzes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedQuizzes = filteredQuizzes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setPageJumpInput('');
    }
  };

  const handlePageJump = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(pageJumpInput, 10);
    if (!isNaN(val) && val >= 1 && val <= totalPages) {
      setCurrentPage(val);
    }
  };

  const activeQuizzesCount = quizzes.filter(q => !q.isClosed).length;
  const completedCount = Object.keys(completions).length;
  const totalApEarned = Object.keys(completions).reduce((sum, quizId) => {
    const matchedQuiz = quizzes.find(q => q.id === quizId);
    return sum + (matchedQuiz?.rewardAp || 50);
  }, 0);
  const liveArenaCount = quizzes.filter(q => q.type === 'live' && !q.isClosed).length;

  return (
    <div className="min-h-screen bg-transparent text-[#f8fafc] font-sans antialiased pb-24 relative overflow-x-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-[300px] h-[300px] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

      <header className="p-6 border-b border-[#1f293d]/50 bg-slate-950/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
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
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-400 tracking-tight">
                Executive Quiz Deck
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Participate in community trivia events, complete modules, and claim active points.
              </p>
            </div>
          </div>

          {isStaff && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/quiz/new')}
                className="px-5 py-3 text-xs font-bold bg-[#121824] hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-amber-500/20 hover:border-amber-500/40 rounded-2xl shadow-lg transition-all flex items-center gap-1.5"
              >
                <span>📋</span> Classic Form
              </button>
              <button
                onClick={() => openCreateModal('standard')}
                className="px-5 py-3 text-xs font-bold bg-[#121824] hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 rounded-2xl shadow-lg transition-all flex items-center gap-1.5"
              >
                <span>➕</span> Standard Quiz
              </button>
              <button
                onClick={() => openCreateModal('live')}
                className="px-5 py-3 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-600/20 hover:shadow-rose-600/30 transition-all flex items-center gap-1.5 relative overflow-hidden group"
              >
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span>⚡</span> Launch LIVE Arena
              </button>
            </div>
          )}
        </div>
      </header>

      <section className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Modules', value: activeQuizzesCount, icon: '📂', color: 'text-indigo-400', bg: 'from-indigo-500/10 to-transparent' },
            { label: 'My Completions', value: completedCount, icon: '🏆', color: 'text-emerald-400', bg: 'from-emerald-500/10 to-transparent' },
            { label: 'Total AP Claimed', value: `${totalApEarned} AP`, icon: '⚡', color: 'text-amber-400', bg: 'from-amber-500/10 to-transparent' },
            { label: 'Active Live Arenas', value: liveArenaCount, icon: '🔥', color: 'text-rose-400', bg: 'from-rose-500/10 to-transparent' },
          ].map((stat, i) => (
            <div
              key={i}
              className={`bg-[#121824] border border-[#1f293d] p-5 rounded-[2rem] bg-gradient-to-r ${stat.bg} flex items-center justify-between shadow-sm`}
            >
              <div className="text-left space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
                <h3 className={`text-xl font-black font-mono ${stat.color}`}>{stat.value}</h3>
              </div>
              <span className="text-2xl p-3 bg-slate-950/40 border border-[#1f293d]/50 rounded-2xl">{stat.icon}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 max-w-7xl mx-auto">
        <div className="bg-[#121824] border border-[#1f293d] rounded-[2rem] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
          <div className="flex bg-[#090d16] p-1.5 rounded-2xl border border-[#1f293d] overflow-x-auto">
            {[
              { id: 'all', label: 'All Decks', emoji: '🌌' },
              { id: 'standard', label: 'Standard', emoji: '📘' },
              { id: 'live', label: 'Live Arenas', emoji: '⚡' },
              { id: 'completed', label: 'Completed', emoji: '✅' },
              { id: 'pinned', label: 'Pinned', emoji: '📌' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setCurrentPage(1); }}
                className={`flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#121824] text-white border border-[#1f293d] shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{tab.emoji}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 md:max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search by title or host..."
              className="w-full bg-[#090d16] border border-[#1f293d] rounded-2xl py-3 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none transition-all"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          </div>
        </div>
      </section>

      <main className="p-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#121824] border border-[#1f293d] rounded-3xl p-5 min-h-[260px] animate-pulse space-y-4">
                <div className="flex justify-between items-center">
                  <div className="w-16 h-4 bg-slate-800 rounded-md" />
                  <div className="w-8 h-4 bg-slate-800 rounded-md" />
                </div>
                <div className="w-3/4 h-5 bg-slate-800 rounded-md" />
                <div className="w-full h-8 bg-slate-800 rounded-md" />
                <div className="flex justify-between pt-4 border-t border-[#1f293d]/50">
                  <div className="w-20 h-4 bg-slate-800 rounded-md" />
                  <div className="w-16 h-8 bg-slate-800 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : paginatedQuizzes.length === 0 ? (
          <div className="py-20 bg-[#121824]/40 border border-[#1f293d]/50 rounded-[2.5rem] text-center space-y-3">
            <span className="text-4xl block">🔍</span>
            <h3 className="text-base font-black text-white">No Quiz Modules Found</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              We couldn't find any quizzes matching your filter or query. Create a new one to populate the database.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {paginatedQuizzes.map(quiz => (
                <ModernQuizCard
                  key={quiz.id}
                  quiz={quiz}
                  isStaff={isStaff}
                  isCompleted={!!(quiz.id && completions[quiz.id])}
                  onPlay={startPlayingQuiz}
                  onEdit={openEditModal}
                  onTogglePin={handleTogglePin}
                  onToggleStatus={handleToggleStatus}
                  onDelete={handleDeleteQuiz}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {totalPages > 1 && (
        <footer className="mt-8 px-6 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 bg-[#121824] border border-[#1f293d] p-1.5 rounded-2xl">
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="p-2 text-slate-400 hover:text-white disabled:text-slate-600 disabled:bg-transparent bg-slate-950/40 hover:bg-slate-800 border border-[#1f293d] rounded-xl transition-all disabled:pointer-events-none"
            >
              ◀
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const pNum = i + 1;
              return (
                <button
                  key={pNum}
                  onClick={() => handlePageChange(pNum)}
                  className={`w-9 h-9 text-xs font-bold rounded-xl transition-all ${
                    currentPage === pNum
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  {pNum}
                </button>
              );
            })}
            <button
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="p-2 text-slate-400 hover:text-white disabled:text-slate-600 disabled:bg-transparent bg-slate-950/40 hover:bg-slate-800 border border-[#1f293d] rounded-xl transition-all disabled:pointer-events-none"
            >
              ▶
            </button>
          </div>
          <form onSubmit={handlePageJump} className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Go to page:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={pageJumpInput}
              onChange={e => setPageJumpInput(e.target.value)}
              placeholder={currentPage.toString()}
              className="w-16 bg-[#121824] border border-[#1f293d] focus:border-indigo-500 text-center text-xs text-white rounded-xl py-2 outline-none transition-all font-mono font-bold"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-xl text-xs font-bold transition-all"
            >
              Jump
            </button>
          </form>
        </footer>
      )}

      <AnimatePresence>
        {activePlayingQuiz && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="w-full max-w-xl bg-[#121824] border border-[#1f293d] rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[80px]" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-[80px]" />

              {!quizFinished ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-[#1f293d] pb-4">
                    <span className="text-[10px] font-black font-mono uppercase tracking-widest px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                      Question {currentQuestionStep + 1} of {activePlayingQuiz.questions.length}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 font-mono">
                      Current Score: {quizScore * 10} pts
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentQuestionStep) / activePlayingQuiz.questions.length) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <h3 className="text-base font-black text-white leading-tight mt-4">
                    {activePlayingQuiz.questions[currentQuestionStep].q}
                  </h3>
                  <div className="space-y-3 pt-2">
                    {activePlayingQuiz.questions[currentQuestionStep].options.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        onClick={() => selectAnswer(oIdx === activePlayingQuiz.questions[currentQuestionStep].correct)}
                        className="w-full text-left p-4 bg-[#090d16] hover:bg-slate-900 border border-[#1f293d] hover:border-indigo-500/50 rounded-2xl text-xs font-bold text-slate-200 hover:text-white transition-all flex justify-between items-center group shadow-sm"
                      >
                        <span>{opt}</span>
                        <span className="w-5 h-5 rounded-lg border-2 border-slate-700 group-hover:border-indigo-500 group-hover:bg-indigo-500/10 flex items-center justify-center font-mono text-[9px] text-slate-500 group-hover:text-indigo-400 font-bold transition-all">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setActivePlayingQuiz(null)}
                      className="px-4 py-2 text-slate-400 hover:text-rose-400 text-xs font-bold transition-all"
                    >
                      Quit Quiz
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 space-y-6">
                  <span className="text-5xl block animate-bounce">🏆</span>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white">Arena Finished!</h3>
                    <p className="text-xs text-slate-400">
                      You successfully completed "{activePlayingQuiz.title}".
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    <div className="bg-[#090d16] border border-[#1f293d] p-4 rounded-2xl text-center space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">Final Score</span>
                      <h4 className="text-lg font-black text-white font-mono">
                        {quizScore} / {activePlayingQuiz.questions.length}
                      </h4>
                    </div>
                    <div className="bg-[#090d16] border border-[#1f293d] p-4 rounded-2xl text-center space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">Points Earned</span>
                      <h4 className="text-lg font-black text-indigo-400 font-mono">
                        {quizScore === activePlayingQuiz.questions.length ? `+${activePlayingQuiz.rewardAp || 50} AP` : '0 AP'}
                      </h4>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-950/50 rounded-2xl text-xs max-w-md mx-auto text-slate-400 leading-relaxed">
                    {quizScore === activePlayingQuiz.questions.length ? (
                      <span className="text-green-400 font-semibold">
                        🎉 Perfect score! Reward claimed and successfully added to your Active Points (AP) log.
                      </span>
                    ) : (
                      <span>
                        ⚠️ You got {activePlayingQuiz.questions.length - quizScore} answers wrong. A perfect score of {activePlayingQuiz.questions.length}/{activePlayingQuiz.questions.length} is required to claim the AP reward. Better luck next time!
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 pt-4">
                    <button
                      onClick={() => setActivePlayingQuiz(null)}
                      disabled={isSubmittingScore}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 text-xs transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmittingScore ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Return to Deck'
                      )}
                    </button>
                    {quizScore < activePlayingQuiz.questions.length && (
                      <button
                        onClick={() => startPlayingQuiz(activePlayingQuiz)}
                        className="w-full bg-[#090d16] hover:bg-slate-900 text-slate-300 hover:text-white font-bold py-3.5 rounded-2xl border border-[#1f293d] hover:border-indigo-500/50 text-xs transition-all"
                      >
                        Try Again
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <QuizUpsertModal
        isOpen={upsertModalOpen}
        onClose={() => setUpsertModalOpen(false)}
        onSave={handleSaveQuiz}
        quizToEdit={selectedQuizForEdit}
        currentUser={currentUser}
        defaultType={defaultModalType}
      />
    </div>
  );
};

export default ModernQuizDashboard;