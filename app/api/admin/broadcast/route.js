import { NextResponse }  from "next/server";
import connectDB        from "../../../../lib/mongodb";
import Notification     from "../../../../models/Notification";
import User            from "../../../../models/User";
import { requireAuth }  from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// POST — send broadcast notification to users
export async function POST(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const { title, message, target, diseaseTag } = await request.json();

    if (!title || !message) {
      return NextResponse.json({ success: false, message: "title aur message zaruri hain" }, { status: 400 });
    }

    await connectDB();

    // Build user filter
    const query = { isActive: true };
    if (target === "members")     query.role = "member";
    else if (target === "users")  query.role = { $in: ["user", "member"] };
    else if (target === "doctors") query.role = "doctor";
    // target === "all" → no role filter (all active users)

    if (diseaseTag) query.preExistingDiseases = diseaseTag;

    const users = await User.find(query).select("_id").lean();

    if (users.length === 0) {
      return NextResponse.json({ success: false, message: "Koi user nahi mila is filter ke liye" }, { status: 404 });
    }

    // Insert notifications in batches of 500
    const BATCH = 500;
    let inserted = 0;
    for (let i = 0; i < users.length; i += BATCH) {
      const batch = users.slice(i, i + BATCH);
      await Notification.insertMany(
        batch.map((u) => ({ userId: u._id, type: "system", title, message })),
        { ordered: false }
      );
      inserted += batch.length;
    }

    return NextResponse.json({
      success: true,
      message: `Notification bhej di gayi ${inserted} users ko`,
      count: inserted,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// GET — recent broadcast history (via system notifications deduped by message)
export async function GET(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    await connectDB();

    // Get distinct broadcast messages (system type, sorted by latest)
    const recent = await Notification.aggregate([
      { $match: { type: "system" } },
      { $sort: { createdAt: -1 } },
      { $group: {
          _id:       "$title",
          message:   { $first: "$message" },
          sentAt:    { $first: "$createdAt" },
          totalSent: { $sum: 1 },
          readCount: { $sum: { $cond: ["$isRead", 1, 0] } },
      }},
      { $sort: { sentAt: -1 } },
      { $limit: 20 },
    ]);

    return NextResponse.json({ success: true, broadcasts: recent });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
