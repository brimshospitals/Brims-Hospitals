import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Booking from "../../../models/Booking";
import User from "../../../models/User";
import Doctor from "../../../models/Doctor";
import Hospital from "../../../models/Hospital";
import SurgeryPackage from "../../../models/SurgeryPackage";
import LabTest from "../../../models/LabTest";
import SupportTicket from "../../../models/SupportTicket";
import Notification from "../../../models/Notification";
import Transaction from "../../../models/Transaction";
import Coordinator from "../../../models/Coordinator";
import { requireAuth } from "../../../lib/auth";
import { autoProvisionLabBooking } from "../../../lib/labWorkflow";

export const dynamic = "force-dynamic";

// GET: Admin dashboard stats + bookings list
export async function GET(request) {
  const { error, session } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const adminId = session.userId; // Use session, not URL param
    const type    = searchParams.get("type")   || "";
    const status  = searchParams.get("status") || "";
    const page    = parseInt(searchParams.get("page") || "1");
    const limit   = 20;

    await connectDB();
    // Session already verified by requireAuth above — no DB role check needed

    // Stats
    const [
      totalUsers,
      totalHospitals,
      pendingHospitals,
      totalDoctors,
      pendingDoctors,
      totalPackages,
      totalLabTests,
      openSupportTickets,
      bookingStats,
    ] = await Promise.all([
      User.countDocuments({ role: { $in: ["user", "member"] }, isActive: true }),
      Hospital.countDocuments({ isVerified: true, isActive: true }),
      Hospital.countDocuments({ isVerified: false }),
      Doctor.countDocuments({ isActive: true }),
      Doctor.countDocuments({ isActive: false, userId: null }), // B5: pending approval only (no linked user)
      SurgeryPackage.countDocuments({ isActive: true }),
      LabTest.countDocuments({ isActive: true }),
      SupportTicket.countDocuments({ status: { $in: ["open", "in_progress"] } }),
      Booking.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: "$amount" } } },
      ]),
    ]);

    const stats = {
      totalUsers,
      totalHospitals,
      pendingHospitals,
      totalDoctors,
      pendingDoctors,
      totalPackages,
      totalLabTests,
      openSupportTickets,
      bookings: { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 },
      revenue: { total: 0, paid: 0 },
    };

    bookingStats.forEach(({ _id, count, revenue }) => {
      stats.bookings.total  += count;
      stats.bookings[_id]    = count;
      stats.revenue.total   += revenue || 0;
    });

    // Paid revenue separately
    const paidRev = await Booking.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    stats.revenue.paid = paidRev[0]?.total || 0;

    // Bookings list with pagination
    const query = {};
    if (type)   query.type   = type;
    if (status) query.status = status;

    const total    = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId",   "name mobile memberId")
      .populate("doctorId", "name speciality")
      .lean();

    // B5: Batch-fetch package/lab test names — eliminates N+1 queries
    const bkPkgIds  = [...new Set(bookings.filter(b => b.type === "Surgery" && b.packageId).map(b => b.packageId.toString()))];
    const bkLabIds  = [...new Set(bookings.filter(b => b.type === "Lab"     && b.labTestId).map(b => b.labTestId.toString()))];
    const [bkPkgs, bkTests] = await Promise.all([
      bkPkgIds.length ? SurgeryPackage.find({ _id: { $in: bkPkgIds } }).select("name hospitalName").lean() : [],
      bkLabIds.length ? LabTest.find({ _id: { $in: bkLabIds } }).select("name hospitalName").lean()        : [],
    ]);
    const bkPkgMap  = {}; bkPkgs.forEach(p  => { bkPkgMap[p._id.toString()]  = p; });
    const bkTestMap = {}; bkTests.forEach(t => { bkTestMap[t._id.toString()] = t; });

    const enriched = bookings.map(b => {
      let extra = {};
      if (b.type === "Surgery" && b.packageId) { const p = bkPkgMap[b.packageId.toString()];  if (p) extra = { packageName: p.name, hospitalName: p.hospitalName }; }
      if (b.type === "Lab"     && b.labTestId) { const t = bkTestMap[b.labTestId.toString()]; if (t) extra = { testName: t.name, hospitalName: t.hospitalName }; }
      return { ...b, ...extra };
    });

    return NextResponse.json({
      success: true,
      stats,
      bookings: enriched,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}

// PATCH: Update booking status
export async function PATCH(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const { bookingId, status, paymentStatus, statusStage, stageLabel, stageNotes, updatedByName,
            reschedule, newDate, newSlot } = body;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "bookingId zaruri hai" },
        { status: 400 }
      );
    }

    await connectDB();

    const update = {};
    if (status)        update.status        = status;
    if (paymentStatus) update.paymentStatus = paymentStatus;
    if (statusStage)   update.statusStage   = statusStage;

    // Reschedule: update date + slot + log history
    if (reschedule) {
      if (newDate) update.appointmentDate = new Date(newDate);
      if (newSlot) update.slot = newSlot;
    }

    // Auto-sync broad status from stage
    if (statusStage === "confirmed")  update.status = "confirmed";
    if (statusStage === "completed")  update.status = "completed";
    if (statusStage === "cancelled")  update.status = "cancelled";

    const historyEntry = reschedule
      ? { stage: "rescheduled", label: "Rescheduled", timestamp: new Date(),
          updatedBy: updatedByName || "Admin", updatedByRole: "admin",
          notes: `New Date: ${newDate}${newSlot ? " | Slot: " + newSlot : ""} | ${stageNotes || ""}` }
      : statusStage
      ? { stage: statusStage, label: stageLabel || statusStage, timestamp: new Date(),
          updatedBy: updatedByName || "Admin", updatedByRole: "admin", notes: stageNotes || "" }
      : null;

    const historyPush = historyEntry ? { $push: { statusHistory: historyEntry } } : {};

    const booking = await Booking.findOneAndUpdate(
      { bookingId },
      { $set: update, ...historyPush },
      { new: true }
    );

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking nahi mili" },
        { status: 404 }
      );
    }

    // Auto-provision LabReport + Invoice when a Lab booking is confirmed
    if (booking.type === "Lab" && (update.status === "confirmed" || statusStage === "confirmed")) {
      try { await autoProvisionLabBooking(booking); } catch {}
    }

    // B10: Notify patient when booking status changes
    const notifStatus = update.status || null;
    if (notifStatus && booking.userId) {
      const labelMap = { confirmed: "Confirm", completed: "Complete", cancelled: "Cancel" };
      if (labelMap[notifStatus]) {
        try {
          await Notification.create({
            userId:  booking.userId,
            type:    "booking",
            title:   `Booking ${labelMap[notifStatus]} Ho Gayi`,
            message: `Aapki booking #${booking.bookingId} ${notifStatus} ho gayi hai.`,
          });
        } catch {}
      }
    }

    // SB4: When booking completed — mark coordinator commission Transaction as success
    if (update.status === "completed" && booking.coordinatorId && (booking.coordinatorCommission || 0) > 0) {
      try {
        await Transaction.updateOne(
          { referenceId: booking.bookingId, category: "coordinator_commission", status: "pending" },
          { $set: { status: "success" } }
        );
        // Increment coordinator lifetime totals so pendingEarned reflects available earnings
        await Coordinator.findByIdAndUpdate(booking.coordinatorId, {
          $inc: { totalEarned: booking.coordinatorCommission, pendingEarned: booking.coordinatorCommission },
        });
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: "Booking update ho gayi",
      booking,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}
