"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BIHAR_DISTRICTS } from "../../lib/biharDistricts";

const DEPARTMENTS = [
  "General Medicine","General Surgery","Pediatrics","Gynecology & Obstetrics",
  "Orthopedics","Cardiology","Dermatology","ENT","Ophthalmology","Neurology",
  "Psychiatry","Radiology","Pathology","Anesthesiology","Dentistry","Physiotherapy","Other",
];

// BIHAR_DISTRICTS imported from lib/biharDistricts

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

type Slot = { day: string; times: string[] };
type Hospital = { _id: string; name: string; address?: { district?: string; city?: string }; isVerified?: boolean };

export default function DoctorProfilePage() {
  const router  = useRouter();
  const photoRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);

  // Profile fields
  const [name, setName]           = useState("");
  const [speciality, setSpeciality] = useState("");
  const [degreesStr, setDegreesStr] = useState("");
  const [experience, setExperience] = useState("");
  const [opdFee, setOpdFee]       = useState("");
  const [offerFee, setOfferFee]   = useState("");
  const [photo, setPhoto]         = useState("");
  const [district, setDistrict]   = useState("");
  const [city, setCity]           = useState("");
  const [isAvailable, setIsAvailable] = useState(true);

  // Hospital
  const [hospMode, setHospMode]   = useState<"network"|"private">("network");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospId, setSelectedHospId] = useState("");
  const [privateHospName, setPrivateHospName] = useState("");
  const [currentHospital, setCurrentHospital] = useState<Hospital | null>(null);

  // Slots
  const [slots, setSlots]         = useState<Slot[]>([]);
  const [slotDay, setSlotDay]     = useState("Monday");
  const [slotTime, setSlotTime]   = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const doctorId = localStorage.getItem("doctorId");
    if (!doctorId || role !== "doctor") { router.replace("/login"); return; }
    fetchProfile();
    fetchHospitals();
  }, []);

  async function fetchProfile() {
    setLoading(true);
    try {
      const res  = await fetch("/api/doctor/profile");
      const data = await res.json();
      if (!data.success) { router.replace("/doctor-dashboard"); return; }
      const d = data.doctor;
      setName(d.name || "");
      setSpeciality(d.speciality || "");
      setDegreesStr((d.degrees || []).join(", "));
      setExperience(String(d.experience || ""));
      setOpdFee(String(d.opdFee || ""));
      setOfferFee(String(d.offerFee || ""));
      setPhoto(d.photo || "");
      setDistrict(d.address?.district || "");
      setCity(d.address?.city || "");
      setIsAvailable(d.isAvailable !== false);
      setSlots(d.availableSlots || []);
      if (data.hospital) {
        setCurrentHospital(data.hospital);
        setSelectedHospId(data.hospital._id);
        setHospMode("network");
      } else if (d.hospitalName) {
        setPrivateHospName(d.hospitalName);
        setHospMode("private");
      }
    } finally { setLoading(false); }
  }

  async function fetchHospitals() {
    const res  = await fetch("/api/hospitals-public");
    const data = await res.json();
    if (data.success) setHospitals(data.hospitals);
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  async function handlePhotoUpload(file: File) {
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const res  = await fetch("/api/upload-photo", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) { setPhoto(data.url); showToast("Photo update ho gayi!", true); }
      else showToast(data.message, false);
    } finally { setPhotoUploading(false); }
  }

  async function handleSave() {
    if (!name.trim())     { showToast("Naam zaruri hai", false); return; }
    if (!opdFee || Number(opdFee) <= 0) { showToast("Valid OPD fee daalo", false); return; }
    if (hospMode === "network" && !selectedHospId) { showToast("Hospital select karein", false); return; }
    if (hospMode === "private" && !privateHospName.trim()) { showToast("Clinic ka naam daalo", false); return; }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name, speciality, experience: Number(experience) || 0,
        opdFee: Number(opdFee),
        offerFee: offerFee ? Number(offerFee) : undefined,
        photo, district, city, isAvailable,
        degrees: degreesStr ? degreesStr.split(",").map((s) => s.trim()).filter(Boolean) : [],
        availableSlots: slots,
      };
      if (hospMode === "network") payload.hospitalId   = selectedHospId;
      else                        payload.hospitalName = privateHospName.trim();

      const res  = await fetch("/api/doctor/profile", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) showToast("Profile save ho gayi!", true);
      else showToast(data.message, false);
    } finally { setSaving(false); }
  }

  // Slot helpers
  function addTimeToSlot() {
    const t = slotTime.trim();
    if (!t) return;
    setSlots((prev) => {
      const existing = prev.find((s) => s.day === slotDay);
      if (existing) {
        if (existing.times.includes(t)) return prev;
        return prev.map((s) => s.day === slotDay ? { ...s, times: [...s.times, t] } : s);
      }
      return [...prev, { day: slotDay, times: [t] }];
    });
    setSlotTime("");
  }

  function removeTime(day: string, time: string) {
    setSlots((prev) => prev.map((s) => s.day === day ? { ...s, times: s.times.filter((t) => t !== time) } : s).filter((s) => s.times.length > 0));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const selectedHosp = hospitals.find((h) => h._id === selectedHospId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.ok ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            ←
          </button>
          <div className="flex-1">
            <p className="font-bold text-gray-800 text-sm">Doctor Profile Edit</p>
            <p className="text-xs text-gray-400">Apni details aur availability update karein</p>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition disabled:opacity-60 flex items-center gap-2">
            {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</> : "Save"}
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-20">

        {/* ── Photo ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm font-bold text-gray-700 mb-4">Profile Photo</p>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-blue-100 border-2 border-blue-200 shrink-0">
              {photo
                ? <img src={photo} alt={name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-blue-600">{name?.[0] || "D"}</div>
              }
            </div>
            <div className="space-y-2">
              <button
                onClick={() => photoRef.current?.click()}
                disabled={photoUploading}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium px-4 py-2 rounded-xl transition disabled:opacity-60">
                {photoUploading ? "Uploading..." : "Photo Change Karein"}
              </button>
              <p className="text-xs text-gray-400">JPG ya PNG, max 5 MB</p>
            </div>
          </div>
          <input ref={photoRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }} />
        </div>

        {/* ── Basic Info ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <p className="text-sm font-bold text-gray-700">Basic Information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 font-medium">Doctor ka Naam *</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Speciality</label>
              <input value={speciality} onChange={(e) => setSpeciality(e.target.value)}
                placeholder="e.g. Laparoscopic Surgery"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Experience (years)</label>
              <input type="number" min={0} value={experience} onChange={(e) => setExperience(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">OPD Fee (₹) *</label>
              <input type="number" min={0} value={opdFee} onChange={(e) => setOpdFee(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Offer Fee (₹)</label>
              <input type="number" min={0} value={offerFee} onChange={(e) => setOfferFee(e.target.value)}
                placeholder="Optional discount fee"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 font-medium">Degrees (comma se alag karein)</label>
              <input value={degreesStr} onChange={(e) => setDegreesStr(e.target.value)}
                placeholder="MBBS, MD, MS"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">District</label>
              <select value={district} onChange={(e) => setDistrict(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white">
                <option value="">-- District --</option>
                {BIHAR_DISTRICTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">City / Town</label>
              <input value={city} onChange={(e) => setCity(e.target.value)}
                placeholder="Chapra"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
            </div>
          </div>

          {/* Available toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div onClick={() => setIsAvailable((p) => !p)}
              className={`w-12 h-6 rounded-full transition-colors relative ${isAvailable ? "bg-green-500" : "bg-gray-300"}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${isAvailable ? "left-6" : "left-0.5"}`} />
            </div>
            <span className="text-sm text-gray-700 font-medium">
              {isAvailable ? "Available for OPD" : "Not Available"}
            </span>
          </label>
        </div>

        {/* ── Hospital / Clinic ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <p className="text-sm font-bold text-gray-700">Hospital / Clinic Association</p>

          {currentHospital && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700 flex items-center gap-2">
              <span className="text-lg">🏥</span>
              <div>
                <p className="font-semibold">{currentHospital.name}</p>
                {currentHospital.address?.district && <p className="text-xs text-blue-500">{currentHospital.address.district}</p>}
              </div>
              {currentHospital.isVerified && <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verified</span>}
            </div>
          )}

          <div className="flex gap-2">
            {(["network","private"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setHospMode(m)}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-medium transition-all ${hospMode === m ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
                {m === "network" ? "🏥 Brims Network" : "🏠 Private Clinic"}
              </button>
            ))}
          </div>

          {hospMode === "network" && (
            <div>
              <label className="text-xs text-gray-500 font-medium">Hospital Select Karein *</label>
              <select value={selectedHospId} onChange={(e) => setSelectedHospId(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white">
                <option value="">-- Hospital chunein --</option>
                {hospitals.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name}{h.address?.district ? ` — ${h.address.district}` : ""}
                  </option>
                ))}
              </select>
              {selectedHosp && (
                <p className="text-xs text-blue-600 mt-1 pl-1">✓ {selectedHosp.name}</p>
              )}
              {hospitals.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">Koi verified hospital nahi mila. Private Clinic choose karein.</p>
              )}
            </div>
          )}

          {hospMode === "private" && (
            <div>
              <label className="text-xs text-gray-500 font-medium">Clinic / Hospital Naam *</label>
              <input value={privateHospName} onChange={(e) => setPrivateHospName(e.target.value)}
                placeholder="Ram Clinic, Chapra"
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
              <p className="text-xs text-gray-400 mt-1">
                Clinic ko Brims network mein join karne ke liye{" "}
                <a href="/hospital-onboarding" className="text-blue-500 underline">Hospital Onboarding</a> karein.
              </p>
            </div>
          )}
        </div>

        {/* ── Available Slots ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <p className="text-sm font-bold text-gray-700">Available Slots</p>

          {/* Add slot */}
          <div className="flex gap-2">
            <select value={slotDay} onChange={(e) => setSlotDay(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
              {DAYS.map((d) => <option key={d}>{d}</option>)}
            </select>
            <input value={slotTime} onChange={(e) => setSlotTime(e.target.value)}
              placeholder="e.g. 10:00 AM"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            <button onClick={addTimeToSlot}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
              + Add
            </button>
          </div>

          {/* Display existing slots */}
          {slots.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Koi slot add nahi kiya. Upar se day + time add karein.</p>
          ) : (
            <div className="space-y-3">
              {DAYS.filter((d) => slots.some((s) => s.day === d)).map((day) => {
                const s = slots.find((sl) => sl.day === day);
                if (!s) return null;
                return (
                  <div key={day}>
                    <p className="text-xs font-semibold text-gray-600 mb-1.5">{day}</p>
                    <div className="flex flex-wrap gap-2">
                      {s.times.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full border border-blue-100">
                          {t}
                          <button onClick={() => removeTime(day, t)} className="text-blue-400 hover:text-red-500 ml-1 text-xs leading-none">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Save button (bottom) */}
        <button onClick={handleSave} disabled={saving}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-2xl font-bold text-base hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2">
          {saving ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</> : "Profile Save Karein →"}
        </button>
      </div>
    </div>
  );
}
