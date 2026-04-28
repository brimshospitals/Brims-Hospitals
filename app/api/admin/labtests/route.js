import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import LabTest from "../../../../models/LabTest";
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
    if (activeOnly) query.isActive   = true;
    if (hospital)   query.hospitalId  = hospital;
    if (category)   query.category   = { $regex: category, $options: "i" };
    if (search.trim()) {
      query.$or = [
        { name:         { $regex: search.trim(), $options: "i" } },
        { hospitalName: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const total    = await LabTest.countDocuments(query);
    const labTests = await LabTest.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const hospitals = await Hospital.find({ isVerified: true, isActive: true })
      .select("_id name").lean();

    return NextResponse.json({ success: true, labTests, total, page, pages: Math.ceil(total / limit), hospitals });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const { labTestId, isActive } = await request.json();
    if (!labTestId) return NextResponse.json({ success: false, message: "labTestId required" }, { status: 400 });

    await connectDB();
    const test = await LabTest.findByIdAndUpdate(labTestId, { $set: { isActive } }, { new: true })
      .select("name isActive").lean();
    if (!test) return NextResponse.json({ success: false, message: "Lab test not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: `${test.name} ${isActive ? "activated" : "deactivated"}` });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const labTestId = searchParams.get("id");
    if (!labTestId) return NextResponse.json({ success: false, message: "id required" }, { status: 400 });

    await connectDB();
    // B9: Soft delete — consistent with hospital-side soft delete
    await LabTest.findByIdAndUpdate(labTestId, { $set: { isActive: false, deactivatedAt: new Date() } });
    return NextResponse.json({ success: true, message: "Lab test deactivated" });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
