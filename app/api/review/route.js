import { NextResponse } from "next/server";
import connectDB      from "../../../lib/mongodb";
import Review         from "../../../models/Review";
import Booking        from "../../../models/Booking";
import Doctor         from "../../../models/Doctor";
import Hospital       from "../../../models/Hospital";
import { requireAuth } from "../../../lib/auth";

export const dynamic = "force-dynamic";

// POST — Submit a review for a completed booking
export async function POST(request) {
  const { error, session } = await requireAuth(request, ["user", "member"]);
  if (error) return error;

  try {
    const { bookingId, rating, comment } = await request.json();

    if (!bookingId || !rating) {
      return NextResponse.json({ success: false, message: "bookingId aur rating zaruri hai" }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, message: "Rating 1 se 5 ke beech honi chahiye" }, { status: 400 });
    }

    await connectDB();

    // Verify booking belongs to this user and is completed
    const booking = await Booking.findById(bookingId).lean();
    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking nahi mili" }, { status: 404 });
    }
    if (booking.userId.toString() !== session.userId) {
      return NextResponse.json({ success: false, message: "Ye booking aapki nahi hai" }, { status: 403 });
    }
    if (booking.status !== "completed") {
      return NextResponse.json({ success: false, message: "Sirf completed bookings pe review de sakte hain" }, { status: 400 });
    }

    // Check duplicate
    const existing = await Review.findOne({ bookingId: booking._id });
    if (existing) {
      return NextResponse.json({ success: false, message: "Is booking ka review pehle se diya ja chuka hai" }, { status: 400 });
    }

    // Determine target (doctor for OPD/Consultation, hospital for Lab/Surgery)
    let targetType, targetId, doctorName = "", hospitalName = "";

    if (booking.doctorId && (booking.type === "OPD" || booking.type === "Consultation")) {
      targetType = "doctor";
      targetId   = booking.doctorId;
      const doc  = await Doctor.findById(targetId).select("name rating totalReviews").lean();
      if (doc) {
        doctorName = doc.name;
        // Recalculate doctor rating
        const newTotal  = (doc.totalReviews || 0) + 1;
        const newRating = (((doc.rating || 0) * (doc.totalReviews || 0)) + rating) / newTotal;
        await Doctor.findByIdAndUpdate(targetId, { rating: Math.round(newRating * 10) / 10, totalReviews: newTotal });
      }
    } else if (booking.hospitalId) {
      targetType = "hospital";
      targetId   = booking.hospitalId;
      const hosp = await Hospital.findById(targetId).select("name rating totalReviews").lean();
      if (hosp) {
        hospitalName = hosp.name;
        const newTotal  = (hosp.totalReviews || 0) + 1;
        const newRating = (((hosp.rating || 0) * (hosp.totalReviews || 0)) + rating) / newTotal;
        await Hospital.findByIdAndUpdate(targetId, { rating: Math.round(newRating * 10) / 10, totalReviews: newTotal });
      }
    } else {
      return NextResponse.json({ success: false, message: "Is booking ke liye review nahi de sakte (no doctor/hospital linked)" }, { status: 400 });
    }

    // Parse patient name from notes
    let patientName = session.name || "";
    try {
      const n = booking.notes ? JSON.parse(booking.notes) : {};
      if (n.patientName) patientName = n.patientName;
    } catch {}

    const review = await Review.create({
      bookingId:    booking._id,
      userId:       session.userId,
      doctorId:     targetType === "doctor"   ? targetId : undefined,
      hospitalId:   targetType === "hospital" ? targetId : undefined,
      targetType,
      rating,
      comment:      comment?.trim() || "",
      patientName,
      doctorName,
      hospitalName,
      bookingType:  booking.type,
    });

    return NextResponse.json({ success: true, message: "Review submit ho gaya! Shukriya 🙏", review });

  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: "Is booking ka review pehle se diya ja chuka hai" }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// GET — Fetch reviews for a doctor or hospital (public)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId   = searchParams.get("doctorId");
    const hospitalId = searchParams.get("hospitalId");
    const bookingId  = searchParams.get("bookingId");

    await connectDB();

    // Check if a specific booking already has a review
    if (bookingId) {
      const review = await Review.findOne({ bookingId }).lean();
      return NextResponse.json({ success: true, reviewed: !!review, review: review || null });
    }

    const query = doctorId ? { doctorId, targetType: "doctor" } : { hospitalId, targetType: "hospital" };
    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ success: true, reviews });

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
