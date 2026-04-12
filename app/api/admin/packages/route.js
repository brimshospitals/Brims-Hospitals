import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import SurgeryPackage from "../../../../models/SurgeryPackage";
import Hospital from "../../../../models/Hospital";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const search     = searchParams.get("search")   || "";
    const hospital   = searchParams.get("hospital") || "";
    const category   = searchParams.get("category") || "";
    const activeOnly = searchParams.get("active")   === "true";
    const page       = parseInt(searchParams.get("page") || "1");
    const limit      = 30;

    await connectDB();

    const query = {};
    if (activeOnly) query.isActive  = true;
    if (hospital)   query.hospitalId = hospital;
    if (category)   query.category  = { $regex: category, $options: "i" };
    if (search.trim()) {
      query.$or = [
        { name:         { $regex: search.trim(), $options: "i" } },
        { hospitalName: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const total    = await SurgeryPackage.countDocuments(query);
    const packages = await SurgeryPackage.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Also get hospital list for filter dropdown
    const hospitals = await Hospital.find({ isVerified: true, isActive: true })
      .select("_id name").lean();

    return NextResponse.json({ success: true, packages, total, page, pages: Math.ceil(total / limit), hospitals });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const { packageId, isActive } = await request.json();
    if (!packageId) return NextResponse.json({ success: false, message: "packageId required" }, { status: 400 });

    await connectDB();
    const pkg = await SurgeryPackage.findByIdAndUpdate(packageId, { $set: { isActive } }, { new: true })
      .select("name isActive").lean();
    if (!pkg) return NextResponse.json({ success: false, message: "Package not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: `${pkg.name} ${isActive ? "activated" : "deactivated"}` });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get("id");
    if (!packageId) return NextResponse.json({ success: false, message: "id required" }, { status: 400 });

    await connectDB();
    await SurgeryPackage.findByIdAndDelete(packageId);
    return NextResponse.json({ success: true, message: "Package deleted" });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
