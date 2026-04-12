import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Report from "../../../../models/Report";
import User   from "../../../../models/User";
import FamilyCard from "../../../../models/FamilyCard";

export const dynamic = "force-dynamic";

// GET — Patient fetches their own reports (plus family members' reports)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, message: "userId zaruri hai" }, { status: 400 });
    }

    await connectDB();

    // Include family members
    const user = await User.findById(userId).select("familyCardId").lean();
    const memberIds = [userId];

    if (user?.familyCardId) {
      const familyCard = await FamilyCard.findById(user.familyCardId).lean();
      if (familyCard?.members?.length) {
        familyCard.members.forEach((id) => memberIds.push(id.toString()));
      }
    }

    const reports = await Report.find({ userId: { $in: memberIds } })
      .sort({ reportDate: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, reports, total: reports.length });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}
