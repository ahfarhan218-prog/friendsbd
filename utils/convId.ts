/**
 * Generates a deterministic, symmetric conversation ID for two users.
 * Sorting ensures both users get the same ID regardless of who initiates.
 *
 * Example:
 *   getConvId('user_abc', 'user_xyz') → 'pm_user_abc_user_xyz'
 *   getConvId('user_xyz', 'user_abc') → 'pm_user_abc_user_xyz' (same!)
 */
export function getConvId(userIdA: string, userIdB: string): string {
  const sorted = [userIdA, userIdB].sort();
  return `pm_${sorted[0]}_${sorted[1]}`;
}
