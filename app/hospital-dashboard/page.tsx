"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// ───── Types ─────
type Hospital = {
  _id: string; name: string; address: { district?: string; city?: string };
  isVerified: boolean; isActive: boolean; type?: string; departments?: string[];
};
type Doctor = {
  _id: string; name: string; department: string; speciality?: string;
  mobile?: string; opdFee: number; photo?: string; isActive: boolean;
};
type LabTest = {
  _id: string; name: string; category: string; mrp: number; offerPrice: number;
  homeCollection: boolean; isActive: boolean;
};
type SurgeryPkg = {
  _id: string; name: string; category: string; mrp: number; offerPrice: number;
  stayDays: number; isActive: boolean;
};
type Stats = { doctorCount: number; labTestCount: number; surgeryCount: number; totalBookings: number };
type Report = {
  _id: string; reportId: string; title: string; category: string;
  fileUrl: string; fileType: string; notes?: string; reportDate: string;
  patientName: string; hospitalName: string;
};

const LAB_CATEGORIES = ["Blood Test","Urine Test","Stool Test","Imaging","ECG","X-Ray","Ultrasound","MRI","CT Scan","Pathology","Other"];

// ───── Form modals ─────
function DoctorModal({ hospitalId, onClose, onSaved }: { hospitalId: string; onClose: () => void; onSaved: (d: Doctor) => void }) {
  const [f, setF] = useState({ name:"", department:"", speciality:"", mobile:"", opdFee:"", experience:"", degrees:"" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    if (!f.name || !f.department || !f.opdFee) { setErr("Naam, Department aur OPD Fee zaruri hai"); return; }
    setSaving(true); setErr("");
    try {
      const res  = await fetch("/api/hospital/doctors", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalId, ...f, opdFee: Number(f.opdFee), experience: Number(f.experience),
          degrees: f.degrees ? f.degrees.split(",").map((s) => s.trim()).filter(Boolean) : [] }),
      });
      const data = await res.json();
      if (data.success) { onSaved(data.doctor); onClose(); }
      else setErr(data.message);
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
        <h3 className="font-bold text-gray-800 text-lg">Naya Doctor Jodein</h3>
        {err && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{err}</p>}
        {[
          { key:"name",       label:"Doctor ka Naam *",    type:"text"   },
          { key:"department", label:"Department *",        type:"text"   },
          { key:"speciality", label:"Speciality",          type:"text"   },
          { key:"mobile",     label:"Mobile No.",          type:"tel"    },
          { key:"opdFee",     label:"OPD Fee (₹) *",      type:"number" },
          { key:"experience", label:"Experience (years)",  type:"number" },
          { key:"degrees",    label:"Degrees (comma sep)", type:"text"   },
        ].map(({ key, label, type }) => (
          <div key={key}>
            <label className="text-xs text-gray-500 font-medium">{label}</label>
            <input type={type} value={(f as any)[key]}
              onChange={(e) => setF((p) => ({ ...p, [key]: e.target.value }))}
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-60">
            {saving ? "Saving..." : "Doctor Jodein"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LabTestModal({ hospitalId, onClose, onSaved }: { hospitalId: string; onClose: () => void; onSaved: (t: LabTest) => void }) {
  const [f, setF] = useState({ name:"", category:"Blood Test", mrp:"", offerPrice:"", sampleType:"", turnaroundTime:"Same Day", homeCollection:false });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    if (!f.name || !f.mrp || !f.offerPrice) { setErr("Naam, MRP aur Offer Price zaruri hai"); return; }
    setSaving(true); setErr("");
    try {
      const res  = await fetch("/api/hospital/lab-tests", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalId, ...f, mrp: Number(f.mrp), offerPrice: Number(f.offerPrice) }),
      });
      const data = await res.json();
      if (data.success) { onSaved(data.labTest); onClose(); }
      else setErr(data.message);
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
        <h3 className="font-bold text-gray-800 text-lg">Naya Lab Test Jodein</h3>
        {err && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{err}</p>}
        <div>
          <label className="text-xs text-gray-500 font-medium">Test ka Naam *</label>
          <input value={f.name} onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))}
            className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium">Category</label>
          <select value={f.category} onChange={(e) => setF((p) => ({ ...p, category: e.target.value }))}
            className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
            {LAB_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        {[
          { key:"mrp",           label:"MRP (₹) *",       type:"number" },
          { key:"offerPrice",    label:"Offer Price (₹)*", type:"number" },
          { key:"sampleType",    label:"Sample Type",      type:"text"   },
          { key:"turnaroundTime",label:"Report Time",      type:"text"   },
        ].map(({ key, label, type }) => (
          <div key={key}>
            <label className="text-xs text-gray-500 font-medium">{label}</label>
            <input type={type} value={(f as any)[key]}
              onChange={(e) => setF((p) => ({ ...p, [key]: e.target.value }))}
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
          </div>
        ))}
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={f.homeCollection}
            onChange={(e) => setF((p) => ({ ...p, homeCollection: e.target.checked }))}
            className="w-4 h-4 rounded" />
          Home Collection Available
        </label>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium disabled:opacity-60">
            {saving ? "Saving..." : "Test Jodein"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SurgeryModal({ hospitalId, onClose, onSaved }: { hospitalId: string; onClose: () => void; onSaved: (p: SurgeryPkg) => void }) {
  const [f, setF] = useState({ name:"", category:"General Surgery", mrp:"", offerPrice:"", stayDays:"1", surgeonName:"", surgeonExperience:"", description:"", inclusions:"" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    if (!f.name || !f.mrp || !f.offerPrice) { setErr("Naam, MRP aur Offer Price zaruri hai"); return; }
    setSaving(true); setErr("");
    try {
      const res  = await fetch("/api/hospital/surgery-packages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalId, ...f,
          mrp: Number(f.mrp), offerPrice: Number(f.offerPrice), stayDays: Number(f.stayDays),
          surgeonExperience: Number(f.surgeonExperience),
          inclusions: f.inclusions ? f.inclusions.split(",").map((s) => s.trim()).filter(Boolean) : [],
        }),
      });
      const data = await res.json();
      if (data.success) { onSaved(data.package); onClose(); }
      else setErr(data.message);
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 my-4">
        <h3 className="font-bold text-gray-800 text-lg">Naya Surgery Package Jodein</h3>
        {err && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{err}</p>}
        {[
          { key:"name",             label:"Package Naam *",      type:"text"   },
          { key:"category",         label:"Category",            type:"text"   },
          { key:"mrp",              label:"MRP (₹) *",          type:"number" },
          { key:"offerPrice",       label:"Offer Price (₹) *",  type:"number" },
          { key:"stayDays",         label:"Stay Days",           type:"number" },
          { key:"surgeonName",      label:"Surgeon ka Naam",     type:"text"   },
          { key:"surgeonExperience",label:"Surgeon Experience",  type:"number" },
          { key:"description",      label:"Description",         type:"text"   },
          { key:"inclusions",       label:"Inclusions (comma)",  type:"text"   },
        ].map(({ key, label, type }) => (
          <div key={key}>
            <label className="text-xs text-gray-500 font-medium">{label}</label>
            <input type={type} value={(f as any)[key]}
              onChange={(e) => setF((p) => ({ ...p, [key]: e.target.value }))}
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-medium disabled:opacity-60">
            {saving ? "Saving..." : "Package Jodein"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ───── Reports Tab ─────
const REPORT_CATEGORIES = ["Lab", "Radiology", "OPD", "Surgery", "Prescription", "Other"];

function ReportsTab({ hospitalId }: { hospitalId: string }) {
  const [reports, setReports]           = useState<Report[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showUpload, setShowUpload]     = useState(false);
  const [searchMobile, setSearchMobile] = useState("");
  const [filterMobile, setFilterMobile] = useState("");

  // Upload form state
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
    if (!patientMobile || !title || !file) {
      setErr("Patient mobile, title aur file zaruri hai"); return;
    }
    if (!/^\d{10}$/.test(patientMobile)) {
      setErr("Valid 10-digit mobile number daalo"); return;
    }
    setUploading(true); setErr("");
    try {
      // 1. Upload file to Cloudinary
      const fd = new FormData();
      fd.append("file", file);
      const upRes  = await fetch("/api/upload-report", { method: "POST", body: fd });
      const upData = await upRes.json();
      if (!upData.success) { setErr(upData.message); return; }

      // 2. Save report record
      const res  = await fetch("/api/hospital/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalId, patientMobile, title, category, notes, reportDate,
          fileUrl: upData.url, fileType: upData.fileType,
        }),
      });
      const data = await res.json();
      if (!data.success) { setErr(data.message); return; }

      setToast("Report upload ho gayi!");
      setTimeout(() => setToast(""), 3000);
      setShowUpload(false);
      setPatientMobile(""); setTitle(""); setNotes(""); setFile(null);
      setCategory("Lab");
      setReportDate(new Date().toISOString().split("T")[0]);
      if (fileRef.current) fileRef.current.value = "";
      fetchReports();
    } finally { setUploading(false); }
  }

  async function deleteReport(id: string) {
    if (!confirm("Is report ko delete karein?")) return;
    await fetch("/api/hospital/reports", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId: id }),
    });
    setReports((p) => p.filter((r) => r._id !== id));
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-gray-800">Lab Reports ({reports.length})</h3>
        <button onClick={() => { setShowUpload(true); setErr(""); }}
          className="bg-teal-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-teal-700 transition-colors flex items-center gap-2">
          + Report Upload Karein
        </button>
      </div>

      {/* Search by patient mobile */}
      <div className="flex gap-2">
        <input
          value={searchMobile}
          onChange={(e) => setSearchMobile(e.target.value)}
          placeholder="Patient mobile se search karein..."
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
        />
        <button onClick={() => setFilterMobile(searchMobile.trim())}
          className="px-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 hover:bg-gray-200 transition-colors">
          Search
        </button>
        {filterMobile && (
          <button onClick={() => { setFilterMobile(""); setSearchMobile(""); }}
            className="px-3 py-2 text-xs text-red-500 hover:bg-red-50 rounded-xl transition-colors">
            Clear
          </button>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-lg">Report Upload Karein</h3>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            {err && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{err}</p>}

            <div>
              <label className="text-xs text-gray-500 font-medium">Patient Mobile *</label>
              <div className="flex mt-1">
                <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-500">+91</span>
                <input type="tel" maxLength={10} value={patientMobile}
                  onChange={(e) => setPatientMobile(e.target.value.replace(/\D/g, ""))}
                  placeholder="10-digit mobile"
                  className="flex-1 border border-gray-200 rounded-r-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 font-medium">Report Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. CBC Blood Test, X-Ray Chest PA"
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-400">
                  {REPORT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Report Date</label>
                <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 font-medium">Notes (optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                placeholder="Doctor ka observation ya special notes..."
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-400 resize-none" />
            </div>

            <div>
              <label className="text-xs text-gray-500 font-medium">File (PDF / Image) *</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="mt-1 border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-colors">
                {file ? (
                  <div>
                    <p className="text-sm font-medium text-teal-700">✓ {file.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-2xl mb-1">📎</p>
                    <p className="text-sm text-gray-500">Click karke file choose karein</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — max 10 MB</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowUpload(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">
                Cancel
              </button>
              <button onClick={handleUpload} disabled={uploading}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
                {uploading ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Uploading...</>
                ) : "Report Save Karein"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => <div key={i} className="bg-white rounded-2xl h-16 animate-pulse" />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
          <p className="text-4xl mb-2">🗂️</p>
          <p className="text-gray-500 text-sm">Koi report nahi mili.</p>
          {filterMobile && <p className="text-xs text-gray-400 mt-1">Is mobile ke liye koi report nahi.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r._id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                r.fileType === "pdf" ? "bg-red-100" : "bg-blue-100"
              }`}>
                {r.fileType === "pdf" ? "📄" : "🖼️"}
              </div>
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
                <a href={r.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-teal-600 hover:bg-teal-50 px-3 py-1.5 rounded-lg transition-colors">
                  View
                </a>
                <button onClick={() => deleteReport(r._id)}
                  className="text-xs text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ───── Edit Modals ─────
function EditDoctorModal({ doctor, onClose, onSaved }: { doctor: Doctor; onClose: () => void; onSaved: (d: Doctor) => void }) {
  const [f, setF] = useState({
    name: doctor.name, department: doctor.department, speciality: doctor.speciality || "",
    mobile: doctor.mobile || "", opdFee: String(doctor.opdFee), isActive: doctor.isActive,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    if (!f.name || !f.department || !f.opdFee) { setErr("Naam, Department aur Fee zaruri hai"); return; }
    setSaving(true); setErr("");
    try {
      const res  = await fetch("/api/hospital/doctors", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: doctor._id, ...f, opdFee: Number(f.opdFee) }),
      });
      const data = await res.json();
      if (data.success) { onSaved(data.doctor); onClose(); }
      else setErr(data.message);
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
        <h3 className="font-bold text-gray-800 text-lg">Doctor Edit Karein</h3>
        {err && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{err}</p>}
        {[
          { key:"name",       label:"Doctor ka Naam *", type:"text"   },
          { key:"department", label:"Department *",      type:"text"   },
          { key:"speciality", label:"Speciality",        type:"text"   },
          { key:"mobile",     label:"Mobile No.",        type:"tel"    },
          { key:"opdFee",     label:"OPD Fee (₹) *",    type:"number" },
        ].map(({ key, label, type }) => (
          <div key={key}>
            <label className="text-xs text-gray-500 font-medium">{label}</label>
            <input type={type} value={(f as any)[key]}
              onChange={(e) => setF((p) => ({ ...p, [key]: e.target.value }))}
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
          </div>
        ))}
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={f.isActive} onChange={(e) => setF((p) => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 rounded" />
          Active (patients ko dikh raha hai)
        </label>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-60">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditLabModal({ test, onClose, onSaved }: { test: LabTest; onClose: () => void; onSaved: (t: LabTest) => void }) {
  const [f, setF] = useState({
    name: test.name, category: test.category, mrp: String(test.mrp),
    offerPrice: String(test.offerPrice), homeCollection: test.homeCollection, isActive: test.isActive,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    if (!f.name || !f.mrp || !f.offerPrice) { setErr("Naam, MRP aur Offer Price zaruri hai"); return; }
    setSaving(true); setErr("");
    try {
      const res  = await fetch("/api/hospital/lab-tests", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId: test._id, ...f, mrp: Number(f.mrp), offerPrice: Number(f.offerPrice) }),
      });
      const data = await res.json();
      if (data.success) { onSaved(data.labTest); onClose(); }
      else setErr(data.message);
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
        <h3 className="font-bold text-gray-800 text-lg">Lab Test Edit Karein</h3>
        {err && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{err}</p>}
        <div>
          <label className="text-xs text-gray-500 font-medium">Test ka Naam *</label>
          <input value={f.name} onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))}
            className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium">Category</label>
          <select value={f.category} onChange={(e) => setF((p) => ({ ...p, category: e.target.value }))}
            className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400">
            {LAB_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        {[
          { key:"mrp",        label:"MRP (₹) *",        type:"number" },
          { key:"offerPrice", label:"Offer Price (₹) *", type:"number" },
        ].map(({ key, label, type }) => (
          <div key={key}>
            <label className="text-xs text-gray-500 font-medium">{label}</label>
            <input type={type} value={(f as any)[key]} onChange={(e) => setF((p) => ({ ...p, [key]: e.target.value }))}
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
          </div>
        ))}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={f.homeCollection} onChange={(e) => setF((p) => ({ ...p, homeCollection: e.target.checked }))} className="w-4 h-4 rounded" />
            Home Collection
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={f.isActive} onChange={(e) => setF((p) => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 rounded" />
            Active
          </label>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium disabled:opacity-60">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditSurgeryModal({ pkg, onClose, onSaved }: { pkg: SurgeryPkg; onClose: () => void; onSaved: (p: SurgeryPkg) => void }) {
  const [f, setF] = useState({
    name: pkg.name, category: pkg.category, mrp: String(pkg.mrp),
    offerPrice: String(pkg.offerPrice), stayDays: String(pkg.stayDays), isActive: pkg.isActive,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    if (!f.name || !f.mrp || !f.offerPrice) { setErr("Naam, MRP aur Offer Price zaruri hai"); return; }
    setSaving(true); setErr("");
    try {
      const res  = await fetch("/api/hospital/surgery-packages", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg._id, ...f, mrp: Number(f.mrp), offerPrice: Number(f.offerPrice), stayDays: Number(f.stayDays) }),
      });
      const data = await res.json();
      if (data.success) { onSaved(data.package); onClose(); }
      else setErr(data.message);
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
        <h3 className="font-bold text-gray-800 text-lg">Surgery Package Edit Karein</h3>
        {err && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{err}</p>}
        {[
          { key:"name",       label:"Package Naam *",     type:"text"   },
          { key:"category",   label:"Category",            type:"text"   },
          { key:"mrp",        label:"MRP (₹) *",          type:"number" },
          { key:"offerPrice", label:"Offer Price (₹) *",  type:"number" },
          { key:"stayDays",   label:"Stay Days",           type:"number" },
        ].map(({ key, label, type }) => (
          <div key={key}>
            <label className="text-xs text-gray-500 font-medium">{label}</label>
            <input type={type} value={(f as any)[key]} onChange={(e) => setF((p) => ({ ...p, [key]: e.target.value }))}
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
          </div>
        ))}
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={f.isActive} onChange={(e) => setF((p) => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 rounded" />
          Active (patients ko dikh raha hai)
        </label>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-medium disabled:opacity-60">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ───── Main Page ─────
export default function HospitalDashboard() {
  const router = useRouter();
  const [hospitalId, setHospitalId] = useState("");
  const [hospital, setHospital]     = useState<Hospital | null>(null);
  const [doctors, setDoctors]       = useState<Doctor[]>([]);
  const [labTests, setLabTests]     = useState<LabTest[]>([]);
  const [surgeries, setSurgeries]   = useState<SurgeryPkg[]>([]);
  const [stats, setStats]           = useState<Stats>({ doctorCount:0, labTestCount:0, surgeryCount:0, totalBookings:0 });
  const [tab, setTab]               = useState<"overview"|"doctors"|"lab"|"surgery"|"reports">("overview");
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState<"doctor"|"lab"|"surgery"|null>(null);
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [editDoctor, setEditDoctor] = useState<Doctor | null>(null);
  const [editLab, setEditLab]       = useState<LabTest | null>(null);
  const [editSurgery, setEditSurgery] = useState<SurgeryPkg | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    // hospitalMongoId = MongoDB _id of the Hospital document (saved by login page)
    const hid  = localStorage.getItem("hospitalMongoId");
    if (!hid || role !== "hospital") { router.replace("/login"); return; }
    setHospitalId(hid);
  }, []);

  useEffect(() => {
    if (!hospitalId) return;
    fetchOverview();
  }, [hospitalId]);

  async function fetchOverview() {
    setLoading(true);
    try {
      const res  = await fetch(`/api/hospital/overview?hospitalId=${hospitalId}`);
      const data = await res.json();
      if (data.success) {
        setHospital(data.hospital);
        setDoctors(data.doctors);
        setLabTests(data.labTests);
        setSurgeries(data.surgeryPackages);
        setStats(data.stats);
      }
    } finally { setLoading(false); }
  }

  async function deleteDoctor(id: string) {
    if (!confirm("Is doctor ko remove karein?")) return;
    setDeleting(id);
    await fetch("/api/hospital/doctors", { method:"DELETE", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ doctorId: id }) });
    setDoctors((p) => p.filter((d) => d._id !== id));
    setDeleting(null);
  }

  async function deleteLabTest(id: string) {
    if (!confirm("Is test ko remove karein?")) return;
    setDeleting(id);
    await fetch("/api/hospital/lab-tests", { method:"DELETE", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ testId: id }) });
    setLabTests((p) => p.filter((t) => t._id !== id));
    setDeleting(null);
  }

  async function deleteSurgery(id: string) {
    if (!confirm("Is package ko remove karein?")) return;
    setDeleting(id);
    await fetch("/api/hospital/surgery-packages", { method:"DELETE", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ packageId: id }) });
    setSurgeries((p) => p.filter((s) => s._id !== id));
    setDeleting(null);
  }

  function logout() {
    ["userId","userRole","userName","hospitalId","hospitalMongoId","hospitalName"].forEach((k) => localStorage.removeItem(k));
    router.push("/login");
  }

  const TABS = [
    { key:"overview", label:"Overview",  icon:"🏥" },
    { key:"doctors",  label:"Doctors",   icon:"👨‍⚕️" },
    { key:"lab",      label:"Lab Tests", icon:"🔬" },
    { key:"surgery",  label:"Surgery",   icon:"🏨" },
    { key:"reports",  label:"Reports",   icon:"🗂️" },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Add Modals */}
      {modal === "doctor"  && <DoctorModal  hospitalId={hospitalId} onClose={() => setModal(null)} onSaved={(d) => { setDoctors((p) => [d, ...p]); setStats((s) => ({...s, doctorCount: s.doctorCount+1})); }} />}
      {modal === "lab"     && <LabTestModal  hospitalId={hospitalId} onClose={() => setModal(null)} onSaved={(t) => { setLabTests((p) => [t, ...p]); setStats((s) => ({...s, labTestCount: s.labTestCount+1})); }} />}
      {modal === "surgery" && <SurgeryModal  hospitalId={hospitalId} onClose={() => setModal(null)} onSaved={(p) => { setSurgeries((prev) => [p, ...prev]); setStats((s) => ({...s, surgeryCount: s.surgeryCount+1})); }} />}
      {/* Edit Modals */}
      {editDoctor  && <EditDoctorModal  doctor={editDoctor}  onClose={() => setEditDoctor(null)}  onSaved={(d) => { setDoctors((p) => p.map((x) => x._id === d._id ? d : x)); setEditDoctor(null); }} />}
      {editLab     && <EditLabModal     test={editLab}       onClose={() => setEditLab(null)}     onSaved={(t) => { setLabTests((p) => p.map((x) => x._id === t._id ? t : x)); setEditLab(null); }} />}
      {editSurgery && <EditSurgeryModal pkg={editSurgery}   onClose={() => setEditSurgery(null)} onSaved={(p) => { setSurgeries((prev) => prev.map((x) => x._id === p._id ? p : x)); setEditSurgery(null); }} />}

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-800">{hospital?.name || "Hospital Dashboard"}</p>
            <p className="text-xs text-gray-500">{hospital?.address?.district}{hospital?.address?.city ? `, ${hospital.address.city}` : ""}</p>
          </div>
          <div className="flex items-center gap-3">
            {hospital && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${hospital.isVerified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                {hospital.isVerified ? "✓ Verified" : "Pending Verification"}
              </span>
            )}
            <button onClick={logout} className="text-xs text-gray-500 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label:"Doctors",       value: stats.doctorCount,  icon:"👨‍⚕️", color:"from-blue-500 to-cyan-500"    },
            { label:"Lab Tests",     value: stats.labTestCount, icon:"🔬",  color:"from-orange-500 to-amber-400" },
            { label:"Surgery Pkgs",  value: stats.surgeryCount, icon:"🏨",  color:"from-purple-500 to-violet-400" },
            { label:"Total Bookings",value: stats.totalBookings,icon:"📋",  color:"from-teal-500 to-emerald-400" },
          ].map((s) => (
            <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow-sm`}>
              <p className="text-2xl">{s.icon}</p>
              <p className="text-3xl font-bold mt-1">{loading ? "—" : s.value}</p>
              <p className="text-xs opacity-80 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tab nav */}
        <div className="flex bg-white rounded-2xl border border-gray-200 p-1 gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                tab === t.key ? "bg-purple-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
              }`}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* ── Overview tab ── */}
        {tab === "overview" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h3 className="font-bold text-gray-800">Hospital Information</h3>
            {hospital ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[
                  ["Naam",     hospital.name],
                  ["Type",     hospital.type || "—"],
                  ["District", hospital.address?.district || "—"],
                  ["City",     hospital.address?.city     || "—"],
                  ["Status",   hospital.isActive ? "Active" : "Inactive"],
                  ["Departments", (hospital.departments || []).join(", ") || "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col">
                    <span className="text-xs text-gray-400">{k}</span>
                    <span className="text-gray-700 font-medium">{v}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="animate-pulse space-y-2">
                {[1,2,3].map((i) => <div key={i} className="h-4 bg-gray-100 rounded" />)}
              </div>
            )}
            {hospital && !hospital.isVerified && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                ⚠️ Aapka hospital abhi verified nahi hai. Admin se contact karein verification ke liye.
              </div>
            )}
          </div>
        )}

        {/* ── Doctors tab ── */}
        {tab === "doctors" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Doctors ({doctors.length})</h3>
              <button onClick={() => setModal("doctor")}
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2">
                + Doctor Jodein
              </button>
            </div>
            {loading ? (
              <div className="space-y-3">{[1,2].map((i) => <div key={i} className="bg-white rounded-2xl h-16 animate-pulse" />)}</div>
            ) : doctors.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center">
                <p className="text-4xl mb-2">👨‍⚕️</p>
                <p className="text-gray-500 text-sm">Koi doctor nahi hai. Pehla doctor jodein!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {doctors.map((d) => (
                  <div key={d._id} className={`bg-white rounded-2xl border p-4 flex items-center gap-3 shadow-sm ${!d.isActive ? "opacity-60 border-gray-200" : "border-gray-100"}`}>
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shrink-0">
                      {d.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 text-sm">{d.name}</p>
                        {!d.isActive && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Inactive</span>}
                      </div>
                      <p className="text-xs text-gray-500">{d.department}{d.speciality ? ` · ${d.speciality}` : ""}</p>
                      <p className="text-xs text-teal-600 font-medium">OPD: ₹{d.opdFee}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => setEditDoctor(d)}
                        className="text-xs text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-blue-100">
                        Edit
                      </button>
                      <button onClick={() => deleteDoctor(d._id)} disabled={deleting === d._id}
                        className="text-xs text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                        {deleting === d._id ? "..." : "Hatao"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Lab Tests tab ── */}
        {tab === "lab" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Lab Tests ({labTests.length})</h3>
              <button onClick={() => setModal("lab")}
                className="bg-orange-500 text-white text-sm px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors">
                + Test Jodein
              </button>
            </div>
            {loading ? (
              <div className="space-y-3">{[1,2].map((i) => <div key={i} className="bg-white rounded-2xl h-16 animate-pulse" />)}</div>
            ) : labTests.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center">
                <p className="text-4xl mb-2">🔬</p>
                <p className="text-gray-500 text-sm">Koi lab test nahi. Pehla test jodein!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {labTests.map((t) => (
                  <div key={t._id} className={`bg-white rounded-2xl border p-4 flex items-center gap-3 shadow-sm ${!t.isActive ? "opacity-60 border-gray-200" : "border-gray-100"}`}>
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-lg shrink-0">
                      🔬
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                        {!t.isActive && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Inactive</span>}
                        {t.homeCollection && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Home</span>}
                      </div>
                      <p className="text-xs text-gray-500">{t.category}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400 line-through">₹{t.mrp}</span>
                        <span className="text-xs text-orange-600 font-semibold">₹{t.offerPrice}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => setEditLab(t)}
                        className="text-xs text-orange-600 hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-colors border border-orange-100">
                        Edit
                      </button>
                      <button onClick={() => deleteLabTest(t._id)} disabled={deleting === t._id}
                        className="text-xs text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                        {deleting === t._id ? "..." : "Hatao"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Reports tab ── */}
        {tab === "reports" && <ReportsTab hospitalId={hospitalId} />}

        {/* ── Surgery tab ── */}
        {tab === "surgery" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Surgery Packages ({surgeries.length})</h3>
              <button onClick={() => setModal("surgery")}
                className="bg-purple-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors">
                + Package Jodein
              </button>
            </div>
            {loading ? (
              <div className="space-y-3">{[1,2].map((i) => <div key={i} className="bg-white rounded-2xl h-16 animate-pulse" />)}</div>
            ) : surgeries.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center">
                <p className="text-4xl mb-2">🏨</p>
                <p className="text-gray-500 text-sm">Koi surgery package nahi. Pehla package jodein!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {surgeries.map((s) => (
                  <div key={s._id} className={`bg-white rounded-2xl border p-4 flex items-center gap-3 shadow-sm ${!s.isActive ? "opacity-60 border-gray-200" : "border-gray-100"}`}>
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 font-bold flex items-center justify-center text-lg shrink-0">
                      🏨
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 text-sm">{s.name}</p>
                        {!s.isActive && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Inactive</span>}
                      </div>
                      <p className="text-xs text-gray-500">{s.category} · {s.stayDays} day stay</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400 line-through">₹{s.mrp}</span>
                        <span className="text-xs text-purple-600 font-semibold">₹{s.offerPrice}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => setEditSurgery(s)}
                        className="text-xs text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors border border-purple-100">
                        Edit
                      </button>
                      <button onClick={() => deleteSurgery(s._id)} disabled={deleting === s._id}
                        className="text-xs text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                        {deleting === s._id ? "..." : "Hatao"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
