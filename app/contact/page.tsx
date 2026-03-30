"use client";
import Header from "../components/header";
import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", mobile: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!form.name || !form.mobile || !form.message) {
      alert("Please fill all required fields");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
<Header />

      {/* Hero */}
      <section className="bg-teal-50 py-12 text-center px-6">
        <h2 className="text-4xl font-bold text-teal-700 mb-3">Contact Us</h2>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          We are here to help. Reach out to us anytime.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-2 gap-10">

        {/* Left — Contact Info */}
        <div className="space-y-6">

          <h3 className="text-2xl font-bold text-teal-700">Get In Touch</h3>
          <p className="text-gray-500 text-sm">
            Have questions about our services, appointments, or billing? Our team is available to assist you.
          </p>

          {/* Info Cards */}
          {[
            {
              icon: "📍",
              title: "Address",
              lines: ["Brims Hospitals", "SH-73, Rambagh, Taraiya, Chapra Bihar — 841424", "India"],
            },
            {
              icon: "📞",
              title: "Phone",
              lines: ["Emergency: +91 99555 64596", "OPD Booking: +91 91234 56789", "Mon–Sat: 8:00 AM – 8:00 PM"],
            },
            {
              icon: "📧",
              title: "Email",
              lines: ["info@brimshospitals.com", "opd@brimshospitals.com"],
            },
            {
              icon: "🕐",
              title: "Working Hours",
              lines: ["OPD: Mon–Sat 8AM–8PM", "Emergency: 24/7", "Lab: Mon–Sun 7AM–9PM"],
            },
          ].map((item, i) => (
            <div key={i} className="flex gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="text-3xl">{item.icon}</div>
              <div>
                <h4 className="font-bold text-gray-800 text-sm mb-1">{item.title}</h4>
                {item.lines.map((line, j) => (
                  <p key={j} className="text-gray-500 text-sm">{line}</p>
                ))}
              </div>
            </div>
          ))}

          {/* Quick Actions */}
          <div className="flex gap-3">
            <a href="tel:+919955564596"
              className="flex-1 bg-teal-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-teal-700 transition text-center">
              Call Now
            </a>
            <a href="https://wa.me/919955564596" target="_blank"
              className="flex-1 bg-green-500 text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-600 transition text-center">
              WhatsApp
            </a>
          </div>

        </div>

        {/* Right — Contact Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          {!submitted ? (
            <>
              <h3 className="text-xl font-bold text-gray-800 mb-1">Send a Message</h3>
              <p className="text-gray-400 text-sm mb-5">We will get back to you within 24 hours.</p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Full Name *</label>
                  <input type="text" value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="Your full name"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Mobile *</label>
                  <div className="flex border border-gray-200 rounded-xl overflow-hidden focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100">
                    <span className="bg-gray-50 text-gray-500 px-4 flex items-center text-sm border-r border-gray-200">+91</span>
                    <input type="tel" maxLength={10} value={form.mobile}
                      onChange={e => setForm({...form, mobile: e.target.value.replace(/\D/g,"")})}
                      placeholder="10-digit number"
                      className="flex-1 px-4 py-3 outline-none text-sm" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Email (Optional)</label>
                  <input type="email" value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    placeholder="yourname@email.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Subject</label>
                  <select value={form.subject}
                    onChange={e => setForm({...form, subject: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-gray-600">
                    <option value="">Select subject</option>
                    <option>OPD Appointment Query</option>
                    <option>Lab Test Query</option>
                    <option>Billing / Payment</option>
                    <option>Teleconsultation</option>
                    <option>Surgery Package</option>
                    <option>Feedback / Complaint</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Message *</label>
                  <textarea value={form.message}
                    onChange={e => setForm({...form, message: e.target.value})}
                    placeholder="Write your message here..."
                    rows={4}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 resize-none" />
                </div>

                <button onClick={handleSubmit} disabled={loading}
                  className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition disabled:opacity-60">
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✓</div>
              <h3 className="text-xl font-bold text-teal-700 mb-2">Message Sent!</h3>
              <p className="text-gray-400 text-sm mb-6">
                Thank you, {form.name}! We will contact you within 24 hours.
              </p>
              <button onClick={() => { setSubmitted(false); setForm({ name:"", mobile:"", email:"", subject:"", message:"" }); }}
                className="bg-teal-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-teal-700 transition">
                Send Another Message
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="max-w-6xl mx-auto px-6 pb-14">
        <div className="bg-teal-100 rounded-2xl h-48 flex items-center justify-center border border-teal-200">
          <div className="text-center">
            <p className="text-4xl mb-2">📍</p>
            <p className="text-teal-700 font-semibold">Brims Hospitals, Patna, Bihar</p>
            <a href="https://maps.google.com" target="https://maps.app.goo.gl/P3FZEXqioTcuahPv6"
              className="text-teal-600 text-sm underline mt-1 block">
              View on Google Maps
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-teal-700 text-white text-center py-6">
        <p className="text-sm">© 2026 Brims Hospitals. All rights reserved.</p>
        <p className="text-teal-300 text-xs mt-1">Making Healthcare Affordable</p>
      </footer>

    </main>
  );
}
