import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Report from "../../../../models/Report";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// GET — Patient fetches their own reports
// Family members are embedded in the primary user — their reports are stored
// under the primary user's _id (hospital looks up by mobile = primary mobile).
export async function GET(request) {
  const { error, session } = await requireAuth(request, ["user", "member", "admin", "staff", "coordinator"]);
  if (error) return error;

  try {
    await connectDB();

    const reports = await Report.find({ userId: session.userId })
      .sort({ reportDate: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, reports, total: reports.length });
  } catch (err) {
    return NextResponse.json({ success: false, message: "Server error: " + err.message }, { status: 500 });
  }
}
