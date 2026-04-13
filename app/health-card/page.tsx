"use client";
import { useEffect, useState } from "react";

interface FamilyMember {
  _id: string;
  name: string;
  age?: number;
  gender?: string;
  photo?: string;
  memberId?: string;
  relationship?: string;
}

interface FamilyCard {
  cardNumber: string;
  status: string;
  activatedAt?: string;
  expiryDate?: string;
  walletBalance?: number;
}

interface UserProfile {
  name: string;
  mobile: string;
  age?: number;
  gender?: string;
  photo?: string;
  memberId?: string;
  address?: { district?: string; state?: string };
  preExistingDiseases?: string[];
  bloodGroup?: string;
  role: string;
}

export default function HealthCardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [card, setCard] = useState<FamilyCard | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setUser(d.user);
          setCard(d.familyCard || null);
          setMembers(d.familyMembers || []);
        } else {
          setError(d.message || "Profile load nahi hua");
        }
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, []);

  function formatDate(iso?: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  }

  function formatCardNumber(num?: string) {
    if (!num) return "—";
    return num.match(/.{1,4}/g)?.join(" ") || num;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading health card...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 mb-3">{error || "Profile nahi mila"}</p>
          <a href="/login" className="text-teal-600 underline text-sm">Login karein</a>
        </div>
      </div>
    );
  }

  const isMember = user.role === "member" && card;

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #printable, #printable * { visibility: visible !important; }
          #printable { position: fixed; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          @page { margin: 10mm; size: A4; }
        }
      `}</style>

      {/* Page wrapper */}
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 py-8 px-4">

        {/* Header — hidden on print */}
        <div className="no-print max-w-2xl mx-auto mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Health Card</h1>
            <p className="text-sm text-gray-500">Print karein ya PDF ke roop mein save karein</p>
          </div>
          <div className="flex gap-3">
            <a href="/dashboard" className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">
              ← Back
            </a>
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition shadow-sm"
            >
              🖨️ Print / Save PDF
            </button>
          </div>
        </div>

        {/* Printable content */}
        <div id="printable" className="max-w-2xl mx-auto space-y-5">

          {/* ── Primary Member Card ── */}
          <div
            className="relative rounded-3xl overflow-hidden shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #0f766e 0%, #0d9488 40%, #0891b2 100%)",
              minHeight: 200,
            }}
          >
            {/* Decorative circles */}
            <div className="absolute top-[-40px] right-[-40px] w-48 h-48 rounded-full bg-white/10" />
            <div className="absolute bottom-[-30px] left-[-30px] w-36 h-36 rounded-full bg-white/10" />
            <div className="absolute top-10 right-20 w-20 h-20 rounded-full bg-white/5" />

            {/* Card content */}
            <div className="relative z-10 p-6">
              {/* Top row */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-teal-200 text-xs font-semibold tracking-widest uppercase">Brims Hospitals</p>
                  <p className="text-white/80 text-xs mt-0.5">Making Healthcare Affordable</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      isMember
                        ? "bg-amber-400/20 text-amber-200 border border-amber-400/40"
                        : "bg-white/20 text-white/80 border border-white/30"
                    }`}
                  >
                    {isMember ? "★ Member" : "Patient"}
                  </span>
                </div>
              </div>

              {/* Member info */}
              <div className="flex items-center gap-4">
                {/* Photo */}
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/40 bg-white/20 flex-shrink-0">
                  {user.photo ? (
                    <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl text-white/60">
                      {user.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1">
                  <h2 className="text-white font-bold text-lg leading-tight">{user.name}</h2>
                  <p className="text-teal-100 text-sm">
                    {user.age ? `${user.age} yrs` : ""}
                    {user.age && user.gender ? " • " : ""}
                    {user.gender || ""}
                    {user.address?.district ? ` • ${user.address.district}` : ""}
                  </p>
                  {user.memberId && (
                    <p className="text-teal-200 text-xs mt-1 font-mono tracking-wide">{user.memberId}</p>
                  )}
                  {user.preExistingDiseases && user.preExistingDiseases.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {user.preExistingDiseases.slice(0, 4).map((d) => (
                        <span key={d} className="bg-red-500/30 text-red-100 text-[10px] px-1.5 py-0.5 rounded-full border border-red-400/30">
                          {d}
                        </span>
                      ))}
                      {user.preExistingDiseases.length > 4 && (
                        <span className="text-red-200 text-[10px]">+{user.preExistingDiseases.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Card number & expiry row */}
              {isMember && card && (
                <div className="mt-6 flex items-end justify-between">
                  <div>
                    <p className="text-teal-300 text-[10px] uppercase tracking-widest mb-1">Card Number</p>
                    <p className="text-white font-mono text-base tracking-widest">{formatCardNumber(card.cardNumber)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-teal-300 text-[10px] uppercase tracking-widest mb-1">Valid Until</p>
                    <p className="text-white text-sm font-semibold">{formatDate(card.expiryDate)}</p>
                  </div>
                </div>
              )}

              {/* Mobile */}
              <div className="mt-3 flex items-center justify-between">
                <p className="text-teal-200 text-xs">📞 {user.mobile}</p>
                {isMember && (
                  <p className="text-teal-200 text-xs">
                    Status: <span className="text-green-300 font-semibold capitalize">{card?.status}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Family Members (if any) ── */}
          {members.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-teal-600">
                <h3 className="text-white font-semibold text-sm">Family Members ({members.length})</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {members.map((m, idx) => (
                  <div key={m._id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-9 h-9 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0">
                      {m.photo ? (
                        <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm text-gray-400 font-semibold">
                          {m.name?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 font-semibold text-sm truncate">{m.name}</p>
                      <p className="text-gray-400 text-xs">
                        {m.relationship || "Member"}
                        {m.age ? ` • ${m.age} yrs` : ""}
                        {m.gender ? ` • ${m.gender}` : ""}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {m.memberId && (
                        <p className="text-teal-600 font-mono text-xs">{m.memberId}</p>
                      )}
                      <p className="text-gray-400 text-xs">#{idx + 2}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Footer info ── */}
          <div className="bg-gray-50 rounded-2xl border border-gray-100 px-5 py-4 text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Patna, Bihar, India</span>
              <span>brims-hospitals.vercel.app</span>
            </div>
            <div className="flex justify-between">
              <span>Emergency: 112</span>
              <span>Generated: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
            </div>
            <p className="text-center text-gray-400 pt-1 border-t border-gray-200 mt-2">
              This card is for identification purposes only. Please carry a valid government ID along with this card.
            </p>
          </div>

          {/* ── Print instructions (hidden on print) ── */}
          <div className="no-print bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4">
            <p className="text-blue-800 font-semibold text-sm mb-1">PDF kaise save karein?</p>
            <ol className="text-blue-600 text-xs space-y-1 list-decimal list-inside">
              <li>Upar "🖨️ Print / Save PDF" button dabayein</li>
              <li>Print dialog mein <strong>"Save as PDF"</strong> ya <strong>"Microsoft Print to PDF"</strong> select karein</li>
              <li>Save button dabayein — PDF aapke device pe save ho jayega</li>
            </ol>
          </div>

        </div>
      </div>
    </>
  );
}
