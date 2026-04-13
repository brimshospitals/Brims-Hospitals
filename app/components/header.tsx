"use client";
import { useState, useEffect } from "react";
import { useLang } from "@/app/providers/LangProvider";
import { t } from "@/lib/i18n";

export default function Header() {
  const [loggedIn, setLoggedIn]       = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { lang, toggle }              = useLang();

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    setLoggedIn(!!userId);
    if (userId) fetchUnreadCount(userId);
  }, []);

  async function fetchUnreadCount(userId: string) {
    try {
      const res  = await fetch(`/api/notifications?userId=${userId}&unreadOnly=true&limit=1`);
      const data = await res.json();
      if (data.success) setUnreadCount(data.unreadCount || 0);
    } catch {}
  }

  function handleLogout() {
    localStorage.removeItem("userId");
    localStorage.removeItem("adminId");
    localStorage.removeItem("adminName");
    setLoggedIn(false);
    window.location.href = "/";
  }

  const navLinks = [
    { href: "/opd-booking",      label: t("nav.opd", lang)       },
    { href: "/lab-tests",        label: t("nav.lab", lang)       },
    { href: "/surgery-packages", label: t("nav.surgery", lang)   },
    { href: "/teleconsultation", label: t("nav.teleconsult", lang)},
    { href: "/hospitals",        label: t("nav.hospitals", lang) },
    { href: "/articles",         label: t("nav.articles", lang)  },
    { href: "/contact",          label: t("nav.contact", lang)   },
  ];

  return (
    <header className="bg-teal-600 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">

        {/* ── Logo ── */}
        <a href="/" className="flex items-center gap-2.5 shrink-0">
          <img
            src="/logo.png"
            alt="Brims Hospitals"
            className="h-10 w-10 object-contain bg-white rounded-full p-0.5 shadow"
          />
          <div className="hidden sm:block leading-tight">
            <p className="text-base font-bold tracking-tight">Brims Hospitals</p>
            <p className="text-teal-200 text-[10px]">Making Healthcare Affordable</p>
          </div>
        </a>

        {/* ── Desktop Nav ── */}
        <nav className="hidden lg:flex items-center gap-0.5 text-sm font-medium flex-1 justify-center">
          {navLinks.map(({ href, label }) => (
            <a key={href} href={href}
              className="text-teal-100 hover:text-white hover:bg-teal-500/70 px-2.5 py-1.5 rounded-lg transition whitespace-nowrap text-[13px]">
              {label}
            </a>
          ))}
        </nav>

        {/* ── Right side controls ── */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">

          {/* Emergency Ambulance pill */}
          <a href="/ambulance"
            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold transition shadow-md shadow-red-900/20">
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2.2}>
              <rect x="1" y="8" width="22" height="12" rx="2"/>
              <path strokeLinecap="round" d="M1 13h5M18 13h5"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 8V6a3 3 0 016 0v2"/>
              <path strokeLinecap="round" d="M12 14v3M10.5 15.5h3"/>
            </svg>
            {lang === "hi" ? "आपातकाल" : "Emergency"}
          </a>

          {/* Language toggle */}
          <button onClick={toggle}
            className="bg-teal-500/60 hover:bg-teal-500 border border-teal-400/40 px-2.5 py-1.5 rounded-lg text-xs font-bold transition">
            {lang === "en" ? "🇮🇳 हिं" : "🇬🇧 EN"}
          </button>

          <div className="w-px h-5 bg-teal-400/50" />

          {loggedIn ? (
            <div className="flex items-center gap-1.5">
              {/* Bell */}
              <a href="/notifications"
                className="relative p-1.5 rounded-lg hover:bg-teal-500/60 transition">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-teal-100" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </a>

              <a href="/my-bookings"
                className="text-teal-100 hover:text-white hover:bg-teal-500/60 px-2.5 py-1.5 rounded-lg transition text-[13px]">
                {t("nav.myBookings", lang)}
              </a>

              <a href="/dashboard"
                className="bg-white text-teal-700 px-4 py-1.5 rounded-full text-sm font-bold hover:bg-teal-50 transition shadow">
                {t("nav.dashboard", lang)}
              </a>

              <button onClick={handleLogout}
                className="text-teal-300 hover:text-white px-2 py-1.5 text-[13px] transition">
                {t("nav.logout", lang)}
              </button>
            </div>
          ) : (
            <a href="/login"
              className="bg-white text-teal-700 px-5 py-1.5 rounded-full text-sm font-bold hover:bg-teal-50 transition shadow">
              {t("nav.login", lang)}
            </a>
          )}
        </div>

        {/* ── Mobile right controls ── */}
        <div className="lg:hidden flex items-center gap-2">
          <a href="/ambulance"
            className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-2.5 py-1.5 rounded-full text-xs font-bold transition">
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2.2}>
              <rect x="1" y="8" width="22" height="12" rx="2"/>
              <path strokeLinecap="round" d="M1 13h5M18 13h5"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 8V6a3 3 0 016 0v2"/>
              <path strokeLinecap="round" d="M12 14v3M10.5 15.5h3"/>
            </svg>
            SOS
          </a>

          <button onClick={toggle}
            className="bg-teal-500/60 px-2 py-1 rounded-md text-xs font-bold">
            {lang === "en" ? "हिं" : "EN"}
          </button>

          {loggedIn && (
            <a href="/notifications" className="relative p-1.5 rounded-lg hover:bg-teal-500/60 transition">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </a>
          )}

          <button
            className="p-1.5 rounded-lg hover:bg-teal-500/60 transition"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={2}>
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
              }
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mobile Dropdown Menu ── */}
      {menuOpen && (
        <div className="lg:hidden bg-teal-700/98 backdrop-blur border-t border-teal-500/50 px-4 py-4">
          <div className="grid grid-cols-2 gap-1 mb-3">
            {[
              { href: "/",                 icon: "🏠", label: "Home"              },
              { href: "/opd-booking",      icon: "🩺", label: t("nav.opd", lang)         },
              { href: "/lab-tests",        icon: "🧪", label: t("nav.lab", lang)         },
              { href: "/surgery-packages", icon: "🔪", label: t("nav.surgery", lang)     },
              { href: "/ipd-booking",      icon: "🛏️", label: t("nav.ipd", lang)        },
              { href: "/teleconsultation", icon: "💻", label: t("nav.teleconsult", lang) },
              { href: "/hospitals",        icon: "🏥", label: t("nav.hospitals", lang)   },
              { href: "/articles",         icon: "📰", label: t("nav.articles", lang)    },
              { href: "/contact",          icon: "📞", label: t("nav.contact", lang)     },
            ].map(({ href, icon, label }) => (
              <a key={href} href={href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 text-teal-100 hover:text-white hover:bg-teal-600/60 px-3 py-2.5 rounded-xl transition text-sm font-medium">
                <span className="text-base">{icon}</span>
                <span>{label}</span>
              </a>
            ))}
          </div>

          <div className="border-t border-teal-600/50 pt-3 space-y-1">
            {loggedIn ? (
              <>
                <a href="/notifications" onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between text-teal-100 hover:text-white hover:bg-teal-600/60 px-3 py-2.5 rounded-xl transition text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <span>🔔</span> {t("nav.notifications", lang)}
                  </span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </a>
                <a href="/my-bookings" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 text-teal-100 hover:text-white hover:bg-teal-600/60 px-3 py-2.5 rounded-xl transition text-sm font-medium">
                  <span>📋</span> {t("nav.myBookings", lang)}
                </a>
                <a href="/update-profile" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 text-teal-100 hover:text-white hover:bg-teal-600/60 px-3 py-2.5 rounded-xl transition text-sm font-medium">
                  <span>✏️</span> Profile
                </a>
                <a href="/dashboard" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 text-teal-100 hover:text-white hover:bg-teal-600/60 px-3 py-2.5 rounded-xl transition text-sm font-medium">
                  <span>👤</span> {t("nav.dashboard", lang)}
                </a>
                <button onClick={handleLogout}
                  className="flex items-center gap-2 w-full text-left text-red-300 hover:text-red-100 px-3 py-2.5 rounded-xl transition text-sm font-medium">
                  <span>🚪</span> {t("nav.logout", lang)}
                </button>
              </>
            ) : (
              <a href="/login" onClick={() => setMenuOpen(false)}
                className="block text-center bg-white text-teal-700 px-4 py-3 rounded-xl font-bold text-sm shadow">
                {t("nav.login", lang)}
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
