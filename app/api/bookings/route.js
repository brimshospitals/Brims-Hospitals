import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Booking from "../../../models/Booking";
import User from "../../../models/User";
import Notification from "../../../models/Notification";
import { requireAuth } from "../../../lib/auth";

export const dynamic = "force-dynamic";

// Counter for sequential booking IDs
async function generateBookingId(type) {
  const prefix = { OPD: "OPD", Lab: "LAB", Surgery: "SRG", Consultation: "TEL" }[type] || "BKG";
  const count = await Booking.countDocuments();
  return `BH-${prefix}-${String(count + 1).padStart(5, "0")}`;
}

// POST — create a new booking
export async function POST(request) {
  const { error, session } = await requireAuth(request, ["user", "member", "admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const {
      type,           // "OPD" | "Lab" | "Surgery" | "Consultation"
      doctorId,
      hospitalId,
      packageId,
      labTestId,
      appointmentDate,
      slot,
      // Patient info
      patientUserId,  // If linked member — their _id; null for new patient
      patientName,
      patientMobile,
      patientAge,
      patientGender,
      symptoms,
      isNewPatient,
      // Payment
      paymentMode,    // "counter" | "online" | "wallet" | "insurance"
      amount,
      familyCardId,
    } = body;

    if (!type || !appointmentDate || !patientName || !patientMobile) {
      return NextResponse.json(
        { success: false, message: "type, appointmentDate, patientName aur mobile zaruri hai" },
        { status: 400 }
      );
    }

    await connectDB();

    const bookingId = await generateBookingId(type);

    // Encode patient info + symptoms in notes if new patient
    const notes = JSON.stringify({
      patientName,
      patientMobile,
      patientAge,
      patientGender,
      symptoms: symptoms || "",
      paymentMode: paymentMode || "counter",
      isNewPatient: !!isNewPatient,
    });

    const booking = await Booking.create({
      bookingId,
      type,
      userId: session.userId,
      memberId: patientUserId || undefined,
      doctorId: doctorId || undefined,
      hospitalId: hospitalId || undefined,
      packageId: packageId || undefined,
      labTestId: labTestId || undefined,
      appointmentDate: new Date(appointmentDate),
      slot: slot || "",
      status: "pending",
      paymentStatus: paymentMode === "online" ? "pending" : "pending",
      amount: amount || 0,
      familyCardId: familyCardId || undefined,
      notes,
    });

    // ── Notifications ──────────────────────────────────────────
    const typeLabel = { OPD: "OPD Appointment", Lab: "Lab Test", Surgery: "Surgery Package", Consultation: "Teleconsultation" }[type] || type;
    const dateLabel = new Date(appointmentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    try {
      // 1. Notify the booking user
      await Notification.create({
        userId: session.userId,
        type: "booking",
        title: `${typeLabel} Booking Confirmed`,
        message: `Booking ID: ${bookingId} | Patient: ${patientName} | Date: ${dateLabel}${slot ? " | Slot: " + slot : ""}`,
      });

      // 2. Notify all admin users
      const admins = await User.find({ role: "admin" }).select("_id").lean();
      if (admins.length > 0) {
        await Notification.insertMany(
          admins.map((admin) => ({
            userId: admin._id,
            type: "booking",
            title: `Naya ${typeLabel} Booking`,
            message: `Patient: ${patientName} (${patientMobile}) | ${dateLabel}${slot ? " " + slot : ""} | ₹${amount || 0} | Mode: ${paymentMode || "counter"} | ID: ${bookingId}`,
          }))
        );
      }
    } catch (notifErr) {
      // Don't fail the booking if notification fails
      console.error("Notification error:", notifErr.message);
    }
    // ────────────────────────────────────────────────────────────

    return NextResponse.json({
      success: true,
      message: "Booking successful!",
      booking: {
        _id: booking._id,
        bookingId: booking.bookingId,
        type: booking.type,
        status: booking.status,
        appointmentDate: booking.appointmentDate,
        slot: booking.slot,
        amount: booking.amount,
        patientName,
        patientMobile,
      },
    });
  } catch (err) {
    console.error("Booking POST error:", err);
    return NextResponse.json({ success: false, message: "Server error: " + err.message }, { status: 500 });
  }
}

// GET — fetch bookings for logged-in user
export async function GET(request) {
  const { error, session } = await requireAuth(request, ["user", "member", "admin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const type   = searchParams.get("type")   || "all";
    const status = searchParams.get("status") || "all";
    const page   = parseInt(searchParams.get("page") || "1", 10);
    const limit  = 20;

    await connectDB();

    const query = { userId: session.userId };
    if (type   !== "all") query.type   = type;
    if (status !== "all") query.status = status;

    const total    = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Parse patient info from notes
    const enriched = bookings.map((b) => {
      let extra = {};
      try { extra = b.notes ? JSON.parse(b.notes) : {}; } catch {}
      return { ...b, ...extra };
    });

    return NextResponse.json({
      success: true,
      bookings: enriched,
      total,
      pages: Math.ceil(total / limit),
      page,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: "Server error: " + err.message }, { status: 500 });
  }
}
