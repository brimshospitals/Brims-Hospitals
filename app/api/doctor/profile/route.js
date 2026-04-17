import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Doctor   from "../../../../models/Doctor";
import Hospital from "../../../../models/Hospital";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// GET — fetch doctor's own profile
export async function GET(request) {
  const { error, session } = await requireAuth(request, ["doctor", "admin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const doctorId = session.role === "admin"
      ? searchParams.get("doctorId")
      : session.doctorId;

    if (!doctorId) {
      return NextResponse.json({ success: false, message: "doctorId nahi mila" }, { status: 400 });
    }

    await connectDB();

    const doctor = await Doctor.findById(doctorId).lean();
    if (!doctor) {
      return NextResponse.json({ success: false, message: "Doctor nahi mila" }, { status: 404 });
    }

    // Attach hospital details if linked
    let hospital = null;
    if (doctor.hospitalId) {
      hospital = await Hospital.findById(doctor.hospitalId)
        .select("_id name hospitalId address isVerified")
        .lean();
    }

    return NextResponse.json({ success: true, doctor, hospital });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PATCH — update doctor profile
export async function PATCH(request) {
  const { error, session } = await requireAuth(request, ["doctor", "admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const {
      doctorId: bodyDoctorId,
      name, speciality, degrees, experience,
      opdFee, offerFee,
      photo,
      hospitalId, hospitalName,
      district, city,
      availableSlots,
      isAvailable,
      // New profile fields
      registrationNumber,
      collegeUG, collegePG, collegeMCH,
      about,
    } = body;

    const doctorId = session.role === "admin" ? bodyDoctorId : session.doctorId;
    if (!doctorId) {
      return NextResponse.json({ success: false, message: "doctorId nahi mila" }, { status: 400 });
    }

    await connectDB();

    const update = {};
    if (name               !== undefined) update.name               = name.trim();
    if (speciality         !== undefined) update.speciality         = speciality;
    if (registrationNumber !== undefined) update.registrationNumber = registrationNumber.trim();
    if (degrees            !== undefined) update.degrees            = Array.isArray(degrees) ? degrees : [];
    if (experience         !== undefined) update.experience         = Number(experience);
    if (opdFee             !== undefined) update.opdFee             = Number(opdFee);
    if (offerFee           !== undefined) update.offerFee           = Number(offerFee) || undefined;
    if (photo              !== undefined) update.photo              = photo;
    if (isAvailable        !== undefined) update.isAvailable        = isAvailable;
    if (collegeUG          !== undefined) update.collegeUG          = collegeUG.trim();
    if (collegePG          !== undefined) update.collegePG          = collegePG.trim();
    if (collegeMCH         !== undefined) update.collegeMCH         = collegeMCH.trim();
    if (about              !== undefined) update.about              = about.trim();

    // Slots: array of { day, times[] }
    if (availableSlots !== undefined) update.availableSlots = availableSlots;

    // Address
    if (district !== undefined) update["address.district"] = district;
    if (city     !== undefined) update["address.city"]     = city;

    // Hospital re-association
    if (hospitalId !== undefined && hospitalId !== "") {
      const hosp = await Hospital.findById(hospitalId).select("name").lean();
      if (hosp) {
        update.hospitalId   = hospitalId;
        update.hospitalName = hosp.name;
      }
    } else if (hospitalName !== undefined && hospitalName !== "") {
      // Private clinic — clear hospitalId, keep name
      update.hospitalId   = null;
      update.hospitalName = hospitalName.trim();
    }

    // Check profile completeness
    const existing = await Doctor.findById(doctorId).lean();
    const merged   = { ...existing, ...update };
    update.profileComplete = !!(
      merged.name &&
      merged.registrationNumber &&
      merged.degrees?.length > 0 &&
      merged.experience &&
      merged.photo
    );

    const doctor = await Doctor.findByIdAndUpdate(doctorId, { $set: update }, { new: true }).lean();
    if (!doctor) {
      return NextResponse.json({ success: false, message: "Doctor nahi mila" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Profile update ho gayi!", doctor });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
