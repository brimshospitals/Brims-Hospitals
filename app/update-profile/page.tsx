"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/header";
import ImageCropper from "../components/ImageCropper";
import biharDistricts from "../../lib/biharDistricts";

const diseases = ["HTN","Diabetes","CVD","CKD","Thyroid Disorder","Joint Pain","Pregnancy"];

export default function UpdateProfilePage() {
  const router = useRouter();
  const [userId, setUserId]               = useState("");
  const [mobile, setMobile]               = useState("");
  const [isNewUser, setIsNewUser]         = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showCropper, setShowCropper]     = useState(false);
  const [photoBlob, setPhotoBlob]         = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview]   = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [success, setSuccess]             = useState("");

  const [form, setForm] = useState({
    name: "", age: "", gender: "",
    maritalStatus: "", isPregnant: false, lmp: "",
    idType: "", idNumber: "", email: "",
    district: "", prakhand: "", village: "",
    preExistingDiseases: [] as string[],
    height: "", weight: "",
    photo: "",
  });

  useEffect(() => {
    const uid = localStorage.getItem("userId") || "";
    if (!uid) { router.replace("/login"); return; }
    setUserId(uid);
    fetchProfile(uid);
  }, []);

  async function fetchProfile(uid: string) {
    try {
      const res  = await fetch(`/api/profile?userId=${uid}`);
      const data = await res.json();
      if (data.success && data.user) {
        const u = data.user;
        setMobile(u.mobile || "");
        const incomplete = !u.name || u.name === "New User" || u.age === 0;
        setIsNewUser(incomplete);
        setForm({
          name:               incomplete ? "" : (u.name || ""),
          age:                u.age && u.age !== 0 ? String(u.age) : "",
          gender:             incomplete ? "" : (u.gender || ""),
          maritalStatus:      u.maritalStatus || "",
          isPregnant:         u.isPregnant || false,
          lmp:                u.lmp ? new Date(u.lmp).toISOString().split("T")[0] : "",
          idType:             u.idType || "",
          idNumber:           u.idNumber || "",
          email:              u.email || "",
          district:           u.address?.district || "",
          prakhand:           u.address?.prakhand || "",
          village:            u.address?.village || "",
          preExistingDiseases: u.preExistingDiseases || [],
          height:             u.height ? String(u.height) : "",
          weight:             u.weight ? String(u.weight) : "",
          photo:              u.photo || "",
        });
        if (u.photo) setPhotoPreview(u.photo);
      }
    } catch {}
    setLoadingProfile(false);
  }

  // Called by ImageCropper when user confirms crop
  async function handleCropped(blob: Blob, previewUrl: string) {
    setShowCropper(false);
    setPhotoBlob(blob);
    setPhotoPreview(previewUrl);
    setForm((p) => ({ ...p, photo: "" })); // reset old Cloudinary URL

    // Auto-upload immediately
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append("photo", blob, "profile.jpg");
      const res  = await fetch("/api/upload-photo", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setForm((p) => ({ ...p, photo: data.url }));
        setPhotoPreview(data.url); // use Cloudinary URL
      } else {
        setError("Photo upload fail: " + data.message);
      }
    } catch {
      setError("Photo upload mein network error");
    }
    setPhotoUploading(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function toggleDisease(d: string) {
    setForm((p) => ({
      ...p,
      preExistingDiseases: p.preExistingDiseases.includes(d)
        ? p.preExistingDiseases.filter((x) => x !== d)
        : [...p.preExistingDiseases, d],
    }));
  }

  const showMarital   = form.gender === "female" && parseInt(form.age) >= 18;
  const showPregnancy = showMarital && form.maritalStatus === "married";

  async function handleSubmit() {
    setError("");
    if (!form.name || !form.age || !form.gender) {
      setError("Naam, umar aur ling zaruri hai"); return;
    }
    setLoading(true);
    try {
      const res  = await fetch("/api/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...form, mobile, userId }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Profile update ho gayi! ✅");
        localStorage.setItem("userName", form.name);
        setTimeout(() => router.push("/dashboard"), 1000);
      } else {
        setError(data.message);
      }
    } catch {
      setError("Network error. Dobara try karein.");
    }
    setLoading(false);
  }

  if (loadingProfile) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      {showCropper && (
        <ImageCropper onCropped={handleCropped} onClose={() => setShowCropper(false)} />
      )}

      <Header />

      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-5 flex items-center justify-between">
            <div>
              <h1 className="text-white text-xl font-bold">
                {isNewUser ? "Profile Complete Karein" : "Profile Update Karein"}
              </h1>
              <p className="text-teal-200 text-sm mt-0.5">📱 +91 {mobile}</p>
            </div>
            {isNewUser && (
              <a href="/dashboard" className="text-teal-200 hover:text-white text-sm border border-teal-400/40 px-3 py-1.5 rounded-lg hover:bg-white/10 transition">
                Baad mein →
              </a>
            )}
          </div>

          <div className="p-6 space-y-5">
            {isNewUser && (
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-sm text-teal-700 flex gap-3">
                <span className="shrink-0">💡</span>
                <span>Profile bharne se Health Card, OPD booking aur sabhi services sahi kaam karenge.</span>
              </div>
            )}

            {/* ── Photo Section ── */}
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="relative">
                <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-teal-100 bg-gray-100 flex items-center justify-center">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" className="w-14 h-14 text-gray-300" stroke="currentColor" strokeWidth={1.5}>
                      <circle cx="12" cy="8" r="4"/>
                      <path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                  )}
                </div>
                {/* Edit button overlay */}
                <button
                  onClick={() => setShowCropper(true)}
                  className="absolute bottom-0 right-0 w-9 h-9 bg-teal-600 hover:bg-teal-700 rounded-full flex items-center justify-center shadow-lg transition"
                  title="Photo change karein"
                >
                  {photoUploading ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.5-6.5a2 2 0 012.828 2.828L11 15.5 7 17l1.5-4z"/>
                    </svg>
                  )}
                </button>
              </div>
              <button
                onClick={() => setShowCropper(true)}
                className="text-teal-600 text-sm font-medium hover:underline"
              >
                {photoPreview ? "Photo Change Karein" : "Photo Upload Karein"}
              </button>
              {form.photo && (
                <span className="text-green-600 text-xs font-medium">✅ Photo upload ho gayi</span>
              )}
            </div>

            {/* ── Name ── */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Poora Naam *</label>
              <input name="name" value={form.name} onChange={handleChange}
                placeholder="Apna poora naam likhein"
                className="mt-1.5 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition" />
            </div>

            {/* ── Age + Gender ── */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Umar (Saal) *</label>
                <input name="age" type="number" value={form.age} onChange={handleChange}
                  placeholder="25" min="1" max="120"
                  className="mt-1.5 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ling *</label>
                <select name="gender" value={form.gender} onChange={handleChange}
                  className="mt-1.5 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 bg-white transition">
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            {showMarital && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vaivahik Sthiti</label>
                <select name="maritalStatus" value={form.maritalStatus} onChange={handleChange}
                  className="mt-1.5 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 bg-white transition">
                  <option value="">Select</option>
                  <option value="unmarried">Avivahit</option>
                  <option value="married">Vivahit</option>
                </select>
              </div>
            )}

            {showPregnancy && (
              <div className="bg-pink-50 border border-pink-200 rounded-2xl p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.isPregnant}
                    onChange={(e) => setForm({ ...form, isPregnant: e.target.checked })}
                    className="w-5 h-5 accent-teal-600 rounded" />
                  <span className="text-sm font-medium text-gray-700">Kya aap pregnant hain?</span>
                </label>
                {form.isPregnant && (
                  <div className="mt-3">
                    <label className="text-xs font-medium text-gray-500">LMP Date</label>
                    <input type="date" name="lmp" value={form.lmp} onChange={handleChange}
                      className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
                  </div>
                )}
              </div>
            )}

            {/* ── ID ── */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ID Type</label>
                <select name="idType" value={form.idType} onChange={handleChange}
                  className="mt-1.5 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 bg-white transition">
                  <option value="">Select</option>
                  {["Aadhaar","PAN","Voter ID","Driving Licence","Passport"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ID Number</label>
                <input name="idNumber" value={form.idNumber} onChange={handleChange}
                  placeholder="XXXX XXXX XXXX"
                  className="mt-1.5 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 transition" />
              </div>
            </div>

            {/* ── Email ── */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email ID</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="email@example.com (optional)"
                className="mt-1.5 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 transition" />
            </div>

            {/* ── Address ── */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Zila</label>
                <select name="district" value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value, prakhand: "" })}
                  className="mt-1.5 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 bg-white transition">
                  <option value="">Select</option>
                  {Object.keys(biharDistricts).map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Prakhand</label>
                <select name="prakhand" value={form.prakhand} onChange={handleChange}
                  className="mt-1.5 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 bg-white transition">
                  <option value="">Select</option>
                  {(biharDistricts[form.district] || []).map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gaon / Mohalla</label>
              <input name="village" value={form.village} onChange={handleChange}
                placeholder="Apna gaon ya mohalla"
                className="mt-1.5 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 transition" />
            </div>

            {/* ── Diseases ── */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Pahle se Koi Bimari?</label>
              <div className="grid grid-cols-2 gap-2">
                {diseases.map((d) => (
                  <label key={d} className={`flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border transition ${
                    form.preExistingDiseases.includes(d)
                      ? "bg-teal-50 border-teal-300 text-teal-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}>
                    <input type="checkbox" checked={form.preExistingDiseases.includes(d)}
                      onChange={() => toggleDisease(d)}
                      className="w-4 h-4 accent-teal-600 rounded shrink-0" />
                    <span className="text-sm">{d}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ── Height / Weight ── */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Lambai (cm)</label>
                <input name="height" type="number" value={form.height} onChange={handleChange}
                  placeholder="165"
                  className="mt-1.5 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 transition" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Wajan (kg)</label>
                <input name="weight" type="number" value={form.weight} onChange={handleChange}
                  placeholder="70"
                  className="mt-1.5 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 transition" />
              </div>
            </div>

            {error   && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">{error}</div>}
            {success && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm">{success}</div>}

            <div className="flex gap-3 pt-2">
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 text-white font-bold py-4 rounded-2xl transition hover:from-teal-700 hover:to-teal-800 disabled:opacity-50 shadow-lg shadow-teal-100">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Save ho raha hai...
                  </span>
                ) : "Profile Save Karein ✅"}
              </button>
              {isNewUser && (
                <a href="/dashboard"
                  className="px-5 py-4 border-2 border-gray-200 text-gray-500 rounded-2xl text-sm font-medium hover:bg-gray-50 transition text-center">
                  Baad mein
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
