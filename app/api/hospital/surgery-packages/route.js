import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import SurgeryPackage from "../../../../models/SurgeryPackage";
import Hospital from "../../../../models/Hospital";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

function generatePkgId() {
  return "SRG-" + Date.now().toString(36).toUpperCase();
}

export async function POST(request) {
  const { error } = await requireAuth(request, ["hospital", "admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const { hospitalId, name, category, mrp, offerPrice, description, inclusions, stayDays, roomType, surgeonName, surgeonExperience } = body;

    if (!hospitalId || !name || !mrp || !offerPrice) {
      return NextResponse.json({ success: false, message: "hospitalId, name, mrp, offerPrice required" }, { status: 400 });
    }

    await connectDB();

    const hospital = await Hospital.findById(hospitalId).lean();
    if (!hospital) return NextResponse.json({ success: false, message: "Hospital not found" }, { status: 404 });

    const pkg = await SurgeryPackage.create({
      packageId: generatePkgId(),
      hospitalId: hospital._id,
      hospitalName: hospital.name,
      name,
      category: category || "General Surgery",
      description: description || "",
      inclusions: inclusions || [],
      mrp,
      offerPrice,
      stayDays: stayDays || 1,
      roomType: roomType || "General",
      surgeonName: surgeonName || "",
      surgeonExperience: surgeonExperience || 0,
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
  const { error } = await requireAuth(request, ["hospital", "admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const { packageId, ...fields } = body;
    if (!packageId) return NextResponse.json({ success: false, message: "packageId required" }, { status: 400 });

    await connectDB();
    const allowed = ["name","category","mrp","offerPrice","membershipPrice","description","inclusions","stayDays","roomType","surgeonName","surgeonExperience","isActive"];
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
  const { error } = await requireAuth(request, ["hospital", "admin"]);
  if (error) return error;

  try {
    const { packageId } = await request.json();
    if (!packageId) return NextResponse.json({ success: false, message: "packageId required" }, { status: 400 });
    await connectDB();
    await SurgeryPackage.findByIdAndDelete(packageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}
