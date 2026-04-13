"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const ROLE_REDIRECT: Record<string, string> = {
  admin:    "/admin",
  staff:    "/staff-dashboard",
  doctor:   "/doctor-dashboard",
  hospital: "/hospital-dashboard",
  user:     "/dashboard",
  member:   "/dashboard",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refFromUrl = searchParams.get("ref") || "";

  const [step, setStep]             = useState<1 | 2>(1);
  const [mobile, setMobile]         = useState("");
  const [otp, setOtp]               = useState("");
  const [referralCode, setReferralCode] = useState(refFromUrl);
  const [showReferral, setShowReferral] = useState(!!refFromUrl);

  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

  // From send-otp response
  const [testOtp, setTestOtp]       = useState("");
  const [otpVia, setOtpVia]         = useState<"mobile" | "both">("mobile");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [isNewUser, setIsNewUser]   = useState<boolean | null>(null);
  const [pendingUserId, setPendingUserId] = useState("");

  async function handleSendOTP() {
    setError("");
    const val = mobile.trim();
    if (!/^\d{10}$/.test(val)) {
      setError("Valid 10-digit mobile number daalo");
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch("/api/send-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ identifier: val, flow: "member" }),
      });
      const data = await res.json();
      if (data.success) {
        setTestOtp(data.otp || "");
        setOtpVia(data.via === "both" ? "both" : "mobile");
        setMaskedEmail(data.emailMasked || "");
        setIsNewUser(data.isNewUser ?? null);
        setPendingUserId(data.userId || "");
        setSuccess(
          data.via === "both"
            ? `OTP +91 ${val} aur ${data.emailMasked} par bheja gaya!`
            : `OTP +91 ${val} par bheja gaya!`
        );
        setStep(2);
      } else {
        setError(data.message);
      }
    } catch {
      setError("Network error. Dobara try karein.");
    }
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
        body:    JSON.stringify({ identifier: mobile.trim(), otp }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("userId",   data.userId);
        localStorage.setItem("userName", data.name  || "");
        localStorage.setItem("userRole", data.role  || "user");

        // New user → registration page (referral code bhi pass karo)
        if (data.isNewUser) {
          const params = new URLSearchParams({
            userId: data.userId,
            mobile: mobile.trim(),
            ...(referralCode.trim() && { ref: referralCode.trim().toUpperCase() }),
          });
          setSuccess("Aapka account mil gaya! Register karo...");
          setTimeout(() => { window.location.href = `/register?${params.toString()}`; }, 800);
        } else {
          const redirect = ROLE_REDIRECT[data.role] || "/dashboard";
          setSuccess(`Welcome back, ${data.name}! Redirect ho rahe hain...`);
          setTimeout(() => { window.location.href = redirect; }, 800);
        }
      } else {
        setError(data.message);
      }
    } catch {
      setError("Network error. Dobara try karein.");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex flex-col">

      {/* Top bar */}
      <div className="bg-teal-600 px-5 py-3 flex items-center gap-3">
        <a href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="Brims" className="h-9 w-9 rounded-full bg-white p-0.5 object-contain" />
          <span className="text-white font-bold text-lg">Brims Hospitals</span>
        </a>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-teal-100 overflow-hidden">

            {/* Header gradient */}
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 px-7 pt-8 pb-6 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <svg viewBox="0 0 24 24" fill="none" className="w-9 h-9 text-white" stroke="currentColor" strokeWidth={1.8}>
                  <circle cx="12" cy="8" r="4"/>
                  <path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              </div>
              <h1 className="text-xl font-bold">Member Login / Register</h1>
              <p className="text-teal-100 text-sm mt-1">Apne mobile number se login karein</p>
            </div>

            <div className="px-7 py-6 space-y-4">

              {/* Referral banner if coming from invite link */}
              {refFromUrl && step === 1 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                  <span className="text-2xl">🎁</span>
                  <div>
                    <p className="text-xs font-semibold text-amber-800">Referral Invite!</p>
                    <p className="text-xs text-amber-600">Register karo aur <strong>₹50 wallet cashback</strong> pao</p>
                    <p className="text-xs text-amber-700 font-mono mt-0.5">Code: <strong>{refFromUrl}</strong></p>
                  </div>
                </div>
              )}

              {/* Success message */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">✓</span>
                  <span>{success}</span>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* ───── Step 1 — Mobile ───── */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mobile Number</label>
                    <div className="mt-1.5 flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                      <span className="px-3 py-3 bg-gray-50 text-gray-500 text-sm font-medium border-r border-gray-200">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                        onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                        placeholder="10-digit mobile number"
                        className="flex-1 px-3 py-3 text-sm bg-transparent focus:outline-none"
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">
                      Pehli baar? Mobile dale — OTP se register ho jaayega
                    </p>
                  </div>

                  {/* Referral code accordion */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowReferral(!showReferral)}
                      className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1 font-medium"
                    >
                      <span>{showReferral ? "▾" : "▸"}</span>
                      Kisi ne refer kiya? Referral code daalo (+₹50 cashback)
                    </button>

                    {showReferral && (
                      <div className="mt-2">
                        <div className="flex items-center border border-amber-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-amber-200 bg-amber-50">
                          <span className="px-3 py-2.5 text-lg">🎁</span>
                          <input
                            type="text"
                            value={referralCode}
                            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                            placeholder="BRIMS-XXX000"
                            maxLength={15}
                            className="flex-1 px-2 py-2.5 text-sm bg-transparent focus:outline-none font-mono tracking-wide text-amber-900"
                          />
                          {referralCode && (
                            <button
                              type="button"
                              onClick={() => setReferralCode("")}
                              className="px-3 py-2.5 text-gray-400 hover:text-red-400 text-xs"
                            >✕</button>
                          )}
                        </div>
                        <p className="text-xs text-amber-600 mt-1">
                          Register hone ke baad dono ko ₹50 wallet mein milenge
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSendOTP}
                    disabled={loading || mobile.length !== 10}
                    className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg shadow-teal-200 disabled:opacity-50 disabled:shadow-none"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        OTP bhej rahe hain...
                      </span>
                    ) : "OTP Bhejo →"}
                  </button>
                </div>
              )}

              {/* ───── Step 2 — OTP ───── */}
              {step === 2 && (
                <div className="space-y-4">

                  {/* New / Returning user badge */}
                  {isNewUser === true && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3">
                      <span className="text-2xl">👋</span>
                      <div>
                        <p className="text-sm font-semibold text-blue-800">Pehli baar? Swagat hai!</p>
                        <p className="text-xs text-blue-600">OTP verify karne ke baad hum aapka profile banayenge</p>
                        {referralCode && (
                          <p className="text-xs text-amber-600 mt-1 font-medium">🎁 Code <span className="font-mono">{referralCode}</span> apply hoga — ₹50 cashback milega!</p>
                        )}
                      </div>
                    </div>
                  )}
                  {isNewUser === false && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                      <span className="text-2xl">✅</span>
                      <div>
                        <p className="text-sm font-semibold text-green-800">Account mil gaya!</p>
                        <p className="text-xs text-green-600">OTP verify karo — dashboard pe redirect ho jaoge</p>
                      </div>
                    </div>
                  )}

                  {/* OTP sent info */}
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-sm text-teal-700 space-y-1">
                    <p className="font-medium">OTP bheja gaya:</p>
                    <p>📱 +91 {mobile}</p>
                    {otpVia === "both" && maskedEmail && (
                      <p>📧 {maskedEmail}</p>
                    )}
                  </div>

                  {/* Testing OTP box */}
                  {testOtp && (
                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-center">
                      <p className="text-xs text-amber-600 font-medium mb-1">Testing Mode — OTP:</p>
                      <p className="text-3xl font-bold tracking-[0.3em] text-amber-700 font-mono">{testOtp}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">6-Digit OTP</label>
                    <input
                      type="tel"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
                      placeholder="_ _ _ _ _ _"
                      className="mt-1.5 w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-[0.4em] focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
                      autoFocus
                    />
                  </div>

                  <button
                    onClick={handleVerifyOTP}
                    disabled={loading || otp.length !== 6}
                    className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg shadow-teal-200 disabled:opacity-50 disabled:shadow-none"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Verify ho raha hai...
                      </span>
                    ) : isNewUser ? "Register Karein →" : "Login Karein ✓"}
                  </button>

                  <button
                    onClick={() => { setStep(1); setOtp(""); setError(""); setSuccess(""); setTestOtp(""); setIsNewUser(null); }}
                    className="w-full text-sm text-gray-500 hover:text-teal-600 transition-colors py-1"
                  >
                    ← Mobile number change karein
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Other login links */}
          <div className="mt-6 space-y-3 text-center">
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-3">Aap Doctor / Hospital / Staff / Admin hain?</p>
              <a href="/staff-login"
                className="inline-flex items-center gap-2 bg-gray-800 text-white text-sm px-5 py-2.5 rounded-xl hover:bg-gray-900 transition-colors font-medium">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                Staff / Doctor / Admin Login
              </a>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-3">Doctor ke roop mein register karna chahte hain?</p>
              <a href="/doctor-register"
                className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v4M10 13h4"/>
                </svg>
                Doctor Registration
              </a>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}

export default function MemberLoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
