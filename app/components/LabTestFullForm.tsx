"use client";
import { useState } from "react";

// ── Lab test catalog organized by department ────────────────────────────────

export const LAB_CATALOG: Record<string, string[]> = {
  "Haematology": [
    "CBC (Complete Blood Count)","Haemoglobin (Hb)","PCV (Packed Cell Volume)",
    "RBC Count","WBC Count","Platelet Count","ESR (Erythrocyte Sedimentation Rate)",
    "Peripheral Blood Smear","Reticulocyte Count","Bleeding Time / Clotting Time",
    "Prothrombin Time (PT/INR)","APTT","D-Dimer","Fibrinogen",
  ],
  "Biochemistry": [
    "Blood Sugar Fasting","Blood Sugar PP (Post Prandial)","Blood Sugar Random",
    "HbA1c (Glycated Haemoglobin)","LFT (Liver Function Test)",
    "KFT (Kidney Function Test)","Uric Acid","Serum Creatinine","Serum Urea","BUN",
    "Lipid Profile","Total Cholesterol","HDL","LDL","VLDL","Triglycerides",
    "SGPT (ALT)","SGOT (AST)","ALP (Alkaline Phosphatase)","GGT","Total Bilirubin",
    "Direct Bilirubin","Indirect Bilirubin","Total Protein","Albumin","Globulin",
    "Serum Calcium","Serum Phosphorus","Serum Sodium","Serum Potassium","Serum Chloride",
    "Serum Magnesium","Iron Studies","TIBC","Serum Ferritin","Amylase","Lipase",
    "CRP (C-Reactive Protein)","CK-MB","Troponin I","Troponin T","LDH","CPK",
  ],
  "Serology / Microbiology": [
    "HIV 1 & 2 (Elisa)","HBsAg (Hepatitis B)","Anti-HCV (Hepatitis C)",
    "VDRL (Syphilis)","Widal Test","Dengue NS1 Antigen","Dengue IgG/IgM",
    "Malaria Antigen (RDT)","Typhoid IgM (Typhidot)","Scrub Typhus IgM",
    "Leptospira IgM","H. pylori Antigen","H. pylori IgG","ASO Titre",
    "RA Factor","ANA (Antinuclear Antibody)","Anti-dsDNA","CRP (Quantitative)",
    "Blood Culture & Sensitivity","Urine Culture & Sensitivity",
    "Sputum Culture & Sensitivity","Throat Swab Culture",
  ],
  "Thyroid & Hormones": [
    "TSH (Thyroid Stimulating Hormone)","T3 (Triiodothyronine)","T4 (Thyroxine)",
    "Free T3","Free T4","Anti-TPO Antibody","Anti-Thyroglobulin",
    "Prolactin","FSH","LH","Testosterone (Total)","Testosterone (Free)",
    "DHEA-S","Cortisol (Fasting)","Insulin (Fasting)","HOMA-IR",
    "Progesterone","Estradiol (E2)","AMH (Anti-Müllerian Hormone)","Beta hCG",
    "Growth Hormone","IGF-1","PTH (Parathyroid Hormone)",
  ],
  "Urine & Stool": [
    "Urine Routine & Microscopy","Urine Culture & Sensitivity","24-Hour Urine Protein",
    "24-Hour Urine Creatinine","Urine Microalbumin","Urine Ketones",
    "Pregnancy Test (Urine)","Stool Routine & Microscopy","Stool Occult Blood",
    "Stool Culture","H. pylori Stool Antigen",
  ],
  "Vitamins & Minerals": [
    "Vitamin D3 (25-OH)","Vitamin B12 (Cobalamin)","Vitamin B9 (Folic Acid)",
    "Vitamin A","Vitamin E","Zinc","Copper","Selenium","Magnesium",
    "Serum Calcium","Serum Phosphorus","Serum Iron",
  ],
  "Tumour Markers": [
    "PSA (Prostate Specific Antigen)","CEA (Carcinoembryonic Antigen)",
    "AFP (Alpha-fetoprotein)","CA-125 (Ovarian)","CA 19-9 (Pancreatic)",
    "CA 15-3 (Breast)","Beta-2 Microglobulin","LDH","HE4","CYFRA 21-1",
    "NSE (Neuron Specific Enolase)",
  ],
  "Cardiac": [
    "ECG (Electrocardiogram)","2D Echo (Echocardiography)","Stress Test (TMT)",
    "Holter Monitor (24 hr)","Troponin I","Troponin T","CK-MB","BNP / NT-proBNP",
    "Homocysteine","Lipoprotein(a)","hs-CRP",
  ],
  "Radiology & Imaging": [
    "X-Ray Chest (PA View)","X-Ray Abdomen","X-Ray KUB","X-Ray Spine (Cervical)",
    "X-Ray Spine (Lumbar)","X-Ray Skull","X-Ray Hand / Wrist","X-Ray Knee",
    "X-Ray Hip","X-Ray Pelvis",
    "USG Abdomen & Pelvis","USG Whole Abdomen","USG Upper Abdomen",
    "USG Lower Abdomen","USG Thyroid","USG Breast","USG Scrotum",
    "USG Obstetric (Dating)","USG Obstetric (Level 2 Anomaly)","USG Doppler (Peripheral)",
    "USG Doppler (Carotid)","USG Doppler (Renal)","USG Guided Aspiration",
    "CT Scan Head (Plain)","CT Scan Head (Contrast)","CT Scan Chest",
    "CT Scan Abdomen & Pelvis","CT Scan KUB","CT Scan Spine","CT Angiography",
    "CT Coronary Angiography (CTCA)","HRCT Chest","CT Sinuses",
    "MRI Brain (Plain)","MRI Brain (Contrast)","MRI Spine (Cervical)",
    "MRI Spine (Lumbar)","MRI Knee","MRI Shoulder","MRI Abdomen",
    "MRI Pelvis","MRI Brachial Plexus","MRI Angiography (MRA)",
    "PET Scan","Bone Scan (Scintigraphy)","DEXA Scan (Bone Density)",
    "Mammography","OPG (Dental X-Ray)","Fluoroscopy (Barium Swallow)",
  ],
  "Pathology / Cytology": [
    "FNAC (Fine Needle Aspiration Cytology)","Biopsy (Core / Trucut)",
    "Histopathology (HPE)","Pap Smear","Sputum AFB (TB)","Sputum Cytology",
    "Bone Marrow Biopsy","Fluid Analysis (Pleural / Ascitic / CSF)",
    "Skin Biopsy","Lymph Node Biopsy","Frozen Section",
  ],
  "Health Packages": [
    "Basic Health Checkup","Complete Blood Count Package","Diabetic Profile",
    "Cardiac Risk Package","Thyroid Package","Liver Package","Kidney Package",
    "Lipid Package","Women's Health Package","Men's Health Package",
    "Pre-marital Package","Antenatal Package","Senior Citizen Package",
    "Fever Package","Full Body Checkup (Basic)","Full Body Checkup (Advanced)",
    "PCOD / PCOS Package","Arthritis Package","Vitamin Deficiency Package",
    "Cancer Screening (Basic)","Pre-operative Package",
  ],
};

const ALL_TESTS_FLAT = Object.values(LAB_CATALOG).flat();

const INDICATIONS = [
  "Diabetes","CVD (Heart Disease)","Hypertension","Arthritis","Thyroid Disorder",
  "CKD (Kidney Disease)","Liver Disease","Anemia","Pregnancy","Cancer Screening",
  "Obesity","Respiratory Disease","Infectious Disease","Autoimmune Disease",
  "Pre-operative","Annual Health Check","Other",
];

const ACCREDITATIONS = ["NABL","ISO 15189","JCI","CAP","NABH","ISO 9001"];

const TURNAROUND_OPTIONS = [
  "1 Hour","2 Hours","4 Hours","6 Hours","Same Day",
  "Next Day","24 Hours","48 Hours","72 Hours","1 Week",
];

export interface LabTestFormPayload {
  type: "single" | "package";
  name: string;
  labDepartment: string;
  category: string;
  packageTests: string[];
  description: string;
  sampleType: string;
  turnaroundTime: string;
  reportDelivery: "Online" | "Physical" | "Both";
  accreditation: string[];
  indication: string[];
  mrp: number;
  offerPrice: number;
  membershipDiscount: number;
  membershipPrice: number;
  homeCollection: boolean;
  homeCollectionCharge: number;
  memberHomeCollectionFree: boolean;
  fastingRequired: boolean;
  fastingHours: number;
  preparationNotes: string;
  isActive?: boolean;
}

interface LabTestFullFormProps {
  initialData?: Record<string, any>;
  showStatusSection?: boolean;
  isEdit?: boolean;
  submitLabel?: string;
  hospitalAddress?: { district?: string; city?: string };
  onSubmit: (payload: LabTestFormPayload) => Promise<{ success: boolean; message?: string }>;
  onCancel?: () => void;
}

function SecHead({ icon, title }: { icon: string; title: string }) {
  return (
    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2 pb-1 border-b border-gray-100">
      <span className="text-base">{icon}</span>
      {title}
    </h3>
  );
}

function CheckPill({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label onClick={() => onChange(!checked)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs cursor-pointer transition select-none ${
        checked ? "bg-teal-50 border-teal-300 text-teal-800 font-semibold" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
      }`}>
      <span>{checked ? "✓" : "○"}</span>{label}
    </label>
  );
}

export default function LabTestFullForm({
  initialData,
  showStatusSection = false,
  isEdit            = false,
  submitLabel,
  hospitalAddress,
  onSubmit,
  onCancel,
}: LabTestFullFormProps) {

  const btnLabel = submitLabel ?? (isEdit ? "Save Changes" : "Add Lab Test");

  const [testType, setTestType] = useState<"single"|"package">(
    (initialData?.type as "single"|"package") || "single"
  );
  const [nameQuery, setNameQuery]     = useState(initialData?.name || "");
  const [nameDropdown, setNameDropdown] = useState(false);
  const [labDept, setLabDept]         = useState(initialData?.labDepartment || "");
  const [pkgTests, setPkgTests]       = useState<string[]>(initialData?.packageTests || []);
  const [pkgDept, setPkgDept]         = useState("");

  const [f, setF] = useState({
    category:               initialData?.category            || "Blood Test",
    description:            initialData?.description         || "",
    sampleType:             initialData?.sampleType          || "",
    turnaroundTime:         initialData?.turnaroundTime      || "Same Day",
    reportDelivery:         initialData?.reportDelivery      || "Both",
    mrp:                    String(initialData?.mrp          || ""),
    offerPrice:             String(initialData?.offerPrice   || ""),
    membershipDiscount:     String(initialData?.membershipDiscount || ""),
    membershipPrice:        String(initialData?.membershipPrice    || ""),
    homeCollection:         initialData?.homeCollection      || false,
    homeCollectionCharge:   String(initialData?.homeCollectionCharge || "0"),
    memberHomeCollectionFree: initialData?.memberHomeCollectionFree || false,
    fastingRequired:        initialData?.fastingRequired     || false,
    fastingHours:           String(initialData?.fastingHours || ""),
    preparationNotes:       initialData?.preparationNotes   || "",
    isActive:               initialData?.isActive !== false,
  });
  const set = (k: string, v: any) => setF(p => ({ ...p, [k]: v }));

  const [accreditation, setAccreditation] = useState<string[]>(initialData?.accreditation || []);
  const [indication,    setIndication]    = useState<string[]>(initialData?.indication    || []);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const inp = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all";
  const sel = inp + " bg-white";

  function toggleAccred(v: string) {
    setAccreditation(a => a.includes(v) ? a.filter(x => x !== v) : [...a, v]);
  }
  function toggleIndication(v: string) {
    setIndication(a => a.includes(v) ? a.filter(x => x !== v) : [...a, v]);
  }
  function togglePkgTest(name: string) {
    setPkgTests(p => p.includes(name) ? p.filter(x => x !== name) : [...p, name]);
  }

  // Auto-calc membership price when discount changes
  function handleDiscountChange(val: string) {
    set("membershipDiscount", val);
    const op = Number(f.offerPrice);
    const disc = Number(val);
    if (op > 0 && disc > 0 && disc < 100) {
      set("membershipPrice", String(Math.round(op * (1 - disc / 100))));
    }
  }

  function validate(): string {
    if (!nameQuery.trim())           return "Test ka naam zaruri hai";
    if (!f.mrp || Number(f.mrp) <= 0)          return "MRP zaruri hai";
    if (!f.offerPrice || Number(f.offerPrice) <= 0) return "Offer price zaruri hai";
    if (testType === "package" && pkgTests.length === 0) return "Package mein kam se kam ek test select karein";
    return "";
  }

  async function handleSubmit() {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true); setError("");

    const payload: LabTestFormPayload = {
      type:                    testType,
      name:                    nameQuery.trim(),
      labDepartment:           labDept,
      category:                f.category,
      packageTests:            testType === "package" ? pkgTests : [],
      description:             f.description.trim(),
      sampleType:              f.sampleType.trim(),
      turnaroundTime:          f.turnaroundTime,
      reportDelivery:          f.reportDelivery as "Online"|"Physical"|"Both",
      accreditation,
      indication,
      mrp:                     Number(f.mrp),
      offerPrice:              Number(f.offerPrice),
      membershipDiscount:      Number(f.membershipDiscount) || 0,
      membershipPrice:         Number(f.membershipPrice) || Number(f.offerPrice),
      homeCollection:          f.homeCollection,
      homeCollectionCharge:    Number(f.homeCollectionCharge) || 0,
      memberHomeCollectionFree: f.memberHomeCollectionFree,
      fastingRequired:         f.fastingRequired,
      fastingHours:            Number(f.fastingHours) || 0,
      preparationNotes:        f.preparationNotes.trim(),
      ...(showStatusSection && { isActive: f.isActive }),
    };

    const result = await onSubmit(payload);
    if (!result.success) setError(result.message || "Kuch galat hua, dobara try karein");
    setLoading(false);
  }

  // Filtered name suggestions
  const suggestions = nameQuery.length >= 1
    ? ALL_TESTS_FLAT.filter(t => t.toLowerCase().includes(nameQuery.toLowerCase())).slice(0, 10)
    : [];

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm flex items-start gap-2">
          <span className="mt-0.5">⚠️</span><span>{error}</span>
        </div>
      )}

      {/* ══ 1: Test Type ══════════════════════════════════════════════════════ */}
      <section>
        <SecHead icon="🧪" title="Test Type" />
        <div className="flex gap-3">
          {(["single","package"] as const).map(t => (
            <button key={t} type="button" onClick={() => setTestType(t)}
              className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition flex items-center justify-center gap-2 ${
                testType === t
                  ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"
              }`}>
              {t === "single" ? "🧬 Single Test / Scan" : "📦 Test Package"}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {testType === "single"
            ? "Ek test — CBC, LFT, USG, X-Ray, CT, MRI etc."
            : "Kai tests ka bundle — Full Body Check, Diabetic Package etc."}
        </p>
      </section>

      <div className="border-t border-gray-100" />

      {/* ══ 2: Test Name ══════════════════════════════════════════════════════ */}
      <section>
        <SecHead icon="📋" title="Test Name" />
        <div className="relative">
          <label className="text-xs font-medium text-gray-500">
            {testType === "single" ? "Test / Scan ka Naam *" : "Package ka Naam *"}
          </label>
          <input
            value={nameQuery}
            onChange={e => { setNameQuery(e.target.value); setNameDropdown(true); }}
            onFocus={() => setNameDropdown(true)}
            onBlur={() => setTimeout(() => setNameDropdown(false), 150)}
            placeholder="e.g. CBC, LFT, USG Abdomen, Full Body Checkup..."
            className={`mt-1 ${inp}`}
          />
          {nameDropdown && suggestions.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
              {suggestions.map(s => (
                <button key={s} type="button"
                  onMouseDown={() => { setNameQuery(s); setNameDropdown(false);
                    // Auto-set lab department
                    for (const [dept, tests] of Object.entries(LAB_CATALOG)) {
                      if (tests.includes(s)) { setLabDept(dept); break; }
                    }
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-teal-50 text-gray-700 border-b border-gray-50 last:border-0 transition">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500">Lab Department</label>
            <select value={labDept} onChange={e => setLabDept(e.target.value)} className={`mt-1 ${sel}`}>
              <option value="">-- Department --</option>
              {Object.keys(LAB_CATALOG).map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Category</label>
            <select value={f.category} onChange={e => set("category", e.target.value)} className={`mt-1 ${sel}`}>
              {["Blood Test","Urine Test","Stool Test","Imaging","ECG","X-Ray","Ultrasound","MRI","CT Scan","Pathology","Other"].map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ══ 3: Package Tests (only for package type) ══════════════════════════ */}
      {testType === "package" && (
        <>
          <div className="border-t border-gray-100" />
          <section>
            <SecHead icon="📦" title="Package mein Tests Include Karein" />
            <div className="mb-3">
              <label className="text-xs font-medium text-gray-500">Department se tests dekhein</label>
              <select value={pkgDept} onChange={e => setPkgDept(e.target.value)} className={`mt-1 ${sel}`}>
                <option value="">-- Sab Departments --</option>
                {Object.keys(LAB_CATALOG).map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            {pkgTests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3 p-3 bg-teal-50 rounded-xl border border-teal-100">
                <span className="text-xs text-teal-700 font-semibold w-full mb-1">Selected ({pkgTests.length}):</span>
                {pkgTests.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 bg-white border border-teal-200 text-teal-700 text-xs px-2.5 py-1 rounded-full">
                    {t}
                    <button type="button" onClick={() => togglePkgTest(t)} className="text-teal-300 hover:text-red-500 font-bold ml-0.5 leading-none">×</button>
                  </span>
                ))}
              </div>
            )}

            <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-xl p-3 space-y-1">
              {(pkgDept ? LAB_CATALOG[pkgDept] || [] : ALL_TESTS_FLAT).map(t => (
                <label key={t} onClick={() => togglePkgTest(t)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer transition ${
                    pkgTests.includes(t) ? "bg-teal-50 text-teal-800 font-semibold" : "hover:bg-gray-50 text-gray-700"
                  }`}>
                  <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] flex-shrink-0 ${
                    pkgTests.includes(t) ? "bg-teal-600 border-teal-600 text-white" : "border-gray-300"
                  }`}>{pkgTests.includes(t) ? "✓" : ""}</span>
                  {t}
                </label>
              ))}
            </div>
          </section>
        </>
      )}

      <div className="border-t border-gray-100" />

      {/* ══ 4: Pricing ════════════════════════════════════════════════════════ */}
      <section>
        <SecHead icon="💰" title="Pricing" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500">MRP (₹) *</label>
            <input type="number" min={0} value={f.mrp} onChange={e => set("mrp", e.target.value)}
              placeholder="500" className={`mt-1 ${inp}`} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Offer Price (₹) *</label>
            <input type="number" min={0} value={f.offerPrice} onChange={e => set("offerPrice", e.target.value)}
              placeholder="399" className={`mt-1 ${inp}`} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Member Discount (%)</label>
            <input type="number" min={0} max={99} value={f.membershipDiscount}
              onChange={e => handleDiscountChange(e.target.value)}
              placeholder="10" className={`mt-1 ${inp}`} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Member Price (₹)</label>
            <input type="number" min={0} value={f.membershipPrice}
              onChange={e => set("membershipPrice", e.target.value)}
              placeholder="Auto" className={`mt-1 ${inp}`} />
          </div>
        </div>
        {f.mrp && f.offerPrice && Number(f.mrp) > Number(f.offerPrice) && (
          <p className="text-xs text-green-700 mt-2 font-medium">
            ✓ {Math.round((1 - Number(f.offerPrice)/Number(f.mrp))*100)}% savings on MRP
          </p>
        )}
      </section>

      <div className="border-t border-gray-100" />

      {/* ══ 5: Test Indication ════════════════════════════════════════════════ */}
      <section>
        <SecHead icon="🩺" title="Test Indication (kis condition ke liye)" />
        <div className="flex flex-wrap gap-2">
          {INDICATIONS.map(i => (
            <CheckPill key={i} label={i} checked={indication.includes(i)} onChange={() => toggleIndication(i)} />
          ))}
        </div>
      </section>

      <div className="border-t border-gray-100" />

      {/* ══ 6: Home Collection ════════════════════════════════════════════════ */}
      <section>
        <SecHead icon="🏠" title="Home Collection" />
        <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition mb-4 ${
          f.homeCollection ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
        }`}>
          <input type="checkbox" checked={f.homeCollection} onChange={e => set("homeCollection", e.target.checked)}
            className="w-4 h-4 accent-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-700">
              {f.homeCollection ? "✅ Home Collection Available" : "Home Collection Nahi Hai"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Sample ghar se collect kiya jaega</p>
          </div>
        </label>

        {f.homeCollection && (
          <div className="space-y-3 pl-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Home Collection Charge (₹)</label>
                <input type="number" min={0} value={f.homeCollectionCharge}
                  onChange={e => set("homeCollectionCharge", e.target.value)}
                  placeholder="0 = Free" className={`mt-1 ${inp}`} />
              </div>
            </div>
            <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
              f.memberHomeCollectionFree ? "bg-teal-50 border-teal-200" : "bg-gray-50 border-gray-200"
            }`}>
              <input type="checkbox" checked={f.memberHomeCollectionFree}
                onChange={e => set("memberHomeCollectionFree", e.target.checked)}
                className="w-4 h-4 accent-teal-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  {f.memberHomeCollectionFree ? "🎯 Members ke liye Home Collection Free" : "Members ke liye Home Collection Free Nahi"}
                </p>
                <p className="text-xs text-gray-400">Brims card members ka HC charge waive hoga</p>
              </div>
            </label>
          </div>
        )}
      </section>

      <div className="border-t border-gray-100" />

      {/* ══ 7: Reporting Time & Delivery ═════════════════════════════════════ */}
      <section>
        <SecHead icon="⏱️" title="Reporting Time & Delivery" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500">Reporting Time</label>
            <select value={f.turnaroundTime} onChange={e => set("turnaroundTime", e.target.value)} className={`mt-1 ${sel}`}>
              {TURNAROUND_OPTIONS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Report Delivery</label>
            <select value={f.reportDelivery} onChange={e => set("reportDelivery", e.target.value)} className={`mt-1 ${sel}`}>
              <option value="Online">Online (App/Email)</option>
              <option value="Physical">Physical Copy</option>
              <option value="Both">Online + Physical</option>
            </select>
          </div>
        </div>
      </section>

      <div className="border-t border-gray-100" />

      {/* ══ 8: Accreditation ══════════════════════════════════════════════════ */}
      <section>
        <SecHead icon="🏅" title="Lab Accreditation" />
        <div className="flex flex-wrap gap-2">
          {ACCREDITATIONS.map(a => (
            <CheckPill key={a} label={a} checked={accreditation.includes(a)} onChange={() => toggleAccred(a)} />
          ))}
        </div>
      </section>

      <div className="border-t border-gray-100" />

      {/* ══ 9: Preparation ════════════════════════════════════════════════════ */}
      <section>
        <SecHead icon="📌" title="Patient Preparation" />
        <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition mb-3 ${
          f.fastingRequired ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"
        }`}>
          <input type="checkbox" checked={f.fastingRequired} onChange={e => set("fastingRequired", e.target.checked)}
            className="w-4 h-4 accent-amber-500 flex-shrink-0" />
          <p className="text-sm font-medium text-gray-700">
            {f.fastingRequired ? "⚠️ Fasting Required" : "Fasting Required Nahi"}
          </p>
        </label>
        {f.fastingRequired && (
          <div className="mb-3">
            <label className="text-xs font-medium text-gray-500">Fasting Duration (hours)</label>
            <input type="number" min={0} max={24} value={f.fastingHours}
              onChange={e => set("fastingHours", e.target.value)}
              placeholder="8" className={`mt-1 ${inp} max-w-xs`} />
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-gray-500">Preparation Notes</label>
          <textarea value={f.preparationNotes} onChange={e => set("preparationNotes", e.target.value)}
            placeholder="e.g. Subah 8 baje khaali pet aayein, paani pi sakte hain..."
            rows={2} className={`mt-1 ${inp} resize-none`} />
        </div>
      </section>

      <div className="border-t border-gray-100" />

      {/* ══ 10: Sample & Additional Info ══════════════════════════════════════ */}
      <section>
        <SecHead icon="🔬" title="Sample & Additional Info" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500">Sample Type</label>
            <input value={f.sampleType} onChange={e => set("sampleType", e.target.value)}
              placeholder="Blood, Urine, Swab, Stool..." className={`mt-1 ${inp}`} />
          </div>
        </div>
        <div className="mt-3">
          <label className="text-xs font-medium text-gray-500">Description</label>
          <textarea value={f.description} onChange={e => set("description", e.target.value)}
            placeholder="Test ke baare mein short description..."
            rows={2} className={`mt-1 ${inp} resize-none`} />
        </div>
      </section>

      {/* ══ 11: Location (display only) ═══════════════════════════════════════ */}
      {hospitalAddress && (
        <>
          <div className="border-t border-gray-100" />
          <section>
            <SecHead icon="📍" title="Location" />
            <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl p-3">
              <span className="text-teal-500">📍</span>
              <div>
                <p className="text-sm font-semibold text-teal-800">
                  {hospitalAddress.city ? `${hospitalAddress.city}, ` : ""}{hospitalAddress.district}, Bihar
                </p>
                <p className="text-xs text-teal-600 mt-0.5">Hospital/Lab ka address — automatically set</p>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ══ 12: Status (admin / edit) ═════════════════════════════════════════ */}
      {showStatusSection && (
        <>
          <div className="border-t border-gray-100" />
          <section>
            <SecHead icon="⚙️" title="Status" />
            <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition max-w-xs ${
              f.isActive ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            }`}>
              <input type="checkbox" checked={f.isActive} onChange={e => set("isActive", e.target.checked)}
                className="w-4 h-4 accent-green-600" />
              <span className="text-sm font-medium">{f.isActive ? "✅ Active" : "⏸️ Inactive"}</span>
            </label>
          </section>
        </>
      )}

      {/* ══ Submit / Cancel ═══════════════════════════════════════════════════ */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
            Cancel
          </button>
        )}
        <button type="button" onClick={handleSubmit} disabled={loading}
          className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white py-3 rounded-xl text-sm font-bold shadow-sm transition disabled:opacity-50">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              {isEdit ? "Save ho raha hai..." : "Add ho raha hai..."}
            </span>
          ) : btnLabel}
        </button>
      </div>
    </div>
  );
}