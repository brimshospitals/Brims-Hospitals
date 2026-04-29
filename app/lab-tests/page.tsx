"use client";
import { useState, useEffect } from "react";
import Header from "../components/header";
import PatientSelector, { SelectedPatient } from "../components/PatientSelector";
import { BIHAR_DISTRICTS } from "../../lib/biharDistricts";

const categories = [
  "Blood Test", "Urine Test", "Stool Test", "Imaging",
  "ECG", "X-Ray", "Ultrasound", "MRI", "CT Scan", "Pathology",
];

const biharDistricts = BIHAR_DISTRICTS;

const timeSlots = [
  "7:00 AM - 9:00 AM",
  "9:00 AM - 11:00 AM",
  "11:00 AM - 1:00 PM",
  "2:00 PM - 4:00 PM",
  "4:00 PM - 6:00 PM",
];

export default function LabTestsPage() {
  const [tests, setTests]               = useState<any[]>([]);
  const [total, setTotal]               = useState<number | null>(null);
  const [loading, setLoading]           = useState(false);
  const [search, setSearch]             = useState("");
  const [category, setCategory]         = useState("");
  const [district, setDistrict]         = useState("");
  const [maxPrice, setMaxPrice]         = useState("");
  const [homeOnly, setHomeOnly]         = useState(false);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [profile, setProfile]           = useState<any>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<SelectedPatient | null>(null);
  const [hasMembership, setHasMembership]   = useState(false);
  const [walletBalance, setWalletBalance]   = useState(0);
  const [booking, setBooking]           = useState(false);
  const [message, setMessage]           = useState("");
  const [activatingCard, setActivatingCard] = useState(false);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [localDraft, setLocalDraft] = useState<any>(null);
  const [draftId, setDraftId] = useState<string | null>(null);

  // Booking form state
  const [homeCollection, setHomeCollection] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [selectedSlot, setSelectedSlot]     = useState("");
  const [paymentType, setPaymentType]       = useState("counter");

  // Promo code
  const [promoInput, setPromoInput]     = useState("");
  const [promoData, setPromoData]       = useState<any>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError]     = useState("");

  // Home collection address
  const [hcAddress, setHcAddress] = useState({
    flat: "", street: "", landmark: "", district: "Patna", pincode: "",
  });

  // Auto-search on select filter change
  useEffect(() => { fetchTests(); }, [category, district, maxPrice, homeOnly]);

  // Debounce text search
  useEffect(() => {
    const t = setTimeout(() => fetchTests(), 500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    fetchUserData();
    fetchPendingBookings();

    const params = new URLSearchParams(window.location.search);
    const payment   = params.get("payment");
    const activated = params.get("activated");
    const bId       = params.get("bookingId");

    if (payment === "success") {
      setMessage(`✅ Payment successful! Booking confirm ho gayi.${bId ? " Booking ID: " + bId : ""}`);
      window.history.replaceState({}, "", "/lab-tests");
    } else if (payment === "failed") {
      setMessage("❌ Payment fail ho gayi. Dobara try karein.");
      window.history.replaceState({}, "", "/lab-tests");
    // Check localStorage draft (user had selected a test but never booked)
    try {
      const raw = localStorage.getItem("labDraft");
      if (raw) {
        const d = JSON.parse(raw);
        if (d.ts && Date.now() - d.ts < 2 * 60 * 60 * 1000) setLocalDraft(d); // <2hr old
        else localStorage.removeItem("labDraft");
      }
    } catch { localStorage.removeItem("labDraft"); }

    } else if (activated === "1") {
      // Card activate ho gayi — restore draft test if any
      setMessage("✅ Family Card activate ho gayi! Ab aap Member Price par book kar sakte hain.");
      window.history.replaceState({}, "", "/lab-tests");
      const draftId = sessionStorage.getItem("labTestDraftId");
      if (draftId) {
        sessionStorage.removeItem("labTestDraftId");
        // Tests load hone ke baad auto-open karega (handled below in fetchTests)
        sessionStorage.setItem("labTestAutoOpen", draftId);
      }
    }
  }, []);

  // ── BookingDraft auto-save (silent, cross-device funnel tracking) ──────────
  async function saveDraft(stage: number, extra: Record<string, any> = {}, testOverride?: any) {
    const test = testOverride || selectedTest;
    if (!test) return;
    try {
      const body: any = {
        type: "Lab", itemId: test._id, itemType: "LabTest",
        itemName: test.name, hospitalName: test.hospitalName,
        amount: test.offerPrice, stage, ...extra,
      };
      if (draftId) body.draftId = draftId;
      const res  = await fetch("/api/booking-draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success && data.draftId) setDraftId(data.draftId);
    } catch {}
  }

  // Stage 1: when modal opens for a new test
  useEffect(() => {
    if (!selectedTest) { setDraftId(null); return; }
    saveDraft(1, {}, selectedTest);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTest?._id]);

  // Stage 2: patient selected
  useEffect(() => {
    if (!selectedTest || !selectedPatient || !draftId) return;
    saveDraft(2, { patientInfo: { name: selectedPatient.name, mobile: selectedPatient.mobile, age: selectedPatient.age, gender: selectedPatient.gender } });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatient?.name]);

  // Stage 3: date/slot selected
  useEffect(() => {
    if (!selectedTest || !draftId || (!appointmentDate && !selectedSlot)) return;
    const t = setTimeout(() => saveDraft(3, { slotInfo: { date: appointmentDate, slot: selectedSlot } }), 600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentDate, selectedSlot]);

  // Stage 4: payment mode changed
  useEffect(() => {
    if (!selectedTest || !draftId) return;
    saveDraft(4, { paymentMode: paymentType });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentType]);

  async function fetchTests() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)   params.append("search", search);
      if (category) params.append("category", category);
      if (district) params.append("district", district);
      if (maxPrice) params.append("maxPrice", maxPrice);
      if (homeOnly) params.append("homeCollection", "true");
      const res  = await fetch(`/api/lab-tests?${params}`);
      const data = await res.json();
      if (data.success) {
        setTests(data.tests);
        setTotal(data.total ?? null);
        // Auto-open draft test after card activation
        const autoId = sessionStorage.getItem("labTestAutoOpen");
        if (autoId) {
          sessionStorage.removeItem("labTestAutoOpen");
          const t = data.tests.find((t: any) => t._id === autoId);
          if (t) setTimeout(() => openBooking(t), 300);
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function fetchPendingBookings() {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    try {
      const res  = await fetch(`/api/my-bookings?userId=${userId}&type=Lab&status=pending`);
      const data = await res.json();
      if (data.success) setPendingBookings(data.bookings?.slice(0, 3) || []);
    } catch {}
  }

  async function activateCard() {
    const userId = localStorage.getItem("userId");
    if (!userId) { setMessage("❌ Pehle login karein"); return; }
    if (selectedTest) sessionStorage.setItem("labTestDraftId", selectedTest._id);
    setActivatingCard(true);
    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, returnUrl: "/lab-tests" }),
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
      const res  = await fetch(`/api/profile?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setProfile(data.user);
        setFamilyMembers(data.familyMembers || []);
        setHasMembership(!!data.familyCard);
        setWalletBalance(data.familyCard?.walletBalance || 0);
      }
    } catch (e) { console.error(e); }
  }

  function getPrice(test: any) {
    if (hasMembership && test.membershipPrice) return test.membershipPrice;
    return test.offerPrice;
  }

  function getTotalAmount(test: any) {
    let total = getPrice(test);
    if (homeCollection && test.homeCollectionCharge > 0) total += test.homeCollectionCharge;
    return total;
  }

  async function applyPromo() {
    if (!promoInput.trim() || !selectedTest) return;
    setPromoLoading(true); setPromoError(""); setPromoData(null);
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim(), amount: getTotalAmount(selectedTest), bookingType: "Lab" }),
      });
      const data = await res.json();
      if (data.success) setPromoData(data);
      else setPromoError(data.message);
    } catch { setPromoError("Network error. Dobara try karein."); }
    setPromoLoading(false);
  }

  function openBooking(test: any) {
    setSelectedTest(test);
    setHomeCollection(false);
    setAppointmentDate("");
    setSelectedSlot("");
    setPaymentType("online");
    setSelectedPatient(null);
    setHcAddress({ flat: "", street: "", landmark: "", district: "Patna", pincode: "" });
    setPromoInput(""); setPromoData(null); setPromoError("");
    setMessage("");
    // Save draft for abandonment tracking
    localStorage.setItem("labDraft", JSON.stringify({ testId: test._id, testName: test.name, hospitalName: test.hospitalName, amount: test.offerPrice, ts: Date.now() }));
  }

  async function handleBooking() {
    if (!selectedTest) return;
    setBooking(true);
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) { setMessage("❌ Login karein pehle"); setBooking(false); return; }

      if (!selectedPatient) {
        setMessage("❌ Patient select karein");
        setBooking(false);
        return;
      }

      if (homeCollection && (!hcAddress.street || !hcAddress.district)) {
        setMessage("❌ Pickup address fill karein");
        setBooking(false);
        return;
      }

      const familyCardId = localStorage.getItem("familyCardId") || null;

      const baseAmount  = getTotalAmount(selectedTest);
      const finalAmount = promoData ? promoData.finalAmount : baseAmount;

      // Online payment — PhonePe pe redirect karo
      if (paymentType === "online") {
        const res = await fetch("/api/create-lab-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            memberId: selectedPatient.userId || userId,
            labTestId: selectedTest._id,
            appointmentDate: appointmentDate || null,
            slot: homeCollection
              ? `Home Collection${selectedSlot ? " — " + selectedSlot : ""}${hcAddress.district ? " (" + hcAddress.district + ")" : ""}`
              : selectedSlot,
            homeCollection,
            homeAddress: homeCollection ? hcAddress : undefined,
            amount: finalAmount,
            patientName: selectedPatient.name,
            patientMobile: selectedPatient.mobile,
            ...(promoData && { promoCode: promoData.code, promoDiscount: promoData.discount }),
            ...(draftId && { draftId }),
          }),
        });
        const data = await res.json();
        if (data.success && data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          setMessage("❌ " + (data.message || "Payment shuru nahi ho saka"));
        }
        setBooking(false);
        return;
      }

      // Counter / Wallet payment via unified bookings API
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Lab",
          labTestId: selectedTest._id,
          appointmentDate: appointmentDate || new Date().toISOString().split("T")[0],
          slot: homeCollection
            ? `Home Collection${selectedSlot ? " — " + selectedSlot : ""}${hcAddress.district ? " (" + hcAddress.district + ")" : ""}`
            : selectedSlot,
          homeAddress: homeCollection ? hcAddress : undefined,
          patientUserId: selectedPatient.userId,
          patientName: selectedPatient.name,
          patientMobile: selectedPatient.mobile,
          patientAge: selectedPatient.age,
          patientGender: selectedPatient.gender,
          symptoms: selectedPatient.symptoms,
          isNewPatient: selectedPatient.isNewPatient,
          paymentMode: paymentType,
          amount: finalAmount,
          familyCardId,
          ...(promoData && { promoCode: promoData.code, promoDiscount: promoData.discount }),
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Mark draft converted
        if (draftId) {
          fetch("/api/booking-draft", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draftId, status: "converted", convertedBookingId: data.booking?.bookingId }) }).catch(() => {});
        }
        const savedVsMrp = (selectedTest.mrp || 0) - finalAmount;
        const couldSave  = !hasMembership && selectedTest.membershipPrice
          ? selectedTest.offerPrice - selectedTest.membershipPrice : 0;
        let successMsg = `✅ Booking confirm! Booking ID: ${data.booking.bookingId}`;
        if (savedVsMrp > 0) successMsg += ` · MRP se ₹${savedVsMrp.toLocaleString("en-IN")} bachaye!`;
        if (couldSave  > 0) successMsg += ` · 💳 Card activate karo aur ₹${couldSave.toLocaleString("en-IN")} aur bachao!`;
        setMessage(successMsg);
        localStorage.removeItem("labDraft");
        setDraftId(null);
        fetchPendingBookings();
        setSelectedTest(null);
        if (paymentType === "wallet") {
          setWalletBalance((prev) => prev - finalAmount);
        }
      } else {
        setMessage("❌ " + data.message);
      }
    } catch {
      setMessage("❌ Network error");
    }
    setBooking(false);
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto py-8 px-4">

        <h1 className="text-2xl font-bold text-gray-800 mb-1">🧪 Lab Tests</h1>
        <p className="text-gray-500 text-sm mb-6">Ghar baithe ya lab mein — affordable tests book karein</p>

        {message && (
          <div className={`mb-4 p-4 rounded-xl text-sm font-medium ${
            message.startsWith("✅")
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>{message}</div>
        )}

        {/* Draft resume banner */}
        {localDraft && !selectedTest && (
          <div className="mb-4 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold">↩️ Wahan se shuru karein jahan chode tha!</p>
              <p className="text-teal-100 text-xs mt-0.5 truncate">"{localDraft.testName}" — ₹{localDraft.amount?.toLocaleString("en-IN")}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  const t = tests.find((t: any) => t._id === localDraft.testId);
                  if (t) openBooking(t);
                  else { fetchTests(); setMessage("Test dhundha ja raha hai..."); }
                }}
                className="bg-white text-teal-700 text-xs font-bold px-3 py-2 rounded-xl hover:bg-teal-50">
                Resume →
              </button>
              <button onClick={() => { setLocalDraft(null); localStorage.removeItem("labDraft"); }}
                className="text-teal-200 hover:text-white text-sm px-1">✕</button>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Test ka naam ya category search karein..."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-3" />
          <div className="grid grid-cols-2 gap-3 mb-3">
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">Sabhi Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={district} onChange={(e) => setDistrict(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">Sabhi Zile</option>
              {biharDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">Koi bhi price</option>
              <option value="300">₹300 tak</option>
              <option value="500">₹500 tak</option>
              <option value="1000">₹1,000 tak</option>
              <option value="5000">₹5,000 tak</option>
            </select>
            <label className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5 cursor-pointer hover:border-teal-400 transition">
              <input type="checkbox" checked={homeOnly} onChange={(e) => setHomeOnly(e.target.checked)}
                className="accent-teal-600" />
              <span className="text-sm text-gray-700">🏠 Home Collection Only</span>
            </label>
          </div>
          <button onClick={fetchTests}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition">
            {loading ? "Dhundh rahe hain..." : "Search Karein"}
          </button>
        </div>

        {/* In-progress bookings banner */}
        {pendingBookings.length > 0 && (() => {
          const abandoned = pendingBookings.filter((b: any) => b.paymentMode === "online");
          const upcoming  = pendingBookings.filter((b: any) => b.paymentMode !== "online");
          return (
            <>
              {abandoned.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-3">
                  <p className="text-sm font-bold text-red-700 mb-2">⚠️ Adhoori payment — complete karein!</p>
                  <div className="space-y-2">
                    {abandoned.map((b: any) => (
                      <div key={b._id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border border-red-100">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{b.testName || "Lab Test"}</p>
                          <p className="text-xs text-gray-500">{b.patientName || ""} · ₹{b.amount?.toLocaleString("en-IN")}</p>
                        </div>
                        <button onClick={() => openBooking(tests.find((t: any) => t._id === b.labTestId?.toString()) || b)}
                          className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg whitespace-nowrap">
                          Pay Now →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {upcoming.length > 0 && (
                <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 mb-3">
                  <p className="text-sm font-bold text-teal-700 mb-2">📋 Aapki pending Lab bookings:</p>
                  <div className="space-y-2">
                    {upcoming.map((b: any) => (
                      <div key={b._id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border border-teal-100">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{b.testName || "Lab Test"}</p>
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
            </>
          );
        })()}

        {/* Membership Banner */}
        {!hasMembership && (
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-4 text-white mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold">💳 Family Card se extra discount!</p>
                <p className="text-sm text-teal-100">Lab tests par Member Price milega — har test par paise bachao</p>
              </div>
              <button onClick={activateCard} disabled={activatingCard}
                className="bg-white text-teal-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-50 flex-shrink-0 disabled:opacity-70">
                {activatingCard ? "..." : "₹249/yr →"}
              </button>
            </div>
            <p className="text-xs text-teal-200 mt-2">👇 Neeche diye price tags mein green 💳 Member Price dekho — kitna bachega!</p>
          </div>
        )}

        {/* Tests List */}
        {!loading && total !== null && (
          <p className="text-sm text-gray-500 mb-3">
            {total === 0 ? "Koi test nahi mila" : `${total} test${total === 1 ? "" : "s"} mile`}
            {(search || category || district || maxPrice || homeOnly) ? " — filters lagaye hain" : ""}
          </p>
        )}
        {loading ? (
          <div className="text-center py-10 text-teal-600">Tests dhundh rahe hain...</div>
        ) : tests.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-3">🧪</p>
            <p>Koi test nahi mila. Filter change karke try karein.</p>
            <button onClick={() => fetch("/api/seed-labs").then(() => fetchTests())}
              className="mt-4 text-teal-600 text-sm underline">
              Sample data load karein
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tests.map((test) => (
              <div key={test._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                          {test.category}
                        </span>
                        {test.homeCollection && (
                          <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">
                            🏠 Home Collection
                          </span>
                        )}
                        {test.fastingRequired && (
                          <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                            ⚠️ Fasting Required
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg">{test.name}</h3>
                      <p className="text-sm text-gray-500">🏥 {test.hospitalName}</p>
                      {test.address?.district && (
                        <p className="text-xs text-gray-400">📍 {test.address.district}</p>
                      )}
                    </div>
                    {/* ── Price Column ── */}
                    <div className="ml-3 flex-shrink-0 text-right min-w-[88px]">
                      <p className="text-[11px] text-gray-400 line-through leading-none mb-1">
                        MRP ₹{test.mrp.toLocaleString()}
                      </p>
                      {hasMembership ? (
                        <>
                          <p className="text-xl font-black text-teal-600 leading-none">
                            ₹{getPrice(test).toLocaleString()}
                          </p>
                          {test.mrp > getPrice(test) && (
                            <span className="inline-block mt-1.5 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              ✓ ₹{(test.mrp - getPrice(test)).toLocaleString()} saved
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-xl font-black text-teal-700 leading-none">
                            ₹{test.offerPrice.toLocaleString()}
                          </p>
                          {test.membershipPrice && test.membershipPrice < test.offerPrice && (
                            <div className="mt-1.5 bg-green-50 border border-green-200 rounded-lg px-2 py-1 text-right">
                              <p className="text-[10px] text-gray-500 leading-none mb-0.5">💳 Member</p>
                              <p className="text-sm font-black text-green-600 leading-none">
                                ₹{test.membershipPrice.toLocaleString()}
                              </p>
                              <p className="text-[10px] text-amber-600 font-semibold leading-none mt-0.5">
                                ₹{(test.offerPrice - test.membershipPrice).toLocaleString()} extra off
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-gray-600">
                    <span>🧫 Sample: {test.sampleType || "N/A"}</span>
                    <span>⏱️ Report: {test.turnaroundTime}</span>
                    <span>📄 Delivery: {test.reportDelivery}</span>
                    {test.homeCollection && (
                      <span>
                        🏠 Home:{" "}
                        {test.homeCollectionCharge === 0
                          ? "FREE"
                          : `+₹${test.homeCollectionCharge}`}
                      </span>
                    )}
                  </div>

                  {test.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{test.description}</p>
                  )}

                  <button onClick={() => openBooking(test)}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition text-sm">
                    Book Karein — ₹{getPrice(test).toLocaleString()}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Booking Modal */}
        {selectedTest && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <h2 className="font-bold text-gray-800">Lab Test Book Karein</h2>
                <button onClick={() => setSelectedTest(null)} className="text-gray-400 text-xl">✕</button>
              </div>

              <div className="p-5 space-y-4">
                {/* Test Summary */}
                <div className="bg-yellow-50 rounded-xl p-4">
                  <p className="font-bold text-gray-800">{selectedTest.name}</p>
                  <p className="text-sm text-gray-500">{selectedTest.hospitalName} • {selectedTest.address?.district}</p>
                  {selectedTest.fastingRequired && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ {selectedTest.fastingHours} ghante ka fast zaruri hai
                    </p>
                  )}
                  {selectedTest.preparationNotes && (
                    <p className="text-xs text-gray-500 mt-1">💡 {selectedTest.preparationNotes}</p>
                  )}
                </div>

                {/* Home Collection Toggle */}
                {selectedTest.homeCollection && (
                  <button
                    type="button"
                    onClick={() => { setHomeCollection((v) => !v); setSelectedSlot(""); }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition ${
                      homeCollection ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-teal-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🏠</span>
                      <div className="text-left">
                        <p className="text-sm font-bold text-gray-800">Ghar pe Sample Collection</p>
                        <p className="text-xs text-gray-500">
                          {selectedTest.homeCollectionCharge === 0
                            ? "✅ FREE — koi extra charge nahi"
                            : `+₹${selectedTest.homeCollectionCharge} collection charge`}
                        </p>
                      </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors relative ${homeCollection ? "bg-teal-600" : "bg-gray-200"}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${homeCollection ? "left-7" : "left-1"}`} />
                    </div>
                  </button>
                )}

                {/* Home Collection Address */}
                {homeCollection && (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-green-600 text-lg">📍</span>
                      <p className="text-sm font-bold text-green-800">Pickup Address</p>
                    </div>
                    <input
                      value={hcAddress.flat}
                      onChange={(e) => setHcAddress({ ...hcAddress, flat: e.target.value })}
                      placeholder="Flat / House No. / Building name"
                      className="w-full border border-green-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                    <input
                      value={hcAddress.street}
                      onChange={(e) => setHcAddress({ ...hcAddress, street: e.target.value })}
                      placeholder="Street / Mohalla / Area *"
                      className="w-full border border-green-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                    <input
                      value={hcAddress.landmark}
                      onChange={(e) => setHcAddress({ ...hcAddress, landmark: e.target.value })}
                      placeholder="Landmark (e.g. Near XYZ School)"
                      className="w-full border border-green-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={hcAddress.district}
                        onChange={(e) => setHcAddress({ ...hcAddress, district: e.target.value })}
                        className="border border-green-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      >
                        {biharDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <input
                        value={hcAddress.pincode}
                        onChange={(e) => setHcAddress({ ...hcAddress, pincode: e.target.value })}
                        placeholder="Pincode"
                        maxLength={6}
                        className="border border-green-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                    </div>
                  </div>
                )}

                {/* Date */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {homeCollection ? "Pickup Date *" : "Visit Date *"}
                  </p>
                  <input type="date" value={appointmentDate} min={minDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>

                {/* Time Slot */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {homeCollection ? "Pickup Time Slot" : "Visit Time Slot"}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(homeCollection
                      ? ["6:00 AM - 8:00 AM", "8:00 AM - 10:00 AM", "10:00 AM - 12:00 PM", "12:00 PM - 2:00 PM"]
                      : timeSlots
                    ).map((slot) => (
                      <button key={slot} type="button" onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                          selectedSlot === slot
                            ? "bg-teal-600 text-white border-teal-600"
                            : "border-gray-200 text-gray-700 hover:border-teal-400"
                        }`}>
                        {homeCollection ? "🚗 " : "🕐 "}{slot}
                      </button>
                    ))}
                  </div>
                  {homeCollection && (
                    <p className="text-xs text-gray-400 mt-2">
                      ⓘ Fasting tests ke liye suba ka slot recommend hai
                    </p>
                  )}
                </div>

                {/* Patient Selector */}
                <div>
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

                {/* Promo Code */}
                <div>
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

                {/* Payment */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Payment Method</p>
                  <div className="space-y-2">

                    {/* Online */}
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      paymentType === "online" ? "border-teal-500 bg-teal-50" : "border-gray-200"
                    }`}>
                      <input type="radio" name="payment" value="online"
                        checked={paymentType === "online"}
                        onChange={() => setPaymentType("online")}
                        className="accent-teal-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">💳 Online Payment Karein</p>
                        <p className="text-xs text-gray-500">PhonePe / UPI / Debit / Credit Card</p>
                      </div>
                      <div className="flex gap-1">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">PhonePe</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">UPI</span>
                      </div>
                    </label>

                    {/* Counter */}
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      paymentType === "counter" ? "border-teal-500 bg-teal-50" : "border-gray-200"
                    }`}>
                      <input type="radio" name="payment" value="counter"
                        checked={paymentType === "counter"}
                        onChange={() => setPaymentType("counter")}
                        className="accent-teal-600" />
                      <div>
                        <p className="text-sm font-medium">🏦 Counter par Pay Karein</p>
                        <p className="text-xs text-gray-500">Lab mein jaake payment karein</p>
                      </div>
                    </label>

                    {/* Wallet */}
                    {hasMembership && (
                      <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                        paymentType === "wallet" ? "border-teal-500 bg-teal-50" : "border-gray-200"
                      }`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="payment" value="wallet"
                            checked={paymentType === "wallet"}
                            onChange={() => setPaymentType("wallet")}
                            className="accent-teal-600" />
                          <div>
                            <p className="text-sm font-medium">💰 Wallet se Pay Karein</p>
                            <p className="text-xs text-gray-500">Balance: ₹{walletBalance}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-medium ${
                          walletBalance >= getTotalAmount(selectedTest) ? "text-green-600" : "text-red-500"
                        }`}>
                          {walletBalance >= getTotalAmount(selectedTest) ? "✓ Enough" : "Low"}
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Card activation nudge for non-members */}
                {!hasMembership && selectedTest.membershipPrice && selectedTest.membershipPrice < selectedTest.offerPrice && (
                  <div className="rounded-2xl overflow-hidden border border-amber-200">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-400 px-4 py-2 flex items-center gap-2">
                      <span className="text-white text-lg">💳</span>
                      <p className="text-white text-xs font-bold flex-1">Family Card activate karein — sirf ₹249/year</p>
                      <button onClick={activateCard} disabled={activatingCard}
                        className="bg-white text-amber-600 text-xs font-black px-3 py-1 rounded-full whitespace-nowrap disabled:opacity-70">
                        {activatingCard ? "..." : "Abhi Activate →"}
                      </button>
                    </div>
                    <div className="bg-amber-50 px-4 py-2 flex items-center justify-between">
                      <span className="text-xs text-amber-700">Is test par aur kitna bachega:</span>
                      <span className="text-sm font-black text-amber-700">
                        ₹{(selectedTest.offerPrice - selectedTest.membershipPrice).toLocaleString("en-IN")} extra savings
                      </span>
                    </div>
                  </div>
                )}

                {/* Total — receipt-style 3-price breakdown */}
                <div className="rounded-2xl overflow-hidden border border-gray-200">
                  <div className="bg-gray-50 px-4 pt-3 pb-2 space-y-2">
                    {/* MRP row */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">MRP</span>
                      <span className="text-xs text-gray-400 line-through font-medium">₹{selectedTest.mrp.toLocaleString()}</span>
                    </div>
                    {/* Offer Price row */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                        Offer Price
                      </span>
                      <span className={`text-xs font-semibold ${hasMembership && selectedTest.membershipPrice && selectedTest.membershipPrice < selectedTest.offerPrice ? "text-gray-400 line-through" : "text-gray-700"}`}>
                        ₹{selectedTest.offerPrice.toLocaleString()}
                      </span>
                    </div>
                    {/* Member Price row */}
                    {selectedTest.membershipPrice && (
                      <div className="flex justify-between items-center">
                        <span className={`text-xs flex items-center gap-1.5 ${hasMembership ? "text-teal-600 font-semibold" : "text-gray-400"}`}>
                          <span className="text-sm leading-none">💳</span>
                          Member Price
                          {!hasMembership && (
                            <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">Card chahiye</span>
                          )}
                        </span>
                        <span className={`text-xs font-bold ${hasMembership ? "text-teal-600" : "text-gray-400"}`}>
                          ₹{selectedTest.membershipPrice.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {/* Home collection add-on */}
                    {homeCollection && selectedTest.homeCollectionCharge > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 flex items-center gap-1.5">
                          <span className="text-sm leading-none">🏠</span>
                          Home collection
                        </span>
                        <span className="text-xs font-semibold text-gray-600">+₹{selectedTest.homeCollectionCharge.toLocaleString()}</span>
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
                  </div>
                  {/* You Pay row — highlighted */}
                  <div className="bg-teal-600 px-4 py-3 flex justify-between items-center">
                    <div>
                      <p className="text-teal-100 text-[11px] font-medium uppercase tracking-wide">Aap Pay Karein</p>
                      {selectedTest.mrp > (promoData ? promoData.finalAmount : getTotalAmount(selectedTest)) && (
                        <p className="text-teal-200 text-[10px] mt-0.5">
                          MRP se ₹{(selectedTest.mrp - (promoData ? promoData.finalAmount : getTotalAmount(selectedTest))).toLocaleString("en-IN")} ki bachat
                        </p>
                      )}
                    </div>
                    <p className="text-white text-2xl font-black">₹{(promoData ? promoData.finalAmount : getTotalAmount(selectedTest)).toLocaleString()}</p>
                  </div>
                </div>

                {message && (
                  <div className={`p-3 rounded-lg text-sm ${
                    message.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}>{message}</div>
                )}

                <button onClick={handleBooking} disabled={booking}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3.5 rounded-xl transition disabled:opacity-50 text-base">
                  {booking
                    ? (paymentType === "online" ? "Payment page pe ja rahe hain..." : "Booking ho rahi hai...")
                    : paymentType === "online"
                      ? `💳 Pay Karein — ₹${(promoData ? promoData.finalAmount : getTotalAmount(selectedTest)).toLocaleString()}`
                      : `Book Karein — ₹${(promoData ? promoData.finalAmount : getTotalAmount(selectedTest)).toLocaleString()}`
                  }
                </button>

                {/* Trust + Helpline */}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-gray-400">🔒 Safe & Secure booking</p>
                  <a href="tel:9876543210" className="text-[11px] text-teal-600 font-medium hover:underline">📞 Help: 9876543210</a>
                </div>
                <a href={`https://wa.me/919876543210?text=${encodeURIComponent(`Namaskar! Mujhe ${selectedTest.name} ke baare mein jaankari chahiye.`)}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 border border-green-200 text-green-700 text-xs font-semibold py-2.5 rounded-xl hover:bg-green-50 transition">
                  💬 WhatsApp par puchein
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
