import { NextResponse } from "next/server";
import { clearSession } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({ success: true, message: "Logout successful" });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Logout error" },
      { status: 500 }
    );
  }
}
