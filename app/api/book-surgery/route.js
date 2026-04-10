import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import SurgeryPackage from "../../../models/SurgeryPackage";
import Booking from "../../../models/Booking";
import FamilyCard from "../../../models/FamilyCard";
import Transaction from "../../../models/Transaction";

export const dynamic = "force-dynamic";

function generateBookingId() {
  return "BRIMS-SURG-" + Date.now().toString(36).toUpperCase();
}

export async function POST(request) {
  try {
    const { userId, memberId, packageId, roomType, amount } = await request.json();

    if (!userId || !packageId || !amount) {
      return NextResponse.json(
        { success: false, message: "Sabhi fields zaruri hain" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(userId);
    const pkg = await SurgeryPackage.findById(packageId);

    if (!user || !pkg) {
      return NextResponse.json(
        { success: false, message: "User ya Package nahi mila" },
        { status: 404 }
      );
    }

    // Booking create karo
    const booking = await Booking.create({
      bookingId: generateBookingId(),
      type: "Surgery",
      userId,
      memberId: memberId || userId,
      packageId,
      hospitalId: pkg.hospitalId,
      roomType,
      status: "pending",
      paymentStatus: "pending",
      amount,
      familyCardId: user.familyCardId,
      notes: `Surgery Package: ${pkg.name}`,
    });

    // Package booking count update
    pkg.totalBookings += 1;
    await pkg.save();

    return NextResponse.json({
      success: true,
      message: "Surgery booking request send ho gayi! Team 24 hours mein contact karegi.",
      bookingId: booking.bookingId,
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}