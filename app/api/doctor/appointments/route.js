import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Booking from "../../../../models/Booking";
import Doctor from "../../../../models/Doctor";
import User from "../../../../models/User";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { error, session } = await requireAuth(request, ["doctor", "admin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    // Doctor can only see their own appointments; admin can query any
    const doctorId = session.role === "admin"
      ? searchParams.get("doctorId")
      : session.doctorId || searchParams.get("doctorId");
    const status   = searchParams.get("status") || "all";
    const tab      = searchParams.get("tab")    || "all"; // today | upcoming | all

    if (!doctorId) {
      return NextResponse.json({ success: false, message: "doctorId required" }, { status: 400 });
    }

    await connectDB();

    const doctor = await Doctor.findById(doctorId).lean();
    if (!doctor) {
      return NextResponse.json({ success: false, message: "Doctor not found" }, { status: 404 });
    }

    // Build query
    const query = { doctorId };

    if (status !== "all") query.status = status;

    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (tab === "today") {
      query.appointmentDate = { $gte: today, $lt: tomorrow };
    } else if (tab === "upcoming") {
      query.appointmentDate = { $gte: tomorrow };
    }

    const bookings = await Booking.find(query)
      .sort({ appointmentDate: 1, createdAt: -1 })
      .limit(100)
      .lean();

    // Fetch patient names
    const userIds = [...new Set(bookings.map((b) => b.userId?.toString()).filter(Boolean))];
    const users   = await User.find({ _id: { $in: userIds } }).select("name mobile photo").lean();
    const userMap = {};
    users.forEach((u) => { userMap[u._id.toString()] = u; });

    const enriched = bookings.map((b) => {
      const patient = userMap[b.userId?.toString()] || {};
      let extra = {};
      try { extra = b.notes ? JSON.parse(b.notes) : {}; } catch {}
      return {
        ...b,
        patientName:   patient.name   || "Unknown",
        patientMobile: patient.mobile || "",
        patientPhoto:  patient.photo  || "",
        consultType:   extra.consultType || "",
        symptoms:      extra.symptoms    || "",
      };
    });

    // Stats
    const todayBookings     = await Booking.countDocuments({ doctorId, appointmentDate: { $gte: today, $lt: tomorrow } });
    const pendingBookings   = await Booking.countDocuments({ doctorId, status: "pending" });
    const completedBookings = await Booking.countDocuments({ doctorId, status: "completed" });

    return NextResponse.json({
      success: true,
      doctor: {
        _id:          doctor._id,
        name:         doctor.name,
        department:   doctor.department,
        speciality:   doctor.speciality,
        photo:        doctor.photo || "",
        hospitalName: doctor.hospitalName || "",
        opdFee:       doctor.opdFee,
      },
      bookings: enriched,
      stats: {
        todayCount:     todayBookings,
        pendingCount:   pendingBookings,
        completedCount: completedBookings,
      },
    });
  } catch (error) {
    console.error("Doctor Appointments Error:", error);
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}

// PATCH — update booking status (doctor marks as completed/cancelled)
export async function PATCH(request) {
  const { error } = await requireAuth(request, ["doctor", "admin", "staff"]);
  if (error) return error;

  try {
    const { bookingId, status } = await request.json();
    if (!bookingId || !status) {
      return NextResponse.json({ success: false, message: "bookingId and status required" }, { status: 400 });
    }

    await connectDB();
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true }
    );
    if (!booking) return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}
