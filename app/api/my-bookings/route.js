import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Booking from "../../../models/Booking";
import Doctor from "../../../models/Doctor";
import SurgeryPackage from "../../../models/SurgeryPackage";
import LabTest from "../../../models/LabTest";
import FamilyCard from "../../../models/FamilyCard";
import User from "../../../models/User";
import Review from "../../../models/Review";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId zaruri hai" },
        { status: 400 }
      );
    }

    await connectDB();

    // Family card mein sare members ke bookings bhi laao
    const user = await User.findById(userId);
    const memberIds = [userId];

    if (user?.familyCardId) {
      const familyCard = await FamilyCard.findById(user.familyCardId);
      if (familyCard?.members?.length) {
        familyCard.members.forEach((id) => memberIds.push(id.toString()));
      }
    }

    const query = { userId: { $in: memberIds } };
    if (type) query.type = type;
    if (status) query.status = status;

    const bookings = await Booking.find(query).sort({ createdAt: -1 }).lean();

    // Populate related data for each booking
    const enriched = await Promise.all(
      bookings.map(async (b) => {
        let extra = {};

        if (b.type === "OPD" && b.doctorId) {
          const doc = await Doctor.findById(b.doctorId)
            .select("name speciality hospitalName photo")
            .lean();
          if (doc) extra = { doctorName: doc.name, speciality: doc.speciality, doctorPhoto: doc.photo, hospitalName: doc.hospitalName };
        }

        if (b.type === "Surgery" && b.packageId) {
          const pkg = await SurgeryPackage.findById(b.packageId)
            .select("name category hospitalName")
            .lean();
          if (pkg) extra = { packageName: pkg.name, category: pkg.category, hospitalName: pkg.hospitalName };
        }

        if (b.type === "Lab" && b.labTestId) {
          const test = await LabTest.findById(b.labTestId)
            .select("name category hospitalName")
            .lean();
          if (test) extra = { testName: test.name, category: test.category, hospitalName: test.hospitalName };
        }

        // Parse patient info from notes
        let notesData = {};
        try { notesData = b.notes ? JSON.parse(b.notes) : {}; } catch {}

        // Check if already reviewed (only for completed bookings)
        let reviewed = false, reviewRating = 0;
        if (b.status === "completed") {
          const rev = await Review.findOne({ bookingId: b._id }).select("rating").lean();
          if (rev) { reviewed = true; reviewRating = rev.rating; }
        }

        return { ...b, ...extra, ...notesData, reviewed, reviewRating };
      })
    );

    // Summary counts
    const summary = {
      total: enriched.length,
      pending: enriched.filter((b) => b.status === "pending").length,
      confirmed: enriched.filter((b) => b.status === "confirmed").length,
      completed: enriched.filter((b) => b.status === "completed").length,
      cancelled: enriched.filter((b) => b.status === "cancelled").length,
    };

    return NextResponse.json({ success: true, bookings: enriched, summary });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}

// PATCH — Cancel a booking (patient side)
export async function PATCH(request) {
  try {
    const { bookingId, userId } = await request.json();
    if (!bookingId || !userId) {
      return NextResponse.json({ success: false, message: "bookingId aur userId zaruri hai" }, { status: 400 });
    }

    await connectDB();

    const booking = await Booking.findOne({ bookingId, userId });
    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking nahi mili" }, { status: 404 });
    }
    if (["completed", "cancelled"].includes(booking.status)) {
      return NextResponse.json({ success: false, message: "Yeh booking already " + booking.status + " hai" }, { status: 400 });
    }

    booking.status = "cancelled";

    // Wallet refund if payment was via wallet and was paid
    let refunded = 0;
    if (booking.paymentStatus === "paid" && booking.amount > 0) {
      let notesData = {};
      try { notesData = booking.notes ? JSON.parse(booking.notes) : {}; } catch {}
      if (notesData.paymentMode === "wallet") {
        await User.findByIdAndUpdate(userId, { $inc: { walletBalance: booking.amount } });
        booking.paymentStatus = "refunded";
        refunded = booking.amount;
      }
    }

    await booking.save();

    return NextResponse.json({
      success: true,
      message: refunded > 0
        ? `Booking cancel ho gayi. ₹${refunded} wallet mein wapas aa jayenge.`
        : "Booking cancel ho gayi.",
      refunded,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}
