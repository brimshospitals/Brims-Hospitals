"use client";
import { useState } from "react";

const ROLES = [
  {
    id: "doctor",
    label: "Doctor",
    sublabel: "Appointments & Teleconsult",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M12 9v6"/>
      </svg>
    ),
    bg:    "from-blue-500 to-blue-600",
    ring:  "ring-blue-400",
    light: "bg-blue-50 border-blue-300 text-blue-700",
  },
  {
    id: "hospital",
    label: "Hospital / Lab",
    sublabel: "Manage doctors & services",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V7l9-4 9 4v14"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v2m-1-1h2"/>
      </svg>
    ),
    bg:    "from-purple-500 to-purple-600",
    ring:  "ring-purple-400",
    light: "bg-purple-50 border-purple-300 text-purple-700",
  },
  {
    id: "staff",
    label: "Staff",
    sublabel: "Admin dwara create hota hai",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20H4v-2a4 4 0 014-4h1"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    bg:    "from-orange-500 to-orange-600",
    ring:  "ring-orange-400",
    light: "bg-orange-50 border-orange-300 text-orange-700",
  },
  {
    id: "admin",
    label: "Admin",
    sublabel: "Full platform access",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.52l-.06-.01a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82V15a1.65 1.65 0 00-1.52-1.08l-.06-.01a2 2 0 010-4h.09A1.65 1.65 0 0010.4 8.6l.01-.06a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H15a1.65 1.65 0 001.08-1.52V3a2 2 0 014 0v.09"/>
      </svg>
    ),
    bg:    "from-rose-600 to-rose-700",
    ring:  "ring-rose-400",
    light: "bg-rose-50 border-rose-300 text-rose-700",
  },
];

const ROLE_REDIRECT: Record<string, string> = {
  admin:    "/admin",
  staff:    "/staff-dashboard",
  doctor:   "/doctor-dashboard",
  hospital: "/hospital-dashboard",
};

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export default function StaffLoginPage() {
  const [step, setStep]             = useState<1 | 2 | 3>(1);
  const [selectedRole, setRole]     = useState("");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp]               = useState("");
  const [password, setPassword]     = useState("");
  const [loginMode, setLoginMode]   = useState<"otp" | "password">("otp");
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");
  const [testOtp, setTestOtp]       = useState("");

  const activeRole = ROLES.find((r) => r.id === selectedRole);
  const emailMode  = isEmail(identifier.trim());
  const canUsePassword = ["doctor", "hospital", "staff"].includes(selectedRole);

  function pickRole(id: string) {
    setRole(id);
    setStep(2);
    setError("");
    setIdentifier("");
    setPassword("");
    setLoginMode("otp");
  }

  function saveSession(data: any) {
    localStorage.setItem("userId",   data.userId);
    localStorage.setItem("userName", data.name  || "");
    localStorage.setItem("userRole", data.role  || "");
    if ((data.role === "admin" || data.role === "staff") && data.userId) {
      localStorage.setItem("adminId",   data.userId);
      localStorage.setItem("adminName", data.name || "");
    }
    if (data.role === "doctor" && data.doctorId) {
      localStorage.setItem("doctorId",   data.doctorId);
      localStorage.setItem("doctorName", data.doctorName || data.name);
      localStorage.setItem("hospitalId", data.hospitalId || "");
    }
    if (data.role === "hospital" && data.hospitalMongoId) {
      localStorage.setItem("hospitalMongoId", data.hospitalMongoId);
      localStorage.setItem("hospitalId",      data.hospitalId      || "");
      localStorage.setItem("hospitalName",    data.hospitalName    || "");
    }
    setSuccess(`Welcome, ${data.name}! Redirect ho rahe hain...`);
    const redirect = ROLE_REDIRECT[data.role] || "/dashboard";
    setTimeout(() => { window.location.href = redirect; }, 800);
  }

  async function handlePasswordLogin() {
    setError("");
    const val = identifier.trim();
    if (!val) { setError("Mobile number ya email daalo"); return; }
    if (!password) { setError("Password daalo"); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/password-login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: val, password }),
      });
      const data = await res.json();
      if (data.success) { saveSession(data); }
      else { setError(data.message); }
    } catch { setError("Network error. Dobara try karein."); }
    setLoading(false);
  }

  async function handleSendOTP() {
    setError("");
    const val = identifier.trim();
    if (!val) { setError("Mobile number ya email daalo"); return; }
    if (!isEmail(val) && !/^\d{10}$/.test(val)) {
      setError("Valid 10-digit mobile ya email daalo");
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch("/api/send-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ identifier: val }),
      });
      const data = await res.json();
      if (data.success) {
        setTestOtp(data.otp || "");
        setSuccess(`OTP ${emailMode ? val : "+91 " + val} par bheja gaya!`);
        setStep(3);
      } else {
        setError(data.message);
      }
    } catch { setError("Network error. Dobara try karein."); }
    setLoading(false);
  }

  async function handleVerifyOTP() {
    setError("");
    if (otp.length !== 6) { setError("6-digit OTP daalo"); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/verify-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ identifier: identifier.trim(), otp }),
      });
      const data = await res.json();
      if (data.success) { saveSession(data); }
      else { setError(data.message); }
    } catch { setError("Network error. Dobara try karein."); }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">

      {/* Top bar */}
      <div className="px-5 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="Brims" className="h-9 w-9 rounded-full bg-white p-0.5 object-contain" />
          <span className="text-white font-bold text-lg">Brims Hospitals</span>
        </a>
        <a href="/login" className="text-gray-400 text-sm hover:text-white transition-colors">
          ← Member Login
        </a>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">

          {/* Step indicator */}
          <div className="flex items-center gap-2 justify-center mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= s ? "bg-white text-gray-900" : "bg-white/10 text-white/30"
                }`}>{s}</div>
                {s < 3 && <div className={`w-8 h-0.5 rounded-full transition-all ${step > s ? "bg-white" : "bg-white/20"}`} />}
              </div>
            ))}
          </div>

          {/* STEP 1 — Role Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-white">Staff Portal Login</h1>
                <p className="text-gray-400 text-sm mt-1">Apna role select karein</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => pickRole(r.id)}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-2xl p-5 text-left transition-all group"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.bg} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
                      {r.icon}
                    </div>
                    <p className="text-white font-semibold text-sm">{r.label}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{r.sublabel}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 — Identifier + Login Mode */}
          {step === 2 && activeRole && (
            <div className="space-y-5">
              <div className="text-center">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${activeRole.bg} flex items-center justify-center text-white mx-auto mb-4`}>
                  {activeRole.icon}
                </div>
                <h2 className="text-xl font-bold text-white">{activeRole.label} Login</h2>
                <p className="text-gray-400 text-sm mt-1">Mobile number ya email se login karein</p>
              </div>

              {/* OTP / Password toggle — only for doctor/hospital/staff */}
              {canUsePassword && (
                <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => { setLoginMode("otp"); setError(""); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${loginMode === "otp" ? "bg-white text-gray-900" : "text-gray-400 hover:text-white"}`}
                  >
                    OTP Login
                  </button>
                  <button
                    onClick={() => { setLoginMode("password"); setError(""); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${loginMode === "password" ? "bg-white text-gray-900" : "text-gray-400 hover:text-white"}`}
                  >
                    Password Login
                  </button>
                </div>
              )}

              {/* Staff-only notice */}
              {selectedRole === "staff" && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 text-orange-300 text-sm flex items-start gap-2">
                  <span className="shrink-0">ℹ️</span>
                  <span>Staff account sirf Admin dwara banaya jata hai. Agar aapka account nahi hai to Admin se contact karein.</span>
                </div>
              )}

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm">{error}</div>}
                {success && <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-green-300 text-sm">{success}</div>}

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Mobile Number ya Email ID
                  </label>
                  {identifier.trim() && (
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${emailMode ? "bg-blue-500/20 text-blue-300" : "bg-teal-500/20 text-teal-300"}`}>
                      {emailMode ? "Email" : "Mobile"}
                    </span>
                  )}
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (loginMode === "password" ? handlePasswordLogin() : handleSendOTP())}
                    placeholder="9876543210 ya name@email.com"
                    className="mt-1.5 w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
                    autoFocus
                  />
                </div>

                {/* Password field */}
                {loginMode === "password" && (
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Password</label>
                    <div className="relative mt-1.5">
                      <input
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handlePasswordLogin()}
                        placeholder="Apna password daalo"
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
                      />
                      <button type="button" onClick={() => setShowPass((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition text-sm">
                        {showPass ? "Hide" : "Show"}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Pehli baar? OTP se login karein phir profile mein password set karein.</p>
                  </div>
                )}

                <button
                  onClick={loginMode === "password" ? handlePasswordLogin : handleSendOTP}
                  disabled={loading || identifier.trim().length < 5 || (loginMode === "password" && !password)}
                  className={`w-full bg-gradient-to-r ${activeRole.bg} text-white py-3.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-40`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      {loginMode === "password" ? "Login ho raha hai..." : "OTP bhej rahe hain..."}
                    </span>
                  ) : loginMode === "password" ? "Login Karein" : "OTP Bhejo"}
                </button>
              </div>

              <button onClick={() => { setStep(1); setError(""); setSuccess(""); }}
                className="w-full text-gray-400 text-sm hover:text-white transition-colors py-2">
                ← Role change karein
              </button>
            </div>
          )}

          {/* STEP 3 — OTP */}
          {step === 3 && activeRole && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-bold text-white">OTP Verify Karein</h2>
                <p className="text-gray-400 text-sm mt-1">{identifier.trim()} par bheja gaya</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm">{error}</div>}
                {success && <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-green-300 text-sm">{success}</div>}

                {/* Testing OTP */}
                {testOtp && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
                    <p className="text-xs text-amber-400 font-medium mb-1">Testing Mode — OTP:</p>
                    <p className="text-3xl font-bold tracking-[0.3em] text-amber-300 font-mono">{testOtp}</p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">6-Digit OTP</label>
                  <input
                    type="tel"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
                    placeholder="_ _ _ _ _ _"
                    className="mt-1.5 w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-2xl font-bold tracking-[0.4em] placeholder-gray-600 focus:outline-none focus:border-white/40 transition-all"
                    autoFocus
                  />
                </div>

                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  className={`w-full bg-gradient-to-r ${activeRole?.bg} text-white py-3.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-40`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Verify ho raha hai...
                    </span>
                  ) : "Login Karein ✓"}
                </button>
              </div>

              <button onClick={() => { setStep(2); setOtp(""); setError(""); setSuccess(""); setTestOtp(""); }}
                className="w-full text-gray-400 text-sm hover:text-white transition-colors py-2">
                ← Wapas jao
              </button>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
