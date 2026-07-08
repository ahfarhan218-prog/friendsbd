import React, { useState, useEffect } from 'react';
import { API_BASE } from '../services/mongoService';

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const session = JSON.parse(localStorage.getItem('user_session') || 'null');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'other', prize: '', date: '', maxParticipants: '' });
  const [msg, setMsg] = useState('');

  const loadEvents = async () => {
    try { const r = await fetch(`${API_BASE}/events`); if (r.ok) setEvents(await r.json()); } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadEvents(); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.date || !session) return;
    setMsg('');
    try {
      const r = await fetch(`${API_BASE}/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        title: form.title, description: form.description, type: form.type, prize: form.prize,
        date: new Date(form.date).getTime(), maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : undefined, createdBy: session.id
      }) });
      if (r.ok) { setMsg('✅ Event created!'); setShowCreate(false); setForm({ title: '', description: '', type: 'other', prize: '', date: '', maxParticipants: '' }); loadEvents(); }
      else { const e = await r.json(); setMsg('❌ ' + (e.error || 'Failed')); }
    } catch (e: any) { setMsg('❌ ' + e.message); }
  };

  const handleRegister = async (eventId: string) => {
    if (!session) return;
    try { const r = await fetch(`${API_BASE}/events/${eventId}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: session.id }) }); if (r.ok) { setMsg('✅ Registered!'); loadEvents(); } else { const e = await r.json(); setMsg('❌ ' + (e.error || 'Failed')); } } catch (e: any) { setMsg('❌ ' + e.message); }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center"><div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>;

  const grouped: Record<string, any[]> = {};
  events.forEach(e => {
    const key = new Date(e.date).toLocaleDateString();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a] p-4 sm:p-6">
      <div className="max-w-full max-w-4xl mx-auto px-4 sm:px-6 mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">📅 Events Calendar</h1>
            <p className="text-sm text-white/40 mt-1">Upcoming and ongoing events</p>
          </div>
          {session && <button onClick={() => setShowCreate(!showCreate)} className="pf-btn pf-btn-primary">{showCreate ? 'Cancel' : '+ Create Event'}</button>}
        </div>

        {msg && <div className="text-sm text-center mb-4 font-bold text-white/80">{msg}</div>}

        {showCreate && (
          <div className="pf-card p-5 mb-6 space-y-3">
            <input className="pf-input w-full" placeholder="Event title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <input className="pf-input w-full" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <div className="flex flex-wrap gap-3">
              <select className="pf-input flex-1" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="tournament">🏆 Tournament</option>
                <option value="quiz">🧠 Quiz</option>
                <option value="giveaway">🎁 Giveaway</option>
                <option value="meetup">🤝 Meetup</option>
                <option value="other">Other</option>
              </select>
              <input className="pf-input flex-1" placeholder="Prize (optional)" value={form.prize} onChange={e => setForm({ ...form, prize: e.target.value })} />
            </div>
            <div className="flex flex-wrap gap-3">
              <input className="pf-input flex-1" type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              <input className="pf-input w-32" type="number" placeholder="Max participants" value={form.maxParticipants} onChange={e => setForm({ ...form, maxParticipants: e.target.value })} />
            </div>
            <button onClick={handleCreate} className="pf-btn pf-btn-primary w-full">Create Event</button>
          </div>
        )}

        {events.length === 0 ? (
          <div className="text-center py-20 text-white/60">
            <p className="text-5xl mb-4">📅</p>
            <p className="font-bold">No events scheduled</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, dayEvents]) => (
              <div key={date}>
                <h2 className="text-sm font-bold text-purple-400 mb-3 uppercase tracking-wider">{date}</h2>
                <div className="space-y-3">
                  {dayEvents.map(e => (
                    <div key={e.id} className="pf-card p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs sm:text-sm font-bold px-2 py-1 rounded-full ${e.status === 'ongoing' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'}`}>
                          {e.status === 'ongoing' ? '🔴 Live' : '📅 Upcoming'}
                        </span>
                        <span className="text-xs sm:text-sm text-white/60">{e.type}</span>
                      </div>
                      <h3 className="text-lg font-black text-white">{e.title}</h3>
                      <p className="text-sm text-white/50 mt-1">{e.description}</p>
                      {e.prize && <p className="text-sm text-amber-400 mt-2">🎁 Prize: {e.prize}</p>}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm text-white/60">👥 {e.participants?.length || 0}{e.maxParticipants ? ` / ${e.maxParticipants}` : ''}</span>
                        {e.status === 'upcoming' && session && (
                          <button onClick={() => handleRegister(e.id)} className="pf-btn pf-btn-primary text-sm">Register</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{pfStyles}</style>
    </div>
  );
};

const pfStyles = `
  .pf-card { background:#1C1C2E; border:1px solid rgba(255,255,255,0.06); border-radius:20px; transition:all .3s; }
  .pf-card:hover { border-color:rgba(168,85,247,0.15); }
  .pf-input { background:rgba(22,27,34,0.8); border:1px solid #30363d; border-radius:12px; padding:10px 14px; color:#fff; font-size:0.85rem; outline:none; transition:all .3s; }
  .pf-input:focus { border-color:#a78bfa; }
  .pf-btn { padding:8px 20px; border-radius:12px; font-weight:700; font-size:0.75rem; border:none; cursor:pointer; transition:all .3s; }
  .pf-btn-primary { background:linear-gradient(135deg,#7c3aed,#a855f7); color:#fff; }
  .pf-btn-primary:hover { transform:translateY(-1px); box-shadow:0 8px 25px rgba(124,58,237,0.3); }
  .pf-btn-ghost { background:rgba(255,255,255,0.05); color:#a78bfa; border:1px solid rgba(168,85,247,0.2); }
`;

export default Calendar;

