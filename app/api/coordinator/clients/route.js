import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import Coordinator from "../../../../models/Coordinator";
import Booking from "../../../../models/Booking";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// GET — list clients OR check single mobile
// No params → list all clients for this coordinator (derived from bookings)
// ?mobile=9876543210 → lookup single user
export async function GET(request) {
  const { error, session } = await requireAuth(request, ["coordinator", "member", "admin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const mobile = searchParams.get("mobile")?.trim();
    const search = searchParams.get("search")?.trim() || "";

    await connectDB();

    // Single mobile lookup
    if (mobile) {
      if (!/^\d{10}$/.test(mobile)) {
        return NextResponse.json({ success: false, message: "Valid mobile number daalo" }, { status: 400 });
      }
      const user = await User.findOne({ mobile }).select("-otp -otpExpiry -password").lean();
      if (user) return NextResponse.json({ success: true, exists: true, user });
      return NextResponse.json({ success: true, exists: false, user: null });
    }

    // List mode — derive clients from this coordinator's bookings
    const coord = await Coordinator.findOne({ userId: session.userId }).select("_id").lean();
    if (!coord) return NextResponse.json({ success: false, message: "Coordinator nahi mila" }, { status: 404 });

    const bookings = await Booking.find({ coordinatorId: coord._id })
      .select("notes userId createdAt")
      .sort({ createdAt: -1 })
      .lean();

    // Build unique client map from bookings
    const clientMap = new Map();
    bookings.forEach(b => {
      let n = {};
      try { n = JSON.parse(b.notes || "{}"); } catch {}
      const mob = n.patientMobile;
      if (mob && !clientMap.has(mob)) {
        clientMap.set(mob, {
          mobile:    mob,
          name:      n.patientName  || "—",
          age:       n.patientAge,
          gender:    n.patientGender,
          userId:    b.userId,
          lastVisit: b.createdAt,
          visits:    1,
        });
      } else if (mob) {
        clientMap.get(mob).visits++;
      }
    });

    let clients = Array.from(clientMap.values());

    // Apply search filter
    if (search) {
      const re = new RegExp(search, "i");
      clients = clients.filter(c => re.test(c.name) || re.test(c.mobile));
    }

    return NextResponse.json({ success: true, clients, total: clients.length });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// POST — create new client (member account) for coordinator
export async function POST(request) {
  const { error, session } = await requireAuth(request, ["coordinator", "member", "admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const { name, mobile, age, gender } = body;

    if (!name || !mobile || !age || !gender) {
      return NextResponse.json({ success: false, message: "Naam, mobile, age, gender zaruri hai" }, { status: 400 });
    }
    if (!/^\d{10}$/.test(mobile.trim())) {
      return NextResponse.json({ success: false, message: "Valid 10-digit mobile zaruri hai" }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ mobile: mobile.trim() });
    if (existing) {
      return NextResponse.json({ success: true, exists: true, user: existing, message: "Pehle se registered hai" });
    }

    // CB2 Fix: Link user to coordinator so bookings auto-credit commission
    const coord = await Coordinator.findOne({ userId: session.userId }).select("_id").lean();

    const user = await User.create({
      mobile:                  mobile.trim(),
      name:                    name.trim(),
      age:                     Number(age),
      gender,
      role:                    "user",
      isActive:                true,
      registeredByCoordinator: coord?._id || undefined,
    });

    // Increment coordinator's client count
    if (coord) {
      await Coordinator.findByIdAndUpdate(coord._id, { $inc: { totalClients: 1 } });
    }

    return NextResponse.json({ success: true, exists: false, user, message: "Naya client register ho gaya" });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}