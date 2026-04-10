"use client";
import { useState } from "react";
import Header from "../components/header";

const biharDistricts = [
  "Patna", "Saran", "Siwan", "Gopalganj", "Gaya", "Muzaffarpur",
  "Bhagalpur", "Nalanda", "Vaishali", "Darbhanga", "Sitamarhi", "Purnia", "Begusarai",
];

const departments = [
  "General Medicine", "Cardiology", "Orthopedics", "Gynecology",
  "Pediatrics", "Dermatology", "Neurology", "ENT", "Ophthalmology",
  "Dentistry", "Psychiatry", "Urology", "Nephrology", "Oncology",
  "Surgery", "Radiology", "Pathology", "Physiotherapy",
];

export default function HospitalOnboardingPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    // Basic Details
    name: "",
    type: "",
    registrationNo: "",
    rohiniNo: "",
    mobile: "",
    email: "",
    website: "",
    // Address
    street: "",
    district: "",
    city: "",
    pincode: "",
    // SPOC
    spocName: "",
    spocContact: "",
    spocEmail: "",
    // Owner
    ownerName: "",
    ownerContact: "",
    // Departments
    departments: [] as string[],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function toggleDepartment(dept: string) {
    setForm((prev) => ({
      ...prev,
      departments: prev.departments.includes(dept)
        ? prev.departments.filter((d) => d !== dept)
        : [...prev.departments, dept],
    }));
  }

  function validateStep() {
    if (step === 1) {
      if (!form.name || !form.type || !form.mobile || !form.district) {
        setError("Hospital naam, type, mobile aur district zaruri hai");
        return false;
      }
    }
    if (step === 2) {
      if (!form.spocName || !form.spocContact || !form.ownerName) {
        setError("SPOC aur Owner details zaruri hain");
        return false;
      }
    }
    setError("");
    return true;
  }

  async function handleSubmit() {
    setError("");
    if (form.departments.length === 0) {
      setError("Kam se kam ek department select karein");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/hospital-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message);
      }
    } catch {
      setError("Network error. Dobara try karein.");
    }
    setLoading(false);
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-lg mx-auto py-20 px-4 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-teal-700 mb-3">Application Submit Ho Gayi!</h1>
          <p className="text-gray-500 mb-6">Hamari team 2-3 working days mein aapse contact karegi aur verification process complete karegi.</p>
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-left mb-6">
            <p className="text-sm font-medium text-teal-700 mb-2">Aage kya hoga:</p>
            <p className="text-sm text-teal-600">✅ Document verification</p>
            <p className="text-sm text-teal-600">✅ Site visit (agar zaruri ho)</p>
            <p className="text-sm text-teal-600">✅ Agreement signing</p>
            <p className="text-sm text-teal-600">✅ Hospital portal access</p>
          </div>
          <a href="/" className="bg-teal-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-teal-700 transition">
            Home pe Jaayein
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto py-8 px-4">

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                step >= s ? "bg-teal-600 text-white" : "bg-gray-200 text-gray-500"
              }`}>{s}</div>
              {s < 3 && <div className={`flex-1 h-1 w-16 rounded ${step > s ? "bg-teal-600" : "bg-gray-200"}`} />}
            </div>
          ))}
          <div className="ml-2 text-sm text-gray-500">
            {step === 1 ? "Basic Details" : step === 2 ? "Contact Details" : "Departments"}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-teal-700 mb-1">Hospital Onboarding</h1>
          <p className="text-gray-500 text-sm mb-6">Brims Health Network mein shamil hoin</p>

          {/* Step 1 — Basic Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital/Clinic Ka Naam *</label>
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="e.g. City Care Hospital"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Type *</label>
                  <select name="type" value={form.type} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="">Select</option>
                    <option value="Single Specialist">Single Specialist</option>
                    <option value="Multi Specialist">Multi Specialist</option>
                    <option value="Super Specialist">Super Specialist</option>
                    <option value="Clinic">Clinic</option>
                    <option value="Diagnostic Lab">Diagnostic Lab</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
                  <input name="mobile" value={form.mobile} onChange={handleChange}
                    placeholder="10 digit number"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration No.</label>
                  <input name="registrationNo" value={form.registrationNo} onChange={handleChange}
                    placeholder="Hospital reg. number"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rohini No.</label>
                  <input name="rohiniNo" value={form.rohiniNo} onChange={handleChange}
                    placeholder="Rohini number"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="hospital@email.com"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input name="website" value={form.website} onChange={handleChange}
                  placeholder="https://www.hospital.com"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zila *</label>
                  <select name="district" value={form.district} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="">Select</option>
                    {biharDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shahar/City</label>
                  <input name="city" value={form.city} onChange={handleChange}
                    placeholder="City name"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pata (Address)</label>
                <input name="street" value={form.street} onChange={handleChange}
                  placeholder="Street address"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>
          )}

          {/* Step 2 — Contact Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mb-2">
                <p className="text-sm font-medium text-blue-700">SPOC — Single Point of Contact</p>
                <p className="text-xs text-blue-500">Jo vyakti Brims se coordinate karega</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SPOC Ka Naam *</label>
                  <input name="spocName" value={form.spocName} onChange={handleChange}
                    placeholder="Contact person naam"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SPOC Mobile *</label>
                  <input name="spocContact" value={form.spocContact} onChange={handleChange}
                    placeholder="Mobile number"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SPOC Email</label>
                <input name="spocEmail" value={form.spocEmail} onChange={handleChange}
                  placeholder="spoc@hospital.com"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>

              <div className="border-t border-gray-100 pt-4 mt-2">
                <p className="text-sm font-medium text-gray-700 mb-3">Owner / Management Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner Ka Naam *</label>
                    <input name="ownerName" value={form.ownerName} onChange={handleChange}
                      placeholder="Owner naam"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner Mobile</label>
                    <input name="ownerContact" value={form.ownerContact} onChange={handleChange}
                      placeholder="Mobile number"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Departments */}
          {step === 3 && (
            <div>
              <p className="text-sm text-gray-600 mb-4">Jo departments available hain woh select karein:</p>
              <div className="grid grid-cols-2 gap-2">
                {departments.map((dept) => (
                  <label key={dept}
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${
                      form.departments.includes(dept)
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-200 hover:border-teal-300"
                    }`}>
                    <input type="checkbox" checked={form.departments.includes(dept)}
                      onChange={() => toggleDepartment(dept)} className="w-4 h-4 accent-teal-600" />
                    <span className="text-sm text-gray-700">{dept}</span>
                  </label>
                ))}
              </div>
              {form.departments.length > 0 && (
                <p className="text-sm text-teal-600 mt-3 font-medium">
                  ✅ {form.departments.length} departments selected
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button onClick={() => { setStep(step - 1); setError(""); }}
                className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition">
                ← Pichhe
              </button>
            )}
            {step < 3 ? (
              <button onClick={() => { if (validateStep()) setStep(step + 1); }}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition">
                Aage →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
                {loading ? "Submit ho raha hai..." : "Submit Application →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}