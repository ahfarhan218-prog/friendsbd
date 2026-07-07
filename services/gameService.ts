import { triggerToast } from '../components/NotificationToast';
import { GameLog, CoinStats } from '../types';
import { mongoService, API_BASE } from './mongoService';
import { apService } from './apService';

/**
 * Real-time Multi-Tier Coin Service (v4.0 — MongoDB Backend)
 * Firebase replaced with MongoDB REST API + polling.
 */

const STORAGE_COIN_ID = 'friends_bd_active_coin';
const STORAGE_SILVER_ID = 'friends_bd_active_silver';
const STORAGE_COLOR_ID = 'friends_bd_active_color';
const STORAGE_GAME_LOGS = 'friends_bd_game_logs';
const STORAGE_SILVER_LOGS = 'friends_bd_silver_logs';
const STORAGE_COLOR_LOGS = 'friends_bd_color_logs';
const STORAGE_NEXT_SPAWN = 'friends_bd_next_spawn';
const STORAGE_NEXT_SILVER = 'friends_bd_next_silver';
const STORAGE_NEXT_COLOR = 'friends_bd_next_color';

// Local helper for safe JSON parsing
const safeParse = (key: string, fallback: any) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    console.error(`Storage error for ${key}:`, e);
    return fallback;
  }
};

// Helper to get current date/time in Bangladesh Time (UTC+6)
const getDhakaDate = (): Date => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * 6);
};

const apiFetch = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) throw new Error(`Game API ${path} failed: ${res.status}`);
  return res.json();
};

// Fetch game state from API
const getGameState = async (gameId: string): Promise<any> => {
  try {
    return await apiFetch(`/games/${gameId}`);
  } catch {
    return null;
  }
};

// Update game state via API
const updateGameState = async (gameId: string, data: any): Promise<any> => {
  return apiFetch(`/games/${gameId}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
};

export const gameService = {
  initSpawner: () => {
    if ((window as any)._friends_bd_engine_active) return;
    (window as any)._friends_bd_engine_active = true;

    // Clear stale nextSpawn values from previous sessions
    const staleKeys = [STORAGE_NEXT_SPAWN, STORAGE_NEXT_SILVER, STORAGE_NEXT_COLOR];
    staleKeys.forEach(key => {
      const val = localStorage.getItem(key);
      if (val && parseInt(val) < Date.now()) {
        localStorage.removeItem(key);
      }
    });

    // Poll game states from MongoDB and dispatch events
    const pollGameStates = async () => {
      try {
        const games = await apiFetch<any[]>('/games');
        games.forEach((data: any) => {
          const gameId = data.id;
          const type = gameId === 'golden_coin' ? 'gold' : gameId === 'silver_coin' ? 'silver' : 'color';
          const activeKey = type === 'gold' ? STORAGE_COIN_ID : type === 'silver' ? STORAGE_SILVER_ID : STORAGE_COLOR_ID;
          const nextKey = type === 'gold' ? STORAGE_NEXT_SPAWN : type === 'silver' ? STORAGE_NEXT_SILVER : STORAGE_NEXT_COLOR;

          const prevState = safeParse(activeKey, null);
          const wasActive = prevState?.active ?? false;

          localStorage.setItem(activeKey, JSON.stringify({ 
            id: `${gameId.toUpperCase()}-${data.spawnTime}`, 
            active: data.active, 
            spawnTime: data.spawnTime 
          }));

          if (data.nextSpawnTime) {
            localStorage.setItem(nextKey, data.nextSpawnTime.toString());
          } else if (data.active) {
            localStorage.removeItem(nextKey);
          }

          // Dispatch events based on state changes
          window.dispatchEvent(new CustomEvent('coin-state-updated', { detail: { type, active: data.active } }));

          if (!wasActive && data.active) {
            window.dispatchEvent(new CustomEvent('coin-dropped', { detail: { type } }));
          } else if (wasActive && !data.active && data.claimedBy) {
            const claimEvent = type === 'gold' ? 'coin-claimed' : type === 'silver' ? 'silver-claimed' : 'color-claimed';
            const detail = {
              id: `${gameId.toUpperCase()}-${data.spawnTime}`,
              userId: data.claimedBy,
              username: data.claimedByName || 'Unknown',
              avatar: data.claimedByAvatar || 'https://picsum.photos/seed/user/100',
              pointsWon: 1,
              grabTime: data.claimTime - data.spawnTime,
              timestamp: data.claimTime
            };

            const logKey = type === 'gold' ? STORAGE_GAME_LOGS : type === 'silver' ? STORAGE_SILVER_LOGS : STORAGE_COLOR_LOGS;
            const logs = safeParse(logKey, []);
            if (!logs.some((l: any) => l.id === detail.id)) {
              localStorage.setItem(logKey, JSON.stringify([detail, ...logs].slice(0, 1000)));
            }

            window.dispatchEvent(new CustomEvent(claimEvent, { detail }));
          }
        });
      } catch (e) {
        // non-fatal
      }
    };

    // Start polling game states every 1.5s
    setInterval(pollGameStates, 1500);
    pollGameStates();

    // Golden Spawner Loop — drops every 13–18 minutes during 5 PM–12 AM BDT
    const goldLoop = async () => {
      const bdNow = getDhakaDate();
      const hours = bdNow.getHours();
      const isGameActiveTime = hours >= 17 && hours < 24;

      const isCoinActive = gameService.checkActiveCoin('gold');
      if (isCoinActive) {
        localStorage.removeItem(STORAGE_NEXT_SPAWN);
        setTimeout(goldLoop, 2000);
        return;
      }

      if (!isGameActiveTime) {
        localStorage.removeItem(STORAGE_NEXT_SPAWN);
        setTimeout(goldLoop, 5000);
        return;
      }

      let nextSpawnStored = localStorage.getItem(STORAGE_NEXT_SPAWN);
      if (!nextSpawnStored) {
        try {
          const data = await getGameState('golden_coin');
          if (data?.nextSpawnTime) {
            nextSpawnStored = data.nextSpawnTime.toString();
            localStorage.setItem(STORAGE_NEXT_SPAWN, nextSpawnStored);
          } else if (!data?.active) {
            const randomDelay = Math.floor(Math.random() * (1080000 - 780000 + 1) + 780000);
            const nextSpawnVal = Date.now() + randomDelay;
            await updateGameState('golden_coin', { nextSpawnTime: nextSpawnVal });
            nextSpawnStored = nextSpawnVal.toString();
            localStorage.setItem(STORAGE_NEXT_SPAWN, nextSpawnStored);
          }
        } catch (e) {
          const randomDelay = Math.floor(Math.random() * (1080000 - 780000 + 1) + 780000);
          nextSpawnStored = (Date.now() + randomDelay).toString();
          localStorage.setItem(STORAGE_NEXT_SPAWN, nextSpawnStored);
        }
      }

      const delay = nextSpawnStored ? parseInt(nextSpawnStored) - Date.now() : 0;
      if (delay > 0) {
        setTimeout(goldLoop, 2000);
        return;
      }

      try {
        const data = await getGameState('golden_coin');
        if (data?.active) {
          setTimeout(goldLoop, 2000);
          return;
        }
        await gameService.dropCoin('gold');
      } catch (err) {
        setTimeout(goldLoop, 5000);
        return;
      }

      setTimeout(goldLoop, 2000);
    };

    // Silver Spawner Loop
    const silverLoop = async () => {
      const bdNow = getDhakaDate();
      const hours = bdNow.getHours();
      const isGameActiveTime = hours >= 10 && hours < 15;

      const isSilverActive = gameService.checkActiveCoin('silver');
      if (isSilverActive) {
        localStorage.removeItem(STORAGE_NEXT_SILVER);
        setTimeout(silverLoop, 2000);
        return;
      }

      if (!isGameActiveTime) {
        localStorage.removeItem(STORAGE_NEXT_SILVER);
        setTimeout(silverLoop, 5000);
        return;
      }

      let nextSilver = localStorage.getItem(STORAGE_NEXT_SILVER);
      if (!nextSilver) {
        try {
          const data = await getGameState('silver_coin');
          if (data?.nextSpawnTime) {
            nextSilver = data.nextSpawnTime.toString();
            localStorage.setItem(STORAGE_NEXT_SILVER, nextSilver);
          } else if (!data?.active) {
            const randomDelay = Math.floor(Math.random() * (900000 - 600000 + 1) + 600000);
            const nextSpawnVal = Date.now() + randomDelay;
            await updateGameState('silver_coin', { nextSpawnTime: nextSpawnVal });
            nextSilver = nextSpawnVal.toString();
            localStorage.setItem(STORAGE_NEXT_SILVER, nextSilver);
          }
        } catch (e) {
          const randomDelay = Math.floor(Math.random() * (900000 - 600000 + 1) + 600000);
          nextSilver = (Date.now() + randomDelay).toString();
          localStorage.setItem(STORAGE_NEXT_SILVER, nextSilver);
        }
      }

      const delay = nextSilver ? parseInt(nextSilver) - Date.now() : 0;
      if (delay > 0) {
        setTimeout(silverLoop, 2000);
        return;
      }

      try {
        const data = await getGameState('silver_coin');
        if (data?.active) {
          setTimeout(silverLoop, 2000);
          return;
        }
        await gameService.dropCoin('silver');
      } catch (err) {
        setTimeout(silverLoop, 5000);
        return;
      }

      setTimeout(silverLoop, 2000);
    };

    // Color Ball Spawner Loop
    const colorLoop = async () => {
      const bdNow = getDhakaDate();
      const hours = bdNow.getHours();
      const isGameActiveTime = hours >= 17 && hours < 24;

      const isColorActive = gameService.checkActiveCoin('color');
      if (isColorActive) {
        localStorage.removeItem(STORAGE_NEXT_COLOR);
        setTimeout(colorLoop, 2000);
        return;
      }

      if (!isGameActiveTime) {
        localStorage.removeItem(STORAGE_NEXT_COLOR);
        setTimeout(colorLoop, 5000);
        return;
      }

      let nextColor = localStorage.getItem(STORAGE_NEXT_COLOR);
      if (!nextColor) {
        try {
          const data = await getGameState('color_ball');
          if (data?.nextSpawnTime) {
            nextColor = data.nextSpawnTime.toString();
            localStorage.setItem(STORAGE_NEXT_COLOR, nextColor);
          } else if (!data?.active) {
            const randomDelay = Math.floor(Math.random() * (900000 - 600000 + 1) + 600000);
            const nextSpawnVal = Date.now() + randomDelay;
            await updateGameState('color_ball', { nextSpawnTime: nextSpawnVal });
            nextColor = nextSpawnVal.toString();
            localStorage.setItem(STORAGE_NEXT_COLOR, nextColor);
          }
        } catch (e) {
          const randomDelay = Math.floor(Math.random() * (900000 - 600000 + 1) + 600000);
          nextColor = (Date.now() + randomDelay).toString();
          localStorage.setItem(STORAGE_NEXT_COLOR, nextColor);
        }
      }

      const delay = nextColor ? parseInt(nextColor) - Date.now() : 0;
      if (delay > 0) {
        setTimeout(colorLoop, 2000);
        return;
      }

      try {
        const data = await getGameState('color_ball');
        if (data?.active) {
          setTimeout(colorLoop, 2000);
          return;
        }
        await gameService.dropCoin('color');
      } catch (err) {
        setTimeout(colorLoop, 5000);
        return;
      }

      setTimeout(colorLoop, 2000);
    };

    goldLoop();
    silverLoop();
    colorLoop();
  },

  dropCoin: async (type: 'gold' | 'silver' | 'color') => {
    const docName = type === 'gold' ? 'golden_coin' : type === 'silver' ? 'silver_coin' : 'color_ball';
    const nextKey = type === 'gold' ? STORAGE_NEXT_SPAWN : type === 'silver' ? STORAGE_NEXT_SILVER : STORAGE_NEXT_COLOR;

    try {
      await updateGameState(docName, {
        active: true,
        spawnTime: Date.now(),
        claimedBy: null,
        claimTime: null,
        nextSpawnTime: null
      });
      localStorage.removeItem(nextKey);
      window.dispatchEvent(new CustomEvent('coin-dropped', { detail: { type } }));
    } catch (err) {
      console.error(`Failed to drop coin:`, err);
      throw err;
    }
  },

  setNextSpawnTime: async (type: 'gold' | 'silver' | 'color', timestamp: number) => {
    const docName = type === 'gold' ? 'golden_coin' : type === 'silver' ? 'silver_coin' : 'color_ball';
    const nextKey = type === 'gold' ? STORAGE_NEXT_SPAWN : type === 'silver' ? STORAGE_NEXT_SILVER : STORAGE_NEXT_COLOR;
    try {
      await updateGameState(docName, { nextSpawnTime: timestamp, active: false });
      localStorage.setItem(nextKey, timestamp.toString());
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error(`Failed to set next spawn time:`, err);
      throw err;
    }
  },

  claimCoin: async (userId: string, username: string, avatar: string): Promise<{ success: boolean, msg: string, dailyGrabs?: number }> => {
    const bdNow = getDhakaDate();
    const bdDateKey = `${bdNow.getFullYear()}-${String(bdNow.getMonth()+1).padStart(2,'0')}-${String(bdNow.getDate()).padStart(2,'0')}`;
    const DAILY_LIMIT = 5;

    try {
      // Fetch current game state and user data
      const [gameData, userData] = await Promise.all([
        getGameState('golden_coin'),
        apiFetch<any>(`/users/${userId}`)
      ]);

      if (!gameData || !gameData.active) {
        return { success: false, msg: 'Too slow! Already claimed.' };
      }

      // Check daily limit
      const dailyGrabData = userData.dailyGrabs || {};
      const todayGrabs = dailyGrabData[bdDateKey] || 0;
      if (todayGrabs >= DAILY_LIMIT) {
        return { success: false, msg: `Daily limit reached! You've grabbed ${todayGrabs}/${DAILY_LIMIT} coins today.`, dailyGrabs: todayGrabs };
      }

      // Claim the coin
      await updateGameState('golden_coin', {
        active: false,
        claimedBy: userId,
        claimedByName: username,
        claimedByAvatar: avatar,
        claimTime: Date.now()
      });

      // Update user rewards
      const newBalanceAp = (userData.balance_ap || 0) + 10;
      const newDailyGrabs = todayGrabs + 1;
      await apiFetch(`/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          goldenCoins: (userData.goldenCoins || 0) + 1,
          ap: (userData.ap || 0) + 10,
          totalAp: (userData.totalAp || 0) + 10,
          balance_ap: newBalanceAp,
          lastClaimId: `golden_coin_${gameData.spawnTime}`,
          dailyGrabs: { ...dailyGrabData, [bdDateKey]: newDailyGrabs }
        })
      });

      // Log AP transaction
      await apiFetch('/ap/adjust', {
        method: 'POST',
        body: JSON.stringify({ userId, actionType: 'GOLDEN_COIN_EARNED', amountDelta: 10, currentBalance: userData.balance_ap || 0 })
      });

      // Send reward notification
      await mongoService.addNotification(userId, {
        id: `reward_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        senderId: 'system', senderName: 'System',
        senderAvatar: 'https://i.pravatar.cc/100?img=12',
        type: 'REWARD',
        message: '🪙 You grabbed a Golden Coin! +1 Coin & +10 AP added to your profile.',
        timestamp: Date.now(), isRead: false, link: '/coin-game'
      });

      // Update local session
      const session = safeParse('user_session', {});
      if (session.id === userId) {
        session.goldenCoins = (session.goldenCoins || 0) + 1;
        session.balance_ap = newBalanceAp;
        if (!session.dailyGrabs) session.dailyGrabs = {};
        session.dailyGrabs[bdDateKey] = newDailyGrabs;
        localStorage.setItem('user_session', JSON.stringify(session));
        window.dispatchEvent(new Event('storage'));
      }

      apService.awardAP(10, 'Golden Coin Claimed', '🪙', true, false);
      return { success: true, msg: `LEGENDARY! +1 Golden Coin & +10 AP 🌟`, dailyGrabs: newDailyGrabs };

    } catch (err: any) {
      return { success: false, msg: err.message || 'Failed to claim coin.' };
    }
  },

  getTodayGrabCount: (userId: string): number => {
    try {
      const bdNow = getDhakaDate();
      const bdDateKey = `${bdNow.getFullYear()}-${String(bdNow.getMonth()+1).padStart(2,'0')}-${String(bdNow.getDate()).padStart(2,'0')}`;
      const session = safeParse('user_session', {});
      if (session.id !== userId) return 0;
      return (session.dailyGrabs && session.dailyGrabs[bdDateKey]) || 0;
    } catch (e) {
      return 0;
    }
  },

  claimSilverCoin: async (userId: string, username: string, avatar: string): Promise<{ success: boolean, msg: string }> => {
    try {
      const [gameData, userData] = await Promise.all([
        getGameState('silver_coin'),
        apiFetch<any>(`/users/${userId}`)
      ]);

      if (!gameData || !gameData.active) {
        return { success: false, msg: 'Too slow! Already claimed.' };
      }

      await updateGameState('silver_coin', {
        active: false,
        claimedBy: userId,
        claimedByName: username,
        claimedByAvatar: avatar,
        claimTime: Date.now()
      });

      const newBalanceAp = (userData.balance_ap || 0) + 5;
      await apiFetch(`/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          silverPoints: (userData.silverPoints || 0) + 1,
          ap: (userData.ap || 0) + 5,
          totalAp: (userData.totalAp || 0) + 5,
          balance_ap: newBalanceAp,
          lastClaimId: `silver_coin_${gameData.spawnTime}`
        })
      });

      await apiFetch('/ap/adjust', {
        method: 'POST',
        body: JSON.stringify({ userId, actionType: 'SILVER_COIN_COLOR_BALL', amountDelta: 5, currentBalance: userData.balance_ap || 0 })
      });

      await mongoService.addNotification(userId, {
        id: `reward_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        senderId: 'system', senderName: 'System',
        senderAvatar: 'https://i.pravatar.cc/100?img=12',
        type: 'REWARD',
        message: 'You successfully claimed a Silver Coin! +5 AP 🔘',
        timestamp: Date.now(), isRead: false, link: '/apps'
      });

      const session = safeParse('user_session', {});
      if (session.id === userId) {
        session.silverPoints = (session.silverPoints || 0) + 1;
        session.balance_ap = newBalanceAp;
        localStorage.setItem('user_session', JSON.stringify(session));
        window.dispatchEvent(new Event('storage'));
      }

      apService.awardAP(5, 'Silver Coin Claimed', '🔘', true, false);
      return { success: true, msg: `BOOM! +1 Silver Coin & +5 AP 🔘` };

    } catch (err: any) {
      return { success: false, msg: err.message || 'Failed to claim silver coin.' };
    }
  },

  claimColorBall: async (userId: string, username: string, avatar: string): Promise<{ success: boolean, msg: string }> => {
    try {
      const [gameData, userData] = await Promise.all([
        getGameState('color_ball'),
        apiFetch<any>(`/users/${userId}`)
      ]);

      if (!gameData || !gameData.active) {
        return { success: false, msg: 'Too slow! Already claimed.' };
      }

      await updateGameState('color_ball', {
        active: false,
        claimedBy: userId,
        claimedByName: username,
        claimedByAvatar: avatar,
        claimTime: Date.now()
      });

      const newBalanceAp = (userData.balance_ap || 0) + 5;
      await apiFetch(`/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          colorBalls: (userData.colorBalls || 0) + 1,
          ap: (userData.ap || 0) + 5,
          totalAp: (userData.totalAp || 0) + 5,
          balance_ap: newBalanceAp,
          lastClaimId: `color_ball_${gameData.spawnTime}`
        })
      });

      await apiFetch('/ap/adjust', {
        method: 'POST',
        body: JSON.stringify({ userId, actionType: 'SILVER_COIN_COLOR_BALL', amountDelta: 5, currentBalance: userData.balance_ap || 0 })
      });

      await mongoService.addNotification(userId, {
        id: `reward_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        senderId: 'system', senderName: 'System',
        senderAvatar: 'https://i.pravatar.cc/100?img=12',
        type: 'REWARD',
        message: 'You successfully claimed a Color Ball! +5 AP 🎨',
        timestamp: Date.now(), isRead: false, link: '/apps'
      });

      const session = safeParse('user_session', {});
      if (session.id === userId) {
        session.colorBalls = (session.colorBalls || 0) + 1;
        session.balance_ap = newBalanceAp;
        localStorage.setItem('user_session', JSON.stringify(session));
        window.dispatchEvent(new Event('storage'));
      }

      apService.awardAP(5, 'Color Ball Claimed', '🎨', true, false);
      return { success: true, msg: `BOOM! +1 Color Ball & +5 AP 🎨` };

    } catch (err: any) {
      return { success: false, msg: err.message || 'Failed to claim color ball.' };
    }
  },

  getLogs: (filter: 'all' | 'weekly' | 'daily'): GameLog[] => {
    const logs: GameLog[] = safeParse(STORAGE_GAME_LOGS, []);
    const now = Date.now();
    return filter === 'all' ? logs : logs.filter(l => now - l.timestamp < (filter === 'daily' ? 86400000 : 604800000));
  },

  getLeaderboard: (filter: 'all' | 'weekly' | 'daily'): CoinStats[] => {
    const logs = gameService.getLogs(filter);
    const grouped = logs.reduce((acc, log) => {
      if (!acc[log.userId]) acc[log.userId] = { userId: log.userId, username: log.username, avatar: log.avatar, totalGrabbed: 0, totalValue: 0, fastestGrab: Infinity, lastWin: 0 };
      const stats = acc[log.userId];
      stats.totalGrabbed += 1;
      stats.totalValue += log.pointsWon;
      if (log.grabTime < stats.fastestGrab) stats.fastestGrab = log.grabTime;
      if (log.timestamp > stats.lastWin) stats.lastWin = log.timestamp;
      return acc;
    }, {} as Record<string, CoinStats>);
    return (Object.values(grouped) as CoinStats[]).sort((a, b) => b.totalGrabbed - a.totalGrabbed).slice(0, 10);
  },

  getSilverLeaderboard: (filter: 'all' | 'weekly' | 'daily'): CoinStats[] => {
    const logs: GameLog[] = safeParse(STORAGE_SILVER_LOGS, []);
    const now = Date.now();
    const filtered = filter === 'all' ? logs : logs.filter(l => now - l.timestamp < (filter === 'daily' ? 86400000 : 604800000));
    const grouped = filtered.reduce((acc, log) => {
      if (!acc[log.userId]) acc[log.userId] = { userId: log.userId, username: log.username, avatar: log.avatar, totalGrabbed: 0, totalValue: 0, fastestGrab: Infinity, lastWin: 0 };
      acc[log.userId].totalGrabbed++;
      acc[log.userId].totalValue += log.pointsWon;
      if (log.grabTime < acc[log.userId].fastestGrab) acc[log.userId].fastestGrab = log.grabTime;
      if (log.timestamp > acc[log.userId].lastWin) acc[log.userId].lastWin = log.timestamp;
      return acc;
    }, {} as Record<string, CoinStats>);
    return (Object.values(grouped) as CoinStats[]).sort((a, b) => b.totalGrabbed - a.totalGrabbed).slice(0, 10);
  },

  getColorLeaderboard: (filter: 'all' | 'weekly' | 'daily'): CoinStats[] => {
    const logs: GameLog[] = safeParse(STORAGE_COLOR_LOGS, []);
    const now = Date.now();
    const filtered = filter === 'all' ? logs : logs.filter(l => now - l.timestamp < (filter === 'daily' ? 86400000 : 604800000));
    const grouped = filtered.reduce((acc, log) => {
      if (!acc[log.userId]) acc[log.userId] = { userId: log.userId, username: log.username, avatar: log.avatar, totalGrabbed: 0, totalValue: 0, fastestGrab: Infinity, lastWin: 0 };
      acc[log.userId].totalGrabbed++;
      acc[log.userId].totalValue += log.pointsWon;
      if (log.grabTime < acc[log.userId].fastestGrab) acc[log.userId].fastestGrab = log.grabTime;
      if (log.timestamp > acc[log.userId].lastWin) acc[log.userId].lastWin = log.timestamp;
      return acc;
    }, {} as Record<string, CoinStats>);
    return (Object.values(grouped) as CoinStats[]).sort((a, b) => b.totalGrabbed - a.totalGrabbed).slice(0, 10);
  },

  checkActiveCoin: (type: 'gold' | 'silver' | 'color'): boolean => {
    const key = type === 'gold' ? STORAGE_COIN_ID : type === 'silver' ? STORAGE_SILVER_ID : STORAGE_COLOR_ID;
    const data = safeParse(key, null);
    return data ? data.active : false;
  },

  getNextSpawnTime: (type: 'gold' | 'silver' | 'color'): number | null => {
    const key = type === 'gold' ? STORAGE_NEXT_SPAWN : type === 'silver' ? STORAGE_NEXT_SILVER : STORAGE_NEXT_COLOR;
    const val = localStorage.getItem(key);
    return val ? parseInt(val) : null;
  }
};
