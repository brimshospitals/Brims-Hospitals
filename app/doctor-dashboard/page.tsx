"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Booking = {
  _id: string;
  bookingId: string;
  type: string;
  status: string;
  paymentStatus: string;
  appointmentDate: string;
  slot: string;
  amount: number;
  patientName: string;
  patientMobile: string;
  patientPhoto: string;
  consultType: string;
  symptoms: string;
};

type Doctor = {
  _id: string;
  name: string;
  department: string;
  speciality: string;
  photo: string;
  hospitalName: string;
  opdFee: number;
};

type Stats = { todayCount: number; pendingCount: number; completedCount: number };

const TAB_OPTIONS = [
  { key: "today",    label: "Aaj" },
  { key: "upcoming", label: "Upcoming" },
  { key: "all",      label: "Sab" },
];

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const TYPE_BADGE: Record<string, string> = {
  OPD:          "bg-teal-100 text-teal-700",
  Consultation: "bg-purple-100 text-purple-700",
  Lab:          "bg-orange-100 text-orange-700",
};

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function Initials({ name, photo }: { name: string; photo: string }) {
  if (photo) return <img src={photo} alt={name} className="w-10 h-10 rounded-xl object-cover" />;
  const ini = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-sm">
      {ini}
    </div>
  );
}

export default function DoctorDashboard() {
  const router = useRouter();
  const [doctorId, setDoctorId]     = useState("");
  const [doctor, setDoctor]         = useState<Doctor | null>(null);
  const [bookings, setBookings]     = useState<Booking[]>([]);
  const [stats, setStats]           = useState<Stats>({ todayCount: 0, pendingCount: 0, completedCount: 0 });
  const [tab, setTab]               = useState("today");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading]       = useState(true);
  const [updating, setUpdating]     = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const did  = localStorage.getItem("doctorId");
    if (!did || role !== "doctor") {
      router.replace("/login");
      return;
    }
    setDoctorId(did);
  }, []);

  useEffect(() => {
    if (!doctorId) return;
    fetchAppointments();
  }, [doctorId, tab]);

  async function fetchAppointments() {
    setLoading(true);
    try {
      const res  = await fetch(`/api/doctor/appointments?doctorId=${doctorId}&tab=${tab}`);
      const data = await res.json();
      if (data.success) {
        setDoctor(data.doctor);
        setBookings(data.bookings);
        setStats(data.stats);
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(bookingId: string, status: string) {
    setUpdating(bookingId);
    try {
      const res  = await fetch("/api/doctor/appointments", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ bookingId, status }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) => prev.map((b) => b._id === bookingId ? { ...b, status } : b));
      }
    } finally {
      setUpdating(null);
    }
  }

  function logout() {
    ["userId","userRole","userName","doctorId","doctorName","hospitalId","hospitalName"].forEach((k) =>
      localStorage.removeItem(k)
    );
    router.push("/login");
  }

  const filtered = typeFilter === "all"
    ? bookings
    : bookings.filter((b) => b.type === typeFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {doctor?.photo ? (
              <img src={doctor.photo} className="w-9 h-9 rounded-xl object-cover" alt="" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                {doctor?.name?.charAt(0) || "D"}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-800 text-sm leading-tight">{doctor?.name || "Doctor"}</p>
              <p className="text-xs text-gray-500">{doctor?.department} · {doctor?.hospitalName}</p>
            </div>
          </div>
          <button onClick={logout} className="text-xs text-gray-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50">
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Aaj ke Patients", value: stats.todayCount,     color: "from-blue-500 to-cyan-500"    },
            { label: "Pending",          value: stats.pendingCount,   color: "from-amber-500 to-orange-400" },
            { label: "Completed",        value: stats.completedCount, color: "from-green-500 to-emerald-400" },
          ].map((s) => (
            <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow-sm`}>
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="text-xs mt-1 opacity-80">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs + type filter */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex bg-white rounded-xl border border-gray-200 p-1 gap-1">
            {TAB_OPTIONS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  tab === t.key ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex bg-white rounded-xl border border-gray-200 p-1 gap-1">
            {["all","OPD","Consultation"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  typeFilter === t ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {t === "all" ? "Sabhi" : t}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings list */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500 text-sm">Koi appointment nahi mili</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((b) => (
              <div key={b._id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <Initials name={b.patientName} photo={b.patientPhoto} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800 text-sm">{b.patientName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[b.type] || "bg-gray-100 text-gray-600"}`}>
                        {b.type}
                      </span>
                      {b.consultType && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                          {b.consultType === "video" ? "📹 Video" : "🎙️ Audio"}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                      <span>📅 {formatDate(b.appointmentDate)}</span>
                      {b.slot && <span>🕐 {b.slot}</span>}
                      {b.patientMobile && <span>📱 {b.patientMobile}</span>}
                      {b.amount > 0 && <span>💰 ₹{b.amount}</span>}
                    </div>
                    {b.symptoms && (
                      <p className="text-xs text-gray-400 mt-1 truncate">Symptoms: {b.symptoms}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status]}`}>
                      {b.status}
                    </span>
                    {b.type === "Consultation" && b.status === "confirmed" && (
                      <a
                        href={`/consultation/${b._id}?type=${b.consultType || "video"}`}
                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Join Call
                      </a>
                    )}
                    {b.status === "pending" && (
                      <button
                        onClick={() => updateStatus(b._id, "confirmed")}
                        disabled={updating === b._id}
                        className="text-xs bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        {updating === b._id ? "..." : "Confirm"}
                      </button>
                    )}
                    {b.status === "confirmed" && (
                      <button
                        onClick={() => updateStatus(b._id, "completed")}
                        disabled={updating === b._id}
                        className="text-xs bg-teal-500 text-white px-3 py-1 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
                      >
                        {updating === b._id ? "..." : "Done"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
