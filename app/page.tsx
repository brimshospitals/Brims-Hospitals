import Header from "./components/header";

const services = [
  {
    icon: "🏨",
    title: "OPD Booking",
    desc: "Top doctors ke saath outpatient appointment book karein. Usi din appointment milegi.",
    href: "/opd-booking",
  },
  {
    icon: "🛏️",
    title: "IPD Admission",
    desc: "Inpatient admission aur ward management. 24/7 nursing staff aur modern facilities.",
    href: "/contact",
  },
  {
    icon: "🧪",
    title: "Lab Tests",
    desc: "Blood test, X-Ray, Ultrasound — sab ghar baithe ya lab mein book karein.",
    href: "/lab-tests",
  },
  {
    icon: "💻",
    title: "Teleconsultation",
    desc: "Ghar se video/audio call par doctor se milein. E-prescription bhi milegi.",
    href: "/teleconsultation",
  },
  {
    icon: "🔪",
    title: "Surgery Packages",
    desc: "Affordable all-inclusive surgery packages. Pre & post op care included.",
    href: "/surgery-packages",
  },
  {
    icon: "👨‍👩‍👧",
    title: "Family Health Card",
    desc: "Ek card mein poori family ka health coverage. Wallet aur discount milega.",
    href: "/dashboard",
  },
  {
    icon: "🏥",
    title: "Find Hospitals",
    desc: "Bihar ke verified hospitals district aur specialty ke hisaab se dhundho.",
    href: "/hospitals",
  },
];

const stats = [
  { value: "500+", label: "Registered Patients" },
  { value: "50+",  label: "Specialist Doctors"  },
  { value: "15+",  label: "Partner Hospitals"   },
  { value: "99%",  label: "Patient Satisfaction" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-teal-50 to-teal-100 py-20 text-center px-6">
        <span className="inline-block bg-teal-100 text-teal-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-teal-200">
          🏥 Bihar ka Bharosemand Healthcare Platform
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-teal-800 mb-4 leading-tight">
          Affordable Healthcare<br />
          <span className="text-teal-600">Aapke Ghar Ke Paas</span>
        </h1>
        <p className="text-gray-600 text-lg mb-8 max-w-xl mx-auto">
          OPD appointment, lab tests, surgery packages aur family health card —
          sab kuch ek jagah par.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <a href="/opd-booking"
            className="bg-teal-600 text-white px-8 py-3.5 rounded-full font-semibold hover:bg-teal-700 transition shadow-md">
            Book Appointment
          </a>
          <a href="/services"
            className="border-2 border-teal-600 text-teal-700 px-8 py-3.5 rounded-full font-semibold hover:bg-teal-50 transition">
            Our Services
          </a>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-teal-700 py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          {stats.map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-bold">{value}</p>
              <p className="text-teal-200 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services ── */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-teal-700">Hamaari Services</h2>
          <p className="text-gray-500 mt-2">Comprehensive healthcare — ek hi jagah par</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((s) => (
            <a key={s.title} href={s.href}
              className="bg-white border border-teal-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-teal-400 transition-all group">
              <div className="text-4xl mb-3">{s.icon}</div>
              <h3 className="text-lg font-bold text-teal-700 mb-2 group-hover:text-teal-800">
                {s.title}
              </h3>
              <p className="text-gray-500 text-sm">{s.desc}</p>
              <p className="text-teal-600 text-sm font-medium mt-3 group-hover:underline">
                Book Now →
              </p>
            </a>
          ))}
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="bg-teal-50 py-14 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-teal-700 mb-8">Brims Ko Kyun Chunein?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "💰", title: "Affordable Prices",    desc: "Bihar mein sabse sasti healthcare services" },
              { icon: "🏠", title: "Home Services",        desc: "Ghar baithe lab test collection aur delivery" },
              { icon: "👨‍👩‍👧", title: "Family Card",         desc: "Puri family ka health card — sirf ₹249 mein activate karein" },
              { icon: "⚡", title: "Same Day Appointment", desc: "Usi din OPD appointment ki guarantee"         },
              { icon: "🔒", title: "Trusted Hospitals",    desc: "Verified aur accredited hospitals ka network"  },
              { icon: "📱", title: "Easy Booking",         desc: "Mobile se 2 minute mein appointment book karein" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-5 shadow-sm border border-teal-100">
                <div className="text-3xl mb-2">{icon}</div>
                <h4 className="font-bold text-gray-800 mb-1">{title}</h4>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-teal-700 text-white text-center py-14 px-6">
        <h2 className="text-3xl font-bold mb-3">Abhi Start Karein</h2>
        <p className="text-teal-100 mb-7 max-w-md mx-auto">
          Family Health Card activate karein aur puri family ko affordable healthcare milega.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <a href="/login"
            className="bg-white text-teal-700 font-bold px-8 py-3.5 rounded-full hover:bg-teal-50 transition shadow">
            Login / Register — Free
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-teal-800 text-white px-6 py-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img src="/logo.png" alt="Brims" className="h-10 w-10 rounded-full bg-white p-0.5 object-contain" />
              <div>
                <p className="font-bold text-lg">Brims Hospitals</p>
                <p className="text-teal-300 text-xs">Making Healthcare Affordable</p>
              </div>
            </div>
            <p className="text-teal-300 text-sm">SH-73, Rambagh, Taraiya, Chapra, Bihar — 841424</p>
          </div>

          <div>
            <p className="font-semibold mb-3">Services</p>
            <div className="space-y-2">
              {[
                ["OPD Booking",      "/opd-booking"      ],
                ["Lab Tests",        "/lab-tests"        ],
                ["Surgery Packages", "/surgery-packages" ],
                ["Family Card",      "/dashboard"        ],
                ["All Services",     "/services"         ],
              ].map(([label, href]) => (
                <a key={href} href={href} className="block text-teal-300 text-sm hover:text-white transition">
                  {label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="font-semibold mb-3">Quick Links</p>
            <div className="space-y-2">
              {[
                ["My Bookings",         "/my-bookings"         ],
                ["Dashboard",           "/dashboard"           ],
                ["Contact Us",          "/contact"             ],
                ["Hospital Onboarding", "/hospital-onboarding" ],
              ].map(([label, href]) => (
                <a key={href} href={href} className="block text-teal-300 text-sm hover:text-white transition">
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-teal-700 pt-6 text-center text-teal-400 text-sm">
          <p>© 2026 Brims Hospitals. All rights reserved.</p>
          <p className="mt-1">Patna, Bihar, India</p>
        </div>
      </footer>
    </main>
  );
}
