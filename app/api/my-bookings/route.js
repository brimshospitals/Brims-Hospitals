import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Booking from "../../../models/Booking";
import Doctor from "../../../models/Doctor";
import SurgeryPackage from "../../../models/SurgeryPackage";
import LabTest from "../../../models/LabTest";
import FamilyCard from "../../../models/FamilyCard";
import User from "../../../models/User";
import Review from "../../../models/Review";
import Transaction from "../../../models/Transaction";
import Coordinator from "../../../models/Coordinator";
import { getSession } from "../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type   = searchParams.get("type")   || "";
    const status = searchParams.get("status") || "";
    const page   = parseInt(searchParams.get("page") || "1", 10);
    const limit  = 20;

    // Auth: prefer session (secure), fallback to userId param (backward compat for staff/admin)
    const session = await getSession(request);
    let userId = session?.userId?.toString();
    if (!userId) {
      userId = searchParams.get("userId");
    }

    if (!userId) {
      return NextResponse.json({ success: false, message: "Login zaruri hai" }, { status: 401 });
    }

    await connectDB();

    const query = { userId };
    if (type)   query.type   = type;
    if (status) query.status = status;

    const total    = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // ── Batch-fetch related documents — eliminates N+1 queries ────────────────
    const doctorIds  = [...new Set(bookings.filter(b => b.type === "OPD"     && b.doctorId).map(b => b.doctorId.toString()))];
    const packageIds = [...new Set(bookings.filter(b => b.type === "Surgery" && b.packageId).map(b => b.packageId.toString()))];
    const labIds     = [...new Set(bookings.filter(b => b.type === "Lab"     && b.labTestId).map(b => b.labTestId.toString()))];
    const completedBookingIds = bookings.filter(b => b.status === "completed").map(b => b._id);

    const [doctors, packages, labTests, reviews] = await Promise.all([
      doctorIds.length  ? Doctor.find({ _id: { $in: doctorIds } }).select("name speciality hospitalName photo").lean() : [],
      packageIds.length ? SurgeryPackage.find({ _id: { $in: packageIds } }).select("name category hospitalName").lean() : [],
      labIds.length     ? LabTest.find({ _id: { $in: labIds } }).select("name category hospitalName").lean() : [],
      completedBookingIds.length ? Review.find({ bookingId: { $in: completedBookingIds } }).select("bookingId rating").lean() : [],
    ]);

    const doctorMap  = {}; doctors.forEach(d  => { doctorMap[d._id.toString()]  = d; });
    const packageMap = {}; packages.forEach(p => { packageMap[p._id.toString()] = p; });
    const labMap     = {}; labTests.forEach(t => { labMap[t._id.toString()]     = t; });
    const reviewMap  = {}; reviews.forEach(r  => { reviewMap[r.bookingId?.toString()] = r; });
    // ─────────────────────────────────────────────────────────────────────────

    const enriched = bookings.map(b => {
      let extra = {};
      if (b.type === "OPD" && b.doctorId) {
        const doc = doctorMap[b.doctorId.toString()];
        if (doc) extra = { doctorName: doc.name, speciality: doc.speciality, doctorPhoto: doc.photo, hospitalName: doc.hospitalName };
      }
      if (b.type === "Surgery" && b.packageId) {
        const pkg = packageMap[b.packageId.toString()];
        if (pkg) extra = { packageName: pkg.name, category: pkg.category, hospitalName: pkg.hospitalName };
      }
      if (b.type === "Lab" && b.labTestId) {
        const test = labMap[b.labTestId.toString()];
        if (test) extra = { testName: test.name, category: test.category, hospitalName: test.hospitalName };
      }

      let notesData = {};
      try { notesData = b.notes ? JSON.parse(b.notes) : {}; } catch {}

      const rev = reviewMap[b._id?.toString()];
      return {
        ...b, ...extra, ...notesData,
        reviewed:     !!rev,
        reviewRating: rev?.rating || 0,
      };
    });

    const summary = {
      total:     total,
      pending:   enriched.filter(b => b.status === "pending").length,
      confirmed: enriched.filter(b => b.status === "confirmed").length,
      completed: enriched.filter(b => b.status === "completed").length,
      cancelled: enriched.filter(b => b.status === "cancelled").length,
    };

    return NextResponse.json({
      success: true,
      bookings: enriched,
      summary,
      total,
      pages: Math.ceil(total / limit),
      page,
    });
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
      return NextResponse.json({ success: false, message: `Yeh booking already ${booking.status} hai` }, { status: 400 });
    }

    booking.status = "cancelled";

    // ── Wallet refund if payment was via wallet and was paid ──────────────────
    let refunded = 0;
    if (booking.paymentStatus === "paid" && booking.amount > 0) {
      let notesData = {};
      try { notesData = booking.notes ? JSON.parse(booking.notes) : {}; } catch {}
      if (notesData.paymentMode === "wallet") {
        const refundAmt = booking.amount;

        // Atomic: add back to User.walletBalance
        const refundedUser = await User.findByIdAndUpdate(
          userId,
          { $inc: { walletBalance: refundAmt } },
          { new: true }
        );

        // Sync FamilyCard.walletBalance
        if (refundedUser?.familyCardId) {
          await FamilyCard.findByIdAndUpdate(
            refundedUser.familyCardId,
            { $inc: { walletBalance: refundAmt } }
          );
        }

        booking.paymentStatus = "refunded";
        refunded = refundAmt;

        // Record refund in ledger
        try {
          await Transaction.create({
            userId,
            familyCardId: refundedUser?.familyCardId || null,
            type:         "credit",
            amount:       refundAmt,
            description:  `Booking Cancellation Refund — ${booking.type} (${booking.bookingId})`,
            bookingId:    booking._id,
            referenceId:  booking.bookingId,
            category:     "wallet_refund",
            status:       "success",
          });
        } catch (txnErr) {
          console.error("Refund Transaction error:", txnErr.message);
        }
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    await booking.save();

    // ── Reverse coordinator commission on cancellation ────────────────────────
    if (booking.coordinatorId && (booking.coordinatorCommission || 0) > 0) {
      try {
        // Cancel the pending commission Transaction
        await Transaction.updateOne(
          { bookingId: booking._id, category: "coordinator_commission", status: "pending" },
          { $set: { status: "failed", description: `[CANCELLED] Booking ${booking.bookingId} cancelled` } }
        );
        // Decrement coordinator pendingEarned — but only the booking-time inflation
        // (completed booking commissions are handled by the completion flow)
        await Coordinator.findByIdAndUpdate(booking.coordinatorId, {
          $inc: { pendingEarned: -(booking.coordinatorCommission) },
        });
      } catch (coordErr) {
        console.error("Coordinator commission reversal error:", coordErr.message);
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    return NextResponse.json({
      success: true,
      message: refunded > 0
        ? `Booking cancel ho gayi. ₹${refunded} wallet mein wapas aa gaye.`
        : "Booking cancel ho gayi.",
      refunded,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}
