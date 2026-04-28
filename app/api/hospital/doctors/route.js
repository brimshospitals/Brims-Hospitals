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

// ── Shared validation ─────────────────────────────────────────────────────────
function validatePrices({ opdFee, offerFee }) {
  const fee  = Number(opdFee);
  const oFee = offerFee !== undefined ? Number(offerFee) : fee;
  if (!opdFee || fee <= 0)  return "OPD fee 0 se zyada honi chahiye";
  if (oFee < 0)             return "Offer fee negative nahi ho sakti";
  if (oFee > fee)           return "Offer fee, OPD fee se zyada nahi ho sakti";
  return null;
}

function validatePhotoUrl(photo) {
  if (!photo) return null;
  if (!photo.startsWith("https://res.cloudinary.com/")) {
    return "Photo URL invalid hai — sirf Cloudinary URL accepted";
  }
  return null;
}
// ─────────────────────────────────────────────────────────────────────────────

// POST — add a new doctor for this hospital
export async function POST(request) {
  try {
    const body = await request.json();
    const { hospitalId, address, district, city } = body;

    const { error, session } = await requireHospitalAccess(request, hospitalId);
    if (error) return error;

    if (!hospitalId || !body.name || !body.department || !body.opdFee) {
      return NextResponse.json(
        { success: false, message: "hospitalId, name, department, opdFee zaruri hai" },
        { status: 400 }
      );
    }

    // Price validation
    const priceErr = validatePrices({ opdFee: body.opdFee, offerFee: body.offerFee });
    if (priceErr) return NextResponse.json({ success: false, message: priceErr }, { status: 400 });

    // Photo validation
    const photoErr = validatePhotoUrl(body.photo);
    if (photoErr) return NextResponse.json({ success: false, message: photoErr }, { status: 400 });

    await connectDB();

    const hospital = await Hospital.findById(hospitalId).lean();
    if (!hospital) {
      return NextResponse.json({ success: false, message: "Hospital not found" }, { status: 404 });
    }

    // Duplicate doctor check (same name + department in same hospital)
    const duplicate = await Doctor.findOne({
      hospitalId: hospital._id,
      name:       { $regex: `^${body.name.trim()}$`, $options: "i" },
      department: body.department,
    }).lean();
    if (duplicate) {
      return NextResponse.json(
        { success: false, message: `${body.name} (${body.department}) is hospital mein pehle se add hai` },
        { status: 400 }
      );
    }

    // Registration number duplicate check (globally unique)
    if (body.registrationNumber) {
      const regDup = await Doctor.findOne({ registrationNumber: body.registrationNumber }).lean();
      if (regDup) {
        return NextResponse.json(
          { success: false, message: `Registration no. ${body.registrationNumber} pehle se exist karta hai` },
          { status: 400 }
        );
      }
    }

    const resolvedDistrict = address?.district || district || hospital.address?.district || "";
    const resolvedCity     = address?.city     || city     || hospital.address?.city     || "";

    const doctor = await Doctor.create({
      name:               body.name.trim(),
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
      address: { district: resolvedDistrict, city: resolvedCity, state: "Bihar" },
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

    const { error, session } = await requireHospitalAccess(request, hospitalId || null);
    if (error) return error;

    await connectDB();

    // Ownership check — verify doctor belongs to this hospital
    const existing = await Doctor.findById(doctorId).select("hospitalId").lean();
    if (!existing) return NextResponse.json({ success: false, message: "Doctor not found" }, { status: 404 });
    if (session.role !== "admin" && existing.hospitalId?.toString() !== hospitalId?.toString()) {
      return NextResponse.json(
        { success: false, message: "Aap is doctor ko edit nahi kar sakte" },
        { status: 403 }
      );
    }

    // Price validation (only if prices are being updated)
    if (fields.opdFee !== undefined || fields.offerFee !== undefined) {
      const priceErr = validatePrices({
        opdFee:   fields.opdFee  ?? existing.opdFee,
        offerFee: fields.offerFee,
      });
      if (priceErr) return NextResponse.json({ success: false, message: priceErr }, { status: 400 });
    }

    // Photo validation
    if (fields.photo !== undefined) {
      const photoErr = validatePhotoUrl(fields.photo);
      if (photoErr) return NextResponse.json({ success: false, message: photoErr }, { status: 400 });
    }

    const update = {};
    PROFILE_FIELDS.forEach((k) => { if (fields[k] !== undefined) update[k] = fields[k]; });

    if (address || fields.district || fields.city) {
      update["address.district"] = address?.district || fields.district || "";
      update["address.city"]     = address?.city     || fields.city     || "";
    }

    const doctor = await Doctor.findByIdAndUpdate(doctorId, { $set: update }, { new: true });
    return NextResponse.json({ success: true, doctor });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}

// DELETE — soft-delete (isActive: false) to preserve booking history
export async function DELETE(request) {
  try {
    const { doctorId, hospitalId } = await request.json();
    if (!doctorId) return NextResponse.json({ success: false, message: "doctorId required" }, { status: 400 });

    const { error, session } = await requireHospitalAccess(request, hospitalId || null);
    if (error) return error;

    await connectDB();

    // Ownership check
    const existing = await Doctor.findById(doctorId).select("hospitalId").lean();
    if (!existing) return NextResponse.json({ success: false, message: "Doctor not found" }, { status: 404 });
    if (session.role !== "admin" && existing.hospitalId?.toString() !== hospitalId?.toString()) {
      return NextResponse.json(
        { success: false, message: "Aap is doctor ko delete nahi kar sakte" },
        { status: 403 }
      );
    }

    // Soft-delete — preserves booking history
    await Doctor.findByIdAndUpdate(doctorId, {
      $set: { isActive: false, isAvailable: false, deactivatedAt: new Date() },
    });
    return NextResponse.json({ success: true, message: "Doctor deactivated successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}
