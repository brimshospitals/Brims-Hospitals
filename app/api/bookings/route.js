import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Booking from "../../../models/Booking";
import User from "../../../models/User";
import Doctor from "../../../models/Doctor";
import Hospital from "../../../models/Hospital";
import Notification from "../../../models/Notification";
import PromoCode from "../../../models/PromoCode";
import CommissionSlab from "../../../models/CommissionSlab";
import Coordinator from "../../../models/Coordinator";
import { requireAuth } from "../../../lib/auth";
import { sendPushMulticast } from "../../../lib/fcm-admin";

const DEFAULT_COMMISSION = { OPD: 10, Lab: 12, Surgery: 8, Consultation: 15, IPD: 8 };

export const dynamic = "force-dynamic";

// Counter for sequential booking IDs
async function generateBookingId(type) {
  const prefix = { OPD: "OPD", Lab: "LAB", Surgery: "SRG", Consultation: "TEL" }[type] || "BKG";
  const count = await Booking.countDocuments();
  return `BH-${prefix}-${String(count + 1).padStart(5, "0")}`;
}

// POST — create a new booking
export async function POST(request) {
  const { error, session } = await requireAuth(request, ["user", "member", "admin", "coordinator"]);
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
      // Promo
      promoCode,
      promoDiscount,
      // Home collection
      homeAddress,
      // Coordinator referral
      coordinatorUserId,
      // Partial booking (Surgery)
      isPartialBooking,
      depositAmount,
    } = body;

    if (!type || !appointmentDate || !patientName || !patientMobile) {
      return NextResponse.json(
        { success: false, message: "type, appointmentDate, patientName aur mobile zaruri hai" },
        { status: 400 }
      );
    }

    await connectDB();

    const bookingId = await generateBookingId(type);

    // Encode patient info + symptoms + insurance fields in notes
    const {
      insurancePolicyNo,
      insurerName,
      tpaName,
    } = body;

    const notes = JSON.stringify({
      patientName,
      patientMobile,
      patientAge,
      patientGender,
      symptoms: symptoms || "",
      paymentMode: paymentMode || "counter",
      isNewPatient: !!isNewPatient,
      ...(promoCode          && { promoCode }),
      ...(promoDiscount      && { promoDiscount }),
      ...(homeAddress        && { homeAddress }),
      ...(insurancePolicyNo  && { insurancePolicyNo }),
      ...(insurerName        && { insurerName }),
      ...(tpaName            && { tpaName }),
    });

    // Increment promo usage count
    if (promoCode) {
      await PromoCode.findOneAndUpdate(
        { code: promoCode.toUpperCase(), isActive: true },
        { $inc: { usedCount: 1 } }
      );
    }

    // ── Commission calculation ──────────────────────────────────
    let commissionPct = DEFAULT_COMMISSION[type] ?? 10;
    if (hospitalId) {
      const slab = await CommissionSlab.findOne({ hospitalId, isActive: true }).lean();
      if (slab?.rates?.[type] != null) commissionPct = slab.rates[type];
    }
    const bookingAmount      = amount || 0;
    const platformCommission = Math.round(bookingAmount * commissionPct / 100);
    const hospitalPayable    = bookingAmount - platformCommission;

    // ── Coordinator lookup ──────────────────────────────────────
    let coordId = undefined, coordName = "", coordCommissionAmt = 0, coordCommissionPct = 0;
    const resolvedCoordUserId = coordinatorUserId || (session.role === "coordinator" ? session.userId : null);
    if (resolvedCoordUserId) {
      const coord = await Coordinator.findOne({ userId: resolvedCoordUserId, isActive: true }).lean();
      if (coord) {
        coordId = coord._id;
        coordName = coord.name;
        coordCommissionPct = coord.commissionRates?.[type] ?? 0;
        coordCommissionAmt = Math.round(bookingAmount * coordCommissionPct / 100);
        // Update coordinator stats
        await Coordinator.findByIdAndUpdate(coord._id, {
          $inc: { totalBookings: 1, totalEarned: coordCommissionAmt, pendingEarned: coordCommissionAmt },
        });
      }
    }

    // ── Partial booking for Surgery ─────────────────────────────
    const actualDepositAmount = isPartialBooking && type === "Surgery" ? (depositAmount || 1000) : 0;
    const balanceAmt = isPartialBooking ? bookingAmount - actualDepositAmount : 0;

    const booking = await Booking.create({
      bookingId,
      type,
      userId: session.userId,
      memberId:  patientUserId  || undefined,
      doctorId:  doctorId       || undefined,
      hospitalId: hospitalId    || undefined,
      packageId:  packageId     || undefined,
      labTestId:  labTestId     || undefined,
      appointmentDate: new Date(appointmentDate),
      slot: slot || "",
      status: "pending",
      paymentStatus: paymentMode === "online" ? "pending" : "pending",
      amount: isPartialBooking ? actualDepositAmount : bookingAmount,
      familyCardId: familyCardId || undefined,
      notes,
      // Commission
      platformCommission,
      commissionPct,
      hospitalPayable,
      // Coordinator
      ...(coordId && { coordinatorId: coordId, coordinatorName: coordName }),
      coordinatorCommission:    coordCommissionAmt,
      coordinatorCommissionPct: coordCommissionPct,
      // Partial booking
      isPartialBooking: !!isPartialBooking,
      depositAmount:    actualDepositAmount,
      balanceAmount:    balanceAmt,
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
      console.error("Notification error:", notifErr.message);
    }

    // ── FCM Push Notifications ─────────────────────────────────
    try {
      const pushTitle = `Naya ${typeLabel} Booking 🔔`;
      const pushBody  = `${patientName} · ${dateLabel}${slot ? " " + slot : ""} · ₹${amount || 0}`;

      // Collect FCM tokens: doctor + hospital users + all admins
      const fcmTargets = [];

      if (doctorId) {
        const doc = await Doctor.findById(doctorId).select("userId").lean();
        if (doc?.userId) {
          const docUser = await User.findById(doc.userId).select("fcmToken").lean();
          if (docUser?.fcmToken) fcmTargets.push(docUser.fcmToken);
        }
      }

      if (hospitalId) {
        const hosp = await Hospital.findById(hospitalId).select("userId").lean();
        if (hosp?.userId) {
          const hospUser = await User.findById(hosp.userId).select("fcmToken").lean();
          if (hospUser?.fcmToken) fcmTargets.push(hospUser.fcmToken);
        }
      }

      const adminTokens = await User.find({ role: "admin", fcmToken: { $ne: null } })
        .select("fcmToken").lean();
      adminTokens.forEach((u) => u.fcmToken && fcmTargets.push(u.fcmToken));

      if (fcmTargets.length) {
        await sendPushMulticast(fcmTargets, pushTitle, pushBody, { bookingId }, "/staff-dashboard");
      }

      // Also push to the patient (booking confirmation)
      const patientUser = await User.findById(session.userId).select("fcmToken").lean();
      if (patientUser?.fcmToken) {
        await sendPushMulticast(
          [patientUser.fcmToken],
          `✅ Booking Confirmed — ${typeLabel}`,
          `ID: ${bookingId} · ${dateLabel}${slot ? " " + slot : ""}`,
          { bookingId },
          "/my-bookings"
        );
      }
    } catch (fcmErr) {
      console.error("FCM push error:", fcmErr.message);
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
