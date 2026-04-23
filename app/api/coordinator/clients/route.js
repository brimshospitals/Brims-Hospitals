import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import Coordinator from "../../../../models/Coordinator";
import Booking from "../../../../models/Booking";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// GET — check if mobile is existing member
// ?mobile=9876543210
export async function GET(request) {
  const { error, session } = await requireAuth(request, ["coordinator", "admin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const mobile = searchParams.get("mobile")?.trim();

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return NextResponse.json({ success: false, message: "Valid mobile number daalo" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ mobile }).select("-otp -otpExpiry -professionalPassword -password").lean();
    if (user) {
      return NextResponse.json({ success: true, exists: true, user });
    }
    return NextResponse.json({ success: true, exists: false, user: null });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// POST — create new client (member account) for coordinator
export async function POST(request) {
  const { error, session } = await requireAuth(request, ["coordinator", "admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const { name, mobile, age, gender } = body;

    if (!name || !mobile || !age || !gender) {
      return NextResponse.json({ success: false, message: "Naam, mobile, age, gender zaruri hai" }, { status: 400 });
    }
    if (!/^\d{10}$/.test(mobile.trim())) {
      return NextResponse.json({ success: false, message: "Valid 10-digit mobile zaruri hai" }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ mobile: mobile.trim() });
    if (existing) {
      return NextResponse.json({ success: true, exists: true, user: existing, message: "Pehle se registered hai" });
    }

    // Create new user (basic member)
    const user = await User.create({
      mobile: mobile.trim(),
      name:   name.trim(),
      age:    Number(age),
      gender,
      role:   "user",
      isActive: true,
    });

    // Increment coordinator's client count
    if (session.role === "coordinator") {
      const coord = await Coordinator.findOne({ userId: session.userId });
      if (coord) {
        await Coordinator.findByIdAndUpdate(coord._id, { $inc: { totalClients: 1 } });
      }
    }

    return NextResponse.json({ success: true, exists: false, user, message: "Naya client register ho gaya" });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}