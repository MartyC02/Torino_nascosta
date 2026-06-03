import { motion } from "motion/react";
import { Map as MapIcon, Calendar, Route, Heart } from "lucide-react";
import { useLanguage } from "./LanguageContext";

interface TopLikedArtwork {
  artwork: any;
  likes: number;
}

interface HomePageProps {
  onNavigate: (page: 'explore' | 'timeline' | 'itineraries') => void;
  onSelectArtwork: (id: string) => void;
  topLikedArtworks?: TopLikedArtwork[];
}

export function HomePage({ onNavigate, onSelectArtwork, topLikedArtworks }: HomePageProps) {
  const { t, translateArtwork } = useLanguage();

  // Safe default slice to fall back on if topLikedArtworks is somehow empty
  const masterpiecesToShow = topLikedArtworks && topLikedArtworks.length > 0 
    ? topLikedArtworks.slice(0, 4) 
    : [];

  return (
    <div className="min-h-screen bg-bg-canvas flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full flex flex-col items-center justify-center py-24 px-6 border-b border-border-color bg-sidebar-bg text-white relative overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-gold/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center z-10 max-w-4xl flex flex-col items-center"
        >
          <h1 className="font-serif text-5xl md:text-8xl italic text-accent-gold mb-6 tracking-tight leading-tight select-none">
            Torino<br />Nascosta
          </h1>
         
          <p className="text-lg md:text-2xl font-light text-white/80 leading-relaxed italic mb-8 md:mb-12">
            {t("Hidden Turin interprets the city as a widespread urban archive: not only famous monuments, but traces, wounds, reuses, and contemporary interventions that transform facades, squares, and neighborhoods into memory devices.")}
          </p>
        
          <h3 className="text-lg md:text-2xl font-light text-white/80 leading-relaxed italic mb-10">
            {t("Do you want to discover the secrets of Turin?")}
          </h3>
          <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6 w-full sm:w-auto px-4 md:px-0">
            <button 
              onClick={() => onNavigate('explore')}
              className="flex items-center justify-center gap-2 px-6 md:px-10 py-4 bg-accent-gold text-sidebar-bg font-bold uppercase tracking-widest text-sm rounded shadow-lg hover:bg-accent-gold/90 transition-all hover:scale-105 cursor-pointer"
            >
              <MapIcon size={18} /> {t("Explore Map")}
            </button>
            <button 
              onClick={() => onNavigate('itineraries')}
              className="flex items-center justify-center gap-2 px-6 md:px-10 py-4 border border-white/30 text-white font-bold uppercase tracking-widest text-sm rounded hover:bg-white/10 transition-all hover:scale-105 cursor-pointer"
            >
              <Route size={18} /> {t("Curated Itineraries")}
            </button>
          </div>
        </motion.div>
      </section>

      {/* Most Appreciated Artworks (Community Favorites) - Now taking the primary spotlight */}
      {masterpiecesToShow.length > 0 && (
        <section className="max-w-7xl w-full py-16 md:py-24 px-6 flex flex-col items-center">
          <div className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-[3px] font-black text-accent-gold block mb-2">Vox Populi</span>
                <h2 className="font-serif text-3xl md:text-4xl italic">
                  {t("Most Appreciated Masterpieces")}
                </h2>
              </div>
              <p className="text-xs text-text-light/70 uppercase tracking-[1px] max-w-xs md:text-right">
                {t("The hidden treasures of Turin voted and recorded by our visitor community.")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {masterpiecesToShow.map(({ artwork, likes }) => {
                const translated = translateArtwork(artwork);
                return (
                  <motion.div
                    key={translated.id}
                    whileHover={{ y: -6 }}
                    onClick={() => onSelectArtwork(translated.id)}
                    className="group cursor-pointer bg-white border border-border-color p-4 rounded flex flex-col justify-between h-full transition-all hover:shadow-xl hover:border-accent-gold/30 animate-fadeIn"
                  >
                    <div>
                      <div className="aspect-[16/10] bg-sidebar-bg/5 border border-border-color/60 mb-4 overflow-hidden relative rounded-sm">
                        {translated.image_url || translated.thumbnail_url ? (
                          <img
                            src={translated.image_url || translated.thumbnail_url}
                            alt={translated.image_alt || translated.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-[9px] uppercase tracking-widest text-[#1a1a1a]/25">
                            {t("Image coming soon")}
                          </div>
                        )}

                        {/* Likes Counter Overlay */}
                        <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-sm border border-border-color/50 text-[#A41034] text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm select-none">
                          <Heart size={11} fill="currentColor" />
                          <span>{likes}</span>
                        </div>
                      </div>

                      <p className="text-[9px] text-accent-gold uppercase tracking-[1.5px] font-bold mb-1 truncate">
                        {translated.artist || t("Unknown Artist")}
                      </p>

                      <h3 className="font-serif italic text-xl group-hover:text-accent-gold transition-colors line-clamp-2 leading-tight">
                        {translated.title}
                      </h3>
                    </div>

                    <div className="pt-4 mt-4 border-t border-border-color/40 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-text-light/60 group-hover:text-accent-gold transition-colors">
                      <span>{t("Discover Details")}</span>
                      <span>&rarr;</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Quick Links */}
      <section className="w-full bg-[#f0ede8] border-b border-border-color py-24 px-6 flex flex-col items-center">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 text-center md:text-left">
          <div className="flex flex-col gap-4">
             <div className="w-12 h-12 bg-sidebar-bg text-accent-gold rounded flex items-center justify-center mx-auto md:mx-0">
               <Route size={24} />
             </div>
             <h3 className="font-serif text-3xl italic">{t("Curated Itineraries")}</h3>
             <p className="text-text-light leading-relaxed">
               {t("Follow guided paths designed by our experts to discover the city through historical and stylistic threads.")}
             </p>
             <button 
               onClick={() => onNavigate('itineraries')}
               className="text-xs uppercase tracking-[3px] font-black text-sidebar-bg mt-2 hover:text-accent-gold transition-colors flex items-center gap-2 justify-center md:justify-start cursor-pointer"
             >
               {t("View Paths")} <span>&rarr;</span>
             </button>
          </div>

          <div className="flex flex-col gap-4">
             <div className="w-12 h-12 bg-sidebar-bg text-accent-gold rounded flex items-center justify-center mx-auto md:mx-0">
               <Calendar size={24} />
             </div>
             <h3 className="font-serif text-3xl italic">{t("Historical Timeline")}</h3>
             <p className="text-text-light leading-relaxed">
               {t("A chronological journey through millennia of Turin's heritage history, from Roman times to the present.")}
             </p>
             <button 
               onClick={() => onNavigate('timeline')}
               className="text-xs uppercase tracking-[3px] font-black text-sidebar-bg mt-2 hover:text-accent-gold transition-colors flex items-center gap-2 justify-center md:justify-start cursor-pointer"
             >
               {t("Explore Timeline")} <span>&rarr;</span>
             </button>
          </div>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="w-full py-12 px-6 border-t border-border-color text-center opacity-40 text-[11px] uppercase tracking-widest font-medium">
          {t("Department of Computer Science & University of Turin & curated by Martina Celli")}
      </footer>
    </div>
  );
}
