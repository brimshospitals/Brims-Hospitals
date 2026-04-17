"use client";
import { useState } from "react";

const ROLES = [
  {
    id: "doctor",
    label: "Doctor",
    sublabel: "Appointments & Patient Care",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M12 9v6"/>
      </svg>
    ),
    color: "from-blue-500 to-blue-600",
    ring:  "ring-blue-400",
    light: "bg-blue-50 border-blue-200",
    hint:  "Registered mobile number ya email daalo",
  },
  {
    id: "hospital",
    label: "Hospital / Lab",
    sublabel: "Manage doctors & services",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V7l9-4 9 4v14"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v2m-1-1h2"/>
      </svg>
    ),
    color: "from-purple-500 to-purple-600",
    ring:  "ring-purple-400",
    light: "bg-purple-50 border-purple-200",
    hint:  "Hospital registration mobile ya email daalo",
  },
];

export default function PortalLoginPage() {
  const [selectedRole, setSelectedRole] = useState("");
  const [step, setStep]                 = useState<1 | 2>(1);
  const [identifier, setIdentifier]     = useState("");
  const [password, setPassword]         = useState("");
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
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!identifier.trim()) { setError("Mobile number ya email daalo"); return; }
    if (!password)           { setError("Password daalo"); return; }

    setLoading(true);
    try {
      const res  = await fetch("/api/auth/portal-login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ identifier: identifier.trim(), password, expectedRole: selectedRole }),
      });
      const data = await res.json();

      if (data.success) {
        // Save to localStorage
        localStorage.setItem("userId",   data.userId  || "");
        localStorage.setItem("userName", data.name    || "");
        localStorage.setItem("userRole", data.role    || "");

        if (data.role === "doctor" && data.doctorId) {
          localStorage.setItem("doctorId",   data.doctorId);
          localStorage.setItem("doctorName", data.doctorName || data.name);
          localStorage.setItem("hospitalId", data.hospitalId || "");
        }
        if (data.role === "hospital" && data.hospitalMongoId) {
          localStorage.setItem("hospitalMongoId", data.hospitalMongoId);
          localStorage.setItem("hospitalId",      data.hospitalId   || "");
          localStorage.setItem("hospitalName",    data.hospitalName || "");
        }

        setSuccess(`Welcome, ${data.name}! Redirect ho rahe hain...`);
        setTimeout(() => {
          window.location.href = data.redirect || (data.role === "doctor" ? "/doctor-dashboard" : "/hospital-dashboard");
        }, 800);
      } else {
        setError(data.message);
      }
    } catch {
      setError("Network error. Dobara try karein.");
    }
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
        <div className="flex items-center gap-4">
          <a href="/login"       className="text-gray-400 text-sm hover:text-white transition">Member Login</a>
          <a href="/admin-login" className="text-gray-400 text-sm hover:text-white transition">Admin / Staff</a>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">
              {step === 1 ? "Portal Login" : `${activeRole?.label} Login`}
            </h1>
            <p className="text-gray-400 text-sm">
              {step === 1 ? "Doctor ya Hospital select karein" : activeRole?.sublabel}
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
                <a href="/admin-login" className="text-gray-400 text-sm hover:text-white transition">
                  Admin / Staff login? →
                </a>
              </div>
            </div>
          )}

          {/* STEP 2 — Login Form */}
          {step === 2 && activeRole && (
            <div className="bg-white/8 border border-white/10 rounded-3xl p-7">
              {/* Role badge */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${activeRole.light} mb-6`}>
                <span className="text-sm font-semibold">{activeRole.label}</span>
              </div>

              {/* Toast */}
              {(error || success) && (
                <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
                  success ? "bg-green-500/20 text-green-300 border border-green-500/30" :
                            "bg-red-500/20 text-red-300 border border-red-500/30"
                }`}>
                  {error || success}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-gray-300 text-sm font-medium mb-1.5 block">
                    Mobile Number ya Email
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={activeRole.hint}
                    className="w-full bg-white/10 border border-white/15 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/40 focus:bg-white/15 transition"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-gray-300 text-sm font-medium mb-1.5 block">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password daalo"
                      className="w-full bg-white/10 border border-white/15 text-white placeholder-gray-500 rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:border-white/40 focus:bg-white/15 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition text-xs"
                    >
                      {showPass ? "Hide" : "Show"}
                    </button>
                  </div>
                  <p className="text-gray-500 text-xs mt-1.5">
                    Default password: aapka registered mobile number
                  </p>
                </div>

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

          {/* Help text */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-xs">
              Password bhool gaye? Admin se contact karein aur reset karwayen.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
