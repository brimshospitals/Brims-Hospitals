"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Coordinator = {
  _id: string; coordinatorId: string; name: string; mobile: string;
  district?: string; area?: string; type: string;
  commissionRates: { Surgery: number; Lab: number; OPD: number; IPD: number };
  totalClients: number; totalBookings: number;
  totalEarned: number; pendingEarned: number; paidEarned: number;
};

type Booking = {
  _id: string; bookingId: string; type: string; status: string;
  amount: number; coordinatorCommission: number; coordinatorPaid: boolean;
  appointmentDate?: string; notes?: string; createdAt: string;
  isPartialBooking?: boolean; depositAmount?: number; balanceAmount?: number;
};

type Client = { _id: string; name: string; mobile: string; age?: number; gender?: string; memberId?: string };

type BookingFormState = {
  step: "client" | "service" | "details" | "confirm";
  client?: Client;
  clientMobile: string;
  clientFound?: boolean;
  // New client form
  newName: string; newAge: string; newGender: string;
  // Service
  serviceType: "Surgery" | "Lab" | "OPD" | "";
  // Booking details
  hospitalId: string; packageId: string; labTestId: string; doctorId: string;
  appointmentDate: string; slot: string; amount: string;
  paymentMode: string;
  isPartialBooking: boolean;
};

const TABS = [
  { key: "dashboard", label: "Dashboard",    icon: "🏠" },
  { key: "clients",   label: "Mere Clients", icon: "👥" },
  { key: "bookings",  label: "Bookings",     icon: "📋" },
  { key: "book",      label: "New Booking",  icon: "➕" },
  { key: "earnings",  label: "Earnings",     icon: "💰" },
];

const STATUS_COLORS: Record<string,string> = {
  pending:   "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  completed: "bg-teal-100 text-teal-700",
  cancelled: "bg-red-100 text-red-700",
};
const TYPE_ICON: Record<string,string> = { OPD:"🩺", Lab:"🧪", Surgery:"🔬", Consultation:"💻", IPD:"🛏️" };

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtAmt(n: number) { return "₹" + (n || 0).toLocaleString("en-IN"); }

export default function CoordinatorDashboard() {
  const router = useRouter();
  const [tab,         setTab]         = useState("dashboard");
  const [coordinator, setCoordinator] = useState<Coordinator | null>(null);
  const [stats,       setStats]       = useState<any>(null);
  const [bookings,    setBookings]    = useState<Booking[]>([]);
  const [clients,     setClients]     = useState<Client[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [toast,       setToast]       = useState("");
  const [toastOk,     setToastOk]     = useState(true);

  // Booking flow state
  const [bForm, setBForm] = useState<BookingFormState>({
    step: "client", clientMobile: "", newName: "", newAge: "", newGender: "male",
    serviceType: "", hospitalId: "", packageId: "", labTestId: "", doctorId: "",
    appointmentDate: "", slot: "", amount: "", paymentMode: "counter", isPartialBooking: false,
  });
  const [bLoading,  setBLoading]  = useState(false);
  const [bError,    setBError]    = useState("");
  const [clientLookupLoading, setClientLookupLoading] = useState(false);

  // Surgery/Lab data
  const [surgeries, setSurgeries] = useState<any[]>([]);
  const [labTests,  setLabTests]  = useState<any[]>([]);
  const [doctors,   setDoctors]   = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);

  function showToast(msg: string, ok = true) {
    setToast(msg); setToastOk(ok);
    setTimeout(() => setToast(""), 3500);
  }

  // ── Fetch dashboard data ────────────────────────────────────────────────
  async function fetchDashboard() {
    setLoading(true);
    try {
      const [dashRes, authRes] = await Promise.all([
        fetch("/api/coordinator/dashboard"),
        fetch("/api/auth/me"),
      ]);
      const dashData = await dashRes.json();
      const authData = await authRes.json();

      if (!authData.success || authData.user?.role !== "coordinator") {
        router.push("/staff-login"); return;
      }
      if (dashData.success) {
        setCoordinator(dashData.coordinator);
        setStats(dashData.stats);
        setBookings(dashData.bookings);

        // Extract unique clients from bookings
        const clientMap: Record<string, Client> = {};
        dashData.bookings.forEach((b: Booking) => {
          try {
            const n = JSON.parse(b.notes || "{}");
            if (n.patientMobile && !clientMap[n.patientMobile]) {
              clientMap[n.patientMobile] = {
                _id: n.patientMobile, name: n.patientName || "Unknown",
                mobile: n.patientMobile, age: n.patientAge, gender: n.patientGender,
              };
            }
          } catch {}
        });
        setClients(Object.values(clientMap));
      }
    } finally { setLoading(false); }
  }

  // ── Client lookup ───────────────────────────────────────────────────────
  async function lookupClient() {
    const mob = bForm.clientMobile.trim();
    if (!/^\d{10}$/.test(mob)) { setBError("Valid 10-digit mobile daalo"); return; }
    setClientLookupLoading(true); setBError("");
    try {
      const res  = await fetch(`/api/coordinator/clients?mobile=${mob}`);
      const data = await res.json();
      if (data.exists) {
        setBForm(f => ({ ...f, client: data.user, clientFound: true, step: "service" }));
        showToast(`✓ ${data.user.name} — pehle se registered hai`);
      } else {
        setBForm(f => ({ ...f, clientFound: false }));
      }
    } finally { setClientLookupLoading(false); }
  }

  async function registerNewClient() {
    if (!bForm.newName.trim() || !bForm.newAge) { setBError("Naam aur age zaruri hai"); return; }
    setBLoading(true); setBError("");
    try {
      const res  = await fetch("/api/coordinator/clients", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: bForm.clientMobile, name: bForm.newName,
          age: bForm.newAge, gender: bForm.newGender,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBForm(f => ({ ...f, client: data.user, clientFound: true, step: "service" }));
        showToast("Client register ho gaya!");
      } else { setBError(data.message); }
    } finally { setBLoading(false); }
  }

  // ── Load packages/tests when service type selected ──────────────────────
  async function onServiceSelect(type: "Surgery" | "Lab" | "OPD") {
    setBForm(f => ({ ...f, serviceType: type, step: "details" }));
    try {
      if (type === "Surgery") {
        const res = await fetch("/api/surgery-packages");
        const d   = await res.json();
        setSurgeries(d.packages || []);
      } else if (type === "Lab") {
        const res = await fetch("/api/lab-tests");
        const d   = await res.json();
        setLabTests(d.tests || d.labTests || []);
      } else {
        const [hRes, dRes] = await Promise.all([
          fetch("/api/doctors"),
          fetch("/api/hospital-onboarding?list=true").catch(() => ({ json: () => ({}) })),
        ]);
        const hd = await hRes.json();
        setDoctors(hd.doctors || []);
      }
    } catch {}
  }

  // ── Submit booking ──────────────────────────────────────────────────────
  async function submitBooking() {
    if (!bForm.client) { setBError("Client select karein"); return; }
    if (!bForm.appointmentDate) { setBError("Date zaruri hai"); return; }
    if (!bForm.amount || Number(bForm.amount) <= 0) { setBError("Amount zaruri hai"); return; }
    if (bForm.serviceType === "Surgery" && !bForm.packageId) { setBError("Surgery package select karein"); return; }
    if (bForm.serviceType === "Lab"     && !bForm.labTestId)  { setBError("Lab test select karein"); return; }

    setBLoading(true); setBError("");
    try {
      const payload: any = {
        type:           bForm.serviceType || "OPD",
        appointmentDate:bForm.appointmentDate,
        slot:           bForm.slot,
        patientName:    bForm.client.name,
        patientMobile:  bForm.client.mobile,
        patientAge:     bForm.client.age,
        patientGender:  bForm.client.gender,
        patientUserId:  bForm.client._id,
        paymentMode:    bForm.paymentMode,
        amount:         Number(bForm.amount),
        isPartialBooking: bForm.isPartialBooking,
        depositAmount:  bForm.isPartialBooking ? 1000 : undefined,
        ...(bForm.packageId && { packageId: bForm.packageId }),
        ...(bForm.labTestId && { labTestId: bForm.labTestId }),
        ...(bForm.doctorId  && { doctorId:  bForm.doctorId  }),
        ...(bForm.hospitalId && { hospitalId: bForm.hospitalId }),
      };

      const res  = await fetch("/api/bookings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Booking ho gayi! 🎉");
        setBForm({ step: "client", clientMobile: "", newName: "", newAge: "", newGender: "male",
          serviceType: "", hospitalId: "", packageId: "", labTestId: "", doctorId: "",
          appointmentDate: "", slot: "", amount: "", paymentMode: "counter", isPartialBooking: false });
        fetchDashboard();
        setTab("bookings");
      } else { setBError(data.message); }
    } finally { setBLoading(false); }
  }

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!coordinator) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm max-w-sm">
          <p className="text-4xl mb-3">🔒</p>
          <h3 className="font-bold text-gray-800 mb-2">Access Denied</h3>
          <p className="text-sm text-gray-500">Aapka coordinator profile nahi mila.</p>
          <button onClick={() => router.push("/staff-login")} className="mt-4 bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">Login Karein</button>
        </div>
      </div>
    );
  }

  const inp = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all";
  const sel = inp + " bg-white";

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold text-white flex items-center gap-2 ${toastOk ? "bg-green-700" : "bg-red-600"}`}>
          {toastOk ? "✓" : "✗"} {toast}
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-emerald-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-green-200 text-xs font-medium">Health Coordinator</p>
            <h1 className="font-bold text-lg">{coordinator.name}</h1>
            <p className="text-green-200 text-xs">{coordinator.coordinatorId} · {coordinator.area || coordinator.district || "Bihar"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-green-200">Pending Earnings</p>
            <p className="font-bold text-xl">{fmtAmt(stats?.pendingEarned || 0)}</p>
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-4 pb-0 flex overflow-x-auto gap-1 scrollbar-hide">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-shrink-0 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition flex items-center gap-1.5 ${
                tab === t.key ? "bg-white text-green-700" : "text-green-100 hover:bg-white/10"
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">

        {/* ── DASHBOARD TAB ─────────────────────────────────────── */}
        {tab === "dashboard" && (
          <div className="space-y-4">
            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Aaj ki Bookings", value: stats?.todayBookings || 0, icon: "📅", color: "from-blue-500 to-cyan-500" },
                { label: "Mahine ki Bookings", value: stats?.monthBookings || 0, icon: "📋", color: "from-green-500 to-emerald-400" },
                { label: "Total Clients", value: stats?.totalClients || 0, icon: "👥", color: "from-purple-500 to-violet-400" },
                { label: "Total Earnings", value: fmtAmt(stats?.totalEarned || 0), icon: "💰", color: "from-amber-500 to-orange-400" },
              ].map(s => (
                <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow-sm`}>
                  <p className="text-2xl mb-1">{s.icon}</p>
                  <p className="font-bold text-lg">{s.value}</p>
                  <p className="text-xs text-white/80">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Commission rates */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <h3 className="font-bold text-gray-700 text-sm mb-3">Aapke Commission Rates</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(coordinator.commissionRates).map(([type, rate]) => rate > 0 ? (
                  <div key={type} className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-green-700">{rate}%</p>
                    <p className="text-xs text-green-600 font-medium">{type}</p>
                  </div>
                ) : null)}
              </div>
            </div>

            {/* Recent bookings */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-700 text-sm">Recent Bookings</h3>
                <button onClick={() => setTab("bookings")} className="text-xs text-green-600 font-semibold">Sab dekhein →</button>
              </div>
              {bookings.slice(0, 5).map(b => {
                let notes: any = {};
                try { notes = JSON.parse(b.notes || "{}"); } catch {}
                return (
                  <div key={b._id} className="px-4 py-3 border-b border-gray-50 last:border-0 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{TYPE_ICON[b.type] || "📋"}</span>
                        <span className="text-sm font-semibold text-gray-700">{notes.patientName || "—"}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status]}`}>{b.status}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{b.bookingId} · {fmtDate(b.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-700">{fmtAmt(b.amount)}</p>
                      {b.coordinatorCommission > 0 && (
                        <p className="text-xs text-green-600 font-medium">Comm: {fmtAmt(b.coordinatorCommission)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {bookings.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">Koi booking nahi hui abhi tak</div>
              )}
            </div>
          </div>
        )}

        {/* ── CLIENTS TAB ───────────────────────────────────────── */}
        {tab === "clients" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-700">Mere Clients ({clients.length})</h3>
              <button onClick={() => setTab("book")} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-xl font-semibold">+ New Booking</button>
            </div>
            {clients.map(c => (
              <div key={c._id} className="px-4 py-3 border-b border-gray-50 last:border-0 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.mobile} · {c.age ? `${c.age}y` : ""} {c.gender || ""}</p>
                </div>
                <button onClick={() => {
                  setBForm(f => ({ ...f, client: c, clientMobile: c.mobile, clientFound: true, step: "service" }));
                  setTab("book");
                }} className="text-xs text-green-600 font-semibold border border-green-200 px-3 py-1.5 rounded-xl hover:bg-green-50 transition">
                  Book
                </button>
              </div>
            ))}
            {clients.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">Koi client nahi hai abhi tak</div>}
          </div>
        )}

        {/* ── BOOKINGS TAB ──────────────────────────────────────── */}
        {tab === "bookings" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-700">Sabhi Bookings ({bookings.length})</h3>
            </div>
            {bookings.map(b => {
              let notes: any = {};
              try { notes = JSON.parse(b.notes || "{}"); } catch {}
              return (
                <div key={b._id} className="px-4 py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span className="text-xl mt-0.5">{TYPE_ICON[b.type] || "📋"}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">{notes.patientName || "—"}</p>
                        <p className="text-xs text-gray-400">{b.bookingId} · {fmtDate(b.appointmentDate || b.createdAt)}</p>
                        <div className="flex gap-1.5 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status]}`}>{b.status}</span>
                          {b.isPartialBooking && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">Deposit ₹{b.depositAmount?.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-700">{fmtAmt(b.amount)}</p>
                      {b.coordinatorCommission > 0 && (
                        <p className={`text-xs font-semibold ${b.coordinatorPaid ? "text-green-600" : "text-amber-600"}`}>
                          {b.coordinatorPaid ? "✓ Paid" : "⏳ Pending"} {fmtAmt(b.coordinatorCommission)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {bookings.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">Koi booking nahi hai</div>}
          </div>
        )}

        {/* ── NEW BOOKING TAB ───────────────────────────────────── */}
        {tab === "book" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-4">
              <h3 className="text-white font-bold">➕ Naya Booking Karein</h3>
              <p className="text-green-200 text-xs mt-0.5">Client ke liye OPD / Surgery / Lab book karein</p>
            </div>

            {/* Step indicators */}
            <div className="flex border-b border-gray-100">
              {(["client","service","details","confirm"] as const).map((s, i) => (
                <div key={s} className={`flex-1 py-2.5 text-center text-xs font-semibold transition ${
                  bForm.step === s ? "text-green-700 border-b-2 border-green-600" : "text-gray-400"
                }`}>
                  {i + 1}. {s === "client" ? "Client" : s === "service" ? "Service" : s === "details" ? "Details" : "Confirm"}
                </div>
              ))}
            </div>

            <div className="p-5">
              {bError && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm mb-4">⚠️ {bError}</div>}

              {/* STEP 1: Client ─────────────────────────────────── */}
              {bForm.step === "client" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Client ka Mobile Number</label>
                    <div className="mt-1 flex gap-2">
                      <div className="flex-1 flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-100 transition">
                        <span className="px-3 py-2.5 bg-gray-50 text-gray-500 text-sm border-r border-gray-200">+91</span>
                        <input type="tel" maxLength={10} value={bForm.clientMobile}
                          onChange={e => setBForm(f => ({ ...f, clientMobile: e.target.value.replace(/\D/g, ""), clientFound: undefined }))}
                          placeholder="9876543210" className="flex-1 px-3 py-2.5 text-sm focus:outline-none" />
                      </div>
                      <button onClick={lookupClient} disabled={clientLookupLoading || bForm.clientMobile.length < 10}
                        className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">
                        {clientLookupLoading ? "..." : "Search"}
                      </button>
                    </div>
                  </div>

                  {/* Client found */}
                  {bForm.clientFound === true && bForm.client && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-800 font-bold">
                        {bForm.client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-green-800">{bForm.client.name}</p>
                        <p className="text-xs text-green-600">{bForm.client.mobile} · {bForm.client.age ? `${bForm.client.age}y` : ""}</p>
                      </div>
                      <button onClick={() => setBForm(f => ({ ...f, step: "service" }))}
                        className="bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl">
                        Continue →
                      </button>
                    </div>
                  )}

                  {/* Client not found — new registration form */}
                  {bForm.clientFound === false && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                      <p className="text-sm font-semibold text-amber-800">📋 Naya Client Register Karein</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-gray-500">Poora Naam *</label>
                          <input value={bForm.newName} onChange={e => setBForm(f => ({ ...f, newName: e.target.value }))}
                            placeholder="Ramesh Kumar" className={`mt-1 ${inp}`} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Age *</label>
                          <input type="number" min={1} max={120} value={bForm.newAge}
                            onChange={e => setBForm(f => ({ ...f, newAge: e.target.value }))}
                            placeholder="35" className={`mt-1 ${inp}`} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Gender *</label>
                          <select value={bForm.newGender} onChange={e => setBForm(f => ({ ...f, newGender: e.target.value }))} className={`mt-1 ${sel}`}>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>
                      </div>
                      <button onClick={registerNewClient} disabled={bLoading}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                        {bLoading ? "Register ho raha hai..." : "Register & Continue →"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Service ─────────────────────────────────── */}
              {bForm.step === "service" && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-sm text-green-800">
                    Client: <strong>{bForm.client?.name}</strong> · {bForm.client?.mobile}
                    <button onClick={() => setBForm(f => ({ ...f, step: "client", client: undefined, clientFound: undefined }))}
                      className="ml-2 text-green-600 underline text-xs">Change</button>
                  </div>
                  <p className="text-sm font-medium text-gray-600">Service chunein:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { type: "Surgery" as const, icon: "🔬", label: "Surgery Package", comm: coordinator.commissionRates.Surgery },
                      { type: "Lab"     as const, icon: "🧪", label: "Lab Test",         comm: coordinator.commissionRates.Lab },
                      { type: "OPD"     as const, icon: "🩺", label: "OPD Appointment",  comm: coordinator.commissionRates.OPD },
                    ].map(s => (
                      <button key={s.type} onClick={() => onServiceSelect(s.type)}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 transition text-center">
                        <span className="text-3xl">{s.icon}</span>
                        <span className="text-sm font-semibold text-gray-700">{s.label}</span>
                        {s.comm > 0 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{s.comm}% Commission</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: Details ─────────────────────────────────── */}
              {bForm.step === "details" && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-sm text-green-800 flex items-center justify-between">
                    <span>Client: <strong>{bForm.client?.name}</strong> · {bForm.serviceType}</span>
                    <button onClick={() => setBForm(f => ({ ...f, step: "service" }))} className="text-green-600 underline text-xs">Back</button>
                  </div>

                  {bForm.serviceType === "Surgery" && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Surgery Package *</label>
                      <select value={bForm.packageId} onChange={e => {
                        const pkg = surgeries.find((s: any) => s._id === e.target.value);
                        setBForm(f => ({ ...f, packageId: e.target.value, amount: String(pkg?.offerPrice || pkg?.mrp || ""), hospitalId: pkg?.hospitalId || "" }));
                      }} className={`mt-1 ${sel}`}>
                        <option value="">-- Package chunein --</option>
                        {surgeries.map((s: any) => <option key={s._id} value={s._id}>{s.name} — ₹{s.offerPrice?.toLocaleString()}</option>)}
                      </select>
                    </div>
                  )}

                  {bForm.serviceType === "Lab" && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Lab Test *</label>
                      <select value={bForm.labTestId} onChange={e => {
                        const lt = labTests.find((l: any) => l._id === e.target.value);
                        setBForm(f => ({ ...f, labTestId: e.target.value, amount: String(lt?.offerPrice || lt?.mrp || ""), hospitalId: lt?.hospitalId || "" }));
                      }} className={`mt-1 ${sel}`}>
                        <option value="">-- Test chunein --</option>
                        {labTests.map((l: any) => <option key={l._id} value={l._id}>{l.name} — ₹{l.offerPrice?.toLocaleString()}</option>)}
                      </select>
                    </div>
                  )}

                  {bForm.serviceType === "OPD" && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Doctor</label>
                      <select value={bForm.doctorId} onChange={e => {
                        const doc = doctors.find((d: any) => d._id === e.target.value);
                        setBForm(f => ({ ...f, doctorId: e.target.value, amount: String(doc?.offerFee || doc?.opdFee || "") }));
                      }} className={`mt-1 ${sel}`}>
                        <option value="">-- Doctor chunein --</option>
                        {doctors.map((d: any) => <option key={d._id} value={d._id}>{d.name} — {d.department}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Date *</label>
                      <input type="date" value={bForm.appointmentDate} min={new Date().toISOString().split("T")[0]}
                        onChange={e => setBForm(f => ({ ...f, appointmentDate: e.target.value }))}
                        className={`mt-1 ${inp}`} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Amount (₹) *</label>
                      <input type="number" value={bForm.amount}
                        onChange={e => setBForm(f => ({ ...f, amount: e.target.value }))}
                        className={`mt-1 ${inp}`} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Payment Mode</label>
                      <select value={bForm.paymentMode} onChange={e => setBForm(f => ({ ...f, paymentMode: e.target.value }))} className={`mt-1 ${sel}`}>
                        <option value="counter">Counter (Hospital par)</option>
                        <option value="online">Online</option>
                        <option value="wallet">Wallet</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Time Slot</label>
                      <input value={bForm.slot} onChange={e => setBForm(f => ({ ...f, slot: e.target.value }))}
                        placeholder="10:00 AM - 11:00 AM" className={`mt-1 ${inp}`} />
                    </div>
                  </div>

                  {/* Partial booking for surgery */}
                  {bForm.serviceType === "Surgery" && (
                    <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${bForm.isPartialBooking ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
                      <input type="checkbox" checked={bForm.isPartialBooking}
                        onChange={e => setBForm(f => ({ ...f, isPartialBooking: e.target.checked }))}
                        className="w-4 h-4 accent-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-700">📦 Partial Booking (₹1,000 Deposit)</p>
                        <p className="text-xs text-gray-400 mt-0.5">Sirf ₹1,000 abhi pay karein, baki hospital par. Team 24 ghante mein contact karegi.</p>
                      </div>
                    </label>
                  )}

                  {/* Commission preview */}
                  {bForm.amount && Number(bForm.amount) > 0 && (() => {
                    const type = bForm.serviceType as string;
                    const rate = coordinator.commissionRates[type as keyof typeof coordinator.commissionRates] || 0;
                    const comm = Math.round(Number(bForm.amount) * rate / 100);
                    return rate > 0 ? (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                        <span className="text-green-600 text-xl">💰</span>
                        <div>
                          <p className="text-sm font-semibold text-green-800">Aapka Commission: {fmtAmt(comm)} ({rate}%)</p>
                          <p className="text-xs text-green-600">Is booking par aapko {fmtAmt(comm)} milenge</p>
                        </div>
                      </div>
                    ) : null;
                  })()}

                  <button onClick={() => setBForm(f => ({ ...f, step: "confirm" }))}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-bold transition">
                    Review Booking →
                  </button>
                </div>
              )}

              {/* STEP 4: Confirm ─────────────────────────────────── */}
              {bForm.step === "confirm" && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100">
                    <h4 className="font-semibold text-gray-700 text-sm mb-3">Booking Summary</h4>
                    {[
                      ["Client",   bForm.client?.name || "—"],
                      ["Mobile",   bForm.client?.mobile || "—"],
                      ["Service",  bForm.serviceType || "—"],
                      ["Date",     bForm.appointmentDate ? fmtDate(bForm.appointmentDate) : "—"],
                      ["Payment",  bForm.paymentMode],
                      ["Amount",   fmtAmt(bForm.isPartialBooking ? 1000 : Number(bForm.amount))],
                      ...(bForm.isPartialBooking ? [["Balance at Hospital", fmtAmt(Number(bForm.amount) - 1000)]] : []),
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-gray-500">{k}</span>
                        <span className="font-semibold text-gray-700">{v}</span>
                      </div>
                    ))}
                    {(() => {
                      const type = bForm.serviceType as string;
                      const rate = coordinator.commissionRates[type as keyof typeof coordinator.commissionRates] || 0;
                      const comm = Math.round(Number(bForm.amount) * rate / 100);
                      return rate > 0 ? (
                        <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                          <span className="text-green-600 font-medium">Aapka Commission</span>
                          <span className="font-bold text-green-700">{fmtAmt(comm)}</span>
                        </div>
                      ) : null;
                    })()}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setBForm(f => ({ ...f, step: "details" }))}
                      className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold">
                      ← Edit
                    </button>
                    <button onClick={submitBooking} disabled={bLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-bold transition disabled:opacity-50">
                      {bLoading ? "Booking ho rahi hai..." : "✓ Confirm Booking"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── EARNINGS TAB ──────────────────────────────────────── */}
        {tab === "earnings" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Earned", value: fmtAmt(stats?.totalEarned || 0), color: "bg-green-50 text-green-700 border-green-200" },
                { label: "Pending",      value: fmtAmt(stats?.pendingEarned || 0), color: "bg-amber-50 text-amber-700 border-amber-200" },
                { label: "Paid",         value: fmtAmt(stats?.paidEarned || 0), color: "bg-blue-50 text-blue-700 border-blue-200" },
              ].map(s => (
                <div key={s.label} className={`rounded-2xl border p-4 text-center ${s.color}`}>
                  <p className="font-bold text-lg">{s.value}</p>
                  <p className="text-xs font-medium">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-700 text-sm">Commission History</h3>
              </div>
              {bookings.filter(b => b.coordinatorCommission > 0).map(b => {
                let notes: any = {};
                try { notes = JSON.parse(b.notes || "{}"); } catch {}
                return (
                  <div key={b._id} className="px-4 py-3 border-b border-gray-50 last:border-0 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{notes.patientName || "—"} — {b.type}</p>
                      <p className="text-xs text-gray-400">{b.bookingId} · {fmtDate(b.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${b.coordinatorPaid ? "text-green-600" : "text-amber-600"}`}>
                        {fmtAmt(b.coordinatorCommission)}
                      </p>
                      <p className="text-xs text-gray-400">{b.coordinatorPaid ? "✓ Paid" : "⏳ Pending"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}