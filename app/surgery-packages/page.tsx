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
  const [total, setTotal] = useState<number | null>(null);
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
  const [activatingCard, setActivatingCard] = useState(false);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [localDraft, setLocalDraft] = useState<any>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isPartialBooking, setIsPartialBooking] = useState(false);
  const [prevReportUrl, setPrevReportUrl] = useState("");
  const [reportUploading, setReportUploading] = useState(false);

  // Promo code
  const [promoInput, setPromoInput]     = useState("");
  const [promoData, setPromoData]       = useState<any>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError]     = useState("");

  // Auto-search on select filter change
  useEffect(() => { fetchPackages(); }, [district, category, maxPrice]);

  // Debounce text search
  useEffect(() => {
    const t = setTimeout(() => fetchPackages(), 500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    fetchUserData();
    fetchPendingBookings();

    const params = new URLSearchParams(window.location.search);
    if (params.get("activated") === "1") {
      setMessage("✅ Family Card activate ho gayi! Ab aap Member Price par book kar sakte hain.");
      window.history.replaceState({}, "", "/surgery-packages");
      const draftId = sessionStorage.getItem("surgeryDraftId");
      if (draftId) {
        sessionStorage.removeItem("surgeryDraftId");
        sessionStorage.setItem("surgeryAutoOpen", draftId);
      }
    }

    // Check localStorage draft
    try {
      const raw = localStorage.getItem("surgeryDraft");
      if (raw) {
        const d = JSON.parse(raw);
        if (d.ts && Date.now() - d.ts < 2 * 60 * 60 * 1000) setLocalDraft(d);
        else localStorage.removeItem("surgeryDraft");
      }
    } catch { localStorage.removeItem("surgeryDraft"); }
  }, []);

  // ── BookingDraft auto-save ────────────────────────────────────────────────
  async function saveDraft(stage: number, extra: Record<string, any> = {}, pkgOverride?: any) {
    const pkg = pkgOverride || selectedPackage;
    if (!pkg) return;
    try {
      const body: any = {
        type: "Surgery", itemId: pkg._id, itemType: "SurgeryPackage",
        itemName: pkg.name, hospitalName: pkg.hospitalName,
        amount: pkg.offerPrice, stage, ...extra,
      };
      if (draftId) body.draftId = draftId;
      const res  = await fetch("/api/booking-draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success && data.draftId) setDraftId(data.draftId);
    } catch {}
  }

  // Stage 1: package selected
  useEffect(() => {
    if (!selectedPackage) { setDraftId(null); return; }
    saveDraft(1, {}, selectedPackage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPackage?._id]);

  // Stage 2: patient selected
  useEffect(() => {
    if (!selectedPackage || !selectedPatient || !draftId) return;
    saveDraft(2, { patientInfo: { name: selectedPatient.name, mobile: selectedPatient.mobile, age: selectedPatient.age, gender: selectedPatient.gender } });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatient?.name]);

  // Stage 3: room type selected
  useEffect(() => {
    if (!selectedPackage || !draftId || !selectedRoom) return;
    saveDraft(3, { slotInfo: { date: "", slot: selectedRoom } });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom]);

  // Stage 4: partial booking toggled
  useEffect(() => {
    if (!selectedPackage || !draftId) return;
    saveDraft(4, { paymentMode: isPartialBooking ? "partial" : "counter" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPartialBooking]);

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
      if (data.success) {
        setPackages(data.packages);
        setTotal(data.total ?? null);
        const autoId = sessionStorage.getItem("surgeryAutoOpen");
        if (autoId) {
          sessionStorage.removeItem("surgeryAutoOpen");
          const p = data.packages.find((p: any) => p._id === autoId);
          if (p) setTimeout(() => { setSelectedPackage(p); setSelectedRoom(p.roomType); setMessage(""); setSelectedPatient(null); setIsPartialBooking(false); setPromoInput(""); setPromoData(null); setPromoError(""); }, 300);
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function fetchPendingBookings() {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    try {
      const res  = await fetch(`/api/my-bookings?userId=${userId}&type=Surgery&status=pending`);
      const data = await res.json();
      if (data.success) setPendingBookings(data.bookings?.slice(0, 3) || []);
    } catch {}
  }

  async function activateCard() {
    const userId = localStorage.getItem("userId");
    if (!userId) { setMessage("❌ Pehle login karein"); return; }
    if (selectedPackage) sessionStorage.setItem("surgeryDraftId", selectedPackage._id);
    setActivatingCard(true);
    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, returnUrl: "/surgery-packages" }),
      });
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setMessage("❌ " + (data.message || "Payment shuru nahi ho saka"));
        setActivatingCard(false);
      }
    } catch {
      setMessage("❌ Network error");
      setActivatingCard(false);
    }
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

  async function applyPromo() {
    if (!promoInput.trim() || !selectedPackage) return;
    setPromoLoading(true); setPromoError(""); setPromoData(null);
    try {
      const baseAmount = getPrice(selectedPackage) + getRoomPrice(selectedPackage);
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim(), amount: baseAmount, bookingType: "Surgery" }),
      });
      const data = await res.json();
      if (data.success) setPromoData(data);
      else setPromoError(data.message);
    } catch { setPromoError("Network error. Dobara try karein."); }
    setPromoLoading(false);
  }

  async function handleBooking() {
    if (!selectedPackage) return;
    if (!selectedPatient) { setMessage("❌ Patient select karein"); return; }
    setBooking(true);
    try {
      const userId = localStorage.getItem("userId");
      const familyCardId = localStorage.getItem("familyCardId") || null;
      const baseAmount  = getPrice(selectedPackage) + getRoomPrice(selectedPackage);
      const finalAmount = promoData ? promoData.finalAmount : baseAmount;
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
          amount: finalAmount,
          familyCardId,
          isPartialBooking,
          depositAmount: isPartialBooking ? 1000 : undefined,
          previousReportUrl: prevReportUrl || undefined,
          ...(promoData && { promoCode: promoData.code, promoDiscount: promoData.discount }),
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (draftId) {
          fetch("/api/booking-draft", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draftId, status: "converted", convertedBookingId: data.booking?.bookingId }) }).catch(() => {});
        }
        const savedVsMrp = (selectedPackage.mrp || 0) - finalAmount;
        const couldSave  = !hasMembership && selectedPackage.membershipPrice
          ? selectedPackage.offerPrice - selectedPackage.membershipPrice : 0;
        let successMsg = `✅ Booking confirm! ID: ${data.booking.bookingId}. Team 24h mein contact karegi.`;
        if (savedVsMrp > 0) successMsg += ` MRP se ₹${savedVsMrp.toLocaleString("en-IN")} bachaye!`;
        if (couldSave  > 0) successMsg += ` 💳 Card activate karo aur ₹${couldSave.toLocaleString("en-IN")} aur bachao!`;
        setMessage(successMsg);
        localStorage.removeItem("surgeryDraft");
        setDraftId(null);
        fetchPendingBookings();
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

        {/* Draft resume banner */}
        {localDraft && !selectedPackage && (
          <div className="mb-4 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold">↩️ Wahan se shuru karein jahan chode tha!</p>
              <p className="text-teal-100 text-xs mt-0.5 truncate">"{localDraft.pkgName}" · {localDraft.hospitalName}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  const p = packages.find((p: any) => p._id === localDraft.pkgId);
                  if (p) { setSelectedPackage(p); setSelectedRoom(p.roomType); setMessage(""); setSelectedPatient(null); setIsPartialBooking(false); setPromoInput(""); setPromoData(null); setPromoError(""); }
                }}
                className="bg-white text-teal-700 text-xs font-bold px-3 py-2 rounded-xl hover:bg-teal-50">
                Resume →
              </button>
              <button onClick={() => { setLocalDraft(null); localStorage.removeItem("surgeryDraft"); }}
                className="text-teal-200 hover:text-white text-sm px-1">✕</button>
            </div>
          </div>
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
            {loading ? "Dhundh rahe hain..." : "Search Karein"}
          </button>
        </div>

        {/* In-progress bookings banner */}
        {pendingBookings.length > 0 && (
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 mb-5">
            <p className="text-sm font-bold text-teal-700 mb-2">📋 Aapki pending Surgery bookings — hamaari team contact karegi:</p>
            <div className="space-y-2">
              {pendingBookings.map((b: any) => (
                <div key={b._id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border border-teal-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{b.packageName || "Surgery Package"}</p>
                    <p className="text-xs text-gray-500">{b.patientName || ""} · {b.bookingId}</p>
                  </div>
                  <a href="/my-bookings" className="text-xs font-bold text-teal-600 bg-white border border-teal-300 px-3 py-1.5 rounded-lg whitespace-nowrap hover:bg-teal-50">
                    Track →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Membership Banner */}
        {!hasMembership && (
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-4 text-white mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold">💳 Family Card se badi bachat!</p>
                <p className="text-sm text-teal-100">Surgery packages par Member Price milega — hazaron bacho</p>
              </div>
              <button onClick={activateCard} disabled={activatingCard}
                className="bg-white text-teal-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-50 flex-shrink-0 disabled:opacity-70">
                {activatingCard ? "..." : "₹249/yr →"}
              </button>
            </div>
            <p className="text-xs text-teal-200 mt-2">👇 Neeche diye price tags mein green 💳 Member Price dekho — kitna bachega!</p>
          </div>
        )}

        {/* Packages List */}
        {!loading && total !== null && (
          <p className="text-sm text-gray-500 mb-3">
            {total === 0 ? "Koi package nahi mila" : `${total} package${total === 1 ? "" : "s"} mile`}
            {(search || district || category || maxPrice) ? " — filters lagaye hain" : ""}
          </p>
        )}
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
                    <div className="ml-4 flex-shrink-0 text-right min-w-[88px] flex flex-col items-end">
                      <p className="text-[11px] text-gray-400 line-through leading-none mb-1">MRP ₹{pkg.mrp.toLocaleString()}</p>
                      {hasMembership ? (
                        <>
                          {pkg.membershipPrice && pkg.membershipPrice < pkg.offerPrice && (
                            <p className="text-[11px] text-gray-400 line-through leading-none mb-0.5">₹{pkg.offerPrice.toLocaleString()}</p>
                          )}
                          <p className="text-xl font-black text-teal-600 leading-none">₹{getPrice(pkg).toLocaleString()}</p>
                          {pkg.mrp > getPrice(pkg) && (
                            <span className="inline-block mt-1.5 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              ✓ ₹{(pkg.mrp - getPrice(pkg)).toLocaleString()} saved
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-xl font-black text-teal-700 leading-none">₹{pkg.offerPrice.toLocaleString()}</p>
                          {pkg.membershipPrice && pkg.membershipPrice < pkg.offerPrice && (
                            <div className="mt-1.5 bg-green-50 border border-green-200 rounded-lg px-2 py-1 text-right">
                              <p className="text-[10px] text-gray-500 leading-none mb-0.5">💳 Member</p>
                              <p className="text-sm font-black text-green-600 leading-none">₹{pkg.membershipPrice.toLocaleString()}</p>
                              <p className="text-[10px] text-amber-600 font-semibold leading-none mt-0.5">₹{(pkg.offerPrice - pkg.membershipPrice).toLocaleString()} extra off</p>
                            </div>
                          )}
                        </>
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

                  <button onClick={() => { setSelectedPackage(pkg); setSelectedRoom(pkg.roomType); setMessage(""); setSelectedPatient(null); setIsPartialBooking(false); setPromoInput(""); setPromoData(null); setPromoError(""); localStorage.setItem("surgeryDraft", JSON.stringify({ pkgId: pkg._id, pkgName: pkg.name, hospitalName: pkg.hospitalName, amount: pkg.offerPrice, ts: Date.now() })); }}
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

                {/* Promo Code */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">🏷️ Promo Code (Optional)</p>
                  <div className="flex gap-2">
                    <input
                      value={promoInput}
                      onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoData(null); setPromoError(""); }}
                      placeholder="Code enter karein"
                      className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 font-mono uppercase"
                    />
                    <button
                      type="button"
                      onClick={applyPromo}
                      disabled={promoLoading || !promoInput.trim()}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
                    >
                      {promoLoading ? "..." : "Apply"}
                    </button>
                  </div>
                  {promoData && (
                    <div className="mt-2 flex items-center justify-between p-2.5 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 text-base">✅</span>
                        <div>
                          <p className="text-xs font-bold text-green-700">{promoData.code} applied!</p>
                          <p className="text-[11px] text-green-600">₹{promoData.discount.toLocaleString("en-IN")} discount mila</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => { setPromoData(null); setPromoInput(""); }} className="text-gray-400 hover:text-red-500 text-sm">✕</button>
                    </div>
                  )}
                  {promoError && <p className="mt-1.5 text-xs text-red-500">{promoError}</p>}
                </div>

                {/* Card activation nudge for non-members */}
                {!hasMembership && selectedPackage.membershipPrice && selectedPackage.membershipPrice < selectedPackage.offerPrice && (
                  <div className="rounded-2xl overflow-hidden border border-amber-200 mb-3">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-400 px-4 py-2 flex items-center gap-2">
                      <span className="text-white text-lg">💳</span>
                      <p className="text-white text-xs font-bold flex-1">Family Card activate karein — sirf ₹249/year</p>
                      <button onClick={activateCard} disabled={activatingCard}
                        className="bg-white text-amber-600 text-xs font-black px-3 py-1 rounded-full whitespace-nowrap disabled:opacity-70">
                        {activatingCard ? "..." : "Abhi Activate →"}
                      </button>
                    </div>
                    <div className="bg-amber-50 px-4 py-2 flex items-center justify-between">
                      <span className="text-xs text-amber-700">Is package par aur kitna bachega:</span>
                      <span className="text-sm font-black text-amber-700">₹{(selectedPackage.offerPrice - selectedPackage.membershipPrice).toLocaleString("en-IN")} extra savings</span>
                    </div>
                  </div>
                )}

                {/* Total Price — receipt-style breakdown */}
                <div className="rounded-2xl overflow-hidden border border-gray-200 mb-4">
                  <div className="bg-gray-50 px-4 pt-3 pb-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">MRP</span>
                      <span className="text-xs text-gray-400 line-through font-medium">₹{selectedPackage.mrp.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                        Offer Price
                      </span>
                      <span className={`text-xs font-semibold ${hasMembership && selectedPackage.membershipPrice && selectedPackage.membershipPrice < selectedPackage.offerPrice ? "text-gray-400 line-through" : "text-gray-700"}`}>
                        ₹{selectedPackage.offerPrice.toLocaleString()}
                      </span>
                    </div>
                    {selectedPackage.membershipPrice && (
                      <div className="flex justify-between items-center">
                        <span className={`text-xs flex items-center gap-1.5 ${hasMembership ? "text-teal-600 font-semibold" : "text-gray-400"}`}>
                          <span className="text-sm leading-none">💳</span>
                          Member Price
                          {!hasMembership && (
                            <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">Card chahiye</span>
                          )}
                        </span>
                        <span className={`text-xs font-bold ${hasMembership ? "text-teal-600" : "text-gray-400"}`}>
                          ₹{selectedPackage.membershipPrice.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {getRoomPrice(selectedPackage) > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 flex items-center gap-1.5">
                          <span className="text-sm leading-none">🏠</span>
                          Room upgrade
                        </span>
                        <span className="text-xs font-semibold text-gray-600">+₹{getRoomPrice(selectedPackage).toLocaleString()}</span>
                      </div>
                    )}
                    {/* Promo discount */}
                    {promoData && (
                      <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                        <span className="text-xs text-green-600 font-semibold flex items-center gap-1.5">
                          <span className="text-sm leading-none">🏷️</span>
                          Promo ({promoData.code})
                        </span>
                        <span className="text-xs font-bold text-green-600">−₹{promoData.discount.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    {isPartialBooking && (
                      <div className="pt-1.5 border-t border-gray-200 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-amber-600 font-semibold flex items-center gap-1.5">
                            <span className="text-sm leading-none">💰</span>
                            Advance (abhi)
                          </span>
                          <span className="text-xs font-bold text-amber-600">₹1,000</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">Balance (surgery ke din)</span>
                          <span className="text-xs text-gray-400">₹{((promoData ? promoData.finalAmount : getPrice(selectedPackage) + getRoomPrice(selectedPackage)) - 1000).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-teal-600 px-4 py-3 flex justify-between items-center">
                    <div>
                      <p className="text-teal-100 text-[11px] font-medium uppercase tracking-wide">
                        {isPartialBooking ? "Abhi Pay Karein" : "Aap Pay Karein"}
                      </p>
                      {selectedPackage.mrp > (promoData ? promoData.finalAmount : getPrice(selectedPackage)) && (
                        <p className="text-teal-200 text-[10px] mt-0.5">
                          MRP se ₹{(selectedPackage.mrp - (promoData ? promoData.finalAmount : getPrice(selectedPackage))).toLocaleString("en-IN")} ki bachat
                        </p>
                      )}
                    </div>
                    <p className="text-white text-2xl font-black">
                      ₹{isPartialBooking ? (1000).toLocaleString() : (promoData ? promoData.finalAmount : getPrice(selectedPackage) + getRoomPrice(selectedPackage)).toLocaleString()}
                    </p>
                  </div>
                </div>

                {message && (
                  <div className={`mb-4 p-3 rounded-lg text-sm ${
                    message.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}>{message}</div>
                )}

                <button onClick={handleBooking} disabled={booking}
                  className={`w-full font-semibold py-3 rounded-lg transition disabled:opacity-50 text-white ${isPartialBooking ? "bg-amber-500 hover:bg-amber-600" : "bg-teal-600 hover:bg-teal-700"}`}>
                  {booking ? "Booking ho rahi hai..." : isPartialBooking ? "Partial Book Karein — ₹1,000 Advance" : `Book Karein — ₹${(promoData ? promoData.finalAmount : getPrice(selectedPackage) + getRoomPrice(selectedPackage)).toLocaleString()}`}
                </button>

                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-gray-400">🔒 Safe & Secure booking</p>
                  <a href="tel:9876543210" className="text-[11px] text-teal-600 font-medium hover:underline">📞 Help: 9876543210</a>
                </div>
                <a href={`https://wa.me/919876543210?text=${encodeURIComponent(`Namaskar! Mujhe ${selectedPackage.name} surgery package ke baare mein jaankari chahiye.`)}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 border border-green-200 text-green-700 text-xs font-semibold py-2.5 rounded-xl hover:bg-green-50 transition">
                  💬 WhatsApp par puchein
                </a>
                <p className="text-xs text-gray-400 text-center">
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