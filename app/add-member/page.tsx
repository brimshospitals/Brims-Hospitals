"use client";
import { useState } from "react";
import Header from "../components/header";
import ImageCropper from "../components/ImageCropper";

const diseases = ["HTN", "Diabetes", "CVD", "CKD", "Thyroid Disorder", "Joint Pain"];

// Relations that imply "married" — no need to ask marital status
const AUTO_MARRIED_RELATIONS = ["spouse", "parent", "inlaw"];

export default function AddMemberPage() {
  const [form, setForm] = useState({
    name: "", age: "", gender: "",
    maritalStatus: "", isPregnant: false, lmp: "",
    relationship: "",
    preExistingDiseases: [] as string[],
    height: "", weight: "",
    photo: "",
    alternateMobile: "",
  });

  const [showCropper, setShowCropper] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      // When relation changes to auto-married type, set marital status automatically
      if (name === "relationship") {
        if (AUTO_MARRIED_RELATIONS.includes(value)) {
          updated.maritalStatus = "married";
        } else {
          updated.maritalStatus = "";
        }
      }
      return updated;
    });
  }

  function toggleDisease(disease: string) {
    setForm(prev => ({
      ...prev,
      preExistingDiseases: prev.preExistingDiseases.includes(disease)
        ? prev.preExistingDiseases.filter(d => d !== disease)
        : [...prev.preExistingDiseases, disease],
    }));
  }

  // Auto-upload immediately after crop
  async function handleCropped(blob: Blob, previewUrl: string) {
    setShowCropper(false);
    setPhotoPreview(previewUrl);
    setPhotoUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("photo", blob, "photo.jpg");
      const res  = await fetch("/api/upload-photo", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setForm(prev => ({ ...prev, photo: data.url }));
      } else {
        setError("Photo upload fail: " + (data.message || "Unknown error"));
        setPhotoPreview("");
      }
    } catch {
      setError("Photo upload error — internet check karein");
      setPhotoPreview("");
    }
    setPhotoUploading(false);
  }

  const age       = parseInt(form.age) || 0;
  const isFemale  = form.gender === "female";
  const autoMarried = AUTO_MARRIED_RELATIONS.includes(form.relationship);

  // Show marital status question only if NOT auto-married relation, and female 18+
  const showMarital   = isFemale && age >= 18 && !autoMarried;
  const isMarried     = form.maritalStatus === "married" || autoMarried;
  // Pregnancy: female, married/auto-married, age 17–50
  const showPregnancy = isFemale && isMarried && age >= 17 && age <= 50;

  async function handleSubmit() {
    setError("");
    if (!form.name || !form.age || !form.gender || !form.relationship) {
      setError("Naam, Umar, Ling aur Rishta zaruri hai");
      return;
    }
    if (!form.photo) {
      setError("Photo upload karna zaruri hai");
      return;
    }
    const userId = localStorage.getItem("userId");
    if (!userId) { setError("Login karein pehle"); return; }

    setLoading(true);
    try {
      const payload = {
        ...form,
        primaryUserId: userId,
        // Ensure maritalStatus is set correctly for auto-married relations
        maritalStatus: autoMarried ? "married" : form.maritalStatus,
      };
      const res  = await fetch("/api/add-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Member add ho gaya! 🎉 Member ID: ${data.memberId}`);
        setTimeout(() => { window.location.href = "/dashboard"; }, 2000);
      } else {
        setError(data.message);
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      {showCropper && (
        <ImageCropper
          onCropped={handleCropped}
          onClose={() => setShowCropper(false)}
        />
      )}
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">

          <a href="/dashboard" className="text-teal-600 text-sm flex items-center gap-1 mb-6 hover:underline">
            ← Dashboard pe wapas jaayein
          </a>

          <h1 className="text-2xl font-bold text-teal-700 mb-2">Family Member Add Karein</h1>
          <p className="text-gray-500 text-sm mb-6">Maximum 5 additional members add kar sakte hain</p>

          {/* Photo */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Photo * (Card pe lagegi)</label>
            <div className="flex items-center gap-5">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">👤</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {photoUploading ? (
                  <div className="flex items-center gap-2 text-teal-600 text-sm font-medium">
                    <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    Upload ho raha hai...
                  </div>
                ) : form.photo ? (
                  <>
                    <span className="text-green-600 text-sm font-medium">✅ Photo upload ho gayi!</span>
                    <button onClick={() => { setPhotoPreview(""); setForm(p => ({ ...p, photo: "" })); setShowCropper(true); }}
                      className="text-xs text-teal-600 underline text-left">
                      Change karein
                    </button>
                  </>
                ) : (
                  <button onClick={() => setShowCropper(true)}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2">
                    📷 Photo Lein / Upload Karein
                  </button>
                )}
                <p className="text-xs text-gray-400">1:1 crop hogi (passport size)</p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Poora Naam *</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Member ka naam"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>

          {/* Alternate Mobile */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Mobile (Optional)</label>
            <input name="alternateMobile" value={form.alternateMobile} onChange={handleChange}
              placeholder="Is member ka alag mobile number (optional)"
              maxLength={10} type="tel"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <p className="text-xs text-gray-400 mt-1">Agar is member ka khud ka mobile number hai to bharein</p>
          </div>

          {/* Relationship */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Rishta (Relationship) *</label>
            <select name="relationship" value={form.relationship} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">Select karein</option>
              <option value="spouse">Pati / Patni (Spouse)</option>
              <option value="child">Bachcha (Child)</option>
              <option value="parent">Mata / Pita (Parent)</option>
              <option value="inlaw">Sasur / Saas (In-Laws)</option>
              <option value="sibling">Bhai / Behen (Sibling)</option>
              <option value="other">Anya (Other)</option>
            </select>
            {autoMarried && (
              <p className="text-xs text-teal-600 mt-1">✓ Is rishte ke liye vivahit (married) automatically set hai</p>
            )}
          </div>

          {/* Age & Gender */}
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

          {/* Marital status — only if NOT auto-married, female 18+ */}
          {showMarital && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Vaivahik Sthiti</label>
              <select name="maritalStatus" value={form.maritalStatus} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Select</option>
                <option value="unmarried">Avivahit (Unmarried)</option>
                <option value="married">Vivahit (Married)</option>
              </select>
            </div>
          )}

          {/* Pregnancy — female, married/auto-married, age 17–50 */}
          {showPregnancy && (
            <div className="mb-4 p-4 bg-pink-50 rounded-lg border border-pink-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isPregnant}
                  onChange={e => setForm(p => ({ ...p, isPregnant: e.target.checked }))}
                  className="w-5 h-5 accent-teal-600" />
                <span className="text-sm font-medium text-gray-700">🤰 Kya pregnant hain?</span>
              </label>
              {form.isPregnant && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">LMP Date (Last Menstrual Period)</label>
                  <input type="date" name="lmp" value={form.lmp} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              )}
            </div>
          )}

          {/* Diseases */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Pahle se Bimari</label>
            <div className="grid grid-cols-2 gap-2">
              {diseases.map(d => (
                <label key={d} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                  <input type="checkbox" checked={form.preExistingDiseases.includes(d)}
                    onChange={() => toggleDisease(d)} className="w-4 h-4 accent-teal-600" />
                  <span className="text-sm text-gray-700">{d}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Height & Weight */}
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

          {error   && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">⚠️ {error}</div>}
          {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 rounded-lg transition disabled:opacity-50 text-lg">
            {loading ? "Save ho raha hai..." : "Member Add Karein →"}
          </button>
        </div>
      </div>
    </main>
  );
}
