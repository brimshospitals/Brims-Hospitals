"use client";
import { useEffect, useState } from "react";
import DoctorFullForm, { HospitalOption } from "@/app/components/DoctorFullForm";

type SuccessData = { doctorId: string } | null;

export default function DoctorRegisterPage() {
  const [hospitals, setHospitals]           = useState<HospitalOption[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);
  const [step, setStep]                     = useState<"form"|"success">("form");
  const [successData, setSuccessData]       = useState<SuccessData>(null);
  const [submittedMobile, setSubmittedMobile] = useState("");

  useEffect(() => {
    fetch("/api/hospitals-public")
      .then(r => r.json())
      .then(d => { if (d.success) setHospitals(d.hospitals); })
      .finally(() => setHospitalsLoading(false));
  }, []);

  async function handleSubmit(payload: any) {
    const degreesForApi = payload.degrees.map((d: any) => ({
      degree: d.degree, university: d.university, year: d.year ? Number(d.year) : null
    }));

    const res  = await fetch("/api/doctor-register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ...payload, degrees: degreesForApi }),
    });
    const data = await res.json();
    if (data.success) {
      setSubmittedMobile(payload.mobile);
      setSuccessData({ doctorId: data.doctorId });
      setStep("success");
      return { success: true };
    }
    return { success: false, message: data.message };
  }

  // ── Success Screen ────────────────────────────────────────────────────────

  if (step === "success") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-blue-100 p-10 max-w-md w-full text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-green-600" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Application Submit!</h2>
          <p className="text-gray-600 text-sm">
            Aapki registration request submit ho gayi. Admin approval ke baad account activate hoga.
          </p>

          {successData && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-left space-y-2.5">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Aapka Doctor ID</p>
              <div className="bg-white rounded-xl px-4 py-3 border border-blue-200 flex items-center justify-between">
                <span className="text-xs text-gray-500">Doctor ID / Login ID</span>
                <span className="text-base font-bold text-blue-700 font-mono tracking-wider">{successData.doctorId}</span>
              </div>
              <div className="bg-white rounded-xl px-4 py-2.5 border border-blue-200 flex items-center justify-between">
                <span className="text-xs text-gray-500">Mobile</span>
                <span className="text-sm font-semibold text-gray-700">{submittedMobile}</span>
              </div>
              <p className="text-[11px] text-blue-600 leading-relaxed pt-1">
                ⚠️ Yeh ID save kar lein. Admin approval ke baad <strong>/doctor/login</strong> pe is ID aur password se login kar sakte hain.
              </p>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4 text-sm text-left">
            <p className="font-medium text-gray-700 mb-2">Aage kya hoga?</p>
            <ol className="space-y-1.5 list-decimal list-inside text-gray-500 text-xs">
              <li>Admin aapka application review karega</li>
              <li>Approval ke baad account activate hoga (2–3 din)</li>
              <li>Doctor Login page pe Doctor ID + Password se login karein</li>
            </ol>
          </div>
          <div className="flex gap-3 pt-2">
            <a href="/" className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition text-center">
              Home
            </a>
            <a href="/staff-login" className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition text-center">
              Doctor Login →
            </a>
          </div>
        </div>
      </main>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Top bar */}
      <div className="bg-blue-600 px-5 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="Brims" className="h-9 w-9 rounded-full bg-white p-0.5 object-contain" />
          <span className="text-white font-bold text-lg">Brims Hospitals</span>
        </a>
        <a href="/login" className="text-blue-200 text-sm hover:text-white transition-colors">
          Member Login →
        </a>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" className="w-9 h-9 text-white" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v4M10 13h4"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Doctor Registration</h1>
          <p className="text-gray-500 text-sm mt-1">
            Brims Hospitals network mein join karein. Admin review ke baad account activate hoga.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-3xl shadow-lg border border-blue-100 p-7">
          {hospitalsLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <DoctorFullForm
              hospitals={hospitals}
              showHospitalSection={true}
              showPasswordSection={true}
              showStatusSection={false}
              submitLabel="Registration Submit Karein →"
              onSubmit={handleSubmit}
            />
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Pehle se registered hain?{" "}
          <a href="/staff-login" className="text-blue-600 font-medium hover:underline">Doctor Login karein →</a>
        </p>
      </div>
    </main>
  );
}