import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import CommissionSlab from "../../../../models/CommissionSlab";
import Hospital from "../../../../models/Hospital";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// GET — list all slabs OR single slab for a hospital (?hospitalId=xxx)
export async function GET(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const hospitalId = searchParams.get("hospitalId");

    await connectDB();

    // Single hospital slab lookup (used by HospitalDrawer)
    if (hospitalId) {
      const slab = await CommissionSlab.findOne({ hospitalId, isActive: true }).lean();
      return NextResponse.json({ success: true, slab: slab || null });
    }

    // All slabs list
    const slabs = await CommissionSlab.find({}).sort({ createdAt: -1 }).lean();

    const hospitals = await Hospital.find({ isVerified: true, isActive: true })
      .select("_id name address")
      .lean();

    const slabMap = {};
    slabs.forEach(s => { slabMap[s.hospitalId?.toString()] = s; });

    const enriched = hospitals.map(h => ({
      hospital: h,
      slab: slabMap[h._id.toString()] || null,
    }));

    return NextResponse.json({ success: true, slabs, hospitals: enriched });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// POST — create or update slab for a hospital (upsert)
export async function POST(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const { hospitalId, rates, notes, effectiveFrom } = body;

    if (!hospitalId) {
      return NextResponse.json({ success: false, message: "hospitalId zaruri hai" }, { status: 400 });
    }

    await connectDB();

    const hospital = await Hospital.findById(hospitalId).select("name").lean();
    if (!hospital) return NextResponse.json({ success: false, message: "Hospital not found" }, { status: 404 });

    const slab = await CommissionSlab.findOneAndUpdate(
      { hospitalId },
      {
        hospitalId,
        hospitalName: hospital.name,
        rates: {
          OPD:          rates?.OPD          ?? null,
          Lab:          rates?.Lab          ?? null,
          Surgery:      rates?.Surgery      ?? null,
          Consultation: rates?.Consultation ?? null,
          IPD:          rates?.IPD          ?? null,
        },
        notes:         notes || "",
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
        isActive:      true,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, slab, message: `${hospital.name} ka commission slab save ho gaya` });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// DELETE — deactivate slab (revert to defaults); preserves history for existing bookings
export async function DELETE(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const { slabId } = await request.json();
    if (!slabId) return NextResponse.json({ success: false, message: "slabId zaruri hai" }, { status: 400 });

    await connectDB();
    await CommissionSlab.findByIdAndUpdate(slabId, {
      $set: { isActive: false, deactivatedAt: new Date() },
    });
    return NextResponse.json({ success: true, message: "Slab deactivate ho gaya — ab default rates lagenge" });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}