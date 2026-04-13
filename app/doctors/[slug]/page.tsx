import { notFound } from "next/navigation";
import mongoose from "mongoose";
import connectDB from "../../../lib/mongodb";
import Doctor from "../../../models/Doctor";
import Hospital from "../../../models/Hospital";
import Review from "../../../models/Review";
import Header from "../../components/header";

// ── SEO Metadata ──────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: { slug: string } }) {
  if (!mongoose.Types.ObjectId.isValid(params.slug)) return { title: "Doctor Not Found — Brims Hospitals" };

  await connectDB();
  const doc = await Doctor.findById(params.slug)
    .select("name department speciality address hospitalName")
    .lean() as any;

  if (!doc) return { title: "Doctor Not Found — Brims Hospitals" };

  const district = doc.address?.district || doc.address?.city || "Bihar";
  return {
    title: `Dr. ${doc.name} — ${doc.speciality || doc.department} in ${district} | Brims Hospitals`,
    description: `Dr. ${doc.name} is a ${doc.speciality || doc.department} specialist${doc.hospitalName ? ` at ${doc.hospitalName}` : ""} in ${district}, Bihar. Book OPD appointment online on Brims Hospitals.`,
    openGraph: {
      title: `Dr. ${doc.name} | Brims Hospitals`,
      description: `${doc.speciality || doc.department} specialist in ${district}, Bihar. Book appointment online.`,
      type: "profile",
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const DAY_ORDER = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

function Stars({ rating, total }: { rating: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1,2,3,4,5].map((n) => (
          <span key={n} className={`text-lg ${n <= Math.round(rating) ? "text-amber-400" : "text-gray-200"}`}>★</span>
        ))}
      </div>
      <span className="text-sm font-bold text-gray-700">{rating > 0 ? rating.toFixed(1) : "New"}</span>
      {total > 0 && <span className="text-xs text-gray-400">({total} reviews)</span>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function DoctorProfilePage({ params }: { params: { slug: string } }) {
  if (!mongoose.Types.ObjectId.isValid(params.slug)) notFound();

  await connectDB();

  const doctor = await Doctor.findOne({ _id: params.slug, isActive: true })
    .lean() as any;

  if (!doctor) notFound();

  // Fetch linked hospital info
  let hospital: any = null;
  if (doctor.hospitalId) {
    hospital = await Hospital.findById(doctor.hospitalId)
      .select("name hospitalId address type isVerified")
      .lean() as any;
  }

  // Fetch reviews for this doctor
  const reviews = await Review.find({ doctorId: doctor._id, targetType: "doctor" })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean() as any[];

  // Sort available slots by day order
  const sortedSlots = (doctor.availableSlots || []).sort((a: any, b: any) =>
    DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
  );

  const addr = doctor.address || {};
  const location = [addr.city, addr.district, "Bihar"].filter(Boolean).join(", ");

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* ── Profile Hero ── */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-5 py-10">
          <div className="flex gap-5 items-start">
            {/* Photo */}
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden bg-white/20 flex-shrink-0 flex items-center justify-center border-2 border-white/30">
              {doctor.photo
                ? <img src={doctor.photo} alt={`Dr. ${doctor.name}`} className="w-full h-full object-cover" />
                : <span className="text-5xl">👨‍⚕️</span>}
            </div>

            {/* Info */}
            <div className="flex-1">
              <p className="text-blue-200 text-sm font-medium mb-0.5">{doctor.department}</p>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">Dr. {doctor.name}</h1>
              {doctor.speciality && <p className="text-blue-100 text-sm mb-2">{doctor.speciality}</p>}
              {doctor.degrees?.length > 0 && (
                <p className="text-blue-200 text-xs mb-3">{doctor.degrees.join(" · ")}</p>
              )}
              <Stars rating={doctor.rating || 0} total={doctor.totalReviews || 0} />
              {location && (
                <p className="text-blue-200 text-xs mt-2 flex items-center gap-1">
                  <span>📍</span>{location}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* ── Quick Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <p className="text-2xl font-bold text-blue-600">₹{doctor.opdFee}</p>
            <p className="text-xs text-gray-500 mt-0.5">OPD Fee</p>
            {doctor.offerFee && doctor.offerFee < doctor.opdFee && (
              <p className="text-xs text-green-600 font-semibold mt-0.5">Member: ₹{doctor.offerFee}</p>
            )}
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <p className="text-2xl font-bold text-gray-700">{doctor.experience || "—"}</p>
            <p className="text-xs text-gray-500 mt-0.5">{doctor.experience ? "Yrs Experience" : "Experience"}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <p className={`text-sm font-bold mt-1 ${doctor.isAvailable ? "text-green-600" : "text-gray-400"}`}>
              {doctor.isAvailable ? "✅ Available" : "⛔ Unavailable"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Status</p>
          </div>
        </div>

        {/* ── Hospital ── */}
        {(hospital || doctor.hospitalName) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-800 text-lg mb-3">🏥 Hospital / Clinic</h2>
            {hospital ? (
              <a href={`/hospitals/${hospital.hospitalId}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-teal-50 border border-transparent hover:border-teal-200 transition group">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🏥</div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 group-hover:text-teal-700 transition">{hospital.name}</p>
                  <p className="text-xs text-gray-500">{hospital.type}</p>
                  {hospital.address?.district && (
                    <p className="text-xs text-gray-400">📍 {hospital.address.district}, Bihar</p>
                  )}
                </div>
                <span className="text-teal-500 text-sm font-semibold group-hover:translate-x-1 transition">→</span>
              </a>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-xl">🏠</div>
                <div>
                  <p className="font-semibold text-gray-700">{doctor.hospitalName}</p>
                  <p className="text-xs text-gray-400">Private Clinic</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Available Slots ── */}
        {sortedSlots.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-800 text-lg mb-4">🕐 Available Slots</h2>
            <div className="space-y-3">
              {sortedSlots.map((slot: any) => (
                <div key={slot.day} className="flex items-start gap-3">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg w-24 text-center flex-shrink-0">
                    {slot.day.slice(0, 3)}
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {(slot.times || []).map((t: string) => (
                      <span key={t} className="text-xs bg-teal-50 text-teal-700 border border-teal-100 px-2.5 py-1 rounded-full font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Book CTA ── */}
        {doctor.isAvailable && (
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white text-center">
            <h3 className="font-bold text-lg mb-1">Appointment Book Karein</h3>
            <p className="text-blue-100 text-sm mb-4">Dr. {doctor.name} se milein — OPD fee sirf ₹{doctor.opdFee}</p>
            <a href={`/opd-booking?doctorId=${doctor._id}`}
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition shadow">
              🩺 OPD Appointment Book Karein
            </a>
          </div>
        )}

        {/* ── Reviews ── */}
        {reviews.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-800 text-lg mb-4">⭐ Patient Reviews</h2>
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r._id.toString()} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{r.patientName || "Patient"}</p>
                      <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                    <div className="flex flex-shrink-0">
                      {[1,2,3,4,5].map((n) => (
                        <span key={n} className={`text-sm ${n <= r.rating ? "text-amber-400" : "text-gray-200"}`}>★</span>
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>}
                  {r.bookingType && (
                    <span className="text-[10px] mt-2 inline-block bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{r.bookingType}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {reviews.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-400">
            <p className="text-3xl mb-2">⭐</p>
            <p className="text-sm">Abhi koi review nahi hai</p>
            <p className="text-xs mt-1">Appointment book karo aur review do!</p>
          </div>
        )}

      </div>
    </main>
  );
}
