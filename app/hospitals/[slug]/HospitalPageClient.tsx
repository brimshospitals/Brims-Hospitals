"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ── Types ────────────────────────────────────────────────────────────────────
interface SelectedPatient { userId: string | null; name: string; mobile: string; age: number; gender: string; symptoms: string; isNewPatient: boolean; }
interface Doctor   { _id: string; name: string; department: string; speciality?: string; photo?: string; opdFee: number; offerFee?: number; rating?: number; totalReviews?: number; isAvailable: boolean; availableSlots?: { day: string; times: string[] }[]; }
interface LabTest  { _id: string; name: string; category: string; mrp: number; offerPrice: number; homeCollection?: boolean; fastingRequired?: boolean; turnaroundTime?: string; }
interface Surgery  { _id: string; name: string; category: string; mrp: number; offerPrice: number; stayDays?: number; surgeonName?: string; }
interface Review   { _id: string; patientName?: string; rating: number; comment?: string; createdAt: string; }
interface Hospital {
  _id: string; hospitalId: string; name: string; type?: string; mobile?: string; email?: string; website?: string;
  address?: { street?: string; city?: string; district?: string; state?: string; pincode?: string; };
  departments?: string[]; specialties?: string[]; photos?: string[];
  rating?: number; totalReviews?: number;
  ownerName?: string; spocName?: string; spocContact?: string;
  registrationNo?: string; rohiniNo?: string;
  coordinates?: { lat?: number; lng?: number; };
}

const TIME_SLOTS = [
  "9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM",
  "12:00 PM","12:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM",
];

const PAYMENT_MODES = [
  { id: "counter", label: "Pay at Counter", icon: "🏥" },
  { id: "online",  label: "UPI / Online",   icon: "📱" },
  { id: "wallet",  label: "Brims Wallet",   icon: "💰" },
  { id: "insurance", label: "Insurance",    icon: "🛡️" },
];

const TYPE_COLORS: Record<string, string> = {
  "Single Specialist": "bg-blue-100 text-blue-700 border-blue-200",
  "Multi Specialist":  "bg-purple-100 text-purple-700 border-purple-200",
  "Super Specialist":  "bg-rose-100 text-rose-700 border-rose-200",
  "Clinic":            "bg-green-100 text-green-700 border-green-200",
  "Diagnostic Lab":    "bg-orange-100 text-orange-700 border-orange-200",
  "Nursing Home":      "bg-teal-100 text-teal-700 border-teal-200",
};

function Stars({ rating, total }: { rating: number; total: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1,2,3,4,5].map((n) => (
          <span key={n} className={`text-lg ${n <= full ? "text-amber-400" : n === full + 1 && half ? "text-amber-300" : "text-gray-200"}`}>★</span>
        ))}
      </div>
      <span className="text-sm font-bold text-gray-700">{rating > 0 ? rating.toFixed(1) : "New"}</span>
      {total > 0 && <span className="text-xs text-gray-400">({total} reviews)</span>}
    </div>
  );
}

// ── Booking Modal ─────────────────────────────────────────────────────────────
type BookingType = "OPD" | "Lab" | "Surgery";

interface BookingState {
  type: BookingType;
  doctor?: Doctor;
  labTest?: LabTest;
  surgery?: Surgery;
}

function BookingModal({
  hospital, booking, onClose,
}: {
  hospital: Hospital;
  booking: BookingState;
  onClose: () => void;
}) {
  const router = useRouter();

  // Step: 1=Patient, 2=Details(date/slot for OPD), 3=Payment+Confirm, 4=Success
  const [step, setStep]                   = useState(1);
  const [profile, setProfile]             = useState<any>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn]       = useState(false);

  const [selectedPatient, setSelectedPatient] = useState<SelectedPatient | null>(null);
  const [date, setDate]                   = useState("");
  const [slot, setSlot]                   = useState("");
  const [paymentMode, setPaymentMode]     = useState("");
  const [insurancePolicyNo, setInsurancePolicyNo] = useState("");
  const [insurerName, setInsurerName]     = useState("");
  const [homeCollection, setHomeCollection] = useState(false);
  const [homeAddress, setHomeAddress]     = useState("");
  const [notes, setNotes]                 = useState("");

  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState("");
  const [successBooking, setSuccessBooking] = useState<any>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  // Load profile on mount
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) { setProfileLoading(false); setIsLoggedIn(false); return; }
    setIsLoggedIn(true);
    fetch(`/api/profile?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setProfile(data.user);
          setFamilyMembers(data.familyMembers || []);
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, []);

  // Get available slots for OPD doctor on selected date
  const docSlots = (() => {
    if (booking.type !== "OPD" || !booking.doctor || !date) return TIME_SLOTS;
    const dayName = new Date(date).toLocaleDateString("en-US", { weekday: "long" });
    const slot = booking.doctor.availableSlots?.find((s) => s.day.toLowerCase() === dayName.toLowerCase());
    return slot?.times?.length ? slot.times : TIME_SLOTS;
  })();

  // New-patient form state (for guests outside family)
  const [showNewForm, setShowNewForm]   = useState(false);
  const [newForm, setNewForm]           = useState({ name: "", mobile: "", age: "", gender: "", symptoms: "" });
  const [newFormError, setNewFormError] = useState("");

  async function handleSubmit() {
    if (!selectedPatient) { setError("Patient select karein"); return; }
    if (booking.type === "OPD" && (!date || !slot)) { setError("Date aur slot select karein"); return; }
    if (booking.type === "Lab" && !date) { setError("Date select karein"); return; }
    if (!paymentMode) { setError("Payment mode select karein"); return; }
    if (paymentMode === "insurance" && (!insurancePolicyNo.trim() || !insurerName.trim())) {
      setError("Insurance policy number aur company name zaruri hai"); return;
    }
    setSubmitting(true); setError("");
    try {
      const body: Record<string, any> = {
        type:          booking.type === "OPD" ? "OPD" : booking.type === "Lab" ? "Lab" : "Surgery",
        hospitalId:    hospital._id,
        appointmentDate: date || new Date().toISOString().split("T")[0],
        slot:          slot || "To be confirmed",
        patientUserId: selectedPatient.userId,
        patientName:   selectedPatient.name,
        patientMobile: selectedPatient.mobile,
        patientAge:    selectedPatient.age,
        patientGender: selectedPatient.gender,
        symptoms:      selectedPatient.symptoms || notes,
        isNewPatient:  selectedPatient.isNewPatient,
        paymentMode,
        amount: booking.doctor
          ? (booking.doctor.offerFee || booking.doctor.opdFee)
          : booking.labTest
          ? booking.labTest.offerPrice
          : booking.surgery?.offerPrice ?? 0,
        familyCardId: localStorage.getItem("familyCardId") || null,
      };
      if (booking.doctor)  body.doctorId  = booking.doctor._id;
      if (booking.labTest) body.labTestId = booking.labTest._id;
      if (booking.surgery) body.packageId = booking.surgery._id;
      if (paymentMode === "insurance") {
        body.insurancePolicyNo = insurancePolicyNo.trim();
        body.insurerName       = insurerName.trim();
      }
      if (homeCollection) body.homeAddress = homeAddress;

      const res  = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessBooking(data.booking);
        setStep(99);
      } else {
        setError(data.message || "Booking fail ho gayi");
      }
    } catch { setError("Network error. Dobara try karein."); }
    setSubmitting(false);
  }

  const title =
    booking.type === "OPD"     ? `Dr. ${booking.doctor?.name} ke saath OPD Book Karein` :
    booking.type === "Lab"     ? `${booking.labTest?.name} Book Karein` :
    `${booking.surgery?.name} Surgery Package`;

  const price =
    booking.doctor  ? (booking.doctor.offerFee  || booking.doctor.opdFee) :
    booking.labTest ? booking.labTest.offerPrice :
    booking.surgery?.offerPrice ?? 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-start justify-between z-10">
          <div>
            <p className="text-xs text-teal-600 font-semibold uppercase tracking-wide mb-0.5">
              {booking.type === "OPD" ? "OPD Appointment" : booking.type === "Lab" ? "Lab Test" : "Surgery Package"}
            </p>
            <p className="font-bold text-gray-800 text-sm leading-tight">{title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 flex-shrink-0 ml-3">✕</button>
        </div>

        {/* Service summary */}
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
          {booking.type === "OPD" && booking.doctor && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {booking.doctor.photo
                  ? <img src={booking.doctor.photo} alt={booking.doctor.name} className="w-full h-full object-cover" />
                  : <span className="text-xl">👨‍⚕️</span>}
              </div>
              <div>
                <p className="font-bold text-gray-800">Dr. {booking.doctor.name}</p>
                <p className="text-xs text-teal-600">{booking.doctor.speciality || booking.doctor.department}</p>
                <p className="text-sm font-bold text-teal-700 mt-0.5">Fees: ₹{booking.doctor.offerFee || booking.doctor.opdFee}</p>
              </div>
            </div>
          )}
          {booking.type === "Lab" && booking.labTest && (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-800">{booking.labTest.name}</p>
                <p className="text-xs text-gray-500">{booking.labTest.category}</p>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {booking.labTest.homeCollection && <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">Home Collection</span>}
                  {booking.labTest.fastingRequired && <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">Fasting Required</span>}
                  {booking.labTest.turnaroundTime && <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100">{booking.labTest.turnaroundTime}</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 line-through">₹{booking.labTest.mrp}</p>
                <p className="text-base font-bold text-orange-600">₹{booking.labTest.offerPrice}</p>
              </div>
            </div>
          )}
          {booking.type === "Surgery" && booking.surgery && (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-800">{booking.surgery.name}</p>
                <p className="text-xs text-gray-500">{booking.surgery.category}{booking.surgery.stayDays ? ` · ${booking.surgery.stayDays} day stay` : ""}</p>
                {booking.surgery.surgeonName && <p className="text-xs text-gray-400 mt-0.5">Surgeon: {booking.surgery.surgeonName}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 line-through">₹{booking.surgery.mrp?.toLocaleString("en-IN")}</p>
                <p className="text-base font-bold text-purple-700">₹{booking.surgery.offerPrice?.toLocaleString("en-IN")}</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-5 space-y-6">

          {/* Not logged in */}
          {!profileLoading && !isLoggedIn && step !== 99 && (
            <div className="text-center py-4">
              <p className="text-3xl mb-3">🔐</p>
              <p className="font-semibold text-gray-800 mb-1">Login karein</p>
              <p className="text-sm text-gray-500 mb-4">Booking ke liye pehle login karein</p>
              <button onClick={() => router.push("/login")}
                className="w-full py-3 rounded-xl bg-teal-600 text-white font-bold text-sm hover:bg-teal-700 transition">
                Login / Register
              </button>
            </div>
          )}

          {/* Loading */}
          {profileLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Success */}
          {step === 99 && successBooking && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Booking Confirmed!</h3>
              <p className="text-sm text-gray-500 mb-1">Booking ID: <span className="font-bold text-teal-600">{successBooking.bookingId}</span></p>
              <p className="text-sm text-gray-500 mb-4">{hospital.name}</p>
              {booking.type === "Surgery" && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
                  📞 Hamari team 24 ghante mein aapko call karegi surgery confirm karne ke liye.
                </p>
              )}
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">
                  Close
                </button>
                <button onClick={() => router.push("/my-bookings")} className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-sm hover:bg-teal-700 transition">
                  My Bookings
                </button>
              </div>
            </div>
          )}

          {/* Main booking form */}
          {!profileLoading && isLoggedIn && step !== 99 && (
            <>
              {/* Step 1 — Patient (single-click selection) */}
              <div>
                <p className="text-sm font-bold text-gray-700 mb-3">1. Patient Select Karein</p>
                <div className="space-y-2">
                  {/* Family member cards — single click confirms */}
                  {[...(profile ? [{ ...profile, _rel: "self" }] : []), ...familyMembers.map((m: any) => ({ ...m, _rel: m.relationship || "Family" }))].map((m: any) => {
                    const isSelected = selectedPatient?.userId === m._id && !selectedPatient?.isNewPatient;
                    return (
                      <button key={m._id} type="button"
                        onClick={() => {
                          setShowNewForm(false);
                          setSelectedPatient({
                            userId: m._id, name: m.name,
                            mobile: m.mobile || profile?.mobile || "",
                            age: m.age, gender: m.gender,
                            symptoms: "", isNewPatient: false,
                          });
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition ${
                          isSelected ? "border-teal-500 bg-teal-50" : "border-gray-100 hover:border-teal-300 bg-white"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {m.photo
                            ? <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                            : <span className="text-teal-600 font-bold text-base">{m.name?.[0] || "?"}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 text-sm">{m.name}</p>
                          <p className="text-xs text-gray-400">{m.age} yrs · {m.gender}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${m._rel === "self" ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-600"}`}>
                          {m._rel === "self" ? "Aap" : m._rel}
                        </span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "border-teal-500 bg-teal-500" : "border-gray-300"}`}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </button>
                    );
                  })}

                  {/* Naya Patient toggle */}
                  <button type="button"
                    onClick={() => { setShowNewForm((v) => !v); setSelectedPatient(null); setNewFormError(""); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-dashed text-left transition ${
                      showNewForm ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-purple-300 bg-white"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 text-lg">➕</div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-sm">Naya Patient</p>
                      <p className="text-xs text-gray-400">Family se bahar ka patient</p>
                    </div>
                  </button>

                  {/* Naya Patient form */}
                  {showNewForm && (
                    <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100 space-y-3">
                      <input value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                        placeholder="Patient ka naam *"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                      <div className="grid grid-cols-2 gap-2">
                        <input value={newForm.mobile} onChange={(e) => setNewForm({ ...newForm, mobile: e.target.value.replace(/\D/g, "") })}
                          maxLength={10} placeholder="Mobile *"
                          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                        <input type="number" value={newForm.age} onChange={(e) => setNewForm({ ...newForm, age: e.target.value })}
                          placeholder="Age *" min={1} max={120}
                          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                      </div>
                      <div className="flex gap-2">
                        {["male","female","other"].map((g) => (
                          <button key={g} type="button" onClick={() => setNewForm({ ...newForm, gender: g })}
                            className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${newForm.gender === g ? "bg-purple-600 text-white border-purple-600" : "border-gray-200 text-gray-500 hover:border-purple-300"}`}>
                            {g === "male" ? "Male" : g === "female" ? "Female" : "Other"}
                          </button>
                        ))}
                      </div>
                      <input value={newForm.symptoms} onChange={(e) => setNewForm({ ...newForm, symptoms: e.target.value })}
                        placeholder="Symptoms (optional)"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                      {newFormError && <p className="text-xs text-red-500">{newFormError}</p>}
                      <button type="button"
                        onClick={() => {
                          setNewFormError("");
                          if (!newForm.name.trim()) { setNewFormError("Naam zaruri hai"); return; }
                          if (newForm.mobile.length !== 10) { setNewFormError("10-digit mobile number daalen"); return; }
                          if (!newForm.age || Number(newForm.age) < 1) { setNewFormError("Sahi age daalen"); return; }
                          if (!newForm.gender) { setNewFormError("Gender chunein"); return; }
                          setSelectedPatient({ userId: null, name: newForm.name.trim(), mobile: newForm.mobile, age: Number(newForm.age), gender: newForm.gender, symptoms: newForm.symptoms, isNewPatient: true });
                          setShowNewForm(false);
                        }}
                        className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 transition">
                        Is patient ko confirm karein ✓
                      </button>
                    </div>
                  )}

                  {/* Selected patient confirmation chip */}
                  {selectedPatient && (
                    <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5">
                      <span className="text-teal-600 text-lg">✅</span>
                      <span className="text-sm font-semibold text-teal-800">{selectedPatient.name} selected</span>
                      <button onClick={() => setSelectedPatient(null)} className="ml-auto text-xs text-gray-400 hover:text-red-500">✕ change</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2 — Date / Slot (OPD), Date (Lab), Notes (Surgery) */}
              {booking.type === "OPD" && (
                <div className="space-y-4">
                  <p className="text-sm font-bold text-gray-700">2. Date aur Slot</p>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1.5">Appointment Date</label>
                    <input type="date" min={todayStr} value={date}
                      onChange={(e) => { setDate(e.target.value); setSlot(""); }}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                  </div>
                  {date && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-2">Time Slot</label>
                      <div className="grid grid-cols-3 gap-2">
                        {docSlots.map((s) => (
                          <button key={s} onClick={() => setSlot(s)}
                            className={`py-2 rounded-xl text-xs font-semibold border transition ${
                              slot === s ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-600 border-gray-200 hover:border-teal-400"
                            }`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {booking.type === "Lab" && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-gray-700">2. Test Date</p>
                  <input type="date" min={todayStr} value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                  {booking.labTest?.homeCollection && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200">
                      <input type="checkbox" id="home" checked={homeCollection} onChange={(e) => setHomeCollection(e.target.checked)} className="w-4 h-4 accent-teal-600" />
                      <label htmlFor="home" className="text-sm text-green-800 font-medium cursor-pointer">Home Collection chahiye (ghar se sample lenge)</label>
                    </div>
                  )}
                  {homeCollection && (
                    <textarea value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)}
                      placeholder="Ghar ka address likhein — flat, street, landmark, district, pin"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" rows={3} />
                  )}
                </div>
              )}

              {booking.type === "Surgery" && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-gray-700">2. Surgery Date (Optional)</p>
                  <input type="date" min={todayStr} value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder="Koi bhi sawaal ya additional info yahan likhein (optional)"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" rows={2} />
                  <p className="text-xs text-gray-400">📞 Hamari team 24 ghante mein confirm karne ke liye call karegi.</p>
                </div>
              )}

              {/* Step 3 — Payment */}
              <div className="space-y-3">
                <p className="text-sm font-bold text-gray-700">3. Payment Mode</p>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_MODES.map((m) => (
                    <button key={m.id} onClick={() => setPaymentMode(m.id)}
                      className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-semibold transition ${
                        paymentMode === m.id ? "bg-teal-600 text-white border-teal-600 shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-teal-400"
                      }`}>
                      <span>{m.icon}</span>{m.label}
                    </button>
                  ))}
                </div>

                {paymentMode === "insurance" && (
                  <div className="space-y-2.5 pt-2">
                    <input value={insurancePolicyNo} onChange={(e) => setInsurancePolicyNo(e.target.value)}
                      placeholder="Policy Number *"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                    <input value={insurerName} onChange={(e) => setInsurerName(e.target.value)}
                      placeholder="Insurance Company Name *"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                  </div>
                )}
              </div>

              {/* Amount summary */}
              {price > 0 && paymentMode && (
                <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Amount</span>
                    <span className="text-lg font-bold text-teal-700">₹{price.toLocaleString("en-IN")}</span>
                  </div>
                  {paymentMode === "counter" && <p className="text-xs text-gray-400 mt-1">Counter pe cash / UPI se pay karein</p>}
                  {paymentMode === "wallet"  && <p className="text-xs text-gray-400 mt-1">Brims wallet se deduct hoga</p>}
                  {paymentMode === "online"  && <p className="text-xs text-gray-400 mt-1">UPI / PhonePe se payment hogi</p>}
                </div>
              )}

              {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3 border border-red-100">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={submitting || !selectedPatient || !paymentMode || (booking.type === "OPD" && (!date || !slot)) || (booking.type === "Lab" && !date)}
                className="w-full py-3.5 rounded-xl bg-teal-600 text-white font-bold text-sm hover:bg-teal-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Booking ho rahi hai...
                  </span>
                ) : (
                  booking.type === "Surgery" ? "Surgery Enquiry Submit Karein" : "Booking Confirm Karein"
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Client Component ─────────────────────────────────────────────────────
export default function HospitalPageClient({
  hospital, doctors, labTests, surgeries, reviews,
}: {
  hospital: Hospital;
  doctors:  Doctor[];
  labTests: LabTest[];
  surgeries: Surgery[];
  reviews:  Review[];
}) {
  const [activeBooking, setActiveBooking] = useState<BookingState | null>(null);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  const addr        = hospital.address || {};
  const fullAddress = [addr.street, addr.city, addr.district, "Bihar", addr.pincode].filter(Boolean).join(", ");
  const typeColor   = TYPE_COLORS[hospital.type ?? ""] ?? "bg-white/20 text-white border-white/30";

  const mapUrl = hospital.coordinates?.lat && hospital.coordinates?.lng
    ? `https://www.google.com/maps?q=${hospital.coordinates.lat},${hospital.coordinates.lng}`
    : fullAddress ? `https://www.google.com/maps/search/${encodeURIComponent(fullAddress)}` : null;

  return (
    <>
      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-800 text-white">
        {hospital.photos?.[0] && (
          <div className="relative h-52 overflow-hidden">
            <img src={hospital.photos[0]} alt={hospital.name} className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-t from-teal-800/80 to-transparent" />
          </div>
        )}
        <div className="max-w-4xl mx-auto px-5 py-8">
          {hospital.type && (
            <span className={`inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-full border mb-3 ${typeColor}`}>
              {hospital.type}
            </span>
          )}
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{hospital.name}</h1>
          {fullAddress && (
            <p className="text-teal-100 text-sm flex items-center gap-1.5 mb-3">
              <span>📍</span>{fullAddress}
            </p>
          )}
          <Stars rating={hospital.rating || 0} total={hospital.totalReviews || 0} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* ── Quick Stats / Contact ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {hospital.mobile && (
            <a href={`tel:${hospital.mobile}`}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center hover:shadow-md transition">
              <span className="text-2xl mb-1">📞</span>
              <span className="text-xs text-gray-500 font-medium">Call Now</span>
              <span className="text-sm font-bold text-teal-700 mt-0.5">{hospital.mobile}</span>
            </a>
          )}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <span className="text-2xl mb-1">👨‍⚕️</span>
            <span className="text-xs text-gray-500 font-medium">Doctors</span>
            <span className="text-sm font-bold text-gray-700 mt-0.5">{doctors.length}</span>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <span className="text-2xl mb-1">🧪</span>
            <span className="text-xs text-gray-500 font-medium">Lab Tests</span>
            <span className="text-sm font-bold text-gray-700 mt-0.5">{labTests.length}</span>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <span className="text-2xl mb-1">🏨</span>
            <span className="text-xs text-gray-500 font-medium">Surgery Pkgs</span>
            <span className="text-sm font-bold text-gray-700 mt-0.5">{surgeries.length}</span>
          </div>
        </div>

        {/* ── Hospital Profile Details ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
          <h2 className="font-bold text-gray-800 text-lg">🏥 Hospital Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hospital.email && (
              <a href={`mailto:${hospital.email}`} className="flex items-start gap-3 group">
                <span className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-lg flex-shrink-0">✉️</span>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Email</p>
                  <p className="text-sm font-semibold text-blue-600 group-hover:underline break-all">{hospital.email}</p>
                </div>
              </a>
            )}
            {hospital.website && (
              <a href={hospital.website.startsWith("http") ? hospital.website : `https://${hospital.website}`} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 group">
                <span className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-lg flex-shrink-0">🌐</span>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Website</p>
                  <p className="text-sm font-semibold text-teal-600 group-hover:underline break-all">{hospital.website}</p>
                </div>
              </a>
            )}
            {hospital.ownerName && (
              <div className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-lg flex-shrink-0">👤</span>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Owner / Director</p>
                  <p className="text-sm font-semibold text-gray-700">{hospital.ownerName}</p>
                </div>
              </div>
            )}
            {hospital.spocName && (
              <div className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-lg flex-shrink-0">🤝</span>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Contact Person</p>
                  <p className="text-sm font-semibold text-gray-700">{hospital.spocName}</p>
                  {hospital.spocContact && <p className="text-xs text-teal-600">{hospital.spocContact}</p>}
                </div>
              </div>
            )}
            {hospital.registrationNo && (
              <div className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-lg flex-shrink-0">📋</span>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Registration No.</p>
                  <p className="text-sm font-semibold text-gray-700">{hospital.registrationNo}</p>
                </div>
              </div>
            )}
            {hospital.rohiniNo && (
              <div className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-lg flex-shrink-0">🏛️</span>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Rohini No.</p>
                  <p className="text-sm font-semibold text-gray-700">{hospital.rohiniNo}</p>
                </div>
              </div>
            )}
            {mapUrl && (
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 group">
                <span className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-lg flex-shrink-0">📍</span>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Location</p>
                  <p className="text-sm font-semibold text-red-600 group-hover:underline">Google Maps pe dekhein →</p>
                </div>
              </a>
            )}
          </div>
        </div>

        {/* ── Departments ── */}
        {(hospital.departments || []).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-800 text-lg mb-4">🏥 Departments</h2>
            <div className="flex flex-wrap gap-2">
              {hospital.departments!.map((d) => (
                <span key={d} className="text-sm bg-teal-50 text-teal-700 border border-teal-100 px-3 py-1.5 rounded-full font-medium">{d}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── Specialties ── */}
        {(hospital.specialties || []).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-800 text-lg mb-4">⭐ Specialties</h2>
            <div className="flex flex-wrap gap-2">
              {hospital.specialties!.map((s) => (
                <span key={s} className="text-sm bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1.5 rounded-full font-medium">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── OPD Doctors ── */}
        {doctors.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-800 text-lg mb-4">🩺 OPD Doctors</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {doctors.map((doc) => (
                <div key={doc._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-3 hover:shadow-md hover:border-teal-200 transition">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-teal-50 flex-shrink-0 flex items-center justify-center">
                    {doc.photo
                      ? <img src={doc.photo} alt={doc.name} className="w-full h-full object-cover" />
                      : <span className="text-2xl">👨‍⚕️</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm">Dr. {doc.name}</p>
                    <p className="text-xs text-teal-600 font-medium">{doc.speciality || doc.department}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex">
                        {[1,2,3,4,5].map((n) => (
                          <span key={n} className={`text-xs ${n <= Math.round(doc.rating || 0) ? "text-amber-400" : "text-gray-200"}`}>★</span>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-teal-700">₹{doc.offerFee || doc.opdFee}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-semibold ${doc.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {doc.isAvailable ? "● Available" : "● Unavailable"}
                      </span>
                      <button
                        onClick={() => setActiveBooking({ type: "OPD", doctor: doc })}
                        className="text-xs bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg font-semibold transition"
                      >
                        Book OPD →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Surgery Packages ── */}
        {surgeries.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-800 text-lg mb-4">🏨 Surgery Packages</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {surgeries.map((s) => (
                <div key={s._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-purple-200 transition">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl flex-shrink-0">🏨</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-sm leading-tight">{s.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.category}{s.stayDays ? ` · ${s.stayDays} day stay` : ""}</p>
                      {s.surgeonName && <p className="text-xs text-gray-400">Surgeon: {s.surgeonName}</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 line-through mr-1">₹{s.mrp?.toLocaleString("en-IN")}</span>
                      <span className="text-base font-bold text-purple-700">₹{s.offerPrice?.toLocaleString("en-IN")}</span>
                    </div>
                    <button
                      onClick={() => setActiveBooking({ type: "Surgery", surgery: s })}
                      className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Lab Tests ── */}
        {labTests.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-800 text-lg mb-4">🧪 Lab Tests</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {labTests.map((t) => (
                <div key={t._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-orange-200 transition">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-sm">{t.name}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-100">{t.category}</span>
                        {t.homeCollection && <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">Home Collection</span>}
                        {t.fastingRequired && <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">Fasting</span>}
                        {t.turnaroundTime && <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100">{t.turnaroundTime}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400 line-through">₹{t.mrp}</p>
                      <p className="text-base font-bold text-orange-600">₹{t.offerPrice}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveBooking({ type: "Lab", labTest: t })}
                    className="w-full text-xs bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-semibold transition"
                  >
                    Book Test →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Reviews ── */}
        {reviews.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-800 text-lg mb-4">⭐ Patient Reviews</h2>
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{r.patientName || "Patient"}</p>
                      <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                    <div className="flex flex-shrink-0">
                      {[1,2,3,4,5].map((n) => (
                        <span key={n} className={`text-sm ${n <= r.rating ? "text-amber-400" : "text-gray-200"}`}>★</span>
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CTA Banner ── */}
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-6 text-white text-center">
          <h3 className="font-bold text-lg mb-1">Appointment Book Karein</h3>
          <p className="text-teal-100 text-sm mb-4">{hospital.name} — OPD, Lab ya Surgery abhi book karein</p>
          <div className="flex flex-wrap justify-center gap-3">
            {doctors.length > 0 && (
              <button onClick={() => setActiveBooking({ type: "OPD", doctor: doctors[0] })}
                className="inline-flex items-center gap-2 bg-white text-teal-700 font-bold px-5 py-2.5 rounded-xl hover:bg-teal-50 transition shadow text-sm">
                🩺 OPD Book Karein
              </button>
            )}
            {labTests.length > 0 && (
              <button onClick={() => setActiveBooking({ type: "Lab", labTest: labTests[0] })}
                className="inline-flex items-center gap-2 bg-white/20 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-white/30 transition text-sm border border-white/30">
                🧪 Lab Test
              </button>
            )}
            {surgeries.length > 0 && (
              <button onClick={() => setActiveBooking({ type: "Surgery", surgery: surgeries[0] })}
                className="inline-flex items-center gap-2 bg-white/20 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-white/30 transition text-sm border border-white/30">
                🏨 Surgery
              </button>
            )}
          </div>
        </div>

        {/* ── Photos Gallery ── */}
        {(hospital.photos || []).length > 1 && (
          <div>
            <h2 className="font-bold text-gray-800 text-lg mb-4">📷 Photos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(showAllPhotos ? hospital.photos! : hospital.photos!.slice(0, 6)).map((src, i) => (
                <img key={i} src={src} alt={`${hospital.name} photo ${i + 1}`}
                  className="rounded-xl w-full h-36 object-cover border border-gray-100" />
              ))}
            </div>
            {!showAllPhotos && hospital.photos!.length > 6 && (
              <button onClick={() => setShowAllPhotos(true)} className="mt-3 text-sm text-teal-600 font-semibold hover:underline">
                +{hospital.photos!.length - 6} aur photos dekhein
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Booking Modal ── */}
      {activeBooking && (
        <BookingModal
          hospital={hospital}
          booking={activeBooking}
          onClose={() => setActiveBooking(null)}
        />
      )}
    </>
  );
}