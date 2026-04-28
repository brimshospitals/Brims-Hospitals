import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Doctor from "../../../../models/Doctor";
import Hospital from "../../../../models/Hospital";
import User from "../../../../models/User";
import { requireAuth, hashPassword } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const search     = searchParams.get("search")     || "";
    const hospital   = searchParams.get("hospital")   || "";
    const department = searchParams.get("department") || "";
    const pending    = searchParams.get("pending")    === "true"; // only isActive=false
    const page       = parseInt(searchParams.get("page") || "1");
    const limit      = 30;

    await connectDB();

    const query = {};
    if (pending)         query.isActive  = false;
    if (hospital)        query.hospitalId = hospital;
    if (department)      query.department = { $regex: department, $options: "i" };
    if (search.trim()) {
      query.$or = [
        { name:       { $regex: search.trim(), $options: "i" } },
        { mobile:     { $regex: search.trim(), $options: "i" } },
        { department: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const total   = await Doctor.countDocuments(query);
    const doctors = await Doctor.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Attach hospital name
    const hospitalIds = [...new Set(doctors.map((d) => d.hospitalId?.toString()).filter(Boolean))];
    const hospitals   = await Hospital.find({ _id: { $in: hospitalIds } }).select("name").lean();
    const hospMap     = {};
    hospitals.forEach((h) => { hospMap[h._id.toString()] = h.name; });

    const enriched = doctors.map((d) => ({
      ...d,
      hospitalName: d.hospitalId ? (hospMap[d.hospitalId.toString()] || "Unknown Hospital") : null,
    }));

    return NextResponse.json({ success: true, doctors: enriched, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const { name, mobile, email, department, speciality, degrees, experience, opdFee, offerFee,
      hospitalId, hospitalName: privateHospName, isActive,
      registrationNumber, collegeUG, collegePG, collegeMCH, about,
      district, city, address,
      availableSlots, onlineAvailable, onlineFee, onlineSlots,
      previousExperience, awards, photo } = body;

    if (!name || !department || !opdFee) {
      return NextResponse.json({ success: false, message: "Name, department aur OPD fee zaruri hai" }, { status: 400 });
    }

    await connectDB();

    let resolvedHospitalName = privateHospName || "";
    if (hospitalId) {
      const hosp = await Hospital.findById(hospitalId).select("name").lean();
      if (hosp) resolvedHospitalName = hosp.name;
    }

    const degreesArr = Array.isArray(degrees)
      ? degrees
      : degrees ? degrees.split(",").map((d) => ({ degree: d.trim(), university: "", year: null })).filter(d => d.degree) : [];

    const active = isActive !== false;
    const resolvedDistrict = address?.district || district || "";
    const resolvedCity     = address?.city     || city     || "";

    const doctor = await Doctor.create({
      name:               name.trim(),
      mobile:             mobile?.trim()     || "",
      email:              email?.trim()      || "",
      photo:              photo              || "",
      department,
      speciality:         speciality         || "",
      degrees:            degreesArr,
      experience:         Number(experience) || 0,
      opdFee:             Number(opdFee),
      offerFee:           Number(offerFee)   || Number(opdFee),
      registrationNumber: registrationNumber || undefined,
      collegeUG:          collegeUG          || "",
      collegePG:          collegePG          || "",
      collegeMCH:         collegeMCH         || "",
      about:              about              || "",
      availableSlots:     availableSlots     || [],
      onlineAvailable:    onlineAvailable    || false,
      onlineFee:          onlineFee          || 0,
      onlineSlots:        onlineSlots        || [],
      previousExperience: previousExperience || [],
      awards:             awards             || [],
      hospitalId:         hospitalId         || undefined,
      hospitalName:       resolvedHospitalName,
      address: { district: resolvedDistrict, city: resolvedCity, state: "Bihar" },
      isActive:    active,
      isAvailable: active,
    });

    // Create or update User account so doctor can login
    if (mobile?.trim()) {
      const defaultPw = mobile.trim();
      const hashedPw  = await hashPassword(defaultPw);
      const profId    = email?.trim() || mobile.trim();

      let user = await User.findOne({ mobile: mobile.trim() });
      if (user) {
        await User.findByIdAndUpdate(user._id, {
          role: "doctor", professionalId: profId,
          professionalPassword: hashedPw, professionalType: "doctor",
          doctorId: doctor._id, isActive: true,
        });
      } else {
        user = await User.create({
          mobile: mobile.trim(), email: email?.trim() || undefined, name: name.trim(),
          age: 30, gender: "male", role: "doctor",
          professionalId: profId, professionalPassword: hashedPw,
          professionalType: "doctor", doctorId: doctor._id, isActive: true,
        });
      }
      await Doctor.findByIdAndUpdate(doctor._id, { userId: user._id });
    }

    return NextResponse.json({
      success: true,
      message: `Dr. ${doctor.name} add ho gaye. Login: ${mobile?.trim() || "no mobile"} | Default password: ${mobile?.trim() || "N/A"}`,
      doctor,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const { doctorId, address, ...fields } = await request.json();
    if (!doctorId) return NextResponse.json({ success: false, message: "doctorId required" }, { status: 400 });

    await connectDB();

    const allowed = [
      "name","mobile","email","photo","department","speciality","degrees","experience",
      "opdFee","offerFee","registrationNumber","collegeUG","collegePG","collegeMCH","about",
      "availableSlots","onlineAvailable","onlineFee","onlineSlots",
      "previousExperience","awards","isActive","isAvailable","hospitalId",
    ];
    const update = {};
    allowed.forEach((k) => { if (fields[k] !== undefined) update[k] = fields[k]; });

    if (address || fields.district || fields.city) {
      update["address.district"] = address?.district || fields.district || "";
      update["address.city"]     = address?.city     || fields.city     || "";
    }

    const doc = await Doctor.findByIdAndUpdate(doctorId, { $set: update }, { new: true }).lean();
    if (!doc) return NextResponse.json({ success: false, message: "Doctor not found" }, { status: 404 });

    // B3: Sync User.isActive when doctor activation status changes
    if (fields.isActive !== undefined && doc.userId) {
      await User.findByIdAndUpdate(doc.userId, { $set: { isActive: fields.isActive } });
    }

    return NextResponse.json({ success: true, message: `${doc.name} updated`, doctor: doc });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
