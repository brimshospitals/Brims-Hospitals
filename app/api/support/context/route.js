import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import Booking from "../../../../models/Booking";
import Transaction from "../../../../models/Transaction";
import Coordinator from "../../../../models/Coordinator";
import Hospital from "../../../../models/Hospital";
import Doctor from "../../../../models/Doctor";
import LabTest from "../../../../models/LabTest";
import SurgeryPackage from "../../../../models/SurgeryPackage";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// GET — returns role-specific context data for the support form
// No auth required — returns { loggedIn: false } for guests
export async function GET(request) {
  // Graceful auth — don't fail for guests
  let session = null;
  try {
    const result = await requireAuth(request, ["user", "member", "coordinator", "hospital", "doctor", "staff", "admin"]);
    if (!result.error) session = result.session;
  } catch {}

  if (!session) {
    return NextResponse.json({ success: true, loggedIn: false });
  }

  try {
    await connectDB();
    const { role, userId } = session;

    // ── user / member ────────────────────────────────────────────────────────
    if (["user", "member"].includes(role)) {
      const [user, bookings, transactions] = await Promise.all([
        User.findById(userId).select("name mobile memberId familyMembers").lean(),
        Booking.find({ userId })
          .sort({ createdAt: -1 }).limit(25)
          .select("bookingId type status appointmentDate amount notes paymentMode paymentId")
          .populate("doctorId",   "name department")
          .populate("hospitalId", "name")
          .lean(),
        Transaction.find({ userId })
          .sort({ createdAt: -1 }).limit(25)
          .select("_id referenceId paymentId category type amount status description createdAt")
          .lean(),
      ]);

      const enrichedBookings = (bookings || []).map(b => {
        let notes = {};
        try { notes = b.notes ? JSON.parse(b.notes) : {}; } catch {}
        return { ...b, parsedNotes: notes };
      });

      return NextResponse.json({
        success: true, loggedIn: true, role,
        profile: {
          name:     user?.name,
          mobile:   user?.mobile,
          memberId: user?.memberId,
        },
        familyMembers: (user?.familyMembers || []).map(m => ({
          name:   m.name,
          age:    m.age,
          gender: m.gender,
          memberId: m.memberId,
        })),
        bookings:     enrichedBookings,
        transactions: transactions || [],
      });
    }

    // ── coordinator ──────────────────────────────────────────────────────────
    if (role === "coordinator") {
      const [user, coord] = await Promise.all([
        User.findById(userId).select("name mobile").lean(),
        Coordinator.findOne({ userId }).lean(),
      ]);

      const [bookings, transactions] = coord ? await Promise.all([
        Booking.find({ coordinatorId: coord._id })
          .sort({ createdAt: -1 }).limit(25)
          .select("bookingId type status appointmentDate amount notes paymentMode")
          .populate("hospitalId", "name")
          .lean(),
        Transaction.find({ userId })
          .sort({ createdAt: -1 }).limit(25)
          .select("_id referenceId paymentId category type amount status description createdAt")
          .lean(),
      ]) : [[], []];

      const enrichedBookings = (bookings || []).map(b => {
        let notes = {};
        try { notes = b.notes ? JSON.parse(b.notes) : {}; } catch {}
        return { ...b, parsedNotes: notes };
      });

      return NextResponse.json({
        success: true, loggedIn: true, role,
        profile: {
          name:          user?.name || coord?.name,
          mobile:        user?.mobile || coord?.mobile,
          coordinatorId: coord?.coordinatorId,
          district:      coord?.district,
          area:          coord?.area,
        },
        coordinator:  coord,
        bookings:     enrichedBookings,
        transactions: transactions || [],
      });
    }

    // ── hospital / lab ───────────────────────────────────────────────────────
    if (role === "hospital") {
      const [user, hospital] = await Promise.all([
        User.findById(userId).select("name mobile").lean(),
        Hospital.findOne({ userId }).lean(),
      ]);

      const [doctors, labTests, surgeryPackages, recentBookings] = hospital ? await Promise.all([
        Doctor.find({ hospitalId: hospital._id, isActive: true })
          .select("name department speciality").lean(),
        LabTest.find({ hospitalId: hospital._id, isActive: true })
          .select("name category").lean(),
        SurgeryPackage.find({ hospitalId: hospital._id, isActive: true })
          .select("name category").lean(),
        Booking.find({ hospitalId: hospital._id })
          .sort({ createdAt: -1 }).limit(20)
          .select("bookingId type status appointmentDate amount notes paymentMode payoutStatus")
          .lean(),
      ]) : [[], [], [], []];

      const enrichedBookings = (recentBookings || []).map(b => {
        let notes = {};
        try { notes = b.notes ? JSON.parse(b.notes) : {}; } catch {}
        return { ...b, parsedNotes: notes };
      });

      return NextResponse.json({
        success: true, loggedIn: true, role,
        profile: {
          name:       hospital?.name || user?.name,
          mobile:     hospital?.mobile || user?.mobile,
          hospitalId: hospital?.hospitalId,
          type:       hospital?.type,
          district:   hospital?.address?.district,
        },
        hospital,
        services: { doctors, labTests, surgeryPackages },
        bookings: enrichedBookings,
      });
    }

    // ── doctor ───────────────────────────────────────────────────────────────
    if (role === "doctor") {
      const [user, doctor] = await Promise.all([
        User.findById(userId).select("name mobile").lean(),
        Doctor.findOne({ userId }).lean(),
      ]);

      const appointments = doctor ? await Booking.find({ doctorId: doctor._id })
        .sort({ createdAt: -1 }).limit(25)
        .select("bookingId type status appointmentDate amount notes paymentMode paymentStatus")
        .populate("hospitalId", "name")
        .lean() : [];

      const enrichedAppts = (appointments || []).map(b => {
        let notes = {};
        try { notes = b.notes ? JSON.parse(b.notes) : {}; } catch {}
        return { ...b, parsedNotes: notes };
      });

      const transactions = await Transaction.find({ userId })
        .sort({ createdAt: -1 }).limit(20)
        .select("_id referenceId paymentId category type amount status description createdAt")
        .lean();

      return NextResponse.json({
        success: true, loggedIn: true, role,
        profile: {
          name:       doctor?.name || user?.name,
          mobile:     user?.mobile,
          department: doctor?.department,
          speciality: doctor?.speciality,
          hospitalName: doctor?.hospitalName,
        },
        doctor,
        appointments: enrichedAppts,
        transactions: transactions || [],
      });
    }

    // ── staff / admin ────────────────────────────────────────────────────────
    const user = await User.findById(userId).select("name mobile role").lean();
    return NextResponse.json({
      success: true, loggedIn: true, role,
      profile: { name: user?.name, mobile: user?.mobile },
    });

  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
