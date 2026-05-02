// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
const firebaseConfig = {
  // We can read these from URL params or hardcode for now. 
  // FCM service worker needs at least the projectId, messagingSenderId, and appId.
  // It's safer to just inject them using a build step, but for static files:
  apiKey: "AIzaSyAQxEC3ZSQwGuN45DkSD1jhzJIj-OyRZuc",
  authDomain: "geolocation-37003.firebaseapp.com",
  projectId: "geolocation-37003",
  storageBucket: "geolocation-37003.firebasestorage.app",
  messagingSenderId: "414491151740",
  appId: "1:414491151740:web:d364f20d4d8ae7e5a3a8f9"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title || 'MIT Bus';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192.png',
    data: {
      url: payload.webpush?.fcmOptions?.link || payload.fcmOptions?.link || '/#chat'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
