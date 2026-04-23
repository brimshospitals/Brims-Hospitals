import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Doctor  from "../../../../models/Doctor";
import User    from "../../../../models/User";
import Booking from "../../../../models/Booking";

export const dynamic = "force-dynamic";

// Symptom → department mapping
const SYMPTOM_MAP = [
  { dept: "Cardiology",       keys: ["heart","dil","chest pain","seene","palpitation","breathless","saans","bp","blood pressure"] },
  { dept: "Orthopedics",      keys: ["joint","bone","haddi","knee","ghutna","back pain","kamar","shoulder","kandha","fracture"] },
  { dept: "Gastroenterology", keys: ["stomach","pet","acidity","vomit","ulti","diarrhea","dast","liver","jaundice","piles","bawasir"] },
  { dept: "Gynecology",       keys: ["pregnancy","period","masik","uterus","ovary","delivery","white discharge","leucorrhea"] },
  { dept: "Pediatrics",       keys: ["child","baby","bachcha","infant","newborn","bacche"] },
  { dept: "Neurology",        keys: ["headache","sir dard","migraine","brain","seizure","paralysis","fits","chakkar","vertigo"] },
  { dept: "ENT",              keys: ["ear","kaan","nose","naak","throat","gala","tonsil","sinus","hearing"] },
  { dept: "Dermatology",      keys: ["skin","rash","itching","khujli","allergy","pimple","acne","eczema"] },
  { dept: "Ophthalmology",    keys: ["eye","aankh","vision","glasses","cataract","motia"] },
  { dept: "Urology",          keys: ["urine","peshab","kidney","bladder","prostate","stone","pathri"] },
  { dept: "Pulmonology",      keys: ["lung","breathing","asthma","tb","tuberculosis","cough","khansi","phephde"] },
  { dept: "Diabetology",      keys: ["diabetes","sugar","blood sugar","insulin","madhumeh"] },
  { dept: "Psychiatry",       keys: ["mental","anxiety","depression","sleep","neend","tension","stress","mood"] },
  { dept: "General Medicine", keys: ["fever","bukhar","cold","weakness","fatigue","body pain","badan dard","infection","viral"] },
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
