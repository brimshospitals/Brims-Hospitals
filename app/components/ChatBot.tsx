"use client";
import { useEffect, useRef, useState } from "react";
import { BIHAR_DISTRICTS } from "../../lib/biharDistricts";

type ChatMsg = { role: "user" | "assistant"; content: string };

type ChatView = "chat" | "booking" | "support";

const SUPPORT_CATEGORIES = [
  { key: "booking",         icon: "📋", label: "Booking Issue" },
  { key: "payment",         icon: "💳", label: "Payment / Refund" },
  { key: "cancellation",    icon: "❌", label: "Cancellation" },
  { key: "service",         icon: "🏥", label: "Service Quality" },
  { key: "home_collection", icon: "🏍️", label: "Home Collection" },
  { key: "report",          icon: "📄", label: "Report / Prescription" },
  { key: "account",         icon: "👤", label: "Account / Wallet" },
  { key: "other",           icon: "💬", label: "Kuch Aur" },
];

type BookingStep =
  | "idle" | "loading_session" | "patient_select"
  | "mobile" | "name" | "symptoms"
  | "loading_doctors" | "doctors" | "datetime"
  | "confirm" | "success";

interface Doctor {
  _id: string; name: string; department: string; speciality?: string;
  opdFee: number; offerFee?: number; photo?: string;
  hospitalName?: string; experience?: number;
}

interface BookingState {
  step:           BookingStep;
  userId:         string;   // set if user is logged in
  mobile:         string;
  name:           string;
  age:            string;
  gender:         string;
  district:       string;
  symptoms:       string;
  department:     string;
  doctors:        Doctor[];
  selectedDoctor: Doctor | null;
  date:           string;
  slot:           string;
  bookingId:      string;
  error:          string;
}

const DEFAULT_BOOKING: BookingState = {
  step: "idle", userId: "", mobile: "", name: "", age: "", gender: "",
  district: "", symptoms: "", department: "", doctors: [],
  selectedDoctor: null, date: "", slot: "", bookingId: "", error: "",
};

// BIHAR_DISTRICTS imported from lib/biharDistricts

// Department-wise symptom library
const DEPT_SYMPTOMS: Record<string, { icon: string; label: string; symptoms: string[] }> = {
  general: {
    icon: "🩺", label: "General",
    symptoms: ["Fever / Bukhar","Cough / Khansi","Cold / Nazla","Headache / Sir Dard",
      "Body Pain / Badan Dard","Weakness / Kamzori","Sore Throat / Gale Ka Dard",
      "Loss of Appetite","Fatigue / Thakan","Typhoid","Dengue","Malaria",
      "Viral Infection","Anemia / Khoon Ki Kami","Vitamin Deficiency"],
  },
  heart: {
    icon: "❤️", label: "Heart",
    symptoms: ["Chest Pain / Seene Ka Dard","Breathlessness / Saans Phoolna",
      "Heart Palpitation / Dhadkan","High BP","Low BP","Swollen Legs / Pair Soojhna",
      "Irregular Heartbeat","Dizziness / Chakkar","Cholesterol Problem","ECG Required"],
  },
  bones: {
    icon: "🦴", label: "Bones",
    symptoms: ["Back Pain / Kamar Dard","Knee Pain / Ghutna Dard","Joint Pain / Jodh Dard",
      "Neck Pain / Gardan Dard","Shoulder Pain / Kandha Dard","Fracture / Haddi Tootna",
      "Slip Disc","Arthritis / Gathiya","Spondylitis","Sports Injury","Hip Pain",
      "Ankle / Wrist Pain","Muscle Pain / Sprain"],
  },
  stomach: {
    icon: "🫃", label: "Stomach",
    symptoms: ["Stomach Pain / Pet Dard","Acidity / Jalan","Vomiting / Ulti",
      "Diarrhea / Dast / Loose Motion","Constipation / Kabz","Gas / Bloating / Afara",
      "Jaundice / Peeliya","Piles / Bawasir","Liver Problem","Ulcer","Gallstone / Pathri",
      "Indigestion / Burping","Blood in Stool"],
  },
  women: {
    icon: "🌸", label: "Women",
    symptoms: ["Irregular Periods","Heavy Bleeding / Zyada Bleeding","Menstrual Pain",
      "White Discharge / Safed Pani","Pregnancy Check","PCOD / PCOS","Uterus Problem",
      "Ovary Cyst / Fibroid","Infertility / Baccha Nahi Hona","Menopause",
      "Family Planning","Cervical Problem"],
  },
  children: {
    icon: "👶", label: "Children",
    symptoms: ["Child Fever / Baby Bukhar","Child Cough","Child Vomiting",
      "Child Diarrhea / Loose Motion","Poor Growth / Height Weight","Vaccination",
      "Child Weakness","Newborn Care","Child Rash / Skin","Malnutrition",
      "Child Allergy","Child Breathing Problem"],
  },
  brain: {
    icon: "🧠", label: "Brain",
    symptoms: ["Migraine / Severe Headache","Seizures / Fits / Mirgi",
      "Vertigo / Chakkar Aana","Memory Loss / Yaadash","Numbness / Sunapan",
      "Paralysis / Lakwa","Stroke","Parkinson / Tremor","Nerve Pain / Neuropathy",
      "Unconscious / Behoshi","Spinal Problem","Brain Tumor"],
  },
  ent: {
    icon: "👂", label: "ENT",
    symptoms: ["Ear Pain / Kaan Dard","Hearing Loss / Sunai Nahi Deta","Nose Blockage / Naak Band",
      "Sinus / Sinusitis","Tonsils / Gale Mein Ganth","Sore Throat / Gala Dard",
      "Voice Change / Awaaz Baiṭhna","Snoring / Kharrate","Ear Infection / Ear Wax",
      "Nasal Polyp","Ear Ringing / Tinnitus"],
  },
  skin: {
    icon: "🧴", label: "Skin",
    symptoms: ["Skin Rash / Daane","Itching / Khujli","Acne / Pimples",
      "Eczema","Psoriasis / Safed Daag / Vitiligo","Hair Fall / Baal Jhadna",
      "Fungal Infection / Daad","Allergy / Hives","Wart / Mole","Dandruff",
      "Dry / Oily Skin","Dark Spots / Pigmentation","Nail Problem / Nakhun","Scabies / Khaj"],
  },
  eyes: {
    icon: "👁️", label: "Eyes",
    symptoms: ["Eye Pain / Aankh Dard","Blurred Vision / Dhundla Dikhna",
      "Red Eyes / Lal Aankh","Cataract / Motia","Watery Eyes",
      "Eye Infection / Conjunctivitis","Specs / Chashma Check","Night Blindness",
      "Glaucoma","Eye Allergy","Burning Eyes / Aankh Mein Jalan","Double Vision / Squint"],
  },
  kidney: {
    icon: "🫘", label: "Kidney",
    symptoms: ["Burning Urination / Peshab Mein Jalan","Kidney Stone / Pathri",
      "Frequent Urination / Baar Baar Peshab","Blood in Urine","Prostate Problem",
      "UTI / Urinary Infection","Kidney Pain","Kidney Failure","Bladder Problem",
      "Male Infertility","Erectile Dysfunction"],
  },
  lungs: {
    icon: "🫁", label: "Lungs",
    symptoms: ["Breathing Difficulty / Saans Lena Mushkil","Asthma / Dama",
      "TB / Tuberculosis","Chronic Cough / Purani Khansi","Wheezing",
      "Chest Tightness","Pneumonia / Lung Infection","Bronchitis","COPD",
      "Low Oxygen / SpO2 Kam","Sleep Apnea"],
  },
  diabetes: {
    icon: "🩸", label: "Diabetes",
    symptoms: ["High Blood Sugar / Sugar Zyada","Low Blood Sugar","Diabetes Check / HbA1c",
      "Excessive Thirst / Zyada Pyaas","Frequent Urination","Wound Not Healing / Ghao",
      "Weight Loss Sudden","Diabetic Foot","Numbness in Feet","Eye Problem Due to Diabetes"],
  },
  mental: {
    icon: "🧘", label: "Mental",
    symptoms: ["Anxiety / Ghabrahaat","Depression / Udaasi","Sleep Problem / Insomnia",
      "Stress / Tanav","Mood Swings","Panic Attack","Phobia","OCD",
      "Anger Issues","Addiction / Nasha","Memory Problem","ADHD / Autism"],
  },
};

const SLOTS = [
  "8:00 AM","9:00 AM","10:00 AM","11:00 AM",
  "12:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM",
];

const SUGGESTED_BOOKING = [
  "📋 OPD appointment kaise book karein?",
  "🧪 Lab test ghar par kaise hoga?",
  "🔬 Surgery package ka price kya hai?",
  "💳 Brims Health Card kaise milega?",
];

const SUGGESTED_HEALTH = [
  "🌡️ Bukhar mein kya karna chahiye?",
  "❤️ BP high ho to kya karein?",
  "🩸 Diabetes control kaise karein?",
  "🤰 Pregnancy mein kya dhyan rakhein?",
];

const SUGGESTED_PLATFORM = [
  "💳 Brims Health Card kya hai aur iske fayde?",
  "👨‍👩‍👧‍👦 Family Card mein kitne members ho sakte hain?",
  "💰 Brims Wallet mein paise kaise add karein?",
  "🏥 Nearest hospital kaise dhundein?",
];

function linkify(text: string) {
  return text.replace(
    /(\/(opd-booking|lab-tests|surgery-packages|teleconsultation|ipd-booking|ambulance|dashboard|health-card|wallet)[^\s]*)/g,
    (m) => `<a href="${m}" class="text-teal-600 font-semibold underline hover:text-teal-700">${m}</a>`
  );
}

const today = () => new Date().toISOString().split("T")[0];

function StepBar({ step, loggedIn }: { step: BookingStep; loggedIn: boolean }) {
  const steps = loggedIn
    ? ["patient_select","symptoms","doctors","datetime","confirm"] as BookingStep[]
    : ["mobile","name","symptoms","doctors","datetime","confirm"] as BookingStep[];
  const icons: Partial<Record<BookingStep, string>> = {
    patient_select: "👤", mobile: "📱", name: "📋",
    symptoms: "🤒", doctors: "🩺", datetime: "📅", confirm: "✓",
  };
  const resolvedStep = step === "loading_doctors" ? "doctors" : step;
  const idx = steps.indexOf(resolvedStep);
  if (idx < 0) return null;
  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-teal-50 border-b border-teal-100">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1 flex-1">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
            i < idx ? "bg-teal-500 text-white"
            : i === idx ? "bg-teal-600 text-white ring-2 ring-teal-200"
            : "bg-gray-100 text-gray-300"
          }`}>
            {i < idx ? "✓" : icons[s] || String(i + 1)}
          </div>
          {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${i < idx ? "bg-teal-400" : "bg-gray-200"}`} />}
        </div>
      ))}
    </div>
  );
}

export default function ChatBot() {
  const [open,        setOpen]        = useState(false);
  const [view,        setView]        = useState<ChatView>("chat");
  const [messages,    setMessages]    = useState<ChatMsg[]>([]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [unread,      setUnread]      = useState(0);
  const [booking,     setBooking]     = useState<BookingState>({ ...DEFAULT_BOOKING });
  const [bLoading,    setBLoading]    = useState(false);
  const [deptTab,     setDeptTab]     = useState("general");
  const [sessionUser, setSessionUser] = useState<any>(null);    // logged-in user profile
  const [newPatient,  setNewPatient]  = useState(false);        // "New Patient" toggle in patient_select

  // Support flow state
  const [suppStep,       setSuppStep]       = useState<"category" | "details" | "done">("category");
  const [suppCategory,   setSuppCategory]   = useState("");
  const [suppSubject,    setSuppSubject]     = useState("");
  const [suppDesc,       setSuppDesc]       = useState("");
  const [suppTicketId,   setSuppTicketId]   = useState("");
  const [suppLoading,    setSuppLoading]    = useState(false);
  const [suppLoggedIn,   setSuppLoggedIn]   = useState<boolean | null>(null);
  const [suppError,      setSuppError]      = useState("");

  const deptTabRef = useRef<HTMLDivElement>(null);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, open, booking.step]);
  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 100); setUnread(0); }
  }, [open]);

  // ── Chat (AI) ───────────────────────────────────────────────────────────────
  async function sendChat(text?: string) {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput("");
    const updated: ChatMsg[] = [...messages, { role: "user", content }];
    setMessages(updated);
    setLoading(true);
    try {
      const res  = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: updated }) });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.success ? data.reply : "Kuch gadbad ho gayi. Dobara try karein." }]);
      if (!open) setUnread(n => n + 1);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Network error. Internet check karein." }]);
    } finally { setLoading(false); }
  }

  // ── Booking flow ─────────────────────────────────────────────────────────────
  async function startBooking() {
    setView("booking");
    setNewPatient(false);
    setBooking({ ...DEFAULT_BOOKING, step: "loading_session" as BookingStep });
    setBLoading(true);
    try {
      // Check if user is logged in
      const meRes  = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.success && meData.loggedIn) {
        // Fetch full profile (family members + district)
        const profRes  = await fetch("/api/profile");
        const profData = await profRes.json();
        const user     = profData.user || profData;
        setSessionUser(user);
        setBooking({ ...DEFAULT_BOOKING, step: "patient_select",
          district: user.address?.district || "",
          userId:   meData.userId || "",
        });
      } else {
        setSessionUser(null);
        setBooking({ ...DEFAULT_BOOKING, step: "mobile" });
      }
    } catch {
      setSessionUser(null);
      setBooking({ ...DEFAULT_BOOKING, step: "mobile" });
    } finally { setBLoading(false); }
  }

  function cancelBooking() {
    setBooking({ ...DEFAULT_BOOKING });
    setSessionUser(null);
    setNewPatient(false);
    setView("chat");
  }

  async function startSupport() {
    setView("support");
    setSuppStep("category");
    setSuppCategory(""); setSuppSubject(""); setSuppDesc("");
    setSuppTicketId(""); setSuppError(""); setSuppLoggedIn(null);
    try {
      const meRes = await fetch("/api/auth/me");
      const me    = await meRes.json();
      setSuppLoggedIn(!!(me.success && me.loggedIn));
    } catch {
      setSuppLoggedIn(false);
    }
  }

  async function submitSupport() {
    if (!suppCategory)       { setSuppError("Category select karein"); return; }
    if (!suppSubject.trim()) { setSuppError("Subject likhein"); return; }
    if (!suppDesc.trim())    { setSuppError("Problem describe karein"); return; }
    setSuppLoading(true); setSuppError("");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category:    suppCategory,
          subject:     suppSubject.trim(),
          description: suppDesc.trim(),
        }),
      });
      const d = await res.json();
      if (d.success) {
        setSuppTicketId(d.ticketId);
        setSuppStep("done");
      } else {
        setSuppError(d.message || "Error hua. Dobara try karein.");
      }
    } catch {
      setSuppError("Network error. Internet check karein.");
    } finally {
      setSuppLoading(false);
    }
  }

  async function nextStep() {
    const b = booking;

    if (b.step === "mobile") {
      if (!/^\d{10}$/.test(b.mobile)) { setBooking(p => ({ ...p, error: "10 digit ka valid mobile number dein" })); return; }
      setBooking(p => ({ ...p, step: "name", error: "" }));
    }

    else if (b.step === "name") {
      if (!b.name.trim())   { setBooking(p => ({ ...p, error: "Apna naam likhein" })); return; }
      if (!b.age || isNaN(Number(b.age)) || Number(b.age) < 1) { setBooking(p => ({ ...p, error: "Sahi age likhein" })); return; }
      if (!b.gender)        { setBooking(p => ({ ...p, error: "Gender select karein" })); return; }
      if (!b.district)      { setBooking(p => ({ ...p, error: "Apna district select karein" })); return; }
      setBooking(p => ({ ...p, step: "symptoms", error: "" }));
    }

    else if (b.step === "symptoms") {
      if (!b.symptoms.trim()) { setBooking(p => ({ ...p, error: "Symptoms / takleef zaroor batayein" })); return; }
      setBooking(p => ({ ...p, step: "loading_doctors", error: "" }));
      setBLoading(true);
      try {
        const res  = await fetch("/api/chat/book", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "suggest_doctors", symptoms: b.symptoms, district: b.district }) });
        const data = await res.json();
        if (data.success) {
          setBooking(p => ({ ...p, step: "doctors", department: data.department, doctors: data.doctors, error: "" }));
        } else {
          setBooking(p => ({ ...p, step: "symptoms", error: data.message || "Error. Dobara try karein." }));
        }
      } catch {
        setBooking(p => ({ ...p, step: "symptoms", error: "Network error." }));
      } finally { setBLoading(false); }
    }

    else if (b.step === "doctors") {
      if (!b.selectedDoctor) { setBooking(p => ({ ...p, error: "Doctor select karein" })); return; }
      setBooking(p => ({ ...p, step: "datetime", error: "" }));
    }

    else if (b.step === "datetime") {
      if (!b.date) { setBooking(p => ({ ...p, error: "Date select karein" })); return; }
      if (!b.slot) { setBooking(p => ({ ...p, error: "Time slot select karein" })); return; }
      setBooking(p => ({ ...p, step: "confirm", error: "" }));
    }

    else if (b.step === "confirm") {
      setBLoading(true);
      try {
        const res  = await fetch("/api/chat/book", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create_booking",
            mobile:   b.mobile   || sessionUser?.mobile || "",
            name:     b.name,
            age:      Number(b.age)   || sessionUser?.age    || 18,
            gender:   b.gender        || sessionUser?.gender || "male",
            district: b.district      || sessionUser?.address?.district || "",
            userId:   b.userId        || sessionUser?.userId || "",
            symptoms: b.symptoms,
            doctorId: b.selectedDoctor?._id, doctorName: b.selectedDoctor?.name,
            date: b.date, slot: b.slot,
            amount: b.selectedDoctor?.offerFee || b.selectedDoctor?.opdFee || 0,
            isLoggedIn: !!sessionUser,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setBooking(p => ({ ...p, step: "success", bookingId: data.bookingId, error: "" }));
        } else {
          setBooking(p => ({ ...p, error: data.message || "Booking failed. Dobara try karein." }));
        }
      } catch {
        setBooking(p => ({ ...p, error: "Network error. Dobara try karein." }));
      } finally { setBLoading(false); }
    }
  }

  const b = booking;

  return (
    <>
      {/* ── Floating Button ── */}
      <button onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-4 z-[90] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{ background: "linear-gradient(135deg, #0d9488, #0891b2)" }}
        aria-label="Chat">
        {open
          ? <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
          : <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
        }
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unread}</span>
        )}
      </button>

      {/* ── Chat Window ── */}
      {open && (
        <div className="fixed bottom-24 right-4 z-[90] w-[340px] sm:w-[390px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ maxHeight: "calc(100vh - 120px)" }}>

          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, #0d9488, #0891b2)" }}
            className="px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🏥</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">Brims Assistant</p>
              <p className="text-teal-200 text-xs">Booking · Health · Platform Help · 24×7</p>
            </div>
            <div className="flex items-center gap-2">
              {(view === "booking" || view === "support") && (
                <button onClick={() => { if (view === "booking") cancelBooking(); else setView("chat"); }}
                  className="text-teal-200 hover:text-white text-xs border border-teal-400 px-2 py-1 rounded-lg transition">
                  ← Chat
                </button>
              )}
              {view === "chat" && (
                <button onClick={startBooking}
                  className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl transition border border-white/30">
                  📋 Book
                </button>
              )}
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-teal-200 text-xs">Online</span>
              </div>
            </div>
          </div>

          {/* ════════════════ BOOKING WIZARD ════════════════ */}
          {view === "booking" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {b.step !== "success" && b.step !== "loading_session" && (
                <StepBar step={b.step} loggedIn={!!sessionUser} />
              )}
              <div className="flex-1 overflow-y-auto">

                {/* ── Step: Loading session ── */}
                {b.step === "loading_session" && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-teal-600 font-medium text-sm">Checking login status...</p>
                  </div>
                )}

                {/* ── Step: Patient Selector (logged-in) ── */}
                {b.step === "patient_select" && sessionUser && (
                  <div className="p-4 space-y-3">
                    {/* Welcome */}
                    <div className="bg-teal-50 rounded-2xl p-3 flex items-center gap-3 border border-teal-100">
                      <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {sessionUser.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="text-xs text-teal-500 font-semibold">Welcome back!</p>
                        <p className="font-bold text-teal-800">{sessionUser.name}</p>
                        <p className="text-[11px] text-teal-500">📍 {sessionUser.address?.district || "Bihar"} · {sessionUser.mobile}</p>
                      </div>
                      <span className="ml-auto text-green-500 text-lg">✓</span>
                    </div>

                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kis ke liye appointment chahiye?</p>

                    {/* Primary member */}
                    {[
                      { name: sessionUser.name, age: sessionUser.age, gender: sessionUser.gender, label: "You (Primary)", self: true },
                      ...(sessionUser.familyMembers || []).map((m: any) => ({ name: m.name, age: m.age, gender: m.gender, label: m.relationship || "Family Member", self: false })),
                    ].map((member, i) => (
                      <button key={i}
                        onClick={() => {
                          setNewPatient(false);
                          setBooking(p => ({
                            ...p,
                            name: member.name, age: String(member.age || ""),
                            gender: member.gender || "", error: "",
                          }));
                        }}
                        className={`w-full text-left flex items-center gap-3 p-3 rounded-2xl border-2 transition ${
                          b.name === member.name && !newPatient
                            ? "border-teal-500 bg-teal-50"
                            : "border-gray-200 hover:border-teal-300 bg-white"
                        }`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                          b.name === member.name && !newPatient ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-500"
                        }`}>
                          {member.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 text-sm">{member.name}</p>
                          <p className="text-xs text-gray-400">{member.age}yr · {member.gender === "male" ? "♂ Male" : "♀ Female"} · {member.label}</p>
                        </div>
                        {b.name === member.name && !newPatient && <span className="text-teal-500 font-bold">✓</span>}
                      </button>
                    ))}

                    {/* New Patient option */}
                    <button onClick={() => { setNewPatient(true); setBooking(p => ({ ...p, name: "", age: "", gender: "", error: "" })); }}
                      className={`w-full text-left flex items-center gap-3 p-3 rounded-2xl border-2 transition ${
                        newPatient ? "border-blue-400 bg-blue-50" : "border-dashed border-gray-300 hover:border-blue-300 bg-white"
                      }`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${newPatient ? "bg-blue-500" : "bg-gray-100"}`}>
                        {newPatient ? <span className="text-white font-bold text-sm">+</span> : "👤"}
                      </div>
                      <div>
                        <p className="font-bold text-gray-700 text-sm">Naya Patient</p>
                        <p className="text-xs text-gray-400">Family ke bahar kisi ke liye</p>
                      </div>
                    </button>

                    {/* New patient mini-form */}
                    {newPatient && (
                      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 space-y-2">
                        <input type="text" value={b.name} placeholder="Poora Naam *"
                          onChange={e => setBooking(p => ({ ...p, name: e.target.value, error: "" }))}
                          className="w-full border border-blue-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                        />
                        <div className="flex gap-2">
                          <input type="number" value={b.age} placeholder="Age *" min="1" max="120"
                            onChange={e => setBooking(p => ({ ...p, age: e.target.value, error: "" }))}
                            className="flex-1 border border-blue-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                          />
                          <div className="flex gap-1">
                            {["male","female"].map(g => (
                              <button key={g} onClick={() => setBooking(p => ({ ...p, gender: g, error: "" }))}
                                className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition ${
                                  b.gender === g ? (g === "male" ? "border-blue-500 bg-blue-500 text-white" : "border-pink-500 bg-pink-500 text-white") : "border-gray-200 bg-white text-gray-500"
                                }`}>
                                {g === "male" ? "♂" : "♀"}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {b.error && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">⚠️ {b.error}</p>}

                    <button onClick={() => {
                      if (!b.name.trim()) { setBooking(p => ({ ...p, error: "Patient select karein ya naam likhein" })); return; }
                      if (newPatient && (!b.age || !b.gender)) { setBooking(p => ({ ...p, error: "Age aur gender fill karein" })); return; }
                      setBooking(p => ({ ...p, step: "symptoms", error: "" }));
                    }} className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold transition">
                      Symptoms Batayein →
                    </button>
                  </div>
                )}

                {/* ── Step: Mobile ── */}
                {b.step === "mobile" && (
                  <div className="p-4 space-y-4">
                    <div className="bg-teal-50 rounded-2xl p-4 text-center">
                      <span className="text-3xl">📱</span>
                      <p className="font-bold text-teal-800 mt-2">Appointment Book Karein</p>
                      <p className="text-teal-600 text-xs mt-1">Pehle aapka mobile number dein</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Mobile Number</label>
                      <input type="tel" inputMode="numeric" maxLength={10}
                        value={b.mobile}
                        onChange={e => setBooking(p => ({ ...p, mobile: e.target.value.replace(/\D/g,""), error: "" }))}
                        onKeyDown={e => e.key === "Enter" && nextStep()}
                        placeholder="10 digit mobile number"
                        className={`w-full border-2 rounded-xl px-3 py-3 text-lg font-bold text-center tracking-widest focus:outline-none focus:ring-2 transition ${b.error ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-teal-300 focus:border-teal-400"}`}
                      />
                      {b.error && <p className="text-xs text-red-500 mt-1">⚠️ {b.error}</p>}
                    </div>
                    <button onClick={nextStep}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold transition">
                      Aage Badhein →
                    </button>
                  </div>
                )}

                {/* ── Step: Name + Age + Gender + District ── */}
                {b.step === "name" && (
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 bg-teal-50 rounded-xl p-3">
                      <span className="text-teal-500">📱</span>
                      <p className="font-bold text-teal-700 text-sm">{b.mobile}</p>
                      <span className="ml-auto text-green-500 font-bold text-sm">✓ Verified</span>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Poora Naam <span className="text-red-500">*</span></label>
                      <input type="text" value={b.name} autoFocus
                        onChange={e => setBooking(p => ({ ...p, name: e.target.value, error: "" }))}
                        placeholder="Jaise: Ramesh Kumar"
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400"
                      />
                    </div>

                    {/* Age + Gender side by side */}
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-600 mb-1">Age (Umar) <span className="text-red-500">*</span></label>
                        <input type="number" min="1" max="120" value={b.age}
                          onChange={e => setBooking(p => ({ ...p, age: e.target.value, error: "" }))}
                          placeholder="e.g. 35"
                          className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-600 mb-1">Gender <span className="text-red-500">*</span></label>
                        <div className="flex gap-1.5 mt-1">
                          {["male","female"].map(g => (
                            <button key={g} onClick={() => setBooking(p => ({ ...p, gender: g, error: "" }))}
                              className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition capitalize ${
                                b.gender === g
                                  ? g === "male" ? "border-blue-500 bg-blue-500 text-white" : "border-pink-500 bg-pink-500 text-white"
                                  : "border-gray-200 text-gray-500 hover:border-gray-300"
                              }`}>
                              {g === "male" ? "♂ Male" : "♀ Female"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* District */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">📍 District (Bihar) <span className="text-red-500">*</span></label>
                      <select value={b.district}
                        onChange={e => setBooking(p => ({ ...p, district: e.target.value, error: "" }))}
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 bg-white">
                        <option value="">-- District Select Karein --</option>
                        {BIHAR_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>

                    {b.error && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">⚠️ {b.error}</p>}

                    <button onClick={nextStep}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold transition">
                      Aage Badhein →
                    </button>
                    <button onClick={() => setBooking(p => ({ ...p, step: "mobile", error: "" }))}
                      className="w-full border border-gray-200 text-gray-500 py-2 rounded-xl text-xs font-medium hover:bg-gray-50 transition">
                      ← Wapas
                    </button>
                  </div>
                )}

                {/* ── Step: Symptoms ── */}
                {b.step === "symptoms" && (
                  <div className="flex flex-col h-full">
                    {/* Patient info bar */}
                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 border-b border-gray-100 flex-shrink-0 flex-wrap">
                      <span className="text-gray-500 text-xs font-semibold">{b.name}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-gray-400 text-xs">{b.age}y {b.gender === "male" ? "♂" : "♀"}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-gray-400 text-xs">📍 {b.district}</span>
                    </div>

                    {/* Symptoms textarea */}
                    <div className="px-4 pt-3 flex-shrink-0">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Kya Takleef Hai? <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <textarea value={b.symptoms}
                          onChange={e => setBooking(p => ({ ...p, symptoms: e.target.value, error: "" }))}
                          placeholder="Apne symptoms likhein ya neeche se choose karein..."
                          rows={2}
                          className={`w-full border-2 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 transition ${b.error ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-teal-300 focus:border-teal-400"}`}
                        />
                        {b.symptoms && (
                          <button onClick={() => setBooking(p => ({ ...p, symptoms: "", error: "" }))}
                            className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 text-xs">✕</button>
                        )}
                      </div>
                      {b.error && <p className="text-xs text-red-500 mt-1">⚠️ {b.error}</p>}
                    </div>

                    {/* Department tabs */}
                    <div className="px-4 pt-2 flex-shrink-0">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Department Choose Karein:</p>
                      <div ref={deptTabRef} className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                        {Object.entries(DEPT_SYMPTOMS).map(([key, d]) => (
                          <button key={key} onClick={() => setDeptTab(key)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition flex-shrink-0 border ${
                              deptTab === key
                                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                                : "bg-white text-gray-500 border-gray-200 hover:border-teal-300 hover:text-teal-600"
                            }`}>
                            <span>{d.icon}</span>{d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Symptom chips for selected dept */}
                    <div className="flex-1 overflow-y-auto px-4 pt-2 pb-3">
                      <p className="text-[10px] text-teal-500 font-semibold mb-2">
                        {DEPT_SYMPTOMS[deptTab].icon} {DEPT_SYMPTOMS[deptTab].label} — tap to add:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {DEPT_SYMPTOMS[deptTab].symptoms.map(chip => {
                          const added = b.symptoms.includes(chip);
                          return (
                            <button key={chip}
                              onClick={() => {
                                if (added) {
                                  setBooking(p => ({ ...p, symptoms: p.symptoms.replace(", " + chip, "").replace(chip + ", ", "").replace(chip, "").trim().replace(/^,|,$/g,"").trim(), error: "" }));
                                } else {
                                  setBooking(p => ({ ...p, symptoms: p.symptoms ? p.symptoms + ", " + chip : chip, error: "" }));
                                }
                              }}
                              className={`text-xs px-2.5 py-1.5 rounded-xl transition font-medium border ${
                                added
                                  ? "bg-teal-600 text-white border-teal-600"
                                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700"
                              }`}>
                              {added ? "✓ " : ""}{chip}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom buttons */}
                    <div className="px-4 pb-4 pt-2 space-y-2 flex-shrink-0 border-t border-gray-100 bg-white">
                      <button onClick={nextStep}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold transition">
                        Doctor Dhundein →
                      </button>
                      <button onClick={() => setBooking(p => ({ ...p, step: "name", error: "" }))}
                        className="w-full border border-gray-200 text-gray-500 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                        ← Wapas
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Step: Loading doctors ── */}
                {b.step === "loading_doctors" && (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-teal-600 font-semibold text-sm">Aapke liye best doctors dhundh rahe hain...</p>
                    <p className="text-gray-400 text-xs">Symptoms: {b.symptoms.substring(0, 50)}...</p>
                  </div>
                )}

                {/* ── Step: Doctors list ── */}
                {b.step === "doctors" && (
                  <div className="p-4 space-y-3">
                    <div className="text-center">
                      <span className="text-xl">🩺</span>
                      <p className="font-bold text-gray-800 mt-1">Suggested: <span className="text-teal-600">{b.department}</span></p>
                      <p className="text-xs text-gray-400">Doctor choose karein</p>
                    </div>

                    {b.doctors.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <p className="text-3xl mb-2">😔</p>
                        <p className="text-sm">Abhi koi doctor available nahi hai.</p>
                        <p className="text-xs mt-1">Kripya 9955564596 pe call karein.</p>
                      </div>
                    )}

                    {b.doctors.map(doc => (
                      <button key={doc._id} onClick={() => setBooking(p => ({ ...p, selectedDoctor: doc, error: "" }))}
                        className={`w-full text-left rounded-2xl border-2 p-3 transition ${
                          b.selectedDoctor?._id === doc._id
                            ? "border-teal-500 bg-teal-50 ring-2 ring-teal-100"
                            : "border-gray-200 hover:border-teal-300 bg-white"
                        }`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0 ${
                            b.selectedDoctor?._id === doc._id ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-400"
                          }`}>
                            {doc.photo
                              ? <img src={doc.photo} alt={doc.name} className="w-full h-full rounded-xl object-cover" />
                              : "👨‍⚕️"
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-800 text-sm">Dr. {doc.name}</p>
                            <p className="text-xs text-teal-600">{doc.department}{doc.speciality ? ` · ${doc.speciality}` : ""}</p>
                            {doc.hospitalName && <p className="text-[11px] text-gray-400 mt-0.5">🏥 {doc.hospitalName}</p>}
                            {doc.experience && <p className="text-[11px] text-gray-400">{doc.experience} yrs experience</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            {doc.offerFee && doc.offerFee < doc.opdFee
                              ? <>
                                  <p className="font-black text-teal-600">₹{doc.offerFee}</p>
                                  <p className="text-[10px] text-gray-400 line-through">₹{doc.opdFee}</p>
                                </>
                              : <p className="font-black text-teal-600">₹{doc.opdFee}</p>
                            }
                          </div>
                        </div>
                        {b.selectedDoctor?._id === doc._id && (
                          <div className="mt-2 flex items-center gap-1 text-teal-600 text-xs font-bold">
                            <span>✓</span><span>Selected</span>
                          </div>
                        )}
                      </button>
                    ))}

                    {b.error && <p className="text-xs text-red-500">⚠️ {b.error}</p>}
                    <button onClick={nextStep} disabled={!b.selectedDoctor}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold transition disabled:opacity-40">
                      Date &amp; Slot Chunein →
                    </button>
                    <button onClick={() => setBooking(p => ({ ...p, step: "symptoms", selectedDoctor: null, error: "" }))}
                      className="w-full border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                      ← Wapas
                    </button>
                  </div>
                )}

                {/* ── Step: Date + Slot ── */}
                {b.step === "datetime" && (
                  <div className="p-4 space-y-4">
                    {b.selectedDoctor && (
                      <div className="flex items-center gap-3 bg-teal-50 rounded-xl p-3 border border-teal-100">
                        <span className="text-2xl">👨‍⚕️</span>
                        <div>
                          <p className="font-bold text-teal-800 text-sm">Dr. {b.selectedDoctor.name}</p>
                          <p className="text-xs text-teal-600">{b.selectedDoctor.department}</p>
                        </div>
                        <p className="ml-auto font-black text-teal-700">₹{b.selectedDoctor.offerFee || b.selectedDoctor.opdFee}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Appointment Date <span className="text-red-500">*</span></label>
                      <input type="date" value={b.date} min={today()}
                        onChange={e => setBooking(p => ({ ...p, date: e.target.value, error: "" }))}
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Time Slot <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-3 gap-2">
                        {SLOTS.map(slot => (
                          <button key={slot} onClick={() => setBooking(p => ({ ...p, slot, error: "" }))}
                            className={`py-2 rounded-xl text-xs font-bold border-2 transition ${
                              b.slot === slot
                                ? "border-teal-500 bg-teal-500 text-white"
                                : "border-gray-200 text-gray-600 hover:border-teal-300 hover:bg-teal-50"
                            }`}>
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                    {b.error && <p className="text-xs text-red-500">⚠️ {b.error}</p>}
                    <button onClick={nextStep}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold transition">
                      Summary Dekhe →
                    </button>
                    <button onClick={() => setBooking(p => ({ ...p, step: "doctors", error: "" }))}
                      className="w-full border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                      ← Wapas
                    </button>
                  </div>
                )}

                {/* ── Step: Confirm ── */}
                {b.step === "confirm" && (
                  <div className="p-4 space-y-3">
                    <div className="text-center">
                      <span className="text-3xl">📋</span>
                      <p className="font-bold text-gray-800 mt-1">Booking Summary</p>
                      <p className="text-xs text-gray-400">Confirm karne se pehle check karein</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl divide-y divide-gray-100 border border-gray-200 overflow-hidden">
                      {[
                        ["👤 Patient",  `${b.name} (${b.age}yr, ${b.gender === "male" ? "Male" : "Female"})`],
                        ["📱 Mobile",   b.mobile],
                        ["📍 District", b.district],
                        ["🤒 Symptoms", b.symptoms.substring(0, 60) + (b.symptoms.length > 60 ? "..." : "")],
                        ["👨‍⚕️ Doctor",  `Dr. ${b.selectedDoctor?.name} (${b.selectedDoctor?.department})`],
                        ["🏥 Hospital", b.selectedDoctor?.hospitalName || "Brims Hospitals"],
                        ["📅 Date",     new Date(b.date).toLocaleDateString("en-IN", { weekday:"short", day:"2-digit", month:"short", year:"numeric" })],
                        ["🕐 Slot",     b.slot],
                        ["💰 Fee",      `₹${b.selectedDoctor?.offerFee || b.selectedDoctor?.opdFee || 0} (Counter pe pay karein)`],
                      ].map(([label, val]) => (
                        <div key={label as string} className="flex items-start gap-2 px-3 py-2.5">
                          <span className="text-xs font-semibold text-gray-500 w-28 flex-shrink-0">{label}</span>
                          <span className="text-xs text-gray-800 font-medium flex-1">{val}</span>
                        </div>
                      ))}
                    </div>
                    {b.error && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">⚠️ {b.error}</p>}
                    <button onClick={nextStep} disabled={bLoading}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3.5 rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center gap-2">
                      {bLoading
                        ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Booking ho rahi hai...</>
                        : <>✓ Booking Confirm Karein</>
                      }
                    </button>
                    <button onClick={() => setBooking(p => ({ ...p, step: "datetime", error: "" }))}
                      className="w-full border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                      ← Wapas
                    </button>
                  </div>
                )}

                {/* ── Step: Success ── */}
                {b.step === "success" && (
                  <div className="p-5 flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl">🎉</div>
                    <div className="text-center">
                      <p className="font-black text-green-700 text-xl">Booking Confirmed!</p>
                      <p className="text-gray-500 text-sm mt-1">{b.name} ji, aapki booking ho gayi</p>
                    </div>
                    <div className="w-full bg-teal-50 border-2 border-teal-200 rounded-2xl p-4 text-center">
                      <p className="text-xs text-teal-500 font-semibold uppercase tracking-wider">Booking ID</p>
                      <p className="font-black text-teal-700 text-2xl mt-1 tracking-widest">{b.bookingId}</p>
                      <p className="text-xs text-teal-500 mt-2">📅 {new Date(b.date).toLocaleDateString("en-IN", { weekday:"long", day:"2-digit", month:"long" })} · {b.slot}</p>
                    </div>
                    <div className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 space-y-1">
                      <p className="font-bold">📌 Yaad Rakhein:</p>
                      <p>• Hospital aane par counter pe Booking ID batayein</p>
                      <p>• Fee counter pe cash ya UPI se pay karein</p>
                      <p>• Koi sawaal ho to call karein: <strong>9955564596</strong></p>
                    </div>
                    <button onClick={() => { setBooking({ ...DEFAULT_BOOKING }); setView("chat"); }}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold transition">
                      Chat Pe Wapas Jayein
                    </button>
                    <button onClick={startBooking}
                      className="w-full border-2 border-teal-200 text-teal-600 py-2.5 rounded-xl text-sm font-bold hover:bg-teal-50 transition">
                      + Ek Aur Booking Karein
                    </button>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            </div>
          )}

          {/* ════════════════ SUPPORT WIZARD ════════════════ */}
          {view === "support" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* Checking login */}
              {suppLoggedIn === null && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-9 h-9 border-4 border-rose-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-400 text-sm">Checking login...</p>
                </div>
              )}

              {/* Not logged in */}
              {suppLoggedIn === false && (
                <div className="space-y-4 pt-2">
                  <div className="bg-rose-50 rounded-2xl p-4 text-center border border-rose-100">
                    <p className="text-3xl mb-2">🔒</p>
                    <p className="font-bold text-gray-800 text-sm">Login Zaruri Hai</p>
                    <p className="text-xs text-gray-500 mt-1">Support ticket raise karne ke liye pehle login karein</p>
                  </div>
                  <a href="/login?redirect=/support"
                    className="block w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold text-sm text-center transition">
                    Login / Register Karein
                  </a>
                  <a href="/support"
                    className="block w-full border border-gray-200 text-gray-500 py-2.5 rounded-xl text-xs font-medium text-center hover:bg-gray-50 transition">
                    Full Support Page Kholen →
                  </a>
                </div>
              )}

              {/* Logged in — step: category */}
              {suppLoggedIn === true && suppStep === "category" && (
                <div className="space-y-3">
                  <div className="bg-rose-50 rounded-2xl p-3 border border-rose-100 flex items-center gap-2">
                    <span className="text-xl">🎧</span>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">Support Ticket</p>
                      <p className="text-xs text-gray-500">Kaunsi problem hai?</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {SUPPORT_CATEGORIES.map(c => (
                      <button key={c.key} onClick={() => { setSuppCategory(c.key); setSuppStep("details"); setSuppError(""); }}
                        className="p-3 rounded-2xl border-2 border-gray-200 bg-white hover:border-rose-300 hover:bg-rose-50 text-left transition">
                        <p className="text-lg mb-0.5">{c.icon}</p>
                        <p className="text-xs font-bold text-gray-700 leading-snug">{c.label}</p>
                      </button>
                    ))}
                  </div>
                  <a href="/support"
                    className="block w-full border border-gray-200 text-gray-400 py-2 rounded-xl text-xs text-center hover:bg-gray-50 transition">
                    Full Support Page Kholen →
                  </a>
                </div>
              )}

              {/* Logged in — step: details form */}
              {suppLoggedIn === true && suppStep === "details" && (() => {
                const cat = SUPPORT_CATEGORIES.find(c => c.key === suppCategory);
                return (
                  <div className="space-y-3">
                    <button onClick={() => { setSuppStep("category"); setSuppError(""); }}
                      className="text-teal-600 text-xs font-semibold hover:underline flex items-center gap-1">
                      ← Category Badlein
                    </button>
                    <div className="bg-rose-50 rounded-xl px-3 py-2 border border-rose-100 flex items-center gap-2">
                      <span>{cat?.icon}</span>
                      <span className="text-xs font-bold text-rose-700">{cat?.label}</span>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Subject *</label>
                      <input value={suppSubject} onChange={e => { setSuppSubject(e.target.value); setSuppError(""); }}
                        maxLength={120} placeholder="Ek line mein problem batayein..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Problem Detail *</label>
                      <textarea value={suppDesc} onChange={e => { setSuppDesc(e.target.value); setSuppError(""); }}
                        rows={4} placeholder="Poori detail mein batayein — kab hua, kya hua..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none" />
                    </div>
                    {suppError && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">⚠️ {suppError}</p>}
                    <button onClick={submitSupport} disabled={suppLoading}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2">
                      {suppLoading
                        ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submit ho raha hai...</>
                        : "✓ Ticket Submit Karein"
                      }
                    </button>
                  </div>
                );
              })()}

              {/* Done */}
              {suppLoggedIn === true && suppStep === "done" && (
                <div className="flex flex-col items-center gap-4 pt-4 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl">🎉</div>
                  <div>
                    <p className="font-black text-green-700 text-lg">Ticket Submit Ho Gaya!</p>
                    <p className="text-gray-500 text-xs mt-1">Hum 24 ghante mein aapko contact karenge</p>
                  </div>
                  <div className="w-full bg-rose-50 border-2 border-rose-200 rounded-2xl p-4">
                    <p className="text-xs text-rose-500 font-semibold uppercase tracking-wider">Ticket ID</p>
                    <p className="font-black text-rose-700 text-2xl mt-1 tracking-widest">{suppTicketId}</p>
                  </div>
                  <a href="/support"
                    className="w-full block bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl font-bold text-sm text-center transition">
                    My Tickets Dekhein
                  </a>
                  <button onClick={() => setView("chat")}
                    className="w-full border border-gray-200 text-gray-500 py-2 rounded-xl text-xs font-medium hover:bg-gray-50 transition">
                    Chat Pe Wapas Jayein
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ════════════════ CHAT VIEW ════════════════ */}
          {view === "chat" && (
            <>
              {/* Quick actions */}
              <div className="px-3 py-2 border-b border-gray-100 flex gap-1.5 overflow-x-auto flex-shrink-0">
                <button onClick={startBooking}
                  className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex-shrink-0 shadow-sm shadow-teal-200">
                  📋 OPD Book
                </button>
                {[
                  { label: "Lab Test",    icon: "🧪", href: "/lab-tests" },
                  { label: "Surgery",     icon: "🔬", href: "/surgery-packages" },
                  { label: "Teleconsult", icon: "💻", href: "/teleconsultation" },
                ].map(a => (
                  <a key={a.href} href={a.href}
                    className="flex items-center gap-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex-shrink-0">
                    {a.icon} {a.label}
                  </a>
                ))}
                <button onClick={startSupport}
                  className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex-shrink-0">
                  🎧 Support
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
                {messages.length === 0 && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-sm">🏥</span></div>
                      <div className="bg-gray-100 rounded-2xl rounded-tl-none px-3 py-2.5 max-w-[85%]">
                        <p className="text-sm text-gray-800">
                          Namaste! 🙏 Main <strong>Brims Assistant</strong> hoon.<br />
                          Booking karna ho, health sawaal poochna ho, ya platform ke baare mein jaanna ho — main har cheez mein madad karunga!
                        </p>
                      </div>
                    </div>
                    <div className="pl-9 space-y-3">
                      {/* Booking questions */}
                      <div>
                        <p className="text-[10px] text-teal-500 font-bold uppercase tracking-wider mb-1.5">📋 Booking & Services</p>
                        <div className="space-y-1.5">
                          {SUGGESTED_BOOKING.map(s => (
                            <button key={s} onClick={() => sendChat(s)}
                              className="block w-full text-left text-xs text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl px-3 py-2 transition font-medium">
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Health questions */}
                      <div>
                        <p className="text-[10px] text-orange-500 font-bold uppercase tracking-wider mb-1.5">🩺 Health Sawaal</p>
                        <div className="space-y-1.5">
                          {SUGGESTED_HEALTH.map(s => (
                            <button key={s} onClick={() => sendChat(s)}
                              className="block w-full text-left text-xs text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl px-3 py-2 transition font-medium">
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Platform questions */}
                      <div>
                        <p className="text-[10px] text-purple-500 font-bold uppercase tracking-wider mb-1.5">💳 Platform & Card</p>
                        <div className="space-y-1.5">
                          {SUGGESTED_PLATFORM.map(s => (
                            <button key={s} onClick={() => sendChat(s)}
                              className="block w-full text-left text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl px-3 py-2 transition font-medium">
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                    {m.role === "assistant" && (
                      <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-sm">🏥</span></div>
                    )}
                    <div className={`rounded-2xl px-3 py-2.5 max-w-[85%] text-sm leading-relaxed ${
                      m.role === "user" ? "bg-teal-600 text-white rounded-tr-none" : "bg-gray-100 text-gray-800 rounded-tl-none"
                    }`}>
                      {m.role === "assistant"
                        ? <span dangerouslySetInnerHTML={{ __html: linkify(m.content) }} />
                        : m.content
                      }
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-sm">🏥</span></div>
                    <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
                      <div className="flex gap-1">
                        {[0,1,2].map(i => <span key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-2.5 border-t border-gray-100 flex gap-2 flex-shrink-0 bg-white">
                <input ref={inputRef} value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                  placeholder="Sawaal poochein ya symptoms batayein..."
                  disabled={loading}
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-50 bg-gray-50"
                />
                <button onClick={() => sendChat()} disabled={!input.trim() || loading}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #0d9488, #0891b2)" }}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                  </svg>
                </button>
              </div>

              <div className="px-3 pb-2 flex items-center justify-between">
                <p className="text-[10px] text-gray-300">Powered by Gemini · Health + Booking Help</p>
                {messages.length > 0 && (
                  <button onClick={() => setMessages([])} className="text-[10px] text-gray-300 hover:text-gray-500 transition">Clear chat</button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
