import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en";
import ar from "./locales/ar";
import fr from "./locales/fr";
import es from "./locales/es";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "EN", nativeLabel: "English", dir: "ltr" },
  { code: "ar", label: "AR", nativeLabel: "العربية", dir: "rtl" },
  { code: "fr", label: "FR", nativeLabel: "Français", dir: "ltr" },
  { code: "es", label: "ES", nativeLabel: "Español", dir: "ltr" },
] as const;

export type Language = typeof SUPPORTED_LANGUAGES[number]["code"];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
      fr: { translation: fr },
      es: { translation: es },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "ar", "fr", "es"],
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "soukglobale_lang",
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
