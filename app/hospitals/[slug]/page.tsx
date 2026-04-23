import { notFound } from "next/navigation";
import connectDB from "../../../lib/mongodb";
import Hospital from "../../../models/Hospital";
import Doctor from "../../../models/Doctor";
import Review from "../../../models/Review";
import LabTest from "../../../models/LabTest";
import SurgeryPackage from "../../../models/SurgeryPackage";
import Header from "../../components/header";
import HospitalPageClient from "./HospitalPageClient";

// ── SEO Metadata ──────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectDB();
  const h = await Hospital.findOne({ hospitalId: slug, isVerified: true })
    .select("name address type departments")
    .lean() as any;

  if (!h) return { title: "Hospital Not Found — Brims Hospitals" };

  const district = h.address?.district || "Bihar";
  return {
    title: `${h.name} — ${district} | Brims Hospitals`,
    description: `${h.name} is a ${h.type} hospital in ${district}, Bihar. Book OPD, Lab Tests and Surgery Packages online.`,
    openGraph: {
      title: `${h.name} | Brims Hospitals`,
      description: `${h.type} hospital in ${district}, Bihar. Book appointment online.`,
      type: "website",
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function HospitalProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectDB();

  const hospital = await Hospital.findOne({ hospitalId: slug, isVerified: true, isActive: true })
    .select("hospitalId name address type mobile email website ownerName spocName spocContact registrationNo rohiniNo departments specialties photos rating totalReviews coordinates _id")
    .lean() as any;

  if (!hospital) notFound();

  const [doctors, labTests, surgeries, reviews] = await Promise.all([
    Doctor.find({ hospitalId: hospital._id, isActive: true })
      .select("name department speciality photo opdFee offerFee rating totalReviews isAvailable availableSlots _id")
      .sort({ rating: -1 }).limit(20).lean() as Promise<any[]>,
    LabTest.find({ hospitalId: hospital._id, isActive: true })
      .select("name category mrp offerPrice homeCollection turnaroundTime fastingRequired _id")
      .sort({ offerPrice: 1 }).limit(30).lean() as Promise<any[]>,
    SurgeryPackage.find({ hospitalId: hospital._id, isActive: true })
      .select("name category mrp offerPrice stayDays surgeonName _id")
      .sort({ offerPrice: 1 }).limit(30).lean() as Promise<any[]>,
    Review.find({ hospitalId: hospital._id, targetType: "hospital" })
      .sort({ createdAt: -1 }).limit(10).lean() as Promise<any[]>,
  ]);

  // Serialize MongoDB documents to plain objects for client component
  const serialize = (obj: any): any => JSON.parse(JSON.stringify(obj));

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <HospitalPageClient
        hospital={serialize(hospital)}
        doctors={serialize(doctors)}
        labTests={serialize(labTests)}
        surgeries={serialize(surgeries)}
        reviews={serialize(reviews)}
      />
    </main>
  );
}