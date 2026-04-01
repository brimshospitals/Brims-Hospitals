"use client";
import Header from "../components/header";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto py-10 px-4">
        
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-8 text-white mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center text-3xl">
              👤
            </div>
            <div>
              <h1 className="text-2xl font-bold">Namaste! 🙏</h1>
              <p className="text-teal-100">Brims Hospitals mein aapka swagat hai</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 className="text-lg font-bold text-gray-700 mb-4">Kya karna chahte hain?</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition">
            <div className="text-3xl mb-3">🩺</div>
            <h3 className="font-bold text-gray-800">Doctor Booking</h3>
            <p className="text-sm text-gray-500 mt-1">OPD appointment lein</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition">
            <div className="text-3xl mb-3">🧪</div>
            <h3 className="font-bold text-gray-800">Lab Test</h3>
            <p className="text-sm text-gray-500 mt-1">Test book karein</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition">
            <div className="text-3xl mb-3">🏥</div>
            <h3 className="font-bold text-gray-800">Surgery Package</h3>
            <p className="text-sm text-gray-500 mt-1">Package dekhein aur book karein</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition">
            <div className="text-3xl mb-3">📹</div>
            <h3 className="font-bold text-gray-800">Video Consultation</h3>
            <p className="text-sm text-gray-500 mt-1">Ghar se doctor se baat karein</p>
          </div>
        </div>

        {/* Family Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-700">👨‍👩‍👧‍👦 Family Card</h2>
            <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">
              Coming Soon
            </span>
          </div>
          <p className="text-sm text-gray-500">Family card activate karke apne 5 family members ko add karein</p>
          <button className="mt-4 w-full bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold py-3 rounded-lg transition border border-teal-200">
            Family Card Activate Karein
          </button>
        </div>

        {/* Wallet */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-700">💰 Wallet</h2>
              <p className="text-3xl font-bold text-teal-600 mt-1">₹0.00</p>
            </div>
            <button className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition">
              Add Money
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
