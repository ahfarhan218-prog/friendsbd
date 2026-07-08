
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MOCK_USER, syncContextWithSession } from '../constants';
import { User } from '../types';
import { triggerToast } from '../components/NotificationToast';
import { mongoService } from '../services/mongoService';
import { API_BASE } from '../services/mongoService';
import { createSession } from '../services/sessionService';
import FriendsBDLogo from '../components/FriendsBDLogo';

interface AuthProps {
  mode: 'login' | 'signup';
  onAuth: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ mode, onAuth }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState('Male');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        // Login via MongoDB API
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password })
        });

        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'Login failed.');
          setLoading(false);
          return;
        }

        const user = data.user as User;

        // Mint a new session token
        const { sessionToken, sessionExpiry } = await createSession(user.id);
        (user as any).sessionToken = sessionToken;
        (user as any).sessionExpiry = sessionExpiry;

        triggerToast({
          id: 'auth-ok-' + Date.now(),
          senderId: 'system',
          senderName: 'Secured Gate',
          senderAvatar: user.avatar || 'https://picsum.photos/seed/admin/200',
          type: 'SYSTEM',
          message: `✅ Welcome back, ${user.name}! (User #${user.userId})`,
          timestamp: Date.now(),
          isRead: false
        } as any);

        Object.assign(MOCK_USER, user);
        syncContextWithSession();
        onAuth(user);

      } else {
        // Signup validation
        if (!fullName.trim() || !username.trim() || !email.trim()) {
          setErrorMsg('Please enter all required fields.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }

        const formattedUsername = username.trim().replace(/\s+/g, '').toLowerCase();

        // Register via MongoDB API
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password,
            fullName: fullName.trim(),
            username: formattedUsername,
            gender
          })
        });

        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'Registration failed.');
          setLoading(false);
          return;
        }

        const user = data.user as User;

        // Mint session token
        const { sessionToken, sessionExpiry } = await createSession(user.id);
        (user as any).sessionToken = sessionToken;
        (user as any).sessionExpiry = sessionExpiry;

        triggerToast({
          id: 'auth-ok-' + Date.now(),
          senderId: 'system',
          senderName: 'Secured Gate',
          senderAvatar: user.avatar || 'https://picsum.photos/seed/admin/200',
          type: 'SYSTEM',
          message: `🎉 Welcome, ${user.name}! Account created. (User #${user.userId})`,
          timestamp: Date.now(),
          isRead: false
        } as any);

        Object.assign(MOCK_USER, user);
        syncContextWithSession();
        onAuth(user);
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 w-full max-w-lg md:max-w-xl mx-auto font-inter text-[#e2e8f0]"
      style={{
        background: '#0F0F1A',
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(124, 58, 237, 0.15) 0%, transparent 70%), linear-gradient(135deg, #110a2a 0%, #1d0d4a 50%, #0d1a6b 100%)'
      }}
    >
      <div className="mb-8 text-center">
        <FriendsBDLogo size={100} className="mx-auto mb-2 drop-shadow-2xl" />
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-1 drop-shadow-lg">friends bd</h1>
      </div>

      <div className="bg-[#090d16]/80 backdrop-blur-xl rounded-[3rem] p-8 w-full shadow-2xl border border-purple-500/20">
        <div className="text-center mb-6">
           <h2 className="text-2xl font-bold text-white">{mode === 'login' ? 'Welcome Back!' : 'Create Account'}</h2>
           <p className="text-xs text-purple-200 mt-1">
             {mode === 'login' ? 'Login via Email' : 'Join FriendsBD community today'}
           </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs sm:text-sm font-bold text-center">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
           {mode === 'signup' && (
             <>
               <div className="space-y-1">
                 <label className="text-xs sm:text-sm font-bold text-purple-300 uppercase tracking-widest px-2">Full Name</label>
                 <div className="relative">
                   <input 
                     value={fullName}
                     onChange={(e) => setFullName(e.target.value)}
                     type="text" 
                     placeholder="e.g. Arif Rahman" 
                     className="w-full bg-[#161b22] border-2 border-[#30363d] rounded-2xl py-3.5 px-12 focus:border-purple-500 text-white text-sm outline-none transition-all placeholder:text-slate-500" 
                   />
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 text-lg">👤</span>
                 </div>
               </div>

               <div className="space-y-1">
                 <label className="text-xs sm:text-sm font-bold text-purple-300 uppercase tracking-widest px-2">Choose Username</label>
                 <div className="relative">
                   <input 
                     value={username}
                     onChange={(e) => setUsername(e.target.value)}
                     type="text" 
                     placeholder="e.g. arif_bd" 
                     className="w-full bg-[#161b22] border-2 border-[#30363d] rounded-2xl py-3.5 px-12 focus:border-purple-500 text-white text-sm outline-none transition-all placeholder:text-slate-500" 
                   />
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 text-sm font-bold">@</span>
                 </div>
               </div>
               <div className="space-y-1">
                 <label className="text-xs sm:text-sm font-bold text-purple-300 uppercase tracking-widest px-2">Gender</label>
                 <div className="relative">
                   <select 
                     value={gender}
                     onChange={(e) => setGender(e.target.value)}
                     className="w-full bg-[#161b22] border-2 border-[#30363d] rounded-2xl py-3.5 px-12 focus:border-purple-500 text-white text-sm outline-none transition-all appearance-none cursor-pointer"
                   >
                     <option value="Male">Male</option>
                     <option value="Female">Female</option>
                     <option value="Other">Other</option>
                   </select>
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 text-lg">⚧️</span>
                 </div>
               </div>
             </>
           )}

           <div className="space-y-1">
             <label className="text-xs sm:text-sm font-bold text-purple-300 uppercase tracking-widest px-2">
               Email Address
             </label>
             <div className="relative">
               <input 
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 type="text" 
                 placeholder="your.email@example.com" 
                 className="w-full bg-[#161b22] border-2 border-[#30363d] rounded-2xl py-3.5 px-12 focus:border-purple-500 text-white text-sm outline-none transition-all placeholder:text-slate-500" 
               />
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 text-lg">📧</span>
             </div>
           </div>

           <div className="space-y-1">
             <label className="text-xs sm:text-sm font-bold text-purple-300 uppercase tracking-widest px-2">Password</label>
             <div className="relative">
               <input 
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 type="password" 
                 placeholder={mode === 'login' ? "Enter your password" : "Create a strong password"} 
                 className="w-full bg-[#161b22] border-2 border-[#30363d] rounded-2xl py-3.5 px-12 focus:border-purple-500 text-white text-sm outline-none transition-all placeholder:text-slate-500" 
               />
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 text-lg">🔒</span>
             </div>
             {mode === 'signup' && <p className="text-xs sm:text-sm text-purple-300 px-2">Minimum 6 characters</p>}
           </div>

           <button 
             type="submit" 
             disabled={loading}
             className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-[2rem] shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all text-base uppercase tracking-widest mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
           >
             {loading ? '⏳ Please wait...' : (mode === 'login' ? 'Login' : 'Create Account')}
           </button>
        </form>

        <div className="text-center mt-6 text-xs font-medium text-purple-300">
          {mode === 'login' ? (
            <>Don't have an account? <Link to="/signup" className="text-pink-400 font-bold ml-1 hover:text-pink-300">Sign Up</Link></>
          ) : (
            <>Already have an account? <Link to="/login" className="text-pink-400 font-bold ml-1 hover:text-pink-300">Login</Link></>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;

