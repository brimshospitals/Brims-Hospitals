import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Hospital from "../../../../models/Hospital";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(request) {
  const { error, session } = await requireAuth(request, ["hospital", "admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const { hospitalId, ...fields } = body;

    const id = session.role === "admin" ? hospitalId : session.hospitalMongoId || hospitalId;
    if (!id) return NextResponse.json({ success: false, message: "hospitalId required" }, { status: 400 });

    await connectDB();

    const allowed = [
      "name", "type", "mobile", "email", "website",
      "spocName", "spocContact", "ownerName",
      "departments", "specialties",
      "address",
      "registrationNo", "rohiniNo",
      "coordinates",
    ];
    const update = {};
    allowed.forEach((k) => { if (fields[k] !== undefined) update[k] = fields[k]; });

    const hospital = await Hospital.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!hospital) return NextResponse.json({ success: false, message: "Hospital not found" }, { status: 404 });

    return NextResponse.json({ success: true, hospital, message: "Profile update ho gaya!" });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}