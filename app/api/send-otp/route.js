import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import { checkOtpLimit } from "../../../lib/rateLimit";

export const dynamic = "force-dynamic";

const IS_DEV = process.env.NODE_ENV !== "production";

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
  // TODO: Fast2SMS / MSG91 integrate karein
  console.log(`📱 SMS OTP for ${mobile}: ${otp}`);
  return true;
}

async function sendEmailOTP(email, otp) {
  // TODO: Resend / Nodemailer integrate karein
  console.log(`📧 Email OTP for ${email}: ${otp}`);
  return true;
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

      return NextResponse.json({
        success: true,
        message: via === "both"
          ? `OTP +91 ${cleaned} aur ${emailMasked} par bheja gaya!`
          : `OTP +91 ${cleaned} par bheja gaya!`,
        ...(IS_DEV && { otp }),  // Only in development — NEVER in production
        via,
        emailMasked,
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
    const allowedRoles = ["admin", "staff", "doctor", "hospital"];
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
