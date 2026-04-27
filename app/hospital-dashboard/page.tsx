"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DoctorFullForm from "@/app/components/DoctorFullForm";
import LabTestFullForm from "@/app/components/LabTestFullForm";
import { BIHAR_DISTRICTS } from "@/lib/biharDistricts";
import { MEDICAL_DEPARTMENTS, SURGERY_DEPARTMENTS, SURGERIES_BY_DEPARTMENT } from "@/lib/medicalDepartments";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "overview" | "bookings" | "doctors" | "lab" | "surgery" | "reports" | "labManage" | "earnings";

type Hospital = {
  _id: string; name: string; type?: string;
  address: { district?: string; city?: string; state?: string; street?: string; pincode?: string };
  mobile?: string; email?: string; website?: string;
  spocName?: string; spocContact?: string; ownerName?: string;
  departments?: string[]; specialties?: string[];
  isVerified: boolean; isActive: boolean;
  registrationNo?: string; rohiniNo?: string; hospitalId?: string;
};
type Doctor  = { _id: string; name: string; department: string; speciality?: string; mobile?: string; email?: string; opdFee: number; offerFee?: number; experience?: number; surgeonDegrees?: string[]; photo?: string; isActive: boolean; isAvailable?: boolean; };
type LabTest  = { _id: string; name: string; category: string; mrp: number; offerPrice: number; membershipPrice?: number; homeCollection: boolean; turnaroundTime?: string; fastingRequired?: boolean; sampleType?: string; isActive: boolean; };
type SurgeryPkg = { _id: string; name: string; category: string; mrp: number; offerPrice: number; membershipPrice?: number; stayDays: number; surgeonName?: string; surgeonExperience?: number; surgeonDegrees?: string[]; inclusions?: string[]; preSurgeryTests?: string[]; roomOptions?: any[]; pickupFromHome?: boolean; pickupCharge?: number; dropAvailable?: boolean; foodIncluded?: boolean; foodDetails?: string; postCareIncluded?: boolean; followUpConsultations?: number; description?: string; isActive: boolean; };
type Booking = { _id: string; bookingId: string; type: string; status: string; paymentStatus: string; amount?: number; paymentMode?: string; appointmentDate?: string; slot?: string; parsedNotes?: any; doctorId?: any; createdAt: string; };
type Report  = { _id: string; reportId: string; title: string; category: string; fileUrl: string; fileType: string; notes?: string; reportDate: string; patientName: string; hospitalName: string; };

// ─── Constants ────────────────────────────────────────────────────────────────
const DEPT_LIST = MEDICAL_DEPARTMENTS;
const LAB_CATEGORIES = ["Blood Test","Urine Test","Stool Test","Imaging","ECG","X-Ray","Ultrasound","MRI","CT Scan","Pathology","Other"];
const SUR_DEPTS = SURGERY_DEPARTMENTS;
const SURGERY_BY_DEPT = SURGERIES_BY_DEPARTMENT;
const STD_INCLUSIONS = ["Pre-op Tests","Surgery","Anaesthesia","ICU/HDU (if needed)","Hospital Stay","Medicines","Post-op Dressing","Light Diet Meals","Ghar se Pickup","Ghar Drop","Post-surgery Care","Follow-up Consultation(s)","Nursing Care","Blood Transfusion (if needed)"];
const PRE_SURGERY_TESTS = ["Blood Test (CBC)","LFT (Liver Function)","KFT (Kidney Function)","ECG","X-Ray Chest","CT Scan","MRI","Echo (Echocardiography)","Urine Routine","Blood Sugar (Fasting)","HIV Test","HBsAg (Hepatitis B)","Coagulation Profile (PT/INR)","Thyroid Profile (TFT)"];
const ROOM_TYPES = ["General Room","Semi-Private Room","Private Room","Deluxe Room","Suite"];
const HOSPITAL_TYPES = ["Single Specialist","Multi Specialist","Super Specialist","Clinic","Diagnostic Lab","Nursing Home"];
const REPORT_CATEGORIES = ["Lab","Radiology","OPD","Surgery","Prescription","Other"];
// BIHAR_DISTRICTS imported from lib/biharDistricts

const hInp = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition";
const hSel = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white transition";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700 border-amber-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};
const TYPE_ICON: Record<string, string> = { OPD:"🩺", Lab:"🧪", Surgery:"🔬", Consultation:"💻", IPD:"🛏️" };

function fmtDate(d?: string) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }); }
function fmtDateShort(d?: string) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short" }); }

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Spinner({ color = "purple" }: { color?: string }) {
  return <div className="flex justify-center py-10"><div className={`w-8 h-8 border-4 border-${color}-200 border-t-${color}-600 rounded-full animate-spin`} /></div>;
}
function Toast({ msg, ok = true }: { msg: string; ok?: boolean }) {
  return <div className={`fixed top-4 right-4 z-[99] px-4 py-3 rounded-xl shadow-xl text-sm font-semibold ${ok ? "bg-green-700" : "bg-red-600"} text-white flex items-center gap-2`}><span>{ok ? "✓" : "✗"}</span>{msg}</div>;
}
function EmptyCard({ icon, msg }: { icon: string; msg: string }) {
  return <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm"><p className="text-4xl mb-3">{icon}</p><p className="text-gray-500 text-sm">{msg}</p></div>;
}

// ─── CheckGrid helper ─────────────────────────────────────────────────────────
function CheckGrid({ items, selected, onToggle, cols = 2 }: { items: string[]; selected: string[]; onToggle: (v: string) => void; cols?: number }) {
  return (
    <div className={`grid grid-cols-${cols} gap-1.5`}>
      {items.map((item) => (
        <label key={item} onClick={() => onToggle(item)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs cursor-pointer transition select-none ${selected.includes(item) ? "bg-purple-50 border-purple-300 text-purple-800 font-semibold" : "bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-300"}`}>
          <span className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border ${selected.includes(item) ? "bg-purple-600 border-purple-600 text-white" : "border-gray-300"}`}>
            {selected.includes(item) && <svg viewBox="0 0 12 12" className="w-3 h-3"><polyline points="2,6 5,9 10,4" stroke="white" strokeWidth="2" fill="none"/></svg>}
          </span>
          {item}
        </label>
      ))}
    </div>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
function SLabel({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{n}</span>
      <p className="text-sm font-bold text-gray-700">{title}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── DOCTOR FORM MODAL ─────────────────────────────────────────────────────────
function DoctorFormModal({ hospitalId, doctor, hospitalAddress, onClose, onSaved }: { hospitalId: string; doctor?: Doctor; hospitalAddress?: { district: string; city: string }; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!doctor;

  async function handleSubmit(payload: any) {
    const degreesForApi = (payload.degrees || []).map((d: any) => ({
      degree: d.degree, university: d.university, year: d.year ? Number(d.year) : null,
    }));
    const apiPayload: any = {
      ...payload,
      degrees: degreesForApi,
      hospitalId,
      address: { district: payload.district, city: payload.city, state: "Bihar" },
    };
    if (isEdit) apiPayload.doctorId = doctor!._id;
    const res  = await fetch("/api/hospital/doctors", {
      method:  isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(apiPayload),
    });
    const data = await res.json();
    if (data.success) { onSaved(); return { success: true }; }
    return { success: false, message: data.message };
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 rounded-t-2xl flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-xs font-medium">Doctor</p>
              <h3 className="text-white font-bold text-lg">{isEdit ? "✏️ Edit Doctor" : "➕ Doctor Jodein"}</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white">✕</button>
          </div>
          <div className="p-6">
            <DoctorFullForm
              initialData={doctor as any}
              lockedAddress={hospitalAddress}
              showHospitalSection={false}
              showPasswordSection={false}
              showStatusSection={isEdit}
              isEdit={isEdit}
              submitLabel={isEdit ? "✓ Save Changes" : "✓ Doctor Jodein"}
              onSubmit={handleSubmit}
              onCancel={onClose}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── LAB TEST FORM MODAL ───────────────────────────────────────────────────────
function LabFormModal({ hospitalId, labTest, hospitalAddress, onClose, onSaved }: {
  hospitalId: string; labTest?: LabTest;
  hospitalAddress?: { district?: string; city?: string };
  onClose: () => void; onSaved: () => void;
}) {
  const isEdit = !!labTest;

  async function handleSubmit(payload: any) {
    const apiPayload: any = { ...payload, hospitalId };
    if (isEdit) apiPayload.testId = labTest!._id;
    const res  = await fetch("/api/hospital/lab-tests", {
      method:  isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(apiPayload),
    });
    const data = await res.json();
    if (data.success) { onSaved(); return { success: true }; }
    return { success: false, message: data.message };
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-6">
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-5 rounded-t-2xl flex items-center justify-between">
            <div>
              <p className="text-teal-200 text-xs font-medium">Lab Test</p>
              <h3 className="text-white font-bold text-lg">{isEdit ? "✏️ Edit Lab Test" : "➕ Lab Test Jodein"}</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white">✕</button>
          </div>
          <div className="p-6">
            <LabTestFullForm
              initialData={labTest as any}
              hospitalAddress={hospitalAddress}
              showStatusSection={isEdit}
              isEdit={isEdit}
              submitLabel={isEdit ? "✓ Save Changes" : "✓ Test Jodein"}
              onSubmit={handleSubmit}
              onCancel={onClose}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── SURGERY PACKAGE FORM MODAL ────────────────────────────────────────────────
function SurgeryFormModal({ hospitalId, pkg, onClose, onSaved }: { hospitalId: string; pkg?: SurgeryPkg; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!pkg;

  const initRoomOpts = (): Record<string, { enabled: boolean; charge: string }> => {
    const map: Record<string, { enabled: boolean; charge: string }> = {};
    ROOM_TYPES.forEach((rt) => (map[rt] = { enabled: false, charge: "0" }));
    map["General Room"] = { enabled: true, charge: "0" };
    if (pkg?.roomOptions) pkg.roomOptions.forEach((ro: any) => { if (map[ro.type]) map[ro.type] = { enabled: true, charge: String(ro.extraCharge || 0) }; });
    return map;
  };

  const [dept,        setDept]        = useState(pkg?.category || "General Surgery");
  const [surgName,    setSurgName]    = useState(pkg?.name || "");
  const [customName,  setCustomName]  = useState(!(SURGERY_BY_DEPT[pkg?.category || "General Surgery"] || []).includes(pkg?.name || "") ? pkg?.name || "" : "");
  const [useCustom,   setUseCustom]   = useState(!(SURGERY_BY_DEPT[pkg?.category || "General Surgery"] || []).includes(pkg?.name || "") && !!pkg?.name);
  const [description, setDescription] = useState(pkg?.description || "");
  const [inclusions,  setInclusions]  = useState<string[]>(pkg?.inclusions || ["Pre-op Tests","Surgery","Anaesthesia","Hospital Stay","Medicines","Post-op Dressing"]);
  const [preTests,    setPreTests]    = useState<string[]>(pkg?.preSurgeryTests || []);
  const [roomOpts,    setRoomOpts]    = useState(initRoomOpts());
  const [surgeonName, setSurgeonName] = useState(pkg?.surgeonName || "");
  const [surgeonExp,  setSurgeonExp]  = useState(String(pkg?.surgeonExperience || ""));
  const [surgeonDeg,  setSurgeonDeg]  = useState((pkg?.surgeonDegrees || []).join(", "));
  const [pickup,      setPickup]      = useState(pkg?.pickupFromHome || false);
  const [pickupCharge,setPickupCharge]= useState(String(pkg?.pickupCharge || "500"));
  const [drop,        setDrop]        = useState(pkg?.dropAvailable || false);
  const [food,        setFood]        = useState(pkg?.foodIncluded || false);
  const [foodDetails, setFoodDetails] = useState(pkg?.foodDetails || "Light diet meals included");
  const [postCare,    setPostCare]    = useState(pkg?.postCareIncluded || false);
  const [followUp,    setFollowUp]    = useState(String(pkg?.followUpConsultations || "1"));
  const [stayDays,    setStayDays]    = useState(String(pkg?.stayDays || "2"));
  const [mrp,         setMrp]         = useState(String(pkg?.mrp || ""));
  const [offerPrice,  setOfferPrice]  = useState(String(pkg?.offerPrice || ""));
  const [memberPrice, setMemberPrice] = useState(String(pkg?.membershipPrice || ""));
  const [isActive,    setIsActive]    = useState(pkg?.isActive !== false);
  const [saving,      setSaving]      = useState(false);
  const [err,         setErr]         = useState("");

  const surgOptions = SURGERY_BY_DEPT[dept] || [];
  function toggleList(list: string[], item: string, setter: (v: string[]) => void) { setter(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]); }
  function updateRoomOpt(rt: string, field: "enabled" | "charge", val: any) { setRoomOpts((p) => ({ ...p, [rt]: { ...p[rt], [field]: val } })); }

  async function save() {
    const finalName = useCustom ? customName.trim() : surgName;
    if (!finalName)  { setErr("Surgery ka naam daalo"); return; }
    if (!mrp)        { setErr("MRP zaruri hai"); return; }
    if (!offerPrice) { setErr("Offer Price zaruri hai"); return; }
    setSaving(true); setErr("");
    try {
      const activeRooms = ROOM_TYPES.filter((rt) => roomOpts[rt]?.enabled).map((rt) => ({ type: rt, extraCharge: Number(roomOpts[rt].charge) || 0 }));
      const payload: any = {
        hospitalId, name: finalName, category: dept, description, inclusions, preSurgeryTests: preTests,
        roomOptions: activeRooms, surgeonName, surgeonExperience: Number(surgeonExp) || 0,
        surgeonDegrees: surgeonDeg.split(",").map((s) => s.trim()).filter(Boolean),
        pickupFromHome: pickup, pickupCharge: pickup ? Number(pickupCharge) || 0 : 0, dropAvailable: drop,
        foodIncluded: food, foodDetails: food ? foodDetails : "", postCareIncluded: postCare,
        followUpConsultations: Number(followUp) || 0, stayDays: Number(stayDays) || 1,
        mrp: Number(mrp), offerPrice: Number(offerPrice), membershipPrice: Number(memberPrice) || Number(offerPrice), isActive,
      };
      if (isEdit) payload.packageId = pkg!._id;
      const res  = await fetch("/api/hospital/surgery-packages", { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) onSaved();
      else setErr(data.message);
    } finally { setSaving(false); }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl my-4">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-5 rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
            <div>
              <p className="text-purple-200 text-xs">Surgery Package</p>
              <h3 className="text-white font-bold text-lg">{isEdit ? "✏️ Edit Package" : "➕ Package Jodein"}</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white">✕</button>
          </div>
          <div className="p-5 space-y-5">
            {err && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{err}</p>}

            <SLabel n="1" title="Department & Surgery" />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Department *</label><select className={hSel} value={dept} onChange={(e) => { setDept(e.target.value); setSurgName(""); setUseCustom(false); }}>{SUR_DEPTS.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Surgery Name *</label>
                {!useCustom ? (
                  <select className={hSel} value={surgName} onChange={(e) => { if (e.target.value === "__custom__") { setUseCustom(true); setSurgName(""); } else setSurgName(e.target.value); }}>
                    <option value="">-- Select Surgery --</option>
                    {surgOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    <option value="__custom__">✏️ Custom naam...</option>
                  </select>
                ) : (
                  <div className="relative">
                    <input className={hInp} value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Surgery naam..." autoFocus />
                    <button onClick={() => { setUseCustom(false); setCustomName(""); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-purple-500">↩</button>
                  </div>
                )}
              </div>
              <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 block mb-1">Description</label><textarea className={hInp + " resize-none"} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Safe and effective surgery with experienced team..." /></div>
            </div>

            <SLabel n="2" title="Package Inclusions" />
            <CheckGrid items={STD_INCLUSIONS} selected={inclusions} onToggle={(item) => toggleList(inclusions, item, setInclusions)} />

            <SLabel n="3" title="Pre-surgery Tests (included)" />
            <CheckGrid items={PRE_SURGERY_TESTS} selected={preTests} onToggle={(item) => toggleList(preTests, item, setPreTests)} />

            <SLabel n="4" title="Room Options" />
            <div className="space-y-2">
              {ROOM_TYPES.map((rt) => {
                const isG = rt === "General Room"; const opt = roomOpts[rt];
                return (
                  <div key={rt} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${opt.enabled ? "bg-purple-50 border-purple-200" : "bg-gray-50 border-gray-100 opacity-60"}`}>
                    {isG ? <span className="w-4 h-4 rounded bg-purple-600 flex-shrink-0 flex items-center justify-center"><svg viewBox="0 0 12 12" className="w-3 h-3"><polyline points="2,6 5,9 10,4" stroke="white" strokeWidth="2" fill="none"/></svg></span>
                         : <input type="checkbox" checked={opt.enabled} onChange={(e) => updateRoomOpt(rt, "enabled", e.target.checked)} className="w-4 h-4 accent-purple-600 flex-shrink-0" />}
                    <span className="text-sm font-medium text-gray-700 flex-1">{rt}</span>
                    {isG ? <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Base Price</span>
                         : opt.enabled ? <div className="flex items-center gap-1"><span className="text-xs text-gray-500">+₹</span><input type="number" value={opt.charge} onChange={(e) => updateRoomOpt(rt, "charge", e.target.value)} className="w-20 border border-purple-200 rounded-lg px-2 py-1 text-sm text-right focus:outline-none" /><span className="text-xs text-gray-400">extra</span></div> : null}
                  </div>
                );
              })}
            </div>

            <SLabel n="5" title="Stay & Surgeon" />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Stay Days</label><input className={hInp} type="number" value={stayDays} onChange={(e) => setStayDays(e.target.value)} /></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Surgeon Exp (yrs)</label><input className={hInp} type="number" value={surgeonExp} onChange={(e) => setSurgeonExp(e.target.value)} /></div>
              <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 block mb-1">Surgeon Name</label><input className={hInp} value={surgeonName} onChange={(e) => setSurgeonName(e.target.value)} placeholder="Dr. Ramesh Kumar" /></div>
              <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 block mb-1">Degrees (comma separated)</label><input className={hInp} value={surgeonDeg} onChange={(e) => setSurgeonDeg(e.target.value)} placeholder="MBBS, MS, MCh" /></div>
            </div>

            <SLabel n="6" title="Logistics & Post-care" />
            <div className="space-y-2">
              <div className={`p-3 rounded-xl border ${pickup ? "bg-teal-50 border-teal-200" : "bg-gray-50 border-gray-100"}`}>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={pickup} onChange={(e) => setPickup(e.target.checked)} className="w-4 h-4 accent-teal-600" /><span className="text-sm">🚗 Ghar se Pickup Available</span></label>
                {pickup && <div className="mt-2 flex items-center gap-2"><span className="text-xs text-gray-500">Charge: ₹</span><input type="number" value={pickupCharge} onChange={(e) => setPickupCharge(e.target.value)} className="w-24 border border-teal-200 rounded-lg px-2 py-1 text-sm focus:outline-none" /></div>}
              </div>
              <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer ${drop ? "bg-teal-50 border-teal-200" : "bg-gray-50 border-gray-100"}`}><input type="checkbox" checked={drop} onChange={(e) => setDrop(e.target.checked)} className="w-4 h-4 accent-teal-600" /><span className="text-sm">🚕 Discharge Drop (Free)</span></label>
              <div className={`p-3 rounded-xl border ${food ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-100"}`}>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={food} onChange={(e) => setFood(e.target.checked)} className="w-4 h-4 accent-amber-500" /><span className="text-sm">🍽️ Food / Meals Included</span></label>
                {food && <input className="mt-2 w-full border border-amber-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none" value={foodDetails} onChange={(e) => setFoodDetails(e.target.value)} />}
              </div>
              <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer ${postCare ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-100"}`}><input type="checkbox" checked={postCare} onChange={(e) => setPostCare(e.target.checked)} className="w-4 h-4 accent-blue-600" /><span className="text-sm">🩺 Post-surgery Care Included</span></label>
              <div className="flex items-center gap-3"><label className="text-sm text-gray-600 whitespace-nowrap">📅 Follow-up Consultations:</label><input type="number" value={followUp} onChange={(e) => setFollowUp(e.target.value)} className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-400" min="0" max="10" /></div>
            </div>

            <SLabel n="7" title="Pricing" />
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">MRP (₹) *</label><input className={hInp} type="number" value={mrp} onChange={(e) => setMrp(e.target.value)} placeholder="45000" /></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Offer Price (₹) *</label><input className={hInp} type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} placeholder="35000" /></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Member Price (₹)</label><input className={hInp} type="number" value={memberPrice} onChange={(e) => setMemberPrice(e.target.value)} placeholder="30000" /></div>
            </div>
            {mrp && offerPrice && <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-2.5 flex items-center gap-4 text-sm"><span className="text-gray-500 line-through">₹{Number(mrp).toLocaleString()}</span><span className="font-bold text-purple-700 text-base">₹{Number(offerPrice).toLocaleString()}</span>{Number(mrp)>Number(offerPrice) && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">{Math.round(((Number(mrp)-Number(offerPrice))/Number(mrp))*100)}% off</span>}</div>}

            {isEdit && (
              <>
                <SLabel n="8" title="Status" />
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${isActive ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 accent-green-600" />
                  <span className="text-sm font-medium">{isActive ? "✅ Active" : "⏸️ On Hold"}</span>
                </label>
              </>
            )}
          </div>
          <div className="px-5 pb-5 flex gap-3 border-t border-gray-100 pt-4">
            <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
            <button onClick={save} disabled={saving} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
              {saving ? "Saving..." : isEdit ? "✓ Save Changes" : "✓ Package Jodein"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── PROFILE EDIT MODAL ────────────────────────────────────────────────────────
function ProfileEditModal({ hospital, onClose, onSaved }: { hospital: Hospital; onClose: () => void; onSaved: (h: Hospital) => void }) {
  const [f, setF] = useState({
    name:        hospital.name || "",
    type:        hospital.type || "Multi Specialist",
    mobile:      hospital.mobile || "",
    email:       hospital.email || "",
    website:     hospital.website || "",
    ownerName:   hospital.ownerName || "",
    spocName:    hospital.spocName || "",
    spocContact: hospital.spocContact || "",
    street:      hospital.address?.street || "",
    district:    hospital.address?.district || "",
    city:        hospital.address?.city || "",
    pincode:     hospital.address?.pincode || "",
    registrationNo: hospital.registrationNo || "",
    rohiniNo:    hospital.rohiniNo || "",
  });
  const [deptInput, setDeptInput] = useState("");
  const [departments, setDepartments] = useState<string[]>(hospital.departments || []);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  function addDept() {
    const d = deptInput.trim();
    if (d && !departments.includes(d)) { setDepartments((p) => [...p, d]); setDeptInput(""); }
  }

  async function save() {
    if (!f.name) { setErr("Hospital ka naam zaruri hai"); return; }
    setSaving(true); setErr("");
    try {
      const res  = await fetch("/api/hospital/profile", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalId: hospital._id, name: f.name, type: f.type,
          mobile: f.mobile, email: f.email, website: f.website,
          ownerName: f.ownerName, spocName: f.spocName, spocContact: f.spocContact,
          address: { street: f.street, district: f.district, city: f.city, pincode: f.pincode, state: "Bihar" },
          departments,
          registrationNo: f.registrationNo, rohiniNo: f.rohiniNo,
        }),
      });
      const data = await res.json();
      if (data.success) onSaved(data.hospital);
      else setErr(data.message);
    } finally { setSaving(false); }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl my-4">
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-5 rounded-t-2xl flex items-center justify-between">
            <div>
              <p className="text-teal-200 text-xs">Hospital</p>
              <h3 className="text-white font-bold text-lg">✏️ Profile Edit Karein</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white">✕</button>
          </div>
          <div className="p-5 space-y-4">
            {err && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{err}</p>}

            <div className="space-y-1"><p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Basic Info</p></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 block mb-1">Hospital Ka Naam *</label><input className={hInp} value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Type</label><select className={hSel} value={f.type} onChange={(e) => set("type", e.target.value)}>{HOSPITAL_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Mobile</label><input className={hInp} value={f.mobile} onChange={(e) => set("mobile", e.target.value)} maxLength={10} /></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Email</label><input className={hInp} type="email" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Website</label><input className={hInp} value={f.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." /></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Owner Name</label><input className={hInp} value={f.ownerName} onChange={(e) => set("ownerName", e.target.value)} /></div>
            </div>

            <div className="pt-1 space-y-1"><p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Contact Person (SPOC)</p></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">SPOC Name</label><input className={hInp} value={f.spocName} onChange={(e) => set("spocName", e.target.value)} /></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">SPOC Contact</label><input className={hInp} value={f.spocContact} onChange={(e) => set("spocContact", e.target.value)} /></div>
            </div>

            <div className="pt-1 space-y-1"><p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Address</p></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 block mb-1">Street / Area</label><input className={hInp} value={f.street} onChange={(e) => set("street", e.target.value)} /></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">District</label><select className={hSel} value={f.district} onChange={(e) => set("district", e.target.value)}><option value="">Select</option>{BIHAR_DISTRICTS.map((d) => <option key={d}>{d}</option>)}</select></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">City / Town</label><input className={hInp} value={f.city} onChange={(e) => set("city", e.target.value)} /></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">PIN Code</label><input className={hInp} value={f.pincode} onChange={(e) => set("pincode", e.target.value)} maxLength={6} /></div>
            </div>

            <div className="pt-1 space-y-1"><p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Departments</p></div>
            <div className="flex gap-2">
              <select className={hSel + " flex-1"} value={deptInput} onChange={(e) => setDeptInput(e.target.value)}>
                <option value="">Select department to add...</option>
                {DEPT_LIST.filter((d) => !departments.includes(d)).map((d) => <option key={d}>{d}</option>)}
              </select>
              <button onClick={addDept} className="bg-teal-600 text-white px-4 rounded-xl text-sm font-semibold hover:bg-teal-700 transition">Add</button>
            </div>
            {departments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {departments.map((d) => (
                  <span key={d} className="inline-flex items-center gap-1 bg-teal-50 border border-teal-200 text-teal-700 text-xs px-3 py-1 rounded-full">
                    {d}
                    <button onClick={() => setDepartments((p) => p.filter((x) => x !== d))} className="text-teal-400 hover:text-red-500 ml-0.5">✕</button>
                  </span>
                ))}
              </div>
            )}

            <div className="pt-1 space-y-1"><p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Registration</p></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Registration No.</label><input className={hInp} value={f.registrationNo} onChange={(e) => set("registrationNo", e.target.value)} /></div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Rohini No.</label><input className={hInp} value={f.rohiniNo} onChange={(e) => set("rohiniNo", e.target.value)} /></div>
            </div>
          </div>
          <div className="px-5 pb-5 flex gap-3 border-t border-gray-100 pt-4">
            <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
            <button onClick={save} disabled={saving} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
              {saving ? "Saving..." : "✓ Profile Save Karein"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── BOOKINGS TAB ──────────────────────────────────────────────────────────────
function BookingsTab({ hospitalId, initialSearch = "", initialType = "all", initialDoctorId = "", filterLabel = "" }: { hospitalId: string; initialSearch?: string; initialType?: string; initialDoctorId?: string; filterLabel?: string }) {
  type BookingSubTab = "today" | "pending" | "all" | "accounting";
  const [subTab,    setSubTab]    = useState<BookingSubTab>("all");
  const [bookings,  setBookings]  = useState<Booking[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [accounting, setAccounting] = useState<any>({});
  const [search,    setSearch]    = useState(initialSearch);
  const [statusF,   setStatusF]   = useState("all");
  const [typeF,     setTypeF]     = useState(initialType);
  const [page,      setPage]      = useState(1);
  const [totalPages,setTotalPages]= useState(1);
  const [total,     setTotal]     = useState(0);
  const [updating,  setUpdating]  = useState<string | null>(null);
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null);
  const [expanded,  setExpanded]  = useState<string | null>(null);

  function showToast(msg: string, ok = true) { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); }

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ hospitalId, page: String(page) });
      if (subTab === "today")   params.set("date", "today");
      if (subTab === "pending") { params.set("status", "pending"); }
      else if (statusF !== "all") params.set("status", statusF);
      if (typeF !== "all")        params.set("type", typeF);
      if (search.trim())          params.set("search", search.trim());
      if (initialDoctorId)        params.set("doctorId", initialDoctorId);
      const res  = await fetch(`/api/hospital/bookings?${params}`);
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
        setTotalPages(data.pages || 1);
        setTotal(data.total || 0);
        if (data.accounting) setAccounting(data.accounting);
      }
    } finally { setLoading(false); }
  }, [hospitalId, subTab, statusF, typeF, page, search]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);
  useEffect(() => { setPage(1); }, [subTab, statusF, typeF, search]);

  async function updateStatus(bookingId: string, status: string) {
    setUpdating(bookingId);
    try {
      const res  = await fetch("/api/hospital/bookings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId, status }) });
      const data = await res.json();
      if (data.success) {
        setBookings((p) => p.map((b) => b._id === bookingId ? { ...b, status } : b));
        showToast(`Booking ${status} ✓`);
      } else showToast(data.message, false);
    } finally { setUpdating(null); }
  }

  const SUB_TABS: { key: BookingSubTab; icon: string; label: string }[] = [
    { key: "today",      icon: "📅", label: "Aaj"         },
    { key: "pending",    icon: "⏳", label: "Pending"     },
    { key: "all",        icon: "📋", label: "All Bookings" },
    { key: "accounting", icon: "💰", label: "Accounting"  },
  ];

  const BookingCard = ({ b }: { b: Booking }) => {
    const n = b.parsedNotes || {};
    const isUpdating = updating === b._id;
    const isOpen = expanded === b._id;
    const PM_LABEL: Record<string, string> = { counter: "Counter/Cash", online: "Online/UPI", wallet: "Brims Wallet", insurance: "Insurance" };
    const PAYOUT_LABEL: Record<string, string> = { paid: "✅ Paid", pending: "⏳ Pending", not_applicable: "N/A" };
    return (
      <div className={`bg-white rounded-2xl border shadow-sm transition ${b.status === "cancelled" ? "opacity-60 border-gray-200" : isOpen ? "border-purple-200 ring-1 ring-purple-100" : "border-gray-100"}`}>
        {/* ── Header row (always visible) — click to expand ── */}
        <div className="flex items-start justify-between gap-3 p-4 cursor-pointer select-none"
          onClick={() => setExpanded(isOpen ? null : b._id)}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-lg flex-shrink-0">
              {TYPE_ICON[b.type] || "📋"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-800 text-sm">{n.patientName || "Patient"}</p>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500">{b.bookingId}</span>
              </div>
              <p className="text-xs text-gray-500">{b.type}{b.doctorId?.name ? ` · Dr. ${b.doctorId.name}` : ""}{n.patientMobile ? ` · ${n.patientMobile}` : ""}</p>
              <p className="text-xs text-gray-400">{fmtDate(b.appointmentDate)}{b.slot ? ` · ${b.slot}` : ""}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${STATUS_COLORS[b.status] || "bg-gray-100 text-gray-600"}`}>{b.status}</span>
            {b.amount ? <span className="text-xs font-bold text-teal-700">₹{b.amount.toLocaleString()}</span> : null}
            <span className={`text-xs px-1.5 py-0.5 rounded-md ${b.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{b.paymentStatus}</span>
            <span className="text-[10px] text-gray-400">{isOpen ? "▲ Close" : "▼ Details"}</span>
          </div>
        </div>

        {/* ── Expanded detail panel ── */}
        {isOpen && (
          <div className="px-4 pb-4 space-y-3 border-t border-gray-50">
            {/* Patient info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
              {[
                ["👤 Patient",   n.patientName   || "—"],
                ["📱 Mobile",    n.patientMobile || "—"],
                ["🎂 Age",       n.patientAge    || "—"],
                ["⚥ Gender",     n.patientGender || "—"],
              ].map(([k, v]) => (
                <div key={String(k)} className="bg-gray-50 rounded-xl p-2.5">
                  <p className="text-[10px] text-gray-400">{k}</p>
                  <p className="text-xs font-semibold text-gray-700 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
            {/* Symptoms / reason */}
            {n.symptoms && (
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-[10px] text-blue-400 mb-0.5">🩺 Symptoms / Reason</p>
                <p className="text-xs text-blue-800">{n.symptoms}</p>
              </div>
            )}
            {/* Payment + commission */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                ["💳 Payment Mode",    PM_LABEL[n.paymentMode || b.paymentMode || ""] || b.paymentMode || "—"],
                ["💰 Amount",          `₹${(b.amount || 0).toLocaleString()}`],
                ["🏢 Commission",      b.platformCommission != null ? `₹${b.platformCommission} (${b.commissionPct ?? "?"}%)` : "—"],
                ["🏥 Hospital Gets",   b.hospitalPayable != null ? `₹${b.hospitalPayable.toLocaleString()}` : "—"],
              ].map(([k, v]) => (
                <div key={String(k)} className="bg-gray-50 rounded-xl p-2.5">
                  <p className="text-[10px] text-gray-400">{k}</p>
                  <p className="text-xs font-semibold text-gray-700 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
            {/* Online payout status */}
            {(b.paymentMode === "online" || b.paymentMode === "wallet" || b.paymentMode === "insurance") && (
              <div className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold ${(b as any).payoutStatus === "paid" ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                <span>Platform Payout Status</span>
                <span>{PAYOUT_LABEL[(b as any).payoutStatus || "pending"] || "Pending"}{(b as any).payoutUtr ? ` · UTR: ${(b as any).payoutUtr}` : ""}</span>
              </div>
            )}
            {/* Counter commission due */}
            {b.paymentMode === "counter" && b.platformCommission != null && b.platformCommission > 0 && (
              <div className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                <span>⚠️ Platform Commission Due</span>
                <span>₹{b.platformCommission.toLocaleString()} — admin ko dena hoga</span>
              </div>
            )}
            {/* Insurance details */}
            {n.insurancePolicyNo && (
              <div className="bg-sky-50 rounded-xl p-3 text-xs space-y-1">
                <p className="text-sky-700 font-semibold">🛡️ Insurance</p>
                <p className="text-gray-600">Policy: {n.insurancePolicyNo}</p>
                {n.insurerName && <p className="text-gray-600">Company: {n.insurerName}</p>}
                {n.tpaName     && <p className="text-gray-600">TPA: {n.tpaName}</p>}
              </div>
            )}
            {/* Home address */}
            {n.homeAddress && (
              <div className="bg-emerald-50 rounded-xl p-3 text-xs">
                <p className="text-emerald-700 font-semibold mb-1">🏠 Home Collection Address</p>
                <p className="text-gray-600">{typeof n.homeAddress === "string" ? n.homeAddress : [n.homeAddress.flat, n.homeAddress.street, n.homeAddress.landmark, n.homeAddress.district, n.homeAddress.pin].filter(Boolean).join(", ")}</p>
              </div>
            )}
            {/* Doctor info */}
            {b.doctorId && (
              <div className="bg-blue-50 rounded-xl p-3 text-xs">
                <p className="text-blue-700 font-semibold">👨‍⚕️ Doctor: Dr. {b.doctorId.name}</p>
                {b.doctorId.department && <p className="text-gray-500 mt-0.5">{b.doctorId.department}</p>}
              </div>
            )}
            {/* Booking meta */}
            <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
              <span>Booking ID: {b.bookingId}</span>
              <span>Created: {fmtDate(b.createdAt)}</span>
            </div>
          </div>
        )}

        {/* ── Action buttons ── */}
        {(b.status === "pending" || b.status === "confirmed") && (
          <div className={`flex gap-2 px-4 pb-4 ${isOpen ? "" : "pt-0"}`} onClick={(e) => e.stopPropagation()}>
            {b.status === "pending" && <>
              <button onClick={() => updateStatus(b._id, "confirmed")} disabled={isUpdating}
                className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-semibold transition disabled:opacity-50">
                {isUpdating ? "..." : "✓ Confirm"}
              </button>
              <button onClick={() => updateStatus(b._id, "cancelled")} disabled={isUpdating}
                className="flex-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2 rounded-xl font-semibold transition disabled:opacity-50">
                ✗ Decline
              </button>
            </>}
            {b.status === "confirmed" && <>
              <button onClick={() => updateStatus(b._id, "completed")} disabled={isUpdating}
                className="flex-1 text-xs bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-xl font-semibold transition disabled:opacity-50">
                {isUpdating ? "..." : "✓ Mark Completed"}
              </button>
              <button onClick={() => updateStatus(b._id, "cancelled")} disabled={isUpdating}
                className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 px-3 py-2 rounded-xl font-semibold transition disabled:opacity-50">
                Cancel
              </button>
            </>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      {/* Active filter banner */}
      {filterLabel && (
        <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5 text-sm text-teal-800 font-semibold">
          <span>🔍 Filtered: {filterLabel}</span>
          <span className="text-teal-400 text-xs">(showing all bookings for this filter)</span>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SUB_TABS.map((t) => (
          <button key={t.key} onClick={() => setSubTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap flex-shrink-0 ${subTab === t.key ? "bg-purple-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-purple-300"}`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Accounting Sub-tab */}
      {subTab === "accounting" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Total Revenue",       value: `₹${(accounting.totalRevenue || 0).toLocaleString()}`, icon: "💰", color: "from-green-500 to-emerald-400" },
              { label: "Pending Bookings",    value: accounting.pendingCount || 0,                           icon: "⏳", color: "from-amber-500 to-orange-400" },
              { label: "Today Confirmed",     value: accounting.todayByStatus?.confirmed || 0,               icon: "✅", color: "from-blue-500 to-cyan-400"    },
              { label: "Today Completed",     value: accounting.todayByStatus?.completed || 0,               icon: "🏁", color: "from-teal-500 to-emerald-400" },
              { label: "Today Cancelled",     value: accounting.todayByStatus?.cancelled || 0,               icon: "❌", color: "from-red-500 to-rose-400"     },
              { label: "Total Bookings",      value: total,                                                   icon: "📋", color: "from-purple-500 to-violet-400" },
            ].map((s) => (
              <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow-sm`}>
                <p className="text-2xl mb-1">{s.icon}</p>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs opacity-80 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-bold text-gray-700 mb-3">All Bookings Revenue Summary</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-600">Total Collected Revenue</span><span className="font-bold text-green-700">₹{(accounting.totalRevenue || 0).toLocaleString()}</span></div>
              <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-600">Pending Confirmation Count</span><span className="font-semibold text-amber-600">{accounting.pendingCount || 0}</span></div>
              <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-600">Today Pending</span><span className="font-semibold text-gray-700">{accounting.todayByStatus?.pending || 0}</span></div>
              <div className="flex justify-between py-2"><span className="text-gray-600">Today Confirmed</span><span className="font-semibold text-blue-700">{accounting.todayByStatus?.confirmed || 0}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Bookings list (today / pending / all) */}
      {subTab !== "accounting" && (
        <>
          {subTab === "all" && (
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-40">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Booking ID ya patient naam..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white" />
              </div>
              <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                {["all","pending","confirmed","completed","cancelled"].map((s) => <option key={s} value={s}>{s === "all" ? "All Status" : s}</option>)}
              </select>
              <select value={typeF} onChange={(e) => setTypeF(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                {["all","OPD","Lab","Surgery","Consultation","IPD"].map((t) => <option key={t} value={t}>{t === "all" ? "All Types" : t}</option>)}
              </select>
            </div>
          )}

          {loading ? <Spinner color="purple" /> : bookings.length === 0 ? (
            <EmptyCard icon="📋" msg={subTab === "today" ? "Aaj koi booking nahi hai" : subTab === "pending" ? "Koi pending booking nahi" : "Koi booking nahi mili"} />
          ) : (
            <div className="space-y-3">
              {subTab === "today" && (
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-600">Aaj ki bookings — {new Date().toLocaleDateString("en-IN", { weekday:"long", day:"2-digit", month:"long" })}</p>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-semibold">{bookings.length} bookings</span>
                </div>
              )}
              {bookings.map((b) => <BookingCard key={b._id} b={b} />)}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <button onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page === 1} className="px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50 transition">← Pehle</button>
                  <span className="text-sm text-gray-500">Page {page} / {totalPages} · {total} total</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p+1))} disabled={page === totalPages} className="px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50 transition">Aage →</button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── EARNINGS TAB ──────────────────────────────────────────────────────────────
function EarningsTab({ hospitalId }: { hospitalId: string }) {
  type EView = "bookings" | "payouts";
  const [eView,    setEView]    = useState<EView>("bookings");
  const [data,     setData]     = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [typeF,    setTypeF]    = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  const fetchEarnings = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ hospitalId, page: String(page), view: eView });
      if (typeF !== "all") p.set("type", typeF);
      if (dateFrom) p.set("dateFrom", dateFrom);
      if (dateTo)   p.set("dateTo",   dateTo);
      const res  = await fetch(`/api/hospital/earnings?${p}`);
      const json = await res.json();
      if (json.success) setData(json);
    } finally { setLoading(false); }
  }, [hospitalId, page, eView, typeF, dateFrom, dateTo]);

  useEffect(() => { fetchEarnings(); }, [fetchEarnings]);
  useEffect(() => { setPage(1); }, [typeF, dateFrom, dateTo, eView]);

  const s   = data?.summary || {};
  const rates = data?.commissionRates || {};
  const pag = data?.pagination || {};

  const SERVICE_TYPES = ["OPD", "Lab", "Surgery", "Consultation", "IPD"];
  const TYPE_COLORS: Record<string, string> = {
    OPD: "bg-blue-100 text-blue-700", Lab: "bg-orange-100 text-orange-700",
    Surgery: "bg-purple-100 text-purple-700", Consultation: "bg-teal-100 text-teal-700",
    IPD: "bg-rose-100 text-rose-700",
  };
  const MODE_COLORS: Record<string, string> = {
    online: "bg-green-100 text-green-700", counter: "bg-amber-100 text-amber-700",
    wallet: "bg-indigo-100 text-indigo-700", insurance: "bg-sky-100 text-sky-700",
  };
  const PAYOUT_COLORS: Record<string, string> = {
    paid: "bg-green-100 text-green-700 border-green-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    not_applicable: "bg-gray-100 text-gray-500 border-gray-200",
  };

  return (
    <div className="space-y-4">
      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Platform Ko Dena Hai\n(Counter Commission)", value: `₹${(s.counterCommissionDue || 0).toLocaleString("en-IN")}`, icon: "🔴", sub: `${s.counterCount || 0} bookings`, color: "from-red-500 to-rose-400" },
          { label: "Platform Se Milna Hai\n(Online Pending)", value: `₹${(s.pendingFromPlatform || 0).toLocaleString("en-IN")}`, icon: "⏳", sub: `${s.pendingFromPlatformCount || 0} bookings`, color: "from-amber-500 to-orange-400" },
          { label: "Platform Se Mila\n(Paid Out)", value: `₹${(s.receivedFromPlatform || 0).toLocaleString("en-IN")}`, icon: "✅", sub: `${s.receivedFromPlatformCount || 0} payouts`, color: "from-green-500 to-emerald-400" },
          { label: "Is Maah Ki Kamai", value: `₹${(s.thisMonthEarnings || 0).toLocaleString("en-IN")}`, icon: "📅", sub: new Date().toLocaleString("en-IN", { month: "long", year: "numeric" }), color: "from-purple-500 to-violet-400" },
        ].map((c) => (
          <div key={c.label} className={`bg-gradient-to-br ${c.color} rounded-2xl p-4 text-white shadow-sm`}>
            <p className="text-2xl mb-1">{c.icon}</p>
            <p className="text-xl font-bold leading-tight">{c.value}</p>
            <p className="text-[11px] opacity-80 mt-1 whitespace-pre-line leading-tight">{c.label}</p>
            <p className="text-[10px] opacity-70 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Commission Rates Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-sm font-bold text-gray-700 mb-3">📊 Platform Commission Rates (Admin Dwara Set)</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {SERVICE_TYPES.map((t) => (
            <div key={t} className="text-center bg-gray-50 rounded-xl p-2.5 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">{t}</p>
              <p className="text-lg font-bold text-purple-700">{rates[t] ?? "—"}%</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2.5">* Counter payment pe ye commission admin ko dena hoga. Online payment pe platform ye kat ke baaki aapko deta hai.</p>
      </div>

      {/* ── View Toggle + Filters ── */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          {([["bookings","📋 Bookings"], ["payouts","💸 Payout History"]] as [EView, string][]).map(([v, label]) => (
            <button key={v} onClick={() => setEView(v)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${eView === v ? "bg-purple-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-purple-300"}`}>
              {label}
            </button>
          ))}
        </div>
        {eView === "bookings" && (
          <div className="flex flex-wrap gap-2 items-center">
            <select value={typeF} onChange={(e) => setTypeF(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none">
              {["all","OPD","Lab","Surgery","Consultation","IPD"].map((t) => <option key={t}>{t === "all" ? "All Types" : t}</option>)}
            </select>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none" />
            <span className="text-xs text-gray-400">to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none" />
            {(dateFrom || dateTo) && <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs text-red-500 hover:text-red-700">✕ Clear</button>}
          </div>
        )}
      </div>

      {/* ── Bookings List ── */}
      {eView === "bookings" && (
        loading ? <Spinner color="purple" /> : !(data?.bookings?.length) ? (
          <EmptyCard icon="📊" msg="Koi booking record nahi mila" />
        ) : (
          <div className="space-y-3">
            {/* Table header (desktop) */}
            <div className="hidden sm:grid grid-cols-[1fr_80px_80px_80px_80px_80px_90px] gap-2 px-4 py-2 text-xs text-gray-400 font-semibold bg-gray-50 rounded-xl">
              <span>Booking / Patient</span><span className="text-center">Type</span><span className="text-right">Amount</span>
              <span className="text-right">Commission</span><span className="text-right">Hospital Gets</span>
              <span className="text-center">Mode</span><span className="text-center">Payout</span>
            </div>
            {(data.bookings as any[]).map((b: any) => {
              const n = b.parsedNotes || {};
              const payoutKey = b.paymentMode === "counter" ? "not_applicable" : (b.payoutStatus || "pending");
              const payoutLabel = b.paymentMode === "counter"
                ? "Counter (Cash)"
                : b.payoutStatus === "paid"
                  ? `Paid ✓${b.payoutUtr ? ` · ${b.payoutUtr}` : ""}`
                  : "Awaiting";
              return (
                <div key={b._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="sm:grid sm:grid-cols-[1fr_80px_80px_80px_80px_80px_90px] sm:gap-2 sm:items-center">
                    {/* Booking info */}
                    <div className="min-w-0 mb-2 sm:mb-0">
                      <p className="text-sm font-semibold text-gray-800">{n.patientName || "Patient"}</p>
                      <p className="text-xs text-gray-400">{b.bookingId} · {fmtDate(b.createdAt)}</p>
                      <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded-md font-semibold mt-0.5 ${STATUS_COLORS[b.status] || "bg-gray-100 text-gray-600"}`}>{b.status}</span>
                    </div>
                    {/* Mobile: inline grid */}
                    <div className="grid grid-cols-3 sm:contents gap-2 text-xs">
                      <div className="sm:text-center"><span className={`inline-flex px-2 py-0.5 rounded-full font-semibold text-[10px] ${TYPE_COLORS[b.type] || "bg-gray-100 text-gray-600"}`}>{b.type}</span></div>
                      <div className="sm:text-right font-bold text-gray-800">₹{(b.amount || 0).toLocaleString("en-IN")}</div>
                      <div className="sm:text-right text-red-600 font-semibold">-₹{(b.platformCommission || 0).toLocaleString("en-IN")}<span className="text-gray-400 ml-0.5">({b.commissionPct}%)</span></div>
                      <div className="sm:text-right font-bold text-green-700 col-span-1">₹{(b.hospitalPayable || 0).toLocaleString("en-IN")}</div>
                      <div className="sm:text-center"><span className={`inline-flex px-1.5 py-0.5 rounded-md font-semibold text-[10px] ${MODE_COLORS[b.paymentMode] || "bg-gray-100 text-gray-600"}`}>{b.paymentMode}</span></div>
                      <div className="sm:text-center"><span className={`inline-flex px-2 py-0.5 rounded-full font-semibold text-[10px] border ${PAYOUT_COLORS[payoutKey] || "bg-gray-100 text-gray-500 border-gray-200"}`}>{payoutLabel}</span></div>
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Pagination */}
            {pag.pages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <button onClick={() => setPage((p) => Math.max(1,p-1))} disabled={page===1} className="px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">← Pehle</button>
                <span className="text-sm text-gray-500">Page {page} / {pag.pages} · {pag.total} total</span>
                <button onClick={() => setPage((p) => Math.min(pag.pages,p+1))} disabled={page===pag.pages} className="px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">Aage →</button>
              </div>
            )}
          </div>
        )
      )}

      {/* ── Payout History ── */}
      {eView === "payouts" && (
        loading ? <Spinner color="purple" /> : !(data?.payouts?.length) ? (
          <EmptyCard icon="💸" msg="Koi payout record nahi mila. Admin se contact karein." />
        ) : (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
              💡 Ye records un bookings ke hain jinka payout admin ne process kar diya hai (UTR ke saath).
            </div>
            {(data.payouts as any[]).map((b: any) => {
              const n = b.parsedNotes || {};
              return (
                <div key={b._id} className="bg-white rounded-2xl border border-green-100 shadow-sm p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 text-green-700 rounded-xl flex items-center justify-center text-lg flex-shrink-0">✅</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{n.patientName || "Patient"} · {b.bookingId}</p>
                    <p className="text-xs text-gray-500">{b.type} · {fmtDate(b.payoutProcessedAt || b.createdAt)}</p>
                    {b.payoutUtr && <p className="text-xs text-gray-400">UTR: {b.payoutUtr}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-green-700 text-sm">₹{(b.hospitalPayable || 0).toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-gray-400">of ₹{(b.amount || 0).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── REPORTS TAB ───────────────────────────────────────────────────────────────
function ReportsTab({ hospitalId }: { hospitalId: string }) {
  const [reports, setReports]           = useState<Report[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showUpload, setShowUpload]     = useState(false);
  const [searchMobile, setSearchMobile] = useState("");
  const [filterMobile, setFilterMobile] = useState("");
  const [patientMobile, setPatientMobile] = useState("");
  const [title, setTitle]               = useState("");
  const [category, setCategory]         = useState("Lab");
  const [notes, setNotes]               = useState("");
  const [reportDate, setReportDate]     = useState(new Date().toISOString().split("T")[0]);
  const [file, setFile]                 = useState<File | null>(null);
  const [uploading, setUploading]       = useState(false);
  const [err, setErr]                   = useState("");
  const [toast, setToast]               = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchReports(); }, [hospitalId, filterMobile]);

  async function fetchReports() {
    setLoading(true);
    try {
      const url = `/api/hospital/reports?hospitalId=${hospitalId}${filterMobile ? `&mobile=${filterMobile}` : ""}`;
      const res  = await fetch(url);
      const data = await res.json();
      if (data.success) setReports(data.reports);
    } finally { setLoading(false); }
  }

  async function handleUpload() {
    if (!patientMobile || !title || !file) { setErr("Patient mobile, title aur file zaruri hai"); return; }
    if (!/^\d{10}$/.test(patientMobile)) { setErr("Valid 10-digit mobile number daalo"); return; }
    setUploading(true); setErr("");
    try {
      const fd = new FormData(); fd.append("file", file);
      const upRes  = await fetch("/api/upload-report", { method: "POST", body: fd });
      const upData = await upRes.json();
      if (!upData.success) { setErr(upData.message); return; }
      const res  = await fetch("/api/hospital/reports", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalId, patientMobile, title, category, notes, reportDate, fileUrl: upData.url, fileType: upData.fileType }),
      });
      const data = await res.json();
      if (!data.success) { setErr(data.message); return; }
      setToast("Report upload ho gayi!"); setTimeout(() => setToast(""), 3000);
      setShowUpload(false); setPatientMobile(""); setTitle(""); setNotes(""); setFile(null);
      setCategory("Lab"); setReportDate(new Date().toISOString().split("T")[0]);
      if (fileRef.current) fileRef.current.value = "";
      fetchReports();
    } finally { setUploading(false); }
  }

  async function deleteReport(id: string) {
    if (!confirm("Is report ko delete karein?")) return;
    await fetch("/api/hospital/reports", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reportId: id }) });
    setReports((p) => p.filter((r) => r._id !== id));
  }

  return (
    <div className="space-y-4">
      {toast && <Toast msg={toast} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold text-gray-800">🗂️ Lab Reports</h3>
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1">
            <input value={searchMobile} onChange={(e) => setSearchMobile(e.target.value.replace(/\D/g, ""))} maxLength={10} placeholder="Mobile se search..." className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 w-40" />
            <button onClick={() => setFilterMobile(searchMobile)} className="bg-teal-600 text-white px-3 py-2 rounded-xl text-sm">🔍</button>
            {filterMobile && <button onClick={() => { setFilterMobile(""); setSearchMobile(""); }} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-sm">✕</button>}
          </div>
          <button onClick={() => setShowUpload(true)} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5">+ Report Upload</button>
        </div>
      </div>

      {showUpload && (
        <div className="bg-white rounded-2xl border border-teal-100 p-5 shadow-sm space-y-3">
          <h4 className="font-semibold text-gray-800 text-sm">Report Upload Karein</h4>
          {err && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-xl">{err}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Patient Mobile *</label><input value={patientMobile} onChange={(e) => setPatientMobile(e.target.value.replace(/\D/g, ""))} maxLength={10} placeholder="10-digit" className={hInp} /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Report Title *</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="CBC, X-Ray, Scan..." className={hInp} /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Category</label><select value={category} onChange={(e) => setCategory(e.target.value)} className={hSel}>{REPORT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Date</label><input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className={hInp} /></div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 block mb-1">Notes</label><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." className={hInp} /></div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 block mb-1">File (PDF/Image) *</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-teal-400 transition" onClick={() => fileRef.current?.click()}>
                {file ? <p className="text-sm text-teal-700 font-medium">📄 {file.name}</p> : <p className="text-sm text-gray-400">Click to upload PDF or Image</p>}
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setShowUpload(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
            <button onClick={handleUpload} disabled={uploading} className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
              {uploading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Uploading...</> : "Report Save Karein"}
            </button>
          </div>
        </div>
      )}

      {loading ? <Spinner color="teal" /> : reports.length === 0 ? <EmptyCard icon="🗂️" msg={filterMobile ? "Is mobile ke liye koi report nahi" : "Koi report nahi mili"} /> : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r._id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${r.fileType === "pdf" ? "bg-red-100" : "bg-blue-100"}`}>{r.fileType === "pdf" ? "📄" : "🖼️"}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm">{r.title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{r.category}</span>
                  <span className="text-xs text-gray-400">{fmtDate(r.reportDate)}</span>
                  <span className="text-xs text-gray-500">· {r.patientName}</span>
                </div>
                {r.notes && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{r.notes}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:bg-teal-50 px-3 py-1.5 rounded-lg transition">View</a>
                <button onClick={() => deleteReport(r._id)} className="text-xs text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── PRESET LAB TEMPLATES ──────────────────────────────────────────────────────
const LAB_PRESETS: Record<string, { name: string; category: string; parameters: any[] }> = {
  CBC: {
    name: "Complete Blood Count (CBC)",
    category: "Blood Test",
    parameters: [
      { paramId:"p1",  name:"Haemoglobin",        unit:"g/dL",       type:"numeric", refMaleMin:13,   refMaleMax:17,   refFemaleMin:12,  refFemaleMax:15,  refRangeText:"M: 13–17 | F: 12–15" },
      { paramId:"p2",  name:"RBC Count",           unit:"mill/µL",    type:"numeric", refMaleMin:4.5,  refMaleMax:5.5,  refFemaleMin:3.8, refFemaleMax:4.8, refRangeText:"M: 4.5–5.5 | F: 3.8–4.8" },
      { paramId:"p3",  name:"WBC (Total Count)",   unit:"cells/µL",   type:"numeric", refMaleMin:4000, refMaleMax:11000,refFemaleMin:4000,refFemaleMax:11000,refRangeText:"4000–11000" },
      { paramId:"p4",  name:"Platelets",           unit:"lakh/µL",    type:"numeric", refMaleMin:1.5,  refMaleMax:4.5,  refFemaleMin:1.5, refFemaleMax:4.5, refRangeText:"1.5–4.5" },
      { paramId:"p5",  name:"PCV / Haematocrit",   unit:"%",          type:"numeric", refMaleMin:40,   refMaleMax:50,   refFemaleMin:36,  refFemaleMax:46,  refRangeText:"M: 40–50 | F: 36–46" },
      { paramId:"p6",  name:"MCV",                 unit:"fL",         type:"numeric", refMaleMin:80,   refMaleMax:100,  refFemaleMin:80,  refFemaleMax:100, refRangeText:"80–100" },
      { paramId:"p7",  name:"MCH",                 unit:"pg",         type:"numeric", refMaleMin:27,   refMaleMax:33,   refFemaleMin:27,  refFemaleMax:33,  refRangeText:"27–33" },
      { paramId:"p8",  name:"MCHC",                unit:"g/dL",       type:"numeric", refMaleMin:32,   refMaleMax:36,   refFemaleMin:32,  refFemaleMax:36,  refRangeText:"32–36" },
    ],
  },
  LFT: {
    name: "Liver Function Test (LFT)",
    category: "Blood Test",
    parameters: [
      { paramId:"p1", name:"Bilirubin Total",      unit:"mg/dL",  type:"numeric", refMaleMin:0.2, refMaleMax:1.2, refFemaleMin:0.2, refFemaleMax:1.2, refRangeText:"0.2–1.2" },
      { paramId:"p2", name:"Bilirubin Direct",     unit:"mg/dL",  type:"numeric", refMaleMin:0,   refMaleMax:0.4, refFemaleMin:0,   refFemaleMax:0.4, refRangeText:"0.0–0.4" },
      { paramId:"p3", name:"Bilirubin Indirect",   unit:"mg/dL",  type:"numeric", refMaleMin:0.2, refMaleMax:0.8, refFemaleMin:0.2, refFemaleMax:0.8, refRangeText:"0.2–0.8" },
      { paramId:"p4", name:"SGOT / AST",           unit:"U/L",    type:"numeric", refMaleMin:15,  refMaleMax:37,  refFemaleMin:15,  refFemaleMax:31,  refRangeText:"M: 15–37 | F: 15–31" },
      { paramId:"p5", name:"SGPT / ALT",           unit:"U/L",    type:"numeric", refMaleMin:16,  refMaleMax:63,  refFemaleMin:9,   refFemaleMax:52,  refRangeText:"M: 16–63 | F: 9–52" },
      { paramId:"p6", name:"Alkaline Phosphatase", unit:"U/L",    type:"numeric", refMaleMin:44,  refMaleMax:147, refFemaleMin:44,  refFemaleMax:147, refRangeText:"44–147" },
      { paramId:"p7", name:"Total Protein",        unit:"g/dL",   type:"numeric", refMaleMin:6.3, refMaleMax:8.2, refFemaleMin:6.3, refFemaleMax:8.2, refRangeText:"6.3–8.2" },
      { paramId:"p8", name:"Albumin",              unit:"g/dL",   type:"numeric", refMaleMin:3.5, refMaleMax:5.0, refFemaleMin:3.5, refFemaleMax:5.0, refRangeText:"3.5–5.0" },
    ],
  },
  KFT: {
    name: "Kidney Function Test (KFT)",
    category: "Blood Test",
    parameters: [
      { paramId:"p1", name:"Blood Urea",      unit:"mg/dL",  type:"numeric", refMaleMin:7,   refMaleMax:25,  refFemaleMin:7,   refFemaleMax:25,  refRangeText:"7–25" },
      { paramId:"p2", name:"Serum Creatinine",unit:"mg/dL",  type:"numeric", refMaleMin:0.7, refMaleMax:1.3, refFemaleMin:0.6, refFemaleMax:1.1, refRangeText:"M: 0.7–1.3 | F: 0.6–1.1" },
      { paramId:"p3", name:"Uric Acid",       unit:"mg/dL",  type:"numeric", refMaleMin:3.5, refMaleMax:7.2, refFemaleMin:2.6, refFemaleMax:6.0, refRangeText:"M: 3.5–7.2 | F: 2.6–6.0" },
      { paramId:"p4", name:"BUN",             unit:"mg/dL",  type:"numeric", refMaleMin:8,   refMaleMax:23,  refFemaleMin:8,   refFemaleMax:23,  refRangeText:"8–23" },
      { paramId:"p5", name:"Sodium (Na+)",    unit:"mEq/L",  type:"numeric", refMaleMin:136, refMaleMax:145, refFemaleMin:136, refFemaleMax:145, refRangeText:"136–145" },
      { paramId:"p6", name:"Potassium (K+)",  unit:"mEq/L",  type:"numeric", refMaleMin:3.5, refMaleMax:5.0, refFemaleMin:3.5, refFemaleMax:5.0, refRangeText:"3.5–5.0" },
      { paramId:"p7", name:"Chloride (Cl-)",  unit:"mEq/L",  type:"numeric", refMaleMin:98,  refMaleMax:107, refFemaleMin:98,  refFemaleMax:107, refRangeText:"98–107" },
    ],
  },
  LIPID: {
    name: "Lipid Profile",
    category: "Blood Test",
    parameters: [
      { paramId:"p1", name:"Total Cholesterol", unit:"mg/dL", type:"numeric", refMaleMin:0,  refMaleMax:200, refFemaleMin:0,  refFemaleMax:200, refRangeText:"< 200 (Desirable)" },
      { paramId:"p2", name:"Triglycerides",     unit:"mg/dL", type:"numeric", refMaleMin:0,  refMaleMax:150, refFemaleMin:0,  refFemaleMax:150, refRangeText:"< 150" },
      { paramId:"p3", name:"HDL Cholesterol",   unit:"mg/dL", type:"numeric", refMaleMin:40, refMaleMax:999, refFemaleMin:50, refFemaleMax:999, refRangeText:"M: > 40 | F: > 50" },
      { paramId:"p4", name:"LDL Cholesterol",   unit:"mg/dL", type:"numeric", refMaleMin:0,  refMaleMax:130, refFemaleMin:0,  refFemaleMax:130, refRangeText:"< 130" },
      { paramId:"p5", name:"VLDL Cholesterol",  unit:"mg/dL", type:"numeric", refMaleMin:5,  refMaleMax:40,  refFemaleMin:5,  refFemaleMax:40,  refRangeText:"5–40" },
      { paramId:"p6", name:"Non-HDL Cholesterol",unit:"mg/dL",type:"numeric", refMaleMin:0,  refMaleMax:160, refFemaleMin:0,  refFemaleMax:160, refRangeText:"< 160" },
    ],
  },
  TFT: {
    name: "Thyroid Function Test (TFT)",
    category: "Blood Test",
    parameters: [
      { paramId:"p1", name:"T3 (Triiodothyronine)", unit:"ng/dL",   type:"numeric", refMaleMin:60,  refMaleMax:200, refFemaleMin:60,  refFemaleMax:200, refRangeText:"60–200" },
      { paramId:"p2", name:"T4 (Thyroxine)",        unit:"µg/dL",   type:"numeric", refMaleMin:4.5, refMaleMax:12.5,refFemaleMin:4.5, refFemaleMax:12.5,refRangeText:"4.5–12.5" },
      { paramId:"p3", name:"TSH",                   unit:"µIU/mL",  type:"numeric", refMaleMin:0.4, refMaleMax:4.0, refFemaleMin:0.4, refFemaleMax:4.0, refRangeText:"0.4–4.0" },
    ],
  },
  SUGAR: {
    name: "Blood Sugar (Glucose)",
    category: "Blood Test",
    parameters: [
      { paramId:"p1", name:"Fasting Blood Sugar (FBS)",  unit:"mg/dL", type:"numeric", refMaleMin:70, refMaleMax:100, refFemaleMin:70, refFemaleMax:100, refRangeText:"70–100 (Normal)" },
      { paramId:"p2", name:"Post Prandial (PP) 2hr",     unit:"mg/dL", type:"numeric", refMaleMin:70, refMaleMax:140, refFemaleMin:70, refFemaleMax:140, refRangeText:"< 140 (Normal)" },
      { paramId:"p3", name:"Random Blood Sugar",         unit:"mg/dL", type:"numeric", refMaleMin:70, refMaleMax:125, refFemaleMin:70, refFemaleMax:125, refRangeText:"< 125" },
      { paramId:"p4", name:"HbA1c",                     unit:"%",     type:"numeric", refMaleMin:4,  refMaleMax:5.7, refFemaleMin:4,  refFemaleMax:5.7, refRangeText:"< 5.7 (Normal)" },
    ],
  },
  URINE: {
    name: "Urine Routine Microscopy",
    category: "Urine Test",
    parameters: [
      { paramId:"p1",  name:"Color",             unit:"",         type:"text",    refRangeText:"Yellow" },
      { paramId:"p2",  name:"Appearance",        unit:"",         type:"text",    refRangeText:"Clear" },
      { paramId:"p3",  name:"Reaction (pH)",     unit:"",         type:"numeric", refMaleMin:5.0, refMaleMax:8.5, refFemaleMin:5.0, refFemaleMax:8.5, refRangeText:"5.0–8.5" },
      { paramId:"p4",  name:"Specific Gravity",  unit:"",         type:"numeric", refMaleMin:1.005,refMaleMax:1.030,refFemaleMin:1.005,refFemaleMax:1.030,refRangeText:"1.005–1.030" },
      { paramId:"p5",  name:"Protein",           unit:"",         type:"text",    refRangeText:"Nil / Negative" },
      { paramId:"p6",  name:"Sugar (Glucose)",   unit:"",         type:"text",    refRangeText:"Nil / Negative" },
      { paramId:"p7",  name:"RBC",               unit:"/HPF",     type:"numeric", refMaleMin:0, refMaleMax:3, refFemaleMin:0, refFemaleMax:3, refRangeText:"0–3 /HPF" },
      { paramId:"p8",  name:"WBC / Pus Cells",   unit:"/HPF",     type:"numeric", refMaleMin:0, refMaleMax:5, refFemaleMin:0, refFemaleMax:5, refRangeText:"0–5 /HPF" },
      { paramId:"p9",  name:"Epithelial Cells",  unit:"/HPF",     type:"text",    refRangeText:"Occasional" },
      { paramId:"p10", name:"Casts",             unit:"",         type:"text",    refRangeText:"Nil" },
      { paramId:"p11", name:"Crystals",          unit:"",         type:"text",    refRangeText:"Nil" },
      { paramId:"p12", name:"Bacteria",          unit:"",         type:"text",    refRangeText:"Nil" },
    ],
  },
};

// ── LAB MANAGE TAB ────────────────────────────────────────────────────────────
function LabManageTab({ hospitalId }: { hospitalId: string }) {
  const [view, setView] = useState<"templates" | "reports">("reports");

  // ── Templates state ──
  const [templates,      setTemplates]      = useState<any[]>([]);
  const [tmplLoading,    setTmplLoading]    = useState(false);
  const [tmplModal,      setTmplModal]      = useState<{ mode: "add" | "edit"; item?: any } | null>(null);
  const [showPresets,    setShowPresets]    = useState(false);

  // ── Reports state ──
  const [reports,        setReports]        = useState<any[]>([]);
  const [rptLoading,     setRptLoading]     = useState(false);
  const [reportModal,    setReportModal]    = useState<{ mode: "add" | "edit"; item?: any } | null>(null);
  const [rptSearch,      setRptSearch]      = useState("");
  const [rptStatus,      setRptStatus]      = useState("");

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => { if (hospitalId) { fetchTemplates(); fetchReports(); } }, [hospitalId]);

  async function fetchTemplates() {
    setTmplLoading(true);
    const r = await fetch(`/api/hospital/lab-templates?hospitalId=${hospitalId}`);
    const d = await r.json();
    if (d.success) setTemplates(d.templates);
    setTmplLoading(false);
  }

  async function fetchReports() {
    setRptLoading(true);
    const p = new URLSearchParams({ hospitalId });
    if (rptSearch) p.set("search", rptSearch);
    if (rptStatus) p.set("status", rptStatus);
    const r = await fetch(`/api/hospital/lab-reports?${p}`);
    const d = await r.json();
    if (d.success) setReports(d.reports);
    setRptLoading(false);
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Template delete karein?")) return;
    await fetch(`/api/hospital/lab-templates?id=${id}`, { method: "DELETE" });
    setTemplates((p) => p.filter((t) => t._id !== id));
    showToast("Template delete ho gaya!");
  }

  async function finaliseReport(id: string) {
    const r = await fetch("/api/hospital/lab-reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "final" }),
    });
    const d = await r.json();
    if (d.success) { fetchReports(); showToast("Report finalised!"); }
    else showToast(d.message, false);
  }

  const fmtD = (d?: string) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";

  return (
    <div className="space-y-4">
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      {/* Modals */}
      {tmplModal && (
        <TemplateFormModal
          hospitalId={hospitalId}
          template={tmplModal.item}
          onClose={() => setTmplModal(null)}
          onSaved={() => { setTmplModal(null); fetchTemplates(); showToast(tmplModal.mode === "add" ? "Template add ho gaya!" : "Template update ho gaya!"); }}
        />
      )}
      {reportModal && (
        <ReportFormModal
          hospitalId={hospitalId}
          templates={templates}
          report={reportModal.item}
          onClose={() => setReportModal(null)}
          onSaved={() => { setReportModal(null); fetchReports(); showToast(reportModal.mode === "add" ? "Report create ho gaya!" : "Report update ho gaya!"); }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-bold text-gray-800 text-lg">📊 Lab Report Management</h3>
        <div className="flex gap-2">
          <button onClick={() => setView("templates")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${view === "templates" ? "bg-purple-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-purple-300"}`}>
            📋 Templates
          </button>
          <button onClick={() => setView("reports")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${view === "reports" ? "bg-purple-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-purple-300"}`}>
            📊 Reports
          </button>
        </div>
      </div>

      {/* ── TEMPLATES VIEW ── */}
      {view === "templates" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <p className="text-sm text-gray-500">{templates.length} template{templates.length !== 1 ? "s" : ""}</p>
            <div className="flex gap-2">
              <button onClick={() => setShowPresets((v) => !v)}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition">
                ⚡ Preset Use Karein
              </button>
              <button onClick={() => setTmplModal({ mode: "add" })}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition">
                + New Template
              </button>
            </div>
          </div>

          {/* Preset panel */}
          {showPresets && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-sm font-bold text-amber-800 mb-3">⚡ Common Tests — Ek click mein add karein</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(LAB_PRESETS).map(([key, preset]) => (
                  <PresetImportBtn key={key} preset={preset} hospitalId={hospitalId}
                    onImported={() => { fetchTemplates(); showToast(`${preset.name} add ho gaya!`); }} />
                ))}
              </div>
            </div>
          )}

          {tmplLoading ? <Spinner color="purple" /> : templates.length === 0 ? (
            <EmptyCard icon="📋" msg="Koi template nahi. 'Preset Use Karein' se shuru karein!" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {templates.map((t) => (
                <div key={t._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-lg flex-shrink-0">🧪</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-sm leading-tight">{t.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t.category} · {t.parameters?.length || 0} parameters</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                    <button onClick={() => setTmplModal({ mode: "edit", item: t })}
                      className="flex-1 text-xs text-purple-600 hover:bg-purple-50 py-2 rounded-xl border border-purple-100 font-semibold transition">✏️ Edit</button>
                    <button onClick={() => { setReportModal({ mode: "add" }); }}
                      className="flex-1 text-xs text-teal-600 hover:bg-teal-50 py-2 rounded-xl border border-teal-100 font-semibold transition">📊 Use</button>
                    <button onClick={() => deleteTemplate(t._id)}
                      className="text-xs text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition">🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── REPORTS VIEW ── */}
      {view === "reports" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 flex-1 flex-wrap">
              <input value={rptSearch} onChange={(e) => setRptSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchReports()}
                placeholder="Patient naam ya Report ID..."
                className="flex-1 min-w-40 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              <select value={rptStatus} onChange={(e) => { setRptStatus(e.target.value); setTimeout(fetchReports, 0); }}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="final">Final</option>
              </select>
              <button onClick={fetchReports}
                className="px-4 py-2 rounded-xl text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition font-semibold">🔍</button>
            </div>
            {templates.length > 0 ? (
              <button onClick={() => setReportModal({ mode: "add" })}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 transition whitespace-nowrap">
                + New Report
              </button>
            ) : (
              <button onClick={() => setView("templates")}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition whitespace-nowrap">
                Pehle Template Banayein →
              </button>
            )}
          </div>

          {rptLoading ? <Spinner color="teal" /> : reports.length === 0 ? (
            <EmptyCard icon="📊" msg="Koi report nahi. Pehla report banayein!" />
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-lg flex-shrink-0">📊</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-gray-800 text-sm">{r.patientName}</p>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs text-gray-500">{r.reportId}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${r.status === "final" ? "bg-green-100 text-green-700 border-green-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}>
                            {r.status === "final" ? "✓ Final" : "⏳ Draft"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{r.templateName} · {r.patientAge ? `${r.patientAge} yrs` : ""} {r.patientGender ? `· ${r.patientGender}` : ""}</p>
                        <p className="text-xs text-gray-400">Collection: {fmtD(r.collectionDate)} · Report: {fmtD(r.reportDate)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                    <button onClick={() => setReportModal({ mode: "edit", item: r })}
                      className="flex-1 text-xs text-purple-600 hover:bg-purple-50 py-2 rounded-xl border border-purple-100 font-semibold transition">✏️ Edit</button>
                    <a href={`/lab-report/${r.reportId}`} target="_blank" rel="noreferrer"
                      className="flex-1 text-center text-xs text-teal-600 hover:bg-teal-50 py-2 rounded-xl border border-teal-100 font-semibold transition">
                      🖨️ Print
                    </a>
                    {r.status === "draft" && (
                      <button onClick={() => finaliseReport(r._id)}
                        className="flex-1 text-xs text-white bg-green-600 hover:bg-green-700 py-2 rounded-xl font-semibold transition">✓ Finalise</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── PRESET IMPORT BUTTON ──────────────────────────────────────────────────────
function PresetImportBtn({ preset, hospitalId, onImported }: { preset: any; hospitalId: string; onImported: () => void }) {
  const [loading, setLoading] = useState(false);
  async function importPreset() {
    setLoading(true);
    await fetch("/api/hospital/lab-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hospitalId, ...preset }),
    });
    setLoading(false);
    onImported();
  }
  return (
    <button onClick={importPreset} disabled={loading}
      className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-amber-200 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition disabled:opacity-50 text-left">
      {loading ? <span className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /> : <span>⚡</span>}
      {preset.name.replace(/\(.*\)/, "").trim()}
    </button>
  );
}

// ── TEMPLATE FORM MODAL ───────────────────────────────────────────────────────
function TemplateFormModal({ hospitalId, template, onClose, onSaved }: { hospitalId: string; template?: any; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!template;
  const LAB_CATS = ["Blood Test","Urine Test","Stool Test","Imaging","ECG","X-Ray","Ultrasound","MRI","CT Scan","Pathology","Other"];

  const [name,     setName]     = useState(template?.name     || "");
  const [category, setCategory] = useState(template?.category || "Blood Test");
  const [params,   setParams]   = useState<any[]>(
    template?.parameters?.length ? template.parameters.map((p: any) => ({ ...p })) : [newParam()]
  );
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  function newParam(order = 0) {
    return { paramId: `p${Date.now()}_${order}`, name: "", unit: "", type: "numeric", refMaleMin: "", refMaleMax: "", refFemaleMin: "", refFemaleMax: "", refRangeText: "", notes: "", order };
  }

  function addParam() {
    setParams((p) => [...p, newParam(p.length)]);
  }

  function removeParam(i: number) {
    setParams((p) => p.filter((_, idx) => idx !== i));
  }

  function updateParam(i: number, key: string, val: any) {
    setParams((p) => p.map((x, idx) => idx === i ? { ...x, [key]: val } : x));
  }

  async function save() {
    if (!name.trim()) { setErr("Template naam zaruri hai"); return; }
    const validParams = params.filter((p) => p.name.trim());
    if (validParams.length === 0) { setErr("Kam se kam ek parameter add karein"); return; }

    setSaving(true); setErr("");
    try {
      const body = {
        ...(isEdit ? { id: template._id } : { hospitalId }),
        name: name.trim(), category,
        parameters: validParams.map((p, i) => ({
          ...p,
          order: i,
          refMaleMin:   p.type === "numeric" ? (Number(p.refMaleMin)   || undefined) : undefined,
          refMaleMax:   p.type === "numeric" ? (Number(p.refMaleMax)   || undefined) : undefined,
          refFemaleMin: p.type === "numeric" ? (Number(p.refFemaleMin) || undefined) : undefined,
          refFemaleMax: p.type === "numeric" ? (Number(p.refFemaleMax) || undefined) : undefined,
        })),
      };
      const res = await fetch("/api/hospital/lab-templates", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) onSaved();
      else setErr(data.message);
    } catch { setErr("Network error"); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
          <h3 className="font-bold text-gray-800">{isEdit ? "Template Edit Karein" : "Naya Template"}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center">✕</button>
        </div>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">Template Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Complete Blood Count (CBC)" className={hInp} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={hSel}>
                {LAB_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Parameters */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-700">Parameters ({params.filter((p) => p.name.trim()).length})</p>
              <button onClick={addParam} className="text-xs text-purple-600 font-semibold hover:underline">+ Add Parameter</button>
            </div>

            {/* Header row */}
            <div className="hidden sm:grid grid-cols-12 gap-1 px-2 mb-1">
              <span className="col-span-3 text-[10px] text-gray-400 font-semibold">Parameter Name *</span>
              <span className="col-span-1 text-[10px] text-gray-400 font-semibold">Unit</span>
              <span className="col-span-1 text-[10px] text-gray-400 font-semibold">Type</span>
              <span className="col-span-2 text-[10px] text-gray-400 font-semibold">Male Min–Max</span>
              <span className="col-span-2 text-[10px] text-gray-400 font-semibold">Female Min–Max</span>
              <span className="col-span-2 text-[10px] text-gray-400 font-semibold">Display Text</span>
              <span className="col-span-1"></span>
            </div>

            <div className="space-y-2">
              {params.map((p, i) => (
                <div key={p.paramId || i} className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                  <div className="grid grid-cols-2 sm:grid-cols-12 gap-1.5">
                    <input value={p.name} onChange={(e) => updateParam(i, "name", e.target.value)}
                      placeholder="Parameter naam *"
                      className="col-span-2 sm:col-span-3 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white" />
                    <input value={p.unit} onChange={(e) => updateParam(i, "unit", e.target.value)}
                      placeholder="Unit"
                      className="col-span-1 sm:col-span-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white" />
                    <select value={p.type} onChange={(e) => updateParam(i, "type", e.target.value)}
                      className="col-span-1 sm:col-span-1 border border-gray-200 rounded-lg px-1.5 py-1.5 text-xs focus:outline-none bg-white">
                      <option value="numeric">Number</option>
                      <option value="text">Text</option>
                    </select>
                    {p.type === "numeric" ? (
                      <>
                        <div className="col-span-1 sm:col-span-2 flex gap-1">
                          <input type="number" value={p.refMaleMin} onChange={(e) => updateParam(i, "refMaleMin", e.target.value)}
                            placeholder="Min" className="w-1/2 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none bg-white" />
                          <input type="number" value={p.refMaleMax} onChange={(e) => updateParam(i, "refMaleMax", e.target.value)}
                            placeholder="Max" className="w-1/2 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none bg-white" />
                        </div>
                        <div className="col-span-1 sm:col-span-2 flex gap-1">
                          <input type="number" value={p.refFemaleMin} onChange={(e) => updateParam(i, "refFemaleMin", e.target.value)}
                            placeholder="Min" className="w-1/2 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none bg-white" />
                          <input type="number" value={p.refFemaleMax} onChange={(e) => updateParam(i, "refFemaleMax", e.target.value)}
                            placeholder="Max" className="w-1/2 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none bg-white" />
                        </div>
                      </>
                    ) : (
                      <div className="col-span-2 sm:col-span-4" />
                    )}
                    <input value={p.refRangeText} onChange={(e) => updateParam(i, "refRangeText", e.target.value)}
                      placeholder="Display text"
                      className="col-span-1 sm:col-span-2 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white" />
                    <button onClick={() => removeParam(i)}
                      className="col-span-1 text-red-400 hover:text-red-600 text-xs font-bold flex items-center justify-center">✕</button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addParam} className="mt-2 w-full border-2 border-dashed border-purple-200 text-purple-500 text-xs font-semibold py-2.5 rounded-xl hover:bg-purple-50 transition">
              + Parameter Add Karein
            </button>
          </div>

          {err && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{err}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">Cancel</button>
            <button onClick={save} disabled={saving}
              className="flex-1 py-3 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 transition disabled:opacity-50">
              {saving ? "Saving..." : isEdit ? "Update Template" : "Template Save Karein"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── REPORT FORM MODAL ─────────────────────────────────────────────────────────
function ReportFormModal({ hospitalId, templates, report, onClose, onSaved }: { hospitalId: string; templates: any[]; report?: any; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!report;

  const [selectedTemplateId, setSelectedTemplateId] = useState(report?.templateId || "");
  const [patientName,   setPatientName]   = useState(report?.patientName   || "");
  const [patientAge,    setPatientAge]    = useState(String(report?.patientAge  || ""));
  const [patientGender, setPatientGender] = useState(report?.patientGender || "male");
  const [patientMobile, setPatientMobile] = useState(report?.patientMobile || "");
  const [patientRefId,  setPatientRefId]  = useState(report?.patientRefId  || "");
  const [techName,      setTechName]      = useState(report?.technicianName || "");
  const [doctorName,    setDoctorName]    = useState(report?.doctorName     || "");
  const [labName,       setLabName]       = useState(report?.labName        || "");
  const [collDate,      setCollDate]      = useState(report?.collectionDate ? new Date(report.collectionDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
  const [repDate,       setRepDate]       = useState(report?.reportDate     ? new Date(report.reportDate).toISOString().split("T")[0]     : new Date().toISOString().split("T")[0]);
  const [results,       setResults]       = useState<any[]>(report?.results || []);
  const [status,        setStatus]        = useState(report?.status || "draft");

  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  // Auto-load template parameters when template selected
  useEffect(() => {
    if (!selectedTemplateId || isEdit) return;
    const tmpl = templates.find((t) => t._id === selectedTemplateId);
    if (!tmpl) return;
    setResults((tmpl.parameters || []).map((p: any) => ({
      paramId: p.paramId, name: p.name, value: "", unit: p.unit || "",
      refRangeText: p.refRangeText || "", flag: "", type: p.type || "numeric",
      _refMaleMin: p.refMaleMin, _refMaleMax: p.refMaleMax,
      _refFemaleMin: p.refFemaleMin, _refFemaleMax: p.refFemaleMax,
    })));
  }, [selectedTemplateId]);

  function updateResult(i: number, val: string) {
    setResults((prev) => prev.map((r, idx) => {
      if (idx !== i) return r;
      let flag = "";
      if (r.type === "numeric" && val !== "") {
        const num = parseFloat(val);
        const min = patientGender === "female" ? r._refFemaleMin : r._refMaleMin;
        const max = patientGender === "female" ? r._refFemaleMax : r._refMaleMax;
        if (!isNaN(num)) {
          if (min !== undefined && num < min) flag = "L";
          else if (max !== undefined && num > max) flag = "H";
          else if (min !== undefined || max !== undefined) flag = "N";
        }
      }
      return { ...r, value: val, flag };
    }));
  }

  const selectedTemplate = templates.find((t) => t._id === selectedTemplateId);

  async function save() {
    if (!patientName.trim()) { setErr("Patient naam zaruri hai"); return; }
    if (!selectedTemplateId && !isEdit) { setErr("Template select karein"); return; }
    setSaving(true); setErr("");
    try {
      const tmplName = selectedTemplate?.name || report?.templateName || "";
      const body: any = {
        ...(isEdit ? { id: report._id } : { hospitalId, templateId: selectedTemplateId, templateName: tmplName, category: selectedTemplate?.category || report?.category }),
        patientName: patientName.trim(), patientAge: Number(patientAge) || undefined,
        patientGender, patientMobile, patientRefId,
        results: results.map((r) => ({
          paramId: r.paramId, name: r.name, value: r.value,
          unit: r.unit, refRangeText: r.refRangeText, flag: r.flag, type: r.type,
        })),
        technicianName: techName, doctorName, labName,
        collectionDate: collDate, reportDate: repDate, status,
      };
      const res = await fetch("/api/hospital/lab-reports", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) onSaved();
      else setErr(data.message);
    } catch { setErr("Network error"); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
          <h3 className="font-bold text-gray-800">{isEdit ? "Report Edit Karein" : "Naya Lab Report"}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center">✕</button>
        </div>
        <div className="p-5 space-y-5">

          {/* Template select */}
          {!isEdit && (
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">Test Template Select Karein *</label>
              <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} className={hSel}>
                <option value="">-- Template chunein --</option>
                {templates.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
          )}
          {isEdit && <p className="text-sm font-bold text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5">🧪 {report.templateName}</p>}

          {/* Patient info */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Patient Information</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <input value={patientName} onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Patient ka naam *" className={hInp} />
              </div>
              <input type="number" value={patientAge} onChange={(e) => setPatientAge(e.target.value)}
                placeholder="Age" min={1} max={120} className={hInp} />
              <select value={patientGender} onChange={(e) => setPatientGender(e.target.value)} className={hSel}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <input value={patientMobile} onChange={(e) => setPatientMobile(e.target.value)}
                placeholder="Mobile (optional)" className={hInp} />
              <input value={patientRefId} onChange={(e) => setPatientRefId(e.target.value)}
                placeholder="Ref / Member ID (optional)" className={hInp} />
            </div>
          </div>

          {/* Results entry */}
          {(results.length > 0 || (isEdit && report?.results?.length > 0)) && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Test Results Bharein</p>
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div key={r.paramId || i} className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                    r.flag === "H" ? "bg-red-50 border-red-100" :
                    r.flag === "L" ? "bg-blue-50 border-blue-100" :
                    r.flag === "N" ? "bg-green-50 border-green-100" : "bg-gray-50 border-gray-100"
                  }`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700">{r.name}</p>
                      {r.refRangeText && <p className="text-[10px] text-gray-400">Ref: {r.refRangeText}</p>}
                    </div>
                    <input
                      value={r.value}
                      onChange={(e) => updateResult(i, e.target.value)}
                      placeholder="Value"
                      className="w-24 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
                    />
                    <span className="text-xs text-gray-400 w-10 text-center">{r.unit}</span>
                    {r.flag && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex-shrink-0 ${
                        r.flag === "H" ? "bg-red-100 text-red-700 border-red-200" :
                        r.flag === "L" ? "bg-blue-100 text-blue-700 border-blue-200" :
                        "bg-green-100 text-green-700 border-green-200"
                      }`}>{r.flag === "H" ? "↑H" : r.flag === "L" ? "↓L" : "✓N"}</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-2">* H = High (lal), L = Low (neela), N = Normal (hara) — Gender ke anusar auto-calculate hota hai</p>
            </div>
          )}

          {/* Meta info */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Report Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Collection Date</label>
                <input type="date" value={collDate} onChange={(e) => setCollDate(e.target.value)} className={hInp} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Report Date</label>
                <input type="date" value={repDate} onChange={(e) => setRepDate(e.target.value)} className={hInp} />
              </div>
              <input value={techName} onChange={(e) => setTechName(e.target.value)}
                placeholder="Lab Technician naam" className={hInp} />
              <input value={doctorName} onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Referring Doctor naam" className={hInp} />
              <input value={labName} onChange={(e) => setLabName(e.target.value)}
                placeholder="Lab / Department naam" className={`${hInp} col-span-2`} />
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 block mb-1">Status</label>
                <div className="flex gap-2">
                  {["draft","final"].map((s) => (
                    <button key={s} onClick={() => setStatus(s)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${status === s ? "bg-purple-600 text-white border-purple-600" : "border-gray-200 text-gray-500 hover:border-purple-300"}`}>
                      {s === "draft" ? "⏳ Draft (abhi save karein)" : "✓ Final (print ke liye ready)"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {err && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{err}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm">Cancel</button>
            <button onClick={save} disabled={saving}
              className="flex-1 py-3 rounded-xl bg-teal-600 text-white font-bold text-sm hover:bg-teal-700 transition disabled:opacity-50">
              {saving ? "Saving..." : isEdit ? "Report Update Karein" : "Report Save Karein"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── MAIN HOSPITAL DASHBOARD ───────────────────────────────────────────────────
export default function HospitalDashboard() {
  const router = useRouter();

  const [hospitalId, setHospitalId] = useState("");
  const [hospital,   setHospital]   = useState<Hospital | null>(null);
  const [doctors,    setDoctors]    = useState<Doctor[]>([]);
  const [labTests,   setLabTests]   = useState<LabTest[]>([]);
  const [surgeries,  setSurgeries]  = useState<SurgeryPkg[]>([]);
  const [stats,      setStats]      = useState({ doctorCount:0, labTestCount:0, surgeryCount:0, totalBookings:0 });
  const [tab,        setTab]        = useState<Tab>("overview");
  const [loading,    setLoading]    = useState(true);
  const [deleting,   setDeleting]   = useState<string | null>(null);
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null);
  const [bFilter,    setBFilter]    = useState<{ search?: string; type?: string; doctorId?: string; label?: string }>({});

  function viewBookings(opts: { search?: string; type?: string; doctorId?: string; label?: string }) {
    setBFilter(opts);
    setTab("bookings");
  }

  // Modal states
  const [doctorModal,  setDoctorModal]  = useState<{ mode: "add" | "edit"; item?: Doctor } | null>(null);
  const [labModal,     setLabModal]     = useState<{ mode: "add" | "edit"; item?: LabTest } | null>(null);
  const [surgeryModal, setSurgeryModal] = useState<{ mode: "add" | "edit"; item?: SurgeryPkg } | null>(null);
  const [profileModal, setProfileModal] = useState(false);

  function showToast(msg: string, ok = true) { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); }

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const hid  = localStorage.getItem("hospitalMongoId");
    if (!hid || role !== "hospital") { router.replace("/login"); return; }
    setHospitalId(hid);
  }, []);

  useEffect(() => { if (hospitalId) fetchOverview(); }, [hospitalId]);

  async function fetchOverview() {
    setLoading(true);
    try {
      const res  = await fetch(`/api/hospital/overview?hospitalId=${hospitalId}`);
      const data = await res.json();
      if (data.success) { setHospital(data.hospital); setDoctors(data.doctors); setLabTests(data.labTests); setSurgeries(data.surgeryPackages); setStats(data.stats); }
    } finally { setLoading(false); }
  }

  async function deleteItem(type: "doctor" | "lab" | "surgery", id: string) {
    if (!confirm("Remove karein?")) return;
    setDeleting(id);
    const urlMap = { doctor: "/api/hospital/doctors", lab: "/api/hospital/lab-tests", surgery: "/api/hospital/surgery-packages" };
    const keyMap = { doctor: "doctorId", lab: "testId", surgery: "packageId" };
    await fetch(urlMap[type], { method:"DELETE", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ [keyMap[type]]: id, hospitalId }) });
    if (type === "doctor")  setDoctors((p)   => p.filter((x) => x._id !== id));
    if (type === "lab")     setLabTests((p)  => p.filter((x) => x._id !== id));
    if (type === "surgery") setSurgeries((p) => p.filter((x) => x._id !== id));
    setDeleting(null);
    showToast("Delete ho gaya!");
  }

  function logout() {
    ["userId","userRole","userName","hospitalId","hospitalMongoId","hospitalName"].forEach((k) => localStorage.removeItem(k));
    router.push("/login");
  }

  const TABS = [
    { key:"overview",  label:"Overview",    icon:"🏥" },
    { key:"bookings",  label:"Bookings",    icon:"📋" },
    { key:"earnings",  label:"Earnings",    icon:"💰" },
    { key:"doctors",   label:"Doctors",     icon:"👨‍⚕️" },
    { key:"lab",       label:"Lab Tests",   icon:"🧪" },
    { key:"surgery",   label:"Surgery",     icon:"🔬" },
    { key:"reports",   label:"Reports",     icon:"🗂️" },
    { key:"labManage", label:"Lab Reports", icon:"📊" },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toasts */}
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      {/* Modals */}
      {doctorModal && (
        <DoctorFormModal hospitalId={hospitalId} doctor={doctorModal.item}
          hospitalAddress={hospital ? { district: hospital.address?.district || "", city: hospital.address?.city || "" } : undefined}
          onClose={() => setDoctorModal(null)}
          onSaved={() => { setDoctorModal(null); fetchOverview(); showToast(doctorModal.mode === "add" ? "Doctor add ho gaya!" : "Doctor update ho gaya!"); }}
        />
      )}
      {labModal && (
        <LabFormModal hospitalId={hospitalId} labTest={labModal.item}
          hospitalAddress={hospital ? { district: hospital.address?.district, city: hospital.address?.city } : undefined}
          onClose={() => setLabModal(null)}
          onSaved={() => { setLabModal(null); fetchOverview(); showToast(labModal.mode === "add" ? "Lab test add ho gaya!" : "Lab test update ho gaya!"); }}
        />
      )}
      {surgeryModal && (
        <SurgeryFormModal hospitalId={hospitalId} pkg={surgeryModal.item}
          onClose={() => setSurgeryModal(null)}
          onSaved={() => { setSurgeryModal(null); fetchOverview(); showToast(surgeryModal.mode === "add" ? "Package add ho gaya!" : "Package update ho gaya!"); }}
        />
      )}
      {profileModal && hospital && (
        <ProfileEditModal hospital={hospital}
          onClose={() => setProfileModal(false)}
          onSaved={(h) => { setHospital(h); setProfileModal(false); showToast("Profile update ho gaya!"); }}
        />
      )}

      {/* ── Header ── */}
      <header className="bg-gradient-to-r from-purple-800 to-purple-700 text-white sticky top-0 z-20 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-white text-lg">
              {hospital?.name?.charAt(0) || "H"}
            </div>
            <div>
              <p className="font-bold text-white leading-tight">{hospital?.name || "Hospital Dashboard"}</p>
              <p className="text-xs text-purple-200">{[hospital?.address?.district, hospital?.address?.city].filter(Boolean).join(", ") || "Loading..."}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hospital?.isVerified
              ? <span className="hidden sm:flex items-center gap-1 text-xs bg-green-500/20 border border-green-400/30 text-green-200 px-3 py-1.5 rounded-full font-medium"><span className="w-1.5 h-1.5 bg-green-400 rounded-full" />Verified</span>
              : <span className="hidden sm:flex text-xs bg-amber-500/20 border border-amber-400/30 text-amber-200 px-3 py-1.5 rounded-full font-medium">⏳ Pending</span>
            }
            <button onClick={() => setProfileModal(true)} className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl transition font-medium">✏️ Edit</button>
            <button onClick={logout} className="text-xs bg-white/10 hover:bg-red-500/40 text-white px-3 py-1.5 rounded-xl transition">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label:"Total Doctors",    value: stats.doctorCount,   icon:"👨‍⚕️", color:"from-blue-500 to-cyan-500",    tab:"doctors"  as Tab },
            { label:"Lab Tests",        value: stats.labTestCount,  icon:"🧪",   color:"from-orange-500 to-amber-400", tab:"lab"      as Tab },
            { label:"Surgery Packages", value: stats.surgeryCount,  icon:"🔬",   color:"from-purple-500 to-violet-400",tab:"surgery"  as Tab },
            { label:"Total Bookings",   value: stats.totalBookings, icon:"📋",   color:"from-teal-500 to-emerald-400", tab:"bookings" as Tab },
          ].map((s) => (
            <button key={s.label} onClick={() => setTab(s.tab)}
              className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow-sm text-left hover:opacity-90 transition`}>
              <p className="text-2xl">{s.icon}</p>
              <p className="text-3xl font-bold mt-1">{loading ? "—" : s.value}</p>
              <p className="text-xs opacity-80 mt-0.5">{s.label}</p>
            </button>
          ))}
        </div>

        {/* ── Tab Nav ── */}
        <div className="flex bg-white rounded-2xl border border-gray-200 p-1 gap-1 overflow-x-auto shadow-sm">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                tab === t.key ? "bg-purple-600 text-white shadow-sm" : "text-gray-600 hover:bg-purple-50 hover:text-purple-700"
              }`}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {tab === "overview" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 px-5 py-4 flex items-center justify-between border-b border-purple-100">
                <h3 className="font-bold text-gray-800">Hospital Information</h3>
                <button onClick={() => setProfileModal(true)} className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-xl transition font-semibold">✏️ Edit Profile</button>
              </div>
              {loading ? <div className="p-5 space-y-3">{[1,2,3].map((i) => <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />)}</div> : hospital ? (
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  {[
                    ["🏥 Naam",            hospital.name],
                    ["🏷️ Type",            hospital.type || "—"],
                    ["📱 Mobile",          hospital.mobile || "—"],
                    ["📧 Email",           hospital.email || "—"],
                    ["📍 District",        hospital.address?.district || "—"],
                    ["🏙️ City",            hospital.address?.city || "—"],
                    ["👤 Owner",           hospital.ownerName || "—"],
                    ["📋 Reg. No.",        hospital.registrationNo || "—"],
                    ["🏷️ Hospital ID",     hospital.hospitalId || "—"],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="flex flex-col gap-0.5">
                      <span className="text-xs text-gray-400">{k}</span>
                      <span className="text-gray-700 font-medium truncate">{v}</span>
                    </div>
                  ))}
                  {(hospital.departments || []).length > 0 && (
                    <div className="col-span-full flex flex-col gap-1">
                      <span className="text-xs text-gray-400">🏥 Departments</span>
                      <div className="flex flex-wrap gap-1.5">
                        {hospital.departments!.map((d) => <span key={d} className="text-xs bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-0.5 rounded-full">{d}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
              {hospital && !hospital.isVerified && (
                <div className="mx-5 mb-5 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 flex items-center gap-2">
                  ⚠️ Hospital abhi verified nahi hai. Admin se contact karein verification ke liye.
                </div>
              )}
            </div>

            {/* Quick action buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label:"Doctor Jodein",  icon:"👨‍⚕️", color:"bg-blue-600 hover:bg-blue-700",     action: () => setDoctorModal({ mode:"add" }) },
                { label:"Lab Test Jodein",icon:"🧪",   color:"bg-orange-500 hover:bg-orange-600", action: () => setLabModal({ mode:"add" }) },
                { label:"Surgery Package",icon:"🔬",   color:"bg-purple-600 hover:bg-purple-700", action: () => setSurgeryModal({ mode:"add" }) },
                { label:"Aaj ki Bookings",icon:"📅",   color:"bg-teal-600 hover:bg-teal-700",     action: () => setTab("bookings") },
                { label:"Earnings & Ledger",icon:"💰", color:"bg-emerald-600 hover:bg-emerald-700", action: () => setTab("earnings") },
              ].map((a) => (
                <button key={a.label} onClick={a.action}
                  className={`${a.color} text-white rounded-2xl p-4 text-left shadow-sm transition`}>
                  <p className="text-2xl mb-2">{a.icon}</p>
                  <p className="text-sm font-semibold">{a.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Bookings Tab ── */}
        {tab === "bookings" && <BookingsTab key={`${bFilter.search}|${bFilter.type}|${bFilter.doctorId}`} hospitalId={hospitalId} initialSearch={bFilter.search || ""} initialType={bFilter.type || "all"} initialDoctorId={bFilter.doctorId || ""} filterLabel={bFilter.label || ""} />}

        {/* ── Earnings Tab ── */}
        {tab === "earnings" && <EarningsTab hospitalId={hospitalId} />}

        {/* ── Doctors Tab ── */}
        {tab === "doctors" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="font-bold text-gray-800 text-lg">👨‍⚕️ Doctors ({doctors.length})</h3>
              <button onClick={() => setDoctorModal({ mode:"add" })} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2.5 rounded-xl transition flex items-center gap-2 font-semibold">+ Doctor Jodein</button>
            </div>
            {loading ? <Spinner color="blue" /> : doctors.length === 0 ? <EmptyCard icon="👨‍⚕️" msg="Koi doctor nahi hai. Pehla doctor jodein!" /> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {doctors.map((d) => (
                  <div key={d._id} className={`bg-white rounded-2xl border p-4 shadow-sm ${!d.isActive ? "opacity-60 border-gray-200" : "border-gray-100"}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-700 font-bold flex items-center justify-center text-lg flex-shrink-0">
                        {d.photo ? <img src={d.photo} className="w-full h-full rounded-xl object-cover" /> : d.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-gray-800 text-sm">{d.name}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${d.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{d.isActive ? "Active" : "Inactive"}</span>
                          {d.isAvailable !== undefined && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${d.isAvailable ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500"}`}>{d.isAvailable ? "Available" : "Unavailable"}</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{d.department}{d.speciality ? ` · ${d.speciality}` : ""}</p>
                        <p className="text-sm font-semibold text-blue-700 mt-1">OPD: ₹{d.opdFee}{d.offerFee && d.offerFee < d.opdFee ? ` → ₹${d.offerFee}` : ""}</p>
                        {d.experience ? <p className="text-xs text-gray-400">{d.experience} yrs experience</p> : null}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                      <button onClick={() => viewBookings({ doctorId: d._id, label: `Dr. ${d.name}` })} className="flex-1 text-xs text-teal-600 hover:bg-teal-50 py-2 rounded-xl transition border border-teal-100 font-semibold">📋 Bookings</button>
                      <button onClick={() => setDoctorModal({ mode:"edit", item: d })} className="flex-1 text-xs text-blue-600 hover:bg-blue-50 py-2 rounded-xl transition border border-blue-100 font-semibold">✏️ Edit</button>
                      <button onClick={() => deleteItem("doctor", d._id)} disabled={deleting === d._id} className="text-xs text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition disabled:opacity-50">🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Lab Tests Tab ── */}
        {tab === "lab" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="font-bold text-gray-800 text-lg">🧪 Lab Tests ({labTests.length})</h3>
              <button onClick={() => setLabModal({ mode:"add" })} className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2.5 rounded-xl transition flex items-center gap-2 font-semibold">+ Test Jodein</button>
            </div>
            {loading ? <Spinner color="orange" /> : labTests.length === 0 ? <EmptyCard icon="🧪" msg="Koi lab test nahi. Pehla test jodein!" /> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {labTests.map((t) => (
                  <div key={t._id} className={`bg-white rounded-2xl border p-4 shadow-sm ${!t.isActive ? "opacity-60 border-gray-200" : "border-gray-100"}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 text-orange-600 font-bold flex items-center justify-center text-xl flex-shrink-0">🧪</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-gray-800 text-sm">{t.name}</p>
                          {!t.isActive && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Inactive</span>}
                          {t.homeCollection && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Home</span>}
                          {t.fastingRequired && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Fasting</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{t.category}{t.turnaroundTime ? ` · ${t.turnaroundTime}` : ""}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400 line-through">₹{t.mrp}</span>
                          <span className="text-sm font-bold text-orange-600">₹{t.offerPrice}</span>
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">{Math.round(((t.mrp-t.offerPrice)/t.mrp)*100)}% off</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                      <button onClick={() => viewBookings({ type: "Lab", label: "Lab Bookings" })} className="flex-1 text-xs text-teal-600 hover:bg-teal-50 py-2 rounded-xl transition border border-teal-100 font-semibold">📋 Bookings</button>
                      <button onClick={() => setLabModal({ mode:"edit", item: t })} className="flex-1 text-xs text-orange-600 hover:bg-orange-50 py-2 rounded-xl transition border border-orange-100 font-semibold">✏️ Edit</button>
                      <button onClick={() => deleteItem("lab", t._id)} disabled={deleting === t._id} className="text-xs text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition disabled:opacity-50">🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Surgery Tab ── */}
        {tab === "surgery" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="font-bold text-gray-800 text-lg">🔬 Surgery Packages ({surgeries.length})</h3>
              <button onClick={() => setSurgeryModal({ mode:"add" })} className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2.5 rounded-xl transition flex items-center gap-2 font-semibold">+ Package Jodein</button>
            </div>
            {loading ? <Spinner color="purple" /> : surgeries.length === 0 ? <EmptyCard icon="🔬" msg="Koi surgery package nahi. Pehla package jodein!" /> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {surgeries.map((s) => (
                  <div key={s._id} className={`bg-white rounded-2xl border p-4 shadow-sm ${!s.isActive ? "opacity-60 border-gray-200" : "border-gray-100"}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 text-purple-600 font-bold flex items-center justify-center text-xl flex-shrink-0">🔬</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-gray-800 text-sm">{s.name}</p>
                          {!s.isActive && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Inactive</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{s.category}{s.stayDays ? ` · ${s.stayDays} day stay` : ""}{s.surgeonName ? ` · ${s.surgeonName}` : ""}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400 line-through">₹{s.mrp.toLocaleString()}</span>
                          <span className="text-sm font-bold text-purple-700">₹{s.offerPrice.toLocaleString()}</span>
                          {s.mrp > s.offerPrice && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">{Math.round(((s.mrp-s.offerPrice)/s.mrp)*100)}% off</span>}
                        </div>
                        {(s.inclusions || []).length > 0 && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-1">✅ {(s.inclusions || []).slice(0, 4).join(" · ")}{(s.inclusions || []).length > 4 ? "..." : ""}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                      <button onClick={() => viewBookings({ type: "Surgery", label: "Surgery Bookings" })} className="flex-1 text-xs text-teal-600 hover:bg-teal-50 py-2 rounded-xl transition border border-teal-100 font-semibold">📋 Bookings</button>
                      <button onClick={() => setSurgeryModal({ mode:"edit", item: s })} className="flex-1 text-xs text-purple-600 hover:bg-purple-50 py-2 rounded-xl transition border border-purple-100 font-semibold">✏️ Edit</button>
                      <button onClick={() => deleteItem("surgery", s._id)} disabled={deleting === s._id} className="text-xs text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition disabled:opacity-50">🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Reports Tab ── */}
        {tab === "reports" && <ReportsTab hospitalId={hospitalId} />}

        {/* ── Lab Reports Tab ── */}
        {tab === "labManage" && <LabManageTab hospitalId={hospitalId} />}

      </div>
    </div>
  );
}