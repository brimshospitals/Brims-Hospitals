import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Doctor  from "../../../../models/Doctor";
import User    from "../../../../models/User";
import Booking from "../../../../models/Booking";

export const dynamic = "force-dynamic";

// Comprehensive Symptom → Department mapping
const SYMPTOM_MAP = [
  {
    dept: "Cardiology",
    keys: [
      "chest pain","seene mein dard","seene dard","heart","dil","palpitation","dhadkan",
      "breathless","saans phoolna","saans fulna","high bp","low bp","blood pressure","bp",
      "irregular heartbeat","swollen legs","pair soojhna","heart attack","angina",
      "cardiac","arrhythmia","heart failure","cholesterol","ecg",
    ],
  },
  {
    dept: "Orthopedics",
    keys: [
      "joint pain","jodo ka dard","jodi dard","bone","haddi","knee pain","ghutna dard",
      "back pain","kamar dard","neck pain","gardan dard","shoulder pain","kandha dard",
      "fracture","haddi tootna","slip disc","arthritis","gathiya","spondylitis",
      "ligament","muscle pain","sprain","hip pain","ankle pain","wrist pain",
      "sports injury","swollen joint","stiffness","akadna",
    ],
  },
  {
    dept: "Gastroenterology",
    keys: [
      "stomach pain","pet dard","acidity","jalan","heartburn","vomiting","ulti","nausea",
      "diarrhea","dast","loose motion","constipation","kabz","bloating","gas","afara",
      "liver","jaundice","peeliya","piles","bawasir","hemorrhoid","ibs","colitis",
      "gastric","indigestion","burping","regurgitation","blood in stool",
      "appendix","hernia","gallstone","ulcer",
    ],
  },
  {
    dept: "Gynecology",
    keys: [
      "irregular periods","period nahi aana","heavy bleeding","zyada bleeding","pregnancy",
      "white discharge","safed pani","leucorrhea","uterus","ovary","pcod","pcos",
      "menstrual pain","periods mein dard","delivery","prasav","menopause",
      "vaginal","infertility","baccha nahi hona","fibroid","cyst","cervical",
      "family planning","abortion","antenatal","postnatal",
    ],
  },
  {
    dept: "Pediatrics",
    keys: [
      "child","baby","bachcha","infant","newborn","neonatal","bacche ki","bachchi",
      "child fever","baby cough","child vomiting","child diarrhea","poor growth",
      "vaccination","immunization","child weakness","baal rog","pediatric",
      "child nutrition","malnutrition","child rash","diaper rash","teething",
    ],
  },
  {
    dept: "Neurology",
    keys: [
      "migraine","seizures","fits","mirgi","memory loss","yaadash","numbness",
      "sunapan","paralysis","lakwa","vertigo","stroke","brain","dementia",
      "parkinson","tremor","kanaapna","nerve pain","neuropathy","unconscious",
      "behoshi","epilepsy","spinal","meningitis","brain tumor",
    ],
  },
  {
    dept: "ENT",
    keys: [
      "ear pain","kaan dard","hearing loss","kaan se sunai nahi","nose blockage",
      "naak band","sinus","sinusitis","tonsils","voice change","awaaz baiThna",
      "throat pain","gala dard","snoring","kharrate","ear infection","ear wax",
      "nasal polyp","deviated septum","adenoid","laryngitis","pharyngitis",
      "dizziness related ear","ear ringing","tinnitus",
    ],
  },
  {
    dept: "Dermatology",
    keys: [
      "skin rash","daane","itching","khujli","acne","pimples","eczema",
      "psoriasis","safed daag","vitiligo","hair fall","baal jhadna","fungal infection",
      "ring worm","daad","allergy","hives","urticaria","wart","mole","skin tag",
      "dandruff","rosacea","seborrheic","dry skin","oily skin","hyperpigmentation",
      "dark spots","nail problem","nakhun","scabies","khaj","chickenpox",
    ],
  },
  {
    dept: "Ophthalmology",
    keys: [
      "eye pain","aankh dard","blurred vision","dhundla dikhna","red eyes","lal aankh",
      "cataract","motia","watery eyes","aankh se paani","eye infection","conjunctivitis",
      "specs check","chashma","night blindness","raat ko na dikhna","glaucoma",
      "eye allergy","stye","aankhon mein jalan","double vision","squint","lazy eye",
    ],
  },
  {
    dept: "Urology",
    keys: [
      "burning urination","peshab mein jalan","kidney stone","pathri","frequent urination",
      "baar baar peshab","blood in urine","peshab mein khoon","prostate","urinary infection",
      "uti","bladder","kidney pain","kidney failure","dialysis","incontinence",
      "peshab rok nahi pana","erectile dysfunction","male infertility","varicocele",
    ],
  },
  {
    dept: "Pulmonology",
    keys: [
      "breathing difficulty","saans lena mushkil","asthma","dama","tb","tuberculosis",
      "chronic cough","wheezing","chest tightness","lung infection","pneumonia",
      "bronchitis","copd","sleep apnea","oxygen level","spo2","pleural","phephde",
    ],
  },
  {
    dept: "Diabetology",
    keys: [
      "diabetes","sugar","blood sugar","high sugar","sugar zyada","insulin","madhumeh",
      "low sugar","hypoglycemia","hba1c","fasting sugar","excessive thirst","zyada pyaas",
      "wound not healing","ghao nahi bharna","weight loss","wajan kamana",
      "diabetic foot","neuropathy diabetes","retinopathy",
    ],
  },
  {
    dept: "Psychiatry",
    keys: [
      "anxiety","ghabrahaat","depression","udaasi","sleep problem","neend na aana",
      "insomnia","stress","tanav","mood swings","phobia","ocd","panic attack",
      "schizophrenia","bipolar","mental health","addiction","drug","alcohol","nasha",
      "self harm","suicidal","anger issues","adhd","autism","memory problem",
    ],
  },
  {
    dept: "General Medicine",
    keys: [
      "fever","bukhar","cough","khansi","cold","nazla","sardi","headache","sir dard",
      "body pain","badan dard","weakness","kamzori","fatigue","thakan",
      "sore throat","gale mein dard","viral","infection","flu","running nose",
      "loss of appetite","bhook na lagna","malaise","typhoid","dengue","malaria",
      "chikungunya","jaundice","anemia","khoon ki kami","vitamin deficiency",
    ],
  },
];

function detectDept(symptoms) {
  const lower = (symptoms || "").toLowerCase();
  for (const { dept, keys } of SYMPTOM_MAP) {
    if (keys.some(k => lower.includes(k))) return dept;
  }
  return "General Medicine";
}

export async function POST(request) {
  try {
    const body   = await request.json();
    const { action } = body;

    await connectDB();

    // ── Suggest doctors based on symptoms ──────────────────────────────────────
    if (action === "suggest_doctors") {
      const dept = detectDept(body.symptoms);

      // Try matching department first, fallback to General Medicine
      let doctors = await Doctor.find({ isActive: true, isAvailable: true,
        $or: [
          { department: { $regex: dept, $options: "i" } },
          { speciality:  { $regex: dept, $options: "i" } },
        ],
      }).select("name department speciality opdFee offerFee photo hospitalName availableSlots experience degrees").limit(5).lean();

      if (doctors.length === 0) {
        doctors = await Doctor.find({ isActive: true, isAvailable: true })
          .select("name department speciality opdFee offerFee photo hospitalName availableSlots experience degrees")
          .limit(5).lean();
      }

      return NextResponse.json({ success: true, department: dept, doctors });
    }

    // ── Create booking from chatbot ────────────────────────────────────────────
    if (action === "create_booking") {
      const { mobile, name, symptoms, doctorId, doctorName, date, slot, amount } = body;

      if (!mobile || mobile.length !== 10) {
        return NextResponse.json({ success: false, message: "Valid 10-digit mobile number required" }, { status: 400 });
      }
      if (!name || !name.trim()) {
        return NextResponse.json({ success: false, message: "Name required" }, { status: 400 });
      }

      // Find or create user by mobile
      let user = await User.findOne({ mobile });
      if (!user) {
        const cnt = await User.countDocuments();
        user = await User.create({
          mobile, name: name.trim(), role: "user",
          memberId: `BRIMS-${String(cnt + 1).padStart(6, "0")}`,
        });
      }

      // Generate booking ID
      const cnt = await Booking.countDocuments();
      const bId = `BH-OPD-${String(cnt + 1).padStart(5, "0")}`;

      const notes = JSON.stringify({
        patientName:   name.trim(),
        patientMobile: mobile,
        symptoms:      symptoms || "",
        paymentMode:   "counter",
        isNewPatient:  true,
        walkinBy:      "Brims ChatBot",
        doctorName:    doctorName || "",
      });

      await Booking.create({
        bookingId:       bId,
        userId:          user._id,
        doctorId:        doctorId || null,
        type:            "OPD",
        status:          "pending",
        paymentStatus:   "pending",
        paymentMode:     "counter",
        amount:          amount || 0,
        appointmentDate: date ? new Date(date) : new Date(),
        slot:            slot || "",
        notes,
      });

      return NextResponse.json({ success: true, bookingId: bId });
    }

    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Chat book error:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
