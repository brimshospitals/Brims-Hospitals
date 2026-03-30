"use client";
import Header from "../components/header";
import { useState } from "react";

export default function RegisterPage() {
  const [step, setStep] = useState("form");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    dob: "",
    gender: "",
    city: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (!form.name || !form.mobile || !form.gender) {
      alert("Please fill all required fields");
      return;
    }
    if (form.mobile.length !== 10) {
      alert("Please enter valid 10-digit mobile number");
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
      alert("Please enter valid 6-digit OTP");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("success");
    }, 1500);
  };

  return (
    <main className="min-h-screen flex">

      <div className="hidden md:flex w-1/2 bg-teal-600 flex-col justify-center items-center text-white px-12">
        <img src="/logo.png" alt="Brims Hospitals" className="h-32 w-32 object-contain bg-white rounded-full p-3 mb-8 shadow-xl" />
        <h1 className="text-4xl font-bold mb-3 text-center">Brims Hospitals</h1>
        <p className="text-teal-100 text-lg text-center mb-8">Making Healthcare Affordable</p>
        <div className="space-y-4 w-full max-w-sm">
          {[
            { icon: "Free", text: "Free Registration — No Charges" },
            { icon: "Book", text: "Instant OPD Appointment Booking" },
            { icon: "Lab", text: "Home Lab Test Collection" },
            { icon: "Family", text: "Family Health Card Benefits" },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3 bg-teal-500 bg-opacity-40 rounded-xl px-4 py-3">
              <span className="text-sm font-bold text-white bg-teal-400 px-2 py-1 rounded-lg">{f.icon}</span>
              <span className="text-sm text-teal-50">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-8 py-12 bg-white overflow-y-auto">
        <div className="w-full max-w-sm">

          {step === "form" && (
            <>
              <h2 className="text-3xl font-bold text-gray-800 mb-1">Create Account</h2>
              <p className="text-gray-400 text-sm mb-6">Register as a new patient</p>
              <div className="space-y-4">

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Full Name *</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-gray-800" />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Mobile Number *</label>
                  <div className="flex border border-gray-200 rounded-xl overflow-hidden focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100">
                    <span className="bg-gray-50 text-gray-500 px-4 flex items-center text-sm font-medium border-r border-gray-200">+91</span>
                    <input type="tel" name="mobile" maxLength={10} value={form.mobile}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "") })}
                      placeholder="10-digit number"
                      className="flex-1 px-4 py-3 outline-none text-sm text-gray-800" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Email (Optional)</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder="yourname@email.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-gray-800" />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Gender *</label>
                  <div className="flex gap-3">
                    {["Male", "Female", "Other"].map((g) => (
                      <button key={g} onClick={() => setForm({ ...form, gender: g })}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${
                          form.gender === g ? "bg-teal-600 text-white border-teal-600" : "border-gray-200 text-gray-500 hover:border-teal-400"
                        }`}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Date of Birth</label>
                  <input type="date" name="dob" value={form.dob} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-gray-600" />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">City</label>
                  <input type="text" name="city" value={form.city} onChange={handleChange}
                    placeholder="Your city"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-gray-800" />
                </div>

                <button onClick={handleSubmit} disabled={loading}
                  className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition disabled:opacity-60 mt-2">
                  {loading ? "Sending OTP..." : "Register & Send OTP"}
                </button>

              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-400">
                  Already registered?{" "}
                  <a href="/login" className="text-teal-600 font-semibold hover:underline">Login here</a>
                </p>
                <a href="/" className="text-xs text-gray-300 hover:text-teal-500 transition mt-3 block">Back to Home</a>
              </div>
            </>
          )}

          {step === "otp" && (
            <>
              <h2 className="text-3xl font-bold text-gray-800 mb-1">Verify OTP</h2>
              <p className="text-gray-400 text-sm mb-6">OTP sent to +91 {form.mobile}</p>
              <div className="space-y-4">
                <input type="tel" maxLength={6} value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl tracking-widest outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-gray-800" />
                <button onClick={handleVerifyOTP} disabled={loading}
                  className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition disabled:opacity-60">
                  {loading ? "Verifying..." : "Verify & Complete Registration"}
                </button>
                <button onClick={() => { setStep("form"); setOtp(""); }}
                  className="w-full text-teal-600 text-sm font-medium hover:underline">
                  Go Back
                </button>
              </div>
            </>
          )}

          {step === "success" && (
            <div className="text-center py-8">
              <div className="text-6xl mb-6">✓</div>
              <h2 className="text-2xl font-bold text-teal-700 mb-2">Registration Successful!</h2>
              <p className="text-gray-400 text-sm mb-2">Welcome, {form.name}!</p>
              <p className="text-gray-400 text-sm mb-8">Your Brims Hospitals account is ready.</p>
              <a href="/" className="bg-teal-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-teal-700 transition inline-block">
                Go to Home
              </a>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}