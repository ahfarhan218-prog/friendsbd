const Event = require('./models/Event');

const AUTO_EVENTS = [
  { title: '⚡ Double XP Weekend', description: 'Earn double points on all activities!', type: 'tournament', prize: '2x XP Boost', duration: 48 * 60 * 60 * 1000 },
  { title: '💰 Coin Rush Hour', description: 'Extra coin spawns for the next hour!', type: 'giveaway', prize: 'Bonus Coins', duration: 60 * 60 * 1000 },
  { title: '🧠 Quiz Tournament', description: 'Compete in the weekend quiz championship!', type: 'quiz', prize: '500 Points + Elite Badge', duration: 24 * 60 * 60 * 1000 },
  { title: '🎯 Monster Hunter Weekend', description: 'Rare monsters appear more frequently!', type: 'tournament', prize: 'Shiny Monster Egg', duration: 48 * 60 * 60 * 1000 },
  { title: '🏏 Cricket Cup', description: 'Special cricket tournament with boosted rewards!', type: 'tournament', prize: '1000 Gold Coins', duration: 72 * 60 * 60 * 1000 },
];

const SCHEDULE_DAYS = [0, 1, 3, 5, 6]; // Sun, Mon, Wed, Fri, Sat

function getNextSchedule(dayIndex, hour = 14) {
  const now = Date.now();
  const today = new Date(now);
  today.setHours(hour, 0, 0, 0);
  if (today.getTime() <= now) today.setDate(today.getDate() + 1);
  const targetDay = SCHEDULE_DAYS[dayIndex % SCHEDULE_DAYS.length];
  while (today.getDay() !== targetDay) {
    today.setDate(today.getDate() + 1);
  }
  return today.getTime();
}

async function scheduleEvents() {
  try {
    const count = await Event.countDocuments({});
    if (count > 30) return;

    const now = Date.now();
    for (let i = 0; i < AUTO_EVENTS.length; i++) {
      const ev = AUTO_EVENTS[i];
      const startDate = getNextSchedule(i);
      const existing = await Event.findOne({ title: ev.title, date: { $gt: now - 7 * 24 * 60 * 60 * 1000 } });
      if (existing) continue;

      await Event.create({
        id: `auto_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
        title: ev.title,
        description: ev.description,
        type: ev.type,
        prize: ev.prize,
        date: startDate,
        endDate: startDate + ev.duration,
        status: 'upcoming',
        createdBy: 'system',
        createdAt: Date.now()
      });
      console.log(`[Scheduler] Created auto-event: ${ev.title}`);
    }
  } catch (err) {
    console.warn('[Scheduler] Error:', err.message);
  }
}

function startScheduler() {
  console.log('[Scheduler] Starting automated events scheduler...');
  scheduleEvents();
  setInterval(scheduleEvents, 6 * 60 * 60 * 1000); // Check every 6 hours
}

module.exports = { startScheduler };
