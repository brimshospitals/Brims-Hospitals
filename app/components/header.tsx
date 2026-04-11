"use client";
import { useState, useEffect } from "react";

export default function Header() {
  const [loggedIn, setLoggedIn]         = useState(false);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [unreadCount, setUnreadCount]   = useState(0);

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

  return (
    <header className="bg-teal-600 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">

        {/* Logo */}
        <a href="/" className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Brims Hospitals"
            className="h-12 w-12 object-contain bg-white rounded-full p-0.5"
          />
          <div className="hidden sm:block">
            <p className="text-lg font-bold leading-tight">Brims Hospitals</p>
            <p className="text-teal-200 text-xs">Making Healthcare Affordable</p>
          </div>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <a href="/"                  className="text-teal-100 hover:text-white hover:bg-teal-500 px-3 py-2 rounded-lg transition">Home</a>
          <a href="/services"          className="text-teal-100 hover:text-white hover:bg-teal-500 px-3 py-2 rounded-lg transition">Services</a>
          <a href="/opd-booking"       className="text-teal-100 hover:text-white hover:bg-teal-500 px-3 py-2 rounded-lg transition">OPD</a>
          <a href="/lab-tests"         className="text-teal-100 hover:text-white hover:bg-teal-500 px-3 py-2 rounded-lg transition">Lab Tests</a>
          <a href="/surgery-packages"  className="text-teal-100 hover:text-white hover:bg-teal-500 px-3 py-2 rounded-lg transition">Surgery</a>
          <a href="/teleconsultation"  className="text-teal-100 hover:text-white hover:bg-teal-500 px-3 py-2 rounded-lg transition">Teleconsult</a>
          <a href="/articles"          className="text-teal-100 hover:text-white hover:bg-teal-500 px-3 py-2 rounded-lg transition">Articles</a>
          <a href="/contact"           className="text-teal-100 hover:text-white hover:bg-teal-500 px-3 py-2 rounded-lg transition">Contact</a>

          <div className="w-px h-5 bg-teal-400 mx-1" />

          {loggedIn ? (
            <>
              {/* Notification Bell */}
              <a href="/notifications" className="relative text-teal-100 hover:text-white hover:bg-teal-500 p-2 rounded-lg transition">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-9.33-4.997M9 17H4l1.405-1.405A2.032 2.032 0 006 14.158V11a6 6 0 016-6 6 6 0 016 6v3.159" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </a>

              <a href="/my-bookings" className="text-teal-100 hover:text-white hover:bg-teal-500 px-3 py-2 rounded-lg transition">
                Bookings
              </a>
              <a href="/update-profile" className="text-teal-100 hover:text-white hover:bg-teal-500 px-3 py-2 rounded-lg transition">
                Profile
              </a>
              <a href="/dashboard"
                className="bg-white text-teal-700 px-4 py-2 rounded-full text-sm font-bold hover:bg-teal-50 transition">
                Dashboard
              </a>
              <button onClick={handleLogout}
                className="text-teal-200 hover:text-white text-sm px-2 py-2">
                Logout
              </button>
            </>
          ) : (
            <>
              <a href="/login"
                className="bg-white text-teal-700 px-4 py-2 rounded-full text-sm font-bold hover:bg-teal-50 transition">
                Login
              </a>
              <a href="/register"
                className="bg-teal-800 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-teal-900 transition">
                Register
              </a>
            </>
          )}
        </nav>

        {/* Mobile: Bell + Hamburger */}
        <div className="md:hidden flex items-center gap-2">
          {loggedIn && (
            <a href="/notifications" className="relative p-2 rounded-lg hover:bg-teal-500 transition">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-9.33-4.997M9 17H4l1.405-1.405A2.032 2.032 0 006 14.158V11a6 6 0 016-6 6 6 0 016 6v3.159" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </a>
          )}
          <button
            className="p-2 rounded-lg hover:bg-teal-500 transition"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <div className="space-y-1.5">
              <span className={`block w-6 h-0.5 bg-white transition-transform ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block w-6 h-0.5 bg-white transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block w-6 h-0.5 bg-white transition-transform ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-teal-700 border-t border-teal-500 px-4 py-3 space-y-1">
          {[
            { href: "/",                 label: "🏠 Home"             },
            { href: "/services",         label: "🏥 Services"         },
            { href: "/opd-booking",      label: "🩺 OPD Booking"      },
            { href: "/lab-tests",        label: "🧪 Lab Tests"        },
            { href: "/surgery-packages", label: "🔪 Surgery Packages" },
            { href: "/teleconsultation", label: "💻 Teleconsultation" },
            { href: "/articles",         label: "📰 Health Articles"  },
            { href: "/contact",          label: "📞 Contact Us"       },
          ].map(({ href, label }) => (
            <a key={href} href={href}
              onClick={() => setMenuOpen(false)}
              className="block text-teal-100 hover:text-white hover:bg-teal-600 px-4 py-2.5 rounded-lg transition text-sm font-medium">
              {label}
            </a>
          ))}

          <div className="border-t border-teal-600 pt-2 mt-2">
            {loggedIn ? (
              <>
                <a href="/notifications" onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between text-teal-100 hover:text-white hover:bg-teal-600 px-4 py-2.5 rounded-lg transition text-sm font-medium">
                  <span>🔔 Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </a>
                <a href="/my-bookings" onClick={() => setMenuOpen(false)}
                  className="block text-teal-100 hover:text-white hover:bg-teal-600 px-4 py-2.5 rounded-lg transition text-sm font-medium">
                  📋 Meri Bookings
                </a>
                <a href="/update-profile" onClick={() => setMenuOpen(false)}
                  className="block text-teal-100 hover:text-white hover:bg-teal-600 px-4 py-2.5 rounded-lg transition text-sm font-medium">
                  ✏️ Profile Update
                </a>
                <a href="/dashboard" onClick={() => setMenuOpen(false)}
                  className="block text-teal-100 hover:text-white hover:bg-teal-600 px-4 py-2.5 rounded-lg transition text-sm font-medium">
                  👤 Dashboard
                </a>
                <button onClick={handleLogout}
                  className="block w-full text-left text-red-300 hover:text-red-100 px-4 py-2.5 rounded-lg transition text-sm font-medium">
                  🚪 Logout
                </button>
              </>
            ) : (
              <>
                <a href="/login" onClick={() => setMenuOpen(false)}
                  className="block text-center bg-white text-teal-700 px-4 py-2.5 rounded-lg font-bold text-sm mb-2">
                  Login
                </a>
                <a href="/register" onClick={() => setMenuOpen(false)}
                  className="block text-center bg-teal-800 text-white px-4 py-2.5 rounded-lg font-bold text-sm">
                  Register
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
