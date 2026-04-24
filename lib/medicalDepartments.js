// CommonJS/ESM-compatible version for .js API routes.
// Single source of truth — mirrors lib/medicalDepartments.ts

const MEDICAL_DEPARTMENTS = [
  "General Medicine","General Surgery","Pediatrics","Gynecology & Obstetrics",
  "Orthopedics","Cardiology","Cardiac Surgery","Neurology","Neurosurgery",
  "Dermatology","ENT (Ear, Nose, Throat)","Ophthalmology","Urology","Nephrology",
  "Gastroenterology","Hepatology","Pulmonology","Endocrinology","Oncology",
  "Hematology","Rheumatology","Psychiatry","Psychology","Radiology","Pathology",
  "Anesthesiology","Dentistry","Physiotherapy","Plastic & Reconstructive Surgery",
  "Vascular Surgery","Proctology","Neonatology","Geriatrics","Palliative Care",
  "Sports Medicine","Dietetics & Nutrition","Other",
];

const SURGERY_DEPARTMENTS = [
  "General Surgery","Orthopedic Surgery","Cardiac Surgery","Neurosurgery",
  "Gynecology & Obstetrics","Urology","Oncology Surgery","Ophthalmology",
  "ENT Surgery","Dental & Maxillofacial","Plastic & Reconstructive Surgery",
  "Vascular Surgery","Pediatric Surgery","Proctology","Laparoscopic Surgery","Other",
];

const SURGERIES_BY_DEPARTMENT = {
  "General Surgery": ["Appendectomy (Appendix Removal)","Laparoscopic Hernia Repair","Inguinal Hernia Repair","Umbilical Hernia Repair","Incisional Hernia Repair","Cholecystectomy (Gallbladder Removal)","Laparoscopic Cholecystectomy","Hemorrhoidectomy (Piles Surgery)","Stapler Hemorrhoidectomy","Fistula-in-Ano Surgery","Fissure Surgery (LIS)","Pilonidal Sinus Surgery","Thyroidectomy (Thyroid Removal)","Parathyroidectomy","Varicose Vein Surgery","Laser Varicose Vein Treatment","Adult Circumcision","Hydrocele Surgery","Varicocele Surgery","Lipoma Removal","Sebaceous Cyst Removal","Abscess Drainage & Debridement","Mastectomy (Breast Removal)","Lumpectomy (Breast Lump)","Splenectomy","Gastric Bypass Surgery","Sleeve Gastrectomy (Bariatric)","Exploratory Laparotomy","Biopsy (Surgical)"],
  "Orthopedic Surgery": ["Total Knee Replacement (TKR)","Partial Knee Replacement (UKR)","Total Hip Replacement (THR)","Hip Resurfacing","Shoulder Replacement","ACL Reconstruction","PCL Reconstruction","Meniscus Repair","Meniscectomy","Shoulder Arthroscopy","Knee Arthroscopy","Lumbar Disc Surgery (Microdiscectomy)","Lumbar Spine Fusion","Cervical Disc Surgery (ACDF)","Spine Decompression (Laminectomy)","Scoliosis Correction Surgery","Fracture Fixation (ORIF)","Intramedullary Nailing","Bone Grafting","Osteotomy","Bunion Surgery (Hallux Valgus)","Carpal Tunnel Release","Trigger Finger Release","Rotator Cuff Repair","Tendon Repair","Clubfoot Correction","Amputation"],
  "Cardiac Surgery": ["Coronary Artery Bypass Grafting (CABG)","Off-Pump CABG (Beating Heart Surgery)","Aortic Valve Replacement (AVR)","Mitral Valve Replacement (MVR)","Mitral Valve Repair","Tricuspid Valve Repair","Double Valve Replacement","Aortic Aneurysm Repair","Pacemaker Implantation","ICD (Defibrillator) Implant","ASD Closure","VSD Closure","PDA Ligation","Coronary Angioplasty (PTCA/Stenting)","Atrial Fibrillation Ablation","Heart Transplant","Pericardiectomy","TAVI (Transcatheter Aortic Valve)"],
  "Neurosurgery": ["Brain Tumor Surgery","Craniotomy","Cranioplasty","Hydrocephalus Shunt (VP Shunt)","Burr Hole Surgery","Skull Fracture Repair","Lumbar Disc Surgery (Discectomy)","Cervical Disc Surgery (ACDF)","Spinal Cord Decompression","Spinal Fusion Surgery","Deep Brain Stimulation (DBS)","Epilepsy Surgery","Pituitary Tumor Surgery","Carotid Endarterectomy","Stereotactic Biopsy","Peripheral Nerve Surgery","Trigeminal Neuralgia Surgery"],
  "Gynecology & Obstetrics": ["Caesarean Section (C-Section)","Normal Delivery (Episiotomy)","Hysterectomy (Uterus Removal)","Laparoscopic Hysterectomy","Vaginal Hysterectomy","Myomectomy (Fibroid Removal)","Laparoscopic Myomectomy","Ovarian Cystectomy","D&C (Dilation & Curettage)","Tubal Ligation (Female Sterilization)","Laparoscopic Sterilization","Endometriosis Surgery","LEEP Procedure (Cervix)","Cervical Cerclage","Vaginal Repair (Colporrhaphy)","Ectopic Pregnancy Surgery","Fertility-Enhancing Surgery","Diagnostic Laparoscopy"],
  "Urology": ["Kidney Stone Removal (PCNL)","Kidney Stone (URSL - Ureteroscopy)","Kidney Stone (ESWL - Lithotripsy)","Nephrectomy (Kidney Removal)","Partial Nephrectomy","Pyeloplasty","Prostate Surgery (TURP)","Laser Prostate Surgery (HoLEP)","Prostatectomy","Cystoscopy","Bladder Stone Removal (TURBT)","Bladder Tumor Surgery","Ureteroscopy (URS)","Urethral Stricture Surgery","Urethroplasty","Vasectomy","Vasectomy Reversal","Orchidopexy (Undescended Testis)","Varicocelectomy","Circumcision (Urology)","Adrenalectomy","Renal Transplant"],
  "Oncology Surgery": ["Breast Cancer Surgery (Mastectomy)","Breast-Conserving Surgery (Lumpectomy)","Colorectal Cancer Surgery","Lung Cancer Surgery (Lobectomy)","Prostate Cancer Surgery","Cervical Cancer Surgery","Ovarian Cancer Surgery","Thyroid Cancer Surgery","Oral Cancer Surgery","Esophageal Cancer Surgery","Stomach Cancer Surgery (Gastrectomy)","Liver Cancer Surgery (Hepatectomy)","Pancreatic Cancer Surgery (Whipple)","Kidney Cancer Surgery","Bladder Cancer Surgery","Lymph Node Biopsy / Dissection"],
  "Ophthalmology": ["Cataract Surgery (Phacoemulsification)","Cataract Surgery (Manual SICS)","Premium IOL Implant","LASIK Eye Surgery","SMILE Eye Surgery","Pterygium Surgery","Glaucoma Surgery (Trabeculectomy)","Retinal Detachment Repair","Vitrectomy","DCR Surgery","Squint Correction Surgery","Eyelid Surgery (Ptosis Correction)","Chalazion Removal","Corneal Transplant (Keratoplasty)"],
  "ENT Surgery": ["Tonsillectomy","Adenoidectomy","Tonsillectomy & Adenoidectomy (T&A)","Septoplasty","Rhinoplasty","FESS (Sinus Surgery)","Nasal Polypectomy","Turbinoplasty","Tympanoplasty (Ear Drum Repair)","Mastoidectomy","Myringotomy","Stapedotomy","Cochlear Implant","Parotidectomy","Neck Dissection","Tracheostomy","UPPP (Sleep Apnea)"],
  "Dental & Maxillofacial": ["Wisdom Tooth Extraction (Impacted)","Tooth Extraction","Dental Implant","Root Canal Treatment (RCT)","Jaw Surgery (Orthognathic Surgery)","Cleft Lip Repair","Cleft Palate Repair","TMJ Surgery","Gum Surgery (Gingivectomy)","Bone Grafting (Dental)","Oral Cancer Surgery","Facial Fracture Surgery"],
  "Plastic & Reconstructive Surgery": ["Rhinoplasty (Nose Job)","Facelift","Brow Lift","Eyelid Surgery","Ear Reshaping (Otoplasty)","Liposuction","Tummy Tuck (Abdominoplasty)","Breast Augmentation","Breast Reduction","Breast Lift","Gynecomastia Surgery","Body Contouring","Scar Revision Surgery","Keloid Removal","Burn Skin Grafting","Flap Surgery","Hair Transplant (FUE/FUT)","Post-Bariatric Body Contouring"],
  "Vascular Surgery": ["Varicose Vein Surgery (Open)","Endovenous Laser Ablation (EVLA)","Carotid Endarterectomy","Aortic Aneurysm Repair","Peripheral Artery Bypass","AV Fistula Creation (Dialysis)","Thrombectomy","Embolectomy","Amputation"],
  "Pediatric Surgery": ["Appendectomy (Pediatric)","Hernia Repair (Pediatric)","Hydrocele Repair","Orchidopexy","Circumcision (Pediatric)","Cleft Lip Repair","Cleft Palate Repair","Hypospadias Repair","Pyloric Stenosis (Pyloromyotomy)","Wilms Tumor Surgery","Congenital Heart Surgery (Pediatric)","VP Shunt (Pediatric)","Clubfoot Surgery"],
  "Proctology": ["Hemorrhoidectomy (Piles Open Surgery)","Stapler Hemorrhoidectomy","Laser Piles Surgery","Fistula-in-Ano Surgery (Fistulectomy)","Laser Fistula Treatment (FiLaC)","Anal Fissure Surgery (LIS)","Pilonidal Sinus Surgery","Laser Pilonidal Sinus","Rectal Prolapse Surgery","Colostomy / Ileostomy"],
  "Laparoscopic Surgery": ["Laparoscopic Appendectomy","Laparoscopic Cholecystectomy","Laparoscopic Hernia Repair","Laparoscopic Hysterectomy","Laparoscopic Myomectomy","Laparoscopic Ovarian Cystectomy","Laparoscopic Nephrectomy","Laparoscopic Splenectomy","Laparoscopic Fundoplication (GERD)","Laparoscopic Colectomy","Laparoscopic Gastric Bypass","Laparoscopic Sleeve Gastrectomy","Robotic Surgery (Laparoscopic)","Diagnostic Laparoscopy"],
  "Other": [],
};

module.exports = { MEDICAL_DEPARTMENTS, SURGERY_DEPARTMENTS, SURGERIES_BY_DEPARTMENT };
