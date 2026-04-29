import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Doctor from "../../../models/Doctor";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const district   = url.searchParams.get("district")   || "";
    const department = url.searchParams.get("department") || "";
    const search     = url.searchParams.get("search")     || "";
    const minFee     = url.searchParams.get("minFee")     || "";
    const maxFee     = url.searchParams.get("maxFee")     || "";
    const page       = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit      = 20;

    await connectDB();

    const query = { isActive: true };

    // Case-insensitive district match (fixes exact-match bug)
    if (district) query["address.district"] = { $regex: `^${district.trim()}$`, $options: "i" };

    if (department) query.department = { $regex: department.trim(), $options: "i" };

    if (search.trim()) {
      query.$or = [
        { name:         { $regex: search.trim(), $options: "i" } },
        { department:   { $regex: search.trim(), $options: "i" } },
        { speciality:   { $regex: search.trim(), $options: "i" } },
        { hospitalName: { $regex: search.trim(), $options: "i" } },
      ];
    }

    // Fix: NaN-safe fee filters
    const min = parseInt(minFee, 10);
    const max = parseInt(maxFee, 10);
    if ((minFee && !isNaN(min)) || (maxFee && !isNaN(max))) {
      query.opdFee = {};
      if (minFee && !isNaN(min) && min >= 0) query.opdFee.$gte = min;
      if (maxFee && !isNaN(max) && max > 0)  query.opdFee.$lte = max;
    }

    const [doctors, total] = await Promise.all([
      Doctor.find(query)
        .sort({ rating: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Doctor.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      doctors,
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
    const doctor = await Doctor.create(body);
    return NextResponse.json({ success: true, doctor });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}
