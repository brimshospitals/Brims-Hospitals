import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Hospital from "../../../models/Hospital";

export const dynamic = "force-dynamic";

// Public endpoint — verified hospitals list for dropdowns + search page
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get("district") || "";
    const type     = searchParams.get("type")     || "";
    const search   = searchParams.get("search")   || "";
    const full = searchParams.get("full") === "true"; // search page: full fields

    await connectDB();

    // Always filter to verified + active — admin uses /api/admin/hospitals (auth-protected)
    const query = { isVerified: true, isActive: true };
    if (district) query["address.district"] = { $regex: district, $options: "i" };
    if (type)     query.type = type;
    if (search)   query.name = { $regex: search, $options: "i" };

    const select = full
      ? "_id name hospitalId address type departments photos rating totalReviews mobile website spocName"
      : "_id name hospitalId address.district address.city type departments";

    const hospitals = await Hospital.find(query)
      .select(select)
      .sort({ rating: -1, name: 1 })
      .limit(200)
      .lean();

    return NextResponse.json({ success: true, hospitals });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
