"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import DoctorFullForm from "@/app/components/DoctorFullForm";
import LabTestFullForm from "@/app/components/LabTestFullForm";
import BookingStageTimeline from "@/app/components/BookingStageTimeline";
import { BIHAR_DISTRICTS } from "@/lib/biharDistricts";
import { MEDICAL_DEPARTMENTS, SURGERY_DEPARTMENTS, SURGERIES_BY_DEPARTMENT } from "@/lib/medicalDepartments";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "overview" | "members" | "hospitals" | "doctors" | "packages" | "labtests" | "bookings" | "staff" | "promo" | "reports" | "accounting" | "ambulance" | "articles" | "notifications" | "coordinators" | "ledger" | "support" | "labreports";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:   { label: "Pending",   color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  confirmed: { label: "Confirmed", color: "bg-green-100 text-green-700 border-green-200"   },
  completed: { label: "Completed", color: "bg-teal-100 text-teal-700 border-teal-200"      },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700 border-red-200"         },
};
const TYPE_ICON: Record<string, string> = { OPD: "🩺", Surgery: "🏥", Lab: "🧪", IPD: "🛏️", Consultation: "💻" };
const TYPE_COLOR: Record<string, string> = {
  OPD: "bg-blue-100 text-blue-700", Surgery: "bg-purple-100 text-purple-700",
  Lab: "bg-yellow-100 text-yellow-700", Consultation: "bg-indigo-100 text-indigo-700",
};

// ─── Shared UI Primitives ─────────────────────────────────────────────────────
function Badge({ children, color = "bg-gray-100 text-gray-600" }: { children: React.ReactNode; color?: string }) {
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color}`}>{children}</span>;
}

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${value ? "bg-teal-600" : "bg-gray-200"}`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${value ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Search..."}
        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
      />
    </div>
  );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="text-center py-14">
      <p className="text-4xl mb-3">{icon}</p>
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-14">
      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Pagination({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
      <span>{total} records</span>
      <div className="flex items-center gap-2">
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          className="px-3 py-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-teal-400 transition">←</button>
        <span className="px-2">{page} / {pages}</span>
        <button onClick={() => onPage(page + 1)} disabled={page === pages}
          className="px-3 py-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-teal-400 transition">→</button>
      </div>
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }: { onLogin: (id: string, name: string) => void }) {
  const [mobile, setMobile]   = useState("");
  const [key, setKey]         = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (mobile.length !== 10) { setError("10 digit mobile number enter karein"); return; }
    if (!key) { setError("Admin key zaruri hai"); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mobile, adminKey: key }) });
      const data = await res.json();
      if (data.success) { localStorage.setItem("adminId", data.adminId); localStorage.setItem("adminName", data.name); onLogin(data.adminId, data.name); }
      else setError(data.message);
    } catch { setError("Network error. Server check karein."); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        <div className="text-center mb-7">
          <div className="text-5xl mb-3">🏥</div>
          <h1 className="text-2xl font-bold text-teal-700">Brims Hospitals</h1>
          <p className="text-gray-500 text-sm mt-1">Admin Control Panel</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
            <div className="flex border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-teal-500">
              <span className="bg-gray-50 text-gray-500 px-4 flex items-center text-sm border-r border-gray-300">+91</span>
              <input type="tel" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))} placeholder="10-digit number" className="flex-1 px-4 py-3 outline-none text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Secret Key</label>
            <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Admin key enter karein" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50">
            {loading ? "Verifying..." : "Login as Admin"}
          </button>
        </form>
        <p className="text-center mt-4"><a href="/" className="text-sm text-gray-400 hover:text-teal-600">← Home Page</a></p>
      </div>
    </div>
  );
}

// ─── Patient Detail Drawer ────────────────────────────────────────────────────
function PatientDrawer({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/patient?userId=${userId}`).then((r) => r.json())
      .then((d) => { if (d.success) setData(d); }).catch(() => {}).finally(() => setLoading(false));
  }, [userId]);

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const user = data?.user; const familyCard = data?.familyCard; const members = data?.familyMembers ?? []; const bookings = data?.bookings ?? [];

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-5 flex items-center gap-4 flex-shrink-0">
          {user?.photo ? <img src={user.photo} alt={user.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-white/30 flex-shrink-0" /> : <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">{user?.name?.[0] ?? "?"}</div>}
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-lg leading-tight truncate">{user?.name ?? "Loading..."}</h2>
            {user?.memberId && <p className="text-teal-200 text-xs font-mono mt-0.5">{user.memberId}</p>}
            <p className="text-teal-200 text-xs mt-0.5">📱 {user?.mobile}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition flex-shrink-0">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {loading && <Spinner />}
          {!loading && user && (
            <>
              <DrawerSection title="Personal Information" icon="👤">
                <div className="grid grid-cols-3 gap-2">
                  <InfoChip label="Age"    value={user.age ? `${user.age} yrs` : "—"} />
                  <InfoChip label="Gender" value={user.gender ? (user.gender === "male" ? "Male ♂" : "Female ♀") : "—"} />
                  <InfoChip label="Role"   value={user.role || "—"} />
                </div>
                {user.address?.district && <p className="mt-2 text-xs text-gray-600 bg-white rounded-xl px-3 py-2 border border-gray-100">📍 {[user.address.village, user.address.prakhand, user.address.district, user.address.state].filter(Boolean).join(", ")}</p>}
              </DrawerSection>
              {user.preExistingDiseases?.length > 0 && (
                <DrawerSection title="Medical History" icon="🏥">
                  <div className="flex flex-wrap gap-1.5">
                    {user.preExistingDiseases.map((d: string) => <span key={d} className="text-xs bg-red-50 text-red-700 border border-red-100 px-2.5 py-1 rounded-full font-medium">⚠ {d}</span>)}
                  </div>
                </DrawerSection>
              )}
              <DrawerSection title="Family Card & Wallet" icon="💳">
                {familyCard ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div><p className="font-bold text-gray-800 font-mono text-sm">{familyCard.cardNumber}</p><p className="text-xs text-gray-400">Valid till {fmtDate(familyCard.expiryDate)}</p></div>
                      <Badge color={familyCard.status === "active" ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}>{familyCard.status === "active" ? "● Active" : "● Inactive"}</Badge>
                    </div>
                    <div className="flex items-center justify-between bg-teal-50 rounded-xl px-4 py-3 border border-teal-100">
                      <p className="text-sm text-teal-700 font-medium">Wallet Balance</p>
                      <p className="text-2xl font-bold text-teal-700">₹{(familyCard.walletBalance || 0).toLocaleString()}</p>
                    </div>
                  </div>
                ) : <p className="text-sm text-gray-400">Family Card activate nahi hai</p>}
              </DrawerSection>
              {members.length > 0 && (
                <DrawerSection title={`Family Members (${members.length})`} icon="👨‍👩‍👧">
                  <div className="space-y-2">
                    {members.map((m: any) => (
                      <div key={m._id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border border-gray-100">
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-teal-100 flex-shrink-0">{m.photo ? <img src={m.photo} alt={m.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-teal-700 font-bold">{m.name?.[0]}</div>}</div>
                        <div className="flex-1"><p className="text-sm font-semibold text-gray-800">{m.name}</p><p className="text-xs text-gray-400">{m.age} yrs · {m.gender}</p></div>
                        {m.relationship && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{m.relationship}</span>}
                      </div>
                    ))}
                  </div>
                </DrawerSection>
              )}
              <DrawerSection title={`Booking History (${bookings.length})`} icon="📋">
                {bookings.length === 0 ? <p className="text-sm text-gray-400 py-2 text-center">Koi booking nahi mili</p> : (
                  <div className="space-y-2">
                    {bookings.map((b: any) => {
                      const sc = STATUS_CONFIG[b.status] ?? { label: b.status, color: "bg-gray-100 text-gray-600 border-gray-200" };
                      const title = b.type === "OPD" ? (b.doctorName ? `Dr. ${b.doctorName}` : "OPD") : b.type === "Surgery" ? (b.packageName ?? "Surgery") : (b.testName ?? "Lab Test");
                      return (
                        <div key={b._id} className="bg-white rounded-xl p-3 border border-gray-100">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold flex-shrink-0 ${TYPE_COLOR[b.type] ?? "bg-gray-100 text-gray-600"}`}>{TYPE_ICON[b.type]} {b.type}</span>
                              <p className="text-sm font-semibold text-gray-800 truncate">{title}</p>
                            </div>
                            <Badge color={sc.color}>{sc.label}</Badge>
                          </div>
                          <div className="flex items-center justify-between mt-1.5 text-xs text-gray-400">
                            <span>📅 {fmtDate(b.appointmentDate)}{b.slot ? ` · ${b.slot}` : ""}</span>
                            {b.amount > 0 && <span className="font-semibold text-teal-700">₹{b.amount.toLocaleString()}</span>}
                          </div>
                          {b.symptoms && <p className="text-xs text-gray-500 mt-1 bg-gray-50 rounded-lg px-2 py-1">💬 {b.symptoms}</p>}
                          <p className="text-[10px] text-gray-300 font-mono mt-1">{b.bookingId}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </DrawerSection>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function DrawerSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5"><span>{icon}</span>{title}</h3>
      {children}
    </div>
  );
}
function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
      <p className="text-[10px] text-gray-400 font-semibold uppercase">{label}</p>
      <p className="text-xs text-gray-800 font-semibold mt-0.5 truncate">{value}</p>
    </div>
  );
}

// ─── Hospital Detail Drawer ───────────────────────────────────────────────────
function HospitalDrawer({ hospitalId, onClose, onVerify }: { hospitalId: string; onClose: () => void; onVerify: (id: string, verified: boolean) => void }) {
  const [data,      setData]      = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [commSlab,  setCommSlab]  = useState<any>(null);
  const [commForm,  setCommForm]  = useState({ OPD: "", Lab: "", Surgery: "", Consultation: "", IPD: "", notes: "" });
  const [commNotes, setCommNotes] = useState("");
  const [savingComm, setSavingComm] = useState(false);
  const [commMsg,   setCommMsg]   = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/hospitals?detail=${hospitalId}`).then((r) => r.json()),
      fetch(`/api/admin/commission-slabs?hospitalId=${hospitalId}`).then((r) => r.json()),
    ]).then(([hData, slabData]) => {
      if (hData.success)   setData(hData);
      if (slabData.success) {
        const slab = slabData.slab;
        setCommSlab(slab);
        setCommForm({
          OPD:          String(slab?.rates?.OPD          ?? 10),
          Lab:          String(slab?.rates?.Lab          ?? 12),
          Surgery:      String(slab?.rates?.Surgery      ?? 8),
          Consultation: String(slab?.rates?.Consultation ?? 15),
          IPD:          String(slab?.rates?.IPD          ?? 8),
          notes:        slab?.notes ?? "",
        });
      } else {
        setCommForm({ OPD: "10", Lab: "12", Surgery: "8", Consultation: "15", IPD: "8", notes: "" });
      }
    }).finally(() => setLoading(false));
  }, [hospitalId]);

  async function saveCommission() {
    setSavingComm(true);
    setCommMsg(null);
    try {
      const rates = {
        OPD:          Number(commForm.OPD)          || 0,
        Lab:          Number(commForm.Lab)          || 0,
        Surgery:      Number(commForm.Surgery)      || 0,
        Consultation: Number(commForm.Consultation) || 0,
        IPD:          Number(commForm.IPD)          || 0,
      };
      const res  = await fetch("/api/admin/commission-slabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalId, rates, notes: commForm.notes }),
      });
      const json = await res.json();
      setCommMsg({ msg: json.message || (json.success ? "Rates saved!" : "Error"), ok: json.success });
      if (json.success) setCommSlab(json.slab);
    } finally { setSavingComm(false); }
  }

  const h = data?.hospital;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 flex items-center gap-4 flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl flex-shrink-0">🏥</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-lg leading-tight truncate">{h?.name ?? "Loading..."}</h2>
            <p className="text-blue-200 text-xs mt-0.5">{h?.type}</p>
            <p className="text-blue-200 text-xs">{[h?.address?.district, h?.address?.state].filter(Boolean).join(", ")}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition flex-shrink-0">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {loading && <Spinner />}
          {!loading && h && (
            <>
              {/* Status + verify/reject */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge color={h.isVerified ? "bg-green-100 text-green-700 border-green-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"}>{h.isVerified ? "✓ Verified" : "⏳ Pending Verification"}</Badge>
                    <Badge color={h.isActive ? "bg-teal-100 text-teal-700 border-teal-100" : "bg-red-100 text-red-700 border-red-200"} >{h.isActive ? "● Active" : "● Inactive"}</Badge>
                  </div>
                  <div className="flex gap-2">
                    {!h.isVerified && <button onClick={() => onVerify(h._id, true)} className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-semibold transition">✓ Verify</button>}
                    {h.isVerified  && <button onClick={() => onVerify(h._id, false)} className="text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg font-semibold transition">✗ Revoke</button>}
                  </div>
                </div>
              </div>

              {/* Counts */}
              <div className="grid grid-cols-3 gap-3">
                {[{ label: "Doctors", value: data.doctorCount, icon: "🩺" }, { label: "Packages", value: data.packageCount, icon: "📦" }, { label: "Lab Tests", value: data.labCount, icon: "🧪" }].map((s) => (
                  <div key={s.label} className="bg-white rounded-xl p-3 border border-gray-100 text-center">
                    <p className="text-2xl">{s.icon}</p>
                    <p className="font-bold text-gray-800 text-xl">{s.value}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Contact */}
              <DrawerSection title="Contact Details" icon="📞">
                <div className="space-y-2 text-sm">
                  {h.mobile    && <p className="text-gray-700">📱 {h.mobile}</p>}
                  {h.email     && <p className="text-gray-700">✉️ {h.email}</p>}
                  {h.website   && <p className="text-blue-600 underline">🌐 {h.website}</p>}
                  {h.spocName  && <p className="text-gray-700">👤 SPOC: {h.spocName} {h.spocContact ? `(${h.spocContact})` : ""}</p>}
                  {h.ownerName && <p className="text-gray-700">🏛 Owner: {h.ownerName}</p>}
                </div>
              </DrawerSection>

              {/* Registration */}
              <DrawerSection title="Registration" icon="📄">
                <div className="space-y-2">
                  {h.registrationNo && <InfoChip label="Reg. No." value={h.registrationNo} />}
                  {h.rohiniNo       && <InfoChip label="Rohini No." value={h.rohiniNo} />}
                </div>
              </DrawerSection>

              {/* Departments */}
              {h.departments?.length > 0 && (
                <DrawerSection title="Departments" icon="🏥">
                  <div className="flex flex-wrap gap-1.5">
                    {h.departments.map((d: string) => <span key={d} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{d}</span>)}
                  </div>
                </DrawerSection>
              )}

              {/* Photos */}
              {h.photos?.length > 0 && (
                <DrawerSection title="Photos" icon="🖼">
                  <div className="grid grid-cols-2 gap-2">
                    {h.photos.slice(0, 4).map((src: string, i: number) => (
                      <img key={i} src={src} alt="" className="w-full h-28 object-cover rounded-xl" />
                    ))}
                  </div>
                </DrawerSection>
              )}

              {/* ── Commission Rates Editor ── */}
              <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-800">📊 Commission Rates (%)</p>
                  {commSlab && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Slab Active</span>}
                </div>
                <p className="text-xs text-gray-400">Online payment pe ye % platform rakhega, baaki hospital ko milega. Counter payment pe hospital ye % platform ko dega.</p>
                {commMsg && <div className={`text-xs px-3 py-2 rounded-xl font-semibold ${commMsg.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>{commMsg.msg}</div>}
                <div className="grid grid-cols-5 gap-2">
                  {(["OPD","Lab","Surgery","Consultation","IPD"] as const).map((t) => (
                    <div key={t} className="flex flex-col gap-1">
                      <label className="text-[10px] text-gray-500 font-semibold text-center">{t}</label>
                      <div className="relative">
                        <input
                          type="number" min="0" max="100" step="0.5"
                          value={commForm[t]}
                          onChange={(e) => setCommForm((p) => ({ ...p, [t]: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-2 py-2 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <textarea
                  rows={2} placeholder="Notes (optional — negotiation details, effective date, etc.)"
                  value={commForm.notes}
                  onChange={(e) => setCommForm((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
                <button onClick={saveCommission} disabled={savingComm}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition">
                  {savingComm ? "Saving..." : "💾 Save Commission Rates"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── TAB: Overview ─────────────────────────────────────────────────────────────
// ── Mini chart components (pure CSS/SVG — no library) ────────────────────────

function BarChart({ data, valueKey, labelKey, color = "#0d9488", height = 120 }: {
  data: any[]; valueKey: string; labelKey: string; color?: string; height?: number;
}) {
  if (!data?.length) return <div className="h-24 flex items-center justify-center text-gray-300 text-xs">No data</div>;
  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1);
  return (
    <div className="flex items-end gap-0.5 overflow-hidden" style={{ height }}>
      {data.map((d, i) => {
        const pct = Math.round(((d[valueKey] || 0) / max) * 100);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative" style={{ minWidth: 0 }}>
            <div className="w-full rounded-t-sm transition-all duration-300"
              style={{ height: `${Math.max(pct, 2)}%`, backgroundColor: color, opacity: 0.85 }} />
            {/* Tooltip on hover */}
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
              {d[labelKey]}: {typeof d[valueKey] === "number" && d[valueKey] > 999 ? `₹${(d[valueKey]/1000).toFixed(1)}k` : d[valueKey]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HorizBar({ label, value, max, color, sub }: { label: string; value: number; max: number; color: string; sub?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="text-gray-500">{value.toLocaleString()}{sub ? ` ${sub}` : ""}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ stats, onNavigate }: { stats: any; onNavigate: (tab: Tab) => void }) {
  const [analytics, setAnalytics]   = useState<any>(null);
  const [aLoading, setALoading]     = useState(true);
  const [trendDays, setTrendDays]   = useState(14);
  const [trendMode, setTrendMode]   = useState<"bookings"|"revenue">("bookings");
  const [funnelData, setFunnelData] = useState<any>(null);
  const [funnelLoading, setFunnelLoading] = useState(true);

  useEffect(() => {
    setALoading(true);
    fetch(`/api/admin/analytics?days=${trendDays}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setAnalytics(d.analytics); })
      .finally(() => setALoading(false));
  }, [trendDays]);

  useEffect(() => {
    fetch("/api/admin/draft-analytics")
      .then((r) => r.json())
      .then((d) => { if (d.success) setFunnelData(d.data); })
      .finally(() => setFunnelLoading(false));
  }, []);

  const TYPE_COLORS: Record<string, string> = {
    OPD: "#2563eb", Lab: "#f59e0b", Surgery: "#7c3aed", Consultation: "#0d9488", IPD: "#dc2626",
  };

  const trendData = analytics?.trend?.slice(-trendDays) || [];
  const trendFormatted = trendData.map((d: any) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-IN", { day:"2-digit", month:"short" }),
  }));

  const maxBookingType = Math.max(...(analytics?.byType || []).map((t: any) => t.count), 1);

  const fmtINR = (n: number) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : n >= 1000 ? `₹${(n/1000).toFixed(1)}k` : `₹${n}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold text-gray-800">📊 Analytics Overview</h1>
        <p className="text-xs text-gray-400">{new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" })}</p>
      </div>

      {/* ── TODAY row ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Today's Bookings", value: analytics?.today?.bookings ?? "—", icon: "📋", bg: "bg-gradient-to-br from-teal-500 to-teal-600", text: "text-white" },
          { label: "Today's Revenue",  value: analytics?.today?.revenue  != null ? fmtINR(analytics.today.revenue) : "—", icon: "💰", bg: "bg-gradient-to-br from-emerald-500 to-emerald-600", text: "text-white" },
          { label: "New Users Today",  value: analytics?.today?.newUsers ?? "—", icon: "👥", bg: "bg-gradient-to-br from-blue-500 to-blue-600", text: "text-white" },
        ].map(({ label, value, icon, bg, text }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 shadow-md`}>
            <p className="text-2xl mb-1">{icon}</p>
            <p className={`text-3xl font-extrabold ${text}`}>{value}</p>
            <p className={`text-xs font-medium mt-0.5 ${text} opacity-80`}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── KPI tiles ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Members",           value: stats?.totalUsers,     icon: "👥", bg: "bg-blue-50",    text: "text-blue-700",    tab: "members"   as Tab },
          { label: "Hospitals",         value: stats?.totalHospitals, icon: "🏥", bg: "bg-purple-50",  text: "text-purple-700",  tab: "hospitals" as Tab },
          { label: "Active Doctors",    value: stats?.totalDoctors,   icon: "🩺", bg: "bg-teal-50",    text: "text-teal-700",    tab: "doctors"   as Tab },
          { label: "Surgery Packages",  value: stats?.totalPackages,  icon: "📦", bg: "bg-orange-50",  text: "text-orange-700",  tab: "packages"  as Tab },
          { label: "Lab Tests",         value: stats?.totalLabTests,  icon: "🧪", bg: "bg-yellow-50",  text: "text-yellow-700",  tab: "labtests"  as Tab },
        ].map(({ label, value, icon, bg, text, tab }) => (
          <button key={label} onClick={() => onNavigate(tab)}
            className={`${bg} rounded-2xl p-4 text-left hover:shadow-md transition-all group`}>
            <p className="text-xl mb-1">{icon}</p>
            <p className={`text-2xl font-bold ${text}`}>{value ?? "—"}</p>
            <p className={`text-xs font-medium mt-0.5 ${text} opacity-70`}>{label}</p>
          </button>
        ))}
      </div>

      {/* ── Pending alerts ── */}
      {(stats?.pendingHospitals > 0 || stats?.pendingDoctors > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stats?.pendingHospitals > 0 && (
            <button onClick={() => onNavigate("hospitals")}
              className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 hover:bg-amber-100 transition text-left">
              <div className="w-10 h-10 bg-amber-200 rounded-xl flex items-center justify-center text-xl shrink-0">🏥</div>
              <div>
                <p className="font-bold text-amber-800 text-sm">{stats.pendingHospitals} Hospital Pending Verification</p>
                <p className="text-xs text-amber-600 mt-0.5">Click to review →</p>
              </div>
            </button>
          )}
          {stats?.pendingDoctors > 0 && (
            <button onClick={() => onNavigate("doctors")}
              className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3 hover:bg-blue-100 transition text-left">
              <div className="w-10 h-10 bg-blue-200 rounded-xl flex items-center justify-center text-xl shrink-0">🩺</div>
              <div>
                <p className="font-bold text-blue-800 text-sm">{stats.pendingDoctors} Doctor Pending Approval</p>
                <p className="text-xs text-blue-600 mt-0.5">Click to review →</p>
              </div>
            </button>
          )}
        </div>
      )}

      {/* ── Booking + Revenue summary ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Bookings",   value: stats?.bookings?.total,     bg: "bg-white",      text: "text-gray-800"    },
          { label: "Pending",          value: stats?.bookings?.pending,   bg: "bg-amber-50",   text: "text-amber-700"   },
          { label: "Confirmed",        value: stats?.bookings?.confirmed, bg: "bg-green-50",   text: "text-green-700"   },
          { label: "Completed",        value: stats?.bookings?.completed, bg: "bg-teal-50",    text: "text-teal-700"    },
          { label: "Revenue (Paid)",   value: fmtINR(stats?.revenue?.paid || 0), bg: "bg-emerald-50", text: "text-emerald-700" },
        ].map(({ label, value, bg, text }) => (
          <button key={label} onClick={() => onNavigate("bookings")}
            className={`${bg} border border-gray-100 rounded-2xl p-4 shadow-sm text-left hover:shadow-md transition-all`}>
            <p className={`text-2xl font-bold ${text}`}>{value ?? "—"}</p>
            <p className={`text-xs font-medium mt-0.5 ${text} opacity-70`}>{label}</p>
          </button>
        ))}
      </div>

      {/* ── Trend Chart ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <p className="font-bold text-gray-800">
              {trendMode === "bookings" ? "📅 Booking Trend" : "💰 Revenue Trend"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Last {trendDays} days</p>
          </div>
          <div className="flex gap-2">
            {/* Mode toggle */}
            <div className="flex bg-gray-100 rounded-xl p-0.5">
              {(["bookings","revenue"] as const).map((m) => (
                <button key={m} onClick={() => setTrendMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${trendMode === m ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  {m === "bookings" ? "Bookings" : "Revenue"}
                </button>
              ))}
            </div>
            {/* Days toggle */}
            <div className="flex bg-gray-100 rounded-xl p-0.5">
              {[7, 14, 30].map((d) => (
                <button key={d} onClick={() => setTrendDays(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${trendDays === d ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </div>

        {aLoading ? (
          <div className="h-32 bg-gray-50 rounded-xl animate-pulse" />
        ) : trendFormatted.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-gray-300 text-sm">No data yet</div>
        ) : (
          <>
            <BarChart
              data={trendFormatted}
              valueKey={trendMode === "bookings" ? "count" : "revenue"}
              labelKey="label"
              color={trendMode === "bookings" ? "#0d9488" : "#10b981"}
              height={120}
            />
            {/* X-axis labels — show first, middle, last */}
            <div className="flex justify-between mt-1 px-0.5">
              <span className="text-xs text-gray-400">{trendFormatted[0]?.label}</span>
              <span className="text-xs text-gray-400">{trendFormatted[Math.floor(trendFormatted.length/2)]?.label}</span>
              <span className="text-xs text-gray-400">{trendFormatted[trendFormatted.length - 1]?.label}</span>
            </div>
            {/* Summary line */}
            <div className="flex gap-4 mt-3 pt-3 border-t border-gray-50">
              <div>
                <p className="text-xs text-gray-400">Total bookings</p>
                <p className="font-bold text-gray-800">{trendFormatted.reduce((s: number, d: any) => s + d.count, 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Revenue</p>
                <p className="font-bold text-emerald-700">{fmtINR(trendFormatted.reduce((s: number, d: any) => s + d.revenue, 0))}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Peak day</p>
                <p className="font-bold text-gray-800">{trendFormatted.reduce((a: any, d: any) => d.count > (a?.count || 0) ? d : a, null)?.label || "—"}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Bottom row: Type breakdown + This month ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Bookings by type */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="font-bold text-gray-800 mb-4">🏷️ Bookings by Type</p>
          {aLoading ? (
            <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : (analytics?.byType || []).length === 0 ? (
            <p className="text-sm text-gray-400">No bookings yet</p>
          ) : (
            <div className="space-y-3">
              {(analytics?.byType || []).map((t: any) => (
                <HorizBar
                  key={t._id}
                  label={t._id || "Unknown"}
                  value={t.count}
                  max={maxBookingType}
                  color={TYPE_COLORS[t._id] || "#6b7280"}
                  sub={`· ${fmtINR(t.revenue)}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* This month + status */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="font-bold text-gray-800">📆 This Month</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-teal-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-teal-700">{analytics?.summary?.bookingsThisMonth ?? "—"}</p>
              <p className="text-xs text-teal-600 mt-0.5">New Bookings</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{analytics?.summary?.usersThisMonth ?? "—"}</p>
              <p className="text-xs text-blue-600 mt-0.5">New Users</p>
            </div>
          </div>

          <p className="font-bold text-gray-800 pt-1">📋 By Status</p>
          <div className="space-y-2">
            {(analytics?.byStatus || []).map((s: any) => {
              const total = (analytics?.byStatus || []).reduce((sum: number, x: any) => sum + x.count, 0);
              const pct   = total > 0 ? Math.round((s.count / total) * 100) : 0;
              const colors: Record<string, string> = { pending:"#f59e0b", confirmed:"#16a34a", completed:"#0d9488", cancelled:"#dc2626" };
              return (
                <div key={s._id} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[s._id] || "#6b7280" }} />
                  <span className="text-xs text-gray-600 capitalize flex-1">{s._id}</span>
                  <span className="text-xs font-semibold text-gray-700">{s.count}</span>
                  <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-gray-50">
            <p className="text-xs text-gray-400">All-time paid revenue</p>
            <p className="text-xl font-bold text-emerald-700">{fmtINR(analytics?.summary?.totalRevenuePaid || 0)}</p>
          </div>
        </div>
      </div>

      {/* ── Payment Mode Breakdown ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="font-bold text-gray-800 mb-4">💳 Payment Mode Breakdown</p>
        {aLoading ? (
          <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : (analytics?.byPaymentMode || []).length === 0 ? (
          <p className="text-sm text-gray-400">No payment data</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(analytics?.byPaymentMode || []).map((p: any) => {
              const pmIcons: Record<string,string> = { counter:"🏢", online:"📱", wallet:"💼", insurance:"🛡️" };
              const pmColors: Record<string,string> = { counter:"bg-amber-50 border-amber-100 text-amber-700", online:"bg-blue-50 border-blue-100 text-blue-700", wallet:"bg-teal-50 border-teal-100 text-teal-700", insurance:"bg-purple-50 border-purple-100 text-purple-700" };
              const label = p._id === "counter" ? "Counter / Cash" : p._id === "online" ? "Online / UPI" : p._id === "wallet" ? "Brims Wallet" : p._id === "insurance" ? "Insurance" : p._id || "Other";
              const cls   = pmColors[p._id] || "bg-gray-50 border-gray-100 text-gray-700";
              return (
                <div key={p._id} className={`${cls} border rounded-xl p-4`}>
                  <p className="text-xl mb-1">{pmIcons[p._id] || "💳"}</p>
                  <p className="text-xl font-bold">{p.count}</p>
                  <p className="text-xs font-semibold mt-0.5">{label}</p>
                  <p className="text-xs opacity-70 mt-0.5">{fmtINR(p.revenue)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Top Hospitals + Top Doctors ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Top Hospitals */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="font-bold text-gray-800 mb-4">🏥 Top Hospitals</p>
          {aLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : (analytics?.topHospitals || []).length === 0 ? (
            <p className="text-sm text-gray-400">No hospital bookings yet</p>
          ) : (
            <div className="space-y-2">
              {(analytics?.topHospitals || []).map((h: any, i: number) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? "bg-yellow-400 text-yellow-900" : i === 1 ? "bg-gray-300 text-gray-700" : i === 2 ? "bg-orange-300 text-orange-900" : "bg-gray-100 text-gray-500"}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{h.name}</p>
                    {h.district && <p className="text-xs text-gray-400">{h.district}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-teal-700">{h.count} bookings</p>
                    <p className="text-xs text-gray-400">{fmtINR(h.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Doctors */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="font-bold text-gray-800 mb-4">🩺 Top Doctors</p>
          {aLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : (analytics?.topDoctors || []).length === 0 ? (
            <p className="text-sm text-gray-400">No doctor bookings yet</p>
          ) : (
            <div className="space-y-2">
              {(analytics?.topDoctors || []).map((d: any, i: number) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? "bg-yellow-400 text-yellow-900" : i === 1 ? "bg-gray-300 text-gray-700" : i === 2 ? "bg-orange-300 text-orange-900" : "bg-gray-100 text-gray-500"}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">Dr. {d.name}</p>
                    <p className="text-xs text-gray-400">{d.department}{d.hospitalName ? ` · ${d.hospitalName}` : ""}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-blue-700">{d.count} appts</p>
                    <p className="text-xs text-gray-400">{fmtINR(d.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Booking Funnel Analytics ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Funnel stages */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-gray-800">🎯 Booking Funnel</p>
              <p className="text-xs text-gray-400 mt-0.5">Kitne users kahan tak pahunche</p>
            </div>
            {funnelData && (
              <div className="text-right">
                <p className="text-xl font-bold text-teal-600">{funnelData.conversionRate}%</p>
                <p className="text-xs text-gray-400">Conversion</p>
              </div>
            )}
          </div>
          {funnelLoading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-8 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : !funnelData ? (
            <p className="text-sm text-gray-400">No draft data yet</p>
          ) : (
            <div className="space-y-3">
              {(funnelData.byStage || []).map((s: any) => (
                <div key={s.stage}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">Stage {s.stage}: {s.label}</span>
                    <span className="text-xs font-semibold text-gray-700">{s.count} <span className="text-gray-400 font-normal">({s.pct}%)</span></span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${s.pct}%`,
                        backgroundColor: ["#0d9488","#2563eb","#7c3aed","#f59e0b"][s.stage - 1],
                      }}
                    />
                  </div>
                  {s.dropOff > 0 && (
                    <p className="text-[10px] text-red-400 mt-0.5">↓ {s.dropOff} dropped before this stage</p>
                  )}
                </div>
              ))}
              <div className="pt-3 border-t border-gray-50 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-sm font-bold text-teal-600">{funnelData.totalConverted}</p>
                  <p className="text-[10px] text-gray-400">Converted</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-600">{funnelData.totalActive}</p>
                  <p className="text-[10px] text-gray-400">Active Drafts</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-red-500">{funnelData.abandonedToday}</p>
                  <p className="text-[10px] text-gray-400">Abandoned Today</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* By type conversion */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="font-bold text-gray-800 mb-4">📊 Funnel by Booking Type</p>
          {funnelLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : !funnelData || (funnelData.byType || []).length === 0 ? (
            <p className="text-sm text-gray-400">No draft data yet</p>
          ) : (
            <div className="space-y-2">
              {(funnelData.byType || []).sort((a: any, b: any) => b.total - a.total).map((t: any) => {
                const typeIcons: Record<string, string> = { OPD: "🩺", Lab: "🧪", Surgery: "🏥", IPD: "🛏️", Consultation: "💻" };
                const typeColors: Record<string, string> = { OPD: "bg-blue-500", Lab: "bg-yellow-500", Surgery: "bg-purple-500", IPD: "bg-red-500", Consultation: "bg-teal-500" };
                return (
                  <div key={t.type} className="bg-gray-50 rounded-xl px-3 py-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span>{typeIcons[t.type] || "📋"}</span>
                        <span className="text-sm font-semibold text-gray-800">{t.type}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{t.total} total</span>
                        <span className="font-bold text-teal-700">{t.conversionRate}% converted</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${typeColors[t.type] || "bg-gray-400"}`} style={{ width: `${t.conversionRate}%` }} />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                      <span>✅ {t.converted} converted · ⏳ {t.active} active · ❌ {t.expired} expired</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── TAB: Members ──────────────────────────────────────────────────────────────
function MembersTab({ onOpenPatient }: { onOpenPatient: (id: string) => void }) {
  const [members, setMembers]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [status, setStatus]     = useState("all");
  const [page, setPage]         = useState(1);
  const [meta, setMeta]         = useState<any>({});
  const [toggling, setToggling] = useState<string | null>(null);

  const fetch_ = useCallback(async (pg = 1) => {
    setLoading(true);
    const p = new URLSearchParams({ page: pg.toString() });
    if (search) p.set("search", search);
    if (status !== "all") p.set("status", status);
    const res  = await fetch(`/api/admin/members?${p}`);
    const data = await res.json();
    if (data.success) { setMembers(data.members); setMeta({ total: data.total, pages: data.pages }); }
    setLoading(false);
  }, [search, status]);

  useEffect(() => { fetch_(1); setPage(1); }, [search, status]);

  async function toggleActive(m: any) {
    const key = String(m._id);
    setToggling(key);
    const body = m.isPrimary === false
      ? { primaryUserId: m.primaryUserId, memberId: m._id, isActive: !m.isActive }
      : { userId: m._id, isActive: !m.isActive };
    await fetch("/api/admin/members", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    await fetch_(page);
    setToggling(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-800">👥 Members</h1>
        <div className="flex gap-2 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Name / Mobile / Member ID..." />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400 bg-white">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <Spinner /> : members.length === 0 ? <EmptyState icon="👥" message="Koi member nahi mila" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Member", "Mobile", "Member ID", "Family Card", "Wallet", "Diseases", "Active", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {members.map((m: any) => (
                  <tr key={String(m._id)} className={`hover:bg-gray-50 transition ${m.isPrimary === false ? "bg-teal-50/30" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {m.photo ? <img src={m.photo} alt={m.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" /> : <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm flex-shrink-0">{m.name?.[0]}</div>}
                        <div>
                          <p className="font-semibold text-gray-800 flex items-center gap-1.5">
                            {m.name}
                            {m.isPrimary === false && <span className="text-[9px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-bold capitalize">{m.relationship || "Secondary"}</span>}
                          </p>
                          <p className="text-xs text-gray-400">{m.age} yrs · {m.gender}{m.isPrimary === false ? ` · of ${m.primaryName}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">📱 {m.mobile}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{m.memberId || "—"}</td>
                    <td className="px-4 py-3">
                      {m.cardStatus ? <Badge color={m.cardStatus === "active" ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}>💳 {m.cardNumber}</Badge> : <span className="text-xs text-gray-400">No card</span>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-teal-700">{m.cardStatus ? `₹${m.walletBalance}` : "—"}</td>
                    <td className="px-4 py-3">
                      {m.preExistingDiseases?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">{m.preExistingDiseases.slice(0, 2).map((d: string) => <span key={d} className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full border border-red-100">{d}</span>)}{m.preExistingDiseases.length > 2 && <span className="text-[10px] text-gray-400">+{m.preExistingDiseases.length - 2}</span>}</div>
                      ) : <span className="text-xs text-gray-300">None</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Toggle value={m.isActive} onChange={() => toggleActive(m)} disabled={toggling === String(m._id)} />
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => onOpenPatient(m.isPrimary === false ? m.primaryUserId : m._id)} className="text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-lg font-semibold transition">
                        👁 View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 pb-4">
              <Pagination page={page} pages={meta.pages ?? 1} total={meta.total ?? 0} onPage={(p) => { setPage(p); fetch_(p); }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Hospital Manage Panel Modals ──────────────────────────────────────────────
const DEPT_LIST = MEDICAL_DEPARTMENTS;
const LAB_CAT   = ["Blood Test","Urine Test","Stool Test","Imaging","ECG","X-Ray","Ultrasound","MRI","CT Scan","Pathology","Other"];
const SUR_CAT   = SURGERY_DEPARTMENTS;

// Surgery names grouped by department — from shared lib
const SURGERY_BY_DEPT = SURGERIES_BY_DEPARTMENT;

// Standard package inclusions
const STD_INCLUSIONS = [
  "Pre-op Tests","Surgery","Anaesthesia","ICU/HDU (if needed)","Hospital Stay",
  "Medicines","Post-op Dressing","Light Diet Meals","Ghar se Pickup","Ghar Drop",
  "Post-surgery Care","Follow-up Consultation(s)","Nursing Care","Blood Transfusion (if needed)",
];

// Pre-surgery test options
const PRE_SURGERY_TESTS = [
  "Blood Test (CBC)","LFT (Liver Function)","KFT (Kidney Function)","ECG",
  "X-Ray Chest","CT Scan","MRI","Echo (Echocardiography)","Urine Routine",
  "Blood Sugar (Fasting)","HIV Test","HBsAg (Hepatitis B)","Coagulation Profile (PT/INR)",
  "Thyroid Profile (TFT)","2D Echo","Serum Electrolytes",
];

// Room types
const ROOM_TYPES = ["General Room","Semi-Private Room","Private Room","Deluxe Room","Suite"];

const mInp = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition";
const mSel = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white transition";

function HMPDoctorModal({ hospitalId, doctor, onClose, onSaved }: { hospitalId: string; doctor?: any; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!doctor;
  const [f, setF] = useState({
    name: doctor?.name || "", department: doctor?.department || "", speciality: doctor?.speciality || "",
    mobile: doctor?.mobile || "", email: doctor?.email || "", opdFee: doctor?.opdFee?.toString() || "",
    offerFee: doctor?.offerFee?.toString() || "", experience: doctor?.experience?.toString() || "",
    degrees: doctor?.degrees?.map((d: any) => d.degree || d).join(", ") || "",
    isActive: doctor?.isActive !== false,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    if (!f.name || !f.department || !f.opdFee) { setErr("Naam, Department aur OPD Fee zaruri hai"); return; }
    setSaving(true); setErr("");
    try {
      const payload: any = {
        hospitalId, ...f, opdFee: Number(f.opdFee), offerFee: Number(f.offerFee) || Number(f.opdFee),
        experience: Number(f.experience) || 0,
        degrees: f.degrees ? f.degrees.split(",").map((s: string) => ({ degree: s.trim(), university: "", year: null })).filter((d: { degree: string }) => d.degree) : [],
      };
      if (isEdit) payload.doctorId = doctor._id;
      const res  = await fetch("/api/hospital/doctors", {
        method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) onSaved();
      else setErr(data.message);
    } finally { setSaving(false); }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 rounded-t-2xl flex items-center justify-between flex-shrink-0">
            <h3 className="text-white font-bold text-lg">{isEdit ? "✏️ Edit Doctor" : "➕ Add Doctor"}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white">✕</button>
          </div>
          <div className="p-5 space-y-3">
            {err && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{err}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 block mb-1">Doctor Ka Naam *</label><input className={mInp} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Dr. Ramesh Kumar" /></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Department *</label><select className={mSel} value={f.department} onChange={(e) => set("department", e.target.value)}><option value="">Select</option>{DEPT_LIST.map((d) => <option key={d}>{d}</option>)}</select></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Speciality</label><input className={mInp} value={f.speciality} onChange={(e) => set("speciality", e.target.value)} placeholder="e.g. Laparoscopic" /></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Mobile</label><input className={mInp} value={f.mobile} onChange={(e) => set("mobile", e.target.value)} maxLength={10} placeholder="10-digit" /></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Email</label><input className={mInp} type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="doctor@email.com" /></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">OPD Fee (₹) *</label><input className={mInp} type="number" value={f.opdFee} onChange={(e) => set("opdFee", e.target.value)} placeholder="300" /></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Offer Fee (₹)</label><input className={mInp} type="number" value={f.offerFee} onChange={(e) => set("offerFee", e.target.value)} placeholder="250" /></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Experience (yrs)</label><input className={mInp} type="number" value={f.experience} onChange={(e) => set("experience", e.target.value)} placeholder="5" /></div>
              <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 block mb-1">Degrees (comma separated)</label><input className={mInp} value={f.degrees} onChange={(e) => set("degrees", e.target.value)} placeholder="MBBS, MD, MS" /></div>
              {isEdit && <div className="col-span-2 flex items-center gap-3"><label className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-2"><input type="checkbox" checked={f.isActive} onChange={(e) => set("isActive", e.target.checked)} className="rounded" /><span>Active (uncheck = On Hold)</span></label></div>}
            </div>
          </div>
          <div className="px-5 pb-5 flex gap-3">
            <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
            <button onClick={save} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">{saving ? "Saving..." : isEdit ? "Update Doctor" : "Add Doctor"}</button>
          </div>
        </div>
      </div>
    </>
  );
}

function HMPLabModal({ hospitalId, labTest, onClose, onSaved }: { hospitalId: string; labTest?: any; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!labTest;

  async function handleSubmit(payload: any) {
    const apiPayload: any = { ...payload, hospitalId };
    if (isEdit) apiPayload.testId = labTest._id;
    const res  = await fetch("/api/hospital/lab-tests", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apiPayload),
    });
    const data = await res.json();
    if (data.success) { onSaved(); return { success: true }; }
    return { success: false, message: data.message };
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-6">
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-5 rounded-t-2xl flex items-center justify-between">
            <div>
              <p className="text-teal-200 text-xs font-medium">Lab Test</p>
              <h3 className="text-white font-bold text-lg">{isEdit ? "✏️ Edit Lab Test" : "➕ Add Lab Test"}</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white">✕</button>
          </div>
          <div className="p-6">
            <LabTestFullForm
              initialData={labTest}
              showStatusSection={isEdit}
              isEdit={isEdit}
              submitLabel={isEdit ? "✓ Save Changes" : "✓ Add Lab Test"}
              onSubmit={handleSubmit}
              onCancel={onClose}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function HMPSurgeryModal({ hospitalId, pkg, onClose, onSaved }: { hospitalId: string; pkg?: any; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!pkg;

  // Parse existing roomOptions for edit mode
  const initRoomOpts = (): Record<string, { enabled: boolean; charge: string }> => {
    const map: Record<string, { enabled: boolean; charge: string }> = {};
    ROOM_TYPES.forEach((rt) => map[rt] = { enabled: false, charge: "0" });
    map["General Room"] = { enabled: true, charge: "0" }; // always included
    if (pkg?.roomOptions) {
      pkg.roomOptions.forEach((ro: any) => {
        if (map[ro.type]) map[ro.type] = { enabled: true, charge: String(ro.extraCharge || 0) };
      });
    }
    return map;
  };

  const [dept,         setDept]         = useState(pkg?.category || "General Surgery");
  const [surgeryName,  setSurgeryName]  = useState(pkg?.name || "");
  const [customName,   setCustomName]   = useState(!(SURGERY_BY_DEPT[pkg?.category || "General Surgery"] || []).includes(pkg?.name || "") ? pkg?.name || "" : "");
  const [useCustom,    setUseCustom]    = useState(!(SURGERY_BY_DEPT[pkg?.category || "General Surgery"] || []).includes(pkg?.name || "") && !!pkg?.name);
  const [description,  setDescription]  = useState(pkg?.description || "");
  const [inclusions,   setInclusions]   = useState<string[]>(pkg?.inclusions || ["Pre-op Tests","Surgery","Anaesthesia","Hospital Stay","Medicines","Post-op Dressing"]);
  const [preTests,     setPreTests]     = useState<string[]>(pkg?.preSurgeryTests || []);
  const [roomOpts,     setRoomOpts]     = useState(initRoomOpts());
  const [surgeonName,  setSurgeonName]  = useState(pkg?.surgeonName || "");
  const [surgeonExp,   setSurgeonExp]   = useState(String(pkg?.surgeonExperience || ""));
  const [surgeonDeg,   setSurgeonDeg]   = useState((pkg?.surgeonDegrees || []).join(", "));
  const [pickup,       setPickup]       = useState(pkg?.pickupFromHome || false);
  const [pickupCharge, setPickupCharge] = useState(String(pkg?.pickupCharge || "500"));
  const [drop,         setDrop]         = useState(pkg?.dropAvailable || false);
  const [food,         setFood]         = useState(pkg?.foodIncluded || false);
  const [foodDetails,  setFoodDetails]  = useState(pkg?.foodDetails || "Light diet meals included");
  const [postCare,     setPostCare]     = useState(pkg?.postCareIncluded || false);
  const [followUp,     setFollowUp]     = useState(String(pkg?.followUpConsultations || "1"));
  const [stayDays,     setStayDays]     = useState(String(pkg?.stayDays || "2"));
  const [mrp,          setMrp]          = useState(String(pkg?.mrp || ""));
  const [offerPrice,   setOfferPrice]   = useState(String(pkg?.offerPrice || ""));
  const [memberPrice,  setMemberPrice]  = useState(String(pkg?.membershipPrice || ""));
  const [isActive,     setIsActive]     = useState(pkg?.isActive !== false);
  const [saving,       setSaving]       = useState(false);
  const [err,          setErr]          = useState("");

  const surgeryOptions = SURGERY_BY_DEPT[dept] || [];

  function toggleList(list: string[], item: string, setter: (v: string[]) => void) {
    setter(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  }

  function updateRoomOpt(rt: string, field: "enabled" | "charge", val: any) {
    setRoomOpts((p) => ({ ...p, [rt]: { ...p[rt], [field]: val } }));
  }

  async function save() {
    const finalName = useCustom ? customName.trim() : surgeryName;
    if (!finalName)       { setErr("Surgery ka naam daalo"); return; }
    if (!mrp)             { setErr("MRP zaruri hai"); return; }
    if (!offerPrice)      { setErr("Offer Price zaruri hai"); return; }
    setSaving(true); setErr("");
    try {
      const activeRoomOptions = ROOM_TYPES
        .filter((rt) => roomOpts[rt]?.enabled)
        .map((rt)  => ({ type: rt, extraCharge: Number(roomOpts[rt].charge) || 0 }));

      const payload: any = {
        hospitalId,
        name:                  finalName,
        category:              dept,
        description,
        inclusions,
        preSurgeryTests:       preTests,
        roomOptions:           activeRoomOptions,
        surgeonName,
        surgeonExperience:     Number(surgeonExp) || 0,
        surgeonDegrees:        surgeonDeg.split(",").map((s: string) => s.trim()).filter(Boolean),
        pickupFromHome:        pickup,
        pickupCharge:          pickup ? Number(pickupCharge) || 0 : 0,
        dropAvailable:         drop,
        foodIncluded:          food,
        foodDetails:           food ? foodDetails : "",
        postCareIncluded:      postCare,
        followUpConsultations: Number(followUp) || 0,
        stayDays:              Number(stayDays) || 1,
        mrp:                   Number(mrp),
        offerPrice:            Number(offerPrice),
        membershipPrice:       Number(memberPrice) || Number(offerPrice),
        isActive,
      };
      if (isEdit) payload.packageId = pkg._id;

      const res  = await fetch("/api/hospital/surgery-packages", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) onSaved();
      else setErr(data.message);
    } finally { setSaving(false); }
  }

  // Section label helper
  const SLabel = ({ n, title }: { n: string; title: string }) => (
    <div className="flex items-center gap-2 pt-1">
      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{n}</span>
      <p className="text-sm font-bold text-gray-700">{title}</p>
    </div>
  );

  const CheckGrid = ({ items, selected, onToggle }: { items: string[]; selected: string[]; onToggle: (v: string) => void }) => (
    <div className="grid grid-cols-2 gap-1.5">
      {items.map((item) => (
        <label key={item} onClick={() => onToggle(item)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs cursor-pointer transition select-none ${selected.includes(item) ? "bg-purple-50 border-purple-300 text-purple-800 font-semibold" : "bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-300"}`}>
          <span className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border ${selected.includes(item) ? "bg-purple-600 border-purple-600 text-white" : "border-gray-300"}`}>
            {selected.includes(item) && <svg viewBox="0 0 12 12" className="w-3 h-3 fill-white"><path d="M2 6l3 3 5-5"/><polyline points="2,6 5,9 10,4" stroke="white" strokeWidth="2" fill="none"/></svg>}
          </span>
          {item}
        </label>
      ))}
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl my-4">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-5 rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
            <div>
              <p className="text-purple-200 text-xs font-medium">Hospital Surgery Package</p>
              <h3 className="text-white font-bold text-lg">{isEdit ? "✏️ Edit Package" : "➕ Add Surgery Package"}</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white">✕</button>
          </div>

          <div className="p-5 space-y-5">
            {err && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{err}</p>}

            {/* ─ Section 1: Department & Surgery ─ */}
            <SLabel n="1" title="Department & Surgery" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Department *</label>
                <select className={mSel} value={dept} onChange={(e) => { setDept(e.target.value); setSurgeryName(""); setUseCustom(false); }}>
                  {SUR_CAT.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Surgery Name *</label>
                {!useCustom ? (
                  <select className={mSel} value={surgeryName} onChange={(e) => { if (e.target.value === "__custom__") { setUseCustom(true); setSurgeryName(""); } else setSurgeryName(e.target.value); }}>
                    <option value="">-- Select Surgery --</option>
                    {surgeryOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    <option value="__custom__">✏️ Custom naam daalo...</option>
                  </select>
                ) : (
                  <div className="relative">
                    <input className={mInp} value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Surgery ka naam..." autoFocus />
                    <button onClick={() => { setUseCustom(false); setCustomName(""); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-purple-500 hover:text-purple-700">↩ List</button>
                  </div>
                )}
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 block mb-1">Short Description</label>
                <textarea className={mInp + " resize-none"} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Safe and effective surgery with experienced team..." />
              </div>
            </div>

            {/* ─ Section 2: Inclusions ─ */}
            <SLabel n="2" title="Package Inclusions (kya kya shamil hai)" />
            <CheckGrid items={STD_INCLUSIONS} selected={inclusions} onToggle={(item) => toggleList(inclusions, item, setInclusions)} />

            {/* ─ Section 3: Pre-surgery Tests ─ */}
            <SLabel n="3" title="Pre-surgery Tests (included)" />
            <CheckGrid items={PRE_SURGERY_TESTS} selected={preTests} onToggle={(item) => toggleList(preTests, item, setPreTests)} />

            {/* ─ Section 4: Room Options ─ */}
            <SLabel n="4" title="Room Options & Pricing" />
            <div className="space-y-2">
              {ROOM_TYPES.map((rt) => {
                const isGeneral = rt === "General Room";
                const opt = roomOpts[rt];
                return (
                  <div key={rt} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition ${opt.enabled ? "bg-purple-50 border-purple-200" : "bg-gray-50 border-gray-100 opacity-60"}`}>
                    {isGeneral ? (
                      <span className="w-4 h-4 rounded bg-purple-600 border-purple-600 flex-shrink-0 flex items-center justify-center">
                        <svg viewBox="0 0 12 12" className="w-3 h-3"><polyline points="2,6 5,9 10,4" stroke="white" strokeWidth="2" fill="none"/></svg>
                      </span>
                    ) : (
                      <input type="checkbox" checked={opt.enabled} onChange={(e) => updateRoomOpt(rt, "enabled", e.target.checked)} className="w-4 h-4 accent-purple-600 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium text-gray-700 flex-1">{rt}</span>
                    {isGeneral ? (
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Base Price (Included)</span>
                    ) : opt.enabled ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">+₹</span>
                        <input type="number" value={opt.charge} onChange={(e) => updateRoomOpt(rt, "charge", e.target.value)}
                          className="w-20 border border-purple-200 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-purple-400" placeholder="0" />
                        <span className="text-xs text-gray-400">extra</span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* ─ Section 5: Stay & Surgeon ─ */}
            <SLabel n="5" title="Stay & Surgeon Details" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Stay Days</label>
                <input className={mInp} type="number" value={stayDays} onChange={(e) => setStayDays(e.target.value)} placeholder="2" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Surgeon Experience (yrs)</label>
                <input className={mInp} type="number" value={surgeonExp} onChange={(e) => setSurgeonExp(e.target.value)} placeholder="10" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 block mb-1">Surgeon Name</label>
                <input className={mInp} value={surgeonName} onChange={(e) => setSurgeonName(e.target.value)} placeholder="Dr. Ramesh Kumar" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 block mb-1">Surgeon Degrees (comma separated)</label>
                <input className={mInp} value={surgeonDeg} onChange={(e) => setSurgeonDeg(e.target.value)} placeholder="MBBS, MS, MCh" />
              </div>
            </div>

            {/* ─ Section 6: Logistics & Post-Care ─ */}
            <SLabel n="6" title="Logistics & Post-surgery Care" />
            <div className="space-y-3">
              {/* Pickup */}
              <div className={`p-3 rounded-xl border transition ${pickup ? "bg-teal-50 border-teal-200" : "bg-gray-50 border-gray-100"}`}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={pickup} onChange={(e) => setPickup(e.target.checked)} className="w-4 h-4 accent-teal-600" />
                  <span className="text-sm font-medium text-gray-700">🚗 Ghar se Pickup Available</span>
                </label>
                {pickup && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Pickup Charge: ₹</span>
                    <input type="number" value={pickupCharge} onChange={(e) => setPickupCharge(e.target.value)}
                      className="w-24 border border-teal-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400" placeholder="500" />
                  </div>
                )}
              </div>
              {/* Drop */}
              <div className={`p-3 rounded-xl border transition ${drop ? "bg-teal-50 border-teal-200" : "bg-gray-50 border-gray-100"}`}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={drop} onChange={(e) => setDrop(e.target.checked)} className="w-4 h-4 accent-teal-600" />
                  <span className="text-sm font-medium text-gray-700">🚕 Discharge Drop Available (Free)</span>
                </label>
              </div>
              {/* Food */}
              <div className={`p-3 rounded-xl border transition ${food ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-100"}`}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={food} onChange={(e) => setFood(e.target.checked)} className="w-4 h-4 accent-amber-500" />
                  <span className="text-sm font-medium text-gray-700">🍽️ Food / Meals Included</span>
                </label>
                {food && (
                  <input className="mt-2 w-full border border-amber-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400" value={foodDetails} onChange={(e) => setFoodDetails(e.target.value)} placeholder="e.g. Light diet 3 times/day" />
                )}
              </div>
              {/* Post care */}
              <div className={`p-3 rounded-xl border transition ${postCare ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-100"}`}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={postCare} onChange={(e) => setPostCare(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                  <span className="text-sm font-medium text-gray-700">🩺 Post-surgery Care Included</span>
                </label>
              </div>
              {/* Follow-up */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 whitespace-nowrap">📅 Follow-up Consultations:</label>
                <input type="number" value={followUp} onChange={(e) => setFollowUp(e.target.value)}
                  className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-400" min="0" max="10" />
              </div>
            </div>

            {/* ─ Section 7: Pricing ─ */}
            <SLabel n="7" title="Pricing" />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">MRP (₹) *</label>
                <input className={mInp} type="number" value={mrp} onChange={(e) => setMrp(e.target.value)} placeholder="45000" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Offer Price (₹) *</label>
                <input className={mInp} type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} placeholder="35000" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Member Price (₹)</label>
                <input className={mInp} type="number" value={memberPrice} onChange={(e) => setMemberPrice(e.target.value)} placeholder="30000" />
              </div>
            </div>
            {mrp && offerPrice && (
              <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-2.5 flex items-center gap-4 text-sm">
                <span className="text-gray-500 line-through">₹{Number(mrp).toLocaleString()}</span>
                <span className="font-bold text-purple-700 text-base">₹{Number(offerPrice).toLocaleString()}</span>
                {mrp && offerPrice && Number(mrp) > Number(offerPrice) && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                    {Math.round(((Number(mrp) - Number(offerPrice)) / Number(mrp)) * 100)}% off
                  </span>
                )}
              </div>
            )}

            {/* ─ Section 8: Status (edit only) ─ */}
            {isEdit && (
              <>
                <SLabel n="8" title="Status" />
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${isActive ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 accent-green-600" />
                  <span className="text-sm font-medium text-gray-700">{isActive ? "✅ Active — patients ko dikh raha hai" : "⏸️ On Hold — patients ko nahi dikh raha"}</span>
                </label>
              </>
            )}
          </div>

          {/* Footer */}
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

// ── Hospital Manage Panel (Admin overlay) ─────────────────────────────────────
function HospitalManagePanel({ hospital, onClose }: { hospital: { _id: string; name: string }; onClose: () => void }) {
  type HMTab = "doctors" | "labtests" | "packages";
  const [tab,      setTab]      = useState<HMTab>("doctors");
  const [data,     setData]     = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState<string | null>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast,    setToast]    = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/hospital/overview?hospitalId=${hospital._id}`);
      const d    = await res.json();
      if (d.success) setData(d);
    } finally { setLoading(false); }
  }, [hospital._id]);

  useEffect(() => { loadData(); }, [loadData]);

  const mutate = async (url: string, method: string, body: object) => {
    const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d    = await res.json();
    if (d.success) { loadData(); }
    else showToast(d.message || "Error occurred");
    return d.success;
  };

  const doctors  = data?.doctors         || [];
  const labTests = data?.labTests         || [];
  const packages = data?.surgeryPackages  || [];

  const TABS = [
    { key: "doctors",  label: "Doctors",          icon: "🩺", count: doctors.length  },
    { key: "labtests", label: "Lab Tests",         icon: "🧪", count: labTests.length },
    { key: "packages", label: "Surgery Packages",  icon: "🏥", count: packages.length },
  ] as const;

  return (
    <>
      {toast && <div className="fixed top-4 right-4 z-[80] bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg">{toast}</div>}

      {/* Modals */}
      {modal === "addDoctor"   && <HMPDoctorModal  hospitalId={hospital._id} onClose={() => setModal(null)} onSaved={() => { setModal(null); loadData(); showToast("Doctor added!"); }} />}
      {modal === "editDoctor"  && editItem && <HMPDoctorModal  hospitalId={hospital._id} doctor={editItem}  onClose={() => { setModal(null); setEditItem(null); }} onSaved={() => { setModal(null); setEditItem(null); loadData(); showToast("Doctor updated!"); }} />}
      {modal === "addLab"      && <HMPLabModal     hospitalId={hospital._id} onClose={() => setModal(null)} onSaved={() => { setModal(null); loadData(); showToast("Lab test added!"); }} />}
      {modal === "editLab"     && editItem && <HMPLabModal     hospitalId={hospital._id} labTest={editItem} onClose={() => { setModal(null); setEditItem(null); }} onSaved={() => { setModal(null); setEditItem(null); loadData(); showToast("Lab test updated!"); }} />}
      {modal === "addSurgery"  && <HMPSurgeryModal hospitalId={hospital._id} onClose={() => setModal(null)} onSaved={() => { setModal(null); loadData(); showToast("Package added!"); }} />}
      {modal === "editSurgery" && editItem && <HMPSurgeryModal hospitalId={hospital._id} pkg={editItem} onClose={() => { setModal(null); setEditItem(null); }} onSaved={() => { setModal(null); setEditItem(null); loadData(); showToast("Package updated!"); }} />}

      {/* Backdrop + Panel */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed top-0 left-60 right-0 bottom-0 z-50 bg-gray-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-purple-800 px-6 py-4 flex-shrink-0 flex items-center gap-4 shadow-lg">
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold text-lg transition">←</button>
          <div className="flex-1 min-w-0">
            <p className="text-purple-300 text-xs font-medium uppercase tracking-wide">Admin · Hospital Management</p>
            <h2 className="text-white font-bold text-xl truncate">{hospital.name}</h2>
          </div>
          <button
            onClick={() => window.open(`/hospital-onboarding?from=admin`, "_blank")}
            className="text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3 py-1.5 rounded-lg transition">
            + Onboard Hospital
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="bg-white border-b border-gray-200 px-6 flex gap-1 flex-shrink-0">
          {TABS.map(({ key, label, icon, count }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-3.5 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${tab === key ? "border-purple-600 text-purple-700" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
              <span>{icon}</span> {label}
              {count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === key ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"}`}>{count}</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? <Spinner /> : (
            <>
              {/* ── DOCTORS ── */}
              {tab === "doctors" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-lg">🩺 Doctors ({doctors.length})</h3>
                    <button onClick={() => setModal("addDoctor")} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">+ Add Doctor</button>
                  </div>
                  {doctors.length === 0 ? <EmptyState icon="🩺" message="Koi doctor nahi hai. Add karein." /> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {doctors.map((d: any) => (
                        <div key={d._id} className={`bg-white rounded-2xl border p-4 shadow-sm ${!d.isActive ? "opacity-60 border-red-200" : "border-gray-100"}`}>
                          <div className="flex items-start gap-3 mb-3">
                            {d.photo ? <img src={d.photo} alt={d.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" /> : <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">{d.name?.[0]}</div>}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-800 text-sm truncate">{d.name}</p>
                              <p className="text-xs text-gray-500">{d.department}{d.speciality ? ` · ${d.speciality}` : ""}</p>
                              <p className="text-xs font-semibold text-teal-700 mt-0.5">₹{d.opdFee}/consult</p>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${d.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{d.isActive ? "Active" : "Hold"}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <button onClick={() => mutate("/api/hospital/doctors", "PATCH", { doctorId: d._id, isActive: !d.isActive })} disabled={toggling === d._id}
                              className={`flex-1 text-xs py-1.5 rounded-lg font-semibold transition ${d.isActive ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100" : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"} disabled:opacity-50`}>
                              {d.isActive ? "On Hold" : "Activate"}
                            </button>
                            <button onClick={() => { setEditItem(d); setModal("editDoctor"); }} className="flex-1 text-xs py-1.5 rounded-lg font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition">Edit</button>
                            <button onClick={async () => { if (!confirm("Remove karein?")) return; await mutate("/api/hospital/doctors", "DELETE", { doctorId: d._id }); showToast("Doctor removed"); }} disabled={deleting === d._id}
                              className="flex-1 text-xs py-1.5 rounded-lg font-semibold bg-gray-50 text-gray-500 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition disabled:opacity-50">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── LAB TESTS ── */}
              {tab === "labtests" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-lg">🧪 Lab Tests ({labTests.length})</h3>
                    <button onClick={() => setModal("addLab")} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">+ Add Lab Test</button>
                  </div>
                  {labTests.length === 0 ? <EmptyState icon="🧪" message="Koi lab test nahi hai. Add karein." /> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {labTests.map((t: any) => (
                        <div key={t._id} className={`bg-white rounded-2xl border p-4 shadow-sm ${!t.isActive ? "opacity-60 border-red-200" : "border-gray-100"}`}>
                          <div className="mb-3">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="font-bold text-gray-800 text-sm truncate flex-1">{t.name}</p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${t.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{t.isActive ? "Active" : "Hold"}</span>
                            </div>
                            <p className="text-xs text-gray-500">{t.category}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-400 line-through">₹{t.mrp}</span>
                              <span className="text-sm font-bold text-teal-700">₹{t.offerPrice}</span>
                              {t.homeCollection && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-200">Home ✓</span>}
                              {t.fastingRequired && <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-full border border-orange-200">Fasting</span>}
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <button onClick={() => mutate("/api/hospital/lab-tests", "PATCH", { testId: t._id, isActive: !t.isActive })}
                              className={`flex-1 text-xs py-1.5 rounded-lg font-semibold transition ${t.isActive ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100" : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"}`}>
                              {t.isActive ? "On Hold" : "Activate"}
                            </button>
                            <button onClick={() => { setEditItem(t); setModal("editLab"); }} className="flex-1 text-xs py-1.5 rounded-lg font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition">Edit</button>
                            <button onClick={async () => { if (!confirm("Remove karein?")) return; await mutate("/api/hospital/lab-tests", "DELETE", { testId: t._id }); showToast("Lab test removed"); }}
                              className="flex-1 text-xs py-1.5 rounded-lg font-semibold bg-gray-50 text-gray-500 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── SURGERY PACKAGES ── */}
              {tab === "packages" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-lg">🏥 Surgery Packages ({packages.length})</h3>
                    <button onClick={() => setModal("addSurgery")} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">+ Add Package</button>
                  </div>
                  {packages.length === 0 ? <EmptyState icon="🏥" message="Koi surgery package nahi hai. Add karein." /> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {packages.map((p: any) => (
                        <div key={p._id} className={`bg-white rounded-2xl border p-4 shadow-sm ${!p.isActive ? "opacity-60 border-red-200" : "border-gray-100"}`}>
                          <div className="mb-3">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="font-bold text-gray-800 text-sm truncate flex-1">{p.name}</p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${p.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{p.isActive ? "Active" : "Hold"}</span>
                            </div>
                            <p className="text-xs text-gray-500">{p.category}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-400 line-through">₹{p.mrp?.toLocaleString()}</span>
                              <span className="text-sm font-bold text-teal-700">₹{p.offerPrice?.toLocaleString()}</span>
                            </div>
                            {p.stayDays > 0 && <p className="text-xs text-gray-400 mt-0.5">{p.stayDays} day stay included</p>}
                          </div>
                          <div className="flex gap-1.5">
                            <button onClick={() => mutate("/api/hospital/surgery-packages", "PATCH", { packageId: p._id, isActive: !p.isActive })}
                              className={`flex-1 text-xs py-1.5 rounded-lg font-semibold transition ${p.isActive ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100" : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"}`}>
                              {p.isActive ? "On Hold" : "Activate"}
                            </button>
                            <button onClick={() => { setEditItem(p); setModal("editSurgery"); }} className="flex-1 text-xs py-1.5 rounded-lg font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition">Edit</button>
                            <button onClick={async () => { if (!confirm("Remove karein?")) return; await mutate("/api/hospital/surgery-packages", "DELETE", { packageId: p._id }); showToast("Package removed"); }}
                              className="flex-1 text-xs py-1.5 rounded-lg font-semibold bg-gray-50 text-gray-500 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── TAB: Hospitals ────────────────────────────────────────────────────────────
function HospitalsTab({ onRefreshStats, onManageHospital }: { onRefreshStats: () => void; onManageHospital: (h: { _id: string; name: string }) => void }) {
  const [subTab, setSubTab]         = useState<"pending" | "verified">("pending");
  const [hospitals, setHospitals]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [meta, setMeta]             = useState<any>({});
  const [detailId, setDetailId]     = useState<string | null>(null);
  const [verifying, setVerifying]   = useState<string | null>(null);
  const [showAdd, setShowAdd]       = useState(false);
  const [toast, setToast]           = useState("");

  const fetch_ = useCallback(async (pg = 1) => {
    setLoading(true);
    const p = new URLSearchParams({ verified: subTab === "verified" ? "true" : "false", page: pg.toString() });
    if (search) p.set("search", search);
    const res  = await fetch(`/api/admin/hospitals?${p}`);
    const data = await res.json();
    if (data.success) { setHospitals(data.hospitals); setMeta({ total: data.total, pages: data.pages }); }
    setLoading(false);
  }, [subTab, search]);

  useEffect(() => { fetch_(1); setPage(1); }, [subTab, search]);

  async function handleVerify(id: string, verified: boolean) {
    setVerifying(id);
    const res  = await fetch("/api/admin/hospitals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hospitalId: id, isVerified: verified, isActive: verified }) });
    const data = await res.json();
    if (data.success) { setToast(data.message); fetch_(page); onRefreshStats(); setDetailId(null); }
    setTimeout(() => setToast(""), 3000);
    setVerifying(null);
  }

  return (
    <div className="space-y-4">
      {toast && <div className="fixed top-4 right-4 z-50 bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg">{toast}</div>}
      {detailId && <HospitalDrawer hospitalId={detailId} onClose={() => setDetailId(null)} onVerify={handleVerify} />}
      {showAdd && <AddHospitalModal onClose={() => setShowAdd(false)} onSaved={() => { fetch_(1); onRefreshStats(); setToast("Hospital add ho gaya!"); setTimeout(() => setToast(""), 3000); }} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-800">🏥 Hospitals</h1>
        <div className="flex gap-2 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Hospital name / district / reg. no..." />
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
            <span className="text-base leading-none">+</span> Add Hospital
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2">
        {(["pending", "verified"] as const).map((t) => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${subTab === t ? "bg-teal-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-teal-400"}`}>
            {t === "pending" ? "⏳ Pending Verification" : "✅ Verified Hospitals"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <Spinner /> : hospitals.length === 0 ? <EmptyState icon="🏥" message={subTab === "pending" ? "Koi pending hospital nahi hai" : "Koi verified hospital nahi mila"} /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Hospital", "Type", "Location", "Contact", "Reg. No.", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {hospitals.map((h) => (
                    <tr key={h._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800">{h.name}</p>
                        {h.ownerName && <p className="text-xs text-gray-400">Owner: {h.ownerName}</p>}
                      </td>
                      <td className="px-4 py-3"><Badge color="bg-blue-50 text-blue-700 border-blue-100">{h.type || "—"}</Badge></td>
                      <td className="px-4 py-3 text-gray-600 text-xs">📍 {[h.address?.city, h.address?.district].filter(Boolean).join(", ") || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{h.mobile || h.email || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{h.registrationNo || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge color={h.isVerified ? "bg-green-100 text-green-700 border-green-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"}>{h.isVerified ? "✓ Verified" : "⏳ Pending"}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => setDetailId(h._id)} className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-lg font-semibold transition">👁 View</button>
                          {!h.isVerified && (
                            <button onClick={() => handleVerify(h._id, true)} disabled={verifying === h._id} className="text-xs bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded-lg font-semibold transition disabled:opacity-50">✓ Verify</button>
                          )}
                          {h.isVerified && (
                            <>
                              <button onClick={() => onManageHospital({ _id: h._id, name: h.name })} className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 rounded-lg font-semibold transition">🛠 Manage</button>
                              <button onClick={() => handleVerify(h._id, false)} disabled={verifying === h._id} className="text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2.5 py-1 rounded-lg font-semibold transition disabled:opacity-50">✗ Revoke</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-4">
              <Pagination page={page} pages={meta.pages ?? 1} total={meta.total ?? 0} onPage={(p) => { setPage(p); fetch_(p); }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── TAB: Doctors ──────────────────────────────────────────────────────────────
function DoctorsTab({ onRefreshStats }: { onRefreshStats: () => void }) {
  const [doctors, setDoctors]       = useState<any[]>([]);
  const [hospitals, setHospitals]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [showPending, setShowPending] = useState(false);
  const [page, setPage]             = useState(1);
  const [meta, setMeta]             = useState<any>({});
  const [updating, setUpdating]     = useState<string | null>(null);
  const [showAdd, setShowAdd]       = useState(false);
  const [toast, setToast]           = useState("");

  const fetch_ = useCallback(async (pg = 1) => {
    setLoading(true);
    const p = new URLSearchParams({ page: pg.toString() });
    if (search) p.set("search", search);
    if (showPending) p.set("pending", "true");
    const res  = await fetch(`/api/admin/doctors?${p}`);
    const data = await res.json();
    if (data.success) { setDoctors(data.doctors); setMeta({ total: data.total, pages: data.pages }); }
    setLoading(false);
  }, [search, showPending]);

  useEffect(() => { fetch_(1); setPage(1); }, [search, showPending]);

  // Load hospitals list once for the Add Doctor modal dropdown
  useEffect(() => {
    fetch("/api/admin/hospitals?verified=true&page=1").then((r) => r.json())
      .then((d) => { if (d.success) setHospitals(d.hospitals || []); });
  }, []);

  async function toggle(doctorId: string, field: string, value: boolean) {
    setUpdating(doctorId);
    const res  = await fetch("/api/admin/doctors", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doctorId, [field]: value }) });
    const data = await res.json();
    if (data.success) { setToast(data.message); fetch_(page); onRefreshStats(); }
    setTimeout(() => setToast(""), 3000);
    setUpdating(null);
  }

  return (
    <div className="space-y-4">
      {toast && <div className="fixed top-4 right-4 z-50 bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg">{toast}</div>}
      {showAdd && <AddDoctorModal hospitals={hospitals} onClose={() => setShowAdd(false)} onSaved={() => { fetch_(1); onRefreshStats(); setToast("Doctor add ho gaya!"); setTimeout(() => setToast(""), 3000); }} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-800">🩺 Doctors</h1>
        <div className="flex gap-2 flex-wrap items-center">
          <SearchBar value={search} onChange={setSearch} placeholder="Doctor name / mobile / department..." />
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <Toggle value={showPending} onChange={setShowPending} />
            Pending only
          </label>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
            <span className="text-base leading-none">+</span> Add Doctor
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <Spinner /> : doctors.length === 0 ? <EmptyState icon="🩺" message="Koi doctor nahi mila" /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Doctor", "Department", "Hospital", "OPD Fee", "Active", "Available", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {doctors.map((d) => (
                    <tr key={d._id} className={`hover:bg-gray-50 transition ${!d.isActive ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {d.photo ? <img src={d.photo} alt={d.name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" /> : <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold flex-shrink-0">{d.name?.[0]}</div>}
                          <div>
                            <p className="font-semibold text-gray-800">{d.name}</p>
                            {d.mobile && <p className="text-xs text-gray-400">📱 {d.mobile}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge color="bg-teal-50 text-teal-700 border-teal-100">{d.department}</Badge></td>
                      <td className="px-4 py-3 text-xs text-gray-600">{d.hospitalName || <span className="text-amber-500">No hospital</span>}</td>
                      <td className="px-4 py-3 font-semibold text-teal-700">₹{d.opdFee}</td>
                      <td className="px-4 py-3"><Toggle value={d.isActive} onChange={(v) => toggle(d._id, "isActive", v)} disabled={updating === d._id} /></td>
                      <td className="px-4 py-3"><Toggle value={d.isAvailable} onChange={(v) => toggle(d._id, "isAvailable", v)} disabled={updating === d._id} /></td>
                      <td className="px-4 py-3">
                        {!d.isActive && (
                          <button onClick={() => toggle(d._id, "isActive", true)} disabled={updating === d._id} className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-semibold transition disabled:opacity-50">✓ Approve</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-4">
              <Pagination page={page} pages={meta.pages ?? 1} total={meta.total ?? 0} onPage={(p) => { setPage(p); fetch_(p); }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── TAB: Surgery Packages ─────────────────────────────────────────────────────
function PackagesTab() {
  const [packages, setPackages]     = useState<any[]>([]);
  const [hospitals, setHospitals]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [hospital, setHospital]     = useState("");
  const [category, setCategory]     = useState("");
  const [page, setPage]             = useState(1);
  const [meta, setMeta]             = useState<any>({});
  const [updating, setUpdating]     = useState<string | null>(null);
  const [toast, setToast]           = useState("");
  const [confirmDel, setConfirmDel] = useState<any>(null);

  const fetch_ = useCallback(async (pg = 1) => {
    setLoading(true);
    const p = new URLSearchParams({ page: pg.toString() });
    if (search)   p.set("search", search);
    if (hospital) p.set("hospital", hospital);
    if (category) p.set("category", category);
    const res  = await fetch(`/api/admin/packages?${p}`);
    const data = await res.json();
    if (data.success) { setPackages(data.packages); setHospitals(data.hospitals || []); setMeta({ total: data.total, pages: data.pages }); }
    setLoading(false);
  }, [search, hospital, category]);

  useEffect(() => { fetch_(1); setPage(1); }, [search, hospital, category]);

  async function toggleActive(id: string, current: boolean) {
    setUpdating(id);
    const res  = await fetch("/api/admin/packages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ packageId: id, isActive: !current }) });
    const data = await res.json();
    if (data.success) { setToast(data.message); fetch_(page); }
    setTimeout(() => setToast(""), 3000);
    setUpdating(null);
  }

  async function deletePackage(id: string) {
    const res  = await fetch(`/api/admin/packages?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { setToast(data.message); fetch_(page); }
    setConfirmDel(null);
  }

  return (
    <div className="space-y-4">
      {toast && <div className="fixed top-4 right-4 z-50 bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg">{toast}</div>}

      {/* Confirm Delete Modal */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <p className="text-4xl text-center mb-3">🗑️</p>
            <h3 className="font-bold text-gray-800 text-center mb-2">Package Delete Karein?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">{confirmDel.name} permanently delete ho jayega.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={() => deletePackage(confirmDel._id)} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-800">📦 Surgery Packages</h1>
        <div className="flex gap-2 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Package name / hospital..." />
          <select value={hospital} onChange={(e) => setHospital(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400 bg-white">
            <option value="">All Hospitals</option>
            {hospitals.map((h: any) => <option key={h._id} value={h._id}>{h.name}</option>)}
          </select>
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category..." className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400 bg-white w-32" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <Spinner /> : packages.length === 0 ? <EmptyState icon="📦" message="Koi surgery package nahi mila" /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Package", "Hospital", "Category", "MRP", "Offer Price", "Member Price", "Stay", "Active", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {packages.map((pkg) => (
                    <tr key={pkg._id} className={`hover:bg-gray-50 transition ${!pkg.isActive ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800">{pkg.name}</p>
                        <p className="text-xs text-gray-400">{pkg.surgeonName}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{pkg.hospitalName || "—"}</td>
                      <td className="px-4 py-3"><Badge color="bg-purple-50 text-purple-700 border-purple-100">{pkg.category}</Badge></td>
                      <td className="px-4 py-3 text-xs text-gray-400 line-through">₹{pkg.mrp?.toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold text-teal-700">₹{pkg.offerPrice?.toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold text-green-700">{pkg.membershipPrice ? `₹${pkg.membershipPrice?.toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{pkg.stayDays} days</td>
                      <td className="px-4 py-3"><Toggle value={pkg.isActive} onChange={() => toggleActive(pkg._id, pkg.isActive)} disabled={updating === pkg._id} /></td>
                      <td className="px-4 py-3">
                        <button onClick={() => setConfirmDel(pkg)} className="text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2.5 py-1 rounded-lg font-semibold transition">🗑 Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-4">
              <Pagination page={page} pages={meta.pages ?? 1} total={meta.total ?? 0} onPage={(p) => { setPage(p); fetch_(p); }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── TAB: Lab Tests ────────────────────────────────────────────────────────────
function LabTestsTab() {
  const [labTests, setLabTests]     = useState<any[]>([]);
  const [hospitals, setHospitals]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [hospital, setHospital]     = useState("");
  const [category, setCategory]     = useState("");
  const [page, setPage]             = useState(1);
  const [meta, setMeta]             = useState<any>({});
  const [updating, setUpdating]     = useState<string | null>(null);
  const [toast, setToast]           = useState("");
  const [confirmDel, setConfirmDel] = useState<any>(null);

  const fetch_ = useCallback(async (pg = 1) => {
    setLoading(true);
    const p = new URLSearchParams({ page: pg.toString() });
    if (search)   p.set("search", search);
    if (hospital) p.set("hospital", hospital);
    if (category) p.set("category", category);
    const res  = await fetch(`/api/admin/labtests?${p}`);
    const data = await res.json();
    if (data.success) { setLabTests(data.labTests); setHospitals(data.hospitals || []); setMeta({ total: data.total, pages: data.pages }); }
    setLoading(false);
  }, [search, hospital, category]);

  useEffect(() => { fetch_(1); setPage(1); }, [search, hospital, category]);

  async function toggleActive(id: string, current: boolean) {
    setUpdating(id);
    const res  = await fetch("/api/admin/labtests", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ labTestId: id, isActive: !current }) });
    const data = await res.json();
    if (data.success) { setToast(data.message); fetch_(page); }
    setTimeout(() => setToast(""), 3000);
    setUpdating(null);
  }

  async function deleteTest(id: string) {
    const res  = await fetch(`/api/admin/labtests?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { setToast(data.message); fetch_(page); }
    setConfirmDel(null);
  }

  return (
    <div className="space-y-4">
      {toast && <div className="fixed top-4 right-4 z-50 bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg">{toast}</div>}

      {confirmDel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <p className="text-4xl text-center mb-3">🗑️</p>
            <h3 className="font-bold text-gray-800 text-center mb-2">Lab Test Delete Karein?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">{confirmDel.name} permanently delete ho jayega.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={() => deleteTest(confirmDel._id)} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-800">🧪 Lab Tests</h1>
        <div className="flex gap-2 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Test name / hospital..." />
          <select value={hospital} onChange={(e) => setHospital(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400 bg-white">
            <option value="">All Hospitals</option>
            {hospitals.map((h: any) => <option key={h._id} value={h._id}>{h.name}</option>)}
          </select>
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category..." className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400 bg-white w-32" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <Spinner /> : labTests.length === 0 ? <EmptyState icon="🧪" message="Koi lab test nahi mila" /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Test Name", "Hospital", "Category", "MRP", "Price", "Member Price", "Turnaround", "Home", "Active", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {labTests.map((t) => (
                    <tr key={t._id} className={`hover:bg-gray-50 transition ${!t.isActive ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800">{t.name}</p>
                        {t.fastingRequired && <span className="text-[10px] bg-orange-50 text-orange-600 border border-orange-100 px-1.5 py-0.5 rounded-full">Fasting</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{t.hospitalName || "—"}</td>
                      <td className="px-4 py-3"><Badge color="bg-yellow-50 text-yellow-700 border-yellow-100">{t.category}</Badge></td>
                      <td className="px-4 py-3 text-xs text-gray-400 line-through">₹{t.mrp?.toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold text-teal-700">₹{t.offerPrice?.toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold text-green-700">{t.membershipPrice ? `₹${t.membershipPrice?.toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{t.turnaroundTime || "—"}</td>
                      <td className="px-4 py-3 text-center">{t.homeCollection ? "🏠" : "—"}</td>
                      <td className="px-4 py-3"><Toggle value={t.isActive} onChange={() => toggleActive(t._id, t.isActive)} disabled={updating === t._id} /></td>
                      <td className="px-4 py-3">
                        <button onClick={() => setConfirmDel(t)} className="text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2.5 py-1 rounded-lg font-semibold transition">🗑 Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-4">
              <Pagination page={page} pages={meta.pages ?? 1} total={meta.total ?? 0} onPage={(p) => { setPage(p); fetch_(p); }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Shared form helpers ─────────────────────────────────────────────────────
function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  );
}
const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400 bg-white";
const selectCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400 bg-white";

// ── Modal: Add Doctor ─────────────────────────────────────────────────────────
function AddDoctorModal({ hospitals, onClose, onSaved }: { hospitals: any[]; onClose: () => void; onSaved: () => void }) {
  async function handleSubmit(payload: any) {
    const degreesForApi = (payload.degrees || []).map((d: any) => ({
      degree: d.degree, university: d.university, year: d.year ? Number(d.year) : null,
    }));
    const res  = await fetch("/api/admin/doctors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, degrees: degreesForApi }),
    });
    const data = await res.json();
    if (data.success) { onSaved(); onClose(); return { success: true }; }
    return { success: false, message: data.message };
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
            <div>
              <p className="text-xs text-blue-200 font-medium uppercase tracking-wide">Admin Panel</p>
              <h2 className="text-white font-bold text-lg">➕ Add New Doctor</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">✕</button>
          </div>
          <div className="p-6">
            <DoctorFullForm
              hospitals={hospitals}
              showHospitalSection={true}
              showPasswordSection={false}
              showStatusSection={true}
              initialData={{ isActive: true, isAvailable: true }}
              submitLabel="Add Doctor"
              onSubmit={handleSubmit}
              onCancel={onClose}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ── Modal: Add Hospital ───────────────────────────────────────────────────────
function AddHospitalModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: "", type: "", mobile: "", email: "", website: "", ownerName: "", spocName: "", spocContact: "", registrationNo: "", rohiniNo: "", district: "", city: "", pincode: "", departments: "", isVerified: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.SyntheticEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    const res  = await fetch("/api/admin/hospitals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (data.success) { onSaved(); onClose(); }
    else setError(data.message);
    setLoading(false);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-5 rounded-t-2xl flex items-center justify-between flex-shrink-0">
            <div><p className="text-xs text-teal-200 font-medium uppercase tracking-wide">Admin Panel</p><h2 className="text-white font-bold text-lg">Add New Hospital</h2></div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">✕</button>
          </div>
          <form onSubmit={submit} className="flex-1 overflow-y-auto p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Hospital Name" required><input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Brims City Hospital" required /></FormField>
              <FormField label="Type" required>
                <select className={selectCls} value={form.type} onChange={(e) => set("type", e.target.value)} required>
                  <option value="">— Select —</option>
                  <option>Single Specialist</option>
                  <option>Multi Specialist</option>
                  <option>Super Specialist</option>
                </select>
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Mobile" required><input className={inputCls} value={form.mobile} onChange={(e) => set("mobile", e.target.value.replace(/\D/g,""))} maxLength={10} placeholder="10-digit" required /></FormField>
              <FormField label="Email"><input className={inputCls} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="hospital@email.com" /></FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Owner Name"><input className={inputCls} value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} placeholder="Owner name" /></FormField>
              <FormField label="Website"><input className={inputCls} value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." /></FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="SPOC Name"><input className={inputCls} value={form.spocName} onChange={(e) => set("spocName", e.target.value)} placeholder="Contact person" /></FormField>
              <FormField label="SPOC Contact"><input className={inputCls} value={form.spocContact} onChange={(e) => set("spocContact", e.target.value)} placeholder="Mobile" /></FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Reg. No."><input className={inputCls} value={form.registrationNo} onChange={(e) => set("registrationNo", e.target.value)} placeholder="REG-12345" /></FormField>
              <FormField label="Rohini No."><input className={inputCls} value={form.rohiniNo} onChange={(e) => set("rohiniNo", e.target.value)} placeholder="ROHINI-..." /></FormField>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="District" required><input className={inputCls} value={form.district} onChange={(e) => set("district", e.target.value)} placeholder="Patna" required /></FormField>
              <FormField label="City"><input className={inputCls} value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="City" /></FormField>
              <FormField label="Pincode"><input className={inputCls} value={form.pincode} onChange={(e) => set("pincode", e.target.value.replace(/\D/g,""))} maxLength={6} placeholder="800001" /></FormField>
            </div>
            <FormField label="Departments (comma-separated)"><input className={inputCls} value={form.departments} onChange={(e) => set("departments", e.target.value)} placeholder="Cardiology, Ortho, Gynec" /></FormField>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={form.isVerified} onChange={(e) => set("isVerified", e.target.checked)} className="rounded" />
              Mark as Verified immediately
            </label>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 border border-red-100">{error}</p>}
          </form>
          <div className="p-5 border-t border-gray-100 flex gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
            <button onClick={submit} disabled={loading} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">{loading ? "Adding..." : "Add Hospital"}</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Staff Permissions Config ───────────────────────────────────────────────────
const STAFF_PERMISSIONS = [
  { key: "manageBookings",    label: "Bookings Manage Karein",      desc: "OPD/Lab/Surgery bookings dekhna aur status update",     icon: "📋", default: true  },
  { key: "collectPayments",   label: "Payments Collect Karein",     desc: "Counter payments accept karna",                         icon: "💰", default: true  },
  { key: "managePatients",    label: "Patient Details Dekhein",     desc: "Full patient profile, family info, health records",     icon: "👤", default: false },
  { key: "uploadLabReports",  label: "Lab Reports Upload Karein",   desc: "Lab test reports upload karna",                        icon: "🧪", default: false },
  { key: "cancelBookings",    label: "Bookings Cancel Karein",      desc: "Bookings cancel karna aur wallet refund dena",          icon: "❌", default: false },
  { key: "viewAnalytics",     label: "Analytics Dekhein",           desc: "Revenue reports aur booking analytics",                 icon: "📊", default: false },
  { key: "manageIPD",         label: "IPD Manage Karein",           desc: "IPD admission, discharge management",                   icon: "🏥", default: false },
  { key: "dispatchAmbulance", label: "Ambulance Dispatch Karein",   desc: "Ambulance requests manage karna aur ETA update",        icon: "🚑", default: false },
  { key: "manageHospitals",  label: "Hospital Manage Karein",      desc: "Assigned hospitals ka doctors/packages/labtests manage karna", icon: "🏨", default: false },
  { key: "onboardHospitals", label: "Hospital Onboard Karein",     desc: "Naya hospital onboard karna (hospital-onboarding form)",  icon: "🔧", default: false },
];

function defaultPermissions() {
  const p: Record<string, boolean> = {};
  STAFF_PERMISSIONS.forEach((item) => { p[item.key] = item.default; });
  return p;
}

// ── Modal: Add Staff ──────────────────────────────────────────────────────────
function AddStaffModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm]         = useState({ name: "", mobile: "", email: "", age: "", gender: "male" });
  const [permissions, setPerms] = useState<Record<string, boolean>>(defaultPermissions());
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const togglePerm = (key: string) => setPerms((p) => ({ ...p, [key]: !p[key] }));

  async function submit(e: React.SyntheticEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    const res  = await fetch("/api/admin/staff", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, age: Number(form.age) || 25, permissions }),
    });
    const data = await res.json();
    if (data.success) {
      setSuccess(data.message);
      setTimeout(() => { onSaved(); onClose(); }, 1500);
    } else {
      setError(data.message);
    }
    setLoading(false);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-4">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-5 rounded-t-2xl flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-200 font-medium uppercase tracking-wide">Admin Panel</p>
              <h2 className="text-white font-bold text-lg">Add Staff Member</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">✕</button>
          </div>
          <form onSubmit={submit} className="p-5 space-y-4">

            {/* Basic Info */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Basic Information</p>
              <FormField label="Full Name" required>
                <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Staff member ka naam" required />
              </FormField>
              <FormField label="Mobile Number" required>
                <div className="flex border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-teal-400">
                  <span className="bg-gray-50 text-gray-500 px-3 flex items-center text-sm border-r border-gray-200">+91</span>
                  <input className="flex-1 px-3 py-2.5 text-sm outline-none"
                    value={form.mobile} onChange={(e) => set("mobile", e.target.value.replace(/\D/g,""))}
                    maxLength={10} placeholder="10-digit number" required />
                </div>
              </FormField>
              <FormField label="Email (optional)">
                <input className={inputCls} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="staff@hospital.com" />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Age">
                  <input className={inputCls} type="number" min="18" max="70" value={form.age} onChange={(e) => set("age", e.target.value)} placeholder="25" />
                </FormField>
                <FormField label="Gender">
                  <select className={selectCls} value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </FormField>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 text-xs text-blue-700">
                🔑 Default password: <strong>{form.mobile || "mobile number"}</strong> — staff pehli login ke baad change kar sakte hain
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Access Permissions</p>
              <div className="space-y-2">
                {STAFF_PERMISSIONS.map((p) => (
                  <div key={p.key}
                    onClick={() => togglePerm(p.key)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      permissions[p.key]
                        ? "bg-teal-50 border-teal-200"
                        : "bg-gray-50 border-gray-200 opacity-60"
                    }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                      permissions[p.key] ? "bg-teal-100" : "bg-gray-200"
                    }`}>
                      {p.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{p.label}</p>
                      <p className="text-xs text-gray-400 truncate">{p.desc}</p>
                    </div>
                    <div className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                      permissions[p.key] ? "bg-teal-500" : "bg-gray-300"
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-transform ${
                        permissions[p.key] ? "translate-x-4" : "translate-x-0.5"
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error   && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 border border-red-100">{error}</p>}
            {success && <p className="text-sm text-green-600 bg-green-50 rounded-xl px-3 py-2 border border-green-100">{success}</p>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                {loading ? "Adding..." : "Add Staff Member"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ── TAB: Staff ────────────────────────────────────────────────────────────────
function StaffAccountingView() {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange]     = useState("today");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res  = await fetch(`/api/admin/staff-accounting?range=${range}`);
      const json = await res.json();
      if (json.success) setData(json);
      setLoading(false);
    })();
  }, [range]);

  const fmt  = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const fmtT = (d: string) => d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
  const TYPE_COLORS: Record<string, string> = { OPD: "bg-blue-100 text-blue-700", Lab: "bg-yellow-100 text-yellow-700", Surgery: "bg-purple-100 text-purple-700", IPD: "bg-teal-100 text-teal-700", Consultation: "bg-indigo-100 text-indigo-700" };

  const maxAmt = data?.perStaff?.length ? Math.max(...data.perStaff.map((s: any) => s.totalAmount)) : 1;

  return (
    <div className="space-y-4">
      {/* Header + Range Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">💰 Staff-wise Collections</h2>
          <p className="text-xs text-gray-400 mt-0.5">Har staff member ne kitna collect kiya</p>
        </div>
        <div className="flex gap-1.5">
          {[["today","Today"],["week","This Week"],["month","This Month"],["all","All Time"]].map(([v,l]) => (
            <button key={v} onClick={() => setRange(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${range === v ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Spinner /> : !data ? <EmptyState icon="📊" message="Data load nahi hua" /> : (
        <>
          {/* Overall Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-4 text-white">
              <p className="text-xs font-semibold opacity-80 uppercase tracking-wide mb-1">Total Collected</p>
              <p className="text-2xl font-bold">{fmt(data.overall.total)}</p>
              <p className="text-xs opacity-70 mt-0.5">{data.overall.count} bookings</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Active Staff</p>
              <p className="text-2xl font-bold text-gray-800">{data.perStaff.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">collected today</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Avg per Staff</p>
              <p className="text-2xl font-bold text-gray-800">{data.perStaff.length ? fmt(Math.round(data.overall.total / data.perStaff.length)) : "₹0"}</p>
              <p className="text-xs text-gray-400 mt-0.5">this period</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Top Collector</p>
              <p className="text-base font-bold text-gray-800 truncate">{data.perStaff[0]?.staffName || "—"}</p>
              <p className="text-xs text-purple-600 font-semibold mt-0.5">{data.perStaff[0] ? fmt(data.perStaff[0].totalAmount) : "₹0"}</p>
            </div>
          </div>

          {/* Per-Staff Cards */}
          {data.perStaff.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <EmptyState icon="👔" message="Is period mein kisi ne collection nahi ki" />
            </div>
          ) : (
            <div className="space-y-3">
              {data.perStaff.map((s: any) => {
                const pct = maxAmt > 0 ? Math.round((s.totalAmount / maxAmt) * 100) : 0;
                const isOpen = expanded === s._id;
                return (
                  <div key={s._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-base flex-shrink-0">
                            {(s.staffName || "S")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-800">{s.staffName || "Unknown Staff"}</p>
                            <p className="text-xs text-gray-400">{s.totalBookings} transactions · Last: {fmtT(s.lastCollected)}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-purple-700">{fmt(s.totalAmount)}</p>
                          <button onClick={() => setExpanded(isOpen ? null : s._id)}
                            className="text-xs text-gray-400 hover:text-purple-600 transition mt-0.5">
                            {isOpen ? "▲ Hide" : "▼ Details"}
                          </button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                        <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }} />
                      </div>

                      {/* Type breakdown pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(s.typeCounts || {}).map(([type, cnt]) => (
                          <span key={type} className={`text-xs px-2 py-0.5 rounded-full font-semibold ${TYPE_COLORS[type] || "bg-gray-100 text-gray-600"}`}>
                            {type}: {cnt as number}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Expanded: Hourly breakdown for this staff */}
                    {isOpen && (
                      <div className="border-t border-gray-100 bg-gray-50 p-4">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Today&apos;s Hourly Collection</p>
                        <div className="flex items-end gap-1 h-16">
                          {data.hourly.map((h: any) => {
                            const barH = h.total > 0 ? Math.max(8, Math.round((h.total / Math.max(...data.hourly.map((x: any) => x.total), 1)) * 56)) : 4;
                            return (
                              <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full bg-purple-400 rounded-t" style={{ height: `${barH}px` }} title={`${h.hour}:00 — ${fmt(h.total)}`} />
                                <span className="text-[9px] text-gray-400">{h.hour}</span>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 text-center">Hours 8am–8pm (overall, not staff-specific)</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Hourly Chart (Overall) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-bold text-gray-700 mb-4">Today&apos;s Hourly Collection (All Staff)</p>
            <div className="flex items-end gap-1.5 h-20">
              {data.hourly.map((h: any) => {
                const maxH = Math.max(...data.hourly.map((x: any) => x.total), 1);
                const barH = h.total > 0 ? Math.max(6, Math.round((h.total / maxH) * 72)) : 4;
                return (
                  <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-gray-400">{h.total > 0 ? `₹${Math.round(h.total/1000)}k` : ""}</span>
                    <div className={`w-full rounded-t transition-all ${h.total > 0 ? "bg-purple-500" : "bg-gray-100"}`} style={{ height: `${barH}px` }} />
                    <span className="text-[9px] text-gray-400">{h.hour}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Edit Permissions Modal ────────────────────────────────────────────────────
function EditPermissionsModal({ staff, onClose, onSaved }: { staff: any; onClose: () => void; onSaved: () => void }) {
  const [perms,   setPerms]   = useState<Record<string, any>>(() => ({
    ...defaultPermissions(),
    ...(staff.staffPermissions || {}),
  }));
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [assignedIds, setAssignedIds] = useState<string[]>(() => {
    const ids = staff.staffPermissions?.assignedHospitalIds || [];
    return ids.map((id: any) => (typeof id === "object" ? id._id || id.toString() : id.toString()));
  });

  useEffect(() => {
    fetch("/api/admin/hospitals?verified=true&page=1&limit=100")
      .then((r) => r.json())
      .then((d) => { if (d.success) setHospitals(d.hospitals || []); });
  }, []);

  const togglePerm = (key: string) => setPerms((p) => ({ ...p, [key]: !p[key] }));

  const toggleHospital = (id: string) => {
    setAssignedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  async function save() {
    setSaving(true); setError("");
    const res  = await fetch("/api/admin/staff", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: staff._id, permissions: { ...perms, assignedHospitalIds: assignedIds } }),
    });
    const data = await res.json();
    if (data.success) { setSuccess("Permissions save ho gayi!"); setTimeout(() => { onSaved(); onClose(); }, 1200); }
    else setError(data.message);
    setSaving(false);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl my-4">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-5 rounded-t-2xl flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-200 font-medium">Staff Permissions</p>
              <h2 className="text-white font-bold text-lg">{staff.name}</h2>
              <p className="text-orange-200 text-xs">📱 {staff.mobile}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white">✕</button>
          </div>
          <div className="p-5 space-y-3">
            <p className="text-xs text-gray-500">Toggle ON/OFF karne se is staff ko access milega/hatega</p>
            {STAFF_PERMISSIONS.map((p) => (
              <div key={p.key}>
                <div
                  onClick={() => togglePerm(p.key)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    perms[p.key] ? "bg-teal-50 border-teal-200" : "bg-gray-50 border-gray-200 opacity-60"
                  }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${perms[p.key] ? "bg-teal-100" : "bg-gray-200"}`}>
                    {p.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{p.label}</p>
                    <p className="text-xs text-gray-400 truncate">{p.desc}</p>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 ${perms[p.key] ? "bg-teal-500" : "bg-gray-300"}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-transform ${perms[p.key] ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                </div>
                {/* Hospital assignment — shown when manageHospitals is ON */}
                {p.key === "manageHospitals" && perms[p.key] && hospitals.length > 0 && (
                  <div className="mt-2 ml-3 border-l-2 border-purple-200 pl-3">
                    <p className="text-xs font-semibold text-purple-700 mb-2">Kaunse hospitals assign karein?</p>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {hospitals.map((h: any) => {
                        const checked = assignedIds.includes(h._id);
                        return (
                          <label key={h._id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition ${checked ? "bg-purple-50 border-purple-200" : "bg-gray-50 border-gray-100"}`}>
                            <input type="checkbox" checked={checked} onChange={() => toggleHospital(h._id)}
                              className="accent-purple-600 w-4 h-4 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-800 truncate">{h.name}</p>
                              <p className="text-xs text-gray-400">{h.address?.district || ""} · {h.hospitalId || ""}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{assignedIds.length} hospital(s) selected</p>
                  </div>
                )}
              </div>
            ))}
            {error   && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
            {success && <p className="text-sm text-green-600 bg-green-50 rounded-xl px-3 py-2">{success}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                {saving ? "Saving..." : "Save Permissions"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StaffTab() {
  const [subTab, setSubTab]           = useState<"members" | "accounting">("members");
  const [staff, setStaff]             = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [page, setPage]               = useState(1);
  const [meta, setMeta]               = useState<any>({});
  const [toggling, setToggling]       = useState<string | null>(null);
  const [showAdd, setShowAdd]         = useState(false);
  const [editPermsFor, setEditPermsFor] = useState<any | null>(null);
  const [toast, setToast]             = useState("");

  const fetch_ = useCallback(async (pg = 1) => {
    setLoading(true);
    const p = new URLSearchParams({ page: pg.toString() });
    if (search) p.set("search", search);
    const res  = await fetch(`/api/admin/staff?${p}`);
    const data = await res.json();
    if (data.success) { setStaff(data.staff); setMeta({ total: data.total, pages: data.pages }); }
    setLoading(false);
  }, [search]);

  useEffect(() => { if (subTab === "members") { fetch_(1); setPage(1); } }, [search, subTab]);

  async function toggleActive(userId: string, current: boolean) {
    setToggling(userId);
    const res  = await fetch("/api/admin/staff", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, isActive: !current }) });
    const data = await res.json();
    if (data.success) { showToast(data.message); fetch_(page); }
    setToggling(null);
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <div className="space-y-4">
      {toast && <div className="fixed top-4 right-4 z-50 bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg">{toast}</div>}
      {showAdd && <AddStaffModal onClose={() => setShowAdd(false)} onSaved={() => { fetch_(1); showToast("Staff member add ho gaya!"); }} />}
      {editPermsFor && <EditPermissionsModal staff={editPermsFor} onClose={() => setEditPermsFor(null)} onSaved={() => { fetch_(page); showToast("Permissions update ho gayi!"); }} />}

      {/* Sub-tab switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setSubTab("members")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${subTab === "members" ? "bg-white shadow text-orange-600" : "text-gray-500 hover:text-gray-700"}`}>
            👔 Staff Members
          </button>
          <button onClick={() => setSubTab("accounting")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${subTab === "accounting" ? "bg-white shadow text-orange-600" : "text-gray-500 hover:text-gray-700"}`}>
            💰 Accounting
          </button>
        </div>
        {subTab === "members" && (
          <div className="flex gap-2 flex-wrap">
            <SearchBar value={search} onChange={setSearch} placeholder="Name / Mobile..." />
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
              <span className="text-base leading-none">+</span> Add Staff
            </button>
          </div>
        )}
      </div>

      {subTab === "accounting" ? <StaffAccountingView /> : (
        loading ? <Spinner /> : staff.length === 0 ? <EmptyState icon="👔" message="Koi staff member nahi mila" /> : (
          <div className="space-y-3">
            {staff.map((s) => {
              const perms = s.staffPermissions || {};
              const activePerms = STAFF_PERMISSIONS.filter((p) => perms[p.key]);
              return (
                <div key={s._id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 ${!s.isActive ? "opacity-60" : ""}`}>
                  <div className="flex items-start gap-3">
                    {s.photo
                      ? <img src={s.photo} alt={s.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                      : <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-lg flex-shrink-0">{s.name?.[0]}</div>
                    }
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-800">{s.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {s.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">📱 {s.mobile}{s.email ? ` · ${s.email}` : ""}</p>
                      <p className="text-xs text-gray-400">Joined: {fmtDate(s.createdAt)}</p>
                      {/* Permission badges */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {activePerms.length === 0 ? (
                          <span className="text-xs text-gray-400">No permissions set</span>
                        ) : (
                          activePerms.map((p) => (
                            <span key={p.key} className="text-xs bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-full">
                              {p.icon} {p.label}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => setEditPermsFor(s)}
                        className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-xl hover:bg-orange-100 transition font-medium">
                        🔑 Permissions
                      </button>
                      <Toggle value={s.isActive} onChange={() => toggleActive(s._id, s.isActive)} disabled={toggling === s._id} />
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="bg-white rounded-2xl border border-gray-100 p-3">
              <Pagination page={page} pages={meta.pages ?? 1} total={meta.total ?? 0} onPage={(p) => { setPage(p); fetch_(p); }} />
            </div>
          </div>
        )
      )}
    </div>
  );
}

// ── TAB: Bookings ─────────────────────────────────────────────────────────────
function BookingsTab({ onOpenPatient }: { onOpenPatient: (id: string) => void }) {
  const [bookings, setBookings]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filterType, setFilterType]     = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage]             = useState(1);
  const [meta, setMeta]             = useState<any>({});
  const [updating, setUpdating]     = useState<string | null>(null);
  const [toast, setToast]           = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetch_ = useCallback(async (pg = 1) => {
    setLoading(true);
    const p = new URLSearchParams({ page: pg.toString() });
    if (filterType)   p.set("type", filterType);
    if (filterStatus) p.set("status", filterStatus);
    const res  = await fetch(`/api/admin?${p}`);
    const data = await res.json();
    if (data.success) { setBookings(data.bookings); setMeta(data.pagination); }
    setLoading(false);
  }, [filterType, filterStatus]);

  useEffect(() => { fetch_(1); setPage(1); }, [filterType, filterStatus]);

  async function updateBooking(bookingId: string, status?: string, paymentStatus?: string) {
    setUpdating(bookingId);
    const res  = await fetch("/api/admin", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId, status, paymentStatus }) });
    const data = await res.json();
    setToast(data.success ? `✅ Updated` : "❌ Error");
    if (data.success) fetch_(page);
    setTimeout(() => setToast(""), 3000);
    setUpdating(null);
  }

  async function updateStage(bookingId: string, stage: string, label: string, notes: string) {
    const name = localStorage.getItem("adminName") || "Admin";
    const res  = await fetch("/api/admin", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId, statusStage: stage, stageLabel: label, stageNotes: notes, updatedByName: name }) });
    const data = await res.json();
    setToast(data.success ? `✅ Stage: ${label}` : "❌ " + data.message);
    if (data.success) fetch_(page);
    setTimeout(() => setToast(""), 3000);
  }

  async function rescheduleBooking(bookingId: string, newDate: string, newSlot: string, reason: string) {
    const name = localStorage.getItem("adminName") || "Admin";
    const res  = await fetch("/api/admin", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId, reschedule: true, newDate, newSlot, stageNotes: reason, updatedByName: name }) });
    const data = await res.json();
    setToast(data.success ? "📅 Booking rescheduled" : "❌ " + data.message);
    if (data.success) fetch_(page);
    setTimeout(() => setToast(""), 3000);
  }

  const parseNotes = (notes: string) => { try { return notes ? JSON.parse(notes) : {}; } catch { return {}; } };
  const pmLabel: Record<string, string> = { counter: "Counter", online: "Online", wallet: "Wallet", insurance: "Insurance" };
  const fmtDate = (d: string) => d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
  const getTitle = (b: any) => b.type === "OPD" ? (b.doctorId?.name ? `Dr. ${b.doctorId.name}` : "OPD Booking") : b.type === "Surgery" ? (b.packageName ?? "Surgery Package") : (b.testName ?? "Lab Test");

  return (
    <div className="space-y-4">
      {toast && <div className="fixed top-4 right-4 z-50 bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg">{toast}</div>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-800">📋 Bookings</h1>
        <div className="flex gap-2 flex-wrap">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400 bg-white">
            <option value="">All Types</option>
            <option value="OPD">🩺 OPD</option>
            <option value="Surgery">🏥 Surgery</option>
            <option value="Lab">🧪 Lab</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400 bg-white">
            <option value="">All Status</option>
            <option value="pending">⏳ Pending</option>
            <option value="confirmed">✅ Confirmed</option>
            <option value="completed">🏁 Completed</option>
            <option value="cancelled">❌ Cancelled</option>
          </select>
          <button onClick={() => fetch_(page)} className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-teal-700 transition">🔄 Refresh</button>
        </div>
      </div>

      {loading ? <div className="bg-white rounded-2xl border border-gray-100 shadow-sm"><Spinner /></div> : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm"><EmptyState icon="📭" message="Koi booking nahi mili" /></div>
      ) : (
        <>
          <div className="space-y-3">
            {bookings.map((b) => {
              const sc    = STATUS_CONFIG[b.status] ?? { label: b.status, color: "bg-gray-100 text-gray-600 border-gray-200" };
              const notes = parseNotes(b.notes);
              const gender = notes.patientGender === "male" ? "Male" : notes.patientGender === "female" ? "Female" : notes.patientGender || "";
              const pMode  = pmLabel[notes.paymentMode] || notes.paymentMode || "—";

              return (
                <div key={b._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className={`h-1 w-full ${b.type === "OPD" ? "bg-blue-400" : b.type === "Lab" ? "bg-yellow-400" : b.type === "Surgery" ? "bg-purple-400" : "bg-teal-400"}`} />
                  <div className="p-4">
                    {/* Row 1 */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${b.type === "OPD" ? "bg-blue-50" : b.type === "Lab" ? "bg-yellow-50" : "bg-purple-50"}`}>{TYPE_ICON[b.type] ?? "📄"}</div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 text-sm truncate">{getTitle(b)}</p>
                          {b.userId?.name && <p className="text-xs text-gray-400 truncate">Booked by: {b.userId.name}</p>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <Badge color={sc.color}>{sc.label}</Badge>
                        {b.paymentStatus === "paid" && <Badge color="bg-emerald-100 text-emerald-700 border-emerald-200">Paid ✓</Badge>}
                      </div>
                    </div>

                    {/* 3-col info grid */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="bg-blue-50 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide mb-1.5">Patient</p>
                        <p className="font-bold text-gray-800 text-sm leading-tight">{notes.patientName || b.userId?.name || "—"}</p>
                        {notes.patientMobile && <p className="text-xs text-gray-600 mt-0.5">📱 {notes.patientMobile}</p>}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {notes.patientAge && <span className="text-[10px] bg-white text-gray-600 px-1.5 py-0.5 rounded-full border border-blue-100">{notes.patientAge} yrs</span>}
                          {gender && <span className="text-[10px] bg-white text-gray-600 px-1.5 py-0.5 rounded-full border border-blue-100">{gender}</span>}
                          {notes.isNewPatient && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-semibold">New</span>}
                        </div>
                      </div>
                      <div className="bg-teal-50 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-teal-500 uppercase tracking-wide mb-1.5">Appointment</p>
                        {b.appointmentDate ? (
                          <>
                            <p className="font-semibold text-gray-800 text-xs">{new Date(b.appointmentDate).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</p>
                            {b.slot && <p className="text-xs text-teal-700 mt-0.5 font-medium">🕐 {b.slot}</p>}
                          </>
                        ) : <p className="text-xs text-gray-400">Date TBD</p>}
                        {b.userId?.memberId && <p className="text-[10px] text-gray-400 mt-1.5 font-mono">{b.userId.memberId}</p>}
                      </div>
                      <div className="bg-amber-50 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wide mb-1.5">Payment</p>
                        {b.amount > 0 ? <p className="font-bold text-gray-800 text-base leading-tight">₹{b.amount.toLocaleString()}</p> : <p className="text-xs text-gray-400">—</p>}
                        <p className="text-[10px] text-gray-500 mt-0.5">{pMode}</p>
                        <p className={`text-[10px] mt-1 font-semibold ${b.paymentStatus === "paid" ? "text-emerald-600" : "text-amber-600"}`}>{b.paymentStatus === "paid" ? "✓ Paid" : "● Pending"}</p>
                      </div>
                    </div>

                    {notes.symptoms && (
                      <div className="bg-gray-50 rounded-xl px-3 py-2 mb-3 border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Symptoms: </span>
                        <span className="text-xs text-gray-700">{notes.symptoms}</span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">{b.bookingId}</span>
                        <span className="text-[10px] text-gray-400">{fmtDate(b.createdAt)}</span>
                        {b.userId?._id && (
                          <button onClick={() => onOpenPatient(b.userId._id)} className="text-[10px] bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-md font-semibold transition">👁 Patient</button>
                        )}
                        <button onClick={() => setExpandedId(expandedId === b._id ? null : b._id)}
                          className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md font-semibold transition">
                          {expandedId === b._id ? "▲ Hide Stages" : "▼ Manage Stages"}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {b.status === "pending" && <button onClick={() => updateBooking(b.bookingId, "confirmed")} disabled={updating === b.bookingId} className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50 transition">✓ Confirm</button>}
                        {(b.status === "pending" || b.status === "confirmed") && <button onClick={() => updateBooking(b.bookingId, "completed", "paid")} disabled={updating === b.bookingId} className="text-xs bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50 transition">✓ Complete</button>}
                        {b.status !== "cancelled" && b.status !== "completed" && <button onClick={() => updateBooking(b.bookingId, "cancelled")} disabled={updating === b.bookingId} className="text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50 transition">✗ Cancel</button>}
                        {b.paymentStatus !== "paid" && b.status !== "cancelled" && <button onClick={() => updateBooking(b.bookingId, undefined, "paid")} disabled={updating === b.bookingId} className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50 transition">💰 Mark Paid</button>}
                      </div>
                    </div>

                    {/* Stage Timeline (expanded) */}
                    {expandedId === b._id && (
                      <div className="mt-4 pt-4 border-t border-purple-100 bg-purple-50 rounded-xl p-4">
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
                </div>
              );
            })}
          </div>
          <Pagination page={page} pages={meta.pages ?? 1} total={meta.total ?? 0} onPage={(p) => { setPage(p); fetch_(p); }} />
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── PROMO CODES TAB ───────────────────────────────────────────────────────────
const BOOKING_TYPES = ["OPD","Lab","Surgery","Consultation"];

function PromoCodesTab() {
  const [promos, setPromos]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const emptyForm = {
    code: "", description: "", discountType: "flat", discountValue: "",
    maxDiscount: "", minAmount: "", usageLimit: "", validFrom: "", validUntil: "",
    applicableOn: ["OPD","Lab","Surgery","Consultation"], isActive: true,
  };
  const [form, setForm] = useState<any>(emptyForm);

  useEffect(() => { fetchPromos(); }, []);

  async function fetchPromos() {
    setLoading(true);
    try {
      const res  = await fetch("/api/promo");
      const data = await res.json();
      if (data.success) setPromos(data.promos);
    } catch {}
    setLoading(false);
  }

  function openCreate() { setForm(emptyForm); setEditItem(null); setShowForm(true); }
  function openEdit(p: any) {
    setForm({
      _id: p._id, code: p.code, description: p.description || "",
      discountType: p.discountType, discountValue: String(p.discountValue),
      maxDiscount: p.maxDiscount ? String(p.maxDiscount) : "",
      minAmount: p.minAmount ? String(p.minAmount) : "",
      usageLimit: p.usageLimit ? String(p.usageLimit) : "",
      validFrom: p.validFrom ? p.validFrom.split("T")[0] : "",
      validUntil: p.validUntil ? p.validUntil.split("T")[0] : "",
      applicableOn: p.applicableOn || ["OPD","Lab","Surgery","Consultation"],
      isActive: p.isActive,
    });
    setEditItem(p);
    setShowForm(true);
  }

  function toggleType(t: string) {
    setForm((prev: any) => ({
      ...prev,
      applicableOn: prev.applicableOn.includes(t)
        ? prev.applicableOn.filter((x: string) => x !== t)
        : [...prev.applicableOn, t],
    }));
  }

  async function handleSave() {
    if (!form.code || !form.discountType || !form.discountValue) {
      setToast("❌ Code, type aur value zaruri hain"); setTimeout(() => setToast(""), 3000); return;
    }
    setSaving(true);
    try {
      const res  = await fetch("/api/promo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setToast("✅ " + data.message);
        setShowForm(false);
        fetchPromos();
      } else { setToast("❌ " + data.message); }
    } catch { setToast("❌ Network error"); }
    setSaving(false);
    setTimeout(() => setToast(""), 3000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Yeh code delete karein?")) return;
    try {
      const res  = await fetch(`/api/promo?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { setToast("✅ Deleted"); fetchPromos(); }
      else setToast("❌ " + data.message);
    } catch { setToast("❌ Network error"); }
    setTimeout(() => setToast(""), 3000);
  }

  async function toggleActive(p: any) {
    try {
      const res  = await fetch("/api/promo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...p, isActive: !p.isActive }),
      });
      const data = await res.json();
      if (data.success) fetchPromos();
    } catch {}
  }

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg">{toast}</div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">🎟️ Promo Codes</h2>
          <p className="text-sm text-gray-500 mt-0.5">Discount codes banao — bookings pe apply honge</p>
        </div>
        <button onClick={openCreate}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition">
          + New Promo Code
        </button>
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowForm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">{editItem ? "Code Edit Karein" : "Naya Promo Code"}</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Code *</label>
                    <input value={form.code} onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})}
                      placeholder="e.g. BRIMS50" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 font-mono uppercase" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Discount Type *</label>
                    <select value={form.discountType} onChange={(e) => setForm({...form, discountType: e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                      <option value="flat">Flat (₹)</option>
                      <option value="percent">Percent (%)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">
                      {form.discountType === "flat" ? "Discount Amount (₹) *" : "Discount % *"}
                    </label>
                    <input type="number" value={form.discountValue} onChange={(e) => setForm({...form, discountValue: e.target.value})}
                      placeholder={form.discountType === "flat" ? "100" : "10"}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                  </div>
                  {form.discountType === "percent" && (
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Max Discount (₹)</label>
                      <input type="number" value={form.maxDiscount} onChange={(e) => setForm({...form, maxDiscount: e.target.value})}
                        placeholder="Optional cap" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Min Amount (₹)</label>
                    <input type="number" value={form.minAmount} onChange={(e) => setForm({...form, minAmount: e.target.value})}
                      placeholder="0 = no minimum" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
                  <input value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}
                    placeholder="e.g. New year offer - ₹50 off on OPD"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Usage Limit</label>
                    <input type="number" value={form.usageLimit} onChange={(e) => setForm({...form, usageLimit: e.target.value})}
                      placeholder="Blank = unlimited" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Valid Until</label>
                    <input type="date" value={form.validUntil} onChange={(e) => setForm({...form, validUntil: e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-2 block">Applicable On</label>
                  <div className="flex flex-wrap gap-2">
                    {BOOKING_TYPES.map((t) => (
                      <button key={t} type="button" onClick={() => toggleType(t)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                          form.applicableOn.includes(t) ? "bg-teal-600 text-white border-teal-600" : "border-gray-200 text-gray-500 hover:border-teal-400"
                        }`}>{t}</button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">Active</label>
                  <Toggle value={form.isActive} onChange={(v) => setForm({...form, isActive: v})} />
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold">Rद karo</button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                    {saving ? "Save ho raha hai..." : editItem ? "Update Karein" : "Create Karein"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Promo List */}
      {loading ? <Spinner /> : promos.length === 0 ? (
        <EmptyState icon="🎟️" message="Koi promo code nahi hai. Pehla code banao!" />
      ) : (
        <div className="space-y-3">
          {promos.map((p) => {
            const expired = p.validUntil && new Date() > new Date(p.validUntil);
            const limitHit = p.usageLimit && p.usedCount >= p.usageLimit;
            return (
              <div key={p._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-teal-700 text-lg tracking-widest">{p.code}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                        !p.isActive || expired || limitHit
                          ? "bg-red-100 text-red-600 border-red-200"
                          : "bg-green-100 text-green-700 border-green-200"
                      }`}>
                        {!p.isActive ? "Inactive" : expired ? "Expired" : limitHit ? "Limit Hit" : "Active"}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                        {p.discountType === "flat" ? `₹${p.discountValue} off` : `${p.discountValue}% off${p.maxDiscount ? ` (max ₹${p.maxDiscount})` : ""}`}
                      </span>
                    </div>
                    {p.description && <p className="text-xs text-gray-500 mb-2">{p.description}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                      <span>Used: <strong className="text-gray-600">{p.usedCount}</strong>{p.usageLimit ? `/${p.usageLimit}` : ""}</span>
                      {p.minAmount > 0 && <span>Min: ₹{p.minAmount}</span>}
                      {p.validUntil && <span>Expires: {new Date(p.validUntil).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}</span>}
                      <span>For: {(p.applicableOn || []).join(", ")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Toggle value={p.isActive} onChange={() => toggleActive(p)} />
                    <button onClick={() => openEdit(p)} className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 border border-blue-200 rounded-lg hover:bg-blue-50 transition">Edit</button>
                    <button onClick={() => handleDelete(p._id)} className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 border border-red-200 rounded-lg hover:bg-red-50 transition">Del</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── REVENUE REPORTS TAB ───────────────────────────────────────────────────────
const MONTHS_LIST = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const TYPE_COLORS_MAP: Record<string, string> = {
  OPD: "bg-blue-500", Lab: "bg-yellow-500", Surgery: "bg-purple-500", Consultation: "bg-indigo-500",
};

function fmtINR(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n}`;
}

function RevenueReportsTab() {
  const curYear  = new Date().getFullYear();
  const curMonth = new Date().getMonth() + 1;

  const [period,   setPeriod]   = useState<"monthly"|"weekly"|"daily">("monthly");
  const [year,     setYear]     = useState(curYear);
  const [month,    setMonth]    = useState(curMonth);
  const [data,     setData]     = useState<any>(null);
  const [loading,  setLoading]  = useState(false);
  const [exporting,setExporting]= useState(false);
  const [metric,   setMetric]   = useState<"revenue"|"bookings">("revenue");

  useEffect(() => { fetchReport(); }, [period, year, month]);

  async function fetchReport() {
    setLoading(true);
    try {
      const p = new URLSearchParams({ period, year: String(year), month: String(month) });
      const res  = await fetch(`/api/admin/reports?${p}`);
      const json = await res.json();
      if (json.success) setData(json);
    } catch {}
    setLoading(false);
  }

  async function downloadCSV() {
    setExporting(true);
    try {
      const p = new URLSearchParams({ period, year: String(year), month: String(month), export: "csv" });
      const res  = await fetch(`/api/admin/reports?${p}`);
      const blob = await res.blob();
      const cd   = res.headers.get("Content-Disposition") || "";
      const match = cd.match(/filename="(.+)"/);
      const fname = match ? match[1] : "report.csv";
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement("a");
      a.href = url; a.download = fname; a.click();
      URL.revokeObjectURL(url);
    } catch {}
    setExporting(false);
  }

  const rows   = data?.rows || [];
  const summary= data?.summary || {};
  const maxVal = rows.length
    ? Math.max(...rows.map((r: any) => metric === "revenue" ? r.revenue : r.total), 1)
    : 1;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">📈 Revenue Reports</h2>
          <p className="text-sm text-gray-500 mt-0.5">Bookings aur earnings ka breakdown</p>
        </div>
        <button onClick={downloadCSV} disabled={exporting || !data}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
          {exporting ? "Export ho raha hai..." : "⬇ CSV Export"}
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
        {/* Period toggle */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(["monthly","weekly","daily"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition capitalize ${period === p ? "bg-white shadow text-teal-700" : "text-gray-500 hover:text-gray-700"}`}>
              {p}
            </button>
          ))}
        </div>

        {/* Year */}
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
          {[curYear - 1, curYear, curYear + 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {/* Month (only for weekly/daily) */}
        {period !== "monthly" && (
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
            {MONTHS_LIST.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        )}

        {/* Metric toggle */}
        <div className="ml-auto flex gap-1 bg-gray-100 rounded-xl p-1">
          {(["revenue","bookings"] as const).map((m) => (
            <button key={m} onClick={() => setMetric(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition capitalize ${metric === m ? "bg-white shadow text-teal-700" : "text-gray-500 hover:text-gray-700"}`}>
              {m === "revenue" ? "₹ Revenue" : "# Bookings"}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : !data ? null : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Total Bookings", value: summary.totalBookings?.toLocaleString() || "0",  color: "text-gray-800",   bg: "bg-white" },
              { label: "Total Revenue",  value: fmtINR(summary.totalRevenue || 0),               color: "text-teal-700",   bg: "bg-teal-50 border-teal-100" },
              { label: "Paid Revenue",   value: fmtINR(summary.totalPaid || 0),                  color: "text-green-700",  bg: "bg-green-50 border-green-100" },
              { label: "New Users",      value: summary.newUsers?.toLocaleString() || "0",        color: "text-blue-700",   bg: "bg-blue-50 border-blue-100" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`rounded-2xl border p-4 shadow-sm ${bg}`}>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
              </div>
            ))}
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4">{data.title}</h3>
            <div className="flex items-end gap-1 h-44 overflow-x-auto pb-2">
              {rows.map((r: any, i: number) => {
                const val  = metric === "revenue" ? r.revenue : r.total;
                const pct  = maxVal > 0 ? Math.max((val / maxVal) * 100, val > 0 ? 4 : 0) : 0;
                return (
                  <div key={i} className="flex flex-col items-center flex-1 min-w-[28px] group">
                    <div className="relative w-full flex justify-center">
                      {val > 0 && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                          {metric === "revenue" ? fmtINR(val) : val}
                        </div>
                      )}
                      <div
                        className={`w-full rounded-t-md transition-all ${val > 0 ? "bg-teal-500 hover:bg-teal-600" : "bg-gray-100"}`}
                        style={{ height: `${pct}%`, minHeight: "4px" }}
                      />
                    </div>
                    <p className="text-[9px] text-gray-400 mt-1 text-center truncate w-full">{r.period}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50">
              <h3 className="text-sm font-bold text-gray-700">Detailed Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wide">
                    <th className="text-left px-4 py-3">Period</th>
                    <th className="text-right px-3 py-3">Bookings</th>
                    <th className="text-right px-3 py-3">Revenue</th>
                    <th className="text-right px-3 py-3">Paid</th>
                    <th className="text-right px-3 py-3">OPD</th>
                    <th className="text-right px-3 py-3">Lab</th>
                    <th className="text-right px-3 py-3">Surgery</th>
                    <th className="text-right px-3 py-3">Consult</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((r: any, i: number) => (
                    <tr key={i} className={`hover:bg-gray-50 transition ${r.total === 0 ? "opacity-40" : ""}`}>
                      <td className="px-4 py-3 font-medium text-gray-700">{r.period}</td>
                      <td className="px-3 py-3 text-right font-semibold text-gray-800">{r.total || 0}</td>
                      <td className="px-3 py-3 text-right font-semibold text-teal-700">{r.revenue > 0 ? fmtINR(r.revenue) : "—"}</td>
                      <td className="px-3 py-3 text-right font-semibold text-green-600">{r.paid > 0 ? fmtINR(r.paid) : "—"}</td>
                      <td className="px-3 py-3 text-right text-blue-600">{r.OPD || "—"}</td>
                      <td className="px-3 py-3 text-right text-yellow-600">{r.Lab || "—"}</td>
                      <td className="px-3 py-3 text-right text-purple-600">{r.Surgery || "—"}</td>
                      <td className="px-3 py-3 text-right text-indigo-600">{r.Consultation || "—"}</td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="bg-teal-50 font-bold">
                    <td className="px-4 py-3 text-teal-800">TOTAL</td>
                    <td className="px-3 py-3 text-right text-teal-800">{summary.totalBookings || 0}</td>
                    <td className="px-3 py-3 text-right text-teal-800">{fmtINR(summary.totalRevenue || 0)}</td>
                    <td className="px-3 py-3 text-right text-green-700">{fmtINR(summary.totalPaid || 0)}</td>
                    <td className="px-3 py-3 text-right text-blue-700">{rows.reduce((s: number, r: any) => s + (r.OPD || 0), 0) || "—"}</td>
                    <td className="px-3 py-3 text-right text-yellow-700">{rows.reduce((s: number, r: any) => s + (r.Lab || 0), 0) || "—"}</td>
                    <td className="px-3 py-3 text-right text-purple-700">{rows.reduce((s: number, r: any) => s + (r.Surgery || 0), 0) || "—"}</td>
                    <td className="px-3 py-3 text-right text-indigo-700">{rows.reduce((s: number, r: any) => s + (r.Consultation || 0), 0) || "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── ACCOUNTING TAB ────────────────────────────────────────────────────────────
function AccountingTab() {
  const [subTab,     setSubTab]     = useState<"analytics"|"slabs"|"payouts"|"records">("analytics");
  const [view,       setView]       = useState<"summary"|"commissions">("summary");
  const [summary,    setSummary]    = useState<any>(null);
  const [byHospital, setByHospital] = useState<any[]>([]);
  const [commissions,setCommissions]= useState<any[]>([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [syncing,    setSyncing]    = useState(false);
  const [toast,      setToast]      = useState("");
  const [filterHosp, setFilterHosp]= useState("");
  const [filterStatus,setFilterStatus] = useState("");
  const [payoutModal,setPayoutModal] = useState<any>(null);
  const [payoutRef,  setPayoutRef]  = useState("");
  const [payoutDate, setPayoutDate] = useState(new Date().toISOString().split("T")[0]);
  const [payoutLoading,setPayoutLoading] = useState(false);

  // Analytics state
  const [analyticsPeriod, setAnalyticsPeriod] = useState("today");
  const [analytics,   setAnalytics]   = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Commission slabs state
  const [slabs,        setSlabs]       = useState<any[]>([]);
  const [slabHospitals,setSlabHospitals] = useState<any[]>([]);
  const [slabLoading,  setSlabLoading]  = useState(false);
  const [editSlab,     setEditSlab]     = useState<any>(null); // {hospital, slab}
  const [slabRates,    setSlabRates]    = useState({ OPD:"", Lab:"", Surgery:"", Consultation:"", IPD:"" });
  const [slabNotes,    setSlabNotes]    = useState("");
  const [savingSlabs,  setSavingSlabs]  = useState(false);

  const PAYOUT_STATUS_COLORS: Record<string,string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    paid:    "bg-green-100 text-green-700 border-green-200",
    on_hold: "bg-gray-100 text-gray-600 border-gray-200",
  };

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function fmtAmt(n: number) {
    return "₹" + (n || 0).toLocaleString("en-IN");
  }
  function fmtDate(d: string) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  async function fetchSummary() {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/accounting?view=summary");
      const data = await res.json();
      if (data.success) { setSummary(data.summary); setByHospital(data.byHospital || []); }
    } finally { setLoading(false); }
  }

  async function fetchCommissions(p = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ view: "commissions", page: String(p) });
      if (filterHosp)   params.set("hospitalId", filterHosp);
      if (filterStatus) params.set("status",     filterStatus);
      const res  = await fetch(`/api/admin/accounting?${params}`);
      const data = await res.json();
      if (data.success) { setCommissions(data.commissions); setTotal(data.total); }
    } finally { setLoading(false); }
  }

  async function syncCommissions() {
    setSyncing(true);
    try {
      const res  = await fetch("/api/admin/accounting", { method: "POST" });
      const data = await res.json();
      showToast(data.message || "Sync ho gaya");
      fetchSummary();
    } finally { setSyncing(false); }
  }

  async function fetchAnalytics(period = analyticsPeriod) {
    setAnalyticsLoading(true);
    try {
      const res  = await fetch(`/api/admin/booking-analytics?period=${period}`);
      const data = await res.json();
      if (data.success) setAnalytics(data);
    } finally { setAnalyticsLoading(false); }
  }

  async function fetchSlabs() {
    setSlabLoading(true);
    try {
      const res  = await fetch("/api/admin/commission-slabs");
      const data = await res.json();
      if (data.success) { setSlabs(data.slabs); setSlabHospitals(data.hospitals || []); }
    } finally { setSlabLoading(false); }
  }

  async function saveSlab() {
    if (!editSlab?.hospital?._id) return;
    setSavingSlabs(true);
    try {
      const rates: any = {};
      Object.entries(slabRates).forEach(([k, v]) => { if (v !== "") rates[k] = Number(v); });
      const res  = await fetch("/api/admin/commission-slabs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalId: editSlab.hospital._id, rates, notes: slabNotes }),
      });
      const data = await res.json();
      showToast(data.message || "Slab saved");
      setEditSlab(null);
      fetchSlabs();
    } finally { setSavingSlabs(false); }
  }

  async function markPaid() {
    if (!payoutModal) return;
    setPayoutLoading(true);
    try {
      const res  = await fetch("/api/admin/accounting", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalId:  payoutModal.hospitalId,
          payoutStatus:"paid",
          payoutRef,
          payoutDate,
        }),
      });
      const data = await res.json();
      showToast(data.message || "Payout mark ho gaya");
      setPayoutModal(null);
      setPayoutRef("");
      fetchSummary();
      if (view === "commissions") fetchCommissions(page);
    } finally { setPayoutLoading(false); }
  }

  useEffect(() => { fetchSummary(); fetchAnalytics(); fetchSlabs(); }, []);
  useEffect(() => {
    if (view === "commissions") fetchCommissions(1);
  }, [view, filterHosp, filterStatus]);

  const mInp2 = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400";

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">
      {toast && <div className="fixed top-4 right-4 z-50 bg-teal-700 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm">{toast}</div>}

      {/* Header + sub-tabs */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">💰 Accounting</h2>
        <div className="flex gap-1 flex-wrap border-b border-gray-100 pb-0">
          {([
            { key: "analytics", label: "📊 Analytics" },
            { key: "slabs",     label: "⚙️ Commission Slabs" },
            { key: "payouts",   label: "🏥 Payouts" },
            { key: "records",   label: "📋 Records" },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setSubTab(t.key)}
              className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition ${
                subTab === t.key ? "border-teal-600 text-teal-700 bg-teal-50" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* ═══ ANALYTICS SUB-TAB ═══════════════════════════════════════════════ */}
      {subTab === "analytics" && (
        <div className="space-y-5">
          {/* Period selector */}
          <div className="flex gap-2 flex-wrap items-center">
            {([
              { v: "today",      l: "Aaj" },
              { v: "this_month", l: "Is Mahine" },
              { v: "last_month", l: "Pichle Mahine" },
            ]).map(p => (
              <button key={p.v} onClick={() => { setAnalyticsPeriod(p.v); fetchAnalytics(p.v); }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  analyticsPeriod === p.v ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}>{p.l}</button>
            ))}
          </div>

          {analyticsLoading && <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" /></div>}

          {analytics && !analyticsLoading && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Total Bookings",    value: analytics.totals.count,           icon: "📋", color: "text-teal-700 bg-teal-50 border-teal-100" },
                  { label: "Total Revenue",      value: fmtAmt(analytics.totals.revenue),  icon: "💵", color: "text-green-700 bg-green-50 border-green-100" },
                  { label: "Brims Commission",   value: fmtAmt(analytics.totals.commission),icon: "🏢", color: "text-blue-700 bg-blue-50 border-blue-100" },
                  { label: "Hospital Payable",   value: fmtAmt(analytics.totals.hospitalAmt),icon:"🏥", color: "text-purple-700 bg-purple-50 border-purple-100" },
                ].map(c => (
                  <div key={c.label} className={`rounded-2xl border p-4 ${c.color}`}>
                    <p className="text-2xl mb-1">{c.icon}</p>
                    <p className="text-xl font-black">{c.value}</p>
                    <p className="text-xs font-semibold mt-0.5 opacity-70">{c.label}</p>
                  </div>
                ))}
              </div>

              {/* Payment mode breakdown */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-700 text-sm mb-4">💳 Payment Mode Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: "online",    label: "Online (Hamare paas)",     icon: "💻", color: "bg-blue-50 text-blue-700 border-blue-100" },
                    { key: "counter",   label: "Counter (Hospital ke paas)",icon: "🏥", color: "bg-amber-50 text-amber-700 border-amber-100" },
                    { key: "wallet",    label: "Wallet (Hamare paas)",      icon: "👛", color: "bg-green-50 text-green-700 border-green-100" },
                    { key: "insurance", label: "Insurance (Hamare paas)",   icon: "🛡️", color: "bg-purple-50 text-purple-700 border-purple-100" },
                  ].map(pm => (
                    <div key={pm.key} className={`rounded-xl border p-3 ${pm.color}`}>
                      <p className="text-lg mb-1">{pm.icon}</p>
                      <p className="font-bold text-base">{analytics.byPayMode[pm.key] || 0} bookings</p>
                      <p className="font-semibold text-sm">{fmtAmt(analytics.byPayModeRevenue[pm.key] || 0)}</p>
                      <p className="text-xs opacity-70 mt-0.5">{pm.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-teal-50 border border-teal-100 rounded-xl p-3">
                    <p className="text-xs text-teal-600 font-medium">💚 Hamare Account mein</p>
                    <p className="font-black text-teal-800 text-lg">{fmtAmt(analytics.paymentSplit?.toUs || 0)}</p>
                    <p className="text-xs text-teal-500">(Online + Wallet + Insurance)</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                    <p className="text-xs text-orange-600 font-medium">🏥 Hospital ke Counter mein</p>
                    <p className="font-black text-orange-800 text-lg">{fmtAmt(analytics.paymentSplit?.toHospital || 0)}</p>
                    <p className="text-xs text-orange-500">(Humara bill bhejna hoga)</p>
                  </div>
                </div>
              </div>

              {/* By Service Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-bold text-gray-700 text-sm mb-3">📊 Service Type Wise</h3>
                  <div className="space-y-2">
                    {Object.entries(analytics.byType || {}).map(([type, data]: any) => (
                      <div key={type} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-sm font-medium text-gray-600">{type}</span>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-800">{fmtAmt(data.revenue)}</p>
                          <p className="text-xs text-gray-400">{data.count} bookings · Commission: {fmtAmt(data.commission)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* By District */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-bold text-gray-700 text-sm mb-3">📍 District Wise</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {(analytics.byDistrict || []).slice(0, 10).map((d: any) => (
                      <div key={d.name} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-sm font-medium text-gray-600">{d.name}</span>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-800">{fmtAmt(d.revenue)}</p>
                          <p className="text-xs text-gray-400">{d.count} bookings</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* By Hospital */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-50 bg-gray-50">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">🏥 Hospital Wise</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-50">
                        <th className="px-4 py-3 text-left">Hospital</th>
                        <th className="px-4 py-3 text-right">Bookings</th>
                        <th className="px-4 py-3 text-right">Revenue</th>
                        <th className="px-4 py-3 text-right">Commission</th>
                        <th className="px-4 py-3 text-right">Hospital Amt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(analytics.byHospital || []).map((h: any) => (
                        <tr key={h.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 font-semibold text-gray-800 text-xs">{h.name}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{h.count}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmtAmt(h.revenue)}</td>
                          <td className="px-4 py-3 text-right text-blue-700">{fmtAmt(h.commission)}</td>
                          <td className="px-4 py-3 text-right text-purple-700 font-semibold">{fmtAmt(h.hospitalAmt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ COMMISSION SLABS SUB-TAB ════════════════════════════════════════ */}
      {subTab === "slabs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-700">Commission Slabs</h3>
              <p className="text-xs text-gray-400 mt-0.5">Har hospital ke liye negotiate kiye gaye rates. Blank = platform default lagega.</p>
            </div>
          </div>

          {/* Default rates info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-800 mb-2">Default Commission Rates (agar custom slab na ho):</p>
            <div className="flex flex-wrap gap-3">
              {[["OPD","10%"],["Lab","12%"],["Surgery","8%"],["Consultation","15%"],["IPD","8%"]].map(([t,r]) => (
                <span key={t} className="bg-white border border-blue-200 text-blue-700 text-xs px-3 py-1.5 rounded-full font-semibold">
                  {t}: {r}
                </span>
              ))}
            </div>
          </div>

          {slabLoading && <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" /></div>}

          {/* Hospital list with slabs */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {slabHospitals.map(({ hospital, slab }: any) => (
                <div key={hospital._id} className="p-4 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{hospital.name}</p>
                    <p className="text-xs text-gray-400">{hospital.address?.district}</p>
                    {slab ? (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {Object.entries(slab.rates).filter(([, v]) => v != null).map(([type, rate]) => (
                          <span key={type} className="bg-teal-50 border border-teal-200 text-teal-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                            {type}: {rate as number}%
                          </span>
                        ))}
                        {slab.notes && <span className="text-xs text-gray-400 italic">• {slab.notes}</span>}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1">Default rates laagu hain</p>
                    )}
                  </div>
                  <button onClick={() => {
                    setEditSlab({ hospital, slab });
                    setSlabRates({
                      OPD:          slab?.rates?.OPD          != null ? String(slab.rates.OPD)          : "",
                      Lab:          slab?.rates?.Lab          != null ? String(slab.rates.Lab)          : "",
                      Surgery:      slab?.rates?.Surgery      != null ? String(slab.rates.Surgery)      : "",
                      Consultation: slab?.rates?.Consultation != null ? String(slab.rates.Consultation) : "",
                      IPD:          slab?.rates?.IPD          != null ? String(slab.rates.IPD)          : "",
                    });
                    setSlabNotes(slab?.notes || "");
                  }} className="text-xs bg-teal-50 border border-teal-200 text-teal-700 px-3 py-1.5 rounded-xl font-semibold hover:bg-teal-100 transition flex-shrink-0">
                    {slab ? "✏️ Edit" : "➕ Set Slab"}
                  </button>
                </div>
              ))}
              {slabHospitals.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">Koi verified hospital nahi mila</div>}
            </div>
          </div>

          {/* Edit Slab Modal */}
          {editSlab && (
            <>
              <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setEditSlab(null)} />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">⚙️ Commission Slab Set Karein</h3>
                    <p className="text-sm text-gray-500 mt-1">{editSlab.hospital.name}</p>
                    <p className="text-xs text-gray-400">Blank chhodne par default rate lagega</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(["OPD","Lab","Surgery","Consultation","IPD"] as const).map(type => (
                      <div key={type}>
                        <label className="text-xs font-medium text-gray-500">{type} Commission (%)</label>
                        <input type="number" min={0} max={100} value={slabRates[type]}
                          onChange={e => setSlabRates(s => ({ ...s, [type]: e.target.value }))}
                          placeholder={`Default: ${{"OPD":10,"Lab":12,"Surgery":8,"Consultation":15,"IPD":8}[type]}%`}
                          className={`mt-1 ${mInp2}`} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Negotiation Notes</label>
                    <input value={slabNotes} onChange={e => setSlabNotes(e.target.value)}
                      placeholder="e.g. Contract dated 1 April 2025" className={`mt-1 ${mInp2}`} />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setEditSlab(null)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold">Cancel</button>
                    <button onClick={saveSlab} disabled={savingSlabs}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                      {savingSlabs ? "Saving..." : "✓ Save Slab"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ PAYOUTS SUB-TAB ════════════════════════════════════════════════ */}
      {subTab === "payouts" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-gray-700">Hospital Payouts</h3>
              <p className="text-xs text-gray-400 mt-0.5">Commission deduct karke hospital ko transfer karein</p>
            </div>
            <button onClick={syncCommissions} disabled={syncing}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 flex items-center gap-2">
              {syncing ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Syncing...</> : <>🔄 Sync Bookings</>}
            </button>
          </div>

          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Revenue",     value: fmtAmt(summary.totalGross),    icon: "💵", color: "text-teal-700 bg-teal-50 border-teal-100" },
                { label: "Brims Commission",  value: fmtAmt(summary.totalComm),     icon: "🏢", color: "text-blue-700 bg-blue-50 border-blue-100" },
                { label: "Hospital Earnings", value: fmtAmt(summary.totalHospital), icon: "🏥", color: "text-purple-700 bg-purple-50 border-purple-100" },
                { label: "Pending Payout",    value: fmtAmt(summary.pendingPayout), icon: "⏳", color: "text-amber-700 bg-amber-50 border-amber-100" },
              ].map(c => (
                <div key={c.label} className={`rounded-2xl border p-4 ${c.color}`}>
                  <p className="text-2xl mb-1">{c.icon}</p>
                  <p className="text-xl font-black">{c.value}</p>
                  <p className="text-xs font-semibold mt-0.5 opacity-70">{c.label}</p>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {byHospital.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm"><p className="text-3xl mb-2">📊</p>Koi data nahi — "Sync Bookings" button dabayein pehle</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                      <th className="px-4 py-3 text-left">Hospital</th>
                      <th className="px-4 py-3 text-right">Bookings</th>
                      <th className="px-4 py-3 text-right">Gross</th>
                      <th className="px-4 py-3 text-right">Commission</th>
                      <th className="px-4 py-3 text-right">Hospital Amt</th>
                      <th className="px-4 py-3 text-right">Pending</th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {byHospital.map((h: any) => (
                      <tr key={h._id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-semibold text-gray-800">{h.hospitalName || "Unknown"}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{h.bookings}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmtAmt(h.gross)}</td>
                        <td className="px-4 py-3 text-right text-blue-700 font-semibold">{fmtAmt(h.commission)}</td>
                        <td className="px-4 py-3 text-right text-purple-700 font-semibold">{fmtAmt(h.hospitalAmt)}</td>
                        <td className="px-4 py-3 text-right">{h.pendingAmt > 0 ? <span className="text-amber-700 font-bold">{fmtAmt(h.pendingAmt)}</span> : <span className="text-green-600 text-xs font-semibold">✓ Cleared</span>}</td>
                        <td className="px-4 py-3 text-center">{h.pendingAmt > 0 && <button onClick={() => setPayoutModal({ hospitalId: h._id, hospitalName: h.hospitalName, pendingAmt: h.pendingAmt })} className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition">Mark Paid</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ RECORDS SUB-TAB ════════════════════════════════════════════════ */}
      {subTab === "records" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                      <th className="px-4 py-3 text-left">Booking</th>
                      <th className="px-4 py-3 text-left">Hospital</th>
                      <th className="px-4 py-3 text-right">Gross</th>
                      <th className="px-4 py-3 text-right">Commission</th>
                      <th className="px-4 py-3 text-right">Hospital Amt</th>
                      <th className="px-4 py-3 text-center">Payout</th>
                      <th className="px-4 py-3 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {commissions.length === 0 ? <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Koi records nahi — Payouts tab se Sync karein</td></tr> : (
                      commissions.map((c: any) => (
                        <tr key={c._id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3"><p className="font-mono text-xs text-gray-600">{c.bookingRef}</p><p className="text-[11px] text-gray-400 mt-0.5">{c.type}</p></td>
                          <td className="px-4 py-3 text-gray-700 text-xs">{c.hospitalName || "—"}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmtAmt(c.grossAmount)}</td>
                          <td className="px-4 py-3 text-right text-blue-700 text-xs">{fmtAmt(c.commissionAmt)}<span className="text-gray-400 ml-1">({c.commissionPct}%)</span></td>
                          <td className="px-4 py-3 text-right text-purple-700 font-semibold">{fmtAmt(c.hospitalAmt)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${PAYOUT_STATUS_COLORS[c.payoutStatus]}`}>{c.payoutStatus}</span>
                            {c.payoutRef && <p className="text-[10px] text-gray-400 mt-0.5">{c.payoutRef}</p>}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-gray-400">{fmtDate(c.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {total > 20 && (
              <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between text-sm text-gray-500">
                <span>{total} records</span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); fetchCommissions(p); }} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">← Prev</button>
                  <button disabled={page >= Math.ceil(total/20)} onClick={() => { const p = page + 1; setPage(p); fetchCommissions(p); }} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">Next →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payout Modal */}
      {payoutModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setPayoutModal(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">💸 Payout Mark Karein</h3>
                <p className="text-sm text-gray-500 mt-1">{payoutModal.hospitalName}</p>
                <p className="text-2xl font-black text-green-600 mt-2">{fmtAmt(payoutModal.pendingAmt)}</p>
                <p className="text-xs text-gray-400">Pending payout amount</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">UTR / Reference No.</label>
                  <input value={payoutRef} onChange={e => setPayoutRef(e.target.value)} placeholder="Bank transfer UTR ya UPI ref" className={`mt-1.5 ${mInp2}`} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payout Date</label>
                  <input type="date" value={payoutDate} onChange={e => setPayoutDate(e.target.value)} className={`mt-1.5 ${mInp2}`} />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setPayoutModal(null)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold">Cancel</button>
                <button onClick={markPaid} disabled={payoutLoading || !payoutRef}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                  {payoutLoading ? "Saving..." : "✓ Mark as Paid"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── COORDINATORS TAB ──────────────────────────────────────────────────────────
function CoordinatorsTab() {
  const [coordinators, setCoordinators] = useState<any[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [toast,        setToast]        = useState("");
  const [toastOk,      setToastOk]      = useState(true);
  const [showAdd,      setShowAdd]      = useState(false);
  const [selected,     setSelected]     = useState<any>(null);
  const [detailTab,    setDetailTab]    = useState<"overview"|"bookings"|"transactions">("overview");
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [utrInput,     setUtrInput]     = useState("");
  const [processingTxn, setProcessingTxn] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", mobile: "", email: "", district: "", area: "", type: "health_worker",
    commOPD: "0", commLab: "30", commSurgery: "20", commConsultation: "0", commIPD: "10",
  });

  const COORD_TYPES: Record<string, string> = {
    health_worker: "Health Worker", gp: "General Practitioner",
    pharmacist: "Pharmacist", other: "Other",
  };

  const INP = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400";

  function showToast(msg: string, ok = true) {
    setToast(msg); setToastOk(ok); setTimeout(() => setToast(""), 3500);
  }
  function setF(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function fetchCoordinators() {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/coordinators");
      const data = await res.json();
      if (data.success) setCoordinators(data.coordinators || []);
    } finally { setLoading(false); }
  }

  async function fetchDetail(id: string) {
    setDetailLoading(true);
    try {
      const res  = await fetch(`/api/admin/coordinators?id=${id}`);
      const data = await res.json();
      if (data.success) {
        setSelected({
          ...data.coordinator,
          bookings:          data.bookings || [],
          transactions:      data.transactions || [],
          availableEarned:   data.availableEarned || 0,
          pendingWithdrawals: data.pendingWithdrawals || [],
        });
        setDetailTab("overview");
      }
    } finally { setDetailLoading(false); }
  }

  async function addCoordinator() {
    if (!form.name || !form.mobile) return showToast("Name aur mobile zaruri hai", false);
    setSaving(true);
    try {
      const res  = await fetch("/api/admin/coordinators", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, mobile: form.mobile, email: form.email,
          district: form.district, area: form.area, type: form.type,
          commissionRates: {
            OPD: Number(form.commOPD), Lab: Number(form.commLab),
            Surgery: Number(form.commSurgery), Consultation: Number(form.commConsultation),
            IPD: Number(form.commIPD),
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Coordinator add ho gaya!");
        setShowAdd(false);
        setForm({ name: "", mobile: "", email: "", district: "", area: "", type: "health_worker", commOPD: "0", commLab: "30", commSurgery: "20", commConsultation: "0", commIPD: "10" });
        fetchCoordinators();
      } else { showToast(data.message || "Server error", false); }
    } catch (e: any) {
      showToast("Network error: " + (e?.message || "Unknown"), false);
    } finally { setSaving(false); }
  }

  async function toggleActive(id: string, isActive: boolean) {
    try {
      const res  = await fetch("/api/admin/coordinators", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      const data = await res.json();
      if (data.success) { showToast("Updated!"); fetchCoordinators(); }
    } catch {}
  }

  async function processWithdrawal(txnId: string) {
    if (!utrInput.trim()) return showToast("UTR number darj karein", false);
    setProcessingTxn(txnId);
    try {
      const res  = await fetch("/api/admin/coordinators", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "process-withdraw", txnId, utr: utrInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Withdrawal processed!");
        setUtrInput("");
        if (selected) fetchDetail(selected._id);
        fetchCoordinators();
      } else { showToast(data.message || "Error", false); }
    } catch { showToast("Network error", false); }
    finally { setProcessingTxn(null); }
  }

  useEffect(() => { fetchCoordinators(); }, []);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-sm text-white ${toastOk ? "bg-teal-700" : "bg-red-600"}`}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">🤝 Health Coordinators</h2>
          <p className="text-sm text-gray-400 mt-0.5">Local health workers — bookings + commission + withdrawal management</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition">
          + Add Coordinator
        </button>
      </div>

      {/* Stats summary */}
      {coordinators.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total",        value: coordinators.length,                                           color: "bg-teal-50  border-teal-100  text-teal-700"   },
            { label: "Active",       value: coordinators.filter(c => c.isActive).length,                   color: "bg-green-50 border-green-100 text-green-700"   },
            { label: "Total Bookings", value: coordinators.reduce((s, c) => s + (c.totalBookings || 0), 0), color: "bg-blue-50  border-blue-100  text-blue-700"    },
            { label: "Total Earned", value: "₹" + coordinators.reduce((s, c) => s + (c.totalEarned || 0), 0).toLocaleString("en-IN"), color: "bg-purple-50 border-purple-100 text-purple-700" },
          ].map(c => (
            <div key={c.label} className={`rounded-2xl border p-4 ${c.color}`}>
              <p className="text-xl font-black">{c.value}</p>
              <p className="text-xs font-semibold mt-0.5 opacity-70">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" /></div>
      ) : coordinators.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-4xl mb-3">🤝</p>
          <p className="text-gray-500 font-medium">Koi coordinator nahi mila</p>
          <p className="text-xs text-gray-400 mt-1">"Add Coordinator" dabao naaya health worker add karne ke liye</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left">Coordinator</th>
                  <th className="px-4 py-3 text-left">Type / District</th>
                  <th className="px-4 py-3 text-right">Bookings</th>
                  <th className="px-4 py-3 text-right">Earned</th>
                  <th className="px-4 py-3 text-right">Pending Pay</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {coordinators.map((c: any) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.mobile}{c.coordinatorId ? ` · ${c.coordinatorId}` : ""}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-600">{COORD_TYPES[c.type] || c.type}</p>
                      <p className="text-xs text-gray-400">{c.district || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-700">{c.totalBookings || 0}</td>
                    <td className="px-4 py-3 text-right text-green-700 font-semibold">₹{(c.totalEarned || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-right">
                      {(c.pendingEarned || 0) > 0
                        ? <span className="text-amber-700 font-bold">₹{c.pendingEarned.toLocaleString("en-IN")}</span>
                        : <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${c.isActive ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}`}>
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => fetchDetail(c._id)}
                          className="text-xs bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-lg font-semibold hover:bg-blue-100 transition">
                          💰 Earnings
                        </button>
                        <button onClick={() => toggleActive(c._id, c.isActive)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold border transition ${c.isActive ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100" : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"}`}>
                          {c.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Coordinator Modal */}
      {showAdd && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 my-8">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">🤝 New Health Coordinator</h3>
                <p className="text-sm text-gray-400 mt-0.5">Ek user account bhi ban jayega automatically</p>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Basic Info</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Name *</label>
                    <input value={form.name} onChange={e => setF("name", e.target.value)} placeholder="Full name" className={`mt-1 ${INP}`} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Mobile *</label>
                    <input value={form.mobile} onChange={e => setF("mobile", e.target.value.replace(/\D/g,""))} placeholder="10-digit" maxLength={10} inputMode="numeric" className={`mt-1 ${INP}`} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Email</label>
                    <input value={form.email} onChange={e => setF("email", e.target.value)} placeholder="Optional" className={`mt-1 ${INP}`} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Type</label>
                    <select value={form.type} onChange={e => setF("type", e.target.value)} className={`mt-1 ${INP}`}>
                      {Object.entries(COORD_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500">District</label>
                    <select value={form.district} onChange={e => setF("district", e.target.value)} className={`mt-1 ${INP}`}>
                      <option value="">Select district</option>
                      {BIHAR_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Area / Village</label>
                    <input value={form.area} onChange={e => setF("area", e.target.value)} placeholder="Area ya gaon" className={`mt-1 ${INP}`} />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Commission Rates (%)</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { k: "commSurgery",      label: "Surgery",      placeholder: "20" },
                    { k: "commLab",          label: "Lab",          placeholder: "30" },
                    { k: "commIPD",          label: "IPD",          placeholder: "10" },
                    { k: "commOPD",          label: "OPD",          placeholder: "0"  },
                    { k: "commConsultation", label: "Consultation", placeholder: "0"  },
                  ].map(({ k, label, placeholder }) => (
                    <div key={k}>
                      <label className="text-xs font-medium text-gray-500">{label} %</label>
                      <input type="number" min={0} max={50} value={(form as any)[k]}
                        onChange={e => setF(k, e.target.value)} placeholder={placeholder}
                        className={`mt-1 ${INP}`} />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400">Example: Surgery 20% → ₹10,000 surgery pe ₹2,000 milega coordinator ko</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowAdd(false)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold">Cancel</button>
                <button onClick={addCoordinator} disabled={saving}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                  {saving ? "Adding..." : "✓ Add Coordinator"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Detail Drawer ── */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col">

            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between flex-shrink-0">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{selected.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{selected.coordinatorId} · {COORD_TYPES[selected.type] || selected.type} · {selected.district || "—"}</p>
                <p className="text-xs text-gray-500 mt-0.5">{selected.mobile}{selected.email ? ` · ${selected.email}` : ""}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none mt-1">×</button>
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-gray-100 flex-shrink-0 px-5 pt-3 gap-1">
              {(["overview","bookings","transactions"] as const).map(t => (
                <button key={t} onClick={() => setDetailTab(t)}
                  className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition capitalize ${detailTab === t ? "bg-white border border-b-white border-gray-200 text-teal-700 -mb-px" : "text-gray-500 hover:text-gray-700"}`}>
                  {t === "overview" ? "📊 Overview" : t === "bookings" ? `📋 Bookings (${selected.bookings?.length || 0})` : `💳 Transactions (${selected.transactions?.length || 0})`}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {detailLoading && (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                </div>
              )}

              {/* ── OVERVIEW TAB ── */}
              {!detailLoading && detailTab === "overview" && (
                <>
                  {/* 4 earning stats */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Total Bookings",    value: selected.totalBookings || 0,                                     color: "bg-blue-50   border-blue-100   text-blue-700"   },
                      { label: "Total Earned",      value: "₹" + (selected.totalEarned   || 0).toLocaleString("en-IN"),     color: "bg-green-50  border-green-100  text-green-700"  },
                      { label: "Available Withdraw",value: "₹" + (selected.availableEarned || 0).toLocaleString("en-IN"),   color: "bg-teal-50   border-teal-100   text-teal-700"   },
                      { label: "Total Paid Out",    value: "₹" + (selected.paidEarned    || 0).toLocaleString("en-IN"),     color: "bg-purple-50 border-purple-100 text-purple-700" },
                    ].map(s => (
                      <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
                        <p className="text-xl font-black">{s.value}</p>
                        <p className="text-xs font-semibold mt-0.5 opacity-70">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Commission rates */}
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-3">Commission Rates</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selected.commissionRates || {}).map(([t, r]) => (
                        <span key={t} className="bg-white border border-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-full font-semibold">
                          {t}: {r as number}%
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pending withdrawal requests */}
                  {selected.pendingWithdrawals && selected.pendingWithdrawals.length > 0 && (
                    <div className="rounded-2xl overflow-hidden border border-amber-200">
                      <div className="bg-gradient-to-r from-amber-500 to-orange-400 px-4 py-2 flex items-center gap-2">
                        <span className="text-white text-lg">💸</span>
                        <p className="text-white text-sm font-bold flex-1">Pending Withdrawal Requests</p>
                        <span className="bg-white text-amber-700 text-xs font-black px-2 py-0.5 rounded-full">
                          {selected.pendingWithdrawals.length} pending
                        </span>
                      </div>
                      <div className="bg-amber-50 divide-y divide-amber-100">
                        {selected.pendingWithdrawals.map((txn: any) => (
                          <div key={txn._id} className="px-4 py-3 space-y-2">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm font-bold text-amber-800">₹{(txn.amount || 0).toLocaleString("en-IN")}</p>
                                <p className="text-xs text-amber-600">{txn.description}</p>
                                <p className="text-[10px] text-amber-500">{new Date(txn.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                              </div>
                              <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-semibold">Pending</span>
                            </div>
                            {/* UTR input + process button */}
                            <div className="flex gap-2">
                              <input
                                value={processingTxn === txn._id ? utrInput : ""}
                                onFocus={() => setProcessingTxn(txn._id)}
                                onChange={e => { setProcessingTxn(txn._id); setUtrInput(e.target.value); }}
                                placeholder="UTR number darj karein..."
                                className="flex-1 border border-amber-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                              />
                              <button
                                onClick={() => processWithdrawal(txn._id)}
                                disabled={processingTxn === txn._id && !utrInput.trim()}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-50 transition whitespace-nowrap">
                                ✓ Process
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No pending = all clear */}
                  {(!selected.pendingWithdrawals || selected.pendingWithdrawals.length === 0) && (
                    <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 text-center">
                      <p className="text-xs text-green-600 font-semibold">✓ Koi pending withdrawal request nahi hai</p>
                    </div>
                  )}
                </>
              )}

              {/* ── BOOKINGS TAB ── */}
              {!detailLoading && detailTab === "bookings" && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {selected.bookings?.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-10">Koi booking nahi hai</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {(selected.bookings || []).map((b: any) => {
                        let pn = ""; try { pn = JSON.parse(b.notes || "{}").patientName || ""; } catch {}
                        const commission = b.coordinatorCommission || 0;
                        const isPaid = b.coordinatorPaid;
                        const isCompleted = b.status === "completed";
                        const statusLabel = isPaid ? "Paid" : isCompleted ? "Ready" : b.status === "cancelled" ? "Cancelled" : "Pending";
                        const statusColor = isPaid ? "bg-green-100 text-green-700 border-green-200"
                          : isCompleted ? "bg-blue-100 text-blue-700 border-blue-200"
                          : b.status === "cancelled" ? "bg-red-100 text-red-700 border-red-200"
                          : "bg-amber-100 text-amber-700 border-amber-200";
                        return (
                          <div key={b._id} className="px-4 py-3 flex items-start gap-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${isPaid ? "bg-green-100 text-green-700" : isCompleted ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                              {isPaid ? "✓" : isCompleted ? "★" : "⏳"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{pn || "Patient"}</p>
                              <p className="text-xs text-gray-500">{b.bookingId} · {b.type}</p>
                              <p className="text-[10px] text-gray-400">{new Date(b.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={`text-sm font-bold ${commission > 0 ? "text-gray-800" : "text-gray-400"}`}>
                                {commission > 0 ? `₹${commission.toLocaleString("en-IN")}` : "—"}
                              </p>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${statusColor}`}>{statusLabel}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── TRANSACTIONS TAB ── */}
              {!detailLoading && detailTab === "transactions" && (
                <div className="space-y-3">
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                      <p className="text-lg font-black text-green-700">
                        ₹{(selected.transactions || []).filter((t: any) => t.type === "credit" && t.status === "success").reduce((s: number, t: any) => s + (t.amount || 0), 0).toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-green-600 font-semibold">Total Credits</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                      <p className="text-lg font-black text-orange-700">
                        ₹{(selected.transactions || []).filter((t: any) => t.type === "debit" && t.status === "success").reduce((s: number, t: any) => s + (t.amount || 0), 0).toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-orange-600 font-semibold">Total Debits (Paid)</p>
                    </div>
                  </div>

                  {/* Full ledger */}
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50 bg-gray-50">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Complete Transaction Ledger</p>
                    </div>
                    {(selected.transactions || []).length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-8">Koi transaction nahi hai</p>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {(selected.transactions || []).map((txn: any) => (
                          <div key={txn._id} className="px-4 py-3 flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5 ${
                              txn.type === "credit" && txn.status === "success" ? "bg-green-100 text-green-700"
                              : txn.type === "debit" && txn.status === "success" ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                            }`}>
                              {txn.type === "credit" ? "↓" : txn.status === "success" ? "↑" : "⏳"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-700 leading-snug">{txn.description}</p>
                              {txn.paymentId && (
                                <p className="text-[10px] text-blue-600 font-semibold mt-0.5">UTR: {txn.paymentId}</p>
                              )}
                              {txn.referenceId && !txn.paymentId && (
                                <p className="text-[10px] text-gray-400 mt-0.5">Ref: {txn.referenceId}</p>
                              )}
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {new Date(txn.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                {" · "}
                                {new Date(txn.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={`text-sm font-bold ${txn.type === "credit" ? "text-green-600" : "text-orange-600"}`}>
                                {txn.type === "credit" ? "+" : "-"}₹{(txn.amount || 0).toLocaleString("en-IN")}
                              </p>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                                txn.status === "success" ? "bg-green-100 text-green-700 border-green-200"
                                : txn.status === "pending" ? "bg-amber-100 text-amber-700 border-amber-200"
                                : "bg-red-100 text-red-700 border-red-200"
                              }`}>{txn.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── LEDGER TAB ────────────────────────────────────────────────────────────────
function LedgerTab() {
  const [stats,        setStats]        = useState<any>({});
  const [transactions, setTransactions] = useState<any[]>([]);
  const [bookings,     setBookings]     = useState<any[]>([]);
  const [pending,      setPending]      = useState<any[]>([]);
  const [activeView,   setActiveView]   = useState("all");
  const [loading,      setLoading]      = useState(false);
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [total,        setTotal]        = useState(0);
  const [toast,        setToast]        = useState("");
  const [toastOk,      setToastOk]      = useState(true);
  const [utrMap,       setUtrMap]       = useState<Record<string,string>>({});
  const [processing,   setProcessing]   = useState<string|null>(null);
  // Add expense modal
  const [showExpModal,  setShowExpModal]  = useState(false);
  const [expAmount,     setExpAmount]     = useState("");
  const [expDesc,       setExpDesc]       = useState("");
  const [expCategory,   setExpCategory]   = useState("expense");
  const [addingExp,     setAddingExp]     = useState(false);
  // Booking detail drawer
  const [selectedBooking,    setSelectedBooking]    = useState<any>(null);
  const [bookingTxns,        setBookingTxns]        = useState<any[]>([]);
  const [bookingTxnsLoading, setBookingTxnsLoading] = useState(false);
  // Last-updated timestamp for live indicator
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  // Partner payouts section
  const [payouts,            setPayouts]            = useState<any[]>([]);
  const [payoutsLoading,     setPayoutsLoading]     = useState(false);
  const [activePayoutEntity, setActivePayoutEntity] = useState("hospital");
  const [payoutStatusFilter, setPayoutStatusFilter] = useState("pending");
  const [payoutPage,         setPayoutPage]         = useState(1);
  const [payoutTotalPages,   setPayoutTotalPages]   = useState(1);
  const [payoutTotal,        setPayoutTotal]        = useState(0);
  const [payoutPendingTotal, setPayoutPendingTotal] = useState(0);
  const [payoutPendingCount, setPayoutPendingCount] = useState(0);
  const [payoutUtrMap,       setPayoutUtrMap]       = useState<Record<string,string>>({});
  const [processingPayout,   setProcessingPayout]   = useState<string|null>(null);

  const isBookingView = activeView.startsWith("bookings-");

  function showToast(msg: string, ok = true) {
    setToast(msg); setToastOk(ok); setTimeout(() => setToast(""), 3000);
  }

  async function fetchLedger(pg = 1, view = activeView, silent = false) {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({ view, page: String(pg), limit: "30" });
      const res  = await fetch(`/api/admin/ledger?${params}`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats || {});
        setTransactions(data.transactions || []);
        setBookings(data.bookings || []);
        setPending(data.pendingWithdrawals || []);
        setTotalPages(data.pages || 1);
        setTotal(data.total || 0);
        setPage(pg);
        setLastUpdated(new Date());
      }
    } finally { if (!silent) setLoading(false); }
  }

  function changeView(v: string) {
    setActiveView(v);
    fetchLedger(1, v);
  }

  // Auto-refresh stats every 30 seconds (silent — no loading spinner)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLedger(page, activeView, true);
    }, 30000);
    return () => clearInterval(interval);
  }, [page, activeView]);

  // Fetch transactions for selected booking whenever drawer opens
  useEffect(() => {
    if (!selectedBooking) { setBookingTxns([]); return; }
    setBookingTxnsLoading(true);
    const params = new URLSearchParams({
      view:       "booking-txns",
      bookingId:  selectedBooking._id,
      bookingRef: selectedBooking.bookingId || "",
    });
    fetch(`/api/admin/ledger?${params}`)
      .then(r => r.json())
      .then(d => { if (d.success) setBookingTxns(d.transactions || []); })
      .catch(() => {})
      .finally(() => setBookingTxnsLoading(false));
  }, [selectedBooking?._id]);

  async function processWithdrawal(txnId: string) {
    const utr = utrMap[txnId] || "";
    if (!utr.trim()) return showToast("UTR number darj karein", false);
    setProcessing(txnId);
    try {
      const res  = await fetch("/api/admin/coordinators", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "process-withdraw", txnId, utr: utr.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Payment processed!");
        setUtrMap(m => ({ ...m, [txnId]: "" }));
        fetchLedger(page, activeView);
      } else { showToast(data.message || "Error", false); }
    } catch { showToast("Network error", false); }
    finally { setProcessing(null); }
  }

  async function addExpense() {
    if (!expAmount || parseFloat(expAmount) <= 0) return showToast("Valid amount darj karein", false);
    if (!expDesc.trim()) return showToast("Description zaruri hai", false);
    setAddingExp(true);
    try {
      const res  = await fetch("/api/admin/ledger", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(expAmount), description: expDesc.trim(), category: expCategory }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Entry added!");
        setShowExpModal(false); setExpAmount(""); setExpDesc(""); setExpCategory("expense");
        fetchLedger(page, activeView);
      } else { showToast(data.message || "Error", false); }
    } catch { showToast("Network error", false); }
    finally { setAddingExp(false); }
  }

  useEffect(() => { fetchLedger(1, "all"); }, []);

  // ── Partner payouts ────────────────────────────────────────────────────────
  async function fetchPayouts(entity = activePayoutEntity, statusF = payoutStatusFilter, pg = 1) {
    setPayoutsLoading(true);
    try {
      const params = new URLSearchParams({ entity, status: statusF, page: String(pg) });
      const res  = await fetch(`/api/admin/payouts?${params}`);
      const data = await res.json();
      if (data.success) {
        setPayouts(data.bookings || []);
        setPayoutTotalPages(data.pages || 1);
        setPayoutTotal(data.total || 0);
        setPayoutPendingTotal(data.pendingTotal || 0);
        setPayoutPendingCount(data.pendingCount || 0);
        setPayoutPage(pg);
      }
    } finally { setPayoutsLoading(false); }
  }

  function changePayoutEntity(entity: string) {
    setActivePayoutEntity(entity);
    setPayoutStatusFilter("pending");
    setPayoutUtrMap({});
    fetchPayouts(entity, "pending", 1);
  }

  function changePayoutStatus(statusF: string) {
    setPayoutStatusFilter(statusF);
    fetchPayouts(activePayoutEntity, statusF, 1);
  }

  async function processPartnerPayout(bookingId: string) {
    const utr = payoutUtrMap[bookingId] || "";
    if (!utr.trim()) return showToast("UTR number darj karein", false);
    setProcessingPayout(bookingId);
    try {
      const res  = await fetch("/api/admin/payouts", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, utr: utr.trim(), entity: activePayoutEntity }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Payout processed!");
        setPayoutUtrMap(m => ({ ...m, [bookingId]: "" }));
        fetchPayouts(activePayoutEntity, payoutStatusFilter, payoutPage);
      } else { showToast(data.message || "Error", false); }
    } catch { showToast("Network error", false); }
    finally { setProcessingPayout(null); }
  }

  useEffect(() => { fetchPayouts("hospital", "pending", 1); }, []);

  // ── Stat card definitions ──────────────────────────────────────────────────
  const statCards = [
    // Row 1: Bookings
    { key: "bookings-all",       icon: "📋", label: "Total Bookings",   value: (stats.totalBookings    || 0).toLocaleString("en-IN"), sub: `₹${(stats.totalBookingValue||0).toLocaleString("en-IN")} value`,   active: "border-blue-300  bg-blue-600  text-white",   idle: "border-blue-100  bg-blue-50  text-blue-700"  },
    { key: "bookings-pending",   icon: "⏳", label: "Pending",           value: (stats.pendingBookings  || 0).toLocaleString("en-IN"), sub: "Confirmation awaited",                                             active: "border-amber-300 bg-amber-600 text-white",   idle: "border-amber-100 bg-amber-50 text-amber-700" },
    { key: "bookings-confirmed", icon: "✅", label: "Confirmed",          value: (stats.confirmedBookings||0).toLocaleString("en-IN"), sub: "Ready for service",                                                active: "border-green-300 bg-green-600 text-white",   idle: "border-green-100 bg-green-50 text-green-700" },
    { key: "bookings-completed", icon: "🏁", label: "Completed",          value: (stats.completedBookings||0).toLocaleString("en-IN"), sub: "Services delivered",                                               active: "border-teal-300  bg-teal-600  text-white",   idle: "border-teal-100  bg-teal-50  text-teal-700"  },
    // Row 2: Finance
    { key: "income",             icon: "💰", label: "Total Earnings",    value: "₹" + (stats.totalIncome    ||0).toLocaleString("en-IN"), sub: "Platform income received",   active: "border-emerald-300 bg-emerald-600 text-white", idle: "border-emerald-100 bg-emerald-50 text-emerald-700" },
    { key: "expenses",           icon: "💸", label: "Total Expenses",    value: "₹" + (stats.totalExpenses  ||0).toLocaleString("en-IN"), sub: "Payouts & cashbacks",        active: "border-red-300  bg-red-600  text-white",      idle: "border-red-100   bg-red-50   text-red-600"        },
    { key: "pending-payouts",    icon: "⚡", label: "Pending Payouts",   value: "₹" + (stats.pendingPayouts ||0).toLocaleString("en-IN"), sub: `${stats.pendingPayoutsCount||0} withdrawal requests`, active: "border-orange-300 bg-orange-600 text-white", idle: "border-orange-100 bg-orange-50 text-orange-700" },
    { key: "paid-out",           icon: "🏦", label: "Paid Out",           value: "₹" + (stats.totalPaidOut   ||0).toLocaleString("en-IN"), sub: "Processed withdrawals",      active: "border-gray-400 bg-gray-700 text-white",      idle: "border-gray-200  bg-gray-50  text-gray-700"       },
  ];

  const quickFilters = [
    { key: "all",         label: "All Transactions" },
    { key: "income",      label: "💰 Income" },
    { key: "expenses",    label: "💸 Expenses" },
    { key: "coordinator", label: "🤝 Coordinators" },
    { key: "wallet",      label: "👛 Wallet" },
    { key: "staff",       label: "👨‍💼 Staff" },
  ];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-sm text-white ${toastOk ? "bg-teal-700" : "bg-red-600"}`}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">📒 Master Ledger</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="inline-flex items-center gap-1 text-[10px] text-green-600 font-semibold">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
              Live
            </span>
            <span className="text-[10px] text-gray-400">
              Updated {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <button
              onClick={() => fetchLedger(page, activeView)}
              className="text-[10px] text-teal-600 hover:underline font-semibold">
              ↻ Refresh
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowExpModal(true)}
          className="flex-shrink-0 bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded-xl transition">
          + Add Entry
        </button>
      </div>

      {/* ── Row 1: Booking stats ─────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">📋 Bookings</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.slice(0, 4).map(card => (
            <button
              key={card.key}
              onClick={() => changeView(card.key)}
              className={`rounded-2xl border p-3 text-left transition hover:shadow-md ${activeView === card.key ? card.active : card.idle}`}>
              <p className="text-xl font-black leading-none">{card.value}</p>
              <p className="text-[11px] font-bold mt-1.5 opacity-80">{card.icon} {card.label}</p>
              <p className="text-[10px] mt-0.5 opacity-60">{card.sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Row 2: Finance stats ─────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">💰 Platform Finance</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.slice(4).map(card => (
            <button
              key={card.key}
              onClick={() => changeView(card.key)}
              className={`rounded-2xl border p-3 text-left transition hover:shadow-md ${activeView === card.key ? card.active : card.idle}`}>
              <p className="text-xl font-black leading-none">{card.value}</p>
              <p className="text-[11px] font-bold mt-1.5 opacity-80">{card.icon} {card.label}</p>
              <p className="text-[10px] mt-0.5 opacity-60">{card.sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Net balance banner ───────────────────────────────────────────── */}
      <div className={`rounded-2xl overflow-hidden border ${(stats.netBalance || 0) >= 0 ? "border-green-300" : "border-red-300"}`}>
        <div className={`px-5 py-3 flex items-center justify-between ${(stats.netBalance || 0) >= 0 ? "bg-green-600" : "bg-red-600"}`}>
          <div>
            <p className="text-white/80 text-[11px] font-semibold uppercase tracking-wide">Net Platform Balance</p>
            <p className="text-white/60 text-[10px] mt-0.5">Total Income − Total Expenses</p>
          </div>
          <div className="text-right">
            <p className="text-white text-2xl font-black">
              {(stats.netBalance || 0) >= 0 ? "+" : "−"}₹{Math.abs(stats.netBalance || 0).toLocaleString("en-IN")}
            </p>
            <p className="text-white/60 text-[10px]">₹{(stats.totalIncome||0).toLocaleString("en-IN")} in − ₹{(stats.totalExpenses||0).toLocaleString("en-IN")} out</p>
          </div>
        </div>
      </div>

      {/* ── Partner Payouts ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-indigo-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-sm">🏦 Partner Payouts</p>
            <p className="text-white/70 text-[10px] mt-0.5">Platform commission katne ke baad hospital / lab / doctor ko bhejne wala paisa</p>
          </div>
          {payoutPendingCount > 0 && (
            <span className="bg-white text-indigo-700 text-xs font-black px-2.5 py-1 rounded-full">
              {payoutPendingCount} pending
            </span>
          )}
        </div>

        <div className="bg-indigo-50 px-4 py-3 space-y-3">
          {/* Entity tabs */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: "hospital",  icon: "🏥", label: "Hospital" },
              { key: "lab",       icon: "🧪", label: "Lab" },
              { key: "doctor",    icon: "🩺", label: "Doctor" },
              { key: "ambulance", icon: "🚑", label: "Ambulance" },
            ].map(tab => (
              <button key={tab.key} onClick={() => changePayoutEntity(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  activePayoutEntity === tab.key
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white text-indigo-700 border-indigo-200 hover:border-indigo-400"
                }`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Pending total banner */}
          {payoutPendingTotal > 0 && (
            <div className="bg-white rounded-xl px-4 py-2.5 flex items-center justify-between border border-indigo-100">
              <div>
                <p className="text-[10px] text-indigo-500 font-semibold uppercase tracking-wide">Pending Payout</p>
                <p className="text-xs text-indigo-600">{payoutPendingCount} bookings — waiting for UTR</p>
              </div>
              <p className="text-lg font-black text-indigo-700">₹{payoutPendingTotal.toLocaleString("en-IN")}</p>
            </div>
          )}

          {/* Status filter */}
          <div className="flex gap-2">
            {[
              { key: "pending", label: "⏳ Pending" },
              { key: "paid",    label: "✅ Paid" },
              { key: "all",     label: "All" },
            ].map(s => (
              <button key={s.key} onClick={() => changePayoutStatus(s.key)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold border transition ${
                  payoutStatusFilter === s.key
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                }`}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Payout list */}
          {payoutsLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : payouts.length === 0 ? (
            <div className="bg-white rounded-xl py-6 text-center border border-indigo-100">
              <p className="text-sm text-indigo-400 font-semibold">
                {payoutStatusFilter === "pending"
                  ? `✅ Koi pending ${activePayoutEntity} payout nahi hai`
                  : "Koi record nahi mila"}
              </p>
              {payoutStatusFilter === "pending" && (
                <p className="text-[10px] text-gray-400 mt-1">Sabhi payouts processed ho chuke hain</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {payouts.map((b: any) => {
                const notes = b.parsedNotes || {};
                const entityName =
                  activePayoutEntity === "doctor"
                    ? (b.doctorId?.name || b.hospitalId?.name || "—")
                    : (b.hospitalId?.name || b.doctorId?.name || "—");

                return (
                  <div key={b._id} className="bg-white rounded-xl border border-indigo-100 overflow-hidden">
                    <div className="px-4 py-3 flex flex-wrap items-start gap-3">
                      {/* Left: booking info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-black text-indigo-700">{b.bookingId || "—"}</p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                            b.status === "completed" ? "bg-teal-100 text-teal-700 border-teal-200"
                            : b.status === "confirmed" ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-amber-100 text-amber-700 border-amber-200"
                          }`}>{b.status}</span>
                          <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">
                            {b.paymentMode?.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-gray-700 mt-1">{entityName}</p>
                        <p className="text-[10px] text-gray-400">
                          {notes.patientName || "—"} · {b.type}
                          {b.appointmentDate ? ` · ${new Date(b.appointmentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}` : ""}
                        </p>
                        {b.payoutStatus === "paid" && b.payoutUtr && (
                          <p className="text-[10px] font-mono text-green-600 mt-1">
                            ✅ UTR: {b.payoutUtr}
                            {b.payoutProcessedAt ? ` · ${new Date(b.payoutProcessedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}` : ""}
                          </p>
                        )}
                      </div>
                      {/* Right: amount + action */}
                      <div className="flex-shrink-0 text-right">
                        <div className="mb-1.5">
                          <p className="text-[9px] text-gray-400">Total Booking</p>
                          <p className="text-xs font-bold text-gray-600">₹{(b.amount || 0).toLocaleString("en-IN")}</p>
                        </div>
                        <div className="mb-2">
                          <p className="text-[9px] text-indigo-500 font-semibold">Payable ({100 - (b.commissionPct || 0)}%)</p>
                          <p className="text-sm font-black text-indigo-700">₹{(b.hospitalPayable || 0).toLocaleString("en-IN")}</p>
                        </div>
                        {b.payoutStatus !== "paid" && (
                          <div className="flex gap-1.5 justify-end">
                            <input
                              value={payoutUtrMap[b._id] || ""}
                              onChange={e => setPayoutUtrMap(m => ({ ...m, [b._id]: e.target.value }))}
                              placeholder="UTR no."
                              className="border border-indigo-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-indigo-50 w-24"
                            />
                            <button
                              onClick={() => processPartnerPayout(b._id)}
                              disabled={processingPayout === b._id}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg disabled:opacity-50 transition whitespace-nowrap">
                              {processingPayout === b._id ? "..." : "✓ Pay"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Payout pagination */}
          {payoutTotalPages > 1 && !payoutsLoading && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-[10px] text-indigo-400">Page {payoutPage} of {payoutTotalPages} ({payoutTotal} records)</p>
              <div className="flex gap-2">
                <button disabled={payoutPage <= 1}
                  onClick={() => fetchPayouts(activePayoutEntity, payoutStatusFilter, payoutPage - 1)}
                  className="px-2.5 py-1 bg-white border border-indigo-200 rounded-lg text-xs font-semibold disabled:opacity-40">← Prev</button>
                <button disabled={payoutPage >= payoutTotalPages}
                  onClick={() => fetchPayouts(activePayoutEntity, payoutStatusFilter, payoutPage + 1)}
                  className="px-2.5 py-1 bg-white border border-indigo-200 rounded-lg text-xs font-semibold disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Pending withdrawals action bar ──────────────────────────────── */}
      {pending.length > 0 && (
        <div className="rounded-2xl overflow-hidden border border-amber-200">
          <div className="bg-gradient-to-r from-amber-500 to-orange-400 px-4 py-2 flex items-center gap-2">
            <span className="text-white text-lg">⚡</span>
            <p className="text-white text-sm font-bold flex-1">Action Required — Pending Withdrawals</p>
            <span className="bg-white text-amber-700 text-xs font-black px-2 py-0.5 rounded-full">{pending.length}</span>
          </div>
          <div className="bg-amber-50 divide-y divide-amber-100">
            {pending.map((txn: any) => (
              <div key={txn._id} className="px-4 py-3 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-amber-800">
                    {txn.coordinator?.name || txn.userId?.name || "Coordinator"}
                    <span className="text-amber-600 font-normal ml-2">— ₹{(txn.amount || 0).toLocaleString("en-IN")}</span>
                  </p>
                  <p className="text-xs text-amber-600 truncate">{txn.description}</p>
                  <p className="text-[10px] text-amber-500">{new Date(txn.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <input
                    value={utrMap[txn._id] || ""}
                    onChange={e => setUtrMap(m => ({ ...m, [txn._id]: e.target.value }))}
                    placeholder="Enter UTR..."
                    className="border border-amber-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white w-36"
                  />
                  <button
                    onClick={() => processWithdrawal(txn._id)}
                    disabled={processing === txn._id}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-50 transition">
                    {processing === txn._id ? "..." : "✓ Pay"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick filter pills (transaction views only) ──────────────────── */}
      {!isBookingView && (
        <div className="flex flex-wrap gap-2">
          {quickFilters.map(f => (
            <button key={f.key} onClick={() => changeView(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                activeView === f.key
                  ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Active view label ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-600">
          {isBookingView ? "Bookings" : "Transactions"}
          {total > 0 && <span className="ml-2 text-gray-400 font-normal">({total.toLocaleString("en-IN")} records)</span>}
        </p>
        {isBookingView && (
          <button onClick={() => changeView("all")} className="text-xs text-teal-600 hover:underline font-semibold">
            ← Back to Transactions
          </button>
        )}
      </div>

      {/* ── Content table ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" /></div>
        ) : isBookingView ? (
          /* ── Bookings table ──────────────────────────────────────────── */
          bookings.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">Koi booking nahi mili</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                      <th className="px-4 py-3 text-left">Booking ID</th>
                      <th className="px-4 py-3 text-left">Patient</th>
                      <th className="px-4 py-3 text-left">Type / Service</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {bookings.map((b: any) => {
                      const notes = b.parsedNotes || {};
                      return (
                        <tr
                          key={b._id}
                          className="hover:bg-teal-50 cursor-pointer transition"
                          onClick={() => setSelectedBooking(b)}
                        >
                          <td className="px-4 py-3">
                            <p className="text-xs font-bold text-teal-700 hover:underline">{b.bookingId || "—"}</p>
                            <p className="text-[10px] text-gray-400">{b.paymentMode || "—"}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs font-semibold text-gray-800">{notes.patientName || b.userId?.name || "—"}</p>
                            <p className="text-[10px] text-gray-400">{notes.patientMobile || b.userId?.mobile || ""}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-gray-700 font-medium">{b.type || "—"}</p>
                            <p className="text-[10px] text-gray-400">{b.hospitalId?.name || b.doctorId?.name || ""}</p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <p className="text-sm font-black text-gray-800">₹{(b.amount || 0).toLocaleString("en-IN")}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              b.status === "completed" ? "bg-teal-100 text-teal-700 border-teal-200"
                              : b.status === "confirmed" ? "bg-green-100 text-green-700 border-green-200"
                              : b.status === "pending"   ? "bg-amber-100 text-amber-700 border-amber-200"
                              : "bg-red-100 text-red-700 border-red-200"
                            }`}>{b.status}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                            {new Date(b.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )
        ) : (
          /* ── Transactions table ──────────────────────────────────────── */
          transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">Koi transaction nahi mila</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-left">Ref / UTR</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((txn: any) => (
                    <tr key={txn._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800 text-xs">{txn.coordinator?.name || txn.userId?.name || "—"}</p>
                        <p className="text-[10px] text-gray-400">{txn.userId?.mobile || ""}</p>
                        {txn.userId?.role && (
                          <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{txn.userId.role}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                          ["card_activation_payment","booking_payment","booking_advance","platform_charge","wallet_topup"].includes(txn.category)
                            ? "bg-green-100 text-green-700 border-green-200"
                            : txn.category === "withdrawal"
                              ? "bg-blue-100 text-blue-700 border-blue-200"
                              : "bg-orange-100 text-orange-700 border-orange-200"
                        }`}>
                          {txn.categoryLabel || txn.category || "other"}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[160px]">
                        <p className="text-xs text-gray-600 leading-snug line-clamp-2">{txn.description}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[10px] text-blue-600 font-semibold font-mono">{txn.paymentId || txn.referenceId || "—"}</p>
                      </td>
                      <td className={`px-4 py-3 text-right font-black text-sm whitespace-nowrap ${
                        ["card_activation_payment","booking_payment","booking_advance","platform_charge","wallet_topup"].includes(txn.category)
                          ? "text-green-600"
                          : txn.type === "credit" ? "text-teal-600" : "text-orange-600"
                      }`}>
                        {["card_activation_payment","booking_payment","booking_advance","platform_charge","wallet_topup"].includes(txn.category) ? "▲" : txn.type === "credit" ? "+" : "▼"}
                        ₹{(txn.amount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          txn.status === "success" ? "bg-green-100 text-green-700 border-green-200"
                          : txn.status === "pending" ? "bg-amber-100 text-amber-700 border-amber-200"
                          : "bg-red-100 text-red-700 border-red-200"
                        }`}>{txn.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(txn.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => fetchLedger(page - 1, activeView)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold disabled:opacity-40">← Prev</button>
              <button disabled={page >= totalPages} onClick={() => fetchLedger(page + 1, activeView)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Booking Detail Drawer ───────────────────────────────────────── */}
      {selectedBooking && (() => {
        const b     = selectedBooking;
        const notes = b.parsedNotes || {};

        const statusColor =
          b.status === "completed" ? "bg-teal-100 text-teal-700 border-teal-200"
          : b.status === "confirmed" ? "bg-green-100 text-green-700 border-green-200"
          : b.status === "pending"   ? "bg-amber-100 text-amber-700 border-amber-200"
          : "bg-red-100 text-red-700 border-red-200";

        // Payment mode labels
        const PAYMENT_MODE: Record<string, { label: string; sub: string; icon: string; color: string }> = {
          counter:   { label: "Hospital Counter",    sub: "Offline / Cash",          icon: "🏦", color: "bg-gray-100  text-gray-700  border-gray-200"   },
          wallet:    { label: "Brims Wallet",         sub: "Platform (Digital)",      icon: "👛", color: "bg-teal-100  text-teal-700  border-teal-200"   },
          online:    { label: "Payment Gateway",      sub: "Online / PhonePe",        icon: "📱", color: "bg-blue-100  text-blue-700  border-blue-200"   },
          insurance: { label: "Insurance / TPA",      sub: "Cashless",                icon: "🛡️", color: "bg-purple-100 text-purple-700 border-purple-200" },
          partial:   { label: "Advance / Deposit",    sub: "Balance due at counter",  icon: "💰", color: "bg-amber-100 text-amber-700 border-amber-200"  },
        };
        const pm = PAYMENT_MODE[b.paymentMode] || { label: b.paymentMode || "—", sub: "", icon: "💳", color: "bg-gray-100 text-gray-600 border-gray-200" };

        return (
          <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setSelectedBooking(null)}>
            <div
              className="bg-white w-full max-w-sm h-full overflow-y-auto shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* ── Header ── */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-start justify-between z-10">
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Booking Detail</p>
                  <p className="text-lg font-black text-teal-700 mt-0.5">{b.bookingId || "—"}</p>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                      {b.status?.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                      {TYPE_ICON[b.type] || "📋"} {b.type}
                    </span>
                    {b.isPartialBooking && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        Partial
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-700 text-2xl font-light leading-none mt-0.5">×</button>
              </div>

              <div className="flex-1 px-5 py-4 space-y-4">

                {/* ── Patient ── */}
                <div className="bg-gray-50 rounded-2xl p-4 space-y-1.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Patient</p>
                  <p className="font-bold text-gray-800 text-sm">{notes.patientName || b.userId?.name || "—"}</p>
                  <p className="text-xs text-gray-500">📱 +91 {notes.patientMobile || b.userId?.mobile || "—"}</p>
                  {(notes.patientAge || notes.patientGender) && (
                    <p className="text-xs text-gray-500">
                      {notes.patientAge ? `${notes.patientAge} yrs` : ""}
                      {notes.patientAge && notes.patientGender ? " · " : ""}
                      {notes.patientGender || ""}
                    </p>
                  )}
                  {notes.isNewPatient !== undefined && (
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      notes.isNewPatient ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}>{notes.isNewPatient ? "New Patient" : "Existing Patient"}</span>
                  )}
                </div>

                {/* ── Service details ── */}
                <div className="space-y-2.5">
                  {b.hospitalId?.name && (
                    <div className="flex justify-between items-start gap-3 text-sm">
                      <span className="text-gray-400 flex-shrink-0">🏥 Hospital</span>
                      <span className="font-semibold text-gray-700 text-right">{b.hospitalId.name}</span>
                    </div>
                  )}
                  {b.doctorId?.name && (
                    <div className="flex justify-between items-start gap-3 text-sm">
                      <span className="text-gray-400 flex-shrink-0">🩺 Doctor</span>
                      <span className="font-semibold text-gray-700 text-right">
                        {b.doctorId.name}{b.doctorId.department ? ` · ${b.doctorId.department}` : ""}
                      </span>
                    </div>
                  )}
                  {b.appointmentDate && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">📅 Date</span>
                      <span className="font-semibold text-gray-700">
                        {new Date(b.appointmentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
                      </span>
                    </div>
                  )}
                  {b.slot && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">🕐 Slot</span>
                      <span className="font-semibold text-gray-700">{b.slot}</span>
                    </div>
                  )}
                  {notes.symptoms && (
                    <div className="flex justify-between items-start gap-3 text-sm">
                      <span className="text-gray-400 flex-shrink-0">🤒 Symptoms</span>
                      <span className="font-semibold text-gray-700 text-right">{notes.symptoms}</span>
                    </div>
                  )}
                  {b.roomType && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">🛏️ Room</span>
                      <span className="font-semibold text-gray-700">{b.roomType}</span>
                    </div>
                  )}
                </div>

                {/* ── Payment Details ── */}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Payment Details</p>
                  <div className="rounded-2xl overflow-hidden border border-gray-200">
                    {/* Payment mode card */}
                    <div className={`px-4 py-3 flex items-center gap-3 border-b border-gray-100 ${pm.color.split(" ")[0]}`}>
                      <span className="text-xl">{pm.icon}</span>
                      <div className="flex-1">
                        <p className={`text-xs font-bold ${pm.color.split(" ").slice(1).join(" ")}`}>{pm.label}</p>
                        <p className="text-[10px] text-gray-500">{pm.sub}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pm.color}`}>
                        {b.paymentMode?.toUpperCase() || "—"}
                      </span>
                    </div>

                    {/* Insurance details */}
                    {(notes.insurancePolicyNo || notes.insurerName) && (
                      <div className="bg-gray-50 px-4 py-2.5 space-y-1 border-b border-gray-100">
                        {notes.insurerName && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Insurer</span>
                            <span className="font-semibold text-gray-700">{notes.insurerName}</span>
                          </div>
                        )}
                        {notes.insurancePolicyNo && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Policy No.</span>
                            <span className="font-mono font-bold text-gray-700">{notes.insurancePolicyNo}</span>
                          </div>
                        )}
                        {notes.tpaName && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">TPA</span>
                            <span className="font-semibold text-gray-700">{notes.tpaName}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Partial booking breakdown */}
                    {b.isPartialBooking && (
                      <div className="bg-amber-50 px-4 py-2.5 space-y-1 border-b border-amber-100">
                        <div className="flex justify-between text-xs">
                          <span className="text-amber-600 font-semibold">Deposit Paid</span>
                          <span className="font-bold text-amber-700">₹{(b.depositAmount || b.amount || 0).toLocaleString("en-IN")}</span>
                        </div>
                        {b.balanceAmount > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-amber-600 font-semibold">Balance Due</span>
                            <span className="font-bold text-red-600">₹{b.balanceAmount.toLocaleString("en-IN")}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Payment ID */}
                    {b.paymentId && (
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                        <p className="text-[10px] text-gray-400">Payment Ref / Gateway ID</p>
                        <p className="font-mono text-[11px] text-blue-600 font-semibold mt-0.5 break-all">{b.paymentId}</p>
                      </div>
                    )}

                    {/* Amount footer */}
                    <div className="bg-teal-600 px-4 py-3 flex justify-between items-center">
                      <div>
                        <p className="text-teal-100 text-[10px] font-semibold uppercase tracking-wide">Amount Received</p>
                        {b.isPartialBooking && (
                          <p className="text-teal-200 text-[10px]">Deposit only</p>
                        )}
                      </div>
                      <p className="text-white text-2xl font-black">₹{(b.amount || 0).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                </div>

                {/* ── Transaction History ── */}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                    Transaction History
                    {bookingTxns.length > 0 && (
                      <span className="ml-1.5 bg-teal-100 text-teal-700 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                        {bookingTxns.length}
                      </span>
                    )}
                  </p>

                  {bookingTxnsLoading ? (
                    <div className="flex justify-center py-6">
                      <div className="w-6 h-6 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                    </div>
                  ) : bookingTxns.length === 0 ? (
                    <div className="bg-gray-50 rounded-2xl px-4 py-5 text-center">
                      <p className="text-xs text-gray-400">
                        {b.paymentMode === "counter"
                          ? "Cash payment — no digital transaction record"
                          : "Koi transaction record nahi mila"}
                      </p>
                      {b.paymentMode === "counter" && (
                        <p className="text-[10px] text-gray-400 mt-1">Counter payments are tracked manually by staff</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {bookingTxns.map((txn: any, idx: number) => {
                        const isIncome = ["card_activation_payment","booking_payment","booking_advance","platform_charge","wallet_topup"].includes(txn.category);
                        return (
                          <div key={txn._id || idx} className="rounded-2xl border border-gray-100 overflow-hidden">
                            {/* Transaction row header */}
                            <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                              <div className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                                  txn.type === "credit" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                                }`}>
                                  {txn.type === "credit" ? "▲" : "▼"}
                                </span>
                                <div>
                                  <p className="text-[10px] font-bold text-gray-700">
                                    {txn.categoryLabel || txn.category || "Transaction"}
                                  </p>
                                  <p className="text-[9px] text-gray-400">
                                    {new Date(txn.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                    {" · "}
                                    {new Date(txn.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className={`text-sm font-black ${isIncome ? "text-green-600" : "text-orange-600"}`}>
                                  {txn.type === "credit" ? "+" : "−"}₹{(txn.amount || 0).toLocaleString("en-IN")}
                                </p>
                                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${
                                  txn.status === "success" ? "bg-green-100 text-green-700 border-green-200"
                                  : txn.status === "pending" ? "bg-amber-100 text-amber-700 border-amber-200"
                                  : "bg-red-100 text-red-700 border-red-200"
                                }`}>{txn.status}</span>
                              </div>
                            </div>
                            {/* Description + ref */}
                            <div className="px-3 py-2 space-y-1">
                              <p className="text-[10px] text-gray-500 leading-snug">{txn.description}</p>
                              {(txn.paymentId || txn.referenceId) && (
                                <p className="text-[9px] font-mono text-blue-500">
                                  Ref: {txn.paymentId || txn.referenceId}
                                </p>
                              )}
                              {txn.userId?.name && (
                                <p className="text-[9px] text-gray-400">By: {txn.userId.name} ({txn.userId.role})</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── Timestamps ── */}
                <div className="text-center space-y-1 pb-2">
                  <p className="text-[10px] text-gray-400">
                    📌 Booked: {new Date(b.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    {" "}{new Date(b.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {b.updatedAt && b.updatedAt !== b.createdAt && (
                    <p className="text-[10px] text-gray-400">
                      🔄 Updated: {new Date(b.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Add Entry Modal ──────────────────────────────────────────────── */}
      {showExpModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="px-5 pt-5 pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-800">+ Add Manual Entry</h3>
              <p className="text-xs text-gray-400 mt-0.5">Expense, pickup charge, ya platform charge manually add karein</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                <select value={expCategory} onChange={e => setExpCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                  <option value="expense">💸 Expense (debit)</option>
                  <option value="pickup_charge">🏍️ Pickup Charge (debit)</option>
                  <option value="platform_charge">🏥 Platform Charge from Hospital (credit)</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Amount (₹)</label>
                <input
                  type="number" min="1" value={expAmount} onChange={e => setExpAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <input
                  value={expDesc} onChange={e => setExpDesc(e.target.value)}
                  placeholder="e.g. Office rent July 2026"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button onClick={() => setShowExpModal(false)}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={addExpense} disabled={addingExp}
                className="flex-1 bg-gray-800 hover:bg-gray-900 text-white rounded-xl py-2.5 text-sm font-bold transition disabled:opacity-50">
                {addingExp ? "Adding..." : "Add Entry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── AMBULANCE TAB ─────────────────────────────────────────────────────────────
function AmbulanceTab() {
  const [requests,  setRequests]  = useState<any[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [filter,    setFilter]    = useState("");
  const [selected,  setSelected]  = useState<any>(null);
  const [updating,  setUpdating]  = useState(false);
  const [toast,     setToast]     = useState("");

  // Dispatch form
  const [driverName,  setDriverName]  = useState("");
  const [vehicleNo,   setVehicleNo]   = useState("");
  const [eta,         setEta]         = useState("");
  const [newStatus,   setNewStatus]   = useState("dispatched");
  const [adminNotes,  setAdminNotes]  = useState("");

  const STATUS_COLORS: Record<string, string> = {
    pending:    "bg-amber-100 text-amber-700 border-amber-200",
    dispatched: "bg-blue-100  text-blue-700  border-blue-200",
    arrived:    "bg-green-100 text-green-700 border-green-200",
    completed:  "bg-teal-100  text-teal-700  border-teal-200",
    cancelled:  "bg-red-100   text-red-700   border-red-200",
  };

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  function fmtDt(d: string) {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  async function fetchRequests() {
    setLoading(true);
    try {
      const p = new URLSearchParams({ view: "list" });
      if (filter) p.set("status", filter);
      const res  = await fetch(`/api/ambulance?${p}`);
      const data = await res.json();
      if (data.success) { setRequests(data.requests); setTotal(data.total); }
    } finally { setLoading(false); }
  }

  async function handleUpdate() {
    if (!selected) return;
    setUpdating(true);
    try {
      const res  = await fetch("/api/ambulance", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId:     selected.requestId,
          status:        newStatus,
          assignedDriver:driverName || undefined,
          vehicleNumber: vehicleNo  || undefined,
          estimatedETA:  eta        || undefined,
          adminNotes:    adminNotes || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Request update ho gayi");
        setSelected(null);
        fetchRequests();
      } else {
        showToast(data.message || "Update nahi hua");
      }
    } finally { setUpdating(false); }
  }

  useEffect(() => { fetchRequests(); }, [filter]);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-teal-700 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm">{toast}</div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">🚑 Ambulance Requests</h2>
          <p className="text-sm text-gray-500">{total} total requests</p>
        </div>
        <button onClick={fetchRequests} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
          🔄 Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {["", "pending", "dispatched", "arrived", "completed", "cancelled"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${filter === s ? "bg-red-600 text-white border-red-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><p className="text-3xl mb-2">🚑</p><p>Koi request nahi</p></div>
      ) : (
        <div className="space-y-3">
          {requests.map((r: any) => (
            <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-sm font-bold text-red-700">{r.requestId}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border ${STATUS_COLORS[r.status]}`}>
                      {r.status}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                      {r.vehicleType}
                    </span>
                  </div>
                  <p className="font-bold text-gray-800">{r.callerName} — <span className="font-mono text-sm">{r.callerMobile}</span></p>
                  {r.emergency && <p className="text-xs text-red-600 font-semibold mt-0.5">⚕️ {r.emergency}</p>}
                  <p className="text-xs text-gray-500 mt-0.5">📍 {r.address}{r.landmark ? ` (${r.landmark})` : ""}, {r.district}</p>
                  {r.assignedDriver && (
                    <p className="text-xs text-blue-600 mt-0.5">🚑 {r.assignedDriver} · {r.vehicleNumber} · ETA: {r.estimatedETA}</p>
                  )}
                  <p className="text-[11px] text-gray-400 mt-1">{fmtDt(r.createdAt)}</p>
                </div>
                <button onClick={() => { setSelected(r); setNewStatus(r.status); setDriverName(r.assignedDriver||""); setVehicleNo(r.vehicleNumber||""); setEta(r.estimatedETA||""); setAdminNotes(r.adminNotes||""); }}
                  className="flex-shrink-0 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-2 rounded-xl text-xs font-bold transition">
                  Update
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Update modal */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Update Request</h3>
                <p className="text-sm text-gray-500 font-mono">{selected.requestId}</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                    className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
                    {["pending","dispatched","arrived","completed","cancelled"].map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Driver Name</label>
                  <input value={driverName} onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Driver ka naam"
                    className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehicle No.</label>
                    <input value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)}
                      placeholder="BR01-XY-1234"
                      className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ETA</label>
                    <input value={eta} onChange={(e) => setEta(e.target.value)}
                      placeholder="10-15 mins"
                      className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Admin Notes</label>
                  <input value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Internal note"
                    className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setSelected(null)}
                  className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold">Cancel</button>
                <button onClick={handleUpdate} disabled={updating}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                  {updating ? "Saving..." : "Update Karein"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── ARTICLES TAB ──────────────────────────────────────────────────────────────
function ArticlesTab() {
  const [articles, setArticles]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(1);
  const [meta, setMeta]           = useState<any>({});
  const [toast, setToast]         = useState("");
  const [toggling, setToggling]   = useState<string | null>(null);

  const fetch_ = useCallback(async (pg = 1) => {
    setLoading(true);
    const p = new URLSearchParams({ page: pg.toString(), all: "true", limit: "15" });
    if (search) p.set("search", search);
    const res  = await fetch(`/api/articles?${p}`);
    const data = await res.json();
    if (data.success) { setArticles(data.articles); setMeta({ total: data.total, pages: data.pages }); }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetch_(1); setPage(1); }, [search]);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  async function togglePublish(id: string, current: boolean) {
    setToggling(id);
    try {
      const res  = await fetch(`/api/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !current }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(current ? "Article unpublish ho gayi" : "Article publish ho gayi ✓");
        fetch_(page);
      } else showToast(data.message || "Error");
    } catch { showToast("Network error"); }
    setToggling(null);
  }

  async function deleteArticle(id: string, title: string) {
    if (!confirm(`"${title}" delete karein?`)) return;
    try {
      const res  = await fetch(`/api/articles/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { showToast("Article delete ho gayi"); fetch_(page); }
      else showToast(data.message || "Error");
    } catch { showToast("Network error"); }
  }

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-teal-700 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm">{toast}</div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">📰 Articles Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">{meta.total ?? 0} total articles</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <SearchBar value={search} onChange={setSearch} placeholder="Title / author search..." />
          <a href="/write-article" target="_blank"
            className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5">
            ✍️ Write New
          </a>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <Spinner /> : articles.length === 0 ? (
          <EmptyState icon="📰" message="Koi article nahi mili" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Title", "Author", "Tags", "Views", "Status", "Date", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {articles.map((a) => (
                    <tr key={a._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 max-w-xs">
                        <p className="font-semibold text-gray-800 truncate">{a.title}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        <p>{a.authorName || "—"}</p>
                        <p className="text-gray-400 capitalize">{a.authorRole}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(a.diseaseTags || []).slice(0, 2).map((tag: string) => (
                            <span key={tag} className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full border border-red-100">{tag}</span>
                          ))}
                          {(a.generalTags || []).slice(0, 1).map((tag: string) => (
                            <span key={tag} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-100">{tag}</span>
                          ))}
                          {((a.diseaseTags?.length || 0) + (a.generalTags?.length || 0)) > 3 && (
                            <span className="text-[10px] text-gray-400">+more</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-semibold">{a.views ?? 0}</td>
                      <td className="px-4 py-3">
                        <Badge color={a.isPublished ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"}>
                          {a.isPublished ? "● Published" : "○ Draft"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(a.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <a href={`/articles/${a._id}`} target="_blank"
                            className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg font-semibold transition">
                            👁 View
                          </a>
                          <button
                            onClick={() => togglePublish(a._id, a.isPublished)}
                            disabled={toggling === a._id}
                            className={`text-xs px-2.5 py-1 rounded-lg font-semibold border transition disabled:opacity-50 ${a.isPublished ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200" : "bg-green-50 hover:bg-green-100 text-green-700 border-green-200"}`}>
                            {toggling === a._id ? "..." : a.isPublished ? "Unpublish" : "Publish"}
                          </button>
                          <button
                            onClick={() => deleteArticle(a._id, a.title)}
                            className="text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2.5 py-1 rounded-lg font-semibold transition">
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-4">
              <Pagination page={page} pages={meta.pages ?? 1} total={meta.total ?? 0} onPage={(p) => { setPage(p); fetch_(p); }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── NOTIFICATIONS TAB ─────────────────────────────────────────────────────────
const DISEASE_TAGS = ["HTN", "Diabetes", "CVD", "CKD", "Thyroid Disorder", "Pregnancy", "Joint Pain"];

function NotificationsTab() {
  const [title, setTitle]           = useState("");
  const [message, setMessage]       = useState("");
  const [target, setTarget]         = useState("all");
  const [diseaseTag, setDiseaseTag] = useState("");
  const [sending, setSending]       = useState(false);
  const [result, setResult]         = useState<{ ok: boolean; msg: string } | null>(null);
  const [history, setHistory]       = useState<any[]>([]);
  const [hLoading, setHLoading]     = useState(true);

  useEffect(() => {
    fetch("/api/admin/broadcast")
      .then((r) => r.json())
      .then((d) => { if (d.success) setHistory(d.broadcasts); })
      .finally(() => setHLoading(false));
  }, []);

  async function handleSend() {
    if (!title.trim() || !message.trim()) {
      setResult({ ok: false, msg: "Title aur message dono bharo" }); return;
    }
    setSending(true);
    setResult(null);
    try {
      const body: any = { title: title.trim(), message: message.trim(), target };
      if (diseaseTag) body.diseaseTag = diseaseTag;
      const res  = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ ok: true, msg: data.message });
        setTitle(""); setMessage(""); setTarget("all"); setDiseaseTag("");
        // Refresh history
        const r2   = await fetch("/api/admin/broadcast");
        const d2   = await r2.json();
        if (d2.success) setHistory(d2.broadcasts);
      } else {
        setResult({ ok: false, msg: data.message || "Error" });
      }
    } catch { setResult({ ok: false, msg: "Network error" }); }
    setSending(false);
  }

  const fmtDate = (d: string) => d ? new Date(d).toLocaleString("en-IN", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }) : "—";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">🔔 Notifications Management</h1>
        <p className="text-xs text-gray-400 mt-0.5">Broadcast notification bhejo sabhi ya specific users ko</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Send form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <p className="font-bold text-gray-800">📤 Broadcast Notification</p>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Target Audience</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "all",     label: "All Users",    icon: "👥" },
                { value: "users",   label: "Patients",     icon: "🧑" },
                { value: "members", label: "Card Members", icon: "💳" },
                { value: "doctors", label: "Doctors",      icon: "🩺" },
              ].map((opt) => (
                <button key={opt.value}
                  onClick={() => setTarget(opt.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition ${target === opt.value ? "bg-teal-50 border-teal-300 text-teal-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  <span>{opt.icon}</span> {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
              Disease Filter <span className="text-gray-300 font-normal normal-case">(optional)</span>
            </label>
            <select value={diseaseTag} onChange={(e) => setDiseaseTag(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white">
              <option value="">No filter (send to all in target)</option>
              {DISEASE_TAGS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100}
              placeholder="e.g. New Health Article Available!"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            <p className="text-right text-xs text-gray-300 mt-0.5">{title.length}/100</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Message *</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={300} rows={3}
              placeholder="e.g. Diabetes se related nayi article publish hui hai. Abhi padhein!"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
            <p className="text-right text-xs text-gray-300 mt-0.5">{message.length}/300</p>
          </div>

          {result && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${result.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
              {result.ok ? "✓ " : "✗ "}{result.msg}
            </div>
          )}

          <button onClick={handleSend} disabled={sending || !title.trim() || !message.trim()}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
            {sending ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
            ) : "📤 Notification Bhejo"}
          </button>
        </div>

        {/* History */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="font-bold text-gray-800 mb-4">📋 Broadcast History</p>
          {hLoading ? (
            <Spinner />
          ) : history.length === 0 ? (
            <EmptyState icon="🔔" message="Koi broadcast nahi hua abhi tak" />
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {history.map((h: any, i: number) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-800 text-sm">{h._id}</p>
                    <span className="text-xs text-gray-400 shrink-0">{fmtDate(h.sentAt)}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{h.message}</p>
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500">📤 Sent: <strong>{h.totalSent}</strong></span>
                    <span className="text-xs text-gray-500">👁 Read: <strong>{h.readCount}</strong></span>
                    {h.totalSent > 0 && (
                      <span className="text-xs text-teal-600 font-semibold">
                        {Math.round((h.readCount / h.totalSent) * 100)}% open rate
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── SUPPORT TAB ───────────────────────────────────────────────────────────────
const SUPPORT_CATS: Record<string, { icon: string; label: string }> = {
  booking:         { icon: "📋", label: "Booking" },
  payment:         { icon: "💳", label: "Payment" },
  cancellation:    { icon: "❌", label: "Cancellation" },
  service:         { icon: "🏥", label: "Service" },
  home_collection: { icon: "🏍️", label: "Home Collection" },
  report:          { icon: "📄", label: "Reports" },
  account:         { icon: "👤", label: "Account/Wallet" },
  other:           { icon: "💬", label: "Other" },
};

const SUPPORT_STATUS: Record<string, { label: string; color: string; dot: string; active: string; idle: string }> = {
  open:        { label: "Open",        dot: "bg-blue-500",   color: "bg-blue-100 text-blue-700 border-blue-200",   active: "border-blue-400 bg-blue-600 text-white",   idle: "border-blue-100 bg-blue-50 text-blue-700"   },
  in_progress: { label: "In Progress", dot: "bg-amber-500",  color: "bg-amber-100 text-amber-700 border-amber-200", active: "border-amber-400 bg-amber-600 text-white",  idle: "border-amber-100 bg-amber-50 text-amber-700" },
  resolved:    { label: "Resolved",    dot: "bg-green-500",  color: "bg-green-100 text-green-700 border-green-200", active: "border-green-400 bg-green-600 text-white",  idle: "border-green-100 bg-green-50 text-green-700" },
  closed:      { label: "Closed",      dot: "bg-gray-400",   color: "bg-gray-100 text-gray-600 border-gray-200",   active: "border-gray-400 bg-gray-600 text-white",   idle: "border-gray-100 bg-gray-50 text-gray-600"   },
};
const SUPPORT_PRIORITY: Record<string, { label: string; color: string }> = {
  low:    { label: "Low",    color: "bg-gray-100 text-gray-500 border-gray-200" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-700 border-blue-200" },
  high:   { label: "High",   color: "bg-orange-100 text-orange-700 border-orange-200" },
  urgent: { label: "🚨 Urgent", color: "bg-red-100 text-red-700 border-red-200" },
};

function SupportTab() {
  const [tickets,        setTickets]        = useState<any[]>([]);
  const [stats,          setStats]          = useState<any>({ open: 0, in_progress: 0, resolved: 0, closed: 0 });
  const [loading,        setLoading]        = useState(false);
  const [page,           setPage]           = useState(1);
  const [totalPages,     setTotalPages]     = useState(1);
  const [total,          setTotal]          = useState(0);
  const [statusFilter,   setStatusFilter]   = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search,         setSearch]         = useState("");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [detailLoading,  setDetailLoading]  = useState(false);
  const [replyText,      setReplyText]      = useState("");
  const [replying,       setReplying]       = useState(false);
  const [newStatus,      setNewStatus]      = useState("");
  const [newPriority,    setNewPriority]    = useState("");
  const [updating,       setUpdating]       = useState(false);
  const [toast,          setToast]          = useState("");
  const [toastOk,        setToastOk]        = useState(true);
  const threadRef = useRef<HTMLDivElement>(null);

  function showToast(msg: string, ok = true) {
    setToast(msg); setToastOk(ok); setTimeout(() => setToast(""), 3000);
  }

  async function fetchTickets(pg = 1, sf = statusFilter, cf = categoryFilter, sq = search) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg), status: sf, category: cf });
      if (sq.trim()) params.set("search", sq.trim());
      const res  = await fetch(`/api/admin/support?${params}`);
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
        setStats(data.stats || {});
        setTotalPages(data.pages || 1);
        setTotal(data.total || 0);
        setPage(pg);
      }
    } finally { setLoading(false); }
  }

  async function fetchDetail(ticketId: string) {
    setDetailLoading(true);
    try {
      const res  = await fetch(`/api/support/${ticketId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedTicket(data.ticket);
        setNewStatus(data.ticket.status);
        setNewPriority(data.ticket.priority);
        setTimeout(() => threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" }), 100);
      }
    } finally { setDetailLoading(false); }
  }

  async function sendReply() {
    if (!replyText.trim() || !selectedTicket) return;
    setReplying(true);
    try {
      const res  = await fetch("/api/admin/support", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: selectedTicket.ticketId, message: replyText.trim(), status: newStatus, priority: newPriority }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Reply bhej diya!");
        setReplyText("");
        fetchDetail(selectedTicket.ticketId);
        fetchTickets(page);
      } else { showToast(data.message || "Error", false); }
    } catch { showToast("Network error", false); }
    finally { setReplying(false); }
  }

  async function updateTicket() {
    if (!selectedTicket) return;
    setUpdating(true);
    try {
      const res  = await fetch("/api/admin/support", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: selectedTicket.ticketId, status: newStatus, priority: newPriority }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Ticket updated!");
        fetchDetail(selectedTicket.ticketId);
        fetchTickets(page);
      } else { showToast(data.message || "Error", false); }
    } catch { showToast("Network error", false); }
    finally { setUpdating(false); }
  }

  useEffect(() => { fetchTickets(); }, []);

  const statCards = [
    { key: "open",        label: "Open",        icon: "📬" },
    { key: "in_progress", label: "In Progress", icon: "⚙️" },
    { key: "resolved",    label: "Resolved",    icon: "✅" },
    { key: "closed",      label: "Closed",      icon: "🔒" },
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-sm text-white font-semibold ${toastOk ? "bg-teal-700" : "bg-red-600"}`}>
          {toast}
        </div>
      )}

      <h2 className="text-xl font-bold text-gray-800 mb-5">🎧 Customer Care — Support Tickets</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {statCards.map(sc => {
          const cfg = SUPPORT_STATUS[sc.key];
          const isActive = statusFilter === sc.key;
          return (
            <button key={sc.key} onClick={() => { setStatusFilter(isActive ? "all" : sc.key); fetchTickets(1, isActive ? "all" : sc.key); }}
              className={`rounded-2xl border p-3 text-left transition hover:shadow-md ${isActive ? cfg.active : cfg.idle}`}>
              <p className="text-2xl font-black">{(stats[sc.key] || 0).toLocaleString("en-IN")}</p>
              <p className="text-[11px] font-bold mt-1 opacity-80">{sc.icon} {sc.label}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 mb-4 flex flex-wrap gap-3 items-center">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") fetchTickets(1, statusFilter, categoryFilter, search); }}
          placeholder="Search ticket ID / subject / booking..."
          className="flex-1 min-w-[180px] border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
        <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); fetchTickets(1, statusFilter, e.target.value); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
          <option value="all">All Categories</option>
          {Object.entries(SUPPORT_CATS).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>
        <button onClick={() => fetchTickets(1, statusFilter, categoryFilter, search)}
          className="bg-teal-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-teal-700 transition">
          🔍 Search
        </button>
        <button onClick={() => { setSearch(""); setStatusFilter("all"); setCategoryFilter("all"); fetchTickets(1, "all", "all", ""); }}
          className="text-sm text-gray-500 hover:text-gray-700 font-semibold px-2">
          ✕ Reset
        </button>
      </div>

      <div className="flex gap-4">
        {/* Ticket list */}
        <div className={`flex-1 min-w-0 ${selectedTicket ? "hidden md:block md:max-w-md" : ""}`}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" /></div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">Koi ticket nahi mila</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                        <th className="px-4 py-3 text-left">Ticket</th>
                        <th className="px-4 py-3 text-left">User</th>
                        <th className="px-4 py-3 text-left">Category</th>
                        <th className="px-4 py-3 text-center">Priority</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {tickets.map((t: any) => {
                        const sc  = SUPPORT_STATUS[t.status]   || SUPPORT_STATUS.open;
                        const pc  = SUPPORT_PRIORITY[t.priority] || SUPPORT_PRIORITY.medium;
                        const cat = SUPPORT_CATS[t.category]   || { icon: "💬", label: t.category };
                        const isSelected = selectedTicket?.ticketId === t.ticketId;
                        return (
                          <tr key={t._id}
                            className={`cursor-pointer transition ${isSelected ? "bg-teal-50" : "hover:bg-gray-50"}`}
                            onClick={() => fetchDetail(t.ticketId)}>
                            <td className="px-4 py-3">
                              <p className="text-xs font-black text-teal-700">{t.ticketId}</p>
                              {t.bookingRef && <p className="text-[10px] font-mono text-blue-500">{t.bookingRef}</p>}
                              <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1 max-w-[120px]">{t.subject}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-xs font-semibold text-gray-700">{t.userId?.name || "—"}</p>
                              <p className="text-[10px] text-gray-400">{t.userId?.mobile}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-gray-600">{cat.icon} {cat.label}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pc.color}`}>{pc.label}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.color}`}>
                                <span className={`inline-block w-1.5 h-1.5 rounded-full ${sc.dot} mr-1`} />
                                {sc.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                              {new Date(t.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-400">Page {page} of {totalPages} ({total} tickets)</p>
                    <div className="flex gap-2">
                      <button disabled={page <= 1} onClick={() => fetchTickets(page - 1)}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold disabled:opacity-40">← Prev</button>
                      <button disabled={page >= totalPages} onClick={() => fetchTickets(page + 1)}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold disabled:opacity-40">Next →</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selectedTicket && (
          <div className="w-full md:w-[420px] flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col" style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}>

              {/* Detail header */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-2 flex-shrink-0">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{selectedTicket.ticketId}</p>
                  <p className="text-sm font-bold text-gray-800 truncate mt-0.5">{selectedTicket.subject}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SUPPORT_STATUS[selectedTicket.status]?.color}`}>
                      {SUPPORT_STATUS[selectedTicket.status]?.label}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SUPPORT_PRIORITY[selectedTicket.priority]?.color}`}>
                      {SUPPORT_PRIORITY[selectedTicket.priority]?.label}
                    </span>
                    {selectedTicket.bookingRef && (
                      <span className="text-[10px] font-mono bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-full">
                        {selectedTicket.bookingRef}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    👤 {selectedTicket.userId?.name || "—"} · {selectedTicket.userId?.mobile || ""}
                  </p>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none flex-shrink-0">×</button>
              </div>

              {/* Admin controls */}
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex gap-2 flex-wrap flex-shrink-0">
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400">
                  <option value="open">📬 Open</option>
                  <option value="in_progress">⚙️ In Progress</option>
                  <option value="resolved">✅ Resolved</option>
                  <option value="closed">🔒 Closed</option>
                </select>
                <select value={newPriority} onChange={e => setNewPriority(e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">🚨 Urgent</option>
                </select>
                <button onClick={updateTicket} disabled={updating}
                  className="bg-gray-700 hover:bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-lg transition disabled:opacity-50">
                  {updating ? "..." : "Update"}
                </button>
              </div>

              {/* Thread */}
              {detailLoading ? (
                <div className="flex-1 flex justify-center items-center">
                  <div className="w-6 h-6 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                </div>
              ) : (
                <div ref={threadRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {(selectedTicket.messages || []).map((msg: any, idx: number) => {
                    const isAdmin = ["admin", "staff"].includes(msg.senderRole);
                    return (
                      <div key={msg._id || idx} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-2xl px-3 py-2.5 ${isAdmin ? "bg-teal-600 text-white rounded-tr-sm" : "bg-gray-100 text-gray-800 rounded-tl-sm"}`}>
                          <p className={`text-[10px] font-bold mb-1 ${isAdmin ? "text-teal-100" : "text-gray-500"}`}>
                            {isAdmin ? `🎧 ${msg.senderName || "Support"}` : `👤 ${msg.senderName || "User"}`}
                          </p>
                          <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                          <p className={`text-[9px] mt-1 text-right ${isAdmin ? "text-teal-200" : "text-gray-400"}`}>
                            {new Date(msg.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Reply input */}
              <div className="px-4 py-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="Reply likhein... (Enter to send)"
                  rows={2}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                />
                <button onClick={sendReply} disabled={replying || !replyText.trim()}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 rounded-xl disabled:opacity-50 transition flex-shrink-0">
                  {replying ? "..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── LAB REPORTS & INVOICES ADMIN TAB ─────────────────────────────────────────
const LAB_REPORT_STATUS_COLORS: Record<string, string> = {
  draft: "bg-amber-100 text-amber-700 border-amber-200",
  final: "bg-green-100 text-green-700 border-green-200",
};
const INV_STATUS_COLORS: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-600 border-gray-200",
  partial:   "bg-orange-100 text-orange-700 border-orange-200",
  paid:      "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

function LabReportsAdminTab() {
  const [subTab,         setSubTab]         = useState<"reports" | "invoices">("reports");

  // ── Lab Reports state ──
  const [reports,        setReports]        = useState<any[]>([]);
  const [rLoading,       setRLoading]       = useState(false);
  const [rSearch,        setRSearch]        = useState("");
  const [rStatus,        setRStatus]        = useState("");
  const [rPage,          setRPage]          = useState(1);
  const [rPages,         setRPages]         = useState(1);
  const [rTotal,         setRTotal]         = useState(0);
  const [rUpdating,      setRUpdating]      = useState<string | null>(null);

  // ── Invoices state ──
  const [invoices,       setInvoices]       = useState<any[]>([]);
  const [iLoading,       setILoading]       = useState(false);
  const [iSearch,        setISearch]        = useState("");
  const [iStatus,        setIStatus]        = useState("");
  const [iPage,          setIPage]          = useState(1);
  const [iPages,         setIPages]         = useState(1);
  const [iTotal,         setITotal]         = useState(0);

  // ── Fetch lab reports ──
  const fetchReports = useCallback(async () => {
    setRLoading(true);
    try {
      const params = new URLSearchParams({ page: String(rPage), limit: "20" });
      if (rSearch) params.set("search", rSearch);
      if (rStatus) params.set("status", rStatus);
      const res = await fetch(`/api/admin/lab-reports?${params}`);
      const d = await res.json();
      if (d.success) {
        setReports(d.reports || []);
        setRPages(d.pages || 1);
        setRTotal(d.total || 0);
      }
    } finally {
      setRLoading(false);
    }
  }, [rPage, rSearch, rStatus]);

  // ── Fetch invoices (admin sees all — iterate hospitals or use query) ──
  const fetchInvoices = useCallback(async () => {
    setILoading(true);
    try {
      const params = new URLSearchParams({ page: String(iPage), limit: "20" });
      if (iSearch) params.set("search", iSearch);
      if (iStatus) params.set("status", iStatus);
      params.set("all", "1"); // admin flag
      const res = await fetch(`/api/hospital/invoice?${params}`);
      const d = await res.json();
      if (d.success) {
        setInvoices(d.invoices || []);
        setIPages(d.pages || 1);
        setITotal(d.total || 0);
      }
    } finally {
      setILoading(false);
    }
  }, [iPage, iSearch, iStatus]);

  useEffect(() => { if (subTab === "reports") fetchReports(); }, [subTab, fetchReports]);
  useEffect(() => { if (subTab === "invoices") fetchInvoices(); }, [subTab, fetchInvoices]);

  // ── Finalize report ──
  async function finalizeReport(reportId: string) {
    if (!confirm("Mark this report as Final?")) return;
    setRUpdating(reportId);
    try {
      const res = await fetch("/api/admin/lab-reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, status: "final" }),
      });
      const d = await res.json();
      if (d.success) {
        setReports(prev => prev.map(r => r.reportId === reportId ? { ...r, status: "final" } : r));
      } else {
        alert(d.message || "Update failed");
      }
    } finally {
      setRUpdating(null);
    }
  }

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const fmtAmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">🧾 Lab Reports & Invoices</h2>
          <p className="text-sm text-gray-500 mt-0.5">View and manage all lab reports and invoices across hospitals</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {([["reports", "🧬 Lab Reports"], ["invoices", "🧾 Invoices"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition ${subTab === key ? "border-teal-600 text-teal-700 bg-teal-50" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Lab Reports sub-tab ── */}
      {subTab === "reports" && (
        <div>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex-1 min-w-[200px]">
              <SearchBar value={rSearch} onChange={v => { setRSearch(v); setRPage(1); }} placeholder="Search patient, report ID, template..." />
            </div>
            <select
              value={rStatus}
              onChange={e => { setRStatus(e.target.value); setRPage(1); }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="final">Final</option>
            </select>
            <button onClick={fetchReports} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition">Refresh</button>
          </div>

          {rLoading ? <Spinner /> : reports.length === 0 ? (
            <EmptyState icon="🧬" message="No lab reports found" />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Report ID", "Patient", "Test", "Hospital", "Collection Date", "Status", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reports.map((r: any) => (
                    <tr key={r._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-mono text-xs text-teal-700 font-semibold">{r.reportId}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{r.patientName}</p>
                        <p className="text-xs text-gray-400">{r.patientAge ? `${r.patientAge}y` : ""} {r.patientGender || ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-700">{r.templateName}</p>
                        <p className="text-xs text-gray-400">{r.category}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{r.hospitalName || "—"}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{fmt(r.collectionDate)}</td>
                      <td className="px-4 py-3">
                        <Badge color={LAB_REPORT_STATUS_COLORS[r.status] || "bg-gray-100 text-gray-600"}>
                          {r.status === "final" ? "✅ Final" : "📝 Draft"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <a
                            href={`/lab-report/${r.reportId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-3 py-1.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-100 transition font-semibold"
                          >
                            🖨️ Print
                          </a>
                          {r.status === "draft" && (
                            <button
                              onClick={() => finalizeReport(r.reportId)}
                              disabled={rUpdating === r.reportId}
                              className="text-xs px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition font-semibold disabled:opacity-50"
                            >
                              {rUpdating === r.reportId ? "..." : "✅ Finalize"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3">
                <Pagination page={rPage} pages={rPages} total={rTotal} onPage={setRPage} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Invoices sub-tab ── */}
      {subTab === "invoices" && (
        <div>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex-1 min-w-[200px]">
              <SearchBar value={iSearch} onChange={v => { setISearch(v); setIPage(1); }} placeholder="Search invoice no., patient, hospital..." />
            </div>
            <select
              value={iStatus}
              onChange={e => { setIStatus(e.target.value); setIPage(1); }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button onClick={fetchInvoices} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition">Refresh</button>
          </div>

          {iLoading ? <Spinner /> : invoices.length === 0 ? (
            <EmptyState icon="🧾" message="No invoices found" />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Invoice No.", "Patient", "Hospital", "Date", "Total", "Paid", "Balance", "Status", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.map((inv: any) => (
                    <tr key={inv._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-mono text-xs text-teal-700 font-semibold">{inv.invoiceId}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{inv.patientName}</p>
                        <p className="text-xs text-gray-400">{inv.patientMobile}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{inv.hospitalName || "—"}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{fmt(inv.invoiceDate)}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{fmtAmt(inv.totalAmount)}</td>
                      <td className="px-4 py-3 font-semibold text-green-700">{fmtAmt(inv.paidAmount)}</td>
                      <td className="px-4 py-3 font-semibold text-red-600">{fmtAmt(inv.balanceAmount)}</td>
                      <td className="px-4 py-3">
                        <Badge color={INV_STATUS_COLORS[inv.status] || "bg-gray-100 text-gray-600"}>
                          {inv.status === "paid" ? "✅ Paid" : inv.status === "partial" ? "🔶 Partial" : inv.status === "draft" ? "📝 Draft" : "❌ Cancelled"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`/invoice/${inv.invoiceId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-1.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-100 transition font-semibold"
                        >
                          🖨️ Print
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3">
                <Pagination page={iPage} pages={iPages} total={iTotal} onPage={setIPage} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed]     = useState(false);
  const [adminName, setAdminName] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [stats, setStats]       = useState<any>(null);
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null);
  const [managingHospital, setManagingHospital] = useState<{ _id: string; name: string } | null>(null);

  useEffect(() => {
    const id   = localStorage.getItem("adminId");
    const name = localStorage.getItem("adminName");
    if (id) { setAdminName(name || "Admin"); setAuthed(true); }
  }, []);

  const fetchStats = useCallback(async () => {
    const res  = await fetch("/api/admin?page=1");
    const data = await res.json();
    if (data.success) setStats(data.stats);
  }, []);

  useEffect(() => { if (authed) fetchStats(); }, [authed]);

  function logout() {
    localStorage.removeItem("adminId"); localStorage.removeItem("adminName");
    setAuthed(false); setAdminName("");
  }

  if (!authed) {
    return <AdminLogin onLogin={(_, name) => { setAdminName(name); setAuthed(true); }} />;
  }

  const NAV: { key: Tab; icon: string; label: string; badge?: number }[] = [
    { key: "overview",  icon: "📊", label: "Overview"          },
    { key: "members",   icon: "👥", label: "Members",   badge: stats?.totalUsers        },
    { key: "hospitals", icon: "🏥", label: "Hospitals",  badge: stats?.pendingHospitals  },
    { key: "doctors",   icon: "🩺", label: "Doctors",    badge: stats?.pendingDoctors    },
    { key: "packages",  icon: "📦", label: "Surgery Packages", badge: stats?.totalPackages },
    { key: "labtests",  icon: "🧪", label: "Lab Tests",  badge: stats?.totalLabTests     },
    { key: "bookings",  icon: "📋", label: "Bookings",   badge: stats?.bookings?.pending },
    { key: "staff",     icon: "👔", label: "Staff"                                       },
    { key: "promo",         icon: "🎟️", label: "Promo Codes"                            },
    { key: "reports",       icon: "📈", label: "Revenue Reports"                        },
    { key: "accounting",    icon: "💰", label: "Accounting"                             },
    { key: "coordinators",  icon: "🤝", label: "Coordinators"                           },
    { key: "ledger",        icon: "📒", label: "Master Ledger"                          },
    { key: "labreports",    icon: "🧾", label: "Lab Reports & Invoices"                         },
    { key: "support",       icon: "🎧", label: "Customer Care",  badge: stats?.openSupportTickets },
    { key: "ambulance",     icon: "🚑", label: "Ambulance"                              },
    { key: "articles",      icon: "📰", label: "Articles"                               },
    { key: "notifications", icon: "🔔", label: "Notifications"                          },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* Patient drawer */}
      {drawerUserId && <PatientDrawer userId={drawerUserId} onClose={() => setDrawerUserId(null)} />}

      {/* ── Sidebar ── */}
      <aside className="w-60 bg-teal-700 text-white flex flex-col fixed h-full z-10">
        <div className="p-5 border-b border-teal-600">
          <p className="text-xs text-teal-300 font-medium uppercase tracking-wider">Brims Hospitals</p>
          <p className="font-bold text-lg mt-0.5">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map(({ key, icon, label, badge }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === key ? "bg-white/20 text-white" : "text-teal-200 hover:bg-white/10 hover:text-white"}`}>
              <span className="flex items-center gap-3"><span>{icon}</span>{label}</span>
              {badge !== undefined && badge > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${key === "hospitals" || key === "doctors" || key === "bookings" ? "bg-amber-400 text-amber-900" : "bg-white/20 text-white"}`}>
                  {badge}
                </span>
              )}
            </button>
          ))}

          <div className="pt-3 border-t border-teal-600 mt-2 space-y-1">
            <p className="text-xs text-teal-400 px-4 pb-1 font-medium uppercase">Quick Links</p>
            {[
              { href: "/",               icon: "🏠", label: "Home Page"       },
              { href: "/opd-booking",    icon: "🩺", label: "OPD Booking"     },
              { href: "/lab-tests",      icon: "🧪", label: "Lab Tests"       },
              { href: "/surgery-packages", icon: "🏥", label: "Surgery"       },
              { href: "/my-bookings",    icon: "📋", label: "My Bookings"     },
              { href: "/staff-login",    icon: "👔", label: "Staff Login"     },
              { href: "/doctor-register", icon: "🩺", label: "Doctor Register"},
              { href: "/dashboard",      icon: "👤", label: "User Dashboard"  },
            ].map(({ href, icon, label }) => (
              <a key={href} href={href} className="flex items-center gap-3 px-4 py-2 rounded-xl text-xs text-teal-200 hover:bg-white/10 hover:text-white transition">
                <span>{icon}</span>{label}
              </a>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-teal-600">
          <p className="text-xs text-teal-300 mb-0.5">Logged in as</p>
          <p className="text-sm font-semibold truncate">{adminName}</p>
          <button onClick={logout} className="mt-2 text-xs text-red-300 hover:text-red-100 transition">Logout →</button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="ml-60 flex-1 p-6 min-h-screen">
        {activeTab === "overview"  && <OverviewTab stats={stats} onNavigate={setActiveTab} />}
        {activeTab === "members"   && <MembersTab onOpenPatient={setDrawerUserId} />}
        {activeTab === "hospitals" && <HospitalsTab onRefreshStats={fetchStats} onManageHospital={setManagingHospital} />}
        {activeTab === "doctors"   && <DoctorsTab onRefreshStats={fetchStats} />}
        {activeTab === "packages"  && <PackagesTab />}
        {activeTab === "labtests"  && <LabTestsTab />}
        {activeTab === "bookings"  && <BookingsTab onOpenPatient={setDrawerUserId} />}
        {activeTab === "staff"     && <StaffTab />}
        {activeTab === "promo"         && <PromoCodesTab />}
        {activeTab === "reports"       && <RevenueReportsTab />}
        {activeTab === "accounting"    && <AccountingTab />}
        {activeTab === "coordinators"  && <CoordinatorsTab />}
        {activeTab === "ledger"        && <LedgerTab />}
        {activeTab === "labreports"    && <LabReportsAdminTab />}
        {activeTab === "support"       && <SupportTab />}
        {activeTab === "ambulance"     && <AmbulanceTab />}
        {activeTab === "articles"      && <ArticlesTab />}
        {activeTab === "notifications" && <NotificationsTab />}
      </main>

      {/* Hospital Manage Panel overlay */}
      {managingHospital && (
        <HospitalManagePanel hospital={managingHospital} onClose={() => setManagingHospital(null)} />
      )}
    </div>
  );
}
