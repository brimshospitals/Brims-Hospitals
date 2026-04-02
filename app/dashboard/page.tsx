"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "../components/header";

function DashboardContent() {
  const searchParams = useSearchParams();
  const payment = searchParams.get("payment");
  const cardNumber = searchParams.get("cardNumber");

  const [user, setUser] = useState<any>(null);
  const [familyCard, setFamilyCard] = useState<any>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    if (payment === "success") {
      setMessage(`🎉 Family Card activate ho gayi! Card No: ${cardNumber}`);
    } else if (payment === "failed") {
      setMessage("❌ Payment fail ho gayi. Dobara try karein.");
    }
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const userId = localStorage.getItem("userId");
    if (!userId) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/profile?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setFamilyCard(data.familyCard);
        setFamilyMembers(data.familyMembers || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleActivateCard() {
    setPaymentLoading(true);
    setMessage("");
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) { setMessage("❌ Login karein pehle"); setPaymentLoading(false); return; }
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setMessage("❌ " + data.message);
      }
    } catch {
      setMessage("❌ Network error.");
    }
    setPaymentLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-teal-600 text-lg">Loading...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto py-8 px-4">

        {/* Payment Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${
            payment === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>{message}</div>
        )}

        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
              {user?.photo ? (
                <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">👤</span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold">Namaste, {user?.name || "User"}! 🙏</h1>
              <p className="text-teal-100 text-sm">Member ID: {user?.memberId || "—"}</p>
              <p className="text-teal-100 text-sm">📱 +91 {user?.mobile}</p>
            </div>
          </div>
        </div>

        {/* Family Card Section */}
        {familyCard ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-teal-100 text-xs font-medium uppercase tracking-wider">Brims Health Card</p>
                  <p className="text-lg font-bold mt-1">{familyCard.cardNumber}</p>
                </div>
                <div className="text-right">
                  <span className="bg-green-400 text-green-900 text-xs font-bold px-3 py-1 rounded-full">
                    ✅ Active
                  </span>
                </div>
              </div>
              <div className="flex justify-between mt-4 text-sm">
                <div>
                  <p className="text-teal-200 text-xs">Activated</p>
                  <p className="font-medium">{new Date(familyCard.activationDate).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <p className="text-teal-200 text-xs">Valid Till</p>
                  <p className="font-medium">{new Date(familyCard.expiryDate).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            </div>

            {/* Wallet */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Family Wallet</p>
                <p className="text-2xl font-bold text-teal-600">₹{familyCard.walletBalance || 0}</p>
              </div>
              <button className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                Add Money
              </button>
            </div>

            {/* Family Members */}
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-700">Family Members ({familyMembers.length}/6)</h3>
                {familyMembers.length < 6 && (
                  <a href="/add-member" className="text-teal-600 text-sm font-medium hover:underline">
                    + Add Member
                  </a>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {familyMembers.map((member, i) => (
                  <div key={i} className="flex flex-col items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 mb-2">
                      {member.photo ? (
                        <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-700 text-center truncate w-full text-center">{member.name}</p>
                    <p className="text-xs text-gray-400">{member.age} yr</p>
                    {i === 0 && <span className="text-xs bg-teal-100 text-teal-600 px-2 py-0.5 rounded-full mt-1">Primary</span>}
                  </div>
                ))}
                {/* Empty slots */}
                {Array.from({ length: 6 - familyMembers.length }).map((_, i) => (
                  <a href="/add-member" key={i}
                    className="flex flex-col items-center p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300 hover:border-teal-400 transition">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2 text-2xl text-gray-400">+</div>
                    <p className="text-xs text-gray-400">Add Member</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* No Card — Activate */
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <h2 className="text-lg font-bold text-gray-700 mb-2">👨‍👩‍👧‍👦 Family Health Card</h2>
            <p className="text-sm text-gray-500 mb-1">✅ 1 Primary + 5 Family Members</p>
            <p className="text-sm text-gray-500 mb-1">✅ Shared Wallet</p>
            <p className="text-sm text-gray-500 mb-4">✅ Digital Health Card</p>
            <button onClick={handleActivateCard} disabled={paymentLoading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
              {paymentLoading ? "Processing..." : "Family Card Activate Karein — ₹10"}
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <h2 className="text-lg font-bold text-gray-700 mb-4">Services</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition">
            <div className="text-3xl mb-2">🩺</div>
            <h3 className="font-bold text-gray-800 text-sm">Doctor Booking</h3>
            <p className="text-xs text-gray-500 mt-1">OPD appointment lein</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition">
            <div className="text-3xl mb-2">🧪</div>
            <h3 className="font-bold text-gray-800 text-sm">Lab Test</h3>
            <p className="text-xs text-gray-500 mt-1">Test book karein</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition">
            <div className="text-3xl mb-2">🏥</div>
            <h3 className="font-bold text-gray-800 text-sm">Surgery Package</h3>
            <p className="text-xs text-gray-500 mt-1">Package book karein</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition">
            <div className="text-3xl mb-2">📹</div>
            <h3 className="font-bold text-gray-800 text-sm">Video Consultation</h3>
            <p className="text-xs text-gray-500 mt-1">Ghar se doctor se milein</p>
          </div>
        </div>

      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}