// ── Service Worker Registration ──────────────────────────────────────────────

export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('SW Registered:', registration.scope);
    return registration;
  } catch (err) {
    console.error('SW Registration failed:', err);
  }
}

// ── Background Sync ──────────────────────────────────────────────────────────

export async function requestBackgroundSync() {
  const registration = await navigator.serviceWorker.ready;
  if ('sync' in registration) {
    try {
      await (registration as any).sync.register('sync-gps');
      console.log('Background Sync Registered');
    } catch (err) {
      console.error('Background Sync failed:', err);
    }
  }
}

// ── Push Notifications ───────────────────────────────────────────────────────

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BJBpRnWvTD38ZnEFk83javEIG5Eu4uKP30xe8FppGn0_qgU_MruZTBRJT4Y5dfCS8BYILBm3bGYl7XJtKqaKVTk';

import { getFirebaseMessaging } from './firebase';
import { getToken } from 'firebase/messaging';

export async function subscribeToPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Push permission denied');
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) throw new Error('Firebase messaging not initialized or not supported');

    // Subscribe to FCM
    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_PUBLIC_KEY,
      serviceWorkerRegistration: registration
    });

    if (currentToken) {
      console.log('FCM Token received');
      return currentToken; // We'll store this token instead of the VAPID subscription
    } else {
      throw new Error('No registration token available.');
    }
  } catch (err) {
    console.error('Push subscription failed:', err);
  }
}

// ── Utils ───────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
