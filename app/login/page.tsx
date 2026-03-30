"use client";
import Header from "../components/header";
import { useState } from "react";

export default function LoginPage() {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("mobile"); // mobile | otp
  const [loading, setLoading] = useState(false);

  const handleSendOTP = () => {
    if (mobile.length !== 10) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
    }, 1500);
  };

  const handleVerifyOTP = () => {
    if (otp.length !== 6) {
      alert("Please enter a valid 6-digit OTP");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("Login Successful! Welcome to Brims Hospitals 🏥");
    }, 1500);
  };

  return (
    <main className="min-h-screen flex">

      {/* Left Side — Branding */}
      <div className="hidden md:flex w-1/2 bg-teal-600 flex-col justify-center items-center text-white px-12">
        <img
          src="/logo.png"
          alt="Brims Hospitals"
          className="h-32 w-32 object-contain bg-white rounded-full p-3 mb-8 shadow-xl"
        />
        <h1 className="text-4xl font-bold mb-3 text-center">Brims Hospitals</h1>
        <p className="text-teal-100 text-lg text-center mb-8">
          Making Healthcare Affordable
        </p>

        {/* Features */}
        <div className="space-y-4 w-full max-w-sm">
          {[
            { icon: "📅", text: "Book OPD Appointments Instantly" },
            { icon: "🧪", text: "Order Lab Tests from Home" },
            { icon: "💻", text: "Consult Doctors via Video Call" },
            { icon: "👨‍👩‍👧", text: "Manage Your Family Health Card" },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3 bg-teal-500 bg-opacity-40 rounded-xl px-4 py-3">
              <span className="text-2xl">{f.icon}</span>
              <span className="text-sm text-teal-50">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side — Login Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-8 py-12 bg-white">

        {/* Mobile Logo */}
        <div className="flex md:hidden items-center gap-3 mb-8">
          <img src="/logo.png" alt="Logo" className="h-12 w-12 object-contain bg-teal-600 rounded-full p-1" />
          <div>
            <h1 className="text-xl font-bold text-teal-700">Brims Hospitals</h1>
            <p className="text-xs text-gray-400">Making Healthcare Affordable</p>
          </div>
        </div>

        <div className="w-full max-w-sm">

          {/* Heading */}
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {step === "mobile" ? "Welcome Back! 👋" : "Verify OTP 🔐"}
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            {step === "mobile"
              ? "Enter your mobile number to continue"
              : `OTP sent to +91 ${mobile} — Enter below`}
          </p>

          {/* Step 1 — Mobile Number */}
          {step === "mobile" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">
                  Mobile Number
                </label>
                <div className="flex border border-gray-200 rounded-xl overflow-hidden focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100">
                  <span className="bg-gray-50 text-gray-500 px-4 flex items-center text-sm font-medium border-r border-gray-200">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 10-digit number"
                    className="flex-1 px-4 py-3 outline-none text-gray-800 text-sm"
                  />
                </div>
              </div>

              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition disabled:opacity-60"
              >
                {loading ? "Sending OTP..." : "Send OTP →"}
              </button>
            </div>
          )}

          {/* Step 2 — OTP Input */}
          {step === "otp" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">
                  Enter 6-digit OTP
                </label>
                <input
                  type="tel"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • • • •"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl tracking-widest outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-gray-800"
                />
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={loading}
                className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify & Login ✓"}
              </button>

              <button
                onClick={() => { setStep("mobile"); setOtp(""); }}
                className="w-full text-teal-600 text-sm font-medium hover:underline"
              >
                ← Change Mobile Number
              </button>

              <p className="text-center text-xs text-gray-400">
                Didn't receive OTP?{" "}
                <span className="text-teal-600 font-medium cursor-pointer hover:underline">
                  Resend OTP
                </span>
              </p>
            </div>
          )}

          {/* Register Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              New patient?{" "}
              <a href="/register" className="text-teal-600 font-semibold hover:underline">
                Create Account →
              </a>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-4 text-center">
            <a href="/" className="text-xs text-gray-300 hover:text-teal-500 transition">
              ← Back to Home
            </a>
          </div>

        </div>
      </div>
    </main>
  );
}
