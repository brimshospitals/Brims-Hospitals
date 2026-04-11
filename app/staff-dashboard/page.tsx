"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Booking = {
  _id: string;
  bookingId: string;
  type: string;
  status: string;
  paymentStatus: string;
  appointmentDate?: string;
  slot?: string;
  amount?: number;
  patientName: string;
  patientMobile: string;
  consultType?: string;
  createdAt: string;
};

type Stats = { todayPending: number; totalPending: number; totalConfirmed: number };

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700 border-amber-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const TYPE_COLORS: Record<string, string> = {
  OPD:          "bg-teal-100 text-teal-700",
  Consultation: "bg-purple-100 text-purple-700",
  Lab:          "bg-orange-100 text-orange-700",
  Surgery:      "bg-rose-100 text-rose-700",
  IPD:          "bg-indigo-100 text-indigo-700",
};

const PAYMENT_COLORS: Record<string, string> = {
  paid:    "bg-green-100 text-green-600",
  pending: "bg-gray-100 text-gray-500",
  refunded:"bg-red-100 text-red-500",
};

const TYPE_OPTIONS  = ["all","OPD","Consultation","Lab","Surgery","IPD"];
const STATUS_OPTIONS = ["all","pending","confirmed","completed","cancelled"];
const DATE_OPTIONS  = [
  { key:"all",   label:"Sabhi" },
  { key:"today", label:"Aaj" },
  { key:"week",  label:"Yeh Hafte" },
];

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}
function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });
}

export default function StaffDashboard() {
  const router = useRouter();
  const [staffName, setStaffName] = useState("");
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [stats, setStats]         = useState<Stats>({ todayPending:0, totalPending:0, totalConfirmed:0 });
  const [loading, setLoading]     = useState(true);
  const [updating, setUpdating]   = useState<string | null>(null);

  // Filters
  const [search, setSearch]       = useState("");
  const [statusF, setStatusF]     = useState("all");
  const [typeF, setTypeF]         = useState("all");
  const [dateF, setDateF]         = useState("all");
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const name = localStorage.getItem("userName") || "Staff";
    if (role !== "staff" && role !== "admin") { router.replace("/login"); return; }
    setStaffName(name);
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: statusF, type: typeF, date: dateF, page: String(page) });
      if (search.trim()) params.set("search", search.trim());
      const res  = await fetch(`/api/staff/bookings?${params}`);
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
        setStats(data.stats);
        setTotalPages(data.pages || 1);
      }
    } finally { setLoading(false); }
  }, [statusF, typeF, dateF, page, search]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  async function updateStatus(bookingId: string, status: string) {
    setUpdating(bookingId);
    try {
      const res  = await fetch("/api/staff/bookings", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) => prev.map((b) => b._id === bookingId ? { ...b, status } : b));
      }
    } finally { setUpdating(null); }
  }

  function logout() {
    ["userId","userRole","userName","adminId","adminName"].forEach((k) => localStorage.removeItem(k));
    router.push("/login");
  }

  // Search on enter / debounce
  function handleSearchKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") { setPage(1); fetchBookings(); }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-sm">
              {staffName.charAt(0) || "S"}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{staffName}</p>
              <p className="text-xs text-gray-500">Staff Panel</p>
            </div>
          </div>
          <button onClick={logout} className="text-xs text-gray-500 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label:"Aaj Pending",   value: stats.todayPending,   color:"from-amber-500 to-orange-400"  },
            { label:"Total Pending", value: stats.totalPending,   color:"from-rose-500 to-pink-400"     },
            { label:"Confirmed",     value: stats.totalConfirmed, color:"from-blue-500 to-cyan-400"     },
          ].map((s) => (
            <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow-sm`}>
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="text-xs opacity-80 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKey}
              placeholder="Patient naam, mobile ya Booking ID se khojein... (Enter)"
              className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"
            />
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap gap-2">
            {/* Status */}
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              {STATUS_OPTIONS.map((s) => (
                <button key={s} onClick={() => { setStatusF(s); setPage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    statusF === s ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:bg-white/70"
                  }`}>
                  {s === "all" ? "Sabhi Status" : s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Type */}
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1 flex-wrap">
              {TYPE_OPTIONS.map((t) => (
                <button key={t} onClick={() => { setTypeF(t); setPage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    typeF === t ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:bg-white/70"
                  }`}>
                  {t === "all" ? "Sabhi Types" : t}
                </button>
              ))}
            </div>

            {/* Date */}
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              {DATE_OPTIONS.map((d) => (
                <button key={d.key} onClick={() => { setDateF(d.key); setPage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    dateF === d.key ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:bg-white/70"
                  }`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bookings list */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map((i) => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500 text-sm">Koi booking nahi mili</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b._id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Top row */}
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <p className="font-semibold text-gray-800 text-sm">{b.patientName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[b.type] || "bg-gray-100 text-gray-600"}`}>
                        {b.type}
                      </span>
                      {b.consultType && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                          {b.consultType === "video" ? "📹" : "🎙️"} {b.consultType}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[b.status]}`}>
                        {b.status}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_COLORS[b.paymentStatus]}`}>
                        {b.paymentStatus === "paid" ? "✓ Paid" : b.paymentStatus}
                      </span>
                    </div>

                    {/* Details row */}
                    <div className="flex gap-3 text-xs text-gray-500 flex-wrap">
                      <span>🪪 {b.bookingId || b._id.slice(-8).toUpperCase()}</span>
                      {b.patientMobile && <span>📱 {b.patientMobile}</span>}
                      {b.appointmentDate && <span>📅 {formatDate(b.appointmentDate)}</span>}
                      {b.slot && <span>🕐 {b.slot}</span>}
                      {b.amount && b.amount > 0 && <span>💰 ₹{b.amount}</span>}
                      <span className="text-gray-300">Booked {formatTime(b.createdAt)}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {b.status === "pending" && (
                      <>
                        <button
                          onClick={() => updateStatus(b._id, "confirmed")}
                          disabled={updating === b._id}
                          className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          {updating === b._id ? "..." : "✓ Confirm"}
                        </button>
                        <button
                          onClick={() => updateStatus(b._id, "cancelled")}
                          disabled={updating === b._id}
                          className="text-xs bg-red-50 text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          ✕ Cancel
                        </button>
                      </>
                    )}
                    {b.status === "confirmed" && (
                      <button
                        onClick={() => updateStatus(b._id, "completed")}
                        disabled={updating === b._id}
                        className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {updating === b._id ? "..." : "✓ Complete"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              ← Pehle
            </button>
            <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              Aage →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
