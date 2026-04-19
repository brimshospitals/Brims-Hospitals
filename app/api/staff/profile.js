export const dynamic = "force-dynamic";

import { connectDB } from "@/lib/mongodb";
import Staff from "@/models/Staff";
import User from "@/models/User";
import { getSessionFromRequest, hashPassword, verifyPassword } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "staff") {
      return NextResponse.json(
        { success: false, message: "Staff login required" },
        { status: 401 }
      );
    }

    await connectDB();

    // Get staff profile
    const staff = await Staff.findOne({ userId: session.userId })
      .select("-permissions -createdBy")
      .lean();

    if (!staff) {
      return NextResponse.json(
        { success: false, message: "Staff profile not found" },
        { status: 404 }
      );
    }

    // Get user info for professional ID
    const user = await User.findById(session.userId).select(
      "professionalId email mobile"
    ).lean();

    return NextResponse.json({
      success: true,
      staff: {
        ...staff,
        _id: staff._id?.toString(),
        userId: staff.userId?.toString(),
        hospitalId: staff.hospitalId?.toString(),
        professionalId: user?.professionalId || user?.email || user?.mobile,
      },
    });
  } catch (error) {
    console.error("Get Staff Profile Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== "staff") {
      return NextResponse.json(
        { success: false, message: "Staff login required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, age, gender, phone, designation, department, photo, email, password, currentPassword } = body;

    await connectDB();

    // Get current staff
    const staff = await Staff.findOne({ userId: session.userId });
    if (!staff) {
      return NextResponse.json(
        { success: false, message: "Staff profile not found" },
        { status: 404 }
      );
    }

    // If updating email, check uniqueness (excluding current email)
    if (email && email !== staff.email) {
      const existing = await Staff.findOne({ email, _id: { $ne: staff._id } });
      if (existing) {
        return NextResponse.json(
          { success: false, message: "Email already in use" },
          { status: 400 }
        );
      }
    }

    // Update Staff fields
    if (name) staff.name = name;
    if (age) staff.age = age;
    if (gender) staff.gender = gender;
    if (phone) staff.phone = phone;
    if (designation) staff.designation = designation;
    if (department) staff.department = department;
    if (photo) staff.photo = photo;
    if (email) staff.email = email;

    await staff.save();

    // Update User model if email changed
    const user = await User.findById(session.userId);
    if (email && user) {
      user.email = email;
      await user.save();
    }

    // Handle password change
    if (password && currentPassword) {
      if (!user) {
        return NextResponse.json(
          { success: false, message: "User record not found" },
          { status: 404 }
        );
      }

      // Verify current password
      const isValid = await verifyPassword(currentPassword, user.professionalPassword);
      if (!isValid) {
        return NextResponse.json(
          { success: false, message: "Current password is incorrect" },
          { status: 400 }
        );
      }

      // Hash and update new password
      if (password.length < 6) {
        return NextResponse.json(
          { success: false, message: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }

      user.professionalPassword = await hashPassword(password);
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      staff: {
        ...staff.toObject(),
        _id: staff._id?.toString(),
        userId: staff.userId?.toString(),
        hospitalId: staff.hospitalId?.toString(),
      },
    });
  } catch (error) {
    console.error("Update Staff Profile Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}
