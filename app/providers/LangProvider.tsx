"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { type Lang } from "@/lib/i18n";

interface LangContextType {
  lang: Lang;
  toggle: () => void;
}

const LangContext = createContext<LangContextType>({ lang: "en", toggle: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("brims_lang") as Lang | null;
    if (saved === "hi" || saved === "en") setLang(saved);
  }, []);

  function toggle() {
    setLang((prev) => {
      const next: Lang = prev === "en" ? "hi" : "en";
      localStorage.setItem("brims_lang", next);
      return next;
    });
  }

  return (
    <LangContext.Provider value={{ lang, toggle }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
