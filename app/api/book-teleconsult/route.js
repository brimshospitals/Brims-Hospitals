import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import Booking from "../../../models/Booking";

export const dynamic = "force-dynamic";

function generateBookingId() {
  return "BRIMS-CONSULT-" + Date.now().toString(36).toUpperCase();
}

export async function POST(request) {
  try {
    const {
      userId,
      doctorName,
      doctorSpeciality,
      consultType,   // "video" | "audio"
      appointmentDate,
      slot,
      symptoms,
      amount,
      paymentType,   // "counter" | "online"
    } = await request.json();

    if (!userId || !doctorName || !consultType || !amount) {
      return NextResponse.json(
        { success: false, message: "Sabhi zaruri fields bharo" },
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

    const bookingId = generateBookingId();

    const booking = await Booking.create({
      bookingId,
      type: "Consultation",
      userId,
      memberId: userId,
      appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
      slot,
      status: "confirmed",
      paymentStatus: paymentType === "counter" ? "pending" : "pending",
      amount,
      familyCardId: user.familyCardId || null,
      notes: JSON.stringify({
        doctorName,
        doctorSpeciality,
        consultType,
        symptoms: symptoms || "",
        paymentType,
      }),
    });

    return NextResponse.json({
      success: true,
      message: "Teleconsultation book ho gayi!",
      bookingId: booking.bookingId,
      mongoId: booking._id.toString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}
