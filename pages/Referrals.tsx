import React, { useState, useEffect } from 'react';
import { API_BASE } from '../services/mongoService';

const Referrals: React.FC = () => {
  const session = JSON.parse(localStorage.getItem('user_session') || 'null');
  const [refs, setRefs] = useState<any[]>([]);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const token = localStorage.getItem('auth_token');

  const loadRefs = async () => {
    try {
      const r = await fetch(`${API_BASE}/referrals/my`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (r.ok) setRefs(await r.json());
    } catch (_) {}
  };

  useEffect(() => { loadRefs(); }, []);

  const claimReferral = async () => {
    if (!code.trim()) return;
    setMsg('');
    try {
      const r = await fetch(`${API_BASE}/referrals/claim`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ code: code.trim() })
      });
      const d = await r.json();
      setMsg(d.message || (d.error || 'Failed'));
      if (r.ok) { setCode(''); loadRefs(); }
    } catch (e: any) { setMsg(e.message); }
  };

  const referralLink = session ? `${window.location.origin}/signup?ref=${session.id}` : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-black text-white mb-2">🤝 Referrals</h1>
        <p className="text-sm text-white/40 mb-6">Invite friends and earn rewards together</p>

        {msg && <div className="text-sm text-center mb-4 font-bold text-white/80 bg-purple-500/10 p-3 rounded-xl border border-purple-500/20">{msg}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-5">
            <h3 className="font-bold text-white mb-3">🔗 Your Referral Link</h3>
            {session ? (
              <>
                <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 text-sm text-white/60 break-all mb-3">{referralLink}</div>
                <button onClick={() => { navigator.clipboard.writeText(referralLink); setMsg('✅ Link copied!'); }} className="w-full bg-purple-600 text-white font-bold py-2.5 rounded-xl text-sm">Copy Link</button>
              </>
            ) : <p className="text-white/40 text-sm">Login to get your referral link</p>}
          </div>

          <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-5">
            <h3 className="font-bold text-white mb-3">🎁 Claim Referral</h3>
            <p className="text-xs text-white/40 mb-3">Enter the User ID of the person who referred you</p>
            <div className="flex gap-3">
              <input className="flex-1 bg-[#161b22] border border-[#30363d] rounded-xl p-2.5 text-white text-sm" placeholder="Referrer User ID" value={code} onChange={e => setCode(e.target.value)} />
              <button onClick={claimReferral} className="bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm">Claim</button>
            </div>
          </div>
        </div>

        <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-5">
          <h3 className="font-bold text-white mb-4">📊 Your Referrals</h3>
          {refs.length === 0 ? (
            <div className="text-center py-10 text-white/60">
              <p className="text-4xl mb-2">🤝</p>
              <p className="font-bold">No referrals yet</p>
              <p className="text-xs mt-1">Share your referral link to start earning!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {refs.map(r => (
                <div key={r.id} className="flex items-center justify-between bg-[#161b22] rounded-xl p-3">
                  <span className="text-sm text-white">{r.referredName || 'New User'}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${r.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400' : r.status === 'rewarded' ? 'bg-purple-500/10 text-purple-400' : 'bg-amber-500/10 text-amber-400'}`}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-5 mt-4">
          <h3 className="font-bold text-white mb-3">🎯 Rewards</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-[#161b22] rounded-xl p-3">
              <p className="text-amber-400 font-bold">You (Referrer)</p>
              <p className="text-white/60 text-xs mt-1">+200 Points, +10 Golden Coins, +50 Silver Points</p>
            </div>
            <div className="bg-[#161b22] rounded-xl p-3">
              <p className="text-emerald-400 font-bold">Friend (Referred)</p>
              <p className="text-white/60 text-xs mt-1">+100 Points, +5 Golden Coins, +25 Silver Points</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Referrals;
