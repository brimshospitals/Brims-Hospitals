import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import SurgeryPackage from "../../../../models/SurgeryPackage";
import Hospital from "../../../../models/Hospital";
import { requireHospitalAccess } from "../../../../lib/auth";

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

export const dynamic = "force-dynamic";

function generatePkgId() {
  return "SRG-" + Date.now().toString(36).toUpperCase();
}

// ── Shared price validation ───────────────────────────────────────────────────
function validatePrices({ mrp, offerPrice, membershipPrice }) {
  const m  = Number(mrp);
  const o  = Number(offerPrice);
  const mp = membershipPrice != null ? Number(membershipPrice) : undefined;
  if (!mrp || m <= 0)        return "MRP 0 se zyada hona chahiye";
  if (!offerPrice || o <= 0) return "Offer price 0 se zyada honi chahiye";
  if (o > m)                 return "Offer price, MRP se zyada nahi ho sakti";
  if (mp !== undefined && mp < 0)  return "Membership price negative nahi ho sakti";
  if (mp !== undefined && mp > o)  return "Membership price, offer price se zyada nahi ho sakti";
  return null;
}
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const body = await request.json();
    const { hospitalId, name, category, mrp, offerPrice, description, inclusions,
      stayDays, roomType, surgeonName } = body;

    const { error, session } = await requireHospitalAccess(request, hospitalId);
    if (error) return error;

    if (!hospitalId || !name || !mrp || !offerPrice) {
      return NextResponse.json(
        { success: false, message: "hospitalId, name, mrp, offerPrice zaruri hai" },
        { status: 400 }
      );
    }

    // Price validation
    const priceErr = validatePrices({ mrp, offerPrice, membershipPrice: body.membershipPrice });
    if (priceErr) return NextResponse.json({ success: false, message: priceErr }, { status: 400 });

    await connectDB();

    const hospital = await Hospital.findById(hospitalId).lean();
    if (!hospital) return NextResponse.json({ success: false, message: "Hospital not found" }, { status: 404 });

    // Duplicate package check (same name + category in same hospital)
    const duplicate = await SurgeryPackage.findOne({
      hospitalId: hospital._id,
      name:       { $regex: `^${name.trim()}$`, $options: "i" },
    }).lean();
    if (duplicate) {
      return NextResponse.json(
        { success: false, message: `"${name}" is hospital mein pehle se add hai` },
        { status: 400 }
      );
    }

    const pkg = await SurgeryPackage.create({
      packageId:             generatePkgId(),
      hospitalId:            hospital._id,
      hospitalName:          hospital.name,
      name:                  name.trim(),
      category:              category              || "General Surgery",
      description:           description           || "",
      inclusions:            inclusions            || [],
      preSurgeryTests:       body.preSurgeryTests   || [],
      mrp,
      offerPrice,
      membershipPrice:       body.membershipPrice   ?? offerPrice,
      stayDays:              stayDays              ?? 1,
      roomOptions:           body.roomOptions       || [],
      roomType:              roomType              || "General",
      surgeonName:           body.surgeonName       || "",
      surgeonExperience:     body.surgeonExperience || 0,
      surgeonDegrees:        body.surgeonDegrees    || [],
      pickupFromHome:        body.pickupFromHome    || false,
      pickupCharge:          body.pickupCharge      || 0,
      dropAvailable:         body.dropAvailable     || false,
      foodIncluded:          body.foodIncluded      || false,
      foodDetails:           body.foodDetails       || "",
      postCareIncluded:      body.postCareIncluded  || false,
      followUpConsultations: body.followUpConsultations || 0,
      address: {
        district: hospital.address?.district || "",
        city:     hospital.address?.city     || "",
        state:    "Bihar",
      },
      ...(resolveCoords(hospital) ? { coordinates: resolveCoords(hospital) } : {}),
    });

    return NextResponse.json({ success: true, package: pkg });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { packageId, hospitalId, ...fields } = body;

    const { error, session } = await requireHospitalAccess(request, hospitalId || null);
    if (error) return error;
    if (!packageId) return NextResponse.json({ success: false, message: "packageId zaruri hai" }, { status: 400 });

    await connectDB();

    // Ownership check
    const existing = await SurgeryPackage.findById(packageId).select("hospitalId mrp offerPrice").lean();
    if (!existing) return NextResponse.json({ success: false, message: "Package not found" }, { status: 404 });
    if (session.role !== "admin" && existing.hospitalId?.toString() !== hospitalId?.toString()) {
      return NextResponse.json(
        { success: false, message: "Aap is package ko edit nahi kar sakte" },
        { status: 403 }
      );
    }

    // Price validation
    if (fields.mrp !== undefined || fields.offerPrice !== undefined || fields.membershipPrice !== undefined) {
      const priceErr = validatePrices({
        mrp:             fields.mrp             ?? existing.mrp,
        offerPrice:      fields.offerPrice      ?? existing.offerPrice,
        membershipPrice: fields.membershipPrice,
      });
      if (priceErr) return NextResponse.json({ success: false, message: priceErr }, { status: 400 });
    }

    const allowed = ["name","category","mrp","offerPrice","membershipPrice","description","inclusions",
      "preSurgeryTests","stayDays","roomType","roomOptions","surgeonName","surgeonExperience",
      "surgeonDegrees","pickupFromHome","pickupCharge","dropAvailable","foodIncluded","foodDetails",
      "postCareIncluded","followUpConsultations","isActive"];
    const update = {};
    allowed.forEach((k) => { if (fields[k] !== undefined) update[k] = fields[k]; });

    const pkg = await SurgeryPackage.findByIdAndUpdate(packageId, { $set: update }, { new: true });
    return NextResponse.json({ success: true, package: pkg });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { packageId, hospitalId } = await request.json();

    const { error, session } = await requireHospitalAccess(request, hospitalId || null);
    if (error) return error;
    if (!packageId) return NextResponse.json({ success: false, message: "packageId zaruri hai" }, { status: 400 });

    await connectDB();

    // Ownership check
    const existing = await SurgeryPackage.findById(packageId).select("hospitalId").lean();
    if (!existing) return NextResponse.json({ success: false, message: "Package not found" }, { status: 404 });
    if (session.role !== "admin" && existing.hospitalId?.toString() !== hospitalId?.toString()) {
      return NextResponse.json(
        { success: false, message: "Aap is package ko delete nahi kar sakte" },
        { status: 403 }
      );
    }

    // Soft-delete
    await SurgeryPackage.findByIdAndUpdate(packageId, {
      $set: { isActive: false, deactivatedAt: new Date() },
    });
    return NextResponse.json({ success: true, message: "Package deactivated successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}
