import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import SurgeryPackage from "../../../../models/SurgeryPackage";
import Hospital from "../../../../models/Hospital";
import { requireHospitalAccess } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

function generatePkgId() {
  return "SRG-" + Date.now().toString(36).toUpperCase();
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { hospitalId, name, category, mrp, offerPrice, description, inclusions, stayDays, roomType, surgeonName, surgeonExperience } = body;
    // Full field set also available via `body.*` for new fields

    const { error } = await requireHospitalAccess(request, hospitalId);
    if (error) return error;

    if (!hospitalId || !name || !mrp || !offerPrice) {
      return NextResponse.json({ success: false, message: "hospitalId, name, mrp, offerPrice required" }, { status: 400 });
    }

    await connectDB();

    const hospital = await Hospital.findById(hospitalId).lean();
    if (!hospital) return NextResponse.json({ success: false, message: "Hospital not found" }, { status: 404 });

    const pkg = await SurgeryPackage.create({
      packageId:            generatePkgId(),
      hospitalId:           hospital._id,
      hospitalName:         hospital.name,
      name,
      category:             category             || "General Surgery",
      description:          description          || "",
      inclusions:           inclusions           || [],
      preSurgeryTests:      body.preSurgeryTests  || [],
      mrp,
      offerPrice,
      membershipPrice:      body.membershipPrice  || offerPrice,
      stayDays:             stayDays             || 1,
      roomOptions:          body.roomOptions      || [],
      roomType:             roomType             || "General",
      surgeonName:          body.surgeonName      || "",
      surgeonExperience:    body.surgeonExperience || 0,
      surgeonDegrees:       body.surgeonDegrees    || [],
      pickupFromHome:       body.pickupFromHome    || false,
      pickupCharge:         body.pickupCharge      || 0,
      dropAvailable:        body.dropAvailable     || false,
      foodIncluded:         body.foodIncluded      || false,
      foodDetails:          body.foodDetails       || "",
      postCareIncluded:     body.postCareIncluded  || false,
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

    const { error } = await requireHospitalAccess(request, hospitalId || null);
    if (error) return error;
    if (!packageId) return NextResponse.json({ success: false, message: "packageId required" }, { status: 400 });

    await connectDB();
    const allowed = ["name","category","mrp","offerPrice","membershipPrice","description","inclusions","preSurgeryTests","stayDays","roomType","roomOptions","surgeonName","surgeonExperience","surgeonDegrees","pickupFromHome","pickupCharge","dropAvailable","foodIncluded","foodDetails","postCareIncluded","followUpConsultations","isActive"];
    const update = {};
    allowed.forEach((k) => { if (fields[k] !== undefined) update[k] = fields[k]; });

    const pkg = await SurgeryPackage.findByIdAndUpdate(packageId, update, { new: true });
    if (!pkg) return NextResponse.json({ success: false, message: "Package not found" }, { status: 404 });
    return NextResponse.json({ success: true, package: pkg });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { packageId, hospitalId } = await request.json();

    const { error } = await requireHospitalAccess(request, hospitalId || null);
    if (error) return error;
    if (!packageId) return NextResponse.json({ success: false, message: "packageId required" }, { status: 400 });
    await connectDB();
    await SurgeryPackage.findByIdAndDelete(packageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}
