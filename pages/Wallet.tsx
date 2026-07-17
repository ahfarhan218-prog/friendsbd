import React, { useState, useEffect } from 'react';
import { API_BASE } from '../services/mongoService';

const Wallet: React.FC = () => {
  const session = JSON.parse(localStorage.getItem('user_session') || 'null');
  const [txns, setTxns] = useState<any[]>([]);
  const [method, setMethod] = useState('bkash');
  const [amount, setAmount] = useState('');
  const [fromCur, setFromCur] = useState('taka');
  const [toCur, setToCur] = useState('goldenCoins');
  const [convAmount, setConvAmount] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('auth_token');

  const loadTxns = async () => {
    try {
      const r = await fetch(`${API_BASE}/wallet/transactions`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (r.ok) setTxns(await r.json());
    } catch (_) {}
  };

  useEffect(() => { loadTxns(); }, []);

  const handleDeposit = async () => {
    if (!amount || Number(amount) < 10) { setMsg('Minimum deposit 10 taka'); return; }
    setMsg(''); setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/wallet/deposit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ method, amount: Number(amount) })
      });
      const d = await r.json();
      setMsg(d.message || (d.error || 'Failed'));
      if (r.ok) { setTimeout(loadTxns, 3000); setAmount(''); }
    } catch (e: any) { setMsg(e.message); }
    finally { setLoading(false); }
  };

  const handleConvert = async () => {
    if (!convAmount || Number(convAmount) <= 0) { setMsg('Invalid amount'); return; }
    setMsg(''); setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/wallet/convert`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ fromCurrency: fromCur, toCurrency: toCur, amount: Number(convAmount) })
      });
      const d = await r.json();
      setMsg(d.message || (d.error || 'Failed'));
      if (r.ok) setConvAmount('');
    } catch (e: any) { setMsg(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a] p-4 sm:p-6 overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-black text-white mb-2">💰 Wallet</h1>
        <p className="text-sm text-white/40 mb-6">Deposit, convert, and track transactions</p>

        {session && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4 text-center">
              <p className="text-xs text-white/40">Taka</p>
              <p className="text-xl font-black text-white">{(session as any).balance_taka || 0}</p>
            </div>
            <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4 text-center">
              <p className="text-xs text-white/40">Golden Coins</p>
              <p className="text-xl font-black text-amber-400">{session?.goldenCoins || 0}</p>
            </div>
            <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4 text-center">
              <p className="text-xs text-white/40">AP</p>
              <p className="text-xl font-black text-purple-400">{session?.ap || 0}</p>
            </div>
            <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-4 text-center">
              <p className="text-xs text-white/40">Silver Points</p>
              <p className="text-xl font-black text-slate-300">{session?.silverPoints || 0}</p>
            </div>
          </div>
        )}

        {msg && <div className="text-sm text-center mb-4 font-bold text-white/80 bg-purple-500/10 p-3 rounded-xl border border-purple-500/20">{msg}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-5">
            <h3 className="font-bold text-white mb-4">💳 Deposit Taka</h3>
            <div className="space-y-3">
              <select className="w-full bg-[#161b22] border border-[#30363d] rounded-xl p-2.5 text-white text-sm" value={method} onChange={e => setMethod(e.target.value)}>
                <option value="bkash">📱 bKash</option>
                <option value="nagad">📱 Nagad</option>
                <option value="rocket">🚀 Rocket</option>
              </select>
              <input className="w-full bg-[#161b22] border border-[#30363d] rounded-xl p-2.5 text-white text-sm" type="number" placeholder="Amount (min 10 taka)" value={amount} onChange={e => setAmount(e.target.value)} />
              <button onClick={handleDeposit} disabled={loading} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-3 rounded-xl text-sm">{loading ? 'Processing...' : 'Deposit'}</button>
            </div>
          </div>

          <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-5">
            <h3 className="font-bold text-white mb-4">🔄 Convert Currency</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <select className="flex-1 bg-[#161b22] border border-[#30363d] rounded-xl p-2.5 text-white text-sm" value={fromCur} onChange={e => setFromCur(e.target.value)}>
                  <option value="taka">Taka</option>
                  <option value="goldenCoins">Golden Coins</option>
                  <option value="ap">AP</option>
                </select>
                <span className="text-white/60 self-center">→</span>
                <select className="flex-1 bg-[#161b22] border border-[#30363d] rounded-xl p-2.5 text-white text-sm" value={toCur} onChange={e => setToCur(e.target.value)}>
                  <option value="taka">Taka</option>
                  <option value="goldenCoins">Golden Coins</option>
                  <option value="ap">AP</option>
                </select>
              </div>
              <input className="w-full bg-[#161b22] border border-[#30363d] rounded-xl p-2.5 text-white text-sm" type="number" placeholder="Amount" value={convAmount} onChange={e => setConvAmount(e.target.value)} />
              <button onClick={handleConvert} disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-xl text-sm">Convert</button>
            </div>
          </div>
        </div>

        <div className="bg-[#1C1C2E] border border-white/5 rounded-2xl p-5">
          <h3 className="font-bold text-white mb-4">📋 Transaction History</h3>
          {txns.length === 0 ? <p className="text-white/40 text-sm text-center py-6">No transactions yet</p> : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {txns.map(t => (
                <div key={t.id} className="flex items-center justify-between bg-[#161b22] rounded-xl p-3">
                  <div>
                    <p className="text-sm text-white font-bold">{t.type} {t.method !== 'system' && `via ${t.method}`}</p>
                    <p className="text-xs text-white/40">{new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`text-sm font-bold ${t.status === 'completed' ? 'text-emerald-400' : t.status === 'pending' ? 'text-amber-400' : 'text-red-400'}`}>
                    {t.status === 'completed' ? '+' : ''}{t.amount} {t.currency}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;
