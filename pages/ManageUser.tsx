import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminPanelContainer from '../components/AdminPanelContainer';
import { mongoService } from '../services/mongoService';

const ManageUser: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load current user (Staff)
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('user_session') || '{}');
      if (s && s.id) {
        if (s.role !== 'admin' && s.role !== 'moderator') {
          // Redirect non-staff to home
          navigate('/');
          return;
        }
        setCurrentUser(s);
      } else {
        navigate('/login');
      }
    } catch {
      navigate('/login');
    }
  }, [navigate]);

  // Load target user
  useEffect(() => {
    if (!userId) return;

    const unsub = mongoService.listenUsers((users) => {
      const u = users.find(user => user.id === userId);
      if (u) {
        setTargetUser(u);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-white font-sans">
        <p>Loading Management Interface...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] p-4 sm:p-6 md:p-8 font-sans overflow-x-hidden">
      <div className="w-full max-w-[800px] mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="mb-4 bg-transparent border-none text-gray-400 cursor-pointer flex items-center gap-2 font-semibold hover:text-white transition-colors text-sm"
        >
          ← Back to Profile
        </button>
        <h1 className="text-white text-xl md:text-2xl font-bold mb-4">Manage User</h1>
        <AdminPanelContainer currentUser={currentUser} preSelectUser={targetUser} />
      </div>
    </div>
  );
};

export default ManageUser;
