import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import BookingDraft from "../../../../models/BookingDraft";
import User from "../../../../models/User";
import { sendSms } from "../../../../lib/sms";

export const dynamic = "force-dynamic";

// Vercel cron: runs every 30 minutes
// Uses BookingDraft model for 3-level abandonment reminders:
//   Level 1 — 30 min after draft creation  (reminderSent.min30)
//   Level 2 — 2 hr after draft creation    (reminderSent.hr2)
//   Level 3 — 24 hr after draft creation   (reminderSent.hr24)

const BASE_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "";

const PAGE_URL = {
  OPD:          `${BASE_URL}/opd-booking`,
  Lab:          `${BASE_URL}/lab-tests`,
  Surgery:      `${BASE_URL}/surgery-packages`,
  IPD:          `${BASE_URL}/ipd-booking`,
  Consultation: `${BASE_URL}/teleconsultation`,
};

const TYPE_LABEL = {
  OPD: "OPD Appointment", Lab: "Lab Test", Surgery: "Surgery Package",
  IPD: "IPD Admission", Consultation: "Teleconsultation",
};

async function sendEmailReminder(email, name, itemName, type, level) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`📧 [DEV] Abandoned reminder L${level} for ${email}: ${itemName}`);
    return true;
  }

  const typeLabel = TYPE_LABEL[type] || type;
  const pageUrl   = PAGE_URL[type]   || `${BASE_URL}/dashboard`;

  const messages = {
    1: { subject: `${name} ji, ${itemName} booking adhoori reh gayi!`, msg: "Aapne abhi abhi dekhna shuru kiya tha — booking complete karne mein sirf 2 minute lagte hain!" },
    2: { subject: `Kya aapko madad chahiye? ${itemName} ka intezaar hai!`, msg: "Humari team aapki madad ke liye tayyar hai. Koi dikkat hai to WhatsApp par baat kar sakte hain." },
    3: { subject: `Kal tak offer valid hai — ${itemName} book karein!`, msg: "Prices change ho sakte hain. Aaj hi booking confirm karein aur apni jagah pakki karein." },
  };
  const { subject, msg } = messages[level] || messages[1];

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Brims Hospitals <noreply@brimshospitals.com>",
        to: [email],
        subject,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f8fafc;border-radius:16px;">
            <h1 style="color:#0d9488;font-size:20px;text-align:center;margin-bottom:20px;">Brims Hospitals</h1>
            <div style="background:white;border-radius:12px;padding:24px;">
              <p style="color:#1e293b;font-size:16px;font-weight:600;margin-bottom:8px;">Namaskar ${name} ji! 👋</p>
              <p style="color:#475569;font-size:14px;margin-bottom:8px;">
                Aap <strong>${itemName}</strong> (${typeLabel}) book kar rahe the — booking poori nahi hui.
              </p>
              <p style="color:#475569;font-size:14px;margin-bottom:24px;">${msg}</p>
              <div style="text-align:center;margin-bottom:16px;">
                <a href="${pageUrl}" style="background:#0d9488;color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">
                  Booking Complete Karein →
                </a>
              </div>
              <p style="color:#94a3b8;font-size:12px;text-align:center;">
                Help: helpline@brimshospitals.com | 9876543210
              </p>
            </div>
          </div>
        `,
      }),
    });
    const data = await res.json();
    return !(data.statusCode >= 400);
  } catch (err) {
    console.error("Resend error:", err.message);
    return false;
  }
}

// Returns [from, to] window for a given interval (in minutes)
function timeWindow(minAgo, windowMin = 35) {
  const now = Date.now();
  return {
    from: new Date(now - (minAgo + windowMin) * 60 * 1000),
    to:   new Date(now - minAgo * 60 * 1000),
  };
}

export async function GET(request) {
  const authHeader  = request.headers.get("authorization");
  const cronSecret  = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    // Define the three reminder levels:
    // L1: 30 min — window 25–65 min old (cron runs every 30min, catches everything in range)
    // L2: 2 hr  — window 115–145 min old
    // L3: 24 hr — window 1415–1445 min old
    const levels = [
      { key: "min30", flag: "reminderSent.min30", ...timeWindow(30, 35), smsTag: "" },
      { key: "hr2",   flag: "reminderSent.hr2",   ...timeWindow(120, 30), smsTag: " (2nd reminder)" },
      { key: "hr24",  flag: "reminderSent.hr24",  ...timeWindow(1440, 30), smsTag: " (last reminder)" },
    ];

    let totalSent = 0, totalSkipped = 0;
    const errors = [];

    for (const [levelIdx, lvl] of levels.entries()) {
      const levelNum = levelIdx + 1;

      const drafts = await BookingDraft.find({
        status: "active",
        createdAt: { $gte: lvl.from, $lte: lvl.to },
        [lvl.flag]: { $ne: true },
      }).lean();

      for (const draft of drafts) {
        try {
          const user = await User.findById(draft.userId).select("mobile name email").lean();
          if (!user?.mobile) { totalSkipped++; continue; }

          const memberName = draft.patientInfo?.name || user.name || "Member";
          const itemName   = draft.itemName || TYPE_LABEL[draft.type] || draft.type;
          const pageUrl    = PAGE_URL[draft.type] || `${BASE_URL}/dashboard`;

          const smsMsgs = {
            1: `Brims Hospitals: Hi ${memberName}! Humne notice kiya aap ${itemName} BOOK kar rahe the. Kya aapko madad chahiye? Complete karein: ${pageUrl}. Helpline: 9876543210`,
            2: `Brims Hospitals: ${memberName} ji, aapki ${itemName} booking abhi bhi adhoori hai. Team madad ke liye tayyar hai. Book karein: ${pageUrl}`,
            3: `Brims Hospitals: ${memberName} ji, yeh aapko akhri yaad dilaane ki koshish hai. ${itemName} ke liye slot jald bhar sakta hai. Book karein: ${pageUrl}`,
          };

          const smsResult = await sendSms(user.mobile, smsMsgs[levelNum] || smsMsgs[1]);
          let emailSent = false;
          if (user.email) {
            emailSent = await sendEmailReminder(user.email, memberName, itemName, draft.type, levelNum);
          }

          if (smsResult.success || emailSent) {
            await BookingDraft.findByIdAndUpdate(draft._id, { $set: { [`reminderSent.${lvl.key}`]: true } });
            totalSent++;
          } else {
            errors.push(`Draft ${draft._id} L${levelNum}: SMS+Email both failed`);
          }
        } catch (e) {
          errors.push(`Draft ${draft._id}: ${e.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent: totalSent,
      skipped: totalSkipped,
      errors: errors.length ? errors : undefined,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
