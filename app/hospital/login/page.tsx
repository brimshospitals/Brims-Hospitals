"use client";
import { useState } from "react";

function saveSession(data: Record<string, string>) {
  localStorage.setItem("userId",          data.userId        || "");
  localStorage.setItem("userName",         data.name          || "");
  localStorage.setItem("userRole",         "hospital");
  localStorage.setItem("hospitalMongoId",  data.hospitalMongoId || "");
  localStorage.setItem("hospitalId",       data.hospitalId    || "");
  localStorage.setItem("hospitalName",     data.hospitalName  || data.name || "");
}

export default function HospitalLoginPage() {
  const [identifier, setIdentifier] = useState("");   // hospitalId or mobile
  const [password,   setPassword]   = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [step,       setStep]       = useState<"credentials" | "otp">("credentials");
  const [otp,        setOtp]        = useState("");
  const [testOtp,    setTestOtp]    = useState("");
  const [loginMode,  setLoginMode]  = useState<"password" | "otp">("password");

  async function handlePasswordLogin() {
    setError("");
    if (!identifier.trim()) { setError("Hospital ID ya Mobile daalo"); return; }
    if (!password)           { setError("Password daalo"); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/professional-login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalId: identifier.trim(), password, type: "hospital" }),
      });
      const data = await res.json();
      if (data.success) {
        saveSession({
          userId: data.data.user.id,
          name:   data.data.user.name,
          hospitalMongoId: data.data.user.hospitalMongoId || "",
          hospitalId:      data.data.user.hospitalId      || "",
          hospitalName:    data.data.user.hospitalName    || data.data.user.name,
        });
        window.location.href = "/hospital-dashboard";
      } else {
        setError(data.message);
      }
    } catch { setError("Network error. Dobara try karein."); }
    setLoading(false);
  }

  async function handleSendOTP() {
    setError("");
    if (!identifier.trim()) { setError("Mobile number daalo"); return; }
    if (!/^\d{10}$/.test(identifier.trim())) { setError("Valid 10-digit mobile number daalo"); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setTestOtp(data.otp || "");
        setStep("otp");
      } else { setError(data.message); }
    } catch { setError("Network error. Dobara try karein."); }
    setLoading(false);
  }

  async function handleVerifyOTP() {
    setError("");
    if (otp.length !== 6) { setError("6-digit OTP daalo"); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), otp }),
      });
      const data = await res.json();
      if (data.success) {
        saveSession({
          userId: data.userId || data.data?.user?.id,
          name:   data.name   || data.data?.user?.name,
          hospitalMongoId: data.hospitalMongoId || "",
          hospitalId:      data.hospitalId      || "",
          hospitalName:    data.hospitalName    || data.name,
        });
        window.location.href = "/hospital-dashboard";
      } else { setError(data.message); }
    } catch { setError("Network error. Dobara try karein."); }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex flex-col">

      {/* Top bar */}
      <div className="px-5 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="Brims" className="h-9 w-9 rounded-full bg-white p-0.5 object-contain" />
          <span className="text-white font-bold text-lg">Brims Hospitals</span>
        </a>
        <a href="/login" className="text-purple-300 text-sm hover:text-white transition">← Member Login</a>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">

          {/* Icon */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-900/50">
              <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-white" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V7l9-4 9 4v14"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v2m-1-1h2"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Hospital Login</h1>
            <p className="text-purple-300 text-sm mt-1">Apne Hospital ID ya Mobile se login karein</p>
          </div>

          {/* Login Mode Toggle */}
          {step === "credentials" && (
            <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10 mb-5">
              <button onClick={() => { setLoginMode("password"); setError(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${loginMode === "password" ? "bg-white text-gray-900" : "text-gray-400 hover:text-white"}`}>
                Password
              </button>
              <button onClick={() => { setLoginMode("otp"); setError(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${loginMode === "otp" ? "bg-white text-gray-900" : "text-gray-400 hover:text-white"}`}>
                Mobile OTP
              </button>
            </div>
          )}

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-400/30 rounded-xl px-4 py-3 text-red-300 text-sm">{error}</div>
            )}

            {/* Password login */}
            {step === "credentials" && loginMode === "password" && (
              <>
                <div>
                  <label className="text-xs font-semibold text-purple-300 uppercase tracking-wide">Hospital ID / Mobile</label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handlePasswordLogin()}
                    placeholder="BRIMS-HOSP-XXXXX ya 10-digit mobile"
                    className="mt-1.5 w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-400 transition"
                    autoFocus
                  />
                  <p className="text-xs text-purple-400 mt-1">Hospital ID registration ke baad milti hai</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-purple-300 uppercase tracking-wide">Password</label>
                  <div className="relative mt-1.5">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handlePasswordLogin()}
                      placeholder="Apna password daalo"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-16 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-400 transition"
                    />
                    <button type="button" onClick={() => setShowPass((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-purple-400 hover:text-white transition">
                      {showPass ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <button onClick={handlePasswordLogin} disabled={loading || !identifier.trim() || !password}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:from-purple-600 hover:to-purple-700 transition disabled:opacity-40">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Login ho raha hai...
                    </span>
                  ) : "Login Karein →"}
                </button>
              </>
            )}

            {/* OTP login */}
            {step === "credentials" && loginMode === "otp" && (
              <>
                <div>
                  <label className="text-xs font-semibold text-purple-300 uppercase tracking-wide">Mobile Number</label>
                  <div className="flex mt-1.5 border border-white/20 rounded-xl overflow-hidden focus-within:border-purple-400 transition">
                    <span className="bg-white/5 text-gray-400 px-3 flex items-center text-sm border-r border-white/20">+91</span>
                    <input
                      type="tel" maxLength={10}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, ""))}
                      onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                      placeholder="10-digit mobile"
                      className="flex-1 bg-transparent px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none"
                      autoFocus
                    />
                  </div>
                </div>
                <button onClick={handleSendOTP} disabled={loading || identifier.trim().length !== 10}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:opacity-90 transition disabled:opacity-40">
                  {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />OTP bhej rahe hain...</span> : "OTP Bhejo"}
                </button>
              </>
            )}

            {/* OTP verify */}
            {step === "otp" && (
              <>
                <p className="text-sm text-purple-300 text-center">OTP bheja gaya: <strong className="text-white">+91 {identifier}</strong></p>
                {testOtp && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
                    <p className="text-xs text-amber-400 mb-1">Testing OTP:</p>
                    <p className="text-3xl font-bold tracking-[0.3em] text-amber-300 font-mono">{testOtp}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-purple-300 uppercase tracking-wide">6-Digit OTP</label>
                  <input type="tel" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
                    placeholder="_ _ _ _ _ _"
                    className="mt-1.5 w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-2xl font-bold tracking-[0.4em] placeholder-gray-600 focus:outline-none focus:border-purple-400 transition"
                    autoFocus
                  />
                </div>
                <button onClick={handleVerifyOTP} disabled={loading || otp.length !== 6}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:opacity-90 transition disabled:opacity-40">
                  {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Verify ho raha hai...</span> : "Login Karein ✓"}
                </button>
                <button onClick={() => { setStep("credentials"); setOtp(""); setError(""); }}
                  className="w-full text-purple-400 text-sm hover:text-white transition py-1">← Wapas</button>
              </>
            )}
          </div>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-purple-300">
              Hospital register nahi hai?{" "}
              <a href="/hospital-onboarding" className="text-white font-semibold hover:underline">Hospital Onboarding →</a>
            </p>
            <p className="text-xs text-purple-500">
              Doctor login:{" "}
              <a href="/doctor/login" className="text-purple-300 hover:text-white transition">Doctor Login</a>
              {" · "}
              <a href="/login" className="text-purple-300 hover:text-white transition">Member Login</a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}