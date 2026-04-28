"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/header";
import PatientSelector, { SelectedPatient } from "../components/PatientSelector";
import LangToggle from "../components/LangToggle";
import { useLang } from "@/app/providers/LangProvider";
import { t } from "@/lib/i18n";

const timeSlots = [
  "9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM",
  "12:00 PM","12:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM",
];

const PAYMENT_MODES = [
  { id: "counter", label: "Pay at Counter", icon: "🏥" },
  { id: "online",  label: "UPI / Online",   icon: "📱" },
  { id: "wallet",  label: "Wallet",          icon: "💰" },
  { id: "insurance", label: "Insurance",     icon: "🛡️" },
];

function OPDBookingContent() {
  const router = useRouter();
  const { lang } = useLang();

  // Steps: 1=Doctor, 2=Patient, 3=Confirm+Pay, 4=Success
  const [step, setStep]               = useState(1);

  // Profile data
  const [profile, setProfile]         = useState<any>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [hasMembership, setHasMembership] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Doctors
  const [doctors, setDoctors]         = useState<any[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [filterSpec, setFilterSpec]   = useState("All");
  const [specs, setSpecs]             = useState<string[]>(["All"]);

  // Selection state
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate]     = useState("");
  const [selectedSlot, setSelectedSlot]     = useState("");
  const [selectedPatient, setSelectedPatient] = useState<SelectedPatient | null>(null);
  const [symptoms, setSymptoms]             = useState("");
  const [paymentMode, setPaymentMode]       = useState("");

  // Promo code
  const [promoInput, setPromoInput]   = useState("");
  const [promoData, setPromoData]     = useState<any>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError]   = useState("");

  // Insurance fields
  const [insurancePolicyNo, setInsurancePolicyNo] = useState("");
  const [insurerName, setInsurerName]             = useState("");
  const [tpaName, setTpaName]                     = useState("");

  // Booking result
  const [booking, setBooking]         = useState<any>(null);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState("");
  const [activatingCard, setActivatingCard] = useState(false);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);

  // Load profile + doctors on mount
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) { setProfileLoading(false); return; }

    fetch(`/api/profile?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setProfile(data.user);
          setFamilyMembers(data.familyMembers || []);
          setHasMembership(!!data.familyCard);
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));

    fetchDoctors();
    fetchPendingBookings(userId);

    const params = new URLSearchParams(window.location.search);
    if (params.get("activated") === "1") {
      window.history.replaceState({}, "", "/opd-booking");
      const draftDoctorId = sessionStorage.getItem("opdDraftDoctorId");
      if (draftDoctorId) sessionStorage.setItem("opdAutoOpenDoctor", draftDoctorId);
      sessionStorage.removeItem("opdDraftDoctorId");
    }
  }, []);

  async function fetchPendingBookings(userId: string) {
    try {
      const res  = await fetch(`/api/my-bookings?userId=${userId}&type=OPD&status=pending`);
      const data = await res.json();
      if (data.success) setPendingBookings(data.bookings?.slice(0, 3) || []);
    } catch {}
  }

  async function activateCard() {
    const userId = localStorage.getItem("userId");
    if (!userId) { setError("Pehle login karein"); return; }
    if (selectedDoctor) sessionStorage.setItem("opdDraftDoctorId", selectedDoctor._id);
    setActivatingCard(true);
    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, returnUrl: "/opd-booking" }),
      });
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setError(data.message || "Payment shuru nahi ho saka");
        setActivatingCard(false);
      }
    } catch {
      setError("Network error");
      setActivatingCard(false);
    }
  }

  async function fetchDoctors(spec?: string) {
    setDoctorsLoading(true);
    try {
      const params = new URLSearchParams();
      if (spec && spec !== "All") params.set("department", spec);
      const res  = await fetch(`/api/doctors?${params}`);
      const data = await res.json();
      if (data.success) {
        setDoctors(data.doctors);
        const allSpecs = ["All", ...new Set<string>(data.doctors.map((d: any) => d.department).filter(Boolean))];
        setSpecs(allSpecs as string[]);
        // Auto-select doctor after card activation return
        const autoId = sessionStorage.getItem("opdAutoOpenDoctor");
        if (autoId) {
          sessionStorage.removeItem("opdAutoOpenDoctor");
          const doc = data.doctors.find((d: any) => d._id === autoId);
          if (doc) setTimeout(() => setSelectedDoctor(doc), 200);
        }
      }
    } catch {}
    setDoctorsLoading(false);
  }

  function handleFilterSpec(s: string) {
    setFilterSpec(s);
    fetchDoctors(s);
  }

  // ── BookingDraft auto-save ────────────────────────────────────────────────
  async function saveDraft(stage: number, extra: Record<string, any> = {}, docOverride?: any) {
    const doc = docOverride || selectedDoctor;
    if (!doc) return;
    try {
      const body: any = {
        type: "OPD", itemId: doc._id, itemType: "Doctor",
        itemName: `Dr. ${doc.name}`, hospitalName: doc.hospitalName || "",
        amount: doc.offerFee || doc.opdFee || 0, stage, ...extra,
      };
      if (draftId) body.draftId = draftId;
      const res  = await fetch("/api/booking-draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success && data.draftId) setDraftId(data.draftId);
    } catch {}
  }

  // Stage 1: doctor selected
  useEffect(() => {
    if (!selectedDoctor) { setDraftId(null); return; }
    saveDraft(1, {}, selectedDoctor);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDoctor?._id]);

  // Stage 2: patient selected
  useEffect(() => {
    if (!selectedDoctor || !selectedPatient || !draftId) return;
    saveDraft(2, { patientInfo: { name: selectedPatient.name, mobile: selectedPatient.mobile, age: selectedPatient.age, gender: selectedPatient.gender } });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatient?.name]);

  // Stage 3: date or slot selected
  useEffect(() => {
    if (!selectedDoctor || !draftId || (!selectedDate && !selectedSlot)) return;
    const t = setTimeout(() => saveDraft(3, { slotInfo: { date: selectedDate, slot: selectedSlot } }), 600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedSlot]);

  // Stage 4: payment mode selected
  useEffect(() => {
    if (!selectedDoctor || !draftId || !paymentMode) return;
    saveDraft(4, { paymentMode });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMode]);

  async function applyPromo() {
    if (!promoInput.trim() || !selectedDoctor) return;
    setPromoLoading(true); setPromoError(""); setPromoData(null);
    try {
      const baseAmount = selectedDoctor.offerFee || selectedDoctor.opdFee;
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim(), amount: baseAmount, bookingType: "OPD" }),
      });
      const data = await res.json();
      if (data.success) setPromoData(data);
      else setPromoError(data.message);
    } catch { setPromoError("Network error. Dobara try karein."); }
    setPromoLoading(false);
  }

  async function handleConfirmBooking() {
    if (!selectedDoctor || !selectedDate || !selectedSlot || !selectedPatient || !paymentMode) return;
    if (paymentMode === "insurance" && (!insurancePolicyNo.trim() || !insurerName.trim())) {
      setError("Insurance payment ke liye Policy Number aur Company naam zaruri hai.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const userId = localStorage.getItem("userId");
      const familyCardId = localStorage.getItem("familyCardId") || null;
      const baseAmount = selectedDoctor.offerFee || selectedDoctor.opdFee;
      const finalAmount = promoData ? promoData.finalAmount : baseAmount;
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "OPD",
          doctorId: selectedDoctor._id,
          hospitalId: selectedDoctor.hospitalId || null,
          appointmentDate: selectedDate,
          slot: selectedSlot,
          patientUserId: selectedPatient.userId,
          patientName: selectedPatient.name,
          patientMobile: selectedPatient.mobile,
          patientAge: selectedPatient.age,
          patientGender: selectedPatient.gender,
          symptoms: symptoms || selectedPatient.symptoms,
          isNewPatient: selectedPatient.isNewPatient,
          paymentMode,
          amount: finalAmount,
          familyCardId,
          ...(promoData && { promoCode: promoData.code, promoDiscount: promoData.discount }),
          ...(paymentMode === "insurance" && {
            insurancePolicyNo: insurancePolicyNo.trim(),
            insurerName: insurerName.trim(),
            tpaName: tpaName.trim() || undefined,
          }),
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.redirectUrl) {
          // Online payment — redirect to PhonePe (draft marked converted on callback)
          window.location.href = data.redirectUrl;
          return;
        }
        setBooking(data.booking);
        if (draftId) {
          fetch("/api/booking-draft", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draftId, status: "converted", convertedBookingId: data.booking?.bookingId }) }).catch(() => {});
          setDraftId(null);
        }
        setStep(4);
      } else {
        setError(data.message || "Booking fail ho gayi");
      }
    } catch {
      setError("Network error. Dobara try karein.");
    }
    setSubmitting(false);
  }

  function reset() {
    setStep(1);
    setSelectedDoctor(null);
    setSelectedDate("");
    setSelectedSlot("");
    setSelectedPatient(null);
    setSymptoms("");
    setPaymentMode("");
    setBooking(null);
    setError("");
    setPromoInput("");
    setPromoData(null);
    setPromoError("");
    setInsurancePolicyNo("");
    setInsurerName("");
    setTpaName("");
  }

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <Header />

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-4 py-8 text-center relative">
        <div className="absolute top-3 right-3">
          <LangToggle variant="icon" />
        </div>
        <h1 className="text-white text-2xl font-bold mb-1">{t("opd.title", lang)}</h1>
        <p className="text-blue-200 text-sm">{t("opd.subtitle", lang)}</p>
      </div>

      {/* Progress */}
      {step < 4 && (
        <div className="max-w-lg mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            {[
              { n: 1, label: t("opd.step1", lang) },
              { n: 2, label: t("opd.step2", lang) },
              { n: 3, label: t("opd.step3", lang) },
            ].map((s, i) => (
              <div key={s.n} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition ${
                    step > s.n ? "bg-blue-600 border-blue-600 text-white"
                    : step === s.n ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-gray-200 text-gray-400"
                  }`}>
                    {step > s.n ? "✓" : s.n}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${step >= s.n ? "text-blue-700" : "text-gray-400"}`}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div className={`flex-1 h-1 mx-2 rounded mb-4 ${step > s.n ? "bg-blue-600" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 space-y-4">

        {/* In-progress OPD bookings */}
        {step === 1 && pendingBookings.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <p className="text-sm font-bold text-blue-700 mb-2">📋 Aapki pending OPD bookings:</p>
            <div className="space-y-2">
              {pendingBookings.map((b: any) => (
                <div key={b._id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border border-blue-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{b.doctorName || "Doctor"}</p>
                    <p className="text-xs text-gray-500">{b.patientName || ""} · {b.bookingId} · {b.slot || ""}</p>
                  </div>
                  <a href="/my-bookings" className="text-xs font-bold text-blue-600 bg-white border border-blue-300 px-3 py-1.5 rounded-lg whitespace-nowrap hover:bg-blue-50">
                    Track →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 1: Doctor Selection ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold text-gray-800 text-base mb-4">{t("opd.selectDoc", lang)}</h2>

            {/* Specialization filter */}
            <div className="flex flex-wrap gap-2 mb-4">
              {specs.map((s) => (
                <button key={s} onClick={() => handleFilterSpec(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    filterSpec === s ? "bg-blue-600 text-white border-blue-600" : "text-gray-500 border-gray-200 hover:border-blue-300"
                  }`}>
                  {s}
                </button>
              ))}
            </div>

            {/* Doctor list */}
            {doctorsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : doctors.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p className="text-4xl mb-2">🔍</p>
                <p className="text-sm">Is department mein koi doctor available nahi hai</p>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {doctors.map((doc) => (
                  <button key={doc._id}
                    type="button"
                    onClick={() => setSelectedDoctor(doc)}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition ${
                      selectedDoctor?._id === doc._id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-100 hover:border-blue-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-blue-100 flex-shrink-0">
                        {doc.photo
                          ? <img src={doc.photo} alt={doc.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold text-xl">
                              {doc.name?.[0] || "D"}
                            </div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 text-sm">{doc.name}</p>
                        <p className="text-blue-600 text-xs">{doc.department}</p>
                        {doc.speciality && <p className="text-gray-400 text-xs">{doc.speciality}</p>}
                        {doc.experience && <p className="text-gray-400 text-xs">{doc.experience} yrs exp</p>}
                      </div>
                      <div className="ml-3 flex-shrink-0 text-right min-w-[80px] flex flex-col items-end">
                        {doc.offerFee && doc.offerFee < doc.opdFee ? (
                          <>
                            <p className="text-[11px] text-gray-400 line-through leading-none mb-0.5">MRP ₹{doc.opdFee}</p>
                            <p className="font-black text-blue-700 text-xl leading-none">₹{doc.offerFee}</p>
                            <span className="inline-block mt-1 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">
                              ₹{doc.opdFee - doc.offerFee} off
                            </span>
                          </>
                        ) : (
                          <p className="font-black text-blue-700 text-xl leading-none">₹{doc.opdFee}</p>
                        )}
                        {!hasMembership && (
                          <div className="mt-1.5 bg-green-50 border border-green-200 rounded-lg px-2 py-1 text-right">
                            <p className="text-[10px] text-gray-500 leading-none mb-0.5">💳 Member</p>
                            <p className="text-[10px] text-amber-600 font-semibold leading-none">Extra savings!</p>
                          </div>
                        )}
                        {doc.rating > 0 && (
                          <p className="text-xs text-amber-500 mt-1">⭐ {doc.rating.toFixed(1)}</p>
                        )}
                      </div>
                    </div>
                    {doc.availableSlots?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {doc.availableSlots.slice(0, 4).map((s: any) => (
                          <span key={s.day} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {s.day}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Date & Slot — shown after doctor selected */}
            {selectedDoctor && (
              <div className="space-y-4 border-t border-gray-100 pt-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">{t("opd.selectDate", lang)}</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={todayStr}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">{t("opd.selectSlot", lang)}</label>
                  <div className="flex flex-wrap gap-2">
                    {timeSlots.map((slot) => (
                      <button key={slot} type="button" onClick={() => setSelectedSlot(slot)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          selectedSlot === slot
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-200 text-gray-600 hover:border-blue-400"
                        }`}>
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                if (!selectedDoctor) { setError("Doctor select karein"); return; }
                if (!selectedDate) { setError("Date select karein"); return; }
                if (!selectedSlot) { setError("Time slot select karein"); return; }
                setError(""); setStep(2);
              }}
              className="w-full mt-5 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-bold transition"
            >
              {t("opd.nextPatient", lang)}
            </button>
            {error && <p className="text-red-500 text-xs text-center mt-2">{error}</p>}
          </div>
        )}

        {/* ── STEP 2: Patient Selection ── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold text-gray-800 text-base mb-1">{t("opd.whoPatient", lang)}</h2>
            <p className="text-xs text-gray-400 mb-4">{lang === "hi" ? "फैमिली मेंबर चुनें या नया मरीज जोड़ें" : "Select family member or add new patient"}</p>

            {profileLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <PatientSelector
                primaryUser={profile}
                familyMembers={familyMembers}
                onSelect={(patient) => {
                  setSelectedPatient(patient);
                  setStep(3);
                }}
              />
            )}

            {/* Symptoms field if patient already selected */}
            {selectedPatient && (
              <div className="mt-4">
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Symptoms / Visit ka karan</label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Takleef describe karein..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 resize-none"
                />
              </div>
            )}

            <button
              onClick={() => setStep(1)}
              className="w-full mt-4 border border-gray-200 text-gray-600 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition"
            >
              ← Wapas
            </button>
          </div>
        )}

        {/* ── STEP 3: Confirm & Pay ── */}
        {step === 3 && selectedDoctor && selectedPatient && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold text-gray-800 text-base mb-4">{t("opd.confirmPay", lang)}</h2>

            {/* Booking Summary */}
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 space-y-2.5 mb-5">
              <div className="flex items-center gap-3 pb-2 border-b border-blue-100">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-blue-100 flex-shrink-0">
                  {selectedDoctor.photo
                    ? <img src={selectedDoctor.photo} alt={selectedDoctor.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold text-lg">{selectedDoctor.name?.[0]}</div>
                  }
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{selectedDoctor.name}</p>
                  <p className="text-blue-600 text-xs">{selectedDoctor.department}</p>
                </div>
              </div>
              <Row label="Date" value={new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })} />
              <Row label="Time" value={selectedSlot} />
              <Row label="Patient" value={`${selectedPatient.name} (${selectedPatient.age} yrs, ${selectedPatient.gender})`} />
              <Row label="Mobile" value={`+91 ${selectedPatient.mobile}`} />
              {(symptoms || selectedPatient.symptoms) && (
                <Row label="Symptoms" value={symptoms || selectedPatient.symptoms} />
              )}
              <div className="flex justify-between text-sm border-t border-blue-100 pt-2 mt-1">
                <span className="font-bold text-blue-800">Fees</span>
                <span className="font-bold text-blue-800">
                  {promoData ? (
                    <span>
                      <span className="line-through text-gray-400 font-normal mr-1">₹{selectedDoctor.offerFee || selectedDoctor.opdFee}</span>
                      ₹{promoData.finalAmount}
                    </span>
                  ) : `₹${selectedDoctor.offerFee || selectedDoctor.opdFee}`}
                </span>
              </div>
            </div>

            {/* Card nudge for non-members */}
            {!hasMembership && selectedDoctor && selectedDoctor.opdFee > (selectedDoctor.offerFee || selectedDoctor.opdFee) && (
              <div className="mb-4 bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center gap-3">
                <span className="text-2xl">💳</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-amber-800">Family Card activate karein!</p>
                  <p className="text-xs text-amber-700">Wallet se OPD book karein + family ko bhi add karein</p>
                </div>
                <button onClick={activateCard} disabled={activatingCard} className="text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-lg whitespace-nowrap disabled:opacity-70">
                  {activatingCard ? "..." : "₹249/yr →"}
                </button>
              </div>
            )}

            {/* Payment Mode */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-600 mb-2 block">{t("opd.selectPayMode", lang)}</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_MODES.map((p) => (
                  <button key={p.id} type="button" onClick={() => setPaymentMode(p.id)}
                    className={`py-3 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${
                      paymentMode === p.id
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-200 text-gray-600 hover:border-blue-300"
                    }`}>
                    <span>{p.icon}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Insurance Fields ── */}
            {paymentMode === "insurance" && (
              <div className="mb-5 bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                  🛡️ Insurance Details
                </p>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">
                    Policy Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={insurancePolicyNo}
                    onChange={(e) => setInsurancePolicyNo(e.target.value)}
                    placeholder="e.g. POL-123456789"
                    className="w-full border border-indigo-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">
                    Insurance Company <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={insurerName}
                    onChange={(e) => setInsurerName(e.target.value)}
                    placeholder="e.g. Star Health, HDFC ERGO, Niva Bupa..."
                    className="w-full border border-indigo-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">
                    TPA Name <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={tpaName}
                    onChange={(e) => setTpaName(e.target.value)}
                    placeholder="e.g. Medi Assist, Health India, Paramount..."
                    className="w-full border border-indigo-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white"
                  />
                </div>
                <p className="text-xs text-indigo-500">
                  ℹ️ Aapki insurance team 24h mein contact karegi cashless/reimbursement ke liye.
                </p>
              </div>
            )}

            {/* Promo Code */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-600 mb-2 block">🎟️ Promo Code (Optional)</label>
              {promoData ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-green-700">✅ {promoData.code} applied!</p>
                    <p className="text-xs text-green-600 mt-0.5">{promoData.message}</p>
                  </div>
                  <button onClick={() => { setPromoData(null); setPromoInput(""); setPromoError(""); }}
                    className="text-red-400 hover:text-red-600 text-sm font-bold px-2">✕</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                    placeholder="Code daalo (e.g. BRIMS50)"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 font-mono tracking-wide uppercase"
                    onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                  />
                  <button onClick={applyPromo} disabled={promoLoading || !promoInput.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                    {promoLoading ? "..." : "Apply"}
                  </button>
                </div>
              )}
              {promoError && <p className="text-red-500 text-xs mt-1.5">{promoError}</p>}
            </div>

            {/* Final Amount Summary */}
            {promoData && (
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 mb-4 space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Original fee</span>
                  <span>₹{selectedDoctor.offerFee || selectedDoctor.opdFee}</span>
                </div>
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Discount ({promoData.code})</span>
                  <span>− ₹{promoData.discount}</span>
                </div>
                <div className="flex justify-between font-bold text-blue-800 border-t border-blue-200 pt-1 mt-1">
                  <span>Final Amount</span>
                  <span>₹{promoData.finalAmount}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition">
                ← Wapas
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={submitting || !paymentMode}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {lang === "hi" ? "बुक हो रहा है..." : "Booking..."}</>
                ) : t("opd.confirmBtn", lang)}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Success ── */}
        {step === 4 && booking && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-green-600" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Booking Confirmed!</h2>
            <p className="text-gray-400 text-sm mb-5">Aapki OPD appointment book ho gayi</p>

            <div className="bg-blue-50 rounded-2xl p-4 text-left space-y-2.5 mb-5 border border-blue-100">
              <Row label="Booking ID" value={booking.bookingId} bold />
              <Row label="Doctor" value={selectedDoctor?.name} />
              <Row label="Specialization" value={selectedDoctor?.department} />
              <Row label="Date" value={new Date(booking.appointmentDate).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })} />
              <Row label="Time" value={booking.slot} />
              <Row label="Patient" value={booking.patientName} />
              <Row label="Fees" value={`₹${booking.amount}`} bold />
            </div>

            {/* Savings banner */}
            {selectedDoctor && selectedDoctor.opdFee > booking.amount && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-xs text-green-700 mb-3 text-left font-semibold">
                🎉 Aapne MRP ₹{selectedDoctor.opdFee} se ₹{selectedDoctor.opdFee - booking.amount} bachaye!
              </div>
            )}
            {!hasMembership && (
              <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-xs text-teal-700 mb-3 text-left flex items-center gap-2">
                <span>💳</span>
                <span>Family Card activate karein (₹249/yr) — Wallet se bookings karein aur puri family ko manage karein!</span>
                <button onClick={activateCard} disabled={activatingCard} className="ml-auto font-bold text-teal-600 whitespace-nowrap disabled:opacity-60">
                  {activatingCard ? "..." : "Activate →"}
                </button>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 mb-5 text-left">
              📱 Confirmation SMS +91 {booking.patientMobile} par bhej diya gaya hai
            </div>

            <div className="flex gap-3">
              <a href="/dashboard"
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition text-center">
                Dashboard
              </a>
              <a href="/my-bookings"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-bold text-sm transition text-center">
                Meri Bookings
              </a>
            </div>

            <button onClick={reset} className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600">
              + Naya Appointment Book Karein
            </button>
          </div>
        )}

      </div>
    </main>
  );
}

function Row({ label, value, bold }: { label: string; value?: string | number; bold?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-2 text-sm">
      <span className="text-gray-500 flex-shrink-0">{label}</span>
      <span className={`text-right ${bold ? "font-bold text-blue-800" : "text-gray-700"}`}>{value || "—"}</span>
    </div>
  );
}

export default function OPDBookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    }>
      <OPDBookingContent />
    </Suspense>
  );
}
