export const AP_RULES = {
  ONLINE_TIME_PER_HOUR: 10.0,
  SHOUT_POSTED: 0.3,
  SHOUT_DELETED: -0.3,
  QUIZ_TOPIC_POSTED: 2.0,
  QUIZ_TOPIC_DELETED: -2.0,
  MAIN_CHAT_POSTED: 0.1,
  MCG_COMPLETED: 15.0,
  SENDING_GIFT: 3.0,
  GOLDEN_COIN_EARNED: 10.0,
  SILVER_COIN_COLOR_BALL: 5.0,
  ARCHIVE_CREATED: 5.0, // Strict Cooldown: 1 per 6 Hours
  RECHARGE_CARD_TICKET_BUY: 10.0,
  PREMIUM_UPGRADE: 20.0,
  SUBSCRIBE_ROULETTE_SYSTEM: 5.0, // (GCRS, CBRS, SCRS)
  USER_FUN_UTILIZED: 2.0,
};

export type APRuleType = keyof typeof AP_RULES;

/**
 * Checks if the user is allowed to create a new archive (6-hour cooldown).
 * @param lastArchiveCreatedAt Timestamp or number representing the last creation time
 * @returns Object indicating if creation is allowed and the remaining milliseconds
 */
export const validateArchiveCooldown = (lastArchiveCreatedAt: any): { allowed: boolean; remainingMs: number } => {
  if (!lastArchiveCreatedAt) {
    return { allowed: true, remainingMs: 0 };
  }

  let lastTimeMs = 0;
  if (typeof lastArchiveCreatedAt === 'number') {
    lastTimeMs = lastArchiveCreatedAt;
  } else if (lastArchiveCreatedAt && typeof lastArchiveCreatedAt.toMillis === 'function') {
    lastTimeMs = lastArchiveCreatedAt.toMillis();
  } else if (lastArchiveCreatedAt instanceof Date) {
    lastTimeMs = lastArchiveCreatedAt.getTime();
  } else if (lastArchiveCreatedAt && lastArchiveCreatedAt.seconds) {
    lastTimeMs = lastArchiveCreatedAt.seconds * 1000 + Math.floor((lastArchiveCreatedAt.nanoseconds || 0) / 1000000);
  } else {
    // Fallback parsing for ISO strings or other representations
    const parsed = Date.parse(lastArchiveCreatedAt);
    if (!isNaN(parsed)) {
      lastTimeMs = parsed;
    }
  }

  const now = Date.now();
  const cooldownMs = 6 * 60 * 60 * 1000; // 6 hours
  const diff = now - lastTimeMs;

  if (diff >= cooldownMs) {
    return { allowed: true, remainingMs: 0 };
  }

  return { allowed: false, remainingMs: cooldownMs - diff };
};
