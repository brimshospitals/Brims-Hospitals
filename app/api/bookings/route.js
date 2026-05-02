import { NextResponse } from "next/server";
import crypto from "crypto";
import axios from "axios";
import connectDB from "../../../lib/mongodb";
import Booking from "../../../models/Booking";
import User from "../../../models/User";
import Doctor from "../../../models/Doctor";
import Hospital from "../../../models/Hospital";
import Notification from "../../../models/Notification";
import PromoCode from "../../../models/PromoCode";
import CommissionSlab from "../../../models/CommissionSlab";
import Coordinator from "../../../models/Coordinator";
import Transaction from "../../../models/Transaction";
import { requireAuth } from "../../../lib/auth";
import { sendPushMulticast } from "../../../lib/fcm-admin";
import BookingDraft from "../../../models/BookingDraft";
import LabTest from "../../../models/LabTest";
import SurgeryPackage from "../../../models/SurgeryPackage";

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
      // Draft tracking
      draftId,
    } = body;

    if (!type || !appointmentDate || !patientName || !patientMobile) {
      return NextResponse.json(
        { success: false, message: "type, appointmentDate, patientName aur mobile zaruri hai" },
        { status: 400 }
      );
    }

    // appointmentDate past mein nahi hona chahiye
    const apptDate = new Date(appointmentDate);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (apptDate < today) {
      return NextResponse.json(
        { success: false, message: "Appointment date aaj ya future mein honi chahiye" },
        { status: 400 }
      );
    }

    await connectDB();

    const bookingId = await generateBookingId(type);

    // ── Auto-resolve hospitalId from labTestId / packageId if not sent ──────
    let resolvedHospitalId = hospitalId;
    if (!resolvedHospitalId) {
      if (type === "Lab" && labTestId) {
        const lt = await LabTest.findById(labTestId).select("hospitalId").lean();
        if (lt?.hospitalId) resolvedHospitalId = lt.hospitalId.toString();
      } else if (type === "Surgery" && packageId) {
        const sp = await SurgeryPackage.findById(packageId).select("hospitalId").lean();
        if (sp?.hospitalId) resolvedHospitalId = sp.hospitalId.toString();
      }
    }

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

    // ── Commission calculation ──────────────────────────────────
    let commissionPct = DEFAULT_COMMISSION[type] ?? 10;
    if (resolvedHospitalId) {
      const slab = await CommissionSlab.findOne({ hospitalId: resolvedHospitalId, isActive: true }).lean();
      if (slab?.rates?.[type] != null) commissionPct = slab.rates[type];
    }
    const bookingAmount      = amount || 0;
    const platformCommission = Math.round(bookingAmount * commissionPct / 100);
    const hospitalPayable    = bookingAmount - platformCommission;

    // ── Coordinator lookup (only lookup, DO NOT update yet) ──────
    let coordId = undefined, coordName = "", coordCommissionAmt = 0, coordCommissionPct = 0;
    const resolvedCoordUserId = coordinatorUserId || (session.role === "coordinator" ? session.userId : null);
    let coord = null;
    if (resolvedCoordUserId) {
      coord = await Coordinator.findOne({ userId: resolvedCoordUserId, isActive: true }).lean();
    } else {
      const bookingUser = await User.findById(session.userId, "registeredByCoordinator").lean();
      if (bookingUser?.registeredByCoordinator) {
        coord = await Coordinator.findById(bookingUser.registeredByCoordinator).lean();
      }
    }
    if (coord) {
      coordId = coord._id;
      coordName = coord.name;
      coordCommissionPct = coord.commissionRates?.[type] ?? 0;
      coordCommissionAmt = Math.round(bookingAmount * coordCommissionPct / 100);
    }

    // ── Partial booking for Surgery ─────────────────────────────
    const actualDepositAmount = isPartialBooking && type === "Surgery" ? (depositAmount || 1000) : 0;
    const balanceAmt = isPartialBooking ? bookingAmount - actualDepositAmount : 0;

    // ── Wallet balance check BEFORE booking creation ────────────
    if (paymentMode === "wallet" && bookingAmount > 0) {
      const deductAmt = isPartialBooking ? actualDepositAmount : bookingAmount;
      const walletUser = await User.findById(session.userId, "walletBalance").lean();
      if (!walletUser || (walletUser.walletBalance || 0) < deductAmt) {
        return NextResponse.json(
          { success: false, message: `Wallet mein balance nahi hai. Available: ₹${walletUser?.walletBalance || 0}` },
          { status: 400 }
        );
      }
    }

    const booking = await Booking.create({
      bookingId,
      type,
      userId: session.userId,
      memberId:  patientUserId  || undefined,
      doctorId:  doctorId       || undefined,
      hospitalId: resolvedHospitalId || undefined,
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

    // ── Transaction records ────────────────────────────────────
    try {
      const txnsToCreate = [];

      // Wallet payment deduction — atomic to prevent overdraft
      if (paymentMode === "wallet" && bookingAmount > 0) {
        const deductAmt = isPartialBooking ? actualDepositAmount : bookingAmount;
        const updatedWalletUser = await User.findOneAndUpdate(
          { _id: session.userId, walletBalance: { $gte: deductAmt } },
          { $inc: { walletBalance: -deductAmt } }
        );
        if (!updatedWalletUser) {
          // Race condition caught — another request spent the balance
          await Booking.findByIdAndUpdate(booking._id, { status: "cancelled" });
          return NextResponse.json({ success: false, message: "Wallet mein sufficient balance nahi hai" }, { status: 400 });
        }
        txnsToCreate.push({
          userId:      session.userId,
          type:        "debit",
          amount:      deductAmt,
          description: `Wallet Payment — ${type} Booking (${bookingId})`,
          bookingId:   booking._id,
          referenceId: bookingId,
          category:    "booking_payment",
          status:      "success",
        });
        await Booking.findByIdAndUpdate(booking._id, { paymentStatus: "paid" });
      }

      // Platform income record for online payment (created optimistically — confirmed in callback)
      if (paymentMode === "online" && bookingAmount > 0) {
        txnsToCreate.push({
          userId:      session.userId,
          type:        "credit",
          amount:      isPartialBooking ? actualDepositAmount : bookingAmount,
          description: `Online Payment — ${type} Booking (${bookingId})`,
          bookingId:   booking._id,
          referenceId: bookingId,
          category:    "booking_payment",
          status:      "pending",   // confirmed when PhonePe callback fires
        });
      }

      // Coordinator booking commission
      if (coordId && coordCommissionAmt > 0) {
        txnsToCreate.push({
          userId:      coord.userId,
          type:        "credit",
          amount:      coordCommissionAmt,
          description: `Booking Commission (${coordCommissionPct}%) — ${type} Booking (${bookingId})`,
          bookingId:   booking._id,
          referenceId: bookingId,
          category:    "coordinator_commission",
          status:      "pending",   // becomes available when booking completed
        });
      }

      // Promo discount — record as platform expense for ledger accuracy
      if (promoCode && promoDiscount > 0) {
        txnsToCreate.push({
          userId:      session.userId,
          type:        "debit",
          amount:      promoDiscount,
          description: `Promo Discount — Code: ${promoCode.toUpperCase()} | ${type} Booking (${bookingId})`,
          bookingId:   booking._id,
          referenceId: bookingId,
          category:    "expense",
          status:      "success",
        });
      }

      if (txnsToCreate.length > 0) {
        await Transaction.insertMany(txnsToCreate);
      }
    } catch (txnErr) {
      console.error("Transaction record error:", txnErr.message);
    }

    // ── Post-booking side effects (run AFTER booking confirmed created) ────
    // Promo code usage increment — only after booking is successfully created
    if (promoCode) {
      try {
        await PromoCode.findOneAndUpdate(
          { code: promoCode.toUpperCase(), isActive: true },
          {
            $inc:    { usedCount: 1 },
            $addToSet: { usedBy: session.userId },
          }
        );
      } catch {}
    }

    // Coordinator booking count — increment at booking creation
    // NOTE: totalEarned and pendingEarned are incremented only when booking is COMPLETED
    // (in staff/bookings PATCH and admin/route.js PATCH) to prevent double-counting
    if (coord) {
      try {
        await Coordinator.findByIdAndUpdate(coord._id, {
          $inc: { totalBookings: 1 },
        });
      } catch {}
    }

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

      if (resolvedHospitalId) {
        const hosp = await Hospital.findById(resolvedHospitalId).select("userId").lean();
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
    // ── Mark BookingDraft as converted ────────────────────────────────────────
    if (draftId) {
      try {
        await BookingDraft.findOneAndUpdate(
          { _id: draftId, userId: session.userId },
          { $set: { status: "converted", convertedBookingId: bookingId } }
        );
      } catch {}
    } else {
      // Auto-match: convert any active draft for this type+item by this user
      const itemRef = doctorId || labTestId || packageId;
      if (itemRef) {
        try {
          await BookingDraft.findOneAndUpdate(
            { userId: session.userId, type, itemId: itemRef, status: "active" },
            { $set: { status: "converted", convertedBookingId: bookingId } }
          );
        } catch {}
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    // ── PhonePe redirect for online payment ───────────────────────────────────
    if (paymentMode === "online" && bookingAmount > 0) {
      try {
        const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
        const SALT_KEY    = process.env.PHONEPE_SALT_KEY;
        const SALT_INDEX  = process.env.PHONEPE_SALT_INDEX || "1";
        const transactionId = "BRIMSBKG" + Date.now();
        const amountInPaise = Math.round(bookingAmount * 100);

        const payload = {
          merchantId:            MERCHANT_ID,
          merchantTransactionId: transactionId,
          merchantUserId:        session.userId,
          amount:                amountInPaise,
          redirectUrl: `${process.env.NEXTAUTH_URL}/api/booking-payment-callback?bookingId=${booking._id}&txnId=${transactionId}`,
          redirectMode: "POST",
          callbackUrl:  `${process.env.NEXTAUTH_URL}/api/booking-payment-callback?bookingId=${booking._id}&txnId=${transactionId}`,
          paymentInstrument: { type: "PAY_PAGE" },
        };

        const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");
        const checksum =
          crypto.createHash("sha256")
            .update(payloadBase64 + "/pg/v1/pay" + SALT_KEY)
            .digest("hex") +
          "###" + SALT_INDEX;

        const phonepeRes = await axios.post(
          "https://api.phonepe.com/apis/hermes/pg/v1/pay",
          { request: payloadBase64 },
          { headers: { "Content-Type": "application/json", "X-VERIFY": checksum } }
        );

        const redirectUrl = phonepeRes.data?.data?.instrumentResponse?.redirectInfo?.url;
        if (redirectUrl) {
          return NextResponse.json({
            success: true,
            redirectUrl,
            booking: { _id: booking._id, bookingId: booking.bookingId, type: booking.type, amount: booking.amount },
          });
        }
      } catch (phonepeErr) {
        console.error("PhonePe init error:", phonepeErr?.response?.data || phonepeErr.message);
        // Fall through — booking is created with pending status; user can see it in My Bookings
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

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
