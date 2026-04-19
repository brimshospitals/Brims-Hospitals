export const dynamic = "force-dynamic";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { createSession, verifyPassword } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    await connectDB();

    const { adminKey, password } = await request.json();

    if (!adminKey || !password) {
      return NextResponse.json(
        { success: false, message: "Admin Key aur Password zaroori hain" },
        { status: 400 }
      );
    }

    // Verify admin key
    const correctAdminKey = process.env.ADMIN_KEY;
    if (!correctAdminKey || adminKey !== correctAdminKey) {
      return NextResponse.json(
        { success: false, message: "Admin Key galat hai" },
        { status: 401 }
      );
    }

    // For now, we use a hardcoded admin password (can be stored in env)
    // In production, this should be stored in database with proper hashing
    const correctPassword = process.env.ADMIN_PASSWORD || "admin123"; // Default, change this!

    if (password !== correctPassword) {
      return NextResponse.json(
        { success: false, message: "Password galat hai" },
        { status: 401 }
      );
    }

    // Create admin session
    const sessionPayload = {
      userId: "admin-system",
      role: "admin",
      name: "Brims Admin",
      mobile: "0000000000",
      email: "admin@brimshospitals.com",
      professionalType: "admin",
    };

    await createSession(sessionPayload);

    return NextResponse.json(
      {
        success: true,
        message: "Admin login successful",
        data: {
          user: {
            id: "admin-system",
            name: "Brims Admin",
            role: "admin",
          },
          redirectPath: "/admin",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin Login Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error — kripya baad mein koshish karein" },
      { status: 500 }
    );
  }
}
