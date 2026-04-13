import { NextResponse } from "next/server";
import connectDB    from "../../../lib/mongodb";
import Booking      from "../../../models/Booking";
import Doctor       from "../../../models/Doctor";
import Hospital     from "../../../models/Hospital";
import LabTest      from "../../../models/LabTest";
import SurgeryPackage from "../../../models/SurgeryPackage";
import { requireAuth } from "../../../lib/auth";

export const dynamic = "force-dynamic";

// GET /api/invoice?bookingId=BH-OPD-00001
export async function GET(request) {
  const { error, session } = await requireAuth(request, ["user", "member", "admin", "staff"]);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get("bookingId");
  if (!bookingId) {
    return NextResponse.json({ success: false, message: "bookingId zaruri hai" }, { status: 400 });
  }

  try {
    await connectDB();

    // Fetch booking — admin/staff can see any, user sees only their own
    const query = { bookingId };
    if (!["admin", "staff"].includes(session.role)) {
      query.userId = session.userId;
    }

    const booking = await Booking.findOne(query).lean();
    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking nahi mili" }, { status: 404 });
    }

    // Parse patient info from notes
    let notes = {};
    try { notes = booking.notes ? JSON.parse(booking.notes) : {}; } catch {}

    // Fetch related names (parallel)
    const [doctor, hospital, labTest, surgeryPkg] = await Promise.all([
      booking.doctorId   ? Doctor.findById(booking.doctorId).select("name department speciality").lean()   : null,
      booking.hospitalId ? Hospital.findById(booking.hospitalId).select("name address mobile").lean()      : null,
      booking.labTestId  ? LabTest.findById(booking.labTestId).select("name category").lean()              : null,
      booking.packageId  ? SurgeryPackage.findById(booking.packageId).select("name category").lean()       : null,
    ]);

    // Compute GST (18% on service fee — adjust as needed)
    // For hospital services in India, many fall under exempt category.
    // Using 0% GST by default; admin can configure.
    const gstRate  = 0;  // 0 = exempt
    const subtotal = booking.amount || 0;
    const gstAmt   = Math.round(subtotal * gstRate / 100);
    const total    = subtotal + gstAmt;

    // Promo discount info
    const promoDiscount = notes.promoDiscount ? Number(notes.promoDiscount) : 0;
    const promoCode     = notes.promoCode || null;

    const invoice = {
      // Invoice meta
      invoiceNumber: `INV-${booking.bookingId}`,
      invoiceDate:   booking.createdAt,
      bookingId:     booking.bookingId,
      // Patient
      patientName:   notes.patientName   || "—",
      patientMobile: notes.patientMobile || "—",
      patientAge:    notes.patientAge    || null,
      patientGender: notes.patientGender || null,
      // Service
      type:          booking.type,
      serviceName:   doctor    ? `OPD — Dr. ${doctor.name}`
                   : labTest   ? labTest.name
                   : surgeryPkg ? surgeryPkg.name
                   : booking.type === "Consultation" ? "Teleconsultation"
                   : booking.type,
      serviceCategory: doctor?.department || doctor?.speciality || labTest?.category || surgeryPkg?.category || "",
      appointmentDate: booking.appointmentDate,
      slot:            booking.slot || null,
      status:          booking.status,
      paymentStatus:   booking.paymentStatus,
      paymentMode:     notes.paymentMode || "counter",
      // Hospital / Doctor
      doctorName:    doctor?.name    || null,
      hospitalName:  hospital?.name  || null,
      hospitalAddr:  hospital?.address
        ? [hospital.address.street, hospital.address.district, hospital.address.state]
            .filter(Boolean).join(", ")
        : "Patna, Bihar",
      hospitalMobile: hospital?.mobile || null,
      // Amounts
      subtotal,
      promoCode,
      promoDiscount,
      gstRate,
      gstAmt,
      total,
    };

    return NextResponse.json({ success: true, invoice });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
