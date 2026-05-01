"use client";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "reports" | "create" | "settings" | "invoices";

interface LabReport {
  _id: string; reportId: string; templateName: string; category: string;
  patientName: string; patientAge?: number; patientGender?: string; patientMobile?: string;
  status: "draft" | "final"; collectionDate: string; reportDate: string;
  technicianName?: string; doctorName?: string; labName?: string;
  results: ResultRow[]; sampleType?: string; referredBy?: string;
  sampleStatus?: "pending" | "received" | "rejected";
  sampleReceivedAt?: string; sampleReceivedBy?: string;
  createdAt: string;
}
interface ResultRow {
  paramId?: string; name: string; value: string; unit: string;
  refRangeText: string; flag: "H" | "L" | "N" | ""; type: "numeric" | "text";
  section?: string;
}
interface Template {
  _id?: string; name: string; department: string; category: string; sampleType: string;
  parameters: TemplateParam[];
}
interface TemplateParam {
  paramId?: string; name: string; unit: string; refRangeText: string;
  type: "numeric" | "text"; order?: number; section?: string;
}
interface LabSettings {
  labName?: string; logoUrl?: string; address?: string; phone?: string; email?: string;
  website?: string; labRegNo?: string; nablNo?: string; gstNumber?: string; panNumber?: string;
  invoicePrefix?: string; cgstRate?: number; sgstRate?: number;
  pathologistName?: string; pathologistQual?: string; pathologistSign?: string;
  technicianName?: string; technicianQual?: string; technicianSign?: string;
  useCustomLetterhead?: boolean; letterheadUrl?: string;
  invoiceFooter?: string; termsText?: string;
}
interface Invoice {
  _id: string; invoiceId: string; patientName: string; patientMobile?: string;
  totalAmount: number; paidAmount: number; balanceAmount: number;
  status: string; invoiceDate: string; items: any[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function Spinner() {
  return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div>;
}
function Toast({ msg, ok = true, onClose }: { msg: string; ok?: boolean; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div onClick={onClose} className={`fixed top-4 right-4 z-[99] cursor-pointer px-4 py-3 rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2 ${ok ? "bg-green-700" : "bg-red-600"} text-white`}>
      {ok ? "✓" : "✗"} {msg}
    </div>
  );
}

const INP = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition";
const SEL = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 transition";
const LBL = "block text-xs font-semibold text-gray-600 mb-1";

const STATUS_COLORS: Record<string, string> = {
  draft:     "bg-amber-100 text-amber-700 border-amber-200",
  final:     "bg-green-100 text-green-700 border-green-200",
  paid:      "bg-teal-100 text-teal-700 border-teal-200",
  partial:   "bg-orange-100 text-orange-700 border-orange-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const DEPARTMENTS = ["Haematology","Biochemistry","Endocrinology","Serology","Urine Analysis","Oncology","Other"];
const SAMPLE_TYPES = ["Blood","Blood (EDTA)","Blood (Serum)","Urine","Stool","Swab","Sputum","CSF","Other"];
const PAY_MODES    = ["Cash","Online","Wallet","Insurance","Card"];

// ─── DLC Smart Calculation ─────────────────────────────────────────────────────
// DLC % params that must sum to 100
const DLC_PARAM_IDS = ["neu", "lym", "eos", "mono", "baso"];
// TLC paramId
const TLC_PARAM_ID  = "wbc";
// Mapping: DLC% paramId → Absolute Count paramId
const ABS_COUNT_MAP: Record<string, string> = {
  neu: "anc", lym: "alc", eos: "aec", mono: "amc", baso: "abc",
};

function applyDlcSmarts(results: ResultRow[]): ResultRow[] {
  const next = results.map(r => ({ ...r }));

  // Build paramId → index map
  const idxOf: Record<string, number> = {};
  next.forEach((r, i) => { if (r.paramId) idxOf[r.paramId] = i; });

  // ── 1. DLC auto-complete (4 filled → compute 5th so sum = 100) ──────────
  const dlcVals: Record<string, number | null> = {};
  let filled = 0, emptyId: string | null = null;
  DLC_PARAM_IDS.forEach(id => {
    if (idxOf[id] !== undefined) {
      const raw = next[idxOf[id]].value.trim();
      const v   = parseFloat(raw);
      if (raw !== "" && !isNaN(v)) { dlcVals[id] = v; filled++; }
      else                          { dlcVals[id] = null; emptyId = id; }
    }
  });
  if (filled === 4 && emptyId && idxOf[emptyId] !== undefined) {
    const sum = DLC_PARAM_IDS.reduce((acc, id) => acc + (dlcVals[id] ?? 0), 0);
    const remaining = +(100 - sum).toFixed(1);
    if (remaining >= 0) next[idxOf[emptyId]].value = String(remaining);
  }

  // ── 2. Absolute counts = TLC × (DLC%) / 100 ─────────────────────────────
  if (idxOf[TLC_PARAM_ID] !== undefined) {
    const tlcRaw = next[idxOf[TLC_PARAM_ID]].value.trim();
    const tlcVal = parseFloat(tlcRaw);
    if (!isNaN(tlcVal) && tlcVal > 0) {
      Object.entries(ABS_COUNT_MAP).forEach(([dlcId, absId]) => {
        if (idxOf[dlcId] !== undefined && idxOf[absId] !== undefined) {
          const pctRaw = next[idxOf[dlcId]].value.trim();
          const pct    = parseFloat(pctRaw);
          if (!isNaN(pct)) {
            next[idxOf[absId]].value = String(Math.round(tlcVal * pct / 100));
          }
        }
      });
    }
  }

  return next;
}

// ─── DLC Total indicator ───────────────────────────────────────────────────────
function dlcTotal(results: ResultRow[]): number | null {
  const idxOf: Record<string, number> = {};
  results.forEach((r, i) => { if (r.paramId) idxOf[r.paramId] = i; });
  let sum = 0, anyFilled = false;
  for (const id of DLC_PARAM_IDS) {
    if (idxOf[id] !== undefined) {
      const v = parseFloat(results[idxOf[id]].value);
      if (!isNaN(v)) { sum += v; anyFilled = true; }
    }
  }
  return anyFilled ? +sum.toFixed(1) : null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EDIT REPORT DRAWER — auto-save + DLC smart calc + sample receiving
// ═══════════════════════════════════════════════════════════════════════════════
function EditReportDrawer({
  reportId, staffName, onClose, onSaved,
}: {
  reportId: string; staffName?: string;
  onClose: () => void; onSaved: () => void;
}) {
  const [report,   setReport]   = useState<LabReport | null>(null);
  const [results,  setResults]  = useState<ResultRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load report
  useEffect(() => {
    if (!reportId) return;
    setLoading(true);
    fetch(`/api/hospital/lab-reports?reportId=${reportId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setReport(d.report);
          setResults(d.report.results || []);
        }
      })
      .finally(() => setLoading(false));
  }, [reportId]);

  // Auto-save: debounced 1.2s after results change
  useEffect(() => {
    if (!report || loading) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState("saving");
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/hospital/lab-reports", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: report._id, results }),
        });
        const d = await res.json();
        setSaveState(d.success ? "saved" : "error");
        if (d.success) setTimeout(() => setSaveState("idle"), 2000);
      } catch { setSaveState("error"); }
    }, 1200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

  function updateResult(idx: number, val: string) {
    setResults(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], value: val };
      // Apply DLC smarts
      return applyDlcSmarts(next);
    });
  }

  async function receiveSample() {
    if (!report) return;
    const now = new Date().toISOString();
    const res = await fetch("/api/hospital/lab-reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: report._id,
        sampleStatus:     "received",
        sampleReceivedAt: now,
        sampleReceivedBy: staffName || "",
      }),
    });
    const d = await res.json();
    if (d.success) {
      setReport(r => r ? { ...r, sampleStatus: "received", sampleReceivedAt: now, sampleReceivedBy: staffName || "" } : r);
    }
  }

  async function rejectSample() {
    if (!report) return;
    const res = await fetch("/api/hospital/lab-reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: report._id, sampleStatus: "rejected" }),
    });
    const d = await res.json();
    if (d.success) setReport(r => r ? { ...r, sampleStatus: "rejected" } : r);
  }

  async function finalise() {
    if (!report) return;
    const res = await fetch("/api/hospital/lab-reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: report._id, status: "final", results }),
    });
    const d = await res.json();
    if (d.success) { onSaved(); onClose(); }
  }

  const fmtDT = (d?: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const dlcSum = dlcTotal(results);
  const dlcOk  = dlcSum === null || dlcSum === 100;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full max-w-2xl bg-white h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-purple-700 text-white">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-purple-200 hover:text-white text-sm">✕</button>
            <div>
              <p className="text-sm font-bold">{report?.patientName || "Loading..."}</p>
              <p className="text-xs text-purple-200">{report?.reportId} · {report?.templateName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saveState === "saving" && <span className="text-xs text-purple-200 flex items-center gap-1"><span className="w-3 h-3 border-2 border-purple-300 border-t-white rounded-full animate-spin" />Saving...</span>}
            {saveState === "saved"  && <span className="text-xs text-green-300 font-semibold">✓ Saved</span>}
            {saveState === "error"  && <span className="text-xs text-red-300 font-semibold">✗ Error</span>}
            {report?.status === "final" && <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">✅ Final</span>}
            {report?.status === "draft" && <span className="bg-amber-400 text-amber-900 text-xs px-2 py-0.5 rounded-full font-bold">📝 Draft</span>}
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div>
        ) : !report ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">Report not found</div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* ── Sample Receiving Section ── */}
            <div className="mx-5 mt-4 rounded-2xl border overflow-hidden">
              <div className={`px-4 py-2 flex items-center justify-between ${
                report.sampleStatus === "received" ? "bg-green-600" :
                report.sampleStatus === "rejected" ? "bg-red-500"   : "bg-amber-500"
              }`}>
                <div className="flex items-center gap-2 text-white">
                  <span className="text-base">{report.sampleStatus === "received" ? "✅" : report.sampleStatus === "rejected" ? "❌" : "⏳"}</span>
                  <span className="text-sm font-bold">
                    {report.sampleStatus === "received" ? "Sample Received"
                      : report.sampleStatus === "rejected" ? "Sample Rejected"
                      : "Sample Awaited (SNR)"}
                  </span>
                </div>
                {report.sampleStatus !== "received" && (
                  <div className="flex gap-2">
                    <button onClick={receiveSample}
                      className="bg-white text-green-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-50 transition">
                      ✅ Mark Received
                    </button>
                    {report.sampleStatus !== "rejected" && (
                      <button onClick={rejectSample}
                        className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-white/30 transition">
                        ❌ Reject
                      </button>
                    )}
                  </div>
                )}
              </div>
              {report.sampleStatus === "received" && (
                <div className="bg-green-50 px-4 py-2.5 flex flex-wrap gap-4 text-xs text-gray-600">
                  <span>📅 <strong>Received:</strong> {fmtDT(report.sampleReceivedAt)}</span>
                  {report.sampleReceivedBy && <span>👤 <strong>By:</strong> {report.sampleReceivedBy}</span>}
                  <span>🧪 <strong>Sample:</strong> {report.sampleType || "Blood"}</span>
                </div>
              )}
            </div>

            {/* ── Patient Info strip ── */}
            <div className="mx-5 mt-3 px-4 py-2.5 bg-gray-50 rounded-xl text-xs text-gray-600 flex flex-wrap gap-4">
              <span><strong>Age:</strong> {report.patientAge ? `${report.patientAge}y` : "—"}</span>
              <span><strong>Gender:</strong> {report.patientGender || "—"}</span>
              <span><strong>Mobile:</strong> {report.patientMobile || "—"}</span>
              <span><strong>Collection:</strong> {fmtDate(report.collectionDate)}</span>
            </div>

            {/* ── Results Entry Table ── */}
            <div className="mx-5 mt-4 mb-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-700">
                  Test Values <span className="text-xs font-normal text-gray-400">— value dalte hi auto-save hoga</span>
                </h3>
                {/* DLC total indicator */}
                {dlcSum !== null && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${dlcOk ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}`}>
                    DLC Total: {dlcSum}%{dlcOk ? " ✓" : " ✗ (100% hona chahiye)"}
                  </span>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-800 text-white">
                      <th className="px-3 py-2 text-left font-semibold w-[38%]">Parameter</th>
                      <th className="px-3 py-2 text-left font-semibold w-[20%]">Value</th>
                      <th className="px-3 py-2 text-left font-semibold w-[10%]">Unit</th>
                      <th className="px-3 py-2 text-left font-semibold w-[32%]">Reference Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const rows: React.ReactNode[] = [];
                      let lastSec = "__INIT__";
                      let rowIdx  = 0;

                      results.forEach((row, idx) => {
                        const sec = row.section || "";
                        if (sec && sec !== lastSec) {
                          const isDlcSection = sec.includes("DIFFERENTIAL") || sec.includes("DLC");
                          rows.push(
                            <tr key={`sec-${idx}`} className="bg-teal-600">
                              <td colSpan={4} className="px-3 py-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black text-white uppercase tracking-widest">{sec}</span>
                                  {isDlcSection && dlcSum !== null && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dlcOk ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                                      Sum: {dlcSum}%
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                          rowIdx = 0;
                        }
                        lastSec = sec;

                        // Detect if this is an auto-calculated absolute count
                        const isAbsCount = Object.values(ABS_COUNT_MAP).includes(row.paramId || "");
                        // Detect if this is an auto-calculated DLC 5th value
                        const isDlcParam = DLC_PARAM_IDS.includes(row.paramId || "");

                        rows.push(
                          <tr key={idx} className={`border-b border-gray-100 transition ${
                            row.flag === "H" ? "bg-red-50" :
                            row.flag === "L" ? "bg-blue-50" :
                            rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}>
                            <td className="px-3 py-2" style={{ paddingLeft: sec ? "20px" : "12px" }}>
                              <div className="flex items-center gap-1.5">
                                <span className={`font-medium ${row.flag === "H" || row.flag === "L" ? "text-gray-900 font-bold" : "text-gray-700"}`}>
                                  {row.name}
                                </span>
                                {isAbsCount && <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">AUTO</span>}
                              </div>
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                value={row.value}
                                onChange={e => updateResult(idx, e.target.value)}
                                readOnly={isAbsCount}
                                className={`w-full border rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-purple-400 transition ${
                                  row.flag === "H" ? "border-red-400 bg-red-50 text-red-700" :
                                  row.flag === "L" ? "border-blue-400 bg-blue-50 text-blue-700" :
                                  isAbsCount      ? "border-blue-200 bg-blue-50 text-blue-700 cursor-default" :
                                  "border-gray-200 hover:border-purple-300"
                                }`}
                                placeholder={isAbsCount ? "auto" : isDlcParam ? "%" : ""}
                              />
                            </td>
                            <td className="px-2 py-2 text-gray-500 text-[11px]">{row.unit}</td>
                            <td className="px-2 py-2 text-[10px] text-gray-500 leading-relaxed">{row.refRangeText}</td>
                          </tr>
                        );
                        rowIdx++;
                      });
                      return rows;
                    })()}
                  </tbody>
                </table>
              </div>

              {/* DLC info box */}
              {dlcSum !== null && !dlcOk && (
                <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-700">
                  💡 <strong>DLC Auto-Calc:</strong> Neutrophil + Lymphocyte + Eosinophil + Monocyte + Basophil = 100% hona chahiye.
                  4 values dalein, 5th auto-fill ho jayega. Abhi: <strong>{dlcSum}%</strong>
                </div>
              )}
            </div>

            {/* ── Sign-off ── */}
            <div className="mx-5 mt-4 mb-6">
              <div className="bg-gray-50 rounded-xl px-4 py-3 flex flex-wrap gap-4 text-xs text-gray-500">
                <span>🩺 <strong>Technician:</strong> {report.technicianName || "—"}</span>
                <span>👨‍⚕️ <strong>Doctor:</strong> {report.doctorName || "—"}</span>
                <span>📅 <strong>Report Date:</strong> {fmtDate(report.reportDate)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        {!loading && report && (
          <div className="border-t border-gray-100 p-4 flex gap-3 bg-white">
            <a href={`/lab-report/${report.reportId}`} target="_blank" rel="noreferrer"
              className="flex-1 text-center py-2.5 rounded-xl border border-teal-200 text-teal-700 text-sm font-semibold hover:bg-teal-50 transition">
              🖨️ Print
            </a>
            {report.status === "draft" && (
              <button onClick={finalise}
                className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition">
                ✅ Finalise Report
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function LabReportManagerInner() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("reports");
  const [hospitalId, setHospitalId] = useState("");
  const [staffName,  setStaffName]  = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  // Drawer state — pre-open if ?reportId= is in URL
  const [editReportId, setEditReportId] = useState<string | null>(null);

  const showToast = useCallback((msg: string, ok = true) => setToast({ msg, ok }), []);

  // Auth check
  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (!d.success || !["hospital", "admin", "staff"].includes(d.role)) {
        router.push("/staff-login");
        return;
      }
      const hId = d.hospitalMongoId || d.hospitalId || "";
      setHospitalId(hId);
      setStaffName(d.name || "");
      setAuthLoading(false);
      // Open drawer if ?reportId= is in URL
      const urlReportId = searchParams.get("reportId");
      if (urlReportId) setEditReportId(urlReportId);
    });
  }, [router, searchParams]);

  if (authLoading) return <Spinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}
      {/* Edit Report Drawer */}
      {editReportId && (
        <EditReportDrawer
          reportId={editReportId}
          staffName={staffName}
          onClose={() => setEditReportId(null)}
          onSaved={() => { setEditReportId(null); showToast("Report finalised!"); }}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
            <span className="text-gray-300">|</span>
            <h1 className="text-base font-bold text-gray-800">🧪 Lab Report Manager</h1>
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto pb-0">
          {[
            { id: "reports",  label: "📋 Reports" },
            { id: "create",   label: "➕ Create Report" },
            { id: "invoices", label: "🧾 Invoices" },
            { id: "settings", label: "⚙️ Lab Settings" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as Tab)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition ${tab === t.id ? "border-purple-600 text-purple-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5">
        {tab === "reports"  && <ReportsTab  hospitalId={hospitalId} showToast={showToast} onEdit={setEditReportId} />}
        {tab === "create"   && <CreateTab   hospitalId={hospitalId} showToast={showToast} onCreated={() => setTab("reports")} />}
        {tab === "settings" && <SettingsTab hospitalId={hospitalId} showToast={showToast} />}
        {tab === "invoices" && <InvoicesTab hospitalId={hospitalId} showToast={showToast} />}
      </div>
    </div>
  );
}

// Suspense wrapper — required because useSearchParams() is used inside
export default function LabReportManagerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    }>
      <LabReportManagerInner />
    </Suspense>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1: Reports List
// ═══════════════════════════════════════════════════════════════════════════════
function ReportsTab({ hospitalId, showToast, onEdit }: {
  hospitalId: string;
  showToast: (m: string, ok?: boolean) => void;
  onEdit: (reportId: string) => void;
}) {
  const [reports, setReports]   = useState<LabReport[]>([]);
  const [total,   setTotal]     = useState(0);
  const [page,    setPage]      = useState(1);
  const [pages,   setPages]     = useState(1);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState("");
  const [status,  setStatus]    = useState("");
  const [deleting, setDeleting] = useState("");

  const load = useCallback((pg = 1, q = search, st = status) => {
    if (!hospitalId) return;
    setLoading(true);
    const params = new URLSearchParams({ hospitalId, page: String(pg), limit: "20" });
    if (q)  params.set("search", q);
    if (st) params.set("status", st);
    fetch(`/api/hospital/lab-reports?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) { setReports(d.reports || []); setTotal(d.total || 0); setPages(d.pages || 1); setPage(pg); }
      })
      .finally(() => setLoading(false));
  }, [hospitalId, search, status]);

  useEffect(() => { load(); }, [load]);

  async function deleteReport(r: LabReport) {
    if (!confirm(`"${r.patientName}" ki report delete karein? (${r.reportId})`)) return;
    setDeleting(r._id);
    const res = await fetch("/api/hospital/lab-reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r._id, isActive: false }),
    });
    const d = await res.json();
    if (d.success) { showToast("Report delete ho gayi"); load(); }
    else showToast(d.message || "Error", false);
    setDeleting("");
  }

  async function toggleStatus(r: LabReport) {
    const newStatus = r.status === "draft" ? "final" : "draft";
    const res = await fetch("/api/hospital/lab-reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r._id, status: newStatus }),
    });
    const d = await res.json();
    if (d.success) { showToast(`Status: ${newStatus}`); load(); }
    else showToast(d.message || "Error", false);
  }

  return (
    <div>
      {/* Search bar */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load(1, search, status)}
          placeholder="Search patient, report ID, template..." className={`flex-1 min-w-48 ${INP}`} />
        <select value={status} onChange={e => { setStatus(e.target.value); load(1, search, e.target.value); }} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white">
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="final">Final</option>
        </select>
        <button onClick={() => load(1, search, status)} className="bg-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 transition">
          Search
        </button>
      </div>

      {loading ? <Spinner /> : reports.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🧪</p>
          <p>Koi report nahi mili</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-3">{total} reports found</p>
          <div className="space-y-3">
            {reports.map(r => {
              const sampleBadge =
                r.sampleStatus === "received" ? "bg-green-100 text-green-700 border-green-200" :
                r.sampleStatus === "rejected"  ? "bg-red-100 text-red-700 border-red-200" :
                "bg-amber-100 text-amber-700 border-amber-200";
              const sampleLabel =
                r.sampleStatus === "received" ? "✅ Sample Received" :
                r.sampleStatus === "rejected"  ? "❌ Sample Rejected" : "⏳ SNR";
              return (
              <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800 text-sm">{r.patientName}</span>
                      {r.patientAge && <span className="text-xs text-gray-400">{r.patientAge}y</span>}
                      {r.patientGender && <span className="text-xs text-gray-400 capitalize">{r.patientGender}</span>}
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[r.status]}`}>{r.status.toUpperCase()}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${sampleBadge}`}>{sampleLabel}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{r.templateName} • {r.reportId}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Collection: {fmtDate(r.collectionDate)} | Report: {fmtDate(r.reportDate)}
                      {r.referredBy && ` | Ref: Dr. ${r.referredBy}`}
                    </p>
                    {r.sampleStatus === "received" && r.sampleReceivedAt && (
                      <p className="text-xs text-green-600 mt-0.5">
                        Received: {new Date(r.sampleReceivedAt).toLocaleString("en-IN", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })}
                        {r.sampleReceivedBy && ` by ${r.sampleReceivedBy}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <button onClick={() => onEdit(r.reportId)}
                      className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-purple-100 transition">
                      ✏️ Edit Values
                    </button>
                    <a href={`/lab-report/${r.reportId}`} target="_blank" rel="noreferrer"
                      className="bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-teal-100 transition">
                      🖨️ Print
                    </a>
                    <button onClick={() => toggleStatus(r)}
                      className="bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100 transition">
                      {r.status === "draft" ? "✓ Finalise" : "↩ Draft"}
                    </button>
                    <button onClick={() => deleteReport(r)} disabled={deleting === r._id}
                      className="bg-red-50 text-red-600 border border-red-100 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-100 transition disabled:opacity-50">
                      🗑
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button disabled={page <= 1} onClick={() => load(page - 1)} className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40">←</button>
              <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {pages}</span>
              <button disabled={page >= pages} onClick={() => load(page + 1)} className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40">→</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2: Create Report
// ═══════════════════════════════════════════════════════════════════════════════
function CreateTab({ hospitalId, showToast, onCreated }: {
  hospitalId: string; showToast: (m: string, ok?: boolean) => void; onCreated: () => void;
}) {
  const [step, setStep]                 = useState<1 | 2 | 3>(1);
  const [templates, setTemplates]       = useState<Template[]>([]);
  const [deptFilter, setDeptFilter]     = useState("All");
  const [selTemplate, setSelTemplate]   = useState<Template | null>(null);
  const [saving, setSaving]             = useState(false);

  // Patient form
  const [patient, setPatient] = useState({
    name: "", age: "", gender: "male", mobile: "", refId: "",
    referredBy: "", sampleType: "", collectionDate: todayISO(), reportDate: todayISO(),
  });

  // Results
  const [results, setResults] = useState<ResultRow[]>([]);
  const [reportMeta, setReportMeta] = useState({ technicianName: "", doctorName: "", status: "draft" });

  useEffect(() => {
    fetch("/api/lab-templates/defaults")
      .then(r => r.json())
      .then(d => { if (d.success) setTemplates(d.templates || []); });
  }, []);

  function selectTemplate(t: Template) {
    setSelTemplate(t);
    const rows: ResultRow[] = (t.parameters || []).map(p => ({
      paramId: p.paramId || "", name: p.name, value: "", unit: p.unit,
      refRangeText: p.refRangeText, flag: "", type: p.type, section: p.section || "",
    }));
    setResults(rows);
    setPatient(prev => ({ ...prev, sampleType: t.sampleType }));
    setStep(2);
  }

  function updateResult(idx: number, field: keyof ResultRow, val: string) {
    setResults(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  }

  function addCustomRow() {
    setResults(prev => [...prev, { name: "", value: "", unit: "", refRangeText: "", flag: "", type: "numeric" }]);
  }

  async function saveReport() {
    if (!patient.name.trim() || !selTemplate) { showToast("Patient naam aur template zaruri hai", false); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/hospital/lab-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalId,
          templateName: selTemplate.name,
          category:     selTemplate.category,
          sampleType:   patient.sampleType || selTemplate.sampleType,
          referredBy:   patient.referredBy,
          patientName:  patient.name.trim(),
          patientAge:   patient.age ? Number(patient.age) : undefined,
          patientGender: patient.gender,
          patientMobile: patient.mobile,
          patientRefId:  patient.refId,
          results,
          technicianName: reportMeta.technicianName,
          doctorName:     reportMeta.doctorName,
          collectionDate: patient.collectionDate,
          reportDate:     patient.reportDate,
          status:         reportMeta.status,
        }),
      });
      const d = await res.json();
      if (d.success) {
        showToast(`Report create ho gayi! ID: ${d.report?.reportId}`);
        onCreated();
      } else showToast(d.message || "Error", false);
    } finally { setSaving(false); }
  }

  const depts = ["All", ...DEPARTMENTS];
  const filtered = deptFilter === "All" ? templates : templates.filter(t => t.department === deptFilter);

  if (step === 1) return (
    <div>
      <h2 className="text-base font-bold text-gray-800 mb-4">Template Select Karein</h2>
      {/* Dept filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        {depts.map(d => (
          <button key={d} onClick={() => setDeptFilter(d)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${deptFilter === d ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"}`}>
            {d}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((t, i) => (
          <button key={i} onClick={() => selectTemplate(t)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left hover:border-purple-300 hover:shadow transition">
            <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
            <p className="text-xs text-purple-600 mt-1">{t.department}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t.category} • {t.sampleType}</p>
            <p className="text-xs text-gray-400 mt-1">{t.parameters?.length || 0} parameters</p>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">🔬</p><p>Is department mein koi template nahi</p>
          </div>
        )}
      </div>
    </div>
  );

  if (step === 2) return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => setStep(1)} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
        <div>
          <h2 className="text-base font-bold text-gray-800">{selTemplate?.name}</h2>
          <p className="text-xs text-gray-400">{selTemplate?.department} • {selTemplate?.sampleType}</p>
        </div>
      </div>

      {/* Patient Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-4">Patient Details</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className={LBL}>Patient Name *</label><input value={patient.name} onChange={e => setPatient(p => ({ ...p, name: e.target.value }))} className={INP} placeholder="Full name" /></div>
          <div><label className={LBL}>Age</label><input type="number" value={patient.age} onChange={e => setPatient(p => ({ ...p, age: e.target.value }))} className={INP} placeholder="Years" /></div>
          <div><label className={LBL}>Gender</label>
            <select value={patient.gender} onChange={e => setPatient(p => ({ ...p, gender: e.target.value }))} className={SEL}>
              <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
            </select>
          </div>
          <div><label className={LBL}>Mobile</label><input value={patient.mobile} onChange={e => setPatient(p => ({ ...p, mobile: e.target.value }))} className={INP} placeholder="10-digit" /></div>
          <div><label className={LBL}>Ref. Doctor</label><input value={patient.referredBy} onChange={e => setPatient(p => ({ ...p, referredBy: e.target.value }))} className={INP} placeholder="Dr. Name" /></div>
          <div><label className={LBL}>Sample Type</label>
            <select value={patient.sampleType} onChange={e => setPatient(p => ({ ...p, sampleType: e.target.value }))} className={SEL}>
              {SAMPLE_TYPES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div><label className={LBL}>Patient Ref. ID</label><input value={patient.refId} onChange={e => setPatient(p => ({ ...p, refId: e.target.value }))} className={INP} placeholder="Optional" /></div>
          <div><label className={LBL}>Collection Date</label><input type="date" value={patient.collectionDate} onChange={e => setPatient(p => ({ ...p, collectionDate: e.target.value }))} className={INP} /></div>
          <div><label className={LBL}>Report Date</label><input type="date" value={patient.reportDate} onChange={e => setPatient(p => ({ ...p, reportDate: e.target.value }))} className={INP} /></div>
        </div>
      </div>

      {/* Results Entry */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700">Test Results <span className="text-xs font-normal text-gray-400">({results.length} parameters)</span></h3>
          <div className="flex gap-2 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full" />High</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-400 rounded-full" />Low</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[600px]">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="px-3 py-2 text-left font-semibold w-[35%]">Parameter</th>
                <th className="px-3 py-2 text-left font-semibold w-[16%]">Value</th>
                <th className="px-3 py-2 text-left font-semibold w-[10%]">Unit</th>
                <th className="px-3 py-2 text-left font-semibold w-[25%]">Ref. Range</th>
                <th className="px-3 py-2 text-center font-semibold w-[14%]">Flag</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const rows: React.ReactNode[] = [];
                let lastSection = "__INIT__";
                let rowIdx = 0;
                results.forEach((row, idx) => {
                  const sec = row.section || "";
                  if (sec && sec !== lastSection) {
                    rows.push(
                      <tr key={`sec-${idx}`} className="bg-teal-600">
                        <td colSpan={5} className="px-3 py-1.5">
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">{sec}</span>
                        </td>
                      </tr>
                    );
                    rowIdx = 0;
                  }
                  lastSection = sec;
                  rows.push(
                    <tr key={idx} className={`border-b border-gray-100 ${row.flag === "H" ? "bg-red-50" : row.flag === "L" ? "bg-blue-50" : rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                      <td className="px-2 py-1.5" style={{ paddingLeft: sec ? "20px" : "8px" }}>
                        {row.paramId ? (
                          <span className="text-gray-700 font-medium">{row.name}</span>
                        ) : (
                          <input value={row.name} onChange={e => updateResult(idx, "name", e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400" placeholder="Parameter name" />
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={row.value} onChange={e => updateResult(idx, "value", e.target.value)}
                          className={`w-full border rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-purple-400 ${row.flag === "H" ? "border-red-400 bg-red-50 text-red-700" : row.flag === "L" ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200"}`}
                          placeholder="Enter value" />
                      </td>
                      <td className="px-2 py-1.5 text-gray-500">
                        <span>{row.unit}</span>
                      </td>
                      <td className="px-2 py-1.5 text-[10px] text-gray-500 leading-relaxed">{row.refRangeText}</td>
                      <td className="px-2 py-1.5 text-center">
                        <select value={row.flag} onChange={e => updateResult(idx, "flag", e.target.value as ResultRow["flag"])}
                          className={`border rounded-lg px-1.5 py-1 text-xs font-bold focus:outline-none ${row.flag === "H" ? "bg-red-100 text-red-700 border-red-300" : row.flag === "L" ? "bg-blue-100 text-blue-700 border-blue-300" : "bg-white text-gray-500 border-gray-200"}`}>
                          <option value="">Normal</option>
                          <option value="H">↑ High</option>
                          <option value="L">↓ Low</option>
                        </select>
                      </td>
                    </tr>
                  );
                  rowIdx++;
                });
                return rows;
              })()}
            </tbody>
          </table>
        </div>
        <button onClick={addCustomRow} className="mt-3 text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1">
          + Add Custom Row
        </button>
      </div>

      {/* Sign-off */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Sign-off Details</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={LBL}>Technician Name</label><input value={reportMeta.technicianName} onChange={e => setReportMeta(m => ({ ...m, technicianName: e.target.value }))} className={INP} placeholder="Lab technician" /></div>
          <div><label className={LBL}>Doctor / Pathologist</label><input value={reportMeta.doctorName} onChange={e => setReportMeta(m => ({ ...m, doctorName: e.target.value }))} className={INP} placeholder="Verifying doctor" /></div>
          <div className="col-span-2">
            <label className={LBL}>Report Status</label>
            <div className="flex gap-3">
              {["draft", "final"].map(s => (
                <label key={s} onClick={() => setReportMeta(m => ({ ...m, status: s }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer text-sm font-semibold transition ${reportMeta.status === s ? "bg-purple-50 border-purple-400 text-purple-700" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
                  <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${reportMeta.status === s ? "border-purple-500 bg-purple-500" : "border-gray-300"}`} />
                  {s === "draft" ? "Draft (Save kar lo)" : "Final (Print ready)"}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">← Template Change</button>
        <button onClick={saveReport} disabled={saving}
          className="bg-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2">
          {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : "💾 Save Report"}
        </button>
      </div>
    </div>
  );

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3: Lab Settings
// ═══════════════════════════════════════════════════════════════════════════════
function SettingsTab({ hospitalId, showToast }: { hospitalId: string; showToast: (m: string, ok?: boolean) => void }) {
  const [settings, setSettings] = useState<LabSettings>({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRefs = {
    logo:      useRef<HTMLInputElement>(null),
    letterhead: useRef<HTMLInputElement>(null),
    pathSign:   useRef<HTMLInputElement>(null),
    techSign:   useRef<HTMLInputElement>(null),
  };

  useEffect(() => {
    if (!hospitalId) return;
    fetch(`/api/hospital/lab-settings?hospitalId=${hospitalId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setSettings(d.settings || {}); })
      .finally(() => setLoading(false));
  }, [hospitalId]);

  async function uploadImage(field: string, file: File) {
    setUploading(field);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", "ml_default");
    fd.append("folder", "lab-settings");
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "de1yqlwub";
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
      const d   = await res.json();
      if (d.secure_url) {
        setSettings(s => ({ ...s, [field]: d.secure_url }));
        showToast("Image upload ho gayi!");
      } else showToast("Upload failed", false);
    } catch { showToast("Upload error", false); }
    setUploading(null);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/hospital/lab-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalId, ...settings }),
      });
      const d = await res.json();
      if (d.success) showToast("Settings save ho gayi! Sabhi reports pe apply hongi.");
      else showToast(d.message || "Error", false);
    } finally { setSaving(false); }
  }

  if (loading) return <Spinner />;

  const set = (k: keyof LabSettings, v: any) => setSettings(s => ({ ...s, [k]: v }));
  const U = (label: string, field: string, fileRef: React.RefObject<HTMLInputElement | null>, current?: string) => (
    <div>
      <label className={LBL}>{label}</label>
      <div className="flex gap-2 items-center">
        {current && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current} alt={label} className="h-12 w-auto rounded-lg border border-gray-200 object-contain" />
        )}
        <label className="cursor-pointer">
          <span className={`inline-flex items-center gap-1.5 px-3 py-2 border border-dashed border-purple-300 rounded-xl text-xs text-purple-600 hover:bg-purple-50 transition ${uploading === field ? "opacity-50" : ""}`}>
            {uploading === field ? "⏳ Uploading..." : current ? "🔄 Change" : "📤 Upload"}
          </span>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files?.[0] && uploadImage(field, e.target.files[0])} />
        </label>
        {current && <button onClick={() => set(field as keyof LabSettings, "")} className="text-red-400 hover:text-red-600 text-xs">✕</button>}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Lab Identity */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-4">🏷️ Lab Identity</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className={LBL}>Lab Name (Report Heading)</label><input value={settings.labName || ""} onChange={e => set("labName", e.target.value)} className={INP} placeholder="e.g. Brims Diagnostic Lab" /></div>
          <div className="col-span-2"><label className={LBL}>Address</label><textarea value={settings.address || ""} onChange={e => set("address", e.target.value)} className={`${INP} resize-none`} rows={2} placeholder="Full address..." /></div>
          <div><label className={LBL}>Phone</label><input value={settings.phone || ""} onChange={e => set("phone", e.target.value)} className={INP} /></div>
          <div><label className={LBL}>Email</label><input value={settings.email || ""} onChange={e => set("email", e.target.value)} className={INP} /></div>
          <div><label className={LBL}>Website</label><input value={settings.website || ""} onChange={e => set("website", e.target.value)} className={INP} /></div>
          <div><label className={LBL}>Lab Reg. No.</label><input value={settings.labRegNo || ""} onChange={e => set("labRegNo", e.target.value)} className={INP} /></div>
          <div><label className={LBL}>NABL No.</label><input value={settings.nablNo || ""} onChange={e => set("nablNo", e.target.value)} className={INP} /></div>
        </div>
        <div className="mt-3">
          {U("Lab Logo", "logoUrl", fileRefs.logo, settings.logoUrl)}
        </div>
      </div>

      {/* Letterhead */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-1">📄 Custom Letterhead</h3>
        <p className="text-xs text-gray-400 mb-4">Custom letterhead upload karein toh poora header replace ho jaayega</p>
        <div className="flex items-center gap-3 mb-3">
          <label onClick={() => set("useCustomLetterhead", !settings.useCustomLetterhead)} className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl border text-sm font-semibold transition ${settings.useCustomLetterhead ? "bg-purple-50 border-purple-300 text-purple-700" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
            <span className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${settings.useCustomLetterhead ? "border-purple-500 bg-purple-500" : "border-gray-300"}`}>
              {settings.useCustomLetterhead && <svg viewBox="0 0 12 12" className="w-3 h-3"><polyline points="2,6 5,9 10,4" stroke="white" strokeWidth="2" fill="none"/></svg>}
            </span>
            Custom Letterhead Use Karein
          </label>
        </div>
        {settings.useCustomLetterhead && U("Letterhead Image (A4 width recommended)", "letterheadUrl", fileRefs.letterhead, settings.letterheadUrl)}
      </div>

      {/* Staff Signatures */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-4">✍️ Pathologist & Technician</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div><label className={LBL}>Pathologist Name</label><input value={settings.pathologistName || ""} onChange={e => set("pathologistName", e.target.value)} className={INP} /></div>
            <div><label className={LBL}>Qualification</label><input value={settings.pathologistQual || ""} onChange={e => set("pathologistQual", e.target.value)} className={INP} placeholder="MD Pathology, MBBS" /></div>
            {U("Pathologist Signature", "pathologistSign", fileRefs.pathSign, settings.pathologistSign)}
          </div>
          <div className="space-y-3">
            <div><label className={LBL}>Technician Name</label><input value={settings.technicianName || ""} onChange={e => set("technicianName", e.target.value)} className={INP} /></div>
            <div><label className={LBL}>Qualification</label><input value={settings.technicianQual || ""} onChange={e => set("technicianQual", e.target.value)} className={INP} placeholder="DMLT, B.Sc MLT" /></div>
            {U("Technician Signature", "technicianSign", fileRefs.techSign, settings.technicianSign)}
          </div>
        </div>
      </div>

      {/* GST / Invoice Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-4">🧾 Invoice & GST Settings</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={LBL}>GSTIN</label><input value={settings.gstNumber || ""} onChange={e => set("gstNumber", e.target.value)} className={INP} placeholder="22AAAAA0000A1Z5" /></div>
          <div><label className={LBL}>PAN Number</label><input value={settings.panNumber || ""} onChange={e => set("panNumber", e.target.value)} className={INP} /></div>
          <div><label className={LBL}>Invoice Prefix</label><input value={settings.invoicePrefix || "INV"} onChange={e => set("invoicePrefix", e.target.value)} className={INP} placeholder="INV" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={LBL}>CGST %</label><input type="number" value={settings.cgstRate ?? 0} onChange={e => set("cgstRate", parseFloat(e.target.value) || 0)} className={INP} min={0} max={28} /></div>
            <div><label className={LBL}>SGST %</label><input type="number" value={settings.sgstRate ?? 0} onChange={e => set("sgstRate", parseFloat(e.target.value) || 0)} className={INP} min={0} max={28} /></div>
          </div>
          <div className="col-span-2"><label className={LBL}>Invoice Footer Text</label><input value={settings.invoiceFooter || ""} onChange={e => set("invoiceFooter", e.target.value)} className={INP} placeholder="e.g. Thank you for choosing Brims Hospitals" /></div>
          <div className="col-span-2"><label className={LBL}>Terms & Conditions</label><textarea value={settings.termsText || ""} onChange={e => set("termsText", e.target.value)} className={`${INP} resize-none`} rows={3} placeholder="All payments are non-refundable..." /></div>
        </div>
      </div>

      <div className="flex justify-end pb-6">
        <button onClick={save} disabled={saving}
          className="bg-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2">
          {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : "💾 Save Settings"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4: Invoices
// ═══════════════════════════════════════════════════════════════════════════════
function InvoicesTab({ hospitalId, showToast }: { hospitalId: string; showToast: (m: string, ok?: boolean) => void }) {
  const [view, setView]       = useState<"list" | "create">("list");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total,    setTotal]  = useState(0);
  const [page,     setPage]   = useState(1);
  const [pages,    setPages]  = useState(1);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState("");

  const loadInvoices = useCallback((pg = 1, q = search, st = status) => {
    if (!hospitalId) return;
    setLoading(true);
    const params = new URLSearchParams({ hospitalId, page: String(pg) });
    if (q)  params.set("search", q);
    if (st) params.set("status", st);
    fetch(`/api/hospital/invoice?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) { setInvoices(d.invoices || []); setTotal(d.total || 0); setPages(d.pages || 1); setPage(pg); }
      })
      .finally(() => setLoading(false));
  }, [hospitalId, search, status]);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  if (view === "create") return (
    <CreateInvoiceForm hospitalId={hospitalId} showToast={showToast}
      onCreated={() => { setView("list"); loadInvoices(1); }} onCancel={() => setView("list")} />
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-base font-bold text-gray-800">🧾 Invoices</h2>
        <button onClick={() => setView("create")} className="bg-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 transition">
          + New Invoice
        </button>
      </div>
      <div className="flex gap-3 mb-4 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && loadInvoices(1, search, status)}
          placeholder="Patient name, invoice ID..." className={`flex-1 min-w-48 ${INP}`} />
        <select value={status} onChange={e => { setStatus(e.target.value); loadInvoices(1, search, e.target.value); }}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white">
          <option value="">All</option><option value="draft">Draft</option>
          <option value="paid">Paid</option><option value="partial">Partial</option><option value="cancelled">Cancelled</option>
        </select>
        <button onClick={() => loadInvoices(1, search, status)} className="bg-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 transition">Search</button>
      </div>

      {loading ? <Spinner /> : invoices.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><p className="text-4xl mb-3">🧾</p><p>Koi invoice nahi mili</p></div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-3">{total} invoices</p>
          <div className="space-y-3">
            {invoices.map(inv => (
              <div key={inv._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800 text-sm">{inv.patientName}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[inv.status]}`}>{inv.status.toUpperCase()}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{inv.invoiceId} • {fmtDate(inv.invoiceDate)}</p>
                  <div className="flex gap-4 mt-1">
                    <span className="text-xs text-gray-700">Total: <strong>₹{inv.totalAmount.toFixed(2)}</strong></span>
                    <span className="text-xs text-green-600">Paid: ₹{inv.paidAmount.toFixed(2)}</span>
                    {inv.balanceAmount > 0 && <span className="text-xs text-red-500">Due: ₹{inv.balanceAmount.toFixed(2)}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={`/invoice/${inv.invoiceId}`} target="_blank" rel="noreferrer"
                    className="bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-teal-100 transition">
                    🖨️ Print
                  </a>
                </div>
              </div>
            ))}
          </div>
          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button disabled={page <= 1} onClick={() => loadInvoices(page - 1)} className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40">←</button>
              <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {pages}</span>
              <button disabled={page >= pages} onClick={() => loadInvoices(page + 1)} className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40">→</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Create Invoice Sub-form ──────────────────────────────────────────────────
function CreateInvoiceForm({ hospitalId, showToast, onCreated, onCancel }: {
  hospitalId: string; showToast: (m: string, ok?: boolean) => void;
  onCreated: () => void; onCancel: () => void;
}) {
  const [patient, setPatient] = useState({ name: "", mobile: "", age: "", gender: "male", address: "" });
  const [labReportId, setLabReportId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(todayISO());
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paidAmount, setPaidAmount]   = useState("");
  const [notes, setNotes]             = useState("");
  const [saving, setSaving]           = useState(false);
  const [items, setItems]             = useState([
    { description: "", hsnCode: "999312", quantity: 1, rate: "", discount: "0", cgstRate: 0, sgstRate: 0 },
  ]);
  const [settings, setSettings]       = useState<LabSettings>({});

  useEffect(() => {
    if (!hospitalId) return;
    fetch(`/api/hospital/lab-settings?hospitalId=${hospitalId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setSettings(d.settings || {});
          // Apply lab's GST rates to initial item
          const cg = d.settings?.cgstRate || 0;
          const sg = d.settings?.sgstRate || 0;
          setItems([{ description: "", hsnCode: "999312", quantity: 1, rate: "", discount: "0", cgstRate: cg, sgstRate: sg }]);
        }
      });
  }, [hospitalId]);

  function setItem(idx: number, k: string, v: any) {
    setItems(prev => { const n = [...prev]; n[idx] = { ...n[idx], [k]: v }; return n; });
  }
  function addItem() {
    setItems(prev => [...prev, { description: "", hsnCode: "999312", quantity: 1, rate: "", discount: "0", cgstRate: settings.cgstRate || 0, sgstRate: settings.sgstRate || 0 }]);
  }
  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  const subtotal  = items.reduce((s, it) => s + ((Number(it.quantity) * Number(it.rate || 0)) - Number(it.discount || 0)), 0);
  const totalGst  = items.reduce((s, it) => {
    const taxable = (Number(it.quantity) * Number(it.rate || 0)) - Number(it.discount || 0);
    return s + taxable * ((it.cgstRate + it.sgstRate) / 100);
  }, 0);
  const rawTotal  = subtotal + totalGst;
  const roundOff  = Math.round(rawTotal) - rawTotal;
  const grandTotal = rawTotal + roundOff;

  async function save() {
    if (!patient.name.trim()) { showToast("Patient naam zaruri hai", false); return; }
    if (!items.some(it => it.description.trim() && Number(it.rate) > 0)) {
      showToast("Kam se kam ek item complete karein", false); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/hospital/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalId,
          patientName:    patient.name.trim(),
          patientMobile:  patient.mobile,
          patientAge:     patient.age ? Number(patient.age) : undefined,
          patientGender:  patient.gender,
          patientAddress: patient.address,
          labReportId,
          items: items.filter(it => it.description.trim() && Number(it.rate) > 0).map(it => ({
            description: it.description,
            hsnCode:     it.hsnCode,
            quantity:    Number(it.quantity),
            rate:        Number(it.rate),
            discount:    Number(it.discount || 0),
            cgstRate:    Number(it.cgstRate),
            sgstRate:    Number(it.sgstRate),
          })),
          paymentMode,
          paidAmount: paidAmount !== "" ? Number(paidAmount) : undefined,
          notes,
          invoiceDate,
        }),
      });
      const d = await res.json();
      if (d.success) {
        showToast(`Invoice create ho gayi! ${d.invoice?.invoiceId}`);
        onCreated();
      } else showToast(d.message || "Error", false);
    } finally { setSaving(false); }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-sm">← Cancel</button>
        <h2 className="text-base font-bold text-gray-800">New Invoice</h2>
      </div>

      {/* Patient */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Patient Details</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className={LBL}>Patient Name *</label><input value={patient.name} onChange={e => setPatient(p => ({ ...p, name: e.target.value }))} className={INP} placeholder="Full name" /></div>
          <div><label className={LBL}>Mobile</label><input value={patient.mobile} onChange={e => setPatient(p => ({ ...p, mobile: e.target.value }))} className={INP} /></div>
          <div><label className={LBL}>Age</label><input type="number" value={patient.age} onChange={e => setPatient(p => ({ ...p, age: e.target.value }))} className={INP} /></div>
          <div><label className={LBL}>Gender</label>
            <select value={patient.gender} onChange={e => setPatient(p => ({ ...p, gender: e.target.value }))} className={SEL}>
              <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
            </select>
          </div>
          <div><label className={LBL}>Invoice Date</label><input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className={INP} /></div>
          <div className="col-span-2"><label className={LBL}>Patient Address</label><input value={patient.address} onChange={e => setPatient(p => ({ ...p, address: e.target.value }))} className={INP} /></div>
          <div><label className={LBL}>Lab Report Ref. (optional)</label><input value={labReportId} onChange={e => setLabReportId(e.target.value)} className={INP} placeholder="LR-00001" /></div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Items / Services</h3>
        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-4"><label className={idx === 0 ? LBL : "hidden"}>Description</label><input value={it.description} onChange={e => setItem(idx, "description", e.target.value)} className={INP} placeholder="Test / Service name" /></div>
              <div className="col-span-1"><label className={idx === 0 ? LBL : "hidden"}>Qty</label><input type="number" value={it.quantity} onChange={e => setItem(idx, "quantity", e.target.value)} className={INP} min={1} /></div>
              <div className="col-span-2"><label className={idx === 0 ? LBL : "hidden"}>Rate (₹)</label><input type="number" value={it.rate} onChange={e => setItem(idx, "rate", e.target.value)} className={INP} placeholder="0" /></div>
              <div className="col-span-2"><label className={idx === 0 ? LBL : "hidden"}>Discount (₹)</label><input type="number" value={it.discount} onChange={e => setItem(idx, "discount", e.target.value)} className={INP} placeholder="0" /></div>
              <div className="col-span-1"><label className={idx === 0 ? LBL : "hidden"}>CGST%</label><input type="number" value={it.cgstRate} onChange={e => setItem(idx, "cgstRate", parseFloat(e.target.value) || 0)} className={INP} /></div>
              <div className="col-span-1"><label className={idx === 0 ? LBL : "hidden"}>SGST%</label><input type="number" value={it.sgstRate} onChange={e => setItem(idx, "sgstRate", parseFloat(e.target.value) || 0)} className={INP} /></div>
              <div className="col-span-1 flex items-end">
                <span className="text-xs font-bold text-gray-700 pb-2.5">
                  ₹{(((Number(it.quantity) * Number(it.rate || 0)) - Number(it.discount || 0)) * (1 + (it.cgstRate + it.sgstRate)/100)).toFixed(0)}
                </span>
                {items.length > 1 && (
                  <button onClick={() => removeItem(idx)} className="ml-1 text-red-400 hover:text-red-600 text-sm pb-2.5">✕</button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button onClick={addItem} className="mt-3 text-xs text-purple-600 hover:text-purple-700 font-semibold">+ Add Item</button>

        {/* Totals preview */}
        <div className="mt-4 flex justify-end">
          <div className="w-64 text-xs space-y-1 border border-gray-100 rounded-xl p-3">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
            {totalGst > 0 && <div className="flex justify-between text-gray-500"><span>GST</span><span>₹{totalGst.toFixed(2)}</span></div>}
            {roundOff !== 0 && <div className="flex justify-between text-gray-500"><span>Round Off</span><span>{roundOff > 0 ? "+" : ""}{roundOff.toFixed(2)}</span></div>}
            <div className="flex justify-between font-bold text-teal-700 border-t border-gray-100 pt-1"><span>Total</span><span>₹{grandTotal.toFixed(2)}</span></div>
          </div>
        </div>
      </div>

      {/* Payment */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Payment</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={LBL}>Payment Mode</label>
            <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className={SEL}>
              {PAY_MODES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div><label className={LBL}>Paid Amount (₹) — blank = full payment</label>
            <input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className={INP} placeholder={grandTotal.toFixed(2)} />
          </div>
          <div className="col-span-2"><label className={LBL}>Notes</label><input value={notes} onChange={e => setNotes(e.target.value)} className={INP} placeholder="Optional..." /></div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pb-6">
        <button onClick={onCancel} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
        <button onClick={save} disabled={saving}
          className="bg-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2">
          {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : "🧾 Create Invoice"}
        </button>
      </div>
    </div>
  );
}
