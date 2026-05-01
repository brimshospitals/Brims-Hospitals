import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import LabSettings from "../../../../models/LabSettings";
import Hospital    from "../../../../models/Hospital";
import { requireHospitalAccess } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// GET — fetch lab settings for a hospital (also used by print page without auth)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const hospitalId = searchParams.get("hospitalId");

  if (!hospitalId) return NextResponse.json({ success: false, message: "hospitalId required" }, { status: 400 });

  try {
    await connectDB();

    let settings = await LabSettings.findOne({ hospitalId }).lean();

    // If no custom settings yet, seed defaults from Hospital model
    if (!settings) {
      const hospital = await Hospital.findById(hospitalId)
        .select("name address mobile email website photos")
        .lean();

      if (!hospital) return NextResponse.json({ success: false, message: "Hospital not found" }, { status: 404 });

      const addr = hospital.address || {};
      const addrStr = [addr.street, addr.city, addr.district, addr.state, addr.pincode].filter(Boolean).join(", ");

      // Return defaults (not saved yet — saved on first PATCH)
      return NextResponse.json({
        success:  true,
        settings: {
          hospitalId,
          labName:     hospital.name || "",
          logoUrl:     hospital.photos?.[0] || "",
          address:     addrStr,
          phone:       hospital.mobile || "",
          email:       hospital.email  || "",
          website:     hospital.website || "",
          labRegNo:    "", nablNo: "", gstNumber: "", panNumber: "",
          invoicePrefix: "INV", cgstRate: 0, sgstRate: 0,
          pathologistName: "", pathologistQual: "", pathologistSign: "",
          technicianName:  "", technicianQual:  "", technicianSign:  "",
          useCustomLetterhead: false, letterheadUrl: "",
          invoiceFooter: "", termsText: "",
        },
        isDefault: true,
      });
    }

    return NextResponse.json({ success: true, settings, isDefault: false });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// PATCH — create or update lab settings (upsert)
export async function PATCH(request) {
  const { error, session } = await requireHospitalAccess(request);
  if (error) return error;

  try {
    await connectDB();

    const body = await request.json();
    const hId  = session.role === "admin" ? (body.hospitalId || session.hospitalMongoId) : session.hospitalMongoId;
    if (!hId) return NextResponse.json({ success: false, message: "hospitalId required" }, { status: 400 });

    const allowed = [
      "labName", "logoUrl", "address", "phone", "email", "website",
      "labRegNo", "nablNo", "gstNumber", "panNumber", "invoicePrefix",
      "cgstRate", "sgstRate",
      "pathologistName", "pathologistQual", "pathologistSign",
      "technicianName",  "technicianQual",  "technicianSign",
      "useCustomLetterhead", "letterheadUrl",
      "invoiceFooter", "termsText",
    ];

    const update = {};
    allowed.forEach(k => { if (body[k] !== undefined) update[k] = body[k]; });

    const settings = await LabSettings.findOneAndUpdate(
      { hospitalId: hId },
      { $set: { ...update, hospitalId: hId } },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json({ success: true, settings, message: "Lab settings save ho gayi!" });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
