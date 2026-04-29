import { useEffect, useState, createElement, FormEvent } from "react";
import { HomePage } from "./components/HomePage";
import { Map } from "./components/Map";
import { Timeline } from "./components/Timeline";
import { ItinerariesPage } from "./components/ItinerariesPage";
import { ComparisonSlider } from "./components/ComparisonSlider";
import { ARTWORKS } from "./constants";
import { motion, AnimatePresence } from "motion/react";
import { Artwork } from "./types";

// @ts-ignore
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// @ts-ignore
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

import {
  BookOpen,
  Layers,
  RefreshCw,
  MessageSquare,
  Send,
  Volume2,
} from "lucide-react";

type Page = "home" | "explore" | "timeline" | "itineraries";

type VisitorNote = {
  id: string;
  text: string;
  createdAt: string;
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [showDetail, setShowDetail] = useState(false);

 
  const navigateToPage = (page: Page) => {
    setCurrentPage(page);
    setShowDetail(false);
    setSelectedArtwork(null);
  };

  const handleSelectArtwork = (artwork: Artwork) => {
    setSelectedArtwork(artwork);
    setShowDetail(true);
  };

  const handleSelectArtworkById = (id: string) => {
    const artwork = ARTWORKS.find((a) => a.id === id);

    if (artwork) {
      setSelectedArtwork(artwork);
      setShowDetail(true);
      setCurrentPage("explore");
    }
  };

  const handleMarkerClick = () => {
    setShowDetail(false);
  };

  const [noteText, setNoteText] = useState("");
  const [visitorNotes, setVisitorNotes] = useState<VisitorNote[]>([]);

  const fetchNotes = async (artworkId: string) => {
    const { data, error } = await supabase
      .from("visitor_notes")
      .select("*")
      .eq("artwork_id", artworkId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setVisitorNotes(data.map((item: any) => ({
        id: item.id.toString(),
        text: item.text,
        createdAt: new Date(item.created_at).toLocaleString("it-IT")
      })));
    }
  };

  useEffect(() => {
    if (selectedArtwork) {
      fetchNotes(selectedArtwork.id);
    } else {
      setVisitorNotes([]);
    }
  }, [selectedArtwork]);

  const handleSubmitNote = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    
    if (!selectedArtwork) return;
    const cleanText = noteText.trim();
    if (!cleanText) return;

    try {
      const { data, error } = await supabase
        .from("visitor_notes")
        .insert([{ 
          text: cleanText,
          artwork_id: selectedArtwork.id 
        }])
        .select();

      if (error) {
        throw error;
      }

      if (data && data[0]) {
        const newNode: VisitorNote = {
          id: data[0].id.toString(),
          text: data[0].text,
          createdAt: new Date(data[0].created_at).toLocaleString("it-IT"),
        };

        setVisitorNotes((prev) => [newNode, ...prev]);
        setNoteText("");
      }
    } catch (error) {
      console.error("Errore critico Supabase:", error);
    }
  };

const [viewportWidth, setViewportWidth] = useState(window.innerWidth);

useEffect(() => {
  const handleResize = () => {
    setViewportWidth(window.innerWidth);
  };

  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);

const isMobile = viewportWidth < 768;
const isItinerariesPage = currentPage === "itineraries";

const detailDrawerOffset =
  currentPage === "explore" ? (isMobile ? 0 : 96) : 0;

const detailDrawerWidth = isMobile
  ? "100%"
  : isItinerariesPage
    ? "min(520px, 38vw)"
    : "min(600px, 100vw)";

const exploreDrawerWidthPx = isMobile ? viewportWidth : Math.min(600, viewportWidth);

const mapDetailOffsetX =
  currentPage === "explore" && showDetail && selectedArtwork && !isMobile
    ? exploreDrawerWidthPx / 2
    : 0;
  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-bg-canvas text-text-main font-sans overflow-hidden">
      {/* PERSISTENT GLOBAL NAVIGATION */}
      <aside className="fixed bottom-0 left-0 w-full h-[70px] md:relative md:w-[80px] md:h-full bg-sidebar-bg flex md:flex-col items-center justify-around md:justify-start py-0 md:py-8 border-t md:border-t-0 md:border-r border-sidebar-bg shrink-0 z-50">
        <div className="hidden md:block mb-12">
          <div className="w-10 h-10 bg-accent-gold rounded-full flex items-center justify-center font-serif italic text-sidebar-bg text-xl font-bold">
            T
          </div>
        </div>

        <div className="flex md:flex-col gap-2 md:gap-6 w-full md:w-auto justify-around items-center px-4 md:px-0">
          {(["home", "explore", "itineraries", "timeline"] as const).map(
            (p) => (
              <button
                key={p}
                onClick={() => {
                  navigateToPage(p);
                }}
                className={`p-3 md:p-4 rounded-xl transition-all flex flex-col items-center gap-1 ${
                  currentPage === p
                    ? "bg-accent-gold text-sidebar-bg scale-110 md:shadow-lg"
                    : "text-white/40 hover:text-white"
                }`}
              >
                {p === "home" && <BookOpen size={20} />}
                {p === "explore" && <Layers size={20} />}
                {p === "itineraries" && <RefreshCw size={21} />}
                {p === "timeline" && <BookOpen size={20} className="rotate-90 md:rotate-0" />}
                <span className="text-[8px] md:hidden uppercase tracking-tighter opacity-70">{p}</span>
              </button>
            )
          )}
        </div>

        <div className="hidden md:block mt-auto text-[10px] text-white/20 vertical-rl transform rotate-180 uppercase tracking-widest font-black py-4">
          Torino &bull; Patrimonio
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-grow flex overflow-hidden relative min-w-0 pb-[70px] md:pb-0">
        <AnimatePresence mode="wait">
          {currentPage === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full overflow-auto"
            >
              <HomePage
                onNavigate={(page) => navigateToPage(page)}
                onSelectArtwork={handleSelectArtworkById}
              />
            </motion.div>
          )}

          {currentPage === "explore" && (
            <motion.div
              key="explore"
              className="w-full flex overflow-hidden relative min-w-0"
            >
              <main className="flex-grow relative min-w-0">
                <Map
                  artworks={ARTWORKS}
                  selectedArtwork={selectedArtwork || undefined}
                  selectionOffsetX={mapDetailOffsetX}
                  onArtworkSelect={handleSelectArtwork}
                  onMarkerClick={handleMarkerClick}
                  containerSizeChanged={showDetail}
                />
              </main>
            </motion.div>
          )}

         {currentPage === "itineraries" && (
          <motion.div 
            key="itineraries" 
            className="w-full h-full flex overflow-hidden min-w-0 min-h-0"
          >
            <ItinerariesPage
              onBack={() => navigateToPage("home")}
              onSelectArtwork={handleSelectArtwork}
              selectedArtwork={selectedArtwork || undefined}
            />
          </motion.div>
        )}

          {currentPage === "timeline" && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full overflow-auto"
            >
              <Timeline
                onBack={() => navigateToPage("home")}
                onSelectArtwork={handleSelectArtworkById}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* DETAIL DRAWER */}
        <AnimatePresence>
          {showDetail && selectedArtwork && (
           <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 bg-white shadow-2xl z-[1000] flex flex-col border-l border-border-color"
              style={{
                top: detailDrawerOffset,
                height: `calc(100% - ${detailDrawerOffset}px)`,
                width: detailDrawerWidth,
              }}
            >
              <button
                onClick={() => setShowDetail(false)}
                className="close-panel-btn absolute top-[15px] right-[15px] z-[9999] w-12 h-12 bg-sidebar-bg text-accent-gold hover:bg-black rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 text-2xl font-bold border-2 border-accent-gold"
              >
                &times;
              </button>

              <div className="p-6 border-b border-border-color flex justify-between items-center bg-bg-canvas pr-16">
                <span className="text-[10px] uppercase tracking-widest font-black text-accent-gold">
                  Heritage Interface Model &bull; Konstantakis
                </span>
              </div>

              <div className="flex-grow overflow-y-auto sidebar-scroll">
                {/* HERO IMAGE / 3D MODEL / COMPARISON SLIDER */}
{selectedArtwork.model_url ? (
  <div className="w-full aspect-[16/10] bg-bg-canvas border-b border-border-color relative overflow-hidden">
    {createElement("model-viewer", {
      src: selectedArtwork.model_url,
      alt: selectedArtwork.image_alt || selectedArtwork.title,
      "camera-controls": "true",
      //"auto-rotate": "false",
      style: {
        width: "100%",
        height: "100%",
        backgroundColor: "#f3f1ec",
      },
    } as any)}
    <a
      href={selectedArtwork.model_url}
      download = "testa-rovesciata-david.glb"
      className="absolute top-4 left-6 z-20 px-3 py-1 bg-white/90 text-sidebar-bg text-[10px] uppercase tracking-widest font-bold border border-border-color hover:bg-accent-gold hover:text-white transition-colors"
    >
      Download 3D Model
    </a>
    
    <div className="absolute bottom-4 left-6 px-3 py-1 bg-accent-gold text-white text-[10px] uppercase tracking-widest font-bold">
      3D Model
    </div>
  </div>
) : selectedArtwork.before_image_url && selectedArtwork.after_image_url ? (
  <ComparisonSlider
    before={selectedArtwork.before_image_url}
    after={selectedArtwork.after_image_url}
    beforeAlt={
      selectedArtwork.before_image_alt ||
      `${selectedArtwork.title} prima`
    }
    afterAlt={
      selectedArtwork.after_image_alt ||
      `${selectedArtwork.title} oggi`
    }
  />
) : (
  <div className="w-full aspect-[16/10] bg-gray-100 border-b border-border-color relative detail-hero-img overflow-hidden">
    {selectedArtwork.image_url ? (
      <img
        src={selectedArtwork.image_url}
        alt={selectedArtwork.image_alt || selectedArtwork.title}
        className="w-full h-full object-cover"
      />
    ) : (
      <div className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-widest text-text-light/30">
        Hero Image Placeholder: {selectedArtwork.title}
      </div>
    )}

    <div className="absolute bottom-4 left-6 px-3 py-1 bg-accent-gold text-white text-[10px] uppercase tracking-widest font-bold">
      {selectedArtwork.category}
    </div>
  </div>
)}

                <div className={isItinerariesPage ? "p-6 md:p-7" : "p-6 md:p-10"}>
                  {selectedArtwork.id === "l-eco" && (
                    <div className="mb-10 w-full aspect-video bg-bg-canvas border border-border-color overflow-hidden shadow-inner">
                      <iframe
                        title="L'eco 3D Model"
                        className="w-full h-full"
                        src="https://sketchfab.com/models/01b90ee6c6e84294ae3cf726b7e83911/embed?autostart=1&camera=0"
                        allow="autoplay; fullscreen; xr-spatial-tracking"
                      />
                    </div>
                  )}

                  <header className="mb-12">
                    <span className="text-xs uppercase tracking-[3px] font-bold text-accent-gold/60 block mb-4">
                      Artwork File &bull; {selectedArtwork.type}
                    </span>

                    <div className="flex items-center gap-4 mb-4">
                     <h2 className={`font-serif italic leading-tight ${isItinerariesPage ? "text-3xl md:text-4xl" : "text-3xl md:text-5xl"}`}>
                        {selectedArtwork.title}
                      </h2>

                      <button
                        className="p-2 md:p-3 bg-accent-gold/10 text-accent-gold rounded-full hover:bg-accent-gold hover:text-white transition-all shadow-sm shrink-0"
                        title="Listen to the history"
                      >
                        <Volume2 size={24} />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs uppercase tracking-widest font-bold opacity-60">
                      <span>{selectedArtwork.artist}</span>
                      <span className="hidden sm:inline">&bull;</span>
                      <span className="text-accent-gold whitespace-nowrap">
                        {selectedArtwork.neighborhood}
                      </span>
                      <span className="hidden sm:inline">&bull;</span>
                      <span>{selectedArtwork.visibility}</span>

                      {selectedArtwork.year && (
                        <>
                          <span className="hidden sm:inline">&bull;</span>
                          <span>{selectedArtwork.year}</span>
                        </>
                      )}
                    </div>

                    <p className="mt-8 text-base md:text-lg text-text-light leading-relaxed font-light italic break-words">
                      "{selectedArtwork.description}"
                    </p>
                  </header>

                  <div className="space-y-12">
                    {/* DIMENSION 1 */}
                    <section>
                      <h3 className="flex items-center gap-2 text-xs uppercase tracking-[3px] font-bold text-accent-gold mb-6">
                        <BookOpen size={14} /> Dimension 1: Historical Layer
                      </h3>

                      <div className="bg-bg-canvas p-6 border-l-2 border-accent-gold text-text-main leading-relaxed break-words">
                        <span className="block text-[10px] font-bold uppercase mb-2 text-text-main opacity-40">
                          Historical Context
                        </span>

                        {selectedArtwork.historical_context}
                      </div>
                    </section>

                    {/* DIMENSION 2 */}
                    <section>
                      <h3 className="flex items-center gap-2 text-xs uppercase tracking-[3px] font-bold text-accent-gold mb-6">
                        <Layers size={14} /> Dimension 2: Material Layer
                      </h3>

                      <div className="bg-bg-canvas p-6 border-l-2 border-accent-gold italic text-text-light leading-relaxed break-words">
                        <span className="block text-[10px] font-bold uppercase mb-2 text-text-main opacity-40">
                          Materials & Conservation State
                        </span>

                        {selectedArtwork.material_details}
                      </div>
                    </section>

                    {/* DIMENSION 3 */}
                    <section>
                      <h3 className="flex items-center gap-2 text-xs uppercase tracking-[3px] font-bold text-accent-gold mb-6">
                        <RefreshCw size={14} /> Dimension 3: Reuse Layer
                      </h3>

                      <div className="bg-bg-canvas p-6 border-l-2 border-sidebar-bg text-text-main leading-relaxed break-words">
                        <span className="block text-[10px] font-bold uppercase mb-2 opacity-40 text-text-main">
                          Connection with Urban Reuse
                        </span>

                        {selectedArtwork.reuse_context}
                      </div>
                    </section>

                   {/* PARTICIPATORY ARCHIVE */}
                    <section className="pt-12 border-t border-border-color">
                      <h3 className="flex items-center gap-2 text-xs uppercase tracking-[3px] font-bold text-accent-gold mb-6">
                        <MessageSquare size={14} /> Model 3: Participatory Archive
                      </h3>

                      <div className="bg-white border border-border-color p-6 shadow-sm">
                        <p className="text-[11px] text-text-light mb-4 italic">
                          Contribute to the digital memory of this work. Leave a note, a memory, or a material observation.
                        </p>

                        <form 
                          onSubmit={handleSubmitNote}
                          className="flex flex-col sm:flex-row gap-2"
                        >
                          <input
                            type="text"
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Your reflection..."
                            className="flex-grow text-xs p-3 border border-border-color focus:border-accent-gold outline-none"
                          />

                          <button
                            type="submit"
                            className="p-3 bg-sidebar-bg text-accent-gold hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            disabled={!noteText.trim()}
                          >
                            <Send size={16} />
                            <span className="sm:hidden uppercase tracking-widest text-[10px] font-bold">Send</span>
                          </button>
                        </form>

                        {visitorNotes.length > 0 && (
                          <div className="mt-6 space-y-3">
                            <p className="text-[10px] uppercase tracking-[2px] font-bold text-text-main/40">
                              Visitor Notes
                            </p>

                            {visitorNotes.map((note) => (
                              <div
                                key={note.id}
                                className="bg-bg-canvas border-l-2 border-accent-gold p-4"
                              >
                                <p className="text-sm text-text-main leading-relaxed">
                                  {note.text}
                                </p>

                                <p className="mt-2 text-[10px] uppercase tracking-widest text-text-light/50">
                                  {note.createdAt}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}