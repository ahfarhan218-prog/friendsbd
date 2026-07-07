/**
 * ProtectedRoute.tsx
 * Wraps authenticated routes. If no valid local session exists,
 * redirects to /login immediately (before any API calls).
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();

  const raw = localStorage.getItem('user_session');
  if (!raw) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  let session: any;
  try {
    session = JSON.parse(raw);
  } catch (_) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Quick local expiry check (no network needed)
  if (!session?.sessionExpiry || Date.now() > session.sessionExpiry) {
    localStorage.removeItem('user_session');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
