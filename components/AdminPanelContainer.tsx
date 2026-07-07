import React, { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE } from '../services/mongoService';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdminUser {
  id: string;
  username: string;
  name?: string;
  avatar?: string;
  role: 'admin' | 'moderator' | 'premium' | 'trusted_member' | 'starter' | 'user';
  balance_taka?: number;
  gold_coins?: number;
  goldenCoins?: number;
  silver_coins?: number;
  silverPoints?: number;
  plusses?: number;
  warning_level?: number;
  is_banned?: boolean;
  isBanned?: boolean;
  is_pm_banned?: boolean;
  is_shout_banned?: boolean;
  is_chat_banned?: boolean;
  last_ip?: string;
  browser_agent?: string;
  must_reset_password?: boolean;
  createdAt?: number;
  points?: number;
  level?: number;
  ap?: number;
  totalAp?: number;
}

interface ModerationLog {
  id: string;
  logId?: string;
  moderator_id: string;
  moderatorName?: string;
  target_user_id: string;
  targetUsername?: string;
  action_type: string;
  reason: string;
  timestamp: number;
}

interface SiteSettings {
  maintenance_mode: boolean;
  registration_open: boolean;
}

interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bg: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function fmtTime(ts: number): string {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  });
}

function pill(active: boolean) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '999px',
    fontSize: '0.6rem',
    fontWeight: 800,
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    background: active ? 'rgba(239,68,68,0.18)' : 'rgba(34,197,94,0.15)',
    color: active ? '#f87171' : '#4ade80',
    border: `1px solid ${active ? 'rgba(239,68,68,0.35)' : 'rgba(34,197,94,0.3)'}`,
  };
}

// ─── Write moderation log ─────────────────────────────────────────────────────
async function writeModerationLog(moderatorId: string, moderatorName: string, targetUserId: string, targetUsername: string, actionType: string, reason: string) {
  const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  await fetch(`${API_BASE}/admin/moderation-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      logId, moderator_id: moderatorId, moderatorName, target_user_id: targetUserId, targetUsername, action_type: actionType, reason, timestamp: Date.now()
    })
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

// Toggle Switch
function Toggle({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      style={{
        width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: on ? '#7c3aed' : '#374151', position: 'relative', transition: 'background 0.2s',
        opacity: disabled ? 0.5 : 1, flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: '3px', left: on ? '22px' : '3px',
        width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', display: 'block',
      }} />
    </button>
  );
}

// Section Header
function SectionHead({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1rem' }}>{icon}</span>
        <h2 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, color: '#e1e1e1', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>{title}</h2>
      </div>
      {sub && <p style={{ margin: '4px 0 0 28px', fontSize: '0.6rem', color: '#6b7280', fontFamily: 'monospace' }}>{sub}</p>}
    </div>
  );
}

// Admin-only badge overlay for restricted controls
function AdminOnly({ children, isAdmin }: { children: React.ReactNode; isAdmin: boolean }) {
  if (!isAdmin) {
    return (
      <div style={{ position: 'relative', opacity: 0.35, pointerEvents: 'none', userSelect: 'none' }}>
        {children}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <span style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', fontSize: '0.55rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.1em' }}>🔒 ADMIN ONLY</span>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

// ─── SystemAuditLogs ──────────────────────────────────────────────────────────
function SystemAuditLogs() {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchLogs = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/moderation-logs`);
        const data = await res.json();
        if (active) { setLogs(data); setLoading(false); }
      } catch (err: any) {
        if (active) { console.warn('Audit logs error:', err.message); setLoading(false); }
      }
    };
    fetchLogs();
    const int = setInterval(fetchLogs, 5000);
    return () => { active = false; clearInterval(int); };
  }, []);

  return (
    <div>
      <SectionHead icon="📋" title="System Audit Log" sub={`${logs.length} entries · Real-time`} />
      {loading ? (
        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.65rem', fontFamily: 'monospace', padding: '24px' }}>Loading logs…</div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.65rem', fontFamily: 'monospace', padding: '24px' }}>No moderation logs yet.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.6rem', fontFamily: 'monospace' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(124,58,237,0.3)' }}>
                {['Time', 'Staff', 'Target', 'Action', 'Reason'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: '#7c3aed', fontWeight: 800, letterSpacing: '0.1em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                  <td style={{ padding: '6px 8px', color: '#9ca3af', whiteSpace: 'nowrap' }}>{fmtTime(log.timestamp)}</td>
                  <td style={{ padding: '6px 8px', color: '#a78bfa', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {log.moderatorName || log.moderator_id.substring(0, 10)}
                  </td>
                  <td style={{ padding: '6px 8px', color: '#f9a8d4', whiteSpace: 'nowrap' }}>
                    {log.targetUsername || log.target_user_id.substring(0, 10)}
                  </td>
                  <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>
                    <span style={{
                      background: 'rgba(124,58,237,0.15)', color: '#a78bfa', padding: '2px 6px',
                      borderRadius: '4px', fontWeight: 800, letterSpacing: '0.05em',
                    }}>{log.action_type}</span>
                  </td>
                  <td style={{ padding: '6px 8px', color: '#d1d5db', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.reason}>{log.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── UserManagementTools ──────────────────────────────────────────────────────
function UserManagementTools({ currentUser, isAdmin, preSelectUser }: {
  currentUser: AdminUser;
  isAdmin: boolean;
  preSelectUser?: AdminUser | null;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [searchResults, setSearchResults] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(preSelectUser || null);
  const [actionReason, setActionReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);
  const [sameIpUsers, setSameIpUsers] = useState<AdminUser[]>([]);
  const [loadingIp, setLoadingIp] = useState(false);

  // Numeric input states
  const [warningLevel, setWarningLevel] = useState('');
  const [plusses, setPlusses] = useState('');
  const [takaBal, setTakaBal] = useState('');
  const [goldCoins, setGoldCoins] = useState('');
  const [silverCoins, setSilverCoins] = useState('');
  const [newRole, setNewRole] = useState('');

  // Load all users once
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE}/users`);
        const list = await res.json();
        setAllUsers(list);
      } catch (err: any) {
        console.warn('users error:', err.message);
      }
    };
    fetchUsers();
  }, []);

  // Search filter
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) { setSearchResults([]); return; }
    setSearchResults(
      allUsers.filter(u => (u.username || '').toLowerCase().includes(q) || (u.name || '').toLowerCase().includes(q)).slice(0, 12)
    );
  }, [searchQuery, allUsers]);

  // When a user is selected — pre-fill numeric inputs
  useEffect(() => {
    if (!selectedUser) return;
    setWarningLevel(String(selectedUser.warning_level ?? ''));
    setPlusses(String(selectedUser.plusses ?? ''));
    setTakaBal(String(selectedUser.balance_taka ?? ''));
    setGoldCoins(String(selectedUser.gold_coins ?? selectedUser.goldenCoins ?? ''));
    setSilverCoins(String(selectedUser.silver_coins ?? selectedUser.silverPoints ?? ''));
    setNewRole(selectedUser.role || 'user');
    setSameIpUsers([]);
  }, [selectedUser?.id]);

  function showFb(msg: string, ok = true) {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 3500);
  }

  function requireReason(): boolean {
    if (!actionReason.trim()) {
      showFb('⚠️ You must fill in the Action Reason first.', false);
      return false;
    }
    return true;
  }

  async function doAction(actionType: string, updates: Record<string, unknown>, successMsg: string) {
    if (!requireReason() || !selectedUser) return;
    setBusy(true);
    try {
      await fetch(`${API_BASE}/users/${selectedUser.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
      await writeModerationLog(currentUser.id, currentUser.username, selectedUser.id, selectedUser.username, actionType, actionReason);
      setSelectedUser(prev => prev ? { ...prev, ...updates } as AdminUser : prev);
      showFb(successMsg, true);
    } catch (err: any) {
      showFb(`Error: ${err.message}`, false);
    } finally {
      setBusy(false);
    }
  }

  async function handleBoot() {
    await doAction('FORCE_PASSWORD_RESET', { must_reset_password: true }, '✅ Password reset forced. User will be booted on next login.');
  }

  async function handlePurgeShouts() {
    if (!requireReason() || !selectedUser) return;
    setBusy(true);
    try {
      await fetch(`${API_BASE}/shouts/user/${selectedUser.id}`, { method: 'DELETE' });
      await writeModerationLog(currentUser.id, currentUser.username, selectedUser.id, selectedUser.username, 'PURGE_SHOUTS', actionReason);
      showFb(`✅ All shouts purged.`);
    } catch (err: any) {
      showFb(`Error: ${err.message}`, false);
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(field: keyof AdminUser) {
    if (!selectedUser) return;
    const currentVal = !!(selectedUser[field]);
    await doAction(
      `TOGGLE_${field.toUpperCase()}`,
      { [field]: !currentVal },
      `✅ ${field} set to ${!currentVal}`
    );
  }

  async function handleUpdateNumeric(field: string, rawValue: string, label: string) {
    if (!requireReason() || !selectedUser) return;
    const val = Number(rawValue);
    if (isNaN(val)) { showFb('Invalid number.', false); return; }
    await doAction(`UPDATE_${label.toUpperCase()}`, { [field]: val }, `✅ ${label} updated to ${val}`);
  }

  async function handleRoleChange() {
    if (!isAdmin) { showFb('🔒 Only Admins can change roles.', false); return; }
    if (!requireReason() || !selectedUser || !newRole) return;
    await doAction('ROLE_CHANGE', { role: newRole }, `✅ Role changed to "${newRole}"`);
  }

  async function handleIpLookup() {
    if (!selectedUser?.last_ip) { showFb('No IP address on file for this user.', false); return; }
    setLoadingIp(true);
    try {
      const res = await fetch(`${API_BASE}/users?last_ip=${selectedUser.last_ip}`);
      const snap = await res.json();
      const matches: AdminUser[] = snap.filter((d: any) => d.id !== selectedUser.id);
      setSameIpUsers(matches);
    } catch (err: any) {
      showFb(`IP Lookup Error: ${err.message}`, false);
    } finally {
      setLoadingIp(false);
    }
  }

  const isBanned = !!(selectedUser?.is_banned || selectedUser?.isBanned);

  return (
    <div>
      <SectionHead icon="🔧" title="User Management Tools" sub="Search → Select → Act · All actions are logged." />

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by username…"
          style={{
            width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(124,58,237,0.4)', borderRadius: '8px',
            color: '#e1e1e1', fontSize: '0.7rem', fontFamily: 'monospace',
            padding: '10px 14px', outline: 'none',
          }}
        />
        {searchResults.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
            background: '#131f25', border: '1px solid rgba(124,58,237,0.4)',
            borderRadius: '8px', marginTop: '4px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            {searchResults.map(u => (
              <button key={u.id} onClick={() => { setSelectedUser(u); setSearchQuery(''); setSearchResults([]); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <img src={u.avatar || `https://picsum.photos/seed/${u.id}/40`} alt="" style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <div style={{ color: '#e1e1e1', fontSize: '0.7rem', fontWeight: 700, fontFamily: 'monospace' }}>@{u.username}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.6rem', fontFamily: 'monospace' }}>{u.role} · {u.id.substring(0, 12)}</div>
                </div>
                {(u.is_banned || u.isBanned) && <span style={{ marginLeft: 'auto', ...pill(true) }}>BANNED</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* No user selected state */}
      {!selectedUser && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#4b5563', fontSize: '0.65rem', fontFamily: 'monospace' }}>
          🔍 Search for a user to load their control panel
        </div>
      )}

      {/* User Control Panel */}
      {selectedUser && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Target User Card */}
          <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={selectedUser.avatar || `https://picsum.photos/seed/${selectedUser.id}/60`} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(124,58,237,0.5)' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#e1e1e1', fontSize: '0.75rem', fontWeight: 800, fontFamily: 'monospace' }}>@{selectedUser.username}</div>
              <div style={{ color: '#9ca3af', fontSize: '0.6rem', fontFamily: 'monospace', marginTop: '2px' }}>
                ID: {selectedUser.id.substring(0, 18)} · Role: {selectedUser.role}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                {isBanned && <span style={pill(true)}>🚫 BANNED</span>}
                {selectedUser.is_pm_banned && <span style={pill(true)}>PM BAN</span>}
                {selectedUser.is_shout_banned && <span style={pill(true)}>SHOUT BAN</span>}
                {selectedUser.is_chat_banned && <span style={pill(true)}>CHAT BAN</span>}
                {selectedUser.must_reset_password && <span style={pill(true)}>PWD RESET</span>}
                {!isBanned && !selectedUser.is_pm_banned && !selectedUser.is_shout_banned && !selectedUser.is_chat_banned && (
                  <span style={pill(false)}>CLEAN</span>
                )}
              </div>
            </div>
            <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1rem', padding: '4px' }}>✕</button>
          </div>

          {/* Feedback Bar */}
          {feedback && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px', fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 700,
              background: feedback.ok ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              border: `1px solid ${feedback.ok ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`,
              color: feedback.ok ? '#4ade80' : '#f87171',
            }}>{feedback.msg}</div>
          )}

          {/* Action Reason — MANDATORY */}
          <div>
            <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'monospace', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase' }}>
              ⚠️ Action Reason (Required)
            </label>
            <input
              value={actionReason}
              onChange={e => setActionReason(e.target.value)}
              placeholder="State reason for this moderation action…"
              style={{
                width: '100%', boxSizing: 'border-box', background: 'rgba(245,158,11,0.06)',
                border: `1px solid ${actionReason.trim() ? 'rgba(245,158,11,0.6)' : 'rgba(239,68,68,0.5)'}`,
                borderRadius: '8px', color: '#e1e1e1', fontSize: '0.7rem', fontFamily: 'monospace', padding: '10px 14px', outline: 'none',
              }}
            />
          </div>

          {/* Section: Instant Actions */}
          <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#f87171', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>⚡ Instant Actions</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={handleBoot} disabled={busy}
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', padding: '8px 14px', borderRadius: '6px', fontSize: '0.6rem', fontFamily: 'monospace', fontWeight: 800, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1, letterSpacing: '0.05em' }}>
                🔑 Boot & Force Password Reset
              </button>
              <button onClick={handlePurgeShouts} disabled={busy}
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', padding: '8px 14px', borderRadius: '6px', fontSize: '0.6rem', fontFamily: 'monospace', fontWeight: 800, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1, letterSpacing: '0.05em' }}>
                🗑️ Purge All Shouts
              </button>
            </div>
          </div>

          {/* Section: Ban Toggles */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#9ca3af', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>🚫 Restriction Toggles</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Full Ban', field: 'is_banned', altField: 'isBanned', val: isBanned },
                { label: 'PM Ban', field: 'is_pm_banned', val: !!selectedUser.is_pm_banned },
                { label: 'Shout Ban', field: 'is_shout_banned', val: !!selectedUser.is_shout_banned },
                { label: 'Chat Ban', field: 'is_chat_banned', val: !!selectedUser.is_chat_banned },
              ].map(({ label, field, val }) => (
                <div key={field} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#d1d5db', fontWeight: 600 }}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ ...pill(val), padding: '1px 6px' }}>{val ? 'ON' : 'OFF'}</span>
                    <Toggle on={val} onChange={() => handleToggle(field as keyof AdminUser)} disabled={busy} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Wallet & Stats */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#9ca3af', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>💰 Wallet & Stat Drivers</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: '⚠️ Warning Lvl (0-100)', field: 'warning_level', val: warningLevel, set: setWarningLevel, dbField: 'warning_level' },
                { label: '👍 Plusses', field: 'plusses', val: plusses, set: setPlusses, dbField: 'plusses' },
                { label: '🪙 Gold Coins', field: 'gold_coins', val: goldCoins, set: setGoldCoins, dbField: 'goldenCoins' },
                { label: '🔘 Silver Coins', field: 'silver_coins', val: silverCoins, set: setSilverCoins, dbField: 'silverPoints' },
                { label: '💵 Taka Balance', field: 'balance_taka', val: takaBal, set: setTakaBal, dbField: 'balance_taka' },
              ].map(({ label, field, val, set, dbField }) => (
                <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.55rem', fontWeight: 800, color: '#6b7280', fontFamily: 'monospace', letterSpacing: '0.08em' }}>{label}</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="number"
                      value={val}
                      onChange={e => set(e.target.value)}
                      style={{
                        flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px', color: '#e1e1e1', fontSize: '0.65rem', fontFamily: 'monospace',
                        padding: '6px 8px', outline: 'none', minWidth: 0,
                      }}
                    />
                    <button
                      onClick={() => handleUpdateNumeric(dbField, val, label)}
                      disabled={busy}
                      style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.4)', color: '#a78bfa', borderRadius: '6px', padding: '6px 10px', fontSize: '0.6rem', fontFamily: 'monospace', fontWeight: 800, cursor: busy ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                      Set
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Role Change (Admin Only) */}
          <AdminOnly isAdmin={isAdmin}>
            <div style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#a78bfa', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>🛡️ System Role Shift (Admin Only)</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(167,139,250,0.4)',
                    borderRadius: '6px', color: '#e1e1e1', fontSize: '0.65rem', fontFamily: 'monospace',
                    padding: '8px 10px', outline: 'none',
                  }}
                >
                  <option value="starter">starter</option>
                  <option value="user">user</option>
                  <option value="trusted_member">trusted_member</option>
                  <option value="premium">premium</option>
                  <option value="moderator">moderator</option>
                  <option value="admin">admin</option>
                </select>
                <button
                  onClick={handleRoleChange}
                  disabled={busy || !isAdmin}
                  style={{ background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)', color: '#a78bfa', borderRadius: '6px', padding: '8px 14px', fontSize: '0.6rem', fontFamily: 'monospace', fontWeight: 800, cursor: busy ? 'not-allowed' : 'pointer' }}>
                  Apply Role
                </button>
              </div>
            </div>
          </AdminOnly>

          {/* Section: IP Investigator */}
          <div style={{ background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>🌐 Cross-Account IP Investigator</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.55rem', color: '#6b7280', fontFamily: 'monospace', marginBottom: '2px' }}>Last Known IP</div>
                <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: selectedUser.last_ip ? '#38bdf8' : '#4b5563', fontWeight: 700 }}>
                  {selectedUser.last_ip || 'Not recorded'}
                </div>
              </div>
              <button
                onClick={handleIpLookup}
                disabled={!selectedUser.last_ip || loadingIp}
                style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.35)', color: '#38bdf8', borderRadius: '6px', padding: '8px 14px', fontSize: '0.6rem', fontFamily: 'monospace', fontWeight: 800, cursor: !selectedUser.last_ip || loadingIp ? 'not-allowed' : 'pointer', opacity: !selectedUser.last_ip ? 0.4 : 1 }}>
                {loadingIp ? '…Tracing' : '🔍 Trace IP'}
              </button>
            </div>
            {sameIpUsers.length > 0 && (
              <div>
                <div style={{ fontSize: '0.58rem', color: '#f87171', fontFamily: 'monospace', fontWeight: 800, marginBottom: '6px' }}>
                  ⚠️ {sameIpUsers.length} other account(s) sharing this IP:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {sameIpUsers.map(u => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.08)', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}
                      onClick={() => { setSelectedUser(u); setSameIpUsers([]); }}
                    >
                      <img src={u.avatar || `https://picsum.photos/seed/${u.id}/32`} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                      <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#e1e1e1', fontWeight: 700 }}>@{u.username}</span>
                      <span style={{ fontSize: '0.55rem', color: '#9ca3af', fontFamily: 'monospace' }}>{u.role}</span>
                      {(u.is_banned || u.isBanned) && <span style={{ ...pill(true), marginLeft: 'auto' }}>BANNED</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {sameIpUsers.length === 0 && !loadingIp && selectedUser.last_ip && (
              <div style={{ fontSize: '0.6rem', color: '#4b5563', fontFamily: 'monospace' }}>Run trace to find multi-accounts.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AdminPanelContainer (Main Export) ───────────────────────────────────────
interface AdminPanelContainerProps {
  currentUser: AdminUser;
  preSelectUser?: AdminUser | null;
}

const AdminPanelContainer: React.FC<AdminPanelContainerProps> = ({ currentUser, preSelectUser }) => {
  const isAdmin = currentUser.role === 'admin';
  const isStaff = isAdmin || currentUser.role === 'moderator';

  // When preSelectUser is provided (from UserProfile), jump straight to User Tools
  const [activeSection, setActiveSection] = useState<'dashboard' | 'users' | 'logs'>(
    preSelectUser ? 'users' : 'dashboard'
  );
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({ maintenance_mode: false, registration_open: true });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);
  const [togglingReg, setTogglingReg] = useState(false);

  // Guard — only admin/moderator
  if (!isStaff) {
    return (
      <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🚫</div>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#f87171', fontFamily: 'monospace', letterSpacing: '0.1em' }}>ACCESS DENIED</div>
        <div style={{ fontSize: '0.6rem', color: '#6b7280', fontFamily: 'monospace', marginTop: '4px' }}>
          This panel is restricted to Admins and Moderators only.
        </div>
      </div>
    );
  }

  // Load all users for stats
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE}/users?limit=1000`);
        const list = await res.json();
        setAllUsers(list);
      } catch (err: any) {
        console.warn('users load error:', err.message);
      }
    };
    fetchUsers();
  }, []);

  // Load site settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/site-settings`);
        const data = await res.json();
        setSiteSettings(data);
      } catch (err: any) {
      }
      setLoadingSettings(false);
    };
    fetchSettings();
  }, []);

  async function toggleMaintenance() {
    if (!isAdmin) return;
    setTogglingMaintenance(true);
    try {
        await fetch(`${API_BASE}/admin/site-settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ maintenance_mode: !siteSettings.maintenance_mode })
        });
        setSiteSettings(prev => ({ ...prev, maintenance_mode: !prev.maintenance_mode }));
    } catch (err: any) { console.warn(err.message); }
    setTogglingMaintenance(false);
  }

  async function toggleRegistration() {
    if (!isAdmin) return;
    setTogglingReg(true);
    try {
        await fetch(`${API_BASE}/admin/site-settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registration_open: !siteSettings.registration_open })
        });
        setSiteSettings(prev => ({ ...prev, registration_open: !prev.registration_open }));
    } catch (err: any) { console.warn(err.message); }
    setTogglingReg(false);
  }

  // Metrics
  const totalUsers = allUsers.length;
  const bannedUsers = allUsers.filter(u => u.is_banned || u.isBanned).length;
  const onlineUsers = allUsers.filter(u => (u as any).isOnline).length;
  const adminCount = allUsers.filter(u => u.role === 'admin').length;
  const modCount = allUsers.filter(u => u.role === 'moderator').length;
  const premiumCount = allUsers.filter(u => u.role === 'premium' || (u as any).isPremium).length;

  const statCards: StatCard[] = [
    { label: 'Total Users', value: totalUsers, icon: '👥', color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
    { label: 'Banned', value: bannedUsers, icon: '🚫', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    { label: 'Online Now', value: onlineUsers, icon: '🟢', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    { label: 'Premium', value: premiumCount, icon: '👑', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    { label: 'Admins', value: adminCount, icon: '🛡️', color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
    { label: 'Moderators', value: modCount, icon: '⚖️', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  ];

  const navItems: { key: 'dashboard' | 'users' | 'logs'; icon: string; label: string }[] = [
    { key: 'dashboard', icon: '📊', label: 'Dashboard' },
    { key: 'users', icon: '🔧', label: 'User Tools' },
    { key: 'logs', icon: '📋', label: 'Audit Log' },
  ];

  return (
    <div style={{ background: '#0e1e24', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(124,58,237,0.25)', fontFamily: 'monospace' }}>

      {/* Panel Header */}
      <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(14,30,36,0.8) 100%)', borderBottom: '1px solid rgba(124,58,237,0.3)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
          {isAdmin ? '🛡️' : '⚖️'}
        </div>
        <div>
          <div style={{ color: '#e1e1e1', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {isAdmin ? 'Admin' : 'Moderator'} Control Panel
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.58rem', marginTop: '1px' }}>
            Logged in as @{currentUser.username} · {isAdmin ? '🛡️ Full Access' : '⚖️ Mod Access'}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <span style={{ ...pill(false), fontSize: '0.55rem' }}>RBAC ACTIVE</span>
          <span style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', padding: '2px 8px', borderRadius: '999px', fontSize: '0.55rem', fontWeight: 800 }}>LIVE</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        {navItems.map(item => (
          <button key={item.key}
            onClick={() => setActiveSection(item.key)}
            style={{
              flex: 1, padding: '10px 8px', background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: activeSection === item.key ? '2px solid #7c3aed' : '2px solid transparent',
              color: activeSection === item.key ? '#a78bfa' : '#6b7280',
              fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
              fontFamily: 'monospace', transition: 'color 0.15s',
            }}>
            <span style={{ marginRight: '4px' }}>{item.icon}</span>{item.label}
          </button>
        ))}
      </div>

      {/* Panel Body */}
      <div style={{ padding: '16px' }}>

        {/* ── DASHBOARD ── */}
        {activeSection === 'dashboard' && (
          <div>
            <SectionHead icon="📊" title="Master Dashboard" sub="Real-time Firestore metrics" />

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {statCards.map((card, i) => (
                <div key={i} style={{ background: card.bg, border: `1px solid ${card.color}33`, borderRadius: '10px', padding: '12px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{card.icon}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: card.color, fontFamily: 'monospace', lineHeight: 1 }}>{card.value}</div>
                  <div style={{ fontSize: '0.5rem', color: '#6b7280', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '3px' }}>{card.label}</div>
                </div>
              ))}
            </div>

            {/* System Toggles — Admin Only */}
            <AdminOnly isAdmin={isAdmin}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
                  ⚙️ System Toggles — Admin Only
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Maintenance Mode */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#e1e1e1', marginBottom: '2px' }}>🔧 Maintenance Mode</div>
                      <div style={{ fontSize: '0.56rem', color: '#6b7280' }}>Disables site access for non-staff users</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={pill(siteSettings.maintenance_mode)}>{siteSettings.maintenance_mode ? 'ON' : 'OFF'}</span>
                      <Toggle on={siteSettings.maintenance_mode} onChange={toggleMaintenance} disabled={!isAdmin || togglingMaintenance || loadingSettings} />
                    </div>
                  </div>
                  {/* Registration */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#e1e1e1', marginBottom: '2px' }}>📝 Open Registration</div>
                      <div style={{ fontSize: '0.56rem', color: '#6b7280' }}>Allow new users to create accounts</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={pill(!siteSettings.registration_open)}>{siteSettings.registration_open ? 'OPEN' : 'CLOSED'}</span>
                      <Toggle on={siteSettings.registration_open} onChange={toggleRegistration} disabled={!isAdmin || togglingReg || loadingSettings} />
                    </div>
                  </div>
                </div>
              </div>
            </AdminOnly>

            {/* Recent Users Table */}
            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>👥 Recent Users</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {allUsers.slice(0, 8).map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '8px 10px' }}>
                    <img src={u.avatar || `https://picsum.photos/seed/${u.id}/32`} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#e1e1e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{u.username}</div>
                      <div style={{ fontSize: '0.55rem', color: '#6b7280' }}>{u.role}</div>
                    </div>
                    {(u.is_banned || u.isBanned) && <span style={pill(true)}>BANNED</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── USER TOOLS ── */}
        {activeSection === 'users' && (
          <UserManagementTools currentUser={currentUser} isAdmin={isAdmin} preSelectUser={preSelectUser} />
        )}

        {/* ── AUDIT LOGS ── */}
        {activeSection === 'logs' && (
          <SystemAuditLogs />
        )}
      </div>
    </div>
  );
};

export default AdminPanelContainer;
