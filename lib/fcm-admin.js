/**
 * FCM Admin — Server-side push notification sender
 * Uses Firebase Admin SDK.
 * Gracefully skips if FIREBASE_PROJECT_ID env var is not set.
 */

let _adminApp = null;

function getAdminApp() {
  if (_adminApp) return _adminApp;

  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) return null;

  try {
    const admin = require("firebase-admin");
    if (admin.apps.length) {
      _adminApp = admin.apps[0];
    } else {
      _adminApp = admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
    }
    return _adminApp;
  } catch (err) {
    console.error("[FCM Admin] Init error:", err.message);
    return null;
  }
}

/**
 * Send a push notification to a single FCM token.
 * @param {string} fcmToken
 * @param {string} title
 * @param {string} body
 * @param {object} data   — optional key/value pairs (all strings)
 * @param {string} url    — URL to open on click
 */
export async function sendPush(fcmToken, title, body, data = {}, url = "/dashboard") {
  if (!fcmToken) return { success: false, reason: "no_token" };

  const app = getAdminApp();
  if (!app) return { success: false, reason: "firebase_not_configured" };

  try {
    const admin = require("firebase-admin");
    const messaging = admin.messaging(app);

    await messaging.send({
      token: fcmToken,
      notification: { title, body },
      data: { ...data, url },
      android: { priority: "high", notification: { icon: "ic_notification", color: "#0d9488" } },
      webpush: {
        headers: { Urgency: "high" },
        notification: { icon: "/logo.png", badge: "/logo.png", requireInteraction: false },
        fcmOptions: { link: url },
      },
    });

    return { success: true };
  } catch (err) {
    console.error("[FCM Admin] Send error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send to multiple tokens at once (multicast).
 * Skips invalid/expired tokens automatically.
 */
export async function sendPushMulticast(fcmTokens, title, body, data = {}, url = "/dashboard") {
  const tokens = (fcmTokens || []).filter(Boolean);
  if (!tokens.length) return { success: false, reason: "no_tokens" };

  const app = getAdminApp();
  if (!app) return { success: false, reason: "firebase_not_configured" };

  try {
    const admin = require("firebase-admin");
    const messaging = admin.messaging(app);

    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: { ...data, url },
      android: { priority: "high" },
      webpush: {
        headers: { Urgency: "high" },
        notification: { icon: "/logo.png", badge: "/logo.png" },
        fcmOptions: { link: url },
      },
    });

    return { success: true, sent: response.successCount, failed: response.failureCount };
  } catch (err) {
    console.error("[FCM Admin] Multicast error:", err.message);
    return { success: false, error: err.message };
  }
}