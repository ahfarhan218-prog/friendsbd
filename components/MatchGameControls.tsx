import React, { useState, useEffect } from 'react';
import { MatchState, User } from '../types';
import { API_BASE } from '../services/mongoService';

export const MatchGameControls: React.FC<{ matchData: MatchState, currentUser: User | null }> = ({ matchData, currentUser }) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [submitting, setSubmitting] = useState(false);

  const { currentOver } = matchData;
  const isBatsman = currentOver?.activeBatsmanId === currentUser?.id;
  const isBowler = currentOver?.bowlerId === currentUser?.id;
  const isActivePlayer = isBatsman || isBowler;

  useEffect(() => {
    if (!currentOver?.overStartTime) {
      setTimeLeft(120);
      return;
    }

    const startMs = typeof currentOver.overStartTime === 'number' ? currentOver.overStartTime : Date.now();
    
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - startMs) / 1000);
      const remaining = Math.max(0, 120 - diff);
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentOver?.overStartTime]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^[12346]?$/.test(value)) return;
    
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < 5) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleSubmit = async () => {
    const postStr = digits.join('');
    if (postStr.length !== 6) {
      alert("You must enter exactly 6 digits!");
      return;
    }

    setSubmitting(true);
    try {
      const session = localStorage.getItem('user_session');
      const sessionToken = session ? JSON.parse(session).sessionToken : null;

      const res = await fetch(`${API_BASE}/matches/${matchData.id}/submit-move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken || ''
        },
        body: JSON.stringify({
          matchId: matchData.id,
          role: isBatsman ? 'batsman' : 'bowler',
          post: postStr
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit move');
      }
      
      alert(data.message || 'Move submitted!');
      setDigits(['', '', '', '', '', '']);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isActivePlayer) {
    return (
      <div className="bg-slate-900/50 rounded-xl p-4 text-center border border-slate-800">
        <p className="text-slate-400 text-sm">You are not actively playing in this over.</p>
      </div>
    );
  }

  const roleLabel = isBatsman ? 'Batsman' : 'Bowler';
  const hasSubmitted = (isBatsman && currentOver.batsmanPost) || (isBowler && currentOver.bowlerPost);

  if (hasSubmitted) {
    return (
      <div className="bg-green-900/20 border border-green-800/30 rounded-xl p-4 text-center">
        <p className="text-green-400 font-bold mb-1">Move Submitted!</p>
        <p className="text-green-500/70 text-sm">Waiting for the opponent to submit...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl p-5 border border-slate-700 shadow-xl relative">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-white font-bold text-lg">Your Turn: {roleLabel}</h3>
          <p className="text-slate-400 text-xs">Enter your 6 deliveries (1, 2, 3, 4, 6)</p>
        </div>
        <div className={`text-2xl font-black ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-indigo-400'}`}>
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {digits.map((digit, i) => (
          <input
            key={i}
            id={`digit-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            className="w-12 h-14 bg-slate-800 border-2 border-slate-600 rounded-lg text-center text-xl font-bold text-white focus:border-indigo-500 focus:outline-none transition-colors"
          />
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || digits.join('').length !== 6}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl font-bold text-white uppercase tracking-wider transition-all"
      >
        {submitting ? 'Submitting...' : 'Confirm Over'}
      </button>
    </div>
  );
};
