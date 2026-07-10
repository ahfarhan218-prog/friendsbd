const PushSubscription = require('../models/PushSubscription');

async function sendPushToUser(userId, title, body, url = '/') {
  try {
    const subs = await PushSubscription.find({ userId }).lean();
    if (!subs.length) return;

    const payload = JSON.stringify({ title, body, icon: '/friends_bd_logo.png', url, tag: 'friendsbd' });

    for (const sub of subs) {
      try {
        const { endpoint, keys } = sub;
        if (endpoint && keys?.p256dh && keys?.auth) {
          await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscription: { endpoint, keys },
              payload
            })
          });
        }
      } catch (_) {}
    }
  } catch (_) {}
}

module.exports = { sendPushToUser };
