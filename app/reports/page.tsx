"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/header";

type Report = {
  _id: string;
  reportId: string;
  title: string;
  category: string;
  fileUrl: string;
  fileType: "pdf" | "image";
  notes?: string;
  reportDate: string;
  hospitalName: string;
  patientName: string;
  createdAt: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  Lab:          "bg-blue-50 text-blue-700",
  Radiology:    "bg-purple-50 text-purple-700",
  OPD:          "bg-teal-50 text-teal-700",
  Surgery:      "bg-rose-50 text-rose-700",
  Prescription: "bg-amber-50 text-amber-700",
  Other:        "bg-gray-100 text-gray-600",
};

const ALL_CATEGORIES = ["All", "Lab", "Radiology", "OPD", "Surgery", "Prescription", "Other"];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports]     = useState<Report[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("All");
  const [search, setSearch]       = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) { router.replace("/login"); return; }
    fetchReports(userId);
  }, []);

  async function fetchReports(userId: string) {
    setLoading(true);
    try {
      const res  = await fetch(`/api/patient/reports?userId=${userId}`);
      const data = await res.json();
      if (data.success) setReports(data.reports);
    } finally { setLoading(false); }
  }

  const filtered = reports.filter((r) => {
    if (filter !== "All" && r.category !== filter) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) &&
        !r.hospitalName.toLowerCase().includes(search.toLowerCase()) &&
        !r.patientName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Page header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
            ←
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-800">My Reports</h1>
            <p className="text-xs text-gray-500">{reports.length} report{reports.length !== 1 ? "s" : ""} available</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Report naam ya hospital search karein..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-teal-400 shadow-sm"
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filter === cat
                  ? "bg-teal-600 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-teal-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Reports list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <p className="text-5xl mb-3">🗂️</p>
            <p className="font-semibold text-gray-700">Koi report nahi mili</p>
            <p className="text-sm text-gray-400 mt-1">
              {reports.length === 0
                ? "Aapke liye abhi koi report upload nahi ki gayi hai."
                : "Is filter mein koi report nahi hai."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Color strip */}
                <div className={`h-1 ${r.category === "Lab" ? "bg-blue-400" : r.category === "Radiology" ? "bg-purple-400" : r.category === "OPD" ? "bg-teal-400" : r.category === "Surgery" ? "bg-rose-400" : r.category === "Prescription" ? "bg-amber-400" : "bg-gray-300"}`} />

                <div className="p-4 flex items-start gap-3">
                  {/* File icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                    r.fileType === "pdf" ? "bg-red-50" : "bg-sky-50"
                  }`}>
                    {r.fileType === "pdf" ? "📄" : "🖼️"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm leading-tight">{r.title}</p>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[r.category] || "bg-gray-100 text-gray-600"}`}>
                        {r.category}
                      </span>
                      <span className="text-xs text-gray-400">{fmtDate(r.reportDate)}</span>
                    </div>

                    {r.hospitalName && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <span>🏥</span> {r.hospitalName}
                      </p>
                    )}
                    {r.patientName && (
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <span>👤</span> {r.patientName}
                      </p>
                    )}
                    {r.notes && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1 italic">{r.notes}</p>
                    )}
                  </div>
                </div>

                {/* View / Download buttons */}
                <div className="border-t border-gray-50 px-4 py-2.5 flex gap-3">
                  <a
                    href={r.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-2 rounded-xl bg-teal-50 text-teal-700 text-xs font-medium hover:bg-teal-100 transition-colors"
                  >
                    👁️ View Report
                  </a>
                  <a
                    href={r.fileUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-2 rounded-xl bg-gray-50 text-gray-700 text-xs font-medium hover:bg-gray-100 transition-colors"
                  >
                    ⬇️ Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state hint when no reports at all */}
        {!loading && reports.length === 0 && (
          <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 text-sm text-teal-700">
            <p className="font-medium">Reports kaise milenge?</p>
            <p className="text-xs mt-1 text-teal-600">
              Aapki lab test ya OPD booking complete hone ke baad hospital aapki report yahan upload kar dega.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
