"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import BookingStageTimeline from "@/app/components/BookingStageTimeline";

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = "bookings" | "walkin" | "collections" | "profile" | "hospitals";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700 border-amber-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};
const TYPE_COLORS: Record<string, string> = {
  OPD:"bg-teal-100 text-teal-700", Consultation:"bg-purple-100 text-purple-700",
  Lab:"bg-orange-100 text-orange-700", Surgery:"bg-rose-100 text-rose-700", IPD:"bg-indigo-100 text-indigo-700",
};
const TYPE_ICON: Record<string, string>  = { OPD:"🩺", Lab:"🧪", Surgery:"🔬", Consultation:"💻", IPD:"🛏️" };
const PM_LABEL: Record<string, string>   = { counter:"Counter/Cash", online:"Online/UPI", wallet:"Brims Wallet", insurance:"Insurance" };
const TYPE_COLOR_HEX: Record<string,string> = { OPD:"#0d9488", Lab:"#f59e0b", Surgery:"#9333ea", Consultation:"#2563eb", IPD:"#dc2626" };

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}
function fmtDateTime(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" });
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold ${ok ? "bg-green-600" : "bg-red-600"} text-white`}>
      {msg}
    </div>
  );
}

// ── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ booking, onClose, onSuccess }: { booking: any; onClose: () => void; onSuccess: (b: any) => void }) {
  const [amount, setAmount] = useState(String(booking.amount || ""));
  const [mode, setMode]     = useState("counter");
  const [saving, setSaving] = useState(false);

  async function handlePay() {
    setSaving(true);
    try {
      const res  = await fetch("/api/staff/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.bookingId, paymentStatus: "paid", paymentMode: mode, amount: parseFloat(amount) || 0, status: "completed" }),
      });
      const data = await res.json();
      if (data.success) onSuccess(data.booking);
      else alert(data.message);
    } finally { setSaving(false); }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-lg">💰 Payment Receive Karein</h3>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-sm">✕</button>
          </div>
          <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
            <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide mb-1">Booking</p>
            <p className="font-bold text-gray-800">{booking.patientName}</p>
            <p className="text-xs text-gray-500">{booking.bookingId} · {booking.type}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Amount (₹)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Payment Mode</label>
            <div className="grid grid-cols-2 gap-2">
              {[{value:"counter",icon:"🏢",label:"Counter/Cash"},{value:"online",icon:"📱",label:"Online/UPI"},{value:"wallet",icon:"💼",label:"Brims Wallet"},{value:"insurance",icon:"🛡️",label:"Insurance"}].map((m) => (
                <button key={m.value} onClick={() => setMode(m.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition ${mode === m.value ? "bg-orange-50 border-orange-300 text-orange-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  <span>{m.icon}</span> {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold">Ruko</button>
            <button onClick={handlePay} disabled={saving || !amount}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-bold transition disabled:opacity-50">
              {saving ? "..." : "✓ Paid Karo"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Bill Print Modal ──────────────────────────────────────────────────────────
function BillModal({ booking, staffName, onClose }: { booking: any; staffName: string; onClose: () => void }) {
  const now = new Date().toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
  const pMode = PM_LABEL[booking.paymentMode] || booking.paymentMode || "Counter/Cash";

  function handlePrint() {
    const el = document.getElementById("staff-bill");
    if (!el) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Bill - ${booking.bookingId}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:20px;color:#111;max-width:400px;margin:0 auto}
      h2{color:#0d9488;margin-bottom:4px} .sub{color:#888;font-size:12px;margin-bottom:16px}
      .divider{border-top:1px dashed #ddd;margin:12px 0}
      .row{display:flex;justify-content:space-between;margin:6px 0;font-size:13px}
      .label{color:#666} .value{font-weight:600}
      .total-row{font-size:16px;font-weight:bold;color:#0d9488}
      .paid-stamp{background:#16a34a;color:#fff;display:inline-block;padding:4px 16px;border-radius:20px;font-weight:bold;font-size:13px;margin-top:8px}
      .footer{font-size:11px;color:#aaa;text-align:center;margin-top:20px}
    </style></head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.print();
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
          <div className="bg-teal-600 px-5 py-4 flex items-center justify-between">
            <p className="text-white font-bold">🧾 Bill / Receipt</p>
            <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
          </div>
          <div className="p-5">
            <div id="staff-bill">
              <h2>Brims Hospitals</h2>
              <p className="sub">Making Healthcare Affordable · Patna, Bihar</p>
              <div className="divider" />
              <div className="row"><span className="label">Bill No.</span><span className="value">{booking.bookingId}</span></div>
              <div className="row"><span className="label">Date</span><span className="value">{now}</span></div>
              <div className="row"><span className="label">Staff</span><span className="value">{staffName}</span></div>
              <div className="divider" />
              <div className="row"><span className="label">Patient</span><span className="value">{booking.patientName}</span></div>
              {booking.patientMobile && <div className="row"><span className="label">Mobile</span><span className="value">{booking.patientMobile}</span></div>}
              {booking.patientAge    && <div className="row"><span className="label">Age</span><span className="value">{booking.patientAge} yrs</span></div>}
              <div className="divider" />
              <div className="row"><span className="label">Service</span><span className="value">{booking.type} Booking</span></div>
              {booking.appointmentDate && <div className="row"><span className="label">Appointment</span><span className="value">{fmtDate(booking.appointmentDate)}{booking.slot ? ` · ${booking.slot}` : ""}</span></div>}
              {booking.symptoms && <div className="row"><span className="label">Symptoms</span><span className="value">{booking.symptoms}</span></div>}
              <div className="divider" />
              <div className="row total-row"><span>Total Amount</span><span>₹{booking.amount || 0}</span></div>
              <div className="row"><span className="label">Payment Mode</span><span className="value">{pMode}</span></div>
              {booking.paymentStatus === "paid" && <p className="paid-stamp">✓ PAID</p>}
              <p className="footer">Thank you for choosing Brims Hospitals<br/>Helpline: 112 | Patna, Bihar</p>
            </div>
            <button onClick={handlePrint}
              className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
              🖨️ Print / Save PDF
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Walk-in Booking Tab ───────────────────────────────────────────────────────
function WalkInTab({ staffName, onToast }: { staffName: string; onToast: (msg: string, ok: boolean) => void }) {
  const router = useRouter();

  // Patient search state
  const [searchMobile, setSearchMobile] = useState("");
  const [searching, setSearching]       = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showNewRegForm, setShowNewRegForm] = useState(false);

  // New patient quick registration
  const [newPatient, setNewPatient] = useState({ name: "", age: "", gender: "male" });

  // Booking form state
  const [form, setForm] = useState({
    patientName: "", patientMobile: "", patientAge: "", patientGender: "male",
    type: "OPD", amount: "", paymentMode: "counter", paymentStatus: "pending",
    appointmentDate: new Date().toISOString().split("T")[0],
    slot: "", symptoms: "", doctorName: "",
  });
  const [saving, setSaving]   = useState(false);
  const [created, setCreated] = useState<any>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const setF = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSearch() {
    if (searchMobile.length !== 10) { onToast("10-digit mobile number daalo", false); return; }
    setSearching(true);
    setSearchResult(null);
    setSelectedMember(null);
    setShowBookingForm(false);
    try {
      const res  = await fetch(`/api/staff/search-patient?mobile=${searchMobile}`);
      const data = await res.json();
      if (data.success) {
        setSearchResult(data);
        if (data.found) {
          onToast(`✓ ${data.user.name} found`, true);
        } else {
          onToast("Patient registered nahi hai", false);
        }
      } else {
        onToast(data.message || "Search failed", false);
      }
    } catch { onToast("Network error", false); }
    finally { setSearching(false); }
  }

  function selectMember(member: any, mobile: string) {
    setSelectedMember(member);
    setForm((p) => ({
      ...p,
      patientName:   member.name,
      patientMobile: mobile,
      patientAge:    String(member.age || ""),
      patientGender: member.gender || "male",
    }));
    setShowBookingForm(true);
  }

  function proceedWithNewPatient() {
    if (!newPatient.name) { onToast("Patient naam zaruri hai", false); return; }
    setForm((p) => ({
      ...p,
      patientName:   newPatient.name,
      patientMobile: searchMobile,
      patientAge:    newPatient.age,
      patientGender: newPatient.gender,
    }));
    setShowBookingForm(true);
    setShowNewRegForm(false);
  }

  function resetAll() {
    setSearchMobile(""); setSearchResult(null); setSelectedMember(null);
    setShowBookingForm(false); setShowNewRegForm(false); setCreated(null);
    setNewPatient({ name: "", age: "", gender: "male" });
    setForm({
      patientName:"", patientMobile:"", patientAge:"", patientGender:"male",
      type:"OPD", amount:"", paymentMode:"counter", paymentStatus:"pending",
      appointmentDate: new Date().toISOString().split("T")[0],
      slot:"", symptoms:"", doctorName:"",
    });
  }

  async function handleSubmit() {
    if (!form.patientName || !form.patientMobile || form.patientMobile.length !== 10) {
      onToast("Patient naam aur 10-digit mobile zaruri hai", false); return;
    }
    setSaving(true);
    try {
      const res  = await fetch("/api/staff/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) || 0 }),
      });
      const data = await res.json();
      if (data.success) { setCreated(data); onToast(`✓ Booking create ho gayi — ${data.bookingId}`, true); }
      else onToast(data.message || "Error", false);
    } finally { setSaving(false); }
  }

  // ── Success screen ──
  if (created) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-2xl mx-auto">✓</div>
          <div>
            <p className="font-bold text-green-700 text-xl">Booking Successful!</p>
            <p className="text-green-600 font-mono text-lg mt-1">{created.bookingId}</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-left space-y-2 border border-green-100">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Patient</span><span className="font-semibold">{form.patientName}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Mobile</span><span className="font-semibold">{form.patientMobile}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Type</span><span className="font-semibold">{form.type}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Amount</span><span className="font-bold text-teal-700">₹{form.amount || 0}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Payment</span><span className="font-semibold">{PM_LABEL[form.paymentMode]}</span></div>
          </div>
          <div className="flex gap-3">
            <button onClick={resetAll} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition">+ Naya Booking</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-800">🚶 Walk-in Booking</h2>
        <p className="text-xs text-gray-400 mt-0.5">Counter pe aaye patient ki booking create karein</p>
      </div>

      {/* Step 1 — Patient Search */}
      {!showBookingForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="text-xs font-bold text-orange-600 uppercase tracking-wide">Step 1 — Patient Verify Karein</p>

          {/* Search bar */}
          <div className="flex gap-2">
            <input type="tel" maxLength={10} value={searchMobile}
              onChange={(e) => { setSearchMobile(e.target.value.replace(/\D/g, "")); setSearchResult(null); setShowNewRegForm(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Mobile number (10 digits)"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <button onClick={handleSearch} disabled={searching || searchMobile.length !== 10}
              className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50">
              {searching ? "..." : "🔍 Search"}
            </button>
          </div>

          {/* ── FOUND: show members ── */}
          {searchResult?.found && (
            <div className="bg-green-50 rounded-xl border border-green-200 p-4 space-y-3">
              <p className="text-xs font-bold text-green-700">✓ Patient Found — Kaun book karega?</p>

              {/* Primary member */}
              <button onClick={() => selectMember(searchResult.user, searchResult.user.mobile)}
                className="w-full flex items-center gap-3 p-3 bg-white border-2 border-green-300 rounded-xl hover:bg-green-50 transition text-left">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 text-white font-bold flex items-center justify-center shrink-0">
                  {searchResult.user.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800">{searchResult.user.name}</p>
                  <p className="text-xs text-gray-500">{searchResult.user.mobile} · {searchResult.user.age || "—"} yrs · Primary Member</p>
                </div>
                <span className="text-green-500 text-lg shrink-0">→</span>
              </button>

              {/* Family members */}
              {(searchResult.familyMembers || []).map((m: any) => (
                <button key={m.id} onClick={() => selectMember(m, searchResult.user.mobile)}
                  className="w-full flex items-center gap-3 p-3 bg-white border border-orange-200 rounded-xl hover:bg-orange-50 transition text-left">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 text-white font-bold flex items-center justify-center shrink-0">
                    {m.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800">{m.name}</p>
                    <p className="text-xs text-gray-500">{m.age || "—"} yrs · {m.gender} · {m.relationship}</p>
                  </div>
                  <span className="text-orange-400 text-lg shrink-0">→</span>
                </button>
              ))}
            </div>
          )}

          {/* ── NOT FOUND: register options ── */}
          {searchResult?.found === false && (
            <div className="space-y-3">
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                <p className="text-sm font-bold text-amber-700 mb-1">❌ Patient registered nahi hai</p>
                <p className="text-xs text-gray-600">Mobile: <span className="font-mono font-semibold">{searchMobile}</span></p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Option 1: Quick walk-in */}
                <button onClick={() => setShowNewRegForm(true)}
                  className="flex flex-col items-center gap-2 p-4 bg-orange-50 border-2 border-orange-200 rounded-xl hover:bg-orange-100 transition text-center">
                  <span className="text-2xl">⚡</span>
                  <p className="text-sm font-bold text-orange-700">Quick Walk-in</p>
                  <p className="text-xs text-gray-500">Sirf naam daalo, booking karo</p>
                </button>
                {/* Option 2: Full registration */}
                <button onClick={() => router.push(`/register?mobile=${searchMobile}&from=staff`)}
                  className="flex flex-col items-center gap-2 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 transition text-center">
                  <span className="text-2xl">📋</span>
                  <p className="text-sm font-bold text-blue-700">Full Registration</p>
                  <p className="text-xs text-gray-500">Poori profile banao</p>
                </button>
              </div>

              {/* Quick form */}
              {showNewRegForm && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Quick Patient Details</p>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Patient Name *</label>
                    <input value={newPatient.name} onChange={(e) => setNewPatient((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Full naam"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Age</label>
                      <input type="number" value={newPatient.age} onChange={(e) => setNewPatient((p) => ({ ...p, age: e.target.value }))}
                        placeholder="Years"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Gender</label>
                      <select value={newPatient.gender} onChange={(e) => setNewPatient((p) => ({ ...p, gender: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={proceedWithNewPatient}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-sm transition">
                    → Booking Form Kholo
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 2 — Booking Form */}
      {showBookingForm && (
        <>
          {/* Selected patient summary */}
          <div className="bg-teal-50 rounded-2xl border border-teal-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-500 text-white font-bold flex items-center justify-center">
                {form.patientName?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{form.patientName}</p>
                <p className="text-xs text-gray-500">📱 {form.patientMobile} {form.patientAge ? `· ${form.patientAge} yrs` : ""}</p>
              </div>
            </div>
            <button onClick={resetAll} className="text-xs text-orange-600 font-semibold px-3 py-1 rounded-lg hover:bg-orange-50">
              ← Change
            </button>
          </div>

          {/* Booking Details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-2">Step 2 — Booking Details</p>

            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">Service Type *</label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {["OPD","Lab","Surgery","Consultation","IPD"].map((t) => (
                  <button key={t} onClick={() => setF("type", t)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition ${form.type === t ? "bg-orange-50 border-orange-300 text-orange-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                    <span>{TYPE_ICON[t]}</span> {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Date</label>
                <input type="date" value={form.appointmentDate} onChange={(e) => setF("appointmentDate", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Time Slot</label>
                <input value={form.slot} onChange={(e) => setF("slot", e.target.value)} placeholder="10:00 AM"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 block mb-1">Doctor Name (optional)</label>
                <input value={form.doctorName} onChange={(e) => setF("doctorName", e.target.value)} placeholder="Dr. naam"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 block mb-1">Symptoms / Notes</label>
                <textarea value={form.symptoms} onChange={(e) => setF("symptoms", e.target.value)} rows={2} placeholder="Symptoms..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-2">Payment</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Amount (₹)</label>
                <input type="number" value={form.amount} onChange={(e) => setF("amount", e.target.value)} placeholder="0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Status</label>
                <div className="flex gap-2 mt-1">
                  {[{v:"pending",l:"Pending"},{v:"paid",l:"✓ Paid"}].map((s) => (
                    <button key={s.v} onClick={() => setF("paymentStatus", s.v)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${form.paymentStatus === s.v ? (s.v==="paid"?"bg-green-50 border-green-300 text-green-700":"bg-amber-50 border-amber-300 text-amber-700") : "border-gray-200 text-gray-500"}`}>
                      {s.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">Payment Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {[{value:"counter",icon:"🏢",label:"Counter/Cash"},{value:"online",icon:"📱",label:"Online/UPI"},{value:"wallet",icon:"💼",label:"Brims Wallet"},{value:"insurance",icon:"🛡️",label:"Insurance"}].map((m) => (
                  <button key={m.value} onClick={() => setF("paymentMode", m.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition ${form.paymentMode === m.value ? "bg-orange-50 border-orange-300 text-orange-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                    <span>{m.icon}</span> {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={saving}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl transition disabled:opacity-50 text-base shadow-lg shadow-orange-200 flex items-center justify-center gap-2">
            {saving ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</> : "✓ Booking Create Karein"}
          </button>
        </>
      )}
    </div>
  );
}

// ── Collections Tab ───────────────────────────────────────────────────────────
function CollectionsTab() {
  const [range, setRange]     = useState("today");
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/staff/collections?range=${range}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d); })
      .finally(() => setLoading(false));
  }, [range]);

  const gross   = data?.summary?.total  || 0;
  const refunds = data?.summary?.refunds || 0;
  const net     = gross - refunds;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">💰 Collections</h2>
          <p className="text-xs text-gray-400">Real-time aaj ka hisaab</p>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1">
          {[{v:"today",l:"Aaj"},{v:"week",l:"Week"},{v:"month",l:"Month"},{v:"all",l:"All Time"}].map((r) => (
            <button key={r.v} onClick={() => setRange(r.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${range === r.v ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"}`}>
              {r.l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse"/>)}</div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-md col-span-1">
              <p className="text-sm opacity-80 mb-1">💰 Gross Collection</p>
              <p className="text-3xl font-extrabold">₹{gross.toLocaleString()}</p>
              <p className="text-xs opacity-70 mt-1">{data?.summary?.count || 0} transactions</p>
            </div>
            <div className={`rounded-2xl p-4 text-white shadow-md col-span-1 ${refunds > 0 ? "bg-gradient-to-br from-blue-500 to-blue-600" : "bg-gradient-to-br from-teal-500 to-teal-600"}`}>
              <p className="text-sm opacity-80 mb-1">🧾 Net Collection</p>
              <p className="text-3xl font-extrabold">₹{net.toLocaleString()}</p>
              {refunds > 0 && <p className="text-xs opacity-70 mt-1">- ₹{refunds.toLocaleString()} refunds</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-4 text-white shadow-md">
              <p className="text-sm opacity-80 mb-1">📋 Bookings</p>
              <p className="text-2xl font-extrabold">{data?.summary?.count || 0}</p>
              <p className="text-xs opacity-70 mt-1">Paid</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-md">
              <p className="text-sm opacity-80 mb-1">📊 Avg per Bill</p>
              <p className="text-2xl font-extrabold">₹{data?.summary?.avgAmt || 0}</p>
              <p className="text-xs opacity-70 mt-1">Per transaction</p>
            </div>
          </div>

          {/* Service breakdown */}
          {(data?.byType || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="font-bold text-gray-800 mb-3 text-sm">📊 Service-wise</p>
              <div className="space-y-2.5">
                {(data.byType || []).map((t: any) => {
                  const maxV = Math.max(...(data.byType || []).map((x: any) => x.total), 1);
                  const pct  = Math.round((t.total / maxV) * 100);
                  return (
                    <div key={t._id} className="flex items-center gap-3">
                      <span className="text-sm w-24 shrink-0 font-medium">{TYPE_ICON[t._id]} {t._id}</span>
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: TYPE_COLOR_HEX[t._id] || "#6b7280" }} />
                      </div>
                      <span className="text-xs font-bold text-gray-700 w-20 text-right">₹{t.total.toLocaleString()}</span>
                      <span className="text-xs text-gray-400 w-8 text-right">{t.count}x</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment mode breakdown */}
          {(data?.byMode || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="font-bold text-gray-800 mb-3 text-sm">💳 Payment Mode</p>
              <div className="grid grid-cols-2 gap-2">
                {(data.byMode || []).map((m: any) => {
                  const cls: Record<string,string> = { counter:"bg-amber-50 text-amber-700 border-amber-200", online:"bg-blue-50 text-blue-700 border-blue-200", wallet:"bg-teal-50 text-teal-700 border-teal-200", insurance:"bg-purple-50 text-purple-700 border-purple-200" };
                  const icons: Record<string,string> = { counter:"🏢", online:"📱", wallet:"💼", insurance:"🛡️" };
                  return (
                    <div key={m._id} className={`${cls[m._id] || "bg-gray-50 text-gray-700 border-gray-100"} border rounded-xl p-3`}>
                      <p className="text-base mb-1">{icons[m._id] || "💳"}</p>
                      <p className="font-bold text-sm">₹{m.total.toLocaleString()}</p>
                      <p className="text-xs">{PM_LABEL[m._id] || m._id} · {m.count}x</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent collections */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="font-bold text-gray-800 mb-3 text-sm">🕐 Recent Collections</p>
            {(data?.recent || []).length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">Koi collection nahi {range === "today" ? "aaj" : ""}</p>
            ) : (
              <div className="space-y-2">
                {(data.recent || []).map((b: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${TYPE_COLORS[b.type] || "bg-gray-100 text-gray-600"}`}>{TYPE_ICON[b.type]} {b.type}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{b.patientName}</p>
                        <p className="text-xs text-gray-400 font-mono">{b.bookingId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-700">₹{b.amount}</p>
                      <p className="text-xs text-gray-400">{fmtDateTime(b.collectedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Staff Profile Tab ─────────────────────────────────────────────────────────
function StaffProfileTab({ onToast }: { onToast: (msg: string, ok: boolean) => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ name:"", age:"", gender:"male", email:"", currentPassword:"", newPassword:"", confirmPassword:"" });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch("/api/staff/profile");
        const data = await res.json();
        if (data.success) {
          setProfile(data.staff);
          setForm({ name: data.staff.name || "", age: String(data.staff.age || ""), gender: data.staff.gender || "male", email: data.staff.email || "", currentPassword:"", newPassword:"", confirmPassword:"" });
        }
      } finally { setLoading(false); }
    })();
  }, []);

  async function handlePhotoUpload(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res  = await fetch("/api/upload-photo", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) {
      const upd = await fetch("/api/staff/profile", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ photo: data.url }) });
      const ud  = await upd.json();
      if (ud.success) { setProfile((p: any) => ({ ...p, photo: data.url })); onToast("Photo updated ✓", true); }
    } else { onToast("Photo upload failed", false); }
  }

  async function handleSave() {
    if (!form.name) { onToast("Name zaruri hai", false); return; }
    if (form.newPassword && form.newPassword !== form.confirmPassword) { onToast("Passwords match nahi kar rahe", false); return; }
    setSaving(true);
    try {
      const payload: any = { name: form.name, age: form.age, gender: form.gender, email: form.email };
      if (form.newPassword) { payload.password = form.newPassword; payload.currentPassword = form.currentPassword; }
      const res  = await fetch("/api/staff/profile", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        setProfile(data.staff);
        setEditing(false);
        setForm((p) => ({ ...p, currentPassword:"", newPassword:"", confirmPassword:"" }));
        onToast("Profile updated ✓", true);
      } else { onToast(data.message || "Update failed", false); }
    } finally { setSaving(false); }
  }

  if (loading) return <div className="max-w-lg mx-auto space-y-4">{[1,2,3].map((i) => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />)}</div>;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-800">👤 My Profile</h2>
        <p className="text-xs text-gray-400 mt-0.5">Apni photo aur details update karein</p>
      </div>

      {/* Photo */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Profile Photo</p>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-3xl font-bold shrink-0 overflow-hidden">
            {profile?.photo ? <img src={profile.photo} alt="Staff" className="w-full h-full object-cover" /> : (profile?.name?.charAt(0) || "S")}
          </div>
          <label className="flex-1 px-4 py-3 border-2 border-dashed border-orange-200 rounded-xl text-center cursor-pointer hover:bg-orange-50 transition">
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])} className="hidden" />
            <p className="text-sm font-semibold text-orange-600">📸 Photo Upload Karein</p>
            <p className="text-xs text-gray-400 mt-0.5">Camera ya Gallery se</p>
          </label>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Personal Details</p>
          {!editing && <button onClick={() => setEditing(true)} className="text-xs text-orange-600 font-semibold hover:underline">✏️ Edit</button>}
        </div>

        {!editing ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label:"Name",   value: profile?.name },
              { label:"Age",    value: profile?.age  ? `${profile.age} yrs` : "—" },
              { label:"Gender", value: profile?.gender || "—" },
              { label:"Mobile", value: profile?.mobile || "—" },
              { label:"Email",  value: profile?.email  || "—", span: 2 },
            ].map(({ label, value, span }) => (
              <div key={label} className={span === 2 ? "col-span-2" : ""}>
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className="font-semibold text-gray-800 capitalize">{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 block mb-1">Name *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Age</label>
              <input type="number" value={form.age} onChange={(e) => set("age", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Gender</label>
              <select value={form.gender} onChange={(e) => set("gender", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 block mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="Optional"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>
        )}
      </div>

      {/* Login / Password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Login Details</p>
        <div>
          <p className="text-xs text-gray-500 mb-1">Professional ID (login ke liye)</p>
          <p className="font-semibold text-gray-800 font-mono text-sm bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
            {profile?.professionalId || profile?.email || profile?.mobile}
          </p>
        </div>

        {editing && (
          <div className="pt-3 border-t border-gray-100 space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">🔐 Password Change (optional)</p>
            {[
              { k:"currentPassword", label:"Current Password", ph:"Current password" },
              { k:"newPassword",     label:"New Password",     ph:"Min 6 characters" },
              { k:"confirmPassword", label:"Confirm Password", ph:"Repeat new password" },
            ].map(({ k, label, ph }) => (
              <div key={k}>
                <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
                <input type="password" value={(form as any)[k]} onChange={(e) => set(k, e.target.value)} placeholder={ph}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save / Cancel */}
      {editing && (
        <div className="flex gap-3">
          <button onClick={() => { setEditing(false); setForm((p) => ({ ...p, currentPassword:"", newPassword:"", confirmPassword:"" })); }}
            className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── STAFF HOSPITALS TAB ───────────────────────────────────────────────────────
function StaffHospitalsTab({ assignedHospitalIds, canOnboard }: { assignedHospitalIds: string[]; canOnboard: boolean }) {
  const [hospitals, setHospitals]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [managing, setManaging]     = useState<{ _id: string; name: string } | null>(null);
  const [subTab, setSubTab]         = useState<"doctors" | "labtests" | "packages">("doctors");
  const [items, setItems]           = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [modal, setModal]           = useState<"addDoctor" | "editDoctor" | "addLab" | "editLab" | "addPkg" | "editPkg" | null>(null);
  const [editItem, setEditItem]     = useState<any>(null);
  const [toast, setToast]           = useState("");

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res  = await fetch("/api/admin/hospitals?verified=true&page=1&limit=100");
      const data = await res.json();
      if (data.success) {
        const all: any[] = data.hospitals || [];
        // Filter to only assigned hospitals (if list is non-empty)
        const filtered = assignedHospitalIds.length > 0
          ? all.filter((h: any) => assignedHospitalIds.includes(h._id))
          : all;
        setHospitals(filtered);
      }
      setLoading(false);
    }
    load();
  }, [assignedHospitalIds]);

  async function loadItems(hospitalId: string, tab: string) {
    setLoadingItems(true);
    const res  = await fetch(`/api/hospital/overview?hospitalId=${hospitalId}`);
    const data = await res.json();
    if (data.success) {
      if (tab === "doctors")   setItems(data.doctors        || []);
      if (tab === "labtests")  setItems(data.labTests        || []);
      if (tab === "packages")  setItems(data.surgeryPackages || []);
    }
    setLoadingItems(false);
  }

  function openManage(h: { _id: string; name: string }) {
    setManaging(h);
    setSubTab("doctors");
    loadItems(h._id, "doctors");
  }

  async function mutate(url: string, method: string, body: any) {
    const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    return data;
  }

  async function handleDelete(itemId: string, type: string) {
    if (!managing) return;
    if (!confirm("Delete karna chahte hain?")) return;
    let url = ""; let key = "";
    if (type === "doctor")  { url = "/api/hospital/doctors";           key = "doctorId"; }
    if (type === "lab")     { url = "/api/hospital/lab-tests";         key = "testId";   }
    if (type === "package") { url = "/api/hospital/surgery-packages";  key = "packageId"; }
    const data = await mutate(url, "DELETE", { [key]: itemId, hospitalId: managing._id });
    if (data.success) { showToast("Delete ho gaya!"); loadItems(managing._id, subTab); }
    else showToast("Error: " + data.message);
  }

  async function handleToggle(item: any, type: string) {
    if (!managing) return;
    let url = ""; let idKey = "";
    if (type === "doctor")  { url = "/api/hospital/doctors";          idKey = "doctorId";  }
    if (type === "lab")     { url = "/api/hospital/lab-tests";        idKey = "testId";    }
    if (type === "package") { url = "/api/hospital/surgery-packages"; idKey = "packageId"; }
    const data = await mutate(url, "PATCH", { [idKey]: item._id, hospitalId: managing._id, isActive: !item.isActive });
    if (data.success) { showToast(item.isActive ? "On Hold kiya" : "Active kiya"); loadItems(managing._id, subTab); }
    else showToast("Error: " + data.message);
  }

  if (!managing) {
    return (
      <div className="space-y-4">
        {toast && <div className="fixed top-4 right-4 z-50 bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg">{toast}</div>}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-bold text-gray-800">🏥 Mera Hospitals</h2>
          {canOnboard && (
            <a href="/hospital-onboarding" className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">+ Hospital Onboard Karein</a>
          )}
        </div>
        {loading ? (
          <div className="flex justify-center py-14"><div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" /></div>
        ) : hospitals.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <p className="text-4xl mb-3">🏥</p>
            <p className="text-sm">Koi hospital assign nahi hai</p>
            <p className="text-xs mt-1">Admin se contact karein hospital assign karwane ke liye</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {hospitals.map((h: any) => (
              <div key={h._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-gray-800 truncate">{h.name}</p>
                  <p className="text-xs text-gray-500">{h.hospitalId} · {h.address?.district}, {h.address?.city}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{h.mobile || h.email || ""}</p>
                </div>
                <button onClick={() => openManage({ _id: h._id, name: h.name })}
                  className="flex-shrink-0 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
                  🛠 Manage
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Manage panel ──
  const SUB_TABS = [
    { key: "doctors" as const,  icon: "👨‍⚕️", label: "Doctors"  },
    { key: "labtests" as const, icon: "🧪",   label: "Lab Tests" },
    { key: "packages" as const, icon: "🔬",   label: "Surgery"  },
  ];

  return (
    <div className="space-y-4">
      {toast && <div className="fixed top-4 right-4 z-50 bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg">{toast}</div>}

      {/* Manage Panel Header */}
      <div className="bg-gradient-to-r from-purple-700 to-purple-600 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-purple-200 font-medium uppercase tracking-wide">Hospital Management</p>
          <h2 className="text-white font-bold text-lg mt-0.5">{managing.name}</h2>
        </div>
        <button onClick={() => setManaging(null)} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">← Back</button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2">
        {SUB_TABS.map((t) => (
          <button key={t.key} onClick={() => { setSubTab(t.key); loadItems(managing._id, t.key); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${subTab === t.key ? "bg-purple-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-purple-400"}`}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
        <button onClick={() => { setModal(subTab === "doctors" ? "addDoctor" : subTab === "labtests" ? "addLab" : "addPkg"); }}
          className="ml-auto bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
          + Add {subTab === "doctors" ? "Doctor" : subTab === "labtests" ? "Lab Test" : "Package"}
        </button>
      </div>

      {/* Items grid */}
      {loadingItems ? (
        <div className="flex justify-center py-14"><div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-14 text-gray-400"><p className="text-4xl mb-3">{subTab === "doctors" ? "👨‍⚕️" : subTab === "labtests" ? "🧪" : "🔬"}</p><p className="text-sm">Koi {subTab === "doctors" ? "doctor" : subTab === "labtests" ? "lab test" : "surgery package"} nahi mila</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((item: any) => {
            const isDoc = subTab === "doctors";
            const isLab = subTab === "labtests";
            const itemType = isDoc ? "doctor" : isLab ? "lab" : "package";
            return (
              <div key={item._id} className={`bg-white rounded-2xl border ${item.isActive ? "border-gray-100" : "border-red-100 opacity-60"} shadow-sm p-4`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 truncate">{item.name}</p>
                    {isDoc && <p className="text-xs text-gray-500">{item.department} · {item.speciality || ""}</p>}
                    {isDoc && <p className="text-sm font-semibold text-teal-700 mt-1">₹{item.opdFee} OPD</p>}
                    {!isDoc && <p className="text-sm font-semibold text-teal-700 mt-1">₹{item.offerPrice} <span className="text-xs text-gray-400 line-through">₹{item.mrp}</span></p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${item.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {item.isActive ? "Active" : "On Hold"}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleToggle(item, itemType)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition ${item.isActive ? "border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100" : "border-green-300 text-green-700 bg-green-50 hover:bg-green-100"}`}>
                    {item.isActive ? "On Hold" : "Activate"}
                  </button>
                  <button onClick={() => { setEditItem(item); setModal(isDoc ? "editDoctor" : isLab ? "editLab" : "editPkg"); }}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition">
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleDelete(item._id, itemType)}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition">
                    🗑 Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inline Add/Edit Modals — reuse same forms as HospitalManagePanel */}
      {(modal === "addDoctor" || modal === "editDoctor") && (
        <StaffDoctorModal
          hospitalId={managing._id}
          doctor={modal === "editDoctor" ? editItem : undefined}
          onClose={() => { setModal(null); setEditItem(null); }}
          onSaved={() => { setModal(null); setEditItem(null); loadItems(managing._id, "doctors"); showToast(modal === "editDoctor" ? "Doctor updated!" : "Doctor added!"); }}
        />
      )}
      {(modal === "addLab" || modal === "editLab") && (
        <StaffLabModal
          hospitalId={managing._id}
          labTest={modal === "editLab" ? editItem : undefined}
          onClose={() => { setModal(null); setEditItem(null); }}
          onSaved={() => { setModal(null); setEditItem(null); loadItems(managing._id, "labtests"); showToast(modal === "editLab" ? "Lab test updated!" : "Lab test added!"); }}
        />
      )}
      {(modal === "addPkg" || modal === "editPkg") && (
        <StaffSurgeryModal
          hospitalId={managing._id}
          pkg={modal === "editPkg" ? editItem : undefined}
          onClose={() => { setModal(null); setEditItem(null); }}
          onSaved={() => { setModal(null); setEditItem(null); loadItems(managing._id, "packages"); showToast(modal === "editPkg" ? "Package updated!" : "Package added!"); }}
        />
      )}
    </div>
  );
}

// ── Surgery Package constants (shared with admin modal) ───────────────────────
const S_SUR_CAT = ["General Surgery","Orthopedic","Cardiac","Neuro Surgery","Gynecology","Urology","Oncology","Ophthalmology","ENT","Dental","Plastic Surgery","Other"];
const S_SURGERY_BY_DEPT: Record<string, string[]> = {
  "General Surgery":  ["Appendectomy (Appendix Removal)","Laparoscopic Hernia Repair","Inguinal Hernia Repair","Cholecystectomy (Gallbladder Removal)","Hemorrhoidectomy (Piles)","Fistula-in-Ano Surgery","Thyroidectomy","Varicose Vein Surgery","Pilonidal Sinus Surgery","Adult Circumcision","Lipoma Removal","Umbilical Hernia Repair"],
  "Orthopedic":       ["Total Knee Replacement (TKR)","Total Hip Replacement (THR)","Lumbar Disc Surgery","ACL Reconstruction","Fracture Fixation (ORIF)","Shoulder Arthroscopy","Spine Decompression","Bunion Surgery","Carpal Tunnel Release"],
  "Cardiac":          ["Coronary Artery Bypass (CABG)","Heart Valve Replacement","Pacemaker Implant","ASD/VSD Closure","Coronary Angioplasty (PTCA)"],
  "Neuro Surgery":    ["Brain Tumor Surgery","Lumbar Disc Surgery","Hydrocephalus Shunt","Cervical Disc Surgery","Spine Decompression"],
  "Gynecology":       ["Hysterectomy (Uterus Removal)","Laparoscopic Myomectomy","Ovarian Cystectomy","D&C (Dilation & Curettage)","Caesarean Section (C-Section)","Tubal Ligation","Endometriosis Surgery"],
  "Urology":          ["Kidney Stone (PCNL)","Kidney Stone (URSL)","Prostate Surgery (TURP)","Cystoscopy","Vasectomy","Ureteroscopy (URS)","Nephrectomy"],
  "Oncology":         ["Breast Cancer Surgery","Colorectal Cancer Surgery","Lung Cancer Surgery","Thyroid Cancer Surgery","Oral Cancer Surgery"],
  "Ophthalmology":    ["Cataract Surgery (Phaco)","LASIK Eye Surgery","Pterygium Surgery","Glaucoma Surgery","Retinal Detachment Repair","DCR Surgery"],
  "ENT":              ["Tonsillectomy","Adenoidectomy","Septoplasty","FESS (Sinus Surgery)","Tympanoplasty (Ear Drum Repair)","Nasal Polyp Removal"],
  "Dental":           ["Wisdom Tooth Removal","Dental Implant","Jaw Surgery","Cleft Lip/Palate Surgery","Root Canal Treatment (RCT)"],
  "Plastic Surgery":  ["Rhinoplasty (Nose Job)","Liposuction","Breast Augmentation","Breast Reduction","Tummy Tuck","Scar Revision","Burn Grafting"],
  "Other":            [],
};
const S_STD_INCLUSIONS = ["Pre-op Tests","Surgery","Anaesthesia","ICU/HDU (if needed)","Hospital Stay","Medicines","Post-op Dressing","Light Diet Meals","Ghar se Pickup","Ghar Drop","Post-surgery Care","Follow-up Consultation(s)","Nursing Care","Blood Transfusion (if needed)"];
const S_PRE_TESTS = ["Blood Test (CBC)","LFT (Liver Function)","KFT (Kidney Function)","ECG","X-Ray Chest","CT Scan","MRI","Echo (Echocardiography)","Urine Routine","Blood Sugar (Fasting)","HIV Test","HBsAg (Hepatitis B)","Coagulation Profile (PT/INR)","Thyroid Profile (TFT)"];
const S_ROOM_TYPES = ["General Room","Semi-Private Room","Private Room","Deluxe Room","Suite"];
const sInp = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition";
const sSel = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white transition";

// ── Inline form modals for StaffHospitalsTab ──────────────────────────────────
function StaffDoctorModal({ hospitalId, doctor, onClose, onSaved }: { hospitalId: string; doctor?: any; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!doctor;
  const [form, setForm] = useState({
    name: doctor?.name || "", department: doctor?.department || "", speciality: doctor?.speciality || "",
    mobile: doctor?.mobile || "", opdFee: String(doctor?.opdFee || ""), offerFee: String(doctor?.offerFee || ""),
    experience: String(doctor?.experience || ""),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function save() {
    if (!form.name || !form.department || !form.opdFee) { setError("Name, department, OPD fee zaruri hai"); return; }
    setSaving(true); setError("");
    const url    = "/api/hospital/doctors";
    const method = isEdit ? "PATCH" : "POST";
    const body   = isEdit
      ? { doctorId: doctor._id, hospitalId, name: form.name, department: form.department, speciality: form.speciality, mobile: form.mobile, opdFee: +form.opdFee, offerFee: +form.offerFee || +form.opdFee, experience: +form.experience }
      : { hospitalId, name: form.name, department: form.department, speciality: form.speciality, mobile: form.mobile, opdFee: +form.opdFee, offerFee: +form.offerFee || +form.opdFee, experience: +form.experience };
    const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.success) onSaved();
    else setError(data.message);
    setSaving(false);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-3 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800">{isEdit ? "Doctor Edit Karein" : "Doctor Add Karein"}</h3>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm">✕</button>
          </div>
          {[["name","Name",""   ],["department","Department","e.g. Cardiology"],["speciality","Speciality",""],["mobile","Mobile","10-digit"],["opdFee","OPD Fee (₹)",""],["offerFee","Offer Fee (₹)",""],["experience","Experience (years)",""]] .map(([k,l,ph]) => (
            <div key={k}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{l}</label>
              <input value={(form as any)[k]} onChange={(e) => set(k, e.target.value)} placeholder={ph}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
          ))}
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
            <button onClick={save} disabled={saving} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
              {saving ? "Saving..." : isEdit ? "Update" : "Add Doctor"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function StaffLabModal({ hospitalId, labTest, onClose, onSaved }: { hospitalId: string; labTest?: any; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!labTest;
  const [form, setForm] = useState({ name: labTest?.name || "", category: labTest?.category || "Blood Test", mrp: String(labTest?.mrp || ""), offerPrice: String(labTest?.offerPrice || ""), turnaroundTime: labTest?.turnaroundTime || "Same Day", homeCollection: labTest?.homeCollection || false });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  async function save() {
    if (!form.name || !form.mrp || !form.offerPrice) { setError("Name, MRP, offer price zaruri hai"); return; }
    setSaving(true); setError("");
    const url    = "/api/hospital/lab-tests";
    const method = isEdit ? "PATCH" : "POST";
    const body   = isEdit
      ? { testId: labTest._id, hospitalId, name: form.name, category: form.category, mrp: +form.mrp, offerPrice: +form.offerPrice, turnaroundTime: form.turnaroundTime, homeCollection: form.homeCollection }
      : { hospitalId, name: form.name, category: form.category, mrp: +form.mrp, offerPrice: +form.offerPrice, turnaroundTime: form.turnaroundTime, homeCollection: form.homeCollection };
    const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.success) onSaved();
    else setError(data.message);
    setSaving(false);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-3 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800">{isEdit ? "Lab Test Edit" : "Lab Test Add"}</h3>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm">✕</button>
          </div>
          {[["name","Test Name",""],["mrp","MRP (₹)",""],["offerPrice","Offer Price (₹)",""],["turnaroundTime","Turnaround","e.g. Same Day"]].map(([k,l,ph]) => (
            <div key={k}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{l}</label>
              <input value={(form as any)[k]} onChange={(e) => set(k, e.target.value)} placeholder={ph}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</label>
            <select value={form.category} onChange={(e) => set("category", e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
              {["Blood Test","Urine Test","Imaging","Pathology","Cardiology","Other"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.homeCollection} onChange={(e) => set("homeCollection", e.target.checked)} className="w-4 h-4 accent-purple-600" />
            <span className="text-sm text-gray-700">Home Collection Available</span>
          </label>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
            <button onClick={save} disabled={saving} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
              {saving ? "Saving..." : isEdit ? "Update" : "Add Test"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function StaffSurgeryModal({ hospitalId, pkg, onClose, onSaved }: { hospitalId: string; pkg?: any; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!pkg;

  const initRoomOpts = (): Record<string, { enabled: boolean; charge: string }> => {
    const map: Record<string, { enabled: boolean; charge: string }> = {};
    S_ROOM_TYPES.forEach((rt) => (map[rt] = { enabled: false, charge: "0" }));
    map["General Room"] = { enabled: true, charge: "0" };
    if (pkg?.roomOptions) pkg.roomOptions.forEach((ro: any) => { if (map[ro.type]) map[ro.type] = { enabled: true, charge: String(ro.extraCharge || 0) }; });
    return map;
  };

  const [dept,         setDept]         = useState(pkg?.category || "General Surgery");
  const [surgeryName,  setSurgeryName]  = useState(pkg?.name || "");
  const [customName,   setCustomName]   = useState(!(S_SURGERY_BY_DEPT[pkg?.category || "General Surgery"] || []).includes(pkg?.name || "") ? pkg?.name || "" : "");
  const [useCustom,    setUseCustom]    = useState(!(S_SURGERY_BY_DEPT[pkg?.category || "General Surgery"] || []).includes(pkg?.name || "") && !!pkg?.name);
  const [description,  setDescription]  = useState(pkg?.description || "");
  const [inclusions,   setInclusions]   = useState<string[]>(pkg?.inclusions || ["Pre-op Tests","Surgery","Anaesthesia","Hospital Stay","Medicines","Post-op Dressing"]);
  const [preTests,     setPreTests]     = useState<string[]>(pkg?.preSurgeryTests || []);
  const [roomOpts,     setRoomOpts]     = useState(initRoomOpts());
  const [surgeonName2, setSurgeonName2] = useState(pkg?.surgeonName || "");
  const [surgeonExp,   setSurgeonExp]   = useState(String(pkg?.surgeonExperience || ""));
  const [surgeonDeg,   setSurgeonDeg]   = useState((pkg?.surgeonDegrees || []).join(", "));
  const [pickup,       setPickup]       = useState(pkg?.pickupFromHome || false);
  const [pickupCharge, setPickupCharge] = useState(String(pkg?.pickupCharge || "500"));
  const [drop,         setDrop]         = useState(pkg?.dropAvailable || false);
  const [food,         setFood]         = useState(pkg?.foodIncluded || false);
  const [foodDetails,  setFoodDetails]  = useState(pkg?.foodDetails || "Light diet meals included");
  const [postCare,     setPostCare]     = useState(pkg?.postCareIncluded || false);
  const [followUp,     setFollowUp]     = useState(String(pkg?.followUpConsultations || "1"));
  const [stayDays2,    setStayDays2]    = useState(String(pkg?.stayDays || "2"));
  const [mrp,          setMrp]          = useState(String(pkg?.mrp || ""));
  const [offerPrice,   setOfferPrice]   = useState(String(pkg?.offerPrice || ""));
  const [memberPrice,  setMemberPrice]  = useState(String(pkg?.membershipPrice || ""));
  const [isActive,     setIsActive]     = useState(pkg?.isActive !== false);
  const [saving,       setSaving]       = useState(false);
  const [err,          setErr]          = useState("");

  const surgeryOptions = S_SURGERY_BY_DEPT[dept] || [];

  function toggleList(list: string[], item: string, setter: (v: string[]) => void) {
    setter(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  }
  function updateRoomOpt(rt: string, field: "enabled" | "charge", val: any) {
    setRoomOpts((p) => ({ ...p, [rt]: { ...p[rt], [field]: val } }));
  }

  async function save() {
    const finalName = useCustom ? customName.trim() : surgeryName;
    if (!finalName)  { setErr("Surgery ka naam daalo"); return; }
    if (!mrp)        { setErr("MRP zaruri hai"); return; }
    if (!offerPrice) { setErr("Offer Price zaruri hai"); return; }
    setSaving(true); setErr("");
    const activeRoomOptions = S_ROOM_TYPES.filter((rt) => roomOpts[rt]?.enabled).map((rt) => ({ type: rt, extraCharge: Number(roomOpts[rt].charge) || 0 }));
    const body: any = {
      hospitalId, name: finalName, category: dept, description, inclusions, preSurgeryTests: preTests,
      roomOptions: activeRoomOptions, surgeonName: surgeonName2, surgeonExperience: Number(surgeonExp) || 0,
      surgeonDegrees: surgeonDeg.split(",").map((s) => s.trim()).filter(Boolean),
      pickupFromHome: pickup, pickupCharge: pickup ? Number(pickupCharge) || 0 : 0, dropAvailable: drop,
      foodIncluded: food, foodDetails: food ? foodDetails : "", postCareIncluded: postCare,
      followUpConsultations: Number(followUp) || 0, stayDays: Number(stayDays2) || 1,
      mrp: Number(mrp), offerPrice: Number(offerPrice), membershipPrice: Number(memberPrice) || Number(offerPrice), isActive,
    };
    if (isEdit) body.packageId = pkg._id;
    const res  = await fetch("/api/hospital/surgery-packages", { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.success) onSaved();
    else setErr(data.message);
    setSaving(false);
  }

  const SLbl = ({ n, t }: { n: string; t: string }) => (
    <div className="flex items-center gap-2 pt-1">
      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{n}</span>
      <p className="text-sm font-bold text-gray-700">{t}</p>
    </div>
  );
  const ChkGrid = ({ items, selected, onToggle }: { items: string[]; selected: string[]; onToggle: (v: string) => void }) => (
    <div className="grid grid-cols-2 gap-1.5">
      {items.map((item) => (
        <label key={item} onClick={() => onToggle(item)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs cursor-pointer transition select-none ${selected.includes(item) ? "bg-purple-50 border-purple-300 text-purple-800 font-semibold" : "bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-300"}`}>
          <span className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border ${selected.includes(item) ? "bg-purple-600 border-purple-600 text-white" : "border-gray-300"}`}>
            {selected.includes(item) && <svg viewBox="0 0 12 12" className="w-3 h-3"><polyline points="2,6 5,9 10,4" stroke="white" strokeWidth="2" fill="none"/></svg>}
          </span>
          {item}
        </label>
      ))}
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl my-4">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-5 rounded-t-2xl flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-xs">Surgery Package</p>
              <h3 className="text-white font-bold text-lg">{isEdit ? "✏️ Edit Package" : "➕ Add Surgery Package"}</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white">✕</button>
          </div>
          <div className="p-5 space-y-5">
            {err && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{err}</p>}

            <SLbl n="1" t="Department & Surgery" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Department *</label>
                <select className={sSel} value={dept} onChange={(e) => { setDept(e.target.value); setSurgeryName(""); setUseCustom(false); }}>
                  {S_SUR_CAT.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Surgery Name *</label>
                {!useCustom ? (
                  <select className={sSel} value={surgeryName} onChange={(e) => { if (e.target.value === "__custom__") { setUseCustom(true); setSurgeryName(""); } else setSurgeryName(e.target.value); }}>
                    <option value="">-- Select --</option>
                    {surgeryOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    <option value="__custom__">✏️ Custom naam...</option>
                  </select>
                ) : (
                  <div className="relative">
                    <input className={sInp} value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Surgery ka naam..." autoFocus />
                    <button onClick={() => { setUseCustom(false); setCustomName(""); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-purple-500">↩</button>
                  </div>
                )}
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 block mb-1">Description</label>
                <textarea className={sInp + " resize-none"} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Safe and effective surgery..." />
              </div>
            </div>

            <SLbl n="2" t="Package Inclusions" />
            <ChkGrid items={S_STD_INCLUSIONS} selected={inclusions} onToggle={(item) => toggleList(inclusions, item, setInclusions)} />

            <SLbl n="3" t="Pre-surgery Tests (included)" />
            <ChkGrid items={S_PRE_TESTS} selected={preTests} onToggle={(item) => toggleList(preTests, item, setPreTests)} />

            <SLbl n="4" t="Room Options" />
            <div className="space-y-2">
              {S_ROOM_TYPES.map((rt) => {
                const isGeneral = rt === "General Room";
                const opt = roomOpts[rt];
                return (
                  <div key={rt} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${opt.enabled ? "bg-purple-50 border-purple-200" : "bg-gray-50 border-gray-100 opacity-60"}`}>
                    {isGeneral ? <span className="w-4 h-4 rounded bg-purple-600 flex-shrink-0 flex items-center justify-center"><svg viewBox="0 0 12 12" className="w-3 h-3"><polyline points="2,6 5,9 10,4" stroke="white" strokeWidth="2" fill="none"/></svg></span>
                      : <input type="checkbox" checked={opt.enabled} onChange={(e) => updateRoomOpt(rt, "enabled", e.target.checked)} className="w-4 h-4 accent-purple-600 flex-shrink-0" />}
                    <span className="text-sm font-medium text-gray-700 flex-1">{rt}</span>
                    {isGeneral ? <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Included</span>
                      : opt.enabled ? <div className="flex items-center gap-1"><span className="text-xs text-gray-500">+₹</span><input type="number" value={opt.charge} onChange={(e) => updateRoomOpt(rt, "charge", e.target.value)} className="w-20 border border-purple-200 rounded-lg px-2 py-1 text-sm text-right focus:outline-none" /><span className="text-xs text-gray-400">extra</span></div> : null}
                  </div>
                );
              })}
            </div>

            <SLbl n="5" t="Stay & Surgeon" />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Stay Days</label><input className={sInp} type="number" value={stayDays2} onChange={(e) => setStayDays2(e.target.value)} /></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Surgeon Exp (yrs)</label><input className={sInp} type="number" value={surgeonExp} onChange={(e) => setSurgeonExp(e.target.value)} /></div>
              <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 block mb-1">Surgeon Name</label><input className={sInp} value={surgeonName2} onChange={(e) => setSurgeonName2(e.target.value)} placeholder="Dr. Ramesh Kumar" /></div>
              <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 block mb-1">Degrees (comma separated)</label><input className={sInp} value={surgeonDeg} onChange={(e) => setSurgeonDeg(e.target.value)} placeholder="MBBS, MS, MCh" /></div>
            </div>

            <SLbl n="6" t="Logistics & Post-care" />
            <div className="space-y-2">
              <div className={`p-3 rounded-xl border ${pickup ? "bg-teal-50 border-teal-200" : "bg-gray-50 border-gray-100"}`}>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={pickup} onChange={(e) => setPickup(e.target.checked)} className="w-4 h-4 accent-teal-600" /><span className="text-sm">🚗 Ghar se Pickup Available</span></label>
                {pickup && <div className="mt-2 flex items-center gap-2"><span className="text-xs text-gray-500">Charge: ₹</span><input type="number" value={pickupCharge} onChange={(e) => setPickupCharge(e.target.value)} className="w-24 border border-teal-200 rounded-lg px-2 py-1 text-sm focus:outline-none" /></div>}
              </div>
              <div className={`p-3 rounded-xl border ${drop ? "bg-teal-50 border-teal-200" : "bg-gray-50 border-gray-100"}`}>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={drop} onChange={(e) => setDrop(e.target.checked)} className="w-4 h-4 accent-teal-600" /><span className="text-sm">🚕 Discharge Drop Available (Free)</span></label>
              </div>
              <div className={`p-3 rounded-xl border ${food ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-100"}`}>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={food} onChange={(e) => setFood(e.target.checked)} className="w-4 h-4 accent-amber-500" /><span className="text-sm">🍽️ Food / Meals Included</span></label>
                {food && <input className="mt-2 w-full border border-amber-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none" value={foodDetails} onChange={(e) => setFoodDetails(e.target.value)} placeholder="e.g. Light diet 3 times/day" />}
              </div>
              <div className={`p-3 rounded-xl border ${postCare ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-100"}`}>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={postCare} onChange={(e) => setPostCare(e.target.checked)} className="w-4 h-4 accent-blue-600" /><span className="text-sm">🩺 Post-surgery Care Included</span></label>
              </div>
              <div className="flex items-center gap-3"><label className="text-sm text-gray-600 whitespace-nowrap">📅 Follow-up Consultations:</label><input type="number" value={followUp} onChange={(e) => setFollowUp(e.target.value)} className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-400" min="0" max="10" /></div>
            </div>

            <SLbl n="7" t="Pricing" />
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">MRP (₹) *</label><input className={sInp} type="number" value={mrp} onChange={(e) => setMrp(e.target.value)} placeholder="45000" /></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Offer Price (₹) *</label><input className={sInp} type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} placeholder="35000" /></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Member Price (₹)</label><input className={sInp} type="number" value={memberPrice} onChange={(e) => setMemberPrice(e.target.value)} placeholder="30000" /></div>
            </div>
            {mrp && offerPrice && <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-2.5 flex items-center gap-4 text-sm"><span className="text-gray-500 line-through">₹{Number(mrp).toLocaleString()}</span><span className="font-bold text-purple-700 text-base">₹{Number(offerPrice).toLocaleString()}</span>{Number(mrp) > Number(offerPrice) && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">{Math.round(((Number(mrp)-Number(offerPrice))/Number(mrp))*100)}% off</span>}</div>}

            {isEdit && (
              <>
                <SLbl n="8" t="Status" />
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${isActive ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 accent-green-600" />
                  <span className="text-sm font-medium text-gray-700">{isActive ? "✅ Active" : "⏸️ On Hold"}</span>
                </label>
              </>
            )}
          </div>
          <div className="px-5 pb-5 flex gap-3 border-t border-gray-100 pt-4">
            <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
            <button onClick={save} disabled={saving} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
              {saving ? "Saving..." : isEdit ? "✓ Update Package" : "✓ Add Package"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── MAIN STAFF DASHBOARD ──────────────────────────────────────────────────────
export default function StaffDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab]   = useState<Tab>("bookings");
  const [staffName, setStaffName]   = useState("");
  const [staffId, setStaffId]       = useState("");
  const [staffPerms, setStaffPerms] = useState<any>({});
  const [bookings, setBookings]     = useState<any[]>([]);
  const [stats, setStats]           = useState<any>({});
  const [loading, setLoading]       = useState(true);
  const [updating, setUpdating]     = useState<string | null>(null);
  const [payModal, setPayModal]     = useState<any>(null);
  const [billModal, setBillModal]   = useState<any>(null);
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [search, setSearch]         = useState("");
  const [statusF, setStatusF]       = useState("all");
  const [typeF, setTypeF]           = useState("all");
  const [dateF, setDateF]           = useState("all");
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const name = localStorage.getItem("userName") || "Staff";
    const id   = localStorage.getItem("userId")   || "";
    if (role !== "staff" && role !== "admin") { router.replace("/portal-login"); return; }
    setStaffName(name);
    setStaffId(id);
    // Load staff permissions from server
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.success && d.staffPermissions) setStaffPerms(d.staffPermissions);
    });
  }, [router]);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: statusF, type: typeF, date: dateF, page: String(page) });
      if (search.trim()) params.set("search", search.trim());
      const res  = await fetch(`/api/staff/bookings?${params}`);
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
        setStats(data.stats || {});
        setTotalPages(data.pages || 1);
      }
    } finally { setLoading(false); }
  }, [statusF, typeF, dateF, page, search]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  async function updateStatus(bookingId: string, status: string) {
    setUpdating(bookingId);
    try {
      const res  = await fetch("/api/staff/bookings", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ bookingId, status }) });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) => prev.map((b) => b.bookingId === bookingId ? { ...b, status } : b));
        showToast(`Booking ${status} ✓`, true);
      }
    } finally { setUpdating(null); }
  }

  async function updateStage(bookingId: string, stage: string, label: string, notes: string) {
    const res  = await fetch("/api/staff/bookings", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ bookingId, statusStage: stage, stageLabel: label, stageNotes: notes }) });
    const data = await res.json();
    if (data.success) {
      setBookings((prev) => prev.map((b) => b.bookingId === bookingId ? { ...b, statusStage: stage, statusHistory: data.booking?.statusHistory || b.statusHistory, status: data.booking?.status || b.status } : b));
      showToast(`Stage: ${label} ✓`, true);
    } else { showToast(data.message || "Error", false); }
  }

  async function rescheduleBooking(bookingId: string, newDate: string, newSlot: string, reason: string) {
    const res  = await fetch("/api/staff/bookings", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ bookingId, reschedule: true, newDate, newSlot, stageNotes: reason }) });
    const data = await res.json();
    if (data.success) {
      setBookings((prev) => prev.map((b) => b.bookingId === bookingId ? { ...b, appointmentDate: newDate, slot: newSlot, statusHistory: data.booking?.statusHistory || b.statusHistory } : b));
      showToast("📅 Booking rescheduled", true);
    } else { showToast(data.message || "Error", false); }
  }

  function handlePaySuccess(updatedBooking: any) {
    setBookings((prev) => prev.map((b) => b.bookingId === updatedBooking.bookingId ? { ...b, paymentStatus:"paid", amount: updatedBooking.amount, status:"completed" } : b));
    showToast(`₹${updatedBooking.amount} payment received ✓`, true);
    setPayModal(null);
  }

  function logout() {
    ["userId","userRole","userName","adminId","adminName"].forEach((k) => localStorage.removeItem(k));
    fetch("/api/auth/logout", { method: "POST" }).finally(() => router.push("/portal-login"));
  }

  const NAV_TABS: { key: Tab; icon: string; label: string }[] = [
    { key:"bookings",    icon:"📋", label:"Bookings"    },
    { key:"walkin",      icon:"🚶", label:"Walk-in"     },
    { key:"collections", icon:"💰", label:"Collections" },
    ...(staffPerms.manageHospitals || staffPerms.onboardHospitals ? [{ key:"hospitals" as Tab, icon:"🏥", label:"Hospitals" }] : []),
    { key:"profile",     icon:"👤", label:"Profile"     },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {toast    && <Toast msg={toast.msg} ok={toast.ok} />}
      {payModal && <PaymentModal booking={payModal} onClose={() => setPayModal(null)} onSuccess={handlePaySuccess} />}
      {billModal && <BillModal booking={billModal} staffName={staffName} onClose={() => setBillModal(null)} />}

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-lg">
              {staffName.charAt(0) || "S"}
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">{staffName}</p>
              <p className="text-xs text-orange-500 font-medium">Staff Panel</p>
            </div>
          </div>

          {/* Live collection badge */}
          {(stats?.todayCollectedAmt || 0) > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-green-700">Today: ₹{(stats.todayCollectedAmt || 0).toLocaleString()}</span>
            </div>
          )}

          <button onClick={logout} className="text-xs text-gray-500 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
            Logout
          </button>
        </div>

        {/* Tab nav */}
        <div className="max-w-6xl mx-auto px-4 flex gap-0 overflow-x-auto pb-0">
          {NAV_TABS.map(({ key, icon, label }) => (
            <button key={key} onClick={() => setActiveTab(key as Tab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition whitespace-nowrap ${activeTab === key ? "border-orange-500 text-orange-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
              <span>{icon}</span> {label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* ── BOOKINGS TAB ── */}
        {activeTab === "bookings" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label:"Aaj Pending",   value: stats.todayPending   || 0,  color:"from-amber-500 to-orange-400" },
                { label:"Total Pending", value: stats.totalPending   || 0,  color:"from-rose-500 to-pink-400" },
                { label:"Confirmed",     value: stats.totalConfirmed || 0,  color:"from-blue-500 to-cyan-400" },
                { label:"Aaj Collected", value: `₹${(stats.todayCollectedAmt || 0).toLocaleString()}`, color:"from-green-500 to-emerald-400" },
              ].map((s) => (
                <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow-sm`}>
                  <p className="text-2xl font-extrabold">{s.value}</p>
                  <p className="text-xs opacity-80 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchBookings()}
                  placeholder="Patient naam, mobile ya Booking ID..."
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1 flex-wrap">
                  {["all","pending","confirmed","completed","cancelled"].map((s) => (
                    <button key={s} onClick={() => { setStatusF(s); setPage(1); }}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition ${statusF === s ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:bg-white/70"}`}>
                      {s === "all" ? "All" : s}
                    </button>
                  ))}
                </div>
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1 flex-wrap">
                  {["all","OPD","Lab","Surgery","Consultation","IPD"].map((t) => (
                    <button key={t} onClick={() => { setTypeF(t); setPage(1); }}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition ${typeF === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:bg-white/70"}`}>
                      {t === "all" ? "All" : t}
                    </button>
                  ))}
                </div>
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                  {[{k:"all",l:"Sabhi"},{k:"today",l:"Aaj"},{k:"week",l:"Week"}].map((d) => (
                    <button key={d.k} onClick={() => { setDateF(d.k); setPage(1); }}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition ${dateF === d.k ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:bg-white/70"}`}>
                      {d.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Booking list */}
            {loading ? (
              <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />)}</div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <p className="text-4xl mb-3">📋</p><p className="text-gray-400 text-sm">Koi booking nahi mili</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b._id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className={`h-0.5 w-full -mt-4 mb-3 rounded-full ${b.type==="OPD"?"bg-teal-400":b.type==="Lab"?"bg-orange-400":b.type==="Surgery"?"bg-rose-400":b.type==="IPD"?"bg-indigo-400":"bg-purple-400"}`} />
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <p className="font-bold text-gray-800 text-sm">{b.patientName}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[b.type] || "bg-gray-100 text-gray-600"}`}>{TYPE_ICON[b.type]} {b.type}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[b.status]}`}>{b.status}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.paymentStatus==="paid"?"bg-green-100 text-green-600":b.paymentStatus==="refunded"?"bg-red-100 text-red-500":"bg-gray-100 text-gray-500"}`}>
                            {b.paymentStatus === "paid" ? "✓ Paid" : b.paymentStatus}
                          </span>
                        </div>
                        <div className="flex gap-3 text-xs text-gray-400 flex-wrap">
                          <span className="font-mono">{b.bookingId}</span>
                          {b.patientMobile && <span>📱 {b.patientMobile}</span>}
                          {b.patientAge    && <span>👤 {b.patientAge}yrs</span>}
                          {b.appointmentDate && <span>📅 {fmtDate(b.appointmentDate)}</span>}
                          {b.slot          && <span>🕐 {b.slot}</span>}
                          {b.amount > 0    && <span className="font-semibold text-teal-600">₹{b.amount}</span>}
                        </div>
                        {b.symptoms && <p className="text-xs text-gray-500 mt-1.5 bg-gray-50 rounded-lg px-2 py-1">💬 {b.symptoms}</p>}
                        {b.collectedByName && <p className="text-[10px] text-green-600 mt-1">✓ Collected by {b.collectedByName}</p>}
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        {b.status === "pending" && (
                          <button onClick={() => updateStatus(b.bookingId, "confirmed")} disabled={updating === b.bookingId}
                            className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 whitespace-nowrap">
                            {updating === b.bookingId ? "..." : "✓ Confirm"}
                          </button>
                        )}
                        {(b.status === "pending" || b.status === "confirmed") && b.paymentStatus !== "paid" && (
                          <button onClick={() => setPayModal(b)}
                            className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition whitespace-nowrap">
                            💰 Payment
                          </button>
                        )}
                        {(b.status === "pending" || b.status === "confirmed") && (
                          <button onClick={() => updateStatus(b.bookingId, "completed")} disabled={updating === b.bookingId}
                            className="text-xs bg-teal-500 text-white px-3 py-1.5 rounded-lg hover:bg-teal-600 transition disabled:opacity-50 whitespace-nowrap">
                            {updating === b.bookingId ? "..." : "✓ Complete"}
                          </button>
                        )}
                        <button onClick={() => setBillModal(b)}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition whitespace-nowrap">
                          🧾 Bill
                        </button>
                        <button onClick={() => setExpandedId(expandedId === b._id ? null : b._id)}
                          className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg transition whitespace-nowrap">
                          {expandedId === b._id ? "▲ Stages" : "▼ Stages"}
                        </button>
                        {b.status !== "cancelled" && b.status !== "completed" && (
                          <button onClick={() => updateStatus(b.bookingId, "cancelled")} disabled={updating === b.bookingId}
                            className="text-xs bg-red-50 text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition disabled:opacity-50 whitespace-nowrap">
                            ✕ Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stage Timeline */}
                    {expandedId === b._id && (
                      <div className="mt-3 pt-3 border-t border-purple-100 bg-purple-50 rounded-xl p-4">
                        <BookingStageTimeline
                          bookingId={b.bookingId}
                          type={b.type}
                          currentStage={b.statusStage || "pending"}
                          history={b.statusHistory || []}
                          onUpdate={(stage, label, notes) => updateStage(b.bookingId, stage, label, notes)}
                          onReschedule={(newDate, newSlot, reason) => rescheduleBooking(b.bookingId, newDate, newSlot, reason)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition">← Pehle</button>
                <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition">Aage →</button>
              </div>
            )}
          </>
        )}

        {/* ── WALK-IN TAB ── */}
        {activeTab === "walkin" && <WalkInTab staffName={staffName} onToast={showToast} />}

        {/* ── COLLECTIONS TAB ── */}
        {activeTab === "collections" && <CollectionsTab />}

        {/* ── HOSPITALS TAB ── */}
        {activeTab === "hospitals" && (
          <StaffHospitalsTab
            assignedHospitalIds={(staffPerms.assignedHospitalIds || []).map((id: any) => (typeof id === "object" ? id._id || id.toString() : id.toString()))}
            canOnboard={!!staffPerms.onboardHospitals}
          />
        )}

        {/* ── PROFILE TAB ── */}
        {activeTab === "profile" && <StaffProfileTab onToast={showToast} />}

      </div>
    </div>
  );
}
