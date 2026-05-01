import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Invoice     from "../../../../models/Invoice";
import Hospital    from "../../../../models/Hospital";
import LabSettings from "../../../../models/LabSettings";
import { requireHospitalAccess } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function genInvoiceId(prefix = "INV") {
  const last = await Invoice.findOne({}, { invoiceId: 1 }).sort({ createdAt: -1 }).lean();
  if (!last?.invoiceId) return `${prefix}-00001`;
  const m   = last.invoiceId.match(/^[A-Z]+-(\d+)$/);
  const num = m ? parseInt(m[1], 10) : 0;
  return `${prefix}-${String(num + 1).padStart(5, "0")}`;
}

// GET — list invoices OR single invoice (with lab settings for print)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const invoiceId  = searchParams.get("invoiceId");

  await connectDB();

  // Single invoice (used by print page — open access via invoiceId)
  if (invoiceId) {
    const invoice = await Invoice.findOne({ invoiceId, isActive: true }).lean();
    if (!invoice) return NextResponse.json({ success: false, message: "Invoice not found" }, { status: 404 });

    const [hospital, labSettings] = await Promise.all([
      Hospital.findById(invoice.hospitalId).select("name address mobile email website photos").lean(),
      LabSettings.findOne({ hospitalId: invoice.hospitalId }).lean(),
    ]);

    return NextResponse.json({ success: true, invoice, hospital, labSettings });
  }

  // List — requires auth
  const { error, session } = await requireHospitalAccess(request);
  if (error) return error;

  const hospitalId = session.role === "admin" ? searchParams.get("hospitalId") : session.hospitalMongoId;
  const isAdminAll = session.role === "admin" && !hospitalId;
  if (!hospitalId && !isAdminAll) return NextResponse.json({ success: false, message: "hospitalId required" }, { status: 400 });

  let page  = parseInt(searchParams.get("page")  || "1",  10);
  let limit = parseInt(searchParams.get("limit") || "20", 10);
  if (isNaN(page)  || page  < 1) page  = 1;
  if (isNaN(limit) || limit < 1 || limit > 100) limit = 20;

  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const q = { isActive: true };
  if (hospitalId) q.hospitalId = hospitalId;
  if (status) q.status = status;
  if (search.trim()) {
    const esc = escapeRegex(search.trim());
    q.$or = [
      { patientName:  { $regex: esc, $options: "i" } },
      { invoiceId:    { $regex: esc, $options: "i" } },
      { hospitalName: { $regex: esc, $options: "i" } },
      { patientMobile:{ $regex: esc, $options: "i" } },
    ];
  }

  const [invoices, total] = await Promise.all([
    Invoice.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Invoice.countDocuments(q),
  ]);

  return NextResponse.json({ success: true, invoices, total, page, pages: Math.ceil(total / limit) });
}

// POST — create invoice
export async function POST(request) {
  const { error, session } = await requireHospitalAccess(request);
  if (error) return error;

  try {
    await connectDB();

    const body = await request.json();
    const { patientName, patientMobile, patientAge, patientGender, patientAddress,
            labReportId, bookingId, items, paymentMode, paidAmount, notes, invoiceDate } = body;

    if (!patientName?.trim()) {
      return NextResponse.json({ success: false, message: "Patient naam zaruri hai" }, { status: 400 });
    }
    if (!items?.length) {
      return NextResponse.json({ success: false, message: "Kam se kam ek item add karein" }, { status: 400 });
    }

    const hId = session.role === "admin" ? (body.hospitalId || session.hospitalMongoId) : session.hospitalMongoId;
    if (!hId) return NextResponse.json({ success: false, message: "hospitalId required" }, { status: 400 });

    const [hospital, labSettings] = await Promise.all([
      Hospital.findById(hId).select("name").lean(),
      LabSettings.findOne({ hospitalId: hId }).lean(),
    ]);

    // Calculate totals
    let subtotal = 0;
    let totalCgst = 0, totalSgst = 0;

    const processedItems = items.map((item) => {
      const taxable = (item.quantity * item.rate) - (item.discount || 0);
      const cgst    = +(taxable * ((item.cgstRate || labSettings?.cgstRate || 0) / 100)).toFixed(2);
      const sgst    = +(taxable * ((item.sgstRate || labSettings?.sgstRate || 0) / 100)).toFixed(2);
      const amount  = +(taxable + cgst + sgst).toFixed(2);
      subtotal   += taxable;
      totalCgst  += cgst;
      totalSgst  += sgst;
      return {
        description: item.description,
        hsnCode:     item.hsnCode    || "999312",
        quantity:    item.quantity   || 1,
        rate:        item.rate,
        discount:    item.discount   || 0,
        taxableAmt:  taxable,
        cgstRate:    item.cgstRate   || labSettings?.cgstRate || 0,
        sgstRate:    item.sgstRate   || labSettings?.sgstRate || 0,
        cgstAmt:     cgst,
        sgstAmt:     sgst,
        amount,
      };
    });

    const totalTax    = +(totalCgst + totalSgst).toFixed(2);
    const rawTotal    = +(subtotal + totalTax).toFixed(2);
    const roundOff    = +(Math.round(rawTotal) - rawTotal).toFixed(2);
    const totalAmount = +(rawTotal + roundOff).toFixed(2);
    const paid        = paidAmount !== undefined ? +paidAmount : totalAmount;
    const balance     = +(totalAmount - paid).toFixed(2);

    // Get invoice prefix from lab settings
    const prefix    = labSettings?.invoicePrefix || "INV";
    let invoice     = null;
    let attempts    = 0;

    while (attempts < 3) {
      try {
        const invoiceIdStr = await genInvoiceId(prefix);
        invoice = await Invoice.create({
          invoiceId:    invoiceIdStr,
          hospitalId:   hId,
          hospitalName: hospital?.name || "",
          patientName:  patientName.trim(),
          patientMobile, patientAge, patientGender,
          patientAddress: patientAddress || "",
          labReportId:  labReportId || "",
          bookingId:    bookingId   || "",
          items:        processedItems,
          subtotal:     +subtotal.toFixed(2),
          totalCgst,
          totalSgst,
          totalTax,
          roundOff,
          totalAmount,
          paymentMode:   paymentMode   || "Cash",
          paidAmount:    paid,
          balanceAmount: balance,
          status:        balance <= 0 ? "paid" : (paid > 0 ? "partial" : "draft"),
          invoiceDate:   invoiceDate ? new Date(invoiceDate) : new Date(),
          notes:         notes || "",
        });
        break;
      } catch (e) {
        if (e.code === 11000 && attempts < 2) { attempts++; continue; }
        throw e;
      }
    }

    return NextResponse.json({ success: true, invoice, message: "Invoice create ho gayi!" });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// PATCH — update status / notes / paid amount
export async function PATCH(request) {
  const { error } = await requireHospitalAccess(request);
  if (error) return error;

  try {
    await connectDB();
    const { id, status, notes, paidAmount, isActive } = await request.json();
    if (!id) return NextResponse.json({ success: false, message: "id required" }, { status: 400 });

    const update = {};
    if (status    !== undefined) update.status    = status;
    if (notes     !== undefined) update.notes     = notes;
    if (isActive  !== undefined) update.isActive  = isActive;
    if (paidAmount !== undefined) {
      update.paidAmount = paidAmount;
      // Recalculate balance and auto-set status
      const existing = await Invoice.findById(id).select("totalAmount").lean();
      if (existing) {
        const newBalance = +(existing.totalAmount - paidAmount).toFixed(2);
        update.balanceAmount = newBalance;
        if (!status) {
          update.status = newBalance <= 0 ? "paid" : (paidAmount > 0 ? "partial" : "draft");
        }
      }
    }

    const inv = await Invoice.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!inv) return NextResponse.json({ success: false, message: "Invoice nahi mili" }, { status: 404 });

    return NextResponse.json({ success: true, invoice: inv, message: "Invoice update ho gayi!" });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
