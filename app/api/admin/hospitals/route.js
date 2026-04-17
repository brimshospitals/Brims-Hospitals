import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Hospital from "../../../../models/Hospital";
import Doctor from "../../../../models/Doctor";
import SurgeryPackage from "../../../../models/SurgeryPackage";
import LabTest from "../../../../models/LabTest";
import User from "../../../../models/User";
import { requireAuth, hashPassword } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const verified = searchParams.get("verified"); // "true" | "false" | null = all
    const search   = searchParams.get("search") || "";
    const page     = parseInt(searchParams.get("page") || "1");
    const limit    = 20;
    const detail   = searchParams.get("detail"); // if set, return single hospital detail

    await connectDB();

    // Single hospital detail
    if (detail) {
      const hosp = await Hospital.findById(detail).lean();
      if (!hosp) return NextResponse.json({ success: false, message: "Hospital not found" }, { status: 404 });
      const [doctorCount, packageCount, labCount] = await Promise.all([
        Doctor.countDocuments({ hospitalId: detail }),
        SurgeryPackage.countDocuments({ hospitalId: detail }),
        LabTest.countDocuments({ hospitalId: detail }),
      ]);
      return NextResponse.json({ success: true, hospital: hosp, doctorCount, packageCount, labCount });
    }

    const query = {};
    if (verified === "true")  query.isVerified = true;
    if (verified === "false") query.isVerified = false;
    if (search.trim()) {
      query.$or = [
        { name:           { $regex: search.trim(), $options: "i" } },
        { "address.district": { $regex: search.trim(), $options: "i" } },
        { registrationNo: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const total     = await Hospital.countDocuments(query);
    const hospitals = await Hospital.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, hospitals, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const {
      name, type, mobile, email, website,
      ownerName, spocName, spocContact,
      registrationNo, rohiniNo,
      district, city, pincode,
      departments, isVerified,
    } = await request.json();

    if (!name || !type || !mobile || !district) {
      return NextResponse.json({ success: false, message: "Naam, type, mobile aur district zaruri hai" }, { status: 400 });
    }

    await connectDB();

    const existing = await Hospital.findOne({ mobile: mobile.trim() });
    if (existing) {
      return NextResponse.json({ success: false, message: "Is mobile se hospital pehle se registered hai" }, { status: 400 });
    }

    const deptArr = Array.isArray(departments)
      ? departments
      : departments ? departments.split(",").map((d) => d.trim()).filter(Boolean) : [];

    const verified = isVerified !== false;
    const hospital = await Hospital.create({
      hospitalId:     "BRIMS-HOSP-" + Date.now().toString(36).toUpperCase(),
      name:           name.trim(),
      type,
      mobile:         mobile.trim(),
      email:          email?.trim()          || "",
      website:        website?.trim()        || "",
      ownerName:      ownerName?.trim()      || "",
      spocName:       spocName?.trim()       || "",
      spocContact:    spocContact?.trim()    || "",
      registrationNo: registrationNo?.trim() || "",
      rohiniNo:       rohiniNo?.trim()       || "",
      address: { district: district.trim(), city: city?.trim() || "", pincode: pincode?.trim() || "", state: "Bihar" },
      departments:    deptArr,
      isVerified:     verified,
      isActive:       verified,
    });

    // Create or update User account so hospital can login with mobile + password
    const defaultPw   = mobile.trim(); // default password = mobile number
    const hashedPw    = await hashPassword(defaultPw);
    const profId      = email?.trim() || mobile.trim();

    let user = await User.findOne({ mobile: mobile.trim() });
    if (user) {
      await User.findByIdAndUpdate(user._id, {
        role: "hospital",
        professionalId: profId,
        professionalPassword: hashedPw,
        professionalType: "hospital",
        hospitalId: hospital._id,
        isActive: true,
      });
    } else {
      user = await User.create({
        mobile:               mobile.trim(),
        email:                email?.trim()     || undefined,
        name:                 name.trim(),
        age:                  30,
        gender:               "male",
        role:                 "hospital",
        professionalId:       profId,
        professionalPassword: hashedPw,
        professionalType:     "hospital",
        hospitalId:           hospital._id,
        isActive:             true,
      });
    }

    // Link user back to hospital
    await Hospital.findByIdAndUpdate(hospital._id, { userId: user._id });

    return NextResponse.json({
      success: true,
      message: `${hospital.name} add ho gaya. Login: ${profId} | Default password: ${defaultPw}`,
      hospital,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const { hospitalId, isVerified, isActive } = await request.json();
    if (!hospitalId) return NextResponse.json({ success: false, message: "hospitalId required" }, { status: 400 });

    await connectDB();
    const update = {};
    if (isVerified !== undefined) update.isVerified = isVerified;
    if (isActive   !== undefined) update.isActive   = isActive;

    const hosp = await Hospital.findByIdAndUpdate(hospitalId, { $set: update }, { new: true })
      .select("name isVerified isActive").lean();
    if (!hosp) return NextResponse.json({ success: false, message: "Hospital not found" }, { status: 404 });

    const msg = isVerified === true
      ? `✅ ${hosp.name} verified!`
      : isVerified === false
        ? `❌ ${hosp.name} rejected`
        : `Updated`;
    return NextResponse.json({ success: true, message: msg, hospital: hosp });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
