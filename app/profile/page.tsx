"use client";
import { useState, useEffect } from "react";
import Header from "../components/header";

const biharDistricts: Record<string, string[]> = {
  Patna: ["Patna Sadar", "Danapur", "Phulwari", "Masaurhi", "Paliganj", "Bikram"],
  Saran: ["Chhapra", "Garkha", "Marhaura", "Manjhi", "Parsa", "Amnour"],
  Siwan: ["Siwan Sadar", "Darauli", "Raghunathpur", "Hussainganj"],
  Gopalganj: ["Gopalganj Sadar", "Kuchaikote", "Barauli", "Panchdeori"],
  Gaya: ["Gaya Sadar", "Bodh Gaya", "Sherghati", "Imamganj"],
  Muzaffarpur: ["Muzaffarpur Sadar", "Kanti", "Bochahan", "Sakra"],
  Bhagalpur: ["Bhagalpur Sadar", "Jagdishpur", "Nathnagar", "Sabour"],
  Nalanda: ["Bihar Sharif", "Rajgir", "Islampur", "Hilsa"],
  Vaishali: ["Hajipur", "Mahua", "Lalganj", "Vaishali"],
  Darbhanga: ["Darbhanga Sadar", "Benipur", "Hayaghat", "Baheri"],
};

const diseases = ["HTN", "Diabetes", "CVD", "CKD", "Thyroid Disorder", "Joint Pain"];

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [activeUserId, setActiveUserId] = useState("");
  const [activeUser, setActiveUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const userId = localStorage.getItem("userId");
    if (!userId) { setLoading(false); return; }
    setActiveUserId(userId);
    try {
      const res = await fetch(`/api/profile?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setFamilyMembers(data.familyMembers || []);
        setActiveUser(data.user);
        setForm(data.user);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function switchProfile(memberId: string) {
    const userId = localStorage.getItem("userId");
    try {
      const res = await fetch("/api/switch-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryUserId: userId, switchToMemberId: memberId }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveUser(data.activeUser);
        setForm(data.activeUser);
        setActiveUserId(memberId);
        setEditing(false);
        setMessage(`✅ ${data.activeUser.name} ka profile dekh rahe hain`);
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (e) { console.error(e); }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function toggleDisease(disease: string) {
    setForm((prev: any) => ({
      ...prev,
      preExistingDiseases: prev.preExistingDiseases?.includes(disease)
        ? prev.preExistingDiseases.filter((d: string) => d !== disease)
        : [...(prev.preExistingDiseases || []), disease],
    }));
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    // Auto upload
    setPhotoUploading(true);
    const formData = new FormData();
    formData.append("photo", file);
    const res = await fetch("/api/upload-photo", { method: "POST", body: formData });
    const data = await res.json();
    if (data.success) setForm((prev: any) => ({ ...prev, photo: data.url }));
    setPhotoUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: activeUserId, ...form }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("✅ Profile update ho gayi!");
        setEditing(false);
        fetchProfile();
      } else {
        setMessage("❌ " + data.message);
      }
    } catch { setMessage("❌ Network error"); }
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  }

  if (loading) return (
    <main className="min-h-screen bg-gray-50"><Header />
      <div className="flex items-center justify-center py-20 text-teal-600">Loading...</div>
    </main>
  );

  const showMarital = form.gender === "female" && parseInt(form.age) >= 18;
  const showPregnancy = showMarital && form.maritalStatus === "married";

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto py-8 px-4">

        {message && (
          <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-700 text-sm">{message}</div>
        )}

        {/* Family Member Switcher */}
        {familyMembers.length > 1 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
            <p className="text-sm font-medium text-gray-600 mb-3">Profile Switch Karein:</p>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {familyMembers.map((member) => (
                <button key={member._id} onClick={() => switchProfile(member._id)}
                  className={`flex flex-col items-center p-3 rounded-xl border transition min-w-[80px] ${
                    activeUserId === member._id
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-200 hover:border-teal-300"
                  }`}>
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 mb-1">
                    {member.photo
                      ? <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
                    }
                  </div>
                  <p className="text-xs font-medium text-gray-700 text-center">{member.name.split(" ")[0]}</p>
                  {member._id === user?._id && (
                    <span className="text-xs text-teal-600 mt-0.5">Primary</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/50">
                  {(editing ? photoPreview || form.photo : activeUser?.photo) ? (
                    <img src={editing ? (photoPreview || form.photo) : activeUser?.photo}
                      alt={activeUser?.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/20 flex items-center justify-center text-3xl">👤</div>
                  )}
                </div>
                {editing && (
                  <label className="absolute bottom-0 right-0 bg-white rounded-full p-1 cursor-pointer shadow">
                    <span className="text-xs">📷</span>
                    <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                  </label>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold">{activeUser?.name}</h1>
                <p className="text-teal-100 text-sm">ID: {activeUser?.memberId}</p>
                <p className="text-teal-100 text-sm">{activeUser?.age} saal • {activeUser?.gender === "male" ? "Purush" : "Mahila"}</p>
              </div>
            </div>
          </div>

          {/* Edit Toggle */}
          <div className="px-6 py-3 border-b border-gray-100 flex justify-between items-center">
            <p className="text-sm text-gray-500">Profile Details</p>
            {!editing ? (
              <button onClick={() => setEditing(true)}
                className="text-teal-600 text-sm font-medium hover:underline">✏️ Edit</button>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => { setEditing(false); setForm(activeUser); }}
                  className="text-gray-500 text-sm">Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  className="bg-teal-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>

          <div className="p-6">
            {!editing ? (
              /* View Mode */
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Mobile</span>
                  <span className="text-sm font-medium">+91 {user?.mobile}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Email</span>
                  <span className="text-sm font-medium">{activeUser?.email || "—"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Height / Weight</span>
                  <span className="text-sm font-medium">{activeUser?.height || "—"} cm / {activeUser?.weight || "—"} kg</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Zila</span>
                  <span className="text-sm font-medium">{activeUser?.address?.district || "—"}</span>
                </div>
                <div className="py-2">
                  <span className="text-sm text-gray-500 block mb-2">Bimariyan</span>
                  <div className="flex flex-wrap gap-2">
                    {activeUser?.preExistingDiseases?.length > 0
                      ? activeUser.preExistingDiseases.map((d: string) => (
                        <span key={d} className="bg-red-50 text-red-600 text-xs px-3 py-1 rounded-full border border-red-100">{d}</span>
                      ))
                      : <span className="text-sm text-gray-400">Koi bimari nahi</span>
                    }
                  </div>
                </div>
              </div>
            ) : (
              /* Edit Mode */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Naam</label>
                  <input name="name" value={form.name || ""} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Umar</label>
                    <input name="age" type="number" value={form.age || ""} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input name="email" value={form.email || ""} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                </div>

                {showMarital && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vaivahik Sthiti</label>
                    <select name="maritalStatus" value={form.maritalStatus || ""} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500">
                      <option value="">Select</option>
                      <option value="unmarried">Avivahit</option>
                      <option value="married">Vivahit</option>
                    </select>
                  </div>
                )}

                {showPregnancy && (
                  <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.isPregnant || false}
                        onChange={(e) => setForm({ ...form, isPregnant: e.target.checked })}
                        className="w-4 h-4 accent-teal-600" />
                      <span className="text-sm">Pregnant hain?</span>
                    </label>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zila</label>
                  <select name="district" value={form.address?.district || form.district || ""} 
                    onChange={(e) => setForm({ ...form, address: { ...form.address, district: e.target.value }, district: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="">Select</option>
                    {Object.keys(biharDistricts).map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                    <input name="height" type="number" value={form.height || ""} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                    <input name="weight" type="number" value={form.weight || ""} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bimariyan</label>
                  <div className="grid grid-cols-2 gap-2">
                    {diseases.map((d) => (
                      <label key={d} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-gray-200">
                        <input type="checkbox"
                          checked={(form.preExistingDiseases || []).includes(d)}
                          onChange={() => toggleDisease(d)} className="w-4 h-4 accent-teal-600" />
                        <span className="text-sm">{d}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 text-center">
          <a href="/dashboard" className="text-teal-600 text-sm hover:underline">← Dashboard pe wapas jaayein</a>
        </div>
      </div>
    </main>
  );
}