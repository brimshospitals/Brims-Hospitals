import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Doctor from "../../../../models/Doctor";
import Hospital from "../../../../models/Hospital";
import { requireHospitalAccess } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

const DISTRICT_CENTROIDS = {
  "Patna":{lat:25.5941,lng:85.1376},"Gaya":{lat:24.7955,lng:85.0002},
  "Bhojpur":{lat:25.5562,lng:84.6607},"Buxar":{lat:25.5652,lng:83.9782},
  "Rohtas":{lat:24.9463,lng:84.0318},"Kaimur":{lat:25.0390,lng:83.6036},
  "Nalanda":{lat:25.1954,lng:85.5010},"Nawada":{lat:24.8857,lng:85.5440},
  "Aurangabad":{lat:24.7517,lng:84.3743},"Jehanabad":{lat:25.2121,lng:84.9941},
  "Arwal":{lat:25.2532,lng:84.6808},"Saran":{lat:25.7829,lng:84.7431},
  "Siwan":{lat:26.2227,lng:84.3543},"Gopalganj":{lat:26.4683,lng:84.4338},
  "West Champaran":{lat:27.0283,lng:84.5110},"East Champaran":{lat:26.6499,lng:84.9167},
  "Muzaffarpur":{lat:26.1209,lng:85.3647},"Sheohar":{lat:26.5193,lng:85.2969},
  "Sitamarhi":{lat:26.5912,lng:85.4820},"Vaishali":{lat:25.6900,lng:85.2099},
  "Darbhanga":{lat:26.1542,lng:85.8999},"Madhubani":{lat:26.3534,lng:86.0729},
  "Samastipur":{lat:25.8639,lng:85.7822},"Begusarai":{lat:25.4182,lng:86.1272},
  "Khagaria":{lat:25.5024,lng:86.4633},"Munger":{lat:25.3762,lng:86.4736},
  "Lakhisarai":{lat:25.1553,lng:86.1027},"Sheikhpura":{lat:25.1393,lng:85.8423},
  "Jamui":{lat:24.9262,lng:86.2221},"Banka":{lat:24.8859,lng:86.9228},
  "Bhagalpur":{lat:25.2496,lng:86.9718},"Supaul":{lat:26.1260,lng:86.6044},
  "Madhepura":{lat:25.9262,lng:86.7897},"Saharsa":{lat:25.8829,lng:86.5980},
  "Purnia":{lat:25.7771,lng:87.4718},"Katihar":{lat:25.5392,lng:87.5821},
  "Kishanganj":{lat:26.1043,lng:87.9440},"Araria":{lat:26.1457,lng:87.5173},
};
function resolveCoords(hospital) {
  if (hospital.coordinates?.lat && hospital.coordinates?.lng)
    return { lat: hospital.coordinates.lat, lng: hospital.coordinates.lng };
  return DISTRICT_CENTROIDS[hospital.address?.district] || null;
}

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
      ...(resolveCoords(hospital) ? { coordinates: resolveCoords(hospital) } : {}),
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
