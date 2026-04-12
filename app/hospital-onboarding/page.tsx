"use client";
import { useState } from "react";

const BIHAR_DISTRICTS = [
  "Araria","Arwal","Aurangabad","Banka","Begusarai","Bhagalpur","Bhojpur","Buxar",
  "Darbhanga","East Champaran","Gaya","Gopalganj","Jamui","Jehanabad","Kaimur","Katihar",
  "Khagaria","Kishanganj","Lakhisarai","Madhepura","Madhubani","Munger","Muzaffarpur",
  "Nalanda","Nawada","Patna","Purnia","Rohtas","Saharsa","Samastipur","Saran","Sheikhpura",
  "Sheohar","Sitamarhi","Siwan","Supaul","Vaishali","West Champaran",
];

const DEPARTMENTS = [
  "General Medicine","General Surgery","Pediatrics","Gynecology & Obstetrics",
  "Orthopedics","Cardiology","Dermatology","ENT","Ophthalmology","Neurology",
  "Psychiatry","Radiology","Pathology","Anesthesiology","Dentistry",
  "Physiotherapy","Urology","Nephrology","Oncology","Gastroenterology","Other",
];

const STEPS = [
  { id: 1, label: "Hospital Info",   icon: "🏥" },
  { id: 2, label: "Contact Details", icon: "📞" },
  { id: 3, label: "Departments",     icon: "🏷️" },
];

const inp = "w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition bg-white";
const sel = "w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition bg-white";

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

export default function HospitalOnboardingPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", type: "", registrationNo: "", rohiniNo: "",
    mobile: "", email: "", website: "",
    street: "", district: "", city: "", pincode: "",
    spocName: "", spocContact: "", spocEmail: "",
    ownerName: "", ownerContact: "",
    departments: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState<string>("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const toggleDept = (d: string) =>
    setForm((f) => ({ ...f, departments: f.departments.includes(d) ? f.departments.filter((x) => x !== d) : [...f.departments, d] }));

  function validate() {
    setError("");
    if (step === 1) {
      if (!form.name.trim())     return setError("Hospital naam zaruri hai"),     false;
      if (!form.type)            return setError("Hospital type zaruri hai"),      false;
      if (!/^\d{10}$/.test(form.mobile.trim())) return setError("Valid 10-digit mobile daalo"), false;
      if (!form.district)        return setError("District select karein"),        false;
    }
    if (step === 2) {
      if (!form.spocName.trim())    return setError("SPOC ka naam zaruri hai"),    false;
      if (!form.spocContact.trim()) return setError("SPOC ka mobile zaruri hai"),  false;
      if (!form.ownerName.trim())   return setError("Owner ka naam zaruri hai"),   false;
    }
    if (step === 3) {
      if (form.departments.length === 0) return setError("Kam se kam ek department select karein"), false;
    }
    return true;
  }

  async function submit() {
    if (!validate()) return;
    setLoading(true);
    try {
      const res  = await fetch("/api/hospital-onboarding", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) setSuccess(data.hospitalId || "SUBMITTED");
      else setError(data.message);
    } catch {
      setError("Network error. Dobara try karein.");
    }
    setLoading(false);
  }

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-green-600" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Application Submit Ho Gayi!</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-1">
            <strong>{form.name}</strong> ka application successfully submit ho gaya.
          </p>
          <p className="text-gray-400 text-sm mb-6">Hamari team <strong>2–3 working days</strong> mein aapse contact karegi.</p>

          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-left mb-6 space-y-2">
            <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-2">Aage kya hoga</p>
            {[
              "Document verification (Registration, Rohini No.)",
              "Hamari team ka site visit (agar zaruri ho)",
              "Agreement signing online ya in-person",
              "Hospital dashboard access aur portal training",
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-5 h-5 bg-teal-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                <p className="text-sm text-teal-700">{s}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl px-4 py-3 mb-6">
            <p className="text-xs text-gray-400">Application ID</p>
            <p className="text-sm font-mono font-bold text-gray-700 mt-0.5">{success}</p>
          </div>

          <div className="flex gap-3">
            <a href="/" className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold text-center hover:bg-gray-50 transition">
              🏠 Home
            </a>
            <a href="/login" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl text-sm font-semibold text-center transition">
              Login Karein →
            </a>
          </div>
        </div>
      </main>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-teal-700 px-5 py-3.5 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-xl">🏥</div>
          <span className="text-white font-bold text-lg">Brims Hospitals</span>
        </a>
        <a href="/login" className="text-teal-200 text-sm hover:text-white transition">Login →</a>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Hospital Onboarding</h1>
          <p className="text-gray-500 text-sm mt-1">Brims Health Network mein apna hospital register karein</p>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${step > s.id ? "bg-teal-600 text-white" : step === s.id ? "bg-teal-600 text-white shadow-lg shadow-teal-200" : "bg-gray-100 text-gray-400"}`}>
                  {step > s.id ? "✓" : s.icon}
                </div>
                <p className={`text-[10px] font-semibold mt-1 ${step >= s.id ? "text-teal-700" : "text-gray-400"}`}>{s.label}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-16 mx-2 mb-5 rounded transition-all ${step > s.id ? "bg-teal-500" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>
          )}

          {/* ── Step 1: Hospital Info ── */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">🏥 Hospital Ki Jankari</h2>

              <div>
                <Label required>Hospital / Clinic Ka Naam</Label>
                <input className={inp} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. City Care Hospital, Patna" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label required>Hospital Ka Prakar</Label>
                  <select className={sel} value={form.type} onChange={(e) => set("type", e.target.value)}>
                    <option value="">— Select —</option>
                    <option>Single Specialist</option>
                    <option>Multi Specialist</option>
                    <option>Super Specialist</option>
                    <option>Clinic</option>
                    <option>Diagnostic Lab</option>
                    <option>Nursing Home</option>
                  </select>
                </div>
                <div>
                  <Label required>Mobile Number</Label>
                  <div className="flex border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-teal-400 transition">
                    <span className="bg-gray-50 text-gray-500 px-3 flex items-center text-sm border-r border-gray-200">+91</span>
                    <input className="flex-1 px-3 py-3 text-sm outline-none" value={form.mobile} onChange={(e) => set("mobile", e.target.value.replace(/\D/g, ""))} maxLength={10} placeholder="10-digit" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Registration No.</Label>
                  <input className={inp} value={form.registrationNo} onChange={(e) => set("registrationNo", e.target.value)} placeholder="REG-12345" />
                </div>
                <div>
                  <Label>Rohini No.</Label>
                  <input className={inp} value={form.rohiniNo} onChange={(e) => set("rohiniNo", e.target.value)} placeholder="ROHINI-..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <input className={inp} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="hospital@email.com" />
                </div>
                <div>
                  <Label>Website</Label>
                  <input className={inp} value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label required>Zila (District)</Label>
                  <select className={sel} value={form.district} onChange={(e) => set("district", e.target.value)}>
                    <option value="">— Select —</option>
                    {BIHAR_DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Shahar / City</Label>
                  <input className={inp} value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="City" />
                </div>
                <div>
                  <Label>PIN Code</Label>
                  <input className={inp} value={form.pincode} onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))} maxLength={6} placeholder="800001" />
                </div>
              </div>

              <div>
                <Label>Pata (Street Address)</Label>
                <input className={inp} value={form.street} onChange={(e) => set("street", e.target.value)} placeholder="Building No., Street, Area..." />
              </div>
            </div>
          )}

          {/* ── Step 2: Contact Details ── */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">📞 Contact Ki Jankari</h2>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-700">SPOC — Single Point of Contact</p>
                <p className="text-xs text-blue-600 mt-0.5">Jo vyakti Brims team se coordinate karega verification aur setup ke liye</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label required>SPOC Ka Naam</Label>
                  <input className={inp} value={form.spocName} onChange={(e) => set("spocName", e.target.value)} placeholder="Contact person naam" />
                </div>
                <div>
                  <Label required>SPOC Mobile</Label>
                  <div className="flex border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-teal-400">
                    <span className="bg-gray-50 text-gray-500 px-3 flex items-center text-sm border-r border-gray-200">+91</span>
                    <input className="flex-1 px-3 py-3 text-sm outline-none" value={form.spocContact} onChange={(e) => set("spocContact", e.target.value.replace(/\D/g,""))} maxLength={10} placeholder="Mobile" />
                  </div>
                </div>
              </div>

              <div>
                <Label>SPOC Email</Label>
                <input className={inp} type="email" value={form.spocEmail} onChange={(e) => set("spocEmail", e.target.value)} placeholder="spoc@hospital.com" />
              </div>

              <div className="border-t border-gray-100 pt-5">
                <p className="text-sm font-bold text-gray-700 mb-4">🏛 Owner / Management</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label required>Owner Ka Naam</Label>
                    <input className={inp} value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} placeholder="Owner naam" />
                  </div>
                  <div>
                    <Label>Owner Mobile</Label>
                    <div className="flex border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-teal-400">
                      <span className="bg-gray-50 text-gray-500 px-3 flex items-center text-sm border-r border-gray-200">+91</span>
                      <input className="flex-1 px-3 py-3 text-sm outline-none" value={form.ownerContact} onChange={(e) => set("ownerContact", e.target.value.replace(/\D/g,""))} maxLength={10} placeholder="Mobile" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Departments ── */}
          {step === 3 && (
            <div>
              <h2 className="font-bold text-gray-800 text-lg mb-1 flex items-center gap-2">🏷️ Departments</h2>
              <p className="text-sm text-gray-500 mb-5">Jo departments aapke hospital mein available hain woh select karein:</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DEPARTMENTS.map((d) => (
                  <label key={d}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition text-sm ${
                      form.departments.includes(d)
                        ? "border-teal-500 bg-teal-50 text-teal-800 font-semibold"
                        : "border-gray-200 text-gray-600 hover:border-teal-300 hover:bg-teal-50/50"
                    }`}>
                    <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${form.departments.includes(d) ? "bg-teal-600 border-teal-600" : "border-gray-300"}`}>
                      {form.departments.includes(d) && (
                        <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3 text-white" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                        </svg>
                      )}
                    </div>
                    <span>{d}</span>
                    <input type="checkbox" className="hidden" checked={form.departments.includes(d)} onChange={() => toggleDept(d)} />
                  </label>
                ))}
              </div>

              {form.departments.length > 0 && (
                <div className="mt-4 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 flex items-center gap-2">
                  <span className="text-teal-600 text-lg">✅</span>
                  <p className="text-sm font-semibold text-teal-700">{form.departments.length} department{form.departments.length > 1 ? "s" : ""} selected</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8 pt-5 border-t border-gray-100">
            {step > 1 && (
              <button onClick={() => { setStep(step - 1); setError(""); }}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition">
                ← Pichhe
              </button>
            )}
            {step < 3 ? (
              <button onClick={() => { if (validate()) setStep(step + 1); }}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl text-sm transition shadow-sm shadow-teal-200">
                Aage → ({STEPS[step]?.label})
              </button>
            ) : (
              <button onClick={submit} disabled={loading}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl text-sm transition shadow-sm shadow-teal-200 disabled:opacity-50">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Submit ho raha hai...
                  </span>
                ) : "Application Submit Karein ✓"}
              </button>
            )}
          </div>
        </div>

        {/* Benefits strip */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { icon: "🔒", title: "Secure",     desc: "Data encrypted aur safe" },
            { icon: "⚡", title: "Fast",        desc: "2–3 din mein approval" },
            { icon: "📊", title: "Dashboard",  desc: "Full analytics access" },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
              <p className="text-2xl mb-1">{icon}</p>
              <p className="text-sm font-bold text-gray-700">{title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Pehle se registered hain?{" "}
          <a href="/login" className="text-teal-600 font-medium hover:underline">Login karein →</a>
        </p>
      </div>
    </main>
  );
}
