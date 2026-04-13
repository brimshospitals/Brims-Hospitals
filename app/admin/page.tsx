"use client";
import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "overview" | "members" | "hospitals" | "doctors" | "packages" | "labtests" | "bookings" | "staff" | "promo" | "reports" | "accounting" | "ambulance" | "articles" | "notifications";

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

  useEffect(() => {
    setALoading(true);
    fetch(`/api/admin/analytics?days=${trendDays}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setAnalytics(d.analytics); })
      .finally(() => setALoading(false));
  }, [trendDays]);

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
  const [form, setForm]       = useState({ name: "", mobile: "", email: "", department: "", speciality: "", degrees: "", experience: "", opdFee: "", isActive: true });
  const [hospMode, setHospMode] = useState<"network"|"private">("network");
  const [hospitalId, setHospitalId] = useState("");
  const [privateHospName, setPrivateHospName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.SyntheticEvent) {
    e.preventDefault(); setError("");
    if (!form.name || !form.department || !form.opdFee) { setError("Name, department aur OPD fee zaruri hai"); return; }
    if (hospMode === "network" && !hospitalId)            { setError("Hospital select karein ya Private choose karein"); return; }
    if (hospMode === "private" && !privateHospName.trim()){ setError("Private clinic ka naam daalo"); return; }
    setLoading(true);
    const payload = {
      ...form,
      experience:   Number(form.experience),
      opdFee:       Number(form.opdFee),
      hospitalId:   hospMode === "network" ? hospitalId : undefined,
      hospitalName: hospMode === "private" ? privateHospName.trim() : undefined,
    };
    const res  = await fetch("/api/admin/doctors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (data.success) { onSaved(); onClose(); }
    else setError(data.message);
    setLoading(false);
  }

  const selectedHosp = hospitals.find((h: any) => h._id === hospitalId);

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

            {/* Hospital association — required */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Hospital / Clinic Association *</p>
              <div className="flex gap-2 mb-2">
                {(["network","private"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setHospMode(m)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${hospMode === m ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
                    {m === "network" ? "🏥 Brims Network" : "🏠 Private Clinic"}
                  </button>
                ))}
              </div>
              {hospMode === "network" ? (
                <>
                  <select className={selectCls} value={hospitalId} onChange={(e) => setHospitalId(e.target.value)}>
                    <option value="">— Hospital chunein —</option>
                    {hospitals.map((h: any) => <option key={h._id} value={h._id}>{h.name}{h.address?.district ? ` (${h.address.district})` : ""}</option>)}
                  </select>
                  {selectedHosp && (
                    <p className="text-xs text-blue-600 mt-1 pl-1">✓ {selectedHosp.name}</p>
                  )}
                </>
              ) : (
                <input className={inputCls} value={privateHospName} onChange={(e) => setPrivateHospName(e.target.value)} placeholder="Clinic / Hospital naam" />
              )}
            </div>

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

function StaffTab() {
  const [subTab, setSubTab]           = useState<"members" | "accounting">("members");
  const [staff, setStaff]             = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [page, setPage]               = useState(1);
  const [meta, setMeta]               = useState<any>({});
  const [toggling, setToggling]       = useState<string | null>(null);
  const [showAdd, setShowAdd]         = useState(false);
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
    if (data.success) { setToast(data.message); fetch_(page); }
    setTimeout(() => setToast(""), 3000);
    setToggling(null);
  }

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <div className="space-y-4">
      {toast && <div className="fixed top-4 right-4 z-50 bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg">{toast}</div>}
      {showAdd && <AddStaffModal onClose={() => setShowAdd(false)} onSaved={() => { fetch_(1); setToast("Staff member add ho gaya!"); setTimeout(() => setToast(""), 3000); }} />}

      {/* Sub-tab switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setSubTab("members")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${subTab === "members" ? "bg-white shadow text-purple-700" : "text-gray-500 hover:text-gray-700"}`}>
            👔 Staff Members
          </button>
          <button onClick={() => setSubTab("accounting")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${subTab === "accounting" ? "bg-white shadow text-purple-700" : "text-gray-500 hover:text-gray-700"}`}>
            💰 Accounting
          </button>
        </div>
        {subTab === "members" && (
          <div className="flex gap-2 flex-wrap">
            <SearchBar value={search} onChange={setSearch} placeholder="Name / Mobile..." />
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
              <span className="text-base leading-none">+</span> Add Staff
            </button>
          </div>
        )}
      </div>

      {subTab === "accounting" ? <StaffAccountingView /> : (
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
  const [payoutModal,setPayoutModal] = useState<any>(null); // { hospitalId, hospitalName, pendingAmt }
  const [payoutRef,  setPayoutRef]  = useState("");
  const [payoutDate, setPayoutDate] = useState(new Date().toISOString().split("T")[0]);
  const [payoutLoading,setPayoutLoading] = useState(false);

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

  useEffect(() => { fetchSummary(); }, []);
  useEffect(() => {
    if (view === "commissions") fetchCommissions(1);
  }, [view, filterHosp, filterStatus]);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-teal-700 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">💰 Accounting</h2>
          <p className="text-sm text-gray-500">Hospital commissions aur payouts manage karein</p>
        </div>
        <button
          onClick={syncCommissions}
          disabled={syncing}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 flex items-center gap-2"
        >
          {syncing ? (
            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Syncing...</>
          ) : (
            <>🔄 Sync Bookings</>
          )}
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Revenue",      value: fmtAmt(summary.totalGross),    icon: "💵", color: "text-teal-700 bg-teal-50 border-teal-100" },
            { label: "Brims Commission",   value: fmtAmt(summary.totalComm),     icon: "🏢", color: "text-blue-700 bg-blue-50 border-blue-100" },
            { label: "Hospital Earnings",  value: fmtAmt(summary.totalHospital), icon: "🏥", color: "text-purple-700 bg-purple-50 border-purple-100" },
            { label: "Pending Payout",     value: fmtAmt(summary.pendingPayout), icon: "⏳", color: "text-amber-700 bg-amber-50 border-amber-100" },
          ].map((c) => (
            <div key={c.label} className={`rounded-2xl border p-4 ${c.color}`}>
              <p className="text-2xl mb-1">{c.icon}</p>
              <p className="text-xl font-black">{c.value}</p>
              <p className="text-xs font-semibold mt-0.5 opacity-70">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* View toggle */}
      <div className="flex gap-2 border-b border-gray-100 pb-3">
        {(["summary", "commissions"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${view === v ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {v === "summary" ? "🏥 Hospital-wise" : "📋 Commission Records"}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ── Summary View: hospital breakdown ── */}
      {!loading && view === "summary" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 bg-gray-50">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Hospital-wise Breakdown</p>
          </div>
          {byHospital.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              <p className="text-3xl mb-2">📊</p>
              Koi data nahi — "Sync Bookings" button dabayein pehle
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                    <th className="px-4 py-3 text-left">Hospital</th>
                    <th className="px-4 py-3 text-right">Bookings</th>
                    <th className="px-4 py-3 text-right">Gross Revenue</th>
                    <th className="px-4 py-3 text-right">Brims Commission</th>
                    <th className="px-4 py-3 text-right">Hospital Amt</th>
                    <th className="px-4 py-3 text-right">Pending Payout</th>
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
                      <td className="px-4 py-3 text-right">
                        {h.pendingAmt > 0 ? (
                          <span className="text-amber-700 font-bold">{fmtAmt(h.pendingAmt)}</span>
                        ) : (
                          <span className="text-green-600 text-xs font-semibold">✓ Cleared</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {h.pendingAmt > 0 && (
                          <button
                            onClick={() => setPayoutModal({ hospitalId: h._id, hospitalName: h.hospitalName, pendingAmt: h.pendingAmt })}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition"
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Commission Records View ── */}
      {!loading && view === "commissions" && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
                  {commissions.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Koi records nahi</td></tr>
                  ) : (
                    commissions.map((c: any) => (
                      <tr key={c._id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <p className="font-mono text-xs text-gray-600">{c.bookingRef}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{c.type}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-700 text-xs">{c.hospitalName || "—"}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmtAmt(c.grossAmount)}</td>
                        <td className="px-4 py-3 text-right text-blue-700 text-xs">
                          {fmtAmt(c.commissionAmt)}
                          <span className="text-gray-400 ml-1">({c.commissionPct}%)</span>
                        </td>
                        <td className="px-4 py-3 text-right text-purple-700 font-semibold">{fmtAmt(c.hospitalAmt)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${PAYOUT_STATUS_COLORS[c.payoutStatus]}`}>
                            {c.payoutStatus}
                          </span>
                          {c.payoutRef && <p className="text-[10px] text-gray-400 mt-0.5">{c.payoutRef}</p>}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-gray-400">{fmtDate(c.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > 20 && (
              <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between text-sm text-gray-500">
                <span>{total} records</span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); fetchCommissions(p); }}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">← Prev</button>
                  <button disabled={page >= Math.ceil(total/20)} onClick={() => { const p = page + 1; setPage(p); fetchCommissions(p); }}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">Next →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Payout Modal ── */}
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
                  <input
                    value={payoutRef}
                    onChange={(e) => setPayoutRef(e.target.value)}
                    placeholder="Bank transfer UTR ya UPI ref"
                    className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payout Date</label>
                  <input
                    type="date"
                    value={payoutDate}
                    onChange={(e) => setPayoutDate(e.target.value)}
                    className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setPayoutModal(null)}
                  className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold">Cancel</button>
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
    { key: "promo",         icon: "🎟️", label: "Promo Codes"                            },
    { key: "reports",       icon: "📈", label: "Revenue Reports"                        },
    { key: "accounting",    icon: "💰", label: "Accounting"                             },
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
        {activeTab === "hospitals" && <HospitalsTab onRefreshStats={fetchStats} />}
        {activeTab === "doctors"   && <DoctorsTab onRefreshStats={fetchStats} />}
        {activeTab === "packages"  && <PackagesTab />}
        {activeTab === "labtests"  && <LabTestsTab />}
        {activeTab === "bookings"  && <BookingsTab onOpenPatient={setDrawerUserId} />}
        {activeTab === "staff"     && <StaffTab />}
        {activeTab === "promo"         && <PromoCodesTab />}
        {activeTab === "reports"       && <RevenueReportsTab />}
        {activeTab === "accounting"    && <AccountingTab />}
        {activeTab === "ambulance"     && <AmbulanceTab />}
        {activeTab === "articles"      && <ArticlesTab />}
        {activeTab === "notifications" && <NotificationsTab />}
      </main>
    </div>
  );
}
