"use client";
import Header from "../components/header";
import { useState } from "react";

const doctors = [
  { id: 1, name: "Dr. Rajesh Kumar", specialization: "General Physician", fees: 300, time: "9:00 AM - 2:00 PM", available: ["Mon","Tue","Wed","Thu","Fri"] },
  { id: 2, name: "Dr. Priya Sharma", specialization: "Gynaecologist", fees: 500, time: "10:00 AM - 3:00 PM", available: ["Mon","Wed","Fri","Sat"] },
  { id: 3, name: "Dr. Amit Verma", specialization: "Orthopaedic Surgeon", fees: 600, time: "11:00 AM - 4:00 PM", available: ["Tue","Thu","Sat"] },
  { id: 4, name: "Dr. Sunita Singh", specialization: "Paediatrician", fees: 350, time: "9:00 AM - 1:00 PM", available: ["Mon","Tue","Wed","Thu","Fri","Sat"] },
  { id: 5, name: "Dr. Mohd. Faiz", specialization: "Cardiologist", fees: 800, time: "2:00 PM - 6:00 PM", available: ["Mon","Wed","Fri"] },
  { id: 6, name: "Dr. Neha Gupta", specialization: "Dermatologist", fees: 400, time: "10:00 AM - 2:00 PM", available: ["Tue","Thu","Sat"] },
];

const timeSlots = ["9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM"];
const specializations = ["All", "General Physician", "Gynaecologist", "Orthopaedic Surgeon", "Paediatrician", "Cardiologist", "Dermatologist"];

// Registered members (demo data)
const registeredMembers = [
  { mobile: "9999999999", name: "Rahul Sharma", dob: "1990-05-15", gender: "Male", city: "Patna" },
  { mobile: "8888888888", name: "Priya Singh", dob: "1995-08-22", gender: "Female", city: "Patna" },
];

export default function OPDBookingPage() {
  const [step, setStep] = useState(1); // 1=Doctor, 2=Patient, 3=Confirm, 4=Success
  const [filterSpec, setFilterSpec] = useState("All");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [mobileCheck, setMobileCheck] = useState("");
  const [memberFound, setMemberFound] = useState(null);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", mobile: "", gender: "", dob: "", city: "", symptoms: "",
  });

  const filteredDoctors = filterSpec === "All" ? doctors : doctors.filter(d => d.specialization === filterSpec);

  const handleMobileCheck = () => {
    const found = registeredMembers.find(m => m.mobile === mobileCheck);
    if (found) {
      setMemberFound(found);
      setForm({ ...form, name: found.name, mobile: found.mobile, gender: found.gender, dob: found.dob, city: found.city });
      setIsNewPatient(false);
    } else {
      setMemberFound(null);
      setIsNewPatient(true);
      setForm({ ...form, mobile: mobileCheck });
    }
  };

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(4);
    }, 1500);
  };

  const bookingId = "BH" + Math.floor(10000 + Math.random() * 90000);

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <Header />


      {/* Page Title */}
      <section className="bg-teal-50 py-10 text-center px-6">
        <h2 className="text-3xl font-bold text-teal-700 mb-2">OPD Appointment Booking</h2>
        <p className="text-gray-500">Book your appointment in 3 simple steps</p>
      </section>

      {/* Progress Steps */}
      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-8">
          {[
            { n: 1, label: "Select Doctor" },
            { n: 2, label: "Patient Details" },
            { n: 3, label: "Confirm & Pay" },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition ${
                  step > s.n ? "bg-teal-600 border-teal-600 text-white"
                  : step === s.n ? "bg-teal-600 border-teal-600 text-white"
                  : "bg-white border-gray-300 text-gray-400"
                }`}>
                  {step > s.n ? "✓" : s.n}
                </div>
                <span className={`text-xs mt-1 font-medium ${step >= s.n ? "text-teal-700" : "text-gray-400"}`}>
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div className={`flex-1 h-1 mx-2 rounded ${step > s.n ? "bg-teal-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* STEP 1 — Select Doctor */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Select Doctor & Time Slot</h3>

            {/* Specialization Filter */}
            <div className="flex flex-wrap gap-2 mb-5">
              {specializations.map(s => (
                <button key={s} onClick={() => setFilterSpec(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                    filterSpec === s ? "bg-teal-600 text-white border-teal-600" : "text-gray-500 border-gray-200 hover:border-teal-400"
                  }`}>
                  {s}
                </button>
              ))}
            </div>

            {/* Doctor List */}
            <div className="space-y-3 mb-5">
              {filteredDoctors.map(doc => (
                <div key={doc.id}
                  onClick={() => setSelectedDoctor(doc)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                    selectedDoctor?.id === doc.id ? "border-teal-500 bg-teal-50" : "border-gray-100 hover:border-teal-300"
                  }`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-teal-100 flex items-center justify-center text-lg font-bold text-teal-600">
                        {doc.name.split(" ")[1][0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{doc.name}</p>
                        <p className="text-teal-600 text-xs">{doc.specialization}</p>
                        <p className="text-gray-400 text-xs">{doc.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-teal-700">Rs. {doc.fees}</p>
                      <div className="flex gap-1 mt-1 justify-end">
                        {doc.available.map(d => (
                          <span key={d} className="text-xs bg-teal-100 text-teal-700 px-1 rounded">{d}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Date & Time */}
            {selectedDoctor && (
              <div className="space-y-4 border-t pt-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Select Date</label>
                  <input type="date" value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">Select Time Slot</label>
                  <div className="flex flex-wrap gap-2">
                    {timeSlots.map(slot => (
                      <button key={slot} onClick={() => setSelectedSlot(slot)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                          selectedSlot === slot ? "bg-teal-600 text-white border-teal-600" : "border-gray-200 text-gray-600 hover:border-teal-400"
                        }`}>
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => { if (selectedDoctor && selectedDate && selectedSlot) setStep(2); else alert("Please select doctor, date and time slot"); }}
              className="w-full mt-6 bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition">
              Next: Patient Details
            </button>
          </div>
        )}

        {/* STEP 2 — Patient Details */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Patient Details</h3>

            {/* Mobile Check */}
            {!memberFound && !isNewPatient && (
              <div className="bg-teal-50 rounded-xl p-4 mb-5 border border-teal-100">
                <p className="text-sm font-medium text-teal-700 mb-2">Already a member? Enter mobile to auto-fill details</p>
                <div className="flex gap-2">
                  <div className="flex border border-gray-200 rounded-xl overflow-hidden flex-1 focus-within:border-teal-500">
                    <span className="bg-gray-50 text-gray-500 px-3 flex items-center text-sm border-r border-gray-200">+91</span>
                    <input type="tel" maxLength={10} value={mobileCheck}
                      onChange={e => setMobileCheck(e.target.value.replace(/\D/g, ""))}
                      placeholder="Mobile number"
                      className="flex-1 px-3 py-2 outline-none text-sm" />
                  </div>
                  <button onClick={handleMobileCheck}
                    className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-teal-700 transition">
                    Check
                  </button>
                </div>
                <button onClick={() => setIsNewPatient(true)}
                  className="text-xs text-teal-600 mt-2 hover:underline">
                  New patient? Fill details manually
                </button>
              </div>
            )}

            {/* Member Found */}
            {memberFound && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
                <p className="text-green-700 font-semibold text-sm">Member found! Details auto-filled.</p>
                <p className="text-green-600 text-xs mt-1">{memberFound.name} — {memberFound.mobile}</p>
                <button onClick={() => { setMemberFound(null); setIsNewPatient(false); setMobileCheck(""); setForm({ name:"", mobile:"", gender:"", dob:"", city:"", symptoms:"" }); }}
                  className="text-xs text-red-400 mt-1 hover:underline">
                  Clear & use different number
                </button>
              </div>
            )}

            {/* Form Fields */}
            {(memberFound || isNewPatient) && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Full Name *</label>
                  <input type="text" value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="Patient full name"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Mobile *</label>
                  <div className="flex border border-gray-200 rounded-xl overflow-hidden focus-within:border-teal-500">
                    <span className="bg-gray-50 text-gray-500 px-4 flex items-center text-sm border-r border-gray-200">+91</span>
                    <input type="tel" maxLength={10} value={form.mobile}
                      onChange={e => setForm({...form, mobile: e.target.value.replace(/\D/g,"")})}
                      placeholder="10-digit number"
                      className="flex-1 px-4 py-3 outline-none text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-1 block">Gender *</label>
                    <div className="flex gap-2">
                      {["Male","Female","Other"].map(g => (
                        <button key={g} onClick={() => setForm({...form, gender: g})}
                          className={`flex-1 py-2 rounded-xl text-xs font-medium border transition ${
                            form.gender === g ? "bg-teal-600 text-white border-teal-600" : "border-gray-200 text-gray-500 hover:border-teal-400"
                          }`}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-1 block">Date of Birth</label>
                    <input type="date" value={form.dob}
                      onChange={e => setForm({...form, dob: e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-500" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">City</label>
                  <input type="text" value={form.city}
                    onChange={e => setForm({...form, city: e.target.value})}
                    placeholder="Your city"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Symptoms / Notes</label>
                  <textarea value={form.symptoms}
                    onChange={e => setForm({...form, symptoms: e.target.value})}
                    placeholder="Describe your symptoms or reason for visit..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 resize-none" />
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)}
                className="flex-1 border border-teal-600 text-teal-600 py-3 rounded-xl font-semibold hover:bg-teal-50 transition">
                Back
              </button>
              <button
                onClick={() => { if (!form.name || !form.mobile) { alert("Please fill required fields"); return; } setStep(3); }}
                className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition">
                Next: Confirm
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Confirm & Pay */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Confirm Booking</h3>

            {/* Summary */}
            <div className="bg-teal-50 rounded-xl p-4 mb-5 space-y-2 border border-teal-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Doctor</span>
                <span className="font-semibold text-gray-800">{selectedDoctor?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Specialization</span>
                <span className="text-gray-700">{selectedDoctor?.specialization}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span className="text-gray-700">{selectedDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Time Slot</span>
                <span className="text-gray-700">{selectedSlot}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Patient</span>
                <span className="text-gray-700">{form.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Mobile</span>
                <span className="text-gray-700">+91 {form.mobile}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-teal-200 pt-2 mt-2">
                <span className="font-bold text-teal-700">Consultation Fees</span>
                <span className="font-bold text-teal-700">Rs. {selectedDoctor?.fees}</span>
              </div>
            </div>

            {/* Payment Mode */}
            <div className="mb-5">
              <label className="text-sm font-medium text-gray-600 mb-2 block">Payment Mode</label>
              <div className="grid grid-cols-3 gap-3">
                {["Pay at Counter", "UPI / Online", "Insurance"].map(p => (
                  <button key={p} onClick={() => setPaymentMode(p)}
                    className={`py-3 rounded-xl text-xs font-medium border transition ${
                      paymentMode === p ? "bg-teal-600 text-white border-teal-600" : "border-gray-200 text-gray-600 hover:border-teal-400"
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)}
                className="flex-1 border border-teal-600 text-teal-600 py-3 rounded-xl font-semibold hover:bg-teal-50 transition">
                Back
              </button>
              <button onClick={handleConfirm} disabled={loading || !paymentMode}
                className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition disabled:opacity-60">
                {loading ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 — Success */}
        {step === 4 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="text-6xl mb-4">✓</div>
            <h3 className="text-2xl font-bold text-teal-700 mb-2">Booking Confirmed!</h3>
            <p className="text-gray-400 text-sm mb-5">Your OPD appointment has been booked successfully.</p>

            <div className="bg-teal-50 rounded-xl p-4 text-left space-y-2 mb-6 border border-teal-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Booking ID</span>
                <span className="font-bold text-teal-700">{bookingId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Doctor</span>
                <span className="text-gray-700">{selectedDoctor?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date & Time</span>
                <span className="text-gray-700">{selectedDate} — {selectedSlot}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Patient</span>
                <span className="text-gray-700">{form.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payment</span>
                <span className="text-gray-700">{paymentMode}</span>
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-6">A confirmation SMS will be sent to +91 {form.mobile}</p>

            <div className="flex gap-3">
              <a href="/" className="flex-1 border border-teal-600 text-teal-600 py-3 rounded-xl font-semibold hover:bg-teal-50 transition text-center text-sm">
                Back to Home
              </a>
              <button onClick={() => { setStep(1); setSelectedDoctor(null); setSelectedDate(""); setSelectedSlot(""); setPaymentMode(""); setMobileCheck(""); setMemberFound(null); setIsNewPatient(false); setForm({ name:"", mobile:"", gender:"", dob:"", city:"", symptoms:"" }); }}
                className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition text-sm">
                Book Another
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <footer className="bg-teal-700 text-white text-center py-6 mt-10">
        <p className="text-sm">© 2026 Brims Hospitals. All rights reserved.</p>
        <p className="text-teal-300 text-xs mt-1">Making Healthcare Affordable</p>
      </footer>

    </main>
  );
}