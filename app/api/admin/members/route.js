import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import FamilyCard from "../../../../models/FamilyCard";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all"; // active | inactive | all
    const page   = parseInt(searchParams.get("page") || "1");
    const limit  = 30;

    await connectDB();

    const query = { role: { $in: ["user", "member"] } };
    if (status === "active")   query.isActive = true;
    if (status === "inactive") query.isActive = false;
    if (search.trim()) {
      query.$or = [
        { name:                     { $regex: search.trim(), $options: "i" } },
        { mobile:                   { $regex: search.trim(), $options: "i" } },
        { memberId:                 { $regex: search.trim(), $options: "i" } },
        { "familyMembers.name":     { $regex: search.trim(), $options: "i" } },
        { "familyMembers.memberId": { $regex: search.trim(), $options: "i" } },
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-otp -otpExpiry -__v")
      .lean();

    // B11: Batch-fetch all family cards in one query — eliminates N+1 pattern
    const cardIds = [...new Set(users.filter(u => u.familyCardId).map(u => u.familyCardId.toString()))];
    const cards   = cardIds.length
      ? await FamilyCard.find({ _id: { $in: cardIds } }).select("walletBalance status cardNumber").lean()
      : [];
    const cardMap = {};
    cards.forEach(c => { cardMap[c._id.toString()] = c; });

    const enriched = [];
    users.forEach(u => {
      let walletBalance = 0, cardStatus = null, cardNumber = null;
      if (u.familyCardId) {
        const card = cardMap[u.familyCardId.toString()];
        if (card) { walletBalance = card.walletBalance || 0; cardStatus = card.status; cardNumber = card.cardNumber; }
      }
      // Primary user row
      enriched.push({ ...u, walletBalance, cardStatus, cardNumber, isPrimary: true });
      // Secondary members as separate rows
      (u.familyMembers || []).forEach(fm => {
        enriched.push({
          ...fm,
          isPrimary:     false,
          primaryUserId: u._id,
          primaryName:   u.name,
          mobile:        u.mobile,
          walletBalance,
          cardStatus,
          cardNumber,
          familyCardId:  u.familyCardId,
          role:          u.role,
        });
      });
    });

    return NextResponse.json({ success: true, members: enriched, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const { userId, isActive, primaryUserId, memberId } = await request.json();
    await connectDB();

    // Toggle embedded secondary member
    if (primaryUserId && memberId) {
      await User.updateOne(
        { _id: primaryUserId, "familyMembers._id": memberId },
        { $set: { "familyMembers.$.isActive": isActive } }
      );
      return NextResponse.json({ success: true, message: `Member ${isActive ? "activated" : "deactivated"}` });
    }

    // Toggle primary user
    if (!userId) return NextResponse.json({ success: false, message: "userId required" }, { status: 400 });
    const user = await User.findByIdAndUpdate(userId, { isActive }, { new: true }).select("name isActive").lean();
    if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: `${user.name} ${isActive ? "activated" : "deactivated"}` });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
