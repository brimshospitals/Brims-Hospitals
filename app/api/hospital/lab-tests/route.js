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

export async function POST(request) {
  try {
    const body = await request.json();
    const { hospitalId } = body;

    const { error } = await requireHospitalAccess(request, hospitalId);
    if (error) return error;

    if (!hospitalId || !body.name || !body.mrp || !body.offerPrice) {
      return NextResponse.json(
        { success: false, message: "hospitalId, name, mrp, offerPrice required" },
        { status: 400 }
      );
    }

    await connectDB();

    const hospital = await Hospital.findById(hospitalId).lean();
    if (!hospital) return NextResponse.json({ success: false, message: "Hospital not found" }, { status: 404 });

    const doc = { testId: generateTestId(), hospitalId: hospital._id, hospitalName: hospital.name };
    ALL_FIELDS.forEach(k => { if (body[k] !== undefined) doc[k] = body[k]; });

    // Default category if missing
    if (!doc.category) doc.category = "Blood Test";

    // Address always from hospital
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

    const { error } = await requireHospitalAccess(request, hospitalId || null);
    if (error) return error;
    if (!testId) return NextResponse.json({ success: false, message: "testId required" }, { status: 400 });

    await connectDB();

    const update = {};
    ALL_FIELDS.forEach(k => { if (body[k] !== undefined) update[k] = body[k]; });

    const labTest = await LabTest.findByIdAndUpdate(testId, { $set: update }, { new: true });
    if (!labTest) return NextResponse.json({ success: false, message: "Lab test not found" }, { status: 404 });
    return NextResponse.json({ success: true, labTest });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { testId, hospitalId } = await request.json();

    const { error } = await requireHospitalAccess(request, hospitalId || null);
    if (error) return error;
    if (!testId) return NextResponse.json({ success: false, message: "testId required" }, { status: 400 });

    await connectDB();
    await LabTest.findByIdAndDelete(testId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}