import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Coordinator from "../../../../models/Coordinator";
import User from "../../../../models/User";
import Booking from "../../../../models/Booking";
import Transaction from "../../../../models/Transaction";
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
        .sort({ createdAt: -1 }).limit(100).lean();

      // Fetch transaction ledger (card activations, withdrawals, etc.)
      const transactions = coord.userId
        ? await Transaction.find({ userId: coord.userId }).sort({ createdAt: -1 }).limit(100).lean()
        : [];

      // Compute availableEarned dynamically (completed but not yet paid)
      const availableEarned = bookings
        .filter(b => !b.coordinatorPaid && b.status === "completed")
        .reduce((s, b) => s + (b.coordinatorCommission || 0), 0);

      // Pending withdrawal requests
      const pendingWithdrawals = transactions.filter(t => t.type === "debit" && t.status === "pending");

      return NextResponse.json({ success: true, coordinator: coord, bookings, transactions, availableEarned, pendingWithdrawals });
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

    // Create User account for login (OTP-based, same mobile = same login)
    let user = await User.findOne({ mobile: mobile.trim() });
    if (user) {
      // Keep "member" role if they already have membership — coordinator features added via coordinatorId link
      // Only set "coordinator" role for users who have no membership yet
      const newRole = (user.role === "member") ? "member" : "coordinator";
      await User.findByIdAndUpdate(user._id, { role: newRole });
      user.role = newRole;
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

// PATCH — update coordinator OR process withdrawal
export async function PATCH(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const body = await request.json();

    await connectDB();

    // ── Process withdrawal (admin marks payment done with UTR) ──────────────
    if (body.action === "process-withdraw") {
      const { txnId, utr, coordinatorId } = body;
      if (!txnId || !utr) {
        return NextResponse.json({ success: false, message: "txnId aur UTR zaruri hai" }, { status: 400 });
      }

      const txn = await Transaction.findById(txnId);
      if (!txn) return NextResponse.json({ success: false, message: "Transaction nahi mila" }, { status: 404 });
      if (txn.status === "success") {
        return NextResponse.json({ success: false, message: "Ye transaction already processed hai" }, { status: 409 });
      }

      txn.status = "success";
      txn.paymentId = utr;
      txn.description = txn.description + ` | UTR: ${utr}`;
      await txn.save();

      return NextResponse.json({
        success: true,
        message: `₹${txn.amount.toLocaleString("en-IN")} withdrawal processed. UTR: ${utr}`,
      });
    }

    // ── Standard field update ───────────────────────────────────────────────
    const docId = body.id || body.coordinatorId;
    if (!docId) return NextResponse.json({ success: false, message: "id zaruri hai" }, { status: 400 });

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