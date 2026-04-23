import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Doctor  from "../../../../models/Doctor";
import User    from "../../../../models/User";
import Booking from "../../../../models/Booking";

export const dynamic = "force-dynamic";

// ── SMS helper ────────────────────────────────────────────────────────────────
async function sendSMS(mobile, message) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) { console.log(`[SMS-DEV] ${mobile}: ${message}`); return; }
  try {
    await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: { authorization: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ route: "q", message, language: "english", flash: 0, numbers: mobile }),
    });
  } catch (e) { console.error("SMS error:", e.message); }
}

// ── Symptom → Department mapping ─────────────────────────────────────────────
const SYMPTOM_MAP = [
  { dept: "Cardiology",       keys: ["chest pain","seene mein dard","seene dard","heart","dil","palpitation","dhadkan","breathless","saans phoolna","saans fulna","high bp","low bp","blood pressure","bp","irregular heartbeat","swollen legs","pair soojhna","heart attack","angina","cardiac","arrhythmia","heart failure","cholesterol","ecg"] },
  { dept: "Orthopedics",      keys: ["joint pain","jodo ka dard","bone","haddi","knee pain","ghutna dard","back pain","kamar dard","neck pain","gardan dard","shoulder pain","kandha dard","fracture","haddi tootna","slip disc","arthritis","gathiya","spondylitis","ligament","muscle pain","sprain","hip pain","ankle pain","wrist pain","sports injury","swollen joint","stiffness","akadna"] },
  { dept: "Gastroenterology", keys: ["stomach pain","pet dard","acidity","jalan","heartburn","vomiting","ulti","nausea","diarrhea","dast","loose motion","constipation","kabz","bloating","gas","afara","liver","jaundice","peeliya","piles","bawasir","hemorrhoid","ibs","colitis","gastric","indigestion","burping","blood in stool","appendix","hernia","gallstone","ulcer"] },
  { dept: "Gynecology",       keys: ["irregular periods","period nahi aana","heavy bleeding","zyada bleeding","pregnancy","white discharge","safed pani","leucorrhea","uterus","ovary","pcod","pcos","menstrual pain","periods mein dard","delivery","prasav","menopause","vaginal","infertility","baccha nahi hona","fibroid","cyst","cervical","family planning","antenatal","postnatal"] },
  { dept: "Pediatrics",       keys: ["child","baby","bachcha","infant","newborn","neonatal","bacche ki","bachchi","child fever","baby cough","child vomiting","child diarrhea","poor growth","vaccination","immunization","child weakness","baal rog","pediatric","child nutrition","malnutrition","child rash","diaper rash","teething"] },
  { dept: "Neurology",        keys: ["migraine","seizures","fits","mirgi","memory loss","yaadash","numbness","sunapan","paralysis","lakwa","vertigo","stroke","brain","dementia","parkinson","tremor","nerve pain","neuropathy","unconscious","behoshi","epilepsy","spinal","meningitis","brain tumor"] },
  { dept: "ENT",              keys: ["ear pain","kaan dard","hearing loss","kaan se sunai nahi","nose blockage","naak band","sinus","sinusitis","tonsils","voice change","throat pain","gala dard","snoring","kharrate","ear infection","ear wax","nasal polyp","deviated septum","adenoid","laryngitis","ear ringing","tinnitus"] },
  { dept: "Dermatology",      keys: ["skin rash","daane","itching","khujli","acne","pimples","eczema","psoriasis","safed daag","vitiligo","hair fall","baal jhadna","fungal infection","ring worm","daad","allergy","hives","urticaria","wart","mole","skin tag","dandruff","dry skin","oily skin","hyperpigmentation","dark spots","nail problem","nakhun","scabies","chickenpox"] },
  { dept: "Ophthalmology",    keys: ["eye pain","aankh dard","blurred vision","dhundla dikhna","red eyes","lal aankh","cataract","motia","watery eyes","aankh se paani","eye infection","conjunctivitis","specs check","chashma","night blindness","glaucoma","eye allergy","stye","double vision","squint","lazy eye"] },
  { dept: "Urology",          keys: ["burning urination","peshab mein jalan","kidney stone","pathri","frequent urination","baar baar peshab","blood in urine","peshab mein khoon","prostate","urinary infection","uti","bladder","kidney pain","kidney failure","dialysis","incontinence","erectile dysfunction","male infertility","varicocele"] },
  { dept: "Pulmonology",      keys: ["breathing difficulty","saans lena mushkil","asthma","dama","tb","tuberculosis","chronic cough","wheezing","chest tightness","lung infection","pneumonia","bronchitis","copd","sleep apnea","oxygen level","spo2","pleural","phephde"] },
  { dept: "Diabetology",      keys: ["diabetes","sugar","blood sugar","high sugar","sugar zyada","insulin","madhumeh","low sugar","hypoglycemia","hba1c","fasting sugar","excessive thirst","zyada pyaas","wound not healing","ghao nahi bharna","weight loss","diabetic foot","neuropathy diabetes","retinopathy"] },
  { dept: "Psychiatry",       keys: ["anxiety","ghabrahaat","depression","udaasi","sleep problem","neend na aana","insomnia","stress","tanav","mood swings","phobia","ocd","panic attack","schizophrenia","bipolar","mental health","addiction","drug","alcohol","nasha","self harm","suicidal","anger issues","adhd","autism","memory problem"] },
  { dept: "General Medicine", keys: ["fever","bukhar","cough","khansi","cold","nazla","sardi","headache","sir dard","body pain","badan dard","weakness","kamzori","fatigue","thakan","sore throat","gale mein dard","viral","infection","flu","running nose","loss of appetite","bhook na lagna","malaise","typhoid","dengue","malaria","chikungunya","anemia","khoon ki kami","vitamin deficiency"] },
];

function detectDept(symptoms) {
  const lower = (symptoms || "").toLowerCase();
  for (const { dept, keys } of SYMPTOM_MAP) {
    if (keys.some(k => lower.includes(k))) return dept;
  }
  return "General Medicine";
}

const SELECT = "name department speciality opdFee offerFee photo hospitalName availableSlots experience degrees address";

export async function POST(request) {
  try {
    const body      = await request.json();
    const { action } = body;

    await connectDB();

    // ── Suggest doctors ────────────────────────────────────────────────────────
    if (action === "suggest_doctors") {
      const dept     = detectDept(body.symptoms);
      const district = (body.district || "").trim();
      const deptOr   = [
        { department: { $regex: dept, $options: "i" } },
        { speciality: { $regex: dept, $options: "i" } },
      ];

      // Fetch local district doctors (matching dept)
      let localDoctors = [];
      if (district) {
        localDoctors = await Doctor.find({ isActive: true, isAvailable: true,
          "address.district": { $regex: district, $options: "i" }, $or: deptOr,
        }).select(SELECT).limit(5).lean();

        // Fallback: local district, any dept
        if (localDoctors.length === 0) {
          localDoctors = await Doctor.find({ isActive: true, isAvailable: true,
            "address.district": { $regex: district, $options: "i" },
          }).select(SELECT).limit(3).lean();
        }
      }

      // Always fetch Patna doctors with matching dept (Patna hub for all Bihar)
      let patnaDoctors = await Doctor.find({ isActive: true, isAvailable: true,
        "address.district": { $regex: "patna", $options: "i" }, $or: deptOr,
      }).select(SELECT).limit(5).lean();

      // Fallback: any Patna doctor
      if (patnaDoctors.length === 0) {
        patnaDoctors = await Doctor.find({ isActive: true, isAvailable: true,
          "address.district": { $regex: "patna", $options: "i" },
        }).select(SELECT).limit(3).lean();
      }

      // Merge: local first, then Patna (deduplicate by _id)
      const seen    = new Set();
      const doctors = [];
      for (const d of [...localDoctors, ...patnaDoctors]) {
        const id = d._id.toString();
        if (!seen.has(id)) { seen.add(id); doctors.push(d); }
      }

      // Final fallback: any active doctor
      if (doctors.length === 0) {
        const fallback = await Doctor.find({ isActive: true, isAvailable: true }).select(SELECT).limit(6).lean();
        doctors.push(...fallback);
      }

      return NextResponse.json({ success: true, department: dept, doctors: doctors.slice(0, 8) });
    }

    // ── Create booking ─────────────────────────────────────────────────────────
    if (action === "create_booking") {
      const { mobile, name, age, gender, district, symptoms, doctorId, doctorName,
              date, slot, amount, userId: providedUserId, isLoggedIn } = body;

      if (!name || !name.trim()) {
        return NextResponse.json({ success: false, message: "Patient name required" }, { status: 400 });
      }

      let user;
      let isNewUser = false;

      if (isLoggedIn && providedUserId) {
        // Logged-in user — use their account
        user = await User.findById(providedUserId);
        if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
      } else {
        // Not logged in — validate mobile
        if (!mobile || String(mobile).replace(/\D/g,"").length !== 10) {
          return NextResponse.json({ success: false, message: "Valid 10-digit mobile number required" }, { status: 400 });
        }
        const cleanMobile = String(mobile).replace(/\D/g,"");
        user = await User.findOne({ mobile: cleanMobile });
        if (!user) {
          isNewUser = true;
          const cnt = await User.countDocuments();
          user = await User.create({
            mobile:   cleanMobile,
            name:     name.trim(),
            role:     "user",
            age:      age    || 18,
            gender:   gender || "male",
            address:  { state: "Bihar", district: district || "" },
            memberId: `BRIMS-${String(cnt + 1).padStart(6, "0")}`,
          });
        } else {
          // Update missing fields
          const upd = {};
          if (!user.age    && age)    upd.age    = age;
          if (!user.gender && gender) upd.gender = gender;
          if (district && !user.address?.district) upd["address.district"] = district;
          if (Object.keys(upd).length) await User.findByIdAndUpdate(user._id, { $set: upd });
        }
      }

      // Create booking
      const cnt  = await Booking.countDocuments();
      const bId  = `BH-OPD-${String(cnt + 1).padStart(5, "0")}`;
      const appUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://brims-hospitals-app.vercel.app";

      const notes = JSON.stringify({
        patientName:   name.trim(),
        patientMobile: user.mobile || mobile || "",
        patientAge:    age    || user.age    || "",
        patientGender: gender || user.gender || "",
        district:      district || user.address?.district || "",
        symptoms:      symptoms || "",
        paymentMode:   "counter",
        isNewPatient:  isNewUser,
        walkinBy:      isLoggedIn ? "ChatBot (Member)" : "ChatBot (Guest)",
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

      const fmtDate = date ? new Date(date).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "N/A";

      // Send SMSes (only for non-logged-in users or always for confirmation)
      if (user.mobile) {
        // Appointment confirmation SMS (always)
        const confirmSMS = `Booking Confirmed! ID: ${bId} | Dr. ${doctorName || "Doctor"} | Date: ${fmtDate} | Slot: ${slot} | Hospital counter par aakaar payment karein. Helpline: 9955564596 - Brims Hospitals`;
        await sendSMS(user.mobile, confirmSMS);

        // New user login link SMS
        if (isNewUser) {
          const loginSMS = `Namaste ${name}! Aapka Brims Hospitals account ban gaya hai (Member ID: ${user.memberId}). App se apni bookings dekhein aur manage karein: ${appUrl}/login - Apne mobile number se login karein. - Brims Hospitals`;
          await sendSMS(user.mobile, loginSMS);
        }
      }

      return NextResponse.json({ success: true, bookingId: bId, isNewUser, memberId: user.memberId });
    }

    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Chat book error:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
