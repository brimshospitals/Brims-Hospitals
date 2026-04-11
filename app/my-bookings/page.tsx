"use client";
import { useState, useEffect } from "react";
import Header from "../components/header";

const typeLabels: Record<string, { label: string; icon: string; color: string }> = {
  OPD:     { label: "OPD",     icon: "🩺", color: "bg-blue-100 text-blue-700"   },
  Surgery: { label: "Surgery", icon: "🏥", color: "bg-purple-100 text-purple-700" },
  Lab:     { label: "Lab",     icon: "🧪", color: "bg-yellow-100 text-yellow-700" },
  IPD:     { label: "IPD",     icon: "🛏️", color: "bg-pink-100 text-pink-700"   },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending:   { label: "Pending",   color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Confirmed", color: "bg-green-100 text-green-700"  },
  completed: { label: "Completed", color: "bg-teal-100 text-teal-700"    },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700"      },
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("");
  const [activeStatus, setActiveStatus] = useState("");

  useEffect(() => {
    fetchBookings();
  }, [activeType, activeStatus]);

  async function fetchBookings() {
    const userId = localStorage.getItem("userId");
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ userId });
      if (activeType) params.append("type", activeType);
      if (activeStatus) params.append("status", activeStatus);
      const res = await fetch(`/api/my-bookings?${params}`);
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
        setSummary(data.summary);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function formatDate(d: string) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  }

  function getBookingTitle(b: any) {
    if (b.type === "OPD")     return b.doctorName  ? `Dr. ${b.doctorName}` : "OPD Appointment";
    if (b.type === "Surgery") return b.packageName ?? "Surgery Package";
    if (b.type === "Lab")     return b.testName    ?? "Lab Test";
    return b.notes ?? b.type;
  }

  function getBookingSubtitle(b: any) {
    if (b.type === "OPD") {
      const parts = [];
      if (b.speciality)   parts.push(b.speciality);
      if (b.hospitalName) parts.push(b.hospitalName);
      if (b.appointmentDate) parts.push(formatDate(b.appointmentDate));
      if (b.slot) parts.push(b.slot);
      return parts.join(" • ");
    }
    if (b.type === "Surgery") {
      const parts = [];
      if (b.category)     parts.push(b.category);
      if (b.hospitalName) parts.push(b.hospitalName);
      if (b.roomType)     parts.push(b.roomType + " Room");
      return parts.join(" • ");
    }
    if (b.type === "Lab") {
      const parts = [];
      if (b.category)     parts.push(b.category);
      if (b.hospitalName) parts.push(b.hospitalName);
      if (b.appointmentDate) parts.push(formatDate(b.appointmentDate));
      if (b.slot) parts.push(b.slot);
      return parts.join(" • ");
    }
    return "";
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto py-8 px-4">

        <h1 className="text-2xl font-bold text-gray-800 mb-1">📋 Meri Bookings</h1>
        <p className="text-sm text-gray-500 mb-6">Aapki aur family ki sabhi bookings</p>

        {/* Summary Cards */}
        {!loading && summary.total > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { key: "total",     label: "Total",     color: "bg-gray-100 text-gray-700"      },
              { key: "pending",   label: "Pending",   color: "bg-yellow-100 text-yellow-700"  },
              { key: "confirmed", label: "Confirmed", color: "bg-green-100 text-green-700"    },
              { key: "completed", label: "Completed", color: "bg-teal-100 text-teal-700"      },
            ].map(({ key, label, color }) => (
              <div key={key} className={`${color} rounded-2xl p-3 text-center`}>
                <p className="text-2xl font-bold">{summary[key] ?? 0}</p>
                <p className="text-xs font-medium">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {/* Type filter */}
          {["", "OPD", "Surgery", "Lab"].map((t) => (
            <button key={t} onClick={() => setActiveType(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                activeType === t
                  ? "bg-teal-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-teal-400"
              }`}>
              {t === "" ? "Sabhi" : `${typeLabels[t]?.icon} ${typeLabels[t]?.label}`}
            </button>
          ))}
          <div className="w-px bg-gray-200 mx-1" />
          {/* Status filter */}
          {["", "pending", "confirmed", "completed", "cancelled"].map((s) => (
            <button key={s} onClick={() => setActiveStatus(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                activeStatus === s
                  ? "bg-teal-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-teal-400"
              }`}>
              {s === "" ? "All Status" : statusConfig[s]?.label}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-16 text-teal-600">Bookings load ho rahi hain...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-gray-500 font-medium">Koi booking nahi mili</p>
            <p className="text-sm text-gray-400 mt-1">
              {activeType || activeStatus ? "Filter change kar ke dekhein" : "Abhi koi service book karein"}
            </p>
            <div className="flex gap-3 justify-center mt-5">
              <a href="/opd-booking"
                className="bg-teal-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition">
                OPD Book Karein
              </a>
              <a href="/lab-tests"
                className="bg-white border border-teal-600 text-teal-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-50 transition">
                Lab Test
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const typeInfo   = typeLabels[b.type]   ?? { label: b.type, icon: "📄", color: "bg-gray-100 text-gray-700" };
              const statusInfo = statusConfig[b.status] ?? { label: b.status, color: "bg-gray-100 text-gray-600" };
              return (
                <div key={b._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    {/* Left */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${typeInfo.color}`}>
                        {typeInfo.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{getBookingTitle(b)}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{getBookingSubtitle(b)}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          {b.paymentStatus === "paid" && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">
                              ✓ Paid
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right */}
                    <div className="text-right flex-shrink-0">
                      {b.amount > 0 && (
                        <p className="font-bold text-teal-700 text-base">₹{b.amount.toLocaleString()}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(b.createdAt)}</p>
                    </div>
                  </div>

                  {/* Booking ID */}
                  <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
                    <p className="text-xs text-gray-400 font-mono">{b.bookingId}</p>
                    {b.type === "Surgery" && b.status === "pending" && (
                      <p className="text-xs text-orange-600">⏳ Team 24h mein contact karegi</p>
                    )}
                    {b.type === "Lab" && b.status === "confirmed" && b.slot === "Home Collection" && (
                      <p className="text-xs text-blue-600">🚗 Home collection scheduled</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
