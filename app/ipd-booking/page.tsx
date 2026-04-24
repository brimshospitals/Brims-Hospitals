"use client";
import { useState, useEffect } from "react";
import Header from "../components/header";
import PatientSelector, { SelectedPatient } from "../components/PatientSelector";
import { BIHAR_DISTRICTS } from "../../lib/biharDistricts";

const ROOM_TYPES = [
  { type: "General",   icon: "🛏️",  desc: "Shared ward — 4-6 beds",   multiplier: 1.0  },
  { type: "Semi-Private", icon: "🚪", desc: "2 bed room",              multiplier: 1.3  },
  { type: "Private",   icon: "🏠",  desc: "Single AC room",            multiplier: 1.6  },
  { type: "Suite",     icon: "⭐",  desc: "Luxury room with attendant", multiplier: 2.0  },
];

const DEPARTMENTS = [
  "General Medicine", "Cardiology", "Orthopedics", "Neurology", "Gynecology",
  "Urology", "Gastroenterology", "Pulmonology", "Nephrology", "Oncology",
  "Pediatrics", "Psychiatry", "Dermatology", "ENT", "Ophthalmology",
];

// BIHAR_DISTRICTS imported from lib/biharDistricts

const STAY_DURATIONS = [
  "1 din", "2-3 din", "4-5 din", "6-7 din", "1-2 hafta", "2-4 hafta", "1 mahine se zyada",
];

function fmtDate(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

// Steps: 1=Hospital search, 2=Room & dates, 3=Patient, 4=Payment, 5=Confirm
export default function IPDBookingPage() {
  const [step, setStep] = useState(1);

  // Step 1 — hospital search
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [search,    setSearch]    = useState("");
  const [district,  setDistrict]  = useState("");
  const [dept,      setDept]      = useState("");
  const [loadingH,  setLoadingH]  = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);

  // Step 2 — room & dates
  const [roomType,      setRoomType]      = useState("General");
  const [admissionDate, setAdmissionDate] = useState("");
  const [stayDuration,  setStayDuration]  = useState("2-3 din");
  const [diagnosis,     setDiagnosis]     = useState("");
  const [estDays,       setEstDays]       = useState(3);

  // Step 3 — patient
  const [profile,       setProfile]       = useState<any>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<SelectedPatient | null>(null);
  const [hasMembership, setHasMembership] = useState(false);

  // Step 4 — payment
  const [paymentMode, setPaymentMode] = useState("counter");
  const [deposit,     setDeposit]     = useState(5000);

  // Booking
  const [booking,  setBooking]  = useState(false);
  const [toast,    setToast]    = useState("");
  const [toastOk,  setToastOk]  = useState(true);
  const [doneData, setDoneData] = useState<any>(null);

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  useEffect(() => {
    fetchUserData();
    fetchHospitals();
  }, []);

  async function fetchUserData() {
    try {
      const res  = await fetch("/api/profile");
      const data = await res.json();
      if (data.success) {
        setProfile(data.user);
        setFamilyMembers(data.familyMembers || []);
        setHasMembership(!!data.familyCard);
      }
    } catch {}
  }

  async function fetchHospitals() {
    setLoadingH(true);
    try {
      const p = new URLSearchParams({ full: "true" });
      if (search)   p.set("search",   search);
      if (district) p.set("district", district);
      const res  = await fetch(`/api/hospitals-public?${p}`);
      const data = await res.json();
      if (data.success) setHospitals(data.hospitals || []);
    } catch {}
    setLoadingH(false);
  }

  function showToast(msg: string, ok = true) {
    setToast(msg); setToastOk(ok);
    setTimeout(() => setToast(""), 4000);
  }

  function getRoomMultiplier() {
    return ROOM_TYPES.find((r) => r.type === roomType)?.multiplier ?? 1;
  }

  // Base daily estimate: ₹3000 for General × room multiplier
  const BASE_PER_DAY = 3000;
  const dailyRate    = Math.round(BASE_PER_DAY * getRoomMultiplier());
  const totalEstimate= dailyRate * estDays;

  async function handleSubmit() {
    if (!selectedHospital) { showToast("Hospital select karein", false); return; }
    if (!admissionDate)    { showToast("Admission date zaruri hai", false); return; }
    if (!selectedPatient)  { showToast("Patient select karein", false); return; }

    setBooking(true);
    try {
      const notes = JSON.stringify({
        patientName:   selectedPatient.name,
        patientMobile: selectedPatient.mobile,
        patientAge:    selectedPatient.age,
        patientGender: selectedPatient.gender,
        symptoms:      selectedPatient.symptoms || diagnosis,
        paymentMode,
        isNewPatient:  selectedPatient.isNewPatient,
        roomType,
        stayDuration,
        diagnosis,
        estimatedDays: estDays,
        deposit,
      });

      const res  = await fetch("/api/bookings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type:            "IPD",
          hospitalId:      selectedHospital._id,
          appointmentDate: admissionDate,
          slot:            "",
          patientUserId:   selectedPatient.userId,
          patientName:     selectedPatient.name,
          patientMobile:   selectedPatient.mobile,
          patientAge:      selectedPatient.age,
          patientGender:   selectedPatient.gender,
          symptoms:        selectedPatient.symptoms || diagnosis,
          isNewPatient:    selectedPatient.isNewPatient,
          paymentMode,
          amount:          deposit,
          notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDoneData(data.booking);
      } else {
        showToast(data.message || "Booking nahi hui", false);
      }
    } catch {
      showToast("Network error. Dobara try karein.", false);
    }
    setBooking(false);
  }

  // ── Step labels ──
  const STEPS = ["Hospital", "Room & Date", "Patient", "Payment"];

  // ── Done screen ──
  if (doneData) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-5">🛏️</div>
            <h2 className="text-2xl font-black text-gray-800 mb-1">Admission Request Bheja!</h2>
            <p className="text-gray-500 text-sm mb-6">Hamari team 2-4 ghante mein confirm karegi</p>
            <div className="bg-teal-50 border border-teal-100 rounded-2xl px-5 py-4 text-left space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Booking ID</span>
                <span className="font-mono font-bold text-teal-700">{doneData.bookingId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Hospital</span>
                <span className="font-semibold text-gray-800">{selectedHospital?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Room Type</span>
                <span className="font-semibold text-gray-800">{roomType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Admission Date</span>
                <span className="font-semibold text-gray-800">{fmtDate(admissionDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Patient</span>
                <span className="font-semibold text-gray-800">{selectedPatient?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Deposit Paid</span>
                <span className="font-bold text-green-700">₹{deposit.toLocaleString("en-IN")}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <a href="/my-bookings"
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold text-center hover:bg-gray-50 transition">
                My Bookings
              </a>
              <a href="/dashboard"
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl text-sm font-semibold text-center transition">
                Dashboard
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-sm text-white ${toastOk ? "bg-teal-700" : "bg-red-600"}`}>
          {toast}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-800">🛏️ IPD Admission</h1>
          <p className="text-sm text-gray-500 mt-1">Inpatient admission — hospital mein rehkar treatment</p>
        </div>

        {/* Step progress */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`flex items-center gap-2 ${i + 1 < step ? "text-teal-600" : i + 1 === step ? "text-teal-700" : "text-gray-300"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  i + 1 < step  ? "bg-teal-600 border-teal-600 text-white" :
                  i + 1 === step ? "bg-white border-teal-600 text-teal-700" :
                  "bg-gray-100 border-gray-200 text-gray-400"
                }`}>
                  {i + 1 < step ? "✓" : i + 1}
                </div>
                <span className="hidden sm:block text-xs font-semibold">{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded ${i + 1 < step ? "bg-teal-500" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Hospital Search ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h2 className="font-bold text-gray-800">Hospital Chunein</h2>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchHospitals()}
                placeholder="🔍 Hospital naam ya department search karein..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              <div className="grid grid-cols-2 gap-3">
                <select value={district} onChange={(e) => setDistrict(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                  <option value="">Sabhi Districts</option>
                  {BIHAR_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={dept} onChange={(e) => setDept(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                  <option value="">Sabhi Departments</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <button onClick={fetchHospitals}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl transition text-sm">
                Search Karein
              </button>
            </div>

            {/* Results */}
            {loadingH ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : hospitals.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p className="text-3xl mb-2">🏥</p>
                <p className="text-sm">Koi hospital nahi mila</p>
              </div>
            ) : (
              <div className="space-y-3">
                {hospitals.map((h) => (
                  <div key={h._id}
                    onClick={() => { setSelectedHospital(h); setStep(2); }}
                    className={`bg-white rounded-2xl border shadow-sm p-4 cursor-pointer transition-all hover:shadow-md hover:border-teal-300 ${selectedHospital?._id === h._id ? "border-teal-500 ring-2 ring-teal-200" : "border-gray-100"}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Photo */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-teal-50 flex-shrink-0">
                        {h.photos?.[0] ? (
                          <img src={h.photos[0]} alt={h.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🏥</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 text-sm">{h.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          📍 {h.address?.district}, {h.address?.state}
                        </p>
                        {h.type && (
                          <span className="inline-flex mt-1 text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100 font-medium">
                            {h.type}
                          </span>
                        )}
                        {h.departments?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {h.departments.slice(0, 3).map((d: string) => (
                              <span key={d} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{d}</span>
                            ))}
                            {h.departments.length > 3 && (
                              <span className="text-[10px] text-gray-400">+{h.departments.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {h.rating > 0 && <p className="text-xs text-amber-500">⭐ {h.rating}</p>}
                        <p className="text-teal-600 text-xs font-semibold mt-1">Select →</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Room Type & Dates ── */}
        {step === 2 && selectedHospital && (
          <div className="space-y-4">
            {/* Selected hospital pill */}
            <div className="flex items-center gap-3 bg-teal-50 border border-teal-100 rounded-2xl px-4 py-3">
              <span className="text-xl">🏥</span>
              <div className="flex-1">
                <p className="font-bold text-teal-800 text-sm">{selectedHospital.name}</p>
                <p className="text-xs text-teal-600">{selectedHospital.address?.district}</p>
              </div>
              <button onClick={() => setStep(1)} className="text-xs text-teal-500 hover:text-teal-700 font-semibold">Change</button>
            </div>

            {/* Room type */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-3">Room Type Chunein</h3>
              <div className="grid grid-cols-2 gap-3">
                {ROOM_TYPES.map((r) => (
                  <button key={r.type} onClick={() => setRoomType(r.type)}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${roomType === r.type ? "border-teal-500 bg-teal-50" : "border-gray-100 hover:border-gray-300"}`}>
                    <p className="text-xl mb-1">{r.icon}</p>
                    <p className="font-bold text-gray-800 text-sm">{r.type}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
                    <p className="text-xs text-teal-600 font-semibold mt-1">
                      ~₹{Math.round(BASE_PER_DAY * r.multiplier).toLocaleString("en-IN")}/din
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h3 className="font-bold text-gray-800">Admission Details</h3>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Admission Date *</label>
                <input type="date" value={admissionDate} min={tomorrow}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                  className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Expected Stay Duration</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {STAY_DURATIONS.map((s) => (
                    <button key={s} onClick={() => {
                      setStayDuration(s);
                      // Update estDays based on selection
                      const map: Record<string,number> = {
                        "1 din": 1, "2-3 din": 3, "4-5 din": 5,
                        "6-7 din": 7, "1-2 hafta": 10, "2-4 hafta": 21, "1 mahine se zyada": 30,
                      };
                      setEstDays(map[s] || 3);
                    }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${stayDuration === s ? "bg-teal-600 text-white border-teal-600" : "border-gray-200 text-gray-600 hover:border-teal-300"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Diagnosis / Reason for Admission</label>
                <input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Appendicitis, Knee Replacement, Normal Delivery..."
                  className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
            </div>

            {/* Cost estimate */}
            <div className="bg-gradient-to-br from-teal-600 to-teal-500 rounded-2xl p-5 text-white">
              <p className="text-teal-200 text-xs font-semibold uppercase tracking-wide mb-2">Estimated Cost</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-black">₹{totalEstimate.toLocaleString("en-IN")}</p>
                  <p className="text-teal-200 text-xs mt-0.5">
                    ₹{dailyRate.toLocaleString("en-IN")}/din × {estDays} din ({roomType} room)
                  </p>
                </div>
                <p className="text-teal-200 text-xs text-right">*Approximate<br/>Final amount<br/>on discharge</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold">← Back</button>
              <button onClick={() => { if (!admissionDate) { showToast("Admission date chunein", false); return; } setStep(3); }}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl text-sm font-semibold transition">
                Aage Chalein →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Patient Selection ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-4">Patient ki Jaankari</h3>
              {profile ? (
                <PatientSelector
                  primaryUser={profile}
                  familyMembers={familyMembers}
                  onSelect={setSelectedPatient}
                />
              ) : (
                <div className="text-center py-6 text-gray-400 text-sm">
                  <p className="mb-2">Login zaruri hai</p>
                  <a href="/login" className="text-teal-600 underline">Login Karein</a>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold">← Back</button>
              <button onClick={() => { if (!selectedPatient) { showToast("Patient select karein", false); return; } setStep(4); }}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                disabled={!selectedPatient}>
                Aage Chalein →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Payment & Confirm ── */}
        {step === 4 && (
          <div className="space-y-4">

            {/* Booking summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h3 className="font-bold text-gray-800 mb-1">Booking Summary</h3>
              {[
                { label: "Hospital",       value: selectedHospital?.name },
                { label: "Room Type",      value: roomType },
                { label: "Admission Date", value: fmtDate(admissionDate) },
                { label: "Stay Duration",  value: stayDuration },
                { label: "Patient",        value: selectedPatient?.name },
                { label: "Diagnosis",      value: diagnosis || "—" },
                { label: "Est. Total",     value: `₹${totalEstimate.toLocaleString("en-IN")}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-semibold text-gray-800 text-right max-w-[55%]">{value}</span>
                </div>
              ))}
            </div>

            {/* Deposit amount */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h3 className="font-bold text-gray-800">Advance Deposit</h3>
              <p className="text-xs text-gray-500">Admission ke waqt advance deposit liya jata hai. Baki amount discharge pe settle hoti hai.</p>

              <div className="flex flex-wrap gap-2">
                {[2000, 5000, 10000, 20000].map((amt) => (
                  <button key={amt} onClick={() => setDeposit(amt)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${deposit === amt ? "bg-teal-600 text-white border-teal-600" : "border-gray-200 text-gray-700 hover:border-teal-300"}`}>
                    ₹{amt.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ya Custom Amount</label>
                <div className="mt-1.5 flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-teal-400">
                  <span className="px-3 text-gray-500 font-bold">₹</span>
                  <input type="number" value={deposit}
                    onChange={(e) => setDeposit(Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 py-2.5 pr-3 text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Payment mode */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-3">Payment Mode (Deposit ke liye)</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "counter",   label: "Counter / Cash",  icon: "💵" },
                  { id: "online",    label: "Online / UPI",    icon: "📱" },
                  { id: "wallet",    label: "Brims Wallet",    icon: "👛", disabled: !hasMembership },
                  { id: "insurance", label: "Insurance",       icon: "🏦" },
                ].map((pm) => (
                  <button key={pm.id} disabled={pm.disabled}
                    onClick={() => setPaymentMode(pm.id)}
                    className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-semibold transition ${
                      paymentMode === pm.id ? "border-teal-500 bg-teal-50 text-teal-700" :
                      pm.disabled ? "border-gray-100 text-gray-300 cursor-not-allowed" :
                      "border-gray-100 text-gray-700 hover:border-teal-200"
                    }`}
                  >
                    <span className="text-lg">{pm.icon}</span>
                    <span>{pm.label}</span>
                    {pm.disabled && <span className="text-[10px] ml-auto">(Card chahiye)</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Total row */}
            <div className="bg-teal-600 text-white rounded-2xl px-5 py-4 flex justify-between items-center">
              <div>
                <p className="text-teal-200 text-xs">Aaj Deposit</p>
                <p className="text-2xl font-black">₹{deposit.toLocaleString("en-IN")}</p>
              </div>
              <div className="text-right">
                <p className="text-teal-200 text-xs">Est. Total</p>
                <p className="font-bold">₹{totalEstimate.toLocaleString("en-IN")}</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-xs text-amber-700">
              ⚠️ IPD admission request ke baad hamari team 2-4 ghante mein confirm karegi aur bed availability check karegi.
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold">← Back</button>
              <button onClick={handleSubmit} disabled={booking}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
                {booking
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Booking ho rahi hai...</>
                  : "🛏️ Admission Book Karein"
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
