"use client";
import { useState, useEffect } from "react";
import Header from "../components/header";

const biharDistricts: Record<string, string[]> = {
  Patna: ["Patna Sadar", "Danapur", "Phulwari", "Masaurhi", "Paliganj", "Bikram", "Naubatpur", "Dulhin Bazar", "Punpun"],
  Saran: ["Chhapra", "Garkha", "Marhaura", "Manjhi", "Parsa", "Amnour", "Dighwara", "Sonepur", "Revelganj", "Mashrakh"],
  Siwan: ["Siwan Sadar", "Darauli", "Raghunathpur", "Hussainganj", "Maharajganj", "Basantpur", "Mairwa", "Barhariya"],
  Gopalganj: ["Gopalganj Sadar", "Kuchaikote", "Barauli", "Panchdeori", "Bhorey", "Thawe", "Uchkagaon", "Vijaypur"],
  Gaya: ["Gaya Sadar", "Bodh Gaya", "Sherghati", "Imamganj", "Barachatti", "Gurua"],
  Muzaffarpur: ["Muzaffarpur Sadar", "Kanti", "Bochahan", "Sakra", "Kurhani", "Motipur"],
  Bhagalpur: ["Bhagalpur Sadar", "Jagdishpur", "Nathnagar", "Sabour"],
  Nalanda: ["Bihar Sharif", "Rajgir", "Islampur", "Hilsa", "Asthawan"],
  Vaishali: ["Hajipur", "Mahua", "Lalganj", "Vaishali", "Raghopur"],
  Darbhanga: ["Darbhanga Sadar", "Benipur", "Hayaghat", "Baheri"],
  Sitamarhi: ["Sitamarhi Sadar", "Pupri", "Riga", "Bajpatti"],
  Purnia: ["Purnia Sadar", "Kasba", "Bhawanipur", "Dhamdaha"],
  Begusarai: ["Begusarai Sadar", "Barauni", "Teghra", "Matihani"],
};

const diseases = ["HTN", "Diabetes", "CVD", "CKD", "Thyroid Disorder", "Joint Pain"];

export default function UpdateProfilePage() {
  const [userId, setUserId] = useState("");
  const [mobile, setMobile] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [form, setForm] = useState({
    name: "", age: "", gender: "",
    maritalStatus: "", isPregnant: false, lmp: "",
    idType: "", idNumber: "", email: "",
    district: "", prakhand: "", village: "",
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

  useEffect(() => {
    const uid = localStorage.getItem("userId") || "";
    if (!uid) { window.location.href = "/login"; return; }
    setUserId(uid);
    fetchProfile(uid);
  }, []);

  async function fetchProfile(uid: string) {
    try {
      const res = await fetch(`/api/profile?userId=${uid}`);
      const data = await res.json();
      if (data.success && data.user) {
        const u = data.user;
        setMobile(u.mobile || "");
        const incomplete = !u.name || u.name === "New User" || u.age === 0;
        setIsNewUser(incomplete);
        setForm({
          name: incomplete ? "" : (u.name || ""),
          age: u.age && u.age !== 0 ? String(u.age) : "",
          gender: u.gender && u.gender !== "male" ? u.gender : (incomplete ? "" : (u.gender || "")),
          maritalStatus: u.maritalStatus || "",
          isPregnant: u.isPregnant || false,
          lmp: u.lmp ? new Date(u.lmp).toISOString().split("T")[0] : "",
          idType: u.idType || "",
          idNumber: u.idNumber || "",
          email: u.email || "",
          district: u.address?.district || "",
          prakhand: u.address?.prakhand || "",
          village: u.address?.village || "",
          preExistingDiseases: u.preExistingDiseases || [],
          height: u.height ? String(u.height) : "",
          weight: u.weight ? String(u.weight) : "",
          photo: u.photo || "",
        });
        if (u.photo) setPhotoPreview(u.photo);
      }
    } catch {
      // ignore
    }
    setLoadingProfile(false);
  }

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
    setForm((prev) => ({ ...prev, photo: "" })); // reset old URL
  }

  async function uploadPhoto() {
    if (!photoFile) return;
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", photoFile);
      const res = await fetch("/api/upload-photo", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setForm((prev) => ({ ...prev, photo: data.url }));
        setError("");
      } else {
        setError("Photo upload fail hua: " + data.message);
      }
    } catch {
      setError("Photo upload mein network error");
    }
    setPhotoUploading(false);
  }

  const showMarital = form.gender === "female" && parseInt(form.age) >= 18;
  const showPregnancy = showMarital && form.maritalStatus === "married";

  async function handleSubmit() {
    setError("");
    if (!form.name || !form.age || !form.gender) {
      setError("Naam, umar aur ling zaruri hai");
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
        setSuccess("Profile update ho gayi! ✅");
        setTimeout(() => { window.location.href = "/dashboard"; }, 1200);
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
          <div className="text-teal-600">Loading...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-teal-700">
                {isNewUser ? "Apni Profile Complete Karein" : "Profile Update Karein"}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Mobile: +91 {mobile}
                {isNewUser && " · Yeh baad mein bhi fill kar sakte hain"}
              </p>
            </div>
            {isNewUser && (
              <a
                href="/dashboard"
                className="text-gray-400 hover:text-gray-600 text-sm font-medium border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition whitespace-nowrap"
              >
                Baad mein →
              </a>
            )}
          </div>

          {isNewUser && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6 text-sm text-teal-700">
              💡 Profile bharne se aapka Health Card, OPD booking aur sabhi services theek se kaam karenge.
              Abhi baad ke liye chhodna chahte hain toh "Baad mein" button dabao.
            </div>
          )}

          {/* Photo Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo <span className="text-gray-400 font-normal">(optional — Health Card pe lagegi)</span>
            </label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">👤</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-700 file:font-medium hover:file:bg-teal-100"
                />
                {photoFile && !form.photo && (
                  <button
                    onClick={uploadPhoto}
                    disabled={photoUploading}
                    className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {photoUploading ? "Upload ho raha hai..." : "Photo Upload Karein ☁️"}
                  </button>
                )}
                {form.photo && (
                  <span className="text-green-600 text-sm font-medium">✅ Photo upload ho gayi!</span>
                )}
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Poora Naam *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Apna poora naam likhein"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Umar (Saal) *</label>
              <input
                name="age"
                type="number"
                value={form.age}
                onChange={handleChange}
                placeholder="Age"
                min="1"
                max="120"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ling *</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select karein</option>
                <option value="male">Male (Purush)</option>
                <option value="female">Female (Mahila)</option>
              </select>
            </div>
          </div>

          {showMarital && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Vaivahik Sthiti</label>
              <select
                name="maritalStatus"
                value={form.maritalStatus}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select karein</option>
                <option value="unmarried">Avivahit (Unmarried)</option>
                <option value="married">Vivahit (Married)</option>
              </select>
            </div>
          )}

          {showPregnancy && (
            <div className="mb-4 p-4 bg-pink-50 rounded-lg border border-pink-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPregnant}
                  onChange={(e) => setForm({ ...form, isPregnant: e.target.checked })}
                  className="w-5 h-5 accent-teal-600"
                />
                <span className="text-sm font-medium text-gray-700">Kya aap pregnant hain?</span>
              </label>
              {form.isPregnant && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">LMP Date</label>
                  <input
                    type="date"
                    name="lmp"
                    value={form.lmp}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* ID */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
              <select
                name="idType"
                value={form.idType}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select karein</option>
                <option value="Aadhaar">Aadhaar</option>
                <option value="PAN">PAN Card</option>
                <option value="Voter ID">Voter ID</option>
                <option value="Driving Licence">Driving Licence</option>
                <option value="Passport">Passport</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
              <input
                name="idNumber"
                value={form.idNumber}
                onChange={handleChange}
                placeholder="ID number likhein"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="email@example.com (optional)"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Address */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Rajya</label>
            <input
              value="Bihar"
              disabled
              className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-gray-100 text-gray-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zila</label>
              <select
                name="district"
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value, prakhand: "" })}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select karein</option>
                {Object.keys(biharDistricts).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prakhand</label>
              <select
                name="prakhand"
                value={form.prakhand}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select karein</option>
                {(biharDistricts[form.district] || []).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Gaon / Mohalla</label>
            <input
              name="village"
              value={form.village}
              onChange={handleChange}
              placeholder="Apna gaon ya mohalla"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Diseases */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Pahle se Koi Bimari?</label>
            <div className="grid grid-cols-2 gap-2">
              {diseases.map((d) => (
                <label
                  key={d}
                  className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={form.preExistingDiseases.includes(d)}
                    onChange={() => toggleDisease(d)}
                    className="w-4 h-4 accent-teal-600"
                  />
                  <span className="text-sm text-gray-700">{d}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Height & Weight */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lambai (cm)</label>
              <input
                name="height"
                type="number"
                value={form.height}
                onChange={handleChange}
                placeholder="165"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wajan (kg)</label>
              <input
                name="weight"
                type="number"
                value={form.weight}
                onChange={handleChange}
                placeholder="70"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 rounded-lg transition disabled:opacity-50 text-lg"
            >
              {loading ? "Save ho raha hai..." : "Profile Save Karein ✅"}
            </button>
            {isNewUser && (
              <a
                href="/dashboard"
                className="px-5 py-4 border-2 border-gray-200 text-gray-500 rounded-lg text-sm font-medium hover:bg-gray-50 transition text-center"
              >
                Baad mein
              </a>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
