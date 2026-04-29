import { motion } from "motion/react";
import { Search, Map as MapIcon, Calendar, Route } from "lucide-react";
import { ARTWORKS, ITINERARIES } from "../constants";

interface HomePageProps {
  onNavigate: (page: 'explore' | 'timeline' | 'itineraries') => void;
  onSelectArtwork: (id: string) => void;
}

export function HomePage({ onNavigate, onSelectArtwork }: HomePageProps) {
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
          <h1 className="font-serif text-5xl md:text-8xl italic text-accent-gold mb-6 tracking-tight leading-tight">
            Torino<br />Nascosta
          </h1>
         
          <p className="text-lg md:text-2xl font-light text-white/80 leading-relaxed italic mb-8 md:mb-12">
            Hidden Turin interprets the city as a widespread urban archive: not only famous monuments, but traces, wounds, reuses, and contemporary interventions that transform facades, squares, and neighborhoods into memory devices.
          </p>
        
          <h3 className="text-lg md:text-2xl font-light text-white/80 leading-relaxed italic mb-10"> Do you want to discover the secrets of Turin? </h3>
          <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6 w-full sm:w-auto px-4 md:px-0">
            <button 
               onClick={() => onNavigate('explore')}
              className="flex items-center justify-center gap-2 px-6 md:px-10 py-4 bg-accent-gold text-sidebar-bg font-bold uppercase tracking-widest text-sm rounded shadow-lg hover:bg-accent-gold/90 transition-all hover:scale-105"
            >
              <MapIcon size={18} /> Explore Map
            </button>
            <button 
              onClick={() => onNavigate('itineraries')}
              className="flex items-center justify-center gap-2 px-6 md:px-10 py-4 border border-white/30 text-white font-bold uppercase tracking-widest text-sm rounded hover:bg-white/10 transition-all hover:scale-105"
            >
              <Route size={18} /> Curated Itineraries
            </button>
          </div>
        </motion.div>
      </section>

      {/* Featured Artworks (Highlights) */}
      <section className="max-w-7xl w-full py-16 md:py-24 px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
          <h2 className="font-serif text-3xl md:text-4xl italic">Featured Artworks</h2>
          <button 
            onClick={() => onNavigate('explore')}
            className="text-xs uppercase tracking-[2px] font-bold text-accent-gold hover:underline"
          >
            Browse full archive
          </button>
        </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
  {ARTWORKS.slice(0, 3).map((artwork) => (
    <motion.div
      key={artwork.id}
      whileHover={{ y: -10 }}
      onClick={() => onSelectArtwork(artwork.id)}
      className="group cursor-pointer"
    >
      <div className="aspect-[3/4] bg-sidebar-bg/5 border border-border-color mb-4 overflow-hidden relative">
        {artwork.image_url || artwork.thumbnail_url ? (
          <img
            src={artwork.image_url || artwork.thumbnail_url}
            alt={artwork.image_alt || artwork.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-widest text-text-light/30">
            Immagine in arrivo
          </div>
        )}

        <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-sidebar-bg/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-white text-[10px] uppercase tracking-widest">
            {artwork.category}
          </span>
        </div>
      </div>

      <p className="text-[10px] text-accent-gold uppercase tracking-[2px] font-bold mb-1">
        {artwork.artist}
      </p>

      <h3 className="font-serif text-2xl group-hover:text-accent-gold transition-colors">
        {artwork.title}
      </h3>
    </motion.div>
  ))}
</div>
</section>

        {/* Quick Links */}
        <section className="w-full bg-[#f0ede8] border-y border-border-color py-24 px-6 flex flex-col items-center">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 text-center md:text-left">
          <div className="flex flex-col gap-4">
             <div className="w-12 h-12 bg-sidebar-bg text-accent-gold rounded flex items-center justify-center mx-auto md:mx-0">
               <Route size={24} />
             </div>
             <h3 className="font-serif text-3xl italic">Curated Itineraries</h3>
             <p className="text-text-light leading-relaxed">
               Follow guided paths designed by our experts to discover the city through historical and stylistic threads.
             </p>
             <button 
               onClick={() => onNavigate('itineraries')}
               className="text-xs uppercase tracking-[3px] font-black text-sidebar-bg mt-2 hover:text-accent-gold transition-colors flex items-center gap-2 justify-center md:justify-start"
             >
               View Paths <span>&rarr;</span>
             </button>
          </div>

          <div className="flex flex-col gap-4">
             <div className="w-12 h-12 bg-sidebar-bg text-accent-gold rounded flex items-center justify-center mx-auto md:mx-0">
               <Calendar size={24} />
             </div>
             <h3 className="font-serif text-3xl italic">Historical Timeline</h3>
             <p className="text-text-light leading-relaxed">
               A chronological journey through millennia of Turin's heritage history, from Roman times to the present.
             </p>
             <button 
               onClick={() => onNavigate('timeline')}
               className="text-xs uppercase tracking-[3px] font-black text-sidebar-bg mt-2 hover:text-accent-gold transition-colors flex items-center gap-2 justify-center md:justify-start"
             >
               Explore Timeline <span>&rarr;</span>
             </button>
          </div>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="w-full py-12 px-6 border-t border-border-color text-center opacity-40 text-[11px] uppercase tracking-widest font-medium">
          Department of Computer Science &bull; University of Turin &bull; curated by Martina Celli
      </footer>
    </div>
  );
}
