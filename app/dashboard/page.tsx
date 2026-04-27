"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "../components/header";
import ImageCropper from "@/app/components/ImageCropper";
import { useLang } from "@/app/providers/LangProvider";
import { t } from "@/lib/i18n";
import biharDistricts from "@/lib/biharDistricts";

const diseases = ["HTN", "Diabetes", "CVD", "CKD", "Thyroid Disorder", "Joint Pain"];
const AUTO_MARRIED = ["spouse", "parent", "inlaw"];

/* ── SVG Icons ── */
function IconOPD() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h4" />
    </svg>
  );
}
function IconTele() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
      <rect x="2" y="3" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 10l2-2 2 2" />
      <circle cx="12" cy="11" r="0" fill="currentColor" />
    </svg>
  );
}
function IconLab() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6v7l3.5 9a1 1 0 01-.94 1.36H6.44A1 1 0 015.5 19L9 10V3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 14h12" />
    </svg>
  );
}
function IconSurgery() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a5 5 0 015 5v2a5 5 0 01-10 0V7a5 5 0 015-5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 19.5l-3-3 1.5-1.5M15.5 19.5l3-3-1.5-1.5M12 14v3" />
      <circle cx="8" cy="20" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16" cy="20" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconBookings() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </svg>
  );
}
function IconWallet() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8V6a2 2 0 012-2h14a2 2 0 012 2v2" />
      <circle cx="16.5" cy="13.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.5-6.5a2 2 0 012.828 2.828L11 15.5 7 17l1.5-4z" />
    </svg>
  );
}
function IconAddMoney() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8V6a2 2 0 012-2h14a2 2 0 012 2v2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v4M10 13h4" />
    </svg>
  );
}
function IconMyBookings() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 14h.01M12 14h.01M16 14h.01" />
    </svg>
  );
}
function IconMembers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="9" cy="7" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="18" cy="8" r="2.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 20c0-2.8-2-5-4.5-5" />
    </svg>
  );
}
function IconReports() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 13h8M8 17h5" />
    </svg>
  );
}

function IconHospitals() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M9 21V7l3-4 3 4v14M6 21V11H3v10M18 21V11h3V21" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 12h4M12 10v4" />
    </svg>
  );
}

/* ── Services config ── */
const services = [
  {
    href: "/opd-booking",
    tileKey: "tile.opd",
    subKey: "tile.opd.sub",
    icon: <IconOPD />,
    bg: "bg-blue-50",
    color: "text-blue-600",
    border: "border-blue-100",
    badge: "",
  },
  {
    href: "/teleconsultation",
    tileKey: "tile.teleconsult",
    subKey: "tile.teleconsult.sub",
    icon: <IconTele />,
    bg: "bg-purple-50",
    color: "text-purple-600",
    border: "border-purple-100",
    badge: "Live",
  },
  {
    href: "/lab-tests",
    tileKey: "tile.lab",
    subKey: "tile.lab.sub",
    icon: <IconLab />,
    bg: "bg-orange-50",
    color: "text-orange-500",
    border: "border-orange-100",
    badge: "",
  },
  {
    href: "/surgery-packages",
    tileKey: "tile.surgery",
    subKey: "tile.surgery.sub",
    icon: <IconSurgery />,
    bg: "bg-rose-50",
    color: "text-rose-500",
    border: "border-rose-100",
    badge: "EMI",
  },
  {
    href: "/ipd-booking",
    tileKey: "tile.ipd",
    subKey: "tile.ipd.sub",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h8" />
        <rect x="13" y="13" width="8" height="6" rx="1" />
        <path strokeLinecap="round" d="M17 13v-2M15 16h4" />
      </svg>
    ),
    bg: "bg-pink-50",
    color: "text-pink-600",
    border: "border-pink-100",
    badge: "",
  },
  {
    href: "/reports",
    tileKey: "tile.reports",
    subKey: "tile.reports.sub",
    icon: <IconReports />,
    bg: "bg-teal-50",
    color: "text-teal-600",
    border: "border-teal-100",
    badge: "",
  },
  {
    href: "/hospitals",
    tileKey: "tile.hospitals",
    subKey: "tile.hospitals.sub",
    icon: <IconHospitals />,
    bg: "bg-green-50",
    color: "text-green-600",
    border: "border-green-100",
    badge: "",
  },
  {
    href: "/ambulance",
    tileKey: "tile.ambulance",
    subKey: "tile.ambulance.sub",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <rect x="1" y="8" width="22" height="12" rx="2" />
        <path strokeLinecap="round" d="M1 12h6M17 12h6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8V6a3 3 0 016 0v2" />
        <path strokeLinecap="round" d="M12 13v4M10 15h4" />
      </svg>
    ),
    bg: "bg-red-50",
    color: "text-red-600",
    border: "border-red-100",
    badge: "SOS",
  },
  {
    href: "/referral",
    tileKey: "tile.referral",
    subKey: "tile.referral.sub",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    bg: "bg-amber-50",
    color: "text-amber-600",
    border: "border-amber-100",
    badge: "₹50",
  },
  {
    href: "/health-card",
    tileKey: "tile.healthCard",
    subKey: "tile.healthCard.sub",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <circle cx="8" cy="12" r="2.5" />
        <path strokeLinecap="round" d="M12 9h5M12 12h4M12 15h3" />
      </svg>
    ),
    bg: "bg-cyan-50",
    color: "text-cyan-600",
    border: "border-cyan-100",
    badge: "",
  },
  {
    href: "/support",
    tileKey: "tile.support",
    subKey: "tile.support.sub",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M6.343 17.657a9 9 0 010-12.728M9.172 15.536a5 5 0 010-7.072M12 13a1 1 0 100-2 1 1 0 000 2z" />
      </svg>
    ),
    bg: "bg-violet-50",
    color: "text-violet-600",
    border: "border-violet-100",
    badge: "Help",
  },
];

function DashboardContent() {
  const searchParams  = useSearchParams();
  const payment       = searchParams.get("payment");
  const cardNumber    = searchParams.get("cardNumber");
  const renewal       = searchParams.get("renewal");
  const renewalExpiry = searchParams.get("expiry");
  const fromParam     = searchParams.get("from");
  const { lang }      = useLang();

  const [user, setUser]               = useState<any>(null);
  const [familyCard, setFamilyCard]   = useState<any>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);
  const [paymentLoading, setPaymentLoading]   = useState(false);
  const [renewalLoading, setRenewalLoading]   = useState(false);
  const [activeMemberId, setActiveMemberId]   = useState<string | null>(null);
  const [profileModal, setProfileModal]       = useState<any | null>(null);

  // ── Coordinator / Families ──────────────────────────────────────────────────
  const [showFamilies, setShowFamilies]       = useState(false);
  const [families, setFamilies]               = useState<any[]>([]);
  const [familiesLoading, setFamiliesLoading] = useState(false);
  const [familySearch, setFamilySearch]       = useState("");
  const [familiesView, setFamiliesView]       = useState<"list" | "register" | "add-member">("list");
  const [fReg, setFReg] = useState({
    mobile: "", otp: "", otpHint: "", otpSent: false, otpLoading: false, userId: "",
    name: "", age: "", gender: "male",
    district: "", prakhand: "",
    maritalStatus: "", isPregnant: false, lmp: "",
    preExistingDiseases: [] as string[],
    idType: "", idNumber: "",
    height: "", weight: "",
    photo: "",
  });
  const [fRegCropper, setFRegCropper]           = useState(false);
  const [fRegPhotoPreview, setFRegPhotoPreview] = useState("");
  const [fRegPhotoUploading, setFRegPhotoUploading] = useState(false);
  const [fMember, setFMember] = useState({
    primaryMobile: "", name: "", age: "", gender: "male",
    relationship: "spouse", loading: false, targetFamily: null as any,
    alternateMobile: "",
    maritalStatus: "", isPregnant: false, lmp: "",
    preExistingDiseases: [] as string[],
    height: "", weight: "",
  });
  const [panelTab, setPanelTab]             = useState<"families" | "earnings" | "book">("families");
  const [earnings, setEarnings]             = useState<any>(null);
  const [earningsLoading, setEarningsLoading]   = useState(false);
  const [withdrawLoading, setWithdrawLoading]   = useState(false);
  const [transactions, setTransactions]         = useState<any[]>([]);
  const [txnLoading, setTxnLoading]             = useState(false);
  const [bookService, setBookService]           = useState<string | null>(null);
  const [bookClient, setBookClient]             = useState<any>(null);
  const [clientCardLoading, setClientCardLoading] = useState<string | null>(null); // holds clientUserId while loading

  useEffect(() => {
    if (payment === "success") showToast(`🎉 Family Card activate ho gayi! Card: ${cardNumber}`, true);
    else if (payment === "failed") showToast("❌ Payment fail ho gayi. Dobara try karein.", false);
    else if (renewal === "success") showToast(`✅ Card renew ho gayi! Valid till: ${renewalExpiry}`, true);
    else if (renewal === "failed") showToast("❌ Renewal payment fail. Dobara try karein.", false);
    setActiveMemberId(localStorage.getItem("activeMemberId"));
    fetchProfile();
    // Auto-open coordinator panel: returning from booking page OR from card activation payment
    const autoOpen = localStorage.getItem("coordinator_auto_open");
    if (autoOpen) {
      localStorage.removeItem("coordinator_auto_open");
      setTimeout(() => { setShowFamilies(true); setPanelTab("book"); fetchFamilies(); }, 600);
    } else if (fromParam === "coordinator") {
      setTimeout(() => { setShowFamilies(true); setPanelTab("families"); fetchFamilies(); }, 600);
    }
  }, []);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 5000);
  }

  async function fetchProfile() {
    const userId = localStorage.getItem("userId");
    if (!userId) { setLoading(false); return; }
    try {
      const res  = await fetch(`/api/profile?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setFamilyCard(data.familyCard);
        setFamilyMembers(data.familyMembers || []);
      }
    } catch {}
    setLoading(false);
  }

  // ── Coordinator families functions ─────────────────────────────────────────
  async function fetchFamilies() {
    setFamiliesLoading(true);
    try {
      const res  = await fetch("/api/coordinator/families");
      const data = await res.json();
      if (data.success) setFamilies(data.families || []);
    } finally { setFamiliesLoading(false); }
  }

  async function fetchEarnings() {
    setEarningsLoading(true);
    try {
      const [dashRes, txnRes] = await Promise.all([
        fetch("/api/coordinator/dashboard"),
        fetch("/api/coordinator/withdraw"),
      ]);
      const [dashData, txnData] = await Promise.all([dashRes.json(), txnRes.json()]);
      if (dashData.success) setEarnings(dashData);
      if (txnData.success) setTransactions(txnData.transactions || []);
    } finally { setEarningsLoading(false); }
  }

  async function activateClientCard(clientUserId: string) {
    setClientCardLoading(clientUserId);
    try {
      const res  = await fetch("/api/coordinator/create-client-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientUserId }),
      });
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        showToast(data.message || "Payment error", false);
        setClientCardLoading(null);
      }
    } catch {
      showToast("Network error", false);
      setClientCardLoading(null);
    }
  }

  async function freeActivateClientCard(clientUserId: string) {
    setClientCardLoading(clientUserId + "-free");
    try {
      const res  = await fetch("/api/coordinator/free-activate-client", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientUserId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, true);
        fetchFamilies();
      } else {
        showToast(data.message || "Error", false);
      }
    } finally { setClientCardLoading(null); }
  }

  async function handleWithdraw() {
    if (!window.confirm("Withdraw request bhejein? Admin 24–48h mein process karega.")) return;
    setWithdrawLoading(true);
    try {
      const res  = await fetch("/api/coordinator/withdraw", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, true);
        fetchEarnings();
      } else {
        showToast(data.message || "Error", false);
      }
    } finally { setWithdrawLoading(false); }
  }

  async function famSendOtp() {
    if (!/^\d{10}$/.test(fReg.mobile)) { showToast("Valid 10-digit mobile daalo", false); return; }
    setFReg(f => ({ ...f, otpLoading: true }));
    try {
      const lkRes = await fetch("/api/coordinator/families", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lookup", mobile: fReg.mobile }),
      });
      const lkData = await lkRes.json();
      if (lkData.exists) {
        showToast(`${lkData.user?.name || "User"} already registered — member add kar sakte hain`, true);
        setFMember(m => ({ ...m, primaryMobile: fReg.mobile, targetFamily: lkData.user }));
        setFamiliesView("add-member");
        setFReg(f => ({ ...f, otpLoading: false }));
        return;
      }
      const otpRes = await fetch("/api/coordinator/families", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-otp", mobile: fReg.mobile }),
      });
      const otpData = await otpRes.json();
      if (otpData.success) {
        setFReg(f => ({ ...f, otpSent: true, userId: otpData.userId, otpHint: otpData.otp || "", otpLoading: false }));
        showToast(otpData.otp ? `OTP: ${otpData.otp} (Test Mode)` : "OTP bheja gaya 📱", true);
      } else {
        showToast(otpData.message || "OTP failed", false);
        setFReg(f => ({ ...f, otpLoading: false }));
      }
    } catch {
      showToast("Network error", false);
      setFReg(f => ({ ...f, otpLoading: false }));
    }
  }

  async function handleFRegCropped(blob: Blob) {
    setFRegCropper(false);
    setFRegPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append("photo", blob, "profile.jpg");
      const res  = await fetch("/api/upload-photo", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setFReg(f => ({ ...f, photo: data.url }));
        setFRegPhotoPreview(data.url);
      } else {
        showToast("Photo upload fail: " + data.message, false);
      }
    } catch {
      showToast("Photo upload error", false);
    }
    setFRegPhotoUploading(false);
  }

  async function famVerifyRegister() {
    if (fReg.otp.length < 4) { showToast("OTP daalo", false); return; }
    if (!fReg.name.trim() || !fReg.age) { showToast("Naam aur age zaruri hai", false); return; }
    setFReg(f => ({ ...f, otpLoading: true }));
    try {
      const res = await fetch("/api/coordinator/families", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-register", mobile: fReg.mobile, otp: fReg.otp,
          name: fReg.name, age: fReg.age, gender: fReg.gender,
          district: fReg.district, prakhand: fReg.prakhand || undefined,
          maritalStatus: fReg.maritalStatus || undefined,
          isPregnant: fReg.isPregnant,
          lmp: fReg.lmp || undefined,
          preExistingDiseases: fReg.preExistingDiseases,
          idType: fReg.idType || undefined, idNumber: fReg.idNumber || undefined,
          height: fReg.height || undefined, weight: fReg.weight || undefined,
          photo: fReg.photo || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Register ho gaya!", true);
        fetchFamilies();
        setFReg({ mobile: "", otp: "", otpHint: "", otpSent: false, otpLoading: false, userId: "", name: "", age: "", gender: "male", district: "", prakhand: "", maritalStatus: "", isPregnant: false, lmp: "", preExistingDiseases: [], idType: "", idNumber: "", height: "", weight: "", photo: "" });
        setFRegPhotoPreview("");
        setFamiliesView("list");
      } else {
        showToast(data.message || "Registration failed", false);
        setFReg(f => ({ ...f, otpLoading: false }));
      }
    } catch {
      showToast("Network error", false);
      setFReg(f => ({ ...f, otpLoading: false }));
    }
  }

  async function famAddMember() {
    if (!fMember.name.trim() || !fMember.age || !fMember.relationship) {
      showToast("Naam, age aur rishta zaruri hai", false); return;
    }
    const primary = fMember.targetFamily?.mobile || fMember.primaryMobile;
    if (!primary) { showToast("Primary member mobile zaruri hai", false); return; }
    setFMember(m => ({ ...m, loading: true }));
    try {
      const res = await fetch("/api/coordinator/families", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-member", primaryMobile: primary,
          name: fMember.name, age: fMember.age, gender: fMember.gender,
          relationship: fMember.relationship,
          alternateMobile: fMember.alternateMobile || undefined,
          maritalStatus: fMember.maritalStatus || undefined,
          preExistingDiseases: fMember.preExistingDiseases,
          height: fMember.height || undefined,
          weight: fMember.weight || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Member add ho gaya!", true);
        fetchFamilies();
        setFMember({ primaryMobile: "", name: "", age: "", gender: "male", relationship: "spouse", loading: false, targetFamily: null, alternateMobile: "", maritalStatus: "", isPregnant: false, lmp: "", preExistingDiseases: [], height: "", weight: "" });
        setFamiliesView("list");
      } else {
        showToast(data.message || "Failed", false);
        setFMember(m => ({ ...m, loading: false }));
      }
    } catch {
      showToast("Network error", false);
      setFMember(m => ({ ...m, loading: false }));
    }
  }

  async function handleActivateCard() {
    setPaymentLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) { showToast("Login karein pehle", false); setPaymentLoading(false); return; }
      const res  = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success && data.redirectUrl) window.location.href = data.redirectUrl;
      else showToast(data.message || "Error", false);
    } catch { showToast("Network error.", false); }
    setPaymentLoading(false);
  }

  async function handleFreeActivate() {
    setPaymentLoading(true);
    try {
      const res  = await fetch("/api/activate-card-free", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showToast(`🎉 Card activated! (Test Mode) Card: ${data.cardNumber}`, true);
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showToast(data.message || "Error", false);
      }
    } catch { showToast("Network error.", false); }
    setPaymentLoading(false);
  }

  async function handleRenewCard() {
    setRenewalLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) { showToast("Login karein pehle", false); setRenewalLoading(false); return; }
      const res  = await fetch("/api/renew-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success && data.redirectUrl) window.location.href = data.redirectUrl;
      else showToast(data.message || "Error", false);
    } catch { showToast("Network error.", false); }
    setRenewalLoading(false);
  }

  // Card expiry helpers
  const cardExpired  = familyCard && familyCard.expiryDate && new Date(familyCard.expiryDate) < new Date();
  const daysToExpiry = familyCard && familyCard.expiryDate
    ? Math.ceil((new Date(familyCard.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const expiringSoon = !cardExpired && daysToExpiry !== null && daysToExpiry <= 30;

  const isIncomplete = user && (user.age === 0 || user.name === "New User" || !user.name);
  const allMembersFlat = user
    ? [{ ...user, isPrimary: true, relationship: "self" }, ...familyMembers]
    : familyMembers;
  const activeDisplayMember: any = activeMemberId
    ? (allMembersFlat.find((m: any) => m.memberId === activeMemberId) ?? user)
    : user;
  const displayName = activeDisplayMember?.name && activeDisplayMember.name !== "New User"
    ? activeDisplayMember.name
    : "User";

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold transition-all ${
          toast.ok ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* ── Hero Banner ── */}
      <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 relative overflow-hidden">
        {/* decorative blobs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full" />

        <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">

          {/* Incomplete Banner inside hero */}
          {isIncomplete && (
            <div className="bg-amber-400/20 border border-amber-300/40 rounded-2xl px-4 py-3 mb-5 flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center flex-shrink-0 text-sm">⚠️</div>
              <p className="text-amber-100 text-sm flex-1">Profile incomplete hai — naam, umar bharo</p>
              <a href="/update-profile" className="bg-amber-400 hover:bg-amber-300 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-lg transition whitespace-nowrap">
                Complete Karein
              </a>
            </div>
          )}

          {/* Member info row */}
          <div className="flex items-center gap-5">
            {/* Photo */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-white/30 bg-white/20">
                {activeDisplayMember?.photo
                  ? <img src={activeDisplayMember.photo} alt={displayName} className="w-full h-full object-cover" />
                  : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-white/60" stroke="currentColor" strokeWidth={1.5}>
                        <circle cx="12" cy="8" r="4" />
                        <path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                      </svg>
                    </div>
                  )
                }
              </div>
              {/* Active dot */}
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-teal-700 rounded-full" />
              {/* HC badge — shown only for primary member who is a coordinator */}
              {user?.coordinatorId && activeDisplayMember?.isPrimary !== false && (
                <span className="absolute -top-2 -left-2 bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-teal-700 leading-none z-10 tracking-wide">
                  HC
                </span>
              )}
            </div>

            {/* Name & details */}
            <div className="flex-1 min-w-0">
              <p className="text-teal-200 text-xs font-medium mb-0.5">
                {activeDisplayMember?.isPrimary === false
                  ? <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] mr-1 capitalize">{activeDisplayMember.relationship || "Member"}</span>
                  : null}
                {t("dash.hello", lang)} 🙏
              </p>
              <h1 className="text-white text-2xl font-bold leading-tight truncate">{displayName}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-teal-200 text-xs">📱 +91 {user?.mobile}</span>
                {activeDisplayMember?.memberId && (
                  <span className="bg-white/15 text-white text-xs px-2 py-0.5 rounded-full font-mono">
                    {activeDisplayMember.memberId}
                  </span>
                )}
                {user?.coordinatorId && activeDisplayMember?.isPrimary !== false && (
                  <a href="/coordinator-dashboard"
                    className="inline-flex items-center gap-1 bg-green-500/90 hover:bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full transition"
                    title="Health Coordinator">
                    🤝 HC
                  </a>
                )}
              </div>
            </div>

            {/* Edit profile */}
            <a href="/update-profile"
              className="flex-shrink-0 bg-white/15 hover:bg-white/25 text-white rounded-xl px-3 py-2.5 flex items-center gap-1.5 text-xs font-medium transition">
              <IconEdit />
              Edit
            </a>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: t("common.bookings", lang), value: "—",    icon: "📋" },
              { label: t("dash.wallet", lang),    value: familyCard ? `₹${familyCard.walletBalance || 0}` : "₹0", icon: "💰" },
              { label: t("dash.members", lang),   value: familyCard ? `${familyMembers.length + 1}/6` : "—",     icon: "👨‍👩‍👧" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-2xl p-3 text-center">
                <p className="text-lg mb-0.5">{s.icon}</p>
                <p className="text-white font-bold text-base">{s.value}</p>
                <p className="text-teal-200 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-6">

        {/* ── Renewal Banner ── */}
        {familyCard && cardExpired && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-xl shrink-0">⚠️</div>
            <div className="flex-1">
              <p className="font-bold text-red-700 text-sm">Family Card Expire Ho Gayi!</p>
              <p className="text-xs text-red-500 mt-0.5">Renewal ke baad 1 saal ke liye aage badhaiye — sirf ₹249</p>
            </div>
            <button
              onClick={handleRenewCard}
              disabled={renewalLoading}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition disabled:opacity-60 whitespace-nowrap"
            >
              {renewalLoading ? "..." : "Renew ₹249"}
            </button>
          </div>
        )}

        {familyCard && expiringSoon && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-xl shrink-0">⏳</div>
            <div className="flex-1">
              <p className="font-bold text-amber-700 text-sm">Card {daysToExpiry === 0 ? "Aaj" : `${daysToExpiry} Din Mein`} Expire Ho Rahi Hai</p>
              <p className="text-xs text-amber-600 mt-0.5">Ab renew karein aur 1 saal aur paayein — sirf ₹249</p>
            </div>
            <button
              onClick={handleRenewCard}
              disabled={renewalLoading}
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition disabled:opacity-60 whitespace-nowrap"
            >
              {renewalLoading ? "..." : "Renew ₹249"}
            </button>
          </div>
        )}

        {/* ── Family Health Card ── */}
        {familyCard ? (
          <div className="rounded-3xl overflow-hidden shadow-lg">
            {/* Card face */}
            <div className="bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-700 p-6 relative overflow-hidden">
              {/* Pattern */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-8 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest">Brims Health Card</p>
                    <p className="text-white text-lg font-bold font-mono mt-1 tracking-wider">
                      {familyCard.cardNumber}
                    </p>
                  </div>
                  {cardExpired ? (
                    <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">Expired</span>
                  ) : expiringSoon ? (
                    <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-amber-700 rounded-full animate-pulse" />
                      Expiring Soon
                    </span>
                  ) : (
                    <span className="bg-emerald-400 text-emerald-900 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-700 rounded-full animate-pulse" />
                      Active
                    </span>
                  )}
                </div>

                {/* Member photos row — primary + secondary */}
                {(() => {
                  const allM = user ? [user, ...familyMembers] : familyMembers;
                  return (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex -space-x-2">
                        {allM.slice(0, 4).map((m, i) => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-teal-600 overflow-hidden bg-white/20">
                            {m.photo
                              ? <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-xs text-white font-bold">{m.name?.[0] || "?"}</div>
                            }
                          </div>
                        ))}
                        {allM.length > 4 && (
                          <div className="w-8 h-8 rounded-full border-2 border-teal-600 bg-white/20 flex items-center justify-center text-xs text-white font-bold">
                            +{allM.length - 4}
                          </div>
                        )}
                      </div>
                      <p className="text-teal-200 text-xs">{allM.length} member{allM.length !== 1 ? "s" : ""}</p>
                    </div>
                  );
                })()}

                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-teal-300 text-xs">Activated</p>
                    <p className="text-white font-semibold">
                      {new Date(familyCard.activationDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-teal-300 text-xs">Valid Till</p>
                    <p className="text-white font-semibold">
                      {new Date(familyCard.expiryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet strip */}
            <div className="bg-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                  <IconWallet />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">{t("dash.wallet", lang)}</p>
                  <p className="text-xl font-bold text-gray-800">₹{familyCard.walletBalance || 0}</p>
                </div>
              </div>
              <a href="/wallet"
                className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {t("btn.addMoney", lang)}
              </a>
            </div>
          </div>
        ) : (
          /* ── Activate Card ── */
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 px-6 pt-6 pb-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-teal-600 font-semibold uppercase tracking-wider mb-1">Limited Time Offer</p>
                  <h2 className="text-xl font-bold text-gray-800">Family Health Card</h2>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 line-through">₹999/yr</p>
                  <p className="text-2xl font-black text-teal-600">₹249</p>
                  <p className="text-xs text-gray-400">/saal</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "1 Primary + 5 Members",
                  "Shared Family Wallet",
                  "Lab & OPD Discount",
                  "Digital Health Card",
                  "Priority Booking",
                  "Surgery Concession",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">✓</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 pb-6 pt-4">
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4 text-xs text-amber-700">
                <span>🔥</span>
                <span><strong>75% off</strong> — Sirf aaj ke liye ₹249 mein! Normal price ₹999</span>
              </div>
              <button
                onClick={handleActivateCard}
                disabled={paymentLoading}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold py-4 rounded-2xl transition disabled:opacity-50 text-base shadow-lg shadow-teal-200 flex items-center justify-center gap-2"
              >
                {paymentLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>{t("dash.activateCard", lang)} — ₹249 <span className="text-lg">🎉</span></>
                )}
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">Secure payment · PhonePe / UPI / Card</p>

              {/* Test mode free activation */}
              {process.env.NEXT_PUBLIC_SHOW_OTP === "true" && (
                <div className="mt-3 border-t border-dashed border-amber-200 pt-3">
                  <p className="text-center text-[10px] text-amber-500 font-bold mb-2">⚠️ TESTING MODE ONLY</p>
                  <button
                    onClick={handleFreeActivate}
                    disabled={paymentLoading}
                    className="w-full border-2 border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold py-2.5 rounded-xl transition text-sm disabled:opacity-50">
                    🧪 Free Activate (Test) — Bina Payment
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Family Members (only if card active) ── */}
        {familyCard && user && (() => {
          // Primary user is slot 0; secondary members are familyMembers[]
          const primarySlot = { ...user, isPrimary: true, relationship: "self" };
          const allSlots = [primarySlot, ...familyMembers];
          const totalUsed = allSlots.length; // 1 primary + secondary
          const emptySlots = 6 - totalUsed;

          return (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-gray-800">{t("dash.members", lang)}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{totalUsed} of 6 slots used</p>
                </div>
                {emptySlots > 0 && (
                  <a href="/add-member"
                    className="bg-teal-50 hover:bg-teal-100 text-teal-700 text-sm font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1">
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add
                  </a>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {allSlots.map((member, i) => {
                  const isActive = activeMemberId
                    ? activeMemberId === member.memberId
                    : member.isPrimary;
                  return (
                    <button
                      key={i}
                      onClick={() => setProfileModal(member)}
                      className="flex flex-col items-center gap-1.5 group focus:outline-none"
                    >
                      <div className="relative">
                        <div className={`w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-teal-100 to-teal-200 transition ${isActive ? "ring-[3px] ring-teal-500 ring-offset-1" : "ring-2 ring-teal-100 group-hover:ring-teal-300"}`}>
                          {member.photo
                            ? <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-teal-500 font-bold text-xl">{member.name?.[0] || "?"}</div>
                          }
                        </div>
                        {member.isPrimary && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="white" className="w-2.5 h-2.5">
                              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                            </svg>
                          </span>
                        )}
                        {isActive && (
                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-[8px] px-1 py-0.5 rounded-full font-bold whitespace-nowrap">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-gray-700 text-center leading-tight truncate w-full">
                        {member.name?.split(" ")[0] || "—"}
                      </p>
                      <p className="text-xs text-gray-400">{member.age} yr</p>
                    </button>
                  );
                })}

                {/* Empty slots */}
                {Array.from({ length: emptySlots }).map((_, i) => (
                  <a key={i} href="/add-member" className="flex flex-col items-center gap-1.5 group">
                    <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-gray-200 group-hover:border-teal-400 flex items-center justify-center transition bg-gray-50 group-hover:bg-teal-50">
                      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-gray-300 group-hover:text-teal-400 transition" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-300 group-hover:text-teal-500 transition">Add</p>
                  </a>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── Services Grid ── */}
        <div>
          <h2 className="text-base font-bold text-gray-700 mb-3 px-1">{t("dash.services", lang)}</h2>
          <div className="grid grid-cols-2 gap-3">
            {services.map((s) => (
              <a key={s.href} href={s.href}
                className={`bg-white rounded-2xl p-5 border ${s.border} hover:shadow-md transition-all group relative overflow-hidden`}>
                {/* Background decoration */}
                <div className={`absolute -bottom-4 -right-4 w-20 h-20 ${s.bg} rounded-full opacity-50 group-hover:opacity-80 transition`} />
                <div className="relative z-10">
                  <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    {s.icon}
                  </div>
                  {s.badge && (
                    <span className={`absolute top-0 right-0 text-xs font-bold px-2 py-0.5 rounded-bl-xl rounded-tr-2xl ${
                      s.badge === "Live" ? "bg-purple-500 text-white" : "bg-orange-400 text-white"
                    }`}>
                      {s.badge}
                    </span>
                  )}
                  <h3 className="font-bold text-gray-800 text-sm">{t(s.tileKey, lang)}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{t(s.subKey, lang)}</p>
                </div>
              </a>
            ))}
          </div>

          {/* My Bookings — full width */}
          <a href="/my-bookings"
            className="mt-3 bg-white rounded-2xl px-5 py-4 border border-indigo-100 hover:shadow-md transition-all group flex items-center gap-4 relative overflow-hidden">
            <div className="absolute -bottom-4 -right-6 w-24 h-24 bg-indigo-50 rounded-full opacity-50 group-hover:opacity-80 transition" />
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0 relative z-10">
              <IconBookings />
            </div>
            <div className="relative z-10">
              <h3 className="font-bold text-gray-800 text-sm">{t("dash.myBookings", lang)}</h3>
              <p className="text-xs text-gray-400 mt-0.5">OPD · Lab · Surgery · Teleconsult</p>
            </div>
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-gray-300 ml-auto relative z-10 group-hover:text-indigo-400 transition" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
            </svg>
          </a>
        </div>

      </div>

      {/* ── Bottom Navigation Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-md mx-auto flex items-stretch h-16">

          {/* Add Money */}
          {familyCard ? (
            <a href="/wallet" className="flex-1 flex flex-col items-center justify-center gap-0.5 text-teal-600 hover:bg-teal-50 transition">
              <IconAddMoney />
              <span className="text-[10px] font-semibold">{t("btn.addMoney", lang)}</span>
            </a>
          ) : (
            <button
              onClick={handleActivateCard}
              disabled={paymentLoading}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-300 cursor-not-allowed"
              title="Card activate karein pehle"
            >
              <IconAddMoney />
              <span className="text-[10px] font-semibold">{t("btn.addMoney", lang)}</span>
            </button>
          )}

          {/* Divider */}
          <div className="w-px bg-gray-100 my-3" />

          {/* Bookings — always enabled */}
          <a href="/my-bookings" className="flex-1 flex flex-col items-center justify-center gap-0.5 text-indigo-600 hover:bg-indigo-50 transition">
            <IconMyBookings />
            <span className="text-[10px] font-semibold">{t("nav.myBookings", lang)}</span>
          </a>

          {/* Divider */}
          <div className="w-px bg-gray-100 my-3" />

          {/* Members */}
          {familyCard ? (
            <a href="/add-member" className="flex-1 flex flex-col items-center justify-center gap-0.5 text-emerald-600 hover:bg-emerald-50 transition">
              <IconMembers />
              <span className="text-[10px] font-semibold">{t("dash.members", lang)}</span>
            </a>
          ) : (
            <button
              onClick={handleActivateCard}
              disabled={paymentLoading}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition"
              title="Card activate karein Members add karne ke liye"
            >
              <div className="relative">
                <IconMembers />
                <span className="absolute -top-1 -right-2 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-[8px] font-bold text-white">!</span>
              </div>
              <span className="text-[10px] font-semibold">{t("dash.members", lang)}</span>
            </button>
          )}

          {/* Families tab — only for coordinators */}
          {user?.coordinatorId && (
            <>
              <div className="w-px bg-gray-100 my-3" />
              <button
                onClick={() => { setShowFamilies(true); fetchFamilies(); setFamiliesView("list"); }}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 text-green-600 hover:bg-green-50 transition"
              >
                <span className="text-xl leading-none">👨‍👩‍👧</span>
                <span className="text-[10px] font-semibold">Families</span>
              </button>
            </>
          )}

        </div>

        {/* Safe area for iPhone home indicator */}
        <div className="h-safe-area-inset-bottom" />
      </div>

      {/* ── Coordinator Panel (Families / Earnings / Book) ── */}
      {showFamilies && user?.coordinatorId && (
        <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-700 to-emerald-600 text-white px-4 pt-safe flex-shrink-0">
            <div className="flex items-center gap-3 py-4">
              <button
                onClick={() => { setShowFamilies(false); setFamiliesView("list"); setPanelTab("families"); }}
                className="text-white/80 hover:text-white text-xl leading-none"
              >←</button>
              <div className="flex-1">
                <p className="text-green-200 text-[11px] font-semibold uppercase tracking-wide">Health Coordinator</p>
                <h2 className="font-bold text-lg leading-tight">
                  {panelTab === "earnings" ? "My Earnings" : panelTab === "book" ? "Book Service" :
                    familiesView === "register" ? "Register New Family" : familiesView === "add-member" ? "Add Family Member" : "My Families"}
                </h2>
              </div>
              {panelTab === "families" && familiesView === "list" && (
                <button
                  onClick={() => { setFReg({ mobile: "", otp: "", otpHint: "", otpSent: false, otpLoading: false, userId: "", name: "", age: "", gender: "male", district: "", prakhand: "", maritalStatus: "", isPregnant: false, lmp: "", preExistingDiseases: [], idType: "", idNumber: "", height: "", weight: "", photo: "" }); setFRegPhotoPreview(""); setFamiliesView("register"); }}
                  className="bg-white/20 hover:bg-white/30 text-white text-sm font-bold px-4 py-2 rounded-xl transition"
                >
                  + Register
                </button>
              )}
            </div>
            {/* Tab bar */}
            <div className="flex border-t border-white/20 -mx-4">
              {([["families","👨‍👩‍👧","Families"],["earnings","💰","Earnings"],["book","📅","Book"]] as const).map(([tab, icon, label]) => (
                <button key={tab} onClick={() => {
                  setPanelTab(tab);
                  if (tab === "families") { fetchFamilies(); setFamiliesView("list"); }
                  if (tab === "earnings") fetchEarnings();
                  if (tab === "book") { fetchFamilies(); setBookService(null); setBookClient(null); }
                }}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-semibold transition border-b-2 ${panelTab === tab ? "border-white text-white" : "border-transparent text-white/60 hover:text-white/80"}`}>
                  <span className="text-base leading-none">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">

              {/* ══ FAMILIES TAB ══ */}
              {panelTab === "families" && (
              <>

              {/* ─ List view ─ */}
              {familiesView === "list" && (
                <>
                  <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5 gap-2 focus-within:border-green-400 transition">
                    <span className="text-gray-400 text-sm">🔍</span>
                    <input value={familySearch} onChange={e => setFamilySearch(e.target.value)}
                      placeholder="Naam ya mobile..." className="flex-1 text-sm outline-none bg-transparent" />
                  </div>

                  {familiesLoading ? (
                    <div className="flex justify-center py-16">
                      <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
                    </div>
                  ) : families.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-gray-400">
                      <p className="text-4xl mb-3">👨‍👩‍👧</p>
                      <p className="font-semibold text-gray-500 text-sm">Koi registered family nahi hai</p>
                      <p className="text-xs mt-1">Register button se naya family add karein</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-400 px-1">
                        {families.filter(f => !familySearch || f.name.toLowerCase().includes(familySearch.toLowerCase()) || f.mobile.includes(familySearch)).length} families
                      </p>
                      {families
                        .filter(f => !familySearch || f.name.toLowerCase().includes(familySearch.toLowerCase()) || f.mobile.includes(familySearch))
                        .map((fam: any) => {
                          const card = fam.familyCardId;
                          const isActive = card?.status === "active";
                          const memberCount = (fam.familyMembers || []).length;
                          return (
                            <div key={fam._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg flex-shrink-0">
                                    {fam.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-gray-800 text-sm">{fam.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">📱 {fam.mobile}{fam.age ? ` · ${fam.age}y` : ""}</p>
                                    {fam.memberId && <p className="text-[10px] text-gray-400 font-mono">{fam.memberId}</p>}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                  {isActive ? (
                                    <>
                                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border bg-green-100 text-green-700 border-green-200">✓ Card Active</span>
                                      <span className="text-[9px] text-green-600 font-medium">₹100 commission ✓</span>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => activateClientCard(fam._id)}
                                      disabled={clientCardLoading === fam._id || clientCardLoading === fam._id + "-free"}
                                      className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 transition whitespace-nowrap"
                                    >
                                      {clientCardLoading === fam._id ? "..." : "💳 Activate ₹249"}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Test-mode free activation */}
                              {!isActive && process.env.NEXT_PUBLIC_SHOW_OTP === "true" && (
                                <div className="mt-2">
                                  <button
                                    onClick={() => freeActivateClientCard(fam._id)}
                                    disabled={clientCardLoading === fam._id + "-free" || clientCardLoading === fam._id}
                                    className="w-full text-[11px] font-semibold px-3 py-1.5 rounded-xl border border-dashed border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition"
                                  >
                                    {clientCardLoading === fam._id + "-free" ? "Activating..." : "🧪 Free Activate (Test Mode)"}
                                  </button>
                                </div>
                              )}

                              {memberCount > 0 && (
                                <div className="mt-2.5 pt-2.5 border-t border-gray-50 flex flex-wrap gap-1.5">
                                  {(fam.familyMembers || []).map((m: any) => (
                                    <span key={m._id} className="text-[10px] bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5 text-gray-600">
                                      {m.name} ({m.relationship})
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="mt-3 flex gap-2">
                                <a href={`tel:${fam.mobile}`} className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-50 text-gray-600 text-xs font-semibold rounded-xl">📞 Call</a>
                                <a href={`https://wa.me/91${fam.mobile}`} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl">💬 WhatsApp</a>
                                {memberCount < 5 && (
                                  <button onClick={() => { setFMember(m => ({ ...m, primaryMobile: fam.mobile, targetFamily: fam, name: "", age: "", gender: "male", relationship: "spouse" })); setFamiliesView("add-member"); }}
                                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-50 text-blue-700 text-xs font-semibold rounded-xl">+ Member</button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </>
              )}

              {/* ─ Register new family ─ */}
              {familiesView === "register" && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                  {!fReg.otpSent ? (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Mobile Number *</label>
                      <div className="flex gap-2">
                        <div className="flex-1 flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-green-400 transition">
                          <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-200">+91</span>
                          <input type="tel" maxLength={10} value={fReg.mobile}
                            onChange={e => setFReg(f => ({ ...f, mobile: e.target.value.replace(/\D/g, "") }))}
                            placeholder="9876543210" className="flex-1 px-3 py-2.5 text-sm focus:outline-none" />
                        </div>
                        <button onClick={famSendOtp} disabled={fReg.otpLoading || fReg.mobile.length < 10}
                          className="px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50">
                          {fReg.otpLoading ? "..." : "Check"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    (() => {
                      const rAge = parseInt(fReg.age) || 0;
                      const rFemale = fReg.gender === "female";
                      const rAutoMarried = AUTO_MARRIED.includes("self");
                      const rShowMarital = rFemale && rAge >= 18;
                      const rMarried = fReg.maritalStatus === "married";
                      const rShowPreg = rFemale && rMarried && rAge >= 17 && rAge <= 50;
                      return (
                        <div className="space-y-3">
                          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm text-green-700 font-medium">📱 {fReg.mobile} — OTP bheja gaya</div>
                          {/* OTP + inline Verify button */}
                          <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">OTP *</label>
                            <div className="flex gap-2">
                              <input type="text" maxLength={6} inputMode="numeric" value={fReg.otp}
                                onChange={e => setFReg(f => ({ ...f, otp: e.target.value.replace(/\D/g, "") }))}
                                placeholder="6-digit OTP"
                                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
                              <button onClick={famVerifyRegister} disabled={fReg.otpLoading || fRegPhotoUploading}
                                className="px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl disabled:opacity-50 whitespace-nowrap transition">
                                {fReg.otpLoading ? "..." : "✓ Verify & Register"}
                              </button>
                            </div>
                            {fReg.otpHint && (
                              <div className="mt-1.5 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                                <span className="text-amber-600 text-sm">🔑</span>
                                <span className="text-xs text-amber-800 font-medium">Test OTP: </span>
                                <span className="text-sm font-mono font-bold text-amber-700 tracking-widest">{fReg.otpHint}</span>
                              </div>
                            )}
                          </div>
                          {/* Photo */}
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            {fRegPhotoPreview ? (
                              <img src={fRegPhotoPreview} alt="photo" className="w-14 h-14 rounded-full object-cover border-2 border-green-400" />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-2xl">👤</div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-600">Photo (Optional)</p>
                              <p className="text-xs text-gray-400">Profile photo add karo</p>
                            </div>
                            <button type="button" onClick={() => setFRegCropper(true)} disabled={fRegPhotoUploading}
                              className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg font-semibold disabled:opacity-50">
                              {fRegPhotoUploading ? "..." : fRegPhotoPreview ? "Change" : "📷 Add"}
                            </button>
                          </div>
                          {/* Name */}
                          <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Poora Naam *</label>
                            <input value={fReg.name} onChange={e => setFReg(f => ({ ...f, name: e.target.value }))} placeholder="Ramesh Kumar"
                              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
                          </div>
                          {/* Age + Gender */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-semibold text-gray-500 mb-1 block">Age *</label>
                              <input type="number" min={1} max={120} value={fReg.age} onChange={e => setFReg(f => ({ ...f, age: e.target.value }))} placeholder="35"
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 mb-1 block">Gender *</label>
                              <select value={fReg.gender} onChange={e => setFReg(f => ({ ...f, gender: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white">
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                              </select>
                            </div>
                          </div>
                          {/* Marital status */}
                          {rShowMarital && (
                            <div>
                              <label className="text-xs font-semibold text-gray-500 mb-1 block">Vaivahik Sthiti</label>
                              <select value={fReg.maritalStatus} onChange={e => setFReg(f => ({ ...f, maritalStatus: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white">
                                <option value="">Select</option>
                                <option value="unmarried">Avivahit (Unmarried)</option>
                                <option value="married">Vivahit (Married)</option>
                              </select>
                            </div>
                          )}
                          {/* Pregnancy */}
                          {rShowPreg && (
                            <div className="p-3 bg-pink-50 rounded-xl border border-pink-200">
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={fReg.isPregnant} onChange={e => setFReg(f => ({ ...f, isPregnant: e.target.checked }))} className="w-4 h-4 accent-teal-600" />
                                <span className="text-sm font-medium text-gray-700">🤰 Pregnant hain?</span>
                              </label>
                              {fReg.isPregnant && (
                                <div className="mt-2">
                                  <label className="text-xs font-semibold text-gray-500 mb-1 block">LMP Date</label>
                                  <input type="date" value={fReg.lmp} onChange={e => setFReg(f => ({ ...f, lmp: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
                                </div>
                              )}
                            </div>
                          )}
                          {/* District + Prakhand */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-semibold text-gray-500 mb-1 block">District</label>
                              <select value={fReg.district} onChange={e => setFReg(f => ({ ...f, district: e.target.value, prakhand: "" }))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white">
                                <option value="">Select</option>
                                {Object.keys(biharDistricts).sort().map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 mb-1 block">Prakhand</label>
                              <select value={fReg.prakhand} onChange={e => setFReg(f => ({ ...f, prakhand: e.target.value }))} disabled={!fReg.district}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white disabled:opacity-40">
                                <option value="">Select</option>
                                {(biharDistricts[fReg.district] || []).map((p: string) => <option key={p} value={p}>{p}</option>)}
                              </select>
                            </div>
                          </div>
                          {/* Diseases */}
                          <div>
                            <label className="text-xs font-semibold text-gray-500 mb-2 block">Pahle se Bimari</label>
                            <div className="grid grid-cols-2 gap-1.5">
                              {diseases.map(d => (
                                <label key={d} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-gray-100 hover:bg-gray-50 text-xs">
                                  <input type="checkbox" checked={fReg.preExistingDiseases.includes(d)}
                                    onChange={() => setFReg(f => ({ ...f, preExistingDiseases: f.preExistingDiseases.includes(d) ? f.preExistingDiseases.filter(x => x !== d) : [...f.preExistingDiseases, d] }))}
                                    className="w-3.5 h-3.5 accent-green-600" />
                                  {d}
                                </label>
                              ))}
                            </div>
                          </div>
                          {/* Height + Weight */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-semibold text-gray-500 mb-1 block">Height (cm)</label>
                              <input type="number" value={fReg.height} onChange={e => setFReg(f => ({ ...f, height: e.target.value }))} placeholder="165"
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 mb-1 block">Weight (kg)</label>
                              <input type="number" value={fReg.weight} onChange={e => setFReg(f => ({ ...f, weight: e.target.value }))} placeholder="70"
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
                            </div>
                          </div>
                          {/* ID */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-semibold text-gray-500 mb-1 block">ID Type</label>
                              <select value={fReg.idType} onChange={e => setFReg(f => ({ ...f, idType: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white">
                                <option value="">None</option>
                                <option value="Aadhaar">Aadhaar</option>
                                <option value="Voter ID">Voter ID</option>
                                <option value="PAN">PAN</option>
                                <option value="Driving Licence">Driving Licence</option>
                                <option value="Passport">Passport</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 mb-1 block">ID Number</label>
                              <input value={fReg.idNumber} onChange={e => setFReg(f => ({ ...f, idNumber: e.target.value }))} placeholder="XXXX XXXX XXXX"
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              )}

              {/* ─ Add member ─ */}
              {familiesView === "add-member" && (() => {
                const mAge = parseInt(fMember.age) || 0;
                const mFemale = fMember.gender === "female";
                const mAutoMarried = AUTO_MARRIED.includes(fMember.relationship);
                const mShowMarital = mFemale && mAge >= 18 && !mAutoMarried;
                const mMarried = fMember.maritalStatus === "married" || mAutoMarried;
                const mShowPreg = mFemale && mMarried && mAge >= 17 && mAge <= 50;
                return (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                    {/* Primary family info */}
                    {fMember.targetFamily ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-blue-800 flex items-center gap-2">
                        👨‍👩‍👧 <strong>{fMember.targetFamily.name}</strong> · {fMember.targetFamily.mobile} · {(fMember.targetFamily.familyMembers || []).length}/5 slots
                      </div>
                    ) : (
                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Primary Member Mobile *</label>
                        <input type="tel" maxLength={10} value={fMember.primaryMobile}
                          onChange={e => setFMember(m => ({ ...m, primaryMobile: e.target.value.replace(/\D/g, "") }))}
                          placeholder="9876543210"
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
                      </div>
                    )}
                    {/* Relationship */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Rishta (Relationship) *</label>
                      <select value={fMember.relationship} onChange={e => setFMember(m => ({ ...m, relationship: e.target.value, maritalStatus: AUTO_MARRIED.includes(e.target.value) ? "married" : m.maritalStatus }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white">
                        <option value="spouse">Pati / Patni (Spouse)</option>
                        <option value="child">Bachcha (Child)</option>
                        <option value="parent">Mata / Pita (Parent)</option>
                        <option value="inlaw">Sasur / Saas (In-Laws)</option>
                        <option value="sibling">Bhai / Behen (Sibling)</option>
                        <option value="other">Anya (Other)</option>
                      </select>
                      {mAutoMarried && <p className="text-xs text-teal-600 mt-1">✓ Is rishte ke liye married automatically set hai</p>}
                    </div>
                    {/* Name */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Poora Naam *</label>
                      <input value={fMember.name} onChange={e => setFMember(m => ({ ...m, name: e.target.value }))} placeholder="Sunita Devi"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
                    </div>
                    {/* Alternate Mobile */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Alternate Mobile (Optional)</label>
                      <input type="tel" maxLength={10} value={fMember.alternateMobile} onChange={e => setFMember(m => ({ ...m, alternateMobile: e.target.value.replace(/\D/g, "") }))} placeholder="Is member ka alag mobile"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
                    </div>
                    {/* Age + Gender */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Age *</label>
                        <input type="number" min={0} max={120} value={fMember.age} onChange={e => setFMember(m => ({ ...m, age: e.target.value }))} placeholder="28"
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Gender *</label>
                        <select value={fMember.gender} onChange={e => setFMember(m => ({ ...m, gender: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white">
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                    </div>
                    {/* Marital status */}
                    {mShowMarital && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Vaivahik Sthiti</label>
                        <select value={fMember.maritalStatus} onChange={e => setFMember(m => ({ ...m, maritalStatus: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white">
                          <option value="">Select</option>
                          <option value="unmarried">Avivahit (Unmarried)</option>
                          <option value="married">Vivahit (Married)</option>
                        </select>
                      </div>
                    )}
                    {/* Pregnancy */}
                    {mShowPreg && (
                      <div className="p-3 bg-pink-50 rounded-xl border border-pink-200">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={fMember.isPregnant} onChange={e => setFMember(m => ({ ...m, isPregnant: e.target.checked }))} className="w-4 h-4 accent-teal-600" />
                          <span className="text-sm font-medium text-gray-700">🤰 Pregnant hain?</span>
                        </label>
                        {fMember.isPregnant && (
                          <div className="mt-2">
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">LMP Date</label>
                            <input type="date" value={fMember.lmp} onChange={e => setFMember(m => ({ ...m, lmp: e.target.value }))}
                              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
                          </div>
                        )}
                      </div>
                    )}
                    {/* Diseases */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-2 block">Pahle se Bimari</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {diseases.map(d => (
                          <label key={d} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-gray-100 hover:bg-gray-50 text-xs">
                            <input type="checkbox" checked={fMember.preExistingDiseases.includes(d)}
                              onChange={() => setFMember(m => ({ ...m, preExistingDiseases: m.preExistingDiseases.includes(d) ? m.preExistingDiseases.filter(x => x !== d) : [...m.preExistingDiseases, d] }))}
                              className="w-3.5 h-3.5 accent-blue-600" />
                            {d}
                          </label>
                        ))}
                      </div>
                    </div>
                    {/* Height + Weight */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Height (cm)</label>
                        <input type="number" value={fMember.height} onChange={e => setFMember(m => ({ ...m, height: e.target.value }))} placeholder="165"
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Weight (kg)</label>
                        <input type="number" value={fMember.weight} onChange={e => setFMember(m => ({ ...m, weight: e.target.value }))} placeholder="70"
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
                      </div>
                    </div>
                    <button onClick={famAddMember} disabled={fMember.loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50">
                      {fMember.loading ? "Add ho raha hai..." : "✓ Add Member"}
                    </button>
                  </div>
                );
              })()}

              </> /* end families tab */
              )}

              {/* ══ EARNINGS TAB ══ */}
              {panelTab === "earnings" && (
                <>
                  {earningsLoading ? (
                    <div className="flex justify-center py-16">
                      <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
                    </div>
                  ) : !earnings ? (
                    <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center text-gray-400 text-sm">No data</div>
                  ) : (
                    <>
                      {/* 4 stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border bg-amber-50 border-amber-200 p-4">
                          <p className="text-xs text-gray-500 mb-1">Pending (Service incomplete)</p>
                          <p className="text-xl font-bold text-amber-700">₹{(earnings.stats?.pendingEarned || 0).toLocaleString("en-IN")}</p>
                          <p className="text-[10px] text-amber-600 mt-0.5">Service complete hone par milega</p>
                        </div>
                        <div className="rounded-2xl border bg-green-50 border-green-200 p-4">
                          <p className="text-xs text-gray-500 mb-1">Available to Withdraw</p>
                          <p className="text-xl font-bold text-green-700">₹{(earnings.stats?.availableEarned || 0).toLocaleString("en-IN")}</p>
                          <p className="text-[10px] text-green-600 mt-0.5">Service complete — withdraw karein</p>
                        </div>
                        <div className="rounded-2xl border bg-blue-50 border-blue-200 p-4">
                          <p className="text-xs text-gray-500 mb-1">Total Paid Out</p>
                          <p className="text-xl font-bold text-blue-700">₹{(earnings.stats?.paidEarned || 0).toLocaleString("en-IN")}</p>
                        </div>
                        <div className="rounded-2xl border bg-purple-50 border-purple-200 p-4">
                          <p className="text-xs text-gray-500 mb-1">This Month</p>
                          <p className="text-xl font-bold text-purple-700">₹{(earnings.stats?.monthEarned || 0).toLocaleString("en-IN")}</p>
                        </div>
                      </div>

                      {/* Withdraw button */}
                      {(earnings.stats?.availableEarned || 0) > 0 && (
                        <button onClick={handleWithdraw} disabled={withdrawLoading}
                          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
                          {withdrawLoading ? (
                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                          ) : (
                            <>💸 Withdraw ₹{(earnings.stats.availableEarned).toLocaleString("en-IN")}</>
                          )}
                        </button>
                      )}

                      {/* Commission ledger */}
                      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                          <p className="font-bold text-gray-700 text-sm">Commission Ledger</p>
                          <span className="text-xs text-gray-400">{(earnings.bookings || []).length} entries</span>
                        </div>
                        {(earnings.bookings || []).length === 0 ? (
                          <p className="text-center text-gray-400 text-sm py-8">Abhi koi booking nahi hai</p>
                        ) : (
                          <div className="divide-y divide-gray-50">
                            {(earnings.bookings || []).slice(0, 30).map((b: any) => {
                              let n: any = {};
                              try { n = JSON.parse(b.notes || "{}"); } catch {}
                              const svc = b.packageId?.name || b.labTestId?.name || b.doctorId?.name || b.type || "—";
                              const commission = b.coordinatorCommission || 0;
                              const isCompleted = b.status === "completed";
                              const isPaid = b.coordinatorPaid;
                              const statusLabel = isPaid ? "Paid" : isCompleted ? "Ready" : "Pending";
                              const statusColor = isPaid ? "text-green-600" : isCompleted ? "text-blue-600" : "text-amber-600";
                              return (
                                <div key={b._id} className="px-4 py-3 flex items-start gap-3">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${isPaid ? "bg-green-100 text-green-700" : isCompleted ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                                    {isPaid ? "✓" : isCompleted ? "★" : "⏳"}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">{n.patientName || "—"}</p>
                                    <p className="text-xs text-gray-400 truncate">{svc}</p>
                                    <p className="text-xs text-gray-400">{new Date(b.createdAt).toLocaleDateString("en-IN")}</p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className={`text-sm font-bold ${commission > 0 ? "text-gray-700" : "text-gray-400"}`}>
                                      {commission > 0 ? `₹${commission}` : "—"}
                                    </p>
                                    <p className={`text-[10px] font-semibold ${statusColor}`}>{statusLabel}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Transaction history */}
                      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                          <p className="font-bold text-gray-700 text-sm">Transaction History</p>
                          {txnLoading && <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />}
                        </div>
                        {transactions.length === 0 ? (
                          <p className="text-center text-gray-400 text-sm py-6">Koi transaction nahi hai</p>
                        ) : (
                          <div className="divide-y divide-gray-50">
                            {transactions.map((txn: any) => (
                              <div key={txn._id} className="px-4 py-3 flex items-center gap-3">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${txn.type === "credit" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                                  {txn.type === "credit" ? "↓" : "↑"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-700 truncate">{txn.description}</p>
                                  <p className="text-[10px] text-gray-400">{new Date(txn.createdAt).toLocaleDateString("en-IN")}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className={`text-sm font-bold ${txn.type === "credit" ? "text-green-600" : "text-orange-600"}`}>
                                    {txn.type === "credit" ? "+" : "-"}₹{(txn.amount || 0).toLocaleString("en-IN")}
                                  </p>
                                  <p className={`text-[10px] font-semibold ${txn.status === "success" ? "text-green-500" : txn.status === "pending" ? "text-amber-500" : "text-red-500"}`}>
                                    {txn.status}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ══ BOOK TAB ══ */}
              {panelTab === "book" && (
                <>
                  {!bookService ? (
                    /* Step 1 — pick service */
                    <>
                      <p className="text-xs text-gray-500 px-1 font-semibold uppercase tracking-wide">Service Type chunein</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { key: "opd",     label: "OPD / Doctor",      icon: "🩺", href: "/opd-booking",        color: "border-blue-200 bg-blue-50 text-blue-700" },
                          { key: "lab",     label: "Lab Tests",          icon: "🔬", href: "/lab-tests",          color: "border-orange-200 bg-orange-50 text-orange-700" },
                          { key: "surgery", label: "Surgery Package",    icon: "💊", href: "/surgery-packages",   color: "border-rose-200 bg-rose-50 text-rose-700" },
                          { key: "ipd",     label: "IPD / Admission",    icon: "🏥", href: "/ipd-booking",        color: "border-purple-200 bg-purple-50 text-purple-700" },
                          { key: "tele",    label: "Teleconsultation",   icon: "📱", href: "/teleconsultation",   color: "border-teal-200 bg-teal-50 text-teal-700" },
                          { key: "ambulance", label: "Ambulance",        icon: "🚑", href: "/ambulance",          color: "border-red-200 bg-red-50 text-red-700" },
                        ].map(svc => (
                          <button key={svc.key} onClick={() => { setBookService(svc.key); setBookClient(null); }}
                            className={`rounded-2xl border-2 p-4 flex flex-col items-start gap-2 text-left transition hover:shadow-md ${svc.color}`}>
                            <span className="text-2xl">{svc.icon}</span>
                            <span className="text-sm font-bold">{svc.label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : !bookClient ? (
                    /* Step 2 — pick client */
                    <>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setBookService(null)} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
                        <p className="text-sm font-bold text-gray-700">Client chunein</p>
                      </div>
                      {familiesLoading ? (
                        <div className="flex justify-center py-10">
                          <div className="w-7 h-7 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
                        </div>
                      ) : families.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 py-10 text-center text-gray-400 text-sm">
                          Koi registered family nahi — pehle Families tab mein register karein
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {families.map((fam: any) => (
                            <button key={fam._id} onClick={() => setBookClient(fam)}
                              className="w-full bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 text-left hover:border-green-400 hover:shadow-sm transition">
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold flex-shrink-0">
                                {fam.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800 text-sm">{fam.name}</p>
                                <p className="text-xs text-gray-400">📱 {fam.mobile}{fam.age ? ` · ${fam.age}y` : ""}</p>
                              </div>
                              <span className="text-green-500 text-lg">›</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    /* Step 3 — confirm + go */
                    <>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setBookClient(null)} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
                        <p className="text-sm font-bold text-gray-700">Confirm karein</p>
                      </div>
                      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                          <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-800 font-bold">
                            {bookClient.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{bookClient.name}</p>
                            <p className="text-xs text-gray-500">{bookClient.mobile} · {bookClient.age}y · {bookClient.gender}</p>
                          </div>
                        </div>
                        {/* Pick which family member */}
                        {(bookClient.familyMembers || []).length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-2">Kaun sa member? (optional)</p>
                            <div className="space-y-1.5">
                              {[{ ...bookClient, relationship: "self (primary)" }, ...(bookClient.familyMembers || [])].map((m: any, i: number) => (
                                <label key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 cursor-pointer hover:border-green-300 text-sm">
                                  <input type="radio" name="bookMember" value={i} defaultChecked={i === 0} className="accent-green-600" />
                                  <span className="font-medium text-gray-700">{m.name}</span>
                                  <span className="text-gray-400 text-xs ml-auto">{m.age}y · {m.gender}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => {
                            const selected = (document.querySelector('input[name="bookMember"]:checked') as HTMLInputElement);
                            const idx = selected ? parseInt(selected.value) : 0;
                            const all = [bookClient, ...(bookClient.familyMembers || [])];
                            const m = all[idx] || bookClient;
                            const mobile = idx === 0 ? bookClient.mobile : (bookClient.mobile || "");
                            localStorage.setItem("coordinator_client_prefill", JSON.stringify({
                              name: m.name, mobile, age: m.age || bookClient.age, gender: m.gender || bookClient.gender
                            }));
                            localStorage.setItem("coordinator_auto_open", "1");
                            const hrefs: Record<string, string> = { opd: "/opd-booking", lab: "/lab-tests", surgery: "/surgery-packages", ipd: "/ipd-booking", tele: "/teleconsultation", ambulance: "/ambulance" };
                            window.location.href = hrefs[bookService] || "/opd-booking";
                          }}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-bold">
                          📅 Booking Page Par Jayen →
                        </button>
                        <p className="text-xs text-gray-400 text-center">Booking page par client ki details auto-fill ho jayengi</p>
                      </div>
                    </>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ImageCropper for coordinator registration photo */}
      {fRegCropper && (
        <ImageCropper
          onCropped={(blob, previewUrl) => { setFRegPhotoPreview(previewUrl); handleFRegCropped(blob); }}
          onClose={() => setFRegCropper(false)}
        />
      )}

      {/* ── Member Profile Modal ── */}
      {profileModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setProfileModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setProfileModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
            >×</button>

            {/* Photo + name */}
            <div className="flex flex-col items-center mb-5">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-teal-100 ring-4 ring-teal-100 mb-3">
                {profileModal.photo
                  ? <img src={profileModal.photo} alt={profileModal.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-teal-600 font-bold text-3xl">{profileModal.name?.[0]}</div>
                }
              </div>
              <h3 className="text-lg font-bold text-gray-800">{profileModal.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5 capitalize">
                {profileModal.isPrimary ? "Primary Member" : profileModal.relationship || "Family Member"}
              </p>
              {profileModal.isPrimary && user?.coordinatorId && (
                <a href="/coordinator-dashboard"
                  className="inline-flex items-center gap-1.5 bg-green-100 hover:bg-green-200 text-green-700 border border-green-300 text-xs font-bold px-3 py-1 rounded-full mt-1.5 transition">
                  🤝 Health Coordinator
                </a>
              )}
              <div className="bg-teal-50 border border-teal-200 rounded-lg px-3 py-1 mt-2">
                <p className="text-xs font-mono font-bold text-teal-700">{profileModal.memberId}</p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm mb-5">
              {[
                ["Age", profileModal.age ? `${profileModal.age} years` : "—"],
                ["Gender", profileModal.gender ? (profileModal.gender === "male" ? "Male" : "Female") : "—"],
                ["Height", profileModal.height ? `${profileModal.height} cm` : "—"],
                ["Weight", profileModal.weight ? `${profileModal.weight} kg` : "—"],
                ...(profileModal.alternateMobile ? [["Alt. Mobile", profileModal.alternateMobile]] : []),
                ...(profileModal.preExistingDiseases?.length ? [["Conditions", profileModal.preExistingDiseases.join(", ")]] : []),
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-gray-800 font-medium text-right">{value}</span>
                </div>
              ))}
            </div>

            {/* Switch active button */}
            <button
              onClick={() => {
                localStorage.setItem("activeMemberId", profileModal.memberId);
                setActiveMemberId(profileModal.memberId);
                setProfileModal(null);
                showToast(`✅ ${profileModal.name} active profile set ho gayi`, true);
              }}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-semibold transition text-sm"
            >
              ✓ Isko Active Profile Set Karein
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
