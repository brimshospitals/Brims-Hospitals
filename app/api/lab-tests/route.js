import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import LabTest from "../../../models/LabTest";

export const dynamic = "force-dynamic";

// GET: Search & list lab tests
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const district = searchParams.get("district") || "";
    const maxPrice = searchParams.get("maxPrice") || "";
    const homeCollection = searchParams.get("homeCollection") || "";

    await connectDB();

    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { hospitalName: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }
    if (category) query.category = category;
    if (district) query["address.district"] = { $regex: district, $options: "i" };
    if (maxPrice) query.offerPrice = { $lte: parseInt(maxPrice) };
    if (homeCollection === "true") query.homeCollection = true;

    const tests = await LabTest.find(query).sort({ offerPrice: 1 });

    return NextResponse.json({ success: true, tests });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new lab test (hospital/admin use)
export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.name || !body.mrp || !body.offerPrice) {
      return NextResponse.json(
        { success: false, message: "name, mrp aur offerPrice zaruri hain" },
        { status: 400 }
      );
    }

    await connectDB();

    const testId = "LAB-" + Date.now().toString(36).toUpperCase();

    // membershipPrice auto-calculate if not provided
    if (body.membershipDiscount && !body.membershipPrice) {
      body.membershipPrice = Math.round(
        body.offerPrice * (1 - body.membershipDiscount / 100)
      );
    }

    const test = await LabTest.create({ ...body, testId });

    return NextResponse.json(
      { success: true, message: "Lab test add ho gaya!", test },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}
