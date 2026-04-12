import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page   = parseInt(searchParams.get("page") || "1");
    const limit  = 20;

    await connectDB();

    const query = { role: "staff" };
    if (search.trim()) {
      query.$or = [
        { name:   { $regex: search.trim(), $options: "i" } },
        { mobile: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const total = await User.countDocuments(query);
    const staff = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("name mobile age gender photo isActive memberId createdAt")
      .lean();

    return NextResponse.json({ success: true, staff, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const { name, mobile, age, gender } = await request.json();

    if (!name || !mobile || !age || !gender) {
      return NextResponse.json({ success: false, message: "Name, mobile, age aur gender zaruri hai" }, { status: 400 });
    }
    if (!/^\d{10}$/.test(mobile.trim())) {
      return NextResponse.json({ success: false, message: "10-digit mobile number daalo" }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ mobile: mobile.trim() });
    if (existing) {
      if (existing.role === "staff") {
        return NextResponse.json({ success: false, message: "Is mobile se staff pehle se registered hai" }, { status: 400 });
      }
      // Promote existing user account to staff role
      existing.role = "staff";
      await existing.save();
      return NextResponse.json({ success: true, message: `${existing.name} ko staff bana diya gaya`, staff: existing });
    }

    const staff = await User.create({
      name:     name.trim(),
      mobile:   mobile.trim(),
      age:      Number(age),
      gender,
      role:     "staff",
      isActive: true,
    });

    return NextResponse.json({ success: true, message: `${staff.name} staff member ban gaye`, staff });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const { userId, isActive } = await request.json();
    if (!userId) return NextResponse.json({ success: false, message: "userId required" }, { status: 400 });

    await connectDB();
    const user = await User.findByIdAndUpdate(userId, { $set: { isActive } }, { new: true })
      .select("name isActive").lean();
    if (!user) return NextResponse.json({ success: false, message: "Staff not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: `${user.name} ${isActive ? "activated" : "deactivated"}` });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
