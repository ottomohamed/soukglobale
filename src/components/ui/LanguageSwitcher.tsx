import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { ChevronDown } from "lucide-react";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language) 
    ?? SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function changeLanguage(code: string) {
    i18n.changeLanguage(code);
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
    document.documentElement.dir = lang?.dir ?? "ltr";
    document.documentElement.lang = code;
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-border/60 text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-200 bg-background/60 backdrop-blur-sm"
        aria-label="Change language"
      >
        <span>{current.label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-background border border-border rounded-2xl shadow-xl shadow-black/10 overflow-hidden z-50">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-muted/50 ${
                i18n.language === lang.code 
                  ? "text-primary font-semibold bg-primary/5" 
                  : "text-foreground"
              }`}
              dir={lang.dir}
            >
              <span className="font-bold text-xs text-muted-foreground">{lang.label}</span>
              <span>{lang.nativeLabel}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
