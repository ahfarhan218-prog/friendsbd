import { API_BASE } from './mongoService';

const PUBLIC_VAPID_KEY = 'BEl62iUYgUivx0kvS3QH4XqE6kFQJx3zKQg4Jr3xY8QjqK3ZVJzFpQbKzYbHdFkxQ0X8zYx3zKQg4Jr3xY8QjqK3ZVJzFpQbKzYbHdFkxQ0X8zY';

export async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[PWA] Service worker registered');

    const sub = await registration.pushManager.getSubscription();
    if (sub) {
      await updateSubscriptionOnServer(sub);
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[PWA] Push notifications denied');
      return;
    }

    const newSub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
    });
    await updateSubscriptionOnServer(newSub);
    console.log('[PWA] Push subscription active');
  } catch (err) {
    console.warn('[PWA] Service worker registration failed:', err);
  }
}

async function updateSubscriptionOnServer(sub: PushSubscription): Promise<void> {
  const token = localStorage.getItem('auth_token');
  if (!token) return;
  try {
    const subData = sub.toJSON();
    await fetch(`${API_BASE}/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        endpoint: subData.endpoint,
        keys: subData.keys,
        userAgent: navigator.userAgent
      })
    });
  } catch (_) {}
}

export async function unregisterServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    if (sub) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch(`${API_BASE}/push/unsubscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ endpoint: sub.endpoint })
        });
      }
      await sub.unsubscribe();
    }
    await registration.unregister();
  } catch (_) {}
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(ch => ch.charCodeAt(0)));
}
