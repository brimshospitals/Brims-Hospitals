/**
 * Firebase Client — FCM token registration
 * Works gracefully when Firebase env vars are not set (dev mode / unconfigured)
 */

let _app: any = null;
let _messaging: any = null;

function isConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  );
}

async function getApp() {
  if (!isConfigured()) return null;
  if (_app) return _app;
  const { initializeApp, getApps } = await import("firebase/app");
  const config = {
    apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  _app = getApps().length ? getApps()[0] : initializeApp(config);
  return _app;
}

/** Get FCM token — registers SW, requests permission, returns token string */
export async function getFCMToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!isConfigured()) return null;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const app = await getApp();
    if (!app) return null;

    const { getMessaging, getToken } = await import("firebase/messaging");
    if (!_messaging) _messaging = getMessaging(app);

    const sw = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
    });

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(_messaging, {
      vapidKey: vapidKey || undefined,
      serviceWorkerRegistration: sw,
    });

    return token || null;
  } catch (err) {
    console.error("[FCM] Token error:", err);
    return null;
  }
}

/** Listen for foreground messages — shows a toast in the app */
export async function onForegroundMessage(
  callback: (payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => void
) {
  if (typeof window === "undefined" || !isConfigured()) return;
  const app = await getApp();
  if (!app) return;
  const { getMessaging, onMessage } = await import("firebase/messaging");
  if (!_messaging) _messaging = getMessaging(app);
  return onMessage(_messaging, callback);
}