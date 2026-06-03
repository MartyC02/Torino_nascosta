import { useLanguage } from "./LanguageContext";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center bg-sidebar-bg/60 p-0.5 rounded-full border border-accent-gold/20 text-[10px] uppercase font-bold select-none h-fit min-w-fit">
      <button
        onClick={() => setLanguage("en")}
        className={`px-2.5 py-1 rounded-full transition-all duration-150 cursor-pointer font-bold ${
          language === "en"
            ? "bg-accent-gold text-sidebar-bg font-black font-sans"
            : "text-white/50 hover:text-white"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("it")}
        className={`px-2.5 py-1 rounded-full transition-all duration-150 cursor-pointer font-bold ${
          language === "it"
            ? "bg-accent-gold text-sidebar-bg font-black font-sans"
            : "text-white/50 hover:text-white"
        }`}
      >
        IT
      </button>
    </div>
  );
}
