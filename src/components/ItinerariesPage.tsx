import { motion, AnimatePresence } from "motion/react";
import { ARTWORKS, ITINERARIES } from "../constants";
import { ArrowLeft, Route, Clock, ChevronRight, Layers, Volume2, List } from "lucide-react";
import { Map } from "./Map";
import { useState, useMemo, useEffect, useRef } from "react";
import { Artwork, Itinerary } from "../types";

interface ItinerariesPageProps {
  onBack: () => void;
  onSelectArtwork: (artwork: Artwork) => void;
  selectedArtwork?: Artwork;
}

export function ItinerariesPage({ onBack, onSelectArtwork, selectedArtwork }: ItinerariesPageProps) {
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);
  const stopRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const activeArtworks = useMemo(() => {
    if (!selectedItinerary) return [];
    return selectedItinerary.artworkIds
      .map(id => ARTWORKS.find(a => a.id === id))
      .filter((a): a is Artwork => !!a);
  }, [selectedItinerary]);

  const itinerarySelectedArtwork = useMemo(() => {
  if (!selectedArtwork || !selectedItinerary) return undefined;

  return selectedItinerary.artworkIds.includes(selectedArtwork.id)
    ? selectedArtwork
    : undefined;
}, [selectedArtwork, selectedItinerary]);

  // Handle scrolling to selected artwork when it changes from map/other interactions
 useEffect(() => {
    if (itinerarySelectedArtwork) {
      const element = stopRefs.current[itinerarySelectedArtwork.id];

      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [itinerarySelectedArtwork]);

  const handleSelectItinerary = (itinerary: Itinerary) => {
    setSelectedItinerary(itinerary);
  };

  return (
    <div className="h-full w-full flex flex-col md:flex-row overflow-y-auto md:overflow-hidden bg-bg-canvas min-w-0 min-h-0">
      {/* Sidebar List */}
      <aside className="w-full md:w-[400px] border-b md:border-b-0 md:border-r border-border-color flex flex-col shrink-0 bg-white shadow-xl z-20 overflow-y-auto md:overflow-hidden">
        <AnimatePresence mode="wait">
          {!selectedItinerary ? (
            <motion.div 
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full"
            >
              <div className="p-6 md:p-8 border-b border-border-color">
                <button 
                  onClick={onBack}
                  className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-accent-gold mb-6 md:mb-8 hover:-translate-x-2 transition-transform"
                >
                  <ArrowLeft size={16} /> Back to Home
                </button>
                <h1 className="font-serif text-3xl md:text-4xl italic mb-2">Curated Itineraries</h1>
                <p className="text-text-light uppercase tracking-[2px] text-xs">Guided narrative itineraries</p>
              </div>

              <div className="flex-grow overflow-y-auto p-4 sidebar-scroll space-y-4">
                {ITINERARIES.map((itinerary) => (
                  <div 
                    key={itinerary.id}
                    onClick={() => handleSelectItinerary(itinerary)}
                    className="p-4 md:p-6 border border-border-color rounded-sm cursor-pointer transition-all hover:border-accent-gold/40 hover:bg-bg-canvas"
                  >
                    <h3 className="font-serif text-xl md:text-2xl mb-2">{itinerary.title}</h3>
                    <p className="text-sm text-text-light line-clamp-2 mb-4 leading-relaxed">{itinerary.description}</p>
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-bold opacity-60">
                      <span className="flex items-center gap-1"><Clock size={12} /> {itinerary.duration}</span>
                      <span className="flex items-center gap-1"><Route size={12} /> {itinerary.artworkIds.length} Stops</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full overflow-y-auto sidebar-scroll"
            >
              <div className="p-6 md:p-8 border-b border-border-color">
                <button 
                  onClick={() => setSelectedItinerary(null)}
                  className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-accent-gold mb-6 md:mb-8 hover:-translate-x-2 transition-transform bg-accent-gold/10 px-4 py-2 rounded-full"
                >
                  <ArrowLeft size={16} /> Back to full list
                </button>
                
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="font-serif text-2xl md:text-3xl italic text-accent-gold leading-tight break-words">{selectedItinerary.title}</h2>
                  <button 
                    className="p-2 bg-accent-gold/10 text-accent-gold rounded-full hover:bg-accent-gold hover:text-white transition-all shrink-0"
                    title="Listen to introduction"
                  >
                    <Volume2 size={18} />
                  </button>
                </div>
                <p className="text-sm text-text-light leading-relaxed font-light italic mb-6 break-words whitespace-normal">
                  {selectedItinerary.narrative || selectedItinerary.description}
                </p>
                
                <button 
                  onClick={() => activeArtworks[0] && onSelectArtwork(activeArtworks[0])}
                  className="w-full py-3 bg-sidebar-bg text-accent-gold font-bold uppercase tracking-[2px] text-[10px] rounded hover:bg-black transition-colors flex items-center justify-center gap-2"
                >
                  <Route size={14} /> Start Itinerary
                </button>
              </div>

              <div className="p-6 md:p-8">
                <p className="text-[10px] uppercase tracking-widest font-black text-text-main mb-6 flex items-center gap-2">
                  <Layers size={12} className="text-accent-gold" /> Journey Map
                </p>
                
                <div className="relative pl-4 border-l border-border-color space-y-8">
                  {activeArtworks.map((artwork, idx) => (
                    <div 
                      key={artwork.id} 
                      className="relative"
                      ref={el => stopRefs.current[artwork.id] = el}
                    >
                      {/* Dot */}
                      <div className={`absolute -left-[21px] top-4 w-2 h-2 rounded-full border-2 border-white ring-4 ring-bg-canvas z-10 ${
                        selectedArtwork?.id === artwork.id ? 'bg-accent-gold scale-125' : 'bg-border-color'
                      }`} />
                      
                      {/* Stop Card */}
                      <div 
                        onClick={() => onSelectArtwork(artwork)}
                        className={`group cursor-pointer p-3 md:p-4 rounded-sm border transition-all shadow-sm hover:shadow-md ${
                          itinerarySelectedArtwork?.id === artwork.id
                            ? 'bg-white border-accent-gold shadow-lg ring-1 ring-accent-gold/20' 
                            : 'bg-bg-canvas border-transparent hover:border-accent-gold/30 hover:bg-white'
                        }`}
                      >
                        <div className="flex gap-4 items-center min-w-0">
                         <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-sm border border-border-color flex-shrink-0 flex items-center justify-center overflow-hidden thumb-img">
                            {artwork.thumbnail_url || artwork.image_url ? (
                              <img
                                src={artwork.thumbnail_url || artwork.image_url}
                                alt={artwork.image_alt || artwork.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-[6px] uppercase tracking-tighter text-text-light/40 text-center">
                                Stop {idx + 1}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-grow">
                             <div className="flex items-center gap-2 mb-1">
                               <span className={`text-[10px] font-mono font-bold leading-none ${
                                 itinerarySelectedArtwork?.id === artwork.id? 'text-accent-gold' : 'text-text-light'
                               }`}>0{idx + 1}</span>
                               <h4 className={`text-xs font-bold uppercase tracking-tight transition-colors truncate ${
                                 itinerarySelectedArtwork?.id === artwork.id ? 'text-accent-gold' : 'group-hover:text-accent-gold text-text-main'
                               }`}>{artwork.title}</h4>
                               <Volume2 size={10} className="text-accent-gold/40 shrink-0" />
                             </div>
                             <p className="text-[9px] text-text-light uppercase tracking-tighter mb-1 truncate">{artwork.artist}</p>
                             <span className="text-[8px] uppercase tracking-widest font-bold opacity-40 px-1.5 py-0.5 bg-sidebar-bg/5 rounded">{artwork.type}</span>
                          </div>
                        </div>
                      </div>

                      {/* Walking Time Connecting Segment */}
                      {idx < activeArtworks.length - 1 && (
                        <div className="absolute left-[-17px] top-[calc(100%+8px)] h-4 flex items-center text-[9px] font-black text-accent-gold/40 gap-1 italic whitespace-nowrap">
                          <Clock size={10} /> {selectedItinerary.walkingTimes?.[idx] || "10 min"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>

      {/* Map View */}
      <main className="flex-grow min-h-[40vh] md:min-h-0 relative min-w-0 overflow-hidden shrink-0">
       <Map 
          artworks={selectedItinerary ? activeArtworks : ARTWORKS} 
          activeItineraryIds={selectedItinerary?.artworkIds}
          onArtworkSelect={onSelectArtwork}
          selectedArtwork={itinerarySelectedArtwork}
          showFilters={false}
          selectionOffsetX={window.innerWidth < 768 ? 0 : 260}
        />
        
        {!selectedItinerary && (
          <div className="absolute inset-0 z-[1002] bg-sidebar-bg/10 backdrop-blur-sm flex items-center justify-center pointer-events-none p-4">
             <div className="bg-white p-6 md:p-8 border border-border-color shadow-2xl text-center max-w-sm pointer-events-auto">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-accent-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Route size={32} className="text-accent-gold" />
                </div>
                <h3 className="font-serif text-2xl md:text-3xl italic mb-2 break-words">Select an itinerary</h3>
                <p className="text-sm text-text-light leading-relaxed mb-6 whitespace-normal">Choose a path from the list to view stops and narrative details.</p>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => {}} // Visual prompt
                    className="md:hidden w-full py-3 bg-sidebar-bg text-accent-gold font-bold uppercase tracking-widest text-[10px] rounded animate-pulse"
                  >
                    Scroll for itinerary list &uarr;
                  </button>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
