"use client";
import { useState, useEffect } from "react";
import Header from "../components/header";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Abhi";
  if (mins < 60) return `${mins} min pehle`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} ghante pehle`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days} din pehle`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [userId, setUserId]               = useState("");

  useEffect(() => {
    const uid = localStorage.getItem("userId") || "";
    setUserId(uid);
    if (uid) fetchNotifications(uid);
    else setLoading(false);
  }, []);

  async function fetchNotifications(uid: string) {
    try {
      const res  = await fetch(`/api/notifications?userId=${uid}&limit=50`);
      const data = await res.json();
      if (data.success) setNotifications(data.notifications);
    } catch {}
    setLoading(false);
  }

  async function markAllRead() {
    if (!userId) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  async function markRead(notificationId: string) {
    if (!userId) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, notificationId }),
    });
    setNotifications((prev) =>
      prev.map((n) => n._id === notificationId ? { ...n, isRead: true } : n)
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!userId) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <p className="text-4xl mb-4">🔔</p>
          <h2 className="font-bold text-gray-700 text-lg mb-2">Login karein</h2>
          <p className="text-gray-400 text-sm mb-4">Notifications dekhne ke liye pehle login karein</p>
          <a href="/login" className="bg-teal-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm">Login</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">🔔 Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-teal-600 mt-0.5">{unreadCount} nai notification</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="text-sm text-teal-600 hover:underline font-medium">
              Sabhi padhein ✓
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
            <p className="text-5xl mb-4">🔔</p>
            <p className="text-gray-500 font-medium">Koi notification nahi hai</p>
            <p className="text-gray-400 text-sm mt-1">Jab doctor koi article publish karega, notification aayega</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => {
                  markRead(n._id);
                  if (n.articleId?._id || n.articleId) {
                    window.location.href = `/articles/${n.articleId?._id || n.articleId}`;
                  }
                }}
                className={`flex gap-4 p-4 rounded-2xl border cursor-pointer transition ${
                  n.isRead
                    ? "bg-white border-gray-100 hover:bg-gray-50"
                    : "bg-teal-50 border-teal-200 hover:bg-teal-100"
                }`}
              >
                {/* Icon */}
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl ${
                  n.type === "article" ? "bg-teal-100" : "bg-blue-100"
                }`}>
                  {n.type === "article" ? "📰" : "🔔"}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold leading-snug ${n.isRead ? "text-gray-700" : "text-gray-900"}`}>
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <span className="w-2.5 h-2.5 bg-teal-500 rounded-full flex-shrink-0 mt-1" />
                    )}
                  </div>
                  {n.message && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
