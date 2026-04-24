"use client";
import { useState, useEffect } from "react";
import Header from "../components/header";

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ReferralPage() {
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState<"code"|"link"|null>(null);
  const [toast,   setToast]   = useState("");

  useEffect(() => {
    fetchReferral();
  }, []);

  async function fetchReferral() {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) { setLoading(false); return; }
      const res  = await fetch(`/api/referral?userId=${userId}`);
      const json = await res.json();
      if (json.success) setData(json);
    } catch {}
    setLoading(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  function copyToClipboard(text: string, type: "code"|"link") {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      showToast(type === "code" ? "Code copy ho gaya!" : "Link copy ho gaya!");
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function shareWhatsApp() {
    if (!data) return;
    const msg = encodeURIComponent(
      `🏥 *Brims Hospitals* pe register karein aur apna OPD, Lab Test, Surgery sab ek jagah book karein!\n\n` +
      `Mere referral code se register karo — dono ko ₹50 wallet cashback milega! 🎉\n\n` +
      `👉 ${data.shareLink || `https://brims-hospitals-app.vercel.app/login?ref=${data.referralCode}`}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  const shareLink = data?.shareLink || (data?.referralCode ? `https://brims-hospitals-app.vercel.app/login?ref=${data.referralCode}` : "");

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <p className="text-4xl mb-3">🔐</p>
          <p className="text-gray-600 mb-4">Pehle login karein</p>
          <a href="/login" className="bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold">Login Karein</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <Header />

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-teal-700 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium">
          ✓ {toast}
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* ── Hero banner ── */}
        <div className="relative bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 rounded-3xl p-6 text-white overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10" />

          <div className="relative z-10">
            <p className="text-teal-100 text-xs font-semibold uppercase tracking-widest mb-1">Refer & Earn</p>
            <h1 className="text-2xl font-black mb-1">Dono ko milenge ₹50! 🎉</h1>
            <p className="text-teal-100 text-sm">Apne dost ko refer karo — unhe bhi ₹50 milenge aur aapko bhi!</p>

            <div className="mt-5 bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
              <p className="text-teal-100 text-xs font-semibold uppercase tracking-wide mb-2">Aapka Referral Code</p>
              <div className="flex items-center justify-between gap-3">
                <p className="text-2xl font-black tracking-widest font-mono">
                  {data.referralCode || "—"}
                </p>
                <button
                  onClick={() => data.referralCode && copyToClipboard(data.referralCode, "code")}
                  className="flex items-center gap-1.5 bg-white text-teal-700 font-bold text-xs px-4 py-2 rounded-xl hover:bg-teal-50 transition"
                >
                  {copied === "code" ? "✓ Copied!" : "📋 Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Referred",  value: data.referredCount || 0,  icon: "👥", color: "text-blue-700  bg-blue-50  border-blue-100" },
            { label: "Total Earned",    value: `₹${(data.totalEarned || 0).toLocaleString("en-IN")}`, icon: "💰", color: "text-green-700 bg-green-50 border-green-100" },
            { label: "Per Referral",    value: "₹50",                    icon: "🎁", color: "text-amber-700 bg-amber-50 border-amber-100" },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl border p-3.5 text-center ${s.color}`}>
              <p className="text-xl mb-1">{s.icon}</p>
              <p className="text-lg font-black">{s.value}</p>
              <p className="text-[11px] font-semibold opacity-70 mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Share section ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-gray-800">Share Karein</h2>

          {/* Link box */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Referral Link</p>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
              <p className="flex-1 text-xs text-gray-600 truncate font-mono">{shareLink}</p>
              <button
                onClick={() => copyToClipboard(shareLink, "link")}
                className="flex-shrink-0 text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-teal-700 transition"
              >
                {copied === "link" ? "✓" : "Copy"}
              </button>
            </div>
          </div>

          {/* Share buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={shareWhatsApp}
              className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition text-sm"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.848L.065 23.5l5.818-1.527A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.698-.498-5.254-1.37l-.377-.22-3.452.905.921-3.36-.245-.39A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              WhatsApp
            </button>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: "Brims Hospitals — Refer & Earn",
                    text:  `Brims Hospitals pe register karo aur ₹50 cashback pao! Code: ${data.referralCode}`,
                    url:   shareLink,
                  });
                } else {
                  copyToClipboard(shareLink, "link");
                }
              }}
              className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition text-sm"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
              </svg>
              Share
            </button>
          </div>
        </div>

        {/* ── How it works ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-4">Kaise Kaam Karta Hai?</h2>
          <div className="space-y-4">
            {[
              { step: "1", icon: "📤", title: "Apna code share karein",   desc: "Dost ko apna referral code ya link bhejein" },
              { step: "2", icon: "📝", title: "Dost register kare",       desc: "Woh register karte waqt aapka code enter karein" },
              { step: "3", icon: "💰", title: "Dono ko ₹50 milte hain",  desc: "Unhe bhi ₹50 aur aapko bhi ₹50 wallet mein aata hai" },
              { step: "4", icon: "🛏️", title: "Wallet se booking karein", desc: "Balance se OPD, Lab, Surgery book karein" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{item.icon} {item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Referred people list ── */}
        {data.referredCount > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-50 bg-gray-50">
              <p className="font-bold text-gray-800 text-sm">
                Aapne Refer Kiya ({data.referredCount})
              </p>
            </div>
            <div className="divide-y divide-gray-50">
              {(data.earnings || []).filter((t: any) => t.description?.includes("reward")).slice(0, 10).map((t: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-teal-100 rounded-xl flex items-center justify-center text-sm font-bold text-teal-700">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 capitalize">
                        {t.description?.replace("Referral reward — ", "").replace(" ne aapka code use kiya", "")}
                      </p>
                      <p className="text-xs text-gray-400">{fmtDate(t.createdAt)}</p>
                    </div>
                  </div>
                  <span className="text-green-600 font-bold text-sm">+₹{t.amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── T&C ── */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-xs text-gray-500 space-y-1">
          <p className="font-semibold text-gray-600">Terms & Conditions:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Ek referral code sirf ek baar use ho sakta hai (per user)</li>
            <li>Apna khud ka code use nahi kar sakte</li>
            <li>₹50 cashback wallet mein instantly credit hota hai</li>
            <li>Brims Hospitals is scheme ko kabhi bhi badal ya band kar sakta hai</li>
          </ul>
        </div>

      </div>
    </main>
  );
}
