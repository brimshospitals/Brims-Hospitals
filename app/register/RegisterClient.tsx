"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
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

export default function RegisterClient() {
  const searchParams = useSearchParams();
  const mobile = searchParams.get("mobile") || "";
  const userId = searchParams.get("userId") || "";

  const [form, setForm] = useState({
    name: "", age: "", gender: "",
    maritalStatus: "", isPregnant: false, lmp: "",
    idType: "", idNumber: "", email: "",
    district: "", prakhand: "", village: "",
    preExistingDiseases: [] as string[],
    height: "", weight: "",
  });

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

  const showMarital = form.gender === "female" && parseInt(form.age) >= 18;
  const showPregnancy = showMarital && form.maritalStatus === "married";

  async function handleSubmit() {
    setError("");
    if (!form.name || !form.age || !form.gender || !form.idType || !form.idNumber || !form.district) {
      setError("Sabhi zaruri (*) fields bharo");
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
        setTimeout(() => { window.location.href = "/dashboard"; }, 2000);
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
          <p className="text-gray-500 text-sm mb-6">Mobile: +91 {mobile}</p>

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