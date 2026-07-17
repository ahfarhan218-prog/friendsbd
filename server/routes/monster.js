const express = require('express');
const router = express.Router();
const User = require('../models/User');
const MonsterSession = require('../models/MonsterSession');
const MonsterMarket = require('../models/MonsterMarket');
const Notification = require('../models/Notification');

// Elements: Grass, Normal, Electric, Dragon, Ice, Fire, Ground, Water, Dark, Wind, Rock, Poison, Ghost
const RARITY_DATA = {
  Common: {
    monsters: [
      { name: 'Neko', element: 'Grass' },
      { name: 'Chillax', element: 'Normal' },
      { name: 'Bolt', element: 'Electric' },
      { name: 'Slime', element: 'Poison' },
      { name: 'Spore', element: 'Grass' },
      { name: 'Pebble', element: 'Rock' },
      { name: 'Twig', element: 'Grass' }
    ],
    ap: 5, plusses: 15, baseStat: 10
  },
  Uncommon: {
    monsters: [
      { name: 'Drako', element: 'Dragon' },
      { name: 'Fenrir', element: 'Ice' },
      { name: 'Pyro', element: 'Fire' },
      { name: 'Aero', element: 'Wind' },
      { name: 'Golem', element: 'Rock' },
      { name: 'Viper', element: 'Poison' },
      { name: 'Frost', element: 'Ice' }
    ],
    ap: 10, plusses: 30, baseStat: 25
  },
  Rare: {
    monsters: [
      { name: 'Zilla', element: 'Ground' },
      { name: 'Flameon', element: 'Fire' },
      { name: 'Aquon', element: 'Water' },
      { name: 'Terra', element: 'Ground' },
      { name: 'Voltex', element: 'Electric' },
      { name: 'Phantom', element: 'Ghost' }
    ],
    ap: 15, plusses: 55, baseStat: 50
  },
  Legendary: {
    monsters: [
      { name: 'Shadow', element: 'Dark' },
      { name: 'Bahamut', element: 'Dragon' },
      { name: 'Leviathan', element: 'Water' },
      { name: 'Phoenix', element: 'Fire' }
    ],
    ap: 30, plusses: 100, baseStat: 100
  }
};

const ZONES = {
  'Forest': { cost: 3, staminaCost: 10, durationMins: 10, probs: { Common: 65, Uncommon: 20, Rare: 10, Legendary: 5 } },
  'Cave': { cost: 10, staminaCost: 20, durationMins: 20, probs: { Uncommon: 45, Common: 30, Rare: 20, Legendary: 5 } },
  'Volcano': { cost: 25, staminaCost: 40, durationMins: 40, probs: { Rare: 50, Uncommon: 25, Legendary: 15, Common: 10 } },
  'Shadow Peak': { cost: 50, staminaCost: 60, durationMins: 90, probs: { Legendary: 50, Rare: 35, Uncommon: 10, Common: 5 } }
};

// Stamina Middleware
async function syncStamina(user) {
  if (user.stamina === undefined) user.stamina = 100;
  if (user.maxStamina === undefined) user.maxStamina = 100;
  if (!user.lastStaminaUpdate) user.lastStaminaUpdate = Date.now();

  const now = Date.now();
  const timePassed = now - user.lastStaminaUpdate;
  const regenAmount = Math.floor(timePassed / (10 * 60 * 1000));

  if (regenAmount > 0 && user.stamina < user.maxStamina) {
    user.stamina = Math.min(user.maxStamina, user.stamina + regenAmount);
    // Keep remainder time
    user.lastStaminaUpdate = now - (timePassed % (10 * 60 * 1000));
  } else if (user.stamina >= user.maxStamina) {
    user.lastStaminaUpdate = now;
  }
  
  await user.save();
}

function pickMonster(zoneName, useGoldenBall) {
  const zone = ZONES[zoneName];
  if (!zone) return null;

  // Apply Golden Ball multipliers (e.g. double Rare/Legendary weight)
  let probs = { ...zone.probs };
  if (useGoldenBall) {
    probs.Rare = (probs.Rare || 0) * 2;
    probs.Legendary = (probs.Legendary || 0) * 2;
    // Normalize logic (simple weight recalculation)
    const totalWeight = Object.values(probs).reduce((a, b) => a + b, 0);
    for (let k in probs) {
      probs[k] = (probs[k] / totalWeight) * 100;
    }
  }

  const rand = Math.random() * 100;
  let cumulative = 0;
  let selectedRarity = 'Common';

  for (const [rarity, prob] of Object.entries(probs)) {
    cumulative += prob;
    if (rand <= cumulative) {
      selectedRarity = rarity;
      break;
    }
  }

  const data = RARITY_DATA[selectedRarity];
  const monsterObj = data.monsters[Math.floor(Math.random() * data.monsters.length)];

  return { monsterName: monsterObj.name, rarity: selectedRarity, element: monsterObj.element, apReward: data.ap, plussesReward: data.plusses };
}

router.get('/status', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const user = await User.findOne({ id: userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    await syncStamina(user);

    const activeSession = await MonsterSession.findOne({ userId, isCompleted: false });
    
    // Determine daily availability
    const now = Date.now();
    const lastLogin = user.lastMonsterLogin || 0;
    const canClaimDaily = (now - lastLogin) > (24 * 60 * 60 * 1000);

    res.json({
      serverTime: Date.now(),
      activeSession,
      collection: user.monsters || [],
      colorBalls: user.colorBalls || 0,
      goldenBalls: user.goldenBalls || 0,
      stamina: user.stamina,
      maxStamina: user.maxStamina,
      plusses: user.plusses || 0,
      ap: user.ap || 0,
      dailyStreakCount: user.dailyStreakCount || 0,
      canClaimDaily
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/hunt', async (req, res) => {
  const { userId, zoneName, useGoldenBall } = req.body;
  if (!userId || !zoneName) return res.status(400).json({ error: 'Missing parameters' });

  try {
    const zone = ZONES[zoneName];
    if (!zone) return res.status(400).json({ error: 'Invalid zone' });

    const user = await User.findOne({ id: userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    await syncStamina(user);

    if (user.stamina < zone.staminaCost) {
      return res.status(400).json({ error: 'Not enough Stamina' });
    }

    if (useGoldenBall) {
      if ((user.goldenBalls || 0) < 1) return res.status(400).json({ error: 'Not enough Golden Balls' });
      user.goldenBalls -= 1;
    } else {
      if ((user.colorBalls || 0) < zone.cost) return res.status(400).json({ error: 'Not enough Color Balls' });
      user.colorBalls -= zone.cost;
    }

    const existingSession = await MonsterSession.findOne({ userId, isCompleted: false });
    if (existingSession) return res.status(400).json({ error: 'A hunt is already active' });

    user.stamina -= zone.staminaCost;
    await user.save();

    const startTime = Date.now();
    const durationMs = req.query.testDuration ? parseInt(req.query.testDuration) * 60000 : zone.durationMins * 60000;
    const endTime = startTime + durationMs;

    const rewardData = pickMonster(zoneName, useGoldenBall);

    const session = new MonsterSession({
      userId,
      zoneName,
      startTime,
      endTime,
      isCompleted: false,
      rewardData
    });

    await session.save();

    res.json({ success: true, serverTime: Date.now(), session, colorBalls: user.colorBalls, goldenBalls: user.goldenBalls, stamina: user.stamina });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/claim', async (req, res) => {
  const { userId } = req.body;
  try {
    const session = await MonsterSession.findOne({ userId, isCompleted: false });
    if (!session) return res.status(400).json({ error: 'No active hunt' });

    // Allow 5-second grace period for network latency
    if (Date.now() < session.endTime - 5000) {
      return res.status(400).json({ error: 'Hunt not yet finished' });
    }

    const user = await User.findOne({ id: userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { monsterName, rarity, element, apReward, plussesReward } = session.rewardData;

    user.ap = (user.ap || 0) + apReward;
    user.balance_ap = (user.balance_ap || 0) + apReward;
    user.totalAp = (user.totalAp || 0) + apReward;
    user.weeklyAp = (user.weeklyAp || 0) + apReward;
    user.plusses = (user.plusses || 0) + plussesReward;

    if (!user.monsters) user.monsters = [];
    const monsterIndex = user.monsters.findIndex(m => m.monsterName === monsterName);
    if (monsterIndex >= 0) {
      user.monsters[monsterIndex].count += 1;
    } else {
      user.monsters.push({ monsterName, rarity, element, count: 1 });
    }

    await user.save();
    session.isCompleted = true;
    await session.save();

    const notif = new Notification({
      id: 'mnst_' + Date.now(),
      userId,
      senderId: 'system',
      senderName: 'Monster Catcher',
      type: 'SYSTEM',
      message: `Your hunt in ${session.zoneName} finished! You caught ${monsterName} (${rarity}). +${apReward} AP, +${plussesReward} Plusses`,
      link: '/monster-catcher',
      isRead: false,
      timestamp: Date.now()
    });
    await notif.save();

    res.json({ success: true, monsterName, rarity, apReward, plussesReward });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/shop/convert', async (req, res) => {
  const { userId, amount, isGolden } = req.body;
  if (!userId || !amount) return res.status(400).json({ error: 'Missing parameters' });

  try {
    const cost = isGolden ? (amount * 150) : (amount * 50);
    const user = await User.findOne({ id: userId });
    
    if ((user.plusses || 0) < cost) {
      return res.status(400).json({ error: 'Not enough Plusses' });
    }

    user.plusses -= cost;
    if (isGolden) {
      user.goldenBalls = (user.goldenBalls || 0) + amount;
    } else {
      user.colorBalls = (user.colorBalls || 0) + amount;
    }
    await user.save();

    res.json({ success: true, colorBalls: user.colorBalls, goldenBalls: user.goldenBalls, plusses: user.plusses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/daily', async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findOne({ id: userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const now = Date.now();
    const lastLogin = user.lastMonsterLogin || 0;
    const diff = now - lastLogin;

    if (diff < (24 * 60 * 60 * 1000)) {
      return res.status(400).json({ error: 'Daily already claimed' });
    }

    // Reset streak if more than 48 hours passed
    if (diff > (48 * 60 * 60 * 1000)) {
      user.dailyStreakCount = 0;
    }

    user.dailyStreakCount = (user.dailyStreakCount || 0) + 1;
    let rewardMsg = '';

    if (user.dailyStreakCount >= 7) {
      user.goldenBalls = (user.goldenBalls || 0) + 1;
      user.dailyStreakCount = 0; // Reset after day 7
      rewardMsg = '+1 Golden Ball!';
    } else {
      user.colorBalls = (user.colorBalls || 0) + 5;
      rewardMsg = '+5 Color Balls!';
    }

    user.lastMonsterLogin = now;
    await user.save();

    res.json({ success: true, colorBalls: user.colorBalls, goldenBalls: user.goldenBalls, streak: user.dailyStreakCount, rewardMsg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/fuse', async (req, res) => {
  const { userId, commonMonsterName } = req.body;
  try {
    const user = await User.findOne({ id: userId });
    
    const monsterIndex = user.monsters.findIndex(m => m.monsterName === commonMonsterName && m.rarity === 'Common');
    if (monsterIndex === -1 || user.monsters[monsterIndex].count < 3) {
      return res.status(400).json({ error: 'Need 3 copies of the same Common monster' });
    }

    user.monsters[monsterIndex].count -= 3;
    if (user.monsters[monsterIndex].count === 0) {
      user.monsters.splice(monsterIndex, 1);
    }

    const uncommons = RARITY_DATA['Uncommon'].monsters;
    const resultObj = uncommons[Math.floor(Math.random() * uncommons.length)];
    const resultName = resultObj.name;
    const element = resultObj.element;

    const resIndex = user.monsters.findIndex(m => m.monsterName === resultName);
    if (resIndex >= 0) {
      user.monsters[resIndex].count += 1;
    } else {
      user.monsters.push({ monsterName: resultName, rarity: 'Uncommon', element, count: 1 });
    }

    await user.save();

    res.json({ success: true, resultName, rarity: 'Uncommon', collection: user.monsters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ARENA COMBAT
router.post('/arena/battle', async (req, res) => {
  const { userId, teamIds } = req.body; // array of monsterNames
  try {
    const user = await User.findOne({ id: userId });
    if (!teamIds || teamIds.length === 0) return res.status(400).json({ error: 'Team is empty' });

    // Validate user owns these monsters
    let playerPower = 0;
    for (let mName of teamIds) {
      const owned = user.monsters.find(m => m.monsterName === mName);
      if (!owned) return res.status(400).json({ error: `You don't own ${mName}` });
      const rarityData = RARITY_DATA[owned.rarity || 'Common'];
      playerPower += rarityData.baseStat;
    }

    // Generate Boss
    const boss = RARITY_DATA.Legendary.monsters[0]; // Shadow
    const bossPower = RARITY_DATA.Legendary.baseStat * 1.5; // Boss multiplier
    
    const logs = [];
    logs.push(`⚔️ The Legendary Boss ${boss.name} (${boss.element}) appears!`);
    logs.push(`🛡️ You deployed a team of ${teamIds.length} monsters. (Team Power: ${playerPower})`);

    // Simple RPS Element Logic check if any player monster counters boss
    // E.g., boss is Dark. Usually nothing counters Dark but let's just make it simple stat check with slight RNG
    const rng = Math.random() * 0.4 - 0.2; // -20% to +20% variation
    const finalPlayerPower = playerPower * (1 + rng);
    
    logs.push(`🔥 Clash occurs! Boss Power: ${Math.floor(bossPower)} vs Your Power: ${Math.floor(finalPlayerPower)}`);

    let isWin = finalPlayerPower > bossPower;
    
    if (isWin) {
      logs.push(`🎉 VICTORY! Your team defeated ${boss.name}!`);
      user.ap = (user.ap || 0) + 50;
      user.balance_ap = (user.balance_ap || 0) + 50;
      user.totalAp = (user.totalAp || 0) + 50;
      user.weeklyAp = (user.weeklyAp || 0) + 50;
      logs.push(`💎 You earned +50 AP!`);
      await user.save();
    } else {
      logs.push(`💀 DEFEAT! Your team was wiped out by ${boss.name}.`);
    }

    res.json({ success: true, isWin, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MARKETPLACE
router.get('/market', async (req, res) => {
  try {
    const listings = await MonsterMarket.find().sort({ createdAt: -1 }).limit(50);
    res.json({ listings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/market/list', async (req, res) => {
  const { userId, monsterName, pricePlusses } = req.body;
  if (!userId || !monsterName || !pricePlusses) return res.status(400).json({ error: 'Missing parameters' });
  try {
    const user = await User.findOne({ id: userId });
    const mIndex = user.monsters.findIndex(m => m.monsterName === monsterName);
    if (mIndex === -1 || user.monsters[mIndex].count < 1) {
      return res.status(400).json({ error: 'You do not own this monster.' });
    }

    const { rarity, element } = user.monsters[mIndex];

    user.monsters[mIndex].count -= 1;
    if (user.monsters[mIndex].count === 0) user.monsters.splice(mIndex, 1);
    await user.save();

    const listing = new MonsterMarket({
      sellerId: userId,
      monsterName,
      rarity: rarity || 'Common',
      element: element || 'Normal',
      pricePlusses
    });
    await listing.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/market/buy', async (req, res) => {
  const { userId, listingId } = req.body;
  try {
    const listing = await MonsterMarket.findById(listingId);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.sellerId === userId) return res.status(400).json({ error: 'Cannot buy your own listing' });

    const buyer = await User.findOne({ id: userId });
    if ((buyer.plusses || 0) < listing.pricePlusses) {
      return res.status(400).json({ error: 'Not enough Plusses' });
    }

    buyer.plusses -= listing.pricePlusses;
    const mIndex = buyer.monsters.findIndex(m => m.monsterName === listing.monsterName);
    if (mIndex >= 0) {
      buyer.monsters[mIndex].count += 1;
    } else {
      buyer.monsters.push({ monsterName: listing.monsterName, rarity: listing.rarity, element: listing.element, count: 1 });
    }
    await buyer.save();

    const seller = await User.findOne({ id: listing.sellerId });
    if (seller) {
      seller.plusses = (seller.plusses || 0) + listing.pricePlusses;
      await seller.save();

      const notif = new Notification({
        id: 'mnst_sold_' + Date.now(),
        userId: seller.id,
        senderId: 'system',
        senderName: 'Marketplace',
        type: 'SYSTEM',
        message: `Your ${listing.monsterName} sold for ${listing.pricePlusses} Plusses!`,
        link: '/monster-catcher',
        isRead: false,
        timestamp: Date.now()
      });
      await notif.save();
    }

    await MonsterMarket.findByIdAndDelete(listingId);

    res.json({ success: true, plusses: buyer.plusses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
