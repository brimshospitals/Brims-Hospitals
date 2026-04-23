import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Doctor from "../../../../models/Doctor";
import Hospital from "../../../../models/Hospital";
import { requireHospitalAccess } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

const PROFILE_FIELDS = [
  "name","department","speciality","mobile","email","photo",
  "degrees","experience","opdFee","offerFee","registrationNumber",
  "collegeUG","collegePG","collegeMCH","about",
  "availableSlots","onlineAvailable","onlineFee","onlineSlots",
  "previousExperience","awards","isActive","isAvailable",
];

// POST — add a new doctor for this hospital
export async function POST(request) {
  try {
    const body = await request.json();
    const { hospitalId, address, district, city } = body;

    const { error } = await requireHospitalAccess(request, hospitalId);
    if (error) return error;

    if (!hospitalId || !body.name || !body.department || !body.opdFee) {
      return NextResponse.json(
        { success: false, message: "hospitalId, name, department, opdFee required" },
        { status: 400 }
      );
    }

    await connectDB();

    const hospital = await Hospital.findById(hospitalId).lean();
    if (!hospital) {
      return NextResponse.json({ success: false, message: "Hospital not found" }, { status: 404 });
    }

    const resolvedDistrict = address?.district || district || hospital.address?.district || "";
    const resolvedCity     = address?.city     || city     || hospital.address?.city     || "";

    const doctor = await Doctor.create({
      name:               body.name,
      department:         body.department,
      speciality:         body.speciality         || "",
      mobile:             body.mobile             || "",
      email:              body.email              || "",
      photo:              body.photo              || "",
      degrees:            body.degrees            || [],
      experience:         body.experience         || 0,
      opdFee:             body.opdFee,
      offerFee:           body.offerFee           || body.opdFee,
      registrationNumber: body.registrationNumber || undefined,
      collegeUG:          body.collegeUG          || "",
      collegePG:          body.collegePG          || "",
      collegeMCH:         body.collegeMCH         || "",
      about:              body.about              || "",
      availableSlots:     body.availableSlots     || [],
      onlineAvailable:    body.onlineAvailable    || false,
      onlineFee:          body.onlineFee          || 0,
      onlineSlots:        body.onlineSlots        || [],
      previousExperience: body.previousExperience || [],
      awards:             body.awards             || [],
      hospitalId:   hospital._id,
      hospitalName: hospital.name,
      address: {
        district: resolvedDistrict,
        city:     resolvedCity,
        state:    "Bihar",
      },
    });

    return NextResponse.json({ success: true, doctor });
  } catch (error) {
    console.error("Add Doctor Error:", error);
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}

// PATCH — update doctor details
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { doctorId, hospitalId, address, ...fields } = body;
    if (!doctorId) return NextResponse.json({ success: false, message: "doctorId required" }, { status: 400 });

    const { error } = await requireHospitalAccess(request, hospitalId || null);
    if (error) return error;

    await connectDB();

    const update = {};
    PROFILE_FIELDS.forEach((k) => { if (fields[k] !== undefined) update[k] = fields[k]; });

    // Handle address fields
    if (address || fields.district || fields.city) {
      update["address.district"] = address?.district || fields.district || "";
      update["address.city"]     = address?.city     || fields.city     || "";
    }

    const doctor = await Doctor.findByIdAndUpdate(doctorId, { $set: update }, { new: true });
    if (!doctor) return NextResponse.json({ success: false, message: "Doctor not found" }, { status: 404 });
    return NextResponse.json({ success: true, doctor });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}

// DELETE — remove a doctor
export async function DELETE(request) {
  try {
    const { doctorId, hospitalId } = await request.json();
    if (!doctorId) return NextResponse.json({ success: false, message: "doctorId required" }, { status: 400 });

    const { error } = await requireHospitalAccess(request, hospitalId || null);
    if (error) return error;

    await connectDB();
    await Doctor.findByIdAndDelete(doctorId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}