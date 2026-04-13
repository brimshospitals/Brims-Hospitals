"use client";
import { useState, useEffect, useCallback } from "react";
import Header from "../components/header";

const TYPE_CONFIG: Record<string, { label: string; icon: string; bg: string; text: string; border: string }> = {
  OPD:          { label: "OPD",           icon: "🩺", bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-400"   },
  Surgery:      { label: "Surgery",        icon: "🏥", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-400" },
  Lab:          { label: "Lab Test",       icon: "🧪", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-400" },
  Consultation: { label: "Teleconsult",    icon: "💻", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-400" },
  IPD:          { label: "IPD",            icon: "🛏️", bg: "bg-pink-50",   text: "text-pink-700",   border: "border-pink-400"   },
};

const STATUS_CONFIG: Record<string, { label: string; icon: string; bg: string; text: string; dot: string }> = {
  pending:   { label: "Pending",   icon: "⏳", bg: "bg-amber-100",  text: "text-amber-700",  dot: "bg-amber-500"  },
  confirmed: { label: "Confirmed", icon: "✅", bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-500"  },
  completed: { label: "Completed", icon: "🏁", bg: "bg-teal-100",   text: "text-teal-700",   dot: "bg-teal-500"   },
  cancelled: { label: "Cancelled", icon: "❌", bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-400"    },
};

const PAY_MODE: Record<string, string> = {
  counter: "Counter Pay", online: "Online / UPI", wallet: "Wallet", insurance: "Insurance",
};

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function getTitle(b: any) {
  if (b.type === "OPD" || b.type === "Consultation") return b.doctorName ? `Dr. ${b.doctorName}` : b.type === "Consultation" ? "Teleconsultation" : "OPD Appointment";
  if (b.type === "Surgery") return b.packageName ?? "Surgery Package";
  if (b.type === "Lab")     return b.testName    ?? "Lab Test";
  return b.type;
}
function getSubtitle(b: any) {
  const parts: string[] = [];
  if (b.speciality)   parts.push(b.speciality);
  if (b.category)     parts.push(b.category);
  if (b.hospitalName) parts.push(b.hospitalName);
  return parts.join(" · ");
}

// ── Cancel Confirmation Modal ────────────────────────────────────────────────
function CancelModal({ booking, onConfirm, onClose, loading }: { booking: any; onConfirm: () => void; onClose: () => void; loading: boolean }) {
  const notes = (() => { try { return booking.notes ? JSON.parse(booking.notes) : {}; } catch { return {}; } })();
  const isWallet = notes.paymentMode === "wallet" && booking.paymentStatus === "paid" && booking.amount > 0;
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
          <div className="text-center mb-5">
            <p className="text-4xl mb-2">🚫</p>
            <h3 className="font-bold text-gray-800 text-lg">Booking Cancel Karein?</h3>
            <p className="text-sm text-gray-500 mt-1">{getTitle(booking)}</p>
          </div>
          {isWallet && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 mb-4 text-center">
              <p className="text-sm font-semibold text-teal-700">₹{booking.amount.toLocaleString()} wallet mein wapas aa jayenge</p>
              <p className="text-xs text-teal-600 mt-0.5">Kyunki payment wallet se hua tha</p>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold">Vapas Jaao</button>
            <button onClick={onConfirm} disabled={loading} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50">
              {loading ? "Cancelling..." : "Haan, Cancel Karein"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Star Rating component ─────────────────────────────────────────────────────
function StarRow({ value, onChange, size = "text-2xl" }: { value: number; onChange?: (n: number) => void; size?: string }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          className={`${size} leading-none transition-transform ${onChange ? "cursor-pointer hover:scale-110" : "cursor-default"} ${n <= active ? "text-amber-400" : "text-gray-200"}`}
        >★</button>
      ))}
    </div>
  );
}

// ── Review Modal ──────────────────────────────────────────────────────────────
function ReviewModal({ booking, onClose, onDone }: { booking: any; onClose: () => void; onDone: () => void }) {
  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [done, setDone]       = useState(false);

  const LABELS = ["", "Bahut Bura", "Theek Nahi", "Theek Hai", "Achha", "Excellent!"];
  const COLORS = ["", "text-red-500", "text-orange-500", "text-amber-500", "text-teal-500", "text-green-600"];

  async function submit() {
    if (!rating) { setError("Star rating zaruri hai"); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/review", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ bookingId: booking._id, rating, comment }),
      });
      const data = await res.json();
      if (data.success) { setDone(true); setTimeout(() => { onDone(); onClose(); }, 1800); }
      else setError(data.message);
    } catch { setError("Network error. Dobara try karein."); }
    setLoading(false);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
          {done ? (
            <div className="p-8 text-center">
              <p className="text-5xl mb-3">🙏</p>
              <p className="text-lg font-bold text-gray-800">Shukriya!</p>
              <p className="text-sm text-gray-500 mt-1">Aapka review submit ho gaya</p>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-br from-amber-400 to-orange-400 px-6 pt-6 pb-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80 mb-1">Review Dein</p>
                <p className="font-bold text-lg leading-tight">{getTitle(booking)}</p>
                {getSubtitle(booking) && <p className="text-sm opacity-80 mt-0.5">{getSubtitle(booking)}</p>}
              </div>
              <div className="p-5 space-y-4">
                {/* Stars */}
                <div className="text-center">
                  <StarRow value={rating} onChange={setRating} size="text-4xl" />
                  {rating > 0 && (
                    <p className={`text-sm font-semibold mt-2 ${COLORS[rating]}`}>{LABELS[rating]}</p>
                  )}
                </div>

                {/* Comment */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Comment (Optional)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Apna anubhav likho..."
                    className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                  />
                  <p className="text-right text-xs text-gray-400">{comment.length}/500</p>
                </div>

                {error && <p className="text-red-500 text-xs">{error}</p>}

                <div className="flex gap-3">
                  <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold">Baad Mein</button>
                  <button onClick={submit} disabled={loading || !rating}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                    {loading ? "Submit ho raha hai..." : "Review Submit Karein ★"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Booking Card ─────────────────────────────────────────────────────────────
function BookingCard({ b, onCancel, onReview }: { b: any; onCancel: (b: any) => void; onReview: (b: any) => void }) {
  const [expanded, setExpanded] = useState(false);
  const tc = TYPE_CONFIG[b.type]   ?? { label: b.type, icon: "📄", bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-300" };
  const sc = STATUS_CONFIG[b.status] ?? { label: b.status, icon: "●", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
  const notes = (() => { try { return b.notes ? JSON.parse(b.notes) : {}; } catch { return {}; } })();
  const canCancel = ["pending", "confirmed"].includes(b.status);
  const canReview = b.status === "completed" && !b.reviewed && (b.doctorId || b.hospitalId);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Color bar */}
      <div className={`h-1 w-full ${tc.border.replace("border-", "bg-")}`} />

      <div className="p-4">
        {/* Row 1: Icon + Title + Status */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${tc.bg}`}>
            {tc.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 text-sm leading-tight truncate">{getTitle(b)}</p>
            {getSubtitle(b) && <p className="text-xs text-gray-500 mt-0.5 truncate">{getSubtitle(b)}</p>}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                {sc.label}
              </span>
              {b.paymentStatus === "paid" && (
                <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">✓ Paid</span>
              )}
              {b.paymentStatus === "refunded" && (
                <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-100">↩ Refunded</span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            {b.amount > 0 && <p className="font-bold text-teal-700">₹{b.amount.toLocaleString()}</p>}
            <p className="text-[10px] text-gray-400 mt-0.5">{fmtDate(b.createdAt)}</p>
          </div>
        </div>

        {/* Appointment Date + Patient Name quick row */}
        <div className="flex items-center gap-3 mb-3">
          {b.appointmentDate && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-100">
              <span>📅</span>
              <span className="font-medium">{fmtDate(b.appointmentDate)}</span>
              {b.slot && <><span className="text-gray-300">·</span><span className="text-teal-600 font-medium">🕐 {b.slot}</span></>}
            </div>
          )}
          {notes.patientName && notes.patientName !== b.userName && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-blue-50 rounded-lg px-2.5 py-1.5 border border-blue-100">
              <span>👤</span>
              <span className="font-medium">{notes.patientName}</span>
              {notes.patientAge && <span className="text-gray-400">{notes.patientAge}y</span>}
            </div>
          )}
        </div>

        {/* Expand details */}
        {expanded && (
          <div className="border-t border-gray-50 pt-3 mt-1 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {notes.patientName && (
                <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                  <p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px] mb-1">Patient</p>
                  <p className="font-semibold text-gray-800">{notes.patientName}</p>
                  {notes.patientMobile && <p className="text-gray-500 mt-0.5">📱 {notes.patientMobile}</p>}
                  {(notes.patientAge || notes.patientGender) && (
                    <p className="text-gray-500 mt-0.5">
                      {notes.patientAge && `${notes.patientAge} yrs`}{notes.patientAge && notes.patientGender && " · "}{notes.patientGender && <span className="capitalize">{notes.patientGender}</span>}
                    </p>
                  )}
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                <p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px] mb-1">Payment</p>
                {b.amount > 0 && <p className="font-bold text-gray-800">₹{b.amount.toLocaleString()}</p>}
                {notes.paymentMode && <p className="text-gray-500 mt-0.5">{PAY_MODE[notes.paymentMode] || notes.paymentMode}</p>}
                <p className={`mt-0.5 font-medium ${b.paymentStatus === "paid" ? "text-emerald-600" : b.paymentStatus === "refunded" ? "text-blue-600" : "text-amber-600"}`}>
                  {b.paymentStatus === "paid" ? "✓ Paid" : b.paymentStatus === "refunded" ? "↩ Refunded" : "● Pending"}
                </p>
              </div>
            </div>
            {notes.homeAddress && (
              <div className="bg-green-50 rounded-xl px-3 py-2.5 border border-green-200">
                <p className="text-[10px] font-bold text-green-600 uppercase tracking-wide mb-1">🏠 Home Collection Address</p>
                <p className="text-xs text-gray-700">
                  {[notes.homeAddress.flat, notes.homeAddress.street, notes.homeAddress.landmark, notes.homeAddress.district]
                    .filter(Boolean).join(", ")}
                  {notes.homeAddress.pincode ? ` — ${notes.homeAddress.pincode}` : ""}
                </p>
              </div>
            )}
            {notes.symptoms && (
              <div className="bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-100">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wide mb-1">Symptoms</p>
                <p className="text-xs text-gray-700">{notes.symptoms}</p>
              </div>
            )}
            {b.type === "Surgery" && b.status === "pending" && (
              <div className="bg-purple-50 rounded-xl px-3 py-2.5 border border-purple-100 text-xs text-purple-700">
                ⏳ Hamari team 24 ghante mein aapse contact karegi appointment confirm karne ke liye.
              </div>
            )}
          </div>
        )}

        {/* Already reviewed — show stars */}
        {b.status === "completed" && b.reviewed && (
          <div className="flex items-center gap-2 pt-2 mt-1 border-t border-gray-50">
            <StarRow value={b.reviewRating || 0} size="text-base" />
            <span className="text-xs text-gray-400">Aapne review diya</span>
          </div>
        )}

        {/* Footer: BookingID + actions */}
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">{b.bookingId}</span>
            <button onClick={() => setExpanded(!expanded)} className="text-[10px] text-teal-600 font-semibold hover:underline">
              {expanded ? "▲ Less" : "▼ Details"}
            </button>
          </div>
          <div className="flex items-center gap-2">
            {canCancel && (
              <button
                onClick={() => onCancel(b)}
                className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 hover:bg-red-50 px-3 py-1.5 rounded-lg font-semibold transition"
              >
                ✕ Cancel
              </button>
            )}
            {canReview && (
              <button
                onClick={() => onReview(b)}
                className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1"
              >
                ★ Rate
              </button>
            )}
            {b.type === "Consultation" && b.status === "confirmed" && (
              <a href={`/consultation/${b.bookingId}`}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-semibold transition">
                📹 Join Call
              </a>
            )}
            <a
              href={`/invoice?id=${b.bookingId}`}
              className="text-xs text-gray-500 hover:text-teal-600 border border-gray-200 hover:border-teal-300 hover:bg-teal-50 px-3 py-1.5 rounded-lg font-semibold transition"
              title="Receipt / Invoice"
            >
              🧾 Receipt
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MyBookingsPage() {
  const [bookings, setBookings]     = useState<any[]>([]);
  const [summary, setSummary]       = useState<any>({});
  const [loading, setLoading]       = useState(true);
  const [activeType, setActiveType] = useState("");
  const [activeStatus, setActiveStatus] = useState("");
  const [cancelTarget, setCancelTarget] = useState<any>(null);
  const [cancelling, setCancelling]     = useState(false);
  const [reviewTarget, setReviewTarget] = useState<any>(null);
  const [toast, setToast]               = useState("");

  const fetchBookings = useCallback(async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const p = new URLSearchParams({ userId });
      if (activeType)   p.set("type",   activeType);
      if (activeStatus) p.set("status", activeStatus);
      const res  = await fetch(`/api/my-bookings?${p}`);
      const data = await res.json();
      if (data.success) { setBookings(data.bookings); setSummary(data.summary); }
    } catch {}
    setLoading(false);
  }, [activeType, activeStatus]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  async function handleCancel() {
    if (!cancelTarget) return;
    const userId = localStorage.getItem("userId");
    setCancelling(true);
    try {
      const res  = await fetch("/api/my-bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: cancelTarget.bookingId, userId }),
      });
      const data = await res.json();
      if (data.success) {
        setToast(data.message);
        setCancelTarget(null);
        fetchBookings();
      } else {
        setToast(data.message || "Cancel nahi hua");
      }
    } catch {
      setToast("Network error. Dobara try karein.");
    }
    setCancelling(false);
    setTimeout(() => setToast(""), 4000);
  }

  const TYPES = ["", "OPD", "Surgery", "Lab", "Consultation"];
  const STATUSES = ["", "pending", "confirmed", "completed", "cancelled"];

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <Header />

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-teal-700 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-lg max-w-xs text-center">
          {toast}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelTarget && (
        <CancelModal
          booking={cancelTarget}
          onConfirm={handleCancel}
          onClose={() => setCancelTarget(null)}
          loading={cancelling}
        />
      )}

      {/* Review Modal */}
      {reviewTarget && (
        <ReviewModal
          booking={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onDone={() => { fetchBookings(); setToast("Review submit ho gaya! Shukriya 🙏"); setTimeout(() => setToast(""), 3000); }}
        />
      )}

      <div className="max-w-2xl mx-auto py-6 px-4">

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-800">📋 Meri Bookings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Aapki aur family ki sabhi appointments</p>
        </div>

        {/* Summary Stats */}
        {!loading && (summary.total ?? 0) > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-5">
            {[
              { key: "total",     label: "Total",     bg: "bg-white border border-gray-100",        text: "text-gray-800"  },
              { key: "pending",   label: "Pending",   bg: "bg-amber-50 border border-amber-100",    text: "text-amber-700" },
              { key: "confirmed", label: "Confirmed", bg: "bg-green-50 border border-green-100",    text: "text-green-700" },
              { key: "completed", label: "Done",      bg: "bg-teal-50 border border-teal-100",      text: "text-teal-700"  },
            ].map(({ key, label, bg, text }) => (
              <button key={key} onClick={() => setActiveStatus(key === "total" ? "" : key)}
                className={`${bg} rounded-2xl p-3 text-center shadow-sm transition hover:shadow-md`}>
                <p className={`text-2xl font-bold ${text}`}>{summary[key] ?? 0}</p>
                <p className={`text-xs font-medium mt-0.5 ${text} opacity-75`}>{label}</p>
              </button>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
          {TYPES.map((t) => (
            <button key={t} onClick={() => setActiveType(t)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                activeType === t ? "bg-teal-600 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-teal-400"
              }`}>
              {t === "" ? "Sabhi" : `${TYPE_CONFIG[t]?.icon} ${TYPE_CONFIG[t]?.label}`}
            </button>
          ))}
          <div className="w-px bg-gray-200 mx-0.5 flex-shrink-0" />
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setActiveStatus(s)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                activeStatus === s ? "bg-teal-600 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-teal-400"
              }`}>
              {s === "" ? "All Status" : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
                    <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                    <div className="h-3 bg-gray-100 rounded-lg w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-5xl mb-3">📭</p>
            <p className="text-gray-600 font-semibold">Koi booking nahi mili</p>
            <p className="text-sm text-gray-400 mt-1 mb-6">
              {activeType || activeStatus ? "Filter change kar ke dekhein" : "Abhi pehli appointment book karein"}
            </p>
            <div className="flex gap-3 justify-center">
              <a href="/opd-booking" className="bg-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-700 transition">🩺 OPD Book</a>
              <a href="/lab-tests"   className="bg-white border border-teal-200 text-teal-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-50 transition">🧪 Lab Test</a>
              <a href="/surgery-packages" className="bg-white border border-purple-200 text-purple-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-50 transition">🏥 Surgery</a>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <BookingCard key={b._id} b={b} onCancel={setCancelTarget} onReview={setReviewTarget} />
            ))}
            <p className="text-center text-xs text-gray-400 pt-2">{bookings.length} booking{bookings.length !== 1 ? "s" : ""} found</p>
          </div>
        )}
      </div>
    </main>
  );
}
