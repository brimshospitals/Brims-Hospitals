"use client";
import Header from "../components/header";
import { useState } from "react";

const doctors = [
  {
    id: 1,
    name: "Dr. Rajesh Kumar",
    specialization: "General Physician",
    qualification: "MBBS, MD",
    experience: "15 Years",
    fees: 300,
    available: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    time: "9:00 AM - 2:00 PM",
    rating: 4.8,
    patients: 2400,
    photo: null,
    bio: "Specialist in general medicine, diabetes and hypertension management with 15 years of experience.",
  },
  {
    id: 2,
    name: "Dr. Priya Sharma",
    specialization: "Gynaecologist",
    qualification: "MBBS, MS (OBG)",
    experience: "12 Years",
    fees: 500,
    available: ["Mon", "Wed", "Fri", "Sat"],
    time: "10:00 AM - 3:00 PM",
    rating: 4.9,
    patients: 3200,
    photo: null,
    bio: "Expert in women's health, pregnancy care, and gynaecological surgeries.",
  },
  {
    id: 3,
    name: "Dr. Amit Verma",
    specialization: "Orthopaedic Surgeon",
    qualification: "MBBS, MS (Ortho)",
    experience: "10 Years",
    fees: 600,
    available: ["Tue", "Thu", "Sat"],
    time: "11:00 AM - 4:00 PM",
    rating: 4.7,
    patients: 1800,
    photo: null,
    bio: "Specialist in bone, joint and spine surgeries including knee and hip replacement.",
  },
  {
    id: 4,
    name: "Dr. Sunita Singh",
    specialization: "Paediatrician",
    qualification: "MBBS, MD (Paeds)",
    experience: "8 Years",
    fees: 350,
    available: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    time: "9:00 AM - 1:00 PM",
    rating: 4.9,
    patients: 2900,
    photo: null,
    bio: "Dedicated to child health and development from newborn to adolescent care.",
  },
  {
    id: 5,
    name: "Dr. Mohd. Faiz",
    specialization: "Cardiologist",
    qualification: "MBBS, MD, DM (Cardio)",
    experience: "18 Years",
    fees: 800,
    available: ["Mon", "Wed", "Fri"],
    time: "2:00 PM - 6:00 PM",
    rating: 4.9,
    patients: 4100,
    photo: null,
    bio: "Senior cardiologist with expertise in heart diseases, angiography and cardiac surgeries.",
  },
  {
    id: 6,
    name: "Dr. Neha Gupta",
    specialization: "Dermatologist",
    qualification: "MBBS, MD (Derma)",
    experience: "7 Years",
    fees: 400,
    available: ["Tue", "Thu", "Sat"],
    time: "10:00 AM - 2:00 PM",
    rating: 4.6,
    patients: 1500,
    photo: null,
    bio: "Expert in skin disorders, cosmetic dermatology, hair loss and acne treatments.",
  },
];

const specializations = ["All", "General Physician", "Gynaecologist", "Orthopaedic Surgeon", "Paediatrician", "Cardiologist", "Dermatologist"];

export default function DoctorsPage() {
  const [selected, setSelected] = useState("All");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = selected === "All" ? doctors : doctors.filter(d => d.specialization === selected);

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
<Header />

      {/* Hero */}
      <section className="bg-teal-50 py-12 text-center px-6">
        <h2 className="text-4xl font-bold text-teal-700 mb-3">Our Doctors</h2>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Meet our experienced team of specialists committed to your health.
        </p>
      </section>

      {/* Filter Bar */}
      <section className="px-6 py-6 max-w-5xl mx-auto">
        <div className="flex flex-wrap gap-3">
          {specializations.map((s) => (
            <button
              key={s}
              onClick={() => setSelected(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                selected === s
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-teal-400"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* Doctors List */}
      <section className="px-6 pb-16 max-w-5xl mx-auto space-y-5">
        {filtered.map((doc) => (
          <div key={doc.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">

            {/* Main Row */}
            <div className="flex flex-col md:flex-row gap-5 p-6">

              {/* Photo */}
              <div className="flex-shrink-0">
                <div className="h-24 w-24 rounded-2xl bg-teal-100 flex items-center justify-center text-4xl font-bold text-teal-600 border-2 border-teal-200">
                  {doc.name.split(" ")[1][0]}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{doc.name}</h3>
                    <p className="text-teal-600 font-medium text-sm">{doc.specialization}</p>
                    <p className="text-gray-400 text-xs mt-1">{doc.qualification}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-teal-50 px-3 py-1 rounded-full">
                    <span className="text-yellow-400 text-sm">★</span>
                    <span className="text-teal-700 font-bold text-sm">{doc.rating}</span>
                    <span className="text-gray-400 text-xs">({doc.patients}+ patients)</span>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex flex-wrap gap-4 mt-3">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <span className="text-teal-500">&#10003;</span>
                    <span>{doc.experience} Experience</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <span className="text-teal-500">&#10003;</span>
                    <span>Fees: Rs. {doc.fees}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <span className="text-teal-500">&#10003;</span>
                    <span>{doc.time}</span>
                  </div>
                </div>

                {/* Available Days */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day) => (
                    <span key={day} className={`text-xs px-2 py-1 rounded-lg font-medium ${
                      doc.available.includes(day)
                        ? "bg-teal-100 text-teal-700"
                        : "bg-gray-100 text-gray-300"
                    }`}>
                      {day}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 justify-center min-w-[140px]">
                <a href="/opd-booking"
                  className="bg-teal-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-teal-700 transition text-center">
                  Book Appointment
                </a>
                <button
                  onClick={() => setExpanded(expanded === doc.id ? null : doc.id)}
                  className="border border-teal-600 text-teal-600 px-5 py-2 rounded-xl text-sm font-semibold hover:bg-teal-50 transition">
                  {expanded === doc.id ? "Hide Profile" : "View Profile"}
                </button>
              </div>
            </div>

            {/* Expanded Profile */}
            {expanded === doc.id && (
              <div className="border-t border-gray-100 px-6 py-5 bg-teal-50">
                <h4 className="text-sm font-bold text-teal-700 mb-2">About Doctor</h4>
                <p className="text-gray-600 text-sm">{doc.bio}</p>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                    <p className="text-xl font-bold text-teal-700">{doc.experience}</p>
                    <p className="text-xs text-gray-400">Experience</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                    <p className="text-xl font-bold text-teal-700">{doc.patients}+</p>
                    <p className="text-xs text-gray-400">Patients</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                    <p className="text-xl font-bold text-teal-700">{doc.rating}</p>
                    <p className="text-xs text-gray-400">Rating</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                    <p className="text-xl font-bold text-teal-700">Rs.{doc.fees}</p>
                    <p className="text-xs text-gray-400">Fees</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="bg-teal-700 text-white text-center py-6">
        <p className="text-sm">© 2026 Brims Hospitals. All rights reserved.</p>
        <p className="text-teal-300 text-xs mt-1">Making Healthcare Affordable</p>
      </footer>

    </main>
  );
}