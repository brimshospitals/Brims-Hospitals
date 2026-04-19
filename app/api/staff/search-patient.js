export const dynamic = "force-dynamic";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Login karein" },
        { status: 401 }
      );
    }

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
    const user = await User.findOne({ mobile: mobile.trim() }).select(
      "_id name age gender mobile photo isActive"
    ).lean();

    if (!user) {
      return NextResponse.json({
        success: true,
        found: false,
        mobile: mobile.trim(),
      });
    }

    // If found, also get family members
    let familyMembers = [];
    if (user._id) {
      const fullUser = await User.findById(user._id).select(
        "familyMembers"
      ).lean();
      familyMembers = fullUser?.familyMembers || [];
    }

    return NextResponse.json({
      success: true,
      found: true,
      user: {
        userId: user._id?.toString(),
        name: user.name,
        age: user.age,
        gender: user.gender,
        mobile: user.mobile,
        photo: user.photo,
      },
      familyMembers: familyMembers.map((m: any) => ({
        id: m._id?.toString(),
        name: m.name,
        age: m.age,
        gender: m.gender,
        relationship: m.relationship,
      })),
    });
  } catch (error) {
    console.error("Search Patient Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
