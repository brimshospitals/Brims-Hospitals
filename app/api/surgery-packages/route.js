import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import SurgeryPackage from "../../../models/SurgeryPackage";

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
    const url = new URL(request.url);
    const district  = url.searchParams.get("district")  || "";
    const category  = url.searchParams.get("category")  || "";
    const search    = url.searchParams.get("search")    || "";
    const maxPrice  = url.searchParams.get("maxPrice")  || "";
    const page      = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit     = 20;

    await connectDB();

    const query = { isActive: true };

    // Normalize alias (e.g. "Chapra" → "Saran") then case-insensitive match
    const districtNorm = normalizeDistrict(district);
    if (districtNorm) query["address.district"] = { $regex: `^${districtNorm}$`, $options: "i" };

    // Case-insensitive category match
    if (category) query.category = { $regex: `^${category.trim()}$`, $options: "i" };

    if (search.trim()) {
      query.$or = [
        { name:         { $regex: search.trim(), $options: "i" } },
        { category:     { $regex: search.trim(), $options: "i" } },
        { surgeonName:  { $regex: search.trim(), $options: "i" } },
        { hospitalName: { $regex: search.trim(), $options: "i" } },
      ];
    }

    // Fix: NaN-safe price filter
    const price = parseInt(maxPrice, 10);
    if (maxPrice && !isNaN(price) && price > 0) query.offerPrice = { $lte: price };

    const [packages, total] = await Promise.all([
      SurgeryPackage.find(query)
        .sort({ rating: -1, totalBookings: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      SurgeryPackage.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      packages,
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
    await connectDB();

    body.packageId = "SURG-" + Date.now().toString(36).toUpperCase();

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
