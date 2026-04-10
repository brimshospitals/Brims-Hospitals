"use client";
import { useState, useEffect } from "react";
import Header from "../components/header";

const categories = [
  "General Surgery", "Laparoscopic Surgery", "Cardiac Surgery",
  "Orthopedic Surgery", "Gynecology", "Neurosurgery", "Urology",
];

const biharDistricts = [
  "Patna", "Saran", "Siwan", "Gopalganj", "Gaya", "Muzaffarpur",
  "Bhagalpur", "Nalanda", "Vaishali", "Darbhanga",
];

export default function SurgeryPackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("");
  const [category, setCategory] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [hasMembership, setHasMembership] = useState(false);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPackages();
    fetchUserData();
  }, []);

  async function fetchPackages() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (district) params.append("district", district);
      if (category) params.append("category", category);
      if (maxPrice) params.append("maxPrice", maxPrice);

      const res = await fetch(`/api/surgery-packages?${params}`);
      const data = await res.json();
      if (data.success) setPackages(data.packages);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function fetchUserData() {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    try {
      const res = await fetch(`/api/profile?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setFamilyMembers(data.familyMembers || []);
        setHasMembership(!!data.familyCard);
        if (data.familyMembers?.length > 0) {
          setSelectedMember(data.familyMembers[0]._id);
        }
      }
    } catch (e) { console.error(e); }
  }

  function getPrice(pkg: any) {
    if (hasMembership && pkg.membershipPrice) return pkg.membershipPrice;
    return pkg.offerPrice;
  }

  function getRoomPrice(pkg: any) {
    if (!selectedRoom) return 0;
    const room = pkg.roomOptions?.find((r: any) => r.type === selectedRoom);
    return room?.extraCharge || 0;
  }

  async function handleBooking() {
    if (!selectedPackage) return;
    setBooking(true);
    try {
      const userId = localStorage.getItem("userId");
      const res = await fetch("/api/book-surgery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          memberId: selectedMember,
          packageId: selectedPackage._id,
          roomType: selectedRoom || selectedPackage.roomType,
          amount: getPrice(selectedPackage) + getRoomPrice(selectedPackage),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`✅ ${data.message} Booking ID: ${data.bookingId}`);
        setSelectedPackage(null);
      } else {
        setMessage("❌ " + data.message);
      }
    } catch {
      setMessage("❌ Network error");
    }
    setBooking(false);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto py-8 px-4">

        <h1 className="text-2xl font-bold text-gray-800 mb-2">🏥 Surgery Packages</h1>
        <p className="text-gray-500 text-sm mb-6">Best hospitals ke surgery packages compare karein aur book karein</p>

        {message && (
          <div className={`mb-4 p-4 rounded-xl text-sm font-medium ${
            message.startsWith("✅") ? "bg-green-50 border border-green-200 text-green-700"
            : "bg-red-50 border border-red-200 text-red-700"
          }`}>{message}</div>
        )}

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Surgery ka naam, category ya surgeon search karein..."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-3" />
          <div className="grid grid-cols-3 gap-3">
            <select value={district} onChange={(e) => setDistrict(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">Sabhi Zile</option>
              {biharDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">Sabhi Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">Koi bhi price</option>
              <option value="30000">₹30,000 tak</option>
              <option value="50000">₹50,000 tak</option>
              <option value="100000">₹1,00,000 tak</option>
              <option value="200000">₹2,00,000 tak</option>
            </select>
          </div>
          <button onClick={fetchPackages}
            className="mt-3 w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition">
            Search Karein
          </button>
        </div>

        {/* Membership Banner */}
        {!hasMembership && (
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-4 text-white mb-6 flex justify-between items-center">
            <div>
              <p className="font-bold">💳 Family Card se extra discount!</p>
              <p className="text-sm text-teal-100">Card members ko 8-20% extra discount milta hai</p>
            </div>
            <a href="/dashboard" className="bg-white text-teal-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-50">
              Activate
            </a>
          </div>
        )}

        {/* Packages List */}
        {loading ? (
          <div className="text-center py-10 text-teal-600">Packages dhundh rahe hain...</div>
        ) : packages.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-3">🏥</p>
            <p>Koi package nahi mila. Filter change karke try karein.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {packages.map((pkg) => (
              <div key={pkg._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full font-medium">{pkg.category}</span>
                        {pkg.rating > 0 && <span className="text-xs text-yellow-500">⭐ {pkg.rating}</span>}
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg">{pkg.name}</h3>
                      <p className="text-sm text-gray-500">🏥 {pkg.hospitalName}</p>
                      {pkg.address?.district && <p className="text-xs text-gray-400">📍 {pkg.address.district}</p>}
                    </div>
                    {/* Price */}
                    <div className="text-right ml-4">
                      <p className="text-xs text-gray-400 line-through">₹{pkg.mrp.toLocaleString()}</p>
                      <p className="text-xl font-bold text-teal-600">₹{getPrice(pkg).toLocaleString()}</p>
                      {hasMembership && pkg.membershipDiscount > 0 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          {pkg.membershipDiscount}% Member Discount
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>🛏️</span>
                      <span>{pkg.stayDays} din stay • {pkg.roomType} Room</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{pkg.foodIncluded ? "🍽️ Khana included" : "🍽️ Khana alag"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{pkg.pickupFromHome ? "🚗 Pickup FREE" : "🚗 Pickup nahi"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>👨‍⚕️ {pkg.surgeonName}</span>
                    </div>
                  </div>

                  {/* Surgeon */}
                  <div className="bg-blue-50 rounded-xl p-3 mb-3">
                    <p className="text-sm font-medium text-blue-800">{pkg.surgeonName}</p>
                    <p className="text-xs text-blue-600">{pkg.surgeonDegrees?.join(", ")} • {pkg.surgeonExperience} saal experience</p>
                  </div>

                  {/* Inclusions */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-1">Package mein shamil:</p>
                    <div className="flex flex-wrap gap-1">
                      {pkg.inclusions?.slice(0, 4).map((inc: string, i: number) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">✓ {inc}</span>
                      ))}
                      {pkg.inclusions?.length > 4 && (
                        <span className="text-xs text-teal-600">+{pkg.inclusions.length - 4} aur</span>
                      )}
                    </div>
                  </div>

                  <button onClick={() => { setSelectedPackage(pkg); setSelectedRoom(pkg.roomType); setMessage(""); }}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition text-sm">
                    Details Dekhein & Book Karein
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Booking Modal */}
        {selectedPackage && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
                <h2 className="font-bold text-gray-800">Package Details & Booking</h2>
                <button onClick={() => setSelectedPackage(null)} className="text-gray-400 text-xl">✕</button>
              </div>

              <div className="p-5">
                {/* Package Summary */}
                <h3 className="font-bold text-gray-800 text-lg mb-1">{selectedPackage.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{selectedPackage.description}</p>

                {/* All Inclusions */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Package mein kya kya shamil hai:</p>
                  <div className="space-y-1">
                    {selectedPackage.inclusions?.map((inc: string, i: number) => (
                      <p key={i} className="text-sm text-gray-600">✅ {inc}</p>
                    ))}
                    {selectedPackage.foodIncluded && (
                      <p className="text-sm text-gray-600">✅ Khana: {selectedPackage.foodDetails}</p>
                    )}
                    {selectedPackage.pickupFromHome && (
                      <p className="text-sm text-gray-600">✅ Ghar se pickup {selectedPackage.pickupCharge === 0 ? "(FREE)" : `(₹${selectedPackage.pickupCharge})`}</p>
                    )}
                    {selectedPackage.postCareIncluded && (
                      <p className="text-sm text-gray-600">✅ Post surgery care included</p>
                    )}
                    {selectedPackage.followUpConsultations > 0 && (
                      <p className="text-sm text-gray-600">✅ {selectedPackage.followUpConsultations} follow-up consultations</p>
                    )}
                  </div>
                </div>

                {/* Pre-surgery Tests */}
                {selectedPackage.preSurgeryTests?.length > 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                    <p className="text-sm font-medium text-yellow-800 mb-1">Pre-surgery tests (included):</p>
                    {selectedPackage.preSurgeryTests.map((test: string, i: number) => (
                      <p key={i} className="text-xs text-yellow-700">• {test}</p>
                    ))}
                  </div>
                )}

                {/* Room Type Selection */}
                {selectedPackage.roomOptions?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Room Type Select Karein:</p>
                    <div className="space-y-2">
                      {selectedPackage.roomOptions.map((room: any, i: number) => (
                        <label key={i} className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition ${
                          selectedRoom === room.type ? "border-teal-500 bg-teal-50" : "border-gray-200"
                        }`}>
                          <div className="flex items-center gap-2">
                            <input type="radio" name="room" value={room.type}
                              checked={selectedRoom === room.type}
                              onChange={() => setSelectedRoom(room.type)}
                              className="accent-teal-600" />
                            <span className="text-sm font-medium">{room.type} Room</span>
                          </div>
                          <span className="text-sm text-teal-600 font-medium">
                            {room.extraCharge === 0 ? "Included" : `+₹${room.extraCharge.toLocaleString()}`}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Family Member */}
                {familyMembers.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Kiske liye booking hai?</p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {familyMembers.map((m) => (
                        <button key={m._id} onClick={() => setSelectedMember(m._id)}
                          className={`flex flex-col items-center p-2 rounded-xl border min-w-[70px] transition ${
                            selectedMember === m._id ? "border-teal-500 bg-teal-50" : "border-gray-200"
                          }`}>
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 mb-1">
                            {m.photo ? <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center">👤</div>}
                          </div>
                          <p className="text-xs text-center">{m.name.split(" ")[0]}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total Price */}
                <div className="bg-teal-50 rounded-xl p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Package Price</p>
                      <p className="text-xs text-gray-400 line-through">MRP: ₹{selectedPackage.mrp.toLocaleString()}</p>
                    </div>
                    <p className="text-2xl font-bold text-teal-700">
                      ₹{(getPrice(selectedPackage) + getRoomPrice(selectedPackage)).toLocaleString()}
                    </p>
                  </div>
                  {hasMembership && selectedPackage.membershipDiscount > 0 && (
                    <p className="text-xs text-green-600 mt-1">✅ {selectedPackage.membershipDiscount}% membership discount applied!</p>
                  )}
                  {getRoomPrice(selectedPackage) > 0 && (
                    <p className="text-xs text-gray-500 mt-1">Room upgrade charge: +₹{getRoomPrice(selectedPackage).toLocaleString()}</p>
                  )}
                </div>

                {message && (
                  <div className={`mb-4 p-3 rounded-lg text-sm ${
                    message.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}>{message}</div>
                )}

                <button onClick={handleBooking} disabled={booking}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
                  {booking ? "Booking ho rahi hai..." : `Book Karein — ₹${(getPrice(selectedPackage) + getRoomPrice(selectedPackage)).toLocaleString()}`}
                </button>

                <p className="text-xs text-gray-400 text-center mt-3">
                  Booking ke baad hamari team 24 hours mein contact karegi
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}