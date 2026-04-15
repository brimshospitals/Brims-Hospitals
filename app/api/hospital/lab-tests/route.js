import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import LabTest from "../../../../models/LabTest";
import Hospital from "../../../../models/Hospital";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

function generateTestId() {
  return "LAB-" + Date.now().toString(36).toUpperCase();
}

export async function POST(request) {
  const { error } = await requireAuth(request, ["hospital", "admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const { hospitalId, name, category, mrp, offerPrice, sampleType, turnaroundTime, homeCollection, homeCollectionCharge, fastingRequired } = body;

    if (!hospitalId || !name || !mrp || !offerPrice) {
      return NextResponse.json({ success: false, message: "hospitalId, name, mrp, offerPrice required" }, { status: 400 });
    }

    await connectDB();

    const hospital = await Hospital.findById(hospitalId).lean();
    if (!hospital) return NextResponse.json({ success: false, message: "Hospital not found" }, { status: 404 });

    const labTest = await LabTest.create({
      testId: generateTestId(),
      hospitalId: hospital._id,
      hospitalName: hospital.name,
      name,
      category: category || "Blood Test",
      mrp,
      offerPrice,
      sampleType: sampleType || "",
      turnaroundTime: turnaroundTime || "Same Day",
      homeCollection: homeCollection || false,
      homeCollectionCharge: homeCollectionCharge || 0,
      fastingRequired: fastingRequired || false,
      address: {
        district: hospital.address?.district || "",
        city:     hospital.address?.city     || "",
        state:    "Bihar",
      },
    });

    return NextResponse.json({ success: true, labTest });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const { error } = await requireAuth(request, ["hospital", "admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const { testId, ...fields } = body;
    if (!testId) return NextResponse.json({ success: false, message: "testId required" }, { status: 400 });

    await connectDB();
    const allowed = ["name","category","mrp","offerPrice","membershipPrice","sampleType","turnaroundTime","homeCollection","homeCollectionCharge","fastingRequired","isActive","description"];
    const update = {};
    allowed.forEach((k) => { if (fields[k] !== undefined) update[k] = fields[k]; });

    const labTest = await LabTest.findByIdAndUpdate(testId, update, { new: true });
    if (!labTest) return NextResponse.json({ success: false, message: "Lab test not found" }, { status: 404 });
    return NextResponse.json({ success: true, labTest });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { error } = await requireAuth(request, ["hospital", "admin"]);
  if (error) return error;

  try {
    const { testId } = await request.json();
    if (!testId) return NextResponse.json({ success: false, message: "testId required" }, { status: 400 });
    await connectDB();
    await LabTest.findByIdAndDelete(testId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}
