import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Pre-built lab test templates grouped by department.
// Hospitals can use these as-is or copy + customize them.
// refRangeText is what prints on the report (gender-specific versions indicated in the name).

const DEFAULT_TEMPLATES = [
  // ══════════════════════════════════════════════
  //  HAEMATOLOGY
  // ══════════════════════════════════════════════
  {
    name: "Complete Blood Count (CBC)",
    department: "Haematology",
    category: "Blood Test",
    sampleType: "Blood (EDTA)",
    parameters: [
      { paramId: "hb",   name: "Haemoglobin (Hb)",           unit: "g/dL",   type: "numeric", refMaleMin: 13,   refMaleMax: 17,   refFemaleMin: 11, refFemaleMax: 15,  refRangeText: "M: 13–17 | F: 11–15",  order: 1 },
      { paramId: "tlc",  name: "Total Leucocyte Count (TLC)", unit: "/mm³",   type: "numeric", refMaleMin: 4000, refMaleMax: 11000,refFemaleMin:4000,refFemaleMax:11000,refRangeText: "4000–11000",            order: 2 },
      { paramId: "neu",  name: "Neutrophils",                 unit: "%",      type: "numeric", refMaleMin: 50,   refMaleMax: 70,   refFemaleMin: 50, refFemaleMax: 70,  refRangeText: "50–70",                 order: 3 },
      { paramId: "lym",  name: "Lymphocytes",                 unit: "%",      type: "numeric", refMaleMin: 20,   refMaleMax: 40,   refFemaleMin: 20, refFemaleMax: 40,  refRangeText: "20–40",                 order: 4 },
      { paramId: "mon",  name: "Monocytes",                   unit: "%",      type: "numeric", refMaleMin: 2,    refMaleMax: 8,    refFemaleMin: 2,  refFemaleMax: 8,   refRangeText: "2–8",                   order: 5 },
      { paramId: "eos",  name: "Eosinophils",                 unit: "%",      type: "numeric", refMaleMin: 1,    refMaleMax: 4,    refFemaleMin: 1,  refFemaleMax: 4,   refRangeText: "1–4",                   order: 6 },
      { paramId: "bas",  name: "Basophils",                   unit: "%",      type: "numeric", refMaleMin: 0,    refMaleMax: 1,    refFemaleMin: 0,  refFemaleMax: 1,   refRangeText: "0–1",                   order: 7 },
      { paramId: "plt",  name: "Platelet Count",              unit: "L/mm³",  type: "numeric", refMaleMin: 1.5,  refMaleMax: 4.5,  refFemaleMin:1.5, refFemaleMax: 4.5, refRangeText: "1.5–4.5",               order: 8 },
      { paramId: "pcv",  name: "PCV / Haematocrit",           unit: "%",      type: "numeric", refMaleMin: 40,   refMaleMax: 54,   refFemaleMin: 36, refFemaleMax: 48,  refRangeText: "M: 40–54 | F: 36–48",  order: 9 },
      { paramId: "mcv",  name: "MCV",                         unit: "fL",     type: "numeric", refMaleMin: 80,   refMaleMax: 100,  refFemaleMin: 80, refFemaleMax: 100, refRangeText: "80–100",                order: 10 },
      { paramId: "mch",  name: "MCH",                         unit: "pg",     type: "numeric", refMaleMin: 27,   refMaleMax: 32,   refFemaleMin: 27, refFemaleMax: 32,  refRangeText: "27–32",                 order: 11 },
      { paramId: "mchc", name: "MCHC",                        unit: "g/dL",   type: "numeric", refMaleMin: 31,   refMaleMax: 35,   refFemaleMin: 31, refFemaleMax: 35,  refRangeText: "31–35",                 order: 12 },
      { paramId: "rbc",  name: "RBC Count",                   unit: "M/mm³",  type: "numeric", refMaleMin: 4.5,  refMaleMax: 5.5,  refFemaleMin:3.8, refFemaleMax: 4.8, refRangeText: "M: 4.5–5.5 | F: 3.8–4.8", order: 13 },
    ],
  },
  {
    name: "ESR (Erythrocyte Sedimentation Rate)",
    department: "Haematology",
    category: "Blood Test",
    sampleType: "Blood (EDTA)",
    parameters: [
      { paramId: "esr", name: "ESR (Westergren Method)", unit: "mm/hr", type: "numeric", refMaleMin: 0, refMaleMax: 15, refFemaleMin: 0, refFemaleMax: 20, refRangeText: "M: 0–15 | F: 0–20", order: 1 },
    ],
  },
  {
    name: "Blood Group & Rh Factor",
    department: "Haematology",
    category: "Blood Test",
    sampleType: "Blood",
    parameters: [
      { paramId: "abog",  name: "ABO Blood Group", unit: "", type: "text", refRangeText: "A / B / AB / O", order: 1 },
      { paramId: "rhfac", name: "Rh Factor",        unit: "", type: "text", refRangeText: "Positive / Negative", order: 2 },
    ],
  },

  // ══════════════════════════════════════════════
  //  BIOCHEMISTRY — Blood Sugar
  // ══════════════════════════════════════════════
  {
    name: "Blood Sugar Fasting (FBS)",
    department: "Biochemistry",
    category: "Blood Test",
    sampleType: "Blood (Plasma/Serum) — Fasting",
    parameters: [
      { paramId: "fbs", name: "Fasting Blood Sugar (FBS)", unit: "mg/dL", type: "numeric", refMaleMin: 70, refMaleMax: 100, refFemaleMin: 70, refFemaleMax: 100, refRangeText: "70–100 (Normal) | 101–125 (Pre-diabetic) | ≥126 (Diabetic)", order: 1 },
    ],
  },
  {
    name: "Blood Sugar Post Prandial (PPBS)",
    department: "Biochemistry",
    category: "Blood Test",
    sampleType: "Blood (Plasma/Serum) — 2hrs Post Meal",
    parameters: [
      { paramId: "ppbs", name: "Post Prandial Blood Sugar (PPBS)", unit: "mg/dL", type: "numeric", refMaleMin: 0, refMaleMax: 140, refFemaleMin: 0, refFemaleMax: 140, refRangeText: "< 140 (Normal) | 140–199 (Pre-diabetic) | ≥200 (Diabetic)", order: 1 },
    ],
  },
  {
    name: "Random Blood Sugar (RBS)",
    department: "Biochemistry",
    category: "Blood Test",
    sampleType: "Blood (Plasma/Serum)",
    parameters: [
      { paramId: "rbs", name: "Random Blood Sugar (RBS)", unit: "mg/dL", type: "numeric", refMaleMin: 0, refMaleMax: 200, refFemaleMin: 0, refFemaleMax: 200, refRangeText: "< 200 (Normal)", order: 1 },
    ],
  },
  {
    name: "HbA1c (Glycated Haemoglobin)",
    department: "Biochemistry",
    category: "Blood Test",
    sampleType: "Blood (EDTA)",
    parameters: [
      { paramId: "hba1c", name: "HbA1c (Glycated Haemoglobin)", unit: "%", type: "numeric", refMaleMin: 0, refMaleMax: 5.6, refFemaleMin: 0, refFemaleMax: 5.6, refRangeText: "< 5.7% Normal | 5.7–6.4% Pre-diabetic | ≥ 6.5% Diabetic", order: 1 },
    ],
  },

  // ══════════════════════════════════════════════
  //  BIOCHEMISTRY — Liver Function
  // ══════════════════════════════════════════════
  {
    name: "Liver Function Test (LFT)",
    department: "Biochemistry",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId: "tbil",  name: "Total Bilirubin",    unit: "mg/dL", type: "numeric", refMaleMin: 0.2, refMaleMax: 1.0,  refFemaleMin: 0.2,  refFemaleMax: 1.0,  refRangeText: "0.2–1.0",    order: 1 },
      { paramId: "dbil",  name: "Direct Bilirubin",   unit: "mg/dL", type: "numeric", refMaleMin: 0.0, refMaleMax: 0.3,  refFemaleMin: 0.0,  refFemaleMax: 0.3,  refRangeText: "0.0–0.3",    order: 2 },
      { paramId: "ibil",  name: "Indirect Bilirubin", unit: "mg/dL", type: "numeric", refMaleMin: 0.2, refMaleMax: 0.8,  refFemaleMin: 0.2,  refFemaleMax: 0.8,  refRangeText: "0.2–0.8",    order: 3 },
      { paramId: "sgot",  name: "SGOT / AST",          unit: "U/L",   type: "numeric", refMaleMin: 10,  refMaleMax: 40,   refFemaleMin: 10,   refFemaleMax: 35,   refRangeText: "M: 10–40 | F: 10–35", order: 4 },
      { paramId: "sgpt",  name: "SGPT / ALT",          unit: "U/L",   type: "numeric", refMaleMin: 10,  refMaleMax: 45,   refFemaleMin: 10,   refFemaleMax: 35,   refRangeText: "M: 10–45 | F: 10–35", order: 5 },
      { paramId: "alp",   name: "Alkaline Phosphatase (ALP)", unit: "U/L", type: "numeric", refMaleMin: 44, refMaleMax: 147, refFemaleMin: 44, refFemaleMax: 147, refRangeText: "44–147",      order: 6 },
      { paramId: "tprot", name: "Total Protein",       unit: "g/dL",  type: "numeric", refMaleMin: 6.0, refMaleMax: 8.3,  refFemaleMin: 6.0,  refFemaleMax: 8.3,  refRangeText: "6.0–8.3",    order: 7 },
      { paramId: "alb",   name: "Albumin",             unit: "g/dL",  type: "numeric", refMaleMin: 3.5, refMaleMax: 5.0,  refFemaleMin: 3.5,  refFemaleMax: 5.0,  refRangeText: "3.5–5.0",    order: 8 },
      { paramId: "glob",  name: "Globulin",            unit: "g/dL",  type: "numeric", refMaleMin: 2.0, refMaleMax: 3.5,  refFemaleMin: 2.0,  refFemaleMax: 3.5,  refRangeText: "2.0–3.5",    order: 9 },
      { paramId: "agrat", name: "A/G Ratio",           unit: "",      type: "numeric", refMaleMin: 1.0, refMaleMax: 2.0,  refFemaleMin: 1.0,  refFemaleMax: 2.0,  refRangeText: "1.0–2.0",    order: 10 },
    ],
  },

  // ══════════════════════════════════════════════
  //  BIOCHEMISTRY — Kidney Function
  // ══════════════════════════════════════════════
  {
    name: "Kidney Function Test (KFT)",
    department: "Biochemistry",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId: "urea", name: "Blood Urea",        unit: "mg/dL", type: "numeric", refMaleMin: 10, refMaleMax: 45,  refFemaleMin: 10,  refFemaleMax: 45,  refRangeText: "10–45",                     order: 1 },
      { paramId: "bun",  name: "BUN",               unit: "mg/dL", type: "numeric", refMaleMin: 7,  refMaleMax: 20,  refFemaleMin: 7,   refFemaleMax: 20,  refRangeText: "7–20",                      order: 2 },
      { paramId: "scr",  name: "Serum Creatinine",  unit: "mg/dL", type: "numeric", refMaleMin: 0.7,refMaleMax: 1.2, refFemaleMin: 0.5, refFemaleMax: 1.0, refRangeText: "M: 0.7–1.2 | F: 0.5–1.0", order: 3 },
      { paramId: "ua",   name: "Uric Acid",         unit: "mg/dL", type: "numeric", refMaleMin: 3.5,refMaleMax: 7.2, refFemaleMin: 2.6, refFemaleMax: 6.0, refRangeText: "M: 3.5–7.2 | F: 2.6–6.0", order: 4 },
    ],
  },

  // ══════════════════════════════════════════════
  //  BIOCHEMISTRY — Lipid Profile
  // ══════════════════════════════════════════════
  {
    name: "Lipid Profile",
    department: "Biochemistry",
    category: "Blood Test",
    sampleType: "Blood (Serum) — Fasting 12 hrs",
    parameters: [
      { paramId: "tchol",  name: "Total Cholesterol",  unit: "mg/dL", type: "numeric", refMaleMin: 0,  refMaleMax: 199, refFemaleMin: 0,   refFemaleMax: 199, refRangeText: "< 200 (Desirable)",    order: 1 },
      { paramId: "hdl",    name: "HDL Cholesterol",    unit: "mg/dL", type: "numeric", refMaleMin: 40, refMaleMax: 999, refFemaleMin: 50,  refFemaleMax: 999, refRangeText: "M: > 40 | F: > 50",    order: 2 },
      { paramId: "ldl",    name: "LDL Cholesterol",    unit: "mg/dL", type: "numeric", refMaleMin: 0,  refMaleMax: 100, refFemaleMin: 0,   refFemaleMax: 100, refRangeText: "< 100 (Optimal)",       order: 3 },
      { paramId: "vldl",   name: "VLDL",               unit: "mg/dL", type: "numeric", refMaleMin: 5,  refMaleMax: 40,  refFemaleMin: 5,   refFemaleMax: 40,  refRangeText: "5–40",                  order: 4 },
      { paramId: "trig",   name: "Triglycerides",      unit: "mg/dL", type: "numeric", refMaleMin: 0,  refMaleMax: 149, refFemaleMin: 0,   refFemaleMax: 149, refRangeText: "< 150 (Normal)",        order: 5 },
      { paramId: "tchdl",  name: "TC / HDL Ratio",     unit: "",      type: "numeric", refMaleMin: 0,  refMaleMax: 5.0, refFemaleMin: 0,   refFemaleMax: 5.0, refRangeText: "< 5.0 (Desirable)",    order: 6 },
    ],
  },

  // ══════════════════════════════════════════════
  //  BIOCHEMISTRY — Electrolytes
  // ══════════════════════════════════════════════
  {
    name: "Serum Electrolytes",
    department: "Biochemistry",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId: "na",  name: "Sodium (Na⁺)",     unit: "mEq/L", type: "numeric", refMaleMin: 136, refMaleMax: 145, refFemaleMin: 136, refFemaleMax: 145, refRangeText: "136–145", order: 1 },
      { paramId: "k",   name: "Potassium (K⁺)",   unit: "mEq/L", type: "numeric", refMaleMin: 3.5, refMaleMax: 5.0, refFemaleMin: 3.5, refFemaleMax: 5.0, refRangeText: "3.5–5.0", order: 2 },
      { paramId: "cl",  name: "Chloride (Cl⁻)",   unit: "mEq/L", type: "numeric", refMaleMin: 98,  refMaleMax: 107, refFemaleMin: 98,  refFemaleMax: 107, refRangeText: "98–107",  order: 3 },
    ],
  },

  // ══════════════════════════════════════════════
  //  ENDOCRINOLOGY — Thyroid
  // ══════════════════════════════════════════════
  {
    name: "Thyroid Profile (T3, T4, TSH)",
    department: "Endocrinology",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId: "t3",  name: "T3 (Triiodothyronine)",   unit: "ng/dL",   type: "numeric", refMaleMin: 80,  refMaleMax: 200, refFemaleMin: 80,  refFemaleMax: 200, refRangeText: "80–200",    order: 1 },
      { paramId: "t4",  name: "T4 (Thyroxine)",           unit: "µg/dL",   type: "numeric", refMaleMin: 5.5, refMaleMax: 11,  refFemaleMin: 5.5, refFemaleMax: 11,  refRangeText: "5.5–11.0", order: 2 },
      { paramId: "tsh", name: "TSH (Thyroid Stimulating Hormone)", unit: "µIU/mL", type: "numeric", refMaleMin: 0.5, refMaleMax: 5.0, refFemaleMin: 0.5, refFemaleMax: 5.0, refRangeText: "0.5–5.0", order: 3 },
    ],
  },
  {
    name: "TSH (Thyroid Stimulating Hormone)",
    department: "Endocrinology",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId: "tsh", name: "TSH (Thyroid Stimulating Hormone)", unit: "µIU/mL", type: "numeric", refMaleMin: 0.5, refMaleMax: 5.0, refFemaleMin: 0.5, refFemaleMax: 5.0, refRangeText: "0.5–5.0", order: 1 },
    ],
  },

  // ══════════════════════════════════════════════
  //  BIOCHEMISTRY — Vitamins & Minerals
  // ══════════════════════════════════════════════
  {
    name: "Serum Vitamin D (25-OH)",
    department: "Biochemistry",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId: "vitd", name: "25-OH Vitamin D", unit: "ng/mL", type: "numeric", refMaleMin: 30, refMaleMax: 100, refFemaleMin: 30, refFemaleMax: 100, refRangeText: "< 20: Deficient | 20–29: Insufficient | 30–100: Normal", order: 1 },
    ],
  },
  {
    name: "Serum Vitamin B12",
    department: "Biochemistry",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId: "vitb12", name: "Vitamin B12 (Cyanocobalamin)", unit: "pg/mL", type: "numeric", refMaleMin: 200, refMaleMax: 900, refFemaleMin: 200, refFemaleMax: 900, refRangeText: "200–900 (Normal) | < 200 (Deficient)", order: 1 },
    ],
  },
  {
    name: "Serum Calcium",
    department: "Biochemistry",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId: "ca", name: "Serum Calcium", unit: "mg/dL", type: "numeric", refMaleMin: 8.5, refMaleMax: 10.5, refFemaleMin: 8.5, refFemaleMax: 10.5, refRangeText: "8.5–10.5", order: 1 },
    ],
  },
  {
    name: "Iron Studies (TIBC)",
    department: "Biochemistry",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId: "fe",   name: "Serum Iron",   unit: "µg/dL", type: "numeric", refMaleMin: 60, refMaleMax: 170, refFemaleMin: 50, refFemaleMax: 170, refRangeText: "M: 60–170 | F: 50–170", order: 1 },
      { paramId: "tibc", name: "TIBC",         unit: "µg/dL", type: "numeric", refMaleMin: 250,refMaleMax: 370, refFemaleMin: 250,refFemaleMax: 370, refRangeText: "250–370",              order: 2 },
      { paramId: "tsat", name: "Transferrin Saturation", unit: "%", type: "numeric", refMaleMin: 20, refMaleMax: 50, refFemaleMin: 15, refFemaleMax: 50, refRangeText: "M: 20–50 | F: 15–50", order: 3 },
    ],
  },

  // ══════════════════════════════════════════════
  //  SEROLOGY
  // ══════════════════════════════════════════════
  {
    name: "Widal Test",
    department: "Serology",
    category: "Serology",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId: "to",  name: "Salmonella typhi O (TO)",     unit: "", type: "text", refRangeText: "< 1:80 (Significant ≥ 1:160)",  order: 1 },
      { paramId: "th",  name: "Salmonella typhi H (TH)",     unit: "", type: "text", refRangeText: "< 1:160 (Significant ≥ 1:320)", order: 2 },
      { paramId: "ao",  name: "Salmonella paratyphi A (AO)", unit: "", type: "text", refRangeText: "< 1:40 (Significant ≥ 1:80)",   order: 3 },
      { paramId: "bh",  name: "Salmonella paratyphi B (BH)", unit: "", type: "text", refRangeText: "< 1:40 (Significant ≥ 1:80)",   order: 4 },
    ],
  },
  {
    name: "HBsAg (Hepatitis B Surface Antigen)",
    department: "Serology",
    category: "Serology",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId: "hbsag", name: "HBsAg (Hepatitis B Surface Antigen)", unit: "", type: "text", refRangeText: "Non-Reactive (Normal)", order: 1 },
    ],
  },
  {
    name: "Anti-HCV (Hepatitis C Antibody)",
    department: "Serology",
    category: "Serology",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId: "hcv", name: "Anti-HCV Antibody", unit: "", type: "text", refRangeText: "Non-Reactive (Normal)", order: 1 },
    ],
  },
  {
    name: "HIV I & II Antibody",
    department: "Serology",
    category: "Serology",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId: "hiv", name: "HIV I & II Antibody (ELISA)", unit: "", type: "text", refRangeText: "Non-Reactive (Normal)", order: 1 },
    ],
  },
  {
    name: "Dengue NS1 Antigen",
    department: "Serology",
    category: "Serology",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId: "dns1", name: "Dengue NS1 Antigen",  unit: "", type: "text", refRangeText: "Negative (Normal)", order: 1 },
      { paramId: "digm", name: "Dengue IgM Antibody", unit: "", type: "text", refRangeText: "Negative (Normal)", order: 2 },
      { paramId: "digg", name: "Dengue IgG Antibody", unit: "", type: "text", refRangeText: "Negative (Normal)", order: 3 },
    ],
  },
  {
    name: "Malaria Parasite (MP)",
    department: "Serology",
    category: "Serology",
    sampleType: "Blood (Peripheral Smear)",
    parameters: [
      { paramId: "mpvf", name: "Malaria Parasite (P. vivax / falciparum)", unit: "", type: "text", refRangeText: "Not seen (Normal)", order: 1 },
    ],
  },
  {
    name: "CRP (C-Reactive Protein)",
    department: "Serology",
    category: "Serology",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId: "crp", name: "C-Reactive Protein (CRP)", unit: "mg/L", type: "numeric", refMaleMin: 0, refMaleMax: 5, refFemaleMin: 0, refFemaleMax: 5, refRangeText: "< 5 (Normal) | 5–10 (Mild) | > 10 (High)", order: 1 },
    ],
  },
  {
    name: "RA Factor (Rheumatoid Arthritis)",
    department: "Serology",
    category: "Serology",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId: "ra", name: "RA Factor", unit: "IU/mL", type: "numeric", refMaleMin: 0, refMaleMax: 14, refFemaleMin: 0, refFemaleMax: 14, refRangeText: "< 14 (Negative)", order: 1 },
    ],
  },

  // ══════════════════════════════════════════════
  //  URINE ANALYSIS
  // ══════════════════════════════════════════════
  {
    name: "Urine Routine & Microscopy",
    department: "Urine Analysis",
    category: "Urine Test",
    sampleType: "Urine (Midstream)",
    parameters: [
      { paramId: "ucol",  name: "Colour",            unit: "", type: "text",    refRangeText: "Pale Yellow to Yellow", order: 1 },
      { paramId: "uapp",  name: "Appearance",        unit: "", type: "text",    refRangeText: "Clear",                 order: 2 },
      { paramId: "uph",   name: "pH",                unit: "", type: "numeric", refMaleMin: 4.5, refMaleMax: 8.5, refFemaleMin: 4.5, refFemaleMax: 8.5, refRangeText: "4.5–8.5", order: 3 },
      { paramId: "usg",   name: "Specific Gravity",  unit: "", type: "numeric", refMaleMin: 1.005, refMaleMax: 1.030, refFemaleMin: 1.005, refFemaleMax: 1.030, refRangeText: "1.005–1.030", order: 4 },
      { paramId: "upro",  name: "Protein",           unit: "", type: "text",    refRangeText: "Absent (Normal)",       order: 5 },
      { paramId: "usug",  name: "Sugar (Glucose)",   unit: "", type: "text",    refRangeText: "Absent (Normal)",       order: 6 },
      { paramId: "uket",  name: "Ketones / Acetone", unit: "", type: "text",    refRangeText: "Absent (Normal)",       order: 7 },
      { paramId: "uepi",  name: "Epithelial Cells",  unit: "/hpf", type: "text",refRangeText: "Few (Normal)",          order: 8 },
      { paramId: "upus",  name: "Pus Cells (WBC)",   unit: "/hpf", type: "numeric", refMaleMin: 0, refMaleMax: 5, refFemaleMin: 0, refFemaleMax: 5, refRangeText: "0–5",     order: 9 },
      { paramId: "urbc",  name: "RBC",               unit: "/hpf", type: "numeric", refMaleMin: 0, refMaleMax: 2, refFemaleMin: 0, refFemaleMax: 2, refRangeText: "0–2",     order: 10 },
      { paramId: "ucast", name: "Casts",             unit: "", type: "text",    refRangeText: "None (Normal)",         order: 11 },
      { paramId: "ucrys", name: "Crystals",          unit: "", type: "text",    refRangeText: "None (Normal)",         order: 12 },
      { paramId: "ubact", name: "Bacteria",          unit: "", type: "text",    refRangeText: "None / Few (Normal)",   order: 13 },
    ],
  },

  // ══════════════════════════════════════════════
  //  CARDIOLOGY / BIOCHEMISTRY
  // ══════════════════════════════════════════════
  {
    name: "Cardiac Risk Markers",
    department: "Biochemistry",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId: "cpk",    name: "CPK (Creatine Phosphokinase)", unit: "U/L",   type: "numeric", refMaleMin: 38, refMaleMax: 174, refFemaleMin: 26, refFemaleMax: 140, refRangeText: "M: 38–174 | F: 26–140", order: 1 },
      { paramId: "cpkmb",  name: "CPK-MB",                      unit: "U/L",   type: "numeric", refMaleMin: 0,  refMaleMax: 25,  refFemaleMin: 0,  refFemaleMax: 25,  refRangeText: "< 25",                  order: 2 },
      { paramId: "tropon", name: "Troponin I",                   unit: "ng/mL", type: "numeric", refMaleMin: 0,  refMaleMax: 0.04,refFemaleMin: 0,  refFemaleMax:0.04, refRangeText: "< 0.04 (Normal)",       order: 3 },
    ],
  },

  // ══════════════════════════════════════════════
  //  ONCOLOGY (PSA)
  // ══════════════════════════════════════════════
  {
    name: "PSA (Prostate Specific Antigen)",
    department: "Oncology",
    category: "Blood Test",
    sampleType: "Blood (Serum)",
    parameters: [
      { paramId: "psa", name: "Total PSA", unit: "ng/mL", type: "numeric", refMaleMin: 0, refMaleMax: 4.0, refFemaleMin: 0, refFemaleMax: 4.0, refRangeText: "< 4.0 (Normal) | 4–10 (Borderline) | > 10 (High)", order: 1 },
    ],
  },
];

// GET — returns all default templates, optionally filtered by department
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const dept = searchParams.get("department") || "";

  let templates = DEFAULT_TEMPLATES;
  if (dept) {
    templates = templates.filter(t => t.department.toLowerCase() === dept.toLowerCase());
  }

  // Build unique department list for sidebar navigation
  const departments = [...new Set(DEFAULT_TEMPLATES.map(t => t.department))];

  return NextResponse.json({
    success: true,
    templates,
    departments,
    total: templates.length,
  });
}
