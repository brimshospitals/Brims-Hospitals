"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Coordinator = {
  _id: string; coordinatorId: string; name: string; mobile: string;
  district?: string; area?: string; type: string;
  commissionRates: { Surgery: number; Lab: number; OPD: number; IPD: number; Consultation: number };
};

type Stats = {
  todayBookings: number; monthBookings: number; totalClients: number;
  totalEarned: number; pendingEarned: number; paidEarned: number; monthEarned: number;
};

type TrendPoint = { date: string; bookings: number; earned: number };

type PopulatedService = {
  _id: string; name: string; mrp?: number; offerPrice?: number;
  membershipPrice?: number; hospitalName?: string; category?: string;
};
type PopulatedDoctor = {
  _id: string; name: string; department?: string; hospitalName?: string;
  opdFee?: number; offerFee?: number;
};

type Booking = {
  _id: string; bookingId: string; type: string; status: string;
  amount: number; coordinatorCommission: number; coordinatorPaid: boolean;
  appointmentDate?: string; notes?: string; createdAt: string;
  isPartialBooking?: boolean; depositAmount?: number;
  packageId?: PopulatedService;
  labTestId?: PopulatedService;
  doctorId?: PopulatedDoctor;
  hospitalId?: { _id: string; name: string };
};

type FamilyMember = {
  _id: string; name: string; age: number; gender: string;
  relationship: string; memberId?: string; isActive: boolean;
};
type FamilyUser = {
  _id: string; name: string; mobile: string; memberId?: string;
  age?: number; gender?: string; familyMembers?: FamilyMember[];
  familyCardId?: { status: string; cardNumber: string; activationDate?: string; expiryDate?: string } | null;
  createdAt?: string;
};

type SimpleClient = { mobile: string; name: string; age?: number; gender?: string; visits?: number };

type BookingForm = {
  step: "client" | "service" | "details" | "confirm";
  client?: SimpleClient; clientMobile: string; clientFound?: boolean;
  newName: string; newAge: string; newGender: string;
  serviceType: "Surgery" | "Lab" | "OPD" | "IPD" | "";
  hospitalId: string; packageId: string; labTestId: string; doctorId: string;
  appointmentDate: string; slot: string; amount: string; depositAmount: string;
  paymentMode: string; isPartialBooking: boolean; symptoms: string;
};

const COORD_TYPE_LABEL: Record<string, string> = {
  health_worker: "Health Worker", gp: "General Practitioner",
  pharmacist: "Pharmacist", other: "Field Agent",
};

const STATUS_COLOR: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700 border-amber-200",
  confirmed: "bg-green-100 text-green-700 border-green-200",
  completed: "bg-teal-100 text-teal-700 border-teal-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};
const TYPE_ICON: Record<string, string> = {
  OPD: "🩺", Lab: "🧪", Surgery: "🔬", Consultation: "💻", IPD: "🛏️",
};

function fmt(n: number) { return "₹" + (n || 0).toLocaleString("en-IN"); }
function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function parseNotes(raw?: string) {
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

const inp = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all";
const sel = inp + " bg-white";

// ── Mini Bar Chart ──────────────────────────────────────────────────────────
function TrendChart({ data }: { data: TrendPoint[] }) {
  const max = Math.max(...data.map(d => d.earned), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-green-500 rounded-t-sm opacity-80 transition-all"
            style={{ height: `${Math.max(4, (d.earned / max) * 52)}px` }}
            title={`${d.date}: ${fmt(d.earned)}`}
          />
          <p className="text-[9px] text-gray-400 leading-none">{d.date.split(" ")[0]}</p>
        </div>
      ))}
    </div>
  );
}

export default function CoordinatorDashboard() {
  const router = useRouter();
  const [tab, setTab]               = useState("dashboard");
  const [coordinator, setCoordinator] = useState<Coordinator | null>(null);
  const [stats, setStats]           = useState<Stats | null>(null);
  const [trend, setTrend]           = useState<TrendPoint[]>([]);
  const [bookings, setBookings]     = useState<Booking[]>([]);
  const [families, setFamilies]     = useState<FamilyUser[]>([]);
  const [familiesLoading, setFamiliesLoading] = useState(false);
  const [familySearch, setFamilySearch] = useState("");
  const [familiesView, setFamiliesView] = useState<"list" | "register" | "add-member">("list");
  const [fReg, setFReg] = useState({
    mobile: "", otp: "", otpSent: false, otpLoading: false, userId: "",
    name: "", age: "", gender: "male", district: "",
    preExistingDiseases: [] as string[], idType: "", idNumber: "",
  });
  const [fMember, setFMember] = useState({
    primaryMobile: "", name: "", age: "", gender: "male",
    relationship: "spouse", loading: false, targetFamily: null as FamilyUser | null,
  });
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingTypeFilter, setBookingTypeFilter] = useState("all");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState("");
  const [toastOk, setToastOk]       = useState(true);

  // Booking flow
  const emptyForm: BookingForm = {
    step: "client", clientMobile: "", newName: "", newAge: "", newGender: "male",
    serviceType: "", hospitalId: "", packageId: "", labTestId: "", doctorId: "",
    appointmentDate: "", slot: "", amount: "", depositAmount: "1000",
    paymentMode: "counter", isPartialBooking: false, symptoms: "",
  };
  const [bForm, setBForm] = useState<BookingForm>(emptyForm);
  const [bLoading, setBLoading]       = useState(false);
  const [bError, setBError]           = useState("");
  const [clientLookup, setClientLookup] = useState(false);
  const [packages, setPackages]       = useState<any[]>([]);
  const [labTests, setLabTests]       = useState<any[]>([]);
  const [doctors, setDoctors]         = useState<any[]>([]);

  function showToast(msg: string, ok = true) {
    setToast(msg); setToastOk(ok);
    setTimeout(() => setToast(""), 3500);
  }

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchDashboard = useCallback(async () => {
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
        setTrend(dashData.trend || []);
        setBookings(dashData.bookings || []);
      }
    } finally { setLoading(false); }
  }, [router]);

  const fetchFamilies = useCallback(async () => {
    setFamiliesLoading(true);
    try {
      const res  = await fetch("/api/coordinator/families");
      const data = await res.json();
      if (data.success) setFamilies(data.families || []);
    } finally { setFamiliesLoading(false); }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  useEffect(() => {
    if (tab === "families") fetchFamilies();
  }, [tab, fetchFamilies]);

  // ── Booking helpers ────────────────────────────────────────────────────────
  async function lookupClient() {
    const mob = bForm.clientMobile.trim();
    if (!/^\d{10}$/.test(mob)) { setBError("Valid 10-digit mobile daalo"); return; }
    setClientLookup(true); setBError("");
    try {
      const res  = await fetch(`/api/coordinator/clients?mobile=${mob}`);
      const data = await res.json();
      if (data.exists) {
        const u = data.user;
        setBForm(f => ({
          ...f,
          client: { mobile: u.mobile, name: u.name, age: u.age, gender: u.gender, visits: 0 },
          clientFound: true, step: "service",
        }));
        showToast(`✓ ${u.name} — registered hai`);
      } else {
        setBForm(f => ({ ...f, clientFound: false }));
      }
    } finally { setClientLookup(false); }
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
        const u = data.user;
        setBForm(f => ({
          ...f,
          client: { mobile: u.mobile, name: u.name, age: u.age, gender: u.gender, visits: 0 },
          clientFound: true, step: "service",
        }));
        showToast("Client register ho gaya!");
      } else { setBError(data.message); }
    } finally { setBLoading(false); }
  }

  async function onServiceSelect(type: "Surgery" | "Lab" | "OPD" | "IPD") {
    setBForm(f => ({ ...f, serviceType: type, step: "details" }));
    try {
      if (type === "Surgery" || type === "IPD") {
        const res = await fetch("/api/surgery-packages");
        const d   = await res.json();
        setPackages(d.packages || []);
      } else if (type === "Lab") {
        const res = await fetch("/api/lab-tests");
        const d   = await res.json();
        setLabTests(d.tests || d.labTests || []);
      } else if (type === "OPD") {
        const res = await fetch("/api/doctors");
        const d   = await res.json();
        setDoctors(d.doctors || []);
      }
    } catch {}
  }

  async function submitBooking() {
    if (!bForm.client)                                   { setBError("Client select karein"); return; }
    if (!bForm.appointmentDate)                          { setBError("Date zaruri hai"); return; }
    if (!bForm.amount || Number(bForm.amount) <= 0)      { setBError("Amount zaruri hai"); return; }
    if ((bForm.serviceType === "Surgery" || bForm.serviceType === "IPD") && !bForm.packageId) {
      setBError("Package select karein"); return;
    }
    if (bForm.serviceType === "Lab" && !bForm.labTestId) { setBError("Lab test select karein"); return; }

    setBLoading(true); setBError("");
    try {
      const isPartial   = bForm.isPartialBooking;
      const depositAmt  = isPartial ? Number(bForm.depositAmount) || 1000 : undefined;
      const res = await fetch("/api/bookings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type:             bForm.serviceType || "OPD",
          appointmentDate:  bForm.appointmentDate,
          slot:             bForm.slot,
          patientName:      bForm.client.name,
          patientMobile:    bForm.client.mobile,
          patientAge:       bForm.client.age,
          patientGender:    bForm.client.gender,
          symptoms:         bForm.symptoms,
          paymentMode:      bForm.paymentMode,
          amount:           Number(bForm.amount),
          isPartialBooking: isPartial,
          depositAmount:    depositAmt,
          ...(bForm.packageId  && { packageId:  bForm.packageId  }),
          ...(bForm.labTestId  && { labTestId:  bForm.labTestId  }),
          ...(bForm.doctorId   && { doctorId:   bForm.doctorId   }),
          ...(bForm.hospitalId && { hospitalId: bForm.hospitalId }),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Booking ho gayi! 🎉");
        setBForm(emptyForm);
        fetchDashboard();
        setTab("bookings");
      } else { setBError(data.message); }
    } finally { setBLoading(false); }
  }

  // ── Filtered bookings ──────────────────────────────────────────────────────
  const filteredBookings = bookings.filter(b => {
    const n = parseNotes(b.notes);
    const matchSearch = !bookingSearch ||
      (n.patientName || "").toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.bookingId.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      (n.patientMobile || "").includes(bookingSearch);
    const matchType   = bookingTypeFilter   === "all" || b.type   === bookingTypeFilter;
    const matchStatus = bookingStatusFilter === "all" || b.status === bookingStatusFilter;
    return matchSearch && matchType && matchStatus;
  });

  // ── Commission calc ────────────────────────────────────────────────────────
  function commissionPreview() {
    if (!coordinator || !bForm.serviceType || !bForm.amount) return null;
    const rate = coordinator.commissionRates[bForm.serviceType as keyof typeof coordinator.commissionRates] || 0;
    if (!rate) return null;
    return { rate, amount: Math.round(Number(bForm.amount) * rate / 100) };
  }

  // ── Family registration functions ─────────────────────────────────────────
  async function famSendOtp() {
    if (!/^\d{10}$/.test(fReg.mobile)) { showToast("Valid 10-digit mobile daalo", false); return; }
    setFReg(f => ({ ...f, otpLoading: true }));
    try {
      const lkRes = await fetch("/api/coordinator/families", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lookup", mobile: fReg.mobile }),
      });
      const lkData = await lkRes.json();
      if (lkData.exists) {
        showToast(`${lkData.user?.name || "User"} already registered hai — member add kar sakte hain`);
        setFMember(m => ({ ...m, primaryMobile: fReg.mobile, targetFamily: lkData.user }));
        setFamiliesView("add-member");
        setFReg(f => ({ ...f, otpLoading: false }));
        return;
      }
      const otpRes = await fetch("/api/coordinator/families", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-otp", mobile: fReg.mobile }),
      });
      const otpData = await otpRes.json();
      if (otpData.success) {
        setFReg(f => ({ ...f, otpSent: true, userId: otpData.userId, otpLoading: false }));
        showToast("OTP bheja gaya 📱");
      } else {
        showToast(otpData.message || "OTP send failed", false);
        setFReg(f => ({ ...f, otpLoading: false }));
      }
    } catch {
      showToast("Network error", false);
      setFReg(f => ({ ...f, otpLoading: false }));
    }
  }

  async function famVerifyRegister() {
    if (fReg.otp.length < 4) { showToast("OTP daalo", false); return; }
    if (!fReg.name.trim() || !fReg.age) { showToast("Naam aur age zaruri hai", false); return; }
    setFReg(f => ({ ...f, otpLoading: true }));
    try {
      const res = await fetch("/api/coordinator/families", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-register", mobile: fReg.mobile, otp: fReg.otp,
          name: fReg.name, age: fReg.age, gender: fReg.gender,
          district: fReg.district, preExistingDiseases: fReg.preExistingDiseases,
          idType: fReg.idType || undefined, idNumber: fReg.idNumber || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Register ho gaya!");
        fetchFamilies();
        setFReg({ mobile: "", otp: "", otpSent: false, otpLoading: false, userId: "", name: "", age: "", gender: "male", district: "", preExistingDiseases: [], idType: "", idNumber: "" });
        setFamiliesView("list");
      } else {
        showToast(data.message || "Registration failed", false);
        setFReg(f => ({ ...f, otpLoading: false }));
      }
    } catch {
      showToast("Network error", false);
      setFReg(f => ({ ...f, otpLoading: false }));
    }
  }

  async function famAddMember() {
    if (!fMember.name.trim() || !fMember.age || !fMember.relationship) {
      showToast("Naam, age aur rishta zaruri hai", false); return;
    }
    const primary = fMember.targetFamily?.mobile || fMember.primaryMobile;
    if (!primary) { showToast("Primary member mobile zaruri hai", false); return; }
    setFMember(m => ({ ...m, loading: true }));
    try {
      const res = await fetch("/api/coordinator/families", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-member", primaryMobile: primary,
          name: fMember.name, age: fMember.age, gender: fMember.gender,
          relationship: fMember.relationship,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Member add ho gaya!");
        fetchFamilies();
        setFMember({ primaryMobile: "", name: "", age: "", gender: "male", relationship: "spouse", loading: false, targetFamily: null });
        setFamiliesView("list");
      } else {
        showToast(data.message || "Failed", false);
        setFMember(m => ({ ...m, loading: false }));
      }
    } catch {
      showToast("Network error", false);
      setFMember(m => ({ ...m, loading: false }));
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
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
          <p className="text-sm text-gray-500 mb-4">Coordinator profile nahi mila.</p>
          <button onClick={() => router.push("/staff-login")}
            className="bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
            Login Karein
          </button>
        </div>
      </div>
    );
  }

  const comm = commissionPreview();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold text-white flex items-center gap-2 ${toastOk ? "bg-green-700" : "bg-red-600"}`}>
          {toastOk ? "✓" : "✗"} {toast}
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-gradient-to-r from-green-700 to-emerald-600 text-white shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-200 text-[11px] font-semibold uppercase tracking-widest">
                {COORD_TYPE_LABEL[coordinator.type] || "Health Coordinator"}
              </p>
              <h1 className="font-bold text-lg leading-tight">{coordinator.name}</h1>
              <p className="text-green-200 text-xs mt-0.5">
                {coordinator.coordinatorId} · {coordinator.area || coordinator.district || "Bihar"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-green-200 text-[11px] font-medium">Pending Payout</p>
              <p className="font-black text-2xl">{fmt(stats?.pendingEarned || 0)}</p>
              <p className="text-green-200 text-[10px]">Is mahine: {fmt(stats?.monthEarned || 0)}</p>
            </div>
          </div>

          {/* Quick stats strip */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: "Aaj",    value: stats?.todayBookings  || 0, unit: "bookings" },
              { label: "Mahina", value: stats?.monthBookings  || 0, unit: "bookings" },
              { label: "Clients",value: stats?.totalClients   || 0, unit: "total"    },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl p-2.5 text-center">
                <p className="font-bold text-lg">{s.value}</p>
                <p className="text-green-200 text-[10px]">{s.label} {s.unit}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── Page content ───────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* ═══════════════════════ DASHBOARD ════════════════════════════════ */}
        {tab === "dashboard" && (
          <div className="space-y-4">

            {/* Earnings trend chart */}
            {trend.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-700 text-sm">Last 7 Days Earnings</h3>
                  <span className="text-xs text-gray-400">
                    {fmt(trend.reduce((s, d) => s + d.earned, 0))} total
                  </span>
                </div>
                <TrendChart data={trend} />
              </div>
            )}

            {/* Commission rates */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <h3 className="font-bold text-gray-700 text-sm mb-3">Aapke Commission Rates</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(coordinator.commissionRates).map(([type, rate]) =>
                  rate > 0 ? (
                    <div key={type} className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-center min-w-[64px]">
                      <p className="font-black text-green-700 text-base">{rate}%</p>
                      <p className="text-[10px] text-green-600 font-semibold">{type}</p>
                    </div>
                  ) : null
                )}
              </div>
            </div>

            {/* Recent bookings */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-700 text-sm">Recent Bookings</h3>
                <button onClick={() => setTab("bookings")} className="text-xs text-green-600 font-semibold">
                  Sab dekhein →
                </button>
              </div>
              {bookings.slice(0, 5).map(b => {
                const n = parseNotes(b.notes);
                return (
                  <div key={b._id} className="px-4 py-3 border-b border-gray-50 last:border-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl flex-shrink-0">{TYPE_ICON[b.type] || "📋"}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-700 truncate">{n.patientName || "—"}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${STATUS_COLOR[b.status]}`}>
                            {b.status}
                          </span>
                          <span className="text-[10px] text-gray-400">{fmtDate(b.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-700">{fmt(b.amount)}</p>
                      {b.coordinatorCommission > 0 && (
                        <p className={`text-[11px] font-semibold ${b.coordinatorPaid ? "text-green-600" : "text-amber-600"}`}>
                          {b.coordinatorPaid ? "✓ " : "⏳ "}{fmt(b.coordinatorCommission)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {bookings.length === 0 && (
                <div className="py-10 text-center text-gray-400 text-sm">
                  <p className="text-3xl mb-2">📋</p>Koi booking nahi hai abhi tak
                </div>
              )}
            </div>

            {/* Quick action */}
            <button
              onClick={() => setTab("book")}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-green-200 flex items-center justify-center gap-2 transition"
            >
              ➕ Naya Booking Karein
            </button>
          </div>
        )}

        {/* ═══════════════════════ FAMILIES ════════════════════════════════ */}
        {tab === "families" && (
          <div className="space-y-3">

            {/* ─ List view ─ */}
            {familiesView === "list" && (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5 gap-2 focus-within:border-green-400 transition">
                    <span className="text-gray-400 text-sm">🔍</span>
                    <input value={familySearch} onChange={e => setFamilySearch(e.target.value)}
                      placeholder="Naam ya mobile se dhundein..."
                      className="flex-1 text-sm outline-none bg-transparent" />
                  </div>
                  <button onClick={() => { setFReg({ mobile: "", otp: "", otpSent: false, otpLoading: false, userId: "", name: "", age: "", gender: "male", district: "", preExistingDiseases: [], idType: "", idNumber: "" }); setFamiliesView("register"); }}
                    className="bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0 flex items-center gap-1">
                    + Register
                  </button>
                </div>

                {familiesLoading ? (
                  <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
                  </div>
                ) : families.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 py-14 text-center text-gray-400 text-sm">
                    <p className="text-4xl mb-3">👨‍👩‍👧</p>
                    <p className="font-semibold text-gray-500">Koi registered family nahi hai</p>
                    <p className="text-xs mt-1">Register button se naya family add karein</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-400 px-1">
                      {families.filter(f => familySearch ? (f.name.toLowerCase().includes(familySearch.toLowerCase()) || f.mobile.includes(familySearch)) : true).length} families registered
                    </p>
                    {families
                      .filter(f => familySearch ? (f.name.toLowerCase().includes(familySearch.toLowerCase()) || f.mobile.includes(familySearch)) : true)
                      .map(fam => {
                        const card = fam.familyCardId;
                        const isActive = card?.status === "active";
                        const memberCount = (fam.familyMembers || []).length;
                        return (
                          <div key={fam._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg flex-shrink-0">
                                  {fam.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-gray-800 text-sm">{fam.name}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    📱 {fam.mobile}
                                    {fam.age ? ` · ${fam.age}y` : ""}
                                    {fam.gender ? ` · ${fam.gender === "male" ? "M" : "F"}` : ""}
                                  </p>
                                  {fam.memberId && <p className="text-[10px] text-gray-400 font-mono mt-0.5">{fam.memberId}</p>}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${isActive ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                  {isActive ? "✓ Card Active" : "No Card"}
                                </span>
                                {isActive && (
                                  <span className="text-[9px] text-green-600 font-medium">₹100 commission ✓</span>
                                )}
                              </div>
                            </div>

                            {/* Family members */}
                            {memberCount > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-50 flex flex-wrap gap-1.5">
                                {(fam.familyMembers || []).map(m => (
                                  <span key={m._id} className="text-[10px] bg-gray-50 border border-gray-200 rounded-full px-2.5 py-0.5 text-gray-600">
                                    {m.name} ({m.relationship})
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Action buttons */}
                            <div className="mt-3 flex gap-2">
                              <a href={`tel:${fam.mobile}`}
                                className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl transition">
                                📞 Call
                              </a>
                              <a href={`https://wa.me/91${fam.mobile}`} target="_blank" rel="noreferrer"
                                className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl transition">
                                💬 WhatsApp
                              </a>
                              {memberCount < 5 && (
                                <button
                                  onClick={() => { setFMember(m => ({ ...m, primaryMobile: fam.mobile, targetFamily: fam, name: "", age: "", gender: "male", relationship: "spouse" })); setFamiliesView("add-member"); }}
                                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl transition">
                                  + Member
                                </button>
                              )}
                              <button
                                onClick={() => { setBForm({ ...emptyForm, client: { mobile: fam.mobile, name: fam.name, age: fam.age, gender: fam.gender }, clientMobile: fam.mobile, clientFound: true, step: "service" }); setTab("book"); }}
                                className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl transition">
                                📋 Book
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </>
            )}

            {/* ─ Register new family ─ */}
            {familiesView === "register" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-4 flex items-center gap-3">
                  <button onClick={() => setFamiliesView("list")} className="text-white/80 hover:text-white text-lg">←</button>
                  <div>
                    <h3 className="text-white font-bold text-sm">Register New Family</h3>
                    <p className="text-green-200 text-xs">OTP verification ke saath</p>
                  </div>
                </div>
                <div className="p-5 space-y-4">

                  {/* Mobile + OTP */}
                  {!fReg.otpSent ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Mobile Number *</label>
                        <div className="flex gap-2">
                          <div className="flex-1 flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-green-400 transition">
                            <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-200">+91</span>
                            <input type="tel" maxLength={10} value={fReg.mobile}
                              onChange={e => setFReg(f => ({ ...f, mobile: e.target.value.replace(/\D/g, "") }))}
                              placeholder="9876543210" className="flex-1 px-3 py-2.5 text-sm focus:outline-none" />
                          </div>
                          <button onClick={famSendOtp} disabled={fReg.otpLoading || fReg.mobile.length < 10}
                            className="px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">
                            {fReg.otpLoading ? "..." : "Check"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm text-green-700 font-medium flex items-center gap-2">
                        📱 {fReg.mobile} — OTP bheja gaya
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">OTP *</label>
                        <input type="text" maxLength={6} inputMode="numeric" value={fReg.otp}
                          onChange={e => setFReg(f => ({ ...f, otp: e.target.value.replace(/\D/g, "") }))}
                          placeholder="6-digit OTP" className={inp} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="text-xs font-semibold text-gray-500 mb-1 block">Poora Naam *</label>
                          <input value={fReg.name} onChange={e => setFReg(f => ({ ...f, name: e.target.value }))}
                            placeholder="Ramesh Kumar" className={inp} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 mb-1 block">Age *</label>
                          <input type="number" min={1} max={120} value={fReg.age}
                            onChange={e => setFReg(f => ({ ...f, age: e.target.value }))}
                            placeholder="35" className={inp} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 mb-1 block">Gender *</label>
                          <select value={fReg.gender} onChange={e => setFReg(f => ({ ...f, gender: e.target.value }))} className={sel}>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs font-semibold text-gray-500 mb-1 block">District</label>
                          <input value={fReg.district} onChange={e => setFReg(f => ({ ...f, district: e.target.value }))}
                            placeholder="Patna, Gaya, Muzaffarpur..." className={inp} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 mb-1 block">ID Type</label>
                          <select value={fReg.idType} onChange={e => setFReg(f => ({ ...f, idType: e.target.value }))} className={sel}>
                            <option value="">-- Select --</option>
                            <option value="Aadhaar">Aadhaar</option>
                            <option value="PAN">PAN</option>
                            <option value="Voter ID">Voter ID</option>
                            <option value="Driving Licence">Driving Licence</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 mb-1 block">ID Number</label>
                          <input value={fReg.idNumber} onChange={e => setFReg(f => ({ ...f, idNumber: e.target.value }))}
                            placeholder="XXXX XXXX XXXX" className={inp} />
                        </div>
                      </div>
                      <button onClick={famVerifyRegister} disabled={fReg.otpLoading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-bold transition disabled:opacity-50">
                        {fReg.otpLoading ? "Register ho raha hai..." : "✓ Verify & Register"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─ Add member ─ */}
            {familiesView === "add-member" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center gap-3">
                  <button onClick={() => { setFamiliesView("list"); setFMember(m => ({ ...m, targetFamily: null, primaryMobile: "" })); }} className="text-white/80 hover:text-white text-lg">←</button>
                  <div>
                    <h3 className="text-white font-bold text-sm">Add Family Member</h3>
                    <p className="text-blue-200 text-xs">
                      {fMember.targetFamily ? `${fMember.targetFamily.name} ki family mein` : "Primary member mobile enter karein"}
                    </p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {!fMember.targetFamily && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Primary Member Mobile</label>
                      <input type="tel" maxLength={10} value={fMember.primaryMobile}
                        onChange={e => setFMember(m => ({ ...m, primaryMobile: e.target.value.replace(/\D/g, "") }))}
                        placeholder="9876543210" className={inp} />
                    </div>
                  )}
                  {fMember.targetFamily && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-blue-800 flex items-center gap-2">
                      👨‍👩‍👧 <strong>{fMember.targetFamily.name}</strong> · {fMember.targetFamily.mobile}
                      · {(fMember.targetFamily.familyMembers || []).length}/5 members
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Member Naam *</label>
                      <input value={fMember.name} onChange={e => setFMember(m => ({ ...m, name: e.target.value }))}
                        placeholder="Sunita Devi" className={inp} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Age *</label>
                      <input type="number" min={0} max={120} value={fMember.age}
                        onChange={e => setFMember(m => ({ ...m, age: e.target.value }))}
                        placeholder="28" className={inp} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Gender *</label>
                      <select value={fMember.gender} onChange={e => setFMember(m => ({ ...m, gender: e.target.value }))} className={sel}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Rishta *</label>
                      <select value={fMember.relationship} onChange={e => setFMember(m => ({ ...m, relationship: e.target.value }))} className={sel}>
                        <option value="spouse">Spouse (Pati/Patni)</option>
                        <option value="child">Child (Beta/Beti)</option>
                        <option value="parent">Parent (Maa/Baap)</option>
                        <option value="inlaw">In-law (Sasural)</option>
                        <option value="sibling">Sibling (Bhai/Behan)</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={famAddMember} disabled={fMember.loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-bold transition disabled:opacity-50">
                    {fMember.loading ? "Add ho raha hai..." : "✓ Add Member"}
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ═══════════════════════ NEW BOOKING ══════════════════════════════ */}
        {tab === "book" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-4">
              <h3 className="text-white font-bold">➕ Naya Booking</h3>
              <p className="text-green-200 text-xs mt-0.5">Client ke liye service book karein</p>
            </div>

            {/* Step bar */}
            <div className="flex border-b border-gray-100">
              {(["client", "service", "details", "confirm"] as const).map((s, i) => {
                const steps = ["client", "service", "details", "confirm"];
                const current = steps.indexOf(bForm.step);
                const done = current > i;
                return (
                  <div key={s} className={`flex-1 py-2.5 text-center text-[11px] font-semibold transition flex items-center justify-center gap-1 ${
                    bForm.step === s ? "text-green-700 border-b-2 border-green-600"
                      : done ? "text-green-400" : "text-gray-300"
                  }`}>
                    {done ? "✓" : `${i + 1}.`} {s === "client" ? "Client" : s === "service" ? "Service" : s === "details" ? "Details" : "Confirm"}
                  </div>
                );
              })}
            </div>

            <div className="p-5">
              {bError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm mb-4">⚠️ {bError}</div>
              )}

              {/* ─ Step 1: Client ─ */}
              {bForm.step === "client" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Client ka Mobile Number</label>
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-100 transition">
                        <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-200">+91</span>
                        <input
                          type="tel" maxLength={10} value={bForm.clientMobile}
                          onChange={e => setBForm(f => ({ ...f, clientMobile: e.target.value.replace(/\D/g, ""), clientFound: undefined }))}
                          onKeyDown={e => e.key === "Enter" && lookupClient()}
                          placeholder="9876543210"
                          className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                        />
                      </div>
                      <button onClick={lookupClient} disabled={clientLookup || bForm.clientMobile.length < 10}
                        className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">
                        {clientLookup ? "..." : "Search"}
                      </button>
                    </div>
                  </div>

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
                        className="bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl">Continue →</button>
                    </div>
                  )}

                  {bForm.clientFound === false && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                      <p className="text-sm font-semibold text-amber-800">📋 Naya Client Register Karein</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
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
                          <select value={bForm.newGender} onChange={e => setBForm(f => ({ ...f, newGender: e.target.value }))}
                            className={`mt-1 ${sel}`}>
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

              {/* ─ Step 2: Service ─ */}
              {bForm.step === "service" && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-sm text-green-800 flex items-center justify-between">
                    <span>👤 <strong>{bForm.client?.name}</strong> · {bForm.client?.mobile}</span>
                    <button onClick={() => setBForm(f => ({ ...f, step: "client", client: undefined, clientFound: undefined }))}
                      className="text-green-600 underline text-xs">Change</button>
                  </div>
                  <p className="text-sm font-semibold text-gray-600">Service chunein:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { type: "Surgery" as const, icon: "🔬", label: "Surgery Package",   key: "Surgery"  },
                      { type: "Lab"     as const, icon: "🧪", label: "Lab Test",          key: "Lab"      },
                      { type: "OPD"     as const, icon: "🩺", label: "OPD Appointment",   key: "OPD"      },
                      { type: "IPD"     as const, icon: "🛏️", label: "IPD / Admission",   key: "IPD"      },
                    ] as const).map(s => {
                      const rate = coordinator.commissionRates[s.key as keyof typeof coordinator.commissionRates] || 0;
                      return (
                        <button key={s.type} onClick={() => onServiceSelect(s.type)}
                          className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 transition text-center active:scale-95">
                          <span className="text-3xl">{s.icon}</span>
                          <span className="text-sm font-semibold text-gray-700">{s.label}</span>
                          {rate > 0
                            ? <span className="text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">{rate}% Commission</span>
                            : <span className="text-[11px] text-gray-400">No commission</span>
                          }
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ─ Step 3: Details ─ */}
              {bForm.step === "details" && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-sm text-green-800 flex items-center justify-between">
                    <span>👤 <strong>{bForm.client?.name}</strong> · {bForm.serviceType}</span>
                    <button onClick={() => setBForm(f => ({ ...f, step: "service" }))}
                      className="text-green-600 underline text-xs">← Back</button>
                  </div>

                  {(bForm.serviceType === "Surgery" || bForm.serviceType === "IPD") && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Package *</label>
                      <select value={bForm.packageId} onChange={e => {
                        const pkg = packages.find((p: any) => p._id === e.target.value);
                        setBForm(f => ({ ...f, packageId: e.target.value, amount: String(pkg?.offerPrice || pkg?.mrp || ""), hospitalId: pkg?.hospitalId || "" }));
                      }} className={sel}>
                        <option value="">-- Package chunein --</option>
                        {packages.map((p: any) => (
                          <option key={p._id} value={p._id}>{p.name} — {fmt(p.offerPrice || p.mrp)} ({p.hospitalName || ""})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {bForm.serviceType === "Lab" && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Lab Test *</label>
                      <select value={bForm.labTestId} onChange={e => {
                        const lt = labTests.find((l: any) => l._id === e.target.value);
                        setBForm(f => ({ ...f, labTestId: e.target.value, amount: String(lt?.offerPrice || lt?.mrp || ""), hospitalId: lt?.hospitalId || "" }));
                      }} className={sel}>
                        <option value="">-- Test chunein --</option>
                        {labTests.map((l: any) => (
                          <option key={l._id} value={l._id}>{l.name} — {fmt(l.offerPrice || l.mrp)}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {bForm.serviceType === "OPD" && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Doctor</label>
                      <select value={bForm.doctorId} onChange={e => {
                        const doc = doctors.find((d: any) => d._id === e.target.value);
                        setBForm(f => ({ ...f, doctorId: e.target.value, amount: String(doc?.offerFee || doc?.opdFee || "") }));
                      }} className={sel}>
                        <option value="">-- Doctor chunein --</option>
                        {doctors.map((d: any) => (
                          <option key={d._id} value={d._id}>{d.name} — {d.department} ({fmt(d.offerFee || d.opdFee)})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Date *</label>
                      <input type="date" value={bForm.appointmentDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={e => setBForm(f => ({ ...f, appointmentDate: e.target.value }))}
                        className={inp} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Time Slot</label>
                      <input value={bForm.slot}
                        onChange={e => setBForm(f => ({ ...f, slot: e.target.value }))}
                        placeholder="10:00 - 11:00 AM" className={inp} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Amount (₹) *</label>
                      <input type="number" value={bForm.amount}
                        onChange={e => setBForm(f => ({ ...f, amount: e.target.value }))}
                        className={inp} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Payment Mode</label>
                      <select value={bForm.paymentMode}
                        onChange={e => setBForm(f => ({ ...f, paymentMode: e.target.value }))} className={sel}>
                        <option value="counter">Counter</option>
                        <option value="online">Online / UPI</option>
                        <option value="wallet">Wallet</option>
                        <option value="insurance">Insurance</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Symptoms / Notes</label>
                    <input value={bForm.symptoms}
                      onChange={e => setBForm(f => ({ ...f, symptoms: e.target.value }))}
                      placeholder="Chief complaint ya notes" className={inp} />
                  </div>

                  {/* Partial booking */}
                  {(bForm.serviceType === "Surgery" || bForm.serviceType === "IPD") && (
                    <div>
                      <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${bForm.isPartialBooking ? "bg-blue-50 border-blue-300" : "bg-gray-50 border-gray-200"}`}>
                        <input type="checkbox" checked={bForm.isPartialBooking}
                          onChange={e => setBForm(f => ({ ...f, isPartialBooking: e.target.checked }))}
                          className="w-4 h-4 accent-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-gray-700">📦 Partial Booking (Deposit)</p>
                          <p className="text-xs text-gray-400 mt-0.5">Advance deposit abhi, baki hospital par</p>
                        </div>
                      </label>
                      {bForm.isPartialBooking && (
                        <div className="mt-2">
                          <label className="text-xs font-semibold text-gray-500 mb-1 block">Deposit Amount (₹)</label>
                          <input type="number" value={bForm.depositAmount}
                            onChange={e => setBForm(f => ({ ...f, depositAmount: e.target.value }))}
                            placeholder="1000" className={inp} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Commission preview */}
                  {comm && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 flex items-center gap-3">
                      <span className="text-2xl">💰</span>
                      <div>
                        <p className="text-sm font-bold text-green-800">
                          Aapka Commission: {fmt(comm.amount)} ({comm.rate}%)
                        </p>
                        <p className="text-xs text-green-600">Is booking par aapko milega</p>
                      </div>
                    </div>
                  )}

                  <button onClick={() => setBForm(f => ({ ...f, step: "confirm" }))}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-bold transition">
                    Review Karein →
                  </button>
                </div>
              )}

              {/* ─ Step 4: Confirm ─ */}
              {bForm.step === "confirm" && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                    <h4 className="font-bold text-gray-700 text-sm mb-3">Booking Summary</h4>
                    {[
                      ["Client",      bForm.client?.name || "—"],
                      ["Mobile",      bForm.client?.mobile || "—"],
                      ["Service",     bForm.serviceType || "—"],
                      ["Date",        fmtDate(bForm.appointmentDate)],
                      ["Slot",        bForm.slot || "—"],
                      ["Payment",     bForm.paymentMode],
                      ["Amount",      fmt(bForm.isPartialBooking ? Number(bForm.depositAmount || 1000) : Number(bForm.amount))],
                      ...(bForm.isPartialBooking ? [["Balance at Hospital", fmt(Number(bForm.amount) - Number(bForm.depositAmount || 1000))]] : []),
                      ...(bForm.symptoms ? [["Symptoms", bForm.symptoms]] : []),
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-gray-500">{k}</span>
                        <span className="font-semibold text-gray-700 text-right max-w-[60%]">{v}</span>
                      </div>
                    ))}
                    {comm && (
                      <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                        <span className="text-green-600 font-medium">Aapka Commission</span>
                        <span className="font-bold text-green-700">{fmt(comm.amount)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setBForm(f => ({ ...f, step: "details" }))}
                      className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold">
                      ← Edit
                    </button>
                    <button onClick={submitBooking} disabled={bLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-bold transition disabled:opacity-50">
                      {bLoading ? "Booking ho rahi hai..." : "✓ Confirm"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════ BOOKINGS ═════════════════════════════════ */}
        {tab === "bookings" && (
          <div className="space-y-3">
            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex-1 min-w-[160px] flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5 gap-2 focus-within:border-green-400 transition">
                <span className="text-gray-400 text-sm">🔍</span>
                <input value={bookingSearch} onChange={e => setBookingSearch(e.target.value)}
                  placeholder="Name / Booking ID..." className="flex-1 text-sm outline-none bg-transparent" />
              </div>
              <select value={bookingTypeFilter} onChange={e => setBookingTypeFilter(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-green-400 transition">
                <option value="all">All Types</option>
                <option value="OPD">OPD</option>
                <option value="Lab">Lab</option>
                <option value="Surgery">Surgery</option>
                <option value="IPD">IPD</option>
              </select>
              <select value={bookingStatusFilter} onChange={e => setBookingStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-green-400 transition">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center text-gray-400 text-sm">
                <p className="text-3xl mb-2">📋</p>Koi booking nahi mili
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <p className="px-4 py-2.5 text-xs text-gray-400 border-b border-gray-50">
                  {filteredBookings.length} booking{filteredBookings.length !== 1 ? "s" : ""}
                </p>
                {filteredBookings.map(b => {
                  const n = parseNotes(b.notes);
                  return (
                    <div key={b._id} className="px-4 py-3.5 border-b border-gray-50 last:border-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="text-xl mt-0.5 flex-shrink-0">{TYPE_ICON[b.type] || "📋"}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-700 truncate">{n.patientName || "—"}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{b.bookingId} · {fmtDate(b.appointmentDate || b.createdAt)}</p>
                            <div className="flex gap-1.5 mt-1 flex-wrap">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${STATUS_COLOR[b.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                {b.status}
                              </span>
                              {b.isPartialBooking && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 border border-blue-200">
                                  Deposit ₹{b.depositAmount?.toLocaleString()}
                                </span>
                              )}
                              {n.patientMobile && (
                                <a href={`tel:${n.patientMobile}`}
                                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200 hover:bg-green-50 hover:text-green-700 transition">
                                  📞 {n.patientMobile}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-700">{fmt(b.amount)}</p>
                          {b.coordinatorCommission > 0 && (
                            <p className={`text-xs font-semibold ${b.coordinatorPaid ? "text-green-600" : "text-amber-600"}`}>
                              {b.coordinatorPaid ? "✓ Paid" : "⏳ Pending"} {fmt(b.coordinatorCommission)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════ EARNINGS ═════════════════════════════════ */}
        {tab === "earnings" && (
          <div className="space-y-4">

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                <p className="font-black text-xl text-green-700">{fmt(stats?.totalEarned || 0)}</p>
                <p className="text-[11px] font-semibold text-green-600 mt-0.5">Total Earned</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                <p className="font-black text-xl text-amber-700">{fmt(stats?.pendingEarned || 0)}</p>
                <p className="text-[11px] font-semibold text-amber-600 mt-0.5">Pending Payout</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
                <p className="font-black text-xl text-blue-700">{fmt(stats?.paidEarned || 0)}</p>
                <p className="text-[11px] font-semibold text-blue-600 mt-0.5">Paid Out</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center">
                <p className="font-black text-xl text-purple-700">{fmt(stats?.monthEarned || 0)}</p>
                <p className="text-[11px] font-semibold text-purple-600 mt-0.5">This Month</p>
              </div>
            </div>

            {/* Payout request */}
            {(stats?.pendingEarned || 0) > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-2xl">💸</span>
                <div className="flex-1">
                  <p className="font-bold text-amber-800 text-sm">{fmt(stats?.pendingEarned || 0)} payout pending</p>
                  <p className="text-xs text-amber-600">Admin se request karein</p>
                </div>
                <a href={`https://wa.me/919999999999?text=${encodeURIComponent(`Payout Request\nCoordinator: ${coordinator.name} (${coordinator.coordinatorId})\nPending: ${fmt(stats?.pendingEarned || 0)}\nKripya payment process karein.`)}`}
                  target="_blank" rel="noreferrer"
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition whitespace-nowrap">
                  Request Payout 💬
                </a>
              </div>
            )}

            {/* Trend chart */}
            {trend.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-700 text-sm">Last 7 Days</h3>
                  <span className="text-xs text-gray-400">{fmt(trend.reduce((s, d) => s + d.earned, 0))} total</span>
                </div>
                <TrendChart data={trend} />
                <div className="mt-2 grid grid-cols-7 gap-1">
                  {trend.map((d, i) => (
                    <div key={i} className="text-center">
                      <p className="text-[9px] text-gray-500">{d.bookings}bk</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full commission ledger */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-700 text-sm">Commission Ledger</h3>
                <span className="text-xs text-gray-400">{bookings.filter(b => b.coordinatorCommission > 0).length} entries</span>
              </div>

              {bookings.filter(b => b.coordinatorCommission > 0).length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">
                  <p className="text-3xl mb-2">💰</p>Koi commission nahi mili abhi tak
                </div>
              ) : (
                bookings.filter(b => b.coordinatorCommission > 0).map(b => {
                  const n = parseNotes(b.notes);
                  // Get service name from populated fields
                  const svc = b.packageId || b.labTestId;
                  const svcName = svc?.name || b.doctorId?.name || "—";
                  const hospitalName = svc?.hospitalName || b.doctorId?.hospitalName || b.hospitalId?.name || "—";
                  const mrp = svc?.mrp || b.doctorId?.opdFee || 0;
                  const offerPrice = svc?.offerPrice || b.doctorId?.offerFee || mrp;
                  const rate = coordinator.commissionRates[b.type as keyof typeof coordinator.commissionRates] || 0;

                  return (
                    <div key={b._id} className="border-b border-gray-50 last:border-0">
                      {/* Header row */}
                      <div className="px-4 pt-3 pb-1 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-base">{TYPE_ICON[b.type] || "📋"}</span>
                            <p className="text-sm font-semibold text-gray-800 truncate">{n.patientName || "—"}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${STATUS_COLOR[b.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                              {b.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">{b.bookingId} · {fmtDate(b.createdAt)}</p>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${b.coordinatorPaid ? "bg-green-100 text-green-700 border-green-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}>
                          {b.coordinatorPaid ? "✓ Paid" : "⏳ Pending"}
                        </span>
                      </div>

                      {/* Detail grid */}
                      <div className="mx-4 mb-3 bg-gray-50 rounded-xl p-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                        <div>
                          <p className="text-gray-400">Service</p>
                          <p className="font-semibold text-gray-700 truncate">{svcName}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Hospital/Lab</p>
                          <p className="font-semibold text-gray-700 truncate">{hospitalName}</p>
                        </div>
                        {mrp > 0 && (
                          <div>
                            <p className="text-gray-400">MRP</p>
                            <p className="font-semibold text-gray-500 line-through">{fmt(mrp)}</p>
                          </div>
                        )}
                        {offerPrice > 0 && (
                          <div>
                            <p className="text-gray-400">Offer Price</p>
                            <p className="font-semibold text-gray-700">{fmt(offerPrice)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-400">Booking Amount</p>
                          <p className="font-semibold text-gray-700">{fmt(b.amount)}</p>
                        </div>
                        {b.isPartialBooking && b.depositAmount && (
                          <div>
                            <p className="text-gray-400">Advance Paid</p>
                            <p className="font-semibold text-blue-600">{fmt(b.depositAmount)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-400">Commission Rate</p>
                          <p className="font-semibold text-gray-700">{rate}%</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Commission Earned</p>
                          <p className={`font-black text-base ${b.coordinatorPaid ? "text-green-600" : "text-amber-600"}`}>
                            {fmt(b.coordinatorCommission)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Ledger total */}
              {bookings.filter(b => b.coordinatorCommission > 0).length > 0 && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    <span className="font-semibold">{bookings.filter(b => b.coordinatorCommission > 0 && !b.coordinatorPaid).length}</span> pending ·{" "}
                    <span className="font-semibold">{bookings.filter(b => b.coordinatorPaid).length}</span> paid
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Total Commission</p>
                    <p className="font-black text-base text-green-700">{fmt(stats?.totalEarned || 0)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── Sticky Bottom Navigation ─────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-40">
        <div className="max-w-2xl mx-auto flex items-stretch h-16">
          {[
            { key: "dashboard", icon: "🏠", label: "Home"      },
            { key: "families",  icon: "👨‍👩‍👧", label: "Families" },
            { key: "book",      icon: "➕", label: "Book",  primary: true },
            { key: "bookings",  icon: "📋", label: "Bookings"  },
            { key: "earnings",  icon: "💰", label: "Earnings"  },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition text-xs font-semibold ${
                t.primary
                  ? tab === t.key
                    ? "text-green-700 bg-green-50"
                    : "text-green-700 hover:bg-green-50"
                  : tab === t.key
                    ? "text-green-700 bg-green-50"
                    : "text-gray-400 hover:bg-gray-50"
              }`}>
              <span className={`text-xl ${t.primary ? "text-green-600" : ""}`}>{t.icon}</span>
              <span className={t.primary ? "text-green-700" : ""}>{t.label}</span>
            </button>
          ))}
        </div>
        <div className="h-safe-area-inset-bottom" />
      </div>

    </div>
  );
}
