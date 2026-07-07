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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090d16', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
        <p>Loading Management Interface...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#090d16', padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ marginBottom: '1rem', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
        >
          ← Back to Profile
        </button>
        <h1 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>Manage User</h1>
        <AdminPanelContainer currentUser={currentUser} preSelectUser={targetUser} />
      </div>
    </div>
  );
};

export default ManageUser;
