import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Doctor from "../../../models/Doctor";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const district = url.searchParams.get("district");
    const department = url.searchParams.get("department");
    const search = url.searchParams.get("search");
    const minFee = url.searchParams.get("minFee");
    const maxFee = url.searchParams.get("maxFee");

    await connectDB();

 let query = { isActive: true };
 
    if (district) query["address.district"] = district;
    if (department) query.department = { $regex: department, $options: "i" };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
        { speciality: { $regex: search, $options: "i" } },
        { hospitalName: { $regex: search, $options: "i" } },
      ];
    }
    if (minFee || maxFee) {
      query.opdFee = {};
      if (minFee) query.opdFee.$gte = parseInt(minFee);
      if (maxFee) query.opdFee.$lte = parseInt(maxFee);
    }

    const doctors = await Doctor.find(query).sort({ rating: -1 }).limit(50);

    return NextResponse.json({ success: true, doctors });
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