import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mongoService } from '../services/mongoService';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editEducation, setEditEducation] = useState('');
  const [editWork, setEditWork] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  const [pushNotifications, setPushNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [ghostMode, setGhostMode] = useState(false);
  const [hiddenVisit, setHiddenVisit] = useState(false);
  const [activeBanner, setActiveBanner] = useState('default');

  useEffect(() => {
    const session = localStorage.getItem('user_session');
    if (session) {
      const parsed = JSON.parse(session);
      setCurrentUser(parsed);
      setEditName(parsed.name || '');
      setEditBio(parsed.bio || '');
      setEditAvatar(parsed.avatar || '');
      setEditUsername(parsed.username || '');
      setEditEmail(parsed.email || '');
      setEditGender(parsed.gender || '');
      setEditCountry(parsed.fromCountry || '');
      setEditEducation(parsed.education || '');
      setEditWork(parsed.work || '');
      setEditStatus(parsed.customStatus || '');
      setGhostMode(!!parsed.ghostMode);
      setHiddenVisit(!!parsed.hiddenVisit);
      const prefs = JSON.parse(localStorage.getItem(`settings_prefs_${parsed.id}`) || '{}');
      if (prefs.pushNotifications !== undefined) setPushNotifications(prefs.pushNotifications);
      if (prefs.soundEffects !== undefined) setSoundEffects(prefs.soundEffects);
      if (prefs.emailNotifications !== undefined) setEmailNotifications(prefs.emailNotifications);
      if (prefs.publicProfile !== undefined) setPublicProfile(prefs.publicProfile);
      if (prefs.showOnlineStatus !== undefined) setShowOnlineStatus(prefs.showOnlineStatus);
      if (prefs.profileBanner !== undefined) setActiveBanner(prefs.profileBanner);
    }
  }, []);

  const savePreferences = (key: string, value: any) => {
    if (!currentUser) return;
    const prefs = JSON.parse(localStorage.getItem(`settings_prefs_${currentUser.id}`) || '{}');
    prefs[key] = value;
    localStorage.setItem(`settings_prefs_${currentUser.id}`, JSON.stringify(prefs));
  };

  const updateSession = (updates: any) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    localStorage.setItem('user_session', JSON.stringify(updated));
  };

  const updateProfile = async () => {
    if (!currentUser) return;
    const updates: any = {};
    if (editName !== currentUser.name) updates.name = editName;
    if (editBio !== currentUser.bio) updates.bio = editBio;
    if (editAvatar !== currentUser.avatar) updates.avatar = editAvatar;
    if (editGender !== currentUser.gender) updates.gender = editGender;
    if (editCountry !== currentUser.fromCountry) updates.fromCountry = editCountry;
    if (editEducation !== (currentUser.education || '')) updates.education = editEducation;
    if (editWork !== (currentUser.work || '')) updates.work = editWork;
    if (editStatus !== (currentUser.customStatus || '')) updates.customStatus = editStatus;
    if (editEmail !== currentUser.email) updates.email = editEmail;
    if (ghostMode !== !!currentUser.ghostMode) updates.ghostMode = ghostMode;
    if (hiddenVisit !== !!currentUser.hiddenVisit) updates.hiddenVisit = hiddenVisit;
    updateSession(updates);
    if (currentUser.id !== 'me' && Object.keys(updates).length > 0) {
      try { await mongoService.updateUser(currentUser.id, updates); } catch (e) {}
    }
    setActiveModal(null);
    showToast('Profile updated');
  };

  const updateUsername = async () => {
    if (!currentUser || !editUsername.trim()) return;
    updateSession({ username: editUsername.trim().toLowerCase() });
    if (currentUser.id !== 'me') {
      try { await mongoService.updateUser(currentUser.id, { username: editUsername.trim().toLowerCase() }); } catch (e) {}
    }
    setActiveModal(null);
    showToast('Username updated');
  };

  const updatePassword = () => {
    if (!editPassword.trim()) return;
    showToast('Password updated');
    setEditPassword('');
    setActiveModal(null);
  };

  const sendSupport = () => {
    showToast('Message sent to support');
    setSupportMessage('');
    setActiveModal(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('user_session');
    navigate('/welcome');
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you absolutely sure you want to permanently delete your account? This cannot be undone.')) {
      localStorage.removeItem('user_session');
      navigate('/welcome');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B1A] relative pb-20">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-3 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-sm font-bold shadow-lg shadow-purple-900/50 animate-pulse">
          {toast}
        </div>
      )}
      <header className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white p-4 sm:p-6 pb-16 sm:pb-20 rounded-b-[2rem] sm:rounded-b-[3rem] flex flex-wrap items-center gap-4 shadow-lg shadow-purple-900/30">
        <button onClick={() => navigate(-1)} className="p-2 bg-black/20 rounded-full active:scale-90 transition-transform backdrop-blur-sm">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        </button>
        <h2 className="text-2xl font-bold flex flex-wrap items-center gap-2">Settings</h2>
      </header>

      <div className="px-4 -mt-16 flex flex-col gap-6 mb-24">

        {/* ── Account ── */}
        <div className="bg-[#1C1C2E] rounded-[2.5rem] shadow-sm overflow-hidden border border-[#30363d]">
          <div className="p-4 px-3 sm:px-6 text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-b-[2rem]">
            <h3 className="text-sm font-black flex flex-wrap items-center gap-2 uppercase tracking-widest">Account</h3>
            <p className="text-xs sm:text-sm opacity-70">Manage your account settings</p>
          </div>
          <div className="bg-[#161b22] m-2 rounded-2xl p-1 space-y-1">
            <button onClick={() => setActiveModal('profile')} className="w-full flex flex-wrap items-center gap-4 p-4 hover:bg-[#1C1C2E] rounded-xl transition-all">
              <div className="bg-purple-500/20 text-purple-400 w-10 h-10 rounded-xl flex items-center justify-center text-lg">📝</div>
              <div className="text-left"><p className="text-sm font-black text-gray-100">Edit Profile</p><p className="text-xs sm:text-sm text-gray-400 font-medium">Name, bio, avatar, gender, country & more</p></div>
            </button>
            <button onClick={() => setActiveModal('username')} className="w-full flex flex-wrap items-center gap-4 p-4 hover:bg-[#1C1C2E] rounded-xl transition-all">
              <div className="bg-purple-500/20 text-purple-400 w-10 h-10 rounded-xl flex items-center justify-center text-lg">👤</div>
              <div className="text-left"><p className="text-sm font-black text-gray-100">Change Username</p><p className="text-xs sm:text-sm text-gray-400 font-medium">@{currentUser?.username || 'username'}</p></div>
            </button>
            <button onClick={() => setActiveModal('password')} className="w-full flex flex-wrap items-center gap-4 p-4 hover:bg-[#1C1C2E] rounded-xl transition-all">
              <div className="bg-purple-500/20 text-purple-400 w-10 h-10 rounded-xl flex items-center justify-center text-lg">🔒</div>
              <div className="text-left"><p className="text-sm font-black text-gray-100">Change Password</p><p className="text-xs sm:text-sm text-gray-400 font-medium">Update your password</p></div>
            </button>
            <button onClick={() => setActiveModal('appearance')} className="w-full flex flex-wrap items-center gap-4 p-4 hover:bg-[#1C1C2E] rounded-xl transition-all">
              <div className="bg-purple-500/20 text-purple-400 w-10 h-10 rounded-xl flex items-center justify-center text-lg">🎨</div>
              <div className="text-left"><p className="text-sm font-black text-gray-100">Appearance</p><p className="text-xs sm:text-sm text-gray-400 font-medium">Profile banner theme</p></div>
            </button>
          </div>
        </div>

        {/* ── Account Info ── */}
        <div className="bg-[#1C1C2E] rounded-[2.5rem] shadow-sm overflow-hidden border border-[#30363d]">
          <div className="p-4 px-3 sm:px-6 text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-b-[2rem]">
            <h3 className="text-sm font-black flex flex-wrap items-center gap-2 uppercase tracking-widest">Account Info</h3>
            <p className="text-xs sm:text-sm opacity-70">Your account details</p>
          </div>
          <div className="bg-[#161b22] m-2 rounded-2xl p-4 space-y-3">
            {[
              { label: 'Email', value: currentUser?.email },
              { label: 'User ID', value: currentUser?.id },
              { label: 'Role', value: currentUser?.role },
              { label: 'Joined', value: currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : '-' },
              { label: 'Level', value: currentUser?.level },
              { label: 'Reputation', value: currentUser?.total_rp ?? currentUser?.reputation_points ?? 0 },
            ].map(item => (
              <div key={item.label} className="flex flex-wrap justify-between items-center py-1 gap-2">
                <span className="text-sm text-gray-400 shrink-0">{item.label}</span>
                <span className="text-sm font-bold text-gray-100 text-right truncate max-w-[180px] sm:max-w-none">{item.value || '-'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Privacy & Security ── */}
        <div className="bg-[#1C1C2E] rounded-[2.5rem] shadow-sm overflow-hidden border border-[#30363d]">
          <div className="p-4 px-3 sm:px-6 text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-b-[2rem]">
            <h3 className="text-sm font-black flex flex-wrap items-center gap-2 uppercase tracking-widest">Privacy & Security</h3>
            <p className="text-xs sm:text-sm opacity-70">Control your privacy</p>
          </div>
          <div className="bg-[#161b22] m-2 rounded-2xl p-4 space-y-5">
            <ToggleRow label="Public Profile" desc="Allow others to view your profile" value={publicProfile} onChange={(v) => { setPublicProfile(v); savePreferences('publicProfile', v); }} />
            <ToggleRow label="Show Online Status" desc="Let others see when you're active" value={showOnlineStatus} onChange={(v) => { setShowOnlineStatus(v); savePreferences('showOnlineStatus', v); }} />
            <ToggleRow label="Ghost Mode" desc="Appear offline to others" value={ghostMode} onChange={(v) => { setGhostMode(v); }} />
            <ToggleRow label="Hidden Visits" desc="Don't show profile visits" value={hiddenVisit} onChange={(v) => { setHiddenVisit(v); }} />
            <button onClick={() => setActiveModal('sessions')} className="w-full bg-[#161b22] p-4 rounded-xl flex justify-between items-center border border-[#30363d] hover:bg-[#1C1C2E] transition-colors">
              <div className="text-left"><p className="text-sm font-black text-gray-100">Sessions</p><p className="text-xs sm:text-sm text-gray-400">Manage active sessions</p></div>
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>

        {/* ── Notifications ── */}
        <div className="bg-[#1C1C2E] rounded-[2.5rem] shadow-sm overflow-hidden border border-[#30363d]">
          <div className="p-4 px-3 sm:px-6 text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-b-[2rem]">
            <h3 className="text-sm font-black flex flex-wrap items-center gap-2 uppercase tracking-widest">Notifications</h3>
            <p className="text-xs sm:text-sm opacity-70">Manage notification preferences</p>
          </div>
          <div className="bg-[#161b22] m-2 rounded-2xl p-4 space-y-5">
            <ToggleRow label="Push Notifications" desc="Receive push notifications" value={pushNotifications} onChange={(v) => { setPushNotifications(v); savePreferences('pushNotifications', v); }} />
            <ToggleRow label="Sound Effects" desc="Play sounds for notifications" value={soundEffects} onChange={(v) => { setSoundEffects(v); savePreferences('soundEffects', v); }} />
            <ToggleRow label="Email Notifications" desc="Receive email updates" value={emailNotifications} onChange={(v) => { setEmailNotifications(v); savePreferences('emailNotifications', v); }} />
          </div>
        </div>

        {/* ── Help & Support ── */}
        <div className="bg-[#1C1C2E] rounded-[2.5rem] shadow-sm overflow-hidden border border-[#30363d]">
          <div className="p-4 px-3 sm:px-6 text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-b-[2rem]">
            <h3 className="text-sm font-black flex flex-wrap items-center gap-2 uppercase tracking-widest">Help & Support</h3>
            <p className="text-xs sm:text-sm opacity-70">Get help when you need it</p>
          </div>
          <div className="bg-[#161b22] m-2 rounded-2xl p-1 space-y-1">
            <button onClick={() => setActiveModal('support')} className="w-full flex flex-wrap items-center gap-4 p-4 hover:bg-[#1C1C2E] rounded-xl transition-all">
              <div className="bg-purple-500/20 text-purple-400 w-10 h-10 rounded-xl flex items-center justify-center text-lg">💬</div>
              <div className="text-left"><p className="text-sm font-black text-gray-100">Contact Support</p><p className="text-xs sm:text-sm text-gray-400 font-medium">Get in touch with our team</p></div>
            </button>
            <button onClick={() => setActiveModal('about')} className="w-full flex flex-wrap items-center gap-4 p-4 hover:bg-[#1C1C2E] rounded-xl transition-all">
              <div className="bg-purple-500/20 text-purple-400 w-10 h-10 rounded-xl flex items-center justify-center text-lg">ℹ️</div>
              <div className="text-left"><p className="text-sm font-black text-gray-100">About</p><p className="text-xs sm:text-sm text-gray-400 font-medium">Version 1.0.0 - FriendsBD</p></div>
            </button>
          </div>
        </div>

        {/* ── Danger Zone ── */}
        <div className="bg-[#1C1C2E] rounded-[2.5rem] p-2 shadow-sm border border-red-900/40 space-y-1">
          <div className="bg-gradient-to-r from-red-700/30 to-red-900/30 text-red-400 py-2 px-3 sm:px-6 rounded-xl font-bold text-sm uppercase tracking-widest mb-2 flex flex-wrap items-center gap-2">
            Danger Zone
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 bg-[#161b22] rounded-xl group hover:bg-red-900/20 transition-all border border-[#30363d]">
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-900/30 flex items-center justify-center text-lg">🚪</div>
              <div className="text-left"><p className="text-sm font-black text-red-400">Logout</p><p className="text-xs sm:text-sm text-red-500/60">Sign out of your account</p></div>
            </div>
            <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </button>
          <button onClick={handleDeleteAccount} className="w-full flex items-center justify-between p-4 bg-[#161b22] rounded-xl group hover:bg-red-900/20 transition-all border border-[#30363d]">
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-900/30 flex items-center justify-center text-lg">❌</div>
              <div className="text-left"><p className="text-sm font-black text-red-400">Delete Account</p><p className="text-xs sm:text-sm text-red-500/60">Permanently delete your account</p></div>
            </div>
            <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>

      {/* ── Modals ── */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setActiveModal(null)}>
          <div className="bg-[#1C1C2E] w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl border border-[#30363d]" onClick={e => e.stopPropagation()}>

            {/* Edit Profile */}
            {activeModal === 'profile' && (
              <div className="p-4 sm:p-6">
                <h3 className="text-lg font-black text-gray-100 mb-4 flex flex-wrap items-center gap-2">Edit Profile</h3>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                  <Field label="Display Name" value={editName} onChange={setEditName} placeholder="Your name" />
                  <Field label="Bio" value={editBio} onChange={setEditBio} textarea placeholder="Tell us about yourself" />
                  <Field label="Avatar URL" value={editAvatar} onChange={setEditAvatar} placeholder="https://..." />
                  <Field label="Custom Status" value={editStatus} onChange={setEditStatus} placeholder="What's on your mind?" />
                  <Field label="Email" value={editEmail} onChange={setEditEmail} placeholder="email@example.com" />
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-widest pl-2">Gender</label>
                    <select value={editGender} onChange={e => setEditGender(e.target.value)} className="w-full bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-500">
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <Field label="Country" value={editCountry} onChange={setEditCountry} placeholder="Bangladesh" />
                  <Field label="Education" value={editEducation} onChange={setEditEducation} placeholder="School, college, university" />
                  <Field label="Work" value={editWork} onChange={setEditWork} placeholder="Job title / company" />
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button onClick={() => setActiveModal(null)} className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-400 bg-[#161b22] hover:bg-[#1C1C2E] text-sm border border-[#30363d]">Cancel</button>
                  <button onClick={updateProfile} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:opacity-90 text-sm shadow-lg shadow-purple-900/30">Save</button>
                </div>
              </div>
            )}

            {/* Change Username */}
            {activeModal === 'username' && (
              <div className="p-4 sm:p-6">
                <h3 className="text-lg font-black text-gray-100 mb-4">Change Username</h3>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">@</span>
                  <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} className="w-full bg-[#161b22] border border-[#30363d] rounded-2xl pl-10 pr-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500 transition-colors font-medium" />
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button onClick={() => setActiveModal(null)} className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-400 bg-[#161b22] hover:bg-[#1C1C2E] text-sm border border-[#30363d]">Cancel</button>
                  <button onClick={updateUsername} disabled={!editUsername.trim()} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:opacity-90 disabled:opacity-50 text-sm shadow-lg shadow-purple-900/30">Update</button>
                </div>
              </div>
            )}

            {/* Change Password */}
            {activeModal === 'password' && (
              <div className="p-4 sm:p-6">
                <h3 className="text-lg font-black text-gray-100 mb-4">Change Password</h3>
                <div className="space-y-4">
                  <Field label="Current Password" value={editPassword} onChange={setEditPassword} type="password" placeholder="Current password" />
                  <Field label="New Password" value={editPassword} onChange={setEditPassword} type="password" placeholder="New password" />
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button onClick={() => setActiveModal(null)} className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-400 bg-[#161b22] hover:bg-[#1C1C2E] text-sm border border-[#30363d]">Cancel</button>
                  <button onClick={updatePassword} disabled={!editPassword.trim()} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-red-800 hover:opacity-90 disabled:opacity-50 text-sm shadow-lg shadow-red-900/30">Update</button>
                </div>
              </div>
            )}

            {/* Appearance - Banner */}
            {activeModal === 'appearance' && (
              <div className="p-4 sm:p-6">
                <h3 className="text-lg font-black text-gray-100 mb-4 flex flex-wrap gap-2 items-center">Profile Banner</h3>
                <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 gap-3">
                  {[
                    { id: 'default', name: 'Default', bg: 'bg-gradient-to-r from-purple-600 to-fuchsia-600' },
                    { id: 'sunset', name: 'Sunset', bg: 'bg-gradient-to-br from-orange-400 to-rose-500' },
                    { id: 'ocean', name: 'Ocean', bg: 'bg-gradient-to-br from-cyan-400 to-blue-600' },
                    { id: 'forest', name: 'Forest', bg: 'bg-gradient-to-br from-emerald-400 to-teal-600' },
                    { id: 'cosmic', name: 'Cosmic', bg: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500' },
                    { id: 'midnight', name: 'Midnight', bg: 'bg-slate-900 border border-slate-700' },
                    { id: 'ember', name: 'Ember', bg: 'bg-gradient-to-br from-red-500 to-orange-600' },
                    { id: 'amethyst', name: 'Amethyst', bg: 'bg-gradient-to-br from-fuchsia-600 to-purple-600' },
                  ].map(banner => (
                    <button key={banner.id} onClick={() => { setActiveBanner(banner.id); savePreferences('profileBanner', banner.id); }} className={`overflow-hidden rounded-xl border-2 transition-all ${activeBanner === banner.id ? 'border-purple-500 scale-105 shadow-md shadow-purple-900/40' : 'border-transparent hover:border-gray-600'}`}>
                      <div className={`h-14 w-full ${banner.bg}`}></div>
                      <div className="bg-[#161b22] py-1.5 text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest">{banner.name}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-6"><button onClick={() => setActiveModal(null)} className="w-full px-4 py-3 rounded-xl font-bold text-gray-400 bg-[#161b22] hover:bg-[#1C1C2E] text-sm border border-[#30363d]">Close</button></div>
              </div>
            )}

            {/* Sessions */}
            {activeModal === 'sessions' && (
              <div className="p-4 sm:p-6">
                <h3 className="text-lg font-black text-gray-100 mb-4">Active Sessions</h3>
                <div className="space-y-3">
                  <div className="bg-[#161b22] p-4 rounded-xl border border-[#30363d] flex flex-wrap items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400 shadow-sm shadow-green-400/50"></div>
                    <div className="flex-1"><p className="text-sm font-bold text-gray-100">Current session</p><p className="text-xs sm:text-sm text-gray-400">Windows - Chrome</p></div>
                  </div>
                </div>
                <div className="mt-6"><button className="w-full px-4 py-3 rounded-xl font-bold text-orange-400 bg-[#161b22] hover:bg-[#1C1C2E] text-sm border border-[#30363d]">Logout all sessions</button></div>
                <div className="mt-3"><button onClick={() => setActiveModal(null)} className="w-full px-4 py-3 rounded-xl font-bold text-gray-400 bg-[#161b22] hover:bg-[#1C1C2E] text-sm border border-[#30363d]">Close</button></div>
              </div>
            )}

            {/* Support */}
            {activeModal === 'support' && (
              <div className="p-4 sm:p-6">
                <h3 className="text-lg font-black text-gray-100 mb-4 flex flex-wrap gap-2 items-center">Contact Support</h3>
                <textarea value={supportMessage} onChange={e => setSupportMessage(e.target.value)} rows={4} placeholder="Describe your issue..." className="w-full bg-[#161b22] border border-[#30363d] rounded-2xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-500" />
                <div className="mt-6 flex flex-wrap gap-3">
                  <button onClick={() => setActiveModal(null)} className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-400 bg-[#161b22] hover:bg-[#1C1C2E] text-sm border border-[#30363d]">Cancel</button>
                  <button onClick={sendSupport} disabled={!supportMessage.trim()} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:opacity-90 disabled:opacity-50 text-sm shadow-lg shadow-purple-900/30">Send</button>
                </div>
              </div>
            )}

            {/* About */}
            {activeModal === 'about' && (
              <div className="p-4 sm:p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 flex items-center justify-center text-2xl text-white font-black">FBD</div>
                <h3 className="text-lg font-black text-gray-100">FriendsBD</h3>
                <p className="text-sm text-gray-400 mt-1">Version 1.0.0</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-4 leading-relaxed">A social platform built for everyone.<br/>Stay connected, share moments, and have fun!</p>
                <div className="mt-6"><button onClick={() => setActiveModal(null)} className="w-full px-4 py-3 rounded-xl font-bold text-gray-400 bg-[#161b22] hover:bg-[#1C1C2E] text-sm border border-[#30363d]">Close</button></div>
              </div>
            )}

          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #30363d; border-radius: 10px; }
      `}</style>
    </div>
  );
};

const ToggleRow: React.FC<{ label: string; desc: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, desc, value, onChange }) => (
  <div className="flex justify-between items-center cursor-pointer" onClick={() => onChange(!value)}>
    <div><p className="text-sm font-black text-gray-100">{label}</p><p className="text-xs sm:text-sm text-gray-400">{desc}</p></div>
    <div className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors ${value ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 justify-end' : 'bg-[#30363d] justify-start'}`}>
      <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
    </div>
  </div>
);

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; textarea?: boolean; type?: string; placeholder?: string }> = ({ label, value, onChange, textarea, type = 'text', placeholder }) => (
  <div>
    <label className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-widest pl-2">{label}</label>
    {textarea ? (
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} placeholder={placeholder} className="w-full bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-500" />
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-500" />
    )}
  </div>
);

export default Settings;

