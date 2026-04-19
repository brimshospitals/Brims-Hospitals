"use client";
/**
 * LangToggle — reusable language switcher button
 * Usage: <LangToggle /> — drop in anywhere
 * Variants: "pill" (default), "icon"
 */
import { useLang } from "@/app/providers/LangProvider";

export default function LangToggle({ variant = "pill" }: { variant?: "pill" | "icon" }) {
  const { lang, toggle } = useLang();

  if (variant === "icon") {
    return (
      <button
        onClick={toggle}
        title={lang === "en" ? "हिंदी में बदलें" : "Switch to English"}
        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center justify-center transition border border-white/20"
      >
        {lang === "en" ? "अ" : "A"}
      </button>
    );
  }

  // Default: pill variant
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-600 transition shadow-sm"
      title={lang === "en" ? "हिंदी में बदलें" : "Switch to English"}
    >
      <span className="text-base leading-none">{lang === "en" ? "🇮🇳" : "🇬🇧"}</span>
      <span>{lang === "en" ? "हिंदी" : "English"}</span>
    </button>
  );
}