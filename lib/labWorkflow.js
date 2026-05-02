/**
 * labWorkflow.js
 * Called when a Lab booking is confirmed (status → "confirmed").
 * Auto-creates a blank LabReport from the matching template + an Invoice.
 */
import LabReport   from "../models/LabReport";
import Invoice     from "../models/Invoice";
import LabTest     from "../models/LabTest";
import LabTemplate from "../models/LabTemplate";
import Hospital    from "../models/Hospital";
import LabSettings from "../models/LabSettings";

// ── ID generators (sort-based, race handled by E11000 retry at call site) ─────
async function genReportId() {
  const last = await LabReport.findOne({}, { reportId: 1 }).sort({ _id: -1 }).lean();
  if (!last?.reportId) return "LR-00001";
  const m = last.reportId.match(/^LR-(\d+)$/);
  return `LR-${String((m ? parseInt(m[1], 10) : 0) + 1).padStart(5, "0")}`;
}

async function genInvoiceId() {
  const last = await Invoice.findOne({}, { invoiceId: 1 }).sort({ _id: -1 }).lean();
  if (!last?.invoiceId) return "INV-00001";
  const m = last.invoiceId.match(/^INV-(\d+)$/);
  return `INV-${String((m ? parseInt(m[1], 10) : 0) + 1).padStart(5, "0")}`;
}

// ── Escape regex special chars ─────────────────────────────────────────────
function escRx(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── Main export ────────────────────────────────────────────────────────────────
/**
 * autoProvisionLabBooking(booking)
 * booking — Mongoose doc or lean object from Booking model
 * Returns { reportId, invoiceId } or null if not a Lab booking.
 * Safe to call multiple times — idempotent via bookingId check.
 */
export async function autoProvisionLabBooking(booking) {
  if (!booking || booking.type !== "Lab") return null;

  // ── 1. Look up the LabTest (also used to resolve hospitalId if missing) ───
  let labTest = null;
  if (booking.labTestId) {
    labTest = await LabTest.findById(booking.labTestId).lean();
  }

  // Resolve hospitalId — from booking or from the LabTest record
  let hospitalId = booking.hospitalId?.toString();
  if (!hospitalId && labTest?.hospitalId) {
    hospitalId = labTest.hospitalId.toString();
  }
  if (!hospitalId) return null;

  // Parse patient info from notes JSON
  let notes = {};
  try { notes = booking.notes ? JSON.parse(booking.notes) : {}; } catch {}

  const patientName   = notes.patientName   || "Patient";
  const patientMobile = notes.patientMobile || "";
  const patientAge    = notes.patientAge    ? +notes.patientAge : undefined;
  const patientGender = notes.patientGender || "male";

  // Idempotency — if a report already exists for this booking, skip
  const bookingRef = booking.bookingId || booking._id?.toString();
  const existing   = await LabReport.findOne({ bookingId: bookingRef }).lean();
  if (existing) return { reportId: existing.reportId, alreadyExisted: true };

  const testName   = labTest?.name       || "Lab Test";
  const category   = labTest?.category   || "Blood Test";
  const sampleType = labTest?.sampleType || "Blood";
  const testPrice  = labTest?.offerPrice || booking.amount || 0;

  // ── 2. Find the best matching LabTemplate ────────────────────────────────
  let template = null;

  // 2a. Direct link on LabTest
  if (labTest?.templateId) {
    template = await LabTemplate.findById(labTest.templateId).lean();
  }

  // 2b. Exact name match in same hospital
  if (!template) {
    template = await LabTemplate.findOne({
      hospitalId,
      isActive: true,
      name: { $regex: new RegExp(`^${escRx(testName)}$`, "i") },
    }).lean();
  }

  // 2c. Substring match — test name contains template name or vice versa
  if (!template) {
    template = await LabTemplate.findOne({
      hospitalId,
      isActive: true,
      $or: [
        { name: { $regex: escRx(testName),  $options: "i" } },
        { name: { $regex: escRx(testName.split(" ").filter(w => w.length > 3).join("|")), $options: "i" } },
      ],
    }).lean();
  }

  // ── 3. Build blank result rows from template parameters ───────────────────
  const results = (template?.parameters || [])
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((p) => ({
      paramId:      p.paramId,
      name:         p.name,
      value:        "",
      unit:         p.unit         || "",
      refRangeText: p.refRangeText || "",
      flag:         "",
      type:         p.type         || "numeric",
      section:      p.section      || "",
    }));

  // ── 4. Hospital name ───────────────────────────────────────────────────────
  const hospital = await Hospital.findById(hospitalId).select("name").lean();
  const hospName = hospital?.name || "";

  // ── 5. Create LabReport ────────────────────────────────────────────────────
  let report  = null;
  let attempt = 0;
  while (attempt < 3) {
    try {
      report = await LabReport.create({
        reportId:      await genReportId(),
        hospitalId,
        hospitalName:  hospName,
        bookingId:     bookingRef,
        templateId:    template?._id || undefined,
        templateName:  template?.name || testName,
        category,
        sampleType,
        patientName,
        patientAge,
        patientGender,
        patientMobile,
        results,
        status:        "draft",
        collectionDate: booking.appointmentDate || new Date(),
        reportDate:     booking.appointmentDate || new Date(),
      });
      break;
    } catch (e) {
      if (e.code === 11000 && attempt < 2) { attempt++; continue; }
      throw e;
    }
  }

  // ── 6. Create Invoice ──────────────────────────────────────────────────────
  let invoice = null;
  try {
    const labSettings = await LabSettings.findOne({ hospitalId }).lean();
    const cgstRate   = labSettings?.cgstRate || 0;
    const sgstRate   = labSettings?.sgstRate || 0;
    const taxableAmt = +testPrice;
    const cgstAmt    = +(taxableAmt * cgstRate / 100).toFixed(2);
    const sgstAmt    = +(taxableAmt * sgstRate / 100).toFixed(2);
    const lineAmt    = +(taxableAmt + cgstAmt + sgstAmt).toFixed(2);

    // Payment already collected?
    const alreadyPaid = booking.paymentStatus === "paid";

    let invAttempt = 0;
    while (invAttempt < 3) {
      try {
        invoice = await Invoice.create({
          invoiceId:     await genInvoiceId(),
          hospitalId,
          hospitalName:  hospName,
          patientName,
          patientMobile,
          patientAge,
          patientGender,
          labReportId:   report?.reportId || "",
          bookingId:     bookingRef,
          items: [{
            description: testName,
            hsnCode:     "999312",
            quantity:    1,
            rate:        taxableAmt,
            discount:    0,
            taxableAmt,
            cgstRate,
            cgstAmt,
            sgstRate,
            sgstAmt,
            amount:      lineAmt,
          }],
          subtotal:      taxableAmt,
          totalCgst:     cgstAmt,
          totalSgst:     sgstAmt,
          totalTax:      +(cgstAmt + sgstAmt).toFixed(2),
          roundOff:      0,
          totalAmount:   lineAmt,
          paymentMode:   notes.paymentMode || "Cash",
          paidAmount:    alreadyPaid ? lineAmt : 0,
          balanceAmount: alreadyPaid ? 0       : lineAmt,
          status:        alreadyPaid ? "paid"  : "draft",
        });
        break;
      } catch (e) {
        if (e.code === 11000 && invAttempt < 2) { invAttempt++; continue; }
        // Invoice failure is non-fatal — report was created
        break;
      }
    }
  } catch { /* Invoice failure is non-fatal */ }

  return {
    reportId:  report?.reportId  || null,
    invoiceId: invoice?.invoiceId || null,
  };
}
