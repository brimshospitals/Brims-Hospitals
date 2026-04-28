import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import SurgeryPackage from "../../../../models/SurgeryPackage";
import Hospital from "../../../../models/Hospital";
import { requireHospitalAccess } from "../../../../lib/auth";

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
