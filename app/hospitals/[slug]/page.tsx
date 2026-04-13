import { notFound } from "next/navigation";
import connectDB from "../../../lib/mongodb";
import Hospital from "../../../models/Hospital";
import Doctor from "../../../models/Doctor";
import Review from "../../../models/Review";
import Header from "../../components/header";

// ── SEO Metadata ──────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: { slug: string } }) {
  await connectDB();
  const h = await Hospital.findOne({ hospitalId: params.slug, isVerified: true })
    .select("name address type departments")
    .lean() as any;

  if (!h) return { title: "Hospital Not Found — Brims Hospitals" };

  const district = h.address?.district || "Bihar";
  return {
    title: `${h.name} — ${district} | Brims Hospitals`,
    description: `${h.name} is a ${h.type} hospital in ${district}, Bihar. Departments: ${(h.departments || []).slice(0, 5).join(", ")}. Book OPD appointment online.`,
    openGraph: {
      title: `${h.name} | Brims Hospitals`,
      description: `${h.type} hospital in ${district}, Bihar. Book appointment online.`,
      type: "website",
    },
  };
}

// ── Star display ──────────────────────────────────────────────────────────────
function Stars({ rating, total }: { rating: number; total: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1,2,3,4,5].map((n) => (
          <span key={n} className={`text-lg ${n <= full ? "text-amber-400" : n === full + 1 && half ? "text-amber-300" : "text-gray-200"}`}>★</span>
        ))}
      </div>
      <span className="text-sm font-bold text-gray-700">{rating > 0 ? rating.toFixed(1) : "New"}</span>
      {total > 0 && <span className="text-xs text-gray-400">({total} reviews)</span>}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  "Single Specialist": "bg-blue-100 text-blue-700 border-blue-200",
  "Multi Specialist":  "bg-purple-100 text-purple-700 border-purple-200",
  "Super Specialist":  "bg-rose-100 text-rose-700 border-rose-200",
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function HospitalProfilePage({ params }: { params: { slug: string } }) {
  await connectDB();

  const hospital = await Hospital.findOne({ hospitalId: params.slug, isVerified: true, isActive: true })
    .lean() as any;

  if (!hospital) notFound();

  // Fetch doctors at this hospital
  const doctors = await Doctor.find({ hospitalId: hospital._id, isActive: true })
    .select("name department speciality photo opdFee offerFee rating totalReviews isAvailable")
    .sort({ rating: -1 })
    .limit(20)
    .lean() as any[];

  // Fetch recent reviews for this hospital
  const reviews = await Review.find({ hospitalId: hospital._id, targetType: "hospital" })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean() as any[];

  const addr = hospital.address || {};
  const fullAddress = [addr.street, addr.city, addr.district, "Bihar", addr.pincode].filter(Boolean).join(", ");

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-800 text-white">
        {hospital.photos?.[0] && (
          <div className="relative h-52 overflow-hidden">
            <img src={hospital.photos[0]} alt={hospital.name} className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-t from-teal-800/80 to-transparent" />
          </div>
        )}
        <div className="max-w-4xl mx-auto px-5 py-8">
          <span className={`inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-full border mb-3 ${TYPE_COLORS[hospital.type] ?? "bg-white/20 text-white border-white/30"}`}>
            {hospital.type}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{hospital.name}</h1>
          <p className="text-teal-100 text-sm flex items-center gap-1.5 mb-3">
            <span>📍</span>{fullAddress}
          </p>
          <Stars rating={hospital.rating || 0} total={hospital.totalReviews || 0} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* ── Quick Info ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {hospital.mobile && (
            <a href={`tel:${hospital.mobile}`}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center hover:shadow-md transition">
              <span className="text-2xl mb-1">📞</span>
              <span className="text-xs text-gray-500 font-medium">Call</span>
              <span className="text-sm font-bold text-teal-700 mt-0.5">{hospital.mobile}</span>
            </a>
          )}
          {hospital.spocName && (
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center">
              <span className="text-2xl mb-1">👤</span>
              <span className="text-xs text-gray-500 font-medium">SPOC</span>
              <span className="text-sm font-bold text-gray-700 mt-0.5">{hospital.spocName}</span>
            </div>
          )}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <span className="text-2xl mb-1">🏥</span>
            <span className="text-xs text-gray-500 font-medium">Departments</span>
            <span className="text-sm font-bold text-gray-700 mt-0.5">{(hospital.departments || []).length}</span>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <span className="text-2xl mb-1">👨‍⚕️</span>
            <span className="text-xs text-gray-500 font-medium">Doctors</span>
            <span className="text-sm font-bold text-gray-700 mt-0.5">{doctors.length}</span>
          </div>
        </div>

        {/* ── Departments ── */}
        {(hospital.departments || []).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-800 text-lg mb-4">🏥 Departments</h2>
            <div className="flex flex-wrap gap-2">
              {hospital.departments.map((d: string) => (
                <span key={d} className="text-sm bg-teal-50 text-teal-700 border border-teal-100 px-3 py-1.5 rounded-full font-medium">
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Doctors ── */}
        {doctors.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-800 text-lg mb-4">👨‍⚕️ Our Doctors</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {doctors.map((doc) => (
                <a key={doc._id.toString()} href={`/doctors/${doc._id}`}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-3 hover:shadow-md hover:border-teal-200 transition">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-teal-50 flex-shrink-0 flex items-center justify-center">
                    {doc.photo
                      ? <img src={doc.photo} alt={doc.name} className="w-full h-full object-cover" />
                      : <span className="text-2xl">👨‍⚕️</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm">Dr. {doc.name}</p>
                    <p className="text-xs text-teal-600 font-medium">{doc.speciality || doc.department}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex">
                        {[1,2,3,4,5].map((n) => (
                          <span key={n} className={`text-xs ${n <= Math.round(doc.rating || 0) ? "text-amber-400" : "text-gray-200"}`}>★</span>
                        ))}
                        {(doc.totalReviews || 0) > 0 && <span className="text-xs text-gray-400 ml-1">({doc.totalReviews})</span>}
                      </div>
                      <span className="text-xs font-bold text-teal-700">₹{doc.opdFee}</span>
                    </div>
                    <span className={`inline-flex text-[10px] mt-1 px-2 py-0.5 rounded-full font-semibold ${doc.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {doc.isAvailable ? "● Available" : "● Unavailable"}
                    </span>
                  </div>
                </a>
              ))}
            </div>
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
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CTA ── */}
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-6 text-white text-center">
          <h3 className="font-bold text-lg mb-1">Appointment Book Karein</h3>
          <p className="text-teal-100 text-sm mb-4">{hospital.name} ke doctors se milein — online booking available hai</p>
          <a href={`/opd-booking?hospital=${hospital._id}`}
            className="inline-flex items-center gap-2 bg-white text-teal-700 font-bold px-6 py-3 rounded-xl hover:bg-teal-50 transition shadow">
            🩺 OPD Book Karein
          </a>
        </div>

        {/* ── Photos ── */}
        {(hospital.photos || []).length > 1 && (
          <div>
            <h2 className="font-bold text-gray-800 text-lg mb-4">📷 Photos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {hospital.photos.map((src: string, i: number) => (
                <img key={i} src={src} alt={`${hospital.name} photo ${i + 1}`}
                  className="rounded-xl w-full h-36 object-cover border border-gray-100" />
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
