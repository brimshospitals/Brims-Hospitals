"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

function fmt(d?: string | Date) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function LabReportPage() {
  const params    = useParams();
  const reportId  = params?.reportId as string;

  const [report,   setReport]   = useState<any>(null);
  const [hospital, setHospital] = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    if (!reportId) return;
    fetch(`/api/hospital/lab-reports?reportId=${reportId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) { setReport(d.report); setHospital(d.hospital); }
        else setError(d.message || "Report not found");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [reportId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !report) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="text-gray-700 font-semibold">{error || "Report not found"}</p>
      </div>
    </div>
  );

  const addr = hospital?.address || {};
  const fullAddr = [addr.street, addr.city, addr.district, "Bihar", addr.pincode].filter(Boolean).join(", ");
  const genderLabel = (g: string) => g === "male" ? "Male" : g === "female" ? "Female" : "Other";

  const flagColor = (flag: string) =>
    flag === "H" ? "text-red-600 font-bold" :
    flag === "L" ? "text-blue-600 font-bold" : "text-green-700";

  const flagBg = (flag: string) =>
    flag === "H" ? "bg-red-50 border-red-100" :
    flag === "L" ? "bg-blue-50 border-blue-100" : "";

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 15mm 12mm; size: A4; }
        }
      `}</style>

      {/* Action buttons */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button onClick={() => window.print()}
          className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg transition flex items-center gap-2">
          🖨️ Print / Download PDF
        </button>
        <button onClick={() => window.history.back()}
          className="bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl font-semibold text-sm shadow transition hover:bg-gray-50">
          ← Back
        </button>
      </div>

      {/* A4 Report Container */}
      <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:py-0 print:px-0">
        <div className="max-w-[794px] mx-auto bg-white shadow-xl print:shadow-none">

          {/* ── HEADER ── */}
          <div className="border-b-4 border-teal-600 px-8 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {hospital?.photos?.[0] && (
                  <img src={hospital.photos[0]} alt="logo" className="h-12 object-contain mb-2" />
                )}
                <h1 className="text-xl font-black text-teal-700 leading-tight">{hospital?.name || "Brims Hospitals"}</h1>
                {fullAddr && <p className="text-xs text-gray-500 mt-0.5">{fullAddr}</p>}
                <div className="flex flex-wrap gap-3 mt-1">
                  {hospital?.mobile && <span className="text-xs text-gray-500">📞 {hospital.mobile}</span>}
                  {hospital?.email  && <span className="text-xs text-gray-500">✉️ {hospital.email}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="inline-block bg-teal-600 text-white px-4 py-2 rounded-lg mb-2">
                  <p className="text-xs font-medium opacity-80">Report ID</p>
                  <p className="text-base font-black tracking-wide">{report.reportId}</p>
                </div>
                <div className="text-xs text-gray-500 space-y-0.5">
                  <p>Collection: <span className="font-semibold text-gray-700">{fmt(report.collectionDate)}</span></p>
                  <p>Report: <span className="font-semibold text-gray-700">{fmt(report.reportDate)}</span></p>
                  {report.status === "draft" && (
                    <span className="inline-block bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-amber-200 mt-1">DRAFT</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── PATIENT INFO ── */}
          <div className="px-8 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Patient Name</p>
                <p className="text-sm font-bold text-gray-800">{report.patientName}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Age / Gender</p>
                <p className="text-sm font-bold text-gray-800">
                  {report.patientAge ? `${report.patientAge} yrs` : "—"} / {genderLabel(report.patientGender)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Mobile</p>
                <p className="text-sm font-semibold text-gray-700">{report.patientMobile || "—"}</p>
              </div>
              {report.patientRefId && (
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Ref / Member ID</p>
                  <p className="text-sm font-semibold text-gray-700">{report.patientRefId}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── TEST NAME ── */}
          <div className="px-8 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-lg">🧪</div>
              <div>
                <h2 className="text-base font-black text-gray-900">{report.templateName}</h2>
                <p className="text-xs text-gray-500">{report.category}</p>
              </div>
            </div>
          </div>

          {/* ── RESULTS TABLE ── */}
          <div className="px-8 py-4">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-teal-600 text-white">
                  <th className="text-left px-3 py-2.5 text-xs font-bold rounded-tl-lg" style={{ width: "35%" }}>Parameter</th>
                  <th className="text-center px-3 py-2.5 text-xs font-bold" style={{ width: "15%" }}>Result</th>
                  <th className="text-center px-3 py-2.5 text-xs font-bold" style={{ width: "10%" }}>Unit</th>
                  <th className="text-center px-3 py-2.5 text-xs font-bold" style={{ width: "25%" }}>Reference Range</th>
                  <th className="text-center px-3 py-2.5 text-xs font-bold rounded-tr-lg" style={{ width: "15%" }}>Flag</th>
                </tr>
              </thead>
              <tbody>
                {(report.results || []).map((r: any, i: number) => (
                  <tr key={i} className={`border-b border-gray-100 ${flagBg(r.flag)} ${i % 2 === 0 && !r.flag ? "bg-white" : i % 2 !== 0 && !r.flag ? "bg-gray-50/50" : ""}`}>
                    <td className="px-3 py-2.5 font-semibold text-gray-800 text-xs">{r.name}</td>
                    <td className={`px-3 py-2.5 text-center font-bold text-sm ${r.flag ? flagColor(r.flag) : "text-gray-900"}`}>
                      {r.value || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs text-gray-500">{r.unit || ""}</td>
                    <td className="px-3 py-2.5 text-center text-xs text-gray-600">{r.refRangeText || "—"}</td>
                    <td className="px-3 py-2.5 text-center">
                      {r.flag ? (
                        <span className={`inline-block text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                          r.flag === "H" ? "bg-red-100 text-red-700 border-red-200" :
                          r.flag === "L" ? "bg-blue-100 text-blue-700 border-blue-200" :
                          "bg-green-100 text-green-700 border-green-200"
                        }`}>
                          {r.flag === "H" ? "HIGH ↑" : r.flag === "L" ? "LOW ↓" : "NORMAL"}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full"></span>HIGH ↑ — Above reference range</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-400 rounded-full"></span>LOW ↓ — Below reference range</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full"></span>NORMAL — Within reference range</span>
            </div>
          </div>

          {/* ── SIGN-OFF ── */}
          <div className="px-8 pb-8 mt-4">
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-200">
              <div>
                <div className="h-10 border-b border-dashed border-gray-300 mb-2" />
                <p className="text-xs font-bold text-gray-700">{report.technicianName || "Lab Technician"}</p>
                <p className="text-[10px] text-gray-400">Lab Technician / Pathologist</p>
                {report.labName && <p className="text-[10px] text-gray-400">{report.labName}</p>}
              </div>
              <div>
                <div className="h-10 border-b border-dashed border-gray-300 mb-2" />
                <p className="text-xs font-bold text-gray-700">{report.doctorName || "Referring Doctor"}</p>
                <p className="text-[10px] text-gray-400">Referring / Consulting Doctor</p>
              </div>
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div className="border-t-2 border-teal-600 px-8 py-3 bg-teal-50">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-400">Generated by Brims Hospitals Platform · www.brimshospitals.com</p>
              <p className="text-[10px] text-gray-400">Report ID: {report.reportId} · {fmt(report.reportDate)}</p>
            </div>
            <p className="text-[9px] text-gray-300 mt-1">
              * This is a computer-generated report. Results should be interpreted by a qualified medical professional in conjunction with clinical findings.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}