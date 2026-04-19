// ─────────────────────────────────────────────────────────────────────────────
// Firebase Cloud Messaging — Background Service Worker
// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  SETUP: After creating your Firebase project, replace the config below.
//     Firebase Console → Project Settings → General → Your apps → Config object
// ─────────────────────────────────────────────────────────────────────────────

importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js');

// ⚠️ Replace these values with your Firebase project config
firebase.initializeApp({
  apiKey:            self.FIREBASE_API_KEY            || "YOUR_API_KEY",
  authDomain:        self.FIREBASE_AUTH_DOMAIN        || "YOUR_PROJECT.firebaseapp.com",
  projectId:         self.FIREBASE_PROJECT_ID         || "YOUR_PROJECT_ID",
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId:             self.FIREBASE_APP_ID             || "YOUR_APP_ID",
});

const messaging = firebase.messaging();

// Handle background push notifications
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Brims Hospitals';
  const body  = payload.notification?.body  || '';
  const icon  = '/logo.png';

  self.registration.showNotification(title, {
    body,
    icon,
    badge: icon,
    tag: payload.data?.bookingId || 'brims-notif',
    data: payload.data || {},
    requireInteraction: false,
  });
});

// Notification click — open app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(clients.openWindow(url));
});