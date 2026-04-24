"use client";
import { useState, useRef } from "react";
import { BIHAR_DISTRICTS } from "../../lib/biharDistricts";

// ── Constants ──────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  "General Medicine","General Surgery","Pediatrics","Gynecology & Obstetrics",
  "Orthopedics","Cardiology","Dermatology","ENT","Ophthalmology","Neurology",
  "Psychiatry","Radiology","Pathology","Anesthesiology","Dentistry","Physiotherapy",
  "Nephrology","Urology","Gastroenterology","Oncology","Pulmonology","Rheumatology",
  "Endocrinology","Hematology","Plastic Surgery","Neurosurgery","Other",
];

// BIHAR_DISTRICTS imported from lib/biharDistricts

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const SHORT_DAYS: Record<string,string> = {
  Monday:"Mon", Tuesday:"Tue", Wednesday:"Wed", Thursday:"Thu",
  Friday:"Fri", Saturday:"Sat", Sunday:"Sun",
};

const SLOT_PRESETS = [
  "08:00 AM - 10:00 AM","09:00 AM - 11:00 AM","10:00 AM - 12:00 PM",
  "11:00 AM - 01:00 PM","12:00 PM - 02:00 PM","02:00 PM - 04:00 PM",
  "04:00 PM - 06:00 PM","05:00 PM - 07:00 PM","06:00 PM - 08:00 PM",
  "07:00 PM - 09:00 PM","08:00 PM - 10:00 PM",
];

const KNOWN_INSTITUTIONS = [
  "AIIMS Delhi","AIIMS Patna","AIIMS Bhubaneswar","PMCH Patna","PGI Chandigarh",
  "SGPGI Lucknow","KGMC Lucknow","RML Delhi","Safdarjung Delhi","IGIMS Patna",
  "NMCH Patna","DMCH Darbhanga","JLNMC Bhagalpur","ANMCH Gaya","Medanta Delhi",
  "Apollo Delhi","Fortis Noida","Max Delhi","MAMC Delhi","GMC Patna",
];

// ── Types ──────────────────────────────────────────────────────────────────────

type DegreeEntry    = { degree: string; university: string; year: string };
type SlotEntry      = { day: string; times: string[] };
type PrevExpEntry   = { institution: string; role: string; yearFrom: string; yearTo: string };

export type HospitalOption = { _id: string; name: string; address?: { district?: string; city?: string } };

export interface DoctorFormPayload {
  name: string; mobile: string; email: string; photo: string;
  department: string; speciality: string; registrationNumber: string;
  experience: number; opdFee: number; offerFee: number; about: string;
  collegeUG: string; collegePG: string; collegeMCH: string;
  district: string; city: string;
  degrees: DegreeEntry[];
  availableSlots: SlotEntry[];
  onlineAvailable: boolean; onlineFee: number; onlineSlots: SlotEntry[];
  previousExperience: PrevExpEntry[];
  awards: string[];
  hospitalId?: string; hospitalName?: string;
  password?: string;
  isActive?: boolean; isAvailable?: boolean;
}

interface DoctorFullFormProps {
  initialData?: Record<string, any>;
  hospitals?: HospitalOption[];
  lockedAddress?: { district: string; city: string };  // hospital dashboard: pre-fill + lock OPD location
  showHospitalSection?: boolean;
  showPasswordSection?: boolean;
  showStatusSection?: boolean;
  isEdit?: boolean;
  submitLabel?: string;
  onSubmit: (payload: DoctorFormPayload) => Promise<{ success: boolean; message?: string }>;
  onCancel?: () => void;
}

// ── SlotEditor sub-component ───────────────────────────────────────────────────

function SlotEditor({ label, slots, onChange }: {
  label: string; slots: SlotEntry[]; onChange: (s: SlotEntry[]) => void;
}) {
  const [addingFor, setAddingFor]   = useState<string | null>(null);
  const [customSlot, setCustomSlot] = useState("");

  function toggleDay(day: string) {
    if (slots.find(s => s.day === day)) {
      onChange(slots.filter(s => s.day !== day));
      if (addingFor === day) setAddingFor(null);
    } else {
      onChange([...slots, { day, times: [] }]);
    }
  }

  function addTime(day: string, time: string) {
    const t = time.trim();
    if (!t || t === "custom") return;
    onChange(slots.map(s => s.day === day && !s.times.includes(t) ? { ...s, times: [...s.times, t] } : s));
    setCustomSlot(""); setAddingFor(null);
  }

  function removeTime(day: string, idx: number) {
    onChange(slots.map(s => s.day === day ? { ...s, times: s.times.filter((_, i) => i !== idx) } : s));
  }

  const activeDays = DAYS.filter(d => slots.find(s => s.day === d));

  return (
    <div>
      <p className="text-xs font-semibold text-gray-600 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {DAYS.map(day => {
          const active = !!slots.find(s => s.day === day);
          return (
            <button key={day} type="button" onClick={() => toggleDay(day)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
              }`}>
              {SHORT_DAYS[day]}
            </button>
          );
        })}
      </div>
      {activeDays.map(day => {
        const slot = slots.find(s => s.day === day)!;
        return (
          <div key={day} className="mb-3 bg-blue-50/40 rounded-xl p-3 border border-blue-100">
            <p className="text-xs font-bold text-blue-700 mb-2">{day}</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {slot.times.map((t, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-white border border-blue-200 text-blue-700 text-xs px-2.5 py-1 rounded-full shadow-sm">
                  {t}
                  <button type="button" onClick={() => removeTime(day, i)} className="text-blue-300 hover:text-red-500 ml-0.5 font-bold leading-none">×</button>
                </span>
              ))}
              {slot.times.length === 0 && <span className="text-xs text-gray-400 italic">Koi time slot add nahi hai</span>}
            </div>
            {addingFor === day ? (
              <div className="flex flex-wrap gap-2 mt-2">
                <select defaultValue=""
                  onChange={e => { if (e.target.value && e.target.value !== "custom") addTime(day, e.target.value); }}
                  className="flex-1 min-w-0 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-blue-400">
                  <option value="">-- Preset chunein --</option>
                  {SLOT_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input value={customSlot} onChange={e => setCustomSlot(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTime(day, customSlot); }}}
                  placeholder="Custom: 7PM - 9PM"
                  className="flex-1 min-w-0 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400" />
                <button type="button" onClick={() => addTime(day, customSlot)}
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-semibold">+Add</button>
                <button type="button" onClick={() => setAddingFor(null)}
                  className="text-xs text-gray-400 hover:text-gray-600">✕</button>
              </div>
            ) : (
              <button type="button" onClick={() => setAddingFor(day)}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 mt-1">
                + Time Slot Add Karein
              </button>
            )}
          </div>
        );
      })}
      {slots.length === 0 && <p className="text-xs text-gray-400 italic">Koi din select nahi hai. Upar se din toggle karein.</p>}
    </div>
  );
}

// ── Section header helper ─────────────────────────────────────────────────────

function SecHead({ icon, title }: { icon: string; title: string }) {
  return (
    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2 pb-1 border-b border-gray-100">
      <span className="text-base">{icon}</span>
      {title}
    </h3>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function DoctorFullForm({
  initialData,
  hospitals = [],
  lockedAddress,
  showHospitalSection = true,
  showPasswordSection = false,
  showStatusSection   = false,
  isEdit              = false,
  submitLabel         = isEdit ? "Save Changes" : "Submit",
  onSubmit,
  onCancel,
}: DoctorFullFormProps) {

  // Init degrees from initialData
  function initDegrees(): DegreeEntry[] {
    if (!initialData?.degrees?.length) return [{ degree: "", university: "", year: "" }];
    return initialData.degrees.map((d: any) =>
      typeof d === "string"
        ? { degree: d, university: "", year: "" }
        : { degree: d.degree || "", university: d.university || "", year: String(d.year || "") }
    );
  }

  // ── State ──────────────────────────────────────────────────────────────────

  const [f, setF] = useState({
    name:               initialData?.name               || "",
    mobile:             initialData?.mobile             || "",
    email:              initialData?.email              || "",
    photo:              initialData?.photo              || "",
    department:         initialData?.department         || "",
    speciality:         initialData?.speciality         || "",
    registrationNumber: initialData?.registrationNumber || "",
    experience:         String(initialData?.experience  || ""),
    opdFee:             String(initialData?.opdFee      || ""),
    offerFee:           String(initialData?.offerFee    || ""),
    about:              initialData?.about              || "",
    collegeUG:          initialData?.collegeUG          || "",
    collegePG:          initialData?.collegePG          || "",
    collegeMCH:         initialData?.collegeMCH         || "",
    district:           lockedAddress?.district || initialData?.address?.district || initialData?.district || "",
    city:               lockedAddress?.city    || initialData?.address?.city    || initialData?.city     || "",
    onlineAvailable:    initialData?.onlineAvailable    || false,
    onlineFee:          String(initialData?.onlineFee   || ""),
    password:           "",
    confirmPassword:    "",
    isActive:           initialData?.isActive  !== false,
    isAvailable:        initialData?.isAvailable !== false,
  });

  const [degrees, setDegrees]           = useState<DegreeEntry[]>(initDegrees);
  const [availableSlots, setAvailableSlots] = useState<SlotEntry[]>(initialData?.availableSlots || []);
  const [onlineSlots, setOnlineSlots]   = useState<SlotEntry[]>(initialData?.onlineSlots || []);
  const [prevExp, setPrevExp]           = useState<PrevExpEntry[]>(
    initialData?.previousExperience?.length
      ? initialData.previousExperience
      : [{ institution: "", role: "", yearFrom: "", yearTo: "" }]
  );
  const [awards, setAwards]             = useState<string[]>(
    initialData?.awards?.length ? [...initialData.awards] : [""]
  );

  // Hospital association
  const [hospMode, setHospMode]                 = useState<"network"|"private">(
    initialData?.hospitalId ? "network" : "network"
  );
  const [selectedHospitalId, setSelectedHospitalId] = useState(
    initialData?.hospitalId ? String(initialData.hospitalId) : ""
  );
  const [privateHospName, setPrivateHospName]   = useState(
    (!initialData?.hospitalId ? initialData?.hospitalName : "") || ""
  );
  const [addressAutoFilled, setAddressAutoFilled] = useState(false);
  const [autoFilledFrom, setAutoFilledFrom]       = useState("");

  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef                    = useRef<HTMLInputElement>(null);

  const set = (k: string, v: any) => setF(p => ({ ...p, [k]: v }));

  function handleHospitalSelect(id: string) {
    setSelectedHospitalId(id);
    if (id) {
      const hosp = hospitals.find(h => h._id === id);
      if (hosp?.address) {
        set("district", hosp.address.district || "");
        set("city",     hosp.address.city     || "");
        setAddressAutoFilled(true);
        setAutoFilledFrom(hosp.name);
      }
    } else {
      setAddressAutoFilled(false);
      setAutoFilledFrom("");
    }
  }

  // ── Photo upload ──────────────────────────────────────────────────────────

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "doctor");
      const res  = await fetch("/api/upload-photo", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) set("photo", data.url);
      else setError("Photo upload nahi ho saka");
    } catch { setError("Photo upload error"); }
    setPhotoUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Degrees helpers ───────────────────────────────────────────────────────

  const setDeg   = (i: number, k: keyof DegreeEntry, v: string) =>
    setDegrees(d => d.map((x, j) => j === i ? { ...x, [k]: v } : x));
  const addDeg   = () => setDegrees(d => [...d, { degree: "", university: "", year: "" }]);
  const removeDeg = (i: number) => setDegrees(d => d.filter((_, j) => j !== i));

  // ── PrevExp helpers ───────────────────────────────────────────────────────

  const setPEF    = (i: number, k: keyof PrevExpEntry, v: string) =>
    setPrevExp(p => p.map((x, j) => j === i ? { ...x, [k]: v } : x));
  const addPE     = () => setPrevExp(p => [...p, { institution: "", role: "", yearFrom: "", yearTo: "" }]);
  const removePE  = (i: number) => setPrevExp(p => p.filter((_, j) => j !== i));

  // ── Awards helpers ────────────────────────────────────────────────────────

  const setAward    = (i: number, v: string) => setAwards(a => a.map((x, j) => j === i ? v : x));
  const addAward    = () => setAwards(a => [...a, ""]);
  const removeAward = (i: number) => setAwards(a => a.filter((_, j) => j !== i));

  // ── Build payload ─────────────────────────────────────────────────────────

  function buildPayload(): DoctorFormPayload {
    return {
      name:               f.name.trim(),
      mobile:             f.mobile.trim(),
      email:              f.email.trim(),
      photo:              f.photo,
      department:         f.department,
      speciality:         f.speciality.trim(),
      registrationNumber: f.registrationNumber.trim(),
      experience:         Number(f.experience) || 0,
      opdFee:             Number(f.opdFee),
      offerFee:           Number(f.offerFee) || Number(f.opdFee),
      about:              f.about.trim(),
      collegeUG:          f.collegeUG.trim(),
      collegePG:          f.collegePG.trim(),
      collegeMCH:         f.collegeMCH.trim(),
      district:           f.district,
      city:               f.city.trim(),
      degrees:            degrees.filter(d => d.degree.trim()),
      availableSlots,
      onlineAvailable:    f.onlineAvailable,
      onlineFee:          Number(f.onlineFee) || 0,
      onlineSlots:        f.onlineAvailable ? onlineSlots : [],
      previousExperience: prevExp.filter(p => p.institution.trim() || p.role.trim()),
      awards:             awards.filter(a => a.trim()),
      ...(showHospitalSection && {
        hospitalId:   hospMode === "network" ? (selectedHospitalId || undefined) : undefined,
        hospitalName: hospMode === "private"  ? (privateHospName.trim() || undefined) : undefined,
      }),
      ...(showPasswordSection && { password: f.password }),
      ...(showStatusSection && { isActive: f.isActive, isAvailable: f.isAvailable }),
    };
  }

  // ── Validation ────────────────────────────────────────────────────────────

  function validate(): string {
    if (!f.name.trim())    return "Doctor ka naam zaruri hai";
    if (!f.department)     return "Department zaruri hai";
    if (!f.opdFee || Number(f.opdFee) <= 0) return "Valid OPD fee daalo";
    if (showPasswordSection) {
      if (!/^\d{10}$/.test(f.mobile.trim())) return "Valid 10-digit mobile number daalo";
      if (!f.registrationNumber.trim())       return "Medical Council Registration Number zaruri hai";
      if (!f.password || f.password.length < 6) return "Password kam se kam 6 characters ka hona chahiye";
      if (f.password !== f.confirmPassword)   return "Passwords match nahi kar rahe";
    }
    if (showHospitalSection) {
      if (hospMode === "network" && !selectedHospitalId) return "Hospital select karein ya Private choose karein";
      if (hospMode === "private" && !privateHospName.trim()) return "Private clinic ka naam daalo";
    }
    return "";
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true); setError("");
    const result = await onSubmit(buildPayload());
    if (!result.success) setError(result.message || "Kuch galat hua, dobara try karein");
    setLoading(false);
  }

  // ── Shared styles ─────────────────────────────────────────────────────────

  const inp = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all";
  const sel = inp + " bg-white";
  const smInp = "w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm flex items-start gap-2">
          <span className="mt-0.5">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* ══ 1: Personal Information ══════════════════════════════════════════ */}
      <section>
        <SecHead icon="👤" title="Personal Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Photo upload */}
          <div className="sm:col-span-2 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-2 border-gray-200 overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm">
              {f.photo
                ? <img src={f.photo} alt="Doctor" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-3xl">👨‍⚕️</div>
              }
            </div>
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={photoUploading}
                className="text-sm bg-blue-50 border border-blue-200 text-blue-600 px-4 py-2 rounded-xl hover:bg-blue-100 transition disabled:opacity-50 font-medium">
                {photoUploading ? "Uploading..." : "📷 Photo Upload Karein"}
              </button>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG — max 2MB</p>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-500">Doctor ka Poora Naam *</label>
            <input value={f.name} onChange={e => set("name", e.target.value)}
              placeholder="Dr. Ramesh Kumar" className={`mt-1 ${inp}`} />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Mobile Number{showPasswordSection ? " *" : ""}</label>
            <div className="mt-1 flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <span className="px-3 py-2.5 bg-gray-50 text-gray-500 text-sm border-r border-gray-200 select-none">+91</span>
              <input type="tel" maxLength={10} value={f.mobile}
                onChange={e => set("mobile", e.target.value.replace(/\D/g, ""))}
                placeholder="9876543210" className="flex-1 px-3 py-2.5 text-sm focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Email ID</label>
            <input type="email" value={f.email} onChange={e => set("email", e.target.value)}
              placeholder="doctor@email.com" className={`mt-1 ${inp}`} />
          </div>
        </div>
      </section>

      <div className="border-t border-gray-100" />

      {/* ══ 2: Professional Details ══════════════════════════════════════════ */}
      <section>
        <SecHead icon="🩺" title="Professional Details" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500">Department *</label>
            <select value={f.department} onChange={e => set("department", e.target.value)} className={`mt-1 ${sel}`}>
              <option value="">-- Department Select Karein --</option>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Speciality</label>
            <input value={f.speciality} onChange={e => set("speciality", e.target.value)}
              placeholder="e.g. Laparoscopic Surgery" className={`mt-1 ${inp}`} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Medical Council Registration No.{showPasswordSection ? " *" : ""}</label>
            <input value={f.registrationNumber} onChange={e => set("registrationNumber", e.target.value)}
              placeholder="e.g. BHR-12345 / DL-98765" className={`mt-1 ${inp}`} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Total Experience (years)</label>
            <input type="number" min={0} value={f.experience} onChange={e => set("experience", e.target.value)}
              placeholder="5" className={`mt-1 ${inp}`} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">OPD Fee (₹) *</label>
            <input type="number" min={0} value={f.opdFee} onChange={e => set("opdFee", e.target.value)}
              placeholder="300" className={`mt-1 ${inp}`} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Offer / Discount Fee (₹)</label>
            <input type="number" min={0} value={f.offerFee} onChange={e => set("offerFee", e.target.value)}
              placeholder="250 (blank = same as OPD fee)" className={`mt-1 ${inp}`} />
          </div>
        </div>
      </section>

      <div className="border-t border-gray-100" />

      {/* ══ 3: Education & Qualifications ════════════════════════════════════ */}
      <section>
        <SecHead icon="🎓" title="Education & Qualifications" />

        {/* Dynamic degrees table */}
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Degrees / Qualifications</p>
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-0.5">
              <span className="col-span-4 text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Degree</span>
              <span className="col-span-5 text-[10px] text-gray-400 font-semibold uppercase tracking-wide">University / College</span>
              <span className="col-span-2 text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Year</span>
              <span className="col-span-1"></span>
            </div>
            {degrees.map((d, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4">
                  <input value={d.degree} onChange={e => setDeg(i, "degree", e.target.value)}
                    placeholder="MBBS / MD / MS" className={smInp} />
                </div>
                <div className="col-span-5">
                  <input value={d.university} onChange={e => setDeg(i, "university", e.target.value)}
                    placeholder="AIIMS / PMCH / etc." className={smInp} />
                </div>
                <div className="col-span-2">
                  <input value={d.year} onChange={e => setDeg(i, "year", e.target.value)}
                    placeholder="2018" type="number" min={1970} max={2030} className={smInp} />
                </div>
                <button type="button" onClick={() => removeDeg(i)}
                  className="col-span-1 text-red-400 hover:text-red-600 text-xl leading-none text-center">×</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addDeg}
            className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
            + Add Degree
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500">UG College (MBBS / BDS)</label>
            <input value={f.collegeUG} onChange={e => set("collegeUG", e.target.value)}
              placeholder="e.g. PMCH Patna, AIIMS Delhi" className={`mt-1 ${inp}`} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">PG College (MD / MS / DNB)</label>
            <input value={f.collegePG} onChange={e => set("collegePG", e.target.value)}
              placeholder="e.g. SMS Jaipur, KGMC Lucknow" className={`mt-1 ${inp}`} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-500">MCH / Super-Specialty College</label>
            <input value={f.collegeMCH} onChange={e => set("collegeMCH", e.target.value)}
              placeholder="e.g. AIIMS Delhi (MCH Neurosurgery)" className={`mt-1 ${inp}`} />
          </div>
        </div>
      </section>

      <div className="border-t border-gray-100" />

      {/* ══ 4: Previous Experience ══════════════════════════════════════════ */}
      <section>
        <SecHead icon="🏛️" title="Previous Work Experience" />
        <p className="text-xs text-gray-400 mb-3">Pehle kahan kaam kiya — AIIMS, PMCH, PGI, Medanta etc.</p>
        <div className="space-y-3">
          {prevExp.map((e, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Institution / Hospital</label>
                  <input value={e.institution} onChange={ev => setPEF(i, "institution", ev.target.value)}
                    placeholder="AIIMS Delhi / PMCH / PGI Chandigarh..."
                    list={`inst-list-${i}`}
                    className={`mt-0.5 ${smInp}`} />
                  <datalist id={`inst-list-${i}`}>
                    {KNOWN_INSTITUTIONS.map(x => <option key={x} value={x} />)}
                  </datalist>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Role / Designation</label>
                  <input value={e.role} onChange={ev => setPEF(i, "role", ev.target.value)}
                    placeholder="Senior Resident / Consultant / Fellow"
                    className={`mt-0.5 ${smInp}`} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 items-end">
                <div>
                  <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Year From</label>
                  <input value={e.yearFrom} onChange={ev => setPEF(i, "yearFrom", ev.target.value)}
                    placeholder="2015" type="number" min={1980} max={2030}
                    className={`mt-0.5 ${smInp}`} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Year To</label>
                  <input value={e.yearTo} onChange={ev => setPEF(i, "yearTo", ev.target.value)}
                    placeholder="2020 / Present"
                    className={`mt-0.5 ${smInp}`} />
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => removePE(i)}
                    className="text-xs text-red-400 hover:text-red-600 font-semibold px-2 py-1.5 rounded-lg hover:bg-red-50 transition">
                    ✕ Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addPE}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
            + Add Previous Experience
          </button>
        </div>
      </section>

      <div className="border-t border-gray-100" />

      {/* ══ 5: Awards & Recognition ══════════════════════════════════════════ */}
      <section>
        <SecHead icon="🏆" title="Awards & Recognition" />
        <div className="space-y-2">
          {awards.map((a, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input value={a} onChange={e => setAward(i, e.target.value)}
                placeholder="e.g. Best Surgeon Award 2022, State Medical Council Recognition..."
                className={`flex-1 ${inp}`} />
              <button type="button" onClick={() => removeAward(i)}
                className="text-red-400 hover:text-red-600 text-xl leading-none flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition">×</button>
            </div>
          ))}
          <button type="button" onClick={addAward}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 mt-1">
            + Add Award / Recognition
          </button>
        </div>
      </section>

      <div className="border-t border-gray-100" />

      {/* ══ 6: OPD Location ══════════════════════════════════════════════════ */}
      <section>
        <SecHead icon="📍" title="OPD Location" />

        {lockedAddress ? (
          /* Hospital Dashboard — address locked from hospital profile */
          <div className="flex items-start gap-3 bg-teal-50 border border-teal-200 rounded-xl p-3">
            <span className="text-teal-500 text-lg mt-0.5">📍</span>
            <div>
              <p className="text-sm font-semibold text-teal-800">
                {lockedAddress.city ? `${lockedAddress.city}, ` : ""}{lockedAddress.district}, Bihar
              </p>
              <p className="text-xs text-teal-600 mt-0.5">Hospital ka address automatically set hai — change nahi ho sakta</p>
            </div>
          </div>
        ) : addressAutoFilled ? (
          /* Admin/Staff — network hospital selected, auto-filled */
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
              <span className="text-blue-500 text-lg mt-0.5">🏥</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-800">
                  {f.city ? `${f.city}, ` : ""}{f.district}, Bihar
                </p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Auto-filled from: <strong>{autoFilledFrom}</strong>
                </p>
              </div>
              <button type="button" onClick={() => { setAddressAutoFilled(false); setAutoFilledFrom(""); }}
                className="text-xs text-blue-500 underline hover:text-blue-700 flex-shrink-0">
                Edit
              </button>
            </div>
          </div>
        ) : showHospitalSection && hospMode === "private" ? (
          /* Private clinic mode — district/city set in section 9 above */
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-500">
            <span>📋</span>
            <span>OPD location <strong>Private Clinic section</strong> se automatically set hoga (upar bharein)</span>
          </div>
        ) : (
          /* Default — manually editable */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">District</label>
              <select value={f.district} onChange={e => set("district", e.target.value)} className={`mt-1 ${sel}`}>
                <option value="">-- District --</option>
                {BIHAR_DISTRICTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">City / Town / Area</label>
              <input value={f.city} onChange={e => set("city", e.target.value)}
                placeholder="Patna / Muzaffarpur / Boring Road etc."
                className={`mt-1 ${inp}`} />
            </div>
          </div>
        )}
      </section>

      <div className="border-t border-gray-100" />

      {/* ══ 7: OPD Available Days & Timing ═══════════════════════════════════ */}
      <section>
        <SecHead icon="📅" title="OPD Available Days & Timing" />
        <SlotEditor label="Din aur Time alag karein" slots={availableSlots} onChange={setAvailableSlots} />
      </section>

      <div className="border-t border-gray-100" />

      {/* ══ 8: Online Consultation ═══════════════════════════════════════════ */}
      <section>
        <SecHead icon="💻" title="Online Consultation (Audio / Video)" />
        <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition mb-4 ${
          f.onlineAvailable ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200 hover:border-gray-300"
        }`}>
          <input type="checkbox" checked={f.onlineAvailable} onChange={e => set("onlineAvailable", e.target.checked)}
            className="w-4 h-4 accent-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-700">
              {f.onlineAvailable ? "✅ Online Consultation Available Hai" : "Online Consultation Available Nahi"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Patients ghar baithe Video / Audio Call se consult kar sakenge</p>
          </div>
        </label>

        {f.onlineAvailable && (
          <div className="space-y-4 pl-0">
            <div>
              <label className="text-xs font-medium text-gray-500">Online Consultation Fee (₹)</label>
              <input type="number" min={0} value={f.onlineFee} onChange={e => set("onlineFee", e.target.value)}
                placeholder="200" className={`mt-1 ${inp} max-w-xs`} />
            </div>
            <SlotEditor label="Online Timing Schedule" slots={onlineSlots} onChange={setOnlineSlots} />
          </div>
        )}
      </section>

      {/* ══ 9: Hospital / Clinic Association (optional) ══════════════════════ */}
      {showHospitalSection && (
        <>
          <div className="border-t border-gray-100" />
          <section>
            <SecHead icon="🏥" title="Hospital / Clinic Association" />
            <div className="flex gap-3 mb-4">
              {(["network","private"] as const).map(m => (
                <button key={m} type="button" onClick={() => setHospMode(m)}
                  className={`flex-1 py-3 rounded-xl border text-sm font-medium transition flex items-center justify-center gap-2 ${
                    hospMode === m ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                  }`}>
                  {m === "network" ? "🏥 Brims Network Hospital" : "🏠 Private Clinic / New"}
                </button>
              ))}
            </div>

            {hospMode === "network" ? (
              <div>
                <select value={selectedHospitalId} onChange={e => handleHospitalSelect(e.target.value)} className={sel}>
                  <option value="">— Hospital chunein —</option>
                  {hospitals.map(h => (
                    <option key={h._id} value={h._id}>
                      {h.name}{h.address?.district ? ` (${h.address.district})` : ""}
                    </option>
                  ))}
                </select>
                {hospitals.length === 0 && (
                  <p className="text-xs text-amber-600 mt-2">⚠️ Koi verified hospital nahi mila. Private choose karein ya hospital onboard karein.</p>
                )}
                {selectedHospitalId && (
                  <p className="text-xs text-green-700 mt-1.5 font-medium">
                    ✓ {hospitals.find(h => h._id === selectedHospitalId)?.name}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Clinic / Hospital ka Naam *</label>
                  <input value={privateHospName} onChange={e => setPrivateHospName(e.target.value)}
                    placeholder="Ram Clinic, Chapra" className={`mt-1 ${inp}`} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500">OPD District *</label>
                    <select value={f.district} onChange={e => set("district", e.target.value)} className={`mt-1 ${sel}`}>
                      <option value="">-- District --</option>
                      {BIHAR_DISTRICTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">OPD City / Area</label>
                    <input value={f.city} onChange={e => set("city", e.target.value)}
                      placeholder="Patna / Muzaffarpur..." className={`mt-1 ${inp}`} />
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                  💡 Network mein join karne ke liye{" "}
                  <a href="/hospital-onboarding" className="underline font-medium">Hospital Onboard Karein</a>{" "}
                  — zyada patients milenge!
                </div>
              </div>
            )}
          </section>
        </>
      )}

      <div className="border-t border-gray-100" />

      {/* ══ 10: Bio / About ══════════════════════════════════════════════════ */}
      <section>
        <SecHead icon="📝" title="Bio / About Doctor" />
        <textarea value={f.about} onChange={e => set("about", e.target.value)}
          placeholder="Doctor ke baare mein likhen — expertise, care approach, interests, achievements..."
          rows={3} className={`${inp} resize-none`} />
      </section>

      {/* ══ 11: Login Credentials (self-registration only) ═══════════════════ */}
      {showPasswordSection && (
        <>
          <div className="border-t border-gray-100" />
          <section>
            <SecHead icon="🔐" title="Login Credentials" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">Password *</label>
                <input type="password" value={f.password} onChange={e => set("password", e.target.value)}
                  placeholder="Kam se kam 6 characters" className={`mt-1 ${inp}`} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Confirm Password *</label>
                <input type="password" value={f.confirmPassword} onChange={e => set("confirmPassword", e.target.value)}
                  placeholder="Password dobara daalen" className={`mt-1 ${inp}`} />
              </div>
            </div>
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
              ℹ️ Admin approval ke baad aapka Doctor ID assign hoga. Tab <strong>/doctor/login</strong> pe login kar sakte hain.
            </div>
          </section>
        </>
      )}

      {/* ══ 12: Status (admin / edit mode) ═══════════════════════════════════ */}
      {showStatusSection && (
        <>
          <div className="border-t border-gray-100" />
          <section>
            <SecHead icon="⚙️" title="Account Status" />
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${f.isActive ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <input type="checkbox" checked={f.isActive} onChange={e => set("isActive", e.target.checked)} className="w-4 h-4 accent-green-600" />
                <span className="text-sm font-medium">{f.isActive ? "✅ Active" : "⏸️ Inactive"}</span>
              </label>
              <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${f.isAvailable ? "bg-teal-50 border-teal-200" : "bg-gray-50 border-gray-200"}`}>
                <input type="checkbox" checked={f.isAvailable} onChange={e => set("isAvailable", e.target.checked)} className="w-4 h-4 accent-teal-600" />
                <span className="text-sm font-medium">{f.isAvailable ? "🟢 Available" : "🔴 Unavailable"}</span>
              </label>
            </div>
          </section>
        </>
      )}

      {/* ══ Submit / Cancel ═══════════════════════════════════════════════════ */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
            Cancel
          </button>
        )}
        <button type="button" onClick={handleSubmit} disabled={loading}
          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl text-sm font-bold shadow-sm transition disabled:opacity-50">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              {isEdit ? "Save ho raha hai..." : "Submit ho raha hai..."}
            </span>
          ) : submitLabel}
        </button>
      </div>
    </div>
  );
}