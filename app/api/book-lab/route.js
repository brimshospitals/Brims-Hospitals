import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import LabTest from "../../../models/LabTest";
import Booking from "../../../models/Booking";
import Transaction from "../../../models/Transaction";

export const dynamic = "force-dynamic";

async function generateBookingId() {
  const count = await Booking.countDocuments();
  return `BH-LAB-${String(count + 1).padStart(5, "0")}`;
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
      // Atomic deduction — race condition safe
      const walletUser = await User.findOneAndUpdate(
        { _id: userId, walletBalance: { $gte: amount } },
        { $inc: { walletBalance: -amount } }
      );
      if (!walletUser) {
        return NextResponse.json(
          { success: false, message: `Wallet mein balance nahi hai. Required: ₹${amount}` },
          { status: 400 }
        );
      }
      await Transaction.create({
        userId,
        type:        "debit",
        amount,
        description: `Lab Test Booking - ${test.name}`,
        category:    "booking_payment",
        status:      "success",
      });
    }

    const booking = await Booking.create({
      bookingId: await generateBookingId(),
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
