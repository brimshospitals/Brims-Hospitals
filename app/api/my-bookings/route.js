import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Booking from "../../../models/Booking";
import Doctor from "../../../models/Doctor";
import SurgeryPackage from "../../../models/SurgeryPackage";
import LabTest from "../../../models/LabTest";
import FamilyCard from "../../../models/FamilyCard";
import User from "../../../models/User";
import Review from "../../../models/Review";
import { getSession } from "../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type   = searchParams.get("type")   || "";
    const status = searchParams.get("status") || "";

    // Auth: prefer session (secure), fallback to userId param (backward compat for staff/admin)
    const session = await getSession(request);
    let userId = session?.userId?.toString();
    if (!userId) {
      // Allow param fallback for staff/admin dashboard queries
      userId = searchParams.get("userId");
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Login zaruri hai" },
        { status: 401 }
      );
    }

    await connectDB();

    // Family card mein sare members ke bookings bhi laao
    const user = await User.findById(userId);
    const memberIds = [userId];

    if (user?.familyCardId) {
      const familyCard = await FamilyCard.findById(user.familyCardId);
      if (familyCard?.members?.length) {
        familyCard.members.forEach((id) => memberIds.push(id.toString()));
      }
    }

    const query = { userId: { $in: memberIds } };
    if (type) query.type = type;
    if (status) query.status = status;

    const bookings = await Booking.find(query).sort({ createdAt: -1 }).lean();

    // Populate related data for each booking
    const enriched = await Promise.all(
      bookings.map(async (b) => {
        let extra = {};

        if (b.type === "OPD" && b.doctorId) {
          const doc = await Doctor.findById(b.doctorId)
            .select("name speciality hospitalName photo")
            .lean();
          if (doc) extra = { doctorName: doc.name, speciality: doc.speciality, doctorPhoto: doc.photo, hospitalName: doc.hospitalName };
        }

        if (b.type === "Surgery" && b.packageId) {
          const pkg = await SurgeryPackage.findById(b.packageId)
            .select("name category hospitalName")
            .lean();
          if (pkg) extra = { packageName: pkg.name, category: pkg.category, hospitalName: pkg.hospitalName };
        }

        if (b.type === "Lab" && b.labTestId) {
          const test = await LabTest.findById(b.labTestId)
            .select("name category hospitalName")
            .lean();
          if (test) extra = { testName: test.name, category: test.category, hospitalName: test.hospitalName };
        }

        // Parse patient info from notes
        let notesData = {};
        try { notesData = b.notes ? JSON.parse(b.notes) : {}; } catch {}

        // Check if already reviewed (only for completed bookings)
        let reviewed = false, reviewRating = 0;
        if (b.status === "completed") {
          const rev = await Review.findOne({ bookingId: b._id }).select("rating").lean();
          if (rev) { reviewed = true; reviewRating = rev.rating; }
        }

        return { ...b, ...extra, ...notesData, reviewed, reviewRating };
      })
    );

    // Summary counts
    const summary = {
      total: enriched.length,
      pending: enriched.filter((b) => b.status === "pending").length,
      confirmed: enriched.filter((b) => b.status === "confirmed").length,
      completed: enriched.filter((b) => b.status === "completed").length,
      cancelled: enriched.filter((b) => b.status === "cancelled").length,
    };

    return NextResponse.json({ success: true, bookings: enriched, summary });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}

// PATCH — Cancel a booking (patient side)
export async function PATCH(request) {
  try {
    const session = await getSession(request);
    const { bookingId, userId: bodyUserId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ success: false, message: "bookingId zaruri hai" }, { status: 400 });
    }

    // Use session userId if present; fallback to body param for backward compat
    const userId = session?.userId?.toString() || bodyUserId;
    if (!userId) {
      return NextResponse.json({ success: false, message: "Login zaruri hai" }, { status: 401 });
    }

    await connectDB();

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking nahi mili" }, { status: 404 });
    }

    // Security: ensure the booking belongs to the requesting user
    if (booking.userId.toString() !== userId) {
      return NextResponse.json({ success: false, message: "Aap is booking ko cancel nahi kar sakte" }, { status: 403 });
    }
    if (["completed", "cancelled"].includes(booking.status)) {
      return NextResponse.json({ success: false, message: "Yeh booking already " + booking.status + " hai" }, { status: 400 });
    }

    booking.status = "cancelled";

    // Wallet refund if payment was via wallet and was paid
    let refunded = 0;
    if (booking.paymentStatus === "paid" && booking.amount > 0) {
      let notesData = {};
      try { notesData = booking.notes ? JSON.parse(booking.notes) : {}; } catch {}
      if (notesData.paymentMode === "wallet") {
        await User.findByIdAndUpdate(userId, { $inc: { walletBalance: booking.amount } });
        booking.paymentStatus = "refunded";
        refunded = booking.amount;
      }
    }

    await booking.save();

    return NextResponse.json({
      success: true,
      message: refunded > 0
        ? `Booking cancel ho gayi. ₹${refunded} wallet mein wapas aa jayenge.`
        : "Booking cancel ho gayi.",
      refunded,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}
