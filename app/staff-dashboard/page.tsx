"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = "bookings" | "walkin" | "collections" | "profile";

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
// ── MAIN STAFF DASHBOARD ──────────────────────────────────────────────────────
export default function StaffDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab]   = useState<Tab>("bookings");
  const [staffName, setStaffName]   = useState("");
  const [staffId, setStaffId]       = useState("");
  const [bookings, setBookings]     = useState<any[]>([]);
  const [stats, setStats]           = useState<any>({});
  const [loading, setLoading]       = useState(true);
  const [updating, setUpdating]     = useState<string | null>(null);
  const [payModal, setPayModal]     = useState<any>(null);
  const [billModal, setBillModal]   = useState<any>(null);
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);

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

  function handlePaySuccess(updatedBooking: any) {
    setBookings((prev) => prev.map((b) => b.bookingId === updatedBooking.bookingId ? { ...b, paymentStatus:"paid", amount: updatedBooking.amount, status:"completed" } : b));
    showToast(`₹${updatedBooking.amount} payment received ✓`, true);
    setPayModal(null);
  }

  function logout() {
    ["userId","userRole","userName","adminId","adminName"].forEach((k) => localStorage.removeItem(k));
    fetch("/api/auth/logout", { method: "POST" }).finally(() => router.push("/portal-login"));
  }

  const NAV_TABS = [
    { key:"bookings",    icon:"📋", label:"Bookings"    },
    { key:"walkin",      icon:"🚶", label:"Walk-in"     },
    { key:"collections", icon:"💰", label:"Collections" },
    { key:"profile",     icon:"👤", label:"Profile"     },
  ] as const;

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
                        {b.status !== "cancelled" && b.status !== "completed" && (
                          <button onClick={() => updateStatus(b.bookingId, "cancelled")} disabled={updating === b.bookingId}
                            className="text-xs bg-red-50 text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition disabled:opacity-50 whitespace-nowrap">
                            ✕ Cancel
                          </button>
                        )}
                      </div>
                    </div>
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

        {/* ── PROFILE TAB ── */}
        {activeTab === "profile" && <StaffProfileTab onToast={showToast} />}

      </div>
    </div>
  );
}
