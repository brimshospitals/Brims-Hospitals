import { NextResponse }   from "next/server";
import connectDB          from "../../../lib/mongodb";
import AmbulanceRequest   from "../../../models/AmbulanceRequest";
import Notification       from "../../../models/Notification";
import User               from "../../../models/User";
import { requireAuth, getSession } from "../../../lib/auth";

export const dynamic = "force-dynamic";

async function generateRequestId() {
  const count = await AmbulanceRequest.countDocuments();
  return `AMB-${String(count + 1).padStart(5, "0")}`;
}

async function sendSms(mobile, message) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) { console.log(`📱 [DEV] SMS to ${mobile}: ${message}`); return; }
  try {
    await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: { authorization: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ route: "q", message, flash: 0, numbers: mobile }),
    });
  } catch (e) { console.error("SMS error:", e.message); }
}

// ── POST — Submit ambulance request (no auth required — emergency) ─────────
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      callerName, callerMobile, patientName, patientAge, patientGender,
      emergency, vehicleType,
      address, landmark, district, lat, lng,
      destinationHospital,
    } = body;

    if (!callerName || !callerMobile || !address) {
      return NextResponse.json(
        { success: false, message: "callerName, callerMobile aur address zaruri hain" },
        { status: 400 }
      );
    }

    await connectDB();

    // Try to get session (optional — guest requests allowed)
    let userId;
    try {
      const { session } = await requireAuth(request, ["user","member","admin","staff"]);
      userId = session?.userId;
    } catch {}

    const requestId = await generateRequestId();

    const req = await AmbulanceRequest.create({
      requestId,
      userId:      userId || undefined,
      callerName,
      callerMobile,
      patientName:  patientName  || callerName,
      patientAge:   patientAge   || undefined,
      patientGender:patientGender|| undefined,
      emergency:    emergency    || "",
      vehicleType:  vehicleType  || "Basic",
      address,
      landmark:     landmark     || "",
      district:     district     || "Patna",
      lat:          lat          || undefined,
      lng:          lng          || undefined,
      destinationHospital: destinationHospital || "",
    });

    // SMS to caller
    const smsMsg =
      `Emergency ambulance request received! Request ID: ${requestId}. ` +
      `Hamari team abhi aapse contact karegi. Helpline: 112. -Brims Hospitals`;
    await sendSms(callerMobile, smsMsg);

    // Notify all admins
    try {
      const admins = await User.find({ role: "admin" }).select("_id").lean();
      if (admins.length > 0) {
        await Notification.insertMany(admins.map((a) => ({
          userId: a._id,
          type: "system",
          title: "🚑 New Ambulance Request",
          message: `${callerName} (${callerMobile}) — ${district} — ${vehicleType || "Basic"} | ID: ${requestId}`,
        })));
      }
    } catch {}

    return NextResponse.json({
      success:   true,
      message:   "Request bhej di gayi! Hamari team abhi call karegi.",
      requestId: req.requestId,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// ── GET — Check status by requestId (public) OR list all (admin) ──────────
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get("requestId");

  try {
    await connectDB();

    if (requestId) {
      // Public status check
      const req = await AmbulanceRequest.findOne({ requestId }).lean();
      if (!req) return NextResponse.json({ success: false, message: "Request nahi mili" }, { status: 404 });
      return NextResponse.json({
        success: true,
        status:        req.status,
        requestId:     req.requestId,
        vehicleType:   req.vehicleType,
        assignedDriver:req.assignedDriver,
        vehicleNumber: req.vehicleNumber,
        estimatedETA:  req.estimatedETA,
        dispatchedAt:  req.dispatchedAt,
      });
    }

    // Admin list
    const { error } = await requireAuth(request, ["admin", "staff"]);
    if (error) return error;

    const status = searchParams.get("status") || "";
    const page   = parseInt(searchParams.get("page") || "1");
    const limit  = 20;
    const query = {};
    if (status) query.status = status;

    const [total, requests] = await Promise.all([
      AmbulanceRequest.countDocuments(query),
      AmbulanceRequest.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({ success: true, requests, total, pages: Math.ceil(total / limit), page });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// ── PATCH — Admin: update status, assign driver, ETA ────────────────────────
export async function PATCH(request) {
  const { error } = await requireAuth(request, ["admin", "staff"]);
  if (error) return error;

  try {
    const body = await request.json();
    const { requestId, status, assignedDriver, vehicleNumber, estimatedETA, adminNotes, amount } = body;

    if (!requestId) {
      return NextResponse.json({ success: false, message: "requestId zaruri hai" }, { status: 400 });
    }

    await connectDB();

    const update = {};
    if (status)        update.status        = status;
    if (assignedDriver)update.assignedDriver = assignedDriver;
    if (vehicleNumber) update.vehicleNumber  = vehicleNumber;
    if (estimatedETA)  update.estimatedETA   = estimatedETA;
    if (adminNotes)    update.adminNotes     = adminNotes;
    if (amount != null)update.amount         = amount;

    if (status === "dispatched") update.dispatchedAt = new Date();
    if (status === "completed")  update.completedAt  = new Date();

    const req = await AmbulanceRequest.findOneAndUpdate({ requestId }, update, { new: true });
    if (!req) return NextResponse.json({ success: false, message: "Request nahi mili" }, { status: 404 });

    // SMS on dispatch
    if (status === "dispatched" && req.callerMobile) {
      const eta = estimatedETA || req.estimatedETA || "";
      const sms =
        `Ambulance dispatch ho gayi! Driver: ${assignedDriver || "En route"}, ` +
        `Vehicle: ${vehicleNumber || "—"}. ETA: ${eta}. -Brims Hospitals`;
      await sendSms(req.callerMobile, sms);
    }

    return NextResponse.json({ success: true, message: "Request update ho gayi", request: req });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
