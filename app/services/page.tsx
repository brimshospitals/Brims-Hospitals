import Header from "../components/header";
export default function ServicesPage() {

    const services = [
    {
      icon: "🏨",
      title: "OPD Booking",
      desc: "Consult with our specialist doctors for outpatient care. Get diagnosis, prescriptions and follow-ups.",
      features: ["30+ Specialist Doctors", "Same Day Appointment", "Digital Prescription"],
      price: "₹200 – ₹500",
      tag: "Most Popular",
      href: "/opd-booking",
    },
    {
      icon: "🛏️",
      title: "IPD Admission",
      desc: "Complete inpatient care with modern facilities, dedicated nursing staff and 24/7 monitoring.",
      features: ["AC & General Wards", "24/7 Nursing Care", "Insurance Accepted"],
      price: "₹1,500/day onwards",
      tag: "Comprehensive Care",
      href: "/contact",
    },
    {
      icon: "🧪",
      title: "Lab Tests",
      desc: "Accurate and timely pathology, radiology and diagnostic tests at affordable prices.",
      features: ["200+ Tests Available", "Home Sample Collection", "Reports in 24hrs"],
      price: "₹99 – ₹2,000",
      tag: "Home Collection",
      href: "/lab-tests",
    },
    {
      icon: "💻",
      title: "Teleconsultation",
      desc: "Consult with experienced doctors from the comfort of your home via video or audio call.",
      features: ["Video & Audio Call", "Available 8AM–10PM", "E-Prescription"],
      price: "₹150 – ₹400",
      tag: "From Home",
      href: "/teleconsultation",
    },
    {
      icon: "🔪",
      title: "Surgery Packages",
      desc: "Affordable all-inclusive surgery packages with pre & post op care and EMI options.",
      features: ["All-Inclusive Package", "EMI Available", "Pre & Post Op Care"],
      price: "₹15,000 onwards",
      tag: "EMI Available",
      href: "/surgery-packages",
    },
    {
      icon: "👨‍👩‍👧",
      title: "Family Health Card",
      desc: "One card for your entire family. Get discounts on all services and priority booking.",
      features: ["Upto 6 Members", "15% Discount", "Priority Booking"],
      price: "₹999/year",
      tag: "Best Value",
      href: "/dashboard",
    },
  ];

  return (
    <main className="min-h-screen bg-white">

      {/* Header */}
      <Header />


      {/* Page Hero */}
      <section className="bg-teal-50 py-14 text-center px-6">
        <h2 className="text-4xl font-bold text-teal-700 mb-3">Our Services</h2>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Comprehensive healthcare at affordable prices — all under one roof.
        </p>
      </section>

      {/* Services Grid */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((s, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden">
              <div className="bg-teal-600 text-white text-xs font-semibold px-4 py-1 w-fit rounded-br-xl">
                {s.tag}
              </div>
              <div className="p-6">
                <div className="text-5xl mb-3">{s.icon}</div>
                <h3 className="text-xl font-bold text-teal-700 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm mb-4">{s.desc}</p>
                <ul className="mb-5 space-y-1">
                  {s.features.map((f, j) => (
                    <li key={j} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-teal-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <div className="border-t pt-4 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400">Starting from</p>
                    <p className="text-lg font-bold text-teal-700">{s.price}</p>
                  </div>
                  <a href={s.href} className="bg-teal-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-teal-700 transition">
                    Book Now
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-teal-600 text-white text-center py-14 px-6">
        <h3 className="text-3xl font-bold mb-3">Need Help Choosing?</h3>
        <p className="text-teal-100 mb-6">Call us and our team will guide you to the right service.</p>
        <a href="tel:+911234567890" className="bg-white text-teal-700 font-bold px-8 py-3 rounded-full hover:bg-teal-50 transition">
          📞 Call Now
        </a>
      </section>

      {/* Footer */}
      <footer className="bg-teal-700 text-white text-center py-6">
        <p className="text-sm">© 2026 Brims Hospitals. All rights reserved.</p>
        <p className="text-teal-300 text-xs mt-1">Making Healthcare Affordable</p>
      </footer>

    </main>
  );
}