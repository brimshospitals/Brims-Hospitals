import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Doctor from "../../../models/Doctor";

export const dynamic = "force-dynamic";

const testDoctors = [
  {
    name: "Dr. Rajesh Kumar",
    department: "General Medicine",
    speciality: "Diabetes & Hypertension",
    degrees: ["MBBS", "MD"],
    experience: 15,
    opdFee: 500,
    offerFee: 300,
    hospitalName: "Patna Medical Center",
    address: { district: "Patna", city: "Patna", state: "Bihar" },
    availableSlots: [
      { day: "Monday", times: ["09:00", "09:30", "10:00", "10:30"] },
      { day: "Wednesday", times: ["14:00", "14:30", "15:00"] },
    ],
    rating: 4.5,
    totalReviews: 120,
    isAvailable: true,
    isActive: true,
  },
  {
    name: "Dr. Anjali Singh",
    department: "Gynecology",
    speciality: "Pregnancy & Women Health",
    degrees: ["MBBS", "MS Gynecology"],
    experience: 12,
    opdFee: 600,
    offerFee: 400,
    hospitalName: "Brims Hospital Patna",
    address: { district: "Patna", city: "Patna", state: "Bihar" },
    availableSlots: [
      { day: "Tuesday", times: ["10:00", "10:30", "11:00", "11:30"] },
      { day: "Thursday", times: ["15:00", "15:30", "16:00"] },
    ],
    rating: 4.8,
    totalReviews: 200,
    isAvailable: true,
    isActive: true,
  },
  {
    name: "Dr. Sunil Verma",
    department: "Cardiology",
    speciality: "Heart Disease & ECG",
    degrees: ["MBBS", "DM Cardiology"],
    experience: 20,
    opdFee: 1000,
    offerFee: 700,
    hospitalName: "Heart Care Patna",
    address: { district: "Patna", city: "Patna", state: "Bihar" },
    availableSlots: [
      { day: "Monday", times: ["11:00", "11:30", "14:00"] },
      { day: "Friday", times: ["10:00", "10:30", "11:00"] },
    ],
    rating: 4.9,
    totalReviews: 350,
    isAvailable: true,
    isActive: true,
  },
  {
    name: "Dr. Priya Sharma",
    department: "Pediatrics",
    speciality: "Child Health & Vaccination",
    degrees: ["MBBS", "MD Pediatrics"],
    experience: 8,
    opdFee: 400,
    offerFee: 250,
    hospitalName: "Child Care Clinic",
    address: { district: "Saran", city: "Chhapra", state: "Bihar" },
    availableSlots: [
      { day: "Monday", times: ["09:00", "09:30", "10:00"] },
      { day: "Saturday", times: ["10:00", "10:30", "11:00", "11:30"] },
    ],
    rating: 4.6,
    totalReviews: 180,
    isAvailable: true,
    isActive: true,
  },
  {
    name: "Dr. Amit Prasad",
    department: "Orthopedics",
    speciality: "Joint Pain & Fracture",
    degrees: ["MBBS", "MS Orthopedics"],
    experience: 10,
    opdFee: 500,
    offerFee: 350,
    hospitalName: "Bone & Joint Hospital",
    address: { district: "Muzaffarpur", city: "Muzaffarpur", state: "Bihar" },
    availableSlots: [
      { day: "Tuesday", times: ["09:00", "09:30", "10:00", "10:30"] },
      { day: "Friday", times: ["14:00", "14:30", "15:00"] },
    ],
    rating: 4.4,
    totalReviews: 95,
    isAvailable: true,
    isActive: true,
  },
];

export async function GET() {
  try {
    await connectDB();
    await Doctor.deleteMany({});
    await Doctor.insertMany(testDoctors);
    return NextResponse.json({
      success: true,
      message: `${testDoctors.length} doctors add ho gaye!`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}