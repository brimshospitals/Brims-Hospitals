"use client";
import { useState, useEffect } from "react";
import Header from "../components/header";
import PatientSelector, { SelectedPatient } from "../components/PatientSelector";
import { BIHAR_DISTRICTS } from "../../lib/biharDistricts";

const categories = [
  "General Surgery", "Laparoscopic Surgery", "Cardiac Surgery",
  "Orthopedic Surgery", "Gynecology", "Neurosurgery", "Urology",
];

const biharDistricts = BIHAR_DISTRICTS;

export default function SurgeryPackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("");
  const [category, setCategory] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [profile, setProfile]           = useState<any>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<SelectedPatient | null>(null);
  const [hasMembership, setHasMembership] = useState(false);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState("");
  const [isPartialBooking, setIsPartialBooking] = useState(false);
  const [prevReportUrl, setPrevReportUrl] = useState("");
  const [reportUploading, setReportUploading] = useState(false);

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
        setProfile(data.user);
        setFamilyMembers(data.familyMembers || []);
        setHasMembership(!!data.familyCard);
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

  async function handleReportUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReportUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res  = await fetch("/api/upload-photo", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) setPrevReportUrl(data.url);
      else setMessage("❌ Report upload fail: " + data.message);
    } catch { setMessage("❌ Report upload error"); }
    setReportUploading(false);
  }

  async function handleBooking() {
    if (!selectedPackage) return;
    if (!selectedPatient) { setMessage("❌ Patient select karein"); return; }
    setBooking(true);
    try {
      const userId = localStorage.getItem("userId");
      const familyCardId = localStorage.getItem("familyCardId") || null;
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Surgery",
          packageId: selectedPackage._id,
          hospitalId: selectedPackage.hospitalId || null,
          appointmentDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
          slot: "",
          roomType: selectedRoom || selectedPackage.roomType,
          patientUserId: selectedPatient.userId,
          patientName: selectedPatient.name,
          patientMobile: selectedPatient.mobile,
          patientAge: selectedPatient.age,
          patientGender: selectedPatient.gender,
          symptoms: selectedPatient.symptoms,
          isNewPatient: selectedPatient.isNewPatient,
          paymentMode: "counter",
          amount: getPrice(selectedPackage) + getRoomPrice(selectedPackage),
          familyCardId,
          isPartialBooking,
          depositAmount: isPartialBooking ? 1000 : undefined,
          previousReportUrl: prevReportUrl || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`✅ Booking request submit ho gayi! Booking ID: ${data.booking.bookingId}. Hamari team 24 hours mein contact karegi.`);
        setSelectedPackage(null);
        setSelectedPatient(null);
        setPrevReportUrl("");
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

                  <button onClick={() => { setSelectedPackage(pkg); setSelectedRoom(pkg.roomType); setMessage(""); setSelectedPatient(null); setIsPartialBooking(false); }}
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

                {/* Patient Selector */}
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Patient kaun hai?</p>
                  {selectedPatient ? (
                    <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-2xl border border-teal-200">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center font-bold text-teal-700 flex-shrink-0">
                        {selectedPatient.name[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-sm">{selectedPatient.name}</p>
                        <p className="text-xs text-gray-400">{selectedPatient.age} yrs · {selectedPatient.gender}</p>
                      </div>
                      <button onClick={() => setSelectedPatient(null)} className="text-gray-400 text-sm hover:text-red-400">✕</button>
                    </div>
                  ) : (
                    <PatientSelector
                      primaryUser={profile}
                      familyMembers={familyMembers}
                      onSelect={setSelectedPatient}
                    />
                  )}
                </div>

                {/* Partial Booking Option */}
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Booking Type</p>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border cursor-pointer transition ${!isPartialBooking ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <input type="radio" name="bookingType" checked={!isPartialBooking} onChange={() => setIsPartialBooking(false)} className="sr-only" />
                      <span className="text-xl">💳</span>
                      <span className="text-sm font-bold text-gray-800">Full Payment</span>
                      <span className="text-xs text-gray-500 text-center">Poori payment counter par jama karein</span>
                    </label>
                    <label className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border cursor-pointer transition ${isPartialBooking ? "border-amber-500 bg-amber-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <input type="radio" name="bookingType" checked={isPartialBooking} onChange={() => setIsPartialBooking(true)} className="sr-only" />
                      <span className="text-xl">🤝</span>
                      <span className="text-sm font-bold text-gray-800">Partial Booking</span>
                      <span className="text-xs text-gray-500 text-center">Sirf ₹1,000 advance, baaki baad mein</span>
                    </label>
                  </div>
                  {isPartialBooking && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                      <p className="font-semibold mb-0.5">Partial Booking ke baare mein:</p>
                      <p>• Abhi ₹1,000 advance counter par jama karein</p>
                      <p>• Baaki ₹{(getPrice(selectedPackage) + getRoomPrice(selectedPackage) - 1000).toLocaleString()} surgery ke din jama hoga</p>
                      <p>• Hamari team 24 ghante mein date confirm karegi</p>
                    </div>
                  )}
                </div>

                {/* Previous Reports Upload */}
                <div className="mb-4 border border-blue-200 rounded-xl p-4 bg-blue-50">
                  <p className="text-sm font-bold text-blue-800 mb-1">📋 Purani Report Upload Karein (Optional)</p>
                  <p className="text-xs text-blue-600 mb-3">Agar pehle se koi report / prescription hai to upload karein — doctor ko samajhne mein asaani hogi</p>
                  {prevReportUrl ? (
                    <div className="flex items-center gap-3">
                      <span className="text-green-700 text-sm font-semibold">✅ Report uploaded!</span>
                      <a href={prevReportUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">View</a>
                      <button onClick={() => setPrevReportUrl("")} className="text-xs text-red-500 underline">Remove</button>
                    </div>
                  ) : reportUploading ? (
                    <div className="flex items-center gap-2 text-blue-600 text-sm">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </div>
                  ) : (
                    <label className="cursor-pointer inline-flex items-center gap-2 bg-white border-2 border-blue-300 hover:border-blue-400 text-blue-700 text-sm font-semibold px-4 py-2 rounded-xl transition">
                      📎 File Choose Karein
                      <input type="file" accept="image/*,.pdf" onChange={handleReportUpload} className="hidden" />
                    </label>
                  )}
                  <p className="text-[10px] text-blue-400 mt-1">Image ya PDF · Max 10MB</p>
                </div>

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
                  {isPartialBooking && (
                    <div className="mt-2 pt-2 border-t border-teal-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-amber-700 font-semibold">Abhi pay karein (Advance)</span>
                        <span className="text-amber-700 font-black">₹1,000</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                        <span>Balance (surgery ke din)</span>
                        <span>₹{(getPrice(selectedPackage) + getRoomPrice(selectedPackage) - 1000).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>

                {message && (
                  <div className={`mb-4 p-3 rounded-lg text-sm ${
                    message.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}>{message}</div>
                )}

                <button onClick={handleBooking} disabled={booking}
                  className={`w-full font-semibold py-3 rounded-lg transition disabled:opacity-50 text-white ${isPartialBooking ? "bg-amber-500 hover:bg-amber-600" : "bg-teal-600 hover:bg-teal-700"}`}>
                  {booking ? "Booking ho rahi hai..." : isPartialBooking ? "Partial Book Karein — ₹1,000 Advance" : `Book Karein — ₹${(getPrice(selectedPackage) + getRoomPrice(selectedPackage)).toLocaleString()}`}
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