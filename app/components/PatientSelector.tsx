"use client";
import { useState, useEffect } from "react";

export interface SelectedPatient {
  /** If linked member: their User _id; null for new/external patient */
  userId: string | null;
  name: string;
  mobile: string;
  age: number;
  gender: string;
  symptoms: string;
  isNewPatient: boolean;
}

interface Props {
  onSelect: (patient: SelectedPatient) => void;
  /** Pass the pre-fetched profile data if already loaded in parent */
  primaryUser?: { _id: string; name: string; age: number; gender: string; mobile: string; photo?: string; memberId?: string } | null;
  familyMembers?: { _id: string; name: string; age: number; gender: string; photo?: string; relationship?: string }[];
}

export default function PatientSelector({ onSelect, primaryUser, familyMembers = [] }: Props) {
  const [selected, setSelected] = useState<string | "new" | null>(null);
  const [newForm, setNewForm] = useState({ name: "", mobile: "", age: "", gender: "", symptoms: "" });
  const [formError, setFormError] = useState("");

  function handleMemberSelect(id: string) {
    setSelected(id);
    setFormError("");
  }

  function handleConfirmMember() {
    if (!selected || selected === "new") return;
    // Find the member
    let patient: SelectedPatient | null = null;
    if (selected === primaryUser?._id) {
      patient = {
        userId: primaryUser._id,
        name: primaryUser.name,
        mobile: primaryUser.mobile,
        age: primaryUser.age,
        gender: primaryUser.gender,
        symptoms: "",
        isNewPatient: false,
      };
    } else {
      const m = familyMembers.find((fm) => fm._id === selected);
      if (m) {
        patient = {
          userId: m._id,
          name: m.name,
          mobile: primaryUser?.mobile || "",
          age: m.age,
          gender: m.gender,
          symptoms: "",
          isNewPatient: false,
        };
      }
    }
    if (patient) onSelect(patient);
  }

  function handleNewPatientSubmit() {
    setFormError("");
    if (!newForm.name.trim()) { setFormError("Naam zaruri hai"); return; }
    if (!newForm.mobile || newForm.mobile.length !== 10) { setFormError("10-digit mobile number daalen"); return; }
    if (!newForm.age || isNaN(Number(newForm.age)) || Number(newForm.age) < 1) { setFormError("Sahi age daalen"); return; }
    if (!newForm.gender) { setFormError("Gender chunein"); return; }

    onSelect({
      userId: null,
      name: newForm.name.trim(),
      mobile: newForm.mobile,
      age: Number(newForm.age),
      gender: newForm.gender,
      symptoms: newForm.symptoms,
      isNewPatient: true,
    });
  }

  const allMembers = primaryUser
    ? [{ ...primaryUser, relationship: "self" }, ...familyMembers]
    : familyMembers;

  const genderLabel = (g: string) =>
    g === "male" ? "Male" : g === "female" ? "Female" : g;

  const relationLabel = (r?: string) => {
    if (!r || r === "self") return "Primary";
    return r.charAt(0).toUpperCase() + r.slice(1);
  };

  return (
    <div className="space-y-4">

      {/* Linked Members */}
      {allMembers.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Family Members</p>
          <div className="space-y-2">
            {allMembers.map((m) => (
              <button
                key={m._id}
                type="button"
                onClick={() => handleMemberSelect(m._id)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition ${
                  selected === m._id
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-100 hover:border-teal-200 bg-white"
                }`}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-teal-100 flex-shrink-0">
                  {(m as any).photo
                    ? <img src={(m as any).photo} alt={m.name} className="w-full h-full object-cover" />
                    : (
                      <div className="w-full h-full flex items-center justify-center text-teal-600 font-bold text-lg">
                        {m.name?.[0] || "?"}
                      </div>
                    )
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.age} yrs · {genderLabel(m.gender)}</p>
                </div>

                {/* Relation badge */}
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                  (m as any).relationship === "self"
                    ? "bg-teal-100 text-teal-700"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {relationLabel((m as any).relationship)}
                </span>

                {/* Radio dot */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selected === m._id ? "border-teal-500 bg-teal-500" : "border-gray-300"
                }`}>
                  {selected === m._id && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </button>
            ))}
          </div>

          {/* Confirm button for member selection */}
          {selected && selected !== "new" && (
            <button
              type="button"
              onClick={handleConfirmMember}
              className="w-full mt-3 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-2xl font-semibold transition text-sm"
            >
              Is patient ko select karein ✓
            </button>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">Ya naya patient</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* New Patient toggle */}
      <button
        type="button"
        onClick={() => setSelected(selected === "new" ? null : "new")}
        className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition ${
          selected === "new"
            ? "border-purple-500 bg-purple-50"
            : "border-dashed border-gray-200 hover:border-purple-300 bg-white"
        }`}
      >
        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-purple-600" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="8" r="4" />
            <path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 3v6M16 6h6" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-800 text-sm">Naya Patient</p>
          <p className="text-xs text-gray-400">Family se bahar ka patient</p>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          selected === "new" ? "border-purple-500 bg-purple-500" : "border-gray-300"
        }`}>
          {selected === "new" && <div className="w-2 h-2 bg-white rounded-full" />}
        </div>
      </button>

      {/* New Patient Form */}
      {selected === "new" && (
        <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100 space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Naam *</label>
            <input
              type="text"
              value={newForm.name}
              onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
              placeholder="Patient ka poora naam"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Mobile *</label>
              <div className="flex border border-gray-200 rounded-xl overflow-hidden focus-within:border-purple-400 bg-white">
                <span className="bg-gray-50 text-gray-500 px-2.5 flex items-center text-xs border-r border-gray-200">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  value={newForm.mobile}
                  onChange={(e) => setNewForm({ ...newForm, mobile: e.target.value.replace(/\D/g, "") })}
                  placeholder="Mobile No."
                  className="flex-1 px-3 py-2.5 outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Age *</label>
              <input
                type="number"
                min={1}
                max={120}
                value={newForm.age}
                onChange={(e) => setNewForm({ ...newForm, age: e.target.value })}
                placeholder="Umar"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Gender *</label>
            <div className="flex gap-2">
              {["male", "female", "other"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setNewForm({ ...newForm, gender: g })}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
                    newForm.gender === g
                      ? "bg-purple-600 text-white border-purple-600"
                      : "border-gray-200 text-gray-500 hover:border-purple-300 bg-white"
                  }`}
                >
                  {g === "male" ? "Male" : g === "female" ? "Female" : "Other"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Symptoms / Takleef</label>
            <textarea
              value={newForm.symptoms}
              onChange={(e) => setNewForm({ ...newForm, symptoms: e.target.value })}
              placeholder="Symptoms ya visit ka karan likhein..."
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-white resize-none"
            />
          </div>

          {formError && (
            <p className="text-red-500 text-xs font-medium">{formError}</p>
          )}

          <button
            type="button"
            onClick={handleNewPatientSubmit}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-2xl font-semibold transition text-sm"
          >
            Is patient ke saath aage badhen ✓
          </button>
        </div>
      )}
    </div>
  );
}
