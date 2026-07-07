import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../services/mongoService';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) { setStatus('error'); setMessage('No verification token provided.'); return; }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/verify-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
        const data = await res.json();
        if (res.ok) { setStatus('success'); setMessage('Email verified successfully!'); }
        else { setStatus('error'); setMessage(data.error || 'Verification failed.'); }
      } catch { setStatus('error'); setMessage('Network error.'); }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a] flex items-center justify-center p-8">
      <div className="pf-card p-8 max-w-md w-full text-center">
        {status === 'verifying' && <><div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" /><p className="text-white/70">Verifying your email...</p></>}
        {status === 'success' && <><p className="text-5xl mb-4">✅</p><h2 className="text-xl font-black text-white mb-2">Email Verified!</h2><p className="text-white/50 mb-6">{message}</p><button onClick={() => navigate('/home')} className="pf-btn pf-btn-primary">Go to Home</button></>}
        {status === 'error' && <><p className="text-5xl mb-4">❌</p><h2 className="text-xl font-black text-white mb-2">Verification Failed</h2><p className="text-white/50 mb-6">{message}</p><button onClick={() => navigate('/home')} className="pf-btn pf-btn-primary">Go to Home</button></>}
      </div>
      <style>{`.pf-card { background:#1C1C2E; border:1px solid rgba(255,255,255,0.06); border-radius:20px; } .pf-btn { padding:8px 20px; border-radius:12px; font-weight:700; font-size:0.75rem; border:none; cursor:pointer; transition:all .3s; } .pf-btn-primary { background:linear-gradient(135deg,#7c3aed,#a855f7); color:#fff; } .pf-btn-primary:hover { transform:translateY(-1px); box-shadow:0 8px 25px rgba(124,58,237,0.3); }`}</style>
    </div>
  );
};

export default VerifyEmail;
