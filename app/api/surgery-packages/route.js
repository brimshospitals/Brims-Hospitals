import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import SurgeryPackage from "../../../models/SurgeryPackage";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const district = url.searchParams.get("district");
    const category = url.searchParams.get("category");
    const search = url.searchParams.get("search");
    const maxPrice = url.searchParams.get("maxPrice");

    await connectDB();

    let query = { isActive: true };

    if (district) query["address.district"] = district;
    if (category) query.category = { $regex: category, $options: "i" };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { surgeonName: { $regex: search, $options: "i" } },
        { hospitalName: { $regex: search, $options: "i" } },
      ];
    }
    if (maxPrice) query.offerPrice = { $lte: parseInt(maxPrice) };

    const packages = await SurgeryPackage.find(query)
      .sort({ rating: -1, totalBookings: -1 })
      .limit(50);

    return NextResponse.json({ success: true, packages });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    await connectDB();

    // packageId generate karo
    body.packageId = "SURG-" + Date.now().toString(36).toUpperCase();

    // membershipPrice calculate karo
    if (body.membershipDiscount && body.offerPrice) {
      body.membershipPrice = Math.round(
        body.offerPrice - (body.offerPrice * body.membershipDiscount) / 100
      );
    }

    const pkg = await SurgeryPackage.create(body);
    return NextResponse.json({ success: true, package: pkg });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}