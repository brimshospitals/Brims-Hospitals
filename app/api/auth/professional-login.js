export const dynamic = "force-dynamic";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Doctor from "@/models/Doctor";
import { createSession, verifyPassword } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    await connectDB();

    const { professionalId, password, type } = await request.json();

    if (!professionalId || !password || !type) {
      return NextResponse.json(
        { success: false, message: "Professional ID, Password, aur Type zaroori hain" },
        { status: 400 }
      );
    }

    // Validate type
    if (!["doctor", "hospital", "staff"].includes(type)) {
      return NextResponse.json(
        { success: false, message: "Invalid professional type" },
        { status: 400 }
      );
    }

    // Find user by professionalId (email or username)
    const user = await User.findOne({
      $or: [
        { professionalId: professionalId },
        { email: professionalId },
        { mobile: professionalId },
      ],
      professionalType: type,
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Professional ID ya password galat hai" },
        { status: 401 }
      );
    }

    // Verify password
    if (!user.professionalPassword) {
      return NextResponse.json(
        { success: false, message: "Kripya apka password set karein. Admin se contact karein" },
        { status: 401 }
      );
    }

    const passwordMatch = await verifyPassword(password, user.professionalPassword);
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: "Professional ID ya password galat hai" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: "Yeh account deactivated hai. Admin se contact karein" },
        { status: 403 }
      );
    }

    // Get additional info based on type
    let redirectPath = "/dashboard";
    let additionalData = {};

    if (type === "doctor" && user.doctorId) {
      const doctor = await Doctor.findById(user.doctorId);
      additionalData.doctorId = user.doctorId.toString();
      additionalData.doctorName = doctor?.name || user.name;
      additionalData.hospitalId = doctor?.hospitalId?.toString();
      redirectPath = "/doctor-dashboard";
    } else if (type === "hospital" && user.hospitalId) {
      additionalData.hospitalMongoId = user.hospitalId.toString();
      additionalData.hospitalName = user.name;
      redirectPath = "/hospital-dashboard";
    } else if (type === "staff" && user.staffId) {
      additionalData.staffId = user.staffId.toString();
      additionalData.hospitalId = user.hospitalId?.toString();
      redirectPath = "/staff-dashboard";
    }

    // Create session
    const sessionPayload = {
      userId: user._id.toString(),
      role: type === "doctor" ? "doctor" : type === "hospital" ? "hospital" : "staff",
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      professionalType: type,
      ...additionalData,
    };

    await createSession(sessionPayload);

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user._id.toString(),
            name: user.name,
            mobile: user.mobile,
            email: user.email,
            professionalType: type,
          },
          redirectPath,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Professional Login Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error — kripya baad mein koshish karein" },
      { status: 500 }
    );
  }
}
