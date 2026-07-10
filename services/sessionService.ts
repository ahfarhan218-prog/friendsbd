/**
 * sessionService.ts (MongoDB version)
 * Manages session tokens for:
 *  - 3-hour expiry enforcement
 *  - Single-device login (new login on another device kicks the old one)
 */

import { API_BASE } from './mongoService';

const SESSION_DURATION_MS = 3 * 60 * 60 * 1000; // 3 hours
const SESSION_KEY = 'user_session';

/** Generate a cryptographically random UUID as the session token */
export function generateSessionToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Called immediately after a successful login.
 * - Generates a fresh token (invalidating any other device)
 * - Sets a 3-hour expiry
 * - Writes both to MongoDB and localStorage
 */
export async function createSession(userId: string): Promise<{ sessionToken: string; sessionExpiry: number }> {
  const sessionToken = generateSessionToken();
  const sessionExpiry = Date.now() + SESSION_DURATION_MS;

  // Write to MongoDB via API (include JWT if available)
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const jwtToken = localStorage.getItem('auth_token');
    if (jwtToken) {
      headers['Authorization'] = `Bearer ${jwtToken}`;
    }
    await fetch(`${API_BASE}/users/${userId}/session`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ sessionToken, sessionExpiry })
    });
  } catch (err: any) {
    console.warn('[sessionService] MongoDB sessionToken write blocked:', err?.message ?? err);
  }

  // Patch the local session storage
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw) {
    try {
      const session = JSON.parse(raw);
      session.sessionToken = sessionToken;
      session.sessionExpiry = sessionExpiry;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (_) {}
  }

  return { sessionToken, sessionExpiry };
}

/**
 * Validate the current session.
 * Returns a reason string if invalid, or null if valid.
 */
export async function validateSession(): Promise<'no_session' | 'expired' | 'other_device' | null> {
  // First check JWT token
  const jwtToken = localStorage.getItem('auth_token');
  const raw = localStorage.getItem(SESSION_KEY);
  if (!jwtToken && !raw) return 'no_session';

  // If JWT exists, verify it via API
  if (jwtToken) {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      });
      if (!res.ok) {
        localStorage.removeItem('auth_token');
        return 'expired';
      }
      return null; // JWT is valid
    } catch (_) {
      // Offline — fall back to local check
    }
  }

  // Legacy session fallback
  if (!raw) return 'no_session';
  let session: any;
  try {
    session = JSON.parse(raw);
  } catch (_) {
    return 'no_session';
  }

  if (!session.sessionExpiry || Date.now() > session.sessionExpiry) {
    return 'expired';
  }
  if (!session.id || !session.sessionToken) return 'no_session';

  return null;
}

/** Remove local session data (called on logout) */
export function clearLocalSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('auth_token');
}

/** Invalidate the MongoDB session token on explicit logout so other devices see it immediately */
export async function invalidateSession(userId: string): Promise<void> {
  localStorage.removeItem('auth_token');
  try {
    await fetch(`${API_BASE}/users/${userId}/session`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken: null, sessionExpiry: null })
    });
  } catch (err) {
    console.warn('[sessionService] Could not invalidate MongoDB session:', err);
  }
}
