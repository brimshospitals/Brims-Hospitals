"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "../components/header";
import { useLang } from "@/app/providers/LangProvider";
import { t } from "@/lib/i18n";

/* ── SVG Icons ── */
function IconOPD() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h4" />
    </svg>
  );
}
function IconTele() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
      <rect x="2" y="3" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 10l2-2 2 2" />
      <circle cx="12" cy="11" r="0" fill="currentColor" />
    </svg>
  );
}
function IconLab() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6v7l3.5 9a1 1 0 01-.94 1.36H6.44A1 1 0 015.5 19L9 10V3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 14h12" />
    </svg>
  );
}
function IconSurgery() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a5 5 0 015 5v2a5 5 0 01-10 0V7a5 5 0 015-5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 19.5l-3-3 1.5-1.5M15.5 19.5l3-3-1.5-1.5M12 14v3" />
      <circle cx="8" cy="20" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16" cy="20" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconBookings() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </svg>
  );
}
function IconWallet() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8V6a2 2 0 012-2h14a2 2 0 012 2v2" />
      <circle cx="16.5" cy="13.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.5-6.5a2 2 0 012.828 2.828L11 15.5 7 17l1.5-4z" />
    </svg>
  );
}
function IconAddMoney() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8V6a2 2 0 012-2h14a2 2 0 012 2v2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v4M10 13h4" />
    </svg>
  );
}
function IconMyBookings() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 14h.01M12 14h.01M16 14h.01" />
    </svg>
  );
}
function IconMembers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="9" cy="7" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="18" cy="8" r="2.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 20c0-2.8-2-5-4.5-5" />
    </svg>
  );
}
function IconReports() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 13h8M8 17h5" />
    </svg>
  );
}

function IconHospitals() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M9 21V7l3-4 3 4v14M6 21V11H3v10M18 21V11h3V21" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 12h4M12 10v4" />
    </svg>
  );
}

/* ── Services config ── */
const services = [
  {
    href: "/opd-booking",
    tileKey: "tile.opd",
    subKey: "tile.opd.sub",
    icon: <IconOPD />,
    bg: "bg-blue-50",
    color: "text-blue-600",
    border: "border-blue-100",
    badge: "",
  },
  {
    href: "/teleconsultation",
    tileKey: "tile.teleconsult",
    subKey: "tile.teleconsult.sub",
    icon: <IconTele />,
    bg: "bg-purple-50",
    color: "text-purple-600",
    border: "border-purple-100",
    badge: "Live",
  },
  {
    href: "/lab-tests",
    tileKey: "tile.lab",
    subKey: "tile.lab.sub",
    icon: <IconLab />,
    bg: "bg-orange-50",
    color: "text-orange-500",
    border: "border-orange-100",
    badge: "",
  },
  {
    href: "/surgery-packages",
    tileKey: "tile.surgery",
    subKey: "tile.surgery.sub",
    icon: <IconSurgery />,
    bg: "bg-rose-50",
    color: "text-rose-500",
    border: "border-rose-100",
    badge: "EMI",
  },
  {
    href: "/ipd-booking",
    tileKey: "tile.ipd",
    subKey: "tile.ipd.sub",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h8" />
        <rect x="13" y="13" width="8" height="6" rx="1" />
        <path strokeLinecap="round" d="M17 13v-2M15 16h4" />
      </svg>
    ),
    bg: "bg-pink-50",
    color: "text-pink-600",
    border: "border-pink-100",
    badge: "",
  },
  {
    href: "/reports",
    tileKey: "tile.reports",
    subKey: "tile.reports.sub",
    icon: <IconReports />,
    bg: "bg-teal-50",
    color: "text-teal-600",
    border: "border-teal-100",
    badge: "",
  },
  {
    href: "/hospitals",
    tileKey: "tile.hospitals",
    subKey: "tile.hospitals.sub",
    icon: <IconHospitals />,
    bg: "bg-green-50",
    color: "text-green-600",
    border: "border-green-100",
    badge: "",
  },
  {
    href: "/ambulance",
    tileKey: "tile.ambulance",
    subKey: "tile.ambulance.sub",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <rect x="1" y="8" width="22" height="12" rx="2" />
        <path strokeLinecap="round" d="M1 12h6M17 12h6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8V6a3 3 0 016 0v2" />
        <path strokeLinecap="round" d="M12 13v4M10 15h4" />
      </svg>
    ),
    bg: "bg-red-50",
    color: "text-red-600",
    border: "border-red-100",
    badge: "SOS",
  },
  {
    href: "/referral",
    tileKey: "tile.referral",
    subKey: "tile.referral.sub",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    bg: "bg-amber-50",
    color: "text-amber-600",
    border: "border-amber-100",
    badge: "₹50",
  },
  {
    href: "/health-card",
    tileKey: "tile.healthCard",
    subKey: "tile.healthCard.sub",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <circle cx="8" cy="12" r="2.5" />
        <path strokeLinecap="round" d="M12 9h5M12 12h4M12 15h3" />
      </svg>
    ),
    bg: "bg-cyan-50",
    color: "text-cyan-600",
    border: "border-cyan-100",
    badge: "",
  },
];

function DashboardContent() {
  const searchParams  = useSearchParams();
  const payment       = searchParams.get("payment");
  const cardNumber    = searchParams.get("cardNumber");
  const renewal       = searchParams.get("renewal");
  const renewalExpiry = searchParams.get("expiry");
  const { lang }      = useLang();

  const [user, setUser]               = useState<any>(null);
  const [familyCard, setFamilyCard]   = useState<any>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);
  const [paymentLoading, setPaymentLoading]   = useState(false);
  const [renewalLoading, setRenewalLoading]   = useState(false);

  useEffect(() => {
    if (payment === "success") showToast(`🎉 Family Card activate ho gayi! Card: ${cardNumber}`, true);
    else if (payment === "failed") showToast("❌ Payment fail ho gayi. Dobara try karein.", false);
    else if (renewal === "success") showToast(`✅ Card renew ho gayi! Valid till: ${renewalExpiry}`, true);
    else if (renewal === "failed") showToast("❌ Renewal payment fail. Dobara try karein.", false);
    fetchProfile();
  }, []);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 5000);
  }

  async function fetchProfile() {
    const userId = localStorage.getItem("userId");
    if (!userId) { setLoading(false); return; }
    try {
      const res  = await fetch(`/api/profile?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setFamilyCard(data.familyCard);
        setFamilyMembers(data.familyMembers || []);
      }
    } catch {}
    setLoading(false);
  }

  async function handleActivateCard() {
    setPaymentLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) { showToast("Login karein pehle", false); setPaymentLoading(false); return; }
      const res  = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success && data.redirectUrl) window.location.href = data.redirectUrl;
      else showToast(data.message || "Error", false);
    } catch { showToast("Network error.", false); }
    setPaymentLoading(false);
  }

  async function handleFreeActivate() {
    setPaymentLoading(true);
    try {
      const res  = await fetch("/api/activate-card-free", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showToast(`🎉 Card activated! (Test Mode) Card: ${data.cardNumber}`, true);
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showToast(data.message || "Error", false);
      }
    } catch { showToast("Network error.", false); }
    setPaymentLoading(false);
  }

  async function handleRenewCard() {
    setRenewalLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) { showToast("Login karein pehle", false); setRenewalLoading(false); return; }
      const res  = await fetch("/api/renew-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success && data.redirectUrl) window.location.href = data.redirectUrl;
      else showToast(data.message || "Error", false);
    } catch { showToast("Network error.", false); }
    setRenewalLoading(false);
  }

  // Card expiry helpers
  const cardExpired  = familyCard && familyCard.expiryDate && new Date(familyCard.expiryDate) < new Date();
  const daysToExpiry = familyCard && familyCard.expiryDate
    ? Math.ceil((new Date(familyCard.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const expiringSoon = !cardExpired && daysToExpiry !== null && daysToExpiry <= 30;

  const isIncomplete = user && (user.age === 0 || user.name === "New User" || !user.name);
  const displayName  = user?.name && user.name !== "New User" ? user.name : "User";

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold transition-all ${
          toast.ok ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* ── Hero Banner ── */}
      <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 relative overflow-hidden">
        {/* decorative blobs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full" />

        <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">

          {/* Incomplete Banner inside hero */}
          {isIncomplete && (
            <div className="bg-amber-400/20 border border-amber-300/40 rounded-2xl px-4 py-3 mb-5 flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center flex-shrink-0 text-sm">⚠️</div>
              <p className="text-amber-100 text-sm flex-1">Profile incomplete hai — naam, umar bharo</p>
              <a href="/update-profile" className="bg-amber-400 hover:bg-amber-300 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-lg transition whitespace-nowrap">
                Complete Karein
              </a>
            </div>
          )}

          {/* Member info row */}
          <div className="flex items-center gap-5">
            {/* Photo */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-white/30 bg-white/20">
                {user?.photo
                  ? <img src={user.photo} alt={displayName} className="w-full h-full object-cover" />
                  : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-white/60" stroke="currentColor" strokeWidth={1.5}>
                        <circle cx="12" cy="8" r="4" />
                        <path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                      </svg>
                    </div>
                  )
                }
              </div>
              {/* Active dot */}
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-teal-700 rounded-full" />
            </div>

            {/* Name & details */}
            <div className="flex-1 min-w-0">
              <p className="text-teal-200 text-xs font-medium mb-0.5">{t("dash.hello", lang)} 🙏</p>
              <h1 className="text-white text-2xl font-bold leading-tight truncate">{displayName}</h1>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="text-teal-200 text-xs">📱 +91 {user?.mobile}</span>
                {user?.memberId && (
                  <span className="bg-white/15 text-white text-xs px-2 py-0.5 rounded-full font-mono">
                    {user.memberId}
                  </span>
                )}
              </div>
            </div>

            {/* Edit profile */}
            <a href="/update-profile"
              className="flex-shrink-0 bg-white/15 hover:bg-white/25 text-white rounded-xl px-3 py-2.5 flex items-center gap-1.5 text-xs font-medium transition">
              <IconEdit />
              Edit
            </a>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: t("common.bookings", lang), value: "—",    icon: "📋" },
              { label: t("dash.wallet", lang),    value: familyCard ? `₹${familyCard.walletBalance || 0}` : "₹0", icon: "💰" },
              { label: t("dash.members", lang),   value: familyCard ? `${familyMembers.length}/6` : "—",          icon: "👨‍👩‍👧" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-2xl p-3 text-center">
                <p className="text-lg mb-0.5">{s.icon}</p>
                <p className="text-white font-bold text-base">{s.value}</p>
                <p className="text-teal-200 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-6">

        {/* ── Renewal Banner ── */}
        {familyCard && cardExpired && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-xl shrink-0">⚠️</div>
            <div className="flex-1">
              <p className="font-bold text-red-700 text-sm">Family Card Expire Ho Gayi!</p>
              <p className="text-xs text-red-500 mt-0.5">Renewal ke baad 1 saal ke liye aage badhaiye — sirf ₹249</p>
            </div>
            <button
              onClick={handleRenewCard}
              disabled={renewalLoading}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition disabled:opacity-60 whitespace-nowrap"
            >
              {renewalLoading ? "..." : "Renew ₹249"}
            </button>
          </div>
        )}

        {familyCard && expiringSoon && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-xl shrink-0">⏳</div>
            <div className="flex-1">
              <p className="font-bold text-amber-700 text-sm">Card {daysToExpiry === 0 ? "Aaj" : `${daysToExpiry} Din Mein`} Expire Ho Rahi Hai</p>
              <p className="text-xs text-amber-600 mt-0.5">Ab renew karein aur 1 saal aur paayein — sirf ₹249</p>
            </div>
            <button
              onClick={handleRenewCard}
              disabled={renewalLoading}
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition disabled:opacity-60 whitespace-nowrap"
            >
              {renewalLoading ? "..." : "Renew ₹249"}
            </button>
          </div>
        )}

        {/* ── Family Health Card ── */}
        {familyCard ? (
          <div className="rounded-3xl overflow-hidden shadow-lg">
            {/* Card face */}
            <div className="bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-700 p-6 relative overflow-hidden">
              {/* Pattern */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-8 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest">Brims Health Card</p>
                    <p className="text-white text-lg font-bold font-mono mt-1 tracking-wider">
                      {familyCard.cardNumber}
                    </p>
                  </div>
                  {cardExpired ? (
                    <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">Expired</span>
                  ) : expiringSoon ? (
                    <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-amber-700 rounded-full animate-pulse" />
                      Expiring Soon
                    </span>
                  ) : (
                    <span className="bg-emerald-400 text-emerald-900 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-700 rounded-full animate-pulse" />
                      Active
                    </span>
                  )}
                </div>

                {/* Member photos row */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex -space-x-2">
                    {familyMembers.slice(0, 4).map((m, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-teal-600 overflow-hidden bg-white/20">
                        {m.photo
                          ? <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-xs text-white">
                              {m.name?.[0] || "?"}
                            </div>
                        }
                      </div>
                    ))}
                    {familyMembers.length > 4 && (
                      <div className="w-8 h-8 rounded-full border-2 border-teal-600 bg-white/20 flex items-center justify-center text-xs text-white font-bold">
                        +{familyMembers.length - 4}
                      </div>
                    )}
                  </div>
                  <p className="text-teal-200 text-xs">{familyMembers.length} member{familyMembers.length !== 1 ? "s" : ""}</p>
                </div>

                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-teal-300 text-xs">Activated</p>
                    <p className="text-white font-semibold">
                      {new Date(familyCard.activationDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-teal-300 text-xs">Valid Till</p>
                    <p className="text-white font-semibold">
                      {new Date(familyCard.expiryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet strip */}
            <div className="bg-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                  <IconWallet />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">{t("dash.wallet", lang)}</p>
                  <p className="text-xl font-bold text-gray-800">₹{familyCard.walletBalance || 0}</p>
                </div>
              </div>
              <a href="/wallet"
                className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {t("btn.addMoney", lang)}
              </a>
            </div>
          </div>
        ) : (
          /* ── Activate Card ── */
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 px-6 pt-6 pb-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-teal-600 font-semibold uppercase tracking-wider mb-1">Limited Time Offer</p>
                  <h2 className="text-xl font-bold text-gray-800">Family Health Card</h2>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 line-through">₹999/yr</p>
                  <p className="text-2xl font-black text-teal-600">₹249</p>
                  <p className="text-xs text-gray-400">/saal</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "1 Primary + 5 Members",
                  "Shared Family Wallet",
                  "Lab & OPD Discount",
                  "Digital Health Card",
                  "Priority Booking",
                  "Surgery Concession",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">✓</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 pb-6 pt-4">
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4 text-xs text-amber-700">
                <span>🔥</span>
                <span><strong>75% off</strong> — Sirf aaj ke liye ₹249 mein! Normal price ₹999</span>
              </div>
              <button
                onClick={handleActivateCard}
                disabled={paymentLoading}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold py-4 rounded-2xl transition disabled:opacity-50 text-base shadow-lg shadow-teal-200 flex items-center justify-center gap-2"
              >
                {paymentLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>{t("dash.activateCard", lang)} — ₹249 <span className="text-lg">🎉</span></>
                )}
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">Secure payment · PhonePe / UPI / Card</p>

              {/* Test mode free activation */}
              {process.env.NEXT_PUBLIC_SHOW_OTP === "true" && (
                <div className="mt-3 border-t border-dashed border-amber-200 pt-3">
                  <p className="text-center text-[10px] text-amber-500 font-bold mb-2">⚠️ TESTING MODE ONLY</p>
                  <button
                    onClick={handleFreeActivate}
                    disabled={paymentLoading}
                    className="w-full border-2 border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold py-2.5 rounded-xl transition text-sm disabled:opacity-50">
                    🧪 Free Activate (Test) — Bina Payment
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Family Members (only if card active) ── */}
        {familyCard && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-gray-800">{t("dash.members", lang)}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{familyMembers.length} of 6 slots used</p>
              </div>
              {familyMembers.length < 6 && (
                <a href="/add-member"
                  className="bg-teal-50 hover:bg-teal-100 text-teal-700 text-sm font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add
                </a>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {familyMembers.map((member, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-teal-100 to-teal-200 ring-2 ring-teal-100">
                      {member.photo
                        ? <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                        : (
                          <div className="w-full h-full flex items-center justify-center text-teal-500 font-bold text-xl">
                            {member.name?.[0] || "?"}
                          </div>
                        )
                      }
                    </div>
                    {i === 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="white" className="w-2.5 h-2.5">
                          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-gray-700 text-center leading-tight truncate w-full text-center">
                    {member.name?.split(" ")[0] || "—"}
                  </p>
                  <p className="text-xs text-gray-400">{member.age} yr</p>
                </div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: 6 - familyMembers.length }).map((_, i) => (
                <a key={i} href="/add-member"
                  className="flex flex-col items-center gap-1.5 group">
                  <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-gray-200 group-hover:border-teal-400 flex items-center justify-center transition bg-gray-50 group-hover:bg-teal-50">
                    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-gray-300 group-hover:text-teal-400 transition" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-300 group-hover:text-teal-500 transition">Add</p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── Services Grid ── */}
        <div>
          <h2 className="text-base font-bold text-gray-700 mb-3 px-1">{t("dash.services", lang)}</h2>
          <div className="grid grid-cols-2 gap-3">
            {services.map((s) => (
              <a key={s.href} href={s.href}
                className={`bg-white rounded-2xl p-5 border ${s.border} hover:shadow-md transition-all group relative overflow-hidden`}>
                {/* Background decoration */}
                <div className={`absolute -bottom-4 -right-4 w-20 h-20 ${s.bg} rounded-full opacity-50 group-hover:opacity-80 transition`} />
                <div className="relative z-10">
                  <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    {s.icon}
                  </div>
                  {s.badge && (
                    <span className={`absolute top-0 right-0 text-xs font-bold px-2 py-0.5 rounded-bl-xl rounded-tr-2xl ${
                      s.badge === "Live" ? "bg-purple-500 text-white" : "bg-orange-400 text-white"
                    }`}>
                      {s.badge}
                    </span>
                  )}
                  <h3 className="font-bold text-gray-800 text-sm">{t(s.tileKey, lang)}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{t(s.subKey, lang)}</p>
                </div>
              </a>
            ))}
          </div>

          {/* My Bookings — full width */}
          <a href="/my-bookings"
            className="mt-3 bg-white rounded-2xl px-5 py-4 border border-indigo-100 hover:shadow-md transition-all group flex items-center gap-4 relative overflow-hidden">
            <div className="absolute -bottom-4 -right-6 w-24 h-24 bg-indigo-50 rounded-full opacity-50 group-hover:opacity-80 transition" />
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0 relative z-10">
              <IconBookings />
            </div>
            <div className="relative z-10">
              <h3 className="font-bold text-gray-800 text-sm">{t("dash.myBookings", lang)}</h3>
              <p className="text-xs text-gray-400 mt-0.5">OPD · Lab · Surgery · Teleconsult</p>
            </div>
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-gray-300 ml-auto relative z-10 group-hover:text-indigo-400 transition" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
            </svg>
          </a>
        </div>

      </div>

      {/* ── Bottom Navigation Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-md mx-auto flex items-stretch h-16">

          {/* Add Money */}
          {familyCard ? (
            <a href="/wallet" className="flex-1 flex flex-col items-center justify-center gap-0.5 text-teal-600 hover:bg-teal-50 transition">
              <IconAddMoney />
              <span className="text-[10px] font-semibold">{t("btn.addMoney", lang)}</span>
            </a>
          ) : (
            <button
              onClick={handleActivateCard}
              disabled={paymentLoading}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-300 cursor-not-allowed"
              title="Card activate karein pehle"
            >
              <IconAddMoney />
              <span className="text-[10px] font-semibold">{t("btn.addMoney", lang)}</span>
            </button>
          )}

          {/* Divider */}
          <div className="w-px bg-gray-100 my-3" />

          {/* Bookings — always enabled */}
          <a href="/my-bookings" className="flex-1 flex flex-col items-center justify-center gap-0.5 text-indigo-600 hover:bg-indigo-50 transition">
            <IconMyBookings />
            <span className="text-[10px] font-semibold">{t("nav.myBookings", lang)}</span>
          </a>

          {/* Divider */}
          <div className="w-px bg-gray-100 my-3" />

          {/* Members */}
          {familyCard ? (
            <a href="/add-member" className="flex-1 flex flex-col items-center justify-center gap-0.5 text-emerald-600 hover:bg-emerald-50 transition">
              <IconMembers />
              <span className="text-[10px] font-semibold">{t("dash.members", lang)}</span>
            </a>
          ) : (
            <button
              onClick={handleActivateCard}
              disabled={paymentLoading}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition"
              title="Card activate karein Members add karne ke liye"
            >
              <div className="relative">
                <IconMembers />
                <span className="absolute -top-1 -right-2 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-[8px] font-bold text-white">!</span>
              </div>
              <span className="text-[10px] font-semibold">{t("dash.members", lang)}</span>
            </button>
          )}

        </div>

        {/* Safe area for iPhone home indicator */}
        <div className="h-safe-area-inset-bottom" />
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
