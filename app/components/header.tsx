"use client";

export default function Header() {
  return (
    <header className="bg-teal-600 text-white px-6 py-4 flex justify-between items-center shadow-md">
      <div className="flex items-center gap-3">
        <img
          src="/logo.png"
          alt="Brims Hospitals"
          className="h-14 w-14 object-contain bg-white rounded-full p-1"
        />
        <div>
          <h1 className="text-2xl font-bold">Brims Hospitals</h1>
          <p className="text-teal-100 text-sm">Making Healthcare Affordable</p>
        </div>
      </div>
      <nav className="flex items-center gap-5 text-sm font-medium">
        <a href="/" className="text-teal-100 hover:text-white transition">Home</a>
        <a href="/services" className="text-teal-100 hover:text-white transition">Services</a>
        <a href="/doctors" className="text-teal-100 hover:text-white transition">Doctors</a>
        <a href="/opd-booking" className="text-teal-100 hover:text-white transition">Book OPD</a>
        <a href="/contact" className="text-teal-100 hover:text-white transition">Contact</a>
        <a href="/login" className="bg-white text-teal-600 px-4 py-2 rounded-full text-sm font-bold hover:bg-teal-50 transition">
          Login
        </a>
        <a href="/register" className="bg-teal-800 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-teal-900 transition">
          Register
        </a>
      </nav>
    </header>
  );
}
