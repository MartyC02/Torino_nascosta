import { motion } from "motion/react";
import { ARTWORKS, TIMELINE_ERAS } from "../constants";
import { ArrowLeft, Clock, Info } from "lucide-react";

interface TimelineProps {
  onBack: () => void;
  onSelectArtwork: (id: string) => void;
}

export function Timeline({ onBack, onSelectArtwork }: TimelineProps) {
  return (
    <div className="min-h-screen bg-[#f3f1ec] p-6 md:p-16 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-accent-gold mb-12 hover:-translate-x-2 transition-transform"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        <header className="mb-12 md:mb-24 text-center md:text-left max-w-2xl">
          <h1 className="font-serif text-4xl md:text-6xl italic mb-6 leading-tight">Heritage Timeline</h1>
          <p className="text-text-light uppercase tracking-[2px] md:tracking-[3px] text-xs md:text-sm font-medium">A chronological narrative of Turin's urban transformations</p>
          <div className="h-0.5 w-24 bg-accent-gold mt-6 md:mt-8 mx-auto md:mx-0" />
        </header>

        <div className="space-y-24 md:space-y-40">
          {TIMELINE_ERAS.map((era, eraIndex) => (
            <section key={era.id} className="relative">
              {/* ERA HEADER */}
              <div className="flex flex-col md:flex-row gap-12 items-start mb-16 px-4 md:px-0">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="w-full md:w-1/2 aspect-[16/9] bg-sidebar-bg/5 overflow-hidden border border-border-color shadow-2xl relative"
                >
                  <img 
                    src={era.image_url} 
                    alt={era.image_alt}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                  />
                  <div className="absolute top-4 left-4 bg-accent-gold text-white px-4 py-1 text-[10px] font-bold uppercase tracking-widest">
                    Era {eraIndex + 1}
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="w-full md:w-1/2"
                >
                  <span className="text-accent-gold font-serif text-2xl md:text-3xl italic mb-2 block">{era.dateLabel}</span>
                  <h2 className="font-serif text-3xl md:text-4xl mb-6">{era.title}</h2>
                  <p className="text-text-main leading-relaxed mb-6 italic opacity-80">
                    {era.description}
                  </p>
                  <div className="bg-white/50 backdrop-blur-sm p-6 border-l-4 border-accent-gold shadow-sm">
                    <p className="text-sm font-medium text-text-light leading-relaxed flex gap-3">
                      <Info size={18} className="shrink-0 text-accent-gold mt-0.5" />
                      <span>{era.interpretation}</span>
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* ARTWORKS LIST FOR THIS ERA */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:pl-12 border-l-2 border-accent-gold/20 ml-4 md:ml-0">
                {era.artworkIds.map((artworkId, artIndex) => {
                  const artwork = ARTWORKS.find(a => a.id === artworkId);
                  if (!artwork) return null;

                  return (
                    <motion.div
                      key={artwork.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * artIndex }}
                      onClick={() => onSelectArtwork(artwork.id)}
                      className="group cursor-pointer"
                    >
                      <div className="bg-white p-6 border border-border-color shadow-sm transition-all hover:shadow-xl hover:border-accent-gold/40 h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-[10px] font-mono p-1 bg-accent-gold/10 text-accent-gold font-bold">
                            {artwork.year || "Antica"}
                          </span>
                          <span className="text-[9px] uppercase tracking-widest font-bold text-text-light/60">
                            {artwork.category}
                          </span>
                        </div>
                        <h3 className="font-serif text-xl mb-3 group-hover:text-accent-gold transition-colors">{artwork.title}</h3>
                        <p className="text-xs text-text-light leading-relaxed line-clamp-3 mb-6 flex-grow">
                          {artwork.description}
                        </p>
                        <div className="flex justify-between items-center text-[9px] uppercase tracking-widest font-bold opacity-60 group-hover:opacity-100 transition-opacity">
                          <span className="truncate max-w-[120px]">{artwork.artist}</span>
                          <span className="text-accent-gold flex items-center gap-1">
                            Explore <Clock size={10} className="inline" />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* CONNECTING LINE TO NEXT ERA (if not last) */}
              {eraIndex < TIMELINE_ERAS.length - 1 && (
                <div className="absolute left-[17px] md:-left-[2px] bottom-[-160px] h-40 w-0.5 bg-gradient-to-b from-accent-gold/20 to-accent-gold/20" />
              )}
            </section>
          ))}
        </div>

        <footer className="mt-40 pt-20 border-t border-border-color text-center opacity-40">
          <p className="text-[10px] uppercase tracking-[4px] font-bold">
            Urban Memory Archive &bull; Torino
          </p>
        </footer>
      </div>
    </div>
  );
}
