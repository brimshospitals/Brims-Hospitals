"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Message = { role: "user" | "assistant"; content: string };

const QUICK_ACTIONS = [
  { label: "OPD Book Karein", icon: "🩺", href: "/opd-booking" },
  { label: "Lab Test",        icon: "🧪", href: "/lab-tests" },
  { label: "Surgery Package", icon: "🔬", href: "/surgery-packages" },
  { label: "Teleconsult",     icon: "💻", href: "/teleconsultation" },
];

const SUGGESTED = [
  "OPD appointment kaise book karein?",
  "Blood test ke liye kya karna hoga?",
  "Brims Gold Card kya hai?",
  "Surgery package ka price kya hai?",
  "Aaj doctor available hai?",
];

function linkify(text: string) {
  // Convert /path-name mentions to clickable links
  return text.replace(/(\/(opd-booking|lab-tests|surgery-packages|teleconsultation|ipd-booking|ambulance|dashboard|health-card|wallet)[^\s]*)/g,
    (match) => `<a href="${match}" class="text-teal-600 font-semibold underline hover:text-teal-700" target="_self">${match}</a>`
  );
}

export default function ChatBot() {
  const router = useRouter();
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [unread,   setUnread]   = useState(0);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setUnread(0);
    }
  }, [open]);

  async function send(text?: string) {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const res  = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        if (!open) setUnread((n) => n + 1);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "Kuch gadbad ho gayi. Dobara try karein." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Network error. Internet check karein." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* ── Floating Button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-4 z-[90] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{ background: "linear-gradient(135deg, #0d9488, #0891b2)" }}
        aria-label="Chat with Brims Assistant"
      >
        {open ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
          </svg>
        )}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unread}</span>
        )}
      </button>

      {/* ── Chat Window ── */}
      {open && (
        <div className="fixed bottom-24 right-4 z-[90] w-[340px] sm:w-[380px] max-h-[580px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ maxHeight: "calc(100vh - 120px)" }}>

          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, #0d9488, #0891b2)" }}
            className="px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🏥</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">Brims Assistant</p>
              <p className="text-teal-200 text-xs">Booking + Health Help · 24×7</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-teal-200 text-xs">Online</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-3 py-2 border-b border-gray-100 flex gap-1.5 overflow-x-auto flex-shrink-0">
            {QUICK_ACTIONS.map((a) => (
              <button key={a.href} onClick={() => router.push(a.href)}
                className="flex items-center gap-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex-shrink-0">
                <span>{a.icon}</span>{a.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {/* Welcome message */}
            {isEmpty && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm">🏥</span>
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-none px-3 py-2.5 max-w-[85%]">
                    <p className="text-sm text-gray-800">
                      Namaste! 🙏 Main <strong>Brims Assistant</strong> hoon.<br />
                      OPD booking, Lab Test, Surgery Package, ya koi bhi health sawaal — main help karunga!
                    </p>
                  </div>
                </div>
                {/* Suggested questions */}
                <div className="pl-9 space-y-1.5">
                  <p className="text-[11px] text-gray-400 font-semibold">Aap pooch sakte hain:</p>
                  {SUGGESTED.map((s) => (
                    <button key={s} onClick={() => send(s)}
                      className="block w-full text-left text-xs text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl px-3 py-2 transition font-medium">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation */}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm">🏥</span>
                  </div>
                )}
                <div className={`rounded-2xl px-3 py-2.5 max-w-[85%] text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-teal-600 text-white rounded-tr-none"
                    : "bg-gray-100 text-gray-800 rounded-tl-none"
                }`}>
                  {m.role === "assistant"
                    ? <span dangerouslySetInnerHTML={{ __html: linkify(m.content) }} />
                    : m.content
                  }
                </div>
              </div>
            ))}

            {/* Loading dots */}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">🏥</span>
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2.5 border-t border-gray-100 flex gap-2 flex-shrink-0 bg-white">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Apna sawaal likhein..."
              disabled={loading}
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-50 bg-gray-50"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #0d9488, #0891b2)" }}
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </div>

          {/* Footer */}
          <div className="px-3 pb-2 flex items-center justify-between">
            <p className="text-[10px] text-gray-300">Powered by Gemini AI</p>
            {messages.length > 0 && (
              <button onClick={() => setMessages([])} className="text-[10px] text-gray-300 hover:text-gray-500 transition">
                Clear chat
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}