import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/*
  Professional Lab Test Templates — SRL / Lalpath / NABL Standard
  Each parameter includes: paramId, name, unit, type, refRangeText,
  refMaleMin/Max, refFemaleMin/Max (for numeric), order, section.
  "section" groups parameters under sub-headings on the printed report.
*/

const TEMPLATES = [

  // ══════════════════════════════════════════════════════════════════
  //  HAEMATOLOGY
  // ══════════════════════════════════════════════════════════════════

  {
    name: "Complete Blood Count (CBC)",
    department: "Haematology",
    category: "Blood Test",
    sampleType: "Blood (EDTA)",
    parameters: [
      // ── HAEMOGRAM ──
      { paramId:"hb",    section:"HAEMOGRAM",  order:1,  name:"Haemoglobin (Hb)",              unit:"g/dL",       type:"numeric", refMaleMin:13.0, refMaleMax:17.0, refFemaleMin:11.0, refFemaleMax:15.0, refRangeText:"M: 13.0–17.0  |  F: 11.0–15.0" },
      { paramId:"rbc",   section:"HAEMOGRAM",  order:2,  name:"Total RBC Count",               unit:"mill/μL",    type:"numeric", refMaleMin:4.50, refMaleMax:5.50, refFemaleMin:3.80, refFemaleMax:4.80, refRangeText:"M: 4.50–5.50  |  F: 3.80–4.80" },
      { paramId:"wbc",   section:"HAEMOGRAM",  order:3,  name:"Total WBC Count (TLC)",         unit:"cells/μL",   type:"numeric", refMaleMin:4000, refMaleMax:11000,refFemaleMin:4000, refFemaleMax:11000,refRangeText:"4000–11000" },
      { paramId:"plt",   section:"HAEMOGRAM",  order:4,  name:"Platelet Count",                unit:"lakh/μL",    type:"numeric", refMaleMin:1.50, refMaleMax:4.00, refFemaleMin:1.50, refFemaleMax:4.00, refRangeText:"1.50–4.00" },
      { paramId:"hct",   section:"HAEMOGRAM",  order:5,  name:"Haematocrit / PCV",             unit:"%",          type:"numeric", refMaleMin:40,   refMaleMax:54,   refFemaleMin:36,   refFemaleMax:48,   refRangeText:"M: 40–54  |  F: 36–48" },
      // ── RBC INDICES ──
      { paramId:"mcv",   section:"RBC INDICES",order:6,  name:"MCV (Mean Corpuscular Volume)", unit:"fL",         type:"numeric", refMaleMin:83,   refMaleMax:101,  refFemaleMin:83,   refFemaleMax:101,  refRangeText:"83.0–101.0" },
      { paramId:"mch",   section:"RBC INDICES",order:7,  name:"MCH (Mean Corpuscular Hb)",     unit:"pg",         type:"numeric", refMaleMin:27,   refMaleMax:32,   refFemaleMin:27,   refFemaleMax:32,   refRangeText:"27.0–32.0" },
      { paramId:"mchc",  section:"RBC INDICES",order:8,  name:"MCHC",                          unit:"g/dL",       type:"numeric", refMaleMin:31.5, refMaleMax:34.5, refFemaleMin:31.5, refFemaleMax:34.5, refRangeText:"31.5–34.5" },
      { paramId:"rdwcv", section:"RBC INDICES",order:9,  name:"RDW-CV",                        unit:"%",          type:"numeric", refMaleMin:11.5, refMaleMax:14.5, refFemaleMin:11.5, refFemaleMax:14.5, refRangeText:"11.5–14.5" },
      { paramId:"rdwsd", section:"RBC INDICES",order:10, name:"RDW-SD",                        unit:"fL",         type:"numeric", refMaleMin:35,   refMaleMax:56,   refFemaleMin:35,   refFemaleMax:56,   refRangeText:"35.0–56.0" },
      // ── PLATELET INDICES ──
      { paramId:"mpv",   section:"PLATELET INDICES",order:11,name:"MPV (Mean Platelet Volume)",unit:"fL",         type:"numeric", refMaleMin:6.5,  refMaleMax:12.0, refFemaleMin:6.5,  refFemaleMax:12.0, refRangeText:"6.5–12.0" },
      { paramId:"pdw",   section:"PLATELET INDICES",order:12,name:"PDW (Platelet Distribution Width)",unit:"%",  type:"numeric", refMaleMin:9,    refMaleMax:17,   refFemaleMin:9,    refFemaleMax:17,   refRangeText:"9.0–17.0" },
      { paramId:"pct",   section:"PLATELET INDICES",order:13,name:"PCT (Plateletcrit)",         unit:"%",          type:"numeric", refMaleMin:0.17, refMaleMax:0.35, refFemaleMin:0.17, refFemaleMax:0.35, refRangeText:"0.17–0.35" },
      // ── DIFFERENTIAL LEUCOCYTE COUNT ──
      { paramId:"neu",   section:"DIFFERENTIAL LEUCOCYTE COUNT (DLC)",order:14,name:"Neutrophils", unit:"%",      type:"numeric", refMaleMin:50,   refMaleMax:70,   refFemaleMin:50,   refFemaleMax:70,   refRangeText:"50–70" },
      { paramId:"lym",   section:"DIFFERENTIAL LEUCOCYTE COUNT (DLC)",order:15,name:"Lymphocytes", unit:"%",      type:"numeric", refMaleMin:20,   refMaleMax:40,   refFemaleMin:20,   refFemaleMax:40,   refRangeText:"20–40" },
      { paramId:"mon",   section:"DIFFERENTIAL LEUCOCYTE COUNT (DLC)",order:16,name:"Monocytes",   unit:"%",      type:"numeric", refMaleMin:2,    refMaleMax:8,    refFemaleMin:2,    refFemaleMax:8,    refRangeText:"2–8" },
      { paramId:"eos",   section:"DIFFERENTIAL LEUCOCYTE COUNT (DLC)",order:17,name:"Eosinophils", unit:"%",      type:"numeric", refMaleMin:1,    refMaleMax:4,    refFemaleMin:1,    refFemaleMax:4,    refRangeText:"1–4" },
      { paramId:"bas",   section:"DIFFERENTIAL LEUCOCYTE COUNT (DLC)",order:18,name:"Basophils",   unit:"%",      type:"numeric", refMaleMin:0,    refMaleMax:1,    refFemaleMin:0,    refFemaleMax:1,    refRangeText:"0–1" },
      // ── ABSOLUTE COUNTS ──
      { paramId:"anc",   section:"ABSOLUTE COUNTS",order:19,name:"Absolute Neutrophil Count",  unit:"cells/μL",   type:"numeric", refMaleMin:1800, refMaleMax:7800, refFemaleMin:1800, refFemaleMax:7800, refRangeText:"1800–7800" },
      { paramId:"alc",   section:"ABSOLUTE COUNTS",order:20,name:"Absolute Lymphocyte Count",  unit:"cells/μL",   type:"numeric", refMaleMin:1000, refMaleMax:4800, refFemaleMin:1000, refFemaleMax:4800, refRangeText:"1000–4800" },
      { paramId:"amc",   section:"ABSOLUTE COUNTS",order:21,name:"Absolute Monocyte Count",    unit:"cells/μL",   type:"numeric", refMaleMin:200,  refMaleMax:900,  refFemaleMin:200,  refFemaleMax:900,  refRangeText:"200–900" },
      { paramId:"aec",   section:"ABSOLUTE COUNTS",order:22,name:"Absolute Eosinophil Count",  unit:"cells/μL",   type:"numeric", refMaleMin:40,   refMaleMax:440,  refFemaleMin:40,   refFemaleMax:440,  refRangeText:"40–440" },
      { paramId:"abc",   section:"ABSOLUTE COUNTS",order:23,name:"Absolute Basophil Count",    unit:"cells/μL",   type:"numeric", refMaleMin:0,    refMaleMax:100,  refFemaleMin:0,    refFemaleMax:100,  refRangeText:"0–100" },
    ],
  },

  {
    name: "ESR (Erythrocyte Sedimentation Rate)",
    department: "Haematology",
    category: "Blood Test",
    sampleType: "Blood (EDTA)",
    parameters: [
      { paramId:"esr", section:"", order:1, name:"ESR — Westergren Method", unit:"mm/1st hr", type:"numeric", refMaleMin:0, refMaleMax:15, refFemaleMin:0, refFemaleMax:20, refRangeText:"M: 0–15  |  F: 0–20" },
    ],
  },

  {
    name: "Blood Group & Rh Factor",
    department: "Haematology",
    category: "Blood Test",
    sampleType: "Blood",
    parameters: [
      { paramId:"abog",  section:"", order:1, name:"ABO Blood Group", unit:"", type:"text", refRangeText:"A / B / AB / O" },
      { paramId:"rhfac", section:"", order:2, name:"Rh Factor",       unit:"", type:"text", refRangeText:"Positive / Negative" },
    ],
  },

  {
    name: "Peripheral Blood Smear (PBS)",
    department: "Haematology",
    category: "Blood Test",
    sampleType: "Blood (EDTA)",
    parameters: [
      { paramId:"rbc_morph",  section:"MORPHOLOGY",  order:1, name:"RBC Morphology",       unit:"", type:"text", refRangeText:"Normocytic Normochromic" },
      { paramId:"wbc_morph",  section:"MORPHOLOGY",  order:2, name:"WBC Morphology",       unit:"", type:"text", refRangeText:"Normal morphology" },
      { paramId:"plt_morph",  section:"MORPHOLOGY",  order:3, name:"Platelet Morphology",  unit:"", type:"text", refRangeText:"Adequate in number" },
      { paramId:"mp",         section:"MORPHOLOGY",  order:4, name:"Malaria Parasite (MP)",unit:"", type:"text", refRangeText:"Not Seen" },
      { paramId:"impression", section:"IMPRESSION",  order:5, name:"Impression",            unit:"", type:"text", refRangeText:"—" },
    ],
  },

  {
    name: "Coagulation Profile (PT / APTT / INR)",
    department: "Haematology",
    category: "Blood Test",
    sampleType: "Blood (Citrate)",
    parameters: [
      { paramId:"pt",      section:"", order:1, name:"Prothrombin Time (PT)",      unit:"seconds",type:"numeric", refMaleMin:10,  refMaleMax:13,  refFemaleMin:10,  refFemaleMax:13,  refRangeText:"10–13 sec" },
      { paramId:"inr",     section:"", order:2, name:"INR",                        unit:"",       type:"numeric", refMaleMin:0.8, refMaleMax:1.2, refFemaleMin:0.8, refFemaleMax:1.2, refRangeText:"0.8–1.2" },
      { paramId:"aptt",    section:"", order:3, name:"APTT",                       unit:"seconds",type:"numeric", refMaleMin:25,  refMaleMax:37,  refFemaleMin:25,  refFemaleMax:37,  refRangeText:"25–37 sec" },
      { paramId:"ctrl_pt", section:"", order:4, name:"Control PT",                unit:"seconds",type:"numeric", refMaleMin:10,  refMaleMax:13,  refFemaleMin:10,  refFemaleMax:13,  refRangeText:"10–13 sec" },
    ],
  },

  {
    name: "Reticulocyte Count",
    department: "Haematology",
    category: "Blood Test",
    sampleType: "Blood (EDTA)",
    parameters: [
      { paramId:"retic",     section:"", order:1, name:"Reticulocyte Count",          unit:"%",        type:"numeric", refMaleMin:0.5,   refMaleMax:1.5,   refFemaleMin:0.5, refFemaleMax:1.5,  refRangeText:"0.5–1.5%" },
      { paramId:"abs_retic", section:"", order:2, name:"Absolute Reticulocyte Count", unit:"cells/μL", type:"numeric", refMaleMin:25000, refMaleMax:85000, refFemaleMin:25000,refFemaleMax:85000,refRangeText:"25,000–85,000" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  //  BIOCHEMISTRY
  // ══════════════════════════════════════════════════════════════════

  {
    name: "Blood Sugar Fasting (FBS)",
    department: "Biochemistry",
    category: "Blood Test",
    sampleType: "Blood (Serum) — 8–12hr Fasting",
    parameters: [
      { paramId:"fbs", section:"", order:1, name:"Fasting Blood Sugar (FBS)", unit:"mg/dL", type:"numeric", refMaleMin:70, refMaleMax:100, refFemaleMin:70, refFemaleMax:100, refRangeText:"Normal: 70–100  |  Pre-diabetes: 101–125  |  Diabetes: ≥126" },
    ],
  },

  {
    name: "Blood Sugar Post-Prandial (PPBS)",
    department: "Biochemistry",
    category: "Blood Test",
    sampleType: "Blood (Serum) — 2hr Post Meal",
    parameters: [
      { paramId:"ppbs", section:"", order:1, name:"Post-Prandial Blood Sugar (PPBS)", unit:"mg/dL", type:"numeric", refMaleMin:70, refMaleMax:140, refFemaleMin:70, refFemaleMax:140, refRangeText:"Normal: < 140  |  Pre-diabetes: 140–199  |  Diabetes: ≥200" },
    ],
  },

  {
    name: "Random Blood Sugar (RBS)",
    department: "Biochemistry",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId:"rbs", section:"", order:1, name:"Random Blood Sugar (RBS)", unit:"mg/dL", type:"numeric", refMaleMin:70, refMaleMax:140, refFemaleMin:70, refFemaleMax:140, refRangeText:"Normal: 70–140  |  Diabetes likely: ≥200 with symptoms" },
    ],
  },

  {
    name: "HbA1c (Glycated Haemoglobin)",
    department: "Biochemistry",
    category: "Blood Test",
    sampleType: "Blood (EDTA)",
    parameters: [
      { paramId:"hba1c", section:"", order:1, name:"HbA1c",                           unit:"%",     type:"numeric", refMaleMin:4.0, refMaleMax:5.6, refFemaleMin:4.0, refFemaleMax:5.6, refRangeText:"Normal: < 5.7%  |  Pre-diabetes: 5.7–6.4%  |  Diabetes: ≥6.5%" },
      { paramId:"eag",   section:"", order:2, name:"Estimated Average Glucose (eAG)", unit:"mg/dL", type:"numeric", refMaleMin:68,  refMaleMax:114, refFemaleMin:68,  refFemaleMax:114, refRangeText:"68–114 mg/dL" },
    ],
  },

  {
    name: "Liver Function Test (LFT)",
    department: "Biochemistry",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId:"tbil",  section:"BILIRUBIN",    order:1,  name:"Total Bilirubin",               unit:"mg/dL", type:"numeric", refMaleMin:0.2,  refMaleMax:1.2,  refFemaleMin:0.2,  refFemaleMax:1.2,  refRangeText:"0.2–1.2" },
      { paramId:"dbil",  section:"BILIRUBIN",    order:2,  name:"Direct (Conjugated) Bilirubin", unit:"mg/dL", type:"numeric", refMaleMin:0.0,  refMaleMax:0.3,  refFemaleMin:0.0,  refFemaleMax:0.3,  refRangeText:"0.0–0.3" },
      { paramId:"ibil",  section:"BILIRUBIN",    order:3,  name:"Indirect Bilirubin",            unit:"mg/dL", type:"numeric", refMaleMin:0.1,  refMaleMax:0.9,  refFemaleMin:0.1,  refFemaleMax:0.9,  refRangeText:"0.1–0.9" },
      { paramId:"sgot",  section:"LIVER ENZYMES",order:4,  name:"SGOT / AST",                    unit:"U/L",   type:"numeric", refMaleMin:10,   refMaleMax:40,   refFemaleMin:10,   refFemaleMax:40,   refRangeText:"10–40" },
      { paramId:"sgpt",  section:"LIVER ENZYMES",order:5,  name:"SGPT / ALT",                    unit:"U/L",   type:"numeric", refMaleMin:7,    refMaleMax:40,   refFemaleMin:7,    refFemaleMax:40,   refRangeText:"7–40" },
      { paramId:"alp",   section:"LIVER ENZYMES",order:6,  name:"Alkaline Phosphatase (ALP)",    unit:"U/L",   type:"numeric", refMaleMin:44,   refMaleMax:147,  refFemaleMin:44,   refFemaleMax:147,  refRangeText:"44–147" },
      { paramId:"ggt",   section:"LIVER ENZYMES",order:7,  name:"Gamma GT (GGT)",                unit:"U/L",   type:"numeric", refMaleMin:10,   refMaleMax:71,   refFemaleMin:6,    refFemaleMax:42,   refRangeText:"M: 10–71  |  F: 6–42" },
      { paramId:"tprot", section:"PROTEINS",     order:8,  name:"Total Protein",                 unit:"g/dL",  type:"numeric", refMaleMin:6.4,  refMaleMax:8.3,  refFemaleMin:6.4,  refFemaleMax:8.3,  refRangeText:"6.4–8.3" },
      { paramId:"alb",   section:"PROTEINS",     order:9,  name:"Albumin",                       unit:"g/dL",  type:"numeric", refMaleMin:3.5,  refMaleMax:5.0,  refFemaleMin:3.5,  refFemaleMax:5.0,  refRangeText:"3.5–5.0" },
      { paramId:"glob",  section:"PROTEINS",     order:10, name:"Globulin",                      unit:"g/dL",  type:"numeric", refMaleMin:2.3,  refMaleMax:3.5,  refFemaleMin:2.3,  refFemaleMax:3.5,  refRangeText:"2.3–3.5" },
      { paramId:"agrat", section:"PROTEINS",     order:11, name:"A/G Ratio",                     unit:"",      type:"numeric", refMaleMin:1.2,  refMaleMax:2.2,  refFemaleMin:1.2,  refFemaleMax:2.2,  refRangeText:"1.2–2.2" },
    ],
  },

  {
    name: "Kidney Function Test (KFT / RFT)",
    department: "Biochemistry",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId:"bun",   section:"RENAL MARKERS",order:1,  name:"Blood Urea Nitrogen (BUN)",   unit:"mg/dL", type:"numeric", refMaleMin:7,   refMaleMax:20,  refFemaleMin:7,   refFemaleMax:20,  refRangeText:"7–20" },
      { paramId:"urea",  section:"RENAL MARKERS",order:2,  name:"Serum Urea",                  unit:"mg/dL", type:"numeric", refMaleMin:15,  refMaleMax:45,  refFemaleMin:15,  refFemaleMax:45,  refRangeText:"15–45" },
      { paramId:"creat", section:"RENAL MARKERS",order:3,  name:"Serum Creatinine",            unit:"mg/dL", type:"numeric", refMaleMin:0.7, refMaleMax:1.3, refFemaleMin:0.5, refFemaleMax:1.0, refRangeText:"M: 0.7–1.3  |  F: 0.5–1.0" },
      { paramId:"egfr",  section:"RENAL MARKERS",order:4,  name:"eGFR (CKD-EPI)",              unit:"mL/min/1.73m²", type:"text", refRangeText:"> 60 Normal  |  45–59 Mild↓  |  30–44 Moderate↓  |  < 30 Severe↓" },
      { paramId:"uric",  section:"RENAL MARKERS",order:5,  name:"Serum Uric Acid",             unit:"mg/dL", type:"numeric", refMaleMin:3.5, refMaleMax:7.2, refFemaleMin:2.5, refFemaleMax:6.0, refRangeText:"M: 3.5–7.2  |  F: 2.5–6.0" },
      { paramId:"Na",    section:"ELECTROLYTES", order:6,  name:"Sodium (Na⁺)",               unit:"mEq/L", type:"numeric", refMaleMin:136, refMaleMax:145, refFemaleMin:136, refFemaleMax:145, refRangeText:"136–145" },
      { paramId:"K",     section:"ELECTROLYTES", order:7,  name:"Potassium (K⁺)",             unit:"mEq/L", type:"numeric", refMaleMin:3.5, refMaleMax:5.1, refFemaleMin:3.5, refFemaleMax:5.1, refRangeText:"3.5–5.1" },
      { paramId:"Cl",    section:"ELECTROLYTES", order:8,  name:"Chloride (Cl⁻)",             unit:"mEq/L", type:"numeric", refMaleMin:98,  refMaleMax:107, refFemaleMin:98,  refFemaleMax:107, refRangeText:"98–107" },
      { paramId:"ca",    section:"MINERALS",     order:9,  name:"Calcium (Ca²⁺)",             unit:"mg/dL", type:"numeric", refMaleMin:8.5, refMaleMax:10.5,refFemaleMin:8.5, refFemaleMax:10.5,refRangeText:"8.5–10.5" },
      { paramId:"phos",  section:"MINERALS",     order:10, name:"Phosphorus",                  unit:"mg/dL", type:"numeric", refMaleMin:2.5, refMaleMax:4.5, refFemaleMin:2.5, refFemaleMax:4.5, refRangeText:"2.5–4.5" },
    ],
  },

  {
    name: "Lipid Profile",
    department: "Biochemistry",
    category: "Blood Test",
    sampleType: "Blood (Serum) — 12hr Fasting",
    parameters: [
      { paramId:"tchol",    section:"LIPID PANEL",order:1, name:"Total Cholesterol",           unit:"mg/dL",type:"numeric",refMaleMin:0,  refMaleMax:200,refFemaleMin:0,  refFemaleMax:200,refRangeText:"Desirable: < 200  |  Borderline: 200–239  |  High: ≥240" },
      { paramId:"ldl",      section:"LIPID PANEL",order:2, name:"LDL Cholesterol",             unit:"mg/dL",type:"numeric",refMaleMin:0,  refMaleMax:130,refFemaleMin:0,  refFemaleMax:130,refRangeText:"Optimal: < 100  |  Near-Optimal: 100–129  |  High: ≥160" },
      { paramId:"hdl",      section:"LIPID PANEL",order:3, name:"HDL Cholesterol",             unit:"mg/dL",type:"numeric",refMaleMin:40, refMaleMax:999,refFemaleMin:50, refFemaleMax:999,refRangeText:"M: ≥40  |  F: ≥50  |  Low risk: ≥60" },
      { paramId:"vldl",     section:"LIPID PANEL",order:4, name:"VLDL Cholesterol",            unit:"mg/dL",type:"numeric",refMaleMin:5,  refMaleMax:40, refFemaleMin:5,  refFemaleMax:40, refRangeText:"5–40" },
      { paramId:"trig",     section:"LIPID PANEL",order:5, name:"Triglycerides",               unit:"mg/dL",type:"numeric",refMaleMin:0,  refMaleMax:150,refFemaleMin:0,  refFemaleMax:150,refRangeText:"Normal: < 150  |  Borderline: 150–199  |  High: ≥200" },
      { paramId:"chdratio", section:"RATIOS",     order:6, name:"Total Cholesterol/HDL Ratio", unit:"",     type:"numeric",refMaleMin:0,  refMaleMax:5.0,refFemaleMin:0,  refFemaleMax:5.0,refRangeText:"< 5.0  (Optimal: < 3.5)" },
      { paramId:"lhdrat",   section:"RATIOS",     order:7, name:"LDL / HDL Ratio",             unit:"",     type:"numeric",refMaleMin:0,  refMaleMax:3.5,refFemaleMin:0,  refFemaleMax:3.5,refRangeText:"< 3.5" },
      { paramId:"non_hdl",  section:"RATIOS",     order:8, name:"Non-HDL Cholesterol",         unit:"mg/dL",type:"numeric",refMaleMin:0,  refMaleMax:160,refFemaleMin:0,  refFemaleMax:160,refRangeText:"< 160  (Optimal: < 130)" },
    ],
  },

  {
    name: "Serum Electrolytes",
    department: "Biochemistry",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId:"Na",     section:"", order:1, name:"Sodium (Na⁺)",         unit:"mEq/L", type:"numeric", refMaleMin:136, refMaleMax:145, refFemaleMin:136, refFemaleMax:145, refRangeText:"136–145" },
      { paramId:"K",      section:"", order:2, name:"Potassium (K⁺)",       unit:"mEq/L", type:"numeric", refMaleMin:3.5, refMaleMax:5.1, refFemaleMin:3.5, refFemaleMax:5.1, refRangeText:"3.5–5.1" },
      { paramId:"Cl",     section:"", order:3, name:"Chloride (Cl⁻)",       unit:"mEq/L", type:"numeric", refMaleMin:98,  refMaleMax:107, refFemaleMin:98,  refFemaleMax:107, refRangeText:"98–107" },
      { paramId:"bicarb", section:"", order:4, name:"Bicarbonate (HCO₃⁻)", unit:"mEq/L", type:"numeric", refMaleMin:22,  refMaleMax:29,  refFemaleMin:22,  refFemaleMax:29,  refRangeText:"22–29" },
    ],
  },

  {
    name: "Cardiac Panel (Troponin I / CK-MB / LDH)",
    department: "Biochemistry",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId:"tropi", section:"CARDIAC MARKERS",order:1, name:"Troponin I (cTnI — Quantitative)", unit:"ng/mL", type:"numeric", refMaleMin:0, refMaleMax:0.04,  refFemaleMin:0, refFemaleMax:0.04,  refRangeText:"Normal: < 0.04  |  Probable MI: 0.04–0.10  |  Confirmed MI: > 0.10" },
      { paramId:"ckmb",  section:"CARDIAC MARKERS",order:2, name:"CK-MB",                            unit:"U/L",   type:"numeric", refMaleMin:0, refMaleMax:25,    refFemaleMin:0, refFemaleMax:25,    refRangeText:"< 25 U/L" },
      { paramId:"ldh",   section:"CARDIAC MARKERS",order:3, name:"LDH (Lactate Dehydrogenase)",     unit:"U/L",   type:"numeric", refMaleMin:140,refMaleMax:280,   refFemaleMin:140,refFemaleMax:280,   refRangeText:"140–280" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  //  ENDOCRINOLOGY
  // ══════════════════════════════════════════════════════════════════

  {
    name: "Thyroid Profile (T3 / T4 / TSH)",
    department: "Endocrinology",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId:"t3",  section:"", order:1, name:"T3 (Triiodothyronine)",            unit:"ng/dL",  type:"numeric", refMaleMin:80,   refMaleMax:200,  refFemaleMin:80,   refFemaleMax:200,  refRangeText:"80–200" },
      { paramId:"t4",  section:"", order:2, name:"T4 (Thyroxine)",                   unit:"μg/dL",  type:"numeric", refMaleMin:5.1,  refMaleMax:14.1, refFemaleMin:5.1,  refFemaleMax:14.1, refRangeText:"5.1–14.1" },
      { paramId:"tsh", section:"", order:3, name:"TSH (Thyroid Stimulating Hormone)", unit:"μIU/mL", type:"numeric", refMaleMin:0.27, refMaleMax:4.20, refFemaleMin:0.27, refFemaleMax:4.20, refRangeText:"0.27–4.20  |  Hypo: > 4.20  |  Hyper: < 0.27" },
    ],
  },

  {
    name: "TSH (Thyroid Stimulating Hormone)",
    department: "Endocrinology",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId:"tsh", section:"", order:1, name:"TSH (Thyroid Stimulating Hormone)", unit:"μIU/mL", type:"numeric", refMaleMin:0.27, refMaleMax:4.20, refFemaleMin:0.27, refFemaleMax:4.20, refRangeText:"0.27–4.20  |  Hypothyroid: > 4.20  |  Hyperthyroid: < 0.27" },
    ],
  },

  {
    name: "Vitamin D (25-OH)",
    department: "Endocrinology",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId:"vitd", section:"", order:1, name:"25-Hydroxy Vitamin D (25-OH)", unit:"ng/mL", type:"numeric", refMaleMin:30, refMaleMax:100, refFemaleMin:30, refFemaleMax:100, refRangeText:"Sufficient: 30–100  |  Insufficient: 20–30  |  Deficient: < 20" },
    ],
  },

  {
    name: "Vitamin B12 (Cobalamin)",
    department: "Endocrinology",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId:"b12", section:"", order:1, name:"Vitamin B12 (Cobalamin)", unit:"pg/mL", type:"numeric", refMaleMin:211, refMaleMax:911, refFemaleMin:211, refFemaleMax:911, refRangeText:"211–911  |  Deficient: < 211  |  Low-normal: 211–300" },
    ],
  },

  {
    name: "Iron Studies (Iron / TIBC / Ferritin)",
    department: "Endocrinology",
    category: "Blood Test",
    sampleType: "Blood (Serum) — Fasting",
    parameters: [
      { paramId:"iron",  section:"IRON PANEL",order:1, name:"Serum Iron",                           unit:"μg/dL", type:"numeric", refMaleMin:59,  refMaleMax:158, refFemaleMin:37,  refFemaleMax:145, refRangeText:"M: 59–158  |  F: 37–145" },
      { paramId:"tibc",  section:"IRON PANEL",order:2, name:"TIBC (Total Iron Binding Capacity)",    unit:"μg/dL", type:"numeric", refMaleMin:250, refMaleMax:370, refFemaleMin:250, refFemaleMax:370, refRangeText:"250–370" },
      { paramId:"uibc",  section:"IRON PANEL",order:3, name:"UIBC (Unsaturated Iron Binding Capacity)",unit:"μg/dL",type:"numeric",refMaleMin:131,refMaleMax:425,refFemaleMin:131,refFemaleMax:425,refRangeText:"131–425" },
      { paramId:"tsat",  section:"IRON PANEL",order:4, name:"Transferrin Saturation",               unit:"%",     type:"numeric", refMaleMin:15,  refMaleMax:50,  refFemaleMin:12,  refFemaleMax:45,  refRangeText:"M: 15–50  |  F: 12–45" },
      { paramId:"ferr",  section:"IRON PANEL",order:5, name:"Serum Ferritin",                       unit:"ng/mL", type:"numeric", refMaleMin:12,  refMaleMax:300, refFemaleMin:12,  refFemaleMax:150, refRangeText:"M: 12–300  |  F: 12–150  |  Deficiency: < 12" },
    ],
  },

  {
    name: "Fertility Panel (FSH / LH / Prolactin)",
    department: "Endocrinology",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId:"fsh", section:"", order:1, name:"FSH (Follicle Stimulating Hormone)", unit:"mIU/mL", type:"text", refRangeText:"M: 1.5–12.4  |  F-Follicular: 3.5–12.5  |  F-Midcycle: 4.7–21.5  |  F-Luteal: 1.7–7.7  |  F-Postmenopause: 25.8–134.8" },
      { paramId:"lh",  section:"", order:2, name:"LH (Luteinizing Hormone)",           unit:"mIU/mL", type:"text", refRangeText:"M: 1.7–8.6  |  F-Follicular: 2.4–12.6  |  F-Midcycle: 14.0–95.6  |  F-Luteal: 1.0–11.4  |  F-Postmenopause: 7.7–58.5" },
      { paramId:"prl", section:"", order:3, name:"Prolactin",                          unit:"ng/mL",  type:"numeric", refMaleMin:2.5, refMaleMax:17,   refFemaleMin:2.8, refFemaleMax:29.2,refRangeText:"M: 2.5–17.0  |  F: 2.8–29.2" },
    ],
  },

  {
    name: "Serum Testosterone",
    department: "Endocrinology",
    category: "Blood Test",
    sampleType: "Blood (Serum) — Morning (8–10 AM)",
    parameters: [
      { paramId:"test_total", section:"", order:1, name:"Total Testosterone",unit:"ng/dL", type:"numeric", refMaleMin:249, refMaleMax:836, refFemaleMin:8, refFemaleMax:60, refRangeText:"M: 249–836  |  F: 8–60" },
      { paramId:"test_free",  section:"", order:2, name:"Free Testosterone", unit:"pg/mL", type:"text",    refRangeText:"M: 46–224  |  F: 0.3–19.0" },
    ],
  },

  {
    name: "Calcium (Serum)",
    department: "Biochemistry",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId:"ca_total",   section:"", order:1, name:"Serum Calcium (Total)",unit:"mg/dL", type:"numeric", refMaleMin:8.5, refMaleMax:10.5,refFemaleMin:8.5, refFemaleMax:10.5,refRangeText:"8.5–10.5" },
      { paramId:"ca_ionized", section:"", order:2, name:"Ionised Calcium",      unit:"mg/dL", type:"numeric", refMaleMin:4.6, refMaleMax:5.3, refFemaleMin:4.6, refFemaleMax:5.3, refRangeText:"4.6–5.3" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  //  SEROLOGY / IMMUNOLOGY
  // ══════════════════════════════════════════════════════════════════

  {
    name: "Widal Test (Typhoid)",
    department: "Serology",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId:"wid_to",  section:"SALMONELLA TYPHI",    order:1, name:"S. typhi 'O' Antigen",      unit:"", type:"text", refRangeText:"Non-reactive (< 1:20)  |  Significant: ≥1:80" },
      { paramId:"wid_th",  section:"SALMONELLA TYPHI",    order:2, name:"S. typhi 'H' Antigen",      unit:"", type:"text", refRangeText:"Non-reactive (< 1:20)  |  Significant: ≥1:80" },
      { paramId:"wid_pah", section:"SALMONELLA PARATYPHI",order:3, name:"S. paratyphi 'AH' Antigen", unit:"", type:"text", refRangeText:"Non-reactive (< 1:20)" },
      { paramId:"wid_pbh", section:"SALMONELLA PARATYPHI",order:4, name:"S. paratyphi 'BH' Antigen", unit:"", type:"text", refRangeText:"Non-reactive (< 1:20)" },
    ],
  },

  {
    name: "HBsAg (Hepatitis B Surface Antigen)",
    department: "Serology",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId:"hbsag",       section:"", order:1, name:"HBsAg",                    unit:"", type:"text",    refRangeText:"Non-Reactive" },
      { paramId:"hbsag_index", section:"", order:2, name:"Signal/Cutoff (S/CO) Ratio",unit:"",type:"numeric", refMaleMin:0, refMaleMax:0.9, refFemaleMin:0, refFemaleMax:0.9, refRangeText:"< 1.0 = Non-Reactive  |  ≥1.0 = Reactive" },
    ],
  },

  {
    name: "Anti-HCV (Hepatitis C Antibody)",
    department: "Serology",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId:"hcv",       section:"", order:1, name:"Anti-HCV Antibody",          unit:"", type:"text",    refRangeText:"Non-Reactive" },
      { paramId:"hcv_index", section:"", order:2, name:"Signal/Cutoff (S/CO) Ratio", unit:"", type:"numeric", refMaleMin:0, refMaleMax:0.9, refFemaleMin:0, refFemaleMax:0.9, refRangeText:"< 1.0 = Non-Reactive  |  ≥1.0 = Reactive" },
    ],
  },

  {
    name: "HIV 1 & 2 (ELISA)",
    department: "Serology",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId:"hiv",       section:"", order:1, name:"HIV 1 & 2 Antibody (ELISA)", unit:"", type:"text",    refRangeText:"Non-Reactive" },
      { paramId:"hiv_index", section:"", order:2, name:"Signal/Cutoff (S/CO) Ratio", unit:"", type:"numeric", refMaleMin:0, refMaleMax:0.9, refFemaleMin:0, refFemaleMax:0.9, refRangeText:"< 1.0 = Non-Reactive  |  ≥1.0 = Reactive" },
    ],
  },

  {
    name: "Dengue Serology (NS1 + IgM + IgG)",
    department: "Serology",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId:"d_ns1", section:"", order:1, name:"Dengue NS1 Antigen",  unit:"", type:"text", refRangeText:"Negative (S/CO < 1.0)" },
      { paramId:"d_igm", section:"", order:2, name:"Dengue IgM Antibody", unit:"", type:"text", refRangeText:"Negative (S/CO < 1.0)" },
      { paramId:"d_igg", section:"", order:3, name:"Dengue IgG Antibody", unit:"", type:"text", refRangeText:"Negative (S/CO < 1.0)" },
    ],
  },

  {
    name: "Malaria Antigen Test (ICT / RDT)",
    department: "Serology",
    category: "Blood Test",
    sampleType: "Blood (EDTA)",
    parameters: [
      { paramId:"pf", section:"", order:1, name:"Plasmodium falciparum (HRP-2)", unit:"", type:"text", refRangeText:"Negative" },
      { paramId:"pv", section:"", order:2, name:"Plasmodium vivax (pLDH)",       unit:"", type:"text", refRangeText:"Negative" },
    ],
  },

  {
    name: "CRP (C-Reactive Protein)",
    department: "Serology",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId:"crp", section:"", order:1, name:"CRP (C-Reactive Protein)", unit:"mg/L", type:"numeric", refMaleMin:0, refMaleMax:5.0, refFemaleMin:0, refFemaleMax:5.0, refRangeText:"< 5.0  |  Mild inflammation: 5–20  |  Marked: > 20" },
    ],
  },

  {
    name: "High Sensitivity CRP (hs-CRP)",
    department: "Serology",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId:"hscrp", section:"", order:1, name:"High Sensitivity CRP (hs-CRP)", unit:"mg/L", type:"numeric", refMaleMin:0, refMaleMax:1.0, refFemaleMin:0, refFemaleMax:1.0, refRangeText:"Low risk: < 1.0  |  Average: 1.0–3.0  |  High risk: > 3.0" },
    ],
  },

  {
    name: "RA Factor (Rheumatoid Arthritis)",
    department: "Serology",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId:"raf", section:"", order:1, name:"Rheumatoid Factor (RA Factor)", unit:"IU/mL", type:"numeric", refMaleMin:0, refMaleMax:14, refFemaleMin:0, refFemaleMax:14, refRangeText:"< 14 IU/mL  |  Positive: ≥14" },
    ],
  },

  {
    name: "PSA (Prostate Specific Antigen)",
    department: "Serology",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId:"psa_total", section:"", order:1, name:"PSA Total",  unit:"ng/mL", type:"numeric", refMaleMin:0, refMaleMax:4.0, refFemaleMin:0, refFemaleMax:0, refRangeText:"< 4.0  |  Borderline: 4–10  |  Suspicious: > 10" },
      { paramId:"psa_free",  section:"", order:2, name:"PSA Free",   unit:"ng/mL", type:"text",    refRangeText:"—" },
      { paramId:"psa_ratio", section:"", order:3, name:"% Free PSA", unit:"%",     type:"text",    refRangeText:"> 25% Low risk  |  15–25% Intermediate  |  < 15% High risk" },
    ],
  },

  {
    name: "Beta-HCG (Pregnancy — Quantitative)",
    department: "Serology",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId:"bhcg", section:"", order:1, name:"Beta-HCG Quantitative", unit:"mIU/mL", type:"text", refRangeText:"Non-pregnant: < 5  |  ≥5 = Positive  |  Value varies by gestational week" },
    ],
  },

  {
    name: "VDRL / RPR (Syphilis)",
    department: "Serology",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId:"vdrl",  section:"", order:1, name:"VDRL Test",                  unit:"", type:"text", refRangeText:"Non-Reactive" },
      { paramId:"titre", section:"", order:2, name:"VDRL Titre (if reactive)",   unit:"", type:"text", refRangeText:"—" },
    ],
  },

  {
    name: "D-Dimer",
    department: "Serology",
    category: "Blood Test",
    sampleType: "Blood (Citrate)",
    parameters: [
      { paramId:"ddimer", section:"", order:1, name:"D-Dimer", unit:"μg/mL FEU", type:"numeric", refMaleMin:0, refMaleMax:0.5, refFemaleMin:0, refFemaleMax:0.5, refRangeText:"< 0.5 μg/mL FEU  (Age-adjusted: age × 0.01 μg/mL)" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  //  URINE ANALYSIS
  // ══════════════════════════════════════════════════════════════════

  {
    name: "Urine Routine & Microscopy (R/M/E)",
    department: "Urine Analysis",
    category: "Urine Test",
    sampleType: "Urine (Mid-stream / First morning)",
    parameters: [
      // Physical
      { paramId:"u_col",   section:"PHYSICAL EXAMINATION",    order:1,  name:"Colour",             unit:"", type:"text", refRangeText:"Pale Yellow / Yellow" },
      { paramId:"u_app",   section:"PHYSICAL EXAMINATION",    order:2,  name:"Appearance",         unit:"", type:"text", refRangeText:"Clear" },
      { paramId:"u_ph",    section:"PHYSICAL EXAMINATION",    order:3,  name:"Reaction (pH)",      unit:"", type:"numeric", refMaleMin:4.5, refMaleMax:8.5, refFemaleMin:4.5, refFemaleMax:8.5, refRangeText:"4.5–8.5" },
      { paramId:"u_sg",    section:"PHYSICAL EXAMINATION",    order:4,  name:"Specific Gravity",   unit:"", type:"numeric", refMaleMin:1.001,refMaleMax:1.035,refFemaleMin:1.001,refFemaleMax:1.035,refRangeText:"1.001–1.035" },
      // Chemical
      { paramId:"u_glu",   section:"CHEMICAL EXAMINATION",    order:5,  name:"Glucose",            unit:"", type:"text", refRangeText:"Negative" },
      { paramId:"u_prot",  section:"CHEMICAL EXAMINATION",    order:6,  name:"Protein (Albumin)",  unit:"", type:"text", refRangeText:"Negative" },
      { paramId:"u_ket",   section:"CHEMICAL EXAMINATION",    order:7,  name:"Ketones",            unit:"", type:"text", refRangeText:"Negative" },
      { paramId:"u_blood", section:"CHEMICAL EXAMINATION",    order:8,  name:"Blood / Haemoglobin",unit:"", type:"text", refRangeText:"Negative" },
      { paramId:"u_bil",   section:"CHEMICAL EXAMINATION",    order:9,  name:"Bilirubin",          unit:"", type:"text", refRangeText:"Negative" },
      { paramId:"u_uro",   section:"CHEMICAL EXAMINATION",    order:10, name:"Urobilinogen",       unit:"EU/dL", type:"text", refRangeText:"0.2–1.0" },
      { paramId:"u_nit",   section:"CHEMICAL EXAMINATION",    order:11, name:"Nitrite",            unit:"", type:"text", refRangeText:"Negative" },
      { paramId:"u_le",    section:"CHEMICAL EXAMINATION",    order:12, name:"Leukocyte Esterase", unit:"", type:"text", refRangeText:"Negative" },
      // Microscopy
      { paramId:"u_rbc",   section:"MICROSCOPIC EXAMINATION", order:13, name:"RBC",                unit:"/HPF", type:"text", refRangeText:"0–2 /HPF" },
      { paramId:"u_pus",   section:"MICROSCOPIC EXAMINATION", order:14, name:"Pus Cells (WBC)",    unit:"/HPF", type:"text", refRangeText:"0–5 /HPF" },
      { paramId:"u_epi",   section:"MICROSCOPIC EXAMINATION", order:15, name:"Epithelial Cells",   unit:"/HPF", type:"text", refRangeText:"Few" },
      { paramId:"u_cast",  section:"MICROSCOPIC EXAMINATION", order:16, name:"Casts",              unit:"/LPF", type:"text", refRangeText:"Nil / Occasional hyaline" },
      { paramId:"u_cryst", section:"MICROSCOPIC EXAMINATION", order:17, name:"Crystals",           unit:"",     type:"text", refRangeText:"Nil" },
      { paramId:"u_bact",  section:"MICROSCOPIC EXAMINATION", order:18, name:"Bacteria",           unit:"",     type:"text", refRangeText:"Nil" },
      { paramId:"u_yeast", section:"MICROSCOPIC EXAMINATION", order:19, name:"Yeast Cells",        unit:"",     type:"text", refRangeText:"Not seen" },
    ],
  },

  {
    name: "Urine Microalbuminuria / ACR",
    department: "Urine Analysis",
    category: "Urine Test",
    sampleType: "Urine (Spot)",
    parameters: [
      { paramId:"microalb", section:"", order:1, name:"Microalbumin (Urine)",          unit:"mg/L",  type:"numeric", refMaleMin:0, refMaleMax:30,  refFemaleMin:0, refFemaleMax:30,  refRangeText:"< 30  |  Microalbuminuria: 30–300  |  Macroalbuminuria: > 300" },
      { paramId:"ucr",      section:"", order:2, name:"Urine Creatinine",              unit:"mg/dL", type:"text",    refRangeText:"—" },
      { paramId:"acr",      section:"", order:3, name:"Albumin/Creatinine Ratio (ACR)", unit:"mg/g", type:"numeric", refMaleMin:0, refMaleMax:30, refFemaleMin:0, refFemaleMax:30, refRangeText:"< 30  |  Moderately increased: 30–300  |  Severely: > 300" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  //  STOOL ANALYSIS
  // ══════════════════════════════════════════════════════════════════

  {
    name: "Stool Routine & Microscopy",
    department: "Stool Analysis",
    category: "Stool Test",
    sampleType: "Stool (Fresh)",
    parameters: [
      { paramId:"s_col",   section:"PHYSICAL EXAMINATION",    order:1,  name:"Colour",             unit:"", type:"text", refRangeText:"Brown / Yellow-brown" },
      { paramId:"s_cons",  section:"PHYSICAL EXAMINATION",    order:2,  name:"Consistency",        unit:"", type:"text", refRangeText:"Formed / Semi-formed" },
      { paramId:"s_mucus", section:"PHYSICAL EXAMINATION",    order:3,  name:"Mucus",              unit:"", type:"text", refRangeText:"Absent" },
      { paramId:"s_blood", section:"PHYSICAL EXAMINATION",    order:4,  name:"Blood (Gross)",      unit:"", type:"text", refRangeText:"Absent" },
      { paramId:"s_occ",   section:"CHEMICAL EXAMINATION",    order:5,  name:"Occult Blood (FOB)", unit:"", type:"text", refRangeText:"Negative" },
      { paramId:"s_rbc",   section:"MICROSCOPIC EXAMINATION", order:6,  name:"RBC",                unit:"/HPF", type:"text", refRangeText:"Nil" },
      { paramId:"s_pus",   section:"MICROSCOPIC EXAMINATION", order:7,  name:"Pus Cells",          unit:"/HPF", type:"text", refRangeText:"0–2 /HPF" },
      { paramId:"s_ep",    section:"MICROSCOPIC EXAMINATION", order:8,  name:"Epithelial Cells",   unit:"",     type:"text", refRangeText:"Few" },
      { paramId:"s_fat",   section:"MICROSCOPIC EXAMINATION", order:9,  name:"Fat Globules",       unit:"",     type:"text", refRangeText:"Absent / Few" },
      { paramId:"s_para",  section:"MICROSCOPIC EXAMINATION", order:10, name:"Parasites / Cysts",  unit:"",     type:"text", refRangeText:"Not seen" },
      { paramId:"s_ova",   section:"MICROSCOPIC EXAMINATION", order:11, name:"Ova / Larvae",       unit:"",     type:"text", refRangeText:"Not seen" },
    ],
  },

];

// ── Unique departments list ────────────────────────────────────────
const DEPARTMENTS = [...new Set(TEMPLATES.map(t => t.department))];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const dept = searchParams.get("department") || "";
  const name = searchParams.get("name")       || "";

  let results = TEMPLATES;
  if (dept && dept !== "All") results = results.filter(t => t.department === dept);
  if (name) results = results.filter(t => t.name.toLowerCase().includes(name.toLowerCase()));

  return NextResponse.json({
    success:     true,
    templates:   results,
    departments: DEPARTMENTS,
    total:       results.length,
  });
}
