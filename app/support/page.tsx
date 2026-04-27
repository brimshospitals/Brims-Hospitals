"use client";
import { useState, useEffect, useRef } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: "booking",         icon: "📋", label: "Booking Issue",         desc: "Appointment confirm nahi, slot problem" },
  { key: "payment",         icon: "💳", label: "Payment / Refund",       desc: "Payment cut hua par booking nahi, refund pending" },
  { key: "cancellation",    icon: "❌", label: "Cancellation Request",    desc: "Booking cancel + refund chahiye" },
  { key: "service",         icon: "🏥", label: "Service Quality",         desc: "Doctor nahi mila, hospital ya staff problem" },
  { key: "home_collection", icon: "🏍️", label: "Home Collection",        desc: "Sample collection nahi aaya, delay" },
  { key: "report",          icon: "📄", label: "Reports / Prescription",  desc: "Report upload nahi, access nahi" },
  { key: "account",         icon: "👤", label: "Account / Wallet",        desc: "Login, wallet, membership, profile issue" },
  { key: "other",           icon: "💬", label: "Kuch Aur",                desc: "Jo upar ki categories mein na aaye" },
];

// which reference pickers to show per category
const CATEGORY_REFS: Record<string, string[]> = {
  booking:         ["booking"],
  payment:         ["booking", "transaction"],
  cancellation:    ["booking"],
  service:         ["booking"],
  home_collection: ["booking"],
  report:          ["booking"],
  account:         [],
  other:           [],
};

const STATUS_CFG: Record<string, { label: string; color: string; dot: string }> = {
  open:        { label: "Open",        color: "bg-blue-100 text-blue-700 border-blue-200",    dot: "bg-blue-500"   },
  in_progress: { label: "In Progress", color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500"  },
  resolved:    { label: "Resolved",    color: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-500"  },
  closed:      { label: "Closed",      color: "bg-gray-100 text-gray-600 border-gray-200",    dot: "bg-gray-400"   },
};

const ROLE_COLOR: Record<string, string> = {
  member:      "bg-teal-100 text-teal-700 border-teal-200",
  user:        "bg-blue-100 text-blue-700 border-blue-200",
  coordinator: "bg-indigo-100 text-indigo-700 border-indigo-200",
  hospital:    "bg-purple-100 text-purple-700 border-purple-200",
  doctor:      "bg-sky-100 text-sky-700 border-sky-200",
  staff:       "bg-orange-100 text-orange-700 border-orange-200",
  admin:       "bg-rose-100 text-rose-700 border-rose-200",
};

// ── Helper ────────────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SupportPage() {
  // Context
  const [ctxLoading,  setCtxLoading]  = useState(true);
  const [ctx,         setCtx]         = useState<any>(null);

  // View
  const [view, setView] = useState<"list" | "new" | "detail">("list");

  // My tickets
  const [tickets,        setTickets]        = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [openTicket,     setOpenTicket]     = useState<any>(null);
  const [replyText,      setReplyText]      = useState("");
  const [replying,       setReplying]       = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  // Form state
  const [category,          setCategory]          = useState("");
  const [subject,           setSubject]           = useState("");
  const [description,       setDescription]       = useState("");
  const [selectedMember,    setSelectedMember]    = useState<any>(null);
  const [selectedBooking,   setSelectedBooking]   = useState("");
  const [selectedTxn,       setSelectedTxn]       = useState("");
  const [selectedService,   setSelectedService]   = useState("");
  const [guestName,         setGuestName]         = useState("");
  const [guestMobile,       setGuestMobile]       = useState("");
  const [submitting,        setSubmitting]        = useState(false);

  const [toast,  setToast]  = useState("");
  const [toastOk,setToastOk]= useState(true);

  function showToast(msg: string, ok = true) {
    setToast(msg); setToastOk(ok); setTimeout(() => setToast(""), 3500);
  }

  // Load context
  useEffect(() => {
    fetch("/api/support/context")
      .then(r => r.json())
      .then(d => setCtx(d.success ? d : { loggedIn: false }))
      .catch(() => setCtx({ loggedIn: false }))
      .finally(() => setCtxLoading(false));
  }, []);

  // Load tickets
  async function fetchTickets() {
    if (!ctx?.loggedIn) return;
    setTicketsLoading(true);
    try {
      const res = await fetch("/api/support");
      const d   = await res.json();
      if (d.success) setTickets(d.tickets || []);
    } finally { setTicketsLoading(false); }
  }

  async function fetchDetail(ticketId: string) {
    const res = await fetch(`/api/support/${ticketId}`);
    const d   = await res.json();
    if (d.success) {
      setOpenTicket(d.ticket);
      setTimeout(() => threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" }), 100);
    }
  }

  useEffect(() => { if (ctx?.loggedIn) fetchTickets(); }, [ctx]);

  // Reset form when switching to new
  function openNewTicket() {
    setCategory(""); setSubject(""); setDescription("");
    setSelectedMember(null); setSelectedBooking(""); setSelectedTxn(""); setSelectedService("");
    setView("new");
  }

  // Build auto-context prefix for description
  function buildPrefix(): string {
    const lines: string[] = [];
    const role = ctx?.role;
    if (!ctx?.loggedIn) {
      if (guestName.trim())   lines.push(`Naam: ${guestName.trim()}`);
      if (guestMobile.trim()) lines.push(`Mobile: ${guestMobile.trim()}`);
    } else {
      if (role === "coordinator" && ctx.profile?.coordinatorId) {
        lines.push(`Coordinator ID: ${ctx.profile.coordinatorId}`);
      }
      if (role === "hospital" && ctx.profile?.hospitalId) {
        lines.push(`Hospital ID: ${ctx.profile.hospitalId}`);
      }
      if (role === "doctor" && ctx.doctor?.department) {
        lines.push(`Department: ${ctx.doctor.department}`);
      }
      if (selectedMember) {
        lines.push(`Family Member: ${selectedMember.name} (${selectedMember.gender}, ${selectedMember.age}y)`);
      }
      if (selectedBooking) lines.push(`Booking ID: ${selectedBooking}`);
      if (selectedTxn) {
        const t = [...(ctx.transactions || []), ...(ctx.appointments || [])].find((x: any) => x._id === selectedTxn);
        if (t) lines.push(`Transaction: ${t.referenceId || t._id?.slice(-8)} | ₹${t.amount} | ${t.category} | ${t.status}`);
      }
      if (selectedService) lines.push(`Service: ${selectedService}`);
    }
    return lines.length > 0 ? lines.join("\n") + "\n\n" : "";
  }

  // Submit
  async function submitTicket() {
    if (!ctx?.loggedIn) {
      if (!guestName.trim() || !guestMobile.trim()) return showToast("Naam aur mobile darj karein", false);
      showToast("Ticket submit karne ke liye login karein", false);
      setTimeout(() => window.location.href = `/login?redirect=/support`, 1600);
      return;
    }
    if (!category)           return showToast("Category select karein", false);
    if (!subject.trim())     return showToast("Subject darj karein", false);
    if (!description.trim()) return showToast("Problem describe karein", false);

    setSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subject:     subject.trim(),
          description: buildPrefix() + description.trim(),
          bookingRef:  selectedBooking || undefined,
        }),
      });
      const d = await res.json();
      if (d.success) {
        showToast(d.message || "Ticket submit ho gaya!");
        openNewTicket();
        setView("list");
        fetchTickets();
      } else { showToast(d.message || "Error", false); }
    } catch { showToast("Network error", false); }
    finally { setSubmitting(false); }
  }

  // Reply in detail
  async function sendReply() {
    if (!replyText.trim() || !openTicket) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/support/${openTicket.ticketId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText.trim() }),
      });
      const d = await res.json();
      if (d.success) { setReplyText(""); fetchDetail(openTicket.ticketId); fetchTickets(); }
      else showToast(d.message || "Error", false);
    } catch { showToast("Network error", false); }
    finally { setReplying(false); }
  }

  // ── Section: Identity ───────────────────────────────────────────────────────
  function IdentitySection() {
    const role = ctx?.role;
    const p    = ctx?.profile;

    if (!ctx?.loggedIn) return (
      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 space-y-3">
        <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">👤 Aapki Jankari</p>
        <p className="text-xs text-amber-600">Login nahi hai — naam aur mobile darj karein ya <a href="/login?redirect=/support" className="underline font-bold">login karein</a></p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Naam *</label>
            <input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Aapka naam"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Mobile *</label>
            <input value={guestMobile} onChange={e => setGuestMobile(e.target.value.replace(/\D/g, ""))}
              placeholder="10-digit" maxLength={10}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
        </div>
      </div>
    );

    // member / user
    if (["user","member"].includes(role)) {
      const members = ctx.familyMembers || [];
      return (
        <div className="bg-teal-50 rounded-2xl border border-teal-200 p-4 space-y-3">
          <p className="text-xs font-bold text-teal-700 uppercase tracking-wide">👤 Aapki Jankari — Auto Filled</p>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-teal-600 rounded-full flex items-center justify-center text-white font-black text-base flex-shrink-0">
              {p?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 text-sm">{p?.name}</p>
              <p className="text-xs text-gray-500">📱 +91 {p?.mobile}{p?.memberId ? ` · 🪪 ${p.memberId}` : ""}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${ROLE_COLOR[role] || ""}`}>
              {role === "member" ? "Member" : "User"}
            </span>
          </div>
          {members.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Issue Kiske Liye? <span className="text-gray-400 font-normal">(agar family member ke liye ho)</span></p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelectedMember(null)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${!selectedMember ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"}`}>
                  Mere Liye
                </button>
                {members.map((m: any, i: number) => (
                  <button key={i} onClick={() => setSelectedMember(selectedMember?.name === m.name ? null : m)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${selectedMember?.name === m.name ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"}`}>
                    {m.name} <span className="opacity-60">({m.gender?.charAt(0)}, {m.age}y)</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // coordinator
    if (role === "coordinator") {
      const coord = ctx.coordinator;
      return (
        <div className="bg-indigo-50 rounded-2xl border border-indigo-200 p-4 space-y-2">
          <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">🤝 Coordinator Details — Auto Filled</p>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black text-base flex-shrink-0">
              {p?.name?.charAt(0)?.toUpperCase() || "C"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 text-sm">{p?.name}</p>
              <p className="text-xs text-gray-500">📱 +91 {p?.mobile} · 🪪 {p?.coordinatorId || "—"}</p>
              {p?.district && <p className="text-xs text-gray-400">📍 {p.district}{p?.area ? `, ${p.area}` : ""}</p>}
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 bg-indigo-100 text-indigo-700 flex-shrink-0">Coordinator</span>
          </div>
          {coord && (
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { label: "Total Bookings", value: coord.totalBookings || 0 },
                { label: "Total Earned",   value: `₹${(coord.totalEarned || 0).toLocaleString("en-IN")}` },
                { label: "Pending",        value: `₹${(coord.pendingEarned || 0).toLocaleString("en-IN")}` },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl p-2 border border-indigo-100 text-center">
                  <p className="text-xs font-black text-indigo-700">{s.value}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // hospital / lab
    if (role === "hospital") {
      const hosp = ctx.hospital;
      const svc  = ctx.services || {};
      return (
        <div className="bg-purple-50 rounded-2xl border border-purple-200 p-4 space-y-2">
          <p className="text-xs font-bold text-purple-700 uppercase tracking-wide">🏥 Hospital / Lab — Auto Filled</p>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-purple-600 rounded-full flex items-center justify-center text-white text-xl flex-shrink-0">🏥</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 text-sm">{p?.name}</p>
              <p className="text-xs text-gray-500">📱 {p?.mobile}{p?.hospitalId ? ` · ${p.hospitalId}` : ""}</p>
              {p?.district && <p className="text-xs text-gray-400">📍 {p.district}, Bihar</p>}
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200 bg-purple-100 text-purple-700 flex-shrink-0 text-center">
              {p?.type || "Hospital"}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap pt-1">
            {[
              { icon: "🩺", label: "Doctors",          count: svc.doctors?.length || 0 },
              { icon: "🧪", label: "Lab Tests",         count: svc.labTests?.length || 0 },
              { icon: "📦", label: "Surgery Packages",  count: svc.surgeryPackages?.length || 0 },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl px-3 py-1.5 border border-purple-100 text-center">
                <p className="text-xs font-bold text-purple-700">{s.icon} {s.count}</p>
                <p className="text-[9px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // doctor
    if (role === "doctor") {
      const doc = ctx.doctor;
      return (
        <div className="bg-sky-50 rounded-2xl border border-sky-200 p-4 space-y-2">
          <p className="text-xs font-bold text-sky-700 uppercase tracking-wide">🩺 Doctor Details — Auto Filled</p>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-sky-600 rounded-full flex items-center justify-center text-white text-xl flex-shrink-0">🩺</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 text-sm">Dr. {p?.name}</p>
              <p className="text-xs text-gray-500">{p?.department}{p?.speciality ? ` · ${p.speciality}` : ""}</p>
              <p className="text-xs text-gray-400">📱 +91 {p?.mobile}{p?.hospitalName ? ` · ${p.hospitalName}` : ""}</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-200 bg-sky-100 text-sky-700 flex-shrink-0">Doctor</span>
          </div>
          {doc && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { label: "OPD Fee",  value: `₹${doc.opdFee || 0}` },
                { label: "Rating",   value: doc.rating ? `${doc.rating} ⭐` : "—" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl p-2 border border-sky-100 text-center">
                  <p className="text-xs font-black text-sky-700">{s.value}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // staff / admin / fallback
    return (
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 flex items-center gap-3">
        <div className="w-11 h-11 bg-gray-600 rounded-full flex items-center justify-center text-white font-black flex-shrink-0">
          {p?.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div>
          <p className="font-bold text-gray-800 text-sm">{p?.name}</p>
          <p className="text-xs text-gray-500">📱 {p?.mobile} · <span className="capitalize">{role}</span></p>
        </div>
      </div>
    );
  }

  // ── Section: Reference Selectors ────────────────────────────────────────────
  function ReferenceSection() {
    if (!category) return null;
    const role = ctx?.loggedIn ? ctx.role : "guest";
    const refs = CATEGORY_REFS[category] || [];
    if (refs.length === 0 && role !== "hospital" && role !== "doctor") return null;

    // Hospital: show services selector
    if (role === "hospital") {
      const svc = ctx?.services || {};
      const allServices: { id: string; label: string }[] = [
        ...((svc.doctors || []).map((d: any) => ({ id: d._id, label: `🩺 Dr. ${d.name} — ${d.department}` }))),
        ...((svc.labTests || []).map((l: any) => ({ id: l._id, label: `🧪 ${l.name} — ${l.category}` }))),
        ...((svc.surgeryPackages || []).map((s: any) => ({ id: s._id, label: `📦 ${s.name} — ${s.category}` }))),
      ];

      return (
        <div className="space-y-3">
          {allServices.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Kaunsi Service Ke Baare Mein? <span className="font-normal text-gray-400 normal-case">(optional)</span>
              </label>
              <select value={selectedService} onChange={e => setSelectedService(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                <option value="">— Service select karein —</option>
                <optgroup label="🩺 Doctors">
                  {(svc.doctors || []).map((d: any) => (
                    <option key={d._id} value={`Doctor: ${d.name} (${d.department})`}>🩺 Dr. {d.name} — {d.department}</option>
                  ))}
                </optgroup>
                <optgroup label="🧪 Lab Tests">
                  {(svc.labTests || []).map((l: any) => (
                    <option key={l._id} value={`Lab Test: ${l.name} (${l.category})`}>🧪 {l.name} — {l.category}</option>
                  ))}
                </optgroup>
                <optgroup label="📦 Surgery Packages">
                  {(svc.surgeryPackages || []).map((s: any) => (
                    <option key={s._id} value={`Surgery: ${s.name} (${s.category})`}>📦 {s.name} — {s.category}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}
          {/* Booking dropdown for hospital too */}
          {refs.includes("booking") && (ctx?.bookings || []).length > 0 && (
            <BookingDropdown bookings={ctx.bookings} label="Booking Select Karein (optional)" />
          )}
        </div>
      );
    }

    // Doctor: appointment selector
    if (role === "doctor") {
      const appts = ctx?.appointments || [];
      return (
        <div className="space-y-3">
          {appts.length > 0 && refs.includes("booking") && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Kaunsi Appointment? <span className="font-normal text-gray-400 normal-case">(optional)</span>
              </label>
              <select value={selectedBooking} onChange={e => setSelectedBooking(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                <option value="">— Appointment select karein —</option>
                {appts.map((b: any) => {
                  const n    = b.parsedNotes || {};
                  const date = b.appointmentDate ? fmtDate(b.appointmentDate) : "—";
                  return (
                    <option key={b._id} value={b.bookingId}>
                      {b.bookingId} | {n.patientName || "Patient"} | {date} | {b.type} | {b.status}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
          {refs.includes("transaction") && (ctx?.transactions || []).length > 0 && (
            <TransactionDropdown transactions={ctx.transactions} />
          )}
        </div>
      );
    }

    // Coordinator
    if (role === "coordinator") {
      return (
        <div className="space-y-3">
          {refs.includes("booking") && (ctx?.bookings || []).length > 0 && (
            <BookingDropdown
              bookings={ctx.bookings}
              label={category === "cancellation" ? "Kaunsi Booking Cancel Karni Hai?" : "Booking ID Select Karein (optional)"}
            />
          )}
          {refs.includes("transaction") && (ctx?.transactions || []).length > 0 && (
            <TransactionDropdown transactions={ctx.transactions} />
          )}
        </div>
      );
    }

    // user / member
    if (["user","member"].includes(role)) {
      return (
        <div className="space-y-3">
          {refs.includes("booking") && (ctx?.bookings || []).length > 0 && (
            <BookingDropdown
              bookings={ctx.bookings}
              label={category === "cancellation" ? "Kaunsi Booking Cancel / Refund Chahiye?" : "Booking ID Select Karein (optional)"}
            />
          )}
          {refs.includes("transaction") && (ctx?.transactions || []).length > 0 && (
            <TransactionDropdown transactions={ctx.transactions} />
          )}
        </div>
      );
    }

    return null;
  }

  // Mini sub-components for dropdowns
  function BookingDropdown({ bookings, label }: { bookings: any[]; label: string }) {
    return (
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
        <select value={selectedBooking} onChange={e => setSelectedBooking(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
          <option value="">— Booking select karein —</option>
          {bookings.map((b: any) => {
            const n    = b.parsedNotes || {};
            const date = b.appointmentDate ? fmtDate(b.appointmentDate) : "";
            const hosp = b.hospitalId?.name || "";
            return (
              <option key={b._id} value={b.bookingId}>
                {b.bookingId} | {b.type} | {n.patientName || "—"}{hosp ? ` | ${hosp}` : ""}{date ? ` | ${date}` : ""} | ₹{b.amount || 0} | {b.status}
              </option>
            );
          })}
        </select>
        {selectedBooking && (() => {
          const bk = bookings.find((b: any) => b.bookingId === selectedBooking);
          if (!bk) return null;
          const n = bk.parsedNotes || {};
          return (
            <div className="mt-2 bg-teal-50 rounded-xl px-3 py-2.5 border border-teal-100 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-teal-700">{bk.bookingId} · {bk.type}</p>
                <p className="text-[10px] text-gray-500">{n.patientName} · {bk.appointmentDate ? fmtDate(bk.appointmentDate) : "—"}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-black text-teal-700">₹{(bk.amount || 0).toLocaleString("en-IN")}</p>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                  bk.status === "completed" ? "bg-teal-100 text-teal-700 border-teal-200"
                  : bk.status === "confirmed" ? "bg-green-100 text-green-700 border-green-200"
                  : bk.status === "pending" ? "bg-amber-100 text-amber-700 border-amber-200"
                  : "bg-red-100 text-red-700 border-red-200"
                }`}>{bk.status}</span>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  function TransactionDropdown({ transactions }: { transactions: any[] }) {
    return (
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
          Transaction ID Select Karein <span className="font-normal text-gray-400 normal-case">(optional)</span>
        </label>
        <select value={selectedTxn} onChange={e => setSelectedTxn(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
          <option value="">— Transaction select karein —</option>
          {transactions.map((t: any) => (
            <option key={t._id} value={t._id}>
              {t.referenceId || t.paymentId || t._id?.slice(-8)} | {t.category} | ₹{t.amount} | {fmtDate(t.createdAt)} | {t.status}
            </option>
          ))}
        </select>
        {selectedTxn && (() => {
          const txn = transactions.find((t: any) => t._id === selectedTxn);
          if (!txn) return null;
          return (
            <div className="mt-2 bg-blue-50 rounded-xl px-3 py-2.5 border border-blue-100 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-blue-700">{txn.referenceId || txn._id?.slice(-8)}</p>
                <p className="text-[10px] text-gray-500">{txn.category} · {fmtDate(txn.createdAt)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-black ${txn.type === "credit" ? "text-green-600" : "text-orange-600"}`}>
                  {txn.type === "credit" ? "+" : "−"}₹{(txn.amount || 0).toLocaleString("en-IN")}
                </p>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                  txn.status === "success" ? "bg-green-100 text-green-700 border-green-200"
                  : txn.status === "pending" ? "bg-amber-100 text-amber-700 border-amber-200"
                  : "bg-red-100 text-red-700 border-red-200"
                }`}>{txn.status}</span>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (ctxLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-9 h-9 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
    </div>
  );

  const catMap = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-sm text-white font-semibold ${toastOk ? "bg-teal-700" : "bg-red-600"}`}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-teal-700 text-white px-4 pt-10 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => window.history.back()} className="text-teal-200 text-sm mb-3 flex items-center gap-1 hover:text-white">← Back</button>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black">🎧 Help & Support</h1>
              <p className="text-teal-200 text-sm mt-0.5">Koi bhi problem ho — hum yahan hain</p>
            </div>
            {ctx?.loggedIn && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${ROLE_COLOR[ctx.role] || "bg-white/20 text-white border-white/30"}`}>
                {ctx.profile?.name?.split(" ")[0]} · <span className="capitalize">{ctx.role}</span>
              </span>
            )}
          </div>
          {/* View tabs */}
          {ctx?.loggedIn && (
            <div className="flex gap-2 mt-4">
              {[
                { key: "list", label: "📋 My Tickets" },
                { key: "new",  label: "+ New Ticket"  },
              ].map(tab => (
                <button key={tab.key}
                  onClick={() => tab.key === "new" ? openNewTicket() : setView("list")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${view === tab.key || (tab.key === "new" && view === "new") ? "bg-white text-teal-700" : "bg-white/20 text-white hover:bg-white/30"}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5">

        {/* ── DETAIL VIEW ── */}
        {view === "detail" && openTicket && (() => {
          const sc  = STATUS_CFG[openTicket.status] || STATUS_CFG.open;
          const cat = catMap[openTicket.category];
          return (
            <div>
              <button onClick={() => setView("list")} className="text-teal-600 text-sm font-semibold mb-3 flex items-center gap-1 hover:underline">← Back to My Tickets</button>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{openTicket.ticketId}</p>
                    <p className="font-bold text-gray-800 text-sm mt-0.5">{openTicket.subject}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.color}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${sc.dot} mr-1`} />{sc.label}
                      </span>
                      {cat && <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{cat.icon} {cat.label}</span>}
                    </div>
                  </div>
                </div>
                {openTicket.resolvedAt && (
                  <p className="text-[10px] text-green-600 mt-2">✅ Resolved: {fmtDate(openTicket.resolvedAt)}</p>
                )}
              </div>

              {/* Thread */}
              <div ref={threadRef} className="space-y-3 max-h-[55vh] overflow-y-auto pr-1 pb-2">
                {(openTicket.messages || []).map((msg: any, idx: number) => {
                  const isSupport = ["admin","staff"].includes(msg.senderRole);
                  return (
                    <div key={msg._id || idx} className={`flex ${isSupport ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[86%] rounded-2xl px-4 py-3 shadow-sm ${isSupport ? "bg-white border border-gray-100 rounded-tl-sm" : "bg-teal-600 text-white rounded-tr-sm"}`}>
                        <p className={`text-[10px] font-bold mb-1 ${isSupport ? "text-teal-600" : "text-teal-100"}`}>
                          {isSupport ? `🎧 ${msg.senderName || "Support Team"}` : `👤 ${msg.senderName || "Aap"}`}
                        </p>
                        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isSupport ? "text-gray-700" : "text-white"}`}>{msg.message}</p>
                        <p className={`text-[9px] mt-1 text-right ${isSupport ? "text-gray-400" : "text-teal-200"}`}>{fmtDateTime(msg.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply */}
              {!["resolved","closed"].includes(openTicket.status) ? (
                <div className="mt-4 flex gap-2">
                  <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                    placeholder="Jawab likhein... (Enter to send)"
                    rows={2} className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
                  <button onClick={sendReply} disabled={replying || !replyText.trim()}
                    className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold px-4 rounded-xl disabled:opacity-50 transition flex-shrink-0">
                    {replying ? "..." : "Send"}
                  </button>
                </div>
              ) : (
                <div className="mt-4 bg-green-50 rounded-xl px-4 py-3 border border-green-100 text-center">
                  <p className="text-sm text-green-600 font-semibold">✅ Ticket {openTicket.status === "resolved" ? "Resolved" : "Closed"}</p>
                  <p className="text-xs text-green-500 mt-0.5">Naya issue ho to naya ticket raise karein</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── NEW TICKET FORM ── */}
        {view === "new" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              {ctx?.loggedIn && (
                <button onClick={() => setView("list")} className="text-teal-600 text-sm font-semibold hover:underline">← Back</button>
              )}
              <h2 className="text-base font-black text-gray-800">Naya Support Ticket</h2>
            </div>

            {/* Step 1: Identity */}
            <IdentitySection />

            {/* Step 2: Category */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Problem Category *</p>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(c => (
                  <button key={c.key} onClick={() => { setCategory(c.key); setSelectedBooking(""); setSelectedTxn(""); setSelectedService(""); }}
                    className={`p-3 rounded-2xl border text-left transition ${category === c.key ? "border-teal-500 bg-teal-50 shadow-sm" : "border-gray-200 bg-white hover:border-teal-200"}`}>
                    <p className="text-lg mb-1">{c.icon}</p>
                    <p className={`text-xs font-bold leading-snug ${category === c.key ? "text-teal-700" : "text-gray-700"}`}>{c.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{c.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Reference selectors */}
            {category && <ReferenceSection />}

            {/* Step 4: Subject + Description */}
            {category && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Subject *</label>
                  <input value={subject} onChange={e => setSubject(e.target.value)} maxLength={120}
                    placeholder="Ek line mein problem batayein..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Problem Describe Karein *</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5}
                    placeholder="Poori problem detail mein batayein — kab hua, kya hua, kya expect tha..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
                </div>
                <button onClick={submitTicket} disabled={submitting}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-2xl text-sm transition disabled:opacity-50 shadow-sm">
                  {submitting ? "Submit ho raha hai..." : "✓ Ticket Submit Karein"}
                </button>
              </>
            )}

            {/* Guest CTA */}
            {!ctx?.loggedIn && (
              <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 text-center">
                <p className="text-sm font-semibold text-blue-700">📱 Login karke ticket track karein</p>
                <p className="text-xs text-blue-500 mt-1">Login ke baad aap apne ticket ka status aur reply dekh sakte hain</p>
                <a href="/login?redirect=/support" className="block mt-3 bg-blue-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-blue-700 transition">
                  Login / Register
                </a>
              </div>
            )}
          </div>
        )}

        {/* ── TICKET LIST ── */}
        {view === "list" && (
          <>
            {/* Helpline strip */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800">📞 Helpline: 1800-XXX-XXXX</p>
                <p className="text-xs text-gray-400 mt-0.5">Mon–Sat · 9 AM – 6 PM · Free call</p>
              </div>
              <a href="tel:18001234567" className="bg-teal-600 text-white text-xs font-bold px-3 py-2 rounded-xl">Call Now</a>
            </div>

            <button onClick={openNewTicket}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-2xl text-sm mb-5 transition shadow-sm">
              + Naya Support Ticket Raise Karein
            </button>

            {!ctx?.loggedIn ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <p className="text-3xl mb-2">🔒</p>
                <p className="text-sm font-semibold text-gray-500">Tickets dekhne ke liye login karein</p>
                <a href="/login?redirect=/support" className="block mt-4 bg-teal-600 text-white text-sm font-bold py-2.5 rounded-xl">Login Karein</a>
              </div>
            ) : (
              <>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Aapke Tickets</p>
                {ticketsLoading ? (
                  <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" /></div>
                ) : tickets.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                    <p className="text-3xl mb-2">🎫</p>
                    <p className="text-sm font-semibold text-gray-500">Abhi koi ticket nahi</p>
                    <p className="text-xs text-gray-400 mt-1">Koi problem ho to upar button se ticket raise karein</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tickets.map((t: any) => {
                      const sc  = STATUS_CFG[t.status] || STATUS_CFG.open;
                      const cat = catMap[t.category];
                      return (
                        <button key={t._id} onClick={() => { setOpenTicket(t); setView("detail"); fetchDetail(t.ticketId); }}
                          className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left hover:border-teal-200 hover:shadow-md transition">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-xs font-black text-teal-700">{t.ticketId}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.color}`}>
                                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${sc.dot} mr-1`} />{sc.label}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-gray-800 truncate">{t.subject}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {cat?.icon} {cat?.label} · {fmtDate(t.createdAt)}
                              </p>
                            </div>
                            <span className="text-gray-300 text-xl flex-shrink-0">›</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}
