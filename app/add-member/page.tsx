"use client";
import { useState } from "react";
import Header from "../components/header";

const diseases = ["HTN", "Diabetes", "CVD", "CKD", "Thyroid Disorder", "Joint Pain"];

export default function AddMemberPage() {
  const [form, setForm] = useState({
    name: "", age: "", gender: "",
    maritalStatus: "", isPregnant: false, lmp: "",
    relationship: "",
    preExistingDiseases: [] as string[],
    height: "", weight: "",
    photo: "",
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function toggleDisease(disease: string) {
    setForm((prev) => ({
      ...prev,
      preExistingDiseases: prev.preExistingDiseases.includes(disease)
        ? prev.preExistingDiseases.filter((d) => d !== disease)
        : [...prev.preExistingDiseases, disease],
    }));
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadPhoto() {
    if (!photoFile) return;
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", photoFile);
      const res = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setForm((prev) => ({ ...prev, photo: data.url }));
      } else {
        setError("Photo upload fail: " + data.message);
      }
    } catch {
      setError("Photo upload error");
    }
    setPhotoUploading(false);
  }

  const showMarital = form.gender === "female" && parseInt(form.age) >= 18;
  const showPregnancy = showMarital && form.maritalStatus === "married";

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
    if (!userId) {
      setError("Login karein pehle");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/add-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, primaryUserId: userId }),
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
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">

          {/* Back button */}
          <a href="/dashboard" className="text-teal-600 text-sm flex items-center gap-1 mb-6 hover:underline">
            ← Dashboard pe wapas jaayein
          </a>

          <h1 className="text-2xl font-bold text-teal-700 mb-2">Family Member Add Karein</h1>
          <p className="text-gray-500 text-sm mb-6">Maximum 5 additional members add kar sakte hain</p>

          {/* Photo */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Photo * (Card pe lagegi)</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">👤</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input type="file" accept="image/*" onChange={handlePhotoSelect}
                  className="text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-700 file:font-medium" />
                {photoFile && !form.photo && (
                  <button onClick={uploadPhoto} disabled={photoUploading}
                    className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                    {photoUploading ? "Upload ho raha hai..." : "Photo Upload Karein ☁️"}
                  </button>
                )}
                {form.photo && <span className="text-green-600 text-sm font-medium">✅ Photo upload ho gayi!</span>}
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Poora Naam *</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Member ka naam"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>

          {/* Relationship */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Rishta (Relationship) *</label>
            <select name="relationship" value={form.relationship} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">Select karein</option>
              <option value="spouse">Pati/Patni (Spouse)</option>
              <option value="child">Bachcha (Child)</option>
              <option value="parent">Mata/Pita (Parent)</option>
              <option value="sibling">Bhai/Behen (Sibling)</option>
              <option value="other">Anya (Other)</option>
            </select>
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

          {/* Marital — female 18+ */}
          {showMarital && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Vaivahik Sthiti</label>
              <select name="maritalStatus" value={form.maritalStatus} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Select</option>
                <option value="unmarried">Avivahit</option>
                <option value="married">Vivahit</option>
              </select>
            </div>
          )}

          {/* Pregnancy — married female */}
          {showPregnancy && (
            <div className="mb-4 p-4 bg-pink-50 rounded-lg border border-pink-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isPregnant}
                  onChange={(e) => setForm({ ...form, isPregnant: e.target.checked })}
                  className="w-5 h-5 accent-teal-600" />
                <span className="text-sm font-medium text-gray-700">Kya pregnant hain?</span>
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

          {/* Diseases */}
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

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
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