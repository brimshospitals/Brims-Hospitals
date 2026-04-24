"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "../components/header";
import biharDistricts from "../../lib/biharDistricts";

const diseases = ["HTN", "Diabetes", "CVD", "CKD", "Thyroid Disorder", "Joint Pain"];

export default function RegisterClient() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const mobile     = searchParams.get("mobile") || "";
  const userId     = searchParams.get("userId") || "";
  const refFromUrl = searchParams.get("ref")    || "";
  const fromStaff  = searchParams.get("from") === "staff";

  const [form, setForm] = useState({
    name: "", age: "", gender: "",
    maritalStatus: "", isPregnant: false, lmp: "",
    idType: "", idNumber: "", email: "",
    district: "", prakhand: "", village: "",
    preExistingDiseases: [] as string[],
    height: "", weight: "",
    photo: "",
    referralCode: refFromUrl,
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const val = e.target.name === "referralCode"
      ? e.target.value.toUpperCase()
      : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  }

  function toggleDisease(disease: string) {
    setForm((prev) => ({
      ...prev,
      preExistingDiseases: prev.preExistingDiseases.includes(disease)
        ? prev.preExistingDiseases.filter((d) => d !== disease)
        : [...prev.preExistingDiseases, disease],
    }));
  }

  // Photo select karo — automatic upload starts immediately
  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const res  = await fetch("/api/upload-photo", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success && data.url) {
        setForm((prev) => ({ ...prev, photo: data.url }));
      } else {
        setError("Photo upload fail hua: " + (data.message || "Dobara try karein"));
      }
    } catch {
      setError("Photo upload mein network error");
    } finally {
      setPhotoUploading(false);
    }
  }

  const showMarital = form.gender === "female" && parseInt(form.age) >= 18;
  const showPregnancy = showMarital && form.maritalStatus === "married";

  async function handleSubmit() {
    setError("");

    // Client-side validation with specific field messages
    const missing = [];
    if (!form.name.trim())   missing.push("Naam");
    if (!form.age)           missing.push("Umar");
    if (!form.gender)        missing.push("Ling (Gender)");
    if (!form.idType)        missing.push("ID Type");
    if (!form.idNumber.trim()) missing.push("ID Number");
    if (!form.district)      missing.push("Zila (District)");

    if (missing.length > 0) {
      setError(`Ye fields bharo: ${missing.join(", ")}`);
      return;
    }
    if (photoFile && photoUploading) {
      setError("Photo upload ho rahi hai, thoda ruko...");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, mobile, userId }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Registration ho gayi! 🎉 Member ID: ${data.memberId}`);
        setTimeout(() => {
          if (fromStaff) {
            window.location.href = "/staff-dashboard";
          } else {
            window.location.href = "/dashboard";
          }
        }, 2000);
      } else {
        setError(data.message);
      }
    } catch {
      setError("Network error. Dobara try karein.");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-teal-700 mb-2">Register Karein</h1>
          <p className="text-gray-500 text-sm mb-3">Mobile: +91 {mobile}</p>

          {fromStaff && (
            <div className="mb-5 bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-3">
              <span className="text-2xl">🏥</span>
              <div>
                <p className="text-sm font-semibold text-orange-800">Staff-initiated Registration</p>
                <p className="text-xs text-orange-600">Registration ke baad staff dashboard pe wapas jaenge</p>
              </div>
            </div>
          )}

          {refFromUrl && (
            <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
              <span className="text-2xl">🎁</span>
              <div>
                <p className="text-sm font-semibold text-amber-800">Referral Code Apply Hoga!</p>
                <p className="text-xs text-amber-600">
                  Code <span className="font-mono font-bold">{refFromUrl}</span> — Register karne ke baad aapko aur aapke friend dono ko <strong>₹50 cashback</strong> milega
                </p>
              </div>
            </div>
          )}

          {/* Photo Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Photo Upload * (Card pe lagegi)</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">👤</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer inline-flex items-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-700 font-medium px-4 py-2 rounded-lg text-sm border border-teal-200 transition">
                  <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                  📷 Photo Select Karein
                </label>
                {photoUploading && (
                  <span className="text-blue-600 text-sm flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin inline-block" />
                    Upload ho raha hai...
                  </span>
                )}
                {form.photo && !photoUploading && (
                  <span className="text-green-600 text-sm font-medium">✅ Photo upload ho gayi!</span>
                )}
                {!photoFile && (
                  <p className="text-xs text-gray-400">Camera ya gallery se photo select karein (optional)</p>
                )}
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Poora Naam *</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Apna poora naam"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Umar *</label>
              <input name="age" type="number" value={form.age} onChange={handleChange} placeholder="Age"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ling *</label>
              <select name="gender" value={form.gender} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          {showMarital && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Vaivahik Sthiti *</label>
              <select name="maritalStatus" value={form.maritalStatus} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Select</option>
                <option value="unmarried">Avivahit (Unmarried)</option>
                <option value="married">Vivahit (Married)</option>
              </select>
            </div>
          )}

          {showPregnancy && (
            <div className="mb-4 p-4 bg-pink-50 rounded-lg border border-pink-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isPregnant}
                  onChange={(e) => setForm({ ...form, isPregnant: e.target.checked })}
                  className="w-5 h-5 accent-teal-600" />
                <span className="text-sm font-medium text-gray-700">Kya aap pregnant hain?</span>
              </label>
              {form.isPregnant && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">LMP Date</label>
                  <input type="date" name="lmp" value={form.lmp} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Type *</label>
              <select name="idType" value={form.idType} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Select</option>
                <option value="Aadhaar">Aadhaar</option>
                <option value="PAN">PAN Card</option>
                <option value="Voter ID">Voter ID</option>
                <option value="Driving Licence">Driving Licence</option>
                <option value="Passport">Passport</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Number *</label>
              <input name="idNumber" value={form.idNumber} onChange={handleChange} placeholder="ID number"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Rajya</label>
            <input value="Bihar" disabled className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-gray-100 text-gray-500" />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zila *</label>
              <select name="district" value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value, prakhand: "" })}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Select</option>
                {Object.keys(biharDistricts).map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prakhand</label>
              <select name="prakhand" value={form.prakhand} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Select</option>
                {(biharDistricts[form.district] || []).map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Gaon / Mohalla</label>
            <input name="village" value={form.village} onChange={handleChange} placeholder="Gaon ya mohalla"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Pahle se Bimari</label>
            <div className="grid grid-cols-2 gap-2">
              {diseases.map((d) => (
                <label key={d} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                  <input type="checkbox" checked={form.preExistingDiseases.includes(d)}
                    onChange={() => toggleDisease(d)} className="w-4 h-4 accent-teal-600" />
                  <span className="text-sm text-gray-700">{d}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
              <input name="height" type="number" value={form.height} onChange={handleChange} placeholder="165"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input name="weight" type="number" value={form.weight} onChange={handleChange} placeholder="70"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>

          {/* Referral Code */}
          <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <label className="block text-sm font-medium text-amber-800 mb-1">🎁 Referral Code (Optional)</label>
            <p className="text-xs text-amber-600 mb-2">Kisi ne aapko refer kiya hai? Unka code daalo — dono ko ₹50 wallet cashback milega!</p>
            <input
              name="referralCode"
              value={form.referralCode}
              onChange={handleChange}
              placeholder="Jaise: BRIMS-RAH123"
              className="w-full border border-amber-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-sm uppercase"
              style={{ letterSpacing: "0.05em" }}
            />
            {refFromUrl && (
              <p className="text-xs text-amber-700 mt-1">✅ Referral code apply hoga: <strong>{refFromUrl}</strong></p>
            )}
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 rounded-lg transition disabled:opacity-50 text-lg">
            {loading ? "Save ho raha hai..." : "Register Karein →"}
          </button>
        </div>
      </div>
    </main>
  );
}