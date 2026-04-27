import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Coordinator from "../../../../models/Coordinator";
import Booking from "../../../../models/Booking";
import Transaction from "../../../../models/Transaction";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// POST — coordinator requests withdrawal of available (completed) earnings
export async function POST(request) {
  const { error, session } = await requireAuth(request, ["coordinator", "member", "admin"]);
  if (error) return error;

  try {
    await connectDB();
    const coord = await Coordinator.findOne({ userId: session.userId });
    if (!coord) return NextResponse.json({ success: false, message: "Coordinator nahi mila" }, { status: 404 });

    // Find completed bookings with unpaid commission
    const completedBookings = await Booking.find({
      coordinatorId: coord._id,
      coordinatorPaid: { $ne: true },
      status: "completed",
      coordinatorCommission: { $gt: 0 },
    });

    const availableAmount = completedBookings.reduce((s, b) => s + (b.coordinatorCommission || 0), 0);
    if (availableAmount <= 0) {
      return NextResponse.json({ success: false, message: "Abhi koi available earning nahi hai. Services complete hone ka intezaar karein." }, { status: 400 });
    }

    // Mark bookings as paid
    const bookingIds = completedBookings.map(b => b._id);
    await Booking.updateMany({ _id: { $in: bookingIds } }, { $set: { coordinatorPaid: true } });

    // Update coordinator stats
    await Coordinator.findByIdAndUpdate(coord._id, {
      $inc: { paidEarned: availableAmount, pendingEarned: -availableAmount },
    });

    // Create transaction record
    const txn = await Transaction.create({
      userId:      coord.userId,
      type:        "debit",
      amount:      availableAmount,
      description: `Withdrawal Request — ₹${availableAmount.toLocaleString("en-IN")} (${completedBookings.length} bookings)`,
      referenceId: coord._id.toString(),
      category:    "withdrawal",
      status:      "pending",
    });

    return NextResponse.json({
      success: true,
      message: `₹${availableAmount.toLocaleString("en-IN")} withdrawal request bhej diya gaya. Admin 24-48 hours mein process karega.`,
      amount: availableAmount,
      txnId: txn._id,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// GET — coordinator transaction history
export async function GET(request) {
  const { error, session } = await requireAuth(request, ["coordinator", "member", "admin"]);
  if (error) return error;

  try {
    await connectDB();
    const coord = await Coordinator.findOne({ userId: session.userId }).select("_id").lean();
    if (!coord) return NextResponse.json({ success: false, message: "Coordinator nahi mila" }, { status: 404 });

    const transactions = await Transaction.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ success: true, transactions });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
