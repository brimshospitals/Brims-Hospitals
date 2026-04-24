"use client";
import { useState, useEffect } from "react";
import Header from "../components/header";
import { BIHAR_DISTRICTS } from "../../lib/biharDistricts";

const departments = [
  "General Medicine", "Cardiology", "Orthopedics", "Gynecology",
  "Pediatrics", "Dermatology", "Neurology", "ENT", "Ophthalmology",
  "Dentistry", "Psychiatry", "Urology", "Nephrology", "Oncology",
];

const biharDistricts = BIHAR_DISTRICTS;

export default function DoctorsSearchPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("");
  const [department, setDepartment] = useState("");
  const [maxFee, setMaxFee] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [bookingStep, setBookingStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [paymentType, setPaymentType] = useState("wallet");
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchDoctors();
    fetchUserData();
  }, []);

  async function fetchDoctors() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (district) params.append("district", district);
      if (department) params.append("department", department);
      if (maxFee) params.append("maxFee", maxFee);

      const res = await fetch(`/api/doctors?${params}`);
      const data = await res.json();
      if (data.success) setDoctors(data.doctors);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function fetchUserData() {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    try {
      const res = await fetch(`/api/profile?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setFamilyMembers(data.familyMembers || []);
        setWalletBalance(data.familyCard?.walletBalance || 0);
        if (data.familyMembers?.length > 0) {
          setSelectedMember(data.familyMembers[0]._id);
        }
      }
    } catch (e) { console.error(e); }
  }

  async function handleBooking() {
    if (!selectedDate || !selectedSlot) {
      setMessage("❌ Date aur slot select karein");
      return;
    }
    setBooking(true);
    try {
      const userId = localStorage.getItem("userId");
      const res = await fetch("/api/book-opd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          memberId: selectedMember,
          doctorId: selectedDoctor._id,
          appointmentDate: selectedDate,
          slot: selectedSlot,
          paymentType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`✅ ${data.message} Booking ID: ${data.bookingId}`);
        setBookingStep(0);
        setSelectedDoctor(null);
      } else {
        setMessage("❌ " + data.message);
      }
    } catch {
      setMessage("❌ Network error");
    }
    setBooking(false);
  }

  // Get next 7 days
  function getNextDays() {
    const days = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        date: date.toISOString().split("T")[0],
        label: date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
        day: date.toLocaleDateString("en-IN", { weekday: "long" }),
      });
    }
    return days;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto py-8 px-4">

        <h1 className="text-2xl font-bold text-gray-800 mb-6">🩺 Doctor Search & OPD Booking</h1>

        {message && (
          <div className={`mb-4 p-4 rounded-xl text-sm font-medium ${
            message.startsWith("✅") ? "bg-green-50 border border-green-200 text-green-700"
            : "bg-red-50 border border-red-200 text-red-700"
          }`}>{message}</div>
        )}

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-1 gap-3 mb-3">
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Doctor ka naam, department ya speciality search karein..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <select value={district} onChange={(e) => setDistrict(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">Sabhi Zile</option>
              {biharDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={department} onChange={(e) => setDepartment(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">Sabhi Departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={maxFee} onChange={(e) => setMaxFee(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">Koi bhi fees</option>
              <option value="100">₹100 tak</option>
              <option value="200">₹200 tak</option>
              <option value="500">₹500 tak</option>
              <option value="1000">₹1000 tak</option>
            </select>
          </div>
          <button onClick={fetchDoctors}
            className="mt-3 w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition">
            Search Karein
          </button>
        </div>

        {/* Doctors List */}
        {loading ? (
          <div className="text-center py-10 text-teal-600">Doctors dhundh rahe hain...</div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-3">🩺</p>
            <p>Koi doctor nahi mila. Filter change karke try karein.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {doctors.map((doctor) => (
              <div key={doctor._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5">
                  <div className="flex gap-4">
                    {/* Photo */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {doctor.photo
                        ? <img src={doctor.photo} alt={doctor.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-2xl">👨‍⚕️</div>
                      }
                    </div>
                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{doctor.name}</h3>
                      <p className="text-sm text-teal-600">{doctor.department} {doctor.speciality ? `• ${doctor.speciality}` : ""}</p>
                      <p className="text-xs text-gray-500">{doctor.degrees?.join(", ")} • {doctor.experience} saal experience</p>
                      {doctor.hospitalName && <p className="text-xs text-gray-400 mt-0.5">🏥 {doctor.hospitalName}</p>}
                      {doctor.address?.district && <p className="text-xs text-gray-400">📍 {doctor.address.district}</p>}
                    </div>
                    {/* Fee */}
                    <div className="text-right">
                      {doctor.offerFee && doctor.offerFee < doctor.opdFee ? (
                        <>
                          <p className="text-xs text-gray-400 line-through">₹{doctor.opdFee}</p>
                          <p className="text-lg font-bold text-teal-600">₹{doctor.offerFee}</p>
                        </>
                      ) : (
                        <p className="text-lg font-bold text-teal-600">₹{doctor.opdFee}</p>
                      )}
                      {doctor.rating > 0 && (
                        <p className="text-xs text-yellow-500">⭐ {doctor.rating}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <a href={`/doctors/${doctor._id}`}
                      className="flex-1 border border-teal-600 text-teal-700 font-semibold py-2.5 rounded-lg transition text-sm text-center hover:bg-teal-50">
                      👁 Profile
                    </a>
                    <button onClick={() => { setSelectedDoctor(doctor); setBookingStep(1); setMessage(""); }}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg transition text-sm">
                      🩺 Book
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Booking Modal */}
        {selectedDoctor && bookingStep > 0 && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-bold text-gray-800">Appointment Book Karein</h2>
                <button onClick={() => { setSelectedDoctor(null); setBookingStep(0); }}
                  className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>

              <div className="p-5">
                {/* Doctor Summary */}
                <div className="flex gap-3 mb-5 p-3 bg-teal-50 rounded-xl">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                    {selectedDoctor.photo
                      ? <img src={selectedDoctor.photo} alt={selectedDoctor.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center">👨‍⚕️</div>
                    }
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{selectedDoctor.name}</p>
                    <p className="text-sm text-teal-600">{selectedDoctor.department}</p>
                    <p className="text-sm font-bold text-teal-700">₹{selectedDoctor.offerFee || selectedDoctor.opdFee}</p>
                  </div>
                </div>

                {/* Family Member Select */}
                {familyMembers.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kiske liye booking hai?</label>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {familyMembers.map((m) => (
                        <button key={m._id} onClick={() => setSelectedMember(m._id)}
                          className={`flex flex-col items-center p-2 rounded-xl border min-w-[70px] transition ${
                            selectedMember === m._id ? "border-teal-500 bg-teal-50" : "border-gray-200"
                          }`}>
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 mb-1">
                            {m.photo ? <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center">👤</div>}
                          </div>
                          <p className="text-xs text-center">{m.name.split(" ")[0]}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Date Select */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Select Karein</label>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {getNextDays().map((d) => (
                      <button key={d.date} onClick={() => { setSelectedDate(d.date); setSelectedSlot(""); }}
                        className={`flex flex-col items-center p-2 rounded-xl border min-w-[70px] transition ${
                          selectedDate === d.date ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-teal-300"
                        }`}>
                        <p className="text-xs text-gray-500">{d.label.split(" ")[0]}</p>
                        <p className="text-sm font-bold">{d.label.split(" ")[1]}</p>
                        <p className="text-xs text-gray-400">{d.label.split(" ")[2]}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slot Select */}
                {selectedDate && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot Select Karein</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
                        "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"].map((slot) => (
                        <button key={slot} onClick={() => setSelectedSlot(slot)}
                          className={`py-2 px-3 rounded-lg text-sm border transition ${
                            selectedSlot === slot
                              ? "border-teal-500 bg-teal-50 text-teal-700 font-medium"
                              : "border-gray-200 hover:border-teal-300"
                          }`}>
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Type */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setPaymentType("wallet")}
                      className={`p-3 rounded-xl border text-sm font-medium transition ${
                        paymentType === "wallet" ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-200"
                      }`}>
                      💰 Wallet (₹{walletBalance})
                    </button>
                    <button onClick={() => setPaymentType("online")}
                      className={`p-3 rounded-xl border text-sm font-medium transition ${
                        paymentType === "online" ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-200"
                      }`}>
                      📱 PhonePe
                    </button>
                  </div>
                </div>

                {message && (
                  <div className={`mb-4 p-3 rounded-lg text-sm ${
                    message.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}>{message}</div>
                )}

                <button onClick={handleBooking} disabled={booking || !selectedDate || !selectedSlot}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
                  {booking ? "Booking ho rahi hai..." : `Confirm Booking — ₹${selectedDoctor.offerFee || selectedDoctor.opdFee}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}