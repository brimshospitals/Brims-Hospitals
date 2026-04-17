import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import { requireAuth, hashPassword } from "../../../../lib/auth";

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
      .select("name mobile email age gender photo isActive memberId staffPermissions createdAt")
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
    const { name, mobile, email, age, gender, permissions } = await request.json();

    if (!name || !mobile) {
      return NextResponse.json({ success: false, message: "Name aur mobile zaruri hai" }, { status: 400 });
    }
    if (!/^\d{10}$/.test(mobile.trim())) {
      return NextResponse.json({ success: false, message: "10-digit mobile number daalo" }, { status: 400 });
    }

    await connectDB();

    // Default password = mobile number
    const defaultPw  = mobile.trim();
    const hashedPw   = await hashPassword(defaultPw);
    const profId     = email?.trim() || mobile.trim();

    const perms = {
      manageBookings:    permissions?.manageBookings    ?? true,
      collectPayments:   permissions?.collectPayments   ?? true,
      managePatients:    permissions?.managePatients    ?? false,
      uploadLabReports:  permissions?.uploadLabReports  ?? false,
      cancelBookings:    permissions?.cancelBookings    ?? false,
      viewAnalytics:     permissions?.viewAnalytics     ?? false,
      manageIPD:         permissions?.manageIPD         ?? false,
      dispatchAmbulance: permissions?.dispatchAmbulance ?? false,
    };

    const existing = await User.findOne({ mobile: mobile.trim() });
    if (existing) {
      if (existing.role === "staff") {
        return NextResponse.json({ success: false, message: "Is mobile se staff pehle se registered hai" }, { status: 400 });
      }
      // Promote existing user to staff
      await User.findByIdAndUpdate(existing._id, {
        role: "staff",
        professionalId: profId,
        professionalPassword: hashedPw,
        professionalType: "staff",
        staffPermissions: perms,
        isActive: true,
      });
      return NextResponse.json({ success: true, message: `${existing.name} ko staff bana diya. Default password: ${defaultPw}`, staff: existing });
    }

    const staff = await User.create({
      name:                 name.trim(),
      mobile:               mobile.trim(),
      email:                email?.trim()   || undefined,
      age:                  Number(age)     || 25,
      gender:               gender          || "male",
      role:                 "staff",
      professionalId:       profId,
      professionalPassword: hashedPw,
      professionalType:     "staff",
      staffPermissions:     perms,
      isActive:             true,
    });

    return NextResponse.json({
      success: true,
      message: `${staff.name} staff member ban gaye. Default password: ${defaultPw}`,
      staff,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const { userId, isActive, permissions } = await request.json();
    if (!userId) return NextResponse.json({ success: false, message: "userId required" }, { status: 400 });

    await connectDB();

    const update = {};
    if (isActive    !== undefined) update.isActive          = isActive;
    if (permissions !== undefined) update.staffPermissions  = permissions;

    const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true })
      .select("name isActive staffPermissions").lean();
    if (!user) return NextResponse.json({ success: false, message: "Staff not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: `${user.name} updated`, staff: user });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
