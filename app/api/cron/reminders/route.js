import { NextResponse } from "next/server";
import connectDB     from "../../../../lib/mongodb";
import Booking       from "../../../../models/Booking";
import User          from "../../../../models/User";
import Notification  from "../../../../models/Notification";

export const dynamic = "force-dynamic";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function sendSms(mobile, message) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    console.log(`📱 [DEV] SMS to ${mobile}: ${message}`);
    return;
  }
  try {
    await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: { authorization: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        route:   "q",          // transactional / quick route
        message,
        flash:   0,
        numbers: mobile,
      }),
    });
  } catch (err) {
    console.error("SMS send error:", err.message);
  }
}

function getPatientInfo(booking) {
  let info = {};
  try { info = booking.notes ? JSON.parse(booking.notes) : {}; } catch {}
  return info;
}

function typeLabel(type) {
  return { OPD: "OPD Appointment", Lab: "Lab Test", Surgery: "Surgery", Consultation: "Teleconsultation" }[type] || type;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ── GET — called by Vercel Cron every hour ─────────────────────────────────
// Vercel passes Authorization: Bearer <CRON_SECRET> header automatically.
// We verify CRON_SECRET env var to prevent unauthorized triggers.
export async function GET(request) {
  // Security: only allow Vercel cron calls or internal calls with secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const now  = new Date();
    const sent = { oneDayReminders: 0, oneHourReminders: 0, notifications: 0 };

    // ── Window: 1-day reminder ─────────────────────────────────────────────
    // Match bookings whose appointmentDate falls in a 1-hour window starting 24h from now.
    // This fires once per hour so we check: now+23h → now+24h
    const dayFrom = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const dayTo   = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // ── Window: 1-hour reminder ────────────────────────────────────────────
    // Match bookings whose appointmentDate falls in next 60-90 minutes.
    const hourFrom = new Date(now.getTime() + 60 * 60 * 1000);
    const hourTo   = new Date(now.getTime() + 90 * 60 * 1000);

    const [dayBookings, hourBookings] = await Promise.all([
      Booking.find({
        appointmentDate: { $gte: dayFrom, $lte: dayTo },
        status: { $in: ["pending", "confirmed"] },
      }).lean(),
      Booking.find({
        appointmentDate: { $gte: hourFrom, $lte: hourTo },
        status: { $in: ["pending", "confirmed"] },
      }).lean(),
    ]);

    // Collect all userIds to batch-fetch mobiles
    const allUserIds = [
      ...dayBookings.map((b) => b.userId.toString()),
      ...hourBookings.map((b) => b.userId.toString()),
    ];
    const uniqueIds = [...new Set(allUserIds)];

    const users = await User.find({ _id: { $in: uniqueIds } }).select("_id mobile name").lean();
    const userMap = {};
    users.forEach((u) => { userMap[u._id.toString()] = u; });

    // ── Process 1-day reminders ────────────────────────────────────────────
    for (const booking of dayBookings) {
      const info   = getPatientInfo(booking);
      const user   = userMap[booking.userId.toString()];
      const mobile = info.patientMobile || user?.mobile;
      const name   = info.patientName   || user?.name || "Patient";
      const label  = typeLabel(booking.type);
      const date   = formatDate(booking.appointmentDate);
      const slot   = booking.slot ? ` at ${booking.slot}` : "";

      const smsMsg =
        `Reminder: Your ${label} at Brims Hospitals is scheduled TOMORROW (${date}${slot}). ` +
        `Booking ID: ${booking.bookingId}. Carry this ID & valid ID proof. -Brims Hospitals Patna`;

      if (mobile) await sendSms(mobile, smsMsg);
      sent.oneDayReminders++;

      // In-app notification
      try {
        await Notification.create({
          userId: booking.userId,
          type:   "reminder",
          title:  `Reminder: ${label} kal hai`,
          message: `Booking ID: ${booking.bookingId} | ${date}${slot} | Patient: ${name}`,
        });
        sent.notifications++;
      } catch {}
    }

    // ── Process 1-hour reminders ───────────────────────────────────────────
    for (const booking of hourBookings) {
      const info   = getPatientInfo(booking);
      const user   = userMap[booking.userId.toString()];
      const mobile = info.patientMobile || user?.mobile;
      const name   = info.patientName   || user?.name || "Patient";
      const label  = typeLabel(booking.type);
      const slot   = booking.slot ? ` at ${booking.slot}` : "";

      const smsMsg =
        `Alert: Your ${label} at Brims Hospitals is in 1 HOUR${slot}. ` +
        `Booking ID: ${booking.bookingId}. Please be on time. -Brims Hospitals Patna`;

      if (mobile) await sendSms(mobile, smsMsg);
      sent.oneHourReminders++;

      try {
        await Notification.create({
          userId: booking.userId,
          type:   "reminder",
          title:  `${label} 1 ghante mein hai!`,
          message: `Booking ID: ${booking.bookingId}${slot} | Patient: ${name}`,
        });
        sent.notifications++;
      } catch {}
    }

    console.log(`[Cron] Reminders sent at ${now.toISOString()}:`, sent);
    return NextResponse.json({ success: true, ...sent, runAt: now.toISOString() });

  } catch (err) {
    console.error("[Cron] Reminders error:", err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
