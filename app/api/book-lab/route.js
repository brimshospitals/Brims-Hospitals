import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import LabTest from "../../../models/LabTest";
import Booking from "../../../models/Booking";
import FamilyCard from "../../../models/FamilyCard";
import Transaction from "../../../models/Transaction";

export const dynamic = "force-dynamic";

function generateBookingId() {
  return "BRIMS-LAB-" + Date.now().toString(36).toUpperCase();
}

export async function POST(request) {
  try {
    const {
      userId,
      memberId,
      labTestId,
      appointmentDate,
      slot,
      homeCollection,
      paymentType,
      amount,
    } = await request.json();

    if (!userId || !labTestId || !amount) {
      return NextResponse.json(
        { success: false, message: "userId, labTestId aur amount zaruri hain" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(userId);
    const test = await LabTest.findById(labTestId);

    if (!user || !test) {
      return NextResponse.json(
        { success: false, message: "User ya Lab Test nahi mila" },
        { status: 404 }
      );
    }

    // Wallet se payment
    if (paymentType === "wallet") {
      if (!user.familyCardId) {
        return NextResponse.json(
          { success: false, message: "Wallet use karne ke liye Family Card activate karein" },
          { status: 400 }
        );
      }

      const familyCard = await FamilyCard.findById(user.familyCardId);
      if (!familyCard || familyCard.walletBalance < amount) {
        return NextResponse.json(
          {
            success: false,
            message: `Wallet mein insufficient balance. Required: ₹${amount}`,
          },
          { status: 400 }
        );
      }

      familyCard.walletBalance -= amount;
      await familyCard.save();

      await Transaction.create({
        userId,
        familyCardId: user.familyCardId,
        type: "debit",
        amount,
        description: `Lab Test Booking - ${test.name}`,
        status: "success",
      });
    }

    const booking = await Booking.create({
      bookingId: generateBookingId(),
      type: "Lab",
      userId,
      memberId: memberId || userId,
      labTestId,
      hospitalId: test.hospitalId,
      appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
      slot: slot || (homeCollection ? "Home Collection" : null),
      status: "confirmed",
      paymentStatus: paymentType === "wallet" ? "paid" : "pending",
      amount,
      familyCardId: user.familyCardId,
      notes: `Lab Test: ${test.name}${homeCollection ? " (Home Collection)" : ""}`,
    });

    // Test booking count update
    test.totalBookings += 1;
    await test.save();

    return NextResponse.json({
      success: true,
      message:
        paymentType === "wallet"
          ? `✅ Booking confirm ho gayi! ${homeCollection ? "Home collection ke liye team call karegi." : ""}`
          : `✅ Booking ho gayi! Counter par payment karein.`,
      bookingId: booking.bookingId,
      amount,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}
