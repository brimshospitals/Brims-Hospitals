import Header from "./components/header";

const services = [
  {
    icon: "🩺",
    title: "OPD Booking",
    desc: "Top doctors ke saath same-day appointment. 50+ specialists available.",
    href: "/opd-booking",
    color: "from-blue-50 to-blue-100/60",
    border: "border-blue-100",
    badge: "",
  },
  {
    icon: "🧪",
    title: "Lab Tests",
    desc: "Blood test, X-Ray, Ultrasound — ghar baithe ya lab mein book karein.",
    href: "/lab-tests",
    color: "from-orange-50 to-orange-100/60",
    border: "border-orange-100",
    badge: "Home Collection",
  },
  {
    icon: "💻",
    title: "Teleconsultation",
    desc: "Ghar se video/audio call par doctor se milein. E-prescription milegi.",
    href: "/teleconsultation",
    color: "from-purple-50 to-purple-100/60",
    border: "border-purple-100",
    badge: "Live",
  },
  {
    icon: "🔬",
    title: "Surgery Packages",
    desc: "Affordable all-inclusive surgery packages. Pre & post op care included.",
    href: "/surgery-packages",
    color: "from-rose-50 to-rose-100/60",
    border: "border-rose-100",
    badge: "EMI Available",
  },
  {
    icon: "🛏️",
    title: "IPD Admission",
    desc: "Inpatient admission, modern facilities aur 24/7 nursing staff.",
    href: "/ipd-booking",
    color: "from-pink-50 to-pink-100/60",
    border: "border-pink-100",
    badge: "",
  },
  {
    icon: "👨‍👩‍👧",
    title: "Family Health Card",
    desc: "1 card mein 6 members ka coverage. Shared wallet + exclusive discounts.",
    href: "/dashboard",
    color: "from-teal-50 to-teal-100/60",
    border: "border-teal-100",
    badge: "₹249/yr",
  },
  {
    icon: "🏥",
    title: "Find Hospitals",
    desc: "Bihar ke verified hospitals dhundho — district aur specialty ke hisaab se.",
    href: "/hospitals",
    color: "from-green-50 to-green-100/60",
    border: "border-green-100",
    badge: "",
  },
];

const stats = [
  { value: "500+", label: "Registered Patients", icon: "👥" },
  { value: "50+",  label: "Specialist Doctors",  icon: "👨‍⚕️" },
  { value: "15+",  label: "Partner Hospitals",   icon: "🏥" },
  { value: "99%",  label: "Patient Satisfaction", icon: "⭐" },
];

const whyUs = [
  { icon: "💰", title: "Affordable Prices",     desc: "Bihar mein sabse sasti healthcare — wallet friendly" },
  { icon: "🏠", title: "Home Services",          desc: "Lab collection aur delivery seedha ghar par" },
  { icon: "👨‍👩‍👧", title: "Family Coverage",       desc: "₹249/yr mein poori family ka health card" },
  { icon: "⚡", title: "Same Day Appointment",   desc: "OPD slot usi din — koi wait nahi" },
  { icon: "🔒", title: "Verified Hospitals",     desc: "Accredited aur ROHINI-registered hospital network" },
  { icon: "📱", title: "2-Minute Booking",       desc: "Mobile se sirf 2 minute mein appointment confirm" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Bihar ka #1 Bharosemand Healthcare Platform
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-5 leading-tight tracking-tight">
            Affordable Healthcare<br />
            <span className="text-teal-200">Aapke Ghar Ke Paas</span>
          </h1>

          <p className="text-teal-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            OPD appointment, lab tests, surgery packages aur family health card —
            sab kuch ek jagah par.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <a href="/opd-booking"
              className="bg-white text-teal-700 font-bold px-8 py-3.5 rounded-full hover:bg-teal-50 transition shadow-lg text-base">
              Book Appointment
            </a>
            <a href="/services"
              className="border-2 border-white/50 text-white font-semibold px-8 py-3.5 rounded-full hover:bg-white/10 transition text-base">
              Our Services
            </a>
          </div>

          {/* Quick action chips */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { href: "/lab-tests",        icon: "🧪", label: "Lab Tests"      },
              { href: "/teleconsultation", icon: "💻", label: "Teleconsult"    },
              { href: "/surgery-packages", icon: "🔬", label: "Surgery"        },
              { href: "/ambulance",        icon: "🚑", label: "Emergency"      },
              { href: "/hospitals",        icon: "🏥", label: "Find Hospitals" },
            ].map(({ href, icon, label }) => (
              <a key={href} href={href}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full transition backdrop-blur-sm">
                <span>{icon}</span>
                <span>{label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-white border-b border-gray-100 py-8 px-6 shadow-sm">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map(({ value, label, icon }) => (
            <div key={label} className="group">
              <div className="text-2xl mb-1">{icon}</div>
              <p className="text-3xl font-black text-teal-700">{value}</p>
              <p className="text-gray-500 text-sm mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Emergency Banner ── */}
      <section className="bg-red-50 border-y border-red-100 py-4 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-red-600" stroke="currentColor" strokeWidth={2}>
                <rect x="1" y="8" width="22" height="12" rx="2"/>
                <path strokeLinecap="round" d="M1 13h5M18 13h5"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 8V6a3 3 0 016 0v2"/>
                <path strokeLinecap="round" d="M12 14v3M10.5 15.5h3"/>
              </svg>
            </div>
            <div>
              <p className="font-bold text-red-700 text-sm">24/7 Emergency Ambulance Available</p>
              <p className="text-red-500 text-xs">GPS tracking ke saath door-to-door service — Helpline: 112</p>
            </div>
          </div>
          <a href="/ambulance"
            className="shrink-0 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-5 py-2 rounded-full transition shadow-md shadow-red-200 flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
              <rect x="1" y="8" width="22" height="12" rx="2"/>
              <path strokeLinecap="round" d="M1 13h5M18 13h5"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 8V6a3 3 0 016 0v2"/>
              <path strokeLinecap="round" d="M12 14v3M10.5 15.5h3"/>
            </svg>
            Book Ambulance
          </a>
        </div>
      </section>

      {/* ── Services ── */}
      <section className="py-16 px-6 bg-gray-50/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block bg-teal-100 text-teal-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
              Comprehensive Care
            </span>
            <h2 className="text-3xl font-bold text-gray-800">Hamaari Services</h2>
            <p className="text-gray-500 mt-2 text-base">Ek platform — saari healthcare zarooraten</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s) => (
              <a key={s.title} href={s.href}
                className={`relative bg-gradient-to-br ${s.color} border ${s.border} rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group overflow-hidden`}>
                {/* Decorative circle */}
                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/40 rounded-full" />

                {s.badge && (
                  <span className="absolute top-3 right-3 bg-white/80 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200/60">
                    {s.badge}
                  </span>
                )}

                <div className="relative z-10">
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <h3 className="text-base font-bold text-gray-800 mb-1.5 group-hover:text-teal-700 transition">
                    {s.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                  <p className="text-teal-600 text-xs font-semibold mt-3 flex items-center gap-1 group-hover:gap-2 transition-all">
                    Book Now
                    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6"/>
                    </svg>
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Family Card Promo ── */}
      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-teal-600 to-emerald-700 rounded-3xl overflow-hidden shadow-xl relative">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
            <div className="absolute bottom-0 left-16 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 p-8 md:p-10">
              <div className="flex-1 text-white">
                <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold mb-4">
                  🔥 75% OFF — Limited Time
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold mb-3 leading-tight">
                  Family Health Card<br/>
                  <span className="text-teal-200">Sirf ₹249/year</span>
                </h2>
                <ul className="space-y-1.5 text-teal-100 text-sm mb-6">
                  {[
                    "1 Primary + 5 Family Members",
                    "Shared Family Wallet",
                    "Lab & OPD Discounts",
                    "Priority Booking Access",
                    "Digital Health Card PDF",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="w-4 h-4 bg-teal-400 rounded-full flex items-center justify-center text-teal-900 text-xs font-bold shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="/dashboard"
                  className="inline-flex items-center gap-2 bg-white text-teal-700 font-bold px-6 py-3 rounded-full hover:bg-teal-50 transition shadow-lg">
                  Activate Karein — ₹249
                  <span className="text-lg">🎉</span>
                </a>
              </div>

              {/* Card mockup */}
              <div className="shrink-0 w-64">
                <div className="bg-white/15 border border-white/20 rounded-2xl p-5 backdrop-blur-sm">
                  <p className="text-teal-300 text-[10px] font-bold uppercase tracking-widest mb-1">Brims Health Card</p>
                  <p className="text-white font-mono text-sm tracking-widest mb-4">XXXX XXXX XXXX XXXX</p>
                  <div className="flex -space-x-2 mb-3">
                    {["R", "P", "S", "A", "+2"].map((l, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-teal-400/40 border-2 border-teal-500 flex items-center justify-center text-xs font-bold text-white">
                        {l}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-teal-300">
                    <span>6 Members</span>
                    <span className="flex items-center gap-1 text-green-300 font-semibold">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      Active
                    </span>
                  </div>
                </div>
                <p className="text-teal-200 text-xs text-center mt-2">
                  <span className="line-through text-teal-300">₹999</span>
                  <span className="font-bold text-white ml-2">₹249/year</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="bg-gray-50 py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block bg-teal-100 text-teal-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
              Our Promise
            </span>
            <h2 className="text-3xl font-bold text-gray-800">Brims Ko Kyun Chunein?</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {whyUs.map(({ icon, title, desc }) => (
              <div key={title}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="text-2xl mb-2">{icon}</div>
                <h4 className="font-bold text-gray-800 mb-1 text-sm">{title}</h4>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial / Trust strip ── */}
      <section className="bg-teal-600 py-10 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center gap-1 mb-2">
            {"★★★★★".split("").map((s, i) => (
              <span key={i} className="text-yellow-400 text-xl">{s}</span>
            ))}
          </div>
          <p className="text-white text-lg font-semibold mb-1">
            "Brims ne meri surgery booking itni aasaan bana di — bilkul seedha aur transparent!"
          </p>
          <p className="text-teal-200 text-sm">— Ramesh Kumar, Patna</p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-gradient-to-br from-teal-700 to-teal-900 text-white text-center py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Abhi Start Karein</h2>
          <p className="text-teal-200 mb-8 text-base leading-relaxed">
            Family Health Card activate karein aur puri family ko
            affordable healthcare milega — sirf ₹249/year mein.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="/login"
              className="bg-white text-teal-700 font-bold px-8 py-3.5 rounded-full hover:bg-teal-50 transition shadow-lg text-base">
              Login / Register — Free
            </a>
            <a href="/opd-booking"
              className="border-2 border-white/50 text-white font-semibold px-8 py-3.5 rounded-full hover:bg-white/10 transition text-base">
              Book OPD Now
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-white px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">

            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-3">
                <img src="/logo.png" alt="Brims" className="h-11 w-11 rounded-full bg-white p-0.5 object-contain shadow" />
                <div>
                  <p className="font-bold text-lg">Brims Hospitals</p>
                  <p className="text-gray-400 text-xs">Making Healthcare Affordable</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-3">
                SH-73, Rambagh, Taraiya, Chapra, Bihar — 841424
              </p>
              <div className="flex gap-3">
                <a href="tel:112"
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-full transition">
                  📞 112 Emergency
                </a>
                <a href="/contact"
                  className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-full transition">
                  💬 Contact Us
                </a>
              </div>
            </div>

            <div>
              <p className="font-semibold mb-4 text-gray-300 text-xs uppercase tracking-wider">Services</p>
              <div className="space-y-2">
                {[
                  ["OPD Booking",      "/opd-booking"      ],
                  ["Lab Tests",        "/lab-tests"        ],
                  ["Surgery Packages", "/surgery-packages" ],
                  ["Teleconsultation", "/teleconsultation" ],
                  ["IPD Admission",    "/ipd-booking"      ],
                  ["Ambulance",        "/ambulance"        ],
                ].map(([label, href]) => (
                  <a key={href} href={href}
                    className="block text-gray-400 hover:text-white text-sm transition">
                    {label}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <p className="font-semibold mb-4 text-gray-300 text-xs uppercase tracking-wider">Quick Links</p>
              <div className="space-y-2">
                {[
                  ["My Bookings",         "/my-bookings"         ],
                  ["Dashboard",           "/dashboard"           ],
                  ["Find Hospitals",       "/hospitals"           ],
                  ["Health Articles",     "/articles"            ],
                  ["Contact Us",          "/contact"             ],
                  ["Hospital Onboarding", "/hospital-onboarding" ],
                ].map(([label, href]) => (
                  <a key={href} href={href}
                    className="block text-gray-400 hover:text-white text-sm transition">
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-2 text-gray-500 text-sm">
            <p>© 2026 Brims Hospitals. All rights reserved.</p>
            <p>Patna, Bihar, India — Making Healthcare Affordable</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
