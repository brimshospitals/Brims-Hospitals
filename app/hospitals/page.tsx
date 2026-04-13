"use client";
import { useState, useEffect, useCallback } from "react";
import Header from "../components/header";

const DISTRICTS = [
  "Patna","Saran","Siwan","Gopalganj","Gaya","Muzaffarpur",
  "Bhagalpur","Nalanda","Vaishali","Darbhanga","Sitamarhi",
  "Purnia","Begusarai","Araria","Arwal","Aurangabad","Banka",
  "Buxar","East Champaran","West Champaran","Jamui","Jehanabad",
  "Kaimur","Katihar","Khagaria","Kishanganj","Lakhisarai","Madhepura",
  "Madhubani","Munger","Nawada","Rohtas","Saharsa","Samastipur",
  "Sheikhpura","Sheohar","Supaul",
];

const HOSPITAL_TYPES = ["Single Specialist", "Multi Specialist", "Super Specialist"];

const TYPE_COLORS: Record<string, string> = {
  "Single Specialist": "bg-blue-100 text-blue-700 border-blue-200",
  "Multi Specialist":  "bg-purple-100 text-purple-700 border-purple-200",
  "Super Specialist":  "bg-rose-100 text-rose-700 border-rose-200",
};
const TYPE_ICONS: Record<string, string> = {
  "Single Specialist": "🏥",
  "Multi Specialist":  "🏨",
  "Super Specialist":  "🏫",
};

function StarDisplay({ rating, total }: { rating: number; total: number }) {
  const stars = Math.round(rating);
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1,2,3,4,5].map((n) => (
          <span key={n} className={`text-sm ${n <= stars ? "text-amber-400" : "text-gray-200"}`}>★</span>
        ))}
      </div>
      {total > 0 && <span className="text-xs text-gray-400">({total})</span>}
    </div>
  );
}

function HospitalCard({ h }: { h: any }) {
  const [expanded, setExpanded] = useState(false);
  const typeColor = TYPE_COLORS[h.type] ?? "bg-gray-100 text-gray-600 border-gray-200";
  const typeIcon  = TYPE_ICONS[h.type]  ?? "🏥";
  const photo     = h.photos?.[0];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Photo or gradient banner */}
      {photo ? (
        <img src={photo} alt={h.name} className="w-full h-32 object-cover" />
      ) : (
        <div className="w-full h-24 bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
          <span className="text-4xl">{typeIcon}</span>
        </div>
      )}

      <div className="p-4">
        {/* Type badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${typeColor}`}>
            {typeIcon} {h.type}
          </span>
          {h.rating > 0 && <StarDisplay rating={h.rating} total={h.totalReviews} />}
        </div>

        {/* Name */}
        <h3 className="font-bold text-gray-800 text-base leading-tight mb-1">{h.name}</h3>

        {/* Address */}
        <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
          <span>📍</span>
          {[h.address?.city, h.address?.district, "Bihar"].filter(Boolean).join(", ")}
        </p>

        {/* Departments */}
        {h.departments?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {(expanded ? h.departments : h.departments.slice(0, 4)).map((d: string) => (
              <span key={d} className="text-xs bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-full">
                {d}
              </span>
            ))}
            {!expanded && h.departments.length > 4 && (
              <button onClick={() => setExpanded(true)}
                className="text-xs text-teal-600 font-semibold hover:underline">
                +{h.departments.length - 4} more
              </button>
            )}
            {expanded && h.departments.length > 4 && (
              <button onClick={() => setExpanded(false)}
                className="text-xs text-teal-600 font-semibold hover:underline">
                less ▲
              </button>
            )}
          </div>
        )}

        {/* Action row */}
        <div className="flex gap-2 pt-2 border-t border-gray-50">
          <a href={`/hospitals/${h.hospitalId}`}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 py-2 rounded-xl transition">
            👁 View
          </a>
          <a href={`/opd-booking?hospital=${h._id}`}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 py-2 rounded-xl transition">
            🩺 Book OPD
          </a>
        </div>
      </div>
    </div>
  );
}

export default function HospitalsPage() {
  const [hospitals, setHospitals]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [district, setDistrict]     = useState("");
  const [type, setType]             = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ full: "true" });
      if (district) p.set("district", district);
      if (type)     p.set("type",     type);
      if (search)   p.set("search",   search);
      const res  = await fetch(`/api/hospitals-public?${p}`);
      const data = await res.json();
      if (data.success) setHospitals(data.hospitals);
    } catch {}
    setLoading(false);
  }, [district, type, search]);

  useEffect(() => { fetchHospitals(); }, [fetchHospitals]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const activeFilters = [district, type, search].filter(Boolean).length;

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-800 text-white px-5 py-10 text-center">
        <h1 className="text-2xl font-bold mb-1">Hospitals Dhundho</h1>
        <p className="text-teal-100 text-sm mb-6">Bihar ke verified hospitals — district aur type se filter karein</p>

        {/* Search bar */}
        <div className="max-w-md mx-auto flex items-center bg-white rounded-2xl overflow-hidden shadow-lg">
          <span className="pl-4 text-gray-400 text-lg">🔍</span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Hospital ka naam likho..."
            className="flex-1 px-3 py-3.5 text-sm text-gray-800 bg-transparent focus:outline-none"
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(""); setSearch(""); }}
              className="pr-4 text-gray-400 hover:text-gray-600 text-lg">✕</button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          {/* District */}
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className={`border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition ${district ? "border-teal-500 bg-teal-50 text-teal-700 font-medium" : "border-gray-200 text-gray-600 bg-white"}`}
          >
            <option value="">📍 Sabhi Jile</option>
            {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* Type */}
          <div className="flex gap-2 flex-wrap">
            {HOSPITAL_TYPES.map((t) => (
              <button key={t} onClick={() => setType(type === t ? "" : t)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                  type === t
                    ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-teal-400"
                }`}>
                {TYPE_ICONS[t]} {t}
              </button>
            ))}
          </div>

          {/* Clear */}
          {activeFilters > 0 && (
            <button
              onClick={() => { setDistrict(""); setType(""); setSearchInput(""); setSearch(""); }}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 transition"
            >
              ✕ Filter hatao
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {loading ? "Dhundh rahe hain..." : `${hospitals.length} hospital${hospitals.length !== 1 ? "s" : ""} mile`}
            {district && <span className="font-medium text-teal-600"> · {district}</span>}
            {type     && <span className="font-medium text-teal-600"> · {type}</span>}
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1,2,3,4].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 animate-pulse overflow-hidden">
                <div className="h-24 bg-gray-100" />
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-5 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="flex gap-2">
                    <div className="h-3 bg-gray-100 rounded-full w-16" />
                    <div className="h-3 bg-gray-100 rounded-full w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : hospitals.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🏥</p>
            <p className="font-semibold text-gray-700 text-lg">Koi hospital nahi mila</p>
            <p className="text-sm text-gray-400 mt-1">Filter change karein ya search clear karein</p>
            <button onClick={() => { setDistrict(""); setType(""); setSearchInput(""); setSearch(""); }}
              className="mt-4 text-sm text-teal-600 font-semibold hover:underline">
              Sabhi hospitals dekhein →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hospitals.map((h) => <HospitalCard key={h._id} h={h} />)}
          </div>
        )}
      </div>
    </main>
  );
}
