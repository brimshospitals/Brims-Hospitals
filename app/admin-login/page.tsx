"use client";
import { useState } from "react";

const ROLES = [
  {
    id: "admin",
    label: "Admin",
    sublabel: "Full platform control",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
    ),
    color:  "from-rose-600 to-rose-700",
    ring:   "ring-rose-400",
    light:  "bg-rose-50 border-rose-200 text-rose-700",
    useKey: true,
  },
  {
    id: "staff",
    label: "Staff",
    sublabel: "Booking & patient management",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20H4v-2a4 4 0 014-4h1"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    color:  "from-orange-500 to-orange-600",
    ring:   "ring-orange-400",
    light:  "bg-orange-50 border-orange-200 text-orange-700",
    useKey: false,
  },
];

export default function AdminLoginPage() {
  const [selectedRole, setSelectedRole] = useState("");
  const [step, setStep]                 = useState<1 | 2>(1);
  const [identifier, setIdentifier]     = useState("");
  const [password, setPassword]         = useState("");
  const [adminKey, setAdminKey]         = useState("");
  const [showPass, setShowPass]         = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState("");

  const activeRole = ROLES.find((r) => r.id === selectedRole);

  function pickRole(id: string) {
    setSelectedRole(id);
    setStep(2);
    setError("");
    setIdentifier("");
    setPassword("");
    setAdminKey("");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    setLoading(true);
    try {
      let res: Response;
      let data: any;

      if (selectedRole === "admin") {
        // Admin uses mobile + adminKey
        if (!identifier.trim()) { setError("Mobile number daalo"); setLoading(false); return; }
        if (!adminKey.trim())   { setError("Admin key daalo"); setLoading(false); return; }

        res  = await fetch("/api/admin/login", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ mobile: identifier.trim(), adminKey: adminKey.trim() }),
        });
        data = await res.json();

        if (data.success) {
          localStorage.setItem("userId",   data.userId  || data.adminId || "");
          localStorage.setItem("userName", data.name    || data.adminName || "");
          localStorage.setItem("userRole", "admin");
          localStorage.setItem("adminId",   data.userId  || data.adminId || "");
          localStorage.setItem("adminName", data.name    || data.adminName || "");
          setSuccess(`Welcome, ${data.name || data.adminName}!`);
          setTimeout(() => { window.location.href = "/admin"; }, 800);
        } else {
          setError(data.message);
        }
      } else {
        // Staff uses mobile/email + password
        if (!identifier.trim()) { setError("Mobile number ya email daalo"); setLoading(false); return; }
        if (!password)          { setError("Password daalo"); setLoading(false); return; }

        res  = await fetch("/api/auth/portal-login", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ identifier: identifier.trim(), password, expectedRole: "staff" }),
        });
        data = await res.json();

        if (data.success) {
          localStorage.setItem("userId",   data.userId || "");
          localStorage.setItem("userName", data.name   || "");
          localStorage.setItem("userRole", data.role   || "");
          setSuccess(`Welcome, ${data.name}!`);
          setTimeout(() => { window.location.href = "/staff-dashboard"; }, 800);
        } else {
          setError(data.message);
        }
      }
    } catch {
      setError("Network error. Dobara try karein.");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex flex-col">

      {/* Top bar */}
      <div className="px-5 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="Brims" className="h-9 w-9 rounded-full bg-white p-0.5 object-contain" />
          <span className="text-white font-bold text-lg">Brims Hospitals</span>
        </a>
        <div className="flex items-center gap-4">
          <a href="/login"        className="text-gray-400 text-sm hover:text-white transition">Member Login</a>
          <a href="/portal-login" className="text-gray-400 text-sm hover:text-white transition">Doctor / Hospital</a>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">
              {step === 1 ? "Admin / Staff Login" : `${activeRole?.label} Login`}
            </h1>
            <p className="text-gray-400 text-sm">
              {step === 1 ? "Role select karein" : activeRole?.sublabel}
            </p>
          </div>

          {/* STEP 1 — Role Selection */}
          {step === 1 && (
            <div className="space-y-3">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => pickRole(r.id)}
                  className="w-full flex items-center gap-4 bg-white/8 hover:bg-white/14 border border-white/10 hover:border-white/25 rounded-2xl p-5 transition-all text-left group"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${r.color} flex items-center justify-center text-white flex-shrink-0 group-hover:scale-105 transition-transform`}>
                    {r.icon}
                  </div>
                  <div>
                    <p className="text-white font-bold text-base">{r.label}</p>
                    <p className="text-gray-400 text-sm">{r.sublabel}</p>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-gray-500 ml-auto group-hover:text-white transition" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              ))}

              <div className="pt-4 text-center">
                <a href="/portal-login" className="text-gray-400 text-sm hover:text-white transition">
                  Doctor / Hospital login? →
                </a>
              </div>
            </div>
          )}

          {/* STEP 2 — Login Form */}
          {step === 2 && activeRole && (
            <div className="bg-white/8 border border-white/10 rounded-3xl p-7">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${activeRole.light} mb-6`}>
                <span className="text-sm font-semibold">{activeRole.label}</span>
              </div>

              {(error || success) && (
                <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
                  success ? "bg-green-500/20 text-green-300 border border-green-500/30"
                           : "bg-red-500/20 text-red-300 border border-red-500/30"
                }`}>
                  {error || success}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-gray-300 text-sm font-medium mb-1.5 block">
                    {selectedRole === "admin" ? "Registered Mobile Number" : "Mobile ya Email"}
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={selectedRole === "admin" ? "10-digit mobile number" : "Mobile ya email daalo"}
                    className="w-full bg-white/10 border border-white/15 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/40 transition"
                    autoFocus
                  />
                </div>

                {selectedRole === "admin" ? (
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-1.5 block">Admin Secret Key</label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        value={adminKey}
                        onChange={(e) => setAdminKey(e.target.value)}
                        placeholder="Admin key daalo"
                        className="w-full bg-white/10 border border-white/15 text-white placeholder-gray-500 rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:border-white/40 transition"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition text-xs">
                        {showPass ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-gray-300 text-sm font-medium mb-1.5 block">Password</label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password daalo"
                        className="w-full bg-white/10 border border-white/15 text-white placeholder-gray-500 rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:border-white/40 transition"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition text-xs">
                        {showPass ? "Hide" : "Show"}
                      </button>
                    </div>
                    <p className="text-gray-500 text-xs mt-1.5">Default password: aapka registered mobile number</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r ${activeRole.color} hover:opacity-90 disabled:opacity-50 transition-all`}
                >
                  {loading ? "Login ho raha hai..." : "Login Karein →"}
                </button>
              </form>

              <button
                onClick={() => { setStep(1); setError(""); }}
                className="mt-4 w-full text-gray-500 hover:text-gray-300 text-sm text-center transition"
              >
                ← Wapas jayen
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
