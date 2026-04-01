"use client";

import Header from "./components/header";
export default function Home() {
  return (
    <main className="min-h-screen bg-white">

      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="bg-teal-50 py-20 text-center px-6">
        <h2 className="text-4xl font-bold text-teal-700 mb-4">
          World Class Healthcare
        </h2>
        <p className="text-gray-600 text-lg mb-8 max-w-xl mx-auto">
          Book OPD appointments, lab tests, surgeries and more — all in one place.
        </p>
        <div className="flex justify-center gap-4">
          <button className="bg-teal-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-teal-700">
            Book Appointment
          </button>
          <button className="border-2 border-teal-600 text-teal-600 px-8 py-3 rounded-full font-semibold hover:bg-teal-50">
            Our Services
          </button>
        </div>
      </section>

      {/* Services Cards */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h3 className="text-2xl font-bold text-center text-teal-700 mb-10">
          Our Services
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: "🏨", title: "OPD Booking", desc: "Book outpatient appointments with top doctors" },
            { icon: "🛏️", title: "IPD Admission", desc: "Inpatient admission and ward management" },
            { icon: "🧪", title: "Lab Tests", desc: "Book pathology and radiology tests online" },
            { icon: "💻", title: "Teleconsultation", desc: "Video consult with doctors from home" },
            { icon: "🔪", title: "Surgery Packages", desc: "Affordable surgery packages with EMI options" },
            { icon: "👨‍👩‍👧", title: "Family Card", desc: "Digital family health card for all members" },
          ].map((service, i) => (
            <div key={i} className="bg-white border border-teal-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-teal-400 transition-all">
              <div className="text-4xl mb-3">{service.icon}</div>
              <h4 className="text-lg font-bold text-teal-700 mb-2">{service.title}</h4>
              <p className="text-gray-500 text-sm">{service.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-teal-700 text-white text-center py-6 mt-10">
        <p className="text-sm">© 2026 Brims Hospitals. All rights reserved.</p>
        <p className="text-teal-300 text-xs mt-1">Patna, Bihar, India</p>
      </footer>

    </main>
  );
}
