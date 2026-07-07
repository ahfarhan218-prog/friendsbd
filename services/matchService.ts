import { API_BASE } from './mongoService';
import { MatchState } from '../types';

const apiFetch = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) throw new Error(`Match API ${path} failed: ${res.status}`);
  return res.json();
};

// Polling-based listener for match state
function createPoller<T>(
  fetchFn: () => Promise<T>,
  callback: (data: T) => void,
  intervalMs: number
): () => void {
  let active = true;
  const run = async () => {
    if (!active) return;
    try {
      const data = await fetchFn();
      if (active) callback(data);
    } catch (_) {}
    if (active) setTimeout(run, intervalMs);
  };
  run();
  return () => { active = false; };
}

export const matchService = {
  async createMatch(topicId: string, teamA: string, teamB: string): Promise<string> {
    const data = await apiFetch<{ id: string }>('/matches', {
      method: 'POST',
      body: JSON.stringify({ topicId, teamA, teamB })
    });
    return data.id;
  },

  async getMatchByTopic(topicId: string): Promise<MatchState | null> {
    return apiFetch<MatchState | null>(`/matches/by-topic/${topicId}`);
  },

  async updateMatch(matchId: string, updates: Partial<MatchState>): Promise<void> {
    await apiFetch(`/matches/${matchId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  },

  listenToMatchByTopic(topicId: string, callback: (match: MatchState | null) => void): () => void {
    return createPoller(
      () => apiFetch<MatchState | null>(`/matches/by-topic/${topicId}`),
      callback,
      2000
    );
  }
};
