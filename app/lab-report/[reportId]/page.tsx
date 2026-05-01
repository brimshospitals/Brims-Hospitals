"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

function fmt(d?: string | Date) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(d?: string | Date) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

const FLAG_BADGE: Record<string, string> = {
  H: "bg-red-100 text-red-700 border-red-300",
  L: "bg-blue-100 text-blue-700 border-blue-300",
  N: "bg-green-100 text-green-700 border-green-300",
};
const FLAG_LABEL: Record<string, string> = { H: "HIGH ↑", L: "LOW ↓", N: "NORMAL" };

export default function LabReportPage() {
  const params   = useParams();
  const reportId = params?.reportId as string;

  const [report,      setReport]      = useState<any>(null);
  const [hospital,    setHospital]    = useState<any>(null);
  const [labSettings, setLabSettings] = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");

  useEffect(() => {
    if (!reportId) return;
    fetch(`/api/hospital/lab-reports?reportId=${reportId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setReport(d.report);
          setHospital(d.hospital);
          setLabSettings(d.labSettings || null);
        } else {
          setError(d.message || "Report not found");
        }
      })
      .catch(() => setError("Network error. Please refresh."))
      .finally(() => setLoading(false));
  }, [reportId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500">Loading report…</p>
      </div>
    </div>
  );

  if (error || !report) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center space-y-3">
        <p className="text-5xl">⚠️</p>
        <p className="text-gray-700 font-semibold">{error || "Report not found"}</p>
        <button onClick={() => window.location.reload()} className="text-sm text-teal-600 underline">Retry</button>
      </div>
    </div>
  );

  // ── Resolve display values: LabSettings > Hospital model ──
  const ls        = labSettings;
  const logoUrl   = ls?.logoUrl   || hospital?.photos?.[0] || null;
  const labName   = ls?.labName   || hospital?.name        || "Brims Hospitals";
  const addr      = ls?.address   || (() => {
    const a = hospital?.address || {};
    return [a.street, a.city, a.district, "Bihar", a.pincode].filter(Boolean).join(", ");
  })();
  const phone     = ls?.phone     || hospital?.mobile  || "";
  const email     = ls?.email     || hospital?.email   || "";
  const website   = ls?.website   || hospital?.website || "";
  const labRegNo  = ls?.labRegNo  || "";
  const nablNo    = ls?.nablNo    || "";

  const pathName  = ls?.pathologistName || report.doctorName     || "Consulting Doctor";
  const pathQual  = ls?.pathologistQual || "";
  const pathSign  = ls?.pathologistSign || null;

  const techName  = ls?.technicianName  || report.technicianName || "Lab Technician";
  const techQual  = ls?.technicianQual  || "";
  const techSign  = ls?.technicianSign  || null;

  const isDraft        = report.status === "draft";
  const abnormalCount  = (report.results || []).filter((r: any) => r.flag === "H" || r.flag === "L").length;
  const genderLabel    = (g: string) => g === "male" ? "Male" : g === "female" ? "Female" : "Other";

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { margin: 10mm 10mm; size: A4 portrait; }
        }
        @media screen { body { background: #f3f4f6; } }
      `}</style>

      {/* ── Action bar ── */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <button onClick={() => window.history.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium">
            ← Back
          </button>
          <div className="flex items-center gap-2">
            {isDraft && (
              <span className="bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full font-bold border border-amber-200">
                ⚠ DRAFT
              </span>
            )}
            <button onClick={() => window.print()}
              className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl font-semibold text-sm shadow transition flex items-center gap-2">
              🖨️ Print / PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── A4 Page ── */}
      <div className="min-h-screen bg-gray-100 pt-16 pb-10 px-4 print:bg-white print:pt-0 print:pb-0 print:px-0">
        <div className="max-w-[794px] mx-auto bg-white shadow-2xl print:shadow-none">

          {/* ════ CUSTOM LETTERHEAD (if uploaded) ════ */}
          {ls?.useCustomLetterhead && ls?.letterheadUrl ? (
            <img src={ls.letterheadUrl} alt="Letterhead"
              className="w-full object-contain block"
              style={{ maxHeight: "160px" }} />
          ) : (
            /* ════ STANDARD HEADER ════ */
            <div className="border-b-[3px] border-teal-600">
              <div className="h-1.5 bg-gradient-to-r from-teal-700 via-teal-500 to-teal-700" />
              <div className="px-7 py-4 flex items-start justify-between gap-4">
                {/* Left: Lab branding */}
                <div className="flex items-start gap-3 flex-1">
                  {logoUrl && (
                    <img src={logoUrl} alt="Logo"
                      className="h-14 w-14 object-contain rounded-lg border border-gray-100 flex-shrink-0" />
                  )}
                  <div>
                    <h1 className="text-lg font-black text-teal-700 leading-tight">{labName}</h1>
                    {ls?.labName && hospital?.name && ls.labName !== hospital.name && (
                      <p className="text-xs text-teal-600 font-semibold">{hospital.name}</p>
                    )}
                    {addr && <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{addr}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                      {phone   && <span className="text-[11px] text-gray-500">📞 {phone}</span>}
                      {email   && <span className="text-[11px] text-gray-500">✉ {email}</span>}
                      {website && <span className="text-[11px] text-gray-500">🌐 {website}</span>}
                    </div>
                    {(labRegNo || nablNo) && (
                      <div className="flex gap-4 mt-1">
                        {labRegNo && <p className="text-[10px] text-gray-400">Lab Reg: {labRegNo}</p>}
                        {nablNo   && <p className="text-[10px] text-gray-400">NABL: {nablNo}</p>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Report ID + dates */}
                <div className="flex-shrink-0 text-right space-y-2">
                  <div className="bg-teal-600 text-white px-4 py-2.5 rounded-xl inline-block">
                    <p className="text-[9px] font-semibold uppercase tracking-widest opacity-80">Report No.</p>
                    <p className="text-base font-black tracking-wide">{report.reportId}</p>
                  </div>
                  <div className="space-y-1 text-[11px] text-gray-500">
                    <p><span className="font-medium text-gray-600">Collected:</span> {fmt(report.collectionDate)} {fmtTime(report.collectionDate)}</p>
                    {(report as any).sampleReceivedAt && (
                      <p><span className="font-medium text-gray-600">Sample Received:</span> {fmt((report as any).sampleReceivedAt)} {fmtTime((report as any).sampleReceivedAt)}</p>
                    )}
                    <p><span className="font-medium text-gray-600">Report Date:</span> {fmt(report.reportDate)}</p>
                    <p><span className="font-medium text-gray-600">Sample:</span> <span className="text-teal-700 font-semibold">{report.sampleType || "Blood"}</span></p>
                  </div>
                  {isDraft && (
                    <div className="bg-amber-50 border border-amber-300 rounded-lg px-3 py-1.5 text-center">
                      <p className="text-[10px] font-black text-amber-700 tracking-wider">DRAFT REPORT</p>
                      <p className="text-[9px] text-amber-600">Not validated</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════ PATIENT INFO ════ */}
          <div className="mx-6 my-4 rounded-xl border border-teal-100 overflow-hidden">
            <div className="bg-teal-600 px-4 py-1.5">
              <p className="text-[10px] font-black text-white uppercase tracking-widest">Patient Information</p>
            </div>
            <div className="bg-teal-50/40 px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2">
              <div>
                <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Patient Name</p>
                <p className="text-sm font-black text-gray-800">{report.patientName}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Age / Gender</p>
                <p className="text-sm font-bold text-gray-700">
                  {report.patientAge ? `${report.patientAge} Yrs` : "—"} / {genderLabel(report.patientGender)}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Mobile</p>
                <p className="text-sm font-semibold text-gray-700">{report.patientMobile || "—"}</p>
              </div>
              <div>
                {report.patientRefId ? (
                  <>
                    <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Member / Ref ID</p>
                    <p className="text-sm font-semibold text-gray-700">{report.patientRefId}</p>
                  </>
                ) : report.referredBy ? (
                  <>
                    <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Referred By</p>
                    <p className="text-sm font-semibold text-gray-700">{report.referredBy}</p>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* ════ TEST HEADER ════ */}
          <div className="mx-6 mb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center text-lg">🧪</div>
              <div>
                <h2 className="text-base font-black text-gray-900">{report.templateName}</h2>
                <p className="text-xs text-gray-400">
                  {report.category}{report.sampleType && ` · Sample: ${report.sampleType}`}
                </p>
              </div>
            </div>
            {abnormalCount > 0 && (
              <div className="no-print bg-red-50 border border-red-200 rounded-xl px-3 py-1.5 text-center">
                <p className="text-xs font-bold text-red-600">{abnormalCount} Abnormal</p>
              </div>
            )}
          </div>

          {/* ════ RESULTS TABLE ════ */}
          <div className="mx-6 mb-4">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="text-left px-3 py-2.5 font-bold rounded-tl-lg" style={{ width: "36%" }}>Test Parameter</th>
                  <th className="text-center px-3 py-2.5 font-bold" style={{ width: "14%" }}>Result</th>
                  <th className="text-center px-3 py-2.5 font-bold" style={{ width: "12%" }}>Unit</th>
                  <th className="text-left px-3 py-2.5 font-bold" style={{ width: "26%" }}>Reference Range</th>
                  <th className="text-center px-3 py-2.5 font-bold rounded-tr-lg" style={{ width: "12%" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {!(report.results || []).length ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400 italic">No results entered</td></tr>
                ) : (() => {
                  const results: any[] = report.results || [];
                  const rows: React.ReactNode[] = [];
                  let lastSection = "__INIT__";
                  let rowIdx = 0;
                  results.forEach((r: any, i: number) => {
                    const sec = r.section || "";
                    // Section header row
                    if (sec && sec !== lastSection) {
                      rows.push(
                        <tr key={`sec-${i}`} className="bg-teal-600">
                          <td colSpan={5} className="px-3 py-1.5">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{sec}</span>
                          </td>
                        </tr>
                      );
                      rowIdx = 0;
                    }
                    lastSection = sec;
                    rows.push(
                      <tr key={i} className={`border-b border-gray-100 ${r.flag === "H" ? "bg-red-50" : r.flag === "L" ? "bg-blue-50" : rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50/60"}`}>
                        <td className={`px-3 py-2.5 ${(r.flag === "H" || r.flag === "L") ? "font-bold text-gray-900" : "font-medium text-gray-700"} pl-${sec ? "5" : "3"}`}
                          style={{ paddingLeft: sec ? "20px" : "12px" }}>
                          {r.name}
                        </td>
                        <td className={`px-3 py-2.5 text-center font-black text-sm ${r.flag === "H" ? "text-red-600" : r.flag === "L" ? "text-blue-700" : "text-gray-900"}`}>
                          {r.value || <span className="text-gray-300 font-normal text-xs">—</span>}
                        </td>
                        <td className="px-3 py-2.5 text-center text-gray-500">{r.unit || ""}</td>
                        <td className="px-3 py-2.5 text-left text-gray-600 text-[10px] leading-relaxed">{r.refRangeText || "—"}</td>
                        <td className="px-3 py-2.5 text-center">
                          {r.flag === "H" || r.flag === "L" ? (
                            <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full border ${FLAG_BADGE[r.flag]}`}>
                              {FLAG_LABEL[r.flag]}
                            </span>
                          ) : r.value ? (
                            <span className="text-[10px] text-green-600 font-semibold">Normal</span>
                          ) : <span className="text-gray-300 text-[10px]">—</span>}
                        </td>
                      </tr>
                    );
                    rowIdx++;
                  });
                  return rows;
                })()}
              </tbody>
            </table>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[10px] text-gray-400 border-t border-dashed border-gray-200 pt-2">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-400 rounded-full inline-block" />HIGH ↑ — Above reference range</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue-400 rounded-full inline-block" />LOW ↓ — Below reference range</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-green-400 rounded-full inline-block" />Normal — Within range</span>
            </div>
          </div>

          {/* ════ SIGN-OFF ════ */}
          <div className="mx-6 mb-6 mt-6 border-t-2 border-dashed border-gray-300 pt-6">
            <div className="grid grid-cols-2 gap-10">
              {/* Technician */}
              <div className="text-center">
                {techSign ? (
                  <img src={techSign} alt="Signature" className="h-12 object-contain mx-auto mb-1" />
                ) : (
                  <div className="h-12 flex items-end justify-center mb-1">
                    <div className="w-36 border-b-2 border-gray-400" />
                  </div>
                )}
                <p className="text-xs font-black text-gray-800">{techName}</p>
                {techQual && <p className="text-[10px] text-teal-600 font-medium">{techQual}</p>}
                <p className="text-[10px] text-gray-400 mt-0.5">Lab Technician</p>
              </div>
              {/* Pathologist / Doctor */}
              <div className="text-center">
                {pathSign ? (
                  <img src={pathSign} alt="Signature" className="h-12 object-contain mx-auto mb-1" />
                ) : (
                  <div className="h-12 flex items-end justify-center mb-1">
                    <div className="w-36 border-b-2 border-gray-400" />
                  </div>
                )}
                <p className="text-xs font-black text-gray-800">{pathName}</p>
                {pathQual && <p className="text-[10px] text-teal-600 font-medium">{pathQual}</p>}
                <p className="text-[10px] text-gray-400 mt-0.5">Pathologist / Consultant</p>
              </div>
            </div>
          </div>

          {/* ════ FOOTER ════ */}
          <div className="border-t-2 border-teal-600 bg-gradient-to-r from-teal-700 to-teal-600 px-7 py-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[10px] text-teal-100">Generated by Brims Hospitals · www.brimshospitals.com</p>
              <p className="text-[10px] text-teal-100 flex-shrink-0">Report: {report.reportId} · {fmt(report.reportDate)}</p>
            </div>
            <p className="text-[9px] text-teal-200/70 mt-1">
              * Computer-generated report. Interpret results in conjunction with clinical history. Valid only with authorised signatory.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
