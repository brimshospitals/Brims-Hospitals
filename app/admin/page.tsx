"use client";
import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "overview" | "members" | "hospitals" | "doctors" | "packages" | "labtests" | "bookings" | "staff";

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
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/hospitals?detail=${hospitalId}`).then((r) => r.json())
      .then((d) => { if (d.success) setData(d); }).finally(() => setLoading(false));
  }, [hospitalId]);

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
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── TAB: Overview ─────────────────────────────────────────────────────────────
function OverviewTab({ stats, onNavigate }: { stats: any; onNavigate: (tab: Tab) => void }) {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">📊 Overview</h1>

      {/* Entity counts */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Members",          value: stats?.totalUsers,     icon: "👥", bg: "bg-blue-50",   text: "text-blue-700",   tab: "members"   as Tab },
          { label: "Verified Hospitals",value: stats?.totalHospitals, icon: "🏥", bg: "bg-purple-50", text: "text-purple-700", tab: "hospitals" as Tab },
          { label: "Active Doctors",    value: stats?.totalDoctors,   icon: "🩺", bg: "bg-teal-50",   text: "text-teal-700",   tab: "doctors"   as Tab },
          { label: "Surgery Packages",  value: stats?.totalPackages,  icon: "📦", bg: "bg-orange-50", text: "text-orange-700", tab: "packages"  as Tab },
          { label: "Lab Tests",         value: stats?.totalLabTests,  icon: "🧪", bg: "bg-yellow-50", text: "text-yellow-700", tab: "labtests"  as Tab },
        ].map(({ label, value, icon, bg, text, tab }) => (
          <button key={label} onClick={() => onNavigate(tab)}
            className={`${bg} rounded-2xl p-5 text-left hover:shadow-md transition-all group cursor-pointer`}>
            <p className="text-2xl mb-1">{icon}</p>
            <p className={`text-3xl font-bold ${text}`}>{value ?? "—"}</p>
            <p className={`text-xs font-medium mt-1 ${text} opacity-70`}>{label}</p>
            <p className="text-xs text-gray-400 mt-0.5 opacity-0 group-hover:opacity-100 transition">Click to manage →</p>
          </button>
        ))}
      </div>

      {/* Pending alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats?.pendingHospitals > 0 && (
          <button onClick={() => onNavigate("hospitals")}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4 hover:bg-amber-100 transition text-left">
            <div className="w-12 h-12 bg-amber-200 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🏥</div>
            <div>
              <p className="font-bold text-amber-800">{stats.pendingHospitals} Hospital{stats.pendingHospitals > 1 ? "s" : ""} Pending Verification</p>
              <p className="text-xs text-amber-600 mt-0.5">Click to review and approve →</p>
            </div>
          </button>
        )}
        {stats?.pendingDoctors > 0 && (
          <button onClick={() => onNavigate("doctors")}
            className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-4 hover:bg-blue-100 transition text-left">
            <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🩺</div>
            <div>
              <p className="font-bold text-blue-800">{stats.pendingDoctors} Doctor{stats.pendingDoctors > 1 ? "s" : ""} Pending Approval</p>
              <p className="text-xs text-blue-600 mt-0.5">Click to review and activate →</p>
            </div>
          </button>
        )}
      </div>

      {/* Booking stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Bookings",  value: stats?.bookings?.total,     bg: "bg-white",      text: "text-gray-800",     tab: "bookings" as Tab },
          { label: "Pending",         value: stats?.bookings?.pending,   bg: "bg-yellow-50",  text: "text-yellow-700",   tab: "bookings" as Tab },
          { label: "Confirmed",       value: stats?.bookings?.confirmed, bg: "bg-green-50",   text: "text-green-700",    tab: "bookings" as Tab },
          { label: "Completed",       value: stats?.bookings?.completed, bg: "bg-teal-50",    text: "text-teal-700",     tab: "bookings" as Tab },
          { label: "Revenue (Paid)",  value: `₹${(stats?.revenue?.paid || 0).toLocaleString()}`, bg: "bg-emerald-50", text: "text-emerald-700", tab: "bookings" as Tab },
        ].map(({ label, value, bg, text, tab }) => (
          <button key={label} onClick={() => onNavigate(tab)}
            className={`${bg} border border-gray-100 rounded-2xl p-5 shadow-sm text-left hover:shadow-md transition-all`}>
            <p className={`text-3xl font-bold ${text}`}>{value ?? "—"}</p>
            <p className={`text-xs font-medium mt-1 ${text} opacity-70`}>{label}</p>
          </button>
        ))}
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

  async function toggleActive(userId: string, current: boolean) {
    setToggling(userId);
    await fetch("/api/admin/members", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, isActive: !current }) });
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
                {members.map((m) => (
                  <tr key={m._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {m.photo ? <img src={m.photo} alt={m.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" /> : <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm flex-shrink-0">{m.name?.[0]}</div>}
                        <div><p className="font-semibold text-gray-800">{m.name}</p><p className="text-xs text-gray-400">{m.age} yrs · {m.gender}</p></div>
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
                      <Toggle value={m.isActive} onChange={() => toggleActive(m._id, m.isActive)} disabled={toggling === m._id} />
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => onOpenPatient(m._id)} className="text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-lg font-semibold transition">
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

// ── TAB: Hospitals ────────────────────────────────────────────────────────────
function HospitalsTab({ onRefreshStats }: { onRefreshStats: () => void }) {
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
                        <div className="flex gap-2">
                          <button onClick={() => setDetailId(h._id)} className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-lg font-semibold transition">👁 View</button>
                          {!h.isVerified && (
                            <button onClick={() => handleVerify(h._id, true)} disabled={verifying === h._id} className="text-xs bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded-lg font-semibold transition disabled:opacity-50">✓ Verify</button>
                          )}
                          {h.isVerified && (
                            <button onClick={() => handleVerify(h._id, false)} disabled={verifying === h._id} className="text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2.5 py-1 rounded-lg font-semibold transition disabled:opacity-50">✗ Revoke</button>
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
  const [form, setForm] = useState({ name: "", mobile: "", email: "", department: "", speciality: "", degrees: "", experience: "", opdFee: "", hospitalId: "", isActive: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.SyntheticEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    const res  = await fetch("/api/admin/doctors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, experience: Number(form.experience), opdFee: Number(form.opdFee) }) });
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
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 rounded-t-2xl flex items-center justify-between flex-shrink-0">
            <div><p className="text-xs text-blue-200 font-medium uppercase tracking-wide">Admin Panel</p><h2 className="text-white font-bold text-lg">Add New Doctor</h2></div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">✕</button>
          </div>
          <form onSubmit={submit} className="flex-1 overflow-y-auto p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Full Name" required><input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Dr. Arjun Singh" required /></FormField>
              <FormField label="Mobile"><input className={inputCls} value={form.mobile} onChange={(e) => set("mobile", e.target.value.replace(/\D/g,""))} maxLength={10} placeholder="10-digit" /></FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Department" required><input className={inputCls} value={form.department} onChange={(e) => set("department", e.target.value)} placeholder="Cardiology" required /></FormField>
              <FormField label="Speciality"><input className={inputCls} value={form.speciality} onChange={(e) => set("speciality", e.target.value)} placeholder="Heart Surgery" /></FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="OPD Fee (₹)" required><input className={inputCls} type="number" min="0" value={form.opdFee} onChange={(e) => set("opdFee", e.target.value)} placeholder="500" required /></FormField>
              <FormField label="Experience (years)"><input className={inputCls} type="number" min="0" value={form.experience} onChange={(e) => set("experience", e.target.value)} placeholder="10" /></FormField>
            </div>
            <FormField label="Degrees (comma-separated)"><input className={inputCls} value={form.degrees} onChange={(e) => set("degrees", e.target.value)} placeholder="MBBS, MD, DM" /></FormField>
            <FormField label="Email"><input className={inputCls} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="doctor@email.com" /></FormField>
            <FormField label="Assign Hospital">
              <select className={selectCls} value={form.hospitalId} onChange={(e) => set("hospitalId", e.target.value)}>
                <option value="">— Select Hospital (optional) —</option>
                {hospitals.map((h: any) => <option key={h._id} value={h._id}>{h.name}</option>)}
              </select>
            </FormField>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="rounded" />
              Directly activate (skip pending approval)
            </label>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 border border-red-100">{error}</p>}
          </form>
          <div className="p-5 border-t border-gray-100 flex gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
            <button onClick={submit} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">{loading ? "Adding..." : "Add Doctor"}</button>
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

// ── Modal: Add Staff ──────────────────────────────────────────────────────────
function AddStaffModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: "", mobile: "", age: "", gender: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.SyntheticEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    const res  = await fetch("/api/admin/staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, age: Number(form.age) }) });
    const data = await res.json();
    if (data.success) { onSaved(); onClose(); }
    else setError(data.message);
    setLoading(false);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-5 rounded-t-2xl flex items-center justify-between">
            <div><p className="text-xs text-purple-200 font-medium uppercase tracking-wide">Admin Panel</p><h2 className="text-white font-bold text-lg">Add Staff Member</h2></div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">✕</button>
          </div>
          <form onSubmit={submit} className="p-5 space-y-3">
            <FormField label="Full Name" required><input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Staff member name" required /></FormField>
            <FormField label="Mobile Number" required>
              <div className="flex border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-teal-400">
                <span className="bg-gray-50 text-gray-500 px-3 flex items-center text-sm border-r border-gray-200">+91</span>
                <input className="flex-1 px-3 py-2.5 text-sm outline-none" value={form.mobile} onChange={(e) => set("mobile", e.target.value.replace(/\D/g,""))} maxLength={10} placeholder="10-digit number" required />
              </div>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Age" required><input className={inputCls} type="number" min="18" max="70" value={form.age} onChange={(e) => set("age", e.target.value)} placeholder="25" required /></FormField>
              <FormField label="Gender" required>
                <select className={selectCls} value={form.gender} onChange={(e) => set("gender", e.target.value)} required>
                  <option value="">— Select —</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </FormField>
            </div>
            <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">Staff member OTP se login kar sakenge apne mobile number se.</p>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 border border-red-100">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">{loading ? "Adding..." : "Add Staff"}</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ── TAB: Staff ────────────────────────────────────────────────────────────────
function StaffTab() {
  const [staff, setStaff]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(1);
  const [meta, setMeta]           = useState<any>({});
  const [toggling, setToggling]   = useState<string | null>(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [toast, setToast]         = useState("");

  const fetch_ = useCallback(async (pg = 1) => {
    setLoading(true);
    const p = new URLSearchParams({ page: pg.toString() });
    if (search) p.set("search", search);
    const res  = await fetch(`/api/admin/staff?${p}`);
    const data = await res.json();
    if (data.success) { setStaff(data.staff); setMeta({ total: data.total, pages: data.pages }); }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetch_(1); setPage(1); }, [search]);

  async function toggleActive(userId: string, current: boolean) {
    setToggling(userId);
    const res  = await fetch("/api/admin/staff", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, isActive: !current }) });
    const data = await res.json();
    if (data.success) { setToast(data.message); fetch_(page); }
    setTimeout(() => setToast(""), 3000);
    setToggling(null);
  }

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <div className="space-y-4">
      {toast && <div className="fixed top-4 right-4 z-50 bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg">{toast}</div>}
      {showAdd && <AddStaffModal onClose={() => setShowAdd(false)} onSaved={() => { fetch_(1); setToast("Staff member add ho gaya!"); setTimeout(() => setToast(""), 3000); }} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-800">👔 Staff Members</h1>
        <div className="flex gap-2 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Name / Mobile..." />
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
            <span className="text-base leading-none">+</span> Add Staff
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <Spinner /> : staff.length === 0 ? <EmptyState icon="👔" message="Koi staff member nahi mila" /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Staff Member", "Mobile", "Age / Gender", "Member ID", "Joined", "Active"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {staff.map((s) => (
                    <tr key={s._id} className={`hover:bg-gray-50 transition ${!s.isActive ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {s.photo ? <img src={s.photo} alt={s.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" /> : <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0">{s.name?.[0]}</div>}
                          <p className="font-semibold text-gray-800">{s.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">📱 {s.mobile}</td>
                      <td className="px-4 py-3 text-gray-600">{s.age} yrs · <span className="capitalize">{s.gender}</span></td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{s.memberId || "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(s.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Toggle value={s.isActive} onChange={() => toggleActive(s._id, s.isActive)} disabled={toggling === s._id} />
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
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">{b.bookingId}</span>
                        <span className="text-[10px] text-gray-400">{fmtDate(b.createdAt)}</span>
                        {b.userId?._id && (
                          <button onClick={() => onOpenPatient(b.userId._id)} className="text-[10px] bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-md font-semibold transition">👁 Patient</button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {b.status === "pending" && <button onClick={() => updateBooking(b.bookingId, "confirmed")} disabled={updating === b.bookingId} className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50 transition">✓ Confirm</button>}
                        {(b.status === "pending" || b.status === "confirmed") && <button onClick={() => updateBooking(b.bookingId, "completed", "paid")} disabled={updating === b.bookingId} className="text-xs bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50 transition">✓ Complete</button>}
                        {b.status !== "cancelled" && b.status !== "completed" && <button onClick={() => updateBooking(b.bookingId, "cancelled")} disabled={updating === b.bookingId} className="text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50 transition">✗ Cancel</button>}
                        {b.paymentStatus !== "paid" && b.status !== "cancelled" && <button onClick={() => updateBooking(b.bookingId, undefined, "paid")} disabled={updating === b.bookingId} className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50 transition">💰 Mark Paid</button>}
                      </div>
                    </div>
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
// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed]     = useState(false);
  const [adminName, setAdminName] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [stats, setStats]       = useState<any>(null);
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null);

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
        {activeTab === "hospitals" && <HospitalsTab onRefreshStats={fetchStats} />}
        {activeTab === "doctors"   && <DoctorsTab onRefreshStats={fetchStats} />}
        {activeTab === "packages"  && <PackagesTab />}
        {activeTab === "labtests"  && <LabTestsTab />}
        {activeTab === "bookings"  && <BookingsTab onOpenPatient={setDrawerUserId} />}
        {activeTab === "staff"     && <StaffTab />}
      </main>
    </div>
  );
}
