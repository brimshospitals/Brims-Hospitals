import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import LabTest from "../../../../models/LabTest";
import Hospital from "../../../../models/Hospital";
import { requireHospitalAccess } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

function generateTestId() {
  return "LAB-" + Date.now().toString(36).toUpperCase();
}

const ALL_FIELDS = [
  "name","type","labDepartment","category","packageTests",
  "description","sampleType","turnaroundTime","reportDelivery",
  "accreditation","indication",
  "mrp","offerPrice","membershipDiscount","membershipPrice",
  "homeCollection","homeCollectionCharge","memberHomeCollectionFree",
  "fastingRequired","fastingHours","preparationNotes",
  "isActive",
];

// ── Shared price validation ───────────────────────────────────────────────────
function validatePrices({ mrp, offerPrice, membershipPrice }) {
  const m  = Number(mrp);
  const o  = Number(offerPrice);
  const mp = membershipPrice != null ? Number(membershipPrice) : undefined;
  if (!mrp || m <= 0)        return "MRP 0 se zyada hona chahiye";
  if (!offerPrice || o <= 0) return "Offer price 0 se zyada honi chahiye";
  if (o > m)                 return "Offer price, MRP se zyada nahi ho sakti";
  if (mp !== undefined && mp < 0) return "Membership price negative nahi ho sakti";
  if (mp !== undefined && mp > o) return "Membership price, offer price se zyada nahi ho sakti";
  return null;
}
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const body = await request.json();
    const { hospitalId } = body;

    const { error, session } = await requireHospitalAccess(request, hospitalId);
    if (error) return error;

    if (!hospitalId || !body.name || !body.mrp || !body.offerPrice) {
      return NextResponse.json(
        { success: false, message: "hospitalId, name, mrp, offerPrice zaruri hai" },
        { status: 400 }
      );
    }

    // Price validation
    const priceErr = validatePrices({ mrp: body.mrp, offerPrice: body.offerPrice, membershipPrice: body.membershipPrice });
    if (priceErr) return NextResponse.json({ success: false, message: priceErr }, { status: 400 });

    await connectDB();

    const hospital = await Hospital.findById(hospitalId).lean();
    if (!hospital) return NextResponse.json({ success: false, message: "Hospital not found" }, { status: 404 });

    // Duplicate test check (same name in same hospital)
    const duplicate = await LabTest.findOne({
      hospitalId: hospital._id,
      name: { $regex: `^${body.name.trim()}$`, $options: "i" },
    }).lean();
    if (duplicate) {
      return NextResponse.json(
        { success: false, message: `"${body.name}" is hospital mein pehle se add hai` },
        { status: 400 }
      );
    }

    const doc = {
      testId:       generateTestId(),
      hospitalId:   hospital._id,
      hospitalName: hospital.name,
    };
    ALL_FIELDS.forEach((k) => { if (body[k] !== undefined) doc[k] = body[k]; });
    if (!doc.category) doc.category = "Blood Test";
    doc.address = {
      district: hospital.address?.district || "",
      city:     hospital.address?.city     || "",
      state:    "Bihar",
    };

    const labTest = await LabTest.create(doc);
    return NextResponse.json({ success: true, labTest });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { testId, hospitalId } = body;

    const { error, session } = await requireHospitalAccess(request, hospitalId || null);
    if (error) return error;
    if (!testId) return NextResponse.json({ success: false, message: "testId zaruri hai" }, { status: 400 });

    await connectDB();

    // Ownership check
    const existing = await LabTest.findById(testId).select("hospitalId mrp offerPrice").lean();
    if (!existing) return NextResponse.json({ success: false, message: "Lab test not found" }, { status: 404 });
    if (session.role !== "admin" && existing.hospitalId?.toString() !== hospitalId?.toString()) {
      return NextResponse.json(
        { success: false, message: "Aap is test ko edit nahi kar sakte" },
        { status: 403 }
      );
    }

    // Price validation (only if prices are being updated)
    if (body.mrp !== undefined || body.offerPrice !== undefined || body.membershipPrice !== undefined) {
      const priceErr = validatePrices({
        mrp:             body.mrp             ?? existing.mrp,
        offerPrice:      body.offerPrice      ?? existing.offerPrice,
        membershipPrice: body.membershipPrice,
      });
      if (priceErr) return NextResponse.json({ success: false, message: priceErr }, { status: 400 });
    }

    const update = {};
    ALL_FIELDS.forEach((k) => { if (body[k] !== undefined) update[k] = body[k]; });

    const labTest = await LabTest.findByIdAndUpdate(testId, { $set: update }, { new: true });
    return NextResponse.json({ success: true, labTest });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { testId, hospitalId } = await request.json();

    const { error, session } = await requireHospitalAccess(request, hospitalId || null);
    if (error) return error;
    if (!testId) return NextResponse.json({ success: false, message: "testId zaruri hai" }, { status: 400 });

    await connectDB();

    // Ownership check
    const existing = await LabTest.findById(testId).select("hospitalId").lean();
    if (!existing) return NextResponse.json({ success: false, message: "Lab test not found" }, { status: 404 });
    if (session.role !== "admin" && existing.hospitalId?.toString() !== hospitalId?.toString()) {
      return NextResponse.json(
        { success: false, message: "Aap is test ko delete nahi kar sakte" },
        { status: 403 }
      );
    }

    // Soft-delete
    await LabTest.findByIdAndUpdate(testId, {
      $set: { isActive: false, deactivatedAt: new Date() },
    });
    return NextResponse.json({ success: true, message: "Test deactivated successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}
