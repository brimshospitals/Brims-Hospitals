import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";

export const dynamic = "force-dynamic";

export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      userId, name, age, gender,
      maritalStatus, isPregnant, lmp,
      email, district, prakhand, village,
      preExistingDiseases, height, weight, photo,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId chahiye" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User nahi mila" },
        { status: 404 }
      );
    }

    // Update fields
    if (name) user.name = name;
    if (age) user.age = parseInt(age);
    if (gender) user.gender = gender;
    if (email) user.email = email;
    if (photo) user.photo = photo;
    if (preExistingDiseases) user.preExistingDiseases = preExistingDiseases;
    if (height) user.height = parseInt(height);
    if (weight) user.weight = parseInt(weight);

    if (district) user.address = { ...user.address, district, prakhand, village };

    if (gender === "female" && parseInt(age) >= 18) {
      user.maritalStatus = maritalStatus;
      if (maritalStatus === "married") {
        user.isPregnant = isPregnant;
        user.lmp = isPregnant && lmp ? new Date(lmp) : null;
      }
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Profile update ho gayi!",
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}