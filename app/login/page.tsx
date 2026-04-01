"use client";
import { useState } from "react";
import Header from "../components/header";

export default function LoginPage() {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1=mobile, 2=otp
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Step 1: OTP bhejo
  async function handleSendOTP() {
    setError("");
    setMessage("");
    if (mobile.length !== 10) {
      setError("10 digit ka mobile number daalo");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`OTP bhej diya! (Testing: ${data.otp})`);
        setStep(2);
      } else {
        setError(data.message);
      }
    } catch {
      setError("Network error. Dobara try karein.");
    }
    setLoading(false);
  }

  // Step 2: OTP verify karo
  async function handleVerifyOTP() {
    setError("");
    if (otp.length !== 6) {
      setError("6 digit ka OTP daalo");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Login ho gaya! 🎉");
        // Agar naya user hai toh register page pe bhejo
        if (data.isNewUser) {
          setTimeout(() => {
            window.location.href = `/register?mobile=${mobile}&userId=${data.userId}`;
          }, 1000);
        } else {
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1000);
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
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-center py-16 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
          
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-2">🏥</div>
            <h1 className="text-2xl font-bold text-teal-700">Brims Hospitals</h1>
            <p className="text-gray-500 text-sm">Mobile se login karein</p>
          </div>

          {/* Step 1: Mobile Number */}
          {step === 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              <div className="flex gap-2 mb-4">
                <span className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-3 text-gray-600 font-medium">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                  placeholder="10 digit number"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
              >
                {loading ? "Bhej rahe hain..." : "OTP Bhejo"}
              </button>
            </div>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                +91 {mobile} pe OTP bheja gaya
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OTP Daalo
              </label>
              <input
                type="tel"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="6 digit OTP"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500 mb-4"
              />
              <button
                onClick={handleVerifyOTP}
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
              >
                {loading ? "Check kar rahe hain..." : "Login Karein"}
              </button>
              <button
                onClick={() => { setStep(1); setOtp(""); setError(""); }}
                className="w-full mt-2 text-teal-600 text-sm hover:underline"
              >
                Mobile number badlein
              </button>
            </div>
          )}

          {/* Messages */}
          {message && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {message}
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <p className="text-center text-gray-500 text-sm mt-6">
            Naya user?{" "}
            <a href="/register" className="text-teal-600 font-medium hover:underline">
              Register karein
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}