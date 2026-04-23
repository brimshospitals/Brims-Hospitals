import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";

export const dynamic = "force-dynamic";

// Returns current session info from httpOnly cookie
// Frontend calls this on mount to restore session state without reading cookie directly
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, loggedIn: false }, { status: 401 });
    }

    const base = {
      success:  true,
      loggedIn: true,
      userId:   session.userId,
      role:     session.role,
      name:     session.name,
      mobile:   session.mobile || "",
      // Entity-specific IDs (only present if relevant role)
      ...(session.doctorId        && { doctorId:        session.doctorId }),
      ...(session.hospitalMongoId && { hospitalMongoId: session.hospitalMongoId }),
    };

    // For staff: include permissions so the dashboard can show the right tabs
    if (session.role === "staff" && session.userId) {
      await connectDB();
      const user = await User.findById(session.userId).select("staffPermissions").lean();
      if (user?.staffPermissions) {
        base.staffPermissions = user.staffPermissions;
      }
    }

    return NextResponse.json(base);
  } catch {
    return NextResponse.json({ success: false, loggedIn: false }, { status: 500 });
  }
}
