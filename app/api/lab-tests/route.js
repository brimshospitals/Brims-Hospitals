import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import LabTest from "../../../models/LabTest";

const DISTRICT_ALIASES = {
  rajdhani:"Patna","patna sahib":"Patna","patna city":"Patna",
  chapra:"Saran",chhapra:"Saran",
  ara:"Bhojpur",arrah:"Bhojpur",
  sasaram:"Rohtas",bhabua:"Kaimur",
  biharsharif:"Nalanda","bihar sharif":"Nalanda",
  bettiah:"West Champaran","pashchim champaran":"West Champaran",
  motihari:"East Champaran","purba champaran":"East Champaran",
  hajipur:"Vaishali",purnea:"Purnia",
};
function normalizeDistrict(d) {
  if (!d) return d;
  return DISTRICT_ALIASES[d.trim().toLowerCase()] || d.trim();
}

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search         = searchParams.get("search")         || "";
    const category       = searchParams.get("category")       || "";
    const district       = searchParams.get("district")       || "";
    const maxPrice       = searchParams.get("maxPrice")       || "";
    const homeCollection = searchParams.get("homeCollection") || "";
    const page           = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit          = 20;

    await connectDB();

    const query = { isActive: true };

    if (search.trim()) {
      query.$or = [
        { name:         { $regex: search.trim(), $options: "i" } },
        { hospitalName: { $regex: search.trim(), $options: "i" } },
        { category:     { $regex: search.trim(), $options: "i" } },
      ];
    }

    // Fix: case-insensitive category match (was strict equality)
    if (category) query.category = { $regex: `^${category.trim()}$`, $options: "i" };

    const districtNorm = normalizeDistrict(district);
    if (districtNorm) query["address.district"] = { $regex: `^${districtNorm}$`, $options: "i" };

    // Fix: NaN-safe price filter
    const price = parseInt(maxPrice, 10);
    if (maxPrice && !isNaN(price) && price > 0) query.offerPrice = { $lte: price };

    if (homeCollection === "true") query.homeCollection = true;

    const [tests, total] = await Promise.all([
      LabTest.find(query)
        .sort({ offerPrice: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      LabTest.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      tests,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
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

    if (!body.name || !body.mrp || !body.offerPrice) {
      return NextResponse.json(
        { success: false, message: "name, mrp aur offerPrice zaruri hain" },
        { status: 400 }
      );
    }

    await connectDB();

    const testId = "LAB-" + Date.now().toString(36).toUpperCase();

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
