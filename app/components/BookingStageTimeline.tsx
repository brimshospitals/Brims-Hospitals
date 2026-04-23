"use client";
import { useState } from "react";

// ── Stage definitions per booking type ────────────────────────────────────────
export const BOOKING_STAGES: Record<string, { key: string; label: string; icon: string; broadStatus?: string }[]> = {
  Surgery: [
    { key: "pending",            label: "Booking Received",           icon: "📋" },
    { key: "hospital_confirmed", label: "Hospital Confirmed",         icon: "🏥" },
    { key: "patient_confirmed",  label: "Patient Confirmed (Call)",   icon: "📞", broadStatus: "confirmed" },
    { key: "confirmed",          label: "Booking Confirmed",          icon: "✅", broadStatus: "confirmed" },
    { key: "pickup_scheduled",   label: "Pickup Scheduled",           icon: "🚗" },
    { key: "patient_reached",    label: "Patient Reached Hospital",   icon: "🏥" },
    { key: "payment_done",       label: "Payment Complete",           icon: "💰" },
    { key: "admitted",           label: "Patient Admitted",           icon: "🛏️" },
    { key: "surgery_done",       label: "Surgery Done",               icon: "⚕️" },
    { key: "discharged",         label: "Patient Discharged",         icon: "🏠" },
    { key: "followup_scheduled", label: "Follow-up Scheduled",        icon: "📅" },
    { key: "feedback_pending",   label: "Awaiting Feedback",          icon: "⭐" },
    { key: "completed",          label: "Completed",                  icon: "🎉", broadStatus: "completed" },
  ],
  IPD: [
    { key: "pending",            label: "Booking Received",           icon: "📋" },
    { key: "hospital_confirmed", label: "Hospital Confirmed",         icon: "🏥" },
    { key: "patient_confirmed",  label: "Patient Confirmed (Call)",   icon: "📞", broadStatus: "confirmed" },
    { key: "confirmed",          label: "Booking Confirmed",          icon: "✅", broadStatus: "confirmed" },
    { key: "patient_reached",    label: "Patient Reached Hospital",   icon: "🏥" },
    { key: "payment_done",       label: "Payment Complete",           icon: "💰" },
    { key: "admitted",           label: "Patient Admitted",           icon: "🛏️" },
    { key: "discharged",         label: "Patient Discharged",         icon: "🏠" },
    { key: "feedback_pending",   label: "Awaiting Feedback",          icon: "⭐" },
    { key: "completed",          label: "Completed",                  icon: "🎉", broadStatus: "completed" },
  ],
  OPD: [
    { key: "pending",            label: "Booking Received",           icon: "📋" },
    { key: "hospital_confirmed", label: "Hospital / Doctor Confirmed",icon: "🏥" },
    { key: "patient_confirmed",  label: "Patient Confirmed (Call)",   icon: "📞", broadStatus: "confirmed" },
    { key: "confirmed",          label: "Booking Confirmed",          icon: "✅", broadStatus: "confirmed" },
    { key: "patient_reached",    label: "Patient Reached",            icon: "🚶" },
    { key: "payment_done",       label: "Payment Done",               icon: "💰" },
    { key: "consultation_done",  label: "Consultation Done",          icon: "⚕️" },
    { key: "feedback_pending",   label: "Awaiting Feedback",          icon: "⭐" },
    { key: "completed",          label: "Completed",                  icon: "🎉", broadStatus: "completed" },
  ],
  Lab: [
    { key: "pending",            label: "Booking Received",           icon: "📋" },
    { key: "lab_confirmed",      label: "Lab / Hospital Confirmed",   icon: "🧪" },
    { key: "patient_confirmed",  label: "Patient Confirmed (Call)",   icon: "📞", broadStatus: "confirmed" },
    { key: "confirmed",          label: "Booking Confirmed",          icon: "✅", broadStatus: "confirmed" },
    { key: "sample_collected",   label: "Sample Collected",           icon: "🧫" },
    { key: "payment_done",       label: "Payment Done",               icon: "💰" },
    { key: "report_done",        label: "Report Ready",               icon: "📄" },
    { key: "report_uploaded",    label: "Report Uploaded to Portal",  icon: "📤" },
    { key: "feedback_pending",   label: "Awaiting Feedback",          icon: "⭐" },
    { key: "completed",          label: "Completed",                  icon: "🎉", broadStatus: "completed" },
  ],
  Consultation: [
    { key: "pending",            label: "Booking Received",           icon: "📋" },
    { key: "doctor_confirmed",   label: "Doctor Confirmed",           icon: "🩺" },
    { key: "patient_confirmed",  label: "Patient Confirmed (Call)",   icon: "📞", broadStatus: "confirmed" },
    { key: "confirmed",          label: "Booking Confirmed",          icon: "✅", broadStatus: "confirmed" },
    { key: "call_started",       label: "Call Started",               icon: "📹" },
    { key: "payment_done",       label: "Payment Done",               icon: "💰" },
    { key: "consultation_done",  label: "Consultation Done",          icon: "⚕️" },
    { key: "feedback_pending",   label: "Awaiting Feedback",          icon: "⭐" },
    { key: "completed",          label: "Completed",                  icon: "🎉", broadStatus: "completed" },
  ],
};

interface StageEntry {
  stage: string; label: string; timestamp: string;
  updatedBy: string; updatedByRole?: string; notes?: string;
}
interface Props {
  bookingId:    string;
  type:         string;
  currentStage: string;
  history:      StageEntry[];
  onUpdate:     (stage: string, label: string, notes: string) => Promise<void>;
  readOnly?:    boolean;
}

function fmtTime(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function BookingStageTimeline({
  bookingId, type, currentStage, history, onUpdate, readOnly,
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const [notes,     setNotes]     = useState("");
  const [notesErr,  setNotesErr]  = useState("");
  const [saving,    setSaving]    = useState(false);

  const stages  = BOOKING_STAGES[type] || BOOKING_STAGES.OPD;
  const curIdx  = stages.findIndex(s => s.key === currentStage);
  const isFinal = currentStage === "completed" || currentStage === "cancelled";
  const nextStage = !isFinal && curIdx >= 0 && curIdx < stages.length - 1
    ? stages[curIdx + 1] : null;

  // progress bar %
  const pct = isFinal
    ? (currentStage === "completed" ? 100 : 0)
    : curIdx < 0 ? 0
    : Math.round((curIdx / (stages.length - 1)) * 100);

  // Build map: stage key → history entry
  const histMap: Record<string, StageEntry> = {};
  (history || []).forEach(h => { histMap[h.stage] = h; });

  function openModal() { setNotes(""); setNotesErr(""); setShowModal(true); }

  async function handleConfirm() {
    if (!notes.trim()) { setNotesErr("Notes/comment likhna zaruri hai"); return; }
    if (!nextStage) return;
    setSaving(true);
    try {
      await onUpdate(nextStage.key, nextStage.label, notes.trim());
      setShowModal(false);
      setNotes("");
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-5">

      {/* ── Progress header ── */}
      <div className={`rounded-2xl p-4 ${
        currentStage === "cancelled"
          ? "bg-red-50 border-2 border-red-200"
          : currentStage === "completed"
          ? "bg-gradient-to-r from-green-500 to-teal-500"
          : "bg-gradient-to-r from-teal-600 to-blue-600"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
              currentStage === "cancelled" ? "bg-red-100"
              : "bg-white/20"
            }`}>
              {stages.find(s => s.key === currentStage)?.icon || "⏳"}
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${
                currentStage === "cancelled" ? "text-red-400" : "text-white/70"
              }`}>Current Stage</p>
              <p className={`font-black text-lg leading-tight ${
                currentStage === "cancelled" ? "text-red-700" : "text-white"
              }`}>
                {stages.find(s => s.key === currentStage)?.label || currentStage}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-black text-3xl leading-none ${
              currentStage === "cancelled" ? "text-red-400" : "text-white"
            }`}>{pct}%</p>
            <p className={`text-xs mt-0.5 ${
              currentStage === "cancelled" ? "text-red-400" : "text-white/60"
            }`}>
              {currentStage === "cancelled" ? "Cancelled" : "Complete"}
            </p>
          </div>
        </div>
        {currentStage !== "cancelled" && (
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
        {!isFinal && nextStage && !readOnly && (
          <p className="text-white/70 text-xs mt-2">
            Agle stage: <span className="text-white font-semibold">{nextStage.icon} {nextStage.label}</span>
          </p>
        )}
      </div>

      {/* ── Vertical stepper ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {stages.map((s, i) => {
          const done    = i < curIdx || currentStage === "completed";
          const active  = i === curIdx && !isFinal;
          const cancelled = currentStage === "cancelled" && i === curIdx;
          const future  = i > curIdx && !isFinal;
          const hist    = histMap[s.key];
          const isLast  = i === stages.length - 1;

          return (
            <div key={s.key} className={`flex gap-0 ${!isLast ? "border-b border-gray-50" : ""}`}>
              {/* Left accent bar */}
              <div className={`w-1 flex-shrink-0 ${
                done     ? "bg-teal-400"
                : active  ? "bg-teal-500"
                : cancelled ? "bg-red-400"
                : "bg-gray-100"
              }`} />

              <div className="flex gap-3 px-4 py-3 flex-1 min-w-0">
                {/* Circle with number/icon */}
                <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    done
                      ? "bg-teal-500 text-white shadow-sm shadow-teal-200"
                    : active
                      ? "bg-teal-50 border-2 border-teal-500 text-teal-700 ring-2 ring-teal-100"
                    : cancelled
                      ? "bg-red-100 border border-red-300 text-red-500"
                    : "bg-gray-100 border border-gray-200 text-gray-300"
                  }`}>
                    {done
                      ? <span className="text-base">✓</span>
                      : active
                      ? <span className="text-base animate-pulse">{s.icon}</span>
                      : <span className="text-base opacity-40">{s.icon}</span>
                    }
                  </div>
                  {/* Step number below circle */}
                  <span className={`text-[10px] font-bold mt-0.5 ${
                    done ? "text-teal-400" : active ? "text-teal-500" : "text-gray-300"
                  }`}>{i + 1}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-semibold text-sm leading-tight ${
                      done ? "text-teal-700"
                      : active ? "text-gray-900"
                      : "text-gray-300"
                    }`}>
                      {s.label}
                    </p>

                    {/* Status badge */}
                    {done && (
                      <span className="flex-shrink-0 text-[10px] bg-teal-100 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full font-bold">
                        ✓ Done
                      </span>
                    )}
                    {active && (
                      <span className="flex-shrink-0 text-[10px] bg-teal-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                        ● Active
                      </span>
                    )}
                    {future && (
                      <span className="flex-shrink-0 text-[10px] bg-gray-100 text-gray-300 px-2 py-0.5 rounded-full font-medium">
                        Pending
                      </span>
                    )}
                  </div>

                  {/* Completed by info */}
                  {done && hist && (
                    <div className="mt-1.5 bg-teal-50 border border-teal-100 rounded-lg px-2.5 py-1.5 space-y-0.5">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-teal-400">👤</span>
                        <span className="font-semibold text-teal-700">{hist.updatedBy || "—"}</span>
                        {hist.updatedByRole && (
                          <span className="text-teal-400 capitalize">({hist.updatedByRole})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-teal-400">🕐</span>
                        <span className="text-teal-600">{fmtTime(hist.timestamp)}</span>
                      </div>
                      {hist.notes && (
                        <div className="flex items-start gap-2 text-[11px] pt-0.5">
                          <span className="text-teal-400 flex-shrink-0">💬</span>
                          <span className="text-teal-700 italic">"{hist.notes}"</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Active stage: show "waiting" info */}
                  {active && (
                    <p className="text-[11px] text-teal-500 mt-1 flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
                      In progress — aage badhne ke liye neeche button dabayein
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Cancelled state */}
        {currentStage === "cancelled" && (
          <div className="flex gap-0 bg-red-50">
            <div className="w-1 bg-red-400 flex-shrink-0" />
            <div className="flex gap-3 px-4 py-3 flex-1">
              <div className="w-9 h-9 rounded-full bg-red-100 border border-red-300 flex items-center justify-center text-base flex-shrink-0">❌</div>
              <div>
                <p className="font-bold text-red-700 text-sm">Booking Cancelled</p>
                {histMap["cancelled"] && (
                  <div className="mt-1 space-y-0.5 text-[11px] text-red-500">
                    <p>👤 {histMap["cancelled"].updatedBy}</p>
                    <p>🕐 {fmtTime(histMap["cancelled"].timestamp)}</p>
                    {histMap["cancelled"].notes && <p>💬 "{histMap["cancelled"].notes}"</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Advance button (non-readonly, not final) ── */}
      {!readOnly && !isFinal && nextStage && (
        <button onClick={openModal}
          className="w-full flex items-center justify-between px-5 py-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-2xl font-bold transition shadow-sm shadow-teal-200">
          <div className="flex items-center gap-2">
            <span className="text-xl">{nextStage.icon}</span>
            <div className="text-left">
              <p className="text-xs text-teal-200 font-normal">Next Stage</p>
              <p className="text-base font-bold">{nextStage.label}</p>
            </div>
          </div>
          <span className="text-2xl font-black">→</span>
        </button>
      )}

      {currentStage === "completed" && (
        <div className="flex items-center justify-center gap-2 py-3 bg-green-50 border border-green-200 rounded-2xl">
          <span className="text-2xl">🎉</span>
          <p className="font-bold text-green-700">Booking Successfully Completed!</p>
        </div>
      )}

      {/* ── Stage advance modal ── */}
      {showModal && nextStage && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">

              {/* Modal header */}
              <div className="bg-gradient-to-r from-teal-600 to-blue-600 px-6 pt-6 pb-5">
                <p className="text-teal-200 text-xs font-semibold uppercase tracking-wider mb-1">Stage Advance Karein</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
                    {nextStage.icon}
                  </div>
                  <div>
                    <p className="text-white font-black text-lg leading-tight">{nextStage.label}</p>
                    <p className="text-teal-200 text-xs mt-0.5 font-mono">{bookingId}</p>
                  </div>
                </div>
              </div>

              {/* Confirmation flow */}
              <div className="px-6 py-5 space-y-4">
                {/* Stage transition */}
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex-1 text-center px-3 py-2 bg-gray-100 rounded-xl">
                    <p className="text-[10px] text-gray-400 font-medium uppercase">Se</p>
                    <p className="font-semibold text-gray-600 text-xs mt-0.5">
                      {stages.find(s => s.key === currentStage)?.icon} {stages.find(s => s.key === currentStage)?.label}
                    </p>
                  </div>
                  <span className="text-gray-400 font-bold text-lg">→</span>
                  <div className="flex-1 text-center px-3 py-2 bg-teal-50 border-2 border-teal-300 rounded-xl">
                    <p className="text-[10px] text-teal-500 font-medium uppercase">Ko</p>
                    <p className="font-bold text-teal-700 text-xs mt-0.5">
                      {nextStage.icon} {nextStage.label}
                    </p>
                  </div>
                </div>

                {/* Notes — required */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Comment / Notes <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-400 font-normal ml-1">(zaruri hai)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => { setNotes(e.target.value); if (e.target.value.trim()) setNotesErr(""); }}
                    placeholder={`e.g. ${
                      nextStage.key === "hospital_confirmed" ? "Hospital ne confirm kar diya, Dr. Sharma available hain"
                      : nextStage.key === "patient_confirmed" ? "Patient ko call kiya, 10 AM slot confirm hua"
                      : nextStage.key === "confirmed" ? "Booking confirm ho gayi, SMS bheja gaya"
                      : nextStage.key === "pickup_scheduled" ? "Pickup 7 AM ke liye schedule hua, driver ka no. diya"
                      : nextStage.key === "payment_done" ? "₹15,000 counter par jama hua, receipt no. 1234"
                      : nextStage.key === "surgery_done" ? "Surgery successfully complete, Dr. Verma ne confirm kiya"
                      : "Detail likhein..."
                    }`}
                    rows={3}
                    className={`w-full border-2 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 transition ${
                      notesErr ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-teal-200 focus:border-teal-400"
                    }`}
                  />
                  {notesErr && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <span>⚠️</span> {notesErr}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-1">
                  <button onClick={() => setShowModal(false)}
                    className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                    Roko
                  </button>
                  <button onClick={handleConfirm} disabled={saving}
                    className="flex-2 flex-grow bg-teal-600 hover:bg-teal-700 text-white py-3 px-6 rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving
                      ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
                      : <>✓ Confirm &amp; Advance</>
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
