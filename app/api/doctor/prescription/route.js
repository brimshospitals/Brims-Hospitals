import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Report  from "../../../../models/Report";
import Booking from "../../../../models/Booking";
import User    from "../../../../models/User";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// POST — Doctor uploads prescription for a booking
export async function POST(request) {
  const { error, session } = await requireAuth(request, ["doctor", "admin", "staff"]);
  if (error) return error;

  try {
    const { bookingId, fileUrl, fileType, notes, title } = await request.json();

    if (!bookingId || !fileUrl) {
      return NextResponse.json({ success: false, message: "bookingId aur fileUrl zaruri hai" }, { status: 400 });
    }

    await connectDB();

    // Find booking
    const booking = await Booking.findById(bookingId)
      .populate("userId", "name _id mobile")
      .lean();

    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking nahi mili" }, { status: 404 });
    }

    const reportId = "RX-" + Date.now().toString(36).toUpperCase();

    const report = await Report.create({
      reportId,
      userId:         booking.userId._id,
      hospitalId:     booking.hospitalId || undefined,
      bookingId:      booking._id,
      uploadedByRole: session.role,
      uploadedById:   session.userId,
      title:          title?.trim() || `Prescription — ${new Date().toLocaleDateString("en-IN")}`,
      category:       "Prescription",
      fileUrl,
      fileType:       fileType || "pdf",
      notes:          notes || "",
      reportDate:     new Date(),
      patientName:    booking.userId.name || "",
      hospitalName:   booking.hospitalName || "",
    });

    return NextResponse.json({
      success: true,
      message: "Prescription upload ho gayi!",
      report,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// GET — Doctor fetches prescriptions for a booking
export async function GET(request) {
  const { error } = await requireAuth(request, ["doctor", "admin", "staff"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");
    if (!bookingId) {
      return NextResponse.json({ success: false, message: "bookingId zaruri hai" }, { status: 400 });
    }
    await connectDB();
    const reports = await Report.find({ bookingId, category: "Prescription" })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ success: true, reports });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
