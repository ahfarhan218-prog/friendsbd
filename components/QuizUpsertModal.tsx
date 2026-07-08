import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Question {
  q: string;
  options: string[];
  correct: number;
}

export interface Quiz {
  id?: string;
  title: string;
  description: string;
  type: 'standard' | 'live';
  rewardAp: number;
  isPinned: boolean;
  isClosed: boolean;
  questions: Question[];
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  timestamp: number;
}

interface QuizUpsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (quiz: Omit<Quiz, 'id'> & { id?: string }) => Promise<void>;
  quizToEdit?: Quiz | null;
  currentUser: any;
  defaultType?: 'standard' | 'live';
}

const QuizUpsertModal: React.FC<QuizUpsertModalProps> = ({
  isOpen,
  onClose,
  onSave,
  quizToEdit,
  currentUser,
  defaultType = 'standard'
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'standard' | 'live'>(defaultType);
  const [rewardAp, setRewardAp] = useState(50);
  const [isPinned, setIsPinned] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([
    { q: '', options: ['', '', '', ''], correct: 0 }
  ]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state if editing a quiz
  useEffect(() => {
    if (quizToEdit) {
      setTitle(quizToEdit.title);
      setDescription(quizToEdit.description);
      setType(quizToEdit.type);
      setRewardAp(quizToEdit.rewardAp || 50);
      setIsPinned(!!quizToEdit.isPinned);
      setQuestions(quizToEdit.questions && quizToEdit.questions.length > 0
        ? JSON.parse(JSON.stringify(quizToEdit.questions))
        : [{ q: '', options: ['', '', '', ''], correct: 0 }]
      );
    } else {
      setTitle('');
      setDescription('');
      setType(defaultType);
      setRewardAp(50);
      setIsPinned(false);
      setQuestions([{ q: '', options: ['', '', '', ''], correct: 0 }]);
    }
    setErrorMsg('');
  }, [quizToEdit, isOpen, defaultType]);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { q: '', options: ['', '', '', ''], correct: 0 }
    ]);
  };

  const handleRemoveQuestion = (qIndex: number) => {
    if (questions.length === 1) {
      setErrorMsg('A quiz must have at least one question.');
      return;
    }
    setQuestions(questions.filter((_, idx) => idx !== qIndex));
  };

  const handleQuestionChange = (qIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex].q = text;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex: number, optIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = text;
    setQuestions(updated);
  };

  const handleCorrectChange = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    updated[qIndex].correct = optIndex;
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Quiz title is required.');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.q.trim()) {
        setErrorMsg(`Question ${i + 1} text is empty.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          setErrorMsg(`Option ${j + 1} for Question ${i + 1} is empty.`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const payload: Omit<Quiz, 'id'> & { id?: string } = {
        title: title.trim(),
        description: description.trim(),
        type,
        rewardAp: Number(rewardAp) || 50,
        isPinned,
        isClosed: quizToEdit ? quizToEdit.isClosed : false,
        questions: questions.map(q => ({
          q: q.q.trim(),
          options: q.options.map(opt => opt.trim()),
          correct: q.correct
        })),
        creatorId: quizToEdit ? quizToEdit.creatorId : (currentUser?.id || 'system'),
        creatorName: quizToEdit ? quizToEdit.creatorName : (currentUser?.username || currentUser?.name || 'admin'),
        creatorAvatar: quizToEdit ? quizToEdit.creatorAvatar : (currentUser?.avatar || 'https://picsum.photos/seed/quiz/200'),
        timestamp: quizToEdit ? quizToEdit.timestamp : Date.now()
      };

      if (quizToEdit?.id) {
        payload.id = quizToEdit.id;
      }

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-3xl bg-[#121824] border border-[#1f293d] rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Decorative glows */}
          <div className="absolute top-0 left-1/4 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

          {/* Modal Header */}
          <div className="p-6 border-b border-[#1f293d] flex items-center justify-between bg-slate-900/40">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                {quizToEdit ? '✏️ Edit Quiz' : '➕ Create New Quiz'}
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                  type === 'live'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                }`}>
                  {type === 'live' ? 'LIVE QUIZ' : 'STANDARD'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure rewards, details, and dynamic questions.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-[#1f293d] rounded-2xl transition-all"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {errorMsg && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs font-bold text-center">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Basic Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Quiz Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Enter cricket, gaming or history topic..."
                  className="w-full bg-[#090d16] border border-[#1f293d] rounded-2xl py-3 px-4 focus:border-indigo-500 text-sm text-white outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">AP Reward Points</label>
                <input
                  type="number"
                  min={5}
                  max={500}
                  required
                  value={rewardAp}
                  onChange={e => setRewardAp(Number(e.target.value))}
                  placeholder="e.g. 50"
                  className="w-full bg-[#090d16] border border-[#1f293d] rounded-2xl py-3 px-4 focus:border-indigo-500 text-sm text-white outline-none transition-all"
                />
              </div>

              <div className="col-span-1 md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Short Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Briefly state rules, topic, and details..."
                  className="w-full bg-[#090d16] border border-[#1f293d] rounded-2xl py-3 px-4 focus:border-indigo-500 text-sm text-white outline-none transition-all resize-none"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-[#1f293d] rounded-2xl">
                <div className="text-left">
                  <h4 className="text-xs font-bold text-white">📌 Pin to Top</h4>
                  <p className="text-[10px] text-slate-400">Featured quiz prioritised in search deck.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPinned(!isPinned)}
                  className={`w-12 h-6 rounded-full relative transition-all ${
                    isPinned ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                    isPinned ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-[#1f293d] rounded-2xl">
                <div className="text-left">
                  <h4 className="text-xs font-bold text-white">⚡ Launch Type</h4>
                  <p className="text-[10px] text-slate-400">Live tournaments trigger glows & notifications.</p>
                </div>
                <div className="flex bg-[#090d16] border border-[#1f293d] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setType('standard')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                      type === 'standard'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400'
                    }`}
                  >
                    Std
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('live')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                      type === 'live'
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-400'
                    }`}
                  >
                    Live
                  </button>
                </div>
              </div>
            </div>

            {/* Questions Header */}
            <div className="border-t border-[#1f293d] pt-6 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-white">📝 Quiz Questions ({questions.length})</h4>
                <p className="text-[10px] text-slate-400">Compose questions, option arrays, and mark correct indices.</p>
              </div>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-xl transition-all"
              >
                <span>➕</span> Add Question
              </button>
            </div>

            {/* Dynamic Questions List */}
            <div className="space-y-6">
              {questions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="p-5 bg-slate-900/60 border border-[#1f293d] rounded-3xl relative space-y-4"
                >
                  {/* Remove button */}
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800/80 hover:bg-rose-500/10 border border-[#1f293d] hover:border-rose-500/20 rounded-xl transition-all"
                      title="Remove question"
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-400">
                      {qIdx + 1}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question Details</span>
                  </div>

                  {/* Question Text */}
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      required
                      value={q.q}
                      onChange={e => handleQuestionChange(qIdx, e.target.value)}
                      placeholder="Write the question text..."
                      className="w-full bg-[#090d16] border border-[#1f293d] rounded-xl py-3 px-4 focus:border-indigo-500 text-sm text-white outline-none transition-all"
                    />
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        {/* Radio select for correct answer */}
                        <button
                          type="button"
                          onClick={() => handleCorrectChange(qIdx, optIdx)}
                          className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all ${
                            q.correct === optIdx
                              ? 'bg-green-500/10 border-green-500 text-green-400 shadow-[0_0_12px_rgba(34,197,94,0.2)]'
                              : 'bg-[#090d16] border-[#1f293d] text-slate-500 hover:border-slate-700'
                          }`}
                          title="Mark as correct option"
                        >
                          {q.correct === optIdx ? '✓' : String.fromCharCode(65 + optIdx)}
                        </button>
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={e => handleOptionChange(qIdx, optIdx, e.target.value)}
                          placeholder={`Option ${optIdx + 1}...`}
                          className="flex-1 bg-[#090d16] border border-[#1f293d] rounded-xl py-2 px-3.5 focus:border-indigo-500 text-xs text-white outline-none transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </form>

          {/* Modal Footer */}
          <div className="p-6 border-t border-[#1f293d] bg-slate-900/40 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-xs font-bold text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-[#1f293d] rounded-2xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Quiz Configuration'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuizUpsertModal;

