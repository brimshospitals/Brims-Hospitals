import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Coordinator from "../../../../models/Coordinator";
import User from "../../../../models/User";
import Booking from "../../../../models/Booking";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

async function generateCoordinatorId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let i = 0; i < 10; i++) {
    const suffix = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const id = `BRIMS-HC-${suffix}`;
    if (!(await Coordinator.findOne({ coordinatorId: id }).lean())) return id;
  }
  return "BRIMS-HC-" + Date.now().toString(36).toUpperCase().slice(-4);
}

// GET — list coordinators
export async function GET(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const coord = await Coordinator.findById(id).lean();
      if (!coord) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });

      // Fetch their bookings
      const bookings = await Booking.find({ coordinatorId: coord._id })
        .sort({ createdAt: -1 }).limit(50).lean();

      return NextResponse.json({ success: true, coordinator: coord, bookings });
    }

    const coordinators = await Coordinator.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, coordinators });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// POST — add new coordinator (admin creates)
export async function POST(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const { name, mobile, email, district, area, type, commissionRates } = body;

    if (!name || !mobile) {
      return NextResponse.json({ success: false, message: "Naam aur mobile zaruri hai" }, { status: 400 });
    }
    if (!/^\d{10}$/.test(mobile.trim())) {
      return NextResponse.json({ success: false, message: "Valid 10-digit mobile zaruri hai" }, { status: 400 });
    }

    await connectDB();

    // Check if mobile already used
    const existing = await Coordinator.findOne({ mobile: mobile.trim() });
    if (existing) {
      return NextResponse.json({ success: false, message: "Is mobile se coordinator pehle se hai" }, { status: 409 });
    }

    const coordinatorId = await generateCoordinatorId();

    // Create User account for login (OTP-based)
    let user = await User.findOne({ mobile: mobile.trim() });
    if (user) {
      // Upgrade existing user to coordinator
      await User.findByIdAndUpdate(user._id, { role: "coordinator" });
    } else {
      user = await User.create({
        mobile: mobile.trim(),
        email:  email?.trim() || undefined,
        name:   name.trim(),
        age:    25,
        gender: "male",
        role:   "coordinator",
        isActive: true,
      });
    }

    const coordinator = await Coordinator.create({
      coordinatorId,
      userId:   user._id,
      name:     name.trim(),
      mobile:   mobile.trim(),
      email:    email?.trim() || "",
      district: district || "",
      area:     area || "",
      type:     type || "health_worker",
      commissionRates: {
        Surgery:      commissionRates?.Surgery      ?? 20,
        Lab:          commissionRates?.Lab          ?? 30,
        OPD:          commissionRates?.OPD          ?? 0,
        Consultation: commissionRates?.Consultation ?? 0,
        IPD:          commissionRates?.IPD          ?? 10,
      },
    });

    await User.findByIdAndUpdate(user._id, { coordinatorId: coordinator._id });

    return NextResponse.json({
      success: true,
      coordinator,
      message: `${name} Health Coordinator ban gaye. Login: ${mobile} (Mobile OTP se)`,
    });
  } catch (err) {
    console.error("Coordinator POST error:", err);
    return NextResponse.json({ success: false, message: err.message || "Server error" }, { status: 500 });
  }
}

// PATCH — update coordinator
export async function PATCH(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const docId = body.id || body.coordinatorId;
    if (!docId) return NextResponse.json({ success: false, message: "id zaruri hai" }, { status: 400 });

    await connectDB();
    const allowed = ["name","email","district","area","type","commissionRates","isActive"];
    const update = {};
    allowed.forEach(k => { if (body[k] !== undefined) update[k] = body[k]; });

    const coord = await Coordinator.findByIdAndUpdate(docId, { $set: update }, { new: true });
    if (!coord) return NextResponse.json({ success: false, message: "Coordinator not found" }, { status: 404 });

    return NextResponse.json({ success: true, coordinator: coord, message: "Updated" });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}