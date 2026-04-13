"use client";
import { useEffect, useState } from "react";

const DEPARTMENTS = [
  "General Medicine","General Surgery","Pediatrics","Gynecology & Obstetrics",
  "Orthopedics","Cardiology","Dermatology","ENT","Ophthalmology","Neurology",
  "Psychiatry","Radiology","Pathology","Anesthesiology","Dentistry","Physiotherapy","Other",
];

const BIHAR_DISTRICTS = [
  "Patna","Gaya","Bhagalpur","Muzaffarpur","Darbhanga","Ara (Bhojpur)","Buxar","Chapra (Saran)",
  "Sitamarhi","Madhubani","Supaul","Araria","Kishanganj","Purnia","Katihar","Madhepura",
  "Saharsa","Vaishali","Nalanda","Nawada","Jehanabad","Aurangabad","Rohtas","Kaimur",
  "Bhabua","Gopalganj","Siwan","Begusarai","Khagaria","Sheohar","West Champaran",
  "East Champaran","Sheikhpura","Lakhisarai","Jamui","Banka","Munger","Samastipur","Other",
];

type HospitalOption = {
  _id: string;
  name: string;
  hospitalId?: string;
  address?: { district?: string; city?: string };
};

type Step = "form" | "success";
type HospitalMode = "network" | "private";

export default function DoctorRegisterPage() {
  const [step, setStep]   = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // Hospital selection
  const [hospitalMode, setHospitalMode]   = useState<HospitalMode>("network");
  const [hospitals, setHospitals]         = useState<HospitalOption[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);
  const [selectedHospitalId, setSelectedHospitalId] = useState("");

  const [form, setForm] = useState({
    name:         "",
    mobile:       "",
    email:        "",
    department:   "",
    speciality:   "",
    degreesStr:   "",
    experience:   "",
    opdFee:       "",
    // private clinic fields
    hospitalName: "",
    district:     "",
    city:         "",
  });

  useEffect(() => {
    fetch("/api/hospitals-public")
      .then((r) => r.json())
      .then((d) => { if (d.success) setHospitals(d.hospitals); })
      .finally(() => setHospitalsLoading(false));
  }, []);

  function setF(key: string, val: string) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  async function handleSubmit() {
    setError("");

    // Validate required fields
    const { name, mobile, department, opdFee } = form;
    if (!name.trim() || !mobile.trim() || !department || !opdFee) {
      setError("Naam, Mobile, Department aur OPD Fee zaruri hai"); return;
    }
    if (!/^\d{10}$/.test(mobile.trim())) {
      setError("Valid 10-digit mobile number daalo"); return;
    }
    if (Number(opdFee) <= 0) {
      setError("Valid OPD fee daalo"); return;
    }

    // Hospital validation
    if (hospitalMode === "network" && !selectedHospitalId) {
      setError("Brims network mein se hospital select karein ya Private Clinic choose karein"); return;
    }
    if (hospitalMode === "private" && !form.hospitalName.trim()) {
      setError("Clinic / Hospital ka naam daalo"); return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        degrees:    form.degreesStr ? form.degreesStr.split(",").map((s) => s.trim()).filter(Boolean) : [],
        experience: Number(form.experience) || 0,
        opdFee:     Number(form.opdFee),
      };

      if (hospitalMode === "network") {
        payload.hospitalId = selectedHospitalId;
        // hospitalName will be resolved server-side from hospitalId
        payload.hospitalName = "";
      }
      // private mode: hospitalName, district, city are already in form

      const res  = await fetch("/api/doctor-register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) setStep("success");
      else setError(data.message);
    } catch {
      setError("Network error. Dobara try karein.");
    }
    setLoading(false);
  }

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
          <p className="text-gray-600 text-sm leading-relaxed">
            Aapki Doctor Registration request submit ho gayi hai. Admin verification ke baad
            aapko login credentials mile ge. <strong>2–3 working days</strong> mein aapke mobile
            par notification aayega.
          </p>
          <div className="bg-blue-50 rounded-2xl p-4 text-sm text-blue-700">
            <p className="font-medium mb-1">Aage kya hoga?</p>
            <ol className="text-left space-y-1 list-decimal list-inside text-blue-600">
              <li>Admin aapka application review karega</li>
              <li>Approval ke baad aapka account activate hoga</li>
              <li>Mobile OTP se <a href="/staff-login" className="underline">/staff-login</a> par Doctor login kar sakenge</li>
            </ol>
          </div>
          <div className="flex gap-3 pt-2">
            <a href="/" className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors text-center">
              Home
            </a>
            <a href="/login" className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors text-center">
              Member Login
            </a>
          </div>
        </div>
      </main>
    );
  }

  const selectedHospital = hospitals.find((h) => h._id === selectedHospitalId);

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
        <div className="bg-white rounded-3xl shadow-lg border border-blue-100 p-7 space-y-6">

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* ── Section 1: Personal Info ── */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-gray-500">Doctor ka Poora Naam *</label>
                <input value={form.name} onChange={(e) => setF("name", e.target.value)}
                  placeholder="Dr. Ramesh Kumar"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Mobile Number *</label>
                <div className="mt-1 flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <span className="px-3 py-2.5 bg-gray-50 text-gray-500 text-sm border-r border-gray-200">+91</span>
                  <input type="tel" maxLength={10} value={form.mobile}
                    onChange={(e) => setF("mobile", e.target.value.replace(/\D/g, ""))}
                    placeholder="9876543210"
                    className="flex-1 px-3 py-2.5 text-sm focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Email ID</label>
                <input type="email" value={form.email} onChange={(e) => setF("email", e.target.value)}
                  placeholder="doctor@email.com"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* ── Section 2: Professional Info ── */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              Professional Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">Department *</label>
                <select value={form.department} onChange={(e) => setF("department", e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white transition-all">
                  <option value="">-- Select Department --</option>
                  {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Speciality</label>
                <input value={form.speciality} onChange={(e) => setF("speciality", e.target.value)}
                  placeholder="e.g. Laparoscopic Surgery"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Degrees (comma se alag karein)</label>
                <input value={form.degreesStr} onChange={(e) => setF("degreesStr", e.target.value)}
                  placeholder="MBBS, MD, MS"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Experience (years)</label>
                <input type="number" min={0} value={form.experience} onChange={(e) => setF("experience", e.target.value)}
                  placeholder="5"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">OPD Fee (₹) *</label>
                <input type="number" min={0} value={form.opdFee} onChange={(e) => setF("opdFee", e.target.value)}
                  placeholder="300"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all" />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* ── Section 3: Hospital / Clinic ── */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              Hospital / Clinic Association *
            </h3>

            {/* Toggle: Network vs Private */}
            <div className="flex gap-3 mb-4">
              <button
                type="button"
                onClick={() => setHospitalMode("network")}
                className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  hospitalMode === "network"
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                }`}
              >
                🏥 Brims Network Hospital
              </button>
              <button
                type="button"
                onClick={() => setHospitalMode("private")}
                className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  hospitalMode === "private"
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                }`}
              >
                🏠 Private Clinic / New
              </button>
            </div>

            {/* Network: dropdown from verified hospitals */}
            {hospitalMode === "network" && (
              <div className="space-y-3">
                {hospitalsLoading ? (
                  <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
                ) : hospitals.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                    ⚠️ Abhi koi verified hospital Brims network mein nahi hai.
                    Private Clinic choose karein ya{" "}
                    <a href="/hospital-onboarding" className="underline font-medium">hospital onboard karein</a>.
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-medium text-gray-500">Hospital Select Karein *</label>
                    <select
                      value={selectedHospitalId}
                      onChange={(e) => setSelectedHospitalId(e.target.value)}
                      className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white transition-all"
                    >
                      <option value="">-- Hospital chunein --</option>
                      {hospitals.map((h) => (
                        <option key={h._id} value={h._id}>
                          {h.name}{h.address?.district ? ` — ${h.address.district}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Selected hospital info card */}
                {selectedHospital && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3">
                    <span className="text-2xl">🏥</span>
                    <div>
                      <p className="font-semibold text-blue-800 text-sm">{selectedHospital.name}</p>
                      <p className="text-xs text-blue-600">
                        {[selectedHospital.address?.city, selectedHospital.address?.district].filter(Boolean).join(", ")}
                      </p>
                    </div>
                    <button type="button" onClick={() => setSelectedHospitalId("")}
                      className="ml-auto text-blue-400 hover:text-blue-600 text-lg leading-none">×</button>
                  </div>
                )}

                <p className="text-xs text-gray-400">
                  Aapki hospital network mein nahi hai?{" "}
                  <a href="/hospital-onboarding" className="text-blue-500 underline">Pehle hospital onboard karein</a>
                  {" "}ya Private Clinic choose karein.
                </p>
              </div>
            )}

            {/* Private clinic: manual entry */}
            {hospitalMode === "private" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-500">Clinic / Hospital ka Naam *</label>
                  <input value={form.hospitalName} onChange={(e) => setF("hospitalName", e.target.value)}
                    placeholder="Ram Clinic, Chapra"
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">District</label>
                  <select value={form.district} onChange={(e) => setF("district", e.target.value)}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white transition-all">
                    <option value="">-- District --</option>
                    {BIHAR_DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">City / Town</label>
                  <input value={form.city} onChange={(e) => setF("city", e.target.value)}
                    placeholder="Chapra"
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all" />
                </div>
                <div className="sm:col-span-2">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                    💡 Private clinic ko Brims network mein join karne ke liye{" "}
                    <a href="/hospital-onboarding" className="underline font-medium">Hospital Onboarding</a>{" "}
                    karein — zyada patients milenge!
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold text-base hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Submit ho raha hai...
                </span>
              ) : "Registration Submit Karein →"}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">
              * Required fields. Admin review ke baad 2–3 din mein account activate hoga.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Pehle se registered hain?{" "}
          <a href="/staff-login" className="text-blue-600 font-medium hover:underline">
            Doctor Login karein →
          </a>
        </p>
      </div>
    </main>
  );
}
