import { useEffect, useState, createElement, FormEvent, useMemo } from "react";
import { HomePage } from "./components/HomePage";
import { Map } from "./components/Map";
import { Timeline } from "./components/Timeline";
import { ItinerariesPage } from "./components/ItinerariesPage";
import { ComparisonSlider } from "./components/ComparisonSlider";
import { ARTWORKS } from "./constants";
import { motion, AnimatePresence } from "motion/react";
import { Artwork, ArtworkCategory, ArtworkType, Neighborhood, VisibilityLevel } from "./types";
import { ArtworkList } from "./components/ArtworkList";
import { useAuth } from "./components/AuthContext";
import { AuthModal } from "./components/AuthModal";
import { AccountPage } from "./components/AccountPage";
import { CommunityBoard } from "./components/CommunityBoard";

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
  Heart,
  Trash2,
} from "lucide-react";
import { useLanguage } from "./components/LanguageContext";
import { LanguageToggle } from "./components/LanguageToggle";

type Page = "home" | "explore" | "timeline" | "itineraries" | "account" | "community";

export default function App() {
  const { user, profile, signOut } = useAuth();
  const { t, translateArtwork, translateArtworkList, formatCategory, formatType, formatVisibility, formatNeighborhood } = useLanguage();
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const activeArtwork = useMemo(() => {
    return selectedArtwork ? translateArtwork(selectedArtwork) : null;
  }, [selectedArtwork, translateArtwork]);
  const [showDetail, setShowDetail] = useState(false);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  const [likesMap, setLikesMap] = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    ARTWORKS.forEach(art => {
      counts[art.id] = 0;
    });
    return counts;
  });
  const [likedArtworks, setLikedArtworks] = useState<string[]>([]);

  const fetchLikes = async (activeUserId?: string) => {
    try {
      if (!supabase) return;
      const { data, error } = await supabase
        .from("artwork_likes")
        .select("artwork_id, user_id");

      if (error) throw error;

      if (data) {
        const counts: Record<string, number> = {};
        ARTWORKS.forEach(art => {
          counts[art.id] = 0;
        });
        data.forEach((row: any) => {
          if (row.artwork_id) {
            counts[row.artwork_id] = (counts[row.artwork_id] || 0) + 1;
          }
        });
        setLikesMap(counts);

        if (activeUserId) {
          const userLiked = data
            .filter((row: any) => row.user_id === activeUserId)
            .map((row: any) => row.artwork_id);
          setLikedArtworks(userLiked);
        } else {
          setLikedArtworks([]);
        }
      }
    } catch (err) {
      console.error("Errore nel recupero della mappa dei like:", err);
    }
  };

  const handleToggleLike = async (artworkId: string) => {
    if (!user) {
      setAuthModalMode("login");
      setShowAuthModal(true);
      return;
    }
    const isLiked = likedArtworks.includes(artworkId);

    const originalLiked = [...likedArtworks];
    const originalLikesMap = { ...likesMap };

    let updatedLiked = [...originalLiked];
    let updatedLikesMap = { ...originalLikesMap };

    if (isLiked) {
      updatedLiked = updatedLiked.filter(id => id !== artworkId);
      updatedLikesMap[artworkId] = Math.max(0, (updatedLikesMap[artworkId] || 1) - 1);
    } else {
      updatedLiked.push(artworkId);
      updatedLikesMap[artworkId] = (updatedLikesMap[artworkId] || 0) + 1;
    }

    setLikedArtworks(updatedLiked);
    setLikesMap(updatedLikesMap);

    try {
      if (isLiked) {
        const { error } = await supabase
          .from("artwork_likes")
          .delete()
          .eq("artwork_id", artworkId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("artwork_likes")
          .insert([{ artwork_id: artworkId, user_id: user.id }]);

        if (error) {
          if (error.code !== "23505") throw error;
        }
      }
      fetchLikes(user.id);
    } catch (error) {
      console.error("Errore durante il salvataggio del like:", error);
      setLikedArtworks(originalLiked);
      setLikesMap(originalLikesMap);
    }
  };

  const topLikedArtworks = useMemo(() => {
    return [...ARTWORKS]
      .map(art => ({
        artwork: art,
        likes: likesMap[art.id] || 0
      }))
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 4);
  }, [likesMap]);

  // Filter & view mode state
  const [activeCategory, setActiveCategory] = useState<ArtworkCategory | 'all'>('all');
  const [activeType, setActiveType] = useState<ArtworkType | 'all'>('all');
  const [activeNeighborhood, setActiveNeighborhood] = useState<Neighborhood | 'all'>('all');
  const [activeVisibility, setActiveVisibility] = useState<VisibilityLevel | 'all'>('all');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  const filteredArtworks = useMemo(() => {
    const rawFiltered = ARTWORKS.filter(a => {
      const matchCat = activeCategory === 'all' || a.category === activeCategory;
      const matchType = activeType === 'all' || a.type === activeType;
      const matchNeigh = activeNeighborhood === 'all' || a.neighborhood === activeNeighborhood;
      const matchVis = activeVisibility === 'all' || a.visibility === activeVisibility;
      return matchCat && matchType && matchNeigh && matchVis;
    });
    return translateArtworkList(rawFiltered);
  }, [activeCategory, activeType, activeNeighborhood, activeVisibility, translateArtworkList]);

  const FilterPills = ({ 
    label, 
    options, 
    activeValue, 
    onChange 
  }: { 
    label: string, 
    options: string[], 
    activeValue: string, 
    onChange: (val: any) => void 
  }) => {
    const getLabel = (opt: string) => {
      if (opt === 'all') return t('All');
      if (label === 'Category') {
        return formatCategory(opt);
      }
      if (label === 'Type') {
        return formatType(opt);
      }
      if (label === 'Neighborhood') {
        return formatNeighborhood(opt);
      }
      if (label === 'Visibility') {
        return formatVisibility(opt);
      }
      return opt;
    };

    return (
      <div className="flex flex-col gap-1.5 min-w-fit pr-8 border-r border-border-color last:border-0 last:pr-0">
        <span className="text-[10px] uppercase tracking-[1px] font-black text-text-light/50 pl-1">{t(label)}</span>
        <div className="flex gap-2">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold transition-all border cursor-pointer ${
                activeValue === opt 
                  ? "bg-accent-gold border-accent-gold text-white shadow-md shadow-accent-gold/20" 
                  : "bg-white border-border-color text-text-light hover:border-accent-gold/40 hover:text-accent-gold"
              }`}
            >
              {getLabel(opt)}
            </button>
          ))}
        </div>
      </div>
    );
  };

 
  const navigateToPage = (page: Page) => {
    setCurrentPage(page);
    setShowDetail(false);
    setSelectedArtwork(null);
  };

  const handleSelectArtwork = (artwork: Artwork, autoShowDetail = true) => {
    setSelectedArtwork(artwork);
    setShowDetail(autoShowDetail);
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
  const [artworkComments, setArtworkComments] = useState<any[]>([]);
  const [userStatuses, setUserStatuses] = useState<Record<string, "to_visit" | "visited">>({});

  const fetchComments = async (artworkId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("artwork_comments")
        .select(`
          id,
          artwork_id,
          user_id,
          body,
          created_at,
          profiles (
            first_name,
            last_name
          )
        `)
        .eq("artwork_id", artworkId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setArtworkComments(data);
      }
    } catch (e) {
      console.error("Errore nel recupero dei commenti:", e);
    }
  };

  const handleAddComment = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!user) {
      setAuthModalMode("login");
      setShowAuthModal(true);
      return;
    }
    if (!selectedArtwork) return;
    const cleanText = noteText.trim();
    if (!cleanText) return;

    try {
      const { data, error } = await supabase
        .from("artwork_comments")
        .insert([{
          artwork_id: selectedArtwork.id,
          user_id: user.id,
          body: cleanText
        }])
        .select(`
          id,
          artwork_id,
          user_id,
          body,
          created_at,
          profiles (
            first_name,
            last_name
          )
        `);

      if (!error && data && data[0]) {
        setArtworkComments((prev) => [data[0], ...prev]);
        setNoteText("");
      } else if (error) {
        console.error("Errore nel salvataggio del commento:", error);
      }
    } catch (e) {
      console.error("Errore durante l'aggiunta del commento:", e);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from("artwork_comments")
        .delete()
        .eq("id", commentId);

      if (!error) {
        setArtworkComments((prev) => prev.filter(c => c.id !== commentId));
      }
    } catch (e) {
      console.error("Errore durante la cancellazione del commento:", e);
    }
  };

  const fetchUserStatuses = async (userId: string) => {
    if (!supabase || !userId) {
      setUserStatuses({});
      return;
    }
    try {
      const { data, error } = await supabase
        .from("user_artwork_status")
        .select("artwork_id, status")
        .eq("user_id", userId);

      if (!error && data) {
        const statuses: Record<string, "to_visit" | "visited"> = {};
        data.forEach((row: any) => {
          statuses[row.artwork_id] = row.status as "to_visit" | "visited";
        });
        setUserStatuses(statuses);
      }
    } catch (e) {
      console.error("Errore nel recupero degli stati delle opere:", e);
    }
  };

  const handleSetStatus = async (artworkId: string, status: "to_visit" | "visited") => {
    if (!user) {
      setAuthModalMode("login");
      setShowAuthModal(true);
      return;
    }

    try {
      // Optimistic update
      setUserStatuses((prev) => ({
        ...prev,
        [artworkId]: status
      }));

      const { error } = await supabase
        .from("user_artwork_status")
        .upsert({
          user_id: user.id,
          artwork_id: artworkId,
          status: status,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Errore nel salvataggio dello stato opera:", error);
      if (user?.id) fetchUserStatuses(user.id);
    }
  };

  useEffect(() => {
    if (selectedArtwork) {
      fetchComments(selectedArtwork.id);
    } else {
      setArtworkComments([]);
    }
  }, [selectedArtwork]);

  useEffect(() => {
    fetchLikes(user?.id);
    if (user?.id) {
      fetchUserStatuses(user.id);
    } else {
      setUserStatuses({});
    }
  }, [user]);

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
          {(["home", "explore", "itineraries", "community", "timeline"] as const).map(
            (p) => {
              const getPageName = (page: Page) => {
                const names: Record<Page, string> = {
                  home: t("Home"),
                  explore: t("Explore"),
                  itineraries: t("Itineraries"),
                  community: t("Community"),
                  timeline: t("Timeline"),
                  account: t("Account")
                };
                return names[page] || page;
              };
              return (
                <button
                  key={p}
                  onClick={() => {
                    navigateToPage(p);
                  }}
                  className={`p-3 md:p-4 rounded-xl transition-all flex flex-col items-center gap-1 relative ${
                    currentPage === p
                      ? "bg-accent-gold text-sidebar-bg scale-110 md:shadow-lg"
                      : "text-white/40 hover:text-white"
                  }`}
                  title={getPageName(p)}
                >
                  {p === "home" && <BookOpen size={20} />}
                  {p === "explore" && <Layers size={20} />}
                  {p === "itineraries" && <RefreshCw size={21} />}
                  {p === "community" && <MessageSquare size={20} />}
                  {p === "timeline" && <BookOpen size={20} className="rotate-90 md:rotate-0" />}
                  <span className="text-[8px] md:hidden uppercase tracking-tighter opacity-70">{getPageName(p)}</span>
                </button>
              );
            }
          )}
        </div>

        <div className="hidden md:block mt-auto text-[10px] text-white/20 vertical-rl transform rotate-180 uppercase tracking-widest font-black py-4">
          Torino &bull; Patrimonio
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-grow flex flex-col overflow-hidden relative min-w-0 pb-[70px] md:pb-0">
        
        {/* HEADER / NAVBAR */}
        <header className="bg-sidebar-bg text-white border-b border-white/10 px-4 md:px-8 py-3.5 shrink-0 flex items-center justify-between z-40 shadow-sm leading-none h-[64px]">
          <div className="flex items-center gap-4">
            <span className="font-serif italic font-semibold text-xl text-accent-gold select-none">
              Torino Nascosta
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <LanguageToggle />
            {profile ? (
              <div className="flex items-center gap-3 md:gap-5">
                <span className="text-xs font-semibold text-white/90">
                  {t("Hello,")} <span className="text-accent-gold">{profile.first_name || 'User'}</span>
                </span>
                
                <button
                  onClick={() => navigateToPage("account")}
                  className={`px-3 py-1.5 rounded-sm text-[10px] uppercase tracking-widest font-bold border transition-all cursor-pointer ${
                    currentPage === "account"
                      ? "bg-accent-gold border-accent-gold text-sidebar-bg"
                      : "border-white/20 text-white/85 hover:border-accent-gold hover:text-accent-gold"
                  }`}
                >
                  {t("Account")}
                </button>
                
                <button
                  onClick={() => signOut()}
                  className="px-3 py-1.5 rounded-sm text-[10px] uppercase tracking-widest font-bold border border-transparent text-[#A41034] hover:bg-white/5 transition-all cursor-pointer"
                >
                  {t("Logout")}
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthModalMode("login");
                  setShowAuthModal(true);
                }}
                className="px-4 py-2 bg-accent-gold text-sidebar-bg rounded-sm text-[10px] uppercase tracking-widest font-black shadow hover:bg-accent-gold/90 transition-all hover:scale-105 cursor-pointer leading-none"
              >
                {t("Login")}
              </button>
            )}
          </div>
        </header>

        {/* PAGES CONTAINER */}
        <div className="flex-grow flex overflow-hidden relative min-w-0 min-h-0">
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
                topLikedArtworks={topLikedArtworks}
              />
            </motion.div>
          )}

          {currentPage === "explore" && (
            <motion.div
              key="explore"
              className="w-full h-full flex flex-col overflow-hidden relative min-w-0"
            >
              {/* SHARED FILTER & TOGGLE BAR */}
              <div className="bg-white border-b border-border-color px-4 md:px-6 py-2 md:py-3 z-[900] shadow-sm overflow-x-auto hide-scrollbar w-full max-w-full box-border shrink-0">
                <div className="flex gap-4 md:gap-6 items-center w-max min-w-max flex-nowrap whitespace-nowrap pr-12">
                  
                  {/* VIEW MODE TOGGLE BUTTONS */}
                  <div className="flex flex-col gap-1.5 min-w-fit pr-8 border-r border-border-color">
                    <span className="text-[10px] uppercase tracking-[1px] font-black text-text-light/50 pl-1">{t("VIEW MODE")}</span>
                    <div className="flex bg-bg-canvas p-1 rounded-full border border-border-color">
                      <button
                        onClick={() => {
                          setViewMode('map');
                          setSelectedArtwork(null);
                          setShowDetail(false);
                        }}
                        className={`px-4 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold transition-all border-0 cursor-pointer ${
                          viewMode === 'map'
                            ? "bg-[#1a1a1a] text-accent-gold shadow-sm"
                            : "text-text-light hover:text-text-main"
                        }`}
                      >
                        {t("Map")}
                      </button>
                      <button
                        onClick={() => {
                          setViewMode('list');
                          setSelectedArtwork(null);
                          setShowDetail(false);
                        }}
                        className={`px-4 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold transition-all border-0 cursor-pointer ${
                          viewMode === 'list'
                            ? "bg-[#1a1a1a] text-accent-gold shadow-sm"
                            : "text-text-light hover:text-text-main"
                        }`}
                      >
                        {t("List")}
                      </button>
                    </div>
                  </div>

                  <FilterPills 
                    label="Category" 
                    options={['all', 'contemporanea', 'storica', 'monumento', 'hidden-art']} 
                    activeValue={activeCategory} 
                    onChange={setActiveCategory} 
                  />

                  <FilterPills 
                    label="Type" 
                    options={['all', 'sculture', 'murale', 'architettura', 'installazione-urbana']} 
                    activeValue={activeType} 
                    onChange={setActiveType} 
                  />

                  <FilterPills 
                    label="Neighborhood" 
                    options={['all', 'centro', 'quadrilatero', 'san-salvario', 'borgo-po', 'vanchiglia', 'campidoglio']} 
                    activeValue={activeNeighborhood} 
                    onChange={setActiveNeighborhood} 
                  />

                  <FilterPills 
                    label="Visibility" 
                    options={['all', 'iconico', 'poco-conosciuto', 'molto-nascosto']} 
                    activeValue={activeVisibility} 
                    onChange={setActiveVisibility} 
                  />
                </div>
              </div>

              {/* VIEW SECTION DESCENT */}
              <div className="flex-grow relative min-w-0 min-h-0 bg-bg-canvas">
                {viewMode === "map" ? (
                  <main className="w-full h-full relative min-w-0">
                    <Map
                      artworks={filteredArtworks}
                      selectedArtwork={activeArtwork || undefined}
                      selectionOffsetX={mapDetailOffsetX}
                      onArtworkSelect={handleSelectArtwork}
                      onMarkerClick={handleMarkerClick}
                      containerSizeChanged={showDetail}
                      showFilters={false}
                    />
                  </main>
                ) : (
                  <main className="w-full h-full relative min-w-0">
                    <ArtworkList
                      artworks={filteredArtworks}
                      onSelectArtwork={handleSelectArtwork}
                      onViewOnMap={(artwork) => {
                        setViewMode("map");
                        handleSelectArtwork(artwork);
                      }}
                      selectedArtworkId={selectedArtwork?.id}
                    />
                  </main>
                )}
              </div>
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
              selectedArtwork={activeArtwork || undefined}
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

          {currentPage === "account" && (
            <motion.div
              key="account"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col overflow-hidden"
            >
              <AccountPage
                onBack={() => navigateToPage("home")}
                onSelectArtwork={(artwork) => {
                  handleSelectArtwork(artwork);
                  setCurrentPage("explore");
                }}
              />
            </motion.div>
          )}

          {currentPage === "community" && (
            <motion.div
              key="community"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex overflow-hidden min-w-0 min-h-0"
            >
              <CommunityBoard
                onBack={() => navigateToPage("home")}
                onSelectArtworkById={(artworkId) => {
                  handleSelectArtworkById(artworkId);
                }}
                onNavigateToItineraries={() => {
                  navigateToPage("itineraries");
                }}
                onTriggerLogin={() => {
                  setAuthModalMode("login");
                  setShowAuthModal(true);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        {/* DETAIL DRAWER */}
        <AnimatePresence>
          {showDetail && selectedArtwork && (
            ((selectedArtwork) => {
              return (
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
      `${selectedArtwork.title} before`
    }
    afterAlt={
      selectedArtwork.after_image_alt ||
      `${selectedArtwork.title} today`
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

                    <div className="flex flex-wrap items-center gap-4 mb-4">
                     <h2 className={`font-serif italic leading-tight ${isItinerariesPage ? "text-3xl md:text-4xl" : "text-3xl md:text-5xl"} flex-grow min-w-[200px]`}>
                        {selectedArtwork.title}
                      </h2>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Like/Unlike Button */}
                        <button
                          onClick={() => handleToggleLike(selectedArtwork.id)}
                          className={`p-2.5 md:p-3 rounded-full border-2 transition-all shadow-sm shrink-0 flex items-center justify-center gap-1.5 cursor-pointer ${
                            likedArtworks.includes(selectedArtwork.id)
                              ? "bg-[#A41034] border-[#A41034] text-white hover:bg-[#A41034]/90"
                              : "bg-accent-gold/10 border-accent-gold/20 text-[#A41034] hover:bg-[#A41034]/10 hover:text-[#A41034]"
                          }`}
                          title={likedArtworks.includes(selectedArtwork.id) ? "Remove like" : "Like"}
                        >
                          <Heart size={21} fill={likedArtworks.includes(selectedArtwork.id) ? "currentColor" : "none"} />
                          <span className="text-xs font-bold leading-none select-none pr-0.5">
                            {likesMap[selectedArtwork.id] || 0}
                          </span>
                        </button>
                      </div>
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

                    {/* Status Toggle Buttons */}
                    <div className="flex flex-wrap items-center gap-3 mt-6">
                      <button
                        onClick={() => handleSetStatus(selectedArtwork.id, "to_visit")}
                        className={`text-[10px] uppercase tracking-widest font-black px-4 py-2 border rounded-full transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95 ${
                          userStatuses[selectedArtwork.id] === "to_visit"
                            ? "bg-accent-gold border-accent-gold text-sidebar-bg"
                            : "bg-white border-border-color text-text-light hover:border-accent-gold/50"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${userStatuses[selectedArtwork.id] === "to_visit" ? "bg-yellow-100 animate-pulse" : "bg-yellow-500"}`}></span>
                        To Visit
                      </button>

                      <button
                        onClick={() => handleSetStatus(selectedArtwork.id, "visited")}
                        className={`text-[10px] uppercase tracking-widest font-black px-4 py-2 border rounded-full transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95 ${
                          userStatuses[selectedArtwork.id] === "visited"
                            ? "bg-[#10B981] border-[#10B981] text-white"
                            : "bg-white border-border-color text-text-light hover:border-[#10B981]/50"
                        }`}
                      >
                        ✔ Visited
                      </button>
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
                    </section>                    {/* PARTICIPATORY ARCHIVE */}
                    <section className="pt-12 border-t border-border-color">
                      <h3 className="flex items-center gap-2 text-xs uppercase tracking-[3px] font-bold text-accent-gold mb-6">
                        <MessageSquare size={14} /> Model 3: Participatory Archive
                      </h3>

                      <div className="bg-white border border-border-color p-6 shadow-sm">
                        <p className="text-[11px] text-text-light mb-4 italic">
                          Contribute to the digital memory of this work. Leave a comment, note, or physical observation.
                        </p>

                        {user ? (
                          <form 
                            onSubmit={handleAddComment}
                            className="flex flex-col sm:flex-row gap-2"
                          >
                            <input
                              type="text"
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="Share your reflection..."
                              className="flex-grow text-xs p-3 border border-border-color focus:border-accent-gold outline-none"
                            />

                            <button
                              type="submit"
                              className="p-3 bg-sidebar-bg text-accent-gold hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center gap-2 cursor-pointer"
                              disabled={!noteText.trim()}
                            >
                              <Send size={16} />
                              <span className="sm:hidden uppercase tracking-widest text-[10px] font-bold">Send</span>
                            </button>
                          </form>
                        ) : (
                          <div className="bg-bg-canvas p-4 text-center border border-border-color/60 rounded">
                            <p className="text-xs text-text-light mb-3 font-medium">
                              Log in to write a comment in the Participatory Archive.
                            </p>
                            <button
                              onClick={() => {
                                setAuthModalMode("login");
                                setShowAuthModal(true);
                              }}
                              className="px-4 py-2 bg-sidebar-bg text-accent-gold hover:bg-black text-[10px] uppercase tracking-widest font-bold transition-all border border-accent-gold flex items-center gap-2 mx-auto cursor-pointer font-black"
                            >
                              Log in
                            </button>
                          </div>
                        )}

                        {artworkComments.length > 0 && (
                          <div className="mt-6 space-y-4">
                            <p className="text-[10px] uppercase tracking-[2px] font-bold text-text-main/40 border-b border-border-color pb-1">
                              User Comments
                            </p>

                            <div className="space-y-3 max-h-[350px] overflow-y-auto sidebar-scroll pr-1">
                              {artworkComments.map((comment) => (
                                <div
                                  key={comment.id}
                                  className="bg-bg-canvas relative border-l-2 border-accent-gold/60 p-4 transition-all hover:bg-bg-canvas/80 group"
                                >
                                  <div className="flex justify-between items-start gap-4">
                                    <div>
                                      <p className="text-xs font-black text-sidebar-bg">
                                        {comment.profiles?.first_name 
                                          ? `${comment.profiles.first_name} ${comment.profiles.last_name || ""}` 
                                          : "Contributor"}
                                      </p>
                                      
                                      <p className="text-xs text-text-main leading-relaxed mt-1 whitespace-pre-wrap break-words">
                                        {comment.body}
                                      </p>
                                    </div>

                                    {user && comment.user_id === user.id && (
                                      <button
                                        onClick={() => handleDeleteComment(comment.id)}
                                        className="text-text-light hover:text-red-600 transition-colors cursor-pointer block p-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        title="Delete comment"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </div>

                                  <p className="mt-2 text-[8px] uppercase tracking-widest text-text-light/50">
                                    {new Date(comment.created_at).toLocaleString("en-US")}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </motion.div>
              );
            })(translateArtwork(selectedArtwork))
          )}
        </AnimatePresence>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}