"use client";
import { useState, useEffect, useRef } from "react";
import Header from "../components/header";
import { BIHAR_DISTRICTS } from "../../lib/biharDistricts";

const VEHICLE_TYPES = [
  {
    type: "Basic",
    icon: "🚑",
    label: "Basic Ambulance",
    desc: "First aid + oxygen support",
    color: "border-orange-300 bg-orange-50",
    activeColor: "border-orange-500 bg-orange-50",
    badge: "bg-orange-100 text-orange-700",
  },
  {
    type: "Advanced",
    icon: "🚑",
    label: "Advanced Life Support",
    desc: "ALS equipment + paramedic",
    color: "border-red-200 bg-red-50",
    activeColor: "border-red-500 bg-red-50",
    badge: "bg-red-100 text-red-700",
  },
  {
    type: "ICU",
    icon: "🏥",
    label: "ICU Ambulance",
    desc: "Full ICU setup, ventilator",
    color: "border-purple-200 bg-purple-50",
    activeColor: "border-purple-500 bg-purple-50",
    badge: "bg-purple-100 text-purple-700",
  },
  {
    type: "Neonatal",
    icon: "👶",
    label: "Neonatal Ambulance",
    desc: "For newborns & premature babies",
    color: "border-pink-200 bg-pink-50",
    activeColor: "border-pink-500 bg-pink-50",
    badge: "bg-pink-100 text-pink-700",
  },
];

// BIHAR_DISTRICTS imported from lib/biharDistricts

const EMERGENCY_TYPES = [
  "Heart Attack / Chest Pain",
  "Accident / Trauma",
  "Stroke / Paralysis",
  "Breathing Difficulty",
  "Delivery / Labour",
  "Severe Burns",
  "Unconscious / Seizure",
  "Poisoning / Overdose",
  "Other Emergency",
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pending:    { label: "Pending",    color: "bg-amber-100 text-amber-700 border-amber-200",   icon: "⏳" },
  dispatched: { label: "Dispatched", color: "bg-blue-100  text-blue-700  border-blue-200",    icon: "🚑" },
  arrived:    { label: "Arrived",    color: "bg-green-100 text-green-700 border-green-200",   icon: "✅" },
  completed:  { label: "Completed",  color: "bg-teal-100  text-teal-700  border-teal-200",    icon: "🏁" },
  cancelled:  { label: "Cancelled",  color: "bg-red-100   text-red-700   border-red-200",     icon: "❌" },
};

function fmtTime(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AmbulancePage() {
  const [step, setStep] = useState<"form" | "tracking">("form");

  // Form fields
  const [callerName,   setCallerName]   = useState("");
  const [callerMobile, setCallerMobile] = useState("");
  const [patientName,  setPatientName]  = useState("");
  const [patientAge,   setPatientAge]   = useState("");
  const [patientGender,setPatientGender]= useState("");
  const [emergency,    setEmergency]    = useState("");
  const [vehicleType,  setVehicleType]  = useState("Basic");
  const [address,      setAddress]      = useState("");
  const [landmark,     setLandmark]     = useState("");
  const [district,     setDistrict]     = useState("Patna");
  const [destHospital, setDestHospital] = useState("");
  const [lat,          setLat]          = useState<number|null>(null);
  const [lng,          setLng]          = useState<number|null>(null);
  const [gpsLoading,   setGpsLoading]   = useState(false);
  const [gpsError,     setGpsError]     = useState("");

  // Submission
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [doneId,     setDoneId]     = useState("");

  // Tracking
  const [trackId,    setTrackId]    = useState("");
  const [trackData,  setTrackData]  = useState<any>(null);
  const [tracking,   setTracking]   = useState(false);
  const [trackError, setTrackError] = useState("");
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Pre-fill from profile
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.user) {
          setCallerName(d.user.name || "");
          setCallerMobile(d.user.mobile || "");
        }
      })
      .catch(() => {});

    // Check URL for tracking id
    const params = new URLSearchParams(window.location.search);
    const tid = params.get("track");
    if (tid) { setTrackId(tid); setStep("tracking"); pollStatus(tid); }

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  function getGPS() {
    if (!navigator.geolocation) { setGpsError("Browser GPS support nahi karta"); return; }
    setGpsLoading(true); setGpsError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setAddress(`GPS: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        setGpsLoading(false);
      },
      (err) => { setGpsError("Location access denied. Address manually type karein."); setGpsLoading(false); },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  async function handleSubmit() {
    if (!callerName || !callerMobile || !address) {
      setError("Aapka naam, mobile aur address zaruri hai");
      return;
    }
    if (!/^\d{10}$/.test(callerMobile)) {
      setError("Valid 10-digit mobile number enter karein");
      return;
    }
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/ambulance", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerName, callerMobile,
          patientName:  patientName  || callerName,
          patientAge:   patientAge   ? parseInt(patientAge) : undefined,
          patientGender,
          emergency,
          vehicleType,
          address, landmark, district,
          lat, lng,
          destinationHospital: destHospital,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDoneId(data.requestId);
        setTrackId(data.requestId);
        pollStatus(data.requestId);
      } else {
        setError(data.message || "Request nahi bheji ja saki");
      }
    } catch {
      setError("Network error. Dobara try karein.");
    }
    setLoading(false);
  }

  async function pollStatus(id: string) {
    setTracking(true); setTrackError("");
    async function fetchStatus() {
      try {
        const res  = await fetch(`/api/ambulance?requestId=${id}`);
        const data = await res.json();
        if (data.success) setTrackData(data);
        else setTrackError(data.message);
      } catch { setTrackError("Status check nahi hua"); }
    }
    await fetchStatus();
    pollRef.current = setInterval(fetchStatus, 30000); // poll every 30s
    setTracking(false);
  }

  async function trackManual() {
    if (!trackId.trim()) return;
    if (pollRef.current) clearInterval(pollRef.current);
    await pollStatus(trackId.trim().toUpperCase());
    setStep("tracking");
  }

  // ── DONE screen (after submit) ──
  if (doneId) {
    const sc = trackData ? STATUS_CONFIG[trackData.status] ?? STATUS_CONFIG.pending : STATUS_CONFIG.pending;
    return (
      <main className="min-h-screen bg-red-50">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-8 space-y-4">

          {/* Confirmed card */}
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-red-100">
            <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-5 text-white">
              <p className="text-red-200 text-xs font-semibold uppercase tracking-widest mb-1">Request Confirmed</p>
              <p className="text-2xl font-black">🚑 Ambulance Request Bheja!</p>
              <p className="text-red-100 text-sm mt-1">Hamari team aapko abhi call karegi</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">Request ID</span>
                <span className="font-mono font-bold text-red-700 text-lg">{doneId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">Status</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${sc.color}`}>
                  {sc.icon} {sc.label}
                </span>
              </div>
              {trackData?.assignedDriver && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Driver</span>
                  <span className="font-semibold text-gray-800">{trackData.assignedDriver}</span>
                </div>
              )}
              {trackData?.vehicleNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Vehicle</span>
                  <span className="font-semibold text-gray-800">{trackData.vehicleNumber}</span>
                </div>
              )}
              {trackData?.estimatedETA && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">ETA</span>
                  <span className="font-bold text-green-700">{trackData.estimatedETA}</span>
                </div>
              )}
            </div>
          </div>

          {/* Helpline */}
          <div className="bg-red-600 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-white font-bold">Emergency Helpline</p>
              <p className="text-red-200 text-xs">Government ambulance ke liye</p>
            </div>
            <a href="tel:112" className="bg-white text-red-700 font-black text-xl px-5 py-2 rounded-xl">
              112
            </a>
          </div>

          {/* Status note */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold mb-1">⚠️ Dhyan rakhein:</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>Apna mobile ON rakhein — driver call karega</li>
              <li>Location clear jagah pe rahe</li>
              <li>Patient ko stable position mein rakhein</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <a href="tel:112" className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-center transition">
              📞 Call 112
            </a>
            <a href="/dashboard" className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold text-center hover:bg-gray-50 transition">
              Dashboard
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Hero banner */}
        <div className="bg-gradient-to-br from-red-600 to-red-500 rounded-3xl p-6 text-white relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="relative z-10">
            <p className="text-4xl mb-2">🚑</p>
            <h1 className="text-2xl font-black">Emergency Ambulance</h1>
            <p className="text-red-100 text-sm mt-1">Request karein — team abhi call karegi</p>
            <a href="tel:112"
              className="inline-flex items-center gap-2 mt-4 bg-white text-red-700 font-black px-5 py-2.5 rounded-xl text-sm hover:bg-red-50 transition">
              📞 112 — Seedha Call Karein
            </a>
          </div>
        </div>

        {/* Tab: Form / Track */}
        <div className="flex rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
          <button onClick={() => setStep("form")}
            className={`flex-1 py-3 text-sm font-bold transition ${step === "form" ? "bg-red-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
            🚑 Book Ambulance
          </button>
          <button onClick={() => setStep("tracking")}
            className={`flex-1 py-3 text-sm font-bold transition ${step === "tracking" ? "bg-red-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
            📍 Track Request
          </button>
        </div>

        {/* ── FORM ── */}
        {step === "form" && (
          <div className="space-y-4">

            {/* Caller info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h2 className="font-bold text-gray-800">📞 Caller Information</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your Name *</label>
                  <input value={callerName} onChange={(e) => setCallerName(e.target.value)}
                    placeholder="Aapka naam"
                    className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mobile *</label>
                  <input value={callerMobile} onChange={(e) => setCallerMobile(e.target.value.replace(/\D/,""))}
                    placeholder="10-digit mobile"
                    maxLength={10} type="tel"
                    className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                </div>
              </div>
            </div>

            {/* Patient info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h2 className="font-bold text-gray-800">🤒 Patient Details <span className="text-xs font-normal text-gray-400">(optional)</span></h2>
              <input value={patientName} onChange={(e) => setPatientName(e.target.value)}
                placeholder="Patient ka naam (agar alag hai)"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              <div className="grid grid-cols-2 gap-3">
                <input value={patientAge} onChange={(e) => setPatientAge(e.target.value.replace(/\D/,""))}
                  placeholder="Umar (saal)" type="number"
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                <select value={patientGender} onChange={(e) => setPatientGender(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
                  <option value="">Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Emergency type */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h2 className="font-bold text-gray-800">⚕️ Emergency Type</h2>
              <div className="flex flex-wrap gap-2">
                {EMERGENCY_TYPES.map((e) => (
                  <button key={e} type="button" onClick={() => setEmergency(emergency === e ? "" : e)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      emergency === e ? "bg-red-600 text-white border-red-600" : "border-gray-200 text-gray-700 hover:border-red-300"
                    }`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle type */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-800 mb-3">🚑 Ambulance Type</h2>
              <div className="grid grid-cols-2 gap-3">
                {VEHICLE_TYPES.map((v) => (
                  <button key={v.type} type="button" onClick={() => setVehicleType(v.type)}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      vehicleType === v.type ? v.activeColor + " ring-2 ring-offset-1 ring-red-400" : v.color + " hover:opacity-90"
                    }`}>
                    <p className="text-xl mb-1">{v.icon}</p>
                    <p className="font-bold text-gray-800 text-xs">{v.label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{v.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-800">📍 Pickup Location</h2>
                <button type="button" onClick={getGPS} disabled={gpsLoading}
                  className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-xl font-semibold hover:bg-blue-100 transition disabled:opacity-50">
                  {gpsLoading
                    ? <><span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />Locating...</>
                    : <>📡 GPS Location</>
                  }
                </button>
              </div>
              {gpsError && <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl">{gpsError}</p>}
              {lat && <p className="text-xs text-green-600 bg-green-50 border border-green-100 px-3 py-2 rounded-xl">✓ GPS location captured</p>}

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Address / Location *</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)}
                  rows={2} placeholder="Ghar ka address, mohalla ya landmark…"
                  className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Landmark</label>
                  <input value={landmark} onChange={(e) => setLandmark(e.target.value)}
                    placeholder="Near school/temple…"
                    className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">District</label>
                  <select value={district} onChange={(e) => setDistrict(e.target.value)}
                    className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
                    {BIHAR_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Destination Hospital <span className="font-normal">(optional)</span></label>
                <input value={destHospital} onChange={(e) => setDestHospital(e.target.value)}
                  placeholder="Kaunse hospital le jaana hai?"
                  className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                ⚠️ {error}
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black text-lg transition disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-red-200">
              {loading
                ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Bhej rahe hain...</>
                : <>🚑 Ambulance Mangaiye</>
              }
            </button>

            <p className="text-center text-xs text-gray-400">
              Request bhejne ke baad call aayegi. Government ambulance ke liye <strong>112</strong> dial karein.
            </p>
          </div>
        )}

        {/* ── TRACKING ── */}
        {step === "tracking" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h2 className="font-bold text-gray-800">📍 Request Track Karein</h2>
              <div className="flex gap-2">
                <input value={trackId} onChange={(e) => setTrackId(e.target.value.toUpperCase())}
                  placeholder="Request ID — AMB-00001"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-400" />
                <button onClick={trackManual} disabled={tracking}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50">
                  Track
                </button>
              </div>
              {trackError && <p className="text-xs text-red-500">{trackError}</p>}
            </div>

            {trackData && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Status header */}
                <div className={`px-5 py-4 flex items-center gap-3 ${
                  trackData.status === "dispatched" ? "bg-blue-600" :
                  trackData.status === "arrived"    ? "bg-green-600" :
                  trackData.status === "completed"  ? "bg-teal-600" :
                  "bg-amber-500"
                } text-white`}>
                  <span className="text-3xl">{STATUS_CONFIG[trackData.status]?.icon || "🚑"}</span>
                  <div>
                    <p className="font-black text-lg">{STATUS_CONFIG[trackData.status]?.label || trackData.status}</p>
                    <p className="text-sm opacity-80">Request ID: {trackData.requestId}</p>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  {trackData.estimatedETA && (
                    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                      <span className="text-2xl">⏱️</span>
                      <div>
                        <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">ETA</p>
                        <p className="font-black text-green-800 text-xl">{trackData.estimatedETA}</p>
                      </div>
                    </div>
                  )}
                  {trackData.assignedDriver && (
                    <div className="flex justify-between text-sm border-b border-gray-50 pb-2">
                      <span className="text-gray-500">Driver</span>
                      <span className="font-semibold text-gray-800">{trackData.assignedDriver}</span>
                    </div>
                  )}
                  {trackData.vehicleNumber && (
                    <div className="flex justify-between text-sm border-b border-gray-50 pb-2">
                      <span className="text-gray-500">Vehicle No.</span>
                      <span className="font-bold text-gray-800 font-mono">{trackData.vehicleNumber}</span>
                    </div>
                  )}
                  {trackData.dispatchedAt && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Dispatched At</span>
                      <span className="text-gray-600">{fmtTime(trackData.dispatchedAt)}</span>
                    </div>
                  )}

                  {/* Progress steps */}
                  <div className="mt-4 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1">
                      {["pending","dispatched","arrived","completed"].map((s, i) => {
                        const statuses = ["pending","dispatched","arrived","completed"];
                        const currentIdx = statuses.indexOf(trackData.status);
                        const done = i <= currentIdx;
                        return (
                          <div key={s} className="flex items-center flex-1">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${done ? "bg-red-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                              {done ? "✓" : i+1}
                            </div>
                            {i < 3 && <div className={`flex-1 h-0.5 ${i < currentIdx ? "bg-red-500" : "bg-gray-200"}`} />}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-1">
                      {["Pending","Dispatched","Arrived","Done"].map((l) => (
                        <span key={l} className="text-[9px] text-gray-400 font-semibold">{l}</span>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 text-center pt-1">
                    Page auto-refresh every 30 seconds
                  </p>
                </div>
              </div>
            )}

            <a href="tel:112"
              className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-2xl font-bold transition shadow-lg shadow-red-200">
              📞 112 — Emergency Call
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
