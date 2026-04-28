import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import Doctor from "../../../models/Doctor";
import Booking from "../../../models/Booking";
import Transaction from "../../../models/Transaction";

export const dynamic = "force-dynamic";

async function generateBookingId() {
  const count = await Booking.countDocuments();
  return `BH-OPD-${String(count + 1).padStart(5, "0")}`;
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
        description: `OPD Booking - Dr. ${doctor.name}`,
        category:    "booking_payment",
        status:      "success",
      });
    }

    // Booking create karo
    const booking = await Booking.create({
      bookingId: await generateBookingId(),
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