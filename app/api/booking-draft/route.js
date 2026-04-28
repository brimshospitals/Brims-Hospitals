import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import BookingDraft from "../../../models/BookingDraft";
import { getSession } from "../../../lib/auth";

export const dynamic = "force-dynamic";

// POST — create or update a draft (silent background call from booking pages)
// Body: { draftId?, type, itemId, itemType, itemName, hospitalName, amount, stage, patientInfo?, slotInfo?, paymentMode? }
export async function POST(request) {
  try {
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json({ success: false, message: "Login required" }, { status: 401 });
    }

    const body   = await request.json();
    const {
      draftId, type, itemId, itemType, itemName, hospitalName, amount,
      stage, patientInfo, slotInfo, paymentMode,
    } = body;

    if (!type || !itemId) {
      return NextResponse.json({ success: false, message: "type and itemId required" }, { status: 400 });
    }

    await connectDB();

    let draft;

    if (draftId) {
      // Update existing draft — advance stage and save new data
      const update = { stage: stage || 1 };
      if (patientInfo)  update.patientInfo  = patientInfo;
      if (slotInfo)     update.slotInfo     = slotInfo;
      if (paymentMode)  update.paymentMode  = paymentMode;
      if (amount)       update.amount       = amount;
      // Push expiresAt forward on activity
      update.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

      draft = await BookingDraft.findOneAndUpdate(
        { _id: draftId, userId: session.userId, status: "active" },
        { $set: update },
        { new: true }
      );
    }

    if (!draft) {
      // Create new draft — first deactivate any previous active draft for same type+item
      await BookingDraft.updateMany(
        { userId: session.userId, type, itemId, status: "active" },
        { $set: { status: "expired" } }
      );

      draft = await BookingDraft.create({
        userId:      session.userId,
        type,
        itemId,
        itemType:    itemType || type,
        itemName:    itemName || "",
        hospitalName: hospitalName || "",
        amount:      amount || 0,
        stage:       stage || 1,
        ...(patientInfo && { patientInfo }),
        ...(slotInfo    && { slotInfo }),
        ...(paymentMode && { paymentMode }),
        status:    "active",
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      });
    }

    return NextResponse.json({ success: true, draftId: draft._id.toString() });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// GET — fetch user's active drafts (for resume banner)
export async function GET(request) {
  try {
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json({ success: false, drafts: [] });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "";

    await connectDB();

    const query = { userId: session.userId, status: "active" };
    if (type) query.type = type;

    const drafts = await BookingDraft.find(query)
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    return NextResponse.json({ success: true, drafts });
  } catch (err) {
    return NextResponse.json({ success: false, drafts: [], message: err.message });
  }
}

// PATCH — mark draft as converted or expired
// Body: { draftId, status: "converted"|"expired", convertedBookingId? }
export async function PATCH(request) {
  try {
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json({ success: false, message: "Login required" }, { status: 401 });
    }

    const { draftId, status, convertedBookingId } = await request.json();
    if (!draftId || !status) {
      return NextResponse.json({ success: false, message: "draftId and status required" }, { status: 400 });
    }

    await connectDB();

    await BookingDraft.findOneAndUpdate(
      { _id: draftId, userId: session.userId },
      { $set: { status, ...(convertedBookingId && { convertedBookingId }) } }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
