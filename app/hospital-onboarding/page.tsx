"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

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

const SPECIALTIES = [
  "Laparoscopic Surgery","Joint Replacement","Cardiac Surgery","Neuro Surgery",
  "Cancer Care / Oncology","Maternity & Delivery","Neonatology","Renal Transplant",
  "Liver Transplant","Bariatric Surgery","Spine Surgery","Vascular Surgery",
  "Plastic & Cosmetic Surgery","IVF & Fertility","Dialysis Center",
  "Trauma & Emergency","ICU & Critical Care","Blood Bank",
  "Robotic Surgery","Endoscopy","Cath Lab","NICU","PICU",
];

const STEPS = [
  { id: 1, label: "Hospital Info",    icon: "🏥" },
  { id: 2, label: "Contact & Login",  icon: "📞" },
  { id: 3, label: "Specializations",  icon: "🏷️" },
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

function CheckGrid({
  items, selected, onToggle, color = "teal",
}: {
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  color?: "teal" | "purple";
}) {
  const active = color === "purple"
    ? "border-purple-500 bg-purple-50 text-purple-800 font-semibold"
    : "border-teal-500 bg-teal-50 text-teal-800 font-semibold";
  const check = color === "purple" ? "bg-purple-600 border-purple-600" : "bg-teal-600 border-teal-600";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {items.map((item) => (
        <label key={item}
          className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition text-sm ${
            selected.includes(item) ? active : "border-gray-200 text-gray-600 hover:border-teal-300 hover:bg-teal-50/50"
          }`}>
          <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${selected.includes(item) ? check : "border-gray-300"}`}>
            {selected.includes(item) && (
              <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3 text-white" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
              </svg>
            )}
          </div>
          <span className="leading-tight">{item}</span>
          <input type="checkbox" className="hidden" checked={selected.includes(item)} onChange={() => onToggle(item)} />
        </label>
      ))}
    </div>
  );
}

// ── Inner component that uses useSearchParams ──────────────────────────────
function HospitalOnboardingForm() {
  const searchParams = useSearchParams();
  const fromAdmin = searchParams.get("from") === "admin";

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", type: "", registrationNo: "", rohiniNo: "",
    mobile: "", email: "", website: "",
    street: "", district: "", city: "", pincode: "",
    spocName: "", spocContact: "", spocEmail: "",
    ownerName: "", ownerContact: "",
    departments: [] as string[],
    specialties: [] as string[],
    password: "", confirmPassword: "",
  });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [result, setResult]     = useState<{ hospitalId: string; loginId: string } | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const toggleList = (key: "departments" | "specialties", item: string) =>
    setForm((f) => ({
      ...f,
      [key]: (f[key] as string[]).includes(item)
        ? (f[key] as string[]).filter((x) => x !== item)
        : [...(f[key] as string[]), item],
    }));

  function validate() {
    setError("");
    if (step === 1) {
      if (!form.name.trim())     { setError("Hospital naam zaruri hai"); return false; }
      if (!form.type)            { setError("Hospital type zaruri hai"); return false; }
      if (!/^\d{10}$/.test(form.mobile.trim())) { setError("Valid 10-digit mobile daalo"); return false; }
      if (!form.district)        { setError("District select karein"); return false; }
    }
    if (step === 2) {
      if (!form.spocName.trim())    { setError("SPOC ka naam zaruri hai"); return false; }
      if (!form.spocContact.trim()) { setError("SPOC ka mobile zaruri hai"); return false; }
      if (!form.ownerName.trim())   { setError("Owner ka naam zaruri hai"); return false; }
      if (!form.password || form.password.length < 6) { setError("Password kam se kam 6 characters ka hona chahiye"); return false; }
      if (form.password !== form.confirmPassword) { setError("Dono passwords match nahi kar rahe"); return false; }
    }
    if (step === 3) {
      if (form.departments.length === 0) { setError("Kam se kam ek department select karein"); return false; }
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
      if (data.success) {
        setResult({ hospitalId: data.hospitalId, loginId: data.loginId });
      } else {
        setError(data.message);
      }
    } catch {
      setError("Network error. Dobara try karein.");
    }
    setLoading(false);
  }

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className={fromAdmin ? "" : "min-h-screen bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 flex items-center justify-center p-4"}>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center mx-auto">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-green-600" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {fromAdmin ? "Hospital Added!" : "Application Submit Ho Gayi!"}
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-5">
            <strong>{form.name}</strong> ka account successfully create ho gaya.
          </p>

          {/* Credential Card */}
          <div className="bg-teal-50 border border-teal-300 rounded-2xl p-5 text-left mb-5 space-y-3">
            <p className="text-xs font-bold text-teal-700 uppercase tracking-wide">Login Credentials</p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border border-teal-200">
                <span className="text-xs text-gray-500 font-medium">Hospital ID / Login ID</span>
                <span className="text-sm font-bold text-teal-700 font-mono">{result.loginId}</span>
              </div>
              <div className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border border-teal-200">
                <span className="text-xs text-gray-500 font-medium">Mobile</span>
                <span className="text-sm font-semibold text-gray-700">{form.mobile}</span>
              </div>
              <div className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border border-teal-200">
                <span className="text-xs text-gray-500 font-medium">Password</span>
                <span className="text-sm font-semibold text-gray-700">{"•".repeat(Math.min(form.password.length, 10))}</span>
              </div>
            </div>
            <p className="text-[11px] text-teal-600 leading-relaxed mt-1">
              ⚠️ Yeh credentials save kar lein. Hospital ID se Hospital Login page pe login kar sakte hain.
            </p>
          </div>

          {!fromAdmin && (
            <>
              <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5 text-left">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2.5">Aage kya hoga</p>
                {["Document verification", "Admin ka approval (2–3 din)", "Hospital dashboard access"].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 bg-teal-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">{i + 1}</div>
                    <p className="text-sm text-gray-600">{s}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <a href="/" className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold text-center hover:bg-gray-50 transition">
                  🏠 Home
                </a>
                <a href="/hospital/login" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl text-sm font-semibold text-center transition">
                  Hospital Login →
                </a>
              </div>
            </>
          )}

          {fromAdmin && (
            <button
              onClick={() => { setResult(null); setStep(1); setForm({ name:"",type:"",registrationNo:"",rohiniNo:"",mobile:"",email:"",website:"",street:"",district:"",city:"",pincode:"",spocName:"",spocContact:"",spocEmail:"",ownerName:"",ownerContact:"",departments:[],specialties:[],password:"",confirmPassword:"" }); }}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl text-sm font-semibold transition"
            >
              + Aur Hospital Add Karein
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className={fromAdmin ? "" : "min-h-screen bg-gray-50"}>
      {/* Top bar — hidden when embedded from admin */}
      {!fromAdmin && (
        <div className="bg-teal-700 px-5 py-3.5 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Brims" className="h-9 w-9 rounded-full bg-white p-0.5 object-contain" />
            <span className="text-white font-bold text-lg">Brims Hospitals</span>
          </a>
          <a href="/hospital/login" className="text-teal-200 text-sm hover:text-white transition">Hospital Login →</a>
        </div>
      )}

      <div className={`max-w-2xl mx-auto px-4 ${fromAdmin ? "py-4" : "py-8"}`}>

        {/* Page Header */}
        {!fromAdmin && (
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Hospital Onboarding</h1>
            <p className="text-gray-500 text-sm mt-1">Brims Health Network mein apna hospital register karein</p>
          </div>
        )}

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-0 mb-6">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${step > s.id ? "bg-teal-600 text-white" : step === s.id ? "bg-teal-600 text-white shadow-lg shadow-teal-200" : "bg-gray-100 text-gray-400"}`}>
                  {step > s.id ? "✓" : s.icon}
                </div>
                <p className={`text-[10px] font-semibold mt-1 ${step >= s.id ? "text-teal-700" : "text-gray-400"}`}>{s.label}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-14 mx-2 mb-5 rounded transition-all ${step > s.id ? "bg-teal-500" : "bg-gray-200"}`} />
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

          {/* ── Step 2: Contact & Login ── */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">📞 Contact & Login Setup</h2>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-700">SPOC — Single Point of Contact</p>
                <p className="text-xs text-blue-600 mt-0.5">Jo vyakti Brims team se coordinate karega</p>
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

              <div className="border-t border-gray-100 pt-5">
                <p className="text-sm font-bold text-gray-700 mb-1">🔐 Login Password Set Karein</p>
                <p className="text-xs text-gray-400 mb-4">Hospital ID aur yeh password se Hospital Login page pe login kar sakte hain</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label required>Password</Label>
                    <input className={inp} type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Kam se kam 6 characters" />
                  </div>
                  <div>
                    <Label required>Confirm Password</Label>
                    <input className={inp} type="password" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} placeholder="Password dobara" />
                  </div>
                </div>
              </div>

              {/* Credential Preview */}
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-3">Login Credentials Preview</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Login ID</span>
                    <span className="text-xs font-semibold text-teal-700">Hospital ID (assigned after submission)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Mobile</span>
                    <span className="text-xs font-semibold text-gray-700">{form.mobile || "—"}</span>
                  </div>
                  {form.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Email</span>
                      <span className="text-xs font-semibold text-gray-700">{form.email}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Login Page</span>
                    <span className="text-xs font-semibold text-teal-600">/hospital/login</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Departments + Specialties ── */}
          {step === 3 && (
            <div className="space-y-7">
              {/* Departments */}
              <div>
                <h2 className="font-bold text-gray-800 text-lg mb-1 flex items-center gap-2">🏷️ Departments</h2>
                <p className="text-sm text-gray-500 mb-4">Jo departments available hain woh select karein: <span className="text-red-500">*</span></p>
                <CheckGrid items={DEPARTMENTS} selected={form.departments} onToggle={(d) => toggleList("departments", d)} color="teal" />
                {form.departments.length > 0 && (
                  <div className="mt-3 bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                    <span className="text-teal-600">✅</span>
                    <p className="text-sm font-semibold text-teal-700">{form.departments.length} department{form.departments.length > 1 ? "s" : ""} selected</p>
                  </div>
                )}
              </div>

              {/* Specialties */}
              <div>
                <h2 className="font-bold text-gray-800 text-base mb-1 flex items-center gap-2">⭐ Special Services / Expertise</h2>
                <p className="text-sm text-gray-500 mb-4">Jo special facilities ya expertise available hain (optional):</p>
                <CheckGrid items={SPECIALTIES} selected={form.specialties} onToggle={(s) => toggleList("specialties", s)} color="purple" />
                {form.specialties.length > 0 && (
                  <div className="mt-3 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                    <span className="text-purple-600">⭐</span>
                    <p className="text-sm font-semibold text-purple-700">{form.specialties.length} specialty selected</p>
                  </div>
                )}
              </div>

              {/* Final summary before submit */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Application Summary</p>
                <SummaryRow label="Hospital" value={form.name} />
                <SummaryRow label="Type" value={form.type} />
                <SummaryRow label="District" value={form.district} />
                <SummaryRow label="Mobile" value={form.mobile} />
                {form.email && <SummaryRow label="Email" value={form.email} />}
                <SummaryRow label="Login ID" value="Hospital ID (assigned after submission)" />
              </div>
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

        {/* Benefits strip — hidden in admin mode */}
        {!fromAdmin && (
          <>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { icon: "🔒", title: "Secure",    desc: "Data encrypted aur safe" },
                { icon: "⚡", title: "Fast",       desc: "2–3 din mein approval" },
                { icon: "📊", title: "Dashboard", desc: "Full analytics access" },
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
              <a href="/hospital/login" className="text-teal-600 font-medium hover:underline">Hospital Login →</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-semibold text-gray-700 max-w-[60%] text-right truncate">{value || "—"}</span>
    </div>
  );
}

// ── Export — must wrap in Suspense because of useSearchParams ──────────────
export default function HospitalOnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <HospitalOnboardingForm />
    </Suspense>
  );
}