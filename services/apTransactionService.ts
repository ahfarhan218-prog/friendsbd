import { API_BASE } from './mongoService';
import { AP_RULES, validateArchiveCooldown, APRuleType } from '../utils/apEconomyRules';

const apiFetch = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) throw new Error(`AP API ${path} failed: ${res.status}`);
  return res.json();
};

export const apTransactionService = {
  /**
   * Adjusts a user's AP balance via the MongoDB API.
   * Enforces 6-hour cooldown check for ARCHIVE_CREATED.
   */
  adjustUserAP: async (userId: string, actionType: APRuleType): Promise<{ success: boolean; newBalance: number }> => {
    const amountDelta = AP_RULES[actionType];

    try {
      // First fetch the current user data for balance and cooldown checks
      const userRes = await fetch(`${API_BASE}/users/${userId}`);
      if (!userRes.ok) throw new Error(`User ${userId} does not exist.`);
      const userData = await userRes.json();

      const currentBalance = userData.balance_ap || 0;

      // Enforce cooldown for ARCHIVE_CREATED
      if (actionType === 'ARCHIVE_CREATED') {
        const lastArchive = userData.last_archive_created_at;
        const cooldownCheck = validateArchiveCooldown(lastArchive);
        if (!cooldownCheck.allowed) {
          throw new Error('Cooldown active. You can create only 1 archive every 6 hours.');
        }
      }

      const result = await apiFetch<{ success: boolean; newBalance: number }>('/ap/adjust', {
        method: 'POST',
        body: JSON.stringify({ userId, actionType, amountDelta, currentBalance })
      });

      return result;
    } catch (error: any) {
      console.error(`AP Transaction failed for user ${userId} on action ${actionType}:`, error);
      throw error;
    }
  },

  /**
   * Simplified in-context AP adjustment (used when combined with other operations).
   * In MongoDB version, this just calls the same API endpoint.
   */
  adjustUserAPInTransaction: async (
    _transaction: any, // unused in MongoDB version
    userId: string,
    actionType: APRuleType
  ): Promise<{ amountDelta: number; newBalance: number }> => {
    const amountDelta = AP_RULES[actionType];

    const userRes = await fetch(`${API_BASE}/users/${userId}`);
    if (!userRes.ok) throw new Error(`User ${userId} does not exist.`);
    const userData = await userRes.json();

    const currentBalance = userData.balance_ap || 0;

    if (actionType === 'ARCHIVE_CREATED') {
      const cooldownCheck = validateArchiveCooldown(userData.last_archive_created_at);
      if (!cooldownCheck.allowed) {
        throw new Error('Cooldown active. You can create only 1 archive every 6 hours.');
      }
    }

    const result = await apiFetch<{ success: boolean; newBalance: number }>('/ap/adjust', {
      method: 'POST',
      body: JSON.stringify({ userId, actionType, amountDelta, currentBalance })
    });

    return { amountDelta, newBalance: result.newBalance };
  }
};
