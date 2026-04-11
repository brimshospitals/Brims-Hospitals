import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// Returns current session info from httpOnly cookie
// Frontend calls this on mount to restore session state without reading cookie directly
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, loggedIn: false }, { status: 401 });
    }
    return NextResponse.json({
      success:  true,
      loggedIn: true,
      userId:   session.userId,
      role:     session.role,
      name:     session.name,
      mobile:   session.mobile || "",
      // Entity-specific IDs (only present if relevant role)
      ...(session.doctorId        && { doctorId:        session.doctorId }),
      ...(session.hospitalMongoId && { hospitalMongoId: session.hospitalMongoId }),
    });
  } catch {
    return NextResponse.json({ success: false, loggedIn: false }, { status: 500 });
  }
}
