import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { forumService } from '../services/forumService';

// ══════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════
interface Player { name: string; profileUrl: string; }
interface TeamSetup { name: string; batsmen: Player[]; bowlers: Player[]; }

interface BatsmanStat {
  player: Player; runs: number; balls: number; fours: number; sixes: number;
  status: 'batting' | 'out' | 'not yet';
}
interface BowlerStat {
  player: Player; ballsBowled: number; runsConceded: number; wickets: number;
}
interface BallResult {
  overNum: number; ballInOver: number; batsmanName: string; bowlerName: string;
  batDigit: number; bowlDigit: number; runs: number; isWicket: boolean;
}
interface OverBall { type: string; label: string; }

interface CricketMatchState {
  innings: 1 | 2;
  battingTeam: TeamSetup; bowlingTeam: TeamSetup;
  totalRuns: number; totalWickets: number;
  completedOvers: number; ballsInCurrentOver: number;
  target: number | null;
  currentBatsmanIdx: number; currentBowlerIdx: number;
  batsmanStats: BatsmanStat[]; bowlerStats: BowlerStat[];
  ballResults: BallResult[]; currentOverBalls: OverBall[];
  maxOvers: number; inn1Runs: number; inn1Wickets: number;
  inn1BatsmanStats?: BatsmanStat[];
  inn1BowlerStats?: BowlerStat[];
  inn1BattingTeamName?: string;
  inn1BowlingTeamName?: string;
  pendingBatDigits: string | null;
  pendingBowlDigits: string | null;
  pendingBatPostId: string | null;
  pendingBowlPostId: string | null;
  pendingOverNum: number | null;
}

interface CricketThread {
  id: string;
  title: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  createdAt: number;
  lastActivity: number;
  cricketMatchData: CricketMatchState | null;
  cricketMatchPhase: 'live' | 'innings_break' | 'complete' | null;
  cricketMatchWinner: string;
  cricketTeam1Name: string;
  cricketTeam2Name: string;
  replyCount: number;
}

interface CricketForumPost {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: number;
  postType: 'text' | 'bat_digit' | 'bowl_digit';
  isHidden: boolean;
  overNum: number | null;
  _isHiddenFromViewer?: boolean;
}

type Phase = 'list' | 'setup' | 'live' | 'innings_break' | 'complete';

// ══════════════════════════════════════════════════════════════════════════
// CONSTANTS & HELPERS
// ══════════════════════════════════════════════════════════════════════════
const INNINGS_BREAK_SEC = 180;

const emptyPlayer = (): Player => ({ name: '', profileUrl: '' });
const defaultTeam = (n: number): TeamSetup => ({
  name: `Team ${n}`, batsmen: [emptyPlayer()], bowlers: [emptyPlayer()],
});

const ballNeeded = (s: CricketMatchState) => 6 - s.ballsInCurrentOver;
const overStr = (s: CricketMatchState) => `${s.completedOvers}.${s.ballsInCurrentOver}`;
const sanitize = (v: string) => v.replace(/[^12346]/g, '');
const tsAgo = (ts: number) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
};

function getBatsman(s: CricketMatchState): Player | null {
  return s.battingTeam.batsmen.filter(b => b.name.trim())[s.currentBatsmanIdx] ?? null;
}
function getBowler(s: CricketMatchState): Player | null {
  const bs = s.bowlingTeam.bowlers.filter(b => b.name.trim());
  return bs.length ? bs[s.currentBowlerIdx % bs.length] : null;
}

// ── MATCH LOGIC ─────────────────────────────────────────────────────────
function startNewOver(s: CricketMatchState): CricketMatchState {
  s.completedOvers += 1; s.ballsInCurrentOver = 0; s.currentOverBalls = [];
  const vb = s.bowlingTeam.bowlers.filter(b => b.name.trim());
  s.currentBowlerIdx = (s.currentBowlerIdx + 1) % vb.length;
  return s;
}

function buildMatchState(bt: TeamSetup, bwt: TeamSetup, mo: number, inn: 1 | 2, target: number | null, i1r: number, i1w: number): CricketMatchState {
  const vb = bt.batsmen.filter(b => b.name.trim());
  const vbw = bwt.bowlers.filter(b => b.name.trim());
  return {
    innings: inn, battingTeam: bt, bowlingTeam: bwt,
    totalRuns: 0, totalWickets: 0, completedOvers: 0, ballsInCurrentOver: 0,
    target, currentBatsmanIdx: 0, currentBowlerIdx: 0,
    batsmanStats: vb.map((p, i) => ({ player: p, runs: 0, balls: 0, fours: 0, sixes: 0, status: i === 0 ? 'batting' : 'not yet' })),
    bowlerStats: vbw.map(p => ({ player: p, ballsBowled: 0, runsConceded: 0, wickets: 0 })),
    ballResults: [], currentOverBalls: [], maxOvers: mo, inn1Runs: i1r, inn1Wickets: i1w,
    pendingBatDigits: null, pendingBowlDigits: null,
    pendingBatPostId: null, pendingBowlPostId: null, pendingOverNum: null,
  };
}

interface TurnResult { newState: CricketMatchState; log: string[]; inningsOver: boolean; chaseWon: boolean; }

function processTurn(state: CricketMatchState, batInput: string, bowlInput: string): TurnResult {
  const log: string[] = [];
  let s: CricketMatchState = JSON.parse(JSON.stringify(state));
  let inningsOver = false, chaseWon = false;
  const needed = ballNeeded(s);
  const batsmanName = getBatsman(s)?.name || '?';
  const bowlerName = getBowler(s)?.name || '?';
  const vb = s.bowlingTeam.bowlers.filter(b => b.name.trim());
  const bowlerRealIdx = s.currentBowlerIdx % vb.length;

  for (let i = 0; i < needed; i++) {
    const batD = parseInt(batInput[i]);
    const bowlD = parseInt(bowlInput[i]);
    const overNum = s.completedOvers + 1;
    const ballInOver = s.ballsInCurrentOver + 1;
    s.ballsInCurrentOver += 1;
    s.bowlerStats[bowlerRealIdx].ballsBowled += 1;
    s.batsmanStats[s.currentBatsmanIdx].balls += 1;
    const result: BallResult = { overNum, ballInOver, batsmanName, bowlerName, batDigit: batD, bowlDigit: bowlD, runs: 0, isWicket: false };

    if (batD === bowlD) {
      result.isWicket = true;
      s.batsmanStats[s.currentBatsmanIdx].status = 'out';
      s.bowlerStats[bowlerRealIdx].wickets += 1;
      s.totalWickets += 1;
      s.currentOverBalls.push({ type: 'wicket', label: 'W' });
      s.ballResults.push(result);
      log.push(`${overNum}.${ballInOver} • ${batsmanName}[${batD}] = ${bowlerName}[${bowlD}] → 🔴 WICKET!`);
      if (s.ballsInCurrentOver >= 6) s = startNewOver(s);
      const activeBatsmen = s.battingTeam.batsmen.filter(b => b.name.trim()).length;
      if (s.totalWickets >= activeBatsmen) { inningsOver = true; break; }
      s.currentBatsmanIdx += 1;
      if (s.currentBatsmanIdx < s.batsmanStats.length) s.batsmanStats[s.currentBatsmanIdx].status = 'batting';
      break;
    } else {
      s.totalRuns += batD;
      s.batsmanStats[s.currentBatsmanIdx].runs += batD;
      s.bowlerStats[bowlerRealIdx].runsConceded += batD;
      if (batD === 4) s.batsmanStats[s.currentBatsmanIdx].fours += 1;
      if (batD === 6) s.batsmanStats[s.currentBatsmanIdx].sixes += 1;
      result.runs = batD;
      s.currentOverBalls.push({ type: batD === 6 ? 'six' : batD === 4 ? 'four' : 'run', label: String(batD) });
      s.ballResults.push(result);
      log.push(`${overNum}.${ballInOver} • ${batsmanName}[${batD}] vs ${bowlerName}[${bowlD}] → ${batD} run${batD > 1 ? 's' : ''}`);
      if (s.innings === 2 && s.target !== null && s.totalRuns >= s.target) { chaseWon = true; break; }
      if (s.ballsInCurrentOver >= 6) {
        s = startNewOver(s);
        if (s.completedOvers >= s.maxOvers) { inningsOver = true; }
        break;
      }
    }
  }
  return { newState: s, log, inningsOver, chaseWon };
}

// ══════════════════════════════════════════════════════════════════════════
// CSS
// ══════════════════════════════════════════════════════════════════════════
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
.cst2 { font-family:'Inter',sans-serif; min-height:100%; background:#020617; }
.cst2-card { background:rgba(15,23,42,0.85); border:1px solid rgba(51,65,85,0.4); border-radius:20px; }
.neon-bat { box-shadow:0 0 0 1.5px rgba(16,185,129,0.5), 0 0 18px rgba(16,185,129,0.15); }
.score-glow-bg { position:relative; }
.score-glow-bg::before { content:''; position:absolute; inset:-30px; background:radial-gradient(ellipse at 30% 50%,rgba(16,185,129,0.14) 0%,transparent 70%); pointer-events:none; z-index:0; }
.score-glow-bg > * { position:relative; z-index:1; }
@keyframes cst2-lp { 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.7)} 50%{box-shadow:0 0 0 7px rgba(16,185,129,0)} }
.cst2-ld { animation:cst2-lp 1.4s ease-in-out infinite; }
.cst2-ball { width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:12px; flex-shrink:0; transition:transform .2s; }
.cst2-ball-empty { background:radial-gradient(circle at 38% 38%,#1a2e1c,#0d1a10); border:1.5px dashed rgba(71,85,105,0.35); }
@keyframes cst2-dp { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
.cst2-ball-empty { animation:cst2-dp 2s ease-in-out infinite; }
.cst2-ball-run { background:rgba(51,65,85,0.5); border:1.5px solid rgba(100,116,139,0.4); color:#94a3b8; }
.cst2-ball-four { background:linear-gradient(135deg,rgba(251,191,36,.18),rgba(245,158,11,.08)); border:1.5px solid rgba(251,191,36,.6); color:#fbbf24; box-shadow:0 0 14px rgba(251,191,36,.28); }
.cst2-ball-six { background:linear-gradient(135deg,rgba(245,158,11,.22),rgba(251,191,36,.12)); border:1.5px solid rgba(245,158,11,.8); color:#f59e0b; box-shadow:0 0 20px rgba(245,158,11,.38); }
@keyframes cst2-wp { 0%,100%{box-shadow:0 0 10px rgba(239,68,68,.4)} 50%{box-shadow:0 0 22px rgba(239,68,68,.7)} }
.cst2-ball-wicket { background:radial-gradient(circle,rgba(239,68,68,.22),rgba(127,0,0,.18)); border:1.5px solid rgba(239,68,68,.65); color:#f87171; animation:cst2-wp 1.5s ease-in-out infinite; }
.cst2-inp { background:rgba(255,255,255,0.04); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.08); color:#fff; font-family:'Inter',monospace; letter-spacing:.2em; font-weight:800; transition:border-color .25s,box-shadow .25s; outline:none; border-radius:14px; padding:12px 16px; font-size:18px; width:100%; }
.cst2-inp:focus { border-color:rgba(16,185,129,.6); box-shadow:0 0 0 3px rgba(16,185,129,.12); }
.cst2-inp.err { border-color:rgba(239,68,68,.6); box-shadow:0 0 0 3px rgba(239,68,68,.12); }
.cst2-btn { background:linear-gradient(135deg,#10b981,#059669); color:#fff; font-weight:800; border:none; border-radius:14px; cursor:pointer; font-size:13px; transition:opacity .2s,transform .15s; box-shadow:0 4px 20px rgba(16,185,129,.28); display:flex; align-items:center; justify-content:center; gap:6px; }
.cst2-btn:active { transform:scale(.95); }
.cst2-btn:disabled { opacity:.6; cursor:not-allowed; }
.cst2-btn-danger { background:linear-gradient(135deg,#ef4444,#dc2626); }
.cst2-btn-slate { background:linear-gradient(135deg,#475569,#334155); box-shadow:none; }
.cst2-btn-amber { background:linear-gradient(135deg,#f59e0b,#d97706); box-shadow:0 4px 20px rgba(245,158,11,.2); }
.cst2-btn-indigo { background:linear-gradient(135deg,#6366f1,#4f46e5); box-shadow:0 4px 20px rgba(99,102,241,.2); }
.cst2-table { width:100%; border-collapse:collapse; font-size:12px; }
.cst2-table th { color:#475569; font-weight:700; font-size:10px; letter-spacing:.08em; text-transform:uppercase; padding:6px 8px; text-align:left; border-bottom:1px solid rgba(51,65,85,.5); }
.cst2-table td { padding:6px 8px; border-bottom:1px solid rgba(30,41,59,.5); color:#94a3b8; }
.cst2-table tr.active-bat td { color:#fff; background:rgba(16,185,129,.06); }
.cst2-table tr.out td { color:#475569; }
.cst2-setup-inp { background:rgba(255,255,255,0.04); border:1px solid rgba(51,65,85,.5); border-radius:10px; padding:8px 12px; color:#e2e8f0; font-size:13px; font-weight:600; width:100%; outline:none; font-family:'Inter',sans-serif; }
.cst2-setup-inp:focus { border-color:rgba(16,185,129,.5); }
@keyframes cst2-sp { to{transform:rotate(360deg)} }
.cst2-spin { animation:cst2-sp .7s linear infinite; }
.match-card { background:rgba(15,23,42,0.7); border:1px solid rgba(51,65,85,0.4); border-radius:18px; padding:16px; cursor:pointer; transition:all 0.2s; }
.match-card:hover { background:rgba(15,23,42,0.95); border-color:rgba(16,185,129,0.3); transform:translateY(-2px); box-shadow:0 8px 30px rgba(0,0,0,0.4); }
.match-card:active { transform:scale(.98); }
.add-player-btn { background:rgba(16,185,129,0.08); border:1.5px dashed rgba(16,185,129,0.3); border-radius:10px; padding:7px; cursor:pointer; color:#34d399; font-weight:800; font-size:18px; width:100%; display:flex; align-items:center; justify-content:center; transition:all .2s; }
.add-player-btn:hover { background:rgba(16,185,129,0.14); border-color:rgba(16,185,129,0.5); }
/* Forum posts */
.forum-post { border-radius:14px; padding:12px; margin-bottom:8px; }
.forum-post-bat { background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.2); }
.forum-post-bowl { background:rgba(99,102,241,0.06); border:1px solid rgba(99,102,241,0.2); }
.forum-post-text { background:rgba(15,23,42,0.6); border:1px solid rgba(51,65,85,0.3); }
.forum-post-hidden { background:rgba(30,41,59,0.3); border:1px dashed rgba(51,65,85,0.4); }
/* Modal */
.cst2-modal-bg { position:fixed; inset:0; background:rgba(2,6,23,0.85); backdrop-filter:blur(10px); z-index:200; display:flex; align-items:flex-end; justify-content:center; padding:0; }
.cst2-modal { background:rgba(15,23,42,0.98); border:1px solid rgba(51,65,85,0.6); border-radius:24px 24px 0 0; padding:24px 20px 32px; width:100%; max-width:540px; }
@media (min-width:600px) { .cst2-modal-bg { align-items:center; padding:20px; } .cst2-modal { border-radius:24px; } }
`;

// ══════════════════════════════════════════════════════════════════════════
// BALL BADGE
// ══════════════════════════════════════════════════════════════════════════
const BallBadge: React.FC<{ type: string; label: string }> = ({ type, label }) => (
  <div className={`cst2-ball cst2-ball-${type}`}>{label}</div>
);

// ══════════════════════════════════════════════════════════════════════════
// MATCH LIST PAGE
// ══════════════════════════════════════════════════════════════════════════
const MatchListPage: React.FC<{
  onNewMatch: () => void;
  onLoadMatch: (thread: CricketThread) => void;
  isAdmin: boolean;
}> = ({ onNewMatch, onLoadMatch, isAdmin }) => {
  const [matches, setMatches] = useState<CricketThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    forumService.fetchCricketMatches().then(threads => {
      setMatches(threads.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0)) as any);
      setLoading(false);
    });
  }, []);

  const statusColor = (phase: string | null) => {
    if (phase === 'live') return { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#34d399', label: '🔴 LIVE' };
    if (phase === 'innings_break') return { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#fbbf24', label: '⏸ BREAK' };
    if (phase === 'complete') return { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.25)', text: '#818cf8', label: '✅ DONE' };
    return { bg: 'rgba(51,65,85,0.1)', border: 'rgba(51,65,85,0.3)', text: '#64748b', label: '⏳ SETUP' };
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirmId === id) {
      await forumService.deleteThread(id);
      setMatches(prev => prev.filter(m => m.id !== id));
      setConfirmId(null);
    } else {
      setConfirmId(id);
    }
  };

  return (
    <div style={{ padding: '16px 14px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>🏏 Cricket Matches</h2>
          <p style={{ fontSize: 11, color: '#475569', margin: '3px 0 0', fontWeight: 600 }}>{matches.length} match{matches.length !== 1 ? 'es' : ''} recorded</p>
        </div>
        {isAdmin && (
          <button className="cst2-btn" onClick={onNewMatch} style={{ padding: '10px 18px', fontSize: 13, borderRadius: 14, flexShrink: 0 }}>
            + New Match
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="cst2-spin" style={{ width: 28, height: 28, border: '3px solid rgba(16,185,129,.2)', borderTopColor: '#10b981', borderRadius: '50%', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Loading matches...</div>
        </div>
      ) : matches.length === 0 ? (
        <div className="cst2-card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏏</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#334155', marginBottom: 6 }}>No matches yet</div>
          <div style={{ fontSize: 12, color: '#1e293b', marginBottom: 18 }}>
            {isAdmin ? 'Start a new match to see it here' : 'No matches have been created yet. Check back soon!'}
          </div>
          {isAdmin && (
            <button className="cst2-btn" onClick={onNewMatch} style={{ padding: '12px 24px', margin: '0 auto' }}>Start First Match</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {matches.map(sm => {
            const st = statusColor(sm.cricketMatchPhase);
            const m = sm.cricketMatchData;
            return (
              <div key={sm.id} className="match-card" onClick={() => onLoadMatch(sm)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: st.text, background: st.bg, border: `1px solid ${st.border}`, borderRadius: 99, padding: '3px 10px' }}>
                    {st.label}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: '#334155', fontWeight: 600 }}>
                      {new Date(sm.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isAdmin && (
                      confirmId === sm.id ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={e => handleDelete(e, sm.id)} style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', color: '#fca5a5', fontSize: 10, fontWeight: 800 }}>Confirm</button>
                          <button onClick={e => { e.stopPropagation(); setConfirmId(null); }} style={{ background: 'rgba(51,65,85,0.4)', border: '1px solid rgba(51,65,85,0.8)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', color: '#94a3b8', fontSize: 10, fontWeight: 800 }}>Cancel</button>
                        </div>
                      ) : (
                        <button onClick={e => handleDelete(e, sm.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '3px 8px', cursor: 'pointer', color: '#f87171', fontSize: 11, fontWeight: 800 }}>✕ Delete</button>
                      )
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{sm.cricketTeam1Name || 'Team 1'}</div>
                    {m && m.inn1Runs > 0 && <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Inn 1: {m.inn1Runs}/{m.inn1Wickets}</div>}
                  </div>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#334155', letterSpacing: '.08em' }}>VS</div>
                    {m && m.innings === 2 && m.target && (
                      <div style={{ fontSize: 9, color: '#fbbf24', fontWeight: 700, marginTop: 2 }}>T: {m.target}</div>
                    )}
                  </div>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#cbd5e1', marginBottom: 2 }}>{sm.cricketTeam2Name || 'Team 2'}</div>
                  </div>
                </div>
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(30,41,59,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    {m ? (
                      <>
                        <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{m.totalRuns}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(16,185,129,0.7)' }}>/{m.totalWickets}</span>
                        <span style={{ fontSize: 10, color: '#334155', fontWeight: 700, marginLeft: 8 }}>({overStr(m)} ov)</span>
                      </>
                    ) : <span style={{ fontSize: 11, color: '#334155' }}>Match starting...</span>}
                  </div>
                  {sm.cricketMatchWinner && <div style={{ fontSize: 11, fontWeight: 800, color: '#fbbf24' }}>🏆 {sm.cricketMatchWinner.split(' won')[0]} won</div>}
                  {sm.cricketMatchPhase === 'live' && (
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span className="cst2-ld" style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                      Open Live →
                    </div>
                  )}
                  {sm.cricketMatchPhase === 'complete' && !sm.cricketMatchWinner && (
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>View Scorecard →</div>
                  )}
                </div>
                {sm.title && (
                  <div style={{ marginTop: 8, fontSize: 11, color: '#64748b', fontWeight: 600, fontStyle: 'italic' }}>
                    Forum: {sm.title}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// SETUP PHASE
// ══════════════════════════════════════════════════════════════════════════
const PlayerRows: React.FC<{
  players: Player[]; label: string; accentColor: string;
  onChange: (players: Player[]) => void;
}> = ({ players, label, accentColor, onChange }) => {
  const update = (i: number, f: keyof Player, v: string) => {
    const next = [...players]; next[i] = { ...next[i], [f]: v }; onChange(next);
  };
  const add = () => onChange([...players, emptyPlayer()]);
  const remove = (i: number) => { if (players.length > 1) onChange(players.filter((_, x) => x !== i)); };

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: accentColor, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      {players.map((p, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <div style={{ width: 22, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#334155', flexShrink: 0 }}>{i + 1}</div>
          <input className="cst2-setup-inp" placeholder="Player name" value={p.name}
            onChange={e => update(i, 'name', e.target.value)} style={{ flex: 2 }} />
          <input className="cst2-setup-inp" placeholder="forum.com/profile/id" value={p.profileUrl}
            onChange={e => update(i, 'profileUrl', e.target.value)} style={{ flex: 3, fontSize: 11 }} />
          {players.length > 1 && (
            <button onClick={() => remove(i)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '0 8px', cursor: 'pointer', color: '#f87171', fontSize: 14, fontWeight: 900, flexShrink: 0 }}>×</button>
          )}
        </div>
      ))}
      <button className="add-player-btn" onClick={add}>
        <span style={{ fontSize: 13, fontWeight: 800 }}>+ Add {label.split(' ')[0]}</span>
      </button>
    </div>
  );
};

const SetupPhase: React.FC<{ onStart: (t1: TeamSetup, t2: TeamSetup, o: number) => void; onBack: () => void; }> = ({ onStart, onBack }) => {
  const [t1name, setT1name] = useState('Team 1');
  const [t2name, setT2name] = useState('Team 2');
  const [t1bat, setT1bat] = useState<Player[]>([emptyPlayer()]);
  const [t1bow, setT1bow] = useState<Player[]>([emptyPlayer()]);
  const [t2bat, setT2bat] = useState<Player[]>([emptyPlayer()]);
  const [t2bow, setT2bow] = useState<Player[]>([emptyPlayer()]);
  const [maxOvers, setMaxOvers] = useState(5);
  const [err, setErr] = useState('');
  const [creating, setCreating] = useState(false);

  const handleStart = () => {
    const vt1b = t1bat.filter(p => p.name.trim()), vt1bw = t1bow.filter(p => p.name.trim());
    const vt2b = t2bat.filter(p => p.name.trim()), vt2bw = t2bow.filter(p => p.name.trim());
    if (!t1name.trim() || !t2name.trim()) return setErr('Both team names required.');
    if (vt1b.length < 2) return setErr('Team 1 needs at least 2 batsmen.');
    if (vt2b.length < 2) return setErr('Team 2 needs at least 2 batsmen.');
    if (vt1bw.length < 1) return setErr('Team 1 needs at least 1 bowler.');
    if (vt2bw.length < 1) return setErr('Team 2 needs at least 1 bowler.');
    setErr('');
    setCreating(true);
    onStart({ name: t1name, batsmen: t1bat, bowlers: t1bow }, { name: t2name, batsmen: t2bat, bowlers: t2bow }, maxOvers);
  };

  return (
    <div style={{ padding: '16px 14px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button className="cst2-btn cst2-btn-slate" onClick={onBack} style={{ padding: '8px 14px', fontSize: 12 }}>← Back</button>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>New Match Setup</h2>
          <p style={{ fontSize: 11, color: '#475569', margin: 0, fontWeight: 600 }}>A Forum Thread will be created for this match</p>
        </div>
      </div>

      <div className="cst2-card" style={{ padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1' }}>Max Overs</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {[2, 3, 4, 5, 6].map(o => (
            <button key={o} className="cst2-btn" onClick={() => setMaxOvers(o)}
              style={{ padding: '6px 14px', fontSize: 13, background: maxOvers === o ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(51,65,85,0.6)', boxShadow: 'none' }}>{o}</button>
          ))}
        </div>
      </div>

      <div className="cst2-card" style={{ padding: '14px 14px 8px', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', flexShrink: 0 }} />
          <input className="cst2-setup-inp" value={t1name} onChange={e => setT1name(e.target.value)} placeholder="Team 1 Name" style={{ flex: 1, fontSize: 15, fontWeight: 800 }} />
          <span style={{ fontSize: 9, fontWeight: 800, color: '#34d399', letterSpacing: '.1em' }}>BATTING 1ST</span>
        </div>
        <PlayerRows players={t1bat} label="Batsmen" accentColor="#34d399" onChange={setT1bat} />
        <PlayerRows players={t1bow} label="Bowlers" accentColor="#818cf8" onChange={setT1bow} />
      </div>

      <div style={{ textAlign: 'center', padding: '4px 0', fontSize: 12, fontWeight: 900, color: '#334155', letterSpacing: '.2em' }}>— VS —</div>

      <div className="cst2-card" style={{ padding: '14px 14px 8px', marginTop: 10, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#818cf8', flexShrink: 0 }} />
          <input className="cst2-setup-inp" value={t2name} onChange={e => setT2name(e.target.value)} placeholder="Team 2 Name" style={{ flex: 1, fontSize: 15, fontWeight: 800 }} />
          <span style={{ fontSize: 9, fontWeight: 800, color: '#818cf8', letterSpacing: '.1em' }}>BOWLING 1ST</span>
        </div>
        <PlayerRows players={t2bat} label="Batsmen" accentColor="#34d399" onChange={setT2bat} />
        <PlayerRows players={t2bow} label="Bowlers" accentColor="#818cf8" onChange={setT2bow} />
      </div>

      {err && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#fca5a5', fontWeight: 600 }}>⚠️ {err}</div>}

      <button className="cst2-btn" onClick={handleStart} disabled={creating} style={{ width: '100%', padding: 15, fontSize: 15, borderRadius: 16 }}>
        {creating ? (
          <><div className="cst2-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> Creating Match...</>
        ) : '🏏 Start Match'}
      </button>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// DIGIT INPUT MODAL
// ══════════════════════════════════════════════════════════════════════════
const DigitModal: React.FC<{
  type: 'bat' | 'bowl';
  needed: number;
  onSubmit: (digits: string) => void;
  onClose: () => void;
  processing: boolean;
}> = ({ type, needed, onSubmit, onClose, processing }) => {
  const [val, setVal] = useState('');
  const [err, setErr] = useState('');

  const handle = (v: string) => {
    const c = sanitize(v);
    if (c !== v) setErr('Only digits 1, 2, 3, 4, 6 allowed');
    else setErr('');
    setVal(c.slice(0, needed));
  };

  const submit = () => {
    if (val.length !== needed) return setErr(`Need exactly ${needed} digits (1,2,3,4,6)`);
    onSubmit(val);
  };

  const accent = type === 'bat' ? '#34d399' : '#818cf8';
  const label = type === 'bat' ? '🏏 Batsman Digits' : '🎯 Bowler Digits';

  return (
    <div className="cst2-modal-bg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cst2-modal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{label}</div>
            <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginTop: 3 }}>Enter {needed} digit{needed > 1 ? 's' : ''} for this over</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(51,65,85,0.4)', border: '1px solid rgba(51,65,85,0.8)', borderRadius: 10, width: 32, height: 32, cursor: 'pointer', color: '#94a3b8', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <div style={{ background: 'rgba(30,41,59,0.5)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: '#475569', fontWeight: 800, marginBottom: 6, letterSpacing: '.1em', textTransform: 'uppercase' }}>Allowed digits per ball</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['1','2','3','4','6'].map(d => (
              <div key={d} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(51,65,85,0.4)', border: '1px solid rgba(71,85,105,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: accent }}>{d}</div>
            ))}
          </div>
        </div>

        <input
          className={`cst2-inp${err ? ' err' : ''}`}
          value={val}
          onChange={e => handle(e.target.value)}
          placeholder={`e.g. ${Array(needed).fill(0).map(() => ['1','2','3','4','6'][Math.floor(Math.random()*5)]).join('')}`}
          autoFocus
          style={{ marginBottom: 8 }}
        />
        {err && <div style={{ fontSize: 11, color: '#f87171', fontWeight: 600, marginBottom: 10 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, textAlign: 'center', padding: '8px 0', background: 'rgba(30,41,59,0.4)', borderRadius: 10 }}>
            <div style={{ fontSize: 9, color: '#475569', fontWeight: 800, marginBottom: 2 }}>BALLS LEFT</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: accent }}>{needed}</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: '8px 0', background: 'rgba(30,41,59,0.4)', borderRadius: 10 }}>
            <div style={{ fontSize: 9, color: '#475569', fontWeight: 800, marginBottom: 2 }}>ENTERED</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: val.length === needed ? '#34d399' : '#64748b' }}>{val.length}/{needed}</div>
          </div>
        </div>

        <button
          className="cst2-btn"
          onClick={submit}
          disabled={processing || val.length !== needed}
          style={{ width: '100%', padding: 14, fontSize: 14, borderRadius: 14, marginTop: 16, background: `linear-gradient(135deg,${accent},${type === 'bat' ? '#059669' : '#4f46e5'})` }}
        >
          {processing ? (
            <><div className="cst2-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> Posting...</>
          ) : `📤 Submit ${label}`}
        </button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// SCORECARD TABLES
// ══════════════════════════════════════════════════════════════════════════
const ScorecardBatTable: React.FC<{ stats: BatsmanStat[]; teamName: string; innLabel: string; score: string }> = ({ stats, teamName, innLabel, score }) => (
  <div className="cst2-card" style={{ padding: '12px 14px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <div>
        <div style={{ fontSize: 9, fontWeight: 800, color: '#475569', letterSpacing: '.12em', textTransform: 'uppercase' }}>{innLabel} · Batting</div>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', marginTop: 2 }}>{teamName}</div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{score}</div>
    </div>
    <table className="cst2-table">
      <thead><tr><th style={{ width: '40%' }}>Batsman</th><th>Status</th><th>R</th><th>B</th><th>SR</th><th>4s</th><th>6s</th></tr></thead>
      <tbody>
        {stats.map((s, i) => {
          const sr = s.balls > 0 ? ((s.runs / s.balls) * 100).toFixed(0) : '0';
          return (
            <tr key={i} className={s.status === 'batting' ? 'active-bat' : s.status === 'out' ? 'out' : ''}>
              <td><a href={s.player.profileUrl || '#'} target="_blank" rel="noreferrer" style={{ color: s.status === 'batting' ? '#34d399' : s.status === 'out' ? '#e2e8f0' : '#475569', fontWeight: 700, textDecoration: 'none', fontSize: 12 }}>{s.player.name}</a></td>
              <td style={{ fontSize: 10, color: s.status === 'out' ? '#f87171' : s.status === 'batting' ? '#34d399' : '#334155', fontWeight: 700 }}>
                {s.status === 'out' ? 'c&b' : s.status === 'batting' ? '🏏 not out' : 'dnb'}
              </td>
              <td style={{ fontWeight: 900, color: s.runs >= 50 ? '#fbbf24' : s.status === 'batting' ? '#fff' : '#94a3b8', fontSize: s.runs >= 50 ? 13 : 12 }}>
                {s.runs}{s.runs >= 50 ? (s.runs >= 100 ? '💯' : '⭐') : ''}
              </td>
              <td>{s.balls}</td>
              <td style={{ color: '#64748b', fontSize: 11 }}>{sr}</td>
              <td style={{ color: '#fbbf24', fontWeight: 700 }}>{s.fours || '—'}</td>
              <td style={{ color: '#f59e0b', fontWeight: 700 }}>{s.sixes || '—'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const ScorecardBowlTable: React.FC<{ stats: BowlerStat[]; teamName: string }> = ({ stats, teamName }) => (
  <div style={{ marginTop: 4 }}>
    <div style={{ fontSize: 9, fontWeight: 800, color: '#475569', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 2 }}>Bowling — {teamName}</div>
    <table className="cst2-table">
      <thead><tr><th style={{ width: '40%' }}>Bowler</th><th>O</th><th>R</th><th>W</th><th>Econ</th></tr></thead>
      <tbody>
        {stats.map((s, i) => {
          const econ = s.ballsBowled > 0 ? ((s.runsConceded / s.ballsBowled) * 6).toFixed(1) : '—';
          return (
            <tr key={i}>
              <td><a href={s.player.profileUrl || '#'} target="_blank" rel="noreferrer" style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none', fontSize: 12 }}>{s.player.name}</a></td>
              <td>{Math.floor(s.ballsBowled / 6)}.{s.ballsBowled % 6}</td>
              <td>{s.runsConceded}</td>
              <td style={{ fontWeight: 900, color: s.wickets > 0 ? '#f87171' : '#94a3b8', fontSize: s.wickets >= 3 ? 13 : 12 }}>
                {s.wickets}{s.wickets >= 5 ? '🔥' : s.wickets >= 3 ? '⚡' : ''}
              </td>
              <td style={{ color: parseFloat(econ) < 6 ? '#34d399' : parseFloat(econ) > 10 ? '#f87171' : '#94a3b8', fontWeight: 700, fontSize: 11 }}>{econ}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════
// FORUM POST CARD
// ══════════════════════════════════════════════════════════════════════════
const ForumPostCard: React.FC<{
  post: CricketForumPost;
  isHost: boolean;
  currentUserId: string;
}> = ({ post, isHost, currentUserId }) => {
  const isOwn = post.authorId === currentUserId;
  const isDigitPost = post.postType === 'bat_digit' || post.postType === 'bowl_digit';
  const canSeeContent = !post._isHiddenFromViewer || isHost || isOwn;
  const isBat = post.postType === 'bat_digit';

  return (
    <div className={`forum-post ${isDigitPost ? (isBat ? 'forum-post-bat' : 'forum-post-bowl') : post._isHiddenFromViewer ? 'forum-post-hidden' : 'forum-post-text'}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img
            src={post.authorAvatar || 'https://picsum.photos/seed/anon/200'}
            alt={post.authorName}
            style={{ width: 26, height: 26, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(51,65,85,0.5)' }}
            onError={e => { (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/anon/200'; }}
          />
          <div>
            <span style={{ fontSize: 11, fontWeight: 800, color: isBat ? '#34d399' : post.postType === 'bowl_digit' ? '#818cf8' : '#cbd5e1' }}>
              {post.authorName}
            </span>
            {isDigitPost && (
              <span style={{ fontSize: 9, fontWeight: 700, color: '#475569', marginLeft: 6, background: 'rgba(51,65,85,0.4)', padding: '1px 6px', borderRadius: 4 }}>
                {isBat ? '🏏 Bat' : '🎯 Bowl'}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {post.overNum && (
            <span style={{ fontSize: 9, color: '#334155', fontWeight: 700 }}>Over {post.overNum}</span>
          )}
          {post.isHidden && (
            <span style={{ fontSize: 9, fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', padding: '1px 6px', borderRadius: 4 }}>
              🔒 Hidden
            </span>
          )}
          <span style={{ fontSize: 9, color: '#475569', fontWeight: 600 }}>{tsAgo(post.timestamp)}</span>
        </div>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: 8 }}>
        {canSeeContent ? (
          isDigitPost ? (
            <span style={{ fontFamily: 'monospace', letterSpacing: '.3em', fontWeight: 900, fontSize: 18, color: isBat ? '#34d399' : '#818cf8' }}>
              {post.content}
            </span>
          ) : (
            <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{post.content}</span>
          )
        ) : (
          <span style={{ fontSize: 12, color: '#475569', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 6 }}>
            🔒 <span>This post is hidden until the match creator reveals it</span>
          </span>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// LIVE PHASE
// ══════════════════════════════════════════════════════════════════════════
const LivePhase: React.FC<{
  match: CricketMatchState;
  threadId: string;
  user: any;
  isHost: boolean;
  onMatchUpdate: (m: CricketMatchState) => void;
  onInningsEnd: (m: CricketMatchState) => void;
  onChaseWon: (m: CricketMatchState) => void;
}> = ({ match, threadId, user, isHost, onMatchUpdate, onInningsEnd, onChaseWon }) => {
  const [processing, setProcessing] = useState(false);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [forumPosts, setForumPosts] = useState<CricketForumPost[]>([]);
  const [textPost, setTextPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const postsEndRef = useRef<HTMLDivElement>(null);
  // Combined dual-input state
  const [batInput, setBatInput] = useState('');
  const [bowlInput, setBowlInput] = useState('');
  const [inputErr, setInputErr] = useState('');

  const needed = ballNeeded(match);
  const batsman = getBatsman(match);
  const bowler = getBowler(match);
  const currentOverNum = match.completedOvers + 1;

  const currentUserId = user?.id || user?.userId || '';
  const currentUserObj = user ? {
    id: currentUserId,
    name: user.name || user.username,
    username: user.username || user.name,
    avatar: user.avatar || '',
    ap: user.ap || 0,
    totalAp: user.totalAp || 0,
  } : null;

  // Load forum posts
  const loadPosts = useCallback(async (silent = false) => {
    if (!threadId) return;
    if (!silent) setLoadingPosts(true);
    try {
      const posts = await forumService.fetchPosts(threadId, currentUserId);
      // Filter: only show cricket posts (bat_digit, bowl_digit, text) not system
      const cricketPosts = posts.filter((p: any) => p.postType || p.content !== match.battingTeam.name) as unknown as CricketForumPost[];
      setForumPosts(cricketPosts.sort((a, b) => b.timestamp - a.timestamp));
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoadingPosts(false);
    }
  }, [threadId, currentUserId]);

  useEffect(() => {
    loadPosts();
    const interval = setInterval(() => loadPosts(true), 5000);
    return () => clearInterval(interval);
  }, [loadPosts]);

  // Check if digits already posted for this over
  const batAlreadyPosted = forumPosts.some(p => p.postType === 'bat_digit' && p.overNum === currentOverNum);
  const bowlAlreadyPosted = forumPosts.some(p => p.postType === 'bowl_digit' && p.overNum === currentOverNum);
  const canProcess = match.pendingBatDigits && match.pendingBowlDigits;

  const overDisplay = [
    ...match.currentOverBalls.filter(b => b.type !== 'empty'),
    ...Array(Math.max(0, 6 - match.currentOverBalls.filter(b => b.type !== 'empty').length)).fill({ type: 'empty', label: '' }),
  ];

  const vb = match.bowlingTeam.bowlers.filter(b => b.name.trim());
  const curBowlerStat = match.bowlerStats[match.currentBowlerIdx % vb.length];

  // Submit both bat + bowl digits together
  const handleBothSubmit = async () => {
    if (!currentUserObj) return;
    setInputErr('');
    const cleanBat = sanitize(batInput);
    const cleanBowl = sanitize(bowlInput);
    if (cleanBat.length !== needed) return setInputErr(`Batting: need exactly ${needed} digits (1,2,3,4,6)`);
    if (cleanBowl.length !== needed) return setInputErr(`Bowling: need exactly ${needed} digits (1,2,3,4,6)`);
    if (cleanBat !== batInput || cleanBowl !== bowlInput) return setInputErr('Only digits 1, 2, 3, 4, 6 are allowed.');
    setProcessing(true);
    try {
      const [batPost, bowlPost] = await Promise.all([
        forumService.createHiddenPost(threadId, currentUserObj as any, cleanBat, 'bat_digit', currentOverNum),
        forumService.createHiddenPost(threadId, currentUserObj as any, cleanBowl, 'bowl_digit', currentOverNum),
      ]);
      const withDigits = { ...match, pendingBatDigits: cleanBat, pendingBatPostId: batPost.id, pendingBowlDigits: cleanBowl, pendingBowlPostId: bowlPost.id };
      // Immediately reveal and process
      await forumService.revealOverPosts(threadId, currentOverNum);
      const { newState, log, inningsOver, chaseWon } = processTurn(withDigits, cleanBat, cleanBowl);
      newState.pendingBatDigits = null;
      newState.pendingBowlDigits = null;
      newState.pendingBatPostId = null;
      newState.pendingBowlPostId = null;
      newState.pendingOverNum = null;
      setBatInput('');
      setBowlInput('');
      setEventLog(prev => [...log, ...prev].slice(0, 60));
      await loadPosts(true);
      if (chaseWon) onChaseWon(newState);
      else if (inningsOver) onInningsEnd(newState);
      else onMatchUpdate(newState);
    } catch (e) {
      console.error(e);
      setInputErr('Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  };



  // Post a text message
  const handleTextPost = async () => {
    if (!textPost.trim() || !currentUserObj) return;
    setPosting(true);
    try {
      await forumService.createPost(threadId, currentUserObj as any, textPost.trim(), currentUserObj.ap || 0, currentUserObj.totalAp || 0);
      setTextPost('');
      await loadPosts(true);
    } catch (e) {
      console.error(e);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px 24px' }}>

      {/* SCORE HEADER */}
      <div className="cst2-card score-glow-bg" style={{ overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(5,150,105,0.35) 0%,rgba(15,23,42,0.9) 60%)', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800, color: '#34d399' }}>
              <span className="cst2-ld" style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
              INNINGS {match.innings} · LIVE
            </span>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#334155' }}>
              {overStr(match)} / {match.maxOvers} overs
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div className="neon-bat" style={{ flex: 1, textAlign: 'center', padding: '7px 10px', borderRadius: 14, background: 'rgba(6,78,59,0.35)' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{match.battingTeam.name}</div>
              <div style={{ fontSize: 9, color: '#34d399', fontWeight: 800, letterSpacing: '.12em' }}>BATTING</div>
            </div>
            <div style={{ width: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: 'rgba(100,116,139,0.4)', fontStyle: 'italic' }}>VS</div>
            <div style={{ flex: 1, textAlign: 'center', padding: '7px 10px', borderRadius: 14, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(51,65,85,.3)' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#cbd5e1' }}>{match.bowlingTeam.name}</div>
              <div style={{ fontSize: 9, color: '#475569', fontWeight: 800, letterSpacing: '.12em' }}>BOWLING</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                <span style={{ fontSize: 50, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.04em' }}>{match.totalRuns}</span>
                <span style={{ fontSize: 24, fontWeight: 900, color: 'rgba(16,185,129,.7)' }}>/{match.totalWickets}</span>
              </div>
              {match.innings === 2 && match.target !== null && (
                <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700, marginTop: 3 }}>
                  Target {match.target} · Need {Math.max(0, match.target - match.totalRuns)} more
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[{ l: 'Extras', v: '0', c: '#34d399', bg: 'rgba(16,185,129,.08)', bc: 'rgba(16,185,129,.2)' },
                { l: match.innings === 2 ? 'Target' : 'Inn 1', v: match.innings === 2 ? String(match.target) : '--', c: '#fbbf24', bg: 'rgba(245,158,11,.08)', bc: 'rgba(245,158,11,.2)' },
              ].map(b => (
                <div key={b.l} style={{ borderRadius: 12, padding: '8px 10px', background: b.bg, border: `1px solid ${b.bc}`, textAlign: 'center', minWidth: 50 }}>
                  <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.1em', color: '#475569', marginBottom: 3 }}>{b.l.toUpperCase()}</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: b.c }}>{b.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* NOTICE BOARD */}
      <div className="cst2-card" style={{ padding: '12px 14px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
        <div style={{ fontSize: 9, fontWeight: 900, color: '#059669', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 6 }}>📢 Notice Board</div>
        {batsman && bowler ? (
          <p style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
            <a href={batsman.profileUrl || '#'} target="_blank" rel="noreferrer" style={{ color: '#34d399', fontWeight: 800, textDecoration: 'none' }}>{batsman.name}</a>
            {' '}এবং{' '}
            <a href={bowler.profileUrl || '#'} target="_blank" rel="noreferrer" style={{ color: '#818cf8', fontWeight: 800, textDecoration: 'none' }}>{bowler.name}</a>
            {', আপনারা বাকি '}
            <span style={{ color: '#fbbf24', fontWeight: 900 }}>{needed}টি</span>
            {' বলের পোস্ট সাবমিট করুন।'}
          </p>
        ) : (
          <p style={{ fontSize: 13, color: '#ef4444', fontWeight: 700, margin: 0 }}>⚠️ All batsmen are out — Innings over!</p>
        )}
      </div>

      {/* PLAYER CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'Batsman', player: batsman, accent: 'rgba(16,185,129,.1)', border: 'rgba(16,185,129,.22)', tc: '#34d399',
            sub: batsman ? (() => { const s = match.batsmanStats.find(b => b.player.name === batsman.name); return s ? `${s.runs}(${s.balls}) · ${s.fours}×4 ${s.sixes}×6` : ''; })() : '' },
          { label: 'Bowler', player: bowler, accent: 'rgba(99,102,241,.08)', border: 'rgba(99,102,241,.2)', tc: '#818cf8',
            sub: curBowlerStat ? `${curBowlerStat.wickets}W-${curBowlerStat.runsConceded}R` : '' },
        ].map(({ label, player, accent, border, tc, sub }) => (
          <div key={label} style={{ background: accent, border: `1px solid ${border}`, borderRadius: 14, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: tc, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
            {player ? (
              <>
                <a href={player.profileUrl || '#'} target="_blank" rel="noreferrer"
                  style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'block', textDecoration: 'none', marginBottom: 2 }}>{player.name}</a>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{sub}</div>
              </>
            ) : <div style={{ fontSize: 12, color: '#334155' }}>—</div>}
          </div>
        ))}
      </div>

      {/* BALL TRACKER */}
      <div className="cst2-card" style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: '#334155', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 8 }}>
          Over {match.completedOvers + 1}
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
          {overDisplay.map((b, i) => <BallBadge key={i} type={b.type} label={b.label} />)}
        </div>
      </div>

      {/* HOST CONTROLS — combined dual input */}
      {isHost && batsman && bowler && (
        <div className="cst2-card" style={{ padding: '16px', border: '1px solid rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.04)' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 900, color: '#d97706', letterSpacing: '.15em', textTransform: 'uppercase' }}>🎛️ Host Post — Over {currentOverNum}</div>
              <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginTop: 3 }}>Enter batting & bowling digits together · {needed} ball{needed !== 1 ? 's' : ''} left this over</div>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '5px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#78350f', fontWeight: 800, letterSpacing: '.08em' }}>BALLS LEFT</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>{needed}</div>
            </div>
          </div>

          {/* Allowed digits reminder */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {['1','2','3','4','6'].map(d => (
              <div key={d} style={{ flex: 1, height: 30, borderRadius: 8, background: 'rgba(51,65,85,0.4)', border: '1px solid rgba(71,85,105,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#94a3b8' }}>{d}</div>
            ))}
          </div>

          {/* Dual inputs side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {/* Batting input */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontWeight: 900, color: '#34d399', letterSpacing: '.1em', textTransform: 'uppercase' }}>🏏 Batting</span>
              </div>
              <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 6 }}>
                <a href={batsman.profileUrl || '#'} target="_blank" rel="noreferrer" style={{ color: '#34d399', textDecoration: 'none', fontWeight: 800 }}>{batsman.name}</a>
              </div>
              <input
                className={`cst2-inp${inputErr.includes('atting') ? ' err' : ''}`}
                value={batInput}
                maxLength={needed}
                placeholder={Array(needed).fill('·').join('')}
                onChange={e => { setBatInput(sanitize(e.target.value).slice(0, needed)); setInputErr(''); }}
                style={{ fontSize: 22, letterSpacing: '.35em', textAlign: 'center', padding: '12px 8px', borderColor: batInput.length === needed ? 'rgba(16,185,129,0.5)' : undefined }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 9, color: '#334155', fontWeight: 700 }}>digits entered</span>
                <span style={{ fontSize: 11, fontWeight: 900, color: batInput.length === needed ? '#34d399' : '#475569' }}>{batInput.length}/{needed}</span>
              </div>
            </div>

            {/* Divider */}
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#818cf8', flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontWeight: 900, color: '#818cf8', letterSpacing: '.1em', textTransform: 'uppercase' }}>🎯 Bowling</span>
              </div>
              <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 6 }}>
                <a href={bowler.profileUrl || '#'} target="_blank" rel="noreferrer" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 800 }}>{bowler.name}</a>
              </div>
              <input
                className={`cst2-inp${inputErr.includes('owling') ? ' err' : ''}`}
                value={bowlInput}
                maxLength={needed}
                placeholder={Array(needed).fill('·').join('')}
                onChange={e => { setBowlInput(sanitize(e.target.value).slice(0, needed)); setInputErr(''); }}
                style={{ fontSize: 22, letterSpacing: '.35em', textAlign: 'center', padding: '12px 8px', borderColor: bowlInput.length === needed ? 'rgba(99,102,241,0.5)' : undefined }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 9, color: '#334155', fontWeight: 700 }}>digits entered</span>
                <span style={{ fontSize: 11, fontWeight: 900, color: bowlInput.length === needed ? '#818cf8' : '#475569' }}>{bowlInput.length}/{needed}</span>
              </div>
            </div>
          </div>

          {/* Preview row — show digits as colour-coded balls */}
          {(batInput.length > 0 || bowlInput.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {[{ val: batInput, color: '#34d399', bg: 'rgba(16,185,129,0.08)', bc: 'rgba(16,185,129,0.2)' },
                { val: bowlInput, color: '#818cf8', bg: 'rgba(99,102,241,0.08)', bc: 'rgba(99,102,241,0.2)' }].map(({ val, color, bg, bc }, si) => (
                <div key={si} style={{ background: bg, border: `1px solid ${bc}`, borderRadius: 10, padding: '6px 10px' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {val.split('').map((d, i) => (
                      <div key={i} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(0,0,0,0.3)', border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color }}>{d}</div>
                    ))}
                    {Array(Math.max(0, needed - val.length)).fill(null).map((_, i) => (
                      <div key={'e'+i} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(0,0,0,0.15)', border: '1.5px dashed rgba(51,65,85,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#334155' }}>·</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error message */}
          {inputErr && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '8px 12px', marginBottom: 12, fontSize: 11, color: '#fca5a5', fontWeight: 700 }}>⚠️ {inputErr}</div>
          )}

          {/* Submit button */}
          <button
            className="cst2-btn"
            onClick={handleBothSubmit}
            disabled={processing || batInput.length !== needed || bowlInput.length !== needed}
            style={{ width: '100%', padding: 14, fontSize: 14, borderRadius: 14, background: batInput.length === needed && bowlInput.length === needed ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'rgba(51,65,85,0.5)', boxShadow: batInput.length === needed && bowlInput.length === needed ? '0 4px 20px rgba(245,158,11,0.3)' : 'none', transition: 'all 0.3s' }}
          >
            {processing ? (
              <><div className="cst2-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> Posting & Processing...</>
            ) : batInput.length === needed && bowlInput.length === needed ? (
              '⚡ Post Both & Process Over'
            ) : (
              `Fill both inputs (${needed} digits each)`
            )}
          </button>
        </div>
      )}

      {/* SCOREBOARD */}
      <div className="cst2-card" style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: '#334155', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 8 }}>📊 {match.battingTeam.name}</div>
        <table className="cst2-table">
          <thead><tr><th>Batsman</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th></th></tr></thead>
          <tbody>
            {match.batsmanStats.map((s, i) => (
              <tr key={i} className={s.status === 'batting' ? 'active-bat' : s.status === 'out' ? 'out' : ''}>
                <td><a href={s.player.profileUrl || '#'} target="_blank" rel="noreferrer" style={{ color: s.status === 'batting' ? '#34d399' : s.status === 'out' ? '#475569' : '#64748b', fontWeight: 700, textDecoration: 'none' }}>{s.player.name}</a></td>
                <td style={{ fontWeight: 800, color: s.status === 'batting' ? '#fff' : undefined }}>{s.runs}</td>
                <td>{s.balls}</td>
                <td style={{ color: '#fbbf24' }}>{s.fours}</td>
                <td style={{ color: '#f59e0b' }}>{s.sixes}</td>
                <td style={{ fontSize: 10, fontWeight: 700, color: s.status === 'batting' ? '#34d399' : s.status === 'out' ? '#ef4444' : '#334155' }}>
                  {s.status === 'batting' ? '🏏' : s.status === 'out' ? 'out' : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontSize: 9, fontWeight: 800, color: '#334155', letterSpacing: '.15em', textTransform: 'uppercase', margin: '12px 0 8px' }}>🎯 {match.bowlingTeam.name}</div>
        <table className="cst2-table">
          <thead><tr><th>Bowler</th><th>O</th><th>R</th><th>W</th></tr></thead>
          <tbody>
            {match.bowlerStats.map((s, i) => (
              <tr key={i}>
                <td><a href={s.player.profileUrl || '#'} target="_blank" rel="noreferrer" style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none' }}>{s.player.name}</a></td>
                <td>{Math.floor(s.ballsBowled / 6)}.{s.ballsBowled % 6}</td>
                <td>{s.runsConceded}</td>
                <td style={{ fontWeight: 800, color: s.wickets > 0 ? '#f87171' : undefined }}>{s.wickets}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FORUM THREAD SECTION */}
      <div className="cst2-card" style={{ padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: '#334155', letterSpacing: '.15em', textTransform: 'uppercase' }}>💬 Match Forum Thread</div>
          <button onClick={() => loadPosts(true)} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: 10, fontWeight: 800, cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>
            🔄 Refresh
          </button>
        </div>

        {/* Visibility hint */}
        <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '8px 12px', marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: '#d97706', fontWeight: 700 }}>
            {isHost
              ? '👁️ As host, you can see all hidden digit posts. Others see [Hidden] labels until you process the over.'
              : '🔒 Digit posts are hidden until the match creator processes the over and reveals them.'}
          </div>
        </div>

        {/* Posts list */}
        <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {loadingPosts ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div className="cst2-spin" style={{ width: 20, height: 20, border: '2px solid rgba(16,185,129,.2)', borderTopColor: '#10b981', borderRadius: '50%', margin: '0 auto' }} />
            </div>
          ) : forumPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#334155', fontSize: 12, fontStyle: 'italic' }}>No posts yet. Be the first to post!</div>
          ) : (
            forumPosts.map(post => (
              <ForumPostCard key={post.id} post={post} isHost={isHost} currentUserId={currentUserId} />
            ))
          )}
          <div ref={postsEndRef} />
        </div>

        {/* Text post input */}
        {currentUserObj && (
          <div style={{ marginTop: 12, borderTop: '1px solid rgba(51,65,85,0.4)', paddingTop: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#334155', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>Post a Message</div>
            <textarea
              value={textPost}
              onChange={e => setTextPost(e.target.value)}
              placeholder="Write a message in the match thread..."
              rows={2}
              style={{ width: '100%', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(51,65,85,0.6)', borderRadius: 10, padding: '8px 12px', color: '#f8fafc', fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
            />
            <button className="cst2-btn" onClick={handleTextPost} disabled={posting || !textPost.trim()} style={{ padding: '8px 16px', fontSize: 12, borderRadius: 10 }}>
              {posting ? 'Posting...' : '💬 Post Message'}
            </button>
          </div>
        )}
      </div>

      {/* BALL LOG */}
      {eventLog.length > 0 && (
        <div className="cst2-card" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#334155', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 8 }}>🔴 Ball Log</div>
          <div style={{ maxHeight: 110, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {eventLog.map((l, i) => (
              <div key={i} style={{ fontSize: 11, color: l.includes('WICKET') ? '#f87171' : '#475569', fontFamily: 'monospace', fontWeight: l.includes('WICKET') ? 800 : 500 }}>{l}</div>
            ))}
          </div>
        </div>
      )}


    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// INNINGS BREAK
// ══════════════════════════════════════════════════════════════════════════
const InningsBreak: React.FC<{ match: CricketMatchState; onStartInn2: () => void }> = ({ match, onStartInn2 }) => {
  const [secs, setSecs] = useState(INNINGS_BREAK_SEC);
  useEffect(() => {
    const id = setInterval(() => setSecs(p => { if (p <= 1) { clearInterval(id); onStartInn2(); return 0; } return p - 1; }), 1000);
    return () => clearInterval(id);
  }, []);
  const m = Math.floor(secs / 60), s = secs % 60;
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="cst2-card" style={{ padding: 20, textAlign: 'center', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#34d399', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 6 }}>🏏 1st Innings Complete</div>
        <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em' }}>{match.inn1Runs}<span style={{ fontSize: 24, color: 'rgba(16,185,129,.7)' }}>/{match.inn1Wickets}</span></div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{match.battingTeam.name} · {match.completedOvers} overs</div>
      </div>
      <div className="cst2-card" style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10 }}>2nd Innings শুরু হতে বাকি...</div>
        <div style={{ fontSize: 46, fontWeight: 900, color: '#fbbf24', letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
          {m < 10 ? '0' : ''}{m}:{s < 10 ? '0' : ''}{s}
        </div>
        <div style={{ fontSize: 11, color: '#475569', marginTop: 8, fontWeight: 600 }}>
          Target: <span style={{ color: '#fbbf24', fontWeight: 900 }}>{match.target}</span> · {match.bowlingTeam.name} ব্যাটিং করবে
        </div>
      </div>
      <button className="cst2-btn cst2-btn-slate" onClick={onStartInn2} style={{ padding: 13, fontSize: 13, borderRadius: 14 }}>Skip Break →</button>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// COMPLETE PHASE
// ══════════════════════════════════════════════════════════════════════════
const CompletePhase: React.FC<{ match: CricketMatchState; winner: string; onBack: () => void }> = ({ match, winner, onBack }) => {
  const inn1BatTeamName = match.inn1BattingTeamName || match.bowlingTeam.name;
  const inn1BowlTeamName = match.inn1BowlingTeamName || match.battingTeam.name;
  const inn1BatStats = match.inn1BatsmanStats || [];
  const inn1BowlStats = match.inn1BowlerStats || [];
  const inn2BatStats = match.batsmanStats;
  const inn2BowlStats = match.bowlerStats;
  const inn2BatTeamName = match.battingTeam.name;
  const inn2BowlTeamName = match.bowlingTeam.name;

  return (
    <div style={{ padding: '16px 14px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="cst2-card" style={{ padding: '20px 24px', textAlign: 'center', background: 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(6,78,59,0.22))', border: '1px solid rgba(16,185,129,0.35)' }}>
        <div style={{ fontSize: 34, marginBottom: 6 }}>🏆</div>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#34d399', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 6 }}>Match Result</div>
        <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', lineHeight: 1.4 }}>{winner}</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { l: '1st Innings', team: inn1BatTeamName, runs: match.inn1Runs, wkts: match.inn1Wickets, overs: match.maxOvers },
          { l: '2nd Innings', team: inn2BatTeamName, runs: match.totalRuns, wkts: match.totalWickets, overs: match.completedOvers },
        ].map((inn, i) => (
          <div key={i} style={{ flex: 1, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.4)', borderRadius: 16, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#475569', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>{inn.l}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>{inn.team}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
              {inn.runs}<span style={{ fontSize: 16, color: 'rgba(16,185,129,.7)' }}>/{inn.wkts}</span>
            </div>
            <div style={{ fontSize: 10, color: '#334155', fontWeight: 700, marginTop: 3 }}>{inn.overs} overs</div>
          </div>
        ))}
      </div>
      {inn1BatStats.length > 0 && (
        <>
          <ScorecardBatTable stats={inn1BatStats} teamName={inn1BatTeamName} innLabel="1st Innings" score={`${match.inn1Runs}/${match.inn1Wickets}`} />
          <div className="cst2-card" style={{ padding: '12px 14px' }}>
            <ScorecardBowlTable stats={inn1BowlStats} teamName={inn1BowlTeamName} />
          </div>
        </>
      )}
      <ScorecardBatTable stats={inn2BatStats} teamName={inn2BatTeamName} innLabel="2nd Innings" score={`${match.totalRuns}/${match.totalWickets}`} />
      <div className="cst2-card" style={{ padding: '12px 14px' }}>
        <ScorecardBowlTable stats={inn2BowlStats} teamName={inn2BowlTeamName} />
      </div>
      <button className="cst2-btn" onClick={onBack} style={{ padding: 13, fontSize: 13, borderRadius: 14, marginTop: 4 }}>← All Matches</button>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════════════
const CricketSystemTesting: React.FC = () => {
  const { user } = useOutletContext<any>() || { user: null };
  const [phase, setPhase] = useState<Phase>('list');
  const [match, setMatch] = useState<CricketMatchState | null>(null);
  const [threadId, setThreadId] = useState('');
  const [winner, setWinner] = useState('');
  const [saving, setSaving] = useState(false);

  const isHost = user?.role === 'admin' || user?.role === 'host';

  // Persist match state to forum thread
  const persist = useCallback(async (p: Phase, m: CricketMatchState, w = '') => {
    if (!threadId) return;
    try {
      await forumService.updateCricketMatch(
        threadId, m, p === 'live' ? 'live' : p === 'innings_break' ? 'innings_break' : 'complete',
        w, m.battingTeam.name, m.bowlingTeam.name
      );
    } catch (e) { console.error(e); }
  }, [threadId]);

  const handleStart = async (t1: TeamSetup, t2: TeamSetup, overs: number) => {
    setSaving(true);
    const m = buildMatchState(t1, t2, overs, 1, null, 0, 0);
    try {
      const title = `🏏 ${t1.name} vs ${t2.name} — ${overs} Overs`;
      const creator = {
        id: user?.id || 'admin',
        name: user?.name || user?.username || 'Host',
        username: user?.username || user?.name || 'Host',
        avatar: user?.avatar || 'https://picsum.photos/seed/host/200',
        ap: user?.ap || 0,
        totalAp: user?.totalAp || 0,
      };
      const resp = await forumService.createCricketMatchThread(title, m, creator as any, t1.name, t2.name);
      if (resp.threadId) {
        setThreadId(resp.threadId);
        setMatch(m);
        setPhase('live');
      }
    } catch (e) {
      console.error('Failed to create match thread:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleMatchUpdate = useCallback(async (m: CricketMatchState) => {
    setMatch(m);
    await persist('live', m);
  }, [persist]);

  const handleInningsEnd = useCallback(async (m: CricketMatchState) => {
    const fm = {
      ...m,
      inn1Runs: m.totalRuns,
      inn1Wickets: m.totalWickets,
      target: m.totalRuns + 1,
      inn1BatsmanStats: JSON.parse(JSON.stringify(m.batsmanStats)),
      inn1BowlerStats: JSON.parse(JSON.stringify(m.bowlerStats)),
      inn1BattingTeamName: m.battingTeam.name,
      inn1BowlingTeamName: m.bowlingTeam.name,
    };
    setMatch(fm);
    setPhase('innings_break');
    await persist('innings_break', fm);
  }, [persist]);

  const handleInningsEndFromLive = useCallback(async (m: CricketMatchState) => {
    if (m.innings === 2) {
      const won = m.totalRuns >= (m.target ?? 0)
        ? `🏆 ${m.battingTeam.name} won the match!`
        : `🏆 ${m.bowlingTeam.name} defended successfully by ${(m.target ?? 0) - m.totalRuns - 1} runs!`;
      setMatch(m); setWinner(won); setPhase('complete');
      await persist('complete', m, won);
      await forumService.revealAllPosts(threadId);
    } else {
      await handleInningsEnd(m);
    }
  }, [persist, threadId, handleInningsEnd]);

  const handleStartInn2 = useCallback(async () => {
    if (!match) return;
    const inn2 = buildMatchState(match.bowlingTeam, match.battingTeam, match.maxOvers, 2, match.target, match.inn1Runs, match.inn1Wickets);
    const fm = {
      ...inn2,
      inn1Runs: match.inn1Runs,
      inn1Wickets: match.inn1Wickets,
      target: match.target,
      inn1BatsmanStats: match.inn1BatsmanStats,
      inn1BowlerStats: match.inn1BowlerStats,
      inn1BattingTeamName: match.inn1BattingTeamName,
      inn1BowlingTeamName: match.inn1BowlingTeamName,
    };
    setMatch(fm); setPhase('live');
    await persist('live', fm);
  }, [match, persist]);

  const handleChaseWon = useCallback(async (m: CricketMatchState) => {
    const won = `🏆 ${m.battingTeam.name} won by chasing ${(m.target ?? 1) - 1} + 1 target!`;
    setMatch(m); setWinner(won); setPhase('complete');
    await persist('complete', m, won);
    await forumService.revealAllPosts(threadId);
  }, [persist, threadId]);

  const handleLoadMatch = (thread: CricketThread) => {
    setThreadId(thread.id);
    setMatch(thread.cricketMatchData);
    setWinner(thread.cricketMatchWinner || '');
    setPhase((thread.cricketMatchPhase as Phase) || 'live');
  };

  const goToList = () => setPhase('list');

  const phaseTitle: Record<Phase, string> = {
    list: 'All Matches', setup: 'New Match', live: 'Live Match',
    innings_break: 'Innings Break', complete: 'Match Result'
  };

  return (
    <div className="cst2">
      <style>{CSS}</style>

      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(30,41,59,0.6)', padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {phase !== 'list' && (
            <button className="cst2-btn cst2-btn-slate" onClick={goToList} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 10, boxShadow: 'none' }}>←</button>
          )}
          <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>🏏 {phaseTitle[phase]}</span>
          {phase === 'live' && <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 99, padding: '2px 8px' }}>LIVE</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {match && phase !== 'list' && phase !== 'setup' && (
            <span style={{ fontSize: 10, color: '#334155', fontWeight: 700, fontFamily: 'monospace' }}>Thread #{threadId}</span>
          )}
          {isHost && (
            <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 99, padding: '2px 8px' }}>HOST</span>
          )}
        </div>
      </div>

      {/* Phase Render */}
      {phase === 'list' && <MatchListPage onNewMatch={() => setPhase('setup')} onLoadMatch={handleLoadMatch} isAdmin={isHost} />}
      {phase === 'setup' && <SetupPhase onStart={handleStart} onBack={goToList} />}
      {phase === 'live' && match && (
        <LivePhase
          user={user}
          match={match}
          threadId={threadId}
          isHost={isHost}
          onMatchUpdate={handleMatchUpdate}
          onInningsEnd={handleInningsEndFromLive}
          onChaseWon={handleChaseWon}
        />
      )}
      {phase === 'innings_break' && match && <InningsBreak match={match} onStartInn2={handleStartInn2} />}
      {phase === 'complete' && match && <CompletePhase match={match} winner={winner} onBack={goToList} />}

      {saving && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10, zIndex: 999, fontSize: 13, color: '#34d399', fontWeight: 700 }}>
          <div className="cst2-spin" style={{ width: 14, height: 14, border: '2px solid rgba(16,185,129,.3)', borderTopColor: '#10b981', borderRadius: '50%' }} />
          Creating match forum thread...
        </div>
      )}
    </div>
  );
};

export default CricketSystemTesting;
