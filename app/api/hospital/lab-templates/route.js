import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import LabTemplate from "../../../../models/LabTemplate";
import { requireHospitalAccess } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// GET — list templates for hospital
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const hospitalId = searchParams.get("hospitalId");
  if (!hospitalId) return NextResponse.json({ success: false, message: "hospitalId required" }, { status: 400 });

  await connectDB();
  const templates = await LabTemplate.find({ hospitalId, isActive: true }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ success: true, templates });
}

// POST — create template
export async function POST(request) {
  const { error, session } = await requireHospitalAccess(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { name, category, department, parameters, hospitalId } = body;
    if (!name) return NextResponse.json({ success: false, message: "Template name zaruri hai" }, { status: 400 });

    const hId = session.role === "admin" ? hospitalId : session.hospitalMongoId;
    if (!hId) return NextResponse.json({ success: false, message: "hospitalId required" }, { status: 400 });

    await connectDB();

    const template = await LabTemplate.create({
      hospitalId: hId,
      name: name.trim(),
      category: category || "Blood Test",
      department: department || "",
      parameters: (parameters || []).map((p, i) => ({ ...p, order: i })),
    });

    return NextResponse.json({ success: true, template, message: "Template create ho gaya!" });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// PATCH — update template
export async function PATCH(request) {
  const { error } = await requireHospitalAccess(request);
  if (error) return error;

  try {
    const { id, ...fields } = await request.json();
    if (!id) return NextResponse.json({ success: false, message: "id required" }, { status: 400 });

    await connectDB();

    const allowed = ["name", "category", "department", "parameters", "isActive"];
    const update = {};
    allowed.forEach((k) => { if (fields[k] !== undefined) update[k] = fields[k]; });

    const template = await LabTemplate.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!template) return NextResponse.json({ success: false, message: "Template not found" }, { status: 404 });

    return NextResponse.json({ success: true, template, message: "Template update ho gaya!" });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// DELETE — delete template
export async function DELETE(request) {
  const { error } = await requireHospitalAccess(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, message: "id required" }, { status: 400 });

  await connectDB();
  await LabTemplate.findByIdAndUpdate(id, { isActive: false });
  return NextResponse.json({ success: true, message: "Template delete ho gaya!" });
}