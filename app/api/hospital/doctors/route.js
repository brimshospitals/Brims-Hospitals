import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Doctor from "../../../../models/Doctor";
import Hospital from "../../../../models/Hospital";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// POST — add a new doctor for this hospital
export async function POST(request) {
  const { error } = await requireAuth(request, ["hospital", "admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const { hospitalId, name, department, speciality, mobile, email, degrees, experience, opdFee, offerFee } = body;

    if (!hospitalId || !name || !department || !opdFee) {
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

    const doctor = await Doctor.create({
      name,
      department,
      speciality:   speciality  || "",
      mobile:       mobile      || "",
      email:        email       || "",
      degrees:      degrees     || [],
      experience:   experience  || 0,
      opdFee,
      offerFee:     offerFee    || opdFee,
      hospitalId:   hospital._id,
      hospitalName: hospital.name,
      address: {
        district: hospital.address?.district || "",
        city:     hospital.address?.city     || "",
        state:    hospital.address?.state    || "Bihar",
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
  const { error } = await requireAuth(request, ["hospital", "admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const { doctorId, ...fields } = body;
    if (!doctorId) return NextResponse.json({ success: false, message: "doctorId required" }, { status: 400 });

    await connectDB();
    const allowed = ["name","department","speciality","mobile","email","degrees","experience","opdFee","offerFee","isActive","isAvailable","availableSlots","photo"];
    const update = {};
    allowed.forEach((k) => { if (fields[k] !== undefined) update[k] = fields[k]; });

    const doctor = await Doctor.findByIdAndUpdate(doctorId, update, { new: true });
    if (!doctor) return NextResponse.json({ success: false, message: "Doctor not found" }, { status: 404 });
    return NextResponse.json({ success: true, doctor });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}

// DELETE — remove a doctor
export async function DELETE(request) {
  const { error } = await requireAuth(request, ["hospital", "admin"]);
  if (error) return error;

  try {
    const { doctorId } = await request.json();
    if (!doctorId) return NextResponse.json({ success: false, message: "doctorId required" }, { status: 400 });

    await connectDB();
    await Doctor.findByIdAndDelete(doctorId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}
