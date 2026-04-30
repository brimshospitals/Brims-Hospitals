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
const FLAG_LABEL: Record<string, string> = {
  H: "HIGH ↑", L: "LOW ↓", N: "NORMAL",
};
const FLAG_ROW: Record<string, string> = {
  H: "bg-red-50",
  L: "bg-blue-50",
  N: "",
};

export default function LabReportPage() {
  const params   = useParams();
  const reportId = params?.reportId as string;

  const [report,   setReport]   = useState<any>(null);
  const [hospital, setHospital] = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    if (!reportId) return;
    fetch(`/api/hospital/lab-reports?reportId=${reportId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) { setReport(d.report); setHospital(d.hospital); }
        else setError(d.message || "Report not found");
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
        <button onClick={() => window.location.reload()}
          className="text-sm text-teal-600 underline">Retry</button>
      </div>
    </div>
  );

  const addr = hospital?.address || {};
  const addrLine = [addr.street, addr.city, addr.district, "Bihar", addr.pincode].filter(Boolean).join(", ");
  const genderLabel = (g: string) => g === "male" ? "Male" : g === "female" ? "Female" : "Other";
  const logoUrl = hospital?.photos?.[0] || null;
  const isDraft = report.status === "draft";

  // Rows with abnormal flags
  const abnormalCount = (report.results || []).filter((r: any) => r.flag === "H" || r.flag === "L").length;

  return (
    <>
      {/* ── Print styles ── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { margin: 10mm 10mm; size: A4 portrait; }
          .page-break { page-break-before: always; }
        }
        @media screen {
          body { background: #f3f4f6; }
        }
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
                ⚠ DRAFT — Not for distribution
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

          {/* ════════ HEADER ════════ */}
          <div className="border-b-[3px] border-teal-600">
            {/* Top accent strip */}
            <div className="h-1.5 bg-gradient-to-r from-teal-700 via-teal-500 to-teal-700" />

            <div className="px-7 py-4 flex items-start justify-between gap-4">
              {/* Left: Hospital branding */}
              <div className="flex items-start gap-3 flex-1">
                {logoUrl && (
                  <img src={logoUrl} alt="Logo"
                    className="h-14 w-14 object-contain rounded-lg border border-gray-100 flex-shrink-0" />
                )}
                <div>
                  <h1 className="text-lg font-black text-teal-700 leading-tight">
                    {hospital?.name || "Brims Hospitals"}
                  </h1>
                  {report.labName && (
                    <p className="text-xs font-semibold text-teal-600 mt-0.5">{report.labName}</p>
                  )}
                  {addrLine && (
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{addrLine}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                    {hospital?.mobile  && <span className="text-[11px] text-gray-500">📞 {hospital.mobile}</span>}
                    {hospital?.email   && <span className="text-[11px] text-gray-500">✉ {hospital.email}</span>}
                    {hospital?.website && <span className="text-[11px] text-gray-500">🌐 {hospital.website}</span>}
                  </div>
                  {hospital?.labRegNo && (
                    <p className="text-[10px] text-gray-400 mt-1">Lab Reg. No.: {hospital.labRegNo}</p>
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
                  <p>
                    <span className="font-medium text-gray-600">Sample Collected:</span>{" "}
                    {fmt(report.collectionDate)} {fmtTime(report.collectionDate)}
                  </p>
                  <p>
                    <span className="font-medium text-gray-600">Report Date:</span>{" "}
                    {fmt(report.reportDate)}
                  </p>
                  <p>
                    <span className="font-medium text-gray-600">Sample Type:</span>{" "}
                    <span className="text-teal-700 font-semibold">{report.sampleType || "Blood"}</span>
                  </p>
                </div>
                {isDraft && (
                  <div className="bg-amber-50 border border-amber-300 rounded-lg px-3 py-1.5 text-center">
                    <p className="text-[10px] font-black text-amber-700 tracking-wider">DRAFT REPORT</p>
                    <p className="text-[9px] text-amber-600">Not validated — not for clinical use</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ════════ PATIENT INFO ════════ */}
          <div className="mx-6 my-4 rounded-xl border border-teal-100 overflow-hidden">
            <div className="bg-teal-600 px-4 py-1.5">
              <p className="text-[10px] font-black text-white uppercase tracking-widest">Patient Information</p>
            </div>
            <div className="bg-teal-50/40 px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2">
              <div>
                <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Patient Name</p>
                <p className="text-sm font-black text-gray-800 leading-tight">{report.patientName}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Age / Gender</p>
                <p className="text-sm font-bold text-gray-700">
                  {report.patientAge ? `${report.patientAge} Yrs` : "—"} / {genderLabel(report.patientGender)}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Mobile No.</p>
                <p className="text-sm font-semibold text-gray-700">{report.patientMobile || "—"}</p>
              </div>
              {(report.patientRefId || report.referredBy) && (
                <div>
                  {report.patientRefId && (
                    <>
                      <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Member / Ref ID</p>
                      <p className="text-sm font-semibold text-gray-700">{report.patientRefId}</p>
                    </>
                  )}
                  {report.referredBy && !report.patientRefId && (
                    <>
                      <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Referred By</p>
                      <p className="text-sm font-semibold text-gray-700">{report.referredBy}</p>
                    </>
                  )}
                </div>
              )}
              {report.referredBy && report.patientRefId && (
                <div>
                  <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Referred By</p>
                  <p className="text-sm font-semibold text-gray-700">{report.referredBy}</p>
                </div>
              )}
            </div>
          </div>

          {/* ════════ TEST HEADER ════════ */}
          <div className="mx-6 mb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                🧪
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900">{report.templateName}</h2>
                <p className="text-xs text-gray-400">
                  {report.category}
                  {report.sampleType && ` · Sample: ${report.sampleType}`}
                </p>
              </div>
            </div>
            {abnormalCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-1.5 text-center no-print">
                <p className="text-xs font-bold text-red-600">{abnormalCount} Abnormal</p>
                <p className="text-[10px] text-red-400">parameter{abnormalCount > 1 ? "s" : ""}</p>
              </div>
            )}
          </div>

          {/* ════════ RESULTS TABLE ════════ */}
          <div className="mx-6 mb-4">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-700 text-white">
                  <th className="text-left px-3 py-2.5 font-bold rounded-tl-lg" style={{ width: "38%" }}>
                    Test Parameter
                  </th>
                  <th className="text-center px-3 py-2.5 font-bold" style={{ width: "16%" }}>
                    Result
                  </th>
                  <th className="text-center px-3 py-2.5 font-bold" style={{ width: "12%" }}>
                    Unit
                  </th>
                  <th className="text-center px-3 py-2.5 font-bold" style={{ width: "22%" }}>
                    Reference Range
                  </th>
                  <th className="text-center px-3 py-2.5 font-bold rounded-tr-lg" style={{ width: "12%" }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {(report.results || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400 italic">
                      No results entered yet
                    </td>
                  </tr>
                ) : (
                  (report.results || []).map((r: any, i: number) => {
                    const isAbnormal = r.flag === "H" || r.flag === "L";
                    return (
                      <tr
                        key={i}
                        className={`border-b border-gray-100 ${
                          r.flag ? FLAG_ROW[r.flag] : i % 2 === 0 ? "bg-white" : "bg-gray-50/60"
                        }`}
                      >
                        <td className={`px-3 py-2.5 ${isAbnormal ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>
                          {r.name}
                        </td>
                        <td className={`px-3 py-2.5 text-center font-black text-sm ${
                          r.flag === "H" ? "text-red-600" :
                          r.flag === "L" ? "text-blue-600" :
                          "text-gray-900"
                        }`}>
                          {r.value || "—"}
                        </td>
                        <td className="px-3 py-2.5 text-center text-gray-500">{r.unit || ""}</td>
                        <td className="px-3 py-2.5 text-center text-gray-600">{r.refRangeText || "—"}</td>
                        <td className="px-3 py-2.5 text-center">
                          {r.flag ? (
                            <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full border ${FLAG_BADGE[r.flag] || ""}`}>
                              {FLAG_LABEL[r.flag] || r.flag}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[10px] text-gray-400 border-t border-dashed border-gray-200 pt-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-red-400 rounded-full inline-block" />
                HIGH ↑ — Above reference range
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-blue-400 rounded-full inline-block" />
                LOW ↓ — Below reference range
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-gray-300 rounded-full inline-block" />
                — — Result not entered / not applicable
              </span>
            </div>
          </div>

          {/* ════════ SIGN-OFF ════════ */}
          <div className="mx-6 mb-6 mt-6">
            <div className="grid grid-cols-2 gap-10 border-t-2 border-dashed border-gray-300 pt-6">
              {/* Technician */}
              <div className="text-center">
                <div className="h-12 flex items-end justify-center mb-1">
                  <div className="w-36 border-b-2 border-gray-400" />
                </div>
                <p className="text-xs font-black text-gray-800">
                  {report.technicianName || "Lab Technician"}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">Lab Technician / Pathologist</p>
                {report.labName && (
                  <p className="text-[10px] text-teal-600 mt-0.5 font-medium">{report.labName}</p>
                )}
              </div>

              {/* Doctor */}
              <div className="text-center">
                <div className="h-12 flex items-end justify-center mb-1">
                  <div className="w-36 border-b-2 border-gray-400" />
                </div>
                <p className="text-xs font-black text-gray-800">
                  {report.doctorName || "Consulting Doctor"}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">Consulting / Referring Doctor</p>
                {report.referredBy && report.referredBy !== report.doctorName && (
                  <p className="text-[10px] text-gray-400 mt-0.5">Ref: {report.referredBy}</p>
                )}
              </div>
            </div>
          </div>

          {/* ════════ FOOTER ════════ */}
          <div className="border-t-2 border-teal-600 bg-gradient-to-r from-teal-700 to-teal-600 px-7 py-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[10px] text-teal-100">
                Generated by Brims Hospitals Platform · www.brimshospitals.com
              </p>
              <p className="text-[10px] text-teal-100 flex-shrink-0">
                Report No: {report.reportId} · {fmt(report.reportDate)}
              </p>
            </div>
            <p className="text-[9px] text-teal-200/70 mt-1">
              * This is a computer-generated report. Results must be interpreted by a qualified medical professional in conjunction with clinical history and examination findings. Not valid without authorised signatory.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
