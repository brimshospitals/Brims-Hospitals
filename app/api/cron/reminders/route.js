import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Booking from "../../../../models/Booking";
import User from "../../../../models/User";
import { sendSms } from "../../../../lib/sms";

export const dynamic = "force-dynamic";

// Vercel cron calls this endpoint automatically.
// vercel.json schedules:
//   "0 2 * * *" → 7:30 AM IST → aaj ke appointments reminder
//   "0 8 * * *" → 1:30 PM IST → kal ke appointments reminder

export async function GET(request) {
  // Optional: CRON_SECRET env var se unauthorized access rok sakte ho
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    // IST = UTC + 5h 30m
    const now    = new Date();
    const offset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + offset);
    const hour   = istNow.getUTCHours(); // IST ka current hour

    let sent    = 0;
    let skipped = 0;
    const errors = [];

    // ── 7–9 AM IST: Aaj ke appointments ─────────────────────────────────────
    if (hour >= 7 && hour <= 9) {
      // Today in IST → UTC range for DB
      const todayIST    = new Date(istNow); todayIST.setUTCHours(0,0,0,0);
      const todayISTEnd = new Date(istNow); todayISTEnd.setUTCHours(23,59,59,999);
      const fromUTC = new Date(todayIST.getTime()    - offset);
      const toUTC   = new Date(todayISTEnd.getTime() - offset);

      const bookings = await Booking.find({
        appointmentDate: { $gte: fromUTC, $lte: toUTC },
        status:          { $in: ["confirmed", "pending"] },
        reminderToday:   { $ne: true },
      }).lean();

      for (const b of bookings) {
        try {
          const user = await User.findById(b.userId).select("mobile name").lean();
          if (!user?.mobile) { skipped++; continue; }

          let n = {};
          try { n = b.notes ? JSON.parse(b.notes) : {}; } catch {}
          const name = n.patientName || user.name;
          const slot = b.slot ? ` Samay: ${b.slot}.` : "";
          const type = b.type;

          const msg = `Brims Hospitals: ${name} ji, aapka ${type} appointment AAJ hai.${slot} Booking ID: ${b.bookingId}. Samay par aayen. Helpline: 9876543210`;

          const r = await sendSms(user.mobile, msg);
          if (r.success) {
            await Booking.findByIdAndUpdate(b._id, { $set: { reminderToday: true } });
            sent++;
          } else {
            errors.push(`${b.bookingId}: ${r.error}`);
          }
        } catch (e) {
          errors.push(`${b.bookingId}: ${e.message}`);
        }
      }
    }

    // ── 13–15 PM IST: Kal ke appointments ───────────────────────────────────
    if (hour >= 13 && hour <= 15) {
      const tomorrowIST    = new Date(istNow); tomorrowIST.setUTCDate(tomorrowIST.getUTCDate()+1); tomorrowIST.setUTCHours(0,0,0,0);
      const tomorrowISTEnd = new Date(tomorrowIST); tomorrowISTEnd.setUTCHours(23,59,59,999);
      const fromUTC = new Date(tomorrowIST.getTime()    - offset);
      const toUTC   = new Date(tomorrowISTEnd.getTime() - offset);

      const bookings = await Booking.find({
        appointmentDate:  { $gte: fromUTC, $lte: toUTC },
        status:           { $in: ["confirmed", "pending"] },
        reminderTomorrow: { $ne: true },
      }).lean();

      for (const b of bookings) {
        try {
          const user = await User.findById(b.userId).select("mobile name").lean();
          if (!user?.mobile) { skipped++; continue; }

          let n = {};
          try { n = b.notes ? JSON.parse(b.notes) : {}; } catch {}
          const name = n.patientName || user.name;
          const slot = b.slot ? ` Samay: ${b.slot}.` : "";
          const type = b.type;

          const msg = `Brims Hospitals: ${name} ji, aapka ${type} appointment KAL hai.${slot} Booking ID: ${b.bookingId}. Samay par aayen. Helpline: 9876543210`;

          const r = await sendSms(user.mobile, msg);
          if (r.success) {
            await Booking.findByIdAndUpdate(b._id, { $set: { reminderTomorrow: true } });
            sent++;
          } else {
            errors.push(`${b.bookingId}: ${r.error}`);
          }
        } catch (e) {
          errors.push(`${b.bookingId}: ${e.message}`);
        }
      }
    }

    return NextResponse.json({
      success:  true,
      sent,
      skipped,
      ist_hour: hour,
      errors:   errors.length ? errors : undefined,
    });

  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}