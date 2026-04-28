import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Booking from "../../../../models/Booking";
import User    from "../../../../models/User";
import Notification from "../../../../models/Notification";
import { requireAuth, getSession } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { error } = await requireAuth(request, ["staff", "admin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const type   = searchParams.get("type")   || "all";
    const search = searchParams.get("search") || "";
    const page   = parseInt(searchParams.get("page") || "1", 10);
    const limit  = 30;

    await connectDB();

    const query = {};
    if (status !== "all") query.status = status;
    if (type   !== "all") query.type   = type;

    const dateFilter = searchParams.get("date") || "";
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (dateFilter === "today") {
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      query.appointmentDate = { $gte: today, $lt: tomorrow };
    } else if (dateFilter === "week") {
      const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);
      query.appointmentDate = { $gte: today, $lt: nextWeek };
    }

    if (search.trim()) {
      const users = await User.find({
        $or: [
          { name:   { $regex: search.trim(), $options: "i" } },
          { mobile: { $regex: search.trim(), $options: "i" } },
        ],
      }).select("_id").lean();
      const userIds = users.map((u) => u._id);
      query.$or = [
        { userId:    { $in: userIds } },
        { bookingId: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const total    = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const allUserIds = [...new Set(bookings.map((b) => b.userId?.toString()).filter(Boolean))];
    const users      = await User.find({ _id: { $in: allUserIds } }).select("name mobile photo").lean();
    const userMap    = {};
    users.forEach((u) => { userMap[u._id.toString()] = u; });

    const enriched = bookings.map((b) => {
      const patient = userMap[b.userId?.toString()] || {};
      let extra = {};
      try { extra = b.notes ? JSON.parse(b.notes) : {}; } catch {}
      return {
        ...b,
        patientName:   extra.patientName   || patient.name   || "Unknown",
        patientMobile: extra.patientMobile || patient.mobile || "",
        patientAge:    extra.patientAge    || "",
        patientGender: extra.patientGender || "",
        symptoms:      extra.symptoms      || "",
        paymentMode:   extra.paymentMode   || b.paymentMode  || "",
        consultType:   extra.consultType   || "",
      };
    });

    // Stats
    const [todayPending, totalPending, totalConfirmed, todayCollected] = await Promise.all([
      Booking.countDocuments({ status: "pending", appointmentDate: { $gte: today } }),
      Booking.countDocuments({ status: "pending" }),
      Booking.countDocuments({ status: "confirmed" }),
      Booking.aggregate([
        { $match: { paymentStatus: "paid", collectedAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
    ]);

    return NextResponse.json({
      success: true,
      bookings: enriched,
      total,
      pages: Math.ceil(total / limit),
      page,
      stats: {
        todayPending,
        totalPending,
        totalConfirmed,
        todayCollectedAmt:   todayCollected[0]?.total || 0,
        todayCollectedCount: todayCollected[0]?.count || 0,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}

// PATCH — update booking status + payment collection
export async function PATCH(request) {
  const { error, session } = await requireAuth(request, ["staff", "admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const { bookingId, status, paymentStatus, paymentMode, amount, statusStage, stageLabel, stageNotes,
            reschedule, newDate, newSlot } = body;

    if (!bookingId) {
      return NextResponse.json({ success: false, message: "bookingId zaruri hai" }, { status: 400 });
    }

    await connectDB();

    // B7: Permission check — only staff with cancelBookings can cancel
    if (session.role === "staff" && (status === "cancelled" || statusStage === "cancelled")) {
      const staffUser = await User.findById(session.userId).select("staffPermissions").lean();
      if (!staffUser?.staffPermissions?.cancelBookings) {
        return NextResponse.json({ success: false, message: "Aapko booking cancel karne ki permission nahi hai" }, { status: 403 });
      }
    }

    const update = {};
    if (status)        update.status        = status;
    if (paymentStatus) update.paymentStatus = paymentStatus;
    if (paymentMode)   update.paymentMode   = paymentMode;
    if (amount != null) update.amount       = amount;
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

    // Record who collected payment
    if (paymentStatus === "paid") {
      update.collectedBy     = session.userId;
      update.collectedByName = session.name || "Staff";
      update.collectedAt     = new Date();
      if (!status && !statusStage) update.status = "completed";
    }

    const historyEntry = reschedule
      ? { stage: "rescheduled", label: "Rescheduled", timestamp: new Date(),
          updatedBy: session.name || "Staff", updatedByRole: session.role || "staff",
          notes: `New Date: ${newDate}${newSlot ? " | Slot: " + newSlot : ""} | ${stageNotes || ""}` }
      : statusStage
      ? { stage: statusStage, label: stageLabel || statusStage, timestamp: new Date(),
          updatedBy: session.name || "Staff", updatedByRole: session.role || "staff", notes: stageNotes || "" }
      : null;

    const historyPush = historyEntry ? { $push: { statusHistory: historyEntry } } : {};

    const booking = await Booking.findOneAndUpdate({ bookingId }, { $set: update, ...historyPush }, { new: true });
    if (!booking) {
      // Try by _id
      const b2 = await Booking.findByIdAndUpdate(bookingId, update, { new: true });
      if (!b2) return NextResponse.json({ success: false, message: "Booking nahi mili" }, { status: 404 });
      return NextResponse.json({ success: true, booking: b2 });
    }

    // B10: Notify patient on status change
    const notifStatus = update.status || (statusStage === "confirmed" ? "confirmed" : statusStage === "completed" ? "completed" : statusStage === "cancelled" ? "cancelled" : null);
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

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}

// POST — create walk-in booking (staff counter booking)
export async function POST(request) {
  const { error, session } = await requireAuth(request, ["staff", "admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const {
      patientName, patientMobile, patientAge, patientGender,
      type, amount, paymentMode, paymentStatus,
      appointmentDate, slot, symptoms, doctorName, hospitalName,
    } = body;

    if (!patientName || !patientMobile || !type) {
      return NextResponse.json({ success: false, message: "patientName, mobile aur type zaruri hai" }, { status: 400 });
    }

    await connectDB();

    // Find or create guest user
    let user = await User.findOne({ mobile: patientMobile });
    if (!user) {
      const now  = new Date();
      const YY   = String(now.getFullYear()).slice(-2);
      const MM   = String(now.getMonth() + 1).padStart(2, "0");
      const rand = String(Math.floor(10000 + Math.random() * 90000));
      user = await User.create({
        mobile:   patientMobile,
        name:     patientName,
        age:      Number(patientAge) || 30,
        gender:   patientGender    || "male",
        role:     "user",
        memberId: `BRIMS${YY}${MM}${rand}0`,
      });
    }

    // Generate bookingId
    const prefix = { OPD:"BH-OPD", Lab:"BH-LAB", Surgery:"BH-SUR", Consultation:"BH-CON", IPD:"BH-IPD" };
    const count  = await Booking.countDocuments();
    const bId    = `${prefix[type] || "BH-OPD"}-${String(count + 1).padStart(5, "0")}`;

    const notes = JSON.stringify({
      patientName, patientMobile, patientAge, patientGender,
      symptoms: symptoms || "",
      paymentMode: paymentMode || "counter",
      isNewPatient: true,
      walkinBy: session.name || "Staff",
      doctorName:   doctorName  || "",
      hospitalName: hospitalName || "Brims Hospitals",
    });

    const booking = await Booking.create({
      bookingId:       bId,
      userId:          user._id,
      type:            type || "OPD",
      status:          "confirmed",
      paymentStatus:   paymentStatus || "pending",
      paymentMode:     paymentMode   || "counter",
      amount:          amount        || 0,
      appointmentDate: appointmentDate ? new Date(appointmentDate) : new Date(),
      slot:            slot || "",
      notes,
      // If paid at counter, record collector
      ...(paymentStatus === "paid" ? {
        collectedBy:     session.userId,
        collectedByName: session.name || "Staff",
        collectedAt:     new Date(),
      } : {}),
    });

    return NextResponse.json({ success: true, booking, bookingId: bId, message: "Walk-in booking create ho gayi" });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
