import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import Doctor from "../../../models/Doctor";
import Booking from "../../../models/Booking";
import FamilyCard from "../../../models/FamilyCard";
import Transaction from "../../../models/Transaction";

export const dynamic = "force-dynamic";

function generateBookingId() {
  return "BRIMS-OPD-" + Date.now().toString(36).toUpperCase();
}

export async function POST(request) {
  try {
    const {
      userId, memberId, doctorId,
      appointmentDate, slot, paymentType,
    } = await request.json();

    if (!userId || !doctorId || !appointmentDate || !slot) {
      return NextResponse.json(
        { success: false, message: "Sabhi fields zaruri hain" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(userId);
    const doctor = await Doctor.findById(doctorId);

    if (!user || !doctor) {
      return NextResponse.json(
        { success: false, message: "User ya Doctor nahi mila" },
        { status: 404 }
      );
    }

    const amount = doctor.offerFee || doctor.opdFee;

    // Wallet se payment
    if (paymentType === "wallet") {
      if (!user.familyCardId) {
        return NextResponse.json(
          { success: false, message: "Family Card activate karein" },
          { status: 400 }
        );
      }

      const familyCard = await FamilyCard.findById(user.familyCardId);
      if (familyCard.walletBalance < amount) {
        return NextResponse.json(
          { success: false, message: `Wallet mein insufficient balance. Required: ₹${amount}` },
          { status: 400 }
        );
      }

      // Wallet se deduct karo
      familyCard.walletBalance -= amount;
      await familyCard.save();

      // Transaction record
      await Transaction.create({
        userId,
        familyCardId: user.familyCardId,
        type: "debit",
        amount,
        description: `OPD Booking - Dr. ${doctor.name}`,
        status: "success",
      });
    }

    // Booking create karo
    const booking = await Booking.create({
      bookingId: generateBookingId(),
      type: "OPD",
      userId,
      memberId: memberId || userId,
      doctorId,
      hospitalId: doctor.hospitalId,
      appointmentDate: new Date(appointmentDate),
      slot,
      status: "confirmed",
      paymentStatus: paymentType === "wallet" ? "paid" : "pending",
      amount,
      familyCardId: user.familyCardId,
    });

    return NextResponse.json({
      success: true,
      message: "Booking confirm ho gayi! 🎉",
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