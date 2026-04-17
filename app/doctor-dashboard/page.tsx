"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Booking = {
  _id: string;
  bookingId: string;
  type: string;
  status: string;
  paymentStatus: string;
  appointmentDate: string;
  slot: string;
  amount: number;
  patientName: string;
  patientMobile: string;
  patientPhoto: string;
  consultType: string;
  symptoms: string;
};

type Doctor = {
  _id: string;
  name: string;
  department: string;
  speciality: string;
  photo: string;
  hospitalName: string;
  opdFee: number;
  offerFee?: number;
  experience?: number;
  registrationNumber?: string;
  degrees?: { degree: string; university: string; year?: number }[];
  collegeUG?: string;
  collegePG?: string;
  collegeMCH?: string;
  about?: string;
  isAvailable?: boolean;
  profileComplete?: boolean;
};

type Stats = { todayCount: number; pendingCount: number; completedCount: number };

const TAB_OPTIONS = [
  { key: "today",    label: "Aaj" },
  { key: "upcoming", label: "Upcoming" },
  { key: "all",      label: "Sab" },
];

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const TYPE_BADGE: Record<string, string> = {
  OPD:          "bg-teal-100 text-teal-700",
  Consultation: "bg-purple-100 text-purple-700",
  Lab:          "bg-orange-100 text-orange-700",
};

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function Initials({ name, photo }: { name: string; photo: string }) {
  if (photo) return <img src={photo} alt={name} className="w-10 h-10 rounded-xl object-cover" />;
  const ini = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-sm">
      {ini}
    </div>
  );
}

// ── Prescription Upload Modal ─────────────────────────────────────────────────
function PrescriptionModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile]       = useState<File | null>(null);
  const [notes, setNotes]     = useState("");
  const [title, setTitle]     = useState(`Prescription — ${new Date().toLocaleDateString("en-IN")}`);
  const [uploading, setUploading] = useState(false);
  const [done, setDone]       = useState(false);
  const [err, setErr]         = useState("");

  async function handleUpload() {
    if (!file) { setErr("File choose karein"); return; }
    setUploading(true); setErr("");
    try {
      // 1. Upload to Cloudinary
      const fd = new FormData();
      fd.append("file", file);
      const upRes  = await fetch("/api/upload-report", { method: "POST", body: fd });
      const upData = await upRes.json();
      if (!upData.success) { setErr(upData.message); return; }

      // 2. Save prescription record
      const res  = await fetch("/api/doctor/prescription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking._id,
          fileUrl:   upData.url,
          fileType:  upData.fileType,
          title,
          notes,
        }),
      });
      const data = await res.json();
      if (!data.success) { setErr(data.message); return; }
      setDone(true);
    } finally { setUploading(false); }
  }

  if (done) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm p-8 text-center space-y-3">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-3xl">✓</div>
          <p className="font-bold text-gray-800">Prescription Upload Ho Gayi!</p>
          <p className="text-sm text-gray-500">Patient apni reports mein dekh sakta hai.</p>
          <button onClick={onClose} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium text-sm">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800">Prescription Upload</h3>
            <p className="text-xs text-gray-400 mt-0.5">{booking.patientName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition">×</button>
        </div>

        {err && <p className="text-red-600 text-sm bg-red-50 rounded-xl px-3 py-2">{err}</p>}

        <div>
          <label className="text-xs text-gray-500 font-medium">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
        </div>

        <div>
          <label className="text-xs text-gray-500 font-medium">Notes / Diagnosis (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            placeholder="Patient ko kya bataya, medicines, follow-up..."
            className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none" />
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
          {file ? (
            <div>
              <p className="text-sm font-medium text-blue-700">✓ {file.name}</p>
              <p className="text-xs text-gray-400 mt-1">{(file.size/1024).toFixed(0)} KB</p>
            </div>
          ) : (
            <div>
              <p className="text-2xl mb-1">📋</p>
              <p className="text-sm text-gray-500">Prescription file choose karein</p>
              <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — max 10 MB</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)} />

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
          <button onClick={handleUpload} disabled={uploading || !file}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
            {uploading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Uploading...</> : "Upload Karein"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SetPasswordModal({ onClose }: { onClose: () => void }) {
  const [pw, setPw]   = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function save() {
    if (pw.length < 6) { setErr("Minimum 6 characters ka password daalo"); return; }
    if (pw !== pw2) { setErr("Dono passwords match nahi karte"); return; }
    setSaving(true); setErr("");
    const res  = await fetch("/api/auth/set-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw, confirmPassword: pw2 }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) { setMsg(data.message); }
    else setErr(data.message);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
        <h3 className="font-bold text-gray-800">Password Set Karein</h3>
        <p className="text-xs text-gray-500">Ek baar password set karne ke baad OTP ke saath password se bhi login kar sakte hain.</p>
        {err && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{err}</p>}
        {msg ? (
          <div className="text-center space-y-3">
            <p className="text-green-600 font-semibold text-sm">{msg}</p>
            <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium">Done</button>
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs text-gray-500 font-medium">Naya Password</label>
              <div className="relative mt-1">
                <input type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-12 text-sm focus:outline-none focus:border-blue-400" />
                <button type="button" onClick={() => setShow((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600">{show ? "Hide" : "Show"}</button>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Password Confirm Karein</label>
              <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)}
                placeholder="Same password dobara daalo"
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-60">
                {saving ? "Saving..." : "Password Set Karein"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Doctor Profile Tab ───────────────────────────────────────────────────────
function ProfileTab({ doctorId }: { doctorId: string }) {
  const [profile, setProfile] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [name,               setName]               = useState("");
  const [speciality,         setSpeciality]         = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [experience,         setExperience]         = useState("");
  const [about,              setAbout]              = useState("");
  const [photo,              setPhoto]              = useState("");
  const [collegeUG,          setCollegeUG]          = useState("");
  const [collegePG,          setCollegePG]          = useState("");
  const [collegeMCH,         setCollegeMCH]         = useState("");
  const [opdFee,             setOpdFee]             = useState("");
  const [offerFee,           setOfferFee]           = useState("");
  const [degrees, setDegrees] = useState<{ degree: string; university: string; year: string }[]>([]);

  useEffect(() => {
    fetch("/api/doctor/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const doc = d.doctor;
          setProfile(doc);
          setName(doc.name || "");
          setSpeciality(doc.speciality || "");
          setRegistrationNumber(doc.registrationNumber || "");
          setExperience(String(doc.experience || ""));
          setAbout(doc.about || "");
          setPhoto(doc.photo || "");
          setCollegeUG(doc.collegeUG || "");
          setCollegePG(doc.collegePG || "");
          setCollegeMCH(doc.collegeMCH || "");
          setOpdFee(String(doc.opdFee || ""));
          setOfferFee(String(doc.offerFee || ""));
          setDegrees((doc.degrees || []).map((d: any) => ({
            degree:     d.degree     || "",
            university: d.university || "",
            year:       String(d.year || ""),
          })));
        }
      })
      .finally(() => setLoading(false));
  }, [doctorId]);

  function showMsg(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  async function uploadPhoto(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("photo", file);
    try {
      const res  = await fetch("/api/upload-photo", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) { setPhoto(data.url); showMsg("Photo upload ho gayi!", true); }
      else showMsg("Photo upload fail hua", false);
    } catch { showMsg("Upload error", false); }
    setUploading(false);
  }

  function addDegree() {
    setDegrees((p) => [...p, { degree: "", university: "", year: "" }]);
  }
  function removeDegree(i: number) {
    setDegrees((p) => p.filter((_, idx) => idx !== i));
  }
  function updateDegree(i: number, field: string, val: string) {
    setDegrees((p) => p.map((d, idx) => idx === i ? { ...d, [field]: val } : d));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const degreesPayload = degrees
        .filter((d) => d.degree && d.university)
        .map((d) => ({ degree: d.degree, university: d.university, year: Number(d.year) || undefined }));

      const res  = await fetch("/api/doctor/profile", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, speciality, registrationNumber,
          experience: Number(experience) || 0,
          about, photo,
          collegeUG, collegePG, collegeMCH,
          opdFee: Number(opdFee) || 0,
          offerFee: offerFee ? Number(offerFee) : undefined,
          degrees: degreesPayload,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.doctor);
        showMsg("Profile save ho gayi! ✓", true);
      } else {
        showMsg(data.message, false);
      }
    } catch { showMsg("Network error", false); }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Profile load ho raha hai...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold ${
          toast.ok ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Profile completeness banner */}
      {!profile?.profileComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-amber-800 font-semibold text-sm">Profile Incomplete</p>
            <p className="text-amber-600 text-xs">Photo, Registration No., Degree aur Experience fill karein</p>
          </div>
        </div>
      )}

      {/* Photo */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 mb-4">Profile Photo</h3>
        <div className="flex items-center gap-5">
          <div className="w-24 h-24 rounded-2xl bg-blue-100 overflow-hidden flex-shrink-0">
            {photo
              ? <img src={photo} alt="Profile" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-blue-500 text-3xl font-bold">{name?.[0] || "D"}</div>
            }
          </div>
          <div>
            <label className="cursor-pointer inline-block">
              <div className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                uploading ? "bg-gray-100 text-gray-400 border-gray-200" : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
              }`}>
                {uploading ? "Uploading..." : "📷 Photo Upload Karein"}
              </div>
              <input type="file" accept="image/*" className="hidden"
                disabled={uploading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }} />
            </label>
            <p className="text-xs text-gray-400 mt-1.5">JPG, PNG — max 5 MB</p>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h3 className="font-bold text-gray-800">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 font-medium">Doctor Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Dr. Full Name"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Medical Council Registration No. *</label>
            <input value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)}
              placeholder="e.g. BM-12345 / MCI-67890"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Speciality</label>
            <input value={speciality} onChange={(e) => setSpeciality(e.target.value)}
              placeholder="e.g. Cardiologist, General Physician"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Experience (Years) *</label>
            <input type="number" value={experience} onChange={(e) => setExperience(e.target.value)}
              placeholder="0"
              min="0" max="60"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">OPD Fee (₹) *</label>
            <input type="number" value={opdFee} onChange={(e) => setOpdFee(e.target.value)}
              placeholder="500"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Offer Fee (₹) — optional</label>
            <input type="number" value={offerFee} onChange={(e) => setOfferFee(e.target.value)}
              placeholder="Leave blank if no discount"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium">About Doctor</label>
          <textarea value={about} onChange={(e) => setAbout(e.target.value)}
            rows={3}
            placeholder="Doctor ki expertise, achievements, areas of focus ke bare mein likhein..."
            className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
        </div>
      </div>

      {/* Degrees */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Degrees / Qualifications *</h3>
          <button onClick={addDegree}
            className="text-sm text-blue-600 font-semibold hover:bg-blue-50 px-3 py-1.5 rounded-xl transition">
            + Add Degree
          </button>
        </div>
        {degrees.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Koi degree nahi hai. "+ Add Degree" click karein.</p>
        )}
        <div className="space-y-3">
          {degrees.map((d, i) => (
            <div key={i} className="flex gap-2 items-start bg-gray-50 rounded-xl p-3">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <input value={d.degree} onChange={(e) => updateDegree(i, "degree", e.target.value)}
                  placeholder="MBBS / MD / MCH / DNB"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                <input value={d.university} onChange={(e) => updateDegree(i, "university", e.target.value)}
                  placeholder="University / College"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                <input type="number" value={d.year} onChange={(e) => updateDegree(i, "year", e.target.value)}
                  placeholder="Year (e.g. 2010)"
                  min="1970" max="2030"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
              </div>
              <button onClick={() => removeDegree(i)}
                className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center text-sm transition flex-shrink-0">✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Colleges */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h3 className="font-bold text-gray-800">Medical Colleges</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 font-medium">UG College (MBBS)</label>
            <input value={collegeUG} onChange={(e) => setCollegeUG(e.target.value)}
              placeholder="e.g. PMCH Patna, AIIMS New Delhi"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">PG College (MD / MS / DNB)</label>
            <input value={collegePG} onChange={(e) => setCollegePG(e.target.value)}
              placeholder="e.g. AIIMS New Delhi, PGI Chandigarh"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Super-Specialty College (MCH / DM — if applicable)</label>
            <input value={collegeMCH} onChange={(e) => setCollegeMCH(e.target.value)}
              placeholder="e.g. SGPGI Lucknow, TMC Mumbai"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition disabled:opacity-50 text-sm shadow-lg shadow-blue-200"
      >
        {saving ? "Save ho raha hai..." : "💾 Profile Save Karein"}
      </button>
    </div>
  );
}

export default function DoctorDashboard() {
  const router = useRouter();
  const [doctorId, setDoctorId]     = useState("");
  const [doctor, setDoctor]         = useState<Doctor | null>(null);
  const [bookings, setBookings]     = useState<Booking[]>([]);
  const [stats, setStats]           = useState<Stats>({ todayCount: 0, pendingCount: 0, completedCount: 0 });
  const [tab, setTab]               = useState("today");
  const [mainTab, setMainTab]       = useState<"appointments" | "profile">("appointments");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading]       = useState(true);
  const [updating, setUpdating]         = useState<string | null>(null);
  const [prescriptionBooking, setPrescriptionBooking] = useState<Booking | null>(null);
  const [showSetPassword, setShowSetPassword] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const did  = localStorage.getItem("doctorId");
    if (!did || role !== "doctor") {
      router.replace("/portal-login");
      return;
    }
    setDoctorId(did);
  }, []);

  useEffect(() => {
    if (!doctorId) return;
    fetchAppointments();
  }, [doctorId, tab]);

  async function fetchAppointments() {
    setLoading(true);
    try {
      const res  = await fetch(`/api/doctor/appointments?doctorId=${doctorId}&tab=${tab}`);
      const data = await res.json();
      if (data.success) {
        setDoctor(data.doctor);
        setBookings(data.bookings);
        setStats(data.stats);
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(bookingId: string, status: string) {
    setUpdating(bookingId);
    try {
      const res  = await fetch("/api/doctor/appointments", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ bookingId, status }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) => prev.map((b) => b._id === bookingId ? { ...b, status } : b));
      }
    } finally {
      setUpdating(null);
    }
  }

  function logout() {
    ["userId","userRole","userName","doctorId","doctorName","hospitalId","hospitalName"].forEach((k) =>
      localStorage.removeItem(k)
    );
    router.push("/portal-login");
  }

  const filtered = typeFilter === "all"
    ? bookings
    : bookings.filter((b) => b.type === typeFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {doctor?.photo ? (
              <img src={doctor.photo} className="w-9 h-9 rounded-xl object-cover" alt="" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                {doctor?.name?.charAt(0) || "D"}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-800 text-sm leading-tight">{doctor?.name || "Doctor"}</p>
              <p className="text-xs text-gray-500">{doctor?.department} · {doctor?.hospitalName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSetPassword(true)} className="text-xs text-gray-500 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50 border border-gray-200">
              🔒 Password
            </button>
            <button onClick={logout} className="text-xs text-gray-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50">
              Logout
            </button>
          </div>
        </div>
        {/* Main tab bar */}
        <div className="max-w-5xl mx-auto px-4 flex border-t border-gray-100">
          {[
            { key: "appointments", label: "📋 Appointments" },
            { key: "profile",      label: "👤 My Profile" },
          ].map((t) => (
            <button key={t.key}
              onClick={() => setMainTab(t.key as "appointments" | "profile")}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                mainTab === t.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {prescriptionBooking && (
        <PrescriptionModal booking={prescriptionBooking} onClose={() => setPrescriptionBooking(null)} />
      )}
      {showSetPassword && <SetPasswordModal onClose={() => setShowSetPassword(false)} />}

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Profile Tab */}
        {mainTab === "profile" && doctorId && (
          <ProfileTab doctorId={doctorId} />
        )}

        {/* Appointments Tab */}
        {mainTab === "appointments" && <>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Aaj ke Patients", value: stats.todayCount,     color: "from-blue-500 to-cyan-500"    },
            { label: "Pending",          value: stats.pendingCount,   color: "from-amber-500 to-orange-400" },
            { label: "Completed",        value: stats.completedCount, color: "from-green-500 to-emerald-400" },
          ].map((s) => (
            <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow-sm`}>
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="text-xs mt-1 opacity-80">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs + type filter */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex bg-white rounded-xl border border-gray-200 p-1 gap-1">
            {TAB_OPTIONS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  tab === t.key ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex bg-white rounded-xl border border-gray-200 p-1 gap-1">
            {["all","OPD","Consultation"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  typeFilter === t ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {t === "all" ? "Sabhi" : t}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings list */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500 text-sm">Koi appointment nahi mili</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((b) => (
              <div key={b._id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <Initials name={b.patientName} photo={b.patientPhoto} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800 text-sm">{b.patientName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[b.type] || "bg-gray-100 text-gray-600"}`}>
                        {b.type}
                      </span>
                      {b.consultType && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                          {b.consultType === "video" ? "📹 Video" : "🎙️ Audio"}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                      <span>📅 {formatDate(b.appointmentDate)}</span>
                      {b.slot && <span>🕐 {b.slot}</span>}
                      {b.patientMobile && <span>📱 {b.patientMobile}</span>}
                      {b.amount > 0 && <span>💰 ₹{b.amount}</span>}
                    </div>
                    {b.symptoms && (
                      <p className="text-xs text-gray-400 mt-1 truncate">Symptoms: {b.symptoms}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status]}`}>
                      {b.status}
                    </span>
                    {b.type === "Consultation" && b.status === "confirmed" && (
                      <a
                        href={`/consultation/${b._id}?type=${b.consultType || "video"}`}
                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Join Call
                      </a>
                    )}
                    {b.status === "pending" && (
                      <button
                        onClick={() => updateStatus(b._id, "confirmed")}
                        disabled={updating === b._id}
                        className="text-xs bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        {updating === b._id ? "..." : "Confirm"}
                      </button>
                    )}
                    {b.status === "confirmed" && (
                      <button
                        onClick={() => updateStatus(b._id, "completed")}
                        disabled={updating === b._id}
                        className="text-xs bg-teal-500 text-white px-3 py-1 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
                      >
                        {updating === b._id ? "..." : "Done"}
                      </button>
                    )}
                    {(b.status === "confirmed" || b.status === "completed") && (
                      <button
                        onClick={() => setPrescriptionBooking(b)}
                        className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        📋 Prescription
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </> /* end appointments tab */}
      </div>
    </div>
  );
}
