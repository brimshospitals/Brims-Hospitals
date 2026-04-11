"use client";
import { useState, useEffect } from "react";

const statusConfig: Record<string, { label: string; color: string }> = {
  pending:   { label: "Pending",   color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Confirmed", color: "bg-green-100 text-green-700"  },
  completed: { label: "Completed", color: "bg-teal-100 text-teal-700"    },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700"      },
};

const typeIcon: Record<string, string> = {
  OPD: "🩺", Surgery: "🏥", Lab: "🧪", IPD: "🛏️",
};

// ─── Login Screen ────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }: { onLogin: (id: string, name: string) => void }) {
  const [mobile, setMobile]     = useState("");
  const [key, setKey]           = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (mobile.length !== 10) { setError("10 digit mobile number enter karein"); return; }
    if (!key) { setError("Admin key zaruri hai"); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, adminKey: key }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("adminId", data.adminId);
        localStorage.setItem("adminName", data.name);
        onLogin(data.adminId, data.name);
      } else {
        setError(data.message);
      }
    } catch { setError("Network error. Server check karein."); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        {/* Logo */}
        <div className="text-center mb-7">
          <div className="text-5xl mb-3">🏥</div>
          <h1 className="text-2xl font-bold text-teal-700">Brims Hospitals</h1>
          <p className="text-gray-500 text-sm mt-1">Admin Control Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Registered Mobile Number
            </label>
            <div className="flex border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-teal-500">
              <span className="bg-gray-50 text-gray-500 px-4 flex items-center text-sm border-r border-gray-300">
                +91
              </span>
              <input
                type="tel" maxLength={10} value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                placeholder="10-digit number"
                className="flex-1 px-4 py-3 outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Secret Key
            </label>
            <input
              type="password" value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Admin key enter karein"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Key .env.local file mein ADMIN_KEY ke naam se hai
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50">
            {loading ? "Verifying..." : "Login as Admin"}
          </button>
        </form>

        <div className="mt-6 p-4 bg-teal-50 rounded-xl border border-teal-100">
          <p className="text-xs text-teal-700 font-semibold mb-1">Setup karne ke liye:</p>
          <ol className="text-xs text-teal-600 space-y-1 list-decimal list-inside">
            <li>Apna registered mobile number enter karein</li>
            <li><code className="bg-teal-100 px-1 rounded">.env.local</code> mein <code className="bg-teal-100 px-1 rounded">ADMIN_KEY</code> dekh kar enter karein</li>
            <li>Login hone par automatically admin ban jaenge</li>
          </ol>
        </div>

        <p className="text-center mt-4">
          <a href="/" className="text-sm text-gray-400 hover:text-teal-600">← Home Page</a>
        </p>
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const [adminId, setAdminId]   = useState("");
  const [adminName, setAdminName] = useState("");
  const [authed, setAuthed]     = useState(false);

  const [stats, setStats]       = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading]   = useState(false);

  const [filterType, setFilterType]     = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage]                 = useState(1);
  const [activeTab, setActiveTab]       = useState<"overview" | "bookings">("overview");

  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast]       = useState("");

  useEffect(() => {
    const id   = localStorage.getItem("adminId");
    const name = localStorage.getItem("adminName");
    if (id) { setAdminId(id); setAdminName(name || "Admin"); setAuthed(true); }
  }, []);

  useEffect(() => {
    if (authed && adminId) fetchData();
  }, [authed, adminId, filterType, filterStatus, page]);

  async function fetchData() {
    setLoading(true);
    try {
      const p = new URLSearchParams({ adminId, page: page.toString() });
      if (filterType)   p.append("type", filterType);
      if (filterStatus) p.append("status", filterStatus);
      const res  = await fetch(`/api/admin?${p}`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setBookings(data.bookings);
        setPagination(data.pagination);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function updateBooking(bookingId: string, status?: string, paymentStatus?: string) {
    setUpdating(bookingId);
    try {
      const res  = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, bookingId, status, paymentStatus }),
      });
      const data = await res.json();
      showToast(data.success ? `✅ ${bookingId} update ho gayi` : "❌ " + data.message);
      if (data.success) fetchData();
    } catch { showToast("❌ Network error"); }
    setUpdating(null);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  function logout() {
    localStorage.removeItem("adminId");
    localStorage.removeItem("adminName");
    setAuthed(false); setAdminId(""); setAdminName("");
  }

  function formatDate(d: string) {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  function getTitle(b: any) {
    if (b.type === "OPD")     return b.doctorId?.name ? `Dr. ${b.doctorId.name}` : "OPD Booking";
    if (b.type === "Surgery") return b.packageName ?? "Surgery Package";
    if (b.type === "Lab")     return b.testName    ?? "Lab Test";
    return b.type;
  }

  if (!authed) {
    return <AdminLogin onLogin={(id, name) => { setAdminId(id); setAdminName(name); setAuthed(true); }} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* ── Sidebar ── */}
      <aside className="w-56 bg-teal-700 text-white flex flex-col fixed h-full z-10">
        <div className="p-5 border-b border-teal-600">
          <p className="text-xs text-teal-300 font-medium uppercase tracking-wider">Brims Hospitals</p>
          <p className="font-bold text-lg mt-0.5">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { key: "overview",  icon: "📊", label: "Overview" },
            { key: "bookings",  icon: "📋", label: "Bookings" },
          ].map(({ key, icon, label }) => (
            <button key={key}
              onClick={() => setActiveTab(key as any)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === key
                  ? "bg-white/20 text-white"
                  : "text-teal-200 hover:bg-white/10 hover:text-white"
              }`}>
              <span>{icon}</span> {label}
            </button>
          ))}

          <div className="pt-2 border-t border-teal-600 mt-2">
            <p className="text-xs text-teal-400 px-4 pb-2 font-medium">Quick Links</p>
            {[
              { href: "/",               icon: "🏠", label: "Home Page"    },
              { href: "/opd-booking",    icon: "🩺", label: "OPD Booking"  },
              { href: "/lab-tests",      icon: "🧪", label: "Lab Tests"    },
              { href: "/surgery-packages", icon: "🏥", label: "Surgery"   },
              { href: "/my-bookings",    icon: "📋", label: "My Bookings"  },
              { href: "/dashboard",      icon: "👤", label: "User Dashboard" },
            ].map(({ href, icon, label }) => (
              <a key={href} href={href}
                className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-teal-200 hover:bg-white/10 hover:text-white transition">
                <span>{icon}</span> {label}
              </a>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-teal-600">
          <p className="text-xs text-teal-300 mb-0.5">Logged in as</p>
          <p className="text-sm font-semibold truncate">{adminName}</p>
          <button onClick={logout}
            className="mt-2 text-xs text-red-300 hover:text-red-100 transition">
            Logout →
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="ml-56 flex-1 p-6 min-h-screen">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
            toast.startsWith("✅") ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}>{toast}</div>
        )}

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && stats && (
          <>
            <h1 className="text-xl font-bold text-gray-800 mb-5">📊 Overview</h1>

            {/* Entity counts */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {[
                { label: "Registered Users",  value: stats.totalUsers,     icon: "👥", bg: "bg-blue-50",   text: "text-blue-700"   },
                { label: "Hospitals",          value: stats.totalHospitals, icon: "🏥", bg: "bg-purple-50", text: "text-purple-700" },
                { label: "Doctors",            value: stats.totalDoctors,   icon: "🩺", bg: "bg-teal-50",   text: "text-teal-700"   },
                { label: "Surgery Packages",   value: stats.totalPackages,  icon: "📦", bg: "bg-orange-50", text: "text-orange-700" },
                { label: "Lab Tests",          value: stats.totalLabTests,  icon: "🧪", bg: "bg-yellow-50", text: "text-yellow-700" },
              ].map(({ label, value, icon, bg, text }) => (
                <div key={label} className={`${bg} rounded-2xl p-5`}>
                  <p className="text-2xl mb-1">{icon}</p>
                  <p className={`text-3xl font-bold ${text}`}>{value}</p>
                  <p className={`text-xs font-medium mt-1 ${text} opacity-80`}>{label}</p>
                </div>
              ))}
            </div>

            {/* Booking stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {[
                { label: "Total Bookings",  value: stats.bookings.total,     bg: "bg-white", text: "text-gray-800" },
                { label: "Pending",         value: stats.bookings.pending,   bg: "bg-yellow-50", text: "text-yellow-700" },
                { label: "Confirmed",       value: stats.bookings.confirmed, bg: "bg-green-50",  text: "text-green-700"  },
                { label: "Completed",       value: stats.bookings.completed, bg: "bg-teal-50",   text: "text-teal-700"   },
                { label: "Revenue (Paid)",  value: `₹${(stats.revenue?.paid || 0).toLocaleString()}`, bg: "bg-emerald-50", text: "text-emerald-700" },
              ].map(({ label, value, bg, text }) => (
                <div key={label} className={`${bg} border border-gray-100 rounded-2xl p-5 shadow-sm`}>
                  <p className={`text-3xl font-bold ${text}`}>{value}</p>
                  <p className={`text-xs font-medium mt-1 ${text} opacity-70`}>{label}</p>
                </div>
              ))}
            </div>

            {/* Shortcut to manage */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-3">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Pending Bookings dekhein",  action: () => { setFilterStatus("pending"); setActiveTab("bookings"); }, icon: "⏳", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
                  { label: "Aaj ki Bookings",           action: () => { setFilterStatus(""); setActiveTab("bookings"); },        icon: "📅", color: "bg-blue-50 text-blue-700 border-blue-200"     },
                  { label: "Seed Lab Tests",            action: () => fetch("/api/seed-labs").then(() => showToast("✅ Lab tests seed ho gaye!")), icon: "🧪", color: "bg-teal-50 text-teal-700 border-teal-200" },
                  { label: "Seed Surgery Packages",     action: () => fetch("/api/seed-surgery").then(() => showToast("✅ Surgery packages seed ho gaye!")), icon: "🏥", color: "bg-purple-50 text-purple-700 border-purple-200" },
                ].map(({ label, action, icon, color }) => (
                  <button key={label} onClick={action}
                    className={`${color} border rounded-xl px-4 py-3 text-sm font-medium text-left hover:opacity-80 transition`}>
                    <span className="text-lg block mb-1">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── BOOKINGS TAB ── */}
        {activeTab === "bookings" && (
          <>
            <div className="flex flex-wrap justify-between items-center mb-5 gap-3">
              <h1 className="text-xl font-bold text-gray-800">📋 Bookings Management</h1>
              <div className="flex gap-3 flex-wrap">
                <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                  <option value="">Sabhi Types</option>
                  <option value="OPD">🩺 OPD</option>
                  <option value="Surgery">🏥 Surgery</option>
                  <option value="Lab">🧪 Lab</option>
                </select>
                <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                  <option value="">Sabhi Status</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="confirmed">✅ Confirmed</option>
                  <option value="completed">🏁 Completed</option>
                  <option value="cancelled">❌ Cancelled</option>
                </select>
                <button onClick={() => fetchData()}
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition">
                  🔄 Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16 text-teal-600">Loading bookings...</div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-gray-500">Koi booking nahi mili</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-5">
                  {bookings.map((b) => {
                    const sc = statusConfig[b.status] ?? { label: b.status, color: "bg-gray-100 text-gray-600" };
                    return (
                      <div key={b._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <div className="flex items-start gap-4">
                          <div className="text-3xl w-10 text-center flex-shrink-0 mt-0.5">
                            {typeIcon[b.type] ?? "📄"}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-800 truncate">{getTitle(b)}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.color}`}>
                                {sc.label}
                              </span>
                              {b.paymentStatus === "paid" && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">
                                  Paid ✓
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-gray-500 space-y-0.5 mt-1">
                              {b.userId && (
                                <p>👤 {b.userId.name}  •  📱 {b.userId.mobile}  •  🪪 {b.userId.memberId}</p>
                              )}
                              {b.appointmentDate && (
                                <p>📅 {formatDate(b.appointmentDate)}{b.slot ? ` • ${b.slot}` : ""}</p>
                              )}
                              {(b.hospitalName) && <p>🏥 {b.hospitalName}</p>}
                              {b.notes && <p>📝 {b.notes}</p>}
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            {b.amount > 0 && (
                              <p className="font-bold text-teal-700 text-base">₹{b.amount.toLocaleString()}</p>
                            )}
                            <p className="text-xs font-mono text-gray-400 mt-0.5">{b.bookingId}</p>
                            <p className="text-xs text-gray-400">{formatDate(b.createdAt)}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-3 pt-3 border-t border-gray-50 flex flex-wrap gap-2">
                          {b.status === "pending" && (
                            <button onClick={() => updateBooking(b.bookingId, "confirmed")}
                              disabled={updating === b.bookingId}
                              className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 transition">
                              ✓ Confirm
                            </button>
                          )}
                          {(b.status === "pending" || b.status === "confirmed") && (
                            <button onClick={() => updateBooking(b.bookingId, "completed", "paid")}
                              disabled={updating === b.bookingId}
                              className="text-xs bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 transition">
                              ✓ Complete
                            </button>
                          )}
                          {b.status !== "cancelled" && b.status !== "completed" && (
                            <button onClick={() => updateBooking(b.bookingId, "cancelled")}
                              disabled={updating === b.bookingId}
                              className="text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 transition">
                              ✗ Cancel
                            </button>
                          )}
                          {b.paymentStatus !== "paid" && b.status !== "cancelled" && (
                            <button onClick={() => updateBooking(b.bookingId, undefined, "paid")}
                              disabled={updating === b.bookingId}
                              className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 transition">
                              💰 Mark Paid
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-4">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                      className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-sm disabled:opacity-40 hover:border-teal-400 transition">
                      ← Pehle
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {pagination.page} / {pagination.pages}
                      <span className="text-gray-400 ml-1">({pagination.total} total)</span>
                    </span>
                    <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                      className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-sm disabled:opacity-40 hover:border-teal-400 transition">
                      Aage →
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
