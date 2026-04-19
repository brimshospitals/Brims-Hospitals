import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// GET — search patient by mobile number (staff use)
export async function GET(request) {
  const { error } = await requireAuth(request, ["staff", "admin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const mobile = searchParams.get("mobile");

    if (!mobile || mobile.length !== 10) {
      return NextResponse.json(
        { success: false, message: "Valid 10-digit mobile required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Search for user by mobile
    const user = await User.findOne({ mobile: mobile.trim() })
      .select("_id name age gender mobile photo isActive memberId familyMembers")
      .lean();

    if (!user) {
      return NextResponse.json({
        success: true,
        found: false,
        mobile: mobile.trim(),
      });
    }

    // Map family members
    const familyMembers = (user.familyMembers || []).map((m) => ({
      id:           m._id?.toString(),
      name:         m.name,
      age:          m.age,
      gender:       m.gender,
      relationship: m.relationship,
      memberId:     m.memberId,
    }));

    return NextResponse.json({
      success: true,
      found:   true,
      user: {
        userId:   user._id?.toString(),
        name:     user.name,
        age:      user.age,
        gender:   user.gender,
        mobile:   user.mobile,
        photo:    user.photo,
        memberId: user.memberId,
        isActive: user.isActive,
      },
      familyMembers,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}