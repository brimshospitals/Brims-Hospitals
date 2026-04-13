import { NextResponse } from "next/server";
import connectDB      from "../../../lib/mongodb";
import PromoCode      from "../../../models/PromoCode";
import { requireAuth } from "../../../lib/auth";

export const dynamic = "force-dynamic";

// POST — Validate & apply a promo code (patient side)
export async function POST(request) {
  const { error, session } = await requireAuth(request, ["user", "member", "admin"]);
  if (error) return error;

  try {
    const { code, amount, bookingType } = await request.json();

    if (!code || !amount || !bookingType) {
      return NextResponse.json({ success: false, message: "code, amount aur bookingType zaruri hain" }, { status: 400 });
    }

    await connectDB();

    const promo = await PromoCode.findOne({ code: code.trim().toUpperCase(), isActive: true });

    if (!promo) {
      return NextResponse.json({ success: false, message: "Invalid promo code" }, { status: 404 });
    }

    // Check booking type applicability
    if (!promo.applicableOn.includes(bookingType)) {
      return NextResponse.json({ success: false, message: `Yeh code sirf ${promo.applicableOn.join("/")} bookings pe apply hota hai` }, { status: 400 });
    }

    // Check expiry
    if (promo.validUntil && new Date() > promo.validUntil) {
      return NextResponse.json({ success: false, message: "Yeh promo code expire ho gaya hai" }, { status: 400 });
    }

    // Check valid from
    if (promo.validFrom && new Date() < promo.validFrom) {
      return NextResponse.json({ success: false, message: "Yeh promo code abhi active nahi hai" }, { status: 400 });
    }

    // Check usage limit
    if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
      return NextResponse.json({ success: false, message: "Yeh promo code ki limit khatam ho gayi hai" }, { status: 400 });
    }

    // Check minimum amount
    if (amount < promo.minAmount) {
      return NextResponse.json({ success: false, message: `Minimum booking amount ₹${promo.minAmount} hona chahiye` }, { status: 400 });
    }

    // Calculate discount
    let discount = 0;
    if (promo.discountType === "flat") {
      discount = Math.min(promo.discountValue, amount);
    } else {
      discount = Math.round((amount * promo.discountValue) / 100);
      if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
    }

    const finalAmount = Math.max(0, amount - discount);

    return NextResponse.json({
      success: true,
      message: `🎉 ${promo.discountType === "flat" ? `₹${discount}` : `${promo.discountValue}% (₹${discount})`} discount apply hua!`,
      promoId:      promo._id.toString(),
      code:         promo.code,
      description:  promo.description,
      discountType: promo.discountType,
      discountValue:promo.discountValue,
      discount,
      finalAmount,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// Admin routes — GET (list), PUT (create/update), DELETE
export async function GET(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    await connectDB();
    const promos = await PromoCode.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, promos });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const { error, session } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const { _id, code, description, discountType, discountValue, maxDiscount,
            minAmount, usageLimit, validFrom, validUntil, applicableOn, isActive } = body;

    if (!code || !discountType || !discountValue) {
      return NextResponse.json({ success: false, message: "code, discountType aur discountValue zaruri hain" }, { status: 400 });
    }

    await connectDB();

    const payload = {
      code: code.trim().toUpperCase(),
      description: description || "",
      discountType,
      discountValue: Number(discountValue),
      maxDiscount:   maxDiscount  ? Number(maxDiscount)  : null,
      minAmount:     minAmount    ? Number(minAmount)     : 0,
      usageLimit:    usageLimit   ? Number(usageLimit)    : null,
      validFrom:     validFrom    ? new Date(validFrom)   : new Date(),
      validUntil:    validUntil   ? new Date(validUntil)  : null,
      applicableOn:  applicableOn || ["OPD","Lab","Surgery","Consultation"],
      isActive:      isActive !== false,
    };

    let promo;
    if (_id) {
      promo = await PromoCode.findByIdAndUpdate(_id, payload, { new: true });
    } else {
      payload.createdBy = session.userId;
      promo = await PromoCode.create(payload);
    }

    return NextResponse.json({ success: true, message: _id ? "Code update ho gaya" : "Code create ho gaya", promo });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ success: false, message: "Yeh code pehle se exist karta hai" }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, message: "id zaruri hai" }, { status: 400 });

    await connectDB();
    await PromoCode.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Code delete ho gaya" });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
