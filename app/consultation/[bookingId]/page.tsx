"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

function ConsultationRoomInner() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const bookingId    = params?.bookingId as string;
  const callType     = (searchParams?.get("type") || "video") as "video" | "audio";
  const doctorName   = searchParams?.get("doctor") || "Doctor";
  const date         = searchParams?.get("date") || "";
  const slot         = searchParams?.get("slot") || "";

  const jitsiContainer = useRef<HTMLDivElement>(null);
  const apiRef         = useRef<any>(null);

  const [status, setStatus]     = useState<"loading" | "ready" | "ended">("loading");
  const [muted, setMuted]       = useState(false);
  const [camOff, setCamOff]     = useState(callType === "audio");
  const [duration, setDuration] = useState(0);
  const timerRef               = useRef<ReturnType<typeof setInterval> | null>(null);

  const roomName    = `brims-consult-${bookingId}`;
  const displayName = localStorage.getItem("userId")?.slice(-6) || "Patient";

  useEffect(() => {
    if ((window as any).JitsiMeetExternalAPI) {
      initJitsi();
      return;
    }
    const script   = document.createElement("script");
    script.src     = "https://meet.jit.si/external_api.js";
    script.async   = true;
    script.onload  = initJitsi;
    document.head.appendChild(script);

    return () => {
      if (apiRef.current) apiRef.current.dispose();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function initJitsi() {
    if (!jitsiContainer.current || !(window as any).JitsiMeetExternalAPI) return;

    const JitsiMeetExternalAPI = (window as any).JitsiMeetExternalAPI;
    apiRef.current = new JitsiMeetExternalAPI("meet.jit.si", {
      roomName,
      parentNode: jitsiContainer.current,
      width:  "100%",
      height: "100%",
      userInfo: { displayName: `Patient-${displayName}` },
      configOverwrite: {
        startWithAudioMuted:    false,
        startWithVideoMuted:    callType === "audio",
        disableDeepLinking:     true,
        prejoinPageEnabled:     false,
        disableInviteFunctions: true,
        toolbarButtons: callType === "audio"
          ? ["microphone", "hangup", "chat", "raisehand"]
          : ["microphone", "camera", "hangup", "chat", "raisehand", "tileview"],
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK:    false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        TOOLBAR_ALWAYS_VISIBLE:  true,
        MOBILE_APP_PROMO:        false,
        HIDE_INVITE_MORE_HEADER: true,
      },
    });

    apiRef.current.addEventListeners({
      videoConferenceJoined: () => {
        setStatus("ready");
        timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      },
      videoConferenceLeft: () => {
        setStatus("ended");
        if (timerRef.current) clearInterval(timerRef.current);
      },
      audioMuteStatusChanged: ({ muted: m }: { muted: boolean }) => setMuted(m),
      videoMuteStatusChanged: ({ muted: m }: { muted: boolean }) => setCamOff(m),
    });
  }

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function handleLeave() {
    if (apiRef.current) apiRef.current.executeCommand("hangup");
    setStatus("ended");
    if (timerRef.current) clearInterval(timerRef.current);
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">

      {/* ── Top Bar ── */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold">
            {doctorName.split(" ")[1]?.[0] || "D"}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{doctorName}</p>
            <p className="text-gray-400 text-xs">
              {callType === "video" ? "📹 Video Consultation" : "🎙️ Audio Consultation"}
            </p>
          </div>
        </div>

        {status === "ready" && (
          <div className="flex items-center gap-1.5 bg-green-900/60 border border-green-700 px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-300 text-xs font-mono">{formatTime(duration)}</span>
          </div>
        )}
        {status === "loading" && (
          <span className="text-gray-400 text-xs animate-pulse">Connecting...</span>
        )}
      </div>

      {/* ── Date / Slot strip ── */}
      {(date || slot) && status !== "ended" && (
        <div className="bg-teal-900/40 px-4 py-2 flex gap-4 text-xs text-teal-200 flex-shrink-0">
          {date && (
            <span>📅 {new Date(date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          )}
          {slot && <span>🕐 {slot}</span>}
          <span className="ml-auto text-teal-500 font-mono">#{bookingId?.slice(-8)}</span>
        </div>
      )}

      {/* ── Main Area ── */}
      <div className="flex-1 relative">

        {status !== "ended" ? (
          <div ref={jitsiContainer} className="w-full h-full min-h-[72vh]" />
        ) : (
          /* ── Call Ended Screen ── */
          <div className="flex flex-col items-center justify-center min-h-[72vh] text-center px-6">
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center text-5xl mb-5">
              👋
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">Call Khatam Ho Gayi</h2>
            <p className="text-gray-400 text-sm mb-1">
              Consultation {doctorName} ke saath complete hui.
            </p>
            <p className="text-teal-400 text-sm font-mono mb-6">
              Duration: {formatTime(duration)}
            </p>

            <div className="bg-gray-800 rounded-2xl p-5 text-left w-full max-w-sm mb-6">
              <p className="text-teal-400 font-semibold text-sm mb-3">📋 Aage kya karein:</p>
              <ul className="space-y-2 text-xs text-gray-300">
                <li>✓ My Bookings mein jaake prescription download karein</li>
                <li>✓ Doctor ki dawa ki salaah follow karein</li>
                <li>✓ Zaroorat pade toh dobara consult book karein</li>
              </ul>
            </div>

            <div className="flex gap-3 w-full max-w-sm">
              <a href="/my-bookings"
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl text-sm text-center transition">
                Meri Bookings
              </a>
              <a href="/teleconsultation"
                className="flex-1 border border-gray-600 text-gray-300 py-3 rounded-xl text-sm text-center hover:bg-gray-700 transition">
                Naya Book Karein
              </a>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {status === "loading" && (
          <div className="absolute inset-0 bg-gray-900/75 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-14 h-14 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white font-semibold">Room join ho rahi hai...</p>
            <p className="text-gray-400 text-sm mt-1">Camera / mic ka permission dein</p>
          </div>
        )}
      </div>

      {/* ── Bottom Controls ── */}
      {status !== "ended" && (
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-center gap-5 flex-shrink-0">

          {/* Mic toggle */}
          <button onClick={() => apiRef.current?.executeCommand("toggleAudio")}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition shadow ${
              muted ? "bg-red-600 hover:bg-red-700" : "bg-gray-600 hover:bg-gray-500"
            }`}
            title={muted ? "Mic On Karein" : "Mic Off Karein"}>
            {muted ? "🔇" : "🎙️"}
          </button>

          {/* Camera toggle — only for video */}
          {callType === "video" && (
            <button onClick={() => apiRef.current?.executeCommand("toggleVideo")}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition shadow ${
                camOff ? "bg-red-600 hover:bg-red-700" : "bg-gray-600 hover:bg-gray-500"
              }`}
              title={camOff ? "Camera On Karein" : "Camera Off Karein"}>
              {camOff ? "📵" : "📹"}
            </button>
          )}

          {/* End Call */}
          <button onClick={handleLeave}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-2xl transition shadow-lg"
            title="Call Khatam Karein">
            📵
          </button>

          {/* Chat toggle */}
          <button onClick={() => apiRef.current?.executeCommand("toggleChat")}
            className="w-14 h-14 rounded-full bg-gray-600 hover:bg-gray-500 flex items-center justify-center text-2xl transition shadow"
            title="Chat">
            💬
          </button>
        </div>
      )}

    </div>
  );
}

export default function ConsultationRoomPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading call room...</p>
        </div>
      </div>
    }>
      <ConsultationRoomInner />
    </Suspense>
  );
}
