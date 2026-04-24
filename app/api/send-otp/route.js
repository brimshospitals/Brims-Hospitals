import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import { checkOtpLimit } from "../../../lib/rateLimit";

export const dynamic = "force-dynamic";

const IS_DEV = process.env.NODE_ENV !== "production" || process.env.SHOW_OTP === "true";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
}

function maskEmail(email) {
  if (!email) return "";
  const [local, domain] = email.split("@");
  return local.slice(0, 2) + "***@" + domain;
}

async function sendSmsOTP(mobile, otp) {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    // No key configured — log and continue (dev mode or testing)
    console.log(`📱 [DEV] SMS OTP for ${mobile}: ${otp}`);
    return true;
  }

  try {
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route:    "otp",
        variables_values: otp,
        flash:    0,
        numbers:  mobile,
      }),
    });
    const data = await res.json();
    if (!data.return) {
      console.error("Fast2SMS error:", data.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Fast2SMS network error:", err.message);
    return false;
  }
}

async function sendEmailOTP(email, otp) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`📧 [DEV] Email OTP for ${email}: ${otp}`);
    return true;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    "Brims Hospitals <noreply@brimshospitals.com>",
        to:      [email],
        subject: `Your Brims Login OTP: ${otp}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f8fafc;border-radius:16px;">
            <div style="text-align:center;margin-bottom:24px;">
              <h1 style="color:#0d9488;font-size:24px;margin:0;">Brims Hospitals</h1>
            </div>
            <div style="background:white;border-radius:12px;padding:24px;text-align:center;">
              <p style="color:#64748b;margin-bottom:16px;">Your login OTP is:</p>
              <div style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#0f172a;padding:16px;background:#f1f5f9;border-radius:8px;">${otp}</div>
              <p style="color:#94a3b8;font-size:13px;margin-top:16px;">Valid for 10 minutes. Do not share with anyone.</p>
            </div>
          </div>
        `,
      }),
    });
    const data = await res.json();
    if (data.statusCode && data.statusCode >= 400) {
      console.error("Resend error:", data.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend network error:", err.message);
    return false;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { identifier, flow } = body;
    // flow === "member" → Member login page se aaya (sirf mobile, email bhi bhejo agar saved hai)
    // flow undefined    → Staff/Portal login page se aaya (mobile ya email dono accept)

    if (!identifier || identifier.trim().length < 5) {
      return NextResponse.json(
        { success: false, message: "Mobile number ya email daalo" },
        { status: 400 }
      );
    }

    const cleaned   = identifier.trim().toLowerCase();
    const emailMode = isEmail(cleaned);
    const isMember  = flow === "member";

    // ── Rate limit check ──────────────────────────────────────────────────────
    const rateCheck = checkOtpLimit(cleaned);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: rateCheck.message },
        { status: 429 }
      );
    }

    // ── Member flow: sirf mobile allowed ──
    if (isMember) {
      if (emailMode) {
        return NextResponse.json(
          { success: false, message: "Member login ke liye sirf mobile number use karein" },
          { status: 400 }
        );
      }
      if (!/^\d{10}$/.test(cleaned)) {
        return NextResponse.json(
          { success: false, message: "Valid 10-digit mobile number daalo" },
          { status: 400 }
        );
      }
    } else {
      // Staff/Portal flow: mobile ya email
      if (!emailMode && !/^\d{10}$/.test(cleaned)) {
        return NextResponse.json(
          { success: false, message: "Valid 10-digit mobile ya email daalo" },
          { status: 400 }
        );
      }
    }

    await connectDB();

    const otp       = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    let user;

    if (isMember) {
      // ── Member flow: mobile se dhundo ya banao ──
      user = await User.findOne({ mobile: cleaned });
      if (!user) {
        // Naya member auto-create
        user = await User.create({
          mobile:    cleaned,
          name:      "New User",
          age:       0,
          gender:    "male",
          role:      "user",
          otp,
          otpExpiry,
        });
      } else {
        user.otp       = otp;
        user.otpExpiry = otpExpiry;
        await user.save();
      }

      // Send OTP to mobile
      await sendSmsOTP(cleaned, otp);

      // Agar user ke paas verified email hai → email par bhi bhejo
      let via        = "mobile";
      let emailMasked = "";
      if (user.email) {
        await sendEmailOTP(user.email, otp);
        via         = "both";
        emailMasked = maskEmail(user.email);
      }

      // New user detection — profile incomplete
      const isNewUser = user.age === 0 || user.name === "New User";

      return NextResponse.json({
        success: true,
        message: via === "both"
          ? `OTP +91 ${cleaned} aur ${emailMasked} par bheja gaya!`
          : `OTP +91 ${cleaned} par bheja gaya!`,
        ...(IS_DEV && { otp }),  // Only in development — NEVER in production
        via,
        emailMasked,
        isNewUser,
        userId: user._id.toString(),
      });
    }

    // ── Staff/Portal flow: mobile ya email ──
    const searchQuery = emailMode ? { email: cleaned } : { mobile: cleaned };
    user = await User.findOne(searchQuery);

    if (!user) {
      if (emailMode) {
        return NextResponse.json(
          { success: false, message: "Is email se koi account nahi mila. Admin se contact karein." },
          { status: 404 }
        );
      }
      // Mobile: naya user nahi banate for staff/portal flow
      return NextResponse.json(
        { success: false, message: "Is mobile se koi staff/doctor account nahi mila. Admin se contact karein." },
        { status: 404 }
      );
    }

    // Role check — staff/portal flow only for non-member roles
    const allowedRoles = ["admin", "staff", "doctor", "hospital", "coordinator"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, message: "Member login ke liye brims.in/login par jaiye" },
        { status: 403 }
      );
    }

    user.otp       = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    if (emailMode) {
      await sendEmailOTP(cleaned, otp);
    } else {
      await sendSmsOTP(cleaned, otp);
    }

    return NextResponse.json({
      success: true,
      message: emailMode
        ? `OTP ${cleaned} par bheja gaya!`
        : `OTP +91 ${cleaned} par bheja gaya!`,
      ...(IS_DEV && { otp }),  // Only in development — NEVER in production
      via: emailMode ? "email" : "sms",
    });

  } catch (error) {
    console.error("Send OTP Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}
