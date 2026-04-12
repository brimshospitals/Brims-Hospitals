import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Booking from "../../../models/Booking";
import User from "../../../models/User";
import Doctor from "../../../models/Doctor";
import Hospital from "../../../models/Hospital";
import SurgeryPackage from "../../../models/SurgeryPackage";
import LabTest from "../../../models/LabTest";
import { requireAuth } from "../../../lib/auth";

export const dynamic = "force-dynamic";

// GET: Admin dashboard stats + bookings list
export async function GET(request) {
  const { error, session } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const adminId = session.userId; // Use session, not URL param
    const type    = searchParams.get("type")   || "";
    const status  = searchParams.get("status") || "";
    const page    = parseInt(searchParams.get("page") || "1");
    const limit   = 20;

    await connectDB();
    // Session already verified by requireAuth above — no DB role check needed

    // Stats
    const [
      totalUsers,
      totalHospitals,
      pendingHospitals,
      totalDoctors,
      pendingDoctors,
      totalPackages,
      totalLabTests,
      bookingStats,
    ] = await Promise.all([
      User.countDocuments({ role: { $in: ["user", "member"] }, isActive: true }),
      Hospital.countDocuments({ isVerified: true, isActive: true }),
      Hospital.countDocuments({ isVerified: false }),
      Doctor.countDocuments({ isActive: true }),
      Doctor.countDocuments({ isActive: false }),
      SurgeryPackage.countDocuments({ isActive: true }),
      LabTest.countDocuments({ isActive: true }),
      Booking.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: "$amount" } } },
      ]),
    ]);

    const stats = {
      totalUsers,
      totalHospitals,
      pendingHospitals,
      totalDoctors,
      pendingDoctors,
      totalPackages,
      totalLabTests,
      bookings: { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 },
      revenue: { total: 0, paid: 0 },
    };

    bookingStats.forEach(({ _id, count, revenue }) => {
      stats.bookings.total  += count;
      stats.bookings[_id]    = count;
      stats.revenue.total   += revenue || 0;
    });

    // Paid revenue separately
    const paidRev = await Booking.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    stats.revenue.paid = paidRev[0]?.total || 0;

    // Bookings list with pagination
    const query = {};
    if (type)   query.type   = type;
    if (status) query.status = status;

    const total    = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId",   "name mobile memberId")
      .populate("doctorId", "name speciality")
      .lean();

    // Enrich with package/lab test names
    const enriched = await Promise.all(
      bookings.map(async (b) => {
        let extra = {};
        if (b.type === "Surgery" && b.packageId) {
          const pkg = await SurgeryPackage.findById(b.packageId).select("name hospitalName").lean();
          if (pkg) extra = { packageName: pkg.name, hospitalName: pkg.hospitalName };
        }
        if (b.type === "Lab" && b.labTestId) {
          const test = await LabTest.findById(b.labTestId).select("name hospitalName").lean();
          if (test) extra = { testName: test.name, hospitalName: test.hospitalName };
        }
        return { ...b, ...extra };
      })
    );

    return NextResponse.json({
      success: true,
      stats,
      bookings: enriched,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}

// PATCH: Update booking status
export async function PATCH(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const { bookingId, status, paymentStatus } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "bookingId zaruri hai" },
        { status: 400 }
      );
    }

    await connectDB();

    const update = {};
    if (status)        update.status        = status;
    if (paymentStatus) update.paymentStatus = paymentStatus;

    const booking = await Booking.findOneAndUpdate(
      { bookingId },
      { $set: update },
      { new: true }
    );

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking nahi mili" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Booking update ho gayi",
      booking,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}
