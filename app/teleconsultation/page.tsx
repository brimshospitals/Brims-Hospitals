"use client";
import { useState } from "react";
import Header from "../components/header";

const teleconsultDoctors = [
  {
    id: 1,
    name: "Dr. Rajesh Kumar",
    speciality: "General Physician",
    degrees: ["MBBS", "MD"],
    experience: 15,
    languages: ["Hindi", "English"],
    audioFee: 150,
    videoFee: 200,
    rating: 4.8,
    reviews: 312,
    slots: ["9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","12:00 PM","4:00 PM","5:00 PM","6:00 PM"],
    about: "Sardi, khansi, bukhar, sugar aur BP ke specialist. 15 saal ka anubhav.",
  },
  {
    id: 2,
    name: "Dr. Priya Sharma",
    speciality: "Gynaecologist",
    degrees: ["MBBS", "MS"],
    experience: 12,
    languages: ["Hindi", "Bhojpuri", "English"],
    audioFee: 200,
    videoFee: 300,
    rating: 4.9,
    reviews: 287,
    slots: ["10:00 AM","10:30 AM","11:00 AM","3:00 PM","3:30 PM","4:00 PM","7:00 PM","7:30 PM"],
    about: "Mahila rog, pregnancy aur periods ki samasyaon ke liye vishesh.",
  },
  {
    id: 3,
    name: "Dr. Amit Verma",
    speciality: "Paediatrician",
    degrees: ["MBBS", "DCH"],
    experience: 10,
    languages: ["Hindi", "English"],
    audioFee: 150,
    videoFee: 200,
    rating: 4.7,
    reviews: 198,
    slots: ["8:00 AM","8:30 AM","9:00 AM","5:00 PM","5:30 PM","6:00 PM","8:00 PM","8:30 PM"],
    about: "Bachon ke rog aur tikakaran ke visheshagya. 0-18 saal ke bacchon ke liye.",
  },
  {
    id: 4,
    name: "Dr. Sunita Singh",
    speciality: "Dermatologist",
    degrees: ["MBBS", "DVD"],
    experience: 8,
    languages: ["Hindi", "English"],
    audioFee: 200,
    videoFee: 250,
    rating: 4.6,
    reviews: 156,
    slots: ["11:00 AM","11:30 AM","12:00 PM","6:00 PM","6:30 PM","7:00 PM"],
    about: "Chamdi ke rog, allergy, acne aur baalon ki samasya ke liye.",
  },
  {
    id: 5,
    name: "Dr. Mohd. Faiz",
    speciality: "Cardiologist",
    degrees: ["MBBS", "MD", "DM"],
    experience: 18,
    languages: ["Hindi", "Urdu", "English"],
    audioFee: 300,
    videoFee: 400,
    rating: 4.9,
    reviews: 421,
    slots: ["9:00 AM","9:30 AM","2:00 PM","2:30 PM","7:00 PM","7:30 PM","8:00 PM"],
    about: "Hriday rog, BP, cholesterol aur chest pain ke visheshagya.",
  },
  {
    id: 6,
    name: "Dr. Neha Gupta",
    speciality: "Psychiatrist",
    degrees: ["MBBS", "MD (Psychiatry)"],
    experience: 9,
    languages: ["Hindi", "English"],
    audioFee: 250,
    videoFee: 300,
    rating: 4.8,
    reviews: 203,
    slots: ["10:00 AM","10:30 AM","4:00 PM","4:30 PM","5:00 PM","8:00 PM","8:30 PM","9:00 PM"],
    about: "Mansik stress, neend ki samasyain, anxiety aur depression ke liye.",
  },
];

const specialities = ["Sabhi", "General Physician", "Gynaecologist", "Paediatrician", "Dermatologist", "Cardiologist", "Psychiatrist"];

export default function TeleconsultationPage() {
  const [filterSpec, setFilterSpec] = useState("Sabhi");
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [consultType, setConsultType] = useState<"video" | "audio">("video");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [paymentType, setPaymentType] = useState("online");
  const [step, setStep] = useState(1); // 1=list, 2=details form, 3=confirm, 4=success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successBookingId, setSuccessBookingId] = useState("");
  const [successMongoId, setSuccessMongoId] = useState("");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const filteredDoctors =
    filterSpec === "Sabhi"
      ? teleconsultDoctors
      : teleconsultDoctors.filter((d) => d.speciality === filterSpec);

  function getFee(doc: any) {
    return consultType === "video" ? doc.videoFee : doc.audioFee;
  }

  function handleSelectDoctor(doc: any) {
    setSelectedDoctor(doc);
    setConsultType("video");
    setAppointmentDate("");
    setSelectedSlot("");
    setSymptoms("");
    setError("");
    setStep(2);
  }

  function validateStep2() {
    if (!appointmentDate) { setError("Date choose karein"); return false; }
    if (!selectedSlot)    { setError("Time slot choose karein"); return false; }
    setError("");
    return true;
  }

  async function handleConfirm() {
    setLoading(true);
    setError("");
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) { setError("Login karein pehle"); setLoading(false); return; }

      const res = await fetch("/api/book-teleconsult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          doctorName: selectedDoctor.name,
          doctorSpeciality: selectedDoctor.speciality,
          consultType,
          appointmentDate,
          slot: selectedSlot,
          symptoms,
          amount: getFee(selectedDoctor),
          paymentType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessBookingId(data.bookingId);
        setSuccessMongoId(data.mongoId);
        setStep(4);
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

      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-600 to-teal-800 text-white py-10 px-6 text-center">
        <p className="text-teal-200 text-sm font-medium mb-2">💻 Online Consultation</p>
        <h1 className="text-3xl font-bold mb-2">Ghar Baithe Doctor se Milein</h1>
        <p className="text-teal-100 text-sm max-w-md mx-auto">
          Video ya audio call se experienced doctors se baat karein. E-prescription bhi milegi.
        </p>
        <div className="flex justify-center gap-6 mt-5 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-green-400">✓</span> 8 AM – 10 PM Available
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-green-400">✓</span> E-Prescription
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-green-400">✓</span> ₹150 se shuru
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto py-8 px-4">

        {/* ── STEP 1: Doctor List ── */}
        {step === 1 && (
          <>
            {/* Consult type toggle */}
            <div className="flex gap-3 mb-5">
              <button
                onClick={() => setConsultType("video")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition ${
                  consultType === "video"
                    ? "border-teal-600 bg-teal-600 text-white"
                    : "border-gray-200 text-gray-600 hover:border-teal-300"
                }`}
              >
                📹 Video Call
              </button>
              <button
                onClick={() => setConsultType("audio")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition ${
                  consultType === "audio"
                    ? "border-teal-600 bg-teal-600 text-white"
                    : "border-gray-200 text-gray-600 hover:border-teal-300"
                }`}
              >
                🎙️ Audio Call
              </button>
            </div>

            {/* Speciality filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
              {specialities.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterSpec(s)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition flex-shrink-0 ${
                    filterSpec === s
                      ? "bg-teal-600 text-white border-teal-600"
                      : "border-gray-200 text-gray-600 hover:border-teal-400"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Doctor Cards */}
            <div className="space-y-4">
              {filteredDoctors.map((doc) => (
                <div key={doc.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center flex-shrink-0 text-2xl font-bold text-teal-600">
                      {doc.name.split(" ")[1][0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-800">{doc.name}</h3>
                          <p className="text-teal-600 text-sm">{doc.speciality}</p>
                          <p className="text-gray-400 text-xs">{doc.degrees.join(", ")} · {doc.experience} yrs exp</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-gray-400">
                            {consultType === "video" ? "📹 Video" : "🎙️ Audio"}
                          </p>
                          <p className="text-xl font-bold text-teal-600">₹{getFee(doc)}</p>
                        </div>
                      </div>

                      <p className="text-gray-500 text-xs mt-2 line-clamp-2">{doc.about}</p>

                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <span className="text-xs text-yellow-600 font-medium">⭐ {doc.rating} ({doc.reviews})</span>
                        <span className="text-xs text-gray-400">🗣️ {doc.languages.join(", ")}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectDoctor(doc)}
                    className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition text-sm"
                  >
                    {consultType === "video" ? "📹" : "🎙️"} Abhi Book Karein — ₹{getFee(doc)}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── STEP 2: Date, Time, Symptoms ── */}
        {step === 2 && selectedDoctor && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {/* Back */}
            <button onClick={() => setStep(1)} className="text-teal-600 text-sm mb-4 flex items-center gap-1 hover:underline">
              ← Wapas jaao
            </button>

            {/* Selected Doctor summary */}
            <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-xl mb-5">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center text-xl font-bold text-teal-600 flex-shrink-0">
                {selectedDoctor.name.split(" ")[1][0]}
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{selectedDoctor.name}</p>
                <p className="text-teal-600 text-xs">{selectedDoctor.speciality}</p>
              </div>
              <div className="ml-auto text-right">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  consultType === "video"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}>
                  {consultType === "video" ? "📹 Video" : "🎙️ Audio"}
                </span>
                <p className="text-teal-700 font-bold mt-1">₹{getFee(selectedDoctor)}</p>
              </div>
            </div>

            {/* Consult type change */}
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setConsultType("video")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition ${
                  consultType === "video" ? "border-teal-600 bg-teal-600 text-white" : "border-gray-200 text-gray-600"
                }`}
              >
                📹 Video — ₹{selectedDoctor.videoFee}
              </button>
              <button
                onClick={() => setConsultType("audio")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition ${
                  consultType === "audio" ? "border-teal-600 bg-teal-600 text-white" : "border-gray-200 text-gray-600"
                }`}
              >
                🎙️ Audio — ₹{selectedDoctor.audioFee}
              </button>
            </div>

            {/* Date */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Choose Karein</label>
              <input
                type="date"
                value={appointmentDate}
                min={minDate}
                onChange={(e) => { setAppointmentDate(e.target.value); setSelectedSlot(""); }}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Time Slots */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot Choose Karein</label>
              <div className="grid grid-cols-3 gap-2">
                {selectedDoctor.slots.map((slot: string) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2.5 rounded-xl text-xs font-medium border transition ${
                      selectedSlot === slot
                        ? "bg-teal-600 text-white border-teal-600"
                        : "border-gray-200 text-gray-700 hover:border-teal-400"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Symptoms */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Aapki Takleef / Symptoms</label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Doctor ko batao — kya takleef hai? Kitne dino se hai? Koi purani bimari? (optional)"
                rows={3}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}

            <button
              onClick={() => { if (validateStep2()) setStep(3); }}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl transition text-base"
            >
              Aage Badhein →
            </button>
          </div>
        )}

        {/* ── STEP 3: Confirm & Pay ── */}
        {step === 3 && selectedDoctor && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <button onClick={() => setStep(2)} className="text-teal-600 text-sm mb-4 flex items-center gap-1 hover:underline">
              ← Wapas jaao
            </button>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Booking Confirm Karein</h2>

            {/* Summary */}
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 space-y-2.5 mb-5">
              {[
                ["Doctor",       selectedDoctor.name],
                ["Speciality",   selectedDoctor.speciality],
                ["Call Type",    consultType === "video" ? "📹 Video Call" : "🎙️ Audio Call"],
                ["Date",         appointmentDate ? new Date(appointmentDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" }) : "—"],
                ["Time",         selectedSlot],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-800">{val}</span>
                </div>
              ))}
              {symptoms && (
                <div className="pt-2 border-t border-teal-100">
                  <p className="text-xs text-gray-500">Symptoms: {symptoms}</p>
                </div>
              )}
              <div className="flex justify-between text-sm border-t border-teal-200 pt-2">
                <span className="font-bold text-teal-700">Fees</span>
                <span className="font-bold text-teal-700 text-lg">₹{getFee(selectedDoctor)}</span>
              </div>
            </div>

            {/* Payment */}
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 mb-3">Payment Method</p>
              <div className="space-y-2">
                <label className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${
                  paymentType === "online" ? "border-teal-600 bg-teal-50" : "border-gray-200"
                }`}>
                  <input type="radio" name="pay" value="online"
                    checked={paymentType === "online"}
                    onChange={() => setPaymentType("online")}
                    className="accent-teal-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">💳 Online Pay Karein</p>
                    <p className="text-xs text-gray-500">PhonePe / UPI / Debit / Credit Card</p>
                  </div>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Recommended</span>
                </label>
                <label className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${
                  paymentType === "counter" ? "border-teal-600 bg-teal-50" : "border-gray-200"
                }`}>
                  <input type="radio" name="pay" value="counter"
                    checked={paymentType === "counter"}
                    onChange={() => setPaymentType("counter")}
                    className="accent-teal-600" />
                  <div>
                    <p className="text-sm font-semibold">🏦 Call ke time pay karein</p>
                    <p className="text-xs text-gray-500">Cash ya UPI — consultation ke samay</p>
                  </div>
                </label>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}

            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl transition disabled:opacity-50 text-base"
            >
              {loading ? "Booking ho rahi hai..." : "✅ Confirm Karein"}
            </button>
          </div>
        )}

        {/* ── STEP 4: Success ── */}
        {step === 4 && selectedDoctor && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
              ✅
            </div>
            <h2 className="text-2xl font-bold text-teal-700 mb-2">Booking Confirm Ho Gayi!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Aapka {consultType === "video" ? "Video" : "Audio"} consultation book ho gaya hai.
            </p>

            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 text-left space-y-2.5 mb-6">
              {[
                ["Booking ID",  successBookingId],
                ["Doctor",      selectedDoctor.name],
                ["Speciality",  selectedDoctor.speciality],
                ["Call Type",   consultType === "video" ? "📹 Video Call" : "🎙️ Audio Call"],
                ["Date",        appointmentDate ? new Date(appointmentDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" }) : "—"],
                ["Time",        selectedSlot],
                ["Fees",        `₹${getFee(selectedDoctor)}`],
                ["Payment",     paymentType === "online" ? "Online" : "Consultation ke samay"],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-800">{val}</span>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm font-semibold text-blue-800 mb-1">📌 Consultation ke time kya karein:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Appointment ke 5 minute pehle "Join Call" button dabao</li>
                <li>• Camera aur microphone ka permission dena hoga</li>
                <li>• Shuddh jagah mein baithe, internet connection check karein</li>
                {consultType === "audio" && <li>• Audio call mein camera band rahega — sirf awaz</li>}
              </ul>
            </div>

            {/* Join Call Button */}
            <a
              href={`/consultation/${successMongoId}?type=${consultType}&doctor=${encodeURIComponent(selectedDoctor.name)}&date=${appointmentDate}&slot=${encodeURIComponent(selectedSlot)}`}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl transition text-base mb-3"
            >
              {consultType === "video" ? "📹" : "🎙️"} Join Call
            </a>
            <p className="text-xs text-gray-400 mb-5">
              Appointment ke time pe join karein — link 24 ghante tak valid hai
            </p>

            <div className="flex gap-3">
              <a href="/my-bookings"
                className="flex-1 border border-teal-600 text-teal-600 py-3 rounded-xl font-semibold text-sm text-center hover:bg-teal-50 transition">
                Meri Bookings
              </a>
              <button
                onClick={() => { setStep(1); setSelectedDoctor(null); setAppointmentDate(""); setSelectedSlot(""); setSymptoms(""); setSuccessBookingId(""); setSuccessMongoId(""); }}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 transition"
              >
                Naya Book Karein
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="bg-teal-700 text-white text-center py-6 mt-8">
        <p className="text-sm">© 2026 Brims Hospitals. All rights reserved.</p>
        <p className="text-teal-300 text-xs mt-1">Making Healthcare Affordable</p>
      </footer>
    </main>
  );
}
