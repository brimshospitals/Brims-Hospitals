import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Booking from "../../../../models/Booking";
import Hospital from "../../../../models/Hospital";
import Doctor from "../../../../models/Doctor";
import Transaction from "../../../../models/Transaction";
import User from "../../../../models/User";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// Booking types that belong to each payout entity
const ENTITY_TYPES = {
  hospital:  ["OPD", "IPD", "Surgery"],
  lab:       ["Lab"],
  doctor:    ["Consultation"],
  ambulance: ["Ambulance"],   // Ambulance booking type
};

const ENTITY_PAYOUT_CATEGORY = {
  hospital:  "hospital_payout",
  lab:       "lab_payout",
  doctor:    "doctor_payout",
  ambulance: "ambulance_payout",
};

const ENTITY_LABEL = {
  hospital:  "Hospital",
  lab:       "Lab",
  doctor:    "Doctor",
  ambulance: "Ambulance",
};

// ── GET — list payouts for an entity ─────────────────────────────────────────
// ?entity=hospital|lab|doctor|ambulance
// ?status=pending|paid|all  (default: pending)
// ?page=1
export async function GET(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const entity = searchParams.get("entity") || "hospital";
    const status = searchParams.get("status") || "pending";
    const page   = parseInt(searchParams.get("page") || "1", 10);
    const limit  = 30;

    const types = ENTITY_TYPES[entity] ?? ENTITY_TYPES.hospital;

    // Platform received the money and there is something to pay out
    const baseFilter = {
      paymentMode:     { $in: ["online", "wallet", "insurance"] },
      hospitalPayable: { $gt: 0 },
      ...(types.length > 0 ? { type: { $in: types } } : {}),
    };

    if (status === "pending") {
      baseFilter.$or = [{ payoutStatus: null }, { payoutStatus: "pending" }];
    } else if (status === "paid") {
      baseFilter.payoutStatus = "paid";
    }
    // "all" — no additional filter

    const [total, bookings] = await Promise.all([
      Booking.countDocuments(baseFilter),
      Booking.find(baseFilter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("hospitalId", "name mobile")
        .populate("doctorId", "name department mobile")
        .lean(),
    ]);

    // Parse patient notes
    const enriched = bookings.map(b => {
      let notes = {};
      try { notes = b.notes ? JSON.parse(b.notes) : {}; } catch {}
      return { ...b, parsedNotes: notes };
    });

    // Pending total for this entity (regardless of page)
    const pendingFilter = {
      ...baseFilter,
      $or: [{ payoutStatus: null }, { payoutStatus: "pending" }],
    };
    delete pendingFilter.payoutStatus;   // remove status-specific filter for aggregate

    const pendingAgg = await Booking.aggregate([
      { $match: {
          paymentMode:     { $in: ["online", "wallet", "insurance"] },
          hospitalPayable: { $gt: 0 },
          ...(types.length > 0 ? { type: { $in: types } } : {}),
          $or: [{ payoutStatus: null }, { payoutStatus: "pending" }],
      }},
      { $group: { _id: null, total: { $sum: "$hospitalPayable" }, count: { $sum: 1 } } },
    ]);

    return NextResponse.json({
      success:      true,
      bookings:     enriched,
      total,
      pages:        Math.ceil(total / limit),
      page,
      pendingTotal: pendingAgg[0]?.total || 0,
      pendingCount: pendingAgg[0]?.count || 0,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// ── PATCH — process a payout (admin enters UTR and confirms payment) ──────────
// body: { bookingId, utr, entity }
export async function PATCH(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    await connectDB();

    const { bookingId, utr, entity = "hospital" } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ success: false, message: "bookingId required" }, { status: 400 });
    }
    if (!utr?.trim()) {
      return NextResponse.json({ success: false, message: "UTR number required" }, { status: 400 });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });
    }

    if (booking.payoutStatus === "paid") {
      return NextResponse.json({ success: false, message: "Payout already processed" }, { status: 400 });
    }

    // Mark payout as done on the booking
    booking.payoutStatus      = "paid";
    booking.payoutUtr         = utr.trim();
    booking.payoutProcessedAt = new Date();
    await booking.save();

    // Create a payout transaction record (platform paying out)
    const label    = ENTITY_LABEL[entity]  || "Partner";
    const category = ENTITY_PAYOUT_CATEGORY[entity] || "hospital_payout";

    // Resolve the entity's userId (hospital/lab/doctor account), not the patient's userId
    let entityUserId = null;
    try {
      if ((entity === "hospital" || entity === "lab") && booking.hospitalId) {
        const hosp = await Hospital.findById(booking.hospitalId).select("userId").lean();
        entityUserId = hosp?.userId || null;
      } else if (entity === "doctor" && booking.doctorId) {
        const doc = await Doctor.findById(booking.doctorId).select("userId").lean();
        entityUserId = doc?.userId || null;
      }
    } catch {}
    // Fallback: use first admin userId if entity has no linked user account
    if (!entityUserId) {
      const admin = await User.findOne({ role: "admin" }).select("_id").lean();
      entityUserId = admin?._id || booking.userId;
    }

    await Transaction.create({
      userId:      entityUserId,
      type:        "debit",
      amount:      booking.hospitalPayable,
      description: `${label} Payout — ${booking.type} (${booking.bookingId}) | UTR: ${utr.trim()}`,
      bookingId:   booking._id,
      referenceId: booking.bookingId,
      category,
      status:      "success",
    });

    return NextResponse.json({
      success: true,
      message: `✅ ₹${(booking.hospitalPayable || 0).toLocaleString("en-IN")} payout processed (UTR: ${utr.trim()})`,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
