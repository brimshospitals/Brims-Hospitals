import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import FamilyCard from "../../../../models/FamilyCard";
import Coordinator from "../../../../models/Coordinator";
import Transaction from "../../../../models/Transaction";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

const IS_TEST = process.env.NEXT_PUBLIC_SHOW_OTP === "true";

function generateCardNumber() {
  const year   = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `BRIMS-${year}-${random}`;
}

// Test-mode only: coordinator activates a client's card for free (₹100 commission still credited)
export async function POST(request) {
  if (!IS_TEST) {
    return NextResponse.json({ success: false, message: "Testing mode disabled" }, { status: 403 });
  }

  const { error, session } = await requireAuth(request, ["coordinator", "member", "admin"]);
  if (error) return error;

  try {
    const { clientUserId } = await request.json();
    if (!clientUserId) {
      return NextResponse.json({ success: false, message: "clientUserId zaruri hai" }, { status: 400 });
    }

    await connectDB();

    const coord = await Coordinator.findOne({ userId: session.userId });
    if (!coord) {
      return NextResponse.json({ success: false, message: "Coordinator nahi mila" }, { status: 404 });
    }

    const client = await User.findById(clientUserId).populate("familyCardId");
    if (!client) {
      return NextResponse.json({ success: false, message: "Client nahi mila" }, { status: 404 });
    }
    if (client.familyCardId?.status === "active") {
      return NextResponse.json({ success: false, message: "Card pehle se active hai" }, { status: 409 });
    }

    const cardNumber = generateCardNumber();
    const now    = new Date();
    const expiry = new Date(now);
    expiry.setFullYear(expiry.getFullYear() + 1);

    const familyCard = await FamilyCard.create({
      primaryMemberId: client._id,
      cardNumber,
      members:      [client._id],
      membersCount: 1,
      walletBalance: 0,
      activationDate: now,
      expiryDate:  expiry,
      status:      "active",
      paymentId:   "TEST-COORD-FREE",
      amountPaid:  0,
    });

    client.familyCardId = familyCard._id;
    client.role = "member";
    await client.save();

    // ₹100 activation commission to coordinator
    await Coordinator.findByIdAndUpdate(coord._id, {
      $inc: { totalEarned: 100, pendingEarned: 100 },
    });
    await Transaction.create({
      userId:      coord.userId,
      type:        "credit",
      amount:      100,
      description: `Card Activation Commission — ${client.name} (${client.mobile}) ne Family Card activate kiya`,
      referenceId: client._id.toString(),
      category:    "card_activation",
      status:      "success",
    });

    return NextResponse.json({
      success: true,
      message: `${client.name} ka card activate ho gaya! ₹100 commission credited.`,
      cardNumber,
      expiryDate: expiry,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
