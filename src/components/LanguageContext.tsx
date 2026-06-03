import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations } from "../translations";
import { Artwork, Itinerary, TimelineEra } from "../types";

export type Language = "en" | "it";

export function getLocalizedField<T extends Record<string, any>>(
  item: T,
  field: string,
  language: Language
): any {
  if (!item) return "";
  if (language === "it") {
    const localizedKeySnake = `${field}_it`;
    if (item[localizedKeySnake] !== undefined && item[localizedKeySnake] !== null && item[localizedKeySnake] !== "") {
      return item[localizedKeySnake];
    }
    const camelField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    const localizedKeyCamel = `${camelField}_it`;
    if (item[localizedKeyCamel] !== undefined && item[localizedKeyCamel] !== null && item[localizedKeyCamel] !== "") {
      return item[localizedKeyCamel];
    }
  }
  return item[field];
}

export function formatCategory(value: string, language: Language): string {
  if (!value) return "";
  const keyMap: Record<string, string> = {
    "all": "All",
    "contemporanea": "Contemporary",
    "storica": "Historical",
    "monumento": "Monument",
    "hidden-art": "Hidden Art"
  };
  const key = keyMap[value.toLowerCase()] || value;
  const entry = translations[key];
  if (entry) {
    return entry[language];
  }
  return key;
}

export function formatType(value: string, language: Language): string {
  if (!value) return "";
  const keyMap: Record<string, string> = {
    "all": "All",
    "sculture": "Sculptures",
    "murale": "Murals",
    "murales": "Murals",
    "architettura": "Architecture",
    "installazione-urbana": "Urban Installation"
  };
  const key = keyMap[value.toLowerCase()] || value;
  const entry = translations[key];
  if (entry) {
    return entry[language];
  }
  return key;
}

export function formatVisibility(value: string, language: Language): string {
  if (!value) return "";
  const keyMap: Record<string, string> = {
    "all": "All",
    "iconico": "Iconic",
    "poco-conosciuto": "Lesser known",
    "molto-nascosto": "Very hidden"
  };
  const key = keyMap[value.toLowerCase()] || value;
  const entry = translations[key];
  if (entry) {
    return entry[language];
  }
  return key;
}

export function formatNeighborhood(value: string, language: Language): string {
  if (!value) return "";
  const keyMap: Record<string, string> = {
    "all": "All",
    "centro": "City Center",
    "quadrilatero": "Quadrilatero",
    "san-salvario": "San Salvario",
    "borgo-po": "Borgo Po",
    "vanchiglia": "Vanchiglia",
    "campidoglio": "Campidoglio",
    "san-donato": "San Donato"
  };
  const key = keyMap[value.toLowerCase()] || value;
  const entry = translations[key];
  if (entry) {
    return entry[language];
  }
  return key;
}

export function formatServiceSubtype(value: string, language: Language): string {
  if (!value) return "";
  const keyMap: Record<string, string> = {
    "cafe": "Cafe",
    "bar": "Bar",
    "ice_cream": "Ice cream",
    "bus_stop": "Bus stop",
    "tram_stop": "Tram stop",
    "subway_ent": "Subway entrance",
    "subway_entrance": "Subway entrance",
    "bike_sharing": "Bike sharing"
  };
  const key = keyMap[value] || keyMap[value.toLowerCase()] || value;
  const entry = translations[key];
  if (entry) {
    return entry[language];
  }
  return key;
}

export function formatForumCategory(value: string, language: Language): string {
  if (!value) return "";
  const keyMap: Record<string, string> = {
    "tutti": "All",
    "all": "All",
    "esperienze": "Experiences",
    "consigli": "Tips",
    "segnalazioni": "Reports",
    "domande": "Questions"
  };
  const key = keyMap[value.toLowerCase()] || value;
  const entry = translations[key];
  if (entry) {
    return entry[language];
  }
  return key;
}

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  translateArtwork: (artwork: Artwork) => Artwork;
  translateArtworkList: (artworks: Artwork[]) => Artwork[];
  translateItinerary: (itinerary: Itinerary) => Itinerary;
  translateItineraryList: (itineraries: Itinerary[]) => Itinerary[];
  translateTimelineEra: (era: TimelineEra) => TimelineEra;
  getLocalizedField: <T extends Record<string, any>>(item: T, field: string) => any;
  formatCategory: (value: string) => string;
  formatType: (value: string) => string;
  formatVisibility: (value: string) => string;
  formatNeighborhood: (value: string) => string;
  formatServiceSubtype: (value: string) => string;
  formatForumCategory: (value: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("app_lang");
      if (saved === "it" || saved === "en") {
        return saved;
      }
    }
    return "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("app_lang", lang);
    }
  };

  const t = (key: string): string => {
    if (!key) return "";
    const trimmed = key.trim();
    const entry = translations[trimmed];
    if (entry) {
      return entry[language];
    }
    return key;
  };

  const translateArtwork = (art: Artwork): Artwork => {
    if (!art) return art;
    if (language === "it") {
      return {
        ...art,
        title: getLocalizedField(art, "title", "it"),
        description: getLocalizedField(art, "description", "it"),
        historical_context: getLocalizedField(art, "historical_context", "it") || getLocalizedField(art, "historicalContext", "it") || art.historical_context,
        material_short: getLocalizedField(art, "material_short", "it"),
        material_details: getLocalizedField(art, "material_details", "it"),
        reuse_context: getLocalizedField(art, "reuse_context", "it"),
        period: getLocalizedField(art, "period", "it")
      };
    }
    return art;
  };

  const translateArtworkList = (list: Artwork[]): Artwork[] => {
    if (!list) return list;
    return list.map(translateArtwork);
  };

  const translateItinerary = (itin: Itinerary): Itinerary => {
    if (!itin) return itin;
    if (language === "it") {
      return {
        ...itin,
        title: getLocalizedField(itin, "title", "it"),
        description: getLocalizedField(itin, "description", "it"),
        narrative: getLocalizedField(itin, "narrative", "it"),
        target: getLocalizedField(itin, "target", "it"),
        difficulty: getLocalizedField(itin, "difficulty", "it"),
        accessibility: getLocalizedField(itin, "accessibility", "it"),
        warnings: getLocalizedField(itin, "warnings", "it"),
        bestFor: getLocalizedField(itin, "bestFor", "it"),
        routeType: getLocalizedField(itin, "routeType", "it"),
      };
    }
    return itin;
  };

  const translateItineraryList = (list: Itinerary[]): Itinerary[] => {
    if (!list) return list;
    return list.map(translateItinerary);
  };

  const translateTimelineEra = (era: TimelineEra): TimelineEra => {
    if (!era) return era;
    if (language === "it") {
      return {
        ...era,
        title: getLocalizedField(era, "title", "it"),
        description: getLocalizedField(era, "description", "it"),
        interpretation: getLocalizedField(era, "interpretation", "it"),
      };
    }
    return era;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        translateArtwork,
        translateArtworkList,
        translateItinerary,
        translateItineraryList,
        translateTimelineEra,
        getLocalizedField: <T extends Record<string, any>>(item: T, field: string) => getLocalizedField(item, field, language),
        formatCategory: (value: string) => formatCategory(value, language),
        formatType: (value: string) => formatType(value, language),
        formatVisibility: (value: string) => formatVisibility(value, language),
        formatNeighborhood: (value: string) => formatNeighborhood(value, language),
        formatServiceSubtype: (value: string) => formatServiceSubtype(value, language),
        formatForumCategory: (value: string) => formatForumCategory(value, language),
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
