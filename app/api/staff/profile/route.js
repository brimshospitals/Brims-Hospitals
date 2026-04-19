import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import { requireAuth, hashPassword, verifyPassword } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// GET — get staff's own profile
export async function GET(request) {
  const { error, session } = await requireAuth(request, ["staff", "admin"]);
  if (error) return error;

  try {
    await connectDB();

    const user = await User.findById(session.userId)
      .select("name age gender mobile email photo professionalId staffPermissions isActive createdAt")
      .lean();

    if (!user) {
      return NextResponse.json({ success: false, message: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      staff: {
        ...user,
        _id:   user._id?.toString(),
        // Map mobile as phone for the profile form
        phone: user.mobile,
        professionalId: user.professionalId || user.email || user.mobile,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// PATCH — update staff's own profile
export async function PATCH(request) {
  const { error, session } = await requireAuth(request, ["staff", "admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const { name, age, gender, email, photo, password, currentPassword } = body;

    await connectDB();

    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Update basic fields
    if (name  !== undefined && name.trim())  user.name  = name.trim();
    if (age   !== undefined && Number(age))  user.age   = Number(age);
    if (gender !== undefined && ["male", "female"].includes(gender)) user.gender = gender;
    if (email !== undefined && email.trim()) user.email = email.trim();
    if (photo !== undefined && photo)        user.photo = photo;

    // Handle password change
    if (password) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, message: "Current password required to change password" },
          { status: 400 }
        );
      }
      if (password.length < 6) {
        return NextResponse.json(
          { success: false, message: "New password must be at least 6 characters" },
          { status: 400 }
        );
      }

      // Verify current password
      if (!user.professionalPassword) {
        return NextResponse.json(
          { success: false, message: "No password set — contact admin" },
          { status: 400 }
        );
      }
      const isValid = await verifyPassword(currentPassword, user.professionalPassword);
      if (!isValid) {
        return NextResponse.json(
          { success: false, message: "Current password is incorrect" },
          { status: 400 }
        );
      }

      user.professionalPassword = await hashPassword(password);
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Profile updated",
      staff: {
        _id:           user._id?.toString(),
        name:          user.name,
        age:           user.age,
        gender:        user.gender,
        mobile:        user.mobile,
        email:         user.email,
        photo:         user.photo,
        phone:         user.mobile,
        professionalId: user.professionalId || user.email || user.mobile,
        staffPermissions: user.staffPermissions,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}