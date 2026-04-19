"use client";
/**
 * FCMInit — mounts invisibly in layout.tsx
 * • Requests notification permission
 * • Gets FCM token and saves to backend
 * • Shows foreground toast for incoming pushes
 */
import { useEffect, useState } from "react";
import { getFCMToken, onForegroundMessage } from "@/lib/firebase-client";

export default function FCMInit() {
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    // Only run for logged-in users
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    // Register FCM token
    (async () => {
      try {
        const token = await getFCMToken();
        if (!token) return;

        // Save token to backend
        await fetch("/api/fcm/save-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fcmToken: token }),
        });
      } catch {}
    })();

    // Listen for foreground messages (app is open)
    onForegroundMessage((payload) => {
      const title = payload.notification?.title || "Brims Hospitals";
      const body  = payload.notification?.body  || "";
      setToast({ title, body });
      setTimeout(() => setToast(null), 6000);

      // Also play a soft sound if supported
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine"; osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(); osc.stop(ctx.currentTime + 0.4);
      } catch {}
    });
  }, []);

  if (!toast) return null;

  return (
    <div
      onClick={() => setToast(null)}
      style={{
        position: "fixed",
        top: "72px",
        right: "16px",
        zIndex: 9999,
        maxWidth: "320px",
        background: "#0d9488",
        color: "white",
        borderRadius: "14px",
        padding: "12px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        cursor: "pointer",
        animation: "slideIn 0.3s ease",
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
      }}
    >
      <span style={{ fontSize: "20px", flexShrink: 0 }}>🔔</span>
      <div>
        <p style={{ fontWeight: "700", fontSize: "13px", margin: "0 0 2px" }}>{toast.title}</p>
        <p style={{ fontSize: "12px", opacity: 0.9, margin: 0 }}>{toast.body}</p>
      </div>
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(40px) } to { opacity:1; transform:translateX(0) } }`}</style>
    </div>
  );
}